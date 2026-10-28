# Tiny Steps — Rolling Search Readiness Snapshot (2026-10-29 IST)

## Slot 1 — 29 October 2026 (00:13–00:14 IST)

**Preflight:** Re-fetched the tracker from `seo-url-health-tracker` and validated 202 records, 202 unique URLs, sequential indices, valid 22-column CSV rows, slots 1–19 with 10 URLs each and slot 20 with 12. At run start, **0 URLs had a verified 29 October IST check timestamp**; all 202 prior attempts belonged to 28 October IST and were excluded from today's coverage. Slot 1 rows 1–10 were eligible and were the only URLs probed.

**Executed:** Ten distinct read-only HTTPS `curl -L` probes, one per URL, at **2026-10-28T18:43:12.197425Z–2026-10-28T18:43:37.541637Z UTC** (29 October IST). Each returned **exit code 6** with exact error `curl: (6) Could not resolve host: tinystepslearning.com`; **no origin HTTP response** was obtained. Separately, `web.open` returned substantive, page-specific extracted text and H1s for all ten URLs (home, blog, resources hub, phonics hub, CK, Floss, QU, CH, KN, NG guides). Provider crawl labels were 'today' for the homepage and 'yesterday' for the other nine; provider crawl times are not known. These text results are **provider-only partial evidence**, not verified initial origin HTML.

**Today's coverage after Slot 1:** **10/202 distinct URLs attempted (4.95%)**, **192 not yet checked**, **0 fully origin-verified PASS**, **0 confirmed production FAIL/WARN**, **10 UNVERIFIED**. Historical `today_ist` and UTC timestamps on rows 11–202 were preserved but **do not count as today's coverage**. The 10 distinct new probe timestamps map to 29 October IST. HTTP status, final redirect destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot rules, raw initial HTML and JSON-LD remain UNVERIFIED. DNS failure is scoped to the audit environment and does not prove production outage.

**Workflow safety:** Direct public GitHub API requests for the workflow's administrative state and active runs were inaccessible; no concurrent SEO audit was positively observed, but its absence and disablement could not be independently verified. Proceeded under the user's explicit 25 October disable confirmation. Cron YAML presence alone is not evidence of enablement. No GitHub Actions workflow was run or changed.

**Changes:** No dated before/after evidence establishes a production regression or improvement, so `CHANGES.md` is unchanged. Next eligible slot: **Slot 2, rows 11–20**. No production source, hosting, workflow or Firebase settings changed. The separate six-hour global visibility audit is unaffected.

---

## Slot 22 — 28 October reconciliation (no new URL probes)

At **28 October 2026 at 21:17 IST** (**2026-10-28T15:47:28.510Z UTC**), re-fetched and validated the current tracker, summary and changes ledger on `seo-url-health-tracker`. The CSV has **202 rows, 202 unique URLs, sequential indices, 22 columns per row, and correct 10×19 + 12 slot allocation**. All **202** records have unique, parseable UTC timestamps that map to **28 October IST**, with status **UNVERIFIED**. **Zero eligible unchecked URLs** remain; no URL was rechecked and no timestamp was added or modified.

**Verification limitation:** Daily attempted coverage is **202/202**, but **0/202 fully origin-verified**. Earlier probe evidence documents audit-environment DNS failures before origin HTTP response. Consequently, live HTTP status, redirects, canonical, robots/noindex, bot access, raw HTML and structured data remain unverified; this does not establish a production outage. The **30 historical PASS** records remain historical only, and **190 older evidence fragments** retain the documented truncation caveat.

**Workflow safety:** The public GitHub API requests for administrative workflow state and active runs were inaccessible during this reconciliation; no independent conclusion about enablement or concurrent runs can be drawn. Proceeding under the user's 25 October confirmation that the old workflow was disabled. Cron YAML is not evidence of enablement. No workflow was executed, enabled or changed.

**Changes:** No new verified production FAIL/WARN, improvement, or coverage gap. `MASTER_URL_TRACKER.csv` and `CHANGES.md` remain unchanged. Slots 23–24 are catch-up only if previously unchecked eligible URLs appear; none currently do. The separate six-hour global visibility audit remains unchanged.

## Slot 21 — 28 October reconciliation (no new URL probes)

At **28 October 2026 at 20:11:29 IST** (**2026-10-28T14:41:29.559Z UTC**), re-read all three tracker files from `seo-url-health-tracker` and reconciled existing evidence **without requesting or rechecking any public URL**. The CSV has **202 records, 202 unique URLs, sequential indices 1–202 and 22 fields per row**; slots 1–19 have ten URLs each and slot 20 has twelve. All **202** records have **distinct valid UTC probe timestamps mapping to 28 October IST** and status **UNVERIFIED**. There are **zero eligible unchecked URLs**. No future slot was scanned, and no timestamp or technical-readiness result was backfilled.

**Verification boundary:** 202 URLs were attempted in Slots 1–20, but **zero are fully origin-verified**. Earlier HTTPS probes encountered DNS resolution failures in the audit environment, so origin HTTP response, redirects, canonical, robots/noindex and structured data remain unverified; this is **not evidence of a production outage**. The 30 historical PASS values dated 25 October remain historical only. The prior Slot 20 CSV repair is retained; **190 pre-repair evidence fragments are explicitly caveated as potentially truncated**, and this reconciliation did not reconstruct them or claim new live checks.

**Workflow safety:** An independent attempt to read the former workflow's administrative state and active GitHub Actions runs through public GitHub API endpoints was inaccessible in this environment. Therefore **no concurrent audit was positively observed, but absence of one and administrative disablement could not be independently verified**. Continue under the user's 25 October workflow-disable confirmation. Cron YAML alone is not evidence of enablement. No GitHub workflow was run, enabled or modified.

**Changes:** No verified production regression, improvement, or new current-day coverage gap. `MASTER_URL_TRACKER.csv` and `CHANGES.md` remain unchanged. **Next:** Slot 22 reconciliation; Slots 23–24 catch-up only if eligible unchecked URLs appear. The separate six-hour global visibility audit remains unchanged.

## Daily coverage — 28 October IST (after Slot 20)

| Metric | Count |
| --- | ---: |
| Selected unique URLs | **202** |
| Distinct URLs actually attempted today | **202 (100%)** |
| Fully origin-verified PASS today | **0** |
| Confirmed production FAIL today | **0** |
| Confirmed production WARN today | **0** |
| UNVERIFIED / provider-only partial evidence today | **202** |
| Not yet checked today | **0** |

**Preflight and completion:** Exactly 202 unique selected URLs, sequential indices 1–202, slots 1–19 with ten URLs each and slot 20 with twelve. Before Slot 20, 190 distinct valid UTC check timestamps mapped to 28 October IST; only rows 191–202 were eligible and attempted. After Slot 20, all 202 UTC check timestamps are distinct and map to 28 October IST. No earlier row was rechecked, no future slot was scanned, and no yesterday timestamp was counted as today's coverage.

**Verification boundary:** All 202 URLs remain **UNVERIFIED** for full live-origin technical readiness. Provider-extracted text is not independent proof of origin HTTP status, redirect destination, canonical, robots/noindex, bot permissions, raw initial HTML or JSON-LD. DNS resolution failures in this audit environment are not production outages. No Google/Bing indexing, rankings, AI citations or production transitions were verified.

**Tracker data-integrity repair (operational, not production):** The tracker read before Slot 20 had 202 rows and valid URL/slot/check-time columns, but its last four columns had been corrupted by prior CSV serialization: fragments of quoted reason/evidence text occupied `last_verified_status` and `last_verified_at_utc`. This run restored a valid 22-column CSV using the last intact 26 October full-cycle snapshot for historical verification fields (including 30 historical PASS records), retained all 190 existing 28 October UTC check timestamps, and preserved available pre-repair evidence fragments with an explicit truncation caveat. The 12 new Slot 20 observations were added separately. This repair does **not** imply fresh verification or a production change for rows 1–190.

**Workflow safety:** Live GitHub Actions run queries returned zero queued and zero in-progress runs; no concurrent audit was positively observed. The administrative workflow-state endpoint was rejected, so disablement could not be independently verified. Continue under the user's 25 October confirmation. No GitHub workflow was executed, enabled or changed.

**Next:** Slots 21–22 are reconciliation/recovery, and 23–24 are catch-up only if eligible unchecked URLs emerge. At present zero remain. Do not recheck 28 October's 202 attempted URLs. The separate six-hour global visibility task is unchanged.

## Slot 20 — advanced courses and parent guidance (19:18 IST)

At **2026-10-28T13:48:12.718270Z–13:48:27.897256Z UTC**, the ChatGPT-native auditor attempted the 12 previously unchecked-for-today URLs (rows 191–202). All twelve exact URLs returned substantive page-specific text via direct web.open. The provider labelled snapshots **Crawled: yesterday** (precise crawl times unavailable); these are extracted snapshots, not independently verified origin HTML.

