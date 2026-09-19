# Brick 06 — Speaking Programme Architecture

Build date: 2026-09-19 IST  
Branch: feature/speaking-seo-geo-growth  
Status: COMPLETE — structurally verified on branch; not deployed.

## 1. Purpose

Brick 6 makes the Tiny Steps Speaking system understandable as a programme architecture rather than a collection of loosely related pages.

The architecture is:

`/speaking`
→ Public Speaking Foundations
→ Public Speaking Excellence

with two adjacent specialist owners:
- Spoken English → `/spoken-english-classes-for-kids-online`;
- Confidence Building → `/confidence-building-program-kids`.

Grammar remains a supporting language foundation when sentence accuracy is the actual barrier, but it is not presented as a Public Speaking level.

## 2. Internal IDs vs canonical public URLs

Existing operational course IDs are preserved:
- `basic-public-speaking`;
- `advanced-public-speaking`.

Those identifiers remain important to enrolment/progress/dashboard systems and are not renamed.

Brick 6 adds explicit canonical public fields to semantic facts:

### Foundations
- internal course ID: `basic-public-speaking`;
- compatibility slug: `basic-public-speaking`;
- canonical public slug: `public-speaking-foundations`;
- canonical URL: `/courses/public-speaking-foundations`;
- age: Ages 4–7;
- lessons: 36.

### Excellence
- internal course ID: `advanced-public-speaking`;
- compatibility slug: `advanced-public-speaking`;
- canonical public slug: `public-speaking-excellence`;
- canonical URL: `/courses/public-speaking-excellence`;
- age: Ages 7–12;
- lessons: 36.

This resolves the semantic ambiguity without modifying operational course IDs.

## 3. Exactly two published Public Speaking levels

Brick 6 defines one explicit level sequence:

1. Public Speaking Foundations;
2. Public Speaking Excellence.

No Intermediate or third Public Speaking level is created.

Age is a guide. Placement remains readiness-based.

## 4. Public Speaking Foundations

Foundations is the first published Public Speaking level.

Who it is for:
- children who can communicate basic ideas;
- children who need more organisation and structure;
- children ready for picture talk, show-and-tell, simple storytelling and short presentations;
- children who benefit from modelling, guided retries and predictable speaking structure.

Prerequisite rule:

No prior Public Speaking course is required. If everyday conversation, sentence formation, or confidence itself is the primary barrier, assessment may recommend Spoken English, Grammar, or Confidence Building before or alongside Public Speaking.

Readiness to progress includes observable ability to:
- sustain a short 30–60 second familiar talk with less prompting;
- organise familiar ideas into a simple sequence;
- use clearer delivery;
- answer simple follow-up questions;
- begin handling longer speeches, presentations, impromptu prompts and guided debate.

## 5. Public Speaking Excellence

Excellence is the advanced published Public Speaking level.

Entry is based on either:
- completion/readiness from Foundations; or
- equivalent skill demonstrated during assessment.

It is not certificate-gated.

Skills include:
- longer structured speeches;
- richer storytelling;
- presentation planning;
- impromptu speaking;
- opinion sharing and guided debate;
- audience awareness;
- voice modulation and delivery;
- question-and-answer handling.

After Excellence, Tiny Steps does not publish a third Public Speaking level. Continued practice depends on the learner's specific goals and observed needs.

## 6. Course-detail architecture

The shared course-detail renderer now supports Speaking-specific level architecture while preserving the existing Phonics stage system.

Speaking detail pages now expose:
- who the level is for;
- prerequisite / starting-point note;
- entry signals;
- skills built;
- readiness to move forward;
- two-level Public Speaking progression;
- previous/next level links;
- provider and teacher-system explanation;
- teaching-method explanation;
- real class-samples link;
- detailed lesson-by-lesson curriculum;
- parent feedback;
- FAQs;
- free assessment handoff.

Phonics keeps its existing:
- `#phonics-program-stages` schema ID;
- `Tiny Steps phonics programme stages` name;
- `Course fit · Phonics stage` UI language;
- `Tiny Steps phonics progression` UI language.

## 7. Provider and instructor handling

Course `Course` schema continues to use the shared Tiny Steps `EducationalOrganization` provider from `createCourseSchema`.

Visible course-detail pages explain that classes are delivered by Tiny Steps teachers within the Tiny Steps academic system, while teacher assignment can vary by schedule and learning fit.

Brick 6 does not invent a named instructor in structured data because no single permanent instructor is guaranteed for either course.

## 8. Teaching method

