# TSSA-7/B6 — Native AI Benchmark Evidence & Competitor Comparison

**Audit checkpoint:** 25 October 2026 IST  
**Status:** **historical evidence reconciled; 4-engine fresh native benchmark NOT COMPLETE**.  
**Parent project:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748). Source audit: [19 October native report](../ai-answer-engines/native-audit-2026-10-19/REPORT.md) and [original evaluations](../ai-answer-engines/native-audit-2026-10-19/EVALUATION_48.csv).  
**Implementation:** read-only source/evidence checks; no public pages, metadata, prompts, search indexing or commercial behaviour changed.

## B6 acceptance and provenance

Brick 6 aims to measure **actual provider-native answers** on twelve exact unbranded parent questions, not ordinary web search, crawl accessibility or structured-data validity. Its target platforms are **ChatGPT Search, Gemini, Google AI Mode and Bing/Copilot**.

The repository already contains a genuine **19 October 2026** native guest cohort of **36 completed answers**: ChatGPT 12, Gemini 12 and Google AI Mode 12. The earlier fourth platform was Perplexity, where 12 trials remained NOT_TESTED due to the guest sign-in barrier (only P01 returned a sign-in prompt; eleven prompts were not submitted). That archived 48-cell record must **not** be silently redefined as a Bing benchmark.

This B6 checkpoint **reuses the existing dated cohort** and adds **twelve explicitly NOT_TESTED Bing/Copilot slots** to a new 12×4 comparative view. **Zero new native answers** were obtained for the 25 October session; there is no valid 25 October cross-platform citation rate, uplift, native leaderboard or current competitive rank. The generated source-label file preserves names/text from original native source panels; it is not a verified backlinks, domain-authority, rankings or share-of-voice measurement.

## Historical native-score matrix — 19 October 2026

| Platform | Genuine completed answers | Exact intended Tiny Steps owner | Different Tiny Steps destination | Only third-party disclosed | No visible citations | Unattempted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ChatGPT Search | 12 | 0 | 0 | 12 | 0 | 0 |
| Gemini | 12 | 0 | 0 | 2 | 10 | 0 |
| Google AI Mode | 12 | **1** | **2** | 9 | 0 | 0 |
| Bing/Copilot | **0** | — | — | — | — | **12** |

**Caveat:** “Third-party disclosed” for ChatGPT means no Tiny Steps citation in the accessible source UI, **not** exhaustive visibility into grouped, unexpanded sources. Gemini P05 listed “Medium” without an exact expanded link; the reviewer did **not** assign that link to Tiny Steps merely because a separate AI Mode response cited a Tiny Steps Medium article. Source selection may vary by locale, sign-in status, query timing or product mode. Original accounts were signed out, with India requested but actual country unverified.

### Three Google AI Mode Tiny Steps destinations

| Question | Observed target | Classification |
| --- | --- | --- |
| P01 — letter sounds but cannot read words | /blog/why-child-knows-letter-sounds-but-cannot-read-words | Exact intended canonical article |
| P05 — are phonics apps enough? | Tiny Steps-author-attributed **Medium** republication of phonics-apps article | Different, externally hosted source; syndication control/canonical setting unverified |
| P08 — knows grammar rules but makes mistakes | /resources/grammar/common-grammar-mistakes-for-kids | Different but relevant instructional resource; **not** an incorrect site canonical |

**Rates with denominators:** exact-owner selection for Google AI Mode was **1/12** historical answered prompts. Any verified Tiny Steps destination in the accessible AI Mode UI was **3/12**. There are no legitimate 12-question Bing rates and no evidence of any post-B5 improvement. “Cited once” means a benchmark prompt outcome, not a site-level AI citation count.

## Competitor and educational-source observations, not a ranking study

The 19 October report names observed source examples: IES and reading educators for blending; phonics-app sites and a Tiny Steps Medium republication for app selection; ASHA/NHS and education resources for reluctant speech; NAEYC and research-backed guidance for encouraging fuller child responses. These examples show the *kind of explanation and provenance providers selected*, not that a source ranked #1, won a stable competition or outranks Tiny Steps globally.

