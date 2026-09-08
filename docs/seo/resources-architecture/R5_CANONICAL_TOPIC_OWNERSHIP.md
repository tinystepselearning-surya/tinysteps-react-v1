# Resources Architecture — R5 Canonical Topic Ownership

Brick 5 converts the canonical-ownership decisions established through R0–R4 into an executable topic/intent registry.

## Purpose

The Resources layer is an orchestration system. It must help users find the correct existing owner without becoming a second owner for the same search intent.

The machine-readable source of truth is:

- `src/lib/canonicalTopicOwnershipRegistry.js`

The executable audit is:

- `scripts/audit-canonical-topic-ownership.mjs`

The regression contract is:

- `src/tests/seo/resourcesR5CanonicalTopicOwnership.spec.js`

## Ownership model

Every registered topic/intent has:

- a stable topic ID
- one subject family
- one search-intent class
- exactly one `ownerPath`
- one owner role
- an optional Resources hub relationship
- supporting URLs that may link to or reinforce the owner
- optional explicitly forbidden competing Resources owners

A single page may legitimately own more than one closely related intent. The invariant is the reverse: **one registered intent must never have two canonical owners.**

## Subject boundaries

### Phonics & Reading

`/resources/phonics` owns only subject discovery. It may route users to established owners including:

- `/phonics` — live phonics classes
- `/blog/phonics-for-parents-guide` — broad parent phonics guide
- `/blog/what-is-phonics-for-kids` — phonics definition/start-here intent
- `/blog/satpin-phonics-guide` — SATPIN
- `/blog/how-kids-learn-blending` — blending progression
- `/blog/phonics-blending-activities` — blending practice
- `/blog/cvc-words-explained-for-parents` — CVC explanation
- `/blog/child-knows-abc-but-cannot-read` — ABC-known diagnostic
- `/blog/why-child-knows-letter-sounds-but-cannot-read-words` — letter-sounds-known diagnostic
- `/blog/how-to-improve-reading-fluency-in-children` — reading-fluency guide
- `/phonics-fees-india` — fee research
- `/best-online-phonics-classes-for-kids-in-india` — buyer comparison
- existing `/free-*` phonics/reading practice routes — practice ownership

### Grammar & Writing

`/resources/grammar` owns only subject discovery. Established owners remain:

- `/grammar` — live grammar classes
- `/writing-classes-for-kids` — writing-specific classes
- `/blog/grammar-nouns-to-paragraphs` — grammar progression
- `/blog/how-to-improve-sentence-formation-in-kids` — sentence formation
- `/blog/child-knows-grammar-but-makes-mistakes` — grammar transfer/mistakes
- existing grammar/sentence `/free-*` routes — practice ownership

### Speaking & Communication

`/resources/speaking` owns only subject discovery. Established owners remain:

- `/speaking` — live public-speaking programme
- `/spoken-english-classes-for-kids-online` — spoken-English classes
- `/blog/speaking-confidence-seeds` — speaking-confidence progression
- `/blog/child-gives-one-word-answers` — one-word-answer diagnostic
- `/blog/child-understands-english-but-does-not-speak` — understands-but-does-not-speak diagnostic
- `/shy-child-speaking-confidence` — shy-child problem landing
- existing speaking `/free-*` routes — practice ownership

## Cross-ecosystem owners

Brick 5 also preserves these independent jobs:

- `/resources` — Resources gateway
- `/blog` — all editorial guides
- `/parents` — parent-help hub
- `/free-english-games-for-kids` — free-practice ecosystem
- `/for-schools` — B2B school partnership owner
- `/book-demo` — free assessment booking/conversion owner

## CI invariants

The Brick 5 audit fails when:

1. a topic ID is duplicated;
2. two entries claim the same normalized query intent;
3. an owner is a redirect source;
4. a static owner is absent from the public route manifest;
5. a blog owner has no matching source slug;
6. a Resources child route owns anything except approved subject discovery;
7. a commercial or solution-aware intent is assigned to a Resources subject hub;
8. a supporting path is missing, duplicated, redirected, or identical to its owner;
9. a required commercial or ecosystem owner disappears from the registry.

The Vitest contract additionally verifies that R0 commercial query owners, the R4 ownership decisions, and the actual Brick 4 subject-hub links remain aligned.

## Explicit non-goals

Brick 5 does **not**:

- move or redirect existing URLs;
- change page canonicals;
- create new topic pages;
- create programmatic phonics pattern URLs;
- transfer commercial intent to Resources hubs;
- replace the existing blog technical-authority graph;
- implement the semantic internal-link engine (Brick 6).

Granular pattern topics such as short-A CVC, SH, AI, Magic E, AR, OR, etc. remain deliberately unowned as new URLs until the later programmatic-SEO ownership and demand gate approves them.

## Acceptance gate

Brick 5 is complete only when:

- the canonical topic registry passes its structural audit;
- R0–R5 Resources regression tests pass;
- TypeScript passes;
- the full production build/prerender passes;
- rendered Resources audit passes with zero errors;
- sitemap/indexation/SEO smoke guards pass;
- existing R0–R4, GSC, crawl, dead-URL, and repository-wide CI remain green.
