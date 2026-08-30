# PV-1D — Ask Tiny Steps production routing telemetry

## Objective

Measure how the public Ask Tiny Steps execution router behaves in production without creating a conversation log or collecting parent/child content.

PV-1D uses the existing public-site GA4 event pipeline. It does **not** add Firestore writes, a conversation collection, a user/session identifier, or a new analytics backend.

## Event

`ask_tiny_steps_route`

Exactly one event is emitted after each accepted Ask Tiny Steps request completes and a visitor-facing answer path has been selected.

Inputs rejected before execution planning (for example an oversized prompt) are not routing events.

## Allowed metadata

The event schema is intentionally small and low-cardinality:

- `schema_version` — telemetry contract version (`pv1d_v1`)
- `route_mode` — deterministic / first-party grounded / general guidance / external research disabled
- `route_reason` — execution-router reason enum
- `audience` — parents / schools / other router audience enum
- `intent` — deterministic source-selector intent enum
- `is_follow_up` — 0/1
- `source_count` — number of approved Tiny Steps source IDs selected, capped at 2
- `primary_source_id` — source-controlled Tiny Steps source ID or `none`
- `source_ids` — up to two source-controlled IDs joined with `|`, or `none`
- `prompt_length_bucket` — coarse size bucket only; never the prompt itself
- `ai_attempted` — 0/1
- `ai_result` — `not_attempted`, `success`, or `fallback`
- `model_lane` — `none`, `grounded_flash_cascade`, or `flash_lite_guidance`
- `response_path` — `deterministic`, `ai`, or `local_fallback`
- `total_latency_ms` — rounded technical latency, capped at 60 seconds

`model_lane` describes the configured execution lane, not an exact provider-attempt trace. The grounded lane currently means the production `gemini-3.5-flash` → `gemini-3.5-flash-lite` availability cascade; general guidance is Flash-Lite only.

## Explicitly forbidden

PV-1D must never send any of the following through the routing event:

- parent question/prompt text
- assistant/Gemini answer text
- raw provider error text or stack traces
- child name
- parent name
- email address
- phone/WhatsApp number
- account, enrolment, attendance, progress, teacher, payment or assessment data
- arbitrary visitor URLs
- generated session IDs, persistent user IDs or fingerprinting fields
- complete conversation history

The telemetry builder is deliberately typed to accept `promptLength` rather than prompt text. Adding conversation content requires an explicit contract/code change and should fail review against the PV-1D tests.

## What this lets us answer

With the single routing event we can measure:

1. What percentage of requests are answered deterministically with zero Gemini calls?
2. What percentage use first-party grounded synthesis vs tool-free general guidance?
3. Which intent/audience combinations are most common?
4. Which approved Tiny Steps sources are selected most often?
5. How often does an AI attempt end in the verified local fallback?
6. What are typical and tail response latencies by route mode and intent?
7. Are new deterministic rules reducing AI usage over time?

## Deliberate boundary: exact provider-attempt diagnostics

This first PV-1D contract records the configured model lane and whether the overall AI call succeeded or fell back locally. It does not yet expose whether a successful grounded answer came from the primary 3.5 Flash attempt or the 3.5 Flash-Lite provider fallback.

If exact provider-attempt diagnostics are needed later, add a separately reviewed low-cardinality field/callback from `askTinyStepsService.ts`. Do not use raw provider errors and do not introduce request/user identifiers merely to correlate events.

## GA4 reporting setup

After deployment, register the low-cardinality string parameters needed for Explorations as event-scoped custom dimensions (for example `route_mode`, `intent`, `audience`, `route_reason`, `model_lane`, `response_path`, `ai_result`, `primary_source_id`, and `prompt_length_bucket`). Numeric parameters such as latency and source count can be used as metrics where appropriate.

The website's existing analytics guard remains authoritative: analytics runs only in production on `tinystepslearning.com` public analytics routes and remains disabled on portal/admin/teacher/parent/kid/private surfaces.

## Acceptance criteria

- one `ask_tiny_steps_route` event per completed accepted request
- zero Gemini calls remain zero-Gemini and are recorded as `ai_attempted = 0`
- AI success is recorded as `response_path = ai`
- verified local fallback after AI failure is recorded as `response_path = local_fallback`
- approved source selection is visible only through source-controlled IDs
- prompt length is bucketed, not stored exactly as content
- no conversation text or raw provider diagnostic can enter the typed payload
- no Firestore or other new database write is added
- regression tests protect both the payload contract and hook integration
