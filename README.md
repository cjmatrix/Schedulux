<div align="center">

# ⚡ Schedulux

### AI Booking Agent Builder — From URL to Live Agent in Minutes

[![Live App](https://img.shields.io/badge/Live%20App-app.schedulux.xyz-0F172A?style=for-the-badge&logo=vercel&logoColor=white)](https://app.schedulux.xyz)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![gRPC](https://img.shields.io/badge/gRPC-Protobuf-244C5A?style=for-the-badge&logo=grpc&logoColor=white)](https://grpc.io/)
[![Kafka](https://img.shields.io/badge/Kafka-Event%20Driven-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Kubernetes K3s](https://img.shields.io/badge/K3s-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://k3s.io/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Grafana%20%26%20OpenSearch-F46800?style=for-the-badge&logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)

**A multi-tenant platform where business owners paste a URL or describe their business — and an AI agent builds, configures, and deploys a production-ready booking & customer support agent for them.**

No forms. No code. Just conversation.

[🌐 Website](https://schedulux.xyz) · [🚀 Dashboard](https://app.schedulux.xyz) · [📐 Architecture](#architecture-overview)

</div>

---

## Table of Contents

- [Why Schedulux Exists](#why-schedulux-exists)
- [How It Works — 4 Steps to a Live Booking Agent](#how-it-works--4-steps-to-a-live-booking-agent)
- [Why This Is More Powerful Than Traditional AI Agents](#why-this-is-more-powerful-than-traditional-ai-agents)
- [Architecture Overview](#architecture-overview)
- [Core Engineering Highlights](#core-engineering-highlights)
- [Dual Multi-Agent Architecture](#dual-multi-agent-architecture)
- [The Agent Runtime Config — A Declarative Agent Specification](#the-agent-runtime-config--a-declarative-agent-specification)
- [Hybrid RAG Pipeline & Evaluation](#hybrid-rag-pipeline--evaluation)
- [Microservices & Monorepo Map](#microservices--monorepo-map)
- [Distributed Observability Pipeline](#distributed-observability-pipeline-traces-metrics--logs)
- [Cloud Infrastructure & Zero-Secret GitOps](#cloud-infrastructure--zero-secret-gitops)
- [Load Testing & Performance Benchmarks](#load-testing--performance-benchmarks)
- [Key Engineering Decisions & Trade-Offs](#key-engineering-decisions--trade-offs)
- [Quick Start](#quick-start)
- [Documentation Index](#documentation-index)

---

## Why Schedulux Exists

Traditional booking solutions force businesses through rigid form builders and static FAQ bots. When an AI chatbot is involved, it's usually a wrapper around a prompt template — unable to actually *book*, *hold slots*, *verify identity*, or *enforce real business rules*.

**Schedulux eliminates that entire gap.** It's an **AI Agent Builder Platform** where:

1. An **AI Architect Agent** *builds* the booking agent by analyzing the business's website or conversing with the owner
2. The generated agent isn't a static chatbot — it's a **multi-agent system** backed by a real scheduling engine with Redis slot locks, OTP phone verification, and deterministic double-booking prevention
3. Everything deploys with a single `<script>` tag

The result: a dentist, salon owner, auto shop, or hotel can go from zero to a live, domain-aware, transactional booking agent embedded on their website — in minutes, not weeks.

---

## How It Works — 4 Steps to a Live Booking Agent

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. DESCRIBE      │    │  2. REFINE        │    │  3. TEST          │    │  4. DEPLOY        │
│                   │    │                   │    │                   │    │                   │
│  Paste a URL or   │───▶│  Conversational   │───▶│  Live Sandbox     │───▶│  One-line embed   │
│  pick a vertical  │    │  AI Canvas with   │    │  with real slot   │    │  <script> tag on  │
│  template         │    │  diff-tracking &  │    │  holds, OTP, and  │    │  any website      │
│                   │    │  visual cards     │    │  RAG responses    │    │                   │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

**Step 1 — Crawl & Synthesize:** Paste a website URL → Crawl4AI + Playwright extracts relevant pages → LLM synthesizes a complete agent config (services, staff, hours, policies) with zero-hallucination validation and `inferred_fields` audit trail.

**Step 2 — Conversational Builder Studio:** A split-pane AI canvas shows visual cards (services, resources, shifts, guardrails) on one side and an AI Architect chat on the other. Every change is tracked as RFC 6902 JSON patches in a live `DiffDrawer`. The agent maintains 20-checkpoint time-travel history.

**Step 3 — Live Sandbox:** Test the unpublished agent in a full sandbox environment — with real Qdrant RAG retrieval, slot holds, OTP flows, and deterministic booking cards — before going live. Desktop and mobile frame previews available.

**Step 4 — One-Line Deploy:** Publish triggers `BatchSyncInventory` via gRPC, atomically syncing the entire config to the scheduling engine. Embed with `<script src="widget.js" data-tenant-id="..." defer>` or use the hosted booking link.

---

## Why This Is More Powerful Than Traditional AI Agents

| Capability | Traditional Chatbots / Agent Builders | Schedulux |
|:---|:---|:---|
| **Configuration** | Static forms, prompt templates, manual tool wiring | AI agent *builds* the agent through conversation; zero forms |
| **Booking Capability** | Link to Calendly / external tool, or mock confirmation | Real transactional engine: Redis slot holds → OTP phone verify → atomic MongoDB booking → Kafka event |
| **Domain Awareness** | Generic Q&A prompt | Crawls the business website, indexes PDFs into hybrid RAG (Voyage dense + BM25 sparse + reranking), enforces tenant-isolated Qdrant collections |
| **Multi-Intent Handling** | Single-turn, single-intent | Supervisor parallel fan-out: "What's your cancellation policy *and* do you have availability Friday?" → FAQ + Booking agents run simultaneously → Synthesizer merges |
| **Latency** | Full LLM round-trip for every response | <1ms deterministic guardrails, <5ms fast-path booking confirmations, OTP numeric fast-path (zero LLM tokens) |
| **Deployment** | Dashboard iframe or API integration | Single `<script>` tag with OKLCH-perceptual theming, WCAG AA contrast, Shadow DOM isolation |
| **Reliability** | Single LLM, no fallback | Gemini → Groq automatic failover, circuit breakers on all gRPC calls, transactional outbox with recovery loop |
| **Multi-Tenancy** | Per-deployment or shared DB | Strict isolation across MongoDB, Redis, Qdrant, S3, JWT, CORS origin guard — per tenant, per agent |
| **Day-2 Operations** | Rebuild from scratch | Bidirectional sync: Dashboard edits → Kafka events → AI config auto-updated; AI edits → gRPC → scheduling engine |

---

## Architecture Overview

![Schedulux System Architecture](./docs/assets/architecture.png)

**8 services** across a polyglot pnpm + Turborepo monorepo (TypeScript/NestJS + Python 3.12), communicating over gRPC (synchronous) and Kafka/SQS (asynchronous), deployed on K3s with Terraform-provisioned AWS infrastructure.

---

## Core Engineering Highlights

### Deterministic Concurrency & Double-Booking Prevention
Three-layer defense against concurrent booking races:
1. **Redis Atomic Lua Script Slot Holds** — Multi-resource distributed locks (`hold:{tenant}:{resource}:{slot}`) with TTL and unique hold tokens
2. **In-Memory Availability Exclusion** — Availability engine bulk-fetches bookings + holds in one query, computes slots in RAM using `Map<string, Booking[]>`
3. **MongoDB Unique Compound Index** — Final safety net (`tenant_id` + `resource_id` + `slot_start`)

All booking writes happen in **pure-write MongoDB transactions** (zero reads inside transaction, <10ms lock time).

### Dual-Gateway Traffic Isolation
Completely separate Kubernetes deployments, pods, HPAs, and Traefik IngressRoutes:
- **`api.schedulux.xyz`** → `api-gateway` — Authenticated tenant dashboard (JWT + RBAC + per-tier rate limits)
- **`client-api.schedulux.xyz`** → `customer-api-gateway` — Public widget traffic (domain CORS guard + per-IP rate limits + circuit breakers)

A DDoS on the public widget API cannot impact tenant dashboard operations.

### Strict Multi-Tenant Data & RAG Isolation
`tenant_id` boundaries enforced across every layer:
- MongoDB schemas (mandatory filter on every repository method)
- Redis key namespaces (`otp:{phone}`, `session:{id}:auth`, `sched:hold:...`, `biz_context:{tenant}:{agent}`)
- Qdrant metadata filters (`tenant_id` + `agent_id` on every hybrid search)
- S3 key prefixes (tenant-scoped document storage)
- Paddle subscription tier quotas (agents, services, resources, KB docs, weekly tokens, RPM)

### Non-Blocking Event Architecture
- **Kafka** for domain events (booking lifecycle, config publishing, billing tokens, cache invalidation)
- **AWS SQS + Lambda** for async notifications (Brevo email, Twilio SMS/OTP) and worker jobs (crawling, indexing, memory consolidation)
- **Transactional Outbox** with 10s recovery loop — events committed in the same MongoDB transaction, dispatched fire-and-forget with relay backstop
- **Gemini → Groq automatic LLM failover** with exponential backoff

---

## Dual Multi-Agent Architecture

Schedulux runs two distinct LangGraph multi-agent systems — one that *builds* agents, one that *is* the agent:

### 1. Tenant Onboarding & Agent Builder (`tenant_agent`)

The "AI that builds AI" — guides business owners from zero to a live booking agent through natural language:

| Capability | Implementation |
|:---|:---|
| **Zero-Token Init** | Deterministic greeting from vertical templates (<2ms, zero LLM tokens) |
| **Website Crawling** | Crawl4AI + Playwright → heuristic link scoring + LLM URL selector → Redis Claim Check → structured synthesis with `StrictDraftPatchValidator` |
| **Delta Patching** | `jsonmerge` with `arrayMergeById` — LLM outputs only changed sections, canonical ID remapping (`srv_<slug>_<hex>`, `res_<slug>_<hex>`) |
| **Bounded ReAct Loop** | Self-verification after patching (MAX_REACT_STEPS=2, patch_retries=3), ground truth injection for accuracy |
| **TOON Serialization** | Token-Oriented Object Notation — compact pipe-delimited tables for prompt caching and minimal token usage |
| **Long-Term Memory** | Qdrant semantic facts + rolling conversation summaries (3000-token trigger → SQS async consolidation) |
| **20-Checkpoint Time Travel** | `AgentDraft.rewind_to_message` for linear rollback, 3-day Redis cache |
| **Safety-Gated Publishing** | Explicit confirmation keywords + `_compute_structural_gaps()` validation + `BatchSyncInventory` gRPC sync |

→ Deep dive: **[docs/tenant-agent.md](./docs/tenant-agent.md)**

### 2. Customer Booking & Support Agent (`customer_agent`)

The production concierge embedded on client websites:

```
                   ┌──────────────────────────┐
                   │       Supervisor          │
                   │  • <1ms deterministic     │
                   │    guardrails             │
                   │  • OTP numeric fast-path  │
                   │  • Parallel fan-out for   │
                   │    compound intents       │
                   └────────┬─────────────────┘
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
     ┌────────────┐  ┌───────────┐  ┌───────────┐
     │  Booking   │  │    FAQ    │  │  Handoff  │
     │  Agent     │  │   Agent   │  │  Agent    │
     │            │  │           │  │           │
     │ 10 MCP     │  │ Qdrant    │  │ Zero-LLM  │
     │ tools over │  │ hybrid    │  │ emergency │
     │ gRPC       │  │ RAG       │  │ routing   │
     └─────┬──────┘  └─────┬─────┘  └───────────┘
           └────────┬──────┘
                    ▼
           ┌────────────────┐
           │   Synthesizer  │
           │  Merges multi- │
           │  agent outputs │
           └────────────────┘
```

**Key capabilities:**
- **10 FastMCP Tools** over gRPC: `check_availability`, `hold_slot`, `book_appointment`, `send_booking_otp`, `verify_booking_otp`, `cancel_appointment`, `reschedule_appointment`, `get_customer_bookings`, `search_knowledge_base`, `search_services`
- **<5ms Deterministic Fast-Paths:** Booking confirmations, OTP dispatches, and verification results rendered as rich Markdown cards without a second LLM call
- **Dual Booking Modes:** `time_slot` (intraday appointments) and `date_range` (multi-day stays/rentals)
- **24h Redis OTP Session Auth:** 6-digit code, 5min TTL, max 5 attempts, Twilio SMS via Lambda
- **14-Day Calendar Anchor:** Prevents LLM date hallucination with pre-computed local timezone reference

→ Deep dive: **[docs/customer-agent.md](./docs/customer-agent.md)**

---

## The Agent Runtime Config — A Declarative Agent Specification

The `AgentRuntimeConfig` (v2.4) is the **single source of truth** that binds every component together. It's not just a settings file — it's a **declarative specification language for booking agents**:

```
AgentRuntimeConfig v2.4
├── business_profile         # Name, vertical, timezone, contact, terminology
├── widget_config            # Branding, theme (OKLCH), position, quick prompts, whitelisted domains
├── llm_engine               # Models, temperature, failover, semantic caching, token limit
├── supervisor_prompt        # Custom operational instructions injected into agent prompts
├── knowledge_base           # Qdrant collection, source docs (PDF, web crawl), sync status
├── scheduling_engine        # Booking mode, slot granularity, lead time, hold duration
├── operating_hours          # Weekly schedule + blackout dates
├── resources[]              # Staff/rooms/bays/equipment with custom shift overrides
├── services[]               # Duration, buffer, price, deposit (UPI/bank), OTP policy, resource requirements
├── intake_rules             # Required patient/customer fields, verification policy
├── guardrails               # PHI scrubbing, emergency triage keywords, human handoff triggers
├── sub_agents[]             # Multi-agent routing definitions (booking, FAQ, deposit)
├── integrations             # Paddle billing, payment gateway (pass-through UPI/bank), Twilio
├── compliance               # HIPAA mode, data retention, zero-hallucination mode, audit trail
└── runtime_meta             # Template provenance, inferred_fields, compiler hash, subscription tier
```

**What makes this special:**
- The **Tenant Agent** builds it conversationally from website crawls, PDFs, and natural language
- The **Customer Agent** loads it at session start and derives all runtime behavior from it — no hardcoded logic
- The **Scheduling Engine** syncs with it atomically via `BatchSyncInventory` gRPC
- The **Widget** reads theming and branding from it
- The **Dashboard** provides visual CRUD that stays in bidirectional sync via Kafka events
- **Vertical templates** (medical/dental, auto repair, hospitality, salon, consulting) provide industry-specific defaults

→ Deep dive: **[docs/agent-builder-studio.md](./docs/agent-builder-studio.md)** · Schema reference: **[docs/agent-schema-reference.md](./docs/agent-schema-reference.md)**

---

## Hybrid RAG Pipeline & Evaluation

Designed for high-precision multi-tenant retrieval without cross-tenant data leakage:

- **Ingestion:** S3 PDFs parsed via `pymupdf4llm`, split by Markdown headers with atomic table preservation (2400-char chunks / 400-char overlap), concurrently embedded with **Voyage AI (`voyage-4`) dense** + **FastEmbed BM25 sparse** vectors, upserted into Qdrant with UUID5 idempotency
- **Retrieval:** Concurrent dual `Prefetch` (dense + sparse) → **Reciprocal Rank Fusion (RRF)** → **Voyage `rerank-2-lite`** cross-encoder reranking (top-20 → top-4)
- **Evaluation:** RAGAS framework (`Faithfulness`, `Answer Relevancy`, `Context Precision`, `Context Recall`) with LangSmith trace visualization — zero changes to production code, monkey-patched tool interception for context extraction

→ Deep dive: **[docs/rag-pipeline.md](./docs/rag-pipeline.md)**

---

## Microservices & Monorepo Map

Managed as a **pnpm + Turborepo** polyglot monorepo (`apps/` + `packages/`):

| Service | Runtime | Responsibility | Protocols |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | NestJS (TS) | Tenant auth/RBAC, SSE proxy, analytics BFF, billing, widget config | REST / SSE, gRPC |
| **`customer-api-gateway`** | NestJS (TS) | Public chat BFF, domain CORS guard, per-IP rate limiting, circuit breaking | REST / SSE, gRPC |
| **`identity-tenant`** | NestJS (TS) | Multi-tenant JWT auth, Google OAuth, Paddle billing, tier quotas, workspace RBAC | gRPC (Headless), SQS |
| **`scheduling-inventory`** | NestJS (TS) | Services/resources/shifts CRUD, Redis slot holds, deterministic booking engine, outbox | gRPC (Headless), Kafka |
| **`ai-orchestration`** | Python 3.12 | LangGraph agents, FastMCP tools, RAG retrieval, memory consolidation, token metering | gRPC (Headless), Kafka, SQS |
| **`python-worker`** | Python 3.12 | Crawl4AI web crawling, S3 PDF chunking, Qdrant vector ingestion, schema synthesis | SQS, S3, Qdrant |
| **`kafka-consumer`** | Node.js (TS) | Domain event consumption, cache invalidation, notification dispatch, audit logging | Kafka, SQS |

**Shared Packages:**

| Package | Purpose |
| :--- | :--- |
| **`@repo/proto`** | 5 Protobuf definitions (tenant, scheduling, knowledge, dashboard, superadmin) compiled for TS + Python |
| **`@repo/circuit-breaker`** | Opossum wrapper with smart timeout defaults (45s LLM streaming, 5s standard) and 4xx/gRPC error filtering |
| **`@repo/widget`** | ~13KB gzipped Preact chat widget — Shadow DOM, OKLCH theming, WCAG AA, SSE streaming, session persistence |

→ Deep dive: **[docs/microservices.md](./docs/microservices.md)**

---

## Distributed Observability Pipeline (Traces, Metrics & Logs)

Built for low-overhead production visibility on compact compute:

- **OpenTelemetry Collector** ingesting from all Node.js and Python services (gRPC `:4317` / HTTP `:4318`)
- **Intelligent Tail-Based Sampling:** 100% of `ERROR` traces, LLM endpoints >10s, CRUD >1s, 5% probabilistic baseline
- **Split Routing:** Traces/logs → Kafka → `otel-ingestor` → **OpenSearch**; Metrics → **Grafana Cloud**
- **LangSmith** `otel_trace_id` correlation for end-to-end AI pipeline debugging

→ Deep dive: **[docs/observability.md](./docs/observability.md)**

---

## Cloud Infrastructure & Zero-Secret GitOps

| Layer | Technology | Details |
|:---|:---|:---|
| **Compute** | AWS EC2 (c7i-flex.large) + K3s | Single-cluster, Traefik Ingress, Let's Encrypt TLS |
| **Autoscaling** | HPA + KEDA | Gateways on CPU; Kafka consumer on lag; crawler-worker on SQS depth |
| **Secrets** | Doppler Kubernetes Operator | 8 isolated `DopplerSecret` CRDs, zero committed credentials |
| **CDN** | S3 + CloudFront (HTTP/2+3) | OAC, SPA routing via CloudFront Function, `/widget.js` edge caching |
| **IaC** | Terraform (6 modules) | EC2, frontend, RAG storage, SQS queues, Lambda email/SMS, \$30/mo budget alert |
| **Async** | SQS + Lambda | Brevo transactional email, Twilio SMS/OTP, `ReportBatchItemFailures` |
| **CI/CD** | GitHub Actions | Path-filtered builds, Docker → DockerHub → `kubectl set image` rolling updates, zero-downtime S3 deploy |

→ Deep dive: **[docs/infrastructure.md](./docs/infrastructure.md)** · Deployment guide: **[docs/deployment.md](./docs/deployment.md)**

---

## Load Testing & Performance Benchmarks

| Scenario | Description | VUs | Key Thresholds |
|:---|:---|:---|:---|
| `core:ramp` | Availability + services API gradual ramp | 1→100 | P95 <3000ms, <1% failure |
| `core:spike` | Booking spike (409 Conflict = expected concurrency) | 10→100 | P95 <2500ms, <1% system errors |
| `chat:mocked` | Full chat pipeline with `MOCK_LLM=true` | 2→100 | P95 <1500ms chat, <800ms init |
| `chat:live` | End-to-end with live Gemini + Qdrant | 3 | P95 <4500ms, <5% error |

**Design-target performance characteristics:**

| Operation | Latency | Notes |
|:---|:---|:---|
| Deterministic guardrails (emergency/handoff) | <1ms | Zero LLM tokens, keyword matching |
| OTP numeric fast-path routing | <1ms | Regex-based supervisor bypass |
| Booking confirmation fast-path card | <5ms | Pre-rendered Markdown, no second LLM call |
| Zero-token onboarding greeting | <2ms | Deterministic template, zero LLM tokens |
| MongoDB transaction lock time | <10ms | Pure-write transactions, all reads resolved beforehand |
| Redis slot hold acquisition | <5ms | Atomic Lua script, multi-resource |

→ Deep dive: **[loadtests/README.md](./loadtests/README.md)**

---

## Key Engineering Decisions & Trade-Offs

| Decision | Why | Alternative Considered |
|:---|:---|:---|
| **MongoDB + Redis slot holds** (not Postgres advisory locks) | Document model maps naturally to hierarchical agent configs; Redis Lua scripts give atomic multi-resource holds with TTL auto-expiry | Postgres advisory locks lack TTL, require connection pinning |
| **Polyglot NestJS + Python over gRPC** (not all-Node or all-Python) | NestJS excels at structured REST/gRPC microservices; Python owns the LangGraph/ML ecosystem. gRPC gives type-safe cross-language contracts | All-Node would require maintaining LangChain.js ports; all-Python lacks NestJS's DI/guard/interceptor patterns |
| **Kafka for domain events, SQS+Lambda for notifications** | Kafka's consumer groups and replay give durable event streams for cache invalidation and billing; SQS+Lambda is cheaper for fire-and-forget notification dispatch | All-Kafka would require self-managed Lambda-equivalent consumers; all-SQS lacks replay |
| **TOON serialization + deterministic fast-paths** | Reduces prompt token count by ~60% vs raw JSON; fast-paths save \$0.002–0.005 per booking confirmation (adds up at scale) | Raw JSON in prompts wastes tokens; always-LLM responses add 500ms+ latency |
| **Redis Claim Check between crawler and schema generator** | SQS message size limit (256KB); crawled HTML can be megabytes. Redis key with TTL bridges the gap cleanly | S3 as intermediary adds latency and cost for ephemeral data |
| **Single EC2 K3s** (not EKS/multi-node) | \$30/mo budget constraint; K3s gives full Kubernetes API compatibility with minimal overhead. KEDA + HPA handle burst scaling | EKS minimum ~\$73/mo for control plane alone |
| **Dual gateways** (not path-based routing) | Complete pod/HPA/rate-limit isolation. Widget DDoS literally cannot exhaust tenant dashboard resources | Single gateway with path routing shares connection pools and rate limit buckets |
| **Transactional Outbox** (not direct Kafka publish) | Guarantees event delivery even if Kafka is momentarily down; 10s recovery loop catches failures. Zero data loss | Direct publish can silently drop events on network hiccups |

---

## Quick Start

```bash
git clone https://github.com/cjmatrix/Schedulux.git && cd Schedulux
pnpm install
pnpm build:proto:py          # Compile shared Protobuf stubs for Python services
pnpm dev                      # Launch gateways, core services, workers, and React UI
```

→ Full local setup, environment configuration, and K3s deployment guide: **[docs/deployment.md](./docs/deployment.md)**

---

## Documentation Index

| Document | Description |
|:---|:---|
| **[docs/agent-builder-studio.md](./docs/agent-builder-studio.md)** | End-to-end Agent Builder Studio: URL crawl → canvas → sandbox → deploy |
| **[docs/agent-schema-reference.md](./docs/agent-schema-reference.md)** | `AgentRuntimeConfig` v2.4 schema reference with annotated examples |
| **[docs/tenant-agent.md](./docs/tenant-agent.md)** | Tenant Onboarding Agent: LangGraph graph, TOON, delta patching, memory |
| **[docs/customer-agent.md](./docs/customer-agent.md)** | Customer Agent: supervisor routing, booking tools, fast-paths, RAG |
| **[docs/scheduling-engine.md](./docs/scheduling-engine.md)** | Deterministic scheduling engine: slot holds, booking modes, outbox |
| **[docs/rag-pipeline.md](./docs/rag-pipeline.md)** | Hybrid RAG pipeline: ingestion, retrieval, reranking, RAGAS evaluation |
| **[docs/microservices.md](./docs/microservices.md)** | Microservices architecture, protocols, and monorepo topology |
| **[docs/security-and-multitenancy.md](./docs/security-and-multitenancy.md)** | Multi-tenant isolation, auth, RBAC, guardrails, compliance |
| **[docs/observability.md](./docs/observability.md)** | OpenTelemetry pipeline: sampling, routing, Grafana, LangSmith |
| **[docs/infrastructure.md](./docs/infrastructure.md)** | Terraform modules, K3s, CDN, secrets, autoscaling |
| **[docs/deployment.md](./docs/deployment.md)** | Local dev, CI/CD, K3s deployment, Day-2 operations |
| **[loadtests/README.md](./loadtests/README.md)** | k6 load testing scenarios and benchmark methodology |

---

<div align="center">

**Built by [CJ Matrix](https://github.com/cjmatrix)** · MIT License

</div>
