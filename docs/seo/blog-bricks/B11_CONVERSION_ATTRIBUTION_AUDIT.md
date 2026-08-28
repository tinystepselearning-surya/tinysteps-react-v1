# B11 — Blog Conversion & Attribution Audit

## Objective

Brick 11 closes the gap between the editorial authority built in B0–B10 and a measurable Tiny Steps enquiry journey.

The rule is **answer first, then offer the next useful step**. B11 must not turn informational articles into sales pages or create a new set of conversion-only blog URLs.

## Baseline

- Live blog inventory: **76**
- New blog URLs planned in B11: **0**
- Canonical, redirect, sitemap, RSS and indexability policy changes planned: **0**
- Existing generic acquisition attribution: retained
- Existing public assessment form and lead writer: retained
- Existing B2/B6/B7/B8/B9/B10 ownership and trust architecture: retained

## What existed before B11

### Conversion UI

`BlogPostPage` exposed several competing conversion routes at once:

1. category-level hero action;
2. generic demo action;
3. a dark "Continue with Tiny Steps learning paths" block;
4. a separate "Parent Guidance" block;
5. a separate "Recommended Next" block;
6. sidebar program/course links.

The individual links were valid, but the combined page asked the reader to choose between too many actions and did not consistently use the article's protected intent.

### Attribution

Tiny Steps already had two useful attribution layers:

- `conversionTracking.ts` preserves generic first-touch acquisition information such as landing page, UTM parameters, referrer domain and advertising click IDs;
- `leadAttribution.ts` preserves public lead-form attribution and submitted-page context.

The public lead writer already accepts a `sourceDetail` string, so B11 does **not** require a Firestore schema migration merely to attach blog context to a demo enquiry.

### The missing information

Before B11, the final enquiry could identify a website/demo source but could lose the content problem that influenced the conversion. For example, a parent could enter on:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

then submit through `/book-demo`, leaving the acquisition layer unable to say that the parent was reading a **letter-sounds-to-decoding** diagnostic article when they chose the assessment.

## B11 decisions

### 1. Conversion families, not 76 hard-coded sales blocks

Every article resolves to one maintainable conversion family:

| Conversion family | Parent/school intent | Primary conversion |
| --- | --- | --- |
| `phonics-diagnostic` | reading problem diagnosis | free phonics assessment |
| `phonics-practice` | structured phonics next step | free phonics assessment |
| `reading-fluency` | fluent reading support | free reading assessment |
| `grammar-diagnostic` | grammar knowledge not transferring | free grammar assessment |
| `sentence-building` | sentence formation/expansion | free sentence-building assessment |
| `speaking-confidence` | spoken response/confidence | free speaking assessment |
| `general-english` | mixed/unclear English need | free English assessment |
| `schools-partnership` | institutional implementation | `/for-schools`, then `/contact` |

Protected B2/B6/B9 owners are explicitly mapped. Other posts inherit the B10 technical authority cluster and discovery/audience metadata.

### 2. One strong end-of-article conversion unit

The generic dark CTA and separate generic Parent Guidance CTA are consolidated into one reusable `BlogConversionCard`.

The card is contextual to the article's problem and includes:

- one primary action;
- at most one secondary action;
- no pop-up;
- no sticky/floating behavior;
- no fabricated urgency or outcome promise.

The existing lower "Recommended Next" area remains a lighter exploration route rather than another duplicate demo pitch.

### 3. Hero actions become intent-aware

Parent articles use the relevant programme route plus a secondary contextual assessment route.

Schools & Research articles use the school partnership and contact routes. They do not enter the parent-demo funnel simply because their source category is `Research`.

### 4. Schools are a separate conversion journey

For `Schools & Research` audience content:

- hero language is school-facing;
- CTA destination is `/for-schools` or `/contact`;
- related-post discovery prefers school/research material;
- generic `/courses` fallbacks are suppressed;
- the end conversion card is `schools-partnership`.

This preserves the parent-vs-school audience boundary established in B1/B7/B10.

### 5. Preserve first-touch acquisition and add blog influence

B11 does not overwrite the existing first-touch attribution object.

Instead, a separate session-scoped blog context stores:

- first article slug/path/family/intent;
- last article slug/path/family/intent;
- last CTA label/position/destination.

This lets Tiny Steps distinguish:

- **acquisition truth** — e.g. Google / UTM campaign / original landing page;
- **content influence** — e.g. a parent clicked an assessment from the letter-sounds diagnostic article.

### 6. Carry blog context into the lead

A clicked blog assessment route uses an internal query contract:

`/book-demo?from=blog&article=<slug>&intent=<conversion-family>&cta=<position>`

The demo page converts that context to a compact lead source detail:

`blog|<slug>|<conversion-family>|<cta-position>`

Example:

`blog|why-child-knows-letter-sounds-but-cannot-read-words|phonics-diagnostic|article_end`

The same context can be recovered from session storage when the parent reaches the demo page indirectly in the same browsing session.

### 7. Privacy boundary

B11 adds no fingerprinting and no new personal data collection.

The new context is limited to Tiny Steps page/article identifiers, CTA context and the generic acquisition data already captured by the site. Parent identity/contact data continues to be collected only through the existing lead form.

## Protected intent routing

| Protected article | B11 conversion family | Secondary programme route |
| --- | --- | --- |
| `child-knows-abc-but-cannot-read` | `phonics-diagnostic` | `/phonics` |
| `why-child-knows-letter-sounds-but-cannot-read-words` | `phonics-diagnostic` | `/phonics` |
| `how-kids-learn-blending` | `phonics-practice` | `/phonics` |
| `phonics-blending-activities` | `phonics-practice` | `/phonics` |
| `satpin-phonics-guide` | `phonics-practice` | `/phonics` |
| `phonics-for-parents-guide` | `phonics-practice` | `/phonics` |
| `how-to-improve-reading-fluency-in-children` | `reading-fluency` | `/phonics` |
| `child-knows-grammar-but-makes-mistakes` | `grammar-diagnostic` | `/grammar` |
| `how-to-improve-sentence-formation-in-kids` | `sentence-building` | `/grammar` |
| `week-7-grammar-nouns-to-paragraphs` | `sentence-building` | `/grammar` |
| `child-understands-english-but-does-not-speak` | `speaking-confidence` | `/speaking` |
| `child-gives-one-word-answers` | `speaking-confidence` | `/speaking` |
| `week-12-speaking-confidence-seeds` | `speaking-confidence` | `/speaking` |

## Explicit non-goals

B11 does not:

- create a new blog post;
- change a slug;
- change a canonical;
- add or remove a redirect;
- change sitemap/RSS generation;
- change blog indexability policy;
- change hero-family ownership;
- rewrite the B10 authority graph;
- add a sticky blog conversion button;
- require a parent to manually report which article they came from.

## Acceptance condition

B11 is complete when the following journey is measurable without sacrificing editorial usefulness:

**Authority article → contextual CTA → demo form start → submitted enquiry**

and the lead can retain both the site's existing acquisition attribution and the B11 article/problem context.
