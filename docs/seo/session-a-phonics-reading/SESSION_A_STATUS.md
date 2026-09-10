# Session A — Phonics & Reading

**Branch:** `session-a-phonics-reading-ph0-ph7`  
**Baseline main SHA:** `eb97f3777039ea754b2c6e778cdebb9f3b5f4d22`  
**Mission:** Complete the structured literacy knowledge/practice system without mass-producing thin word or phonics-pattern pages.

## Final state

**PHONICS & READING = FROZEN**

Session A is complete on the isolated branch. PH0–PH7 are closed, the closure gate is green, and the exact validated implementation head before this status-only freeze commit was `973756d193c31e3c7f6c8e9ef053bc8e72968c03`.

## Brick status

| Brick | Mission | Status |
| --- | --- | --- |
| PH0 | Current-state & gap audit | COMPLETE |
| PH1 | Phonics knowledge model | COMPLETE |
| PH2 | Audio & word dataset | COMPLETE |
| PH3 | Core pattern resource coverage | COMPLETE |
| PH4 | Parent problem coverage | COMPLETE |
| PH5 | Interactive practice layer | COMPLETE |
| PH6 | Semantic journeys | COMPLETE |
| PH7 | Closure audit | COMPLETE |

## Validation evidence

The exact implementation head `973756d193c31e3c7f6c8e9ef053bc8e72968c03` passed all PR workflows required for Session A closure:

- CI/CD Deploy to Firebase — success; deploy job correctly skipped on pull request
- Resources R8 Phonics Knowledge Dataset — success
- Resources R13 Word Sound Utility Engine — success
- SEO Crawl & Discovery Guard — success
- SEO Dead URL Guard — success
- GSC Content Quality & Consolidation Guard — success
- GSC Revalidation & Submission Plan — success

Repository-wide CI also passed Cloud Functions build/tests, Firestore rules tests, lead-deduplication emulator tests, lint, TypeScript, complete unit tests with coverage, production-build configuration validation, app build, and SEO smoke.

## Non-negotiable guardrails

1. `main` is not changed during Session A implementation.
2. `/phonics` remains the commercial programme owner.
3. `/reading-classes-for-kids` remains the broad reading-support/commercial-diagnostic route.
4. `/resources/phonics` remains the informational/practice subject hub.
5. Existing high-performing or established canonical owners are protected.
6. No automatic publication of one URL per word, phoneme, grapheme, or microscopic spelling variant.
7. Machine-readable knowledge and practice data must be reusable by public resources without forcing new indexable routes.
8. Audio may remain `pending` where teacher recordings are not committed; missing recordings must not require code restructuring.
9. Every new public owner requires explicit canonical ownership and cannibalisation review.
10. Session A is frozen only after the exact branch head passes the complete required test/build/render/SEO audit suite.

## Merge rule

Session A now satisfies the PH0–PH7 completion and freeze requirements. PR #287 may be reviewed and merged to `main` as one unit when explicitly authorized. Until then, keep the branch isolated and do not merge it.
