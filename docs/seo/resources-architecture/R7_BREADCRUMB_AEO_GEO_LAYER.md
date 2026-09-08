# Resources R7 — Breadcrumb + AEO/GEO Layer

## Goal

Brick 7 makes the Tiny Steps Resources knowledge graph easier to navigate and easier for search/answer systems to interpret **without creating new topic owners or AI-only content**.

The implementation has two jobs:

1. one canonical breadcrumb hierarchy shared by visible UI and `BreadcrumbList` JSON-LD;
2. a grounded answer/entity graph that reuses content already visible on the page.

## Canonical breadcrumb hierarchy

### Resources gateway

`Home → Resources`

### Subject hubs

- `Home → Resources → Phonics & Reading`
- `Home → Resources → Grammar & Writing`
- `Home → Resources → Speaking & Communication`

### Subject-specific blog owners

When Brick 5 identifies a blog article as the canonical owner of a phonics, grammar, or speaking intent, its hierarchy becomes:

`Home → Resources → Subject Hub → Article`

This is a semantic hierarchy. It does **not** move the article URL away from `/blog/*` and does not transfer its canonical ownership.

### Other blog articles

Articles without a subject-owner signal use:

`Home → Resources → All Guides → Article`

The `/blog` route therefore remains the editorial archive while `/resources` remains the discovery gateway.

## One source of truth

`src/lib/breadcrumbAeoGeoRegistry.js` owns:

- Resources/subject breadcrumb labels;
- Brick 5 topic-owner to subject-hub resolution;
- blog-category fallback for non-registered subject articles;
- `BreadcrumbList` schema construction;
- grounded AEO/GEO subject presentation;
- the visible answer selectors used by `SpeakableSpecification`.

`src/components/common/KnowledgeBreadcrumbs.tsx` renders the same breadcrumb items used to build JSON-LD.

No page should maintain a second hard-coded R7 breadcrumb trail.

## AEO layer

R7 does not generate answers. It strengthens the structure around answers that are already visible:

- the existing visible blog **Quick answer** becomes the article `abstract`;
- `SpeakableSpecification` points only to visible `.ts-answer-title` and `.ts-answer-summary` elements;
- authored visible FAQ blocks retain `FAQPage` schema;
- pages without visible authored FAQ content do not receive FAQ schema.

## GEO/entity layer

Blog pages now expose a complete entity relationship:

`Blog / WebSite → WebPage → BlogPosting`

The `WebPage` node references:

- its canonical URL;
- the shared breadcrumb entity;
- the `BlogPosting` as `mainEntity`;
- the same grounded subject/about context already used by the article authority system;
- the visible answer selectors for speakable content.

The `BlogPosting` points back with `mainEntityOfPage` and reuses the visible quick answer as `abstract`.

Resources `CollectionPage` nodes reference their shared breadcrumb entity and visible answer selectors. No hidden text is added.

## Explicit non-goals

Brick 7 does **not** add:

- fake FAQ questions;
- schema for content that is not visibly rendered;
- hidden AI/GEO text;
- duplicated keyword paragraphs;
- new blog/topic URLs;
- redirects or canonical transfers;
- programmatic SEO pages;
- claims that structured data guarantees AI citations or rankings.

## Acceptance criteria

Brick 7 is complete only when:

1. `/resources` and all three subject hubs render visible breadcrumbs from the shared registry;
2. blog articles render the same shared hierarchy used by their JSON-LD;
3. registered Brick 5 blog owners route through the correct subject hub;
4. non-subject blog articles safely fall back through `All Guides`;
5. `BreadcrumbList` item order and URLs match the visible trail;
6. blog `WebPage` and `BlogPosting` nodes reference each other correctly;
7. speakable selectors map to visible answer content;
8. FAQ schema remains gated to visible authored FAQ content;
9. R0–R6 Resources safeguards and repository SEO/build checks remain green.
