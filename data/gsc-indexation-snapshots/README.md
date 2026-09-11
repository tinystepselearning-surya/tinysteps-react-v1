# Brick 7 — GSC indexation snapshots

Brick 7 measures Google indexation only from explicit Google Search Console observations. It never treats a technically healthy page as proof that Google indexed it.

## How to add a measurement

Create a dated JSON file in this directory, for example:

`2026-09-13-url-inspection.json`

Use `_template.json` as the shape. Files beginning with `_` are ignored by the tracker.

Supported `source` values:

- `gsc-url-inspection`
- `gsc-page-indexing-export`
- `manual-gsc-review`

Supported `state` values:

- `indexed`
- `crawled-not-indexed`
- `discovered-not-indexed`
- `excluded-noindex`
- `redirect`
- `not-found`
- `soft-404`
- `blocked`
- `duplicate`
- `other`
- `unknown`

A snapshot may contain any subset of the 23 Brick 6 recovery targets. Brick 7 builds a timeline per URL across all dated snapshots.

## What the tracker reports

For every recovery target it records:

- latest GSC state
- indexed/recovered/still-not-indexed/regressed movement
- most recent observation date
- indexing-request date when supplied
- evidence-led next action

The generated artifacts are:

- `artifacts/gsc-indexation-recovery-report.json`
- `artifacts/gsc-indexation-recovery-report.md`
- `artifacts/gsc-indexation-next-actions.txt`

The 7-day and 14-day checkpoints in the tracker are operational review points only. They are not promises or estimates of Google's indexing time.
