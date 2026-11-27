# Agent Builder Studio — From URL to Live Booking Agent

The **Agent Builder Studio** is Schedulux's flagship zero-code workflow that lets business owners create, configure, test, and deploy a fully transactional AI booking agent — using only conversation and a website URL.

This document covers the end-to-end pipeline: **URL Crawl → Schema Synthesis → Conversational Canvas → Live Sandbox → One-Click Deploy → Widget Embed**.

---

## Why It Matters

Traditional chatbot builders require:
- Manual form-filling for every service, staff member, and shift
- Separate FAQ/knowledge base setup
- Custom tool integration for actual booking logic
- Widget theming and embedding as a separate step

Schedulux replaces all of this with a single pipeline:

```
Paste URL  ───▶  AI Crawls Site  ───▶  Synthesizes Config  ───▶  Human Reviews on Canvas  ───▶  Tests in Sandbox  ───▶  Deploys with <script> Tag
```

The business owner interacts with an **AI Architect Agent** that understands their domain — not a form wizard.

---

## Step 1: Website Crawl & Schema Synthesis (`python-worker`)

### Two-Stage URL Discovery

When a tenant pastes a website URL, the pipeline runs in `python-worker`:

1. **Heuristic Link Scoring (`crawler.py`):**
   - Crawl4AI (`AsyncWebCrawler`) with headless Playwright Chromium discovers all links from the homepage
   - Each link is scored using `JUNK_REGEX` filtering (excludes blog posts, social media, legal pages) and `SERVICE_KEYWORDS` boosting (prioritizes pages containing "services", "pricing", "about", "team", "hours", etc.)
   - Depth weighting deprioritizes deeply nested pages

2. **LLM URL Selection:**
   - Top-scored candidates are passed to an LLM (`SelectedLinksSchema`) that selects the 4–6 most relevant pages for understanding the business
   - This avoids crawling hundreds of irrelevant pages

3. **Crawl Execution:**
   - Selected pages are crawled with `light_mode`, `text_mode`, and `domcontentloaded` → `commit` fallback for resilience
   - **24h Redis Crawl Cache** (`crawl:cache:{tenant_id}:{sha256[:16]}`) prevents redundant crawls
   - **Active Crawl Lock** (`tenant:{tenant_id}:crawl:active`) prevents concurrent crawls per tenant

### Zero-Hallucination Schema Synthesis (`schema_generator.py`)

Crawled content is synthesized into a complete `AgentDraft`:

1. **Redis Claim Check:** Crawled HTML (potentially megabytes) is stored in Redis (`crawl:schema_data:{job_id}`) instead of passed through SQS (256KB limit)
2. **Structured Output:** Gemini (with Groq `openai/gpt-oss-120b` fallback) generates a `GeneratedAgentDraftSchema` via `with_structured_output`
3. **Strict Validation:** `StrictDraftPatchValidator` sanitizes the output — removing hallucinated fields, enforcing schema constraints
4. **Inferred Fields Audit:** `runtime_meta.inferred_fields` tracks which fields were AI-inferred vs. extracted verbatim, so the tenant can verify assumptions

### Real-Time Progress Streaming

The entire crawl+synthesis pipeline streams progress to the frontend:
- **Redis Pub/Sub** channel `schema-events:{tenant_id}:{job_id}` emits `SCHEMA_GENERATED` / `SCHEMA_GENERATION_FAILED`
- **API Gateway** subscribes via `RedisService.onSchemaGenerated` and bridges to SSE (`GET /api/v1/tenant/knowledge/schema/stream`)
- Frontend `useAgentSchemaGeneration` hook connects via `EventSource` and shows real-time extraction progress

---

## Step 2: Conversational Builder Canvas

After initial schema synthesis (or vertical template selection), the tenant enters the **Agent Builder Studio** — a split-pane conversational workspace.

### Split-Screen Architecture

**Desktop:** Two columns side-by-side. **Mobile:** 3-tab switcher (Architect | Canvas | Sandbox).

#### Left Pane — AI Architect Chat (`WizardChatColumn`)

- **Virtualized Chat** (`react-virtuoso`): Cursor-based infinite history with `useInfiniteQuery`
- **SSE Token Streaming**: Real-time token-by-token rendering via `/onboarding/message/stream` with automatic unary fallback
- **Floating DiffDrawer**: RFC 6902 JSON Patches computed via `fast-json-patch` `compare(baselineSchema, draftSchema)` — shows exactly what changed since last publish

The AI Architect is the **Tenant Agent** (LangGraph ReAct loop) that understands industry verticals:

| Template | Auto-Configured Features |
|:---|:---|
| Medical & Dental | 15min buffers, PHI scrubbing, emergency triage, OTP verification |
| Auto Repair & Services | Bays/lifts/VIN tracking, multi-resource requirements |
| Hospitality & Rooms | Date-range booking mode, turnover periods |
| Salon & Beauty | Staff-selectable booking, service durations |
| Consulting | Time-slot mode, advance booking limits |
| Custom / Blank Canvas | Start from scratch with AI guidance |

