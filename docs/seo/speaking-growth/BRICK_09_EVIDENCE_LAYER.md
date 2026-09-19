# Brick 09 — Speaking Evidence Layer

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — RE-AUDITED**  
Production deployment: **NO**

## Purpose

Brick 9 gives the canonical `/speaking` owner a bounded evidence layer that helps parents distinguish:

- observable teaching evidence;
- documented programme delivery;
- progress methodology;
- academic ownership;
- programme architecture;
- first-party parent feedback.

The brick is deliberately **evidence binding**, not evidence invention.

It does not create new testimonials, fabricate reviews, create outcome statistics, introduce a new trust URL, or turn individual family feedback into universal claims.

## Upstream evidence governance

Brick 9 builds on the frozen Commercial C8 trust/evidence architecture.

Required existing C8 surfaces:

- `/class-samples`
- `/speaking`
- `/team`
- `/curriculum`
- `/testimonials`

Brick 7 contributes one additional speaking-specific evidence method:

- `/speaking-progress-framework`

Brick 9 does not replace either system.

## Central evidence contract

New source:

`src/lib/speakingEvidenceLayer.ts`

Revision:

`2026-09-19-b9-v2`

The contract contains six evidence categories.

### 1. Observable classroom evidence

Source:

`/class-samples`

Can support:

- live teacher-guided class structure;
- child participation;
- guided correction and retry;
- observable teaching approach before purchase.

Cannot prove:

- that every class will look identical;
- that every child will achieve the same result;
- that a specific Speaking sample is always available.

### 2. Programme-delivery evidence

Source:

`/speaking#teacher-delivery`

Can support:

- teacher-guided speaking practice;
- responsive prompting and feedback;
- gradual reduction of support;
- observable criteria such as idea organisation and prompting need.

Cannot prove:

- a fixed improvement timeline;
- one routine fits every child;
- a guaranteed confidence or fluency result.

### 3. Progress-method evidence

Source:

`/speaking-progress-framework`

Can support:

- the ten observable Brick 7 dimensions;
- the four support/independence observation bands;
- fresh-task transfer;
- same-child comparison over time.

Cannot prove:

- a developmental-age score;
- an IQ-style result or diagnosis;
- a single universal speaking percentage.

### 4. Academic-ownership evidence

Source:

`/team`

Can support:

- named academic ownership;
- documented curriculum-design responsibility;
- teacher-guidance process;
- observation-informed instructional adjustment.

Cannot prove:

- external accreditation;
- third-party endorsement;
- unsupported credentials.

### 5. Programme-architecture evidence

Source:

`/curriculum`

Can support:

- structured programme progression;
- prerequisite-aware teaching;
- connection between speaking, grammar, reading and language skills.

Cannot prove:

- identical sequencing for every child;
- placement determined by age alone;
- a guaranteed completion timeline.

### 6. Parent-feedback evidence

Source:

`/testimonials`

Can support:

- reported first-party parent experience;
- themes families noticed;
- decision context alongside other evidence.

Cannot prove:

- the same outcome for another child;
- an independently verified clinical or academic effect;
- an aggregate satisfaction percentage.

## Claim-safety contract

Brick 9 directly inherits and checks the existing proof/outcome policies:

- approved evidence is required before aggregate-rating claims;
- generated fallback testimonials are not allowed;
- unsupported satisfaction percentages are not allowed;
- universal guaranteed timelines are not allowed;
- parent feedback does not represent a universal outcome;
- fabricated review claims are not allowed;
- stronger progress evidence is independent transfer to fresh, appropriately matched examples.

If those restrictive boundaries are loosened upstream, the Brick 9 contract fails closed.

## Live `/speaking` integration

The old two-card generic trust block was replaced with one compact six-source evidence section:

**What you can verify — and what each source does not prove**

Each evidence card shows:

- evidence source;
- parent-facing summary;
- examples of what the source supports;
- one explicit proof boundary;
- link to inspect the source.

A visible global boundary states that:

- parent feedback is individual family experience;
- class samples show teaching approach;
- progress bands are educational observation tools;
- none is a clinical assessment, universal outcome guarantee, or independently verified aggregate rating.

This keeps trust information compact while making evidence provenance explicit.

## Structured data

`/speaking` now includes a bounded evidence-source `ItemList`:

