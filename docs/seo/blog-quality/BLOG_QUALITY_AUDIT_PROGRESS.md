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

# Batch #2 — Blogs #11–#20 — CONTENT LOCKED / FINAL CI GATE

- Branch: `seo/blog-quality-sequence-11-long-vowels`
- PR: `#164`
- Base: merged Batch #1 main commit `fda9963872299679d22e4ad3dc880cd4f13b482b`
- Delivery rule: Blogs #11–#20 are now content-locked on this branch/PR. Run the decisive full exact-head CI/SEO gate, verify the final diff and mergeability, and merge only with explicit founder approval.

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
| 18 | R-Controlled Vowels Explained: Pattern Groups, Confusions, and Practice Order | 62 | **LOCKED IN BATCH** | **97** |
| 19 | SATPIN Phonics Guide for Parents: How to Start and What to Expect | 66 | **LOCKED IN BATCH** | **97** |
| 20 | Phonics vs Sight Words: What Helps Children Read Better | 62 | **LOCKED IN BATCH** | **97** |

Batch #2 quality movement: **645/1000 → 969/1000**, average **64.5 → 96.9**, total gain **+324**.

## Canonical intent map — completed Batch #2 articles

11. `/blog/long-vowel-sounds-for-kids` → long-vowel pattern families, ordering decisions, reading/spelling transfer and common mix-up interpretation. Hands-on long-vowel activities remain with Blog #29.
12. `/blog/online-phonics-classes-vs-school` → school-only vs school + targeted online support vs a different reading priority. Provider selection remains with Blog #10.
13. `/blog/online-phonics-games` → whether digital phonics games rehearse a real reading skill and transfer beyond the game. Letter-sound routines remain with Blog #16.
14. `/blog/phonics-activities-for-kids-at-home` → broad home-practice system across sound recall, blending, decoding, spelling and text transfer. Detailed blending activities remain with Blog #15.
15. `/blog/phonics-blending-activities` → practical blending activity selection by observed bottleneck. Developmental stages remain with Blog #5; simple daily blending routine remains with Blog #25.
16. `/blog/phonics-games-for-letter-sounds` → practical letter-sound game routine: two-way phoneme–grapheme retrieval, blendable pronunciations, small taught-set review and early word transfer. Online-game evaluation remains with Blog #13; broad home routine with Blog #14; blending activities with Blog #15; SATPIN launch with Blog #19; broad sequence with Blog #17.
17. `/blog/phonics-rules-for-beginners` → parent-facing principles for a systematic, incremental and cumulative beginner phonics sequence, including what broad knowledge comes next and how to decide whether to move ahead or review. SATPIN launch remains with Blog #19; CVC milestone with Blog #3; digraph/tricky distinction with Blog #4; long vowels with Blog #11; r-controlled vowels with Blog #18; school-wide scope and sequence with Blog #57.
18. `/blog/r-controlled-vowels-explained` → parent explanation of vowel-r/r-controlled pattern groups, accent-sensitive pronunciation, reading-versus-spelling confusions and evidence-aligned practice order. Hands-on r-controlled games and practice remain with Blog #30 (`/blog/phonics-r-controlled`); broad sequence remains with Blog #17; long-vowel patterns with Blog #11; full encoding with Blog #9.
19. `/blog/satpin-phonics-guide` → SATPIN starter-set explanation, why a useful defined early set helps, how early blending/encoding begins, what progress looks like and when to move beyond SATPIN. Session-by-session home practice remains with Blog #22; broad sequence remains with Blog #17; letter-sound games with Blog #16; full blending development with Blog #5.
20. `/blog/science-of-phonics-learning` → evidence and terminology owner for phonics versus “sight words”: systematic decoding evidence, high-frequency versus irregular/common-exception words, automatic recognition and evidence-aligned treatment of unfamiliar words. Blog #21 owns synthetic-phonics-versus-traditional method comparison; Blog #47 owns the parent “what first?” sequencing decision.

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

## Blog #18 — LOCKED

