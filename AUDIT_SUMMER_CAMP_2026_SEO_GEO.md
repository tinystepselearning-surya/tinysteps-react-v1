# AUDIT: Summer English Camp 2026 + Year-Round SEO/GEO Implementation
**Date:** 1 Feb 2026  
**Status:** AUDIT ONLY – No files changed  
**Scope:** Routing, SEO infrastructure, content gaps, and implementation plan

---

## A) ROUTING SUMMARY

### Framework
- **Framework:** React Router v6 (createBrowserRouter)
- **Location:** `src/app/routes.tsx` (336 lines)
- **Lazy loading:** All pages use `lazy()` + `<Suspense>` for code splitting
- **Layout pattern:** Outer layout (`<Layout>`) wraps all public routes; provides Header, main, FloatingAssistant, BackToTopButton

### Routes File(s)
- **Primary:** `src/app/routes.tsx`
- **Entry point:** `src/app/index.tsx` imports routes
- **Root app:** `src/app.tsx` (main app component)

### How to Add a New Page (Standard Process)
1. **Create page component:**  
   - File: `src/pages/{PageName}.tsx` (or in subdirectory like `src/pages/public/SummerCamp2026.tsx`)
   - Use functional component with `useEffect` + `applySeo()` from `src/lib/seo.ts`
   - Use `<Meta>` component from `src/components/common/Meta.tsx` OR call `applySeo()` directly (both work)

2. **Add lazy import to `src/app/routes.tsx`:**
   ```tsx
   const SummerCampPage = lazy(() => import('../pages/public/SummerCamp2026'));
   ```

3. **Add route entry in routes array (inside Layout children):**
   ```tsx
   { path: 'summer-english-camp-2026', element: <SummerCampPage /> },
   ```

4. **Test:** Navigate to `http://localhost:5173/summer-english-camp-2026`

### Current Relevant Routes (Public, Non-Auth)
```
/                                     → HomePage
/blog                                 → BlogPage
/blog/:slug                           → BlogPostPage
/pricing                              → PricingPage
/contact                              → ContactPage
/why-tiny-steps                       → WhyTinyStepsPage
/courses                              → CoursesPage
/courses/:courseId                    → CourseDetailPage
/curriculum                           → CurriculumPage
/phonics                              → PhonicsPage (course landing)
/grammar                              → GrammarPage (course landing)
/speaking                             → SpeakingPage (course landing)
/parents                              → ParentsHubPage
/parents/getting-started              → ParentGettingStarted
/parents/choosing-course              → ParentChoosingCourse
/parents/scheduling                   → ParentScheduling
/parents/payments                     → ParentPaymentsPage
/parents/tracking-progress            → ParentTracking
/parents/helping-with-homework        → ParentHomework
/parents/phonics-mission              → ParentPhonicsMission
/parents/reading-at-home              → ParentReading
/parents/speech-confidence            → ParentSpeaking
/parents/common-mistakes              → ParentCommonMistakes
/faq                                  → FAQPage
/for-schools                          → ForSchoolsPage
```

---

## B) SEO INFRASTRUCTURE SUMMARY

### Meta Component Path(s)
- **Location:** `src/components/common/Meta.tsx` (81 lines)
- **API:** 
  ```tsx
  <Meta 
    title="Page Title"
    description="Meta description..."
    keywords="optional,keywords"
    canonical="/path" // optional; auto-computes from window.location.pathname
    jsonLd={schemaObject} // optional
  />
  ```
- **Behavior:** Sets `<title>`, `<meta name="description">`, `<meta name="keywords">` (optional), `<link rel="canonical">`, OpenGraph, Twitter Card, and optional JSON-LD
- **Note:** Both `<Meta>` component AND `applySeo()` utility can be used; they're compatible. `applySeo()` is lower-level utility called by `Meta`.

### SEO Utility Path(s)
- **Primary utility:** `src/lib/seo.ts` (121 lines)
- **Function:** `applySeo(config: SeoConfig)` 
- **Config type:**
  ```typescript
  type SeoConfig = {
    title: string;                    // Required
    description?: string;             // Optional
    canonicalPath?: string;           // Optional; auto-computed from URL
    noIndex?: boolean;                // For private/test pages
    robots?: string;                  // e.g., "noindex, nofollow"
    ogType?: "website" | "article";   // Defaults to "website"
    ogImage?: string;                 // Absolute URL or "/path"
    jsonLd?: object | object[];       // Schema markup
  };
  ```
