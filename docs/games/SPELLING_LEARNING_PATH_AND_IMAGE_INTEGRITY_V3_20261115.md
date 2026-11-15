# Spelling games — expanded learner journey, November 15, 2026

**Development branch:** feat/spelling-responsive-full-curriculum-20261115
**Draft PR:** #907
**Public canonical landing path:** /free-spelling-game-for-kids (unchanged)
**Status:** Development and review only. No production deploy.

## The two games are different, not duplicates

Spelling Adventure serves early written-word practice using six kinds of activities: Build Words, Word Families, Missing Letters, Choose Spelling, Fix Spelling, Spell Word. An optional two-letter warm-up precedes this journey. This is sound-free written spelling practice, not a replacement for explicit phonics instruction.

Spelling Puzzle Lab offers older independent readers a **10-level** sequence. Every level mixes word-part assembly, correct-spelling choices, missing letters and pair sorting. Completing a level includes an unaided recall check, and the results screen offers a next-level action.

## Learning path and counts

| Game | Level or activity | Curated challenges | Mini-round |
|---|---|---:|---:|
| Adventure | Optional two-letter written words | 18 | 6 |
| Adventure | Build Words | 30 | 6 |
| Adventure | Word Families | 30 | 6 |
| Adventure | Missing Letters | 30 | 6 |
| Adventure | Choose Spelling | 30 | 6 |
| Adventure | Fix Spelling | 30 | 6 |
| Adventure | Spell Word | 30 | 6 |
| Puzzle Lab | 1. Everyday Words | 24 | 8 |
| Puzzle Lab | 2. Vowel Spelling Patterns | 24 | 8 |
| Puzzle Lab | 3. Patterns & Endings | 24 | 8 |
| Puzzle Lab | 4. Longer & Compound Words | 24 | 8 |
| Puzzle Lab | 5. Syllable Spelling | 24 | 8 |
| Puzzle Lab | 6. Plural & Word Changes | 24 | 8 |
| Puzzle Lab | 7. Tricky Spellings | 24 | 8 |
| Puzzle Lab | 8. Prefixes & Word Parts | 24 | 8 |
| Puzzle Lab | 9. Word Roots & Meanings | 24 | 8 |
| Puzzle Lab | 10. Long Word Challenge | 24 | 8 |

**Total: 438 curated challenge entries.** The early game has 198 (18 + 180). The lab has 240 (10 × 24). Entries are activities, *not 438 unique English words*: reusing a target word to build, correct and independently recall it is intentional. There are five non-overlapping six-challenge sets per Adventure activity, three six-word warm-up sets, and three eight-puzzle sets per lab level.

## Meaning and visual rules

- The clue must establish a meaningful relationship to the target spelling: a child-readable definition or sentence, not a random symbol.
- Display only a relevant editor-mapped image or emoji. For abstract and meaning-only targets without a trustworthy visual, show a clear text clue and **no image**. Never substitute a cloud, generic star, or unrelated object for every word.
- Illustrations are supplemental and should not disclose the answer through image alt text. The written clue is accessible independently.
- Feedback reinforces the written pattern after an attempt. Sorting activities contrast two words. Word-family activities compare meaningful written endings.
- Carefully authored syllable groups and prefix/root/suffix rules must not be inferred automatically by string splitting. Syllable-count tasks refer to *spoken* syllables.
- Existing first-round words and the public SEO route are retained to prevent unintentional regressions.

## Responsive rules

- Laptop and tablet: a compact single task surface with clue, interaction, hint, feedback and Next puzzle visibly connected. Avoid a large blank panel or multiple unnecessary full-screen sections.
- Shorter mobile phones: use natural document scrolling, not cropped fixed-height boards. Maintain readable text and touch targets; do not falsely promise that an entire complex puzzle will fit vertically on every phone.
- Support tapping without drag, prevent using a tile twice (especially words with doubled letters), and keep action controls accessible.
- Browser checks should include Chromium and WebKit (Safari engine), phone widths from 320px, an iPad-sized touch context, laptop 1366×768 success feedback, and a no-generic-picture regression.

## Release gate

1. TypeScript, spelling validators and React tests pass.
2. Chromium and WebKit cross-device browser suites pass.
3. Human educational review checks meaning, spelling, inflections, syllable divisions, roots and intended age/skill progression.
4. Reconcile current main, verify other workstreams unchanged and keep this PR draft until approved.
5. After approved merge, verify deployed canonical routes and real devices.

**Scope limit:** This is a substantially expanded finite written-spelling library. It is not a complete English lexicon, a teacher-tested reading intervention or guaranteed mastery of 438 different words. Continue growing based on observed learner errors and reviewed word patterns rather than artificial word-count inflation.
