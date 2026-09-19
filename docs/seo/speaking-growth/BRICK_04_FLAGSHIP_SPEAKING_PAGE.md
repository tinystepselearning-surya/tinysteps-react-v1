# Brick 04 — Flagship /speaking Money Page

Build date: 2026-09-19 IST  
Branch: feature/speaking-seo-geo-growth  
Status: COMPLETE — structurally verified on branch; not deployed.

## 1. Purpose

Brick 4 strengthens `/speaking` as the single flagship Public Speaking + general Communication Skills commercial owner defined by Bricks 1–3.

The page already had substantial SEO content. Brick 4 therefore does **not** replace the page with a new template and does not create another landing URL. It reorganises and strengthens the parent decision journey while preserving the page's existing canonical owner, title and meta-description control.

## 2. Protected SEO control

The current control remains unchanged:

Title:
`Public Speaking & Communication Classes for Kids | Tiny Steps`

Description:
`Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.`

Canonical:
`/speaking`

This is deliberate. The repository Commercial C4 experiment policy freezes the current snippet until fresh post-change evidence satisfies its measurement gate. Brick 4 changes body content and conversion architecture, not the title/meta experiment.

## 3. Entry baseline

Brick 1 exact 90-day baseline for `/speaking`:
- clicks: 66;
- impressions: 2,911;
- CTR: 2.27%;
- average position: 8.84.

Important commercial queries remained weaker than the page average, including:
- public speaking classes for kids;
- public speaking for kids;
- public speaking classes for kids online India;
- online public speaking classes for kids;
- public speaking course/courses for kids.

Brick 4 is designed to strengthen the owner page itself rather than create query-variant pages.

## 4. Directional market benchmark

A current 2026-09-19 SERP review of major Public Speaking / Communication competitors showed a consistent commercial pattern:
- clear "who should join" problem framing;
- live/personalised practice;
- visible trial or assessment CTA;
- curriculum/outcome progression;
- teacher guidance;
- progress visibility;
- parent proof.

Brick 4 uses those only as market signals. Tiny Steps copy remains constrained to its own verified facts, programmes, class format, approved testimonials and existing support pages.

## 5. Parent diagnostic rebuilt

The earlier four-category programme selector was replaced with a more concrete six-symptom diagnostic:

1. one-word / very short everyday answers → Spoken English may be the first route;
2. inaccurate/incomplete sentence formation → Grammar may need to support speaking;
3. adequate language but hesitation in class/groups → specialist Confidence Building may fit;
4. ideas present but answers poorly organised → core Speaking & Communication;
5. storytelling/show-and-tell/presentation need → core Public Speaking & Communication;
6. longer speeches/opinions/presentations/guided debate → Advanced Public Speaking detail route.

The page explicitly states that these are starting signs and the free 1:1 assessment confirms the pathway.

This keeps programme boundaries clear while letting the flagship page function as a parent decision surface rather than a generic marketing page.

## 6. Speaking pathway clarified

Brick 4 separates:

### Optional supporting foundations
Only when assessment shows they are needed:
- Grammar & sentence formation;
- everyday conversation & fluency / Spoken English.

### Speaking progression
- complete responses;
- organise ideas;
- storytelling;
- clear expression;
- presentations;
- advanced public speaking.

This avoids implying that every child must start with Grammar or Spoken English while still showing how the skills connect.

## 7. Real class experience added

A new class-experience section explains the live teaching loop:

1. focused speaking task;
2. guided attempt and feedback;
3. retry with less support.

The section links to:
- `/class-samples` for parents who want to inspect the teaching style;
- `/book-demo` for child-specific assessment.

No new class-sample content system is created. Brick 4 reuses the existing canonical class-samples surface.

## 8. Teacher and academic-quality evidence added

The existing `ResponsiveTeachingSection` remains the programme-specific delivery explanation but has been moved later in the decision journey, after parents understand the programme and class experience.

A new two-card evidence layer links to:
- `/team` — founder-led academic system, curriculum/teacher development and quality support;
- `/why-tiny-steps` — broader learning approach and parent decision evidence.

Brick 4 does not invent teacher certifications, guaranteed outcomes or unsupported credentials.

## 9. Parent evidence repositioned