- 191 `/courses/grammar-mastery` — H1: “Advanced Grammar Mastery Classes for Kids”
- 192 `/courses/public-speaking-foundations` — H1: “Public Speaking Foundations for Kids”
- 193 `/courses/public-speaking-excellence` — H1: “Public Speaking Excellence for Kids”
- 194 `/parents` — H1: “Parents Hub: Choose the Right Learning Path for Your Child”
- 195 `/parents/getting-started` — H1: “Getting Started with Tiny Steps”
- 196 `/parents/choosing-course` — H1: “How to Choose the Right Tiny Steps Course for Your Child”
- 197 `/parents/tracking-progress` — H1: “How to Track Your Child’s English Learning Progress”
- 198 `/parents/helping-with-homework` — H1: “Helping with homework”
- 199 `/parents/phonics-mission` — H1: “Phonics Mission: A Research-Backed 7-Day Starter Plan for Parents”
- 200 `/parents/reading-at-home` — H1: “Reading at Home: A Practical 10-Minute Parent Routine”
- 201 `/parents/speech-confidence` — H1: “How to Build Speaking Confidence in Children Without Adding Pressure”
- 202 `/parents/common-mistakes` — H1: “Common Parent Mistakes That Can Slow English Learning Progress”

**Independent HTTPS GETs:** Eleven `curl -L` probes failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. One (row 199) failed before HTTP with exit **28**, exact stderr `curl: (28) Resolving timed out after 10000 milliseconds`. Each actual UTC start/end and error is recorded in the tracker. No origin HTTP response or headers were obtained. `STATUS:000` is a curl placeholder, not a production status; `FINAL` and `REDIRECTS:0` are not verified redirect observations.

**Comparison:** The 27 October Slot 20 attempts also lacked origin HTTP verification. There is no dated before/after evidence of a production regression or improvement. The tracker schema repair is an operational evidence-quality change only.

## Slot 19 — phonics, reading and speaking guides; level-specific course pages (18:14 IST)

At **2026-10-28T12:44:22.568212Z–12:44:37.640723Z UTC**, ChatGPT attempted ten previously unchecked-for-today URLs (rows 181–190). All ten exact URLs returned substantive page-specific provider-extracted text through direct web.open, labelled **Crawled today** (precise provider crawl times unknown). This is evidence of provider retrieval, not independent live origin verification.

- 181 `/blog/what-is-phonics-for-kids` — provider H1: “What Is Phonics for Kids? A Parent Start-Here Guide”
- 182 `/blog/why-child-knows-letter-sounds-but-cannot-read-words` — provider H1: “Why Does My Child Know Letter Sounds But Cannot Read Words?”
- 183 `/blog/why-child-reads-words-but-does-not-understand-story` — provider H1: “Why Does My Child Read Words But Not Understand Stories?”
- 184 `/blog/why-letter-sounds-are-not-enough-to-read` — provider H1: “Why Letter Sounds Alone Are Not Enough for Reading: What Schools Should Teach Next”
- 185 `/blog/why-parents-choose-online-phonics` — provider H1: “Why Parents Choose Online Phonics Classes for Kids”
- 186 `/blog/why-public-speaking-is-important-for-kids` — provider H1: “Why Public Speaking Is Important for Kids”
- 187 `/courses/phonics-foundation` — provider H1: “Phonics Foundation Course for Kids | Beginner Phonics Classes”
- 188 `/courses/phonics-brush-up` — provider H1: “Early Phonics Course for Kids | Digraphs, Long Vowels & Decoding”
- 189 `/courses/phonics-advanced` — provider H1: “Advanced Phonics Course for Kids | Longer Words, Spelling & Fluency”
- 190 `/courses/grammar` — provider H1: “Beginner Grammar Foundations: Sentence Building & Punctuation”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with distinct actual UTC start/end timestamps recorded per URL in the tracker. All ten failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. No origin HTTP response or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status; the effective URL is not a verified redirect destination. Audit-runtime DNS failure does not establish a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, final destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, raw initial HTML and JSON-LD remain unverified. No dated before/after production transition; `CHANGES.md` unchanged.

## Slot 18 — speaking, phonics methodology and reading readiness guides (17:15 IST)

At **2026-10-28T11:45:51.177849Z–11:46:01.223111Z UTC**, ChatGPT attempted ten previously unchecked-for-today URLs (rows 171–180). All ten exact URLs returned substantive page-specific provider-extracted text via direct web.open, labelled **Crawled today** (exact provider crawl time unknown). This is evidence of provider retrieval, not independent live origin verification.

- 171 `/blog/speaking-competition-prep` — provider H1: “Public Speaking Competition Checklist for Kids: How to Prepare Step by Step”
- 172 `/blog/speaking-confidence-seeds` — provider H1: “How to Build Speaking Confidence in Kids: A 7-Day Calm Practice Plan”
- 173 `/blog/speaking-debate-starters` — provider H1: “Debate Topics and Starters for Kids and Tweens to Build Speaking Confidence”
- 174 `/blog/speaking-family-showcase` — provider H1: “Public Speaking Activities for Kids at Home: Host a Family Showcase”
- 175 `/blog/speaking-structure` — provider H1: “How to Structure a Speech for Kids: Hook, Body and Conclusion”
- 176 `/blog/speaking-video-feedback` — provider H1: “How Video Feedback Helps Kids Improve Public Speaking”
- 177 `/blog/speaking-visual-aids` — provider H1: “How Kids Can Use Visual Aids in Public Speaking”
- 178 `/blog/synthetic-phonics-vs-traditional-reading` — provider H1: “Synthetic Phonics vs Traditional Reading: How Parents Decide What to Use”
- 179 `/blog/systematic-cumulative-phonics-explained-for-schools` — provider H1: “Systematic and Cumulative Phonics: A School Leader’s Guide to Implementation”
- 180 `/blog/what-age-to-start-phonics` — provider H1: “What Is the Right Age to Start Phonics? A Parent Readiness Guide”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with distinct actual UTC start/end timestamps recorded per URL in the tracker. All ten failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. No origin HTTP response or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status, and the reported effective URL is not a verified redirect destination. Audit-runtime DNS failure does not establish a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, final destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, raw initial HTML and JSON-LD remain unverified. No dated before/after production transition; `CHANGES.md` unchanged.

## Slot 17 — phonics, reading, grammar and speaking guides (16:14 IST)

At **2026-10-28T10:44:30.518869Z–10:44:40.810493Z UTC**, ChatGPT attempted ten previously unchecked-for-today URLs (rows 161–170). Nine exact URLs returned substantive page-specific provider-extracted text via direct web.open, labelled **Crawled today**. Row 162's direct open was inaccessible, but a provider search result followed by web.open returned substantive page-specific cached text labelled **Crawled last week**. Provider crawl timestamps were not available. Neither modality is independent live origin verification.

- 161 `/blog/phonics-tricky-words` — provider H1: “How to Teach Tricky Words to Kids Without Encouraging Guessing”
- 162 `/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics` — provider H1: “Phonological Awareness vs Phonemic Awareness vs Phonics: A Parent Guide” (cached snapshot crawled last week; direct web.open initially inaccessible)
- 163 `/blog/prevent-summer-slide-reading` — provider H1: “How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)”
- 164 `/blog/public-speaking-delivery-for-kids` — provider H1: “Public Speaking Delivery for Kids: Pace, Volume, Pauses and Audience Connection”
- 165 `/blog/punctuation-and-capital-letters-for-kids` — provider H1: “Punctuation and Capital Letters for Kids: A Parent Guide to Clear Sentences”
- 166 `/blog/r-controlled-vowels-explained` — provider H1: “R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order”
- 167 `/blog/satpin-phonics-guide` — provider H1: “SATPIN Phonics Guide: Sounds, Order, Words & Blending”
- 168 `/blog/science-of-phonics-learning` — provider H1: “Phonics vs Sight Words: What Helps Children Read Better”
- 169 `/blog/screen-smart-summer-routine-for-kids` — provider H1: “Screen-Smart Summer Learning Routine for Kids: Balance English Practice and Screen Time”
- 170 `/blog/sight-words-or-phonics-first` — provider H1: “Should Children Memorize Sight Words or Learn Phonics First?”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed, with distinct actual UTC start/end timestamps recorded per URL. All ten failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. No origin HTTP response or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status, and `url_effective` is not a verified redirect. Audit-runtime DNS failure is not proof of a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, final destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, raw initial HTML and JSON-LD remain unverified. No dated before/after production transition; `CHANGES.md` unchanged.

## Slot 16 — phonics parent guides and school implementation (15:18 IST)

At **2026-10-28T09:48:13.789443Z–09:48:31.670280Z UTC**, ChatGPT attempted ten previously unchecked-for-today URLs (rows 151–160). All ten exact URLs returned substantive page-specific provider-extracted text with a visible H1, labelled **Crawled: yesterday**; precise provider crawl timestamps were unavailable. This is not independent live origin verification.

