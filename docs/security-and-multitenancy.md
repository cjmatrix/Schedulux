# Security, Multi-Tenancy & Compliance

Schedulux enforces strict tenant data isolation across every layer of the stack — from API gateways to vector databases. This document maps every isolation boundary and security mechanism.

---

## Multi-Tenant Isolation Matrix

| Layer | Isolation Mechanism | Key Pattern |
|:---|:---|:---|
| **API Gateway (Tenant)** | JWT extraction → `req.tenant.tenant_id` | Never trust `tenant_id` from request body on authenticated routes |
| **API Gateway (Customer)** | HMAC-signed session JWT (`HS256`) with embedded `tid`, `aid` | `CustomerSessionGuard` overrides body `tenant_id` from verified claims |
| **Domain CORS** | `CorsOriginGuard` per-agent `whitelisted_domains` | Redis cache (300s TTL) → gRPC fallback; rejects unauthorized origins |
| **MongoDB** | `tenant_id` mandatory filter on every repository method | Compound indexes include `tenant_id`; unique constraints scoped per tenant |
| **Redis** | Namespaced keys: `tenant:{id}:*`, `sched:hold:{tenantId}:*`, `session:{id}:auth`, `otp:{phone}` | TTL-based auto-cleanup |
| **Qdrant** | `Filter(must=[tenant_id, agent_id])` on every query | Keyword indexes on `tenant_id` and `agent_id` metadata fields |
| **S3** | Tenant-prefixed key paths for knowledge documents | Presigned URLs with tenant path validation |
| **Kafka** | `tenant_id` in event payloads, W3C `traceparent` propagation | Consumer handlers extract and validate tenant context |
| **Doppler** | Per-service `DopplerSecret` CRDs (8 isolated secrets) | Zero committed credentials in repo |

---

## Authentication & Authorization

### Tenant Auth Flow

1. **Registration:** Email + password (bcrypt cost 12) → Redis email verification token (`tenant_verificationToken:{token}`, 1h TTL)
2. **Login:** Issues 15min access JWT + 7-day refresh JWT (stored in Redis `tenant_refresh_token:{tenantId}:{tokenId}`)
3. **Google OAuth:** `OAuth2Client.verifyIdToken` → auto-provision `starter` tier tenant
4. **Refresh Token Rotation:** Each refresh embeds a `token_id`; presenting a reused/mismatched token **revokes the entire session** (theft detection)
5. **Cookies:** `httpOnly`, separate cookies for tenant (`tenant_access_token`) vs. workspace manager (`dashboard_access_token`)

### Workspace RBAC

| Role | Scope | Capabilities |
|:---|:---|:---|
| `tenant_owner` | Full tenant | All operations, all agents |
| `manager` | Assigned agents only | Filtered by `agent_ids[]`, scoped dashboard data |
| `super_admin` | Platform-wide | Separate JWT secret, tenant management, analytics |

### Customer Session Auth (Widget)

- **No account required** — anonymous sessions with HMAC-signed tokens
- Session JWT (`sess_{uuid}`) with 7-day TTL, containing `sid`, `tid` (tenant), `aid` (agent)
- `sandbox_` session IDs explicitly rejected on the production gateway
- OTP verification upgrades session to 24h verified state (`session:{session_id}:auth` in Redis)

---

## OTP Phone Verification

Multi-layer OTP flow for booking security:

| Parameter | Value |
|:---|:---|
| OTP length | 6 digits |
| TTL | 5 minutes |
| Max attempts | 5 (then key deleted) |
| Session auth TTL | 24 hours after verification |
| Delivery | Twilio SMS via SQS + Lambda |
| Redis key | `otp:{phone}` |

### Per-Service OTP Policy

Each service can independently require OTP via `services[].verification.require_otp`. The global policy (`guardrails.verification_policy.require_otp_for_new_booking`) applies when the service doesn't override.

### Atomic OTP Verification in Booking Tools

The booking MCP tools support **atomic 1-step verification**: `book_appointment`, `cancel_appointment`, and `reschedule_appointment` accept an optional `otp_code` parameter, verifying OTP and executing the action in a single call — saving an extra LLM step.

---

## Rate Limiting

### Tenant Gateway (`api-gateway`)

