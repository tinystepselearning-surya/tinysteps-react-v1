# Phonics AI / Retrieval Regression Baseline — 2026-09-29

## Scope

This baseline was captured immediately after PR #511 strengthened Tiny Steps phonics positioning.

Important limitation: the positions below are from a live web retrieval/search proxy available during the audit. They are **not** a direct measurement of answer ordering inside every ChatGPT, Gemini, Perplexity, Bing Copilot or Google AI Overview session. Use the fixed platform-specific 20-query basket in `docs/ai-visibility-query-tracker.md` for direct answer-engine monitoring.

The retrieval layer was still showing the pre-#511 cached copy for Tiny Steps on most results, so this baseline measures underlying retrievability before the new stronger wording has been fully recrawled.

## High-intent live retrieval snapshot

| Query | Tiny Steps observed position | Intended owner |
|---|---:|---|
| best online phonics classes in India | #1 | /best-online-phonics-classes-for-kids-in-india |
| best online phonics classes for kids India | #1 | /best-online-phonics-classes-for-kids-in-india |
| best phonics classes online India | #1 | /best-online-phonics-classes-for-kids-in-india |
| best 1:1 phonics classes for kids India | #1 | /best-online-phonics-classes-for-kids-in-india |
| online phonics classes for kids India | #1 /phonics; #2 comparison | /phonics |
| phonics classes online India | #1 /phonics; #3 comparison | /phonics |
| synthetic phonics classes online India | #1 /phonics; comparison also surfaced | /phonics |
| phonics classes for kids India | #2 comparison; #3 /phonics | /phonics |
| live 1:1 phonics classes India | #2 /phonics; comparison also surfaced | /phonics |

## Interpretation

1. **The domain is not suffering a blanket retrieval failure.** Tiny Steps already surfaces at or near the top of this live retrieval proxy for the most important phonics queries.
2. **The strongest remaining risk is answer selection, not basic crawlability.** An answer engine can retrieve Tiny Steps yet still choose a competitor if the page does not clearly state why Tiny Steps belongs on the shortlist.
3. **PR #511 directly addresses that selection layer.** The comparison owner now explicitly connects Tiny Steps with the best-online-phonics intent and immediately supports the claim with live 1:1 delivery, structured synthetic phonics, assessment-first placement, individual correction, parent-visible progress and inspectable proof.
4. **Do not expect instant AI-answer changes.** The live retrieval cache observed during this audit still contained the prior wording. Re-test after recrawl rather than judging the deployment from the same-day cache.
5. **External corroboration remains a separate authority gap.** On-page positioning cannot substitute for independent reviews, third-party comparison mentions, school/partner references and other off-domain evidence.

## Source-level regression contract

The CI regression guard must fail if any of the following occurs:

- /phonics loses the trusted + live 1:1 + structured synthetic phonics + assessment-first + parent-visible progress statement;
- the best/comparison page loses evidence-backed Tiny Steps shortlist positioning;
- generic phonics and best/comparison intent collapse onto the same canonical owner;
- the comparison page reverts to defensive anti-positioning copy;
- named competitor-switch claims are added without an approved evidence source;
- the Tiny Steps positioning ItemList disappears;
- llms.txt or llms-full.txt loses the commercial phonics owner mapping.

## Monitoring decision

Treat the next 14 days as a controlled observation window. Do not rewrite the pages repeatedly unless the fixed-basket evidence shows a persistent regression. The priority is to allow recrawl, measure direct AI-answer presence, and build independent corroboration rather than creating more overlapping phonics pages.