- 151 `/blog/phonics-for-parents-guide` — provider H1: “Phonics for Parents: What It Is, How It Works, and How to Support Reading at Home”
- 152 `/blog/phonics-games-for-letter-sounds` — provider H1: “Phonics Games for Letter Sounds: Parent Routine for Daily Practice”
- 153 `/blog/phonics-long-vowels` — provider H1: “Long Vowel Practice for Kids: Simple Activities for Common Patterns”
- 154 `/blog/phonics-multisyllabic` — provider H1: “How to Help Kids Read Multisyllabic Words: Simple Chunking Practice”
- 155 `/blog/phonics-r-controlled` — provider H1: “R-Controlled Vowel Practice for Kids: ar, er, ir, or and ur”
- 156 `/blog/phonics-rules-for-beginners` — provider H1: “Phonics Rules for Beginners: The Right Sequence and When to Move Ahead”
- 157 `/blog/phonics-satpin-launch` — provider H1: “SATPIN at Home: A Parent Launch Plan for Early Blending and Reading”
- 158 `/blog/phonics-scope-and-sequence-for-cbse-schools` — provider H1: “Phonics Scope and Sequence for CBSE Schools: From Sounds to Independent Reading”
- 159 `/blog/phonics-summer-plan` — provider H1: “Summer Phonics Practice for Kids: A 10-Minute Daily Routine”
- 160 `/blog/phonics-teacher-training-for-schools-implementation` — provider H1: “Phonics Teacher Training for Schools: Why a Workshop Alone Is Not Implementation”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed, with distinct actual UTC start/end timestamps recorded per URL in the tracker. All ten failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. No origin HTTP responses or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status; `url_effective` does not establish a redirect. Audit-runtime DNS failures do not establish a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, final destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, initial HTML and JSON-LD remain unverified. No verified dated before/after production transition; `CHANGES.md` unchanged.

## Slot 15 — phonics practice and parent decision guides (14:13 IST)

At **2026-10-28T08:43:28.677137Z–08:43:43.728955Z UTC**, ChatGPT attempted ten previously unchecked-for-today URLs (rows 141–150). All ten exact URLs returned substantive page-specific provider-extracted text with a visible H1, labelled **Crawled: yesterday**; precise provider crawl timestamps were unavailable. These are not independently verified live origin responses.

- 141 `/blog/june-school-reopening-english-readiness-plan` — provider H1: “School Reopening English Readiness Checklist for Kids: Reading, Writing and Speaking”
- 142 `/blog/long-vowel-sounds-for-kids` — provider H1: “Long Vowel Sounds for Kids: Rules, Patterns & Examples”
- 143 `/blog/online-english-classes-for-kids-india` — provider H1: “Online English Classes for Kids in India: A Parent Decision Guide (Ages 3–12)”
- 144 `/blog/online-phonics-classes-vs-school` — provider H1: “Online Phonics Classes vs School: What Works for Which Child”
- 145 `/blog/online-phonics-games` — provider H1: “Online Phonics Games for Kids: What Actually Builds Reading”
- 146 `/blog/phonics-activities-for-kids-at-home` — provider H1: “Phonics Activities at Home: A Parent Routine That Actually Sticks”
- 147 `/blog/phonics-blending-activities` — provider H1: “Phonics Blending Activities That Help Children Read Words Confidently”
- 148 `/blog/phonics-blending-club` — provider H1: “Blending Practice for Kids at Home: A Simple Daily Routine”
- 149 `/blog/phonics-comprehension` — provider H1: “From Decoding to Comprehension: How to Help Kids Understand What They Read”
- 150 `/blog/phonics-diagnostics` — provider H1: “Phonics Assessment Checklist for Parents Before a New School Term”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with distinct actual UTC start/end timestamps recorded per URL in the tracker. Nine failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. One (row 148) failed with exit **28**, exact stderr `curl: (28) Resolving timed out after 10000 milliseconds`. No origin HTTP responses or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status; `url_effective` does not establish a redirect. Audit-runtime DNS failures do not establish a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, final destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, initial HTML and JSON-LD remain unverified. No verified dated before/after production transition; `CHANGES.md` unchanged.

## Slot 14 — English learning, writing and school phonics guides (13:14 IST)

At **2026-10-28T07:44:15.619043Z–07:44:30.676726Z UTC**, ChatGPT attempted ten previously unchecked URLs (rows 131–140). All ten exact URLs returned substantive page-specific provider-extracted text and a visible H1, labelled **Crawled: yesterday**; precise provider crawl timestamps were not available. These are not independent live origin responses.

- 131 `/blog/how-phonics-grammar-and-communication-work-together` — provider H1: “How Phonics, Grammar and Communication Work Together in a Child’s English Learning”
- 132 `/blog/how-phonics-improves-spelling` — provider H1: “How Phonics Improves Spelling: A Parent Encoding Roadmap”
- 133 `/blog/how-schools-can-assess-decoding-not-memorisation` — provider H1: “How Schools Can Assess Decoding Instead of Word Memorisation”
- 134 `/blog/how-to-engage-kids-in-english-learning-at-home` — provider H1: “How to Keep Kids Engaged in English Practice at Home: Phonics, Grammar and Speaking”
- 135 `/blog/how-to-improve-reading-fluency-in-children` — provider H1: “How to Improve Reading Fluency in Children: Accuracy, Phrasing and Meaning”
- 136 `/blog/how-to-improve-sentence-formation-in-kids` — provider H1: “How to Improve Sentence Formation in Kids”
- 137 `/blog/how-to-teach-paragraph-writing-to-kids` — provider H1: “How to Teach Paragraph Writing to Kids: From One Main Idea to Clear Details”
- 138 `/blog/how-to-teach-storytelling-to-kids` — provider H1: “How to Teach Storytelling to Kids: Sequence, Detail and Clear Retelling”
- 139 `/blog/how-vocabulary-supports-reading-comprehension` — provider H1: “How Vocabulary Supports Reading Comprehension: A Parent Guide”
- 140 `/blog/international-phonics-benchmarks-for-indian-schools` — provider H1: “International Phonics Benchmarks for Indian Schools: What to Include in a Complete Programme”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with distinct actual UTC start/end timestamps recorded per URL in the tracker. All ten failed before HTTP with exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`. No origin HTTP response or headers. `HTTP_CODE:000` is a curl placeholder, not a server status; `url_effective` does not prove redirects. Audit-runtime DNS failures do not establish a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, redirect destination, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, initial HTML and JSON-LD remain unverified. No dated verified production before/after transition; `CHANGES.md` unchanged.

## Slot 13 — grammar and phonics reading guides (12:19 IST)

At **2026-10-28T06:49:44.465361Z–06:49:59.566759Z UTC**, ChatGPT attempted ten previously unchecked URLs (rows 121–130). Nine exact URLs returned substantive page-specific provider-extracted text with visible H1s, labelled **Crawled: yesterday** (exact crawl timestamps unknown). Row 126 could not be opened directly; a search excerpt labelled **Crawled: last month** was found, insufficient for current page availability.

- 121 `/blog/grammar-editing-camp` — provider H1: “Grammar Editing Practice for Kids: Find and Fix Common Mistakes”
- 122 `/blog/grammar-nouns-to-paragraphs` — provider H1: “Grammar Basics for Kids: From Nouns to Paragraphs — A Parent Roadmap”
- 123 `/blog/grammar-speaking-bridge` — provider H1: “Story Cards for Kids: Build Grammar and Speaking Skills Together”
- 124 `/blog/grammar-subject-verb` — provider H1: “Subject-Verb Agreement for Kids: Rules, Examples & Mistakes”
- 125 `/blog/grammar-tenses` — provider H1: “English Tenses for Kids: Simple Present, Past and Future Explained”
- 126 `/blog/how-children-recognise-words-automatically-after-phonics` — older search excerpt: “How Children Recognise Words Automatically After Phonics”
- 127 `/blog/how-kids-learn-blending` — provider H1: “How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track”
- 128 `/blog/how-long-does-phonics-take` — provider H1: “How Long Does Phonics Take? A Realistic Parent Guide to Progress”
- 129 `/blog/how-phonics-builds-reading-confidence` — provider H1: “How Phonics Builds Reading Confidence: What Changes First at Home”
- 130 `/blog/how-phonics-classes-help-kids-read` — provider H1: “How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with actual individual UTC start/end timestamps in tracker. Nine failed exit **6**, exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`; one (row 123) failed exit **28**, exact stderr `curl: (28) Resolving timed out after 10000 milliseconds`. No origin HTTP response or headers. `HTTP_CODE:000` is curl's placeholder, not a server HTTP status; `url_effective` does not verify redirects. Audit-runtime DNS failures do not prove a production outage.