`#evidence-sources`

It contains the six evidence surfaces as WebPage items.

Each description includes an explicit evidence boundary.

Brick 9 does **not** add:

- `Review` schema;
- `AggregateRating` schema;
- rating values;
- synthetic review counts.

## Route and ownership boundary

New public URLs: **ZERO**

New canonical owners: **ZERO**

No `/speaking-evidence` or `/speaking-proof` route exists.

`/speaking` remains the high-commercial Public Speaking & Communication owner.

Existing class samples, testimonials, team, curriculum and progress framework retain their own established responsibilities.

## Sitemap freshness

The existing `/speaking` sitemap last-modified source set now also watches:

`src/lib/speakingEvidenceLayer.ts`

This means future evidence-contract changes update the existing Speaking owner freshness signal without creating another sitemap URL.

## Regression guard

New dedicated test:

`src/tests/seo/speakingGrowthBrick9.spec.ts`

It contains eleven structural regression cases covering:

- dependency on frozen Commercial C8;
- six evidence categories;
- explicit support and proof-boundary requirements;
- restrictive testimonial/outcome policy;
- observable class-sample evidence;
- Brick 7 progress-method evidence;
- academic ownership and curriculum architecture;
- bounded first-party parent feedback;
- live `/speaking` evidence integration;
- evidence ItemList without review/rating inflation;
- no new route and correct sitemap freshness.

## Initial structural verification

Corrected source-level matrix:

- Evidence contract: **12 / 12**
- Claim safety: **6 / 6**
- Existing evidence sources: **9 / 9**
- Live page integration: **7 / 7**
- Structured data: **5 / 5**
- Route protection: **2 / 2**
- Sitemap freshness: **2 / 2**
- Regression-spec structure: **10 / 10**

**Total: 53 / 53 passed.**

The first mechanical matrix reported 52/53 only because the audit expected ten `it(...)` blocks while the completed regression file contains eleven. The implementation itself did not fail that check.

## Protected-surface verification

Compared with Brick 8 re-audited head:

`8f0df839477fc33307a7d792aa958deea8e5ff4e`

The following eighteen upstream/operational files remain byte-for-byte unchanged:

- Brick 7 progress framework source;
- Brick 7 framework page;
- Brick 8 knowledge-cluster source;
- Brick 8 Speaking resources hub;
- Brick 8 regression test;
- demo assessment page;
- parent progress guide;
- frozen Commercial C8 evidence layer;
- class samples page;
- testimonials page;
- team academic-system page;
- curriculum page;
- application routes;
- public route manifest;
- operational progress skills;
- parent dashboard;
- teacher progress editor;
- teacher progress save backend.

**Protection result: 18 / 18 unchanged.**

## Brick 9 implementation delta

Before documentation, the Brick 9 implementation delta contains exactly four intended files:

1. `src/lib/speakingEvidenceLayer.ts`
2. `src/pages/speaking.tsx`
3. `scripts/generate-sitemaps.js`
4. `src/tests/seo/speakingGrowthBrick9.spec.ts`

No attendance, scheduling, finance, authentication, teacher dashboard, parent dashboard or Firestore mutation logic is changed.

## Branch state

At the initial Brick 9 verification checkpoint:

- synchronized `main`: `d0b46a251f33c0b15015d3b516993a0a0f44cb65`
- branch behind `main`: **0**
- production merge: **NO**
- production deployment: **NO**

## Re-audit findings

Brick 9 was independently re-audited before Brick 10.

The re-audit found three concrete hardening opportunities and one test-design risk.

### 1. Evidence-record → verified-source binding — fixed

The initial Brick 9 contract checked that the expected Commercial C8 paths existed, but the list of expected paths was separate from the individual evidence records.

That allowed a theoretical future drift where an evidence record could point to a different source while the independent required-path list still passed.

Revision `2026-09-19-b9-v2` now:

- derives the required C8 paths directly from non-progress evidence records;
- verifies every non-progress evidence record's `sourcePath` against the frozen C8 trust-surface set;
- binds the progress-method record specifically to the Brick 7 Speaking Progress Framework;
- requires UI navigation targets to remain on the canonical source or a fragment of that source;
- requires canonical evidence source paths to remain unique.

