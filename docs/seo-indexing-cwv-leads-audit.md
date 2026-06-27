# SEO Indexing, CWV, and Leads Audit

## Scope

- App type: Vite + React + TypeScript SPA with prerendered public routes in `dist/`
- Primary public routing: [src/app/routes.tsx](/Users/tinysteps/Documents/Tinysteps-react-v1/src/app/routes.tsx)
- Build-time SEO pipeline:
  - [scripts/generate-sitemaps.js](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/generate-sitemaps.js)
  - [scripts/prerender.mjs](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/prerender.mjs)
  - [src/lib/routeSeoRegistry.js](/Users/tinysteps/Documents/Tinysteps-react-v1/src/lib/routeSeoRegistry.js)
- Hosting and redirects: [firebase.json](/Users/tinysteps/Documents/Tinysteps-react-v1/firebase.json)
- Runtime SEO utilities:
  - [src/components/common/Meta.tsx](/Users/tinysteps/Documents/Tinysteps-react-v1/src/components/common/Meta.tsx)
  - [src/lib/seo.ts](/Users/tinysteps/Documents/Tinysteps-react-v1/src/lib/seo.ts)

## Public Route Architecture

### Indexable route groups discovered

- Core marketing:
  - `/`
  - `/courses`
  - `/curriculum`
  - `/pricing`
  - `/contact`
  - `/why-tiny-steps`
  - `/faq`
  - `/team`
  - `/class-samples`
  - `/testimonials`
  - `/for-schools`
  - `/book-demo`
  - `/summer-camps`
  - `/summer-camps/:programSlug`
  - `/summer-camps/:programSlug/:batchSlug`
- Subject / program pages:
  - `/phonics`
  - `/grammar`
  - `/speaking`
  - `/courses/phonics-foundation`
  - `/courses/phonics-brush-up`
  - `/courses/phonics-advanced`
  - `/courses/grammar`
  - `/courses/grammar-mastery`
  - `/courses/public-speaking-foundations`
  - `/courses/public-speaking-excellence`
- Parent hub:
  - `/parents`
  - `/parents/getting-started`
  - `/parents/choosing-course`
  - `/parents/scheduling`
  - `/parents/payments`
  - `/parents/tracking-progress`
  - `/parents/helping-with-homework`
  - `/parents/phonics-mission`
  - `/parents/reading-at-home`
  - `/parents/speech-confidence`
  - `/parents/common-mistakes`
- Blog:
  - `/blog`
  - explicit static blog pages
  - `/blog/:slug`
- Long-tail public pages:
  - `/reading-classes-for-kids`
  - `/writing-classes-for-kids`
  - `/phonics-fees-india`
  - `/online-english-classes-for-kids-india`
  - `/online-english-classes-hyderabad`
  - `/english-classes-for-4-year-old`
  - `/english-classes-for-5-year-old`
  - `/english-classes-for-6-year-old`
  - `/english-classes-for-7-10-year-old`
  - `/child-not-reading-properly`
  - `/slow-reader-child-help`
  - `/shy-child-speaking-confidence`
  - `/reading-fluency-program`
  - `/confidence-building-program-kids`
  - `/english-foundation-program`
  - `/summer-camp-for-kids-india`
  - `/summer-reading-program-kids`
  - `/summer-speaking-camp-kids`
  - additional public landing pages such as `/online-phonics-reading-classes`, `/english-grammar-writing-classes`, `/public-speaking-communication-kids`, `/spoken-english-classes-for-kids`, `/phonics-classes-for-kids`

### Non-indexable / private route groups discovered

- `/login`, `/*/login`
- `/surya/**`
- `/admin/**`
- `/teacher/**`
- `/parent/**`
- `/kids/**`
- `/messages/**`
- `/learning-partner/dashboard/**`
- `/dev/**`

## Sitemap Coverage

### Current sitemap files

- `/sitemap.xml`
- `/sitemap-static.xml`
- `/sitemap-blog.xml`
- `/sitemap-courses.xml`
- `/sitemap-parents.xml`

### Currently included route inventories

- Static marketing routes are driven from [scripts/seo-route-inventory.mjs](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/seo-route-inventory.mjs)
- Course sitemap routes are driven from [src/lib/publicCoursePages.js](/Users/tinysteps/Documents/Tinysteps-react-v1/src/lib/publicCoursePages.js)
- Parent routes are driven from [scripts/seo-route-inventory.mjs](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/seo-route-inventory.mjs)
- Blog routes are assembled by file scanning in [scripts/generate-sitemaps.js](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/generate-sitemaps.js)

### Must-index routes that should remain in canonical sitemaps