**Result:** Ten **UNVERIFIED** for full origin readiness; zero confirmed production PASS/WARN/FAIL. Origin status, final redirect destination, canonical, robots/noindex, Googlebot/Bingbot/OAI-SearchBot permissions, initial HTML and JSON-LD remain unverified. No verified before/after production transition; `CHANGES.md` unchanged.

## Slot 12 — parent learning challenges, phonics and grammar articles (11:18 IST)

At **2026-10-28T05:48:45.207434Z–05:48:53.262460Z UTC**, ChatGPT attempted ten previously unchecked Slot 12 URLs (rows 111–120). Each exact URL returned page-specific, substantive provider-extracted text with a visible H1. The provider labelled the content **Crawled: yesterday**, without precise crawl timestamps; this is not independent live origin HTML verification.

- 111 `/blog/child-knows-grammar-but-makes-mistakes` — H1: “My Child Knows Grammar Rules but Still Makes Mistakes — Why?”
- 112 `/blog/child-reads-in-class-but-forgets-at-home` — H1: “Why Can My Child Read in Class but Struggle at Home? What Parents Can Do”
- 113 `/blog/child-understands-english-but-does-not-speak` — H1: “My Child Understands English but Does Not Speak in Class — Is It Confidence or Language?”
- 114 `/blog/conversation-skills-for-kids` — H1: “Conversation Skills for Kids: Listening, Turn-Taking and Better Responses”
- 115 `/blog/cvc-words-explained-for-parents` — H1: “CVC Words Explained for Parents: The First Real Decoding Milestone”
- 116 `/blog/digraphs-and-tricky-words` — H1: “Digraphs and Tricky Words for Kids: Examples & Reading Tips”
- 117 `/blog/does-cbse-include-phonics-ncf-foundational-literacy` — H1: “Does CBSE Include Phonics? What the NCF Says About Foundational Literacy and Early Reading”
- 118 `/blog/grammar-assessment` — H1: “Grammar Assessment for Kids: A Simple Parent Checklist”
- 119 `/blog/grammar-conjunctions` — H1: “Conjunctions for Kids: And, But, Because & So Examples”
- 120 `/blog/grammar-creative-writing` — H1: “Creative Writing Scaffolds for Ages 8–10”

