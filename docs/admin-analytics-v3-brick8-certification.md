# Admin Analytics V3 — Brick 8 Final Certification

Brick 8 is the final hardening layer for the Growth, Acquisition, Blog Attribution, external traffic/search and Content & SEO analytics programme. It does not introduce a new business ledger and it does not silently repair operational records.

## Purpose

Brick 8 answers four final management questions:

1. Do Growth and Acquisition still tell the same lead-cohort story?
2. Are demo links, retries/reschedules and stale live records understandable enough to trust the funnel?
3. Is first-touch attribution coverage healthy enough to interpret source performance?
4. Did the certification layer preserve the read/performance contract established by the earlier bricks?

## Runtime placement

The certification panel is rendered only in the full Growth & Admissions analytics view. It receives the exact lead and demo snapshots already loaded by `DemoSessionsManagement` and therefore adds **zero Firestore reads**.

The Overview summary remains unchanged and does not render the Brick 8 panel.

## Reconciliation contract

Brick 8 compares two intentionally different projections for the same selected lead cohort:

- **Canonical Growth projection** — derived from linked `demoSessions` records through `buildLeadFunnelAnalytics`.
- **Lead-side Acquisition projection** — derived from lead lifecycle evidence through the shared measurement contract.

The panel compares:

- Leads Received;
- Demo Created;
- Demo Completed;
- Enrolled.

A mismatch is marked **Review**, not silently reconciled. This is important because lifecycle status fallbacks can legitimately lag or outlive the canonical demo-record evidence. Brick 8 does not choose whichever number looks better.

The canonical funnel must always satisfy:

`Leads Received >= Demo Created >= Demo Completed >= Enrolled`

A violation is a certification failure.

## Demo linkage and retry diagnostics

Brick 8 reports:

- selected-cohort `demoSessionId` values that do not resolve to a loaded demo record;
- demo records with neither `leadId` nor an explicit lead-side reference;
- demo records whose `leadId` is absent from the loaded lead snapshot;
- leads with multiple demo records;
- how many multi-demo leads have explicit reschedule linkage;
- unexplained multi-demo leads without reschedule linkage;
- leads with more than one simultaneously open/assigned demo record.

Multiple demo records are not automatically duplicates. Reschedules, retries and replacement demos are legitimate operational history. Brick 8 surfaces them for interpretation instead of deleting or collapsing them.

## Stale workload diagnostics

The existing live demo-record aging contract remains authoritative. Brick 8 certifies and surfaces:

- awaiting-assignment records older than seven days;
- assigned records older than seven days;
- completed records awaiting an admission decision for more than seven days;
- awaiting-assignment records older than 30 days;
- live records that cannot be aged because their required timestamp is missing.

Age is an investigation signal. Brick 8 does not automatically archive, cancel or delete a demo because it is old.

## Attribution health

For the selected lead cohort Brick 8 reports:

- leads with first-touch attribution evidence;
- attribution coverage percentage;
- legacy/unattributed leads;
- leads with an unknown intake source.

The current management target is **90% attribution coverage**. Falling below that target marks the analytics interpretation as provisional; it does not rewrite legacy lead history.

## Certification states

- **Certified** — all checks pass.
- **Provisional** — no hard invariant failed, but one or more investigation checks need review.
- **Needs attention** — a hard integrity check failed, such as a broken explicit demo link or impossible funnel ordering.

## Read and performance contract

Brick 8 adds no Firestore collections, listeners, queries or callable reads. It is a pure in-memory diagnostic over the Growth snapshots that are already present.

Regression tests enforce that `AnalyticsV3CertificationSection` and `analyticsV3Certification` do not import Firestore or create a query path.

## Operational drill-down

The panel includes a direct link to `/surya?tab=leads`, preserving the Admin Analytics principle that diagnosis belongs in Analytics while record correction remains in **Leads & Enquiries**.

## Deliberate exclusions

Brick 8 does **not**:

- automatically clean up stale, legacy, retry or orphan candidates;
- manufacture a first-response-time KPI without a trustworthy canonical first-contact timestamp;
- convert GA4 Sessions or GSC Clicks into lead-conversion rates;
- merge GA4, GSC and Firestore into one event identity;
- replace provider health/coverage checks already owned by Bricks 6 and 7;
- change the lead/demo/enrollment business definitions established by Bricks 1–7.

These exclusions are part of the certification contract, not unfinished UI work.
