# ARG-2 — Offline new-parent cohort fixture contract

**Date:** 2026-11-01 IST. **Issue:** #856. **Status:** synthetic-only draft, no live reporting.

## Purpose and boundary

The current acquisition dashboards report lead documents, not first-observed parent identities. Production operational website deduplication intentionally uses parent phone **plus child name** and must remain unchanged.

This PR adds an **offline JavaScript reference calculation and synthetic tests only** in `scripts/lib` and `scripts/test`. It is not imported by the React application, Firebase Functions or the admin dashboard. There are **no Firestore reads, writes, migrations, phone exports, deployments or live URL changes** in this work.

The reference accepts complete authorized historical records supplied *only by its caller* and reduces them to **aggregate counters**. In its current form it is **not** an authorized live reporting engine and always returns `historyIsComplete: false` plus a not-live-approved status.

## Input assumptions requiring production verification

- One `id` per recoverable historical lead row, with phone candidate values in `phoneNormalized`, `primaryPhone`, `whatsappNumber`.
- A valid `firstInquiryAt` timestamp takes precedence over `receivedAtOriginal`, `receivedAt`, `requestedAt`, `createdAt`. This precedence is provisional until checked against actual merge and receipt timeline.
- Indian 10-digit mobile numbers starting 6–9, +91, 91 and 0091 variants normalize together. An explicit international `+` or `00` form is preserved without India-only suffix stripping. This is **not full international phone validation**; suspicious or conflicting formats must stay unresolved and need phone validity work under ARG-3.
- Same normalized phone represents a **parent-phone identity proxy**, not proof of a uniquely identifiable human. Shared numbers and missing identifiers are limitations.
- All recoverable historical leads, including archived rows, must be available before filtering selected dates; otherwise an October returner can be incorrectly counted as a new October parent. Canonical merge/inquiry history and deleted-record coverage still require inspection.
- Only allowlisted channel and selected concern category values are aggregated. `Not sure where to start` is an explicit undecided category, **without changing** the existing operational Reading routing.
- Neither client-side identity processing nor Firebase access is implemented or authorized by this test utility. In future, aggregate parent identities only on a restricted, read-only, server-side path reviewed against existing permissions.

## What the fixture proves

It covers chronological first observation, multi-child families, phone variants, international separation, unresolved identity bucket, unverified source preservation, undecided parent intent, IST midnight, archive history, duplicates and no PII in returned aggregate objects.

It does **not** prove real production cohort counts, completeness of deleted/historical inquiries, number of unique people, actual campaign attribution or measured conversions.

## Next, before connecting a live dashboard

1. Read-only production aggregate review: exact field prevalence, earliest historical timestamp, sibling and repeat shapes, archived/merged/deleted history, country/phone validity. Reconcile Codex ARG-1 reported 520 canonical website leads / 507 normalized phone proxies / 600 inquiries / 80 redirects, without exporting PII.
2. Review current Admin Analytics V3 access restrictions and Firestore authorization for any server-side read-only cohort aggregation. No public caller or raw identity return.
3. Fix and approve any discrepancies found in the synthetic reference. Execute authenticated emulator/API tests for role enforcement and zero customer-detail responses.
4. Add the aggregate-only result to existing Acquisition tab, label **first observed in available history**, keep operational leads and demo progression separate, and release with historical coverage caveat.
5. Do not compare site sessions, GSC impressions, GA4 events or staff-maintained admission statuses to this metric without independently verifying compatible definitions.

## Test

```bash
node --test scripts/test/arg2-parent-cohort-fixture.node-test.mjs
```

The workflow `ARG-2 Offline Parent Cohort Fixture Gate` runs these tests on the PR.

**No production roll-out is authorized by this draft.**