**Canonical role:** answer the parent question: *What are r-controlled/vowel-r patterns, why do ar/or/er/ir/ur create different reading and spelling confusions, how does accent affect them, and what is a sensible order for practising them without imposing one universal timetable?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`, preserving the canonical publication date **2026-01-05** and adding a meaningful **2026-08-30** modified date.
- Defines r-controlled/vowel-r patterns accurately as a vowel followed directly by `r`, while treating “bossy R” as an optional mnemonic rather than a literal linguistic explanation.
- Adds a major accent safeguard: rhotic and non-rhotic English varieties can realise vowel-r patterns differently, so one pronunciation model is not universal.
- Uses UFLI’s standard and Australian resources as direct evidence that accent-sensitive adaptation is legitimate.
- Separates the five core spellings into `ar`, `or`, and the `er/ir/ur` spelling-choice problem without claiming that `er/ir/ur` sound identical in every accent or every word.
- Adds the Tiny Steps six-part learning chain: **hear → notice/map → read → spell → contrast → transfer**.
- Replaces fixed pattern-family sessions and implicit `ar/or first` universalism with a programme-aligned practice sequence based on prior decoding knowledge.
- Uses UFLI’s `ar → or → er/ir/ur` progression as one concrete programme example while explicitly stating that it is not a universal research law.
- Removes arbitrary prerequisites such as `30–50 CVC words`, fixed practice days, fixed word counts and percentage mastery rules.
- Explains why r-controlled reading can be stronger than spelling: print reveals the grapheme during reading, while encoding may require choosing among `er`, `ir`, `ur` and later alternatives.
- Adds five concrete confusion types: ordinary-vowel substitution, `ar/or` mixing, `er/ir/ur` spelling interchange, `wor` overgeneralisation and isolated-word-to-text transfer failure.
- Adds a Tiny Steps five-signal move-ahead check: **notice → decode → encode → contrast → transfer/retain**.
- Protects Blog #30 as the hands-on r-controlled practice/activity owner, Blog #17 as the broad sequence owner, Blog #11 as long-vowel owner and Blog #9 as full encoding owner.
- Adds a non-diagnostic safeguard: normal accent differences and `er/ir/ur` spelling confusion are not, by themselves, evidence of a reading disorder.
- Adds seven external evidence references, five focused FAQs and dedicated Blog #18 regression coverage.

### Evidence boundary

Evidence supports explicit/systematic sound–spelling instruction, vowel-r/r-controlled patterns, linked reading and spelling practice, cumulative progression and transfer into matched text. UFLI provides a defensible sequence example and accent-adapted materials. The evidence does **not** establish one universal first r-controlled family, one pronunciation for all English accents, a fixed word-count prerequisite, a fixed number of practice sessions or a universal mastery percentage. The Tiny Steps six-part learning chain and five-signal move-ahead check are editorial syntheses.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #19 — LOCKED

**Canonical role:** answer the parent question: *What is SATPIN, why can it be a useful early sound–spelling set, how should blending and spelling begin from it, what should parents expect to see, and when is the child ready to move beyond the set?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`, preserving the canonical publication date **2025-11-06** and adding a meaningful **2026-08-30** modified date.
- Defines SATPIN accurately as the six-letter starter set `s, a, t, p, i, n` while noting that programmes can order those correspondences differently within an early sequence.
- Replaces “SATPIN is first because it is best” logic with the evidence-supported principle that an early programme should begin with a **defined useful set** that permits children to read and spell words early.
- Explicitly states that evidence does not establish SATPIN as the single mandatory or scientifically superior first set.
- Adds the Tiny Steps SATPIN launch chain: **hear sound → connect sound and print → retrieve → blend → segment/spell → transfer**.
- Corrects the old “pure sound mastery first, then blending” sequence: blending can begin as soon as enough taught correspondences can form a word.
- Clarifies letter-name versus letter-sound roles without falsely telling parents to avoid letter names.
- Reframes “pure sounds” as **blendable pronunciations**, including schwa avoidance for stop consonants where it interferes with blending.
- Removes universal `1–2 sounds per batch`, weekly testing, fixed-session mastery and percentage thresholds.
- Adds a five-signal progress interpretation: **retrieve → blend → decode fresh → encode → transfer/retain**.
- Adds five concrete SATPIN bottlenecks: sound retrieval, sound-known-but-no-blend, familiar-card memorisation, reading stronger than spelling, and new-learning loss of earlier correspondences.
- Protects Blog #22 as the session-by-session SATPIN home routine owner, Blog #17 as broad sequence owner, Blog #16 as letter-sound game owner, Blog #5 as blending-development owner and Blog #3 as the CVC milestone owner.
- Describes Balloon Pop and Letter Tracing transparently as sound/letter practice rather than proof of word reading.
- Adds a non-diagnostic safeguard and closer-teaching-review boundary.
- Adds six external evidence references, five focused FAQs and dedicated Blog #19 regression coverage.

