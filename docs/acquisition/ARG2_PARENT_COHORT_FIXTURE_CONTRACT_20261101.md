# ARG-2 — Forward-only parent–child enquiry measurement

**Owner decision:** 1 November 2026 (Asia/Kolkata) is the new reporting cutover. No July–October acquisition reconciliation or retrospective backfill is required. **Status:** offline fixture / draft only; not a live dashboard yet. Tracks #856 and PR #857.

## What counts

The primary acquisition KPI is **new parent–child enquiry opportunities**.

- Parent phone + Child A enquiring for the first time → **1 new opportunity**.
- Same parent phone + Child B enquiring for the first time → **1 additional new opportunity**.
- Same parent phone + Child A enquiring again → **repeat enquiry**, **0 additional new opportunities**.
- Parent and child already known before 1 November, then returning after cutover → **repeat**, not a new acquisition.

Count distinct normalized **parent-phone + child-name** combinations, preserving the existing operational Firebase deduplication algorithm. Distinct phone contacts and total enquiry submissions can be shown as **separate** metrics.

## Simplified forward-looking evidence rule

Start date: **2026-11-01 00:00 Asia/Kolkata** (calendar cutover, not the PR deployment date). A reliable earliest inquiry timestamp anchored on the **existing canonical parent–child lead** determines whether an opportunity is new from this date. Older canonical records are used only as a *previously known* indicator when a returning child makes another enquiry. We do **not** need to reconstruct all July–October enquiries or reconcile former monthly conversion totals.

The existing backend already uses parent phone + child identity and preserves `firstInquiryAt`, `lastInquiryAt`, `inquiryCount`, and an `inquiries` subcollection. The production reporting implementation must validate these fields in the *current* schema and choose a safe, efficient way to read new vs repeat events. A canonical lead's historic `firstInquiryAt` alone does **not** establish how many repeat enquiries occurred **after** 1 November: repeat counts require dated inquiry events or reliable post-cutover event snapshots. Do not invent repeat volume from a lifetime `inquiryCount`.

## Privacy and deployment boundary

- Current PR is a **pure offline synthetic fixture**, no Firestore read/write, migrations, backfills, test leads, Functions, rules, dashboard or deployable changes.
- Keep the existing LeadSourceAnalysis dashboard and operational lead management intact.
- For future live integration, use authorized **server-side, aggregate-only** reporting with existing admin/founder role protections. Never return parent/child names, phone numbers, normalized identity keys or unsalted hashes to public pages or GitHub artifacts.
- Keep unresolvable or conflicting phone/child identity explicitly **unresolved**, not silently counted new. Validate international phones conservatively.
- Preserve earliest attributable source for each first-observed child-specific opportunity; treat “Not sure where to start” as **undecided** in marketing analytics without changing operational routing.
- `generate_lead` means persisted lead; WhatsApp opening and pending demo requests are not received WhatsApp messages or confirmed bookings.

## Future integration gate (small, not a historical reconciliation)

1. Confirm in read-only production source/schema that canonical lead `firstInquiryAt` and retained inquiry events can identify pre-existing and first-time parent–child opportunities around the November cutover. Check the exact **IST midnight** boundary and merge/redirect behaviour.
2. Add a restricted aggregate query/report to existing Admin Analytics V3 **Acquisition** tab, displaying new parent–child opportunities **from 1 November onward**. Keep operational lead rows separate.
3. If inquiry events are available, also display dated repeat enquiry counts, otherwise mark repeat volume as unavailable rather than claiming accuracy.
4. Verify identical-parent/different-child vs same-child-repeat, archived lead, misspelled child, phone country, missing metadata and security tests.
5. Verify real post-deployment counts against live production aggregates without importing/reconciling old monthly totals.

No promise that every event on 1 November has been already measured by this draft. Existing canonical receipt timestamps should support the cutover if schema checks pass; **the live dashboard has not been wired yet**.

## Fixture acceptance

```bash
node --test scripts/test/arg2-parent-cohort-fixture.node-test.mjs
```

The offline fixture enforces the forward-only date window, counts siblings separately, counts same-child re-entries only once for acquisition, preserves international separation, undecided concerns and IST boundaries, and emits only safe aggregate output. This tests the metric contract, **not** production completeness.