The Speaking testimonials component now appears in its own evidence section before the FAQ, instead of being buried inside the final CTA.

Wording is deliberately:
`Parent feedback from speaking families`

This wording matches the actual static testimonial catalogue used by TestimonialSnippets, whose source is `Tiny Steps parent feedback`. The component does not itself prove Firestore approval status, so Brick 4 does not label this static evidence as "approved" or "verified".

The final CTA is now cleaner and assessment-focused.

## 10. FAQ strengthened

A new FAQ explains that parents can view the class-samples page before enrolling, while clarifying that samples demonstrate teaching style and the free 1:1 assessment determines the individual child's starting point.

The existing FAQ structured data automatically includes this new item through the existing FAQ schema generator.

## 11. What Brick 4 did not change

Brick 4 creates:
- zero new commercial URLs;
- zero country/city/near-me pages;
- zero AI-prompt pages;
- zero new pricing owners;
- zero new demo owners;
- zero title/meta changes;
- zero canonical changes;
- zero robots changes;
- zero redirect changes;
- zero sitemap changes.

It also does not change:
- Spoken English page content;
- Confidence page content;
- course-detail page content;
- pricing;
- enrolment logic;
- attendance/payments/scheduling;
- dashboard or game code.

## 12. Regression guard

New test:

`src/tests/seo/speakingGrowthBrick4.spec.ts`

It protects:
- the frozen SEO title/meta control;
- canonical `/speaking`;
- exactly one H1;
- no legacy Public-Speaking URL resurrection;
- correct diagnostic handoffs;
- foundation-vs-speaking progression;
- class-sample link;
- teacher-system link;
- progress section;
- one parent-evidence component;
- assessment-first placement language.

## 13. Structural verification

Source-level verification passed for:
- one H1;
- canonical owner `/speaking`;
- title/meta control unchanged;
- Commercial C4 control unchanged;
- retired legacy URL absent from the page;
- diagnostic heading present;
- canonical handoffs to Spoken English, Grammar, Confidence and Advanced Speaking;
- class-samples evidence present;
- team/academic-system evidence present;
- exactly one testimonial component;
- exactly one responsive-teaching component;
- FAQ class-sample item present;
- final assessment CTA retained.

## 14. Test-execution condition

The full repository npm/Vitest/build suite still cannot be claimed as executed in this environment because the branch has no attached CI run and the prior checkout attempt could not reach GitHub.

The new regression test is committed and must execute in the final integration test pass before merge.

## 15. Brick 4 exit decision

Brick 4 is complete on the feature branch when:
1. `/speaking` remains the sole generic Public Speaking + Communication owner;
2. metadata/canonical control is preserved;
3. parent diagnostic clearly routes adjacent needs;
4. Speaking progression is explicit without forcing unnecessary prerequisite courses;
5. parents can inspect class experience;
6. teacher/academic-quality evidence is linked;
7. course levels remain clear;
8. progress and source-supported parent feedback appear before FAQ/final CTA;
9. no new competing commercial page is created;
10. regression guard is committed.

All ten conditions are satisfied structurally on the isolated branch.

## 16. 2026-09-19 pre-Brick-5 re-audit

Brick 4 was re-audited before opening Brick 5.

### A. Commercial-intent boundary correction

The first Brick 4 pass retained an older Quick Answer sentence that said Public Speaking should move children from short answers/hesitation to complete sentences.

That wording blurred the Brick 2 boundary because one-word / very short everyday-answer and sentence-formation problems can belong primarily to Spoken English or Grammar.

The Quick Answer now states that Public Speaking is for children who can already communicate at a basic level and need:
- structured responses;
- idea organisation;
- storytelling;
- show-and-tell;
- presentations;
- audience-facing speaking.

It explicitly says that one-word everyday answers or sentence-formation difficulty may route to Spoken English or Grammar before or alongside Speaking.

Two supporting bullets were also narrowed:
- `Sentence expansion practice` → `Idea organisation practice`;
- `Reading aloud expression` → `Voice clarity and expression`.

### B. Parent-proof wording correction

`TestimonialSnippets` renders the static testimonial catalogue in `src/lib/staticTestimonials.ts`.

That catalogue is labelled:
`Tiny Steps parent feedback`

It does not expose an approval-state field in the component path used by `/speaking`.

