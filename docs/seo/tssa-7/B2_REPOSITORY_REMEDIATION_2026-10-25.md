# TSSA-7/B2 — Repository-owned engineering closeout

**Audit date:** 25 October 2026
**Scope:** safe, reproducible technical indexability and publication checks; independent search-engine selection is an *external evidence watch* (#747), not a pretext for speculative website changes.

## Reconciled repository and production facts

- [58-URL batch technical audit](../indexing-recovery-735/BATCH_58_TECHNICAL_AUDIT_2026-10-19.md): 39 intended HTML URLs served 200 with correct self-canonical, index-permitting metadata, sitemap membership, built inbound links and substantive rendered content; 14 retired aliases redirected 301; five sitemap/RSS resources served 200. Historical audit; **not** 39 current indexed states.
- GSC Sitemaps (first-party owner-connected, inspected 25 Oct): `sitemap.xml` 260 submitted, 0 errors/warnings, downloaded 24 Oct; blog sitemap 83 submitted, 0 errors/warnings, downloaded 24 Oct. Submitted is **not** indexed.
- Reconciled 39-page first-party Search Analytics cohort (1–22 Oct): 13/39 returned positive page rows (4,381 impressions and 37 clicks across returned pages); 26/39 no returned page rows. **Missing analytics rows are UNKNOWN Google indexed status, not exclusions.**
- A later 10-route HTTP audit observed all priority pages as HTTP 200/self-canonical/index-permitting with substantial content; the two Public Speaking AI-directory `noindex` conflicts were fixed by merged [PR #760](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/760). Not Google/Bing URL Inspection.
- Earlier flagged one-hour caching for **`/courses`**, **`/free-word-building-game-for-kids`** and **`/summer-camp-for-kids-india`** was already addressed in current `firebase.json` with an explicit clean-URL `no-cache, max-age=0, must-revalidate` regex rule (historical PR #745). This remediation adds a source regression test only, **no new Hosting header changes**.
- Underlinked articles received two targeted contextual discovery links under historical PR #746; no additional broad link injection justified from current evidence.
- [Successful Hosting release #40127438674](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/40127438674): source/build deployed to main, live integrity checks passed, production marker matches main.

## Genuine source-level audit defect repaired in this PR

In `scripts/tssa7-b2-live-indexability-pilot.mjs`, the probe previously:

1. Inspected generic robots and `googlebot` meta tags but **not `bingbot`**, despite explicitly representing B2 as a Google **and Bing** technical pilot.
2. Detected only text matching `noindex`, not the equivalent `none` indexing directive.
3. Could turn CI **green on unreadable pages**, because the GitHub workflow required only that the report CSV/JSON existed, not that ten actual HTTP 200s were observed with zero technical flags.

Repair:

- Add narrowly scoped shared exclusion parser, capture `meta[name=bingbot]`, flag Bing-only, Google-only and generic/X-Robots-Tag index exclusions conservatively. Record Bingbot values in JSON/CSV.
- Add deterministic positive/negative Node regression tests and a source-level clean-URL cache protection contract.
- Add live CI acceptance gate requiring 10/10 HTTP 200, zero flags, no missing data, and complete sitemap+directory reads. A failed network probe makes **B2 evidence inconclusive, never a diagnosed website outage**. Tests and gate are **read-only** and do not change public application HTML.
- The parser flags all X-Robots-Tag exclusions conservatively without proving which bot they address. It does **not** inspect Google/Bing index, parse robots.txt full precedence, or impersonate actual verified crawlers.

## Separation of responsibilities

**Repository-owned technical gate:** canonical owners, redirect correctness, serving HTTP 200, index-permitting page headers/meta, sitemap and machine-directory consistency, HTML cache protection, low-risk internal links, and reliable read-only CI. A successful latest-head CI result plus review/merge can close *this engineering package*.

**External owner/engine verdict watch (Issue #747):** current GSC indexed-view and Google-selected canonical, Bing URL Inspection index verdicts, recrawl time, and quality/algorithm choices. These cannot be inferred from a passing HTTP/CI check, Search Analytics impressions or Bing AI citations. Preserve them as a separately tracked evidence obligation, **not a release block for safe source-only audit repairs**.

No index requests, Firestore/function/app changes, price/assessment changes, mass blog rewrites or public `noindex`/canonical changes in this remediation. No ranking or traffic improvement is promised.

## Progression decision

Once the deterministic CI, 10-route live read-only witness and regression checks pass, **B2 engineering is ready to close**, and TSSA-7/B3 can proceed while #747 remains a platform-indexing watch. Do **not** claim B2's Google/Bing indexed-decision acceptance as achieved unless actual engine inspection evidence arrives. If the live gate fails, classify and diagnose without presenting a site outage as proven.