- `/`
- `/courses/phonics`
  - Note: this is currently a subject page mismatch. The live canonical public route is `/phonics`, not `/courses/phonics`.
- `/courses/phonics-foundation`
- `/courses/phonics-advanced`
- `/courses/grammar-mastery`
- `/courses/public-speaking-foundations`
- `/parents/choosing-course`
- `/parents/phonics-mission`
- `/for-schools`
- `/blog/what-is-phonics-for-kids`
- `/blog/online-english-classes-for-kids-india`
- `/blog/cvc-words-explained-for-parents`
- `/blog/long-vowel-sounds-for-kids`
- `/blog/how-kids-learn-blending`

### Sitemap defects found

- `P0`: blog discovery in both [scripts/generate-sitemaps.js](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/generate-sitemaps.js) and [scripts/prerender.mjs](/Users/tinysteps/Documents/Tinysteps-react-v1/scripts/prerender.mjs) still points to non-existent `src/content/blog.ts`.
- `P0`: prerender coverage for blog routes is brittle because it partially depends on link discovery from `/blog`. Any post not rendered or linked on that page can miss prerender output and then hit the `/blog/**` 404 rewrite.
- `P1`: sitemap policy for `week-*` posts is inconsistent. Some are excluded, many are still included, and the rule is not based on a clear intent-quality standard.
- `P1`: static route inventory does not fully match the public router, so route additions can drift out of sitemap coverage.

## Duplicate, Legacy, and Conflicting Routes

### Clear redirect-source URLs

- `/main/**`
- `/resources`, `/main/resources`
- `/privacy`, `/privacy.html`
- `/terms.html`, `/terms-of-service`
- old blog aliases like `/blog/week1`, `/blog/week6.html`
- course aliases like `/courses/phonics-foundations`, `/courses/basic-grammar`

### Redirect / route conflicts

- `P0`: hosting redirects in [firebase.json](/Users/tinysteps/Documents/Tinysteps-react-v1/firebase.json) conflict with real public page components for:
  - `/online-phonics-reading-classes`
  - `/english-grammar-writing-classes`
  - `/public-speaking-communication-kids`
  - `/spoken-english-classes-for-kids`
  - `/phonics-classes-for-kids`
- These URLs have live React routes but some are still hard-redirected at the CDN layer. That means:
  - router intent and hosting intent disagree
  - internal links can point to URLs that never serve their own HTML
  - Search Console can see mixed canonical/redirect behavior

### Legacy rewrite risk

- `P0`: `/blog/**`, `/courses/**`, and `/main/**` are rewritten to the `notFoundRoute` Cloud Function before the SPA fallback.
- This is acceptable only when prerendered HTML exists for every intended public route.
- Any prerender miss becomes a hard 404 with `noindex`, which is severe for indexing recovery.

## Thin / Low-Value Page Review

### Stronger `week-*` pages worth keeping indexable

- `/blog/week-1-phonics-satpin-launch`
- `/blog/week-7-grammar-nouns-to-paragraphs`
- `/blog/week-12-speaking-confidence-seeds`

Reason:

- these titles are closer to real parent search intent
- they are already reframed as roadmap / guide style pages
- they can support leads if linked to relevant course pages

### Weak `week-*` pages that should not stay in the sitemap without stronger differentiation

- `/blog/week-8-grammar-tenses`
- `/blog/week-9-grammar-conjunctions`
- `/blog/week-10-grammar-subject-verb`
- `/blog/week-11-grammar-creative-writing`
- `/blog/week-13-speaking-structure`
- `/blog/week-14-speaking-visual-aids`
- `/blog/week-15-speaking-debate-starters`
- `/blog/week-16-phonics-summer-plan`
- `/blog/week-17-grammar-assessment`
- `/blog/week-18-speaking-video-feedback`
- `/blog/week-19-phonics-multisyllabic`
- `/blog/week-20-grammar-editing-camp`
- `/blog/week-21-speaking-competition-prep`
- `/blog/week-22-phonics-diagnostics`
- `/blog/week-23-grammar-speaking-bridge`
- `/blog/week-24-speaking-family-showcase`
- `/blog/week-25-back-to-school-plan`
- `/blog/week-26-screen-smart-summer-routine`

Reason:

- titles still read like internal calendar content rather than durable search landing pages
- many are useful support posts but not strong canonical acquisition pages
- they compete with stronger evergreen posts already in the content library

Recommended action:

- remove from sitemap now
- keep accessible
- selectively noindex weak `week-*` pages unless later rewritten into evergreen intent pages

## Lead-Critical Pages

