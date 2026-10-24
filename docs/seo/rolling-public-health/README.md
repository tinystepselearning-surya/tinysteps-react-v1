# Tiny Steps — Rolling Public SEO / AEO / GEO Health Tracker

**Scope:** 202 deliberately selected public URLs, from the source sitemap inventory (205 total minus the three operational-audience exclusions below). This is a **read-only production and standards-readiness audit**, not a Google/Bing index or actual AI citation report.

**Canonical master list:** [MASTER_URL_TRACKER.csv](./MASTER_URL_TRACKER.csv). **Material changes:** [CHANGES.md](./CHANGES.md). All row timestamps and findings must reflect actual observations; `NOT_CHECKED` and `UNVERIFIED` are not failures.

## Fixed baseline scope

Source order is `public/sitemap-static.xml`, `public/sitemap-blog.xml`, `public/sitemap-courses.xml`, `public/sitemap-parents.xml` from `main`. Exclude:
- `/learning-partner`: primarily team-role / staff access information
- `/parents/scheduling`: predominantly operational scheduling and attendance
- `/parents/payments`: billing, invoices and existing-member information

Do **not** exclude public `/parents/` learning guides solely because they mention parents. No private `/parent/`, `/teacher/`, `/admin/` or `/surya/` account route is included in this sitemap baseline. If main's sitemaps change, flag additions/removals in reconciliation instead of silently changing the fixed inventory.

## 24-hour audit timetable (Asia/Kolkata)

- **Slots 1–19; 00:00–18:59:** 10 URLs per hour, positions 1–190 (slot `n` audits indices `10(n-1)+1` through `10n`).
- **Slot 20; 19:00–19:59:** 12 URLs, positions 191–202.
- **Slot 21; 20:00–20:59:** reconcile counts, missing checks and before/after differences.
- **Slot 22; 21:00–21:59:** prioritize confirmed regressions and improvements; write actionable findings.
- **Slots 23–24; 22:00–23:59:** catch-up for missed/unverified checks, source changes and monitoring-job failures; do not assume completed coverage.

A delayed or skipped scheduled run must be recorded as **not checked**, not PASS. **Coverage** means URLs actually checked in that calendar day, not URLs simply assigned to a slot. Updates to this branch must never edit the website or deploy the app.

## Page check contract

For each scheduled URL:
1. Retrieve from the **production origin** with a bounded timeout and record UTC time, initial/final HTTP status and redirect target. Failed tooling/network resolution is `UNVERIFIED` unless corroborated by a second independent check.
2. Assess initial document HTML for meaningful visible/indexable text (not merely a SPA shell or page title), HTTP/meta robots and `X-Robots-Tag` directives, canonical origin/path, and a usable heading/title/description. Record material problems, not a made-up SEO score.
3. Retrieve current production `robots.txt`; interpret group precedence, user-agent matching and Allow/Disallow for **Googlebot**, **Bingbot** and **OAI-SearchBot**. Check any CDN/WAF restriction separately if observable. **GPTBot is a training-control crawler, not a prerequisite to ChatGPT Search.** `Google-Extended` is not a substitute for ordinary Googlebot access.
4. Retrieve live sitemap index/children where feasible; verify URL inclusion and whether the declared canonical matches. Missing live XML tool access is `UNVERIFIED`, not automatically a sitemap defect.
5. Parse served JSON-LD for syntactic validity and material agreement with visible claims. Presence/validity alone does not guarantee rich results. Note missing or sparse metadata as advisory `WARN` only where warranted.
6. Check redirects and user-agent differences where feasible; robots policy allowance is **not proof** that an actual Google, Bing or OpenAI crawler fetched the page.

Never submit lead forms, change production, claim a verified ranking/indexing/AI answer citation without direct first-party proof, or equate GitHub source intentions with deployed behaviour.

## Status definitions

| Status | Meaning |
| --- | --- |
| `NOT_CHECKED` | This day's assigned URL has not been inspected |
| `PASS` | All required applicable *observable* technical readiness checks passed |
| `WARN` | An observed noncritical issue requires improvement; no confirmed blanket barrier |
| `FAIL` | Reproduced high-impact technical barrier on a public URL (e.g. consistent 4xx/5xx, noindex, disallow) |
| `UNVERIFIED` | Essential checks could not be completed confidently due to access/tooling limitations |

If some checks pass but any **essential** checks cannot be verified, do not use `PASS` for the entire page. Preserve evidence links/status/observation date in the tracker. Prior results are preserved using `last_verified_*` fields and meaningful transitions in `CHANGES.md`.

## Repository and scheduling safeguards

- Hourly audit records are written **only on the dedicated `seo-url-health-tracker` branch**, not `main`. This avoids a production CI/deployment on every hourly report.
- The ChatGPT hourly task is a scheduled coordinator, **not a guaranteed execution environment** for GitHub writes or all raw HTTP checks. A completed schedule does not prove all 202 URLs were checked. Require committed row evidence and coverage reconciliation.
- On any GitHub write failure, report the blocker rather than falsely claiming the tracker was updated. Use GitHub optimistic SHA update semantics to avoid overwriting concurrent changes.
- Keep `CHANGES.md` short, dated, and focused on independently supported before/after comparisons. Do not spam repeat observations.
- Existing six-hour independent public-search visibility monitoring is a different workstream; this tracker audits technical readiness, not ranking.
- No production source, `robots.txt`, sitemap, search-console property or deployment is changed by this setup.

## Reference specifications

- Google Search technical requirements: https://developers.google.com/search/docs/essentials/technical
- Google robots guidelines: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- OpenAI bot categories and search-crawl access: https://developers.openai.com/api/docs/bots
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a

**Created:** 2026-10-25 (Asia/Kolkata). All 202 inventory rows are initially `NOT_CHECKED`; no page's live health was certified by writing this file.