Therefore the Brick 4 heading was corrected from:
`Approved parent feedback from speaking families`

to:
`Parent feedback from speaking families`

The regression test now blocks the stronger unsupported wording.

### C. Named course-detail navigation

The flagship page now links the named level cards directly to:
- `/courses/public-speaking-foundations`;
- `/courses/public-speaking-excellence`.

This does not give those pages generic acquisition ownership. It is a named-detail handoff from the canonical `/speaking` owner.

### D. Comparison-table accessibility

The "What parents should compare" table now has:
- an `sr-only` caption describing the table;
- `scope="col"` on both column headers;
- the existing horizontal-overflow wrapper retained for small screens.

### E. Mobile/layout re-audit

Static responsive review confirmed:
- diagnostic grid collapses to one column before `md`;
- class-experience cards collapse to one column before `md`;
- academic-quality cards collapse to one column before `md`;
- primary CTA controls use 44–48px minimum heights;
- the wide comparison table is intentionally wrapped in horizontal overflow;
- no Brick 4 addition introduces an unprotected fixed-width mobile surface.

### F. Internal-link integrity

All unique Brick 4 destinations were checked against the route manifest/router and resolved:

- `/`
- `/curriculum`
- `/book-demo`
- `/spoken-english-classes-for-kids-online`
- `/confidence-building-program-kids`
- `/grammar`
- `/courses/public-speaking-foundations`
- `/courses/public-speaking-excellence`
- `/pricing`
- `/class-samples`
- `/team`
- `/why-tiny-steps`
- `/parents/tracking-progress`
- `/resources/speaking`

### G. Structured-data handoff — Brick 6

Current `/speaking` emits a schema.org `Course` entity plus a pathway `ItemList`.

Current Google Search Central Course-list documentation requires a course-list implementation with at least three courses for Course-list rich-result eligibility.

Tiny Steps currently has two named Public Speaking levels.

Brick 4 therefore does **not** invent a third course or restructure programme schema simply to target a rich result. Brick 6 must review the programme-architecture schema deliberately and distinguish:
- semantic entity markup;
- named course-detail entities;
- Google Course-list enhancement eligibility.

No Course-list rich-result eligibility is claimed by Brick 4.

### H. Structured-data handoff — Brick 12

The FAQ remains visible on-page and continues to use the existing schema.org FAQ generator for semantic consistency.

Brick 4 does not treat FAQ markup as a guaranteed Google rich-result mechanism. Brick 12 should review current answer-engine / supported-search-markup behavior when implementing AEO/GEO extraction.

### I. Expanded invariant gate

The final re-audit matrix passed all tested invariants, including:
- one H1;
- canonical `/speaking`;
- frozen title/meta and Commercial C4 control;
- zero retired legacy URL references;
- diagnostic ownership boundaries;
- correct Spoken-English / Grammar / Confidence handoffs;
- named Basic and Advanced detail links;
- class-sample and team evidence;
- source-supported parent feedback wording;
- exactly one testimonial component;
- exactly one ResponsiveTeachingSection;
- assessment-first language;
- comparison-table accessibility;
- mobile overflow protection;
- FAQ/sample evidence;
- final assessment CTA;
- every internal link resolving.

### J. Branch scope and executable-test state

Brick 4 differs from the Brick 3 endpoint only in:
- `src/pages/speaking.tsx`;
- `src/tests/seo/speakingGrowthBrick4.spec.ts`;
- `docs/seo/speaking-growth/BRICK_04_FLAGSHIP_SPEAKING_PAGE.md`;
- `docs/seo/speaking-growth/BRICK_STATUS.md`.

At the re-audit gate, the feature branch is 0 commits behind `main`.

No GitHub Actions workflow run is attached to the latest Brick 4 commit, so the executable npm/Vitest/build suite is still not claimed as passed. That remains mandatory at final integration.

## 17. Re-audit decision

Brick 4 is **COMPLETE — RE-AUDITED** on the isolated branch.

The page now has:
- tighter commercial-intent boundaries;
- evidence wording matched to the actual source;
- named level-detail navigation;
- improved table accessibility;
- clean mobile structure;
- preserved SEO control;
- explicit schema handoffs instead of speculative markup expansion.

It remains undeployed and unmerged to main.
