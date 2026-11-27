# Deterministic Scheduling Engine (`scheduling-inventory`)

The scheduling engine is Schedulux's core transactional backend — a NestJS gRPC microservice that handles services, resources, shifts, availability computation, slot holds, and atomic booking creation with deterministic double-booking prevention.

---

## Architecture

Built with **Clean Architecture** layers:

```
Presentation (gRPC Controller)
    └── Application (Use Cases + Services)
        └── Domain (Entities + Value Objects + Repository Interfaces)
            └── Infrastructure (MongoDB Repositories + Redis Cache + Kafka Producer)
```

**Transport:** gRPC only (port `50053`) — no REST endpoints. Consumed by `api-gateway` and `customer-api-gateway` via `@repo/proto/scheduling.proto`.

---

## Dual Booking Modes

| Mode | Use Case | How It Works |
|:---|:---|:---|
| `time_slot` | Intraday appointments (dental visit, haircut, consultation) | Duration + `buffer_minutes` → `effective_end_time`, slots computed from shift windows |
| `date_range` | Multi-day stays (hotel room, equipment rental, vacation property) | Check-in/check-out dates, turnover periods between stays |

The booking mode is set per-service (overriding the tenant default), enabling mixed-mode businesses (e.g., a hotel with spa appointments).

---

## Resource Allocation (`BookingAllocationService`)

### Resource Types

Supports 7 resource types: `staff`, `room`, `chair`, `bay`, `equipment`, `asset`, `vehicle`.

### Selection Modes

Each service defines `resource_requirements[]` with:

| Mode | Behavior |
|:---|:---|
| `user_selectable` | Customer chooses a specific resource (e.g., "I want Dr. Smith") |
| `auto_assign` | System assigns the first available eligible resource |

### Allocation Algorithm (`allocateResourcesForSlot`)

1. **Blackout Check:** `isDateBlackout(date, blackout_dates)` — immediately rejects if the date is a blackout
2. **Resource Resolution:** Bulk-fetch active bookable resources matching `eligible_resource_ids` and `resource_type`
3. **Busy Resources:** `findBusyResourceIds` — single query for overlapping bookings (`start_time < end && effective_end_time > start`, excluding `cancelled`/`no_show`)
4. **Active Holds:** `getActiveHolds` — scan Redis for provisional holds by other sessions
5. **Shift Evaluation:** `isResourceOnShift` — evaluates `custom_shift_overrides` (falling back to global `operating_hours`) with break window exclusion
6. **Selection:** Finds resources that are on-shift, not busy, and not held by other sessions

All steps use **bulk fetching** — one database query per step, results indexed into `Map<string, T>` for in-memory evaluation.

---

## Three-Layer Double-Booking Prevention

### Layer 1: Redis Atomic Slot Holds

When a customer selects a time slot, the AI orchestrator acquires a Redis hold:

```
Key:    sched:hold:{tenantId}:{agentId}:{resourceId}:{startTime}
Value:  {hold_token, session_id, created_at}
TTL:    hold_duration_minutes (default 10 min)
```

- Acquired via **atomic Lua script** (`_ACQUIRE_HOLDS_LUA`) that checks-and-sets multiple resource holds simultaneously (e.g., room + staff for a dental procedure)
- Released via **atomic Lua script** (`_RELEASE_HOLDS_LUA`) on booking completion or timeout
- The `hold_token` must be presented when confirming the booking — only the holder can convert to a confirmed booking

### Layer 2: Availability Engine Exclusion

The availability engine (`GetAvailabilityUseCase`) explicitly excludes held slots:

1. Bulk-fetches all active holds via Redis `scanStream` + `mget`
2. Treats slots held by **other** sessions as unavailable
3. Slots held by the **current** session are shown as "held by you"

### Layer 3: MongoDB Unique Compound Index

Final safety net — a unique compound index on `bookings`:

```
{ tenant_id: 1, agent_id: 1, resource_id: 1, start_time: 1 }
```

If two requests somehow pass both Redis holds and availability checks, the duplicate insert throws a `WriteConflict` / unique constraint error — caught and returned as HTTP `409 Conflict`.

---

## Pure-Write Transactions

All booking mutations follow the **pure-write transaction** pattern:

### Pre-Transaction Phase (All Reads)

