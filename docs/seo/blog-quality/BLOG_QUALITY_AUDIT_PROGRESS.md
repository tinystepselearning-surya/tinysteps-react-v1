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
| 17 | Phonics Rules for Beginners: The Right Sequence and When to Move Ahead | 60 | **LOCKED IN BATCH** | **97** |
| 18 | R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order | — | QUEUED | — |
| 19 | SATPIN Phonics Guide for Parents: How to Start and What to Expect | — | QUEUED | — |
| 20 | Phonics vs Sight Words: What Helps Children Read Better | — | QUEUED | — |

Current completed movement: **455/700 → 678/700**, average **65.0 → 96.9**, total gain **+223**.

## Canonical intent map — completed Batch #2 articles

11. `/blog/long-vowel-sounds-for-kids` → long-vowel pattern families, ordering decisions, reading/spelling transfer and common mix-up interpretation. Hands-on long-vowel activities remain with Blog #29.
12. `/blog/online-phonics-classes-vs-school` → school-only vs school + targeted online support vs a different reading priority. Provider selection remains with Blog #10.
13. `/blog/online-phonics-games` → whether digital phonics games rehearse a real reading skill and transfer beyond the game. Letter-sound routines remain with Blog #16.
14. `/blog/phonics-activities-for-kids-at-home` → broad home-practice system across sound recall, blending, decoding, spelling and text transfer. Detailed blending activities remain with Blog #15.
15. `/blog/phonics-blending-activities` → practical blending activity selection by observed bottleneck. Developmental stages remain with Blog #5; simple daily blending routine remains with Blog #25.
16. `/blog/phonics-games-for-letter-sounds` → practical letter-sound game routine: two-way phoneme–grapheme retrieval, blendable pronunciations, small taught-set review and early word transfer. Online-game evaluation remains with Blog #13; broad home routine with Blog #14; blending activities with Blog #15; SATPIN launch with Blog #19; broad sequence with Blog #17.
17. `/blog/phonics-rules-for-beginners` → parent-facing principles for a systematic, incremental and cumulative beginner phonics sequence, including what broad knowledge comes next and how to decide whether to move ahead or review. SATPIN launch remains with Blog #19; CVC milestone with Blog #3; digraph/tricky distinction with Blog #4; long vowels with Blog #11; r-controlled vowels with Blog #18; school-wide scope and sequence with Blog #57.

## Blog #17 — LOCKED

**Canonical role:** answer the parent question: *What does a sensible beginner phonics sequence look like, what should come next, and how can I tell whether my child is ready to move ahead without relying on a fixed weekly timetable?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost` with the original publication date preserved as **2025-11-19**.
- Reframes “phonics rules” as parent-friendly language for sound–spelling relationships, common patterns, positional conventions and exceptions rather than perfectly reliable formulas.
- Replaces the rigid `CVC → digraphs/blends → long vowels` prescription with evidence-aligned principles: clearly defined, explicit, incremental, cumulative teaching from simpler to more complex knowledge.
- Adds a six-part explanatory beginner progression: phonemic awareness + a useful starter set → immediate blending/segmenting → broader consonants and grapheme patterns → gradual common-exception words → long-vowel/other common patterns → matched sentences and text.
- Clarifies that CVC words are an important early milestone but not a complete beginner curriculum, and that digraphs and adjacent consonants are not one interchangeable “blend” rule family.
- Protects common-exception words from whole-shape memorisation and routes the broader phonics-versus-sight-words decision to Blog #20.
- Adds the Tiny Steps five-question progression check: **retrieval → fresh-word decoding → encoding → independence → transfer/retention**.
- Removes fixed 3–5 day rule blocks, 2–8 week progress claims, 6–8 week support triggers, “two perfect sessions” and “one rule family per week” as universal readiness rules.
- Adds practical responses for short/long vowel mixing, digraph/blend confusion, slogan-without-transfer and loss of old knowledge when new patterns are introduced.
- Advises parents to reinforce a coherent school/programme sequence rather than mix competing orders at home.
- Adds a non-diagnostic closer-review boundary instead of treating sequencing difficulty as evidence of a condition.
- Adds evidence from the current EEF phonics review, DfE SSP validation criteria, IES/WWC foundational-reading guidance and UFLI.
- Adds five focused FAQs and dedicated regression coverage.

### Evidence boundary

Evidence supports systematic, explicit, incremental and cumulative phonics; an early useful correspondence set; blending and segmenting; common sound–spelling patterns; spelling; common-exception words; and matched connected-text practice. It does **not** establish one universal commercial programme order, one rule family per week, a fixed mastery percentage or a fixed number of review sessions. The Tiny Steps six-part explanatory map and five-question move-ahead check are editorial syntheses.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #2 merge gate

Do not merge PR #164 until Blogs #11–#20 are all locked, the decisive exact-head CI/SEO gate is green, the final diff is clean, the PR is mergeable, and explicit founder approval is received.
