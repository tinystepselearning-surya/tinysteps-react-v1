# ARG-2 — Offline parent–child enquiry cohort fixture contract

**Date:** 2026-11-01 IST. **Issue:** #856. **Status:** synthetic-only draft, no live reporting.

## Purpose and boundary

The current acquisition dashboards report lead documents, but our primary marketing metric is **first-observed parent–child enquiry opportunities**. **Owner decision (1 Nov 2026): one parent enquiring for two different children counts as two new acquisition opportunities; repeat enquiries for the same child count only once.** Production operational website deduplication already uses parent phone **plus child name** and must remain unchanged.

This PR adds an **offline JavaScript reference calculation and synthetic tests only** in `scripts/lib` and `scripts/test`. It is not imported by the React application, Firebase Functions or the admin dashboard. There are **no Firestore reads, writes, migrations, phone exports, deployments or live URL changes** in this work.

The reference accepts complete authorized historical records supplied *only by its caller* and reduces them to **aggregate counters**. In its current form it is **not** an authorized live reporting engine and always returns `historyIsComplete: false` plus a not-live-approved status.

## Input assumptions requiring production verification

- One `id` per recoverable historical lead row, with child name in `childName` and phone candidate values in `phoneNormalized`, `primaryPhone`, `whatsappNumber`.
- A valid `firstInquiryAt` timestamp takes precedence over `receivedAtOriginal`, `receivedAt`, `requestedAt`, `createdAt`. This precedence is provisional until checked against actual merge and receipt timeline.
- Indian 10-digit mobile numbers starting 6–9, +91, 91 and 0091 variants normalize together. An explicit international `+` or `00` form is preserved without India-only suffix stripping. This is **not full international phone validation**; suspicious or conflicting formats must stay unresolved and need phone validity work under ARG-3.
- The business identity for the primary KPI is **normalized parent phone + normalized child name**. Two siblings on the same phone are separate opportunities; re-enquiries about the same child are repeats. Child-name matching normalizes case, diacritics and punctuation, but cannot safely resolve nicknames, misspellings, child-name changes, shared phone numbers or unresolved numbers without further evidence.
- All recoverable historical leads, including archived rows, must be available before filtering selected dates; otherwise an October returner for the **same child** can be incorrectly counted as a new acquisition. Preserve original concern and channel per **child**; a new sibling can have a different first-touch source. Canonical merge/inquiry history and deleted-record coverage still require inspection.
- Only allowlisted channel and selected concern category values are aggregated. `Not sure where to start` is an explicit undecided category, **without changing** the existing operational Reading routing.
- Neither client-side identity processing nor Firebase access is implemented or authorized by this test utility. In future, aggregate **parent–child identities** only on a restricted, read-only, server-side path reviewed against existing permissions.

## What the fixture proves

It covers chronological first observation **per parent–child pair**, distinct siblings, repeated same-child enquiries, phone variants, international separation, unresolved phone/child identities, unverified source preservation, undecided parent intent, IST midnight, archive history, duplicates and no PII in returned aggregate objects.

It does **not** prove real production parent–child cohort counts, completeness of deleted/historical inquiries, number of distinct children or parents in reality, actual campaign attribution or measured conversions. The previously reported **507 distinct parent phone proxies is a separate secondary metric**, not the primary new-enquiry KPI.

## Next, before connecting a live dashboard

1. Read-only production aggregate review: exact `childName` and phone field prevalence, earliest historical timestamp per **parent–child pair**, sibling and same-child repeat shapes, archived/merged/deleted history, child-name alias risk and country/phone validity. Reconcile Codex ARG-1 reported 520 canonical website leads / 507 normalized phone proxies / 600 inquiries / 80 redirects, without exporting PII. Do not infer that the 520 minus 507 difference proves exactly 13 additional sibling opportunities.
2. Review current Admin Analytics V3 access restrictions and Firestore authorization for any server-side read-only cohort aggregation. No public caller or raw identity return.
3. Fix and approve any discrepancies found in the synthetic reference. Execute authenticated emulator/API tests for role enforcement and zero customer-detail responses.
4. Add the aggregate-only result to existing Acquisition tab, label **new parent–child enquiry opportunities (first observed in available history)**. Keep distinct parent phones as a **secondary** metric if useful; keep operational lead rows, total inquiries and demo progression separate, and release with historical coverage caveat.
5. Do not compare site sessions, GSC impressions, GA4 events or staff-maintained admission statuses to this metric without independently verifying compatible definitions.

## Test

```bash
node --test scripts/test/arg2-parent-cohort-fixture.node-test.mjs
```

The workflow `ARG-2 Offline Parent Cohort Fixture Gate` runs these tests on the PR.

**No production roll-out is authorized by this draft.**
