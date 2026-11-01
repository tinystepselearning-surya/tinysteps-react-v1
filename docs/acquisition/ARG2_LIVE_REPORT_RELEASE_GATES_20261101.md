# ARG-2 release verification — forward-only parent–child acquisition

**Date:** 1 November 2026 IST. **Scope:** new website enquiries first observed from 2026-11-01 00:00 Asia/Kolkata. Related: #856, merged fixture contract #857, implementation PR #858.

## Counting contract

- Each canonical website **parent phone + child name** identity first recorded on or after the reporting start counts once.
- Siblings on the same phone are separate opportunities. Returning parent–child identities remain repeats, not new, even if their subsequent submissions occur after cutover.
- Existing Acquisition cards remain operational lead-document counts, not the new parent–child metric.
- No historical July–October cohort reconciliation, migration, synthetic production writes or backfill.
- **Not supported in this release:** period-based repeat-submission counts or WhatsApp messages that never became saved website leads. Lifetime `inquiryCount` is not a substitute for dated repeat events.

## Implementation boundaries

- `getProspectiveAcquisitionSummary` is a read-only, second-generation callable in `asia-south1`, limited to active canonical Admin/Founder principals.
- Four indexed timestamp slices (`firstInquiryAt`, `receivedAt`, `requestedAt`, `createdAt`); maximum 93-day ranges; per-field scan hard limit; overlap deduplication by document ID.
- Report includes aggregate counts, allowlisted acquisition channels and unresolved candidate count only. Parent/child identity data and document identifiers never leave the callable.
- Newly submitted leads can temporarily be unresolved while asynchronous canonicalization completes; permanent identity conflicts are also unresolved and must not be described merely as awaiting verification.
- Reporting source is canonical Firestore website leads. A normalized phone and child-name hash is an operational identity proxy, not proof of unique real-world people; spelling differences can form separate identities by design.

## Independent security, read-only production and regression verification

The 1 November 2026 independent security review covered implementation SHA `5aaea69c21004f54cbbc9365392164e966511a36` against `efc5927ed5ffdd39d747d66deb4a057d408c1199` and reported **GO, no reportable security/correctness findings**. The review used read-only production queries and isolated emulators; no production writes or deployment.

- [x] Production website lead schema checked read-only: 520 canonical records; 520 with `firstInquiryAt`, `dedupeIdentityKey`, `dedupeCanonicalLeadId`, `receivedAt`, `createdAt`; 518 with `requestedAt`. No duplicate hashes, dangling IDs or canonical-ID mismatches.
- [x] Four exact timestamp queries successfully executed against live indexed fields, returning the same four post-cutover canonical records and no index exceptions.
- [x] Isolated authorization checks: active Admin/Founder allowed; anonymous, Teacher, Parent, suspended Admin, archived Founder and missing canonical principal denied.
- [x] Aggregate response inspected for PII, lead/document IDs and hashes; none returned; unexpected source channels converted to `unknown`.
- [x] Business tests cover siblings, repeats, pre-cutover identities, IST date boundaries, non-website leads, canonicalization and deduplication.
- [x] All six original head CI workflows passed, including Functions TypeScript, root typecheck and production/prerender build.
- [x] Callable-specific mock Firestore authorization/privacy and query-boundary regressions checked into PR #858, and CI now runs them automatically.
- [ ] Confirm all **updated PR head** checks green following the test, label and release-note commits.
- [ ] Merge only the reviewed #858 head once its updated checks are green and GitHub reports it mergeable.
- [ ] Verify main-branch Firebase deployment completed for both Hosting UI and the new `getProspectiveAcquisitionSummary` function.
- [ ] Perform an authenticated production Admin/Founder smoke test of the Acquisition card against the 1 November-forward cohort. Verify expected counts or an explicit unavailable state, as applicable; confirm no PII and unchanged legacy cards.
- [ ] Close #856 only after deployment and live runtime verification; do not infer deployment from a green PR check.

## Post-release guidance

Refresh after asynchronous lead canonicalization. If a requested range exceeds its bounded scan, the callable returns an error rather than inaccurate partial totals. Keep repeat enquiries unavailable until dated event history is validated in a separate scoped change. Historic parent-phone monthly figures are not comparable with prospective parent–child counts.
