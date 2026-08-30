# Brick 8 — Schema, Entity Graph & Technical Consistency Audit

## Purpose

Brick 8 makes the authority architecture established in Bricks 1–7 equally clear in machine-readable data.

The governing rule is:

> **Use structured data to describe evidence already visible on the site. Do not add schema merely because a type exists.**

Brick 8 does not create new public routes, new testimonials, new ratings, new credentials, new claims, new prices, new videos, or new course stages.

## Canonical entity contract

The existing B14 public entity contract remains authoritative.

| Entity | Canonical identity |
| --- | --- |
| Organization | `https://tinystepslearning.com/#educational-organization` |
| Website | `https://tinystepslearning.com/#website` |
| Founder | `https://tinystepslearning.com/#founder` |
| Public brand | Tiny Steps Learning |
| Canonical organization name | Tiny Steps Early Education |
| Phonics service | `https://tinystepslearning.com/phonics#service` |
| Reading service | `https://tinystepslearning.com/reading-classes-for-kids#service` |
| Blog | `https://tinystepslearning.com/blog#blog` |

The organization name is intentionally **Tiny Steps Early Education** in canonical structured data while **Tiny Steps Learning** remains the public brand/alternate name. Brick 8 must not rewrite that contract.

## Stable page and course IDs

Every canonical public WebPage uses:

`<canonical-url>#webpage`

Every canonical public Course entity uses:

`<canonical-course-url>#course`

The three phonics course-stage entities therefore resolve to:

1. `https://tinystepslearning.com/courses/phonics-foundation#course`
2. `https://tinystepslearning.com/courses/phonics-brush-up#course`
3. `https://tinystepslearning.com/courses/phonics-advanced#course`

These IDs are derived from the existing public course configuration. No alternate course URLs are introduced.

## Why Brick 8 is centralized

Before Brick 8, page-level JSON-LD was generally accurate but independent. The same entity could appear as an inline organization, anonymous course, or generic WebSite on different pages.

There was also a graph-merging weakness: when the base SEO layer and a page both emitted the same WebPage `@id`, the first node won and richer properties on the later page node could be lost.

Brick 8 adds a centralized entity-graph normalizer in `src/lib/structuredDataGraph.ts` and applies it in `src/lib/seo.ts` after page schemas are assembled.

This gives us one place to protect:

- canonical `@id` reuse;
- Organization / WebSite / Founder references;
- WebPage ↔ main entity relationships;
- Course identity and provider relationships;
- Service identity and provider relationships;
- BlogPosting ↔ WebPage ↔ Blog relationships;
- first-party review restrictions;
- real-video-only VideoObject behavior;
- route ownership boundaries established by earlier bricks.

## Page-by-page schema ownership

### `/phonics`

**Role:** broad phonics service/program authority.

Machine-readable model:

- WebPage
- Service (`/phonics#service`)
- ItemList of the three canonical phonics Course entities
- existing phonics pathway ItemList
- existing parent quality-criteria ItemList
- BreadcrumbList
- FAQPage where the questions are visibly present

Important boundary:

`/phonics` is **not** modelled as one giant Course after Brick 8. The real courses are Foundation, Early, and Advanced Phonics on their canonical course pages.

### Foundation / Early / Advanced Phonics course pages

**Role:** canonical Course owners.

Each page gets:

- WebPage `#webpage`
- Course `#course`
- mutual WebPage → Course and Course → WebPage references
- canonical Tiny Steps provider reference
- visible FAQ schema when configured
- the existing phonics-stage ItemList, now referencing stable course entity IDs
- existing BreadcrumbList

Course facts continue to come from the public course-page configuration rather than a new Brick 8 fact table.

### `/best-online-phonics-classes-for-kids-in-india`

**Role:** comparison and parent-decision owner.

Machine-readable model stays a WebPage with decision/scorecard ItemLists and FAQ content.

It may **mention** the Tiny Steps phonics Service but must not become a competing Course or Service owner.

### `/reading-classes-for-kids`

**Role:** reading-support service owner.

Machine-readable model:

- WebPage
- Reading Service (`/reading-classes-for-kids#service`)
- existing reading pathway ItemList
- existing quality-criteria ItemList
- FAQPage
- BreadcrumbList

Reading remains distinct from phonics. The page can mention phonics because decoding may be one reading bottleneck, but the reading Service has its own stable identity.

### `/curriculum`

**Role:** complete learning-roadmap owner.

The existing `#program-roadmap` ItemList becomes the WebPage main entity.

Program destinations in that roadmap point to canonical WebPage IDs. The page may mention the phonics and reading service entities while preserving the B5 distinction:

- curriculum = what children learn and in what progression;
- methodology = how teachers model, practise, correct, adapt and reduce support.

### `/pricing`

**Role:** public pricing authority.

Machine-readable model:

- WebPage
- OfferCatalog as the page main entity
- visible FAQPage
- canonical organization relationship

Where an OfferCatalog item corresponds to a known public Course, the anonymous `Course` object is upgraded to the canonical course URL, course `@id`, provider and educational level.

