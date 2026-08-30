# PV-1D GA4 reporting recipe

Use event name `ask_tiny_steps_route`.

Recommended event-scoped custom dimensions:

- `route_mode`
- `route_reason`
- `audience`
- `intent`
- `primary_source_id`
- `prompt_length_bucket`
- `ai_result`
- `model_lane`
- `response_path`

Recommended numeric metrics:

- `total_latency_ms`
- `source_count`
- `ai_attempted`
- `is_follow_up`

Suggested production views:

1. **AI avoidance rate** — percentage of events where `ai_attempted = 0`.
2. **Local fallback rate** — percentage where `response_path = local_fallback`.
3. **Route mix** — event count by `route_mode`, then `intent`.
4. **Audience mix** — event count by `audience` and `intent`.
5. **Grounded-source usage** — count by `primary_source_id` and `source_ids`.
6. **Latency** — average / p95-style exploration by `route_mode` and `response_path`.
7. **Prompt-size pressure** — count and latency by `prompt_length_bucket`.

Do not create custom dimensions for conversation content. Do not add prompt, answer, raw error, email, phone, child data, user IDs, session IDs or visitor URLs to the event.