- **Usage:** Called in `useEffect()` in page components OR inside `<Meta>` component

### Canonical Handling
- **Auto-computation:** If `canonical` prop omitted in `<Meta>`, it uses `window.location.pathname`
- **URL formation:** `https://tinystepslearning.com{pathname}`
- **Override:** Can pass explicit `canonical="/custom-path"` to override
- **No duplicates expected:** Each page should have exactly one canonical (self-referential by default)

### OG/Twitter Handling
- **OpenGraph tags:** Auto-set from title, description, type, and optional ogImage
- **Twitter Card:** `twitter:title`, `twitter:description` auto-synced with OG
- **Image strategy:** 
  - If `ogImage` provided in `applySeo()`, use it
  - If route is `/parents/*`, default to `/og-parents.png` (located in public/)
  - Otherwise, no OG image set
- **Fallback:** Pages without explicit ogImage will use site defaults; add per-page images later if needed

### Sitemap/Robots Status
- **Robots.txt:** ✅ Present at `public/robots.txt` (73 lines)
  - Allows: `/`, `/blog`, `/courses`, `/curriculum`, `/pricing`, `/contact`, `/faq`, `/phonics`, `/grammar`, `/speaking`, `/for-schools`
  - Disallows: `/admin/`, `/surya/`, `/teacher/`, `/parent/`, `/kids/`, `/learning-partner/`, `/dev/`, etc.
  - Includes: `Sitemap:` entries for main + blog + courses sitemaps
  - **AI bots:** Permits `OAI-SearchBot`, `Perplexity`, `GPTBot`

- **Sitemaps:** ✅ Multiple sitemaps generated
  - `public/sitemap.xml` (Main index; references all 4 sitemaps)
  - `public/sitemap-static.xml` (12 static pages: /, /blog, /courses, /phonics, /grammar, /speaking, /pricing, /contact, /why-tiny-steps, /faq, /for-schools, /curriculum)
  - `public/sitemap-blog.xml` (Blog posts; dynamic)
  - `public/sitemap-courses.xml` (Course listings; dynamic)
  - `public/sitemap-parents.xml` (Parent hub pages; 10+ pages)
  - **LastMod:** Updated 2026-01-29
  - **Strategy:** Priority 1.0 (homepage), 0.9 (main pages), 0.8 (secondary), 0.7 (tertiary)

### JSON-LD Schema Currently Present?
**YES** ✅ Extensive schema support:

1. **Location:** `src/lib/schemas.ts` (188 lines)
   - `organizationSchema` – Full org details (name, URL, logo, contact, socials, ratings)
   - `localBusinessSchema` – LocalBusiness type with address, phone, email
   - Additional schemas likely present for Course, Event, etc.

2. **In use (verified):**
   - **HomePage.tsx:** Uses `organizationSchema` + `localBusinessSchema`
   - **PhonicsPage.tsx:** Uses Course schema with hasCourseInstance
   - **GrammarPage.tsx:** Presumed to use Course schema
   - **SpeakingPage.tsx:** Presumed to use Course schema
   - **FAQPage.tsx:** Uses FAQPage schema with all Q&A as mainEntity
   - **ParentsHubPage + subpages:** Use HowTo, CollectionPage schemas (from parentsMeta.ts)

3. **Features:**
   - speakable property on FAQs (for voice search)
   - AggregateRating on Organization schema
   - Course metadata (provider, description, hasCourseInstance, etc.)

4. **How it's set:**
   - Passed via `jsonLd` prop in `<Meta>` component or `applySeo()` config
   - Rendered as `<script type="application/ld+json">` in document head
   - Multiple schemas possible (array support)

---

## C) GAPS & RECOMMENDATIONS

### Missing Pages (Required for Campaign)
1. ❌ **`/summer-english-camp-2026`** – Main landing page for summer camp
   - Should include: dates, eligibility, curriculum modules, enrollment CTA, testimonials
   - Recommendation: Create as standalone page OR extend from Courses

2. ❌ **`/online-phonics-reading-classes`** – Dedicated phonics landing (separate from `/phonics`)
   - Current `/phonics` is course detail; new page would be for lead gen
   - Recommendation: Keep `/phonics` as-is, create new dedicated lead-gen page

3. ❌ **`/english-grammar-writing-classes`** – Dedicated grammar landing
   - Similar to above; separate from `/grammar` course page

4. ❌ **`/public-speaking-communication-kids`** – Dedicated speaking landing
   - Similar to above; separate from `/speaking` course page

