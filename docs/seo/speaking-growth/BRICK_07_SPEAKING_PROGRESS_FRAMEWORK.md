# Brick 07 — Tiny Steps Speaking Progress Framework

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — STRUCTURALLY VERIFIED**  
Production deployment: **NO**

## 1. Purpose

Brick 7 turns Tiny Steps' existing evidence-led speaking philosophy into one documented educational framework that can be used consistently across:

- the public Speaking programme;
- the free assessment explanation;
- parent progress guidance;
- Speaking resource discovery;
- later evidence/reporting work.

The framework answers:

> How does Tiny Steps describe speaking progress without reducing a child to one vague confidence label or one artificial percentage?

The framework is educational. It is not a clinical, medical, developmental-age or standardised language assessment.

## 2. Canonical framework owner

New informational owner:

`/speaking-progress-framework`

Role:

**How Tiny Steps measures speaking progress**

This does not replace:

- `/speaking` — commercial Public Speaking & Communication owner;
- `/resources/speaking` — Speaking & Communication resource-discovery hub;
- `/spoken-english-classes-for-kids-online` — Spoken English commercial owner;
- `/confidence-building-program-kids` — specialist Confidence Building commercial owner.

Canonical topic ID:

`speaking-progress-measurement`

Intent:

`progress-aware`

## 3. Framework identity

Name:

**Tiny Steps Speaking Progress Framework**

Revision:

`2026-09-19-b7-v1`

Central source:

`src/lib/speakingProgressFramework.ts`

The source is intentionally shared so the public page, assessment explanation, parent guide, and later evidence/reporting work do not redefine the framework independently.

## 4. Ten observable dimensions

Brick 7 keeps the dimensions separate.

1. **Response expansion**  
   Can the child give enough relevant information for the task?

2. **Sentence formation in speaking**  
   Can the child turn an idea into a sentence the listener can follow?

3. **Vocabulary in use**  
   Can the child retrieve and use useful words while speaking?

4. **Idea organisation**  
   Can the child order ideas so the listener can follow the message?

5. **Listening & response relevance**  
   Does the child respond to the prompt or speaker that was actually heard?

6. **Storytelling & retelling**  
   Can the child tell or retell an event in a meaningful sequence?

7. **Delivery & intelligibility**  
   Do pace, volume, pausing and expression help the listener follow the message?

8. **Speaking independence**  
   How much adult help is needed to start, continue and complete the task?

9. **Presentation & audience awareness**  
   Can the child shape a short talk for a listener or audience rather than only recite content?

10. **Transfer to fresh tasks**  
    Does the skill appear again when the topic, material, listener or setting changes?

## 5. Four observation bands

The framework does not use a single total score.

For the current target, evidence can be described using four support-to-independence bands:

1. **Modelled / supported**  
   The child participates after substantial modelling, sentence starters or planning support.

2. **Guided attempt**  
   The child attempts the skill with a lighter cue, question, organiser or keyword.

3. **Independent use**  
   The child completes a comparable task with little or no direct prompting.

4. **Fresh-task transfer**  
   The child applies the same skill to a new prompt, topic, listener, story or presentation task with little or no direct prompting.

The same child can be in different bands for different dimensions.

The bands are not:

- grades;
- ages;
- percentages;
- diagnoses;
- global ability labels.

## 6. Evidence model

Every dimension defines four things:

- parent-facing question;
- baseline evidence;
- visible progress evidence;
- what should **not** be used as the judgment shortcut.

Examples:

- response expansion is not judged by word count alone;
- vocabulary is not judged by rare words for their own sake;
- organisation is not proved by memorising one script;
- listening is not judged by silent compliance or eye contact;
- storytelling is not proved by word-for-word memorisation;
- delivery is not judged by accent conformity or theatrical performance;
- independence is not judged by speed alone;
- presentation is not proved by one polished memorised speech;
- transfer is not proved by success only on the practised item.

## 7. Review loop

Brick 7 formalises one evidence cycle:

**Baseline → one current target → teach/retry/fade support → fresh-task check → next learning priority**

This aligns with existing Tiny Steps progress guidance:

- compare the same child over time;
- record what the child can do independently;
- record the prompt or support still needed;
- check transfer to a fresh task;
- choose the next useful target.

## 8. Parent progress summary

A useful Speaking progress update can contain:

- Current speaking target;
- Observation band for the target;
- What the child can now do independently;
- Support that is still useful;
- Fresh-task evidence;
- Next learning priority.

Brick 7 deliberately does **not** require a combined percentage.

## 9. Initial assessment use

The free assessment page now explains that a speaking-focused assessment may use the framework as an observation guide.

Important boundary:

> A child is not forced through a ten-part test in one session.

The teacher selects the most relevant dimensions based on:

- the parent's main concern;
- the child's current task;
- likely programme fit;
- the evidence visible during the session.

The goal is:

- useful starting point;
- support still needed;
- first high-value target;
- programme recommendation where appropriate.

A single assessment does not become a diagnostic or standardised result.

## 10. Existing knowledge architecture preserved

Tiny Steps already has nine non-rigid Speaking & Communication knowledge domains in:

`src/lib/speakingCommunicationKnowledgeArchitecture.js`

Brick 7 does not replace those domains.

Each of the ten progress dimensions references one or more existing domains so:

- content architecture remains stable;
- progress evidence and teaching knowledge stay connected;
- no second contradictory Speaking taxonomy is introduced.

