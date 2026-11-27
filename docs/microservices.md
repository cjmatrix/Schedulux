# Microservices Architecture & Monorepo Topology

Schedulux is built as a **polyglot pnpm + Turborepo monorepo** combining TypeScript/NestJS services with Python 3.12 AsyncIO AI/worker runtimes. Internal synchronous RPC runs over **gRPC (HTTP/2 Protobuf)** via Kubernetes Headless Services (`round_robin`), while mutations, billing ledgers, crawling, and notifications stream asynchronously across **Apache Kafka** and **AWS SQS** (+ Lambda workers).

---

## 1. End-to-End Service & Messaging Mesh

```mermaid
flowchart TB
    subgraph Edge["Client & Edge Layer"]
        Dashboard["React 19 Dashboard\n(app.schedulux.xyz)"]
        Widget["@repo/widget (widget.js)\nEmbedded Client Sites"]
    end

    subgraph Gateways["Dual API Gateways (NestJS + @repo/circuit-breaker)"]
        APIGW["api-gateway (:5000)\napi.schedulux.xyz\nAuth / RBAC / Admin / SSE"]
        CustGW["customer-api-gateway (:5001)\nclient-api.schedulux.xyz\nCORS Guard / Tier Throttler / SSE"]
    end

    subgraph Mesh["Core gRPC Microservices (Headless Services + round_robin)"]
        Identity["identity-tenant (:50051)\ntenant, dashboard, superadmin protos"]
        AI["ai-orchestration (:50052)\nknowledge proto + FastMCP + Workers"]
        Sched["scheduling-inventory (:50053)\nscheduling proto + Redis Locks"]
    end

    subgraph Bus["Event Streaming & Async Queues"]
        Kafka["Apache Kafka\n• scheduling.domain.events\n• scheduling.booking.events\n• billing.tokens.consumed"]
        SQS["AWS SQS (+14d DLQs)\n• knowledge-crawl & schema-generation\n• knowledge-document-indexing & status\n• agent-memory-queue\n• email-queue (lambda_email) & sms-queue (lambda_sms)"]
    end

    subgraph Workers["Background Workers"]
        PyWorker["python-worker (Python 3.12)\nCrawler / Schema Gen / PDF Indexer"]
        KafkaWorker["kafka-consumer (Node.js)\nBooking SMS Bridge & Token Ledger"]
    end

    subgraph Stores["Data & Vector Persistence"]
        Mongo[("MongoDB")]
        Redis[("Redis")]
        Qdrant[("Qdrant")]
        OS[("OpenSearch")]
        S3[("AWS S3")]
    end

    Dashboard -->|"HTTPS REST / SSE"| APIGW
    Widget -->|"HTTPS REST / SSE"| CustGW

    APIGW -->|"gRPC"| Identity
    APIGW -->|"gRPC"| AI
    APIGW -->|"gRPC"| Sched
    CustGW -->|"gRPC"| AI
    AI -->|"FastMCP over gRPC"| Sched

    Sched -->|"Outbox -> Kafka"| Kafka
    AI -->|"Token Usage -> Kafka"| Kafka
    Kafka -->|"scheduling.domain.events"| AI
    Kafka --> KafkaWorker

    AI --> SQS
    Identity -->|"Emails"| SQS
    KafkaWorker -->|"SMS OTP / Alerts"| SQS
    KafkaWorker -->|"Bulk token-ledger"| OS

    SQS --> PyWorker
    PyWorker -->|"S3 PDFs & Qdrant Upsert"| S3
    PyWorker --> Qdrant
    PyWorker -.->|"Status Updates"| SQS

    Identity --> Mongo
    Identity --> Redis
    Identity -->|"Usage Queries"| OS
    Sched --> Mongo
    Sched --> Redis
    AI --> Mongo
    AI --> Redis
    AI --> Qdrant
```

---

## 2. Service-by-Service Architecture

### Dual API Gateways (BFF Isolation)
Splitting tenant administration from public customer widget traffic prevents chat spikes from degrading dashboard controls and enforces tailored rate-limit and CORS policies.

- **`api-gateway` (`apps/api-gateway`, port `:5000`, `api.schedulux.xyz`)**
  - Serves the React 19 SaaS dashboard across 6 controller domains (`tenant`, `dashboarduser`, `billing`, `scheduling`, `agentOrchestrator`, `superadmin`).
  - Enforces `TenantAuthGuard`, `RolesGuard`, `PaddleWebhookGuard`, `CrawlQuotaGuard`, `TenantTokenQuotaGuard`, and global Redis-backed `@nestjs/throttler` (`short`: 30 req/1s, `default`: 100 req/60s, `long`: 1000 req/900s).
  - Registers all 5 gRPC packages (`TENANT_PACKAGE`, `DASHBOARD_PACKAGE`, `SUPERADMIN_PACKAGE`, `KNOWLEDGE_PACKAGE`, `SCHEDULING_PACKAGE`).
- **`customer-api-gateway` (`apps/customer-api-gateway`, port `:5001`, `client-api.schedulux.xyz`)**
  - Dedicated public chat ingress for `@repo/widget` (`CustomerChatController` REST + SSE).
  - Applies `CorsOriginGuard` (validating origin against tenant `whitelisted_domains`), `CustomerThrottlerGuard` (dynamic per-tenant RPM fetched from Redis via `getTierRateLimit`), and `TenantTokenQuotaGuard`.

