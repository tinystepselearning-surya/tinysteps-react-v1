# Tiny Steps Spelling Journey — Pedagogy and Game Architecture v1.0

**Date:** 15 November 2026 (IST)  
**Workstream:** Spelling & Learning Games only  
**Branch:** `feat/spelling-learning-journey-20261115`  
**Status:** Sound-free visual puzzle prototype implemented on branch; **not merged or deployed**. The broader spelling curriculum is still a design roadmap.

## Mission

Make English spelling understandable, enjoyable, transferable, and progressively independent for children at different readiness levels. Support two-letter words through morphologically complex 15+ letter words, without imposing an artificial maximum length. Design first for approximately ages 3–12, but assign progression by demonstrated skill rather than age alone.

**Non-goals:** building a second CRM, changing leads/payments, mass producing SEO pages, replacing the phonics curriculum, ranking children publicly, or teaching giant words for novelty alone.

## Current repository audit (15 Nov 2026; default branch)

- Existing `/free-spelling-game-for-kids` uses `PublicEnglishGamePlayer` and `MakeAWordRimeGame` in `publicSpellingAdventure` mode.
- `src/lib/publicSpellingContent.ts` defines **6 levels × 6 challenges = 36 seed challenges** across `build`, `family`, `missing`, `choice`, `fix`, and `spell` modes, labelled foundation/developing/confident.
- Existing seeds largely span CVC words through some multi-syllabic words; **no systematically taught two-letter-to-advanced sequence** is encoded in this small game.
- The public wrapper supplies `disableAudio`; the public adventure currently relies on picture/meaning/sentence cues rather than an explicit phoneme mapping and audio-led dictation journey.
- The authenticated `KidsGamesHub` presents a disabled **SpellBee Practice — Coming Soon** tile.
- Reuse `phonicsWordSounds.ts` and sound registries where they accurately describe mapping; never guess phonemes or syllables from text string slicing.
- Existing public URLs and SEO ownership must remain stable unless a verified defect specifically requires alteration.

These are source observations, **not** claims that new functionality is live.

## Evidence-led teaching principle

Sequence instruction through **Hear → Segment → Map → Build → Retrieve → Use → Revisit**.

1. Hear a clearly pronounced, meaningful target word in a short, understood context.
2. Segment spoken sounds (phonemes); for older learners also notice syllables.
3. Map each sound to its taught letter or multi-letter grapheme; show unexpected spelling portions explicitly.
4. Construct the word with tiles, then progressively remove scaffolding.
5. Retrieve the complete spelling without copied cues (tiles/typing/writing).
6. Read and use the word in a genuine sentence, meaning question, or short piece of writing.
7. Revisit it in new positions, later sessions, and alongside untaught words using the same pattern.

**Length is not difficulty:** `ship` has 4 letters, but 3 speech sounds `sh | i | p`. `unhappiness` can be analysed as `un- + happy + -ness` (spelling changes to `-happi-` in this derivative). Longer words demand syllable, morphology, meaning and etymology strategies, not giant undifferentiated letter lists.

## Curriculum: readiness → complex meaningful words

| Stage | Primary teaching target | Typical visible letter span | Example words | Conditions for entry |
| --- | --- | --- | --- | --- |
| S0 | Oral sound awareness, letter–sound knowledge, left-to-right sequence | N/A | /m/, /a/, /t/ | Beginning learners; no forced word memorisation |
| S1 | Two phonemes mapped to two single letters | 2 | am, at, in, it, on, up | Taught sounds are independently recognised |
| S2 | Regular CVC and contrast of initial/medial/final sounds | 3 | cat, pin, bed, sun, hop | Can segment two and three spoken sounds |
| S3 | Consonant blends and final clusters | 4–5 | hand, milk, frog, stop, plant | Each component phoneme understood |
| S4 | Multi-letter graphemes (digraphs) | 3–6 | ship, chat, thin, much | sh/ch/th introduced explicitly |
| S5 | Long vowels, split digraphs, common vowel teams | 4–7 | make, bike, rain, seed, boat | Teach ONE vowel pattern before comparison |
| S6 | Less simple vowel patterns and positional conventions | 4–8 | night, turn, coin, cloud, chair | Contrasts taught with accurate pronunciation |
| S7 | Inflections, endings and spelling changes | 4–10 | jumped, running, boxes, carried | Suffix meaning and relevant changes known |
| S8 | Syllables, stress, common syllable patterns, compounds | 6–12 | rabbit, picnic, sunset, computer, fantastic | Can read/write familiar single-syllable words |
| S9 | Common prefixes, suffixes and meaningful parts | 6–15 | unhappy, kindness, careless, disagreement | Basic words and word families known |
| S10 | High-frequency unexpected spellings | Parallel strand | said, does, friend, because, people | Teach by **known** and **unexpected** parts when each occurs in meaningful texts |
| S11 | Roots, origin, advanced word families | 8–16+ | transportation, communication, photosynthesis | Fluent sound–pattern analysis and morphological awareness |
| S12 | Advanced integration, long-word challenges, written use | 12–20+ (open-ended) | misunderstanding, interdependence, complex curriculum vocabulary | Demonstrated independent transfer, not age or length only |

