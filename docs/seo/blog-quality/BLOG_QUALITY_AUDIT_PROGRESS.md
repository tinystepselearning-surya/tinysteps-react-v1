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
- Delivery rule: review and lock **one blog at a time**, keep Blogs #11–#20 on this branch/PR, run the decisive full exact-head CI/SEO gate after Blog #20, and merge only with explicit founder approval.

## Batch #2 scorecard

| # | Article | Baseline | Status | Score after refresh |
|---:|---|---:|---|---:|
| 11 | Long Vowel Sounds for Kids: Pattern Order, Practice, and Common Mix-Ups | 67/100 | **LOCKED IN BATCH** | **96/100** |
| 12 | Online Phonics Classes vs School: What Works for Which Child | 68/100 | **LOCKED IN BATCH** | **97/100** |
| 13 | Online Phonics Games for Kids: What Actually Builds Reading | 64/100 | **LOCKED IN BATCH** | **97/100** |
| 14 | Phonics Activities at Home: A Parent Routine That Actually Sticks | 63/100 | **LOCKED IN BATCH** | **97/100** |
| 15 | Phonics Blending Activities That Help Children Read Words Confidently | 72/100 | **LOCKED IN BATCH** | **97/100** |
| 16 | Phonics Games for Letter Sounds: Parent Routine for Daily Practice | — | QUEUED | — |
| 17 | Phonics Rules for Beginners: The Right Sequence and When to Move Ahead | — | QUEUED | — |
| 18 | R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order | — | QUEUED | — |
| 19 | SATPIN Phonics Guide for Parents: How to Start and What to Expect | — | QUEUED | — |
| 20 | Phonics vs Sight Words: What Helps Children Read Better | — | QUEUED | — |

Current completed quality movement: baseline **334/500 → 484/500**, average **66.8 → 96.8**, total gain **+150**.

## Canonical intent map — Batch #2 completed articles

11. `/blog/long-vowel-sounds-for-kids` → long-vowel pattern families, ordering decisions, reading/spelling transfer and common mix-up interpretation. Hands-on long-vowel activity intent remains with Blog #29 `/blog/phonics-long-vowels`.
12. `/blog/online-phonics-classes-vs-school` → parent decision between school-only phonics, school plus targeted online support, or a different reading priority. Provider-shopping intent remains with Blog #10 `/blog/how-to-choose-phonics-classes`.
13. `/blog/online-phonics-games` → evaluate whether online phonics games rehearse a real foundational-reading skill and whether that skill transfers beyond the game. Letter-sound game routines remain with Blog #16; broad home routines remain with Blog #14; apps-versus-teacher remains with Blog #35.
14. `/blog/phonics-activities-for-kids-at-home` → broad parent system for repeatable, level-matched home phonics practice across sound recall, blending, decoding, spelling and connected-text transfer. Detailed blending activities remain with Blog #15; letter-sound games remain with Blog #16; online-game evaluation remains with Blog #13.
15. `/blog/phonics-blending-activities` → practical blending activity selection by observed bottleneck, from oral merging through printed-word and connected-text transfer. Stage progression remains with Blog #5; broad home routine with Blog #14; simple daily blending routine with Blog #25.

## Blog #11 — LOCKED

**Canonical role:** explain long-vowel pattern families, ordering decisions and common reading/spelling mix-ups without claiming one universal research-defined sequence.

### Key decisions

- Direct founder-authored `BlogPost`.
- Distinguishes VCe/silent-e, vowel teams, open syllables and later alternatives.
- Tiny Steps chain: **hear → notice → contrast → decode → encode → transfer**.
- Five error patterns with teaching responses.
- Removes arbitrary percentages, fixed word counts and universal silent-e-first claims.
- Routes hands-on activity intent to Blog #29, broad sequencing to Blog #17, encoding depth to Blog #9 and r-controlled vowels to Blog #18.
- Evidence from IES/WWC, DfE and EEF; five FAQs; focused regression coverage.

**Final decision: 96/100 — LOCKED IN BATCH.**

## Blog #12 — LOCKED

**Canonical role:** answer when school phonics is enough, when targeted online support can add a missing ingredient, and when the child’s main need has moved beyond beginner phonics.

### Key decisions

- Rejects universal “online is better” / “school is better” framing.
- Separates need, current-setting adequacy and the specific value of supplemental support.
- Defines school-only, school + targeted online, and different-priority paths.
- Preserves assessment, systematic teaching, active response, corrective feedback, fresh-word transfer, matched text and cumulative review online.
- Protects school’s wider literacy role.
- Keeps Blog #10 as provider-selection owner and Blog #8 as class-mechanism owner.
- Evidence from EEF, DfE and IES/WWC; five FAQs; focused regression coverage.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #13 — LOCKED

**Canonical role:** answer what makes an online phonics game useful reading practice and how parents can tell whether success transfers beyond the game.

### Key decisions

