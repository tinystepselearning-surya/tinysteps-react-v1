# TSSA-SCQ — Phase 2 parent-question editorial acceptance

**25 October 2026 · Read-only curriculum/content judgment against main + Phase 2 rendered HTML evidence**

Source evidence: TSSA-7/B1+B3 (28 parent problems, 12 benchmark questions, 9 commercial intents), generated-page evidence from [PR #781 / workflow #40194043713](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/40194043713), editorial review of 27 primary-owner page sources and first-screen prerendered excerpts. The source-owner/rendering audit had 40/40 resolved answers, nine commercial owner checks, zero hard failures. This follow-up is **human-style educational review of page substance, not automated word-overlap grading**, not independent teacher panel approval, and not an external AI citation audit.

## Review standard

- **DIRECT:** primary page explicitly answers the intended question, with meaningful examples and actionable teaching progression. Does not assert that every individual claim has been independently validated.
- **PARTIAL:** page contains useful but incomplete or indirect teaching for the narrower question; investigate targeted in-page improvements or a better existing owner.
- **SUPPORTING:** page is a broad gateway or symptom guide rather than the most precise explanation; this is primarily a semantic handoff/ownership question, **not evidence of missing content**.
- **UNANSWERED:** no useful existing material demonstrated. None verified in this cohort; this does not prove there are no unmet queries outside the cohort.

## Classification summary

| Classification | Question checks |
| --- | ---: |
| Direct answer | 32 |
| Partially answered | 3 |
| Supporting/gateway only | 5 |
| Confirmed unanswered | 0 |
| **Total** | **40** |

## All 40 question-level decisions

| Question ID | Assessment | Source-backed rationale |
| --- | --- | --- |
| `problem-grammar-cannot-organise-paragraphs` | DIRECT | Paragraph focus, logical order and relevant details with worked examples |
| `problem-grammar-incomplete-sentences` | DIRECT | Core sentence structure and oral-to-written transfer |
| `problem-grammar-knows-rules-but-does-not-use-them` | DIRECT | Four-stage recall-to-speaking-to-writing framework |
| `problem-grammar-limited-descriptive-vocabulary` | PARTIAL | Creative-writing page demonstrates precise word choice but descriptive vocabulary retrieval is not its primary focus |
| `problem-grammar-mixes-tenses` | DIRECT | Tense meanings, time cues, irregular verbs and independent practice |
| `problem-grammar-poor-punctuation` | DIRECT | Sentence boundaries, capitals, punctuation decisions and focused editing |
| `problem-grammar-repetitive-sentence-beginnings` | PARTIAL | Paragraph-cohesion guide supports variation indirectly; no prominent routine targeted at repetitive openings |
| `problem-grammar-speaking-grammar-does-not-transfer-to-writing` | DIRECT | Explicit separation of spontaneous speech and written transfer |
| `problem-grammar-very-short-sentences` | DIRECT | Sentence building and meaningful expansion rather than length for its own sake |
| `problem-grammar-weak-editing` | DIRECT | Find, explain, repair and reread; worked paragraph editing |
| `problem-phonics-decodes-but-lacks-fluency` | DIRECT | Separate accuracy, automaticity, phrasing and comprehension |
| `problem-phonics-guesses-words` | SUPPORTING | General reading-problem page mentions guessing; decoding/guessing explanation is less focused than dedicated existing guides |
| `problem-phonics-letter-sounds-known-cannot-blend` | DIRECT | Six-stage diagnosis for transfer from individual sounds to printed decoding |
| `problem-phonics-memorises-instead-of-reads` | DIRECT | Orthographic mapping versus visual guessing with fresh-word tests |
| `problem-phonics-reads-without-comprehension` | DIRECT | Sentence meaning, connection, inference and oral retell checks |
| `problem-phonics-slow-decoding` | SUPPORTING | Slow-reader page distinguishes phonics and fluency but covers multiple causes; fluency article gives more targeted instruction |
| `problem-phonics-spelling-segmenting-difficulty` | SUPPORTING | Phonics resource hub routes readers but is not a primary segmented-spelling explanation |
| `problem-phonics-unfamiliar-word-decoding` | SUPPORTING | Broad reading page mentions new-word decoding but dedicated blending/pattern articles provide deeper help |
| `problem-phonics-vowel-confusion` | SUPPORTING | Phonics resource hub contains routes to vowel-specific concepts rather than one self-contained troubleshooting answer |
| `problem-speaking-cannot-explain-ideas` | PARTIAL | Sentence building supports clear expression; organising a multi-step explanation also needs conversation/reasoning skills |
| `problem-speaking-cannot-express-opinions` | DIRECT | Debate starter covers opinion, reason, example, listening and respectful response |
| `problem-speaking-cannot-tell-stories` | DIRECT | Retell structure, detail selection, summarising and independent storytelling |
| `problem-speaking-hesitates` | DIRECT | Comprehension, model, prompt, independent response and cross-setting sensitivity |
| `problem-speaking-one-word-answers` | DIRECT | Answer expansion, modelling, fading support and bilingual-context caveats; one internal heading needs cleanup |
| `problem-speaking-presentation-difficulty` | DIRECT | Hook, points, conclusion, rehearsal and adaption with examples |
| `problem-speaking-understands-but-does-not-speak` | DIRECT | Distinguishes comprehension, speech initiation, confidence and multilingual setting |
| `problem-speaking-unfamiliar-people` | DIRECT | Gradual, low-pressure audience and communication practice |
| `problem-speaking-vocabulary-disappears` | DIRECT | Conversation article includes retrieve, use and reuse practice |
| `P01` | DIRECT | Why knowing sounds does not automatically enable blending; practical checks |
| `P02` | DIRECT | Phonics versus sight-word memorisation with irregular-word nuance |
| `P03` | DIRECT | Word reading versus comprehension with teaching progression |
| `P04` | DIRECT | Accurate decoding, phrasing, oral rereading and meaning |
| `P05` | DIRECT | Apps versus teacher guidance; screen skill versus independent reading transfer |
| `P06` | DIRECT | Phonics starting age treated as readiness-sensitive; age is not placement test |
| `P07` | DIRECT | Parent phonics timeline with stage-sensitive progress expectations |
| `P08` | DIRECT | Grammar-rule recall versus spontaneous transfer |
| `P09` | DIRECT | Comprehension versus independent spoken response in class |
| `P10` | DIRECT | One-word response expansion without forcing every answer to be long |
| `P11` | DIRECT | Online versus school phonics assessed by child fit, not promotional ranking |
| `P12` | DIRECT | Taught sounds, oral blending, fresh decoding, spelling/segmentation and transfer checks |

## Distinct correction or review candidates

1. **Release-ready parent-facing wording:** `/blog/child-gives-one-word-answers` uses 'Tiny Steps protects...' and heading 'The protected Tiny Steps answer-expansion checkpoint'. Replace with plain teaching language. Preserve the three-step response expansion, examples, pressure-sensitive nuance, evidence links, canonicals and FAQ. The Article TOC prefix is stored separately in `src/pages/BlogPostPage.tsx`; update in lockstep.
2. **Five supporting/gateway intents, not new URL requests:** the broad `/child-not-reading-properly` and `/slow-reader-child-help` pages, plus `/resources/phonics`, are sensible entry points but could direct parents more precisely to existing guessing/decoding, fluency, word building, or vowel-pattern guides. First check the existing navigation before modifying registry owners or rewriting commercial pages.
3. **Three partial narrow intents:** limited descriptive vocabulary (current creative-writing page), repetitive sentence beginnings (paragraph writing), and explaining ideas clearly (sentence formation). Consider a paragraph-sized within-owner clarification or an existing better-matched guide, not bulk content generation.
4. **Seven NO_DIRECT_FOLLOWUP flags:** five or more distinct owner↔practice relationships may be reachable via hub or surrounding context, and the automated flag does not prove broken navigation. Inspect exact anchor names and current structured pathways before adding duplicate calls to action.
5. **Source/rendered difference:** do not automatically rewrite old repository text such as 'Blog 43'/'Blog 51'. The Phase 2 final generated HTML audit did not flag those as parent-visible. Confirm the final rendered string first; source wording and visible wording may differ due to shared editorial normalization.

## Release and project boundaries

Do not change URLs, canonicals, robots directives, curriculum facts, class duration, source corpus classifications or visual design. Do not promise rankings or equate GSC overlap to cannibalisation. Existing native AI evidence is historical; provider-native citation selection has NOT been retested here.

**Phase 2 decision:** source ownership and a qualitative 40-question triage are documented. One defensible copy-only fix can proceed in the same small PR; all eight question-specific partial/supporting cases and seven navigation flags remain targeted research/Phase 3 candidates rather than proven production defects.