#### Right Pane — Visual Canvas (3 Modes)

**Mode 1: Logic & Rules Canvas**

Filterable visual cards (`all`, `profile`, `services`, `resources`, `scheduling`, `guardrails`):

- **`BusinessProfileCard`** — Name, vertical, timezone, contact, terminology
- **`SchedulingEngineCard`** — Booking mode, slot granularity, lead time, hold duration
- **`ServicesCatalogCard`** — Expandable rows showing `resource_requirements`, `selection_mode` (user-selectable vs auto-assign), OTP policy, pricing with deposit config
- **`ResourcesRosterCard`** — Expandable rows showing `custom_shift_overrides` as a 7-day visual grid
- **`SecurityGuardrailsCard`** — OTP verification matrix, PHI scrubbing toggle, emergency triage keywords + response override, human handoff trigger topics + contact info

**Mode 2: JSON Viewer (`RawJsonViewer`)**

Live inspection and copy of the compiled schema — useful for debugging and verification.

**Mode 3: Test Sandbox (`SandboxSimulation`)**

Embeds `@repo/widget` inline in `mode: 'sandbox'` with:
- **Desktop vs. Mobile phone-frame preview** toggle
- **Live hot-reloading** of widget config (`instance.updateConfig(...)`)
- **Conversation reset** button
- **Draft Preview simulation** when unpublished, real sandbox backend execution when live

---

## Step 3: Live Sandbox Testing

Before publishing, tenants test their agent in a **full sandbox environment**:

- The Customer Agent loads from `AgentDraft` (not `AgentRuntimeConfig`) when `mode="sandbox"` or `session_id` starts with `sandbox_`
- Real Qdrant RAG retrieval against the tenant's indexed knowledge base
- Real slot hold mechanics (without affecting production bookings)
- OTP flow simulation
- Deterministic booking confirmation cards

This "test before you deploy" capability ensures business owners see exactly what their customers will experience.

---

## Step 4: Publish & Deploy

### Safety-Gated Publishing

Publishing requires:
1. **Explicit user confirmation** — keyword matching (`"publish"`, `"deploy"`, `"go live"`) prevents accidental publishing
2. **Structural gap check** — `_compute_structural_gaps(draft)` validates the config has no missing required fields
3. **Schema validation** — Full JSON Schema v2.4 validation

### Atomic Backend Sync

On publish:
1. `AgentDraft` is compiled to `AgentRuntimeConfig` with `status="live"`
2. `BatchSyncInventory` gRPC call atomically syncs the entire service/resource/schedule/policy graph to `scheduling-inventory`
3. Redis caches (`biz_context`, `agent:draft`) are invalidated

### Widget Embed

The tenant gets embed options on the `EmbedWidgetPage`:

**Floating Bubble (most common):**
```html
<script src="https://app.schedulux.xyz/widget.js"
        data-tenant-id="tnt_abc123"
        data-agent-id="agent_xyz"
        defer>
</script>
```

**Inline Container:**
```html
<div id="schedulux-booking"></div>
<script src="https://app.schedulux.xyz/widget.js"
        data-tenant-id="tnt_abc123"
        data-agent-id="agent_xyz"
        data-container="schedulux-booking"
        data-inline="true"
        defer>
</script>
```

**Hosted Booking Link:**
```
https://app.schedulux.xyz/chat/{tenantId}/{agentId}
```

Guides are provided for React/Next.js, WordPress (WPCode), and Shopify (`theme.liquid`).

---

## Day-2: Bidirectional Sync

The agent builder isn't one-and-done. After deployment, the system maintains bidirectional consistency:

### Dashboard → AI Agent
When tenants edit services, staff, shifts, or settings in the React dashboard:
1. `scheduling-inventory` processes the CRUD operation
2. Kafka `scheduling.domain.events` publishes the change
3. `ai-orchestration`'s `SchedulingConsumer` updates `AgentRuntimeConfig`, `AgentDraft`, and invalidates Redis `biz_context`

### AI Agent → Scheduling Engine
When tenants modify their agent config via the AI Architect:
1. The Tenant Agent applies `jsonmerge` delta patches to `AgentDraft`
2. On re-publish, `BatchSyncInventory` gRPC syncs everything back to `scheduling-inventory`

This ensures the dashboard and AI agent always reflect the same state, regardless of which interface the tenant uses.

---

## Related Documentation

- **[Tenant Agent Deep Dive](./tenant-agent.md)** — LangGraph graph, TOON serialization, delta patching, memory
- **[Customer Agent Deep Dive](./customer-agent.md)** — Supervisor routing, booking tools, fast-paths
- **[Agent Schema Reference](./agent-schema-reference.md)** — `AgentRuntimeConfig` v2.4 field-by-field reference
- **[RAG Pipeline](./rag-pipeline.md)** — Ingestion, retrieval, reranking, evaluation