5. ⚠️ **`/faqs` (central hub)**
   - Currently: Single FAQ page at `/faq` (FAQPage.tsx)
   - Status: Exists but may need expansion for new course FAQs
   - Recommendation: Extend current `/faq` with Summer Camp, Hyderabad local, etc.

### Optional Local SEO Pages (Future Phase)
- `/hyderabad-online-phonics-classes`
- `/hyderabad-public-speaking-classes-kids`
- `/bangalore-online-english-tuition`
- etc. (one per city + course combo if needed)

### Weak Meta Tags (Current Issues)
1. **Many pages missing explicit keywords** – E.g., HomePage uses keywords but individual course pages may not
2. **No per-page OG images** – Fallback to parents default or nothing; recommend adding `ogImage` per page
3. **Course pages (phonics/grammar/speaking)** – Have basic meta; could be richer with pricing, testimonials in meta description

### Duplicate Titles/Descriptions
- ⚠️ **HomePage + WhyTinyStepsPage** – Both generic; ensure unique
- ⚠️ **PhonicsPage vs ParentPhonicsMission** – Both about phonics; titles differ but descriptions overlap slightly
- **Recommendation:** Audit all 30+ pages; current Meta component prevents duplicates IF titles set correctly

### Missing Canonicals
- **Status:** Most pages set canonical implicitly via `applySeo()` using `window.location.pathname`
- **Risk:** SPAs can have multiple URLs for same content (e.g., query params); ensure trailing slashes consistent
- **Recommendation:** Verify all routes render without trailing slashes in sitemap

### Missing Structured Data (Opportunities)
1. ❌ **Event schema** – For Summer Camp 2026 (dates, location, capacity, price)
2. ❌ **Course schema on grammar/speaking** – Only phonics.tsx uses it; grammar.tsx and speaking.tsx likely don't
3. ❌ **VideoObject schema** – If there are embedded videos on pages
4. ⚠️ **LocalBusiness schema** – Present but could be extended with `areaServed` (Hyderabad, Bangalore, etc.) for local SEO

---

## D) PROPOSED NEW ROUTES & FILE TARGETS

### For Summer English Camp 2026
**Route:** `/summer-english-camp-2026`  
**Component name:** `SummerCamp2026Page`  
**File location:** `src/pages/public/SummerCamp2026Page.tsx` (recommended)  
**Reuse from:**
- Layout: Standard `<Layout>` (automatic)
- Hero section: Adapt `ProgramHero` or create custom (see phonics.tsx for pattern)
- FAQ: Use `FAQAccordion` from `src/components/FAQ/FAQAccordion.tsx`
- Form: Reuse `BookAssessmentForm` from `src/components/forms/BookAssessmentForm.tsx`
- Schema: Extend `organizationSchema` + add `EventSchema` (dates, price, location)

**Meta structure:**
```tsx
title: "Summer English Camp 2026 | Phonics, Grammar & Public Speaking (Ages 5–12)"
description: "7-week intensive summer camp: phonics, grammar, public speaking. Live mentors, daily practice, capstone video. Limited seats. Book now."
keywords: "summer camp kids, English camp 2026, phonics summer camp, speaking camp kids"
canonical: "/summer-english-camp-2026"
jsonLd: [organizationSchema, EventSchema]
```

---

### For Online Phonics/Reading Classes (Lead-Gen)
**Route:** `/online-phonics-reading-classes`  
**Component name:** `OnlinePhonicsReadingPage`  
**File location:** `src/pages/public/OnlinePhonicsReadingPage.tsx`  
**Reuse from:**
- Layout: Standard
- Hero: Similar to `/phonics`, but add "Why Choose Us" section
- Levels/Journey: Adapt from PhonicsPage.tsx
- Testimonials: Reuse from HomePage or create shared component
- Form: BookAssessmentForm
- Schema: CourseSchema from phonics.tsx, add LocalBusiness for Hyderabad

**Meta:**
```tsx
title: "Online Phonics & Reading Classes for Kids (Ages 3–8) | Tiny Steps"
description: "Personalized online phonics classes with live mentors. SATPIN to fluency in 12 weeks. AI-guided practice, weekly reports."
keywords: "online phonics classes, reading classes kids, phonics tuition online"
canonical: "/online-phonics-reading-classes"
```

---

### For English Grammar & Writing Classes (Lead-Gen)
**Route:** `/english-grammar-writing-classes`  
**Component name:** `EnglishGrammarWritingPage`  
**File location:** `src/pages/public/EnglishGrammarWritingPage.tsx`  
**Reuse from:**
- Layout, hero, testimonials: Same as phonics lead-gen
- Levels: Adapt from GrammarPage.tsx
- Form: BookAssessmentForm
- Schema: CourseSchema for Grammar

