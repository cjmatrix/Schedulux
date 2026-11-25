<div align="center">

# ⚡ Schedulux

### Multi-Tenant AI Scheduling & Customer Support Agent Builder

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

**Build, test, and deploy domain-aware booking & customer support agents with zero code.**  
Business owners connect a website or upload PDFs, configure services and staff rules conversationally in a live sandbox, and embed a single `<script>` widget onto any site.

[🌐 Website (`schedulux.xyz`)](https://schedulux.xyz) · [🚀 Tenant Dashboard (`app.schedulux.xyz`)](https://app.schedulux.xyz) · [🧩 Architecture Diagram](./docs/assets/architecture.png)

</div>

---

![Schedulux System Architecture](./docs/assets/architecture.png)

---

## Core Engineering Highlights

- **Deterministic Concurrency & Tool Execution:** Prevents double-booking via **Redis distributed slot locks / hold tokens**, deterministic availability calculation in `scheduling-inventory`, and **MCP tools executed over internal gRPC** protected by Opossum circuit breakers (`@repo/circuit-breaker`).
- **Dual-Gateway Traffic Isolation:** Strictly separates authenticated tenant control-plane traffic ([`api.schedulux.xyz`](https://api.schedulux.xyz) → `api-gateway`) from high-volume public widget & customer chat traffic ([`client-api.schedulux.xyz`](https://client-api.schedulux.xyz) → `customer-api-gateway`) with dedicated CORS origin guards and rate-limit isolation.
- **Strict Multi-Tenant Data & RAG Isolation:** Enforces `tenant_id` boundaries across MongoDB schemas, Redis session/OTP keys, Qdrant metadata filters, S3 knowledge prefixes, and Paddle subscription tier quotas.
- **Event-Driven & Non-Blocking Mutations:** Decouples state changes using **Apache Kafka**, **RabbitMQ**, and **AWS SQS + Lambda** workers (email/SMS OTP & booking notifications) alongside **Gemini → Groq automatic LLM failover**.

---

## Dual Multi-Agent Architecture

Schedulux splits agentic responsibilities into an onboarding control-plane agent and a customer-facing runtime concierge:

### 1. Tenant Onboarding & Knowledge Agent
Guides business owners from zero configuration to a live booking agent through natural language:
- Crawls business websites and indexes uploaded PDFs into Qdrant vector collections (S3 + Voyage dense/sparse retrieval).
- Uses zero-token deterministic initialization, compact **TOON** draft serialization, and a bounded LangGraph ReAct loop (`jsonmerge` delta patching + Qdrant long-term facts) with live canvas previews, safety-gated publishing, and atomic gRPC inventory sync.
- → Deep dive: **[docs/tenant-agent.md](./docs/tenant-agent.md)**

### 2. Customer Booking & Support Agent
Handles end-to-end public conversations across web widgets with specialist LangGraph orchestration:
- **Supervisor Router:** Enforces zero-latency emergency/handoff guardrails, OTP fast-path detection, and parallel fan-out on compound intents (`booking` + `faq`).
- **Booking Agent:** Runs **FastMCP** scheduling tools over gRPC (`check_availability`, `hold_slot`, `book_appointment`, 24h Redis OTP verification) with **<5ms deterministic fast-path** booking confirmations.
- **Knowledge FAQ Agent & Synthesizer:** Queries tenant-scoped Qdrant hybrid RAG collections for policy/service questions and merges compound answers cleanly.
- **Human Handoff Escalation:** Routes disputes or emergency triggers directly to configured escalation messages and contact channels.
- → Deep dive: **[docs/customer-agent.md](./docs/customer-agent.md)**

---

## Hybrid RAG Pipeline & Evaluation

Designed for high-precision multi-tenant retrieval without cross-tenant data leakage:

- **Ingestion & Structural Chunking:** Presigned **S3** PDF uploads and crawled web pages are parsed via `pymupdf4llm`, split by Markdown headers (`MarkdownHeaderTextSplitter`) with atomic table preservation (`2400`-char chunks / `400`-char overlap), and indexed asynchronously by `python-worker`.
- **Concurrent Hybrid Search & Reranking:** `KnowledgeRetrievalService` computes **Voyage AI (`voyage-4`) dense vectors** and **FastEmbed BM25 (`Qdrant/bm25`) sparse vectors** in parallel, runs tenant- and agent-filtered hybrid retrieval in **Qdrant**, and reranks candidates using **Voyage `rerank-2-lite`**.
- **Automated RAG Evaluation (`RAGAS` + LangSmith):** `evals/evaluate_rag.py` benchmarks live Qdrant retrieval and LangGraph responses across **Faithfulness**, **Answer Relevancy**, **Context Precision**, and **Context Recall** with exported JSON/CSV run artifacts.
- → Deep dive: **[docs/rag-pipeline.md](./docs/rag-pipeline.md)**

---

## Microservices & Monorepo Map

Managed as a **pnpm + Turborepo** polyglot monorepo (`apps/` + `packages/`), including the React 19 dashboard (`apps/frontend-react`), embeddable chat widget (`packages/widget`), shared Protobuf definitions (`packages/proto`), and circuit breaker library (`packages/circuit-breaker`).

| Service | Runtime | Responsibility | Protocols |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | NestJS (TS) | Tenant auth, RBAC, onboarding proxy, billing & analytics BFF | REST / SSE, gRPC |
| **`customer-api-gateway`** | NestJS (TS) | Public chat & widget BFF, domain CORS guard, circuit breaking | REST / SSE, gRPC |
| **`identity-tenant`** | NestJS (TS) | Multi-tenant auth, Google OAuth, tenant/tier config, Paddle billing | gRPC (Headless), RabbitMQ / SQS |
| **`scheduling-inventory`** | NestJS (TS) | Services, resources, shifts, Redis slot holds, deterministic booking engine | gRPC (Headless), Kafka, RabbitMQ |
| **`ai-orchestration`** | Python 3.12 | LangGraph Tenant & Customer agents, MCP tool server, RAG retrieval, memory consolidation | gRPC (Headless), Kafka, RabbitMQ |
| **`python-worker`** | Python 3.12 | Async web crawling, S3 PDF chunking, vector embedding ingestion | RabbitMQ, S3, Qdrant |
| **`kafka-consumer`** | Node.js (TS) | Domain event consumption, cache invalidation, audit/notification dispatch | Kafka, SQS |

→ Deep dive: **[docs/microservices.md](./docs/microservices.md)**

---

## Distributed Observability Pipeline (Traces, Metrics & Logs)

Built for low-overhead production visibility on compact compute without losing slow AI traces or failures:

- **OpenTelemetry Collector (`otlp` gRPC `:4317` / HTTP `:4318`):** Ingests spans, structured logs, and metrics from every Node.js and Python service.
- **Intelligent Tail-Based Sampling:** Captures **100% of `ERROR` traces**, LLM endpoints exceeding a **10s latency threshold**, standard CRUD endpoints exceeding **1s**, and **5% probabilistic baseline** traffic.
- **Split Telemetry Routing:** Streams sampled traces and logs through **Kafka (`otel-traces`, `otel-logs`) → `otel-ingestor` → OpenSearch**, while exporting service/P99 latency metrics via `otlphttp` directly to **Grafana Cloud**.
- → Deep dive: **[docs/observability.md](./docs/observability.md)**

---

## Cloud Infrastructure & Zero-Secret GitOps

- **Modular Terraform (`infra/terraform/`):** Provisions the AWS EC2 runtime host (`ec2`), split frontend hosting (`frontend`), RAG document bucket (`rag_storage`), and async notification pipelines (`sqs`, `lambda_email`, `lambda_sms`).
- **K3s Cluster & Edge TLS (`k8s/base/`):** Single-cluster microservices deployment behind **Traefik Ingress** with automated Let's Encrypt TLS (`api.schedulux.xyz`, `client-api.schedulux.xyz`) and **Headless Services** for internal gRPC load balancing.
- **Zero-Secret GitOps & Autoscaling:** Per-service **Doppler Kubernetes Operator** sync (`doppler-secrets.yaml`) injects secrets into pods without committing credentials, paired with Kubernetes **HPA** and **KEDA `ScaledObject`s** on Kafka consumer lag and queue depth.
- **Split CDN Hosting:** Private S3 + CloudFront distribution (`app.schedulux.xyz`) using OAC and CloudFront Functions to serve the React SPA alongside CORS-enabled `/widget.js` edge caching.
- → Deep dive: **[docs/infrastructure.md](./docs/infrastructure.md)**

---

## Quick Start

```bash
git clone https://github.com/cjmatrix/Schedulux.git && cd Schedulux
pnpm install
pnpm build:proto:py          # Compile shared Protobuf stubs for Python services
pnpm dev                      # Launch gateways, core services, workers, and React UI
```

→ Full local setup, environment configuration, and K3s deployment guide: **[docs/deployment.md](./docs/deployment.md)**
