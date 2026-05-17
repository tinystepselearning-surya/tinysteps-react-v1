# GSC Index Recovery Final QA

## 1. Executive Summary
- Scope reviewed: 13 upgraded static pages, 8 upgraded blog posts, sitemap cleanup for 12 low-priority weekly posts.
- Technical baseline: `docs/sitemap-indexability-audit.md` currently reports:
  - Total sitemap resources: 4
  - Total page URLs audited: 128
  - OK page URLs: 128
  - Non-OK page URLs: 0
- Overall QA status: **PASS** for indexability, sitemap hygiene, canonical consistency, and intent alignment.
- Important note: the 12 weekly posts were removed from sitemap inclusion only; routes/posts remain live.

## 2. Static Page QA Table

| URL | Route file exists | H1/hero intent match | routeSeo title aligned | Self-canonical | In sitemap | FAQ schema check | Key internal links present | Thin/duplicate risk | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/child-not-reading-properly` | Yes (`src/pages/public/ChildNotReadingProperlyPage.tsx`) | Yes (`Child Not Reading Properly? Start by Finding the Real Gap`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/phonics`, `/reading-classes-for-kids`, `/courses`, `/book-demo`, `/slow-reader-child-help`) | Low | PASS |
| `/slow-reader-child-help` | Yes (`src/pages/public/SlowReaderChildHelpPage.tsx`) | Yes (`Slow Reader Child Help: Find the Right Reading Support`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/reading-classes-for-kids`, `/phonics`, `/child-not-reading-properly`, `/courses`, `/book-demo`) | Low | PASS |
| `/online-english-classes-for-kids-india` | Yes (`src/pages/public/OnlineEnglishClassesForKidsIndiaPage.tsx`) | Yes (`Online English Classes for Kids in India`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/phonics`, `/grammar`, `/reading-classes-for-kids`, `/speaking`, `/courses`, `/book-demo`) | Low | PASS |
| `/reading-fluency-program` | Yes (`src/pages/public/ReadingFluencyProgramPage.tsx`) | Yes (`Reading Fluency Program for Kids Who Read Slowly`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/reading-classes-for-kids`, `/child-not-reading-properly`, `/slow-reader-child-help`, `/phonics`, `/courses`, `/book-demo`) | Low | PASS |
| `/shy-child-speaking-confidence` | Yes (`src/pages/public/ShyChildSpeakingConfidencePage.tsx`) | Yes (`Shy Child Speaking Confidence Help for Parents`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/speaking`, `/grammar`, `/reading-classes-for-kids`, `/courses`, `/book-demo`) | Low | PASS |
| `/english-classes-for-5-year-old` | Yes (`src/pages/public/EnglishClassesFor5YearOldPage.tsx`) | Yes (`Online English Classes for 5-Year-Old Children`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/phonics`, `/reading-classes-for-kids`, `/courses`, `/book-demo`) | Low | PASS |
| `/english-classes-for-7-10-year-old` | Yes (`src/pages/public/EnglishClassesFor7To10YearOldPage.tsx`) | Yes (`Online English Classes for Ages 7-10`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/grammar`, `/speaking`, `/reading-classes-for-kids`, `/writing-classes-for-kids`, `/courses`, `/book-demo`) | Low | PASS |
| `/parents/choosing-course` | Yes (`src/pages/parents/choosing-course.tsx`) | Yes (`How to Choose the Right Tiny Steps Course for Your Child`) | Yes | Yes | `sitemap-parents.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/courses`, `/phonics`, `/grammar`, `/speaking`, `/reading-classes-for-kids`, `/writing-classes-for-kids`, `/book-demo`) | Low | PASS |
| `/confidence-building-program-kids` | Yes (`src/pages/public/ConfidenceBuildingProgramKidsPage.tsx`) | Yes (`Confidence Building Program for Kids: Communication Pathway`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/shy-child-speaking-confidence`, `/speaking`, `/grammar`, `/reading-classes-for-kids`, `/courses`, `/book-demo`) | Low | PASS |
| `/english-foundation-program` | Yes (`src/pages/public/EnglishFoundationProgramPage.tsx`) | Yes (`English Foundation Program for Kids: Reading, Grammar, and Confidence`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/courses`, `/phonics`, `/grammar`, `/reading-classes-for-kids`, `/writing-classes-for-kids`, `/speaking`, `/book-demo`) | Low | PASS |
| `/summer-reading-program-kids` | Yes (`src/pages/public/SummerReadingProgramKidsPage.tsx`) | Yes (`Summer Reading Program for Kids: Fluency and Confidence`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/summer-camps`, `/reading-classes-for-kids`, `/phonics`, `/child-not-reading-properly`, `/slow-reader-child-help`, `/courses`, `/book-demo`) | Medium (seasonal) | PASS |
| `/summer-speaking-camp-kids` | Yes (`src/pages/public/SummerSpeakingCampKidsPage.tsx`) | Yes (`Summer Speaking Camp for Kids: Communication Confidence`) | Yes | Yes | `sitemap-static.xml` | `createFAQPageSchema` called once; no duplicate signal | Yes (`/summer-camps`, `/speaking`, `/confidence-building-program-kids`, `/shy-child-speaking-confidence`, `/grammar`, `/courses`, `/book-demo`) | Medium (seasonal) | PASS |
| `/parents` | Yes (`src/pages/parents/ParentsHubPage.tsx`) | Yes (`Parents Hub: Choose the Right Learning Path for Your Child`) | Yes | Yes | `sitemap-parents.xml` | FAQ content present + one explicit FAQPage node; no duplicate signal | Yes (`/parents/choosing-course`, `/parents/tracking-progress`, `/courses`, `/phonics`, `/grammar`, `/speaking`, `/reading-classes-for-kids`, `/writing-classes-for-kids`, `/book-demo`) | Low | PASS |

## 3. Blog Post QA Table

| URL | Post file exists | Title intent match | Focus/meta alignment | FAQ presence | Required internal links present | In sitemap-blog.xml | Differentiated from competing URL(s) | Status |
|---|---|---|---|---|---|---|---|---|
| `/blog/child-knows-abc-but-cannot-read` | Yes (`src/content/blog/posts/phonics/child-knows-abc-but-cannot-read.ts`) | Yes | `focus` field aligned to parent diagnostic intent; no separate `excerpt/metaDescription` field in this post type | Yes (6 Q&A) | Yes (`/child-not-reading-properly`, `/phonics`, `/reading-classes-for-kids`, `/slow-reader-child-help`, `/book-demo`) | Yes | Yes (diagnostic checklist angle vs commercial support page) | PASS |
| `/blog/best-online-phonics-classes-for-kids` | Yes | Yes | `focus` aligned to comparison checklist intent; no separate `excerpt/metaDescription` field in this post type | Yes (6 Q&A) | Yes (`/phonics`, `/courses`, `/book-demo`, `/best-online-phonics-classes-india`, plus support links) | Yes | Yes (evaluation checklist angle vs core program page) | PASS |
| `/blog/phonics-games-for-letter-sounds` | Yes | Yes | `focus` aligned to letter-sound daily routine intent | Yes (6 Q&A) | Yes (`/blog/online-phonics-games`, `/phonics`, `/reading-classes-for-kids`, `/child-not-reading-properly`, `/book-demo`) | Yes | Yes (specific daily routine vs broader games guide) | PASS |
| `/blog/why-parents-choose-online-phonics` | Yes | Yes | `focus` aligned to fit-based parent decision intent | Yes (6 Q&A) | Yes (`/phonics`, `/courses`, `/book-demo`, `/blog/best-online-phonics-classes-for-kids`, `/reading-classes-for-kids`, `/slow-reader-child-help`) | Yes | Yes (fit-decision lens vs comparison checklist and main phonics page) | PASS |
| `/blog/online-phonics-classes-vs-school` | Yes | Yes | `focus` aligned to school-vs-online decision support intent | Yes (6 Q&A) | Yes (`/phonics`, `/courses`, `/book-demo`, `/child-not-reading-properly`, `/slow-reader-child-help`, `/reading-classes-for-kids`) | Yes | Yes (explicit comparative decision guide) | PASS |
| `/blog/online-phonics-games` | Yes | Yes | `focus` aligned to game quality evaluation intent | Yes (6 Q&A) | Yes (`/phonics`, `/blog/phonics-games-for-letter-sounds`, `/reading-classes-for-kids`, `/child-not-reading-properly`, `/slow-reader-child-help`, `/book-demo`) | Yes | Yes (broad evaluation guide vs routine post) | PASS |
| `/blog/phonics-blending-activities` | Yes | Yes | `focus` aligned to blending-gap practical support intent | Yes (6 Q&A) | Yes (`/phonics`, `/child-not-reading-properly`, `/reading-classes-for-kids`, `/slow-reader-child-help`, `/reading-fluency-program`, `/book-demo`) | Yes | Yes (blending intervention guide vs generic phonics page) | PASS |
| `/blog/science-of-phonics-learning` | Yes | Yes | `focus` aligned to evidence-informed parent decision intent | Yes (6 Q&A) | Yes (`/phonics`, `/child-not-reading-properly`, `/reading-classes-for-kids`, `/slow-reader-child-help`, `/reading-fluency-program`, `/book-demo`, `/blog/online-phonics-classes-vs-school`) | Yes | Yes (phonics vs sight words balance and action pathway) | PASS |

## 4. Sitemap Cleanup Verification

### 4.1 Weekly posts excluded from sitemap-blog.xml (verified absent)
- `/blog/week-26-screen-smart-summer-routine`
- `/blog/week-22-phonics-diagnostics`
- `/blog/week-12-speaking-confidence-seeds`
- `/blog/week-16-phonics-summer-plan`
- `/blog/week-3-phonics-tricky-words`
- `/blog/week-19-phonics-multisyllabic`
- `/blog/week-9-grammar-conjunctions`
- `/blog/week-15-speaking-debate-starters`
- `/blog/week-14-speaking-visual-aids`
- `/blog/week-11-grammar-creative-writing`
- `/blog/week-23-grammar-speaking-bridge`
- `/blog/week-17-grammar-assessment`

### 4.2 Upgraded blog posts still in sitemap-blog.xml (verified present)
- `/blog/child-knows-abc-but-cannot-read`
- `/blog/best-online-phonics-classes-for-kids`
- `/blog/phonics-games-for-letter-sounds`
- `/blog/why-parents-choose-online-phonics`
- `/blog/online-phonics-classes-vs-school`
- `/blog/online-phonics-games`
- `/blog/phonics-blending-activities`
- `/blog/science-of-phonics-learning`

### 4.3 Static upgraded pages in sitemap files (verified)
- `sitemap-static.xml`: all listed upgraded static pages except parents hub routes.
- `sitemap-parents.xml`: `/parents`, `/parents/choosing-course`.

### 4.4 Intentional policy note
The 12 weekly posts above remain live on-site and routable. They are only excluded from sitemap submission temporarily until upgraded to evergreen intent.

## 5. Remaining Risks / Follow-up Items
- Seasonal pages (`/summer-reading-program-kids`, `/summer-speaking-camp-kids`) may still see off-season crawl/index volatility despite stronger evergreen framing.
- Parent-hub and decision pages can still compete if internal anchor text remains too generic in older articles; keep reinforcing intent-specific link text from future content updates.
- Phonics cluster still has multiple commercial/informational URLs; differentiation is improved, but continuous internal linking discipline is needed to avoid future cannibalization.
- For phonics SEO post type (`PhonicsSeoPost`), there is no explicit `excerpt/metaDescription` field per post; metadata relies on page-level fallback generation from available fields. This is functional, but should be watched for snippet quality in GSC.

## 6. Google Search Console Submission Priority List
Manual indexing request order (top 10):
1. `/child-not-reading-properly`
2. `/slow-reader-child-help`
3. `/online-english-classes-for-kids-india`
4. `/reading-fluency-program`
5. `/shy-child-speaking-confidence`
6. `/english-classes-for-5-year-old`
7. `/english-classes-for-7-10-year-old`
8. `/parents/choosing-course`
9. `/blog/child-knows-abc-but-cannot-read`
10. `/blog/best-online-phonics-classes-for-kids`