| Tier | Window | Requests |
|:---|:---|:---|
| Short burst | 1s | 30 |
| Default | 60s | 100 |
| Long term | 15min | 1000 |

Tracked by `tenant:{tenantId}` (from JWT) falling back to client IP. Uses atomic Redis Lua script (`INCR` + `PEXPIRE` + `PTTL`). **Fails open** if Redis is down.

### Customer Gateway (`customer-api-gateway`)

| Tier | Window | Per-Tenant RPM |
|:---|:---|:---|
| `starter` | 60s | 60 |
| `pro` | 60s | 120 |
| `business` | 60s | 300 |
| `enterprise` | 60s | 1000 |

Dynamic per-tenant rate limits resolved from `tenant:{id}:tier` → `tier_config:{tier}.rate_limit_rpm`. Completely independent rate limit buckets from the tenant gateway.

---

## Token Quota Enforcement

Weekly AI token budgets per subscription tier:

1. **Pre-flight check:** `TenantTokenQuotaGuard` reads `tenant:{id}:tokens:{isoWeek}` vs `tier_config.weekly_token_limit`
2. **Post-execution tracking:** `TokenTrackingService` increments Redis counter via `INCRBY` and writes to `OutboxEvent` → Kafka `billing.tokens.consumed`
3. **OpenSearch ledger:** `kafka-consumer` indexes token events into OpenSearch `token-ledger` for SuperAdmin analytics
4. **Quota verified flag:** `x-quota-verified: true` in gRPC metadata prevents duplicate checks downstream

---

## Domain CORS Guard (`CorsOriginGuard`)

The customer gateway enforces per-agent domain whitelisting:

1. **Always allowed:** `localhost`, `127.0.0.1`, `::1`, `FRONTEND_URL`
2. **Per-agent whitelist:** Fetched from Redis (`agent:{tenantId}:{agentId}:whitelist`, 300s TTL) → gRPC `getWidgetConfig` fallback
3. **Supported patterns:** Exact hostnames, wildcard subdomains (`*.example.com`), `*` (allow all), empty (open)
4. **Rejection:** `ForbiddenException` for unauthorized origins

---

## Safety Guardrails



### Emergency Triage

When `guardrails.triage_emergency.enabled = true`:
- **Deterministic keyword matching** (zero LLM tokens, <1ms) against `triage_emergency.keywords[]`
- Returns `response_override` immediately (e.g., "If this is a medical emergency, please call 911")
- Processed in the Supervisor's pre-LLM guardrail layer

### Human Handoff

When `guardrails.human_handoff.enabled = true`:
- `trigger_topics[]` define escalation triggers (e.g., "complaint", "refund", "legal")
- Routes to `handoff_agent` which returns `handoff_message` + `reception_contact`
- **Zero LLM calls** — entirely deterministic

---

## Infrastructure Security

### Secrets Management

- **Doppler Kubernetes Operator:** 8 isolated `DopplerSecret` CRDs sync per-service secrets into K8s Secrets
- **Zero committed credentials:** `.env.example` documents required variables; actual values never in repo
- **Paddle webhook HMAC:** `crypto.timingSafeEqual` verification of `Paddle-Signature` header

### Network Isolation

- **Dual gateway deployment:** Separate pods, HPAs, Traefik IngressRoutes
- **Internal gRPC:** Kubernetes Headless Services with `round_robin` client-side load balancing — not exposed externally
- **TLS:** Let's Encrypt via Traefik ACME challenge on `api.schedulux.xyz` and `client-api.schedulux.xyz`

### Container Security

- **Non-root containers:** All Dockerfiles run as dedicated non-root users (`nestjs`, `appuser`)
- **Multi-stage builds:** Minimal production images with only runtime dependencies
- **S3 OAC:** CloudFront Origin Access Control for private bucket access

---

## Related Documentation

- **[Infrastructure](./infrastructure.md)** — Terraform, K3s, Doppler, TLS configuration
- **[Microservices](./microservices.md)** — Dual-gateway architecture
- **[Customer Agent](./customer-agent.md)** — OTP flow, guardrails in action
- **[Agent Schema Reference](./agent-schema-reference.md)** — Guardrails and compliance fields
