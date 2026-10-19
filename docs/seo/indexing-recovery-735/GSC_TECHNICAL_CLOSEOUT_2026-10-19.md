# GSC #735 — Technical recovery closeout and Google-outcome handoff
**Dated:** 2026-10-19 (Asia/Kolkata)  
**Status:** technical batch investigated and scoped releases merged into `main`; **Google indexing outcomes NOT universally resolved**  
**Ongoing tracking:** [#747](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/747)  
**New active search programme:** [#748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748)

## Final historical cohort accounting
The owner submitted 28 `Discovered – currently not indexed` and 30 `Crawled – currently not indexed` **historical GSC example rows**. Current source/production audit classified their 58 unique URLs as:

| Class | Count | Observed batch-audit verdict | Indexing expectation |
|---|---:|---|---|
| Intended HTML/canonical content | 39 | 39/39 HTTP 200; self-canonical, index permitted, in sitemap, >=1 inbound rendered link | Eligible candidates; **not confirmed all indexed** |
| Historical aliases | 14 | 14/14 301 to 200 self-canonical targets | Do not index old aliases independently |
| Sitemap/RSS | 5 | 5/5 HTTP 200 and XML-looking | Machine-readable discovery, not normal search result pages |
| **Total** | **58** | No sitewide HTTP/robots/sitemap/canonical failure found | Follow up Google's decisions individually |

The production check and generated HTML audit scanned 266 documents, with 39/39 regular mobile Chromium loads passing H1/canonical/JS diagnostic checks. Forced lazy-import failure coverage: 23 resource pages × 2 scenarios = 46; 13 blog articles × 2 scenarios = 26 (green at recorded CI runs). This is **ordinary browser/test evidence**, not Google URL Inspection or proof of AI-engine citations.

Primary evidence: [batch 58 technical audit](./BATCH_58_TECHNICAL_AUDIT_2026-10-19.md), [master URL ledger](./MASTER_58_URL_RECONCILIATION.md), CI run [39161945543](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/39161945543).

## Work already on main (not pending PRs)
- #736 parent-intent comparison editorial correction.
- #737 scope-specific 23-resource sitemap/HTML/indexability regression guard.
- #738 resource clean-HTML revalidation.
- #739 public resource prerendered-content recovery on recognized JS import failure; private/404 excluded.
- #740 23-resource × two-scenario failure-injection CI.
- #741 full 58-row historical GSC classification.
- #742 Phase-1 commercial/blog audit guards.
- #743 scoped blog lazy-import recovery + clean blog HTML revalidation.
- #744 full live/build/mobile/redirect audit across 58 historical URLs.
- #745 scoped cache revalidation for /courses, /free-word-building-game-for-kids, /summer-camp-for-kids-india.
- #746 contextual parent-relevant links from /courses and /grammar to two low-linked guides.

#745/#746 are merged, but their exact post-deploy live headers/links were **not independently re-probed as part of this closeout**. No site code, canonical, robots, sitemap, redirect, price or content rewrite is added by this document.

## Unresolved Google decisions — preserve, do not hide
Owner GSC evidence during Oct 18 confirmed indexed status on several previously excluded examples, including /courses, /resources/grammar, /resources/phonics/sh-digraph-phonics, /resources/vocabulary/vocabulary-for-better-writing, and selected blogs. These reports do not resolve the whole cohort.

Priority owners:
1. /blog/online-phonics-classes-vs-school: prior indexed-view **Crawled — currently not indexed**; live Google rendering intermittently failed with Soft 404 / missing JS; #743 remedies the reproduced failure class. **Reinspect actual Google indexed view after fix.**
2. /blog/grammar-assessment: prior **Crawled — currently not indexed**; live eligible and has existing inbound links. Reinspect Google decision, not just Live Test.
3. /resources/grammar/simple-past-tense-for-kids: Google live eligible and index requested, indexing not independently confirmed.
4. /resources/phonics/magic-e-phonics: earlier excluded, Google live eligible, current status unknown.
5. /best-online-phonics-classes-for-kids-in-india: investigate search exposure movement separately (query/page breakdown and canonical), not assumed indexing failure.

Google Search Console Search Analytics, site: searches, ordinary web readers and tests cannot substitute for per-URL `Google Index` state; impressions from an earlier period do not prove today's inclusion.

## Operational decision and exit gate
The **technical repair workstream is concluded**; the **Google-indexing-outcome monitoring workstream remains open** as #747, with a dated per-URL indexed verdict and query/page trend required before marking any individual page recovered. No further generic P0/P1 SEO patch is justified by the 58-URL batch audit. Reopen engineering only for a reproduced scoped defect. Allow time for normal recrawl and avoid repeated mass indexing requests. This approach protects search-performing canonicals and lets the team resume parent-focused AI Search work in #748 without falsely claiming 39/39 indexed.

**Release/rollback note:** this closeout is documentation only. It changes no deployed application behavior.