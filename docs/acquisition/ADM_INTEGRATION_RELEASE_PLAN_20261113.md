# Admissions forward-only integration — release plan

Date: 13 November 2026 IST. **Review only. Not merged, deployed or activated.**

## Source and reconciliation
This integration PR combines the current source trees of:
- #888 — differentiate demo workflow from confirmed or delivered demos in existing source analysis.
- #889 — deliberately logged outbound/inbound/internal communication; unknown legacy direction remains unknown; quick log is not WhatsApp delivery evidence.
- #890 — highlight only Admin Review follow-ups due by today IST **within the selected, already-loaded enquiry range**.
- #891 — isolated, disabled-by-default future website parent-child demo milestones.

**Do not merge the four original PRs and this integration PR independently.** Use this PR as the single integration candidate; retain the originals as reference and close their branches/PRs only after approved merge and verification.

The one overlapping source file, `src/pages/admin/LeadsInquiriesWorkspaceV2.tsx`, was reconciled to preserve PR #889's WhatsApp + logging controls and PR #890's due-follow-up filter. No lead identity, workflow transition, demo claiming, financial ledger or message send logic is changed.

## Owner policy: measure the future, do not modify the past
1. Never backfill, migrate, reclassify, "repair", deduplicate afresh, or change historical leads, demos, communications or payments as part of this release.
2. The established prospective acquisition metric starting **2026-11-01 IST** is unchanged.
3. New **operational** demo milestones have their own **actual effective release cutover**; do not estimate or manufacture that timestamp.
4. Older records may still be displayed in existing operational workflows, but must not enter the newly introduced forward-only milestone projection.
5. The new projection stays **inactive** until `VITE_ADMISSIONS_FUTURE_DEMO_CUTOVER_IST` is explicitly configured to a verified actual deployment/activation time. The required `+05:30` offset is intentional. No default or build-time guessed timestamp.
6. Teacher-entered scheduled slots are not parent-confirmed bookings. An enrolment declaration is not a ledger payment. Manual contact entries are staff-reported, not proof of WhatsApp delivery.
7. Keep all historic and current Firebase schemas and permissions intact; no extra database-wide readers, writes, automation or exports.

## Regression and privacy gates
- Run **all four** focused admissions test suites and the existing workspace/lead/daily-enrolment regressions at the **integration head**, not merely on the original PR branches.
- TypeScript, homepage desktop/mobile tests, production prerender build, public SEO contract tests, and page-scope/theme checks must pass.
- CI must reject any source diff outside the known Admin, test, documentation and admissions workflow allowlist.
- No public URLs, canonicals, titles, JSON-LD, sitemap, robots, blogs, programme pages, performance-critical homepage assets, GA4 event definitions or marketing attribution are intentionally changed.
- Review role access: the new aggregate panel is only mounted inside pre-existing Admin Analytics access, and does not expose lead-level details to public clients.
- Verify no new `firebase/firestore` writes or automated WhatsApp send calls in the new analytics projection or due-date helper.
- The pre-existing `DemoSessionsManagement` container still uses its current Admin Analytics subscriptions. This integration introduces **no additional** Firestore listeners or broader queries.

## Approval and deployment order
1. Complete all CI, inspect exact integration diff, and manually review the combined Admin UI.
2. Retain as draft until explicitly approved. Do **not** merge or deploy as part of integration preparation.
3. When approved, merge **only the integration PR** to `main`. Verify merge SHA, Firebase Hosting deploy SHA, and Admin/Founder portal functionality.
4. Confirm both the exact production release time and environment configuration. Activate future metrics only with a separate verified live timestamp; Vite requires build-time env injection and a release whose effective activation time is recorded.
5. Smoke test a **newly created** safe lead and subsequent valid events; confirm no pre-activation leads are included. Do not alter any historical Firestore documents.
6. If evidence or UI is wrong, disable the future metric or revert the UI deployment; no data remediation is permitted.

## Known scope limits
- Parent-agreed booking confirmation is **not** yet evidenced by the current `teacherConfirmedDate` / `teacherConfirmedTime` fields.
- Paid conversion, response-time SLAs and source ROI are **not** claimed from the new dashboard.
- The existing full-range historical operational reports remain available unchanged; the separate future metric is a different definition.
