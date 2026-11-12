# ADM-02: Future-only website demo evidence

Date: 12 November 2026 (IST). Status: **draft PR, not deployed or activated**.

## Forward-only contract

This package does not migrate, repair, rescore, backfill, delete, or edit historical leads, demo sessions, payments, or communications. It adds a read-only presentation projection using the leads and demos **already loaded** in existing Admin Analytics. The older legacy funnel cards remain unchanged; this projection has a separate label and activation boundary.

**Activation requires a deployment-specific cutover**: `VITE_ADMISSIONS_FUTURE_DEMO_CUTOVER_IST`, formatted `YYYY-MM-DDTHH:mm:ss+05:30`, must be explicitly set to the **actual verified live release time in IST**. Leave it unset until review, approval and release. The report fails closed with no metrics when absent, invalid, before 13 November 2026 IST, or in the future. Never set an earlier time or use the PR date as a substitute for the actual deployment time. Since Vite env variables are injected at build time, build/release configuration must be checked and annotated in the deployment record.

After activation, eligible parent–child enquiries must satisfy all of:
- Website-sourced canonical lead: `source: website`, `dedupeCanonicalLeadId === lead.id`, a valid 64-character hashed `dedupeIdentityKey`.
- Earliest known enquiry receipt from existing `firstInquiryAt`, `receivedAtOriginal`, `receivedAt`, `requestedAt`, or `createdAt` is **at or after the configured release cutover**.
- The same parent–child identity is counted once. Distinct children are counted separately. Conflicted and unresolved records are excluded and reported separately.
- Linked demo records require an explicit `leadId` or non-conflicting `demoSessionId` relation and `demo.createdAt` at or after the same cutover. No name/phone approximation is used.

The following milestones are independently evidenced at the lead level (one count per child):
1. **New website enquiries**: eligible canonical new lead; not GA4 form attempts.
2. **Demo requests linked**: linked demo record created after release, including open/unassigned auto-created requests. Not a confirmed booking.
3. **Teacher-scheduled slots**: assigned teacher, teacher-entered date and time, `assignedAt` after cutover, and a demo currently in assigned/completed status. This does **not** establish that a parent confirmed the slot.
4. **Delivered assessments**: completed demo with explicit post-cutover `completedAt`, excluding `parent_no_show`, `teacher_no_show` and `reschedule_requested`. Do not use `lastUpdatedAt` as completion evidence.
5. **Recorded enrolments**: delivered demo with `conversionStatus: enrolled` and explicit `enrolledAt` after cutover. **Not a payment-backed customer**; that requires separate ledger verification.

Some stages are not strictly sequential or exhaustive because the required event evidence can be absent. Do not present ratios as official conversion rates until event completeness, canonicalization and confirmed parent agreement are proven. The current schema does not contain authoritative evidence of parent-agreed booking: teacher-confirmed schedule fields cannot be relabelled as parent-confirmed appointments.

## Security and performance

- No new Firebase queries, subscribers, Cloud Functions, database writes, Firestore rules, public routes, metadata/schema, indexing or GA4 events.
- No person-level information leaves Admin Analytics; the UI displays aggregate counts only.
- This projection uses current Admin Analytics live subscriptions; **it is not a new database-wide job**. If source reads fail or have not completed, the panel remains unavailable rather than displaying misleading zero totals.
- All changes must remain confined to internal Admin Analytics, tests, this document, and validation workflows.
- Preserve the 1 November 2026 ARG-2 first-observed acquisition metric independently; ADM-02 must not change its cutover, definition, data or authorization.

## Tests and deployment requirements

1. Confirm tests for duplicate demo attempts, different children, canonicalized identities, conflicts, missing evidence, open requests, assigned without date/time, no-shows/reschedules, old enquiries and old attempts.
2. Run exact PR-head focused Vitest, TypeScript, full SEO/prerender build, homepage browser gate, and inspect the changed-file list.
3. Obtain human review and approval before any merge. No deployment or release cutover configuration is performed by this PR.
4. After an approved Hosting release, verify the live build version and Admin/Founder-only access; configure the **exact** release cutover and redeploy as necessary for Vite injection. This may require recording the second deployment as the actual effective activation time.
5. Validate newly created safe test enquiries and demo events only, with zero backfill. Confirm that no older lead appears in the new panel. If verification fails, unset activation configuration/revert the dashboard change without editing Firestore history.

## Deliberately deferred

Parent-confirmed booking rate requires explicit verifiable parent-agreement evidence, separate from teacher slot assignment; do not invent it. Paid enrolment requires read-only authorised accounting joins and cannot be inferred from `enrolled`. No historic conversion remediation is in scope.
