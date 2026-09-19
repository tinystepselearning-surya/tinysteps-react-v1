# Brick 12 — GEO / AEO / AI Visibility Layer

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — STRUCTURALLY VERIFIED**  
Production deployment: **NO**

## Purpose

Brick 12 makes the Speaking authority system established in Bricks 4–11 easier for search engines and answer systems to retrieve, distinguish and cite.

It does not create AI-prompt pages, ChatGPT pages, Gemini pages, Perplexity pages, duplicate commercial owners or unsupported rich-result claims.

## Existing technical GEO foundation reused

The repository already had a mature site-wide technical GEO/AEO foundation:

- `public/llms.txt`;
- `public/llms-full.txt`;
- AI/search crawler rules in `robots.txt`;
- Organization, WebSite, WebPage, FAQ and BlogPosting schema;
- resource-hub breadcrumbs and speakable Quick Answers;
- RSS/feed discovery;
- sitemap generation;
- prerendered public HTML;
- blog technical-authority metadata.

Brick 12 extends these systems rather than inventing parallel infrastructure.

## Preflight cross-brick correction

During Brick 12 preflight, the current `/speaking` source was found to be using `item.path` again inside the Brick 9 evidence `ItemList`, while `speakingGrowthBrick9.spec.ts` correctly required canonical `item.sourcePath`.

This would have failed the executable Brick 9 regression gate.

The invariant was restored before Brick 12 changes:

- visible evidence-card navigation can still use section-fragment paths;
- evidence structured data uses canonical `sourcePath`.

Brick 9 remains closed after restoration of its documented contract.

## Central AI visibility contract

New source:

`src/lib/speakingAiVisibility.ts`

Revision:

`2026-09-19-b12-v1`

The contract freezes **13 primary answer owners** covering:

1. Public Speaking programme — `/speaking`
2. Spoken English programme
3. Confidence Building programme
4. Public Speaking Foundations course
5. Public Speaking Excellence course
6. Speaking Progress Framework
7. Speaking resource-discovery hub
8. Free assessment/demo owner
9. Pricing owner
10. Class-demonstration evidence
11. Academic-system authority
12. Curriculum authority
13. Parent-feedback evidence

It also reuses:

- all **14** frozen Brick 8 knowledge URLs;
- all **6** Brick 9 canonical evidence sources;
- Brick 11 entity-disambiguation keys.

## AI expansion policy

Brick 12 explicitly rejects:

- AI-prompt pages;
- engine-specific commercial pages;
- a duplicate Speaking commercial owner;
- assumed FAQ rich-result treatment;
- synthetic video evidence;
- fabricated external authority.

No URL such as `/speaking-ai`, `/speaking-chatgpt`, `/speaking-gemini` or `/speaking-perplexity` is created.

## BlogPosting authority expansion

Before Brick 12, the shared BlogPosting technical-authority registry explicitly represented only three Speaking owners:

- Speaking Confidence;
- Understands English but Does Not Speak;
- One-Word Answers.

Brick 8 had already frozen a fourteen-URL Speaking knowledge corpus.

Brick 12 now gives **all fourteen** established Speaking knowledge URLs explicit `Speaking & Communication` BlogPosting authority topics.

The added topic graph covers:

- conversation and vocabulary transfer;
- classroom communication;
- storytelling and retelling;
- speech organisation;
- discussion and reasoning;
- delivery;
- visual aids;
- rehearsal/video feedback;
- competition preparation;
- familiar-audience practice;
- Story Cards / grammar-to-speaking transfer.

This changes machine-readable topical clarity only. Canonicals, robots, URLs and commercial ownership are unchanged.

## LLM directory expansion

### `public/llms.txt`

The older three-guide Speaking section was expanded to include:

- canonical commercial and decision owners;
- two published Public Speaking course levels;
- Speaking Progress Framework;
- resource hub;
- all fourteen knowledge owners;
- class samples, team, curriculum and testimonials evidence;
- entity-disambiguation guidance;
- protected Speaking intent boundaries.

### `public/llms-full.txt`

The file still preserves the original 51 quality-reviewed editorial list.

A separate **Expanded Speaking & Communication Authority Graph** now adds the later frozen Speaking architecture without pretending those later URLs are part of the original 51-item count.

## Intent boundaries for answer systems

Brick 12 explicitly tells answer systems not to collapse:

