# TSSA-SCQ Phase 3B — Three partial parent-question answers

**25 October 2026 | small existing-article corrections only | CI and review required before production**

## Baseline

Project #778 Phase 2 audited 40 problem/benchmark question slots: 32 DIRECT, 3 PARTIAL and 5 SUPPORTING. The five supporting Phonics cases received draft PR #783 (unmerged). This Phase 3B PR addresses **only the three partial-content questions**; it does not repeat the Phase 3A changes.

## Edits and educational acceptance

| Parent question | Canonical existing answer owner | Before | Targeted improvement |
| --- | --- | --- | --- |
| Why does a child use too few descriptive words? | `/blog/grammar-creative-writing` | Selective sensory details and precise verbs explained; no explicit retrieval practice for a child who knows words but cannot access them while drafting | Distinguish vocabulary knowledge from retrieval, model one truthful action description, fade a two-choice scaffold; discourage forced 'fancy' words |
| Why does every sentence begin the same way? | `/blog/how-to-teach-paragraph-writing-to-kids` | Cohesion, references and meaningful connectors already explained | Add trees paragraph before/after example and one parent decision question; do not force mechanical transition words |
| Why can a child make sentences but not explain ideas? | `/blog/how-to-improve-sentence-formation-in-kids` | Sentence stability and expansion taught well; explanation organisation is a separate bottleneck | Add point/reason/example on familiar opinion; route to existing conversation skills and speech-structure resources if sentences are already secure |

## Why these are legitimate minimal edits

- Each new paragraph answers a **specific parental bottleneck** already identified in source-backed TSSA-SCQ Phase 2, rather than broadening the site into generic keyword targeting.
- The lessons use child-centred oral reasoning, purposeful word choice and gradual scaffolding; they do not mandate rote templates, adjective counts or one compulsory style.
- Existing age/course positioning, pricing, duration, URLs, canonicals, sitemap, robots, schema, page titles and descriptions are unchanged.
- Newly added supporting links `/blog/conversation-skills-for-kids` and `/blog/speaking-structure` were verified present in the checked-in canonical blog sitemap.
- No claims of higher Google ranking, additional Bing AI citations, improved conversion, clinical diagnosis or guaranteed learning outcomes.

## Release review and QA

1. Rebuild/prerender production-equivalent HTML for the **three existing URLs**; check that new sections are readable and have meaningful heading hierarchy.
2. Confirm original article introductions, sources, FAQ, parent CTA and existing links are retained and the new links point to index-intended guides.
3. Run the existing educational/source accuracy and SEO route/indexability gates; failure blocks merging.
4. Merge only after content review and green CI. Merging content changes triggers a potential public Hosting deploy, unlike previous docs-only PRs.
5. Any post-release provider impact must be evaluated on matched query/page windows, not inferred from the commit itself.

## Release dependencies

PR #782 (small one-word-answer heading) and PR #783 (Phonics handoffs) are independent and were unmerged at the time of this review. Phase 4 Google/Bing external citation selection also remains a separate task. **GA4 analysis is explicitly deferred by project owner**, not a blocker to educational content review.