The spans are **guidance**, not rigid curriculum gates. A long regular compound may be simpler than a short irregular word. S10 deliberately runs across stages rather than forcing common words to wait until late in the journey.

### Content-control rules

- Start with words whose sound–spelling correspondences were explicitly taught; use real familiar words first.
- Do **not** teach two-letter examples such as `of` or `to` as regular beginner sound-by-sound examples: their spelling needs separate explanation.
- Teach complex vowel patterns and spellings in distinct instructional sets before mixed discrimination.
- Match recorded pronunciation, sound segmentation and spelling examples; review variants across English accents.
- Child-facing examples must be meaningful and age-appropriate. Never imply any fixed number of letters is the ceiling.
- Maintain teacher-reviewed irregular sections and inflected spellings; avoid false simplified rules.

## Five interactive game experiences (one engine, several interfaces)

### 1. Sound Detective (readiness)
Listen to a word, tap a counter per phoneme, then choose corresponding single/multi-letter sound tiles. Give feedback on first/middle/last sound, without presenting a misspelt target as a memorisation task.

### 2. Word Builder (foundation)
See picture/context; hear word; tap sound blocks; assemble letters or grapheme tiles; read word aloud if desired. Gradually switch from ordered tiles to shuffled letters and eventually to blank recall.

### 3. Pattern Explorer (developing)
Sort by taught spelling pattern, complete a missing grapheme, compare real words with same sound/different spelling, and explain the clue. Not a generic choose-the-right-answer-only loop.

### 4. Spelling Adventure (all levels)
Short independent dictation with purposeful clues. Prompt → attempt → *specific* corrective scaffold → second attempt → answer analysis → new-word transfer. A child may take as much time as needed. No punishment for retries.

### 5. Spell Bee Challenge (opt-in mastery)
Word spoken; sentence/context; independent spelling; optional clue tiers. Introduce only after the relevant concept is taught. No public rankings for children; cooperative or personal-best play preferred. Speed is optional and never the main mastery metric.

## Daily session design (illustrative 6–10 min)

- 1 min: familiar sound/pattern warm-up.
- 2 min: explicit new pattern and 1 worked example.
- 3–4 min: 3–5 varied new words with scaffold fading.
- 1–2 min: one untaught transfer word and a sentence use.
- 1 min: delayed retrieval from an earlier set if available.

For very young or struggling children use shorter, fewer-turn sessions without rigid time expectations. Teachers may extend, pause or modify.

## Adaptive logic and feedback contract

- Start with a short non-punitive diagnostic of taught sounds/patterns; let adults override a suggested stage.
- Distinguish *independent first-try accuracy* from *after-hint completion*. Do not call a prompted correct answer mastery.
- Suggested advancement gate for pilot testing: ≥80% independent accuracy on mixed examples over at least two sessions, plus at least one previously untaught transfer word. **Heuristic, not a validated scientific threshold.** Adjust after trials.
- Route mistakes to instructional categories: missing phoneme, wrong vowel, grapheme confusion, sequence error, orthographic convention, syllable boundary, suffix rule, unexpected segment, or keyboard slip.
- Feedback ladder: repeat spoken word → show 1–n sound counters → isolate target sound → remind relevant pattern → partially fill a grapheme → model and immediately try a **new** closely matched example.
- Never respond only with 'Wrong, try again'. Avoid forcing endless retries on the same item.
- Interleave mastered patterns, schedule revisit after short and longer intervals, and ask for generalisation to a new word. Treat immediate recall and durable retention separately.
- Tracking: stage/skill, previously taught patterns, independent attempts, hint usage, error category, transfer to unfamiliar words, later retention. Do not overclaim writing transfer without observing writing.

## Content data schema (conceptual, no migration yet)

`id`, `word`, `meaning`, `ageAppropriateness`, `stage`, `prerequisiteSkills`, `pronunciationAudioAsset`, `pronunciationVariant`, `phonemeSequence`, `graphemeSequence`, `syllableSegments`, `morphemeSegments`, `patternTags`, `unexpectedParts`, `contextSentence`, `picture`, `hintLadder`, `acceptedOrthographicVariants`, `reviewedBy`, `reviewVersion`.

- Each sound mapping and segment is explicitly editorially verified; automatic grapheme or syllable inference must not be presented as ground truth.
- Store both learner attempt evidence and derived progress in the existing authorised kid identity scope where appropriate. Public play remains usable without registration and should not require child personal data.
- No cross-child leaderboard, microphone upload, payment changes or unnecessary personal information.
- Audio needs controls, accessibility and a no-audio alternative; do not depend on automatic browser speech that may mispronounce phonemes.


## Parallel visual-only pathway for older learners (15 Nov owner refinement)

For children around **8–10+**, offer an independent **Spelling Puzzle Lab** without sound exercises, phonics prompts, autoplay, microphone use or audio dependencies. This is a **parallel optional instructional route**, not a replacement for the earlier sound-to-print foundation. A child who needs foundational intervention can still access that separately.

