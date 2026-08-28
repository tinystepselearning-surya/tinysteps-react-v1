# AI-2E validation checklist

Before merge:

- CI/typecheck/lint/unit suite green.
- Primary live request shows `gemini-3.7-flash` in Firebase AI Monitoring.
- URL Context grounding remains successful on the selected Tiny Steps source.
- Visitor-supplied URL guard still bypasses Gemini entirely.
- Synthetic tests prove 429/503 fail over in order to 3.5 Flash and then Flash-Lite.
- 403/App Check, 400/invalid request, and primary URL retrieval failures do not switch models.
- No conversation logging or new Firestore writes are introduced.