**Meta:**
```tsx
title: "Online English Grammar & Writing Classes (Ages 5–12) | Tiny Steps"
description: "Master grammar and writing with live mentors. Interactive lessons, games, writing prompts. From nouns to essays."
keywords: "grammar classes online, writing classes for kids, English grammar tuition"
canonical: "/english-grammar-writing-classes"
```

---

### For Public Speaking & Communication (Lead-Gen)
**Route:** `/public-speaking-communication-kids`  
**Component name:** `PublicSpeakingCommunicationPage`  
**File location:** `src/pages/public/PublicSpeakingCommunicationPage.tsx`  
**Reuse from:**
- Layout, hero, testimonials
- Levels: Adapt from SpeakingPage.tsx
- Form: BookAssessmentForm
- Schema: CourseSchema for Speaking

**Meta:**
```tsx
title: "Online Public Speaking & Communication Classes for Kids (Ages 4–12) | Tiny Steps"
description: "Build confidence and communication skills. S.P.E.A.K. method, storytelling, presentations with live mentors."
keywords: "public speaking classes kids, communication courses children, speech training online"
canonical: "/public-speaking-communication-kids"
```

---

### For Central FAQ Hub (Expansion)
**Route:** `/faqs` (rename current `/faq` to `/faqs` OR keep as-is and alias `/faqs`)  
**Component:** Extend `FAQPage.tsx`  
**Changes:**
- Add new FAQ categories: "Summer Camp", "Local (Hyderabad)", "Pricing & Billing"
- Ensure FAQPage schema updated with new Q&A
- Add breadcrumb navigation (Summer Camp → FAQs, etc.)

**Current `/faq` status:**
- ✅ Already has FAQPage.tsx with 20 FAQs + FAQPage schema
- ✅ Categories: phonics, grammar, speaking, online
- Extend: Add "summer-camp", "local", "pricing" categories

**Meta (no change needed):**
```tsx
title: "FAQs | Tiny Steps Learning"
description: "Answers to common questions about phonics, grammar, public speaking, online learning."
canonical: "/faq" // or "/faqs" if renamed
```

---

### Optional Local SEO Pages (Deferred to Phase 2)
**Route pattern:** `/hyderabad-{course}-classes` or `/{city}-online-{course}-tuition`  
**Examples:**
- `/hyderabad-online-phonics-classes` → HyderabadPhonicsPage.tsx
- `/bangalore-public-speaking-courses` → BangalorePublicSpeakingPage.tsx

**Recommendation:** Defer these to Phase 2; set up routing skeleton now if desired, but hold content.

---

## E) BLOCKERS / QUESTIONS

### Technical Readiness
- ✅ **No blockers identified**
- ✅ All dependencies already present (React Router, applySeo, Meta component)
- ✅ Sitemap generation likely handled by build process or manual (verify Step F below)
- ✅ JSON-LD schema support exists

### Decision Points (Not Blockers)
1. **Rename `/faq` → `/faqs`?**
   - Current: `/faq` (singular)
   - Convention: `/faqs` (plural)
   - **Recommendation:** Keep `/faq` for backward link compatibility; consider 301 redirect if SEO concern

2. **Summer Camp as standalone or course variant?**
   - Standalone page at `/summer-english-camp-2026` (recommended for clarity)
   - Alt: Add as course in database with special tagging
   - **Recommendation:** Standalone page for faster launch

3. **Local SEO cities priority?**
   - Hyderabad? Bangalore? Both? Others?
   - **Recommendation:** Start with Hyderabad (largest market), expand Phase 2

4. **Blog integration for Summer Camp SEO?**
   - Should there be blog posts: "5 Benefits of Summer Camp", "How to Prepare", etc.?
   - **Recommendation:** Yes, plan 3–5 blog posts post-launch (not in this phase)

---

## F) VERIFICATION COMMANDS (Run from Repo Root)

### 1. Verify routing structure
```bash
grep -n "path:" src/app/routes.tsx | head -30
```
**Output:** List of current routes

### 2. Check Meta component usage across pages
```bash
grep -r "import.*Meta\|<Meta\|applySeo" src/pages --include="*.tsx" | wc -l
```
**Output:** Count of pages using Meta or applySeo