## 11. Commercial and informational ownership

The canonical topic registry now explicitly separates:

- **Public Speaking classes** → `/speaking`;
- **Speaking resource discovery** → `/resources/speaking`;
- **How to measure speaking progress** → `/speaking-progress-framework`.

This protects Brick 2's one-intent-one-owner contract.

The new framework page is not allowed to become a competing “public speaking classes” money page.

## 12. Public page

New page:

`src/pages/public/SpeakingProgressFrameworkPage.tsx`

It publishes:

- quick answer;
- all ten dimensions;
- all four observation bands;
- assessment-use explanation;
- five-step review loop;
- parent progress fields;
- framework guardrails;
- FAQ;
- links to assessment, Speaking programme and parent guide.

Structured data:

- WebPage;
- BreadcrumbList;
- ItemList for ten dimensions;
- DefinedTerm entities;
- ItemList for four observation bands;
- FAQPage.

Not added:

- AggregateRating;
- Rating;
- fabricated outcome score.

## 13. User-journey handoffs

The framework is linked from:

### Speaking programme
`/speaking`

The programme now explains the ten-dimension profile and four bands without turning the page into a rating tool.

### Free assessment
`/book-demo`

The assessment now explains bounded use of the framework.

### Parent progress guide
`/parents/tracking-progress`

The guide now shows the four bands and six parent-summary fields.

### Speaking resource hub
`/resources/speaking`

The framework is available as a progress-measurement resource.

### Internal link registry
The framework is available for automatic semantic linking from phrases such as:

- speaking progress framework;
- measure speaking progress;
- track speaking progress.

## 14. Operational isolation

This is a critical Brick 7 boundary.

Brick 7 **does not** modify:

- Firestore progress storage;
- historical child progress records;
- teacher topic-progress save workflow;
- parent dashboard calculation logic;
- existing stored skill ratings;
- attendance;
- payments;
- scheduling;
- financials.

The existing operational Speaking fallback remains:

- Confidence;
- Pronunciation;
- Fluency;
- Idea expression;
- Audience engagement.

That fallback is intentionally not silently replaced by the new ten dimensions.

Reason:

Historical records may already use the existing labels. Automatically remapping them could corrupt interpretation of past progress or change dashboard percentages without a proper data-migration design.

If Tiny Steps later decides to make the ten dimensions an operational teacher-reporting schema, that should be a separate deliberate migration with:

- data mapping;
- backwards compatibility;
- teacher workflow design;
- parent UI design;
- migration testing;
- historical-data protection.

## 15. Guardrails

The framework explicitly says:

- do not average ten dimensions into one overall speaking score;
- do not create developmental-age or IQ-style results;
- do not use it as a diagnosis or clinical label;
- do not judge confidence by loudness or extroversion;
- do not judge accent conformity as speaking success;
- do not require constant eye contact;
- do not treat one memorised performance as transfer;
- do not expect all dimensions to improve evenly;
- do compare the same child over time;
- do record multilingual/setting differences when relevant;
- do finish with one useful next teaching target.

## 16. Sitemap and discovery

The new framework is:

- indexable;
- self-canonical;
- included once in the static sitemap;
- required by SEO smoke;
- linked from the HTML sitemap;
- linked from the Speaking resource hub;
- registered in the internal-link map.

Brick 7 also materially changed:

- `/speaking`;
- `/book-demo`;
- `/resources/speaking`;
- `/parents/tracking-progress`.

The sitemap generator now tracks the relevant source files for those Brick 7 surfaces.

Current `lastmod`:

- `/speaking-progress-framework` → 2026-09-19;
- `/speaking` → 2026-09-19;
- `/book-demo` → 2026-09-19;
- `/resources/speaking` → 2026-09-19;
- `/parents/tracking-progress` → 2026-09-19.

Static and parent sitemap-index dates are also synchronized to 2026-09-19.

## 17. Regression protection

New dedicated test:

`src/tests/seo/speakingGrowthBrick7.spec.ts`

It protects:

- exactly ten dimensions;
- exact dimension IDs/order;
- exactly four bands;
- exact band IDs/order;
- mapping into existing knowledge domains;
- empty new observation template;
- no fabricated historical scores;
- no single overall score;
- non-clinical guardrails;
- canonical topic ownership;
- public route/SEO registration;
- structured-data restraint;
- all four public handoffs;
- current operational progress fallback;
- absence of framework imports in existing dashboard/editor code;
- sitemap uniqueness;
- Brick 7 sitemap freshness.

## 18. Structural verification

Final source-level matrix:

- Framework contract: **26 / 26**
- Ownership, routing & discovery: **28 / 28**
- Handoffs & operational isolation: **23 / 23**

**Total: 77 / 77 passed.**

## 19. Executable test limitation

No feature-branch CI execution is claimed here.

This Brick 7 close does **not** claim:

- `npm run build` pass;
- full Vitest execution pass;
- browser/prerender QA pass.

Those executable gates remain mandatory before the final Bricks 1–13 integration/production merge.

## 20. Exit decision

Brick 7 is structurally complete when Tiny Steps has one documented, non-clinical, evidence-led Speaking progress method that:

- can be understood by parents;
- supports assessment language;
- supports later evidence/reporting work;
- has one informational search owner;
- does not compete with the Speaking commercial page;
- does not silently rewrite operational progress data.

That condition is satisfied on the isolated branch.

**Brick 7 status: COMPLETE — STRUCTURALLY VERIFIED.**
