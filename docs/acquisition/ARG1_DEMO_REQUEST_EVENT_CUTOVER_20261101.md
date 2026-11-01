# ARG-1 — Demo request vs confirmed booking event cutover

**Date:** 2026-11-01 IST. **Issue:** [ARG-1 #854](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/854). **Status:** draft PR awaiting CI, review and deployment.

## Confirmed defect and evidence

An independent Codex verification of source `bcbb763` found that `PublicAssessmentForm.tsx` emitted `funnel_demo_booking_complete` after the parent enquiry was successfully written. The backend only creates an **open**, pending-schedule demo request at that stage, so the event falsely communicates a confirmed booking. This is a measurement defect, **not a confirmed lead-loss defect**.

The main parent submission path correctly awaits Firestore `setDoc` before `generate_lead`, handles failure without claiming success, and preserves asynchronous attribution enrichment and the WhatsApp handoff. Preserve all of it.

## Precise scope

- On a persisted one-to-one public assessment request, emit **`demo_request_received`** through `trackDemoRequestReceived`, with `request_type='whatsapp_assessment_request'`, random Firestore `submission_id`, existing programme/source and attribution context.
- Continue to emit the existing **`generate_lead`** event only after Firestore save. Do **not** change `lead_form_submit` (attempt event), failure event, lead form, demo lifecycle, group/unsure flow, anonymous Firestore schema, backend, security rules or WhatsApp navigation.
- Keep `trackDemoBookingComplete` as a separate existing helper **for future calls from an authoritative confirmed scheduling transition only**. The public form no longer invokes it. Do not claim that this PR newly instruments confirmed bookings; it doesn't.
- Change C5 source audit and form regressions to enforce the new semantics, ensuring failed saves and small-group enquiries do not emit request/booking confirmations.

## Measurement migration and comparability

Previously, `funnel_demo_booking_complete` was a *received request*, not a completed booking. Historical GA4 values for that event **must not** be presented as confirmed appointments, and must not be added to post-cutover `demo_request_received` without documenting the definition change. Add an analytics release annotation using the **actual verified production deployment time** after merge, not this draft date.

Proposed reporting after cutover:
- `lead_form_submit`: attempt to submit
- `generate_lead`: successful saved public enquiry (the stable conversion signal)
- `demo_request_received`: successfully received 1:1 assessment request
- Confirmed demo bookings: obtain from authoritative `demoSessions` assigned schedule/status, not client confirmation events (not implemented here)
- `whatsapp_click`: handoff opened, not evidence of message received

No user names, phone numbers, child names, or other direct PII are added to analytics.

## Release gates

- [ ] `PublicAssessmentForm.spec.tsx` passes (saved, failed, group, retry and WhatsApp)
- [ ] C5 commercial conversion source contract passes
- [ ] TypeScript check and full SEO/prerender build pass
- [ ] Diff remains limited to event semantics, associated tests/CI and documentation
- [ ] Confirm analytics consumer usage and release annotation before merging
- [ ] Independently check deployment success and actual GA4 event firing without submitting a synthetic production lead

## Out of scope

Do not change phone validation, international phone normalization, Firestore rules, parent+child operational dedupe, first-observed parent cohort report, session/local storage attribution scope, or detached enrichment retry architecture in this PR. Their independent review tasks remain in #854.
