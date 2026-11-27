# `AgentRuntimeConfig` & `AgentDraft` v2.4 — Schema Reference

The `AgentRuntimeConfig` (live) and `AgentDraft` / `AgentDraftConfig` (staging) models are the **declarative specification** that defines a tenant's entire booking agent. Defined as Beanie/Pydantic models in `apps/AI-orchestration/src/agent_orchestrator/models/`, they bind every component together:

| Consumer | What It Reads |
|:---|:---|
| **Tenant Agent** | Builds and patches `AgentDraft.current_draft` (`AgentDraftConfig`) conversationally via `StrictDraftPatchValidator` |
| **Customer Agent** | Loads `AgentRuntimeConfig` (live) or `AgentDraft` (sandbox) at session start; derives all runtime behavior |
| **Scheduling Engine** | Syncs services, resources, shifts, and policies atomically via `BatchSyncInventory` gRPC |
| **Widget** | Reads theming, branding, greeting, quick prompts, and spacing |
| **Dashboard** | Visual CRUD with bidirectional Kafka sync (`scheduling.domain.events`) |

---

## Top-Level Structure

### `AgentRuntimeConfig` (`agent_runtime_configs` collection)

```jsonc
{
  "schema_version": "2.4",
  "status": "live",                // "draft" | "live"
  "tenant_id": "tnt_abc123",
  "agent_id": "agent_xyz",
  "creation_source": "custom",     // "custom" | "web_crawl" | "medical" | "auto" | "hospitality"
  "compiled_at": "2026-11-25T10:30:00Z",

  "business_profile": { /* BusinessProfileEmbed */ },
  "widget_config": { /* WidgetConfigEmbed */ },
  "llm_engine": { /* LlmEngineEmbed */ },
  "supervisor_prompt": "...",
  "scheduling_engine": { /* SchedulingEngineEmbed */ },
  "operating_hours": { /* OperatingHoursEmbed */ },
  "resources": [ /* ResourceEmbed[] */ ],
  "services": [ /* ServiceEmbed[] */ ],
  "guardrails": { /* GuardrailsEmbed */ }
}
```

### `AgentDraft` & `AgentDraftConfig` (`agent_drafts` collection)

`AgentDraft` wraps `current_draft: AgentDraftConfig` (same embedded config fields as `AgentRuntimeConfig`, without `compiled_at`) along with staging and 20-step time-travel metadata:

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `tenant_id` | `string` | — | Owning tenant ID |
| `agent_id` | `string` | — | Agent ID (unique with `tenant_id`) |
| `name` | `string` | — | Draft display name |
| `creation_source` | `string` | `"custom"` | Origin (`custom`, `web_crawl`, `medical`, `auto`, `hospitality`) |
| `status` | `string` | `"pending"` | Draft lifecycle status |
| `last_edited_by` | `string \| null` | `null` | Last editor user ID |
| `current_draft` | `AgentDraftConfig` | `{}` | Active working configuration |
| `active_message_id` | `string \| null` | `null` | Current checkpoint message pointer |
| `conversation_summary` | `string` | `""` | Rolling summarized onboarding memory |
| `last_summarized_seq` | `int` | `0` | Sequence cursor for memory consolidation |
| `checkpoints[]` | `DraftCheckpointEmbed[]` | `[]` | Rolling window of up to 20 snapshots (`checkpoint_id`, `message_id`, `user_prompt`, `summary`, `draft_snapshot`, `timestamp`) for linear rewind |
| `created_at` / `updated_at` | `datetime` | `utcnow` | Audit timestamps |

---

## `business_profile` (`BusinessProfileEmbed`)

Defines the business identity, locale, contact channels, and domain terminology.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `name` | `string` | `""` | Business display name |
| `vertical` | `string` | `""` | Industry vertical (e.g., `medical_dental`, `salon_beauty`, `auto_repair`, `hospitality`, `custom`) |
| `timezone` | `string \| null` | `null` | IANA timezone (defaults to `"UTC"` on live publish if unset) |
| `locale` | `string \| null` | `null` | Locale code (e.g., `en-US`, `en-IN`) |
| `currency` | `string \| null` | `"USD"` | ISO 4217 currency code |
| `address` | `string \| null` | `null` | Business physical address |
| `contact.support_email` | `string \| null` | `null` | Customer support email |
| `contact.public_phone` | `string \| null` | `null` | Public-facing phone number |
| `contact.escalation_phone` | `string \| null` | `null` | Emergency/escalation phone |
| `terminology.customer_singular` | `string \| null` | `null` | Custom singular term (e.g., `"patient"`, `"guest"`, `"client"`) |
| `terminology.customer_plural` | `string \| null` | `null` | Custom plural term |
| `terminology.primary_metric` | `string \| null` | `null` | Primary domain metric |
| `terminology.action_metric` | `string \| null` | `null` | Action domain metric |