```typescript
// Phase 1: Independent root lookups (concurrent)
const [service, customer, tenantSchedule] = await Promise.all([
  getCachedService(tenantId, serviceId),     // Redis cache (300s TTL)
  customerRepo.findByPhone(tenantId, phone), // MongoDB
  scheduleRepo.findByTenant(tenantId),       // MongoDB
]);

// Phase 2: Dependent lookups (concurrent)
const [allocation, existingCustomer] = await Promise.all([
  bookingAllocation.allocateResourcesForSlot(...),
  customer ? customer : customerRepo.findByEmail(tenantId, email),
]);

// All validations (lead time, advance days, cancellation window, tier quotas)
validateBookingRules(service, tenantSchedule, requestedSlot);
```

### Transaction Phase (Writes Only)

```typescript
await unitOfWork.withTransaction(async () => {
  // 1. Create or update customer
  const savedCustomer = isExistingCustomer
    ? existingCustomer
    : await customerRepo.create({ tenantId, name, phone, email });

  // 2. Create booking
  const booking = await bookingRepo.create({
    tenantId, agentId, serviceId, resourceId,
    startTime, effectiveEndTime, customerId: savedCustomer._id,
    holdToken, status: 'confirmed',
  });

  // 3. Write outbox event
  await outboxRepo.create({
    type: 'booking.created',
    payload: booking,
    status: 'PENDING',
  });
});
```

**Result:** Transaction lock time < 10ms. Zero risk of deadlocks under concurrent traffic.

---

## Transactional Outbox & Recovery

### Non-Blocking Event Dispatch

After the transaction commits, events are dispatched fire-and-forget:

```typescript
void this.schedulingEventsProducer
  .publishOutboxEvent(outboxDoc)
  .catch((err) => {
    logger.error('Immediate dispatch failed, relay will retry:', err);
  });
```

The client gets an instant response. The outbox guarantees delivery.

### Recovery Loop (`OutboxRecoveryService`)

Polls every 10 seconds for `PENDING` events older than 5 seconds (limit 50):

1. Attempts Kafka emission with W3C `traceparent`/`trace_id` headers
2. On success: marks `PUBLISHED` with `published_at` timestamp (7-day TTL index for cleanup)
3. On failure: logs error, retries next cycle

### Kafka Topics

| Topic | Events | Consumer |
|:---|:---|:---|
| `scheduling.booking.events` | `booking.created`, `booking.cancelled`, `booking.rescheduled`, `booking.completed` | `kafka-consumer` → SQS SMS notifications |
| `scheduling.domain.events` | `service.*`, `resource.*`, `schedule.*` | `ai-orchestration` → config sync & cache invalidation |

---

## Availability Engine (`GetAvailabilityUseCase`)

### Defensive Clamping

| Constraint | Limit | Purpose |
|:---|:---|:---|
| Max date range | 31 days | Prevents memory bloat |
| Max advance booking | 60 days (configurable) | Business policy |
| Max resources per query | 50 | DoS prevention |

### Computation Flow

1. **Clamp** date range to `MAX_DAYS_LIMIT` and `max_advance_booking_days`
2. **Bulk query 1:** `findActiveBookableByIds` — all eligible resources
3. **Bulk query 2:** `findActiveBookingsInRange` — all bookings in the date range
4. **Bulk query 3:** `getActiveHolds` — all Redis holds in the range
5. **In-memory computation:**
   - For each day in range: check blackout dates
   - For each resource: evaluate shift coverage (custom overrides → global hours → breaks)
   - For each slot: check if resource is busy (`getBusyResourceIdsInMemory` using `Map<string, Booking[]>`) or held
   - Return available slots with resource assignment

**Result:** 3 database/Redis queries total, regardless of date range or resource count.

---

## Batch Inventory Sync (`BatchSyncInventoryUseCase`)

Called by `ai-orchestration` during agent publishing to atomically sync the entire config:

1. **Tier validation:** Enforces `max_resources` and `max_services` from `tier_config`
2. **Bulk upsert:** Resources and services upserted with soft-delete reconciliation
3. **Schedule sync:** `TenantSchedule` upserted with `operating_hours`, `blackout_dates`, `scheduling_engine`, `verification_policy`
4. **Cache invalidation:** `sched:service:*` Redis cache cleared

The gRPC metadata carries `x-tenant-tier` for quota enforcement.

---

## Related Documentation

- **[Agent Builder Studio](./agent-builder-studio.md)** — How the config is built and published
- **[Agent Schema Reference](./agent-schema-reference.md)** — The `AgentRuntimeConfig` that syncs with this engine
- **[Customer Agent](./customer-agent.md)** — Booking agent that calls this engine via MCP tools
- **[Microservices Architecture](./microservices.md)** — Where this service fits in the topology
