# ARG-2 live reporting candidate — forward-only website parent–child enquiries

**Date:** 1 November 2026 IST. **Status:** DRAFT — no merge or deployment approved. Related: #856, already merged test contract #857.

## Counting contract

- Reporting begins **2026-11-01 00:00 Asia/Kolkata**.
- Primary new-acquisition metric: each canonical **parent-phone + child-name** website lead first received on or after the selected date.
- One parent with two different children = **2** new opportunities. Returning enquiry for the same child = **0** additional new opportunities.
- A parent–child combination whose canonical `firstInquiryAt` is before cutover remains an existing opportunity even if they submit again now.
- Continue treating the existing LeadSourceAnalysis lead-document totals as **operational**, not this new acquisition metric.
- **Not in this release:** repeat submission volume or full WhatsApp delivery counts, because lifetime `inquiryCount` is not dated by selected reporting period.

## Implementation

- Read-only second-generation callable `getProspectiveAcquisitionSummary`, authorized by the existing canonical `authAccessReadModels/{uid}` principal. Only active `admin` or `founder` global roles pass. No fallback to legacy users or claims.
- No broad history scan, backfill, migration, staff data, Firestore rules, indexes, or lead/deduplication writes.
- Four bounded indexed timestamp queries (`firstInquiryAt`, `receivedAt`, `requestedAt`, `createdAt`) over the requested interval, max 93 days. Results are deduped by document ID. Any scan hitting the safety cap fails rather than returning a partial total.
- Only canonical website leads with existing `dedupeIdentityKey` / matching `dedupeCanonicalLeadId` are counted. Recently submitted, unresolved or mid-canonicalization records are distinguished as pending. Server sees source documents but returns **aggregate numbers and allowlisted channel keys only**; never phone/child/parent names, documents or identity hashes.
- Existing Acquisition tab receives a small separately labeled card, with 1 November cutover and refresh handling. It does not affect the current operational lead and Admissions totals.

## Review gates — DO NOT MERGE UNTIL SATISFIED

- [ ] Focused Functions aggregator tests, Functions TypeScript build, frontend TypeScript check, full SEO/prerender build.
- [ ] Verify canonical `firstInquiryAt`, `dedupeCanonicalLeadId`, `dedupeIdentityKey` on *current live* website records with authorized read-only access; verify that new records enter the query only once after canonicalization.
- [ ] Verify the existing principal guard is appropriate for the admin/founder audience, reject anonymous, parent, teacher, suspended or archived access in emulator/auth tests.
- [ ] Verify only aggregates leave the callable; no PII in responses or error logs.
- [ ] Confirm default Firestore single-field indexes for queried timestamp fields in the target project, and bounded query performance.
- [ ] Reconcile **only the new forward 1-Nov-onward** aggregate against safe production counters; **do not reconcile July–October historical cohorts**.
- [ ] Revisit the 1-Nov cutover if the deployment happens later and source event history proves earlier records were missed; never silently claim complete coverage.
- [ ] Check the source/attribution classification is accurate and does not count an older parent–child as new due to a misspelt name or conflicting identity.
- [ ] Keep all changes in draft until reviewed; if a security, schema or index gate fails, do not deploy.

## Limitations

A normalized phone and child name are operational identity proxies, not a definitive real-world learner identity. Phone validation and missing attribution quality remain separate ARG-1/ARG-3 work. The report is eventually consistent because the canonicalization trigger executes asynchronously. The new report currently measures **website** leads, not a parent WhatsApp message that was never submitted/saved to Firestore. For no-result or error states, the UI must not substitute zero.

## Tests

```bash
cd functions && npx vitest run --config vitest.config.ts functions/test/prospectiveAcquisitionMetrics.spec.ts && npm run build
cd .. && npm run typecheck && npm run build
```

No tests against production Firestore, synthetic parent submissions or deployment should be performed for this draft.
