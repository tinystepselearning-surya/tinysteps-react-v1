# Tiny Steps Blog Quality Audit & Refresh Programme

## Sequence authority

The programme numbering is locked to the founder-supplied **authoritative 76-blog inventory** dated 2026-08-30.

- Blogs **1–34**: Phonics
- Blogs **35–51**: Parent Tips / English Communication
- Blogs **52–60**: Research / Schools
- Blogs **61–68**: Grammar
- Blogs **69–76**: Public Speaking

The full fixed order lives in `docs/seo/blog-quality/AUTHORITATIVE_76_SEQUENCE.md`.

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
- Final exact-head CI before merge: green

| # | Article | Baseline | Final |
|---:|---|---:|---:|
| 1 | Benefits of Phonics for Kids: What Parents Usually Notice First | 57/100 | 95/100 |
| 2 | Child Knows ABC but Cannot Read: What Parents Should Check First | 65/100 | 96/100 |
| 3 | CVC Words Explained for Parents: The First Real Decoding Milestone | 65/100 | 96/100 |
| 4 | Digraphs and Tricky Words: What to Decode and What to Remember | 64/100 | 96/100 |
| 5 | How Kids Learn Blending: The Stage-by-Stage Path Parents Can Track | 66/100 | 96/100 |
| 6 | How Long Does Phonics Take? A Realistic Parent Guide to Progress | 74/100 | 96/100 |
| 7 | How Phonics Builds Reading Confidence: What Changes First at Home | 68/100 | 96/100 |
| 8 | How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained | 67/100 | 96/100 |
| 9 | How Phonics Improves Spelling: A Parent Encoding Roadmap | 62/100 | 96/100 |
| 10 | How to Choose a Phonics Class: The Complete Parent Comparison Framework | 79/100 | 97/100 |

Batch #1 quality movement: **667/1000 → 960/1000**, average **66.7 → 96.0**, total gain **+293**.

# Batch #2 — Blogs #11–#20 — IN PROGRESS

- Branch: `seo/blog-quality-sequence-11-long-vowels`
- PR: `#164`
- Base: merged Batch #1 main commit `fda9963872299679d22e4ad3dc880cd4f13b482b`
- Delivery rule: review and lock **one blog at a time**, keep all Blogs #11–#20 on this branch/PR, run the decisive full exact-head CI/SEO gate after Blog #20, and merge only with explicit founder approval.

## Batch #2 scorecard

| # | Article | Baseline | Status | Score after refresh |
|---:|---|---:|---|---:|
| 11 | Long Vowel Sounds for Kids: Pattern Order, Practice, and Common Mix-Ups | 67/100 | **LOCKED IN BATCH** | **96/100** |
| 12 | Online Phonics Classes vs School: What Works for Which Child | 68/100 | **LOCKED IN BATCH** | **97/100** |
| 13 | Online Phonics Games for Kids: What Actually Builds Reading | 64/100 | **LOCKED IN BATCH** | **97/100** |
| 14 | Phonics Activities at Home: A Parent Routine That Actually Sticks | — | QUEUED | — |
| 15 | Phonics Blending Activities That Help Children Read Words Confidently | — | QUEUED | — |
| 16 | Phonics Games for Letter Sounds: Parent Routine for Daily Practice | — | QUEUED | — |
| 17 | Phonics Rules for Beginners: The Right Sequence and When to Move Ahead | — | QUEUED | — |
| 18 | R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order | — | QUEUED | — |
| 19 | SATPIN Phonics Guide for Parents: How to Start and What to Expect | — | QUEUED | — |
| 20 | Phonics vs Sight Words: What Helps Children Read Better | — | QUEUED | — |

Current completed quality movement: baseline **199/300 → 290/300**, average **66.3 → 96.7**, total gain **+91**.

## Canonical intent map — Batch #2 completed articles

11. `/blog/long-vowel-sounds-for-kids` → long-vowel pattern families, ordering decisions, reading/spelling transfer and common mix-up interpretation. Hands-on long-vowel activity intent remains with Blog #29 `/blog/phonics-long-vowels`.
12. `/blog/online-phonics-classes-vs-school` → parent decision between school-only phonics, school plus targeted online support, or a different reading priority. Provider-shopping intent remains with Blog #10 `/blog/how-to-choose-phonics-classes`.
13. `/blog/online-phonics-games` → evaluate whether online phonics games rehearse a real foundational-reading skill and whether that skill transfers beyond the game. Letter-sound game routines remain with Blog #16; broad home routines remain with Blog #14; the later apps-versus-teacher decision remains with Blog #35.