- Tiny Steps six-check game-to-reading filter: exact skill → phonics accuracy → active retrieval/application → useful feedback → level match → transfer.
- Separates letter-sound, phonemic-awareness, decoding, spelling and connected-reading game roles.
- Adds a 60-second off-screen transfer check.
- Engagement, scores and completed levels are not treated as reading outcomes.
- Uses EEF GraphoGame Rime as a careful evidence boundary, not as proof that all games fail.
- Transparent first-party account of Balloon Pop as letter-sound listening/recognition practice, not a complete reading game.
- Keeps Blog #16 as letter-sound routine owner and Blog #14 as broad home routine owner.
- Evidence from IES/WWC, IES family resources, DfE and EEF; five FAQs; focused regression coverage.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #14 — LOCKED

**Canonical role:** answer the parent question: *How can I build a home phonics routine that is realistic enough to repeat, matched to my child’s current skill and useful enough to show transfer into reading or spelling?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`.
- Replaced the rigid 10-minute routine with the flexible Tiny Steps six-part system: **target → retrieve → practise → transfer → observe → adjust**.
- Removes the old 3–4 day activity rule, 1–6 week progress promises and 6–8 week escalation trigger.
- Makes the target—not the material format—the starting point: sound recall, blending, fresh-word decoding, spelling/encoding or connected reading.
- Adds a fresh transfer step so repeated worksheet/game completion is not mistaken for learning.
- Adds a practical error-observation map: sound confusion, blending break, guessing, spelling mapping error and transfer loss.
- Treats those observations as teaching information, not diagnosis.
- Encourages parents to simplify the same target before abandoning it or increasing difficulty.
- Adds sustainable-routine guidance: predictable cue, low setup, stable goal with light variation, stop before practice becomes unproductive, and keep reading for pleasure separate from phonics testing.
- Adds the Tiny Steps one-card home phonics check as editorial guidance, not a validated assessment.
- Routes detailed blending work to Blog #15, letter-sound games to Blog #16, online-game quality to Blog #13, full encoding to Blog #9 and timeline interpretation to Blog #6.
- Adds evidence from the 2026 IES parent resource, IES/REL family-reading guides, IES/WWC foundational-reading guidance, EEF parental engagement and DfE Reading Framework.
- Adds five focused FAQs and dedicated regression coverage.

### Evidence boundary

Evidence supports practical family guidance, level-matched foundational reading activities, ongoing parent support and a wider reading environment. It does **not** establish one mandatory home-practice duration, one fixed number of activities, or a universal progress timetable. The Tiny Steps six-part routine and one-card check are editorial syntheses.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #15 — LOCKED

**Canonical role:** answer the parent question: *Which blending activity should I use for the specific place where my child’s blending breaks down, and how do I know the skill transfers beyond the practised word list?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost` while retaining the useful activity-bank intent.
- Adds the Tiny Steps six-part activity loop: **locate the blending break → choose the matching activity → model only what is needed → let the child retry → check a fresh word → transfer into matched text**.
- Adds a pre-activity blending-break check covering oral merging, printed blending, long pauses/schwa, familiar-list dependence and sentence-level breakdown.
- Builds seven activity families: oral sound merging, continuous sound slider, short decodable words with fresh transfer, one-sound-change chains, one-sound contrasts, taught digraph/adjacent-consonant practice and sentence transfer.
- Clarifies that oral-only blending is a temporary scaffold rather than a universal stage that must be mastered for a fixed period before print.
- Adds blendable-sound guidance and protects stop sounds from added schwa pronunciations.
- Keeps CVC practice tied to taught correspondences and fresh decoding rather than a fixed word-count milestone.
- Uses one-sound-change word chains to preserve attention to the full sequence and prevents word-family visual memorisation from being mistaken for decoding.
- Adds a correction routine based on pointing back to the relevant sound, reducing prompts and allowing a retry.
- Defines progress through accuracy, independence, fresh-word transfer, retention and connected-text transfer rather than speed, percentages or a fixed practice calendar.
- Explains that “confidently” is practical willingness/independence language, not a guaranteed emotional outcome from phonics.
- Keeps Blog #5 as the developmental blending-stage owner, Blog #14 as the broad home-routine owner and Blog #25 as the simple daily blending-routine owner.
- Adds evidence from IES/WWC, UFLI phonemic-awareness/decoding resources, DfE Reading Framework and EEF phonics evidence.
- Adds five focused FAQs and dedicated regression coverage.

### Evidence boundary

Evidence supports explicit left-to-right blending, phoneme blending, blendable sound pronunciation, systematic word work and connected-text practice. It does **not** establish a universal number of blending words, timed target, mastery percentage or practice duration. The Tiny Steps six-part loop and blending-break categories are editorial syntheses rather than diagnostic instruments.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #2 merge gate

Do not merge PR #164 until Blogs #11–#20 are all locked, the decisive exact-head CI/SEO gate is green, the final diff is clean, the PR is mergeable, and explicit founder approval is received.