**Independent HTTPS probes:** Ten distinct read-only `curl -L` GETs executed with individual actual UTC start/end timestamps recorded in the tracker. Five failed with exit **6** and exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`; five failed with exit **28**, `curl: (28) Resolving timed out after 8000 milliseconds` (two reported 8001 milliseconds). No origin HTTP response or headers were received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status, and `url_effective` is not a verified redirect destination. These audit-environment DNS failures do **not** establish a production outage.

**Result:** Ten **UNVERIFIED** for full technical readiness; zero confirmed production PASS/WARN/FAIL. Origin HTTP status, redirects, canonical, meta/X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot access, raw initial HTML and JSON-LD remain unverified. No verified before/after production transition; `CHANGES.md` unchanged.

## Slot 11 — summer fast tracks and parent literacy guides (10:11 IST)

At **2026-10-28T04:41:41.324308Z–04:41:50.378466Z UTC**, ChatGPT audited ten previously unchecked URLs (rows 101–110). Each exact URL returned substantive page-specific provider-extracted text with a visible H1 (provider label: **Crawled today**; exact provider crawl time unknown). This is **not** independently verified live origin HTML.

- 101 `/summer-camps/phonics-fast-track` — H1: “Phonics Fast Track”; Historical 2026 programme
- 102 `/summer-camps/grammar-fast-track` — H1: “Grammar Fast Track”; Historical 2026 programme
- 103 `/summer-camps/speaking-fast-track` — H1: “Speaking Fast Track”; Historical 2026 programme
- 104 `/blog/are-phonics-apps-enough-for-kids` — H1: “Are Phonics Apps Enough, or Does a Child Still Need a Teacher?”; Apps and teacher feedback
- 105 `/blog/back-to-school-english-confidence-plan` — H1: “Back-to-School English Confidence Plan for Kids: Speaking, Participation and Classroom Routines”; Classroom participation
- 106 `/blog/benefits-of-phonics-for-kids` — H1: “Benefits of Phonics for Kids: What Parents Usually Notice First”; Decoding and fluency
- 107 `/blog/can-child-improve-english-in-10-days` — H1: “Can a Child Really Improve English in 10 Days? What Parents Should Expect”; Realistic short-course outcomes
- 108 `/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme` — H1: “CBSE Phonics Curriculum vs a Systematic Phonics Programme: What Schools Need to Know”; Framework and programme comparison
- 109 `/blog/child-gives-one-word-answers` — H1: “My Child Gives Only One-Word Answers — How Can I Help Them Speak in Full Sentences?”; Speaking response expansion
- 110 `/blog/child-knows-abc-but-cannot-read` — H1: “Child Knows ABC but Cannot Read: What Parents Should Check First”; ABC-to-reading bottlenecks

**Independent HTTPS probes:** Ten read-only `curl -L` GETs with distinct actual UTC start/end times in the tracker. Six returned exit 6 (`curl: (6) Could not resolve host: tinystepslearning.com`), four returned exit 28 (`curl: (28) Resolving timed out after 9000 milliseconds`). No origin HTTP response was received. `HTTP_CODE:000` is not an HTTP status, and `url_effective` does not prove redirect destination. Audit-runtime DNS failures do not establish a production outage.

**Result:** Ten UNVERIFIED for full technical readiness. HTTP status, redirects, canonical, robots/noindex, X-Robots-Tag, bot permissions, raw initial HTML and JSON-LD remain unverified. The three summer pages explicitly identify concluded 2026 programmes. No verified production before/after transition; `CHANGES.md` unchanged.

## Slot 10 — reading support, confidence and seasonal archives (09:17 IST)

At **2026-10-28T03:47:50.172130Z–03:48:04.225213Z UTC** (28 October IST), ChatGPT audited ten previously unchecked Slot 10 URLs, rows 91–100. All ten exact URLs returned substantive page-specific **provider-extracted** text and visible H1s; provider labels were **Crawled: yesterday**, with no exact provider crawl timestamps. These are content-retrieval observations, **not** independently verified live origin HTTP responses.

- 91 `/child-not-reading-properly` — H1: “Child Not Reading Properly? Start by Finding the Real Gap”; phonics, blending, fluency and comprehension diagnosis
- 92 `/slow-reader-child-help` — H1: “Slow Reader Child Help: Find the Right Reading Support”; fluency and blending guidance
- 93 `/shy-child-speaking-confidence` — H1: “Shy Child Speaking Confidence Help for Parents”; distinguishes quiet behaviour from language needs
- 94 `/reading-fluency-program` — H1: “Online Reading Fluency Classes for Kids”; accuracy, pace, expression and comprehension
- 95 `/confidence-building-program-kids` — H1: “Confidence Building Classes for Kids”; specialist live 1:1 confidence pathway
- 96 `/english-foundation-program` — H1: “English Foundation Program for Kids: Reading, Grammar, and Confidence”; cross-skill foundation
- 97 `/summer-camps` — H1: “Summer Camp 2026: learning design, parent guidance, and year-round next steps”; historical archive, season concluded 13 June
- 98 `/summer-camp-for-kids-india` — H1: “How to choose a useful summer learning programme for your child”; parent planning guide and archive
- 99 `/summer-reading-program-kids` — H1: “Summer Reading Plan for Kids: Decode, Read, Understand”; school-break reading guidance
- 100 `/summer-speaking-camp-kids` — H1: “School-Break Speaking Practice: From Short Answers to Clear Expression”; speaking practice guide

**Independent HTTPS probes:** Ten read-only `curl -L` GETs executed with individual real UTC start/end timestamps recorded in the tracker. Nine failed with exit **6**, `curl: (6) Could not resolve host: tinystepslearning.com`; one (row 96) failed with exit **28**, `curl: (28) Resolving timed out after 9000 milliseconds`. No origin HTTP response was received. `HTTP_CODE:000` is a curl placeholder, not an HTTP status; `url_effective` does not prove a final redirect destination. These audit-environment failures do **not** establish a production outage.

**Result:** Ten UNVERIFIED for full technical readiness; zero verified production PASS/WARN/FAIL. Origin HTTP status, redirects, canonical, meta/X-Robots-Tag, robots/bot permissions, raw initial HTML and JSON-LD remain unverified. The 2026 summer pages explicitly describe historical/archive content, not current enrollment; no regression is inferred. No verified meaningful before/after production transition warrants a `CHANGES.md` entry.

## Slot 9 — writing, pricing, speaking and age-specific English pages (08:18 IST)

At **2026-10-28T02:48:30.917930Z–02:48:39.974092Z UTC** (28 October IST), ChatGPT audited ten previously unchecked Slot 9 URLs, rows 81–90. All ten exact URLs returned substantive, page-specific **provider-extracted** text with visible H1 headings, labelled **Crawled: yesterday** (provider crawl time unknown). This is scoped content visibility evidence, not a live origin HTTP check.

- 81 `/writing-classes-for-kids` — H1: “Creative Writing Classes for Kids Online”; Live 1:1 writing guidance and writing-skills explanation
- 82 `/phonics-fees-india` — H1: “Phonics Class Fees in India”; September 2026 pricing research, provider comparison and class-fee benchmark
- 83 `/english-grammar-writing-classes` — H1: “Grammar Levels Guide: Beginner, Advanced, or Writing?”; 36 Beginner plus 36 Advanced Grammar lessons, writing pathway distinctions
- 84 `/spoken-english-classes-for-kids-online` — H1: “Spoken English Classes for Kids Online”; Live 1:1 speaking guidance and displayed ₹400 per class
- 85 `/online-english-classes-for-kids` — H1: “Online English Classes for Kids”; Ages 3–12, programme overview and displayed ₹400 standard 1:1 rate
- 86 `/online-english-classes-hyderabad` — H1: “Online English Classes for Kids in Hyderabad”; Hyderabad-specific live online classes and ₹400 standard 1:1 rate
- 87 `/english-classes-for-4-year-old` — H1: “English Classes for 4 Year Old”; Listening, letter sounds, early vocabulary and play-based speaking
- 88 `/english-classes-for-5-year-old` — H1: “Online English Classes for 5-Year-Old Children”; Blending, early reading, vocabulary and sentence formation
- 89 `/english-classes-for-6-year-old` — H1: “English Classes for 6 Year Old”; Reading fluency, grammar basics and sentence expression
- 90 `/english-classes-for-7-10-year-old` — H1: “Online English Classes for Ages 7-10”; Reading fluency, grammar, writing and communication

**Independent HTTPS probes:** Ten distinct, read-only `curl -L` GET requests were executed with individual UTC start/end timestamps recorded in the tracker. Six failed with exit **6**, `curl: (6) Could not resolve host: tinystepslearning.com`; four failed with exit **28**, `curl: (28) Resolving timed out after 9000 milliseconds` (some returned 9001 ms). No origin HTTP response was received. `HTTP_CODE:000` is a curl placeholder, not an HTTP response. Effective URL and redirect count do not verify a final destination. The failures occurred in the audit environment and do not prove a production outage.

**Result:** Ten UNVERIFIED for full technical readiness; zero confirmed production PASS/WARN/FAIL. Canonicals, robots/noindex, bot permissions, initial HTML and JSON-LD remain unverified. No verified before/after change warrants a `CHANGES.md` entry.

## Slot 8 — learning games and core commercial pages (07:16 IST)

At **2026-10-28T01:46:19.470572Z–01:46:33.521893Z UTC** (28 October IST), ChatGPT attempted **10 previously unchecked Slot 8 URLs** (rows 71–80). All ten exact URLs yielded substantive page-specific **provider-extracted** text with visible H1s (provider label **Crawled: today**, exact crawl time unspecified). The direct provider open for row 77 initially failed, but following its link from the book-demo page successfully retrieved the framework content. These snapshots do **not** establish live origin status or raw initial HTML.

- 71 `/letter-tracing-with-sounds-game` — H1: “Letter Tracing With Sounds Game”
- 72 `/free-balloon-pop-phonics-game-for-kids` — H1: “Free Phonics Balloon Pop Game for Kids”
- 73 `/free-games/word-meaning-flashcards` — H1: “Vocabulary Adventure”
- 74 `/phonics` — H1: “Online Phonics Classes for Kids”
- 75 `/grammar` — H1: “Online Grammar Classes for Kids”
- 76 `/speaking` — H1: “Online Public Speaking Classes for Kids”
- 77 `/speaking-progress-framework` — H1: “How Tiny Steps Measures Speaking Progress”
- 78 `/for-schools` — H1: “CBSE defines the literacy goal. Tiny Steps builds the implementation pathway.”
- 79 `/book-demo` — H1: “Book a Free 35-Minute 1:1 English Assessment”
- 80 `/reading-classes-for-kids` — H1: “Online Reading Classes for Kids”

**Independent HTTPS probes:** Ten read-only `curl -L` GETs ran with distinct actual UTC start times recorded in the tracker. Nine failed with exit **6**, exact diagnostic `curl: (6) Could not resolve host: tinystepslearning.com`; one (row 77) failed with exit **28**, exact diagnostic `curl: (28) Resolving timed out after 9000 milliseconds`. Every request failed during DNS resolution before any origin HTTP response. `HTTP_CODE:000` is a curl placeholder, not a server response, and `url_effective` is not a verified final redirect destination. These audit-environment failures do **not** prove a production outage.

**Result:** 10 UNVERIFIED for full technical readiness, zero verified production PASS/WARN/FAIL. Origin HTTP status, redirects, canonical, robots/noindex and X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot access, initial HTML and JSON-LD remain unverified. Historical 25 October PASS values for these ten rows are preserved but cannot establish today's production health or a regression. No verified meaningful before/after change warrants a `CHANGES.md` entry.

## Slot 7 — free games and letter tracing (06:14 IST)

At **2026-10-28T00:44:52.741145Z–00:45:01.896278Z UTC** (28 October IST), ChatGPT attempted **10 previously unchecked Slot 7 URLs** (rows 61–70). All ten exact public URLs returned substantive, page-specific provider-extracted content with visible H1s; each was labelled **Crawled: today** (provider crawl time unspecified). This supports content visibility only, not direct origin HTTP verification.

- 61 `/free-speaking-games-for-kids` — H1: “Free Speaking Games for Kids”; provider content lists 4 games, **0 playable now**, all marked coming soon
- 62 `/free-letter-sounds-game-for-kids` — H1: “Free Letter Sounds Game for Kids”
- 63 `/free-sound-listening-game-for-kids` — H1: “Free A-Z Phonics Sounds Game for Kids”
- 64 `/free-word-building-game-for-kids` — H1: “Free Word Building Game for Kids”
- 65 `/free-spelling-game-for-kids` — H1: “Free Spelling Game for Kids”
- 66 `/free-sentence-making-game-for-kids` — H1: “Free Sentence Making Game for Kids”
- 67 `/free-reading-fluency-game-for-kids` — H1: “Free Reading Fluency Game for Kids”
- 68 `/free-grammar-practice-game-for-kids` — H1: “Free Grammar Practice Game for Kids”
- 69 `/free-speaking-practice-game-for-kids` — H1: “Free Speaking Practice Game for Kids”; provider content explicitly marks the game **COMING SOON**
- 70 `/free-letter-tracing-game-for-kids` — H1: “Free ABC Tracing Game for Kids”

**Independent HTTPS probes:** Ten actual read-only `curl -L` GETs were executed with distinct UTC start times recorded in the tracker. **Five failed with exit code 6**, `curl: (6) Could not resolve host: tinystepslearning.com`; **five failed with exit code 28**, `curl: (28) Resolving timed out after 9014/9040/9032/9046/9038 milliseconds`. Every request failed during DNS resolution before receiving an origin HTTP response. All had zero response-header and body bytes. `HTTP_CODE:000` is a curl placeholder, not a server status. `robots.txt` could not be opened independently through the web provider. No production outage is established by these audit-environment errors.

**Result:** 10 UNVERIFIED; zero confirmed production PASS, WARN or FAIL. HTTP status, redirects, canonical, noindex, robots, bot permissions, initial HTML and JSON-LD remain unverified. Speaking game availability is a scoped provider-content observation, **not** a newly verified technical regression. No CHANGES.md entry is warranted.

## Slot 6 — phonics apps and free English games (05:15 IST)

At **2026-10-27T23:45:52.247827Z–23:46:01.287732Z UTC** (28 October IST), ChatGPT attempted **10 previously unchecked Slot 6 URLs** (rows 51–60). All ten exact URLs returned substantive, page-specific provider-extracted text with visible H1s. Nine provider snapshots were labelled **Crawled: yesterday**, and one was labelled **Crawled: today**; these are provider cache labels, not exact origin check times.

- 51 `/phonics-apps-for-preschoolers-india` — H1: “Phonics Apps for Preschoolers in India”
- 52 `/phonics-games-for-preschoolers` — H1: “Phonics Games for Preschoolers”
- 53 `/phonics-learning-games` — H1: “Playful learning games that help children practice phonics with confidence.”
- 54 `/free-english-games-for-kids` — H1: “English Excellence Games”
- 55 `/free-phonics-games-for-kids` — H1: “Free Phonics Games for Kids”
- 56 `/free-letter-sound-games-for-kids` — H1: “Free Letter Sound Games for Kids”
- 57 `/free-word-building-games-for-kids` — H1: “Free Word Building Games for Kids”
- 58 `/free-sentence-building-games-for-kids` — H1: “Free Sentence Building Games for Kids”
- 59 `/free-reading-games-for-kids` — H1: “Free Reading Games for Kids”
- 60 `/free-grammar-games-for-kids` — H1: “Free Grammar Games for Kids”

Ten independent read-only `curl -L` HTTPS GETs were executed at distinct actual UTC start times recorded in the tracker. **Five failed with exit code 6**, diagnostic `curl: (6) Could not resolve host: tinystepslearning.com`; **five failed with exit code 28**, diagnostic `curl: (28) Resolving timed out after 9001/9002 milliseconds`. Every request failed before any origin HTTP response. `HTTP_CODE:000` is a curl placeholder, not a site response; `url_effective` is not a verified redirect destination. This is an **audit-environment DNS limitation**, not evidence that production is down.

**Result:** 10 UNVERIFIED; zero confirmed production PASS, WARN or FAIL. Origin HTTP, redirects, canonical, noindex, robots, bot access, raw HTML and structured data remain unverified. No verified meaningful transition was detected, so CHANGES.md is unchanged.

## Slot 5 — team, trust, courses and commercial comparison (04:16 IST)

At **2026-10-27T22:46:52.979300Z–22:47:18.294862Z UTC** (28 October IST), ChatGPT attempted **10 previously unchecked Slot 5 URLs** (rows 41–50). All ten exact URLs returned substantive, page-specific provider-extracted text with visible H1s. Nine provider snapshots were labelled **Crawled: yesterday**, and the founder profile was labelled **Crawled: today**; these are provider cache labels, not precise origin check times.

- 41 `/why-tiny-steps` — H1: “Why Parents Choose Tiny Steps Learning”
- 42 `/team` — H1: “The academic team behind confident young readers, writers and speakers”
- 43 `/team/vannala-ravali-priya` — H1: “Vannala Ravali Priya”
- 44 `/class-samples` — H1: “See How Tiny Steps Online Classes Work”
- 45 `/testimonials` — H1: “Parent Feedback and Tiny Steps Learning Reviews”
- 46 `/careers` — H1: “Teacher Recruitment Closed — All Positions Filled”
- 47 `/courses` — H1: “Find the Right English Course for Your Child”
- 48 `/curriculum` — H1: “English Curriculum for Kids Ages 3–12”
- 49 `/faq` — H1: “Tiny Steps parent FAQ: classes, fees and English learning”
- 50 `/best-online-phonics-classes-for-kids-in-india` — H1: “Best Online Phonics Classes for Kids in India”

Ten independent read-only `curl -L` HTTPS requests were executed at distinct actual UTC start times recorded in the tracker. **All ten failed before HTTP with exit code 6**, exact diagnostic `curl: (6) Could not resolve host: tinystepslearning.com`. Every request yielded zero origin response-header bytes and zero body bytes. `HTTP_CODE:000` is a curl placeholder, not a site response; the effective URL shown by curl is not a verified redirect destination. This is an **audit-environment DNS limitation**, not evidence that production is down.

**Result:** 10 UNVERIFIED; zero confirmed production PASS, WARN or FAIL. Origin HTTP, redirect, canonical, noindex, robots, bot access, raw HTML and structured data remain unverified. No verified meaningful transition was detected, so CHANGES.md is unchanged.

## Slot 4 — phonics, resource hubs, pricing and contact (03:14 IST)

At **2026-10-27T21:44:01–21:44:11Z UTC** (28 October IST), the ChatGPT-native auditor attempted **10 previously unchecked Slot 4 URLs** (rows 31–40). Nine exact URLs returned provider-extracted substantive, page-specific text with visible H1s (provider label **Crawled: today**, precise crawl time unknown). **Row 31's direct web.open failed**; a separate web search found only a cached excerpt labelled **Crawled: 3 weeks ago**. This is weaker historical evidence, not a fresh successful page retrieval.

- Row 31: `/resources/phonics/ou-ow-phonics` — cached H1: “Why are ou and ow tricky for children?” (direct retrieval blocked; cached 3 weeks ago)
- Row 32: `/resources/phonics/j-sound-spellings-phonics` — H1: “Why can the /j/ sound be written in different ways?”
- Row 33: `/resources/phonics/shun-sound-family-phonics` — H1: “Why can the ending sound /shun/ be spelled in different ways?”
- Row 34: `/resources/phonics/ui-vowel-sound-phonics` — H1: “Why can fruit and moon share a vowel sound with different spellings?”
- Row 35: `/resources/phonics/schwa-sound-for-kids-phonics` — H1: “Why does a written vowel sometimes sound weak or unclear in a longer word?”
- Row 36: `/resources/grammar` — H1: “Grammar & Writing Resources”
- Row 37: `/resources/speaking` — H1: “Speaking & Communication Resources”
- Row 38: `/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading` — H1: “What is Jolly Phonics and is it the best way to teach reading?”
- Row 39: `/pricing` — H1: “Online English Classes for Kids: Fees & Pricing”
- Row 40: `/contact` — H1: “How Can We Help?”

**Independent HTTPS probes:** Ten actual read-only `curl -L` GETs failed during hostname resolution before any HTTP response. **Six** returned exit code **6** (`curl: (6) Could not resolve host: tinystepslearning.com`); **four** returned exit code **28** (`curl: (28) Resolving timed out after 10000 milliseconds`). Distinct per-URL actual UTC start/end timestamps and exact errors are in `MASTER_URL_TRACKER.csv`. `CURL_HTTP_CODE:000` is a curl placeholder, not a server HTTP status; `CURL_EFFECTIVE_URL` is not evidence of a redirect destination. Audit-runtime DNS failures are **not proof of a production outage**.

**Outcome:** Ten additional UNVERIFIED technical-readiness attempts; zero independently verified production PASS/WARN/FAIL. Origin HTTP status, redirects, canonical, robots/noindex and X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot permissions, raw initial HTML and JSON-LD remain unverified. No confirmed production regression or improvement; `CHANGES.md` requires no entry.

**Workflow safety limitation:** Public GitHub Actions state/run endpoints were inaccessible during this Slot 4 run. No concurrent audit was positively observed, but absence of a concurrent audit was not independently verified this hour. The user's explicit 25 October disable confirmation remains authoritative; cron YAML alone is not proof of an enabled workflow. No workflow was run, enabled or modified.

## Slot 3 — phonics guides (02:17 IST)

At **2026-10-27T20:47:43–20:47:52Z UTC** (28 October IST), the ChatGPT-native auditor attempted **10 previously unchecked Slot 3 URLs** (rows 21–30). The provider returned page-specific, substantive phonics guidance and a visible H1 for each exact URL (some direct opens initially failed, but following on-site links resolved those pages). The provider's snapshots were labelled **Crawled: yesterday** or **Crawled: 2 days ago**; neither label supplies an exact crawl time or certifies current origin availability.

- Row 21: `https://tinystepslearning.com/resources/phonics/rabbit-rule-phonics` — H1: “What is the Rabbit Rule in phonics?” (provider: yesterday)
- Row 22: `https://tinystepslearning.com/resources/phonics/soft-c-hard-c-phonics` — H1: “Why does c sound different in cat and city?” (provider: 2 days ago)
- Row 23: `https://tinystepslearning.com/resources/phonics/soft-g-hard-g-phonics` — H1: “Why does g sound different in game and giant?” (provider: 2 days ago)
- Row 24: `https://tinystepslearning.com/resources/phonics/er-ir-ur-r-controlled-vowels-phonics` — H1: “How can children spell a sound that may be written er, ir or ur?” (provider: yesterday)
- Row 25: `https://tinystepslearning.com/resources/phonics/ar-r-controlled-vowels-phonics` — H1: “Why does a not keep its usual short or long sound in car and star?” (provider: 2 days ago)
- Row 26: `https://tinystepslearning.com/resources/phonics/or-r-controlled-vowels-phonics` — H1: “How should children read or in fork and storm?” (provider: yesterday)
- Row 27: `https://tinystepslearning.com/resources/phonics/y-as-a-vowel-phonics` — H1: “When does y act like a vowel?” (provider: yesterday)
- Row 28: `https://tinystepslearning.com/resources/phonics/au-aw-phonics` — H1: “How do children choose between au and aw?” (provider: yesterday)
- Row 29: `https://tinystepslearning.com/resources/phonics/oi-oy-phonics` — H1: “When should a child use oi or oy?” (provider: 2 days ago)
- Row 30: `https://tinystepslearning.com/resources/phonics/oo-sounds-phonics` — H1: “Why does oo sound different in moon and book?” (provider: yesterday)