## Blog #11 — LOCKED

**Canonical role:** explain how parents should understand long-vowel pattern families, decide what to introduce or contrast next, and interpret common reading/spelling mix-ups without treating one sequence as a universal research-defined order.

### Major quality decisions

- Converted the thin generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`.
- Distinguishes VCe/silent-e, vowel teams, open syllables and later alternative long-vowel spellings.
- Adds the Tiny Steps six-part long-vowel learning chain: **hear → notice → contrast → decode → encode → transfer**.
- Adds five common error patterns and teaching responses.
- Checks reading and spelling together while preserving Blog #9 as the full encoding owner.
- Routes practical activity-heavy intent to Blog #29 and broad phonics-sequence intent to Blog #17.
- Removes arbitrary mastery percentages, fixed word-count targets and the claim that silent-e must universally come first.
- Adds evidence from IES/WWC, DfE and EEF, five focused FAQs and dedicated regression coverage.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #12 — LOCKED

**Canonical role:** answer the parent question: *When is school phonics enough, when can supplemental online phonics add useful targeted support, and when has the child’s main need moved beyond beginner phonics?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`.
- Rejects a universal “online is better” or “school is better” framing.
- Separates three decisions: whether the child needs more phonics, whether current teaching meets that need, and whether online delivery adds a specific missing ingredient.
- Adds clear school-only, school + targeted online, and different-priority decision paths.
- Explains that supplemental teaching should connect sensibly with existing learning rather than become a competing phonics system.
- Defines what good online phonics must still preserve: assessment, systematic teaching, active child response, corrective feedback, fresh-word transfer, matched connected text and cumulative review.
- Explicitly protects school’s wider literacy role and states that supplemental phonics is not a substitute for the complete school literacy experience.
- Adds online-fit limitations without arbitrary age cutoffs.
- Adds the Tiny Steps five-question school-versus-online check as editorial guidance, not a diagnostic tool.
- Routes provider-shopping intent to Blog #10 and class-mechanism intent to Blog #8.
- Adds evidence from the current EEF phonics review, EEF one-to-one tuition review, DfE Reading Framework, DfE SSP validation criteria and IES/WWC.
- Adds five focused FAQs and dedicated regression coverage.

### Evidence boundary

Evidence supports systematic phonics across different instructional contexts, targeted supplemental instruction, alignment with normal teaching, direct interaction, assessment and transfer practice. It does **not** establish that online phonics is universally superior to school teaching or that every child making slower progress needs paid supplemental tuition.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #13 — LOCKED

**Canonical role:** answer the parent question: *What makes an online phonics game useful reading practice, and how can I tell whether success transfers beyond the game?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`.
- Replaces vague “fun but educational” criteria with the Tiny Steps six-check game-to-reading filter: exact skill → phonics accuracy → active retrieval/application → useful feedback → level match → transfer.
- Separates letter-sound, phonemic-awareness, printed blending/decoding, spelling and connected-reading game roles instead of treating all phonics games as equivalent.
- Adds a 60-second off-screen transfer check using fresh examples rather than replay scores.
- Explicitly states that engagement, coins, stars, streaks and completed levels are not reading outcomes.
- Uses the EEF GraphoGame Rime trial as a careful evidence boundary: a game may be engaging without showing additional reading gains over comparison support.
- Removes the unsupported fixed 4–6 week improvement trigger and any universal game-time or mastery threshold.
- Gives a transparent first-party account of Tiny Steps Balloon Pop as letter-sound listening/recognition practice, not a complete reading game.
- Routes the practical letter-sound routine to Blog #16 and the broader home-practice routine to Blog #14, while preserving Blog #35 for the later app-versus-teacher decision.
- Adds evidence from IES/WWC, IES family reading resources, DfE Reading Framework, EEF phonics, EEF feedback and EEF GraphoGame Rime.
- Adds five focused FAQs and dedicated regression coverage.

### Evidence boundary

Evidence supports the foundational skills that well-designed games can rehearse and the usefulness of specific feedback and matched practice. It does **not** support a claim that digital-game format itself guarantees reading progress. The Tiny Steps filter and transfer check are editorial syntheses rather than validated assessment tools.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #2 merge gate

Do not merge PR #164 until Blogs #11–#20 are all locked, the decisive exact-head CI/SEO gate is green, the final diff is clean, the PR is mergeable, and explicit founder approval is received.
