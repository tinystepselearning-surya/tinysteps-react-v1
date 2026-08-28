# AI-2E — Ask Tiny Steps model cascade

## Goal

Prefer the strongest stable no-billing Flash model while retaining graceful degradation when a model-specific quota, capacity, or availability issue occurs.

Model order:

1. `gemini-3.7-flash`
2. `gemini-3.5-flash`
3. `gemini-3.5-flash-lite`
4. existing deterministic Tiny Steps fallback in the chat hook

## Failover policy

The client may advance to the next Gemini model only for a narrow class of provider availability failures:

- HTTP 429 quota / resource exhaustion / rate-limit / model-capacity responses
- HTTP 503 service unavailable / overload responses
- clearly model-specific unavailability or retirement/not-found errors

Do **not** fail over for:

- App Check / permission / authentication failures
- invalid Firebase configuration
- invalid request or malformed prompt errors
- safety or policy rejections
- programming errors
- URL Context grounding failures
- invalid source selection

Those fail closed so security and application defects are not hidden by model switching.

## Grounding invariants

Every model attempt receives the same bounded conversation history and the same application-selected approved Tiny Steps URL Context sources. A response is accepted only if the primary approved source reports successful URL retrieval. Model switching must never widen the URL allowlist or bypass the AI-2C grounding gate.

## Privacy and observability

No conversation text is persisted for model routing. Firebase AI Monitoring provides model-level traces. Automated tests assert the selected model sequence and fallback behavior without adding anonymous conversation logging.

## Current Firebase model status

As of 28 Aug 2026, Firebase AI Logic lists `gemini-3.7-flash`, `gemini-3.5-flash`, and `gemini-3.5-flash-lite` as supported stable Gemini models for the Gemini Developer API. The Flash and Flash-Lite models do not require Blaze solely for model access.