**Independent HTTPS probes:** Ten read-only `curl -L` GET requests failed before any origin HTTP response: **5** with exit code **6** (`Could not resolve host: tinystepslearning.com`) and **5** with exit code **28** (`Resolving timed out after 9001/9002 milliseconds`). Each actual UTC start/end timestamp and exact error is preserved in `MASTER_URL_TRACKER.csv`. `CURL_HTTP_CODE:000` is a curl placeholder, not an HTTP status; the reported effective URL is not a verified redirect. Audit-environment DNS failure is not evidence of a production outage.

**Outcome:** 10 additional UNVERIFIED full-origin technical-readiness attempts; zero verified production PASS, WARN or FAIL. HTTP status, redirect, canonical, indexing directives, bot robots permissions, raw initial HTML and JSON-LD remain unverified. No dated, independently verified production before/after transition was established; `CHANGES.md` is unchanged.

## Slot 2 — phonics guides (01:18 IST)

At **2026-10-27T19:48:44–19:48:54Z UTC** (28 October 2026, approximately 01:18 IST), the ChatGPT-native auditor attempted the **10 previously unchecked Slot 2 URLs** (rows 11–20). Each exact URL returned provider-extracted, substantive, page-specific phonics guidance with a visible H1. The provider labelled each snapshot **Crawled: yesterday**, without an exact crawl timestamp. This does not certify current origin availability.