### Evidence boundary

Evidence supports explicit/systematic phonics, beginning with a defined useful set of sound–spelling correspondences, early blending and segmenting, linked spelling practice, cumulative review and matched connected-text application. It does **not** establish SATPIN as the only valid starter set, a fixed number of SATPIN sounds per session, a fixed SATPIN duration, a weekly testing requirement or a universal mastery percentage. The Tiny Steps SATPIN launch chain and progress signals are editorial syntheses.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Blog #20 — LOCKED

**Canonical role:** answer the evidence question: *When parents compare phonics and “sight words”, what do these terms actually mean, what does research support for beginning readers, and how should regular, high-frequency and irregular words be taught so word recognition becomes automatic without replacing decoding?*

### Major quality decisions

- Converted the generic `PhonicsSeoPost` into a direct founder-authored `BlogPost`, preserving the canonical publication date **2025-12-22** and adding a meaningful **2026-08-30** modified date.
- Replaces the old “most children need balance, not extremes” framing with a clearer evidence hierarchy: **systematic phonics is the transferable decoding foundation; efficient recognition of familiar words is an outcome that develops alongside it**.
- Separates four frequently conflated terms: **phonics**, **high-frequency words**, **irregular/common-exception words**, and **sight words**.
- Clarifies that high-frequency words can be regular or irregular; frequency does not define decodability.
- Clarifies that some words are only **temporarily irregular** because the child has not yet learned a correspondence, while others contain genuinely unusual spellings.
- Corrects the idea that “sight word” means a competing whole-word method: automatic recognition is the desired outcome, not evidence that words should be learned as visual shapes.
- Uses current EEF evidence, DfE SSP criteria, IES/WWC guidance and UFLI to explain why systematic decoding should remain the route for unfamiliar words.
- Adds the Tiny Steps four-route framework: **regular taught word → regular high-frequency word → partly irregular/common-exception word → word with an untaught pattern**.
- Explains how regular parts of irregular words can still be mapped, with only the unusual portion receiving special attention.
- Removes fixed word-count/week guidance, vague “balance” language and unsupported progression promises.
- Adds an automatic-recognition pathway from deliberate sound–spelling attention → accurate decoding → repeated successful encounters → increasingly efficient recognition.
- Adds a fresh-word transfer safeguard so memorized flashcard performance is not mistaken for general decoding skill.
- Protects Blog #21 as the synthetic-phonics-versus-traditional method-comparison owner and Blog #47 as the parent “what should I teach first?” sequencing owner.
- Protects Blog #4 as digraph/tricky-word terminology owner and Blog #28 as the hands-on tricky-word routine owner.
- Adds wider-reading boundaries: phonics supports word-reading accuracy but does not automatically supply fluency, vocabulary or comprehension.
- Adds a non-diagnostic safeguard and closer-review criteria.
- Adds six external evidence references, five focused FAQs and dedicated Blog #20 regression coverage.

### Evidence boundary

Evidence supports explicit/systematic phonics, left-to-right decoding, spelling/encoding, efficient recognition of regular and irregular high-frequency words, gradual teaching of common-exception words and connected-text practice. DfE explicitly rejects whole-shape word-list learning as a replacement for phonics; UFLI distinguishes temporarily/permanently irregular words and recommends mapping regular plus irregular parts. The evidence does **not** establish a universal number of “sight words” per week, a fixed mastery percentage, or a false choice between decoding and eventual automatic recognition. The Tiny Steps four-route framework is an editorial synthesis.

**Final decision: 97/100 — LOCKED IN BATCH.**

## Batch #2 merge gate

Do not merge PR #164 until the decisive exact-head CI/SEO gate is green, the final diff is clean, the PR is mergeable, and explicit founder approval is received.
