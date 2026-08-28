# Ask Tiny Steps AI-2B — Knowledge Sources Registry

## Purpose

AI-2B creates one explicit registry of public Tiny Steps sources that Gemini may use in later retrieval work. It replaces the old admin mental model of “type some paths and refresh chunks” with a visible source-control layer.

This brick deliberately does **not** change the production Gemini request path. Production continues using the approved deterministic snippets in `useAskTinyStepsChat.ts` until AI-2C is validated.

## Registry contract

`src/config/askTinyStepsKnowledgeSources.ts` records for every approved source:

- stable source id
- public path and canonical URL
- title
- audience: parents, schools, or both
- category
- lifecycle: evergreen, seasonal, or archived
- retrieval policy: always, intent-only, or disabled
- priority (P1 highest)
- whether the source is enabled for future AI retrieval
- whether the source is currently represented in `public/kb.json`
- canonical intents/topics
- tags and safety notes where needed

## Important source policies

- Pricing, demo assessment, courses and core programme pages are P1 sources.
- School/institutional content is intent-only so parent questions do not accidentally receive school-partnership answers.
- Testimonials are intent-only and must never be used to manufacture aggregate ratings or unsupported proof.
- Summer Camp 2026 is archived, P5 and intent-only. It must never surface as a current offer or default recommendation.
- Private dashboard, admin, teacher, parent-account and kids-app routes are not approved public knowledge sources.

## Legacy KB compatibility

`refreshPublicKb` remains available during migration. It reads `public/kb.json`, chunks/tokenizes selected entries and updates `public_kb_chunks`.

The admin UI now exposes legacy refresh only for registry sources marked `legacyKbAvailable`. The current curated `kb.json` set is 17 sources.

`public_kb_chunks` is not the target architecture and must not be expanded into a new primary RAG store merely because Gemini is now available.

## AI-2C handoff

AI-2C should consume this registry for smart source selection and Gemini URL Context. The expected flow is:

1. classify the parent/school question
2. select a small number of enabled, audience-compatible, lifecycle-safe sources
3. prefer P1/P2 canonical sources
4. use intent-only sources only when the question matches
5. use archived sources only for explicit historical/seasonal questions
6. provide the selected canonical URLs to Gemini
7. keep the current deterministic snippet path as rollback/fallback during evaluation

Only after AI-2C/AI-2G show better grounded-answer quality should legacy chunk retrieval be retired.