---

## `widget_config` (`WidgetConfigEmbed`)

Controls the embeddable chat widget's copy, positioning, CORS whitelist, and theme.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `agent_name` | `string` | `"AI Assistant"` | Display name in widget header |
| `agent_subtitle` | `string \| null` | `"Typically replies instantly"` | Subtitle text |
| `avatar_url` | `string \| null` | `null` | Agent avatar image URL |
| `logo_url` | `string \| null` | `null` | Business logo URL |
| `initial_greeting` | `string \| null` | `"Hi there! How can I assist you with scheduling today?"` | First message shown to customers |
| `placeholder_text` | `string` | `"Type a message or ask a question..."` | Input field placeholder |
| `quick_prompts[]` | `string[]` | 3 default prompts | Suggested quick-reply buttons |
| `fallback_message` | `string \| null` | `null` | Fallback message when agent cannot respond |
| `position` | `string` | `"bottom-right"` | Launcher position (`bottom-right`, `bottom-left`) |
| `bottom_spacing_px` | `int` | `20` | Bottom viewport offset in pixels |
| `side_spacing_px` | `int` | `20` | Side viewport offset in pixels |
| `launcher_style` | `string \| null` | `"bubble"` | `bubble`, `pill`, or `bar` |
| `launcher_icon` | `string` | `"chat"` | `chat`, `calendar`, or `help` |
| `sound_on_load` | `bool` | `false` | Play notification chime on widget load |
| `auto_expand_delay_seconds` | `int \| null` | `null` | Auto-open delay (`null` = disabled) |
| `platform_sources[]` | `string[]` | `[]` | Enabled channels (e.g., `["web_widget"]`) |
| `whitelisted_domains[]` | `string[]` | `[]` | Allowed origins enforced by `CorsOriginGuard` |
| `theme` | `WidgetThemeEmbed` | `{}` | Theme styling (see below) |

### `widget_config.theme` (`WidgetThemeEmbed`)

OKLCH color-space perceptual theming with WCAG AA contrast enforcement in `@repo/widget`:

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `primary_color` | `string` | `"#4F46E5"` | Primary brand color (hex) |
| `theme_mode` | `string` | `"light"` | `light`, `dark`, or `auto` (`prefers-color-scheme`) |
| `secondary_color` | `string \| null` | `null` | Secondary accent color |
| `background_color` | `string \| null` | `null` | Widget background |
| `header_background` | `string \| null` | `null` | Header background |
| `header_text_color` | `string \| null` | `null` | Header text color |
| `user_bubble_bg` | `string \| null` | `null` | User message bubble background |
| `user_bubble_text` | `string \| null` | `null` | User message text color |
| `agent_bubble_bg` | `string \| null` | `null` | Agent message bubble background |
| `agent_bubble_text` | `string \| null` | `null` | Agent message text color |
| `border_radius` | `string` | `"16px"` | Corner radius |
| `font_family` | `string` | `"inherit"` | Font family |

---

## `llm_engine` & `supervisor_prompt`

### `llm_engine` (`LlmEngineEmbed`)

Runtime LLM tuning parameters:

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `fallback_trigger_latency_ms` | `int \| null` | `null` | Latency threshold for provider failover |
| `temperature` | `float` | `0.1` | Sampling temperature |
| `semantic_caching` | `bool` | `true` | Enable prompt/semantic caching |
| `prompt_compiler_token_limit` | `int \| null` | `null` | Token budget for compiled system prompt |

### `supervisor_prompt` (`string | null`)

Custom natural-language operational instructions injected directly into both `booking_agent` and `faq_agent` system prompts at runtime.

---

## `scheduling_engine` (`SchedulingEngineEmbed`)

Controls the core booking mechanics and hold windows.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `booking_mode` | `BookingMode` | `"time_slot"` | `"time_slot"` (intraday) or `"date_range"` (multi-day stays/rentals) |
| `default_lead_time_hours` | `int` | `2` | Minimum advance notice required |
| `max_advance_booking_days` | `int` | `60` | Maximum days in advance a booking can be made |
| `cancellation_window_hours` | `int` | `24` | Hours before appointment when cancellation is allowed |
| `hold_duration_minutes` | `int` | `10` | Provisional Redis slot hold TTL in minutes |

---

## `operating_hours` (`OperatingHoursEmbed`)

