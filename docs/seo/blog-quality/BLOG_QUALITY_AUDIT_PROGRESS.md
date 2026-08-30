# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

Numbering is locked to the founder-supplied **authoritative 76-blog inventory** dated 2026-08-30. The fixed order lives in `docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md`.

## Standard 100-point quality rubric

| Dimension | Points |
|---|---:|
| Search-intent match | 15 |
| Reader usefulness | 15 |
| Content depth | 10 |
| Tiny Steps first-party insight | 10 |
| Accuracy & evidence | 10 |
| Uniqueness / cannibalization | 10 |
| SEO quality | 10 |
| AEO / GEO / LLM extractability | 10 |
| Trust / E-E-A-T | 5 |
| Next-step usefulness | 5 |
| **Total** | **100** |

Target: **90+/100** with no factual, pedagogical, evidence, diagnosis-boundary, trust, cannibalization or misleading-timeline hard fail.

# Batch #1 — Blogs #1–#10 — MERGED

- Branch: `seo/blog-quality-sequence-01-benefits-phonics`
- PR: `#163`
- Merge commit: `fda9963872299679d22e4ad3dc880cd4f13b482b`
- Final quality movement: **667/1000 → 960/1000**, average **66.7 → 96.0**, gain **+293**.

| # | Article | Baseline | Final |
|---:|---|---:|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57 | 95 |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | 65 | 96 |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | 65 | 96 |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | 64 | 96 |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | 66 | 96 |
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | 74 | 96 |
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | 68 | 96 |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | 67 | 96 |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | 62 | 96 |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | 79 | 97 |

# Batch #2 — Blogs #11–#20 — IN PROGRESS

- Branch: `seo/blog-quality-sequence-11-long-vowels`
- PR: `#164`
- Base: merged Batch #1 main commit `fda9963872299679d22e4ad3dc880cd4f13b482b`
- Delivery rule: review and lock **one blog at a time**, keep Blogs #11–#20 on this branch/PR, run the decisive full exact-head CI/SEO gate after Blog #20, and merge only with explicit founder approval.

## Batch #2 scorecard

| # | Article | Baseline | Status | Final |
|---:|---|---:|---|---:|
| 11 | Long Vowel Sounds for Kids: Pattern Order, Practice, and Common Mix-Ups | 67 | **LOCKED IN BATCH** | **96** |
| 12 | Online Phonics Classes vs School: What Works for Which Child | 68 | **LOCKED IN BATCH** | **97** |
| 13 | Online Phonics Games for Kids: What Actually Builds Reading | 64 | **LOCKED IN BATCH** | **97** |
| 14 | Phonics Activities at Home: A Parent Routine That Actually Sticks | 63 | **LOCKED IN BATCH** | **97** |
| 15 | Phonics Blending Activities That Help Children Read Words Confidently | 72 | **LOCKED IN BATCH** | **97** |
| 16 | Phonics Games for Letter Sounds: Parent Routine for Daily Practice | 61 | **LOCKED IN BATCH** | **97** |
| 17 | Phonics Rules for Beginners: The Right Sequence and When to Move Ahead | — | QUEUED | — |
| 18 | R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order | — | QUEUED | — |
| 19 | SATPIN Phonics Guide for Parents: How to Start and What to Expect | — | QUEUED | — |
| 20 | Phonics vs Sight Words: What Helps Children Read Better | — | QUEUED | — |

Current completed movement: **395/600 → 581/600**, average **65.8 → 96.8**, total gain **+186**.

## Canonical intent map — completed Batch #2 articles

11. `/blog/long-vowel-sounds-for-kids` → long-vowel pattern families, ordering decisions, reading/spelling transfer and common mix-up interpretation. Hands-on long-vowel activities remain with Blog #29.
12. `/blog/online-phonics-classes-vs-school` → school-only vs school + targeted online support vs a different reading priority. Provider selection remains with Blog #10.
13. `/blog/online-phonics-games` → whether digital phonics games rehearse a real reading skill and transfer beyond the game. Letter-sound routines remain with Blog #16.
14. `/blog/phonics-activities-for-kids-at-home` → broad home-practice system across sound recall, blending, decoding, spelling and text transfer. Detailed blending activities remain with Blog #15.
15. `/blog/phonics-blending-activities` → practical blending activity selection by observed bottleneck. Developmental stages remain with Blog #5; simple daily blending routine remains with Blog #25.
16. `/blog/phonics-games-for-letter-sounds` → practical letter-sound game routine: two-way phoneme–grapheme retrieval, blendable pronunciations, small taught-set review and early word transfer. Online-game evaluation remains with Blog #13; broad home routine with Blog #14; blending activities with Blog #15; SATPIN launch with Blog #19; broad sequence with Blog #17.

## Blog #16 — LOCKED

**Canonical role:** answer the parent question: *Which games help a child strengthen letter-sound knowledge, how should parents practise the sound–print relationship, and when should that knowledge start transferring into words?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost` with the original publication date preserved as **2025-11-22**.
- Replaced the rigid 10-minute/2-minute schedule with the Tiny Steps five-part loop: **see it → say it → hear it → find or write it → use it in a word**.
- Corrects the false either/or between letter names and letter sounds: both are useful alphabet knowledge, while phonics specifically requires usable sound–spelling relationships.
- Removes the implied rule that A–Z sound mastery must come before blending. Children can begin decoding and encoding once a small taught set can form words.
- Removes the unsupported “3–5 target sounds works best” claim and states that no universal sound-count target applies to every child.
- Adds six low-prep game types covering print-to-sound, sound-to-print, auditory discrimination, one-word blending and early spelling transfer.
- Adds blendable-pronunciation guidance and explicitly avoids added schwa/“uh” sounds where they interfere with blending.
- Defines progress through two-way retrieval, reduced prompting, fresh-item transfer and early word use—not speed, game score or a fixed mastery percentage.
- Gives transparent first-party product boundaries: Balloon Pop is sound-to-letter recognition practice; Letter Tracing With Sounds combines formation and sound connection; neither alone proves independent word reading.
- Keeps Blog #13 as digital-game quality owner, Blog #14 as broad home-routine owner, Blog #15 as blending-activity owner, Blog #19 as SATPIN launch owner and Blog #17 as broad sequence owner.
- Adds evidence from IES/WWC, IES/REL family guidance, UFLI, EEF and DfE.
- Adds five focused FAQs and a dedicated regression spec.

### Evidence boundary

Evidence supports explicit phoneme–grapheme teaching, both letter-name and letter-sound knowledge, cumulative review, blendable pronunciation and application to decoding/encoding. It does **not** establish one universal 10-minute home routine, one fixed number of sounds to practise, or an A–Z-before-blending requirement. The Tiny Steps five-part loop and game rotation are editorial syntheses.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #2 merge gate

Do not merge PR #164 until Blogs #11–#20 are all locked, the decisive exact-head CI/SEO gate is green, the final diff is clean, the PR is mergeable, and explicit founder approval is received.
