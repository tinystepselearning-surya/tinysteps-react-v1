# TSSA-7 — Tiny Steps Search Authority 7

**Project tag:** `TSSA-7`  
**Scope:** Evidence-based search authority for Tiny Steps Learning, children aged **3–12**, across Google Search/AI Mode, Bing and Microsoft AI, ChatGPT Search and Gemini. Phonics, Reading, Grammar, Writing, Vocabulary, Speaking, Communication and public course curriculum.  
**Live website:** https://tinystepslearning.com  
**Parent tracking issue:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748)  
**Brick progression (25 October 2026):** **B1 COMPLETE** (merged PR #758); **B2 REPOSITORY ENGINEERING VERIFIED** (live 10/10, eight guard tests, GitHub runs #40130321849 and #40130321866, proposed integration PR #766). Prior B2 metadata (#760) and parent-journey (#755) improvements are already merged/deployed. **Google/Bing engine-selected indexing outcomes remain an external watch in Issue #747** and are not claimed resolved. **B3 REPOSITORY ENGINEERING COMPLETE** — [PR #768](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/768) merged at `68dc9ac0` after all source, curriculum-age and rendered SEO checks passed. [B3 acceptance evidence](./B3_PARENT_INTENT_COVERAGE_2026-10-25.md). Production Hosting verification is separately pending a fresh release because concurrent SEO health-audit commit `30acbb43` triggered the stale-deploy guard; do not count the failed older-SHA deployment as live. **Next internal brick: B4.** See [B2 engineering closeout](./B2_REPOSITORY_REMEDIATION_2026-10-25.md).

## Seven-brick contract

| ID | Name | Acceptance result | Current state |
|---|---|---|---|
| TSSA-7/B1 | Content and authority baseline | Nonduplicated canonical ledger, question-owner mapping, curriculum/17-report crosswalk and evidence-status register | **COMPLETE** — #758 merged; CI passed |
| TSSA-7/B2 | Google and Bing indexing | Technical origin and machine-directory fixes + separately recorded Google/Bing indexed verdicts | **REPOSITORY ENGINEERING VERIFIED, PR #766** — [10/10 live gate + tests](./B2_REPOSITORY_REMEDIATION_2026-10-25.md); external indexed verdicts deferred to #747 |
| TSSA-7/B3 | Parent questions and curriculum coverage | Prioritized parent-intent map, one source owner per intent, meaningful stage/age boundaries | **REPOSITORY COMPLETE; PR #768 merged** — 28 parent problems, 12 benchmark questions, nine commercial intents, seven source-linked course-age labels; production confirmation pending; [audit](./B3_PARENT_INTENT_COVERAGE_2026-10-25.md) |
| TSSA-7/B4 | Educational content authority | Pedagogical review, independent references, appropriate author/expertise evidence, scoped editorial corrections | PLANNED |
| TSSA-7/B5 | Internal linking and external brand authority | Useful parent → explanation → practice/programme paths and substantiated entity/syndication evidence | PLANNED; unrelated draft #755 held |
| TSSA-7/B6 | Native AI and competitor benchmarking | Actual dated native citations and source accuracy for ChatGPT, Gemini, Google AI Mode, Bing/Microsoft | PLANNED; existing draft #754 evidence |
| TSSA-7/B7 | Production verification and monitoring | Verified releases, repeatable comparative AI discovery measurement, regression alerts | PLANNED |

**Progress rule:** Previous audits and PRs are inputs, **not** completed TSSA-7 bricks by renaming. Mark brick COMPLETE only after its declared acceptance evidence and, when applicable, reviewed successful CI and approved merge. Work one brick at a time; technical indexability ≠ search engine indexed ≠ ranked ≠ cited ≠ parent enquiry. Search engines alone decide visibility.

## B1 — Why the ledger has 279 entries but only 168 direct-HTTP audit passes

Our existing generator `scripts/generate-rss.mjs` produces `public/ai-resource-index.json` from canonical content source registries. **The generated JSON is not a tracked source file**, so B1 regenerates it in an ephemeral CI workspace, reconciles it and saves auditable CSV/JSON artifacts.

| Generated corpus key | Source-corpus entries (19 October 2026 baseline) | Direct-production checks already completed |
|---|---:|---:|
| `editorial_blogs` | 83 | 83 |
| `programmatic_phonics_guides` | 31 | 31 |
| `programmatic_grammar_guides` | 38 (32 core + 6 reference) | 38 |
| `vocabulary_authority_guides` | 16 | 16 |
| `additional_public_routes` | 111 | **Not part of the 168-URL audit** |
| **Distinct public-content entries** | **279** | **168** |

The 111 extra entries include resource hubs, parent-help, course/commercial, activities and other public routes. Some have `indexing_state = noindex` by design. No TSSA-7 requirement says that every generated entry must be in Google's index. The 83 blog entries already include Speaking-owned editorial pages; they are not 83 plus 14. The 10 parent help guides are separate page routes; the 7 course levels are **public programme overview pages**, not 245 independently indexable classroom lesson pages.

**Strongest dated technical source:** [168-URL production E1/E2 audit](../ai-answer-engines/E1E2_LIVE_168_URL_AUDIT_2026-10-19.md). The current B1 script **does not re-run 168 HTTP checks** and records that evidence as `PASS_WITHIN_E1E2_SCOPE` as of **19 October 2026**, not a permanent live check. Other 111 rows receive `NOT_INCLUDED_IN_168_URL_SCAN`; actual Google and Bing individual indexed verdicts stay `UNVERIFIED`.

### B1 source-policy discrepancy — two public-speaking course URLs

**Verified against current `main` source**: the generated `ai-resource-index.json` currently classifies **21 of 279** entries as `noindex`. **19** are supporting/private/legal or intentionally excluded source URLs; **two are different**:

| Canonical destination | Generated AI directory | Canonical course-route policy | Cause |
|---|---|---|---|
| `/courses/public-speaking-foundations` | `noindex` | `/courses/**` **index** | Older `/courses/basic-public-speaking[\/]` redirect aliases have `noindex` in `routeSeoRegistry.js` |
| `/courses/public-speaking-excellence` | `noindex` | `/courses/**` **index** | Older `/courses/advanced-public-speaking[\/]` redirect aliases have `noindex` in `routeSeoRegistry.js` |

`scripts/generate-rss.mjs` builds the directory corpus from the **union** of the public manifest and `routeSeoRegistry.js`, chooses each entry's **canonicalPath**, and retains the first record for a canonical URL. Redirect-source metadata can therefore be attributed to its actual destination before the destination's own source-policy is considered. This is a **machine discovery-directory classification conflict, not verified live course-page noindex**. The two routes remain declared as public canonical 301 destinations, and the site's dynamic `/courses/**` SEO intent is **index/follow**. Do not rewrite page canonicals or request indexing on the strength of this artifact.

**B1 action:** Add `SOURCE_INDEX_POLICY_CROSSCHECK.csv` with all 279 generated entries, direct canonical route-policy comparison, mismatch markers and redirect alias trace. CI fails if any **additional, unrecognized** classification conflict appears. The current two are documented evidence and **deferred to B2**, which must reproduce the actual served robots/meta, sitemap, GSC selected canonical/index state and Bing URL inspection before a scoped generator fix. Correct machine metadata only after establishing canonical ownership and regression tests. Machine-directory `258 indexable + 21 noindex` and source route-policy `260 indexable + 19 noindex` describe **different source-level classifications**; neither is a Google-index count.

Also note **two of the 28 Layer-1 parent problems** are deliberately in source state `hold-no-url`; the mapping can legitimately fall back to the Phonics resource hub rather than inventing two thin answer pages. This is **not** evidence of two missing publication requirements. B3 should check whether parents can resolve the concern using existing guides.

**Curriculum source:** `src/config/semanticFacts.ts`, `src/content/phonicsCurriculum.ts`, `src/content/grammarCurriculum.ts`, `src/content/speakingCurriculum.ts` and public course catalogue. Phonics 31 + 40 + 30 = **101**; Grammar 36 + 36 = **72**; Speaking 36 + 36 = **72**. Total **7 public levels / 245 internal structured lessons**. These are programme teaching counts, not published standalone SEO-page counts.

**Existing audits:** All **17 workstream reports A01–A17** were integrated in [the consolidated register](../visibility-17-audits/COMPREHENSIVE_FINDINGS.md) as of 17 October. A01 was “evidence collected”; A02–A17 “complete with limitations”. Many report-level Google/Bing/native-AI statements precede the later 19 October first-party data and should not be falsely promoted to current outcomes or erase more recent measurements.

### B1 output files, generated by CI

Run from the repository root:
```sh
node scripts/generate-rss.mjs
node scripts/tssa7-b1-content-authority-ledger.mjs
```

The script writes these **audit artifacts** to `artifacts/tssa7-b1/` (ephemeral; CI uploads them to a downloadable workflow artifact):

- `CONTENT_AUTHORITY_LEDGER.csv` — one row per canonical entry, corpus family, role, subject classification, source index policy, AI answer-layer membership, historical technical evidence and unknown Google/Bing verdicts
- `PARENT_PROBLEM_OWNER_MAP.csv` — the established **28** Layer-1 parent problems, their canonical owner and teaching/practice links
- `PRIORITY_12_CANONICAL_OWNERS.csv` — source-owned benchmark question owners from the existing 12×4 native matrix; **not** a claim that a source was cited
- `SEVENTEEN_AUDIT_CROSSWALK.csv` — A01–A17 report existence and honest dated evidence limitations
- `SOURCE_INDEX_POLICY_CROSSCHECK.csv` — all 279 directory entries versus canonical route indexing intent, including redirect alias metadata conflicts (not actual Google exclusions)
- `BASELINE_SUMMARY.json` — distinct count, directory revision, machine-directory and canonical-route policy splits, layer totals, unowned layer paths, 7 levels/245 lessons and validation results

The script fails on duplicate canonical ownership, broken 83-blog sitemap reconciliation, divergent 279/168 family counts, missing A01–A17 source reports, misplaced 12 benchmark owner URLs or curriculum-total drift. These thresholds are a **dated snapshot**: if real publication changes later, review the new count and refresh the baseline instead of manipulating the source to force 279.

**Important:** The generated `subject_classification` for additional public routes is a **heuristic label for review**, not confirmed academic taxonomy. `indexing_state` is a **source design intent**, not Google-indexed status. B1 must not hide those distinctions.

## Existing platform measurements — reference, do not add together

| Evidence | Dated value | Proper interpretation |
|---|---|---|
| Owner GSC Generative AI Search export, 18 Jul–17 Oct | **44,800 property-level impressions** | Google AI search appearances; not answers, clicks, leads or individual citations |
| Owner Bing Webmaster AI Performance export, 19 Jul–17 Oct | **18,025 citation occurrences** | Microsoft AI citation counts, a separate provider and metric |
| Owner Clarity citations export, 13–19 Oct | **1,388 citation occurrences** | Overlapping Microsoft context; not to be added to Bing occurrences |
| Initial native audit [draft PR #754](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/754) | **36 genuine sessions**, 12 each ChatGPT/Gemini/AI Mode; 12 Perplexity blocked | Google AI Mode 1 exact article citation + 2 other Tiny Steps sources; initial 12 each ChatGPT/Gemini had no observed Tiny Steps citation; tests are not rank guarantees |
| Owner ordinary Search Analytics, Oct 1–17 | **58/85** governed guide URLs with returned page rows | Not an indexing census; the other 27 are UNKNOWN, not “failed” |
| Specific signed-out owner screenshot Oct 19 | Tiny Steps third visible organic result for “best online phonics classes for kids”; native AI Mode includes brand | One session/query, not a stable worldwide #3 or a validated target for every AI Mode link |

The GSC owner report became available **after** the E4 GitHub document stated that connected analytics could not access it. Retain historical documents; use this newer dated measurement here rather than silently altering the old record. First-party owner exports and native screenshots were supplied in conversation; avoid committing raw analytics exports or personal data to a public repository without review.

## B1 completeness and unresolved scope

**Covered in this brick:**
- [x] 279 source directory and 168 historical production audit roles separated
- [x] 17-audit and seven-course-level data sources identified
- [x] 28-question architecture, 12 benchmark owner matrix identified
- [x] Google/Microsoft first-party and native test evidence catalogued with disjoint metric definitions
- [x] Automatic ledger compiler, ownership collision checks and repeatable CI evidence path authored

**B1 acceptance evidence reviewed 19 October 2026 (no production changes):**
- [x] [GitHub CI #39288448253](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39288448253) completed successfully; all artifact-generation and count-gating steps passed
- [x] Downloaded and inspected the **six actual files** in [CI artifact #12204975692](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39288448253/artifacts/12204975692); 279 distinct canonical CSV rows, 279 policy crosschecks, 28 Layer-1 problem rows, 12 priority owners, 17 audit rows
- [x] Reviewed 21 machine-directory `noindex` entries and detected **exactly two** redirect-alias metadata conflicts; canonical route source policy is **260 indexable / 19 noindex**, while generator output is **258 / 21**. No other crosscheck mismatch; Google/Bing actual index verdicts remain unknown
- [x] Inspected the two `hold-no-url` parent-problem mappings, 133 distinct owner URLs across all answer layers and zero unresolved owner paths; no additional thin articles required
- [x] Reviewed PR #758 diff: only this roadmap, a read-only Node ledger compiler and one CI workflow; **no application source, lead handling, deployment, SEO rule or crawler policy changes**
- [x] Final acceptance: [PR #758](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/758) merged with squash SHA `4e88368cb03350768026defa7ceb304aa8fa9d29` after latest-head [CI #39288874255](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39288874255) succeeded

**B1 is COMPLETE.** Source-level discrepancies are explicitly queued in B2; no SEO-content deployment or live crawler/index policy change was made by B1.

**Handoff to B2:** Individual real Google-selected canonical / Page Indexing states and Bing indexed states, crawler visits and coverage of additional routes. [Issue #747](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/747) tracks unresolved GSC outcomes. **Do not mass request indexing.**

**Status supersession (25 October 2026):** The B1 section above records its *19 October* acceptance context. Subsequently #754 and #755 were **merged and deployed** after validation; #759 and #760 also merged and released. Lead/GA4 Issue #756 and PRs #761–#764 are a **separate held workstream**. For current B2 status, use [repository remediation closeout](./B2_REPOSITORY_REMEDIATION_2026-10-25.md) and external-indexed-decision watch #747, not older in-progress statements in dated audits.

**Resume command for future sessions:** `Resume TSSA-7; open docs/seo/tssa-7/README.md and Issue #748; B1 completed as PR #758. Continue B2 from its first unverified Google/Bing indexed-view gate.`
