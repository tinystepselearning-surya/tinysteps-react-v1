# AI-2E — Ask Tiny Steps model cascade

Reserved design note. Implementation will live on a separate AI-2E branch so prompt-template work (AI-2D) and model-routing work remain independently testable.

Planned order:

1. `gemini-3.7-flash`
2. `gemini-3.5-flash`
3. `gemini-3.5-flash-lite`
4. existing deterministic Tiny Steps fallback

Model fallback is permitted only for model/quota/capacity availability failures. App Check, configuration, invalid requests, grounding failures, and other security or programming errors fail closed instead of silently switching models.