- Row 11: `https://tinystepslearning.com/resources/phonics/sh-digraph-phonics` — H1: “How do I teach sh as one sound instead of two letters?”
- Row 12: `https://tinystepslearning.com/resources/phonics/th-digraph-phonics` — H1: “Why does th sound different in thin and this?”
- Row 13: `https://tinystepslearning.com/resources/phonics/ai-vowel-team-phonics` — H1: “When does ai make the long a sound?”
- Row 14: `https://tinystepslearning.com/resources/phonics/ch-tch-spelling-phonics` — H1: “Why does match end in tch while much ends in ch?”
- Row 15: `https://tinystepslearning.com/resources/phonics/ea-vowel-team-phonics` — H1: “Why does ea sound different in team and head?”
- Row 16: `https://tinystepslearning.com/resources/phonics/ee-vowel-team-phonics` — H1: “How should children recognise ee in words such as green and feet?”
- Row 17: `https://tinystepslearning.com/resources/phonics/ie-vowel-team-phonics` — H1: “Why does ie not sound the same in every word?”
- Row 18: `https://tinystepslearning.com/resources/phonics/oa-vowel-team-phonics` — H1: “How should children read oa in words such as boat and road?”
- Row 19: `https://tinystepslearning.com/resources/phonics/magic-e-phonics` — H1: “What does Magic E do in cape, kite and hope?”
- Row 20: `https://tinystepslearning.com/resources/phonics/consonant-le-phonics` — H1: “Why does the ending in table, little and purple form its own syllable?”

**Independent HTTPS probes:** Ten read-only `curl -L` GET requests failed before receiving an origin HTTP response. Six returned exit code **6** (`curl: (6) Could not resolve host: tinystepslearning.com`); four returned exit code **28** (`Resolving timed out after 10000/10001 milliseconds`). Per-URL actual UTC start/end timestamps and exact errors are recorded in the tracker. `CURL_HTTP_CODE:000` is a curl placeholder, not a production HTTP status; `CURL_EFFECTIVE_URL` is not a verified redirect. DNS failure in the audit environment does **not** prove a production outage.

**Outcome:** 10 UNVERIFIED technical-readiness checks; zero confirmed production PASS, WARN or FAIL, and no evidenced improvement or regression.

## Slot 1 — first ten public URL checks (00:10 IST)

At **2026-10-27T18:40:39–18:40:53Z UTC** (28 October 2026, 00:10 IST), the ChatGPT-native auditor attempted the first **10 distinct eligible Slot 1 URLs**. Preflight verified **202 rows, 202 unique selected URLs, sequential indices 1–202**, Slots **1–19 with ten URLs each** and Slot **20 with twelve**. Before this batch **zero** rows carried 28 October IST check dates; no previously checked current-day row was rechecked, and no future-slot row was scanned. The ten new UTC probe-start timestamps are distinct and map to 28 October IST.

**Live retrieval scope:** ChatGPT web retrieval returned provider-extracted page-specific text/html for all ten exact URLs, each labelled **Crawled: today** (provider crawl time unknown). Visible H1s:
- Row 1: `https://tinystepslearning.com/` — H1: “Online English Classes for Kids.”
- Row 2: `https://tinystepslearning.com/blog` — H1: “Find the right English-learning answer without searching through a long feed”
- Row 3: `https://tinystepslearning.com/resources` — H1: “English Learning Resources for Kids, Parents & Educators”
- Row 4: `https://tinystepslearning.com/resources/phonics` — H1: “Phonics & Reading Resources”
- Row 5: `https://tinystepslearning.com/resources/phonics/ck-rule-phonics` — H1: “When should a child use ck instead of k at the end of a word?”
- Row 6: `https://tinystepslearning.com/resources/phonics/floss-rule-phonics` — H1: “Why do words such as puff, hill, miss and buzz end with doubled consonants?”
- Row 7: `https://tinystepslearning.com/resources/phonics/qu-sound-phonics` — H1: “Why is q usually taught together with u?”
- Row 8: `https://tinystepslearning.com/resources/phonics/ch-digraph-phonics` — H1: “How should children read ch without sounding c and h separately?”
- Row 9: `https://tinystepslearning.com/resources/phonics/kn-silent-k-phonics` — H1: “Why do knee and knot begin with a letter we do not say?”
- Row 10: `https://tinystepslearning.com/resources/phonics/ng-digraph-phonics` — H1: “Why should ng be read as one sound in words such as sing?”

**Independent HTTPS probes:** All ten read-only `curl -L` GET requests failed during hostname resolution, **eight** with exit code **6** (`curl: (6) Could not resolve host: tinystepslearning.com`) and **two** with exit code **28** (`Resolving timed out after 9000/9001 milliseconds`). Each attempt's actual UTC start/end and error are recorded in the tracker. No origin HTTP response was received. `HTTP_CODE:000` is not a server status, and the curl effective URL is not a verified redirect. This is an audit-environment DNS limitation, **not proof of a production outage**.

**Verification boundary:** All ten are **UNVERIFIED** for full origin technical readiness. Origin HTTP status, final redirect, canonical, robots/noindex, X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot access, initial raw HTML and JSON-LD could not be independently verified. Provider text alone does not establish a production PASS, FAIL or WARN. No Google/Bing indexing, rankings or AI citations were checked or claimed.

---

## Previous-day history — 27 October 2026 IST

Updated by the **ChatGPT-native hourly auditor** after **Slot 24 catch-up review (no new URL probes)** on **27 October 2026 IST**. All 202 selected URLs were already attempted today; no URL was rechecked in Slots 21–24. Per-URL UTC probe times and evidence remain in [MASTER_URL_TRACKER.csv](./MASTER_URL_TRACKER.csv).

## Slot 24 — catch-up closeout (no new URL probes)

At **2026-10-27T17:43:34.622Z UTC** (**27 October 2026, 23:13 IST**), re-read the latest tracker, summary and changes ledger on `seo-url-health-tracker`. Validated **202 rows, 202 unique selected URLs**, sequential indices **1–202**, Slots **1–19 with 10 URLs each** and Slot **20 with 12**, **202 distinct UTC probe timestamps mapping to 27 October IST**, and **zero unchecked current-day URLs**. The 202 previously recorded attempts remain **UNVERIFIED for full live origin technical readiness**; no production PASS/WARN/FAIL or verified improvement/regression was established. **No public URL was rechecked, no new origin HTTP probe was executed, and no timestamps or row evidence were backfilled** in Slot 24. The 30 historical PASS records remain historical only.