This converts provenance from a documentation convention into a runtime contract.

### 2. Evidence structured-data canonicalization — fixed

The initial evidence `ItemList` used each card's UI navigation target.

For programme-delivery evidence that target is:

`/speaking#teacher-delivery`

The re-audit separated navigation from canonical evidence identity:

- visible card navigation still uses `item.path`, so parents land on the exact section;
- structured data now uses `item.sourcePath`, so the evidence item resolves to the canonical `/speaking` WebPage rather than treating an anchor fragment as a separate page identity.

All six canonical evidence sources were independently verified as:

- present in the SEO registry;
- self-canonical;
- indexable;
- present in `sitemap-static.xml`.

### 3. Local testimonial outcome boundary — fixed

The existing Speaking page had a later **Parent evidence** testimonial section with no adjacent outcome disclaimer.

Although Brick 9's main evidence section already explained testimonial limitations, the re-audit judged that relying on a distant disclaimer was weaker than keeping the boundary next to the quoted parent feedback.

The Speaking testimonial block now states that:

- the comments are curated first-party comments from individual families;
- they are not a promise that another child will have the same result;
- parents should review them together with class samples, curriculum, the Speaking Progress Framework and their child's own assessment.

No testimonial text, testimonial dataset or upstream testimonials page was modified.

### 4. Strict-TypeScript regression-test risk — removed

The first re-audit draft imported `ROUTE_SEO_REGISTRY` and dynamically indexed it by a string path.

The project `tsconfig.json` uses `"strict": true`, and there was no existing precedent for that dynamic registry-index pattern.

To avoid introducing a possible TypeScript-only CI failure, the test now reads `routeSeoRegistry.js` as source text and verifies each route block's canonical and robots contract directly.

This keeps the re-audit assertion strong without widening type assumptions.

## Independent re-audit matrix

Corrected source-level re-audit:

- Evidence contract & runtime provenance guards: **16 / 16**
- Evidence-source provenance, canonical/indexability/sitemap checks: **29 / 29**
- Claim-safety boundaries: **9 / 9**
- Live page evidence presentation: **7 / 7**
- Structured-data boundaries: **8 / 8**
- Route protection: **3 / 3**
- Sitemap freshness: **2 / 2**
- Regression-spec hardening: **8 / 8**

**Source-level total: 82 / 82 passed.**

## Protected-surface SHA verification

Compared with the Brick 9 structural-close head:

`075896a2d076f6925b105094f2533d1ace278e0e`

The following eighteen upstream/operational files remain byte-for-byte unchanged:

- Brick 7 progress framework source;
- Brick 7 progress framework page;
- Brick 8 knowledge-cluster source;
- Brick 8 Speaking resources hub;
- Brick 8 regression test;
- demo assessment page;
- parent progress guide;
- Commercial C8 trust/evidence source;
- class samples page;
- testimonials page;
- team academic-system sections;
- curriculum page;
- application routes;
- public route manifest;
- operational progress skills;
- parent dashboard;
- teacher progress editor;
- teacher progress save backend.

**Protection total: 18 / 18 unchanged.**

## Re-audit implementation delta

Before documentation updates, the Brick 9 re-audit changed exactly three files:

1. `src/lib/speakingEvidenceLayer.ts`
2. `src/pages/speaking.tsx`
3. `src/tests/seo/speakingGrowthBrick9.spec.ts`

No attendance, scheduling, finance, authentication, Firestore mutation, teacher-dashboard or parent-dashboard implementation changed.

## Executable-test limitation

No feature-branch GitHub Actions run is claimed for this Brick 9 head.

This structural close therefore does not claim:

- full Vitest execution;
- TypeScript build execution;
- production build/prerender execution;
- rendered browser QA.

Those executable gates remain mandatory at the final Bricks 1–13 integration gate.

## Exit decision

Brick 9 is structurally complete when Speaking evidence is:

- tied to existing verifiable sources;
- explicit about what each source can and cannot support;
- compatible with Brick 7 measurement and Commercial C8 governance;
- visible but compact on the canonical commercial owner;
- free of fabricated proof, rating inflation and guaranteed-outcome language;
- implemented without a duplicate evidence URL.

That condition is satisfied on the isolated feature branch.

**Brick 9 status: COMPLETE — RE-AUDITED.**