Global weekly schedule and holiday/closure overrides.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `monday` .. `sunday` | `TimeSlotEmbed[]` | `[]` | List of `{ start: "HH:MM", end: "HH:MM" }` shift intervals per day |
| `blackout_dates[]` | `BlackoutDateEmbed[]` | `[]` | Specific dates with `{ date: string, reason: string \| null, is_closed: bool }` |

---

## `resources[]` (`ResourceEmbed`)

Staff, rooms, bays, equipment, and other bookable assets.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `resource_id` | `string` | — | Canonical ID (`res_<slug>_<hex>`) |
| `resource_type` | `ResourceType` | `"staff"` | `staff`, `room`, `chair`, `bay`, `equipment`, `asset`, `vehicle` |
| `name` | `string` | — | Display name |
| `title` | `string \| null` | `""` | Role/title |
| `category` | `string` | `"General"` | Grouping category |
| `description` | `string \| null` | `""` | Operational rules or bio |
| `is_bookable` | `bool` | `true` | Whether this resource can be booked |
| `dispatch_status` | `DispatchStatus` | `"active"` | `active`, `on_leave`, `maintenance`, `retired`, `inactive` |
| `custom_shift_overrides` | `dict[str, object]` | `{}` | Per-day overrides of global `operating_hours` (empty list `[]` = day off) |
| `is_deleted` | `bool` | `false` | Soft-delete flag |
| `deleted_at` | `string \| null` | `null` | Soft-delete timestamp |

---

## `services[]` (`ServiceEmbed`)

Bookable services offered by the business.

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `service_id` | `string` | — | Canonical ID (`srv_<slug>_<hex>`) |
| `name` | `string` | — | Service name |
| `category` | `string` | `"General"` | Service category |
| `description` | `string \| null` | `""` | Service description |
| `duration_minutes` | `int \| null` | `30` | Appointment duration in minutes |
| `buffer_minutes` | `int \| null` | `0` | Buffer time between appointments |
| `booking_mode` | `BookingMode` | `"time_slot"` | Per-service override (`"time_slot"` \| `"date_range"`) |
| `price.type` | `PriceType` | `"fixed"` | `fixed`, `starting_at`, `hourly`, `free`, `custom` |
| `price.amount` | `float` | `0.0` | Price amount |
| `price.currency` | `string` | `"USD"` | Currency code |
| `verification` | `ServiceVerificationEmbed \| null` | `null` | `{ require_otp: bool \| null }` per-service OTP override |
| `resource_requirements[]` | `ResourceRequirementEmbed[]` | `[]` | Resource matching rules (see below) |
| `is_deleted` | `bool` | `false` | Soft-delete flag |
| `deleted_at` | `string \| null` | `null` | Soft-delete timestamp |

### `services[].resource_requirements[]` (`ResourceRequirementEmbed`)

| Field | Type | Default | Description |
|:---|:---|:---|:---|
| `role` | `string \| null` | `"Provider"` | Required role label (e.g., `"Dentist"`, `"Technician"`) |
| `resource_type` | `ResourceType \| string \| null` | `"staff"` | Resource type filter |
| `count` | `int` | `1` | Number of resources needed (clamped `>= 1`) |
| `eligible_resource_ids[]` | `string[]` | `[]` | Specific resource IDs eligible for this service |
| `selection_mode` | `SelectionMode` | `"auto_assign"` | `"user_selectable"` (defaults for `staff`) or `"auto_assign"` |

---

## `guardrails` (`GuardrailsEmbed`)

Safety, verification, and escalation controls.

| Section | Fields & Defaults | Description |
|:---|:---|:---|
| `verification_policy` | `require_otp_for_new_booking` (`bool = false`) | Global OTP verification requirement for new bookings |
| `phi_scrubbing` | `enabled` (`bool = true`), `policy` (`str \| null`), `description` (`str \| null`), `hipaa_compliant` (`bool = true`) | Healthcare PHI scrubbing & compliance policy |
| `triage_emergency` | `enabled` (`bool = true`), `keywords` (`list[str]`), `response_override` (`str \| null`) | Zero-LLM emergency keyword detection with immediate override response |
| `human_handoff` | `enabled` (`bool = true`), `trigger_topics` (`list[str]`), `reception_contact` (`str \| null`), `handoff_message` (`str \| null`) | Deterministic escalation to human staff |

---

## Related Documentation

- **[Agent Builder Studio](./agent-builder-studio.md)** — How the config is built conversationally
- **[Tenant Agent](./tenant-agent.md)** — LangGraph agent that builds and patches `AgentDraft`
- **[Customer Agent](./customer-agent.md)** — Agent that runs from `AgentRuntimeConfig`
- **[Scheduling Engine](./scheduling-engine.md)** — Backend that syncs with this config via `BatchSyncInventory`