Four untimed puzzle tasks reuse the existing Kids Games Hub protected access:
1. Arrange shuffled letter and word-part tiles, via desktop drag/drop or accessible tap fallback.
2. Spot correctly spelled words among plausible common misspellings.
3. Insert missing letters or grapheme groups into a meaningful word.
4. Sort written words into spelling-ending/prefix/suffix categories by drag/drop or tap.

Prototype content: four levels × eight tasks = **32 authored seed puzzles**, progressing from `journey` and `friend` to `unhappiness` and `misunderstanding`. Each word has a child-friendly meaning clue, optional help, and a note about its spelling/structure. A correct first attempt without hints is tracked separately from answers reached after feedback. No timer, no ranking, **no backend writes, no browser storage, and no saved progress**. All score and attempt state exists only in the current React component and resets when the page reloads.

**Free prototype entry:** `/free-spelling-game-for-kids?play=1&mode=puzzles`. No login or child ID; integrated through the existing public spelling landing page and listed in the free English games directory. The older `?play=1` spelling adventure remains available unchanged. Both share the canonical `/free-spelling-game-for-kids` page; no duplicate indexable URL was added. The authenticated Kids Games Hub may link users to this public route, but the game does not depend on any authenticated access.

**No-progress policy (owner, 15 Nov):** The visual puzzle route intentionally does not read/write Firestore, localStorage, sessionStorage, IndexedDB or user profiles. It does not require an account and does not submit progress or scores to site analytics. Scoring only displays in-page before reload. Other pre-existing games and the public hub have independent browser-local completion features; those have not been modified by this isolated spelling change.

**Limitations:** It is a starter set, not an extensive curriculum. Some sorting items demonstrate pattern identification rather than independent spelling retrieval. Word lists, meaningful transfer to new words, repeat-session retention, mobile touch affordances and teacher pilot review must mature before asserting effectiveness or mastery.

## Design quality and performance

- Large tap areas and high contrast; no unnecessary distraction/over-animation.
- Full keyboard use, focus indicators, reduced-motion support, screen reader labels, mobile and tablet layouts.
- Autoplay off. Child can repeat a spoken word on demand and change speech rate when supported.
- Do not reveal answer in early picture/alt text/hints during the independent retrieval stage.
- Child-friendly non-punitive feedback and no time-based failure for foundational learning.
- No duplicate indexed SEO routes; preserve `/free-spelling-game-for-kids` canonical and existing game hub. New pages need clear new educational functionality.

## Implementation sequencing (independent branch only)

1. **Audit / tests:** Inventory old spelling flows, six public modes, content validity, state and accessibility. Add regression fixtures around current routes and existing progression.
2. **Curriculum engine MVP:** S0–S3, editorially validated seed words, sound mapping model, explicit hint ladder, guided-to-independent stages, local anonymous progress.
3. **Integrate UI:** Keep public URL, route new modes safely, add an authenticated Spell Bee entry behind a controlled rollout, preserve legacy functionality.
4. **Teach S4–S8:** Digraphs, vowel patterns, inflections, syllables, meaningful transfer tasks.
5. **Teach S9–S12:** Morphemes, origins, longer words, advanced optional Spell Bee; no arbitrary hard maximum.
6. **Pilot + release:** Teacher and child usability tests, word-level accuracy audits, accessibility, performance, real-device tests, CI/PR review; no merge/deploy before explicit approval.

## Acceptance tests

- Beginner can manipulate 2-letter `at` after the needed sounds are taught; can then spell a newly presented matching pattern.
- `ship` is represented as `sh | i | p` for three phonemes, never four sound boxes.
- `night` is represented with the correct `igh` grapheme and taught only after its pattern is introduced.
- `running` and `carried` include accurate suffix/spelling-change guidance.
- A child is not advanced simply by getting a previously displayed spelling correct.
- Hint-assisted answers lower first-try independent accuracy but still give learning credit.
- High-level child learns meaningful structure of `misunderstanding` rather than reproducing letters mechanically.
- Public play does not write child identity records or require signup.
- Existing game routes, progress, page SEO, enrolment, payment, and access-control tests continue passing.

## Evidence

- IES What Works Clearinghouse, *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade* (strong evidence for awareness of sounds and mapping to print; decoding and word parts): https://ies.ed.gov/ncee/wwc/PracticeGuide/21
- Linnea Ehri, 2022, alphabetic phases and orthographic mapping: https://www.readingrockets.org/node/33944
- Reading Rockets, *Spelling: In Practice* (sound segmenting, word chains, word sorts, morphology): https://www.readingrockets.org/reading-101/reading-101-learning-modules/course-modules/spelling/practice
- 2024 synthesis of spelling instruction outcomes and transfer limitations: https://onlinelibrary.wiley.com/doi/10.1002/pits.23223
- 2024 meta-analysis of morphology instruction and literacy outcomes: https://link.springer.com/article/10.1007/s10648-024-09953-3

**Approval boundary:** The new free-game implementation and its draft PR are prepared for validation only. This document is not approval to merge, deploy, change production systems or migrate any records.
