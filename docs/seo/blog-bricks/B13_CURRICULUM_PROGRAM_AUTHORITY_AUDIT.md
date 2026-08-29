# B13 — Curriculum, Program & Course Authority Audit

## Objective

Brick 13 makes the commercial learning architecture outside the blog easier for parents, search engines, and answer engines to understand.

The authority model is:

- `/curriculum` = the full Tiny Steps learning roadmap owner;
- `/courses` = the course-selection and comparison hub;
- `/phonics`, `/grammar`, `/speaking` = program/pathway owners;
- canonical course pages = detailed lesson-sequence owners.

B13 does not create new URLs. It clarifies the job of the URLs Tiny Steps already has.

## Baseline problems found

### 1. Mixed IB / Cambridge positioning

The existing `/curriculum` page combined claims such as:

- `IB-Aligned English Curriculum` in the SEO title;
- `Cambridge-aligned` in visible curriculum copy;
- `IB Primary Years Programme lens`;
- `How Tiny Steps aligns with IB English scopes`.

Those phrases created a mixed entity signal and could imply formal affiliation or accreditation that the page did not prove.

### 2. `/curriculum` duplicated detailed course content

The curriculum hub rendered the same lesson-by-lesson `WeekAccordion` data also rendered on canonical course pages.

This blurred ownership between:

- the roadmap-level parent question: **How does Tiny Steps learning progress overall?**
- the course-detail question: **What exactly is taught lesson by lesson in this level?**

### 3. Course pages did not explicitly route back to the roadmap owner

Canonical course pages linked to program tracks and all courses, but the full `/curriculum` roadmap was not a consistent hierarchy link.

### 4. Program pages had strong vertical intent but weak roadmap circulation

The Phonics, Grammar, and Speaking pages already owned their program intent well. B13 therefore does not rewrite their commercial positioning. Instead, it adds explicit circulation back to `/curriculum` so the overall hierarchy is visible.

### 5. Some visible outcome language read like a guaranteed child result

Examples included formulations such as:

- `Your child reads with better accuracy and confidence.`
- `Your child starts reading small words independently.`

B13 changes roadmap/comparison wording toward **learning focus / designed to build** language. Course and program claims remain specific without promising an individual outcome.

## B13 authority model

| Layer | Canonical owner | Primary job |
| --- | --- | --- |
| Learning roadmap | `/curriculum` | explain how Phonics → Grammar → Speaking connect, placement, readiness, progression, and next steps |
| Course selection | `/courses` | compare available course options and help families choose a starting path |
| Phonics program | `/phonics` | own phonics commercial intent, needs, program method, and pathway overview |
| Grammar program | `/grammar` | own grammar/sentence-formation commercial intent and grammar-pathway overview |
| Speaking program | `/speaking` | own communication/public-speaking commercial intent and speaking-pathway overview |
| Detailed course | canonical `/courses/...` URL | own exact lesson sequence, level-specific outcomes, activities, FAQs, and detailed fit |

## Curriculum roadmap content rule

`/curriculum` may show:

- pathway names;
- stage summaries;
- high-level instructional progression;
- course names and who each course is for;
- links to program and detailed course owners;
- placement/readiness logic;
- parent-facing explanation of what comes next.

`/curriculum` should not duplicate:

- every lesson title;
- every lesson activity;
- every homework task;
- every week/lesson mastery statement.

Those belong to canonical course pages.

## Verified Tiny Steps instructional logic surfaced in B13

B13 expresses the existing teaching sequence as instructional logic rather than inventing branded methods.

### Phonics

`Hear → identify → connect sound to grapheme → blend → decode → apply in connected reading`

### Grammar

`Notice the language pattern → build a complete sentence → apply the rule in context → correct errors → expand into connected writing/speaking`

### Speaking

`Listen and form an idea → answer in a complete sentence → add detail/reason → organise the response → deliver and reflect`

These sequences describe the learning logic already represented across Tiny Steps program and blog content. They are not presented as external accreditation or invented proprietary certification.

## School-framework positioning

B13 removes formal-sounding alignment claims from the curriculum authority layer.

The safer, supportable position is:

> Tiny Steps teaches transferable English skills that can support children studying in different school environments, including CBSE, ICSE, IB, Cambridge, and other curricula. Tiny Steps Learning is an independent learning provider and does not imply affiliation with those school systems unless separately documented.

The purpose is to explain transferability, not borrow institutional authority.

## Internal authority circulation

Target hierarchy:

```text
/curriculum
   ↓
/phonics   /grammar   /speaking
   ↓          ↓          ↓
canonical detailed course pages
   ↓          ↓          ↓
/curriculum
```

`/courses` remains the sibling comparison hub for families who want to compare all available course options.

## Pages audited but deliberately not re-owned

Major age/problem landing pages retain their existing intent. B13 does not convert them into duplicate curriculum owners. Examples include age-specific English-class pages, reading-problem pages, and fluency/confidence program pages.

Those pages should route into the appropriate program/course architecture rather than competing with `/curriculum` for the broad roadmap query.

## Technical protections

B13 preserves:

- existing public course canonical paths;
- redirect behavior for legacy course slugs;
- sitemap generation;
- RSS/blog feeds;
- B0–B12 blog authority;
- course schema on canonical detail pages;
- noindex behavior for invalid/nonexistent course pages.

## Explicit non-goals

B13 does not:

- add city pages;
- add competitor-comparison pages;
- create a new curriculum URL;
- create new course URLs;
- change blog ownership;
- add FAQ schema merely for volume;
- migrate the application to SSR/Next.js;
- claim IB/Cambridge accreditation;
- invent teaching-framework names.

## Acceptance condition

B13 is complete when a parent, crawler, or LLM can infer the following without ambiguity:

1. `/curriculum` explains the whole learning roadmap;
2. `/courses` helps compare course choices;
3. `/phonics`, `/grammar`, and `/speaking` explain the corresponding program;
4. canonical course pages contain the detailed lesson sequence;
5. every detailed course can route back to the full curriculum roadmap;
6. school-system references describe transferability rather than unverified formal alignment.