### Core Domain & AI Microservices

- **`identity-tenant` (`apps/identity-tenant`, gRPC `:50051`)**
  - Owns authentication (JWT + Google OAuth), workspace RBAC, superadmin operations, Paddle billing webhooks, subscription tier quotas (`TierConfigRepository`), and `OpenSearchAnalyticsService` (reads aggregated token usage from `token-ledger`).
  - Dispatches transactional emails via `SqsEmailProducer` (`AWS_SQS_EMAIL_QUEUE_URL`).
- **`scheduling-inventory` (`apps/scheduling-inventory`, gRPC `:50053`)**
  - Owns services, staff/equipment resources, weekly shifts, deterministic slot availability, and transactional booking mutations (`BookingModule`, `InventoryModule`, `ScheduleModule`, `ServiceModule`, `ResourceModule`).
  - Uses **Redis atomic slot holds/locks** and pure-write transactions paired with a **Transactional Outbox** (`outbox-recovery.service.ts`) publishing to Kafka topics `scheduling.domain.events` and `scheduling.booking.events`.
- **`ai-orchestration` (`apps/AI-orchestration`, gRPC `:50052`)**
  - Single AsyncIO supervisor (`main.py`) running five concurrent loops:
    1. **gRPC Server (`serve()`):** Hosts `knowledge.proto` RPCs (Tenant Onboarding Agent, Customer Agent, Document URLs, Crawling, Chat History).
    2. **Kafka `SchedulingConsumer`:** Consumes `scheduling.domain.events` to keep `AgentRuntimeConfig`, `AgentDraft`, and Redis `biz_context` caches synchronized with inventory edits.
    3. **SQS `run_memory_worker`:** Summarizes long tenant onboarding transcripts (`agent-memory-queue`) and writes permanent facts to Qdrant (`agent_semantic_memory`).
    4. **SQS `DocumentStatusConsumer`:** Consumes `knowledge-document-status-queue` (`SqsEventSubscriber`) and updates MongoDB `KnowledgeDocument` statuses (`indexing` / `indexed` / `failed`).
    5. **Outbox Recovery (`run_outbox_recovery_loop`):** Reliably retries unsent token/event outbox records every 10 seconds.

### Asynchronous Workers

- **`python-worker` (`apps/python-worker/worker.py`)**
  - Long-polls AWS SQS queues (`WaitTimeSeconds=20`, DLQ redrive via Terraform) with W3C `traceparent` extraction:
    - `knowledge-crawl-queue` (+ DLQ) → `process_crawl_job` (`crawler.py`)
    - `schema-generation-queue` (+ DLQ, with Redis Claim Check for large crawl payloads) → `process_schema_generation` (`schema_generator.py`)
    - `knowledge-document-indexing-queue` (+ DLQ) → `process_document_indexing` (`document_indexer.py`)
- **`kafka-consumer` (`apps/kafka-consumer/src/index.ts`)**
  - Runs two independent KafkaJS consumers:
    - **`bookingEventsConsumer` (`scheduling.booking.events`):** Validates and forwards SMS OTP / booking confirmation notifications to **AWS SQS** (`AWS_SQS_SMS_QUEUE_URL` → `lambda_sms` / Twilio) with OTel trace context attributes.
    - **`tokenLedgerConsumer` (`billing.tokens.consumed`):** Bulk-indexes `customer_agent` and `tenant_agent` token consumption events into the **OpenSearch `token-ledger`** index (`_id: doc.event_id` for idempotent writes).

---

## 3. Shared Monorepo Packages (`packages/`)

| Package | Purpose | Key Details |
| :--- | :--- | :--- |
| **`@repo/proto`** | Single source of truth for gRPC contracts | `tenant.proto`, `dashboard.proto`, `superadmin.proto`, `knowledge.proto`, `scheduling.proto` compiled for TS (`ts-proto`) and Python (`grpc_tools.protoc`) |
| **`@repo/circuit-breaker`** | Downstream gRPC resilience (Opossum) | Adaptive timeouts (`45s` LLM stream, `25s` chat/onboarding/crawl, `5s` default); skips tripping on HTTP `4xx` and gRPC validation codes (`3, 5, 6, 7, 8, 9, 16`) |
| **`@repo/widget`** | Embeddable zero-code chat widget | Preact + TanStack Query compiled via Vite into `widget.js` and deployed to S3 + CloudFront alongside `apps/frontend-react` |

---

## 4. Internal gRPC Load Balancing (`Headless` + `round_robin`)

Standard Kubernetes `ClusterIP` Services load-balance at the L4 TCP connection level, which pins long-lived HTTP/2 gRPC connections to a single pod when HPA scales replicas out.

To solve this, `identity-tenant`, `ai-orchestration`, and `scheduling-inventory` define **Headless Services (`clusterIP: None`)** alongside `ClusterIP` Services in `k8s/base/`. Both `api-gateway` and `customer-api-gateway` configure gRPC clients with:

```json
{ "loadBalancingConfig": [{ "round_robin": {} }] }
```

DNS resolution against `<service>-headless.schedulux.svc.cluster.local:<port>` returns all pod A-records, allowing the gRPC client to distribute RPC calls across every active replica cleanly.
