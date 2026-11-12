# ADM-01 — Admissions funnel evidence and safe-release contract
Date: 12 November 2026 (Asia/Kolkata)  
Scope: Tiny Steps **online** parent acquisition and admission reporting.  
Status: first scoped implementation; production baseline **not yet verified**.

## Decision
Preserve current Firebase leads, canonical website parent-phone + child-name identity, inquiry history, existing demo lifecycle, permissions, and payment ledger. Extend the existing Admin Analytics V3 and Leads & Enquiries workflows only when a verified gap justifies the change. Do not build a second CRM.

**Acquisition KPI:** first-observed canonical website parent-child opportunities from 2026-11-01 00:00 IST. Same parent + second child counts separately; repeat for the same child does not count as new. The current callable's scope is **website leads**, not all phone/WhatsApp/referral enquiries. Preserve the forward-only cutover; no July–October backfill/reconciliation.

## Source-inspected facts (not a current production-runtime assertion)
- `functions/src/getProspectiveAcquisitionSummary.ts`: admin/founder-restricted, aggregate-only, bounded read, with `repeatsAvailable: false`. Recently received identity records can await canonicalization.
- `functions/src/websiteLeadDeduplication.ts`: canonical phone+child identity, inquiry history and collision safeguards. Do not replace.
- `src/components/forms/PublicAssessmentForm.tsx`: awaits Firestore save before `generate_lead`, emits `demo_request_received` for eligible 1:1 requests, and offers WhatsApp handoff. WhatsApp opening is not proof of a received message.
- `functions/src/leadDemoAutoWorkflow.ts`: creates **open** demo requests for eligible 1:1 leads; those can lack confirmed date/time and teacher assignment.
- `src/pages/admin/LeadSourceAnalysis.tsx`: its demo-stage count uses linked `demoSessionId` or lifecycle statuses including `demo_pending_schedule`. The display must never imply that all of those leads have a confirmed or attended appointment.
- `src/pages/admin/leadFunnelAnalytics.ts`: calendar activity and lead-cohort summaries differ in grain. Never use calendar completion events as if they were same-period lead-cohort conversions.
- `src/pages/admin/LeadsInquiriesWorkspaceV2.tsx`: direct WhatsApp button opens a URL; the existing `LeadAdminToolsMenu` has a separate manual communication log through `leadCommunicationsService.ts`.
- `src/lib/publicLeadForm.ts`: `Not sure where to start` currently routes operationally to Reading. Marketing intent analysis should preserve the original undecided concern.
- `src/pages/admin/ParentPaymentsV2.tsx` and ledger services have independent payment truth; `admitted_confirmed` alone is **not** payment evidence.

## Stage definitions and evidence gates

| Stage | Required authority | Must not count as |
| --- | --- | --- |
| New website enquiry | Canonical first-observed parent+child, cutover >= 2026-11-01 IST | Repeat submission, source-only GA4 event, WhatsApp click |
| Demo workflow present | Linked demo record or lead demo lifecycle status, including pending | Confirmed booking or delivered demo |
| Confirmed appointment | Linked demo with valid agreed date, time and status/ownership evidence | Auto-created open request or teacher assignment alone |
| Attended assessment | Completed and delivered demo, excluding parent/teacher no-show or reschedule | Booked, attempted or cancelled demo |
| Confirmed enrolment | Authoritative enrolled status and linked child/programme | Paid customer |
| Payment-backed enrolment | Reconciled ledger receipts/allocations for proper enrolment | Advance, fee discussion or recorded admission alone |
| Parent contacted | Explicit real communication evidence | Opening `wa.me` or a prepared message |
| Known source | Proven first-touch source with retained evidence | Landing-page URL alone or guessed AI referrer |

Unknown, unresolved, archived, synthetic, legacy and source-unattributed categories must remain visible where they can affect interpretation. Avoid changing underlying historical records just to improve a dashboard percentage.

## First PR scope
- Change the existing **Reached demo** display to **Demo workflow** / **Demo stage** without changing the underlying count.
- Explain prominently that pending/automatically created requests are not bookings or delivered assessments.
- Add a regression test covering pending, linked, admitted, and new records.
- **Do not** change public page URLs, content, redirects, robots, sitemap, schema, GA4 event definitions, forms, leads, demos, Functions, rules, or financial logic.
- A real **confirmed-demo conversion** metric is deferred until the production demo fields are reconciled read-only.

## Mandatory production read-only verification before the next package
1. Verify exact current main and Hosting/Functions deployment versions independently; a green workflow alone is not proof of live deployment.
2. Review schema prevalence and authorised aggregate counts for `leads`, dated inquiries, `demoSessions`, and communication activity. Keep raw parent/child information out of issues, PRs and reports.
3. Reconcile cutover 2026-11-01 to current IST date for new website parent-child count, unresolved identity, first-touch source and their channel coverage. Record eventual-consistency caveats.
4. Review demo attempts, links, confirmation date/time, completion and no-show handling, including reschedules and multiple attempts per child.
5. Inspect actual contact-log coverage before computing time-to-first-contact or overdue follow-up performance. Missing logs are **unknown**, not proof no contact occurred.
6. Compare distinct lead, demo attempt, demo event, and payment grain before any joins. Confirm staff and Admin/Founder permissions.
7. Validate metric cards against safe direct aggregates and run the existing CI, typecheck, build and focused regression tests.

## Next independent, gated packages
- **ADM-02:** authoritative confirmed/delivered demo metrics only after verified demo fields and cohort grain.
- **ADM-03:** contact evidence, ownership and follow-up visibility using existing communication records; no auto-send or fabricated contact.
- **ADM-04:** attribution confidence, raw undecided intent and optional dated repeat enquiry reporting.
- **ADM-05:** consistent cohort-based conversion dashboard, fail-closed on insufficient evidence.
- **ADM-06:** read-only payment-backed outcomes and channel economics after finance joins are validated.

## SEO/AEO/GEO non-regression gate
All admissions-only PRs must have **zero intentional public SEO changes**: no edits to public page content, canonicals, titles, schema, URL routing, sitemap, robots, internal links or prerender configuration. Verify PR file list, changed build outputs and existing SEO smoke checks. Public CRO or discoverability improvements belong in a separate separately approved branch/PR.

## Release sequence
1. Confirm branch diff is limited to the documented scope.
2. Run focused tests, TypeScript checks, required CI and prerender/SEO smoke on exact PR head.
3. Review security and UI regressions; **no automatic merge to main**.
4. After review and explicit approval, merge, verify Hosting deployment and Admin/Founder view; annotate true deployment time and monitor the numbers for regression.
5. If the exact-head CI or deployment status is unknown, mark work **pending verification**, never deployed.

This is a planning/semantics artifact backed by repository source inspection, not an audit of live production counts.
