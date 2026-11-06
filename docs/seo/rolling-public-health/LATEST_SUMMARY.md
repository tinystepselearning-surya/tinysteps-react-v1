# Tiny Steps rolling public SEO/AEO/GEO audit — latest summary

Updated: 2026-11-06T13:41:04Z UTC (6 November 2026 IST)

- Selected URLs: **202 unique**, 22 CSV columns; slots 1–19 contain 10 URLs each, slot 20 contains 12. Tracker validated before this batch.
- Today (2026-11-06 IST) distinct URLs with recorded observations/attempts: **202/202 (100%)**. This is attempted/partial-evidence coverage, **not verified production health**.
- Fully origin-verified today: **0/202**. All origin readiness statuses remain **UNVERIFIED** because direct HTTPS checks failed before HTTP in this audit environment.
- Latest batch: **slot 20, rows 191–202** (three course pages, nine parent-facing pages). Exact-URL public web retrieval returned page-specific extracted text and H1 headings for **12/12** URLs (web refs turn549803view0–turn549803view11; provider labelled crawled today, precise crawl times unknown). Provider-extracted text does not independently verify raw origin HTML.
- Twelve direct HTTPS curl GETs began **2026-11-06T13:40:44.869511160Z through 2026-11-06T13:41:00.058873529Z**. Six failed with curl exit 6 (DNS host resolution failure), six with exit 28 (DNS resolution timeout); all returned HTTP_CODE 000, which is not an HTTP response. Exact per-URL request start timestamps and evidence are in the tracker.
- Production HTTP status, final redirect, canonical, robots/noindex, bot access, initial HTML and JSON-LD **UNVERIFIED**. These audit-environment DNS failures are not evidence of production downtime. No verified production regression or improvement; CHANGES.md unchanged.
- GitHub Actions API reported **zero in-progress repository runs** at inspection. Workflow administrative disablement not independently confirmed; user confirmed disabled 2026-10-25. No GitHub audit workflow started.
- Next scheduled slots 21–22: reconciliation/recovery; slots 23–24: catch-up. Revisit incomplete origin verification only when a functioning network permits real checks; do not relabel partial checks as PASS.

Evidence: [tracker](MASTER_URL_TRACKER.csv); [change log](CHANGES.md).
