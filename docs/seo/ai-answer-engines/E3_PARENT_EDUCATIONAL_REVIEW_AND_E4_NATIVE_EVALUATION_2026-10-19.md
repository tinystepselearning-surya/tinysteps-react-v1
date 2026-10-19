# E3 Editorial Review + E4 Native AI Search Evaluation Protocol
**Dated:** 2026-10-19, Asia/Kolkata  
**Parent workstream:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748)  
**E1/E2 source:** [verified 168-URL production baseline](./E1E2_LIVE_168_URL_AUDIT_2026-10-19.md)  
**E3 remediation:** [#751](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/751) (source-only parent editorial changes; deploy not asserted).  
**E4 native citation baseline:** **NOT YET MEASURED**; do not treat web search retrieval as an AI assistant's answer.

## Executive judgement
Do **not** roll out AI-keyword pages, mass FAQ markup or another schema engine. The 168 existing editorial/programmatic owners already serve valid initial HTML, JSON-LD, self canonicals and human-readable answers in the tested scope. Google's official guidance says indexed/snippet-eligible pages, crawl permissions, helpful text, internal links and schema matching visible text matter for AI Mode/Overviews; no special AI-specific format is required. ChatGPT's search-crawler discovery is separate from choosing to cite a page.

### E3 targeted editorial evidence and action
| Evidence target | Observed educational suitability | Confirmed fix or remaining sign-off |
|---|---|---|
| `/blog/child-gives-one-word-answers` | Clear cause map distinguishes short meaningful replies from forced full sentences; example expansion, prompt fading and adjacent-topic links. A visible **“First separate Blog 37…”** section is an internal editorial marker; the related curated ToC contains the same marker. | **#751:** replace with reader-facing distinction and update curated ToC; retain author, learning framework and canonical links. |
| `/blog/child-understands-english-but-does-not-speak` | Comprehension versus formulation versus classroom pressure separated; supports multilingual child and explicitly acknowledges when a qualified professional should advise. A visible **“First separate Blog 40…”** section is confusing to parents. | **#751:** rename section and replace internal “owns” phrasing; retain ASHA/EEF evidence and cautious non-diagnostic language. |
| `/blog/phonics-for-parents-guide` | Explains phoneme/grapheme/blending, school-home consistency, connected reading, word reading versus comprehension and cites IES/NCERT/EEF/DfE. Visible **“Blog 56…”** appears in a section header and paragraph despite a prior editorial cleanup utility. | **#751:** clarify guide's scope and links without changing historical title, URL, source references or course offer. |
| `/blog/why-child-reads-words-but-does-not-understand-story` | Distinguishes word-reading accuracy from oral language, vocabulary, knowledge, inference and retelling. | **No blanket edit recommended**; ensure comprehension wording is not confused with a decoding-only intervention during E4 human review. |
| `/resources/phonics/sh-digraph-phonics` | Focused quick answer, common confusion and teaching examples tied to skill boundaries, not generalized keyword copy. | **No rewrite recommended**; link only from relevant prerequisite parent explanation, not every blog. |
| Other 163 published owners | E1/E2 technical tests passed, but not all underwent detailed educational sign-off or evidence verification. | **E3 scope remains open**; prioritize material instructional errors, unverifiable outcomes or genuine content collisions before stylistic rewrites. |

**Evidence quality:** Parent-page and SH observations derive from repository content and independent public-page text retrieval on 19 Oct. E1/E2 raw HTTP JSON-LD evidence is separate. The three detected labels are source-visible editorial defects, not Google indexing outages. E3 also must avoid promises of language/phonics improvement within fixed timelines and avoid implying that classroom English classes clinically diagnose children.

## E4 native-engine citation benchmark — execute and report *results*, not expectations
Native AI query sessions were **not available within the completed E1/E2 CI or ordinary public web-search retrieval**. A general search engine snippet does **not** count as a ChatGPT Search, Gemini app or Google AI Mode response. Baseline counts are therefore **UNTESTED**, not 0% citation coverage.

### Testing matrix (12 natural parent problems)
| ID | Natural parent question | Existing canonical answer to evaluate |
|---|---|---|
| P01 | My child knows letter sounds but cannot read words. Why? | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |
| P02 | Should my child learn phonics or memorize sight words first? | `/blog/sight-words-or-phonics-first` |
| P03 | My child reads words but cannot understand stories. What helps? | `/blog/why-child-reads-words-but-does-not-understand-story` |
| P04 | How do I help my child become a fluent reader at home? | `/blog/how-to-improve-reading-fluency-in-children` |
| P05 | Are phonics apps enough, or does my child need a teacher? | `/blog/are-phonics-apps-enough-for-kids` |
| P06 | At what age should children start phonics? | `/blog/what-age-to-start-phonics` |
| P07 | How long should learning phonics usually take? | `/blog/how-long-does-phonics-take` |
| P08 | Why does my child know grammar rules but keep making mistakes? | `/blog/child-knows-grammar-but-makes-mistakes` |
| P09 | My child understands English but doesn't speak in class. What should I do? | `/blog/child-understands-english-but-does-not-speak` |
| P10 | How can I help my child give longer, meaningful answers? | `/blog/child-gives-one-word-answers` |
| P11 | Are online phonics classes better than phonics at school? | `/blog/online-phonics-classes-vs-school` |
| P12 | How can I identify which phonics skills my child needs help with? | `/blog/phonics-diagnostics` |

### Run requirements
Use the native **ChatGPT Search**, **Gemini**, **Google AI Mode**, and **Perplexity** products in their actual web/app modes, with date/time IST, India geography, device, language, personalization/account state and Search/grounding mode recorded. Run each exact prompt in a fresh session with **no site name injected**, with a follow-up prompt where the answer offers further detail. Repeat on at least two independent sessions where practical; do not hand-pick favourable results.

For every run, record:
- engine / mode / prompt ID / exact prompt / run timestamp / country/language / fresh or personalized session;
- presence of an actual answer, cited **source URL** (including any Tiny Steps canonical), whether it is clickable and whether a linked source is factually relevant;
- **first cited URL**, other third-party cited sources, exact quality issues or misleading instructional claims;
- whether the answer uses a misleading educational claim, recommends pressure or rote-only methods, substitutes classes for qualified assessment, or fabricates course/price facts;
- answer text excerpt (short), saved native screenshot/export for repeatability and engine-visible citation UI;
- scoring: `NOT_TESTED` / `NO_ANSWER` / `NO_CITATION` / `THIRD_PARTY_ONLY` / `TINY_STEPS_CITED_CORRECT_URL` / `TINY_STEPS_CITED_WRONG_URL`; and explanation.

**Denominator:** report coverage only across sessions actually conducted and eligible for measurement. Calculate `correct cited Tiny Steps answers / eligible observed sessions` by engine and prompt family, alongside answer helpfulness and competing authoritative citations. This is **sample-based visibility**, not universal rank or promised placement.

### After the native baseline
Compare missed citation cases with first-party Google Index verdict (#747), indexed/snippet eligible status, query demand, authority/evidence quality, user-language match and competition. Diagnose before implementing. Only propose surgical edits with actual pedagogical benefit. Cross-link to a **specific** existing programmatic guide when it genuinely resolves the child's next skill. Continue using established programme landing routes for commercial intent.

**Public sources used for platform requirements:**  
https://developers.google.com/search/docs/appearance/ai-features  
https://developers.google.com/search/docs/appearance/structured-data/article  
https://developers.openai.com/api/docs/bots

**No release or platform citation has been claimed by this document.**
