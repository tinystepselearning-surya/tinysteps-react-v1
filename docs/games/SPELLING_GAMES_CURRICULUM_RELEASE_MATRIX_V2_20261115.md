> **Archived snapshot (superseded).** The current 10-level, 438-challenge inventory and visual-integrity requirements are in [SPELLING_LEARNING_PATH_AND_IMAGE_INTEGRITY_V3_20261115.md](SPELLING_LEARNING_PATH_AND_IMAGE_INTEGRITY_V3_20261115.md). The figures below describe an earlier iteration and are not current.

# Tiny Steps free spelling games — expanded curriculum and release controls

**Workstream:** `feat/spelling-responsive-full-curriculum-20261115` · **PR:** #907 · **Status:** development / review only

## Parent-facing promise

Two separate, free written-word games at the existing canonical URL, without new login, child profile, microphone, TTS, sound requirement, stored scores or site-level progress. The in-page success counter is temporary and resets on refresh. Avoid claiming the games cover every English spelling or a formal grade-level syllabus.

## Ordered practice coverage

| Learning pathway | Level or activity | Content | In one session | Intended concept |
|---|---|---:|---:|---|
| Spelling Adventure (early writers) | Optional Two-Letter Words | 18 written two-letter words | 6 | Read a meaning/sentence and build short spellings without audio |
| Spelling Adventure | Build Words | 18 | 6 | 3–7-letter words, letters in order, blends and written patterns |
| Spelling Adventure | Word Families | 18 | 6 | Compare written word endings, first-letter selection |
| Spelling Adventure | Missing Letters | 18 | 6 | Recover one letter by examining the whole written word |
| Spelling Adventure | Choose Spelling | 18 | 6 | Distinguish accurate spelling from plausible mistakes |
| Spelling Adventure | Fix Spelling | 18 | 6 | Actively correct misspelled words |
| Spelling Adventure | Spell Word | 18 | 6 | Independently retrieve complete spelling from meaning |
| Spelling Puzzle Lab (older independent readers) | 1. Everyday Words | 24 | 8 | Familiar words, correction, endings |
| Spelling Puzzle Lab | 2. Patterns & Endings | 24 | 8 | Endings, beginning patterns, common conventions |
| Spelling Puzzle Lab | 3. Longer & Compound Words | 24 | 8 | Multi-part words, spelling of longer words |
| Spelling Puzzle Lab | 4. Tricky Spellings | 24 | 8 | Irregular patterns, spelling changes |
| Spelling Puzzle Lab | 5. Prefixes & Word Parts | 24 | 8 | Prefixes, root words, suffixes, meaning changes |
| Spelling Puzzle Lab | 6. Long Word Challenge | 24 | 8 | Longer academic words and meaningful pieces |

**Total:** 126 classic activities (18 optional + 108 across six activities) and 144 Puzzle Lab activities (6×24), **270 curated challenge entries**. Some target words intentionally recur across different modes, because recognition, correction and independent recall practise different skills. These are counts of challenges, **not unique English words**.

Each classic activity has **three sets of six**. Each lab level has **three sets of eight** and includes building, correct-spelling choices, missing parts and pair sorting. Every completed lab set ends with independent full-word recall. Completing a set does **not** imply lasting mastery. Replay the next set; stop when the learner needs a break.

## Screen and accessibility contract

- The active play card should fit a typical laptop/tablet viewport without unnecessary marketing headers, unrelated navigation or a separate nested scrolling pane.
- On 320–390px phones and particularly short screens, natural vertical scroll is **required** when content exceeds available height. Do not shrink text below legible sizes, obscure feedback, truncate word tiles or crop action buttons to claim a false single-screen fit.
- Touch targets: about 44px minimum where practical; tiles wrap. Tabs wrap into rows rather than scrolling off-screen.
- Use keyboard-accessible buttons, headings, readable contrast, aria labels for letter tiles, and focus management.
- No arbitrary picture/emoji for meaning-only clues. The clue remains understandable without an image.

## Release checklist

1. Keep PR as draft until all focused tests and viewport tests pass on a main-reconciled commit.
2. Validate all two-letter tiles and all written-word puzzles programmatically (IDs, spelling, choice uniqueness, word parts and categories).
3. Verify first-round compatibility at existing links and all new stage routes; check 320, 375, 390, 768, 1024, 1366 and 1920px browser widths.
4. Independently inspect age-appropriate meanings, suffix changes and word-part annotations in the content.
5. Confirm neither Firebase nor the admissions/SEO/IndexNow workstream is changed.
6. Merge only after review and explicit release go-ahead, then verify the existing Hosting workflow and live pages.

## Limitations

This is a substantially expanded, finite **written-spelling game library**, not a complete English dictionary or a scientifically validated reading and spelling curriculum. Two-letter written-word activities are not intended to replace phonemic-awareness instruction. The 8+ game uses meaning, orthography, word construction and morphology without audio. Next content expansion should be based on children’s observed errors and teacher review, not adding long words for their own sake.