Brick 8 does not alter public prices or invent new offer conditions.

### `/testimonials`

**Role:** curated first-party parent feedback evidence.

The page deliberately does **not** publish `Review` or `AggregateRating` structured data for Tiny Steps' own first-party testimonials.

Brick 8 adds a defensive graph rule that removes those self-serving schema types if they are accidentally introduced on this route later.

Visible testimonial cards remain unchanged. Their role is evidence for parents, not a self-awarded search rating.

### `/class-samples`

**Role:** observable teaching evidence.

Machine-readable model:

- WebPage + CollectionPage on the same canonical page ID
- ItemList for the real class-sample collection
- VideoObject only for samples with a valid YouTube video ID
- FAQPage
- BreadcrumbList

VideoObject nodes are connected to the canonical collection WebPage and Tiny Steps publisher.

Brick 8 does not invent upload dates, durations, transcripts or unavailable video URLs.

### `/book-demo`

**Role:** free assessment / fit-verification service.

Machine-readable model:

- WebPage
- Service (`#assessment-service`)
- zero-price Offer already supported by the visible offer
- duration derived from the canonical `FREE_DEMO_DURATION_MINUTES` source
- decision checklist ItemList
- FAQPage
- BreadcrumbList

The WebPage and Service reference each other. The Service provider and Offer seller point to the canonical Tiny Steps organization.

### Blogs

**Role:** informational, diagnostic, practice, comparison, parent guidance or research support — never automatically a service page.

For a normal blog article Brick 8 closes the graph:

`WebPage → BlogPosting → Blog → WebSite → EducationalOrganization`

The article keeps:

- stable `#article` ID;
- canonical `#webpage` mainEntityOfPage reference;
- founder or Tiny Steps author identity;
- canonical Tiny Steps publisher;
- visible external citations where present;
- existing topic/about mapping;
- visible FAQ schema where present.

Organization-authored articles now resolve back to the canonical organization ID rather than creating a second anonymous Tiny Steps organization entity.

## FAQ policy

FAQ structured data is used only when the page visibly contains the same questions and answers.

Brick 8 does **not** claim that Tiny Steps is eligible for FAQ rich results. Search engines may choose not to show FAQ enhancements even when the markup is valid.

The purpose here is semantic consistency and machine-readable question/answer structure, not a guaranteed SERP feature.

## Course policy

A `Course` must represent a real Tiny Steps educational course with a defined learning sequence and outcomes.

The broad `/phonics` page is therefore a Service/program authority, while the three stage pages are the Course entities.

The summary page can describe the three canonical courses through an ItemList without creating new URLs or duplicate course owners.

## Review/rating policy

Do not add any of the following to `/testimonials` merely to pursue a rich result:

- `Review`
- `AggregateRating`
- hard-coded review count
- hard-coded average rating

Volatile ratings from external platforms are not canonical Tiny Steps facts unless a maintained, verified integration is explicitly approved.

## Video policy

Only create `VideoObject` for an actual published video with a valid supported video ID.

Do not create VideoObject markup for:

- placeholder panels;
- “coming soon” clips;
- images pretending to be video;
- missing video URLs;
- invented upload dates or durations.

## Canonical technical alignment

For every page in this Brick 8 scope, these should refer to the same canonical owner:

- canonical link;
- Open Graph URL;
- WebPage URL;
- WebPage `@id`;
- Service/Course URL where the page owns that entity;
- BreadcrumbList destination;
- route registry/prerender canonical;
- sitemap/indexability policy.

B8 does not change the existing route or indexability map.

## Guardrails

`src/tests/seo/phonicsBrick8SchemaEntityConsistency.spec.ts` protects:

- canonical Organization / WebSite / Founder IDs;
- rich WebPage nodes surviving schema merge;
- `/phonics` as Service rather than a duplicate Course;
- exactly three canonical phonics Course stages;
- WebPage ↔ Course links on each stage page;
- comparison-page intent separation;
- separate Reading Service identity;
- curriculum roadmap ownership;
- pricing OfferCatalog → canonical Course references;
- absence of self-serving Review/AggregateRating schema on testimonials;
- real-video collection relationships;
- demo WebPage ↔ Service relationships and canonical duration source;
- BlogPosting ↔ WebPage ↔ Blog graph closure;
- zero new Brick 8 routes.

## Explicit non-goals

Brick 8 must not:

- add new indexable pages;
- change canonical blog ownership;
- reverse redirects or noindex decisions;
- invent awards, credentials or affiliations;
- claim scientific or clinical proof;
- add unsupported review/rating markup;
- fabricate video metadata;
- create course entities for generic articles or comparison pages;
- duplicate public price or demo-duration constants;
- turn every page into every possible schema type.

## Completion standard

Brick 8 is complete only when:

1. the entity graph is stable and internally connected;
2. earlier Brick 1–7 ownership boundaries still hold;
3. structured data matches visible content;
4. canonical entity IDs are reused rather than duplicated;
5. zero new routes are introduced;
6. lint, typecheck, unit tests, production build and SEO smoke checks pass on the exact PR head.