### 3. List all pages in /pages directory
```bash
find src/pages -name "*.tsx" -type f | sort
```
**Output:** Full inventory of page components

### 4. Verify SEO utilities
```bash
ls -la src/lib/seo* src/lib/schema*
```
**Output:** Confirm seo.ts and schemas.ts exist

### 5. Check current sitemaps
```bash
ls -la public/sitemap*.xml && echo "---" && wc -l public/sitemap*.xml
```
**Output:** Sitemap files and line counts

### 6. Verify robots.txt
```bash
head -20 public/robots.txt && echo "..." && tail -10 public/robots.txt
```
**Output:** First and last lines of robots.txt

### 7. Search for JSON-LD usage
```bash
grep -r "FAQPage\|EventSchema\|CourseSchema" src --include="*.tsx" --include="*.ts"
```
**Output:** List of files using schema

### 8. Check app entry point
```bash
cat src/app.tsx | head -30
```
**Output:** Confirm React app structure

---

## SUMMARY TABLE

| Item | Status | Location | Notes |
|------|--------|----------|-------|
| **Routing Framework** | ✅ React Router v6 | src/app/routes.tsx | Lazy loading + Suspense |
| **Meta Component** | ✅ Exists | src/components/common/Meta.tsx | Full SEO support |
| **applySeo Utility** | ✅ Exists | src/lib/seo.ts | Title, description, canonical, OG, Twitter, robots, JSON-LD |
| **Schemas** | ✅ Exists | src/lib/schemas.ts | Organization, LocalBusiness, Course, FAQPage, etc. |
| **Sitemap** | ✅ Present | public/sitemap*.xml | 5 files; static + dynamic (blog, courses, parents) |
| **Robots.txt** | ✅ Present | public/robots.txt | Allows public routes; disallows admin/auth |
| **Summer Camp Page** | ❌ Missing | — | Need: SummerCamp2026Page.tsx at path `/summer-english-camp-2026` |
| **Phonics Lead-Gen Page** | ❌ Missing | — | Need: OnlinePhonicsReadingPage.tsx at `/online-phonics-reading-classes` |
| **Grammar Lead-Gen Page** | ❌ Missing | — | Need: EnglishGrammarWritingPage.tsx at `/english-grammar-writing-classes` |
| **Speaking Lead-Gen Page** | ❌ Missing | — | Need: PublicSpeakingCommunicationPage.tsx at `/public-speaking-communication-kids` |
| **FAQ Expansion** | ⚠️ Partial | src/pages/FAQPage.tsx | Already has 20 FAQs; needs new categories (summer, local, pricing) |
| **Local SEO Pages** | ❌ Missing | — | Deferred to Phase 2 (e.g., /hyderabad-online-phonics-classes) |
| **OG Images (Per-page)** | ⚠️ Limited | public/og-*.png | Only /og-parents.png; others need per-page images later |
| **JSON-LD on all pages** | ⚠️ Partial | src/lib/schemas.ts + pages | Phonics/Grammar/Speaking pages could have richer Course schema |

---

## NEXT STEPS (Read → Plan → Code)

### Phase 1: Planning & Approval (TODAY – Feb 1)
- [ ] Review this audit
- [ ] Approve Summer Camp dates/pricing/curriculum
- [ ] Confirm lead-gen page URLs
- [ ] Decide: rename /faq → /faqs or keep?

### Phase 2: Create Pages (Week of Feb 3)
- [ ] Create 5 new page files (SummerCamp, OnlinePhonics, EnglishGrammar, PublicSpeaking, FAQ expansion)
- [ ] Add lazy imports to routes.tsx
- [ ] Add route entries
- [ ] Test navigation

### Phase 3: SEO & Schema (Week of Feb 10)
- [ ] Add Event schema for Summer Camp
- [ ] Enhance Course schemas for Grammar & Speaking pages
- [ ] Add per-page OG images
- [ ] Update sitemaps (manual or auto if build script exists)

### Phase 4: Content & CopyPrime (Week of Feb 17)
- [ ] Write landing page copy
- [ ] Add testimonials & social proof
- [ ] Create blog posts for SEO support

### Phase 5: Testing & Launch (Week of Feb 24)
- [ ] GSC submission for new pages
- [ ] Core Web Vitals check
- [ ] A/B test CTAs
- [ ] Monitor rankings

---

**AUDIT COMPLETE** ✅  
**Ready for Phase 2: Code Implementation**  
**Questions?** Refer to route examples in src/app/routes.tsx and page examples in src/pages/{phonics,grammar,speaking}.tsx