**Workflow safety:** Live GitHub Actions queries showed **one in-progress unrelated SEO Soft 404 Production Build Gate** (PR #816, run 40552126740) and **zero queued runs**; **no concurrent rolling-public-seo-health audit** was present in those active-run queries. The administrative workflow-state endpoint was rejected by the connected GitHub interface, so disablement was not independently confirmed. Continue under the user's 25 October disable confirmation. No GitHub workflow was run, enabled or modified.

**Changes:** No new verified production change warrants a `CHANGES.md` entry. `MASTER_URL_TRACKER.csv` and its actual probe timestamps remain unchanged. **Next:** On **28 October IST**, daily coverage must reset to zero until new checks execute, beginning with eligible Slot 1 URLs. Do not carry forward 27 October check timestamps as new coverage. The separate six-hour global visibility task remains unchanged.

## Slot 23 — catch-up (no new URL probes)

At **27 Oct 2026, 22:10:46 GMT+5:30** (**2026-10-27T16:40:46.765Z UTC**), re-read `MASTER_URL_TRACKER.csv`, `LATEST_SUMMARY.md` and `CHANGES.md` from `seo-url-health-tracker`. Verified **202 rows / 202 unique URLs**, sequential indices **1–202**, Slots **1–19 with ten URLs each**, Slot **20 with twelve**, **202 distinct valid UTC probe timestamps mapping to 27 October IST**, and **zero unchecked current-day URLs**. No public URL was requested or rechecked during this catch-up review, and no earlier or future slot was backfilled. Today's technical-readiness outcomes remain **202 UNVERIFIED, zero verified PASS/WARN/FAIL**; the audit-environment DNS limitations in the prior probes do not prove a production outage. Historical PASS values remain historical, not current-day verification.

**Workflow safety:** A current GitHub Actions in-progress query returned **five unrelated CI runs**, including a separate SEO Soft 404 build gate, and **no in-progress rolling-public-seo-health audit**; a queued query returned **zero queued runs**. Administrative workflow disablement could not be independently verified because the workflow-state endpoint was rejected by the connected GitHub interface. Continue under the user's confirmed 25 October disablement; cron YAML alone does not establish enablement. No GitHub workflow was run or enabled.

**Changes:** No verified production regression or improvement, no URL evidence update and no new entry to `CHANGES.md`. `MASTER_URL_TRACKER.csv` and all original probe timestamps remain unchanged. **Next:** Slot 24 is catch-up only if eligible unchecked URLs emerge; otherwise no duplicate checks. Reset daily coverage on 28 October IST until fresh checks actually execute. The separate six-hour visibility audit remains unchanged.

## Slot 22 — reconciliation (no new URL probes)

At **27/10/2026, 21:12:54 IST** (**2026-10-27T15:42:54.291Z UTC**), re-read the tracker, latest summary and change ledger on `seo-url-health-tracker`. Validated **202 rows and 202 unique URLs**, sequential indices **1–202**, Slots **1–19 at 10 URLs** and Slot **20 at 12**, and **202 distinct valid UTC probe timestamps** that map to **27 October IST**. All 202 records remain **UNVERIFIED** for full live origin technical readiness. No unchecked current-day URL remains, and no additional HTTP request or URL check was performed in this reconciliation. The 30 historical PASS records dated 25 October are preserved and do not count as current-day PASS or evidence of regression.

**Workflow safety:** Inspected the latest 100 GitHub Actions runs: no matching rolling SEO audit and no active runs in that set. Separate current GitHub Actions queries returned **zero queued** and **zero in-progress** runs. The workflow-state endpoint was rejected by the connected GitHub fetch interface, so administrative disablement could not be independently verified. Continue under the user's 25 October confirmation; the presence of cron YAML alone does not prove workflow enablement. No GitHub workflow was run or enabled.

**Changes:** No verified meaningful production regression or improvement; no entry is warranted in `CHANGES.md`. `MASTER_URL_TRACKER.csv` and its original check timestamps remain unchanged. **Next:** Slots 23–24 are catch-up only if unchecked eligible URLs appear; currently none. On 28 October IST, reset the current-day count until new URL checks actually execute. The separate six-hour search visibility audit is unaffected.

## Slot 21 — reconciliation (no new URL probes)

At **2026-10-27 20:15:34 IST** (**2026-10-27T14:45:34.328Z UTC**), re-read the tracker, summary and change ledger on `seo-url-health-tracker` and reconciled records without requesting or rechecking any public URL. The tracker contains **202 rows, 202 unique URLs and sequential indices 1–202**; slots 1–19 each contain ten URLs and slot 20 contains twelve. All **202** records are dated **27 October IST**, have **202 distinct valid UTC probe timestamps** that map to 27 October IST, and contain recorded probe evidence. No unchecked earlier-slot URL remains; no future slot was scanned, no historical date was counted toward today, and no new PASS/FAIL/WARN was inferred. Today's full-origin readiness remains **202 UNVERIFIED**.

**Historical context:** 30 rows retain earlier `last_verified_status=PASS` values dated 25 October UTC. These historical fields were not altered and **do not constitute today's verification or a confirmed regression** from those observations. The current-day provider-text/DNS-failure records cannot establish a before/after production transition. The change ledger therefore requires no entry.

**Workflow check limitation:** Attempted to inspect the former GitHub Actions workflow state and run listing through public GitHub endpoints, but those endpoints were inaccessible to this audit runtime. No concurrent GitHub audit was positively observed, but absence of a concurrent run **was not independently verified** in this reconciliation. Continue to rely on the user's 25 October disable confirmation; cron YAML presence alone is not evidence that a workflow is enabled. No workflow was run, enabled or changed.

**Next:** Slot 22 reconciliation; slots 23–24 catch-up only if eligible unchecked URLs appear. Do not recheck today's 202 attempted rows. Reset daily coverage at the next Asia/Kolkata date boundary; maintain separate six-hour visibility monitoring unchanged.

## Daily coverage — 27 October IST

| Metric | Count |
| --- | ---: |
| Selected unique URLs | **202** |
| Distinct URLs actually attempted today | **202 (100%)** |
| Fully origin-verified PASS today | **0** |
| Confirmed production FAIL today | **0** |
| Confirmed production WARN today | **0** |
| UNVERIFIED / partial provider-only evidence today | **202** |
| Not yet checked today | **0** |

**Preflight:** Read the latest tracker and validated exactly 202 unique URLs with sequential indices 1–202, Slots 1–19 at 10 URLs each and Slot 20 at 12. Before Slot 20, 190 distinct URL attempts had unique valid UTC timestamps mapping to 27 October in Asia/Kolkata. Rows 191–202 still carried 26 October dates and were eligible. No current-day checked row was rechecked, no future slot was scanned, and 12 actual UTC probe timestamps brought today's distinct attempted coverage to 202. Historical verified-state fields were preserved.

## Slot 20 — observed evidence and limitations

**URLs attempted:** Three level-specific Advanced Grammar / Public Speaking course pages and nine parent hub/guidance pages.

**Provider text retrieval:** All 12 exact URLs returned substantive page-specific extracted text labelled **Crawled: today** (provider's exact crawl time unknown). Visible H1s:

- Row 191: "Advanced Grammar Mastery Classes for Kids"
- Row 192: "Public Speaking Foundations for Kids"
- Row 193: "Public Speaking Excellence for Kids"
- Row 194: "Parents Hub: Choose the Right Learning Path for Your Child"
- Row 195: "Getting Started with Tiny Steps"
- Row 196: "How to Choose the Right Tiny Steps Course for Your Child"
- Row 197: "How to Track Your Child’s English Learning Progress"
- Row 198: "Helping with homework"
- Row 199: "Phonics Mission: A Research-Backed 7-Day Starter Plan for Parents"
- Row 200: "Reading at Home: A Practical 10-Minute Parent Routine"
- Row 201: "How to Build Speaking Confidence in Children Without Adding Pressure"
- Row 202: "Common Parent Mistakes That Can Slow English Learning Progress"

These are provider-extracted snapshots, **not independently verified initial origin HTML**. The provider's crawl label cannot certify current origin HTTP status, redirects, canonical, robots/noindex or structured data.

**Independent HTTPS probes:** Nine read-only `curl -L` GETs failed with exit code **6** and exact stderr `curl: (6) Could not resolve host: tinystepslearning.com`; three failed with exit code **28** and exact stderr `curl: (28) Resolving timed out after 8000 milliseconds` (rows 197, 201, 202). No origin HTTP responses were received. `HTTP_CODE:000` is a curl placeholder, not a server HTTP status; `url_effective` is not evidence of a verified final redirect destination. The DNS limitation is in the audit environment and **does not establish a production outage**.

**Still UNVERIFIED:** Origin HTTP status, redirect chain/final URL, canonical, meta robots/noindex, X-Robots-Tag, Googlebot/Bingbot/OAI-SearchBot access, initial raw HTML, JSON-LD, conversion functionality, Google/Bing indexing, rankings and AI citations. All 12 new rows remain **UNVERIFIED**, not production PASS/FAIL/WARN.

## Comparison and workflow safety

The 26 October cycle attempted 202 URLs without confirmed origin-verified PASS/FAIL/WARN. Today's 202 attempts also remain UNVERIFIED for full origin readiness. There is no dated before/after evidence of a meaningful production regression or improvement; [CHANGES.md](./CHANGES.md) remains unchanged.

The user confirmed disabling the previous GitHub Actions rolling audit on **25 October 2026**. This run inspected the latest 100 GitHub Actions runs; none matched the previous rolling SEO audit and none in that inspected set were active. Separate GitHub Actions queries returned zero in-progress and zero queued runs. Administrative disablement could not be independently confirmed because the workflow-state endpoint was inaccessible through the connected GitHub fetch tool. The user's disable confirmation remains the operating assumption; cron YAML alone is not evidence of workflow enablement. No GitHub Actions workflow was run, enabled or modified.

## Next work

**Slot 22:** Reconciled without additional URL probes. **Slots 23–24:** Catch-up only if eligible unchecked rows remain; currently **zero**. On the next IST day, daily coverage must reset to zero until fresh checks actually execute. Independent live origin HTTPS access remains necessary for complete technical verification. The separate six-hour outside-in global search visibility task remains unchanged.

During Slots 1–20, [MASTER_URL_TRACKER.csv](./MASTER_URL_TRACKER.csv) and this summary were updated on `seo-url-health-tracker`. Slots 21–22 changed only this summary; no tracker rows or check timestamps were modified. No repository source, workflows, Firebase, Hosting or production settings were changed.