Speaking course pages now state the common live-teaching loop:

model → guided attempt → specific feedback → retry → fresh application with less support.

Parents can inspect `/class-samples` for the broader Tiny Steps live-teaching style.

## 9. Hub architecture

`/speaking` remains the generic Public Speaking + Communication owner.

It now uses canonical course paths from semantic facts and explicitly shows:
- Foundations;
- Excellence;
- assessment-led overlap at age 7;
- adjacent Spoken English;
- adjacent Confidence Building.

The specialist-pathway explanation is placed after the two Public Speaking level cards so the decision sequence is clear.

## 10. Hub structured-data decision

Brick 6 removes the umbrella `Course` entity from `/speaking`.

The hub remains a WebPage and now has a generic `ItemList` describing the programme architecture as linked WebPages.

The two canonical course-detail pages retain `Course` schema.

Current Google Search Central Course-list guidance checked on 2026-09-19 states that the Course-list enhancement requires at least three courses plus the appropriate list/carousel markup.

Tiny Steps publishes two Public Speaking levels. Brick 6 therefore does not:
- invent a third course;
- add `createCourseListSchema` to `/speaking`;
- claim Course-list rich-result eligibility.

Official reference: https://developers.google.com/search/docs/appearance/structured-data/course

## 11. Video structured-data decision

No course-specific `VideoObject` is added.

The existing class-samples surface is broader than one specific Speaking level and is linked as teaching evidence. Course-specific VideoObject markup should only be added when a real course-specific public video surface exists.

## 12. Curriculum roadmap alignment

The `/curriculum` Speaking pathway now uses canonical course paths and central lesson/age facts.

Its speaking progression was tightened from sentence-formation language to Public-Speaking-specific progression:

understand the prompt
→ choose and organise an idea
→ add useful detail
→ shape for the task/audience
→ deliver, retry and reflect.

This avoids taking Spoken-English or Grammar territory.

## 13. Course chooser and parent chooser alignment

`/courses` now uses the canonical visible names:
- Public Speaking Foundations;
- Public Speaking Excellence.

The general Public Speaking fit is defined around organisation, storytelling, presentations, audience awareness and delivery—not one-word answers or shyness.

`/parents/choosing-course` now routes generic Speaking need to `/speaking`, not directly to the Foundations detail page.

It also explicitly states that short answers do not automatically mean Public Speaking.

## 14. Internal linking

The internal-link registry now includes both named course targets:
- Public Speaking Foundations / Basic Public Speaking;
- Public Speaking Excellence / Advanced Public Speaking.

## 15. Discovery synchronization

RSS and feed descriptions for both canonical Speaking courses were synchronized to the updated public course descriptions.

`sitemap-courses.xml` remains unchanged in structure and contains each canonical Speaking course exactly once.

## 16. Regression protection

New test:
`src/tests/seo/speakingGrowthBrick6.spec.ts`

It protects:
- internal course IDs;
- canonical public slugs/paths;
- two-level-only architecture;
- hub-as-root behavior;
- absence of Course-list markup on the two-course hub;
- readiness-based Foundations and Excellence logic;
- prerequisite, skill and exit signals;
- provider and teaching-method evidence;
- speaking ItemList schema;
- preservation of Phonics stage schema/UI;
- canonical course entity names;
- curriculum and chooser alignment;
- both automatic internal-link targets;
- RSS/feed synchronization;
- no unsupported course-specific VideoObject.

## 17. Structural verification

Final source-level architecture matrix: 41 / 41 invariants passed.

Verified:
- no unresolved internal link;
- branch 0 commits behind main at the gate;
- two canonical Speaking course URLs remain in the course sitemap exactly once;
- no third level;
- no fake Course-list rich-result target;
- Phonics stage contract preserved;
- Spoken English and Confidence remain separate specialist owners.

## 18. What Brick 6 did not change

- operational course IDs: unchanged;
- new Public Speaking levels: ZERO;
- new commercial URLs: ZERO;
- redirects: ZERO;
- canonical URLs: ZERO;
- sitemap URL set: unchanged;
- pricing: unchanged;
- attendance/payments/scheduling/dashboard logic: unchanged;
- production deployment: ZERO.

## 19. Exit decision

Brick 6 is complete on the isolated branch when the programme hub, two Public Speaking levels, specialist handoffs, course-detail readiness logic, provider/teaching evidence, curriculum roadmap, chooser pages, schema strategy and discovery surfaces all describe the same architecture.

That condition is structurally satisfied.