**Editorial interpretation:** demonstrate a helpful, bounded answer before a programme pitch. Protect decoding-versus-comprehension distinctions, skill-led placement, examples using unfamiliar taught-code words, normal multilingual variation and appropriate specialist boundaries. Do not imitate competitors' clinical claims, misleading reassurances or unsupported fixed learning guarantees.

**No automatic code changes from benchmark observations.** Previously scoped parent-to-resource links (e.g. grammar transfer article ↔ worked mistake guide, comprehension article → context clues) remain *conditional*: inspect built HTML for existing equivalent handoffs first; only change on demonstrable parent-navigation need. Native selection alone does not establish a website defect.

## Separate first-party aggregate evidence

Historic owner-reported GSC Generative AI Search appearances and Bing Webmaster AI Performance citations are **not** interchangeable with this session matrix. Bing documents its report as **aggregated** citation activity covering Microsoft Copilot, Bing summaries and some integrations. Grounding queries are *not* a log of the twelve exact prompts; citation counts do not establish AI ranking, traffic or clicks. See [official Bing metric definitions](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c) and [master roadmap](./README.md) for historic owner-reported measurement context. Never add Clarity and Bing counts if periods/surfaces overlap, or add Generative AI impressions to conventional GSC impressions.

Independent ordinary web search can establish retrievability, **not** actual selection by ChatGPT, Gemini, Google AI Mode or Bing.

## Reproducible engineering delivery

- Run `node scripts/tssa7-b6-native-benchmark.mjs` to read the original 48 CSV rows and frozen planning matrix; it cross-checks 12 prompts, canonical owner URLs, citation classifications, observation timestamps and existing local native evidence files.
- Outputs under `artifacts/tssa7-b6/`: `HISTORICAL_12X4_RECONCILIATION.csv`, `OTHER_SOURCE_LABELS_UNVERIFIED.csv`, `FRESH_NATIVE_SESSION_TEMPLATE.csv`, `SUMMARY.json`.
- `node --test scripts/test/tssa7-b6-native-benchmark.node-test.mjs` guards false positive exact-owner claims, altered prompts, owner drift, missing evidence, zero-denominator handling and blank future-session placeholders.
- A read-only GitHub Actions job independently regenerates the matrix and uploads evidence; no AI-provider account usage, Firebase deployment or indexed URLs are affected.
- The future-session template is **unobserved**. Never populate with hypothetical citations or synthetic model responses. Require actual native product UI evidence or an authorized, functionally equivalent provider-native read with traceable source URLs.

## Remaining external acceptance criteria — do not prematurely close B6

1. Capture a **new consistent native 12-question × 4-platform cohort** (48 answer attempts), retaining test date, actual geography when shown, language, product mode, signed-in status, fresh-session state, displayed answers, source-panel completeness, clicked Tiny Steps URLs and evidence paths. Genuine blocks remain **NOT_TESTED**, excluded from each platform's completed-answer denominator.
2. For each answer, classify exact intended owner, different Tiny Steps guide, external syndication, third-party source or no visible citation. Check for factual inaccuracies, age/stage mismatches, clinical overreach and forced class recommendations. Compare source selection **per prompt**, not by ungrounded authority metrics.
3. Compare **like-for-like native cohorts** when available; date, locale, account and interface are confounders. Green CI proves evidence integrity, not model visibility.
4. If verified educational defects appear, scope minimum safe content correction on its own PR with normal source/build/indexing/release gates. If not, leave published pages unchanged.
5. Bing Webmaster aggregate citation data and Google/Bing indexed verdicts remain separate tracks (#747). B7 will monitor repeatable production and provider metrics after genuine B6 observations or documented external availability exceptions.

**Engineering decision:** Audit tooling and historical source reconciliation can merge safely, but B6's declared *fresh native four-platform* acceptance is **not satisfied** by a 19 October three-platform sample plus untested Bing placeholders. Mark **B6 EVIDENCE INFRASTRUCTURE COMPLETE / PROVIDER RETEST PENDING**, not B6 COMPLETE.