- `/`
- `/phonics`
- `/grammar`
- `/speaking`
- `/courses/phonics-foundation`
- `/courses/phonics-advanced`
- `/courses/grammar-mastery`
- `/courses/public-speaking-foundations`
- `/parents/choosing-course`
- `/parents/phonics-mission`
- `/for-schools`
- `/reading-classes-for-kids`
- `/online-english-classes-for-kids-india`
- `/book-demo`
- the five must-index blog URLs listed above

## SEO / Metadata Findings

- Runtime SEO is centralized well in [src/lib/seo.ts](/Users/tinysteps/Documents/Tinysteps-react-v1/src/lib/seo.ts), but many pages still depend on client-side `useEffect` calls to `applySeo`.
- That is workable only because prerender captures hydrated HTML. Coverage gaps in prerender become indexing gaps.
- Canonical generation is generally clean:
  - no query params
  - no trailing slash output
  - absolute canonical URL from `SITE_ORIGIN`
- `P1`: there is still route-catalog drift between:
  - router definitions
  - route SEO registry
  - sitemap inventories
  - firebase redirects

## Robots Findings

- [public/robots.txt](/Users/tinysteps/Documents/Tinysteps-react-v1/public/robots.txt) is broadly correct:
  - public crawl allowed
  - private app areas disallowed
  - sitemap reference present
- No evidence that public CSS/JS/assets are blocked.
- `P2`: robots contains a lot of crawler-specific duplication. It is not harmful, but it is hard to maintain.

## Conversion Tracking Findings

- Existing tracking foundation is good:
  - page views
  - CTA clicks
  - WhatsApp clicks
  - phone / email clicks
  - form start
  - form submit
- Gaps against requested lead funnel:
  - `P0`: no explicit `form_error` event
  - `P1`: no explicit `course_page_cta_click` event
  - `P1`: no explicit `parent_course_interest` event
- `P1`: some high-intent pages rely only on global click capture rather than page-specific event names
- Forms already show visible success / error states, but error analytics are missing

## Core Web Vitals Findings

### Positive existing work

- analytics and Sentry are delayed from the main boot path in [src/main.tsx](/Users/tinysteps/Documents/Tinysteps-react-v1/src/main.tsx)
- public routes are heavily lazy-loaded in [src/app/routes.tsx](/Users/tinysteps/Documents/Tinysteps-react-v1/src/app/routes.tsx)
- bundle chunking is already customized in [vite.config.ts](/Users/tinysteps/Documents/Tinysteps-react-v1/vite.config.ts)
- the home page already defers many below-fold sections

### Remaining CWV risks

- `P0`: route-level SEO/indexability depends on prerender output, so any slow or failed prerender can create missing HTML pages, not just performance regressions.
- `P1`: the router file is very large and defines the entire public and private app surface in one client bundle entry.
- `P1`: several public pages still ship large decorative UI blocks, glassmorphism, and many lazy sections; these are not fatal, but they increase layout/render work on mobile.
- `P1`: long-tail marketing pages and private app areas are separated by chunking, but the public surface is still broad enough that build output should be validated for oversized chunks.
- `P2`: some public pages use runtime-only SEO effects instead of static metadata sources, which makes HTML correctness more dependent on hydration timing.

## Root Causes

- Public SEO is spread across four independent systems:
  - router
  - route SEO registry
  - sitemap inventories
  - firebase redirects
- Blog route discovery is partly broken by stale file references.
- Weak weekly content is still treated too much like evergreen search inventory.
- Some real public landing pages are contradicted by hosting redirects.
- Lead tracking taxonomy is incomplete for the requested business events.

## Recommended Fixes

### P0

- Fix sitemap and prerender blog discovery so it reads the real post source tree, not `src/content/blog.ts`.
- Remove weak `week-*` posts from sitemap coverage and set a clear policy for which weekly pages may remain indexable.
- Align hosting redirects with canonical public routes so live URLs and React routes stop disagreeing.
- Add explicit `form_error` tracking.

### P1

- Add explicit `course_page_cta_click` and `parent_course_interest` events on lead-critical pages.
- Strengthen CTA/trust/pricing blocks on `/parents/choosing-course`, `/parents/phonics-mission`, `/for-schools`, and canonical course detail pages.
- Tighten route inventory alignment so sitemap inputs match the real public router.
- Keep only canonical public HTML routes in the sitemap and avoid weak support pages posing as acquisition pages.

### P2

- Reduce maintenance duplication in `robots.txt`.
- Expand automated checks for:
  - sitemap inclusion/exclusion
  - `/main/*` redirects
  - weak weekly post exclusion
  - form error / CTA analytics hooks