- Public Speaking and Spoken English;
- response initiation/hesitation and one-word response expansion;
- grammar/sentence-control problems and Public Speaking structure;
- confidence problems and language/response problems;
- educational progress observation and diagnosis/standardised testing;
- editorial skill guides and commercial class intent;
- bounded evidence and guaranteed outcomes.

## Speakable Quick Answers

### `/speaking`

The existing visible Quick Answer now has stable CSS selectors and is referenced by a `SpeakableSpecification` on the WebPage schema.

### `/speaking-progress-framework`

Its visible Quick Answer now has its own stable selectors and `SpeakableSpecification`.

### `/resources/speaking`

The existing resource-hub speakable implementation remains unchanged and protected.

Brick 12 does not claim that speakable markup guarantees any search or AI treatment.

## AI crawler verification

Existing `robots.txt` continues to allow public content for major discovery/search user agents while repeating private-route disallows.

The Brick 12 guard checks:

- OAI-SearchBot;
- ChatGPT-User;
- Claude-SearchBot;
- PerplexityBot;
- GPTBot;
- ClaudeBot;
- Google-Extended;
- Applebot-Extended.

It also protects private paths including admin, teacher, parent, kids and private routes.

OpenAI publisher guidance rechecked on 2026-09-19 states that sites intended for ChatGPT Search inclusion should not block OAI-SearchBot. Search placement is not guaranteed.

Reference:
https://help.openai.com/en/articles/12627856-publishers-and-developers-faq

## Brick 13 attribution handoff

Current OpenAI publisher guidance states that ChatGPT search referral URLs include:

`utm_source=chatgpt.com`

Brick 13 should use that observable referral signal when separating ChatGPT-origin traffic from Google Organic, direct, referral and campaign traffic.

This does not imply every AI-origin session will always be attributable from one parameter; attribution rules remain evidence-based.

## Structural verification

Brick 12 source-level matrix:

- AI contract: **8 / 8**
- primary-owner LLM parity: **26 / 26**
- fourteen knowledge owners across both LLM directories + BlogPosting authority graph: **42 / 42**
- crawler/private-route rules: **13 / 13**
- AEO/speakable surfaces: **7 / 7**
- Brick 9 cross-brick invariant: **2 / 2**
- route protection: **5 / 5**
- LLM intent/entity/evidence guidance: **6 / 6**
- regression-spec structure: **1 / 1**

**Total: 110 / 110 passed.**

## Protected-surface verification

Compared with the Brick 11 re-audited head, these thirteen upstream/operational surfaces remain unchanged:

- central semantic facts;
- shared schemas;
- Brick 11 entity authority;
- Brick 9 evidence contract;
- Brick 8 knowledge contract;
- Brick 7 progress contract;
- Speaking resource hub;
- application routes;
- public route manifest;
- operational progress skills;
- parent dashboard;
- teacher progress editor;
- teacher progress-save backend.

**Protection result: 13 / 13 unchanged.**

## Brick 12 implementation delta

Before documentation, the intended diff contains seven files:

1. `src/lib/speakingAiVisibility.ts`
2. `src/content/blog/shared/technicalAuthority.ts`
3. `public/llms.txt`
4. `public/llms-full.txt`
5. `src/pages/speaking.tsx`
6. `src/pages/public/SpeakingProgressFrameworkPage.tsx`
7. `src/tests/seo/speakingGrowthBrick12.spec.ts`

No route, redirect, authentication, attendance, scheduling, finance, Firestore mutation, parent-dashboard or teacher-dashboard behavior is changed.

## Branch state

At structural verification:

- branch behind `main`: **0**
- production merge: **NO**
- production deployment: **NO**

## Executable-test limitation

No feature-branch GitHub Actions run is claimed for this exact head.

Full Vitest, strict typecheck, production build/prerender and browser QA remain required at the final integration gate.

## Exit decision

Brick 12 is structurally complete when the Speaking system:

- exposes explicit answer owners;
- gives all frozen Speaking knowledge URLs machine-readable topical authority;
- aligns both LLM directories with the current architecture;
- preserves crawler access and private-route protection;
- exposes concise speakable answers on the main Speaking and progress surfaces;
- preserves intent and evidence boundaries;
- creates no AI-specific content owner.

That condition is satisfied on the isolated feature branch.

**Brick 12 status: COMPLETE — STRUCTURALLY VERIFIED.**
