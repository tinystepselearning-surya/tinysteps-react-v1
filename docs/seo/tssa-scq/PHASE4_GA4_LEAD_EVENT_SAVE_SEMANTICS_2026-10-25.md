# TSSA-SCQ Phase 4 — Completed-form event versus saved canonical lead

**25 October 2026 | Focused analytics integrity correction | No SEO page or URL changes**

## Source-backed defect

In `PublicAssessmentForm.tsx`, `trackLeadFormSubmit()` previously fired **before** `await setDoc(leadRef, ...)` finished. The corresponding failure test expected `trackLeadFormSubmit` even on a rejected Firestore save. This is an actionable false-positive form-completion signal, not evidence that Firestore leads themselves were duplicated.

The parent-facing fallback continues to open WhatsApp and show a save-failed warning when the website cannot store the lead. **WhatsApp handoff is a contact attempt, not proof a saved website lead exists.**

## Narrow proposed correction

- Move `trackLeadFormSubmit` after successful `setDoc`, before `trackGenerateLead`.
- Preserve the rest of the WhatsApp flow, save/retry idempotency, error display, lead payload, data model and attribution enrichment.
- Regression tests require no `trackLeadFormSubmit` when save fails, no completion while save remains pending, and successful submission event ordering after the save call and before `generate_lead`.

## Event semantics — do not count all GA4 key events as leads

| Event | Meaning | Distinct qualified organic lead? |
| --- | --- | --- |
| `book_demo_click`, `book_assessment_click` | Booking intent/click | **No** |
| `whatsapp_click` | Messaging handoff/click (including fallback when storage fails) | **No** |
| `lead_form_submit`, `funnel_form_submit` | Website form saved (after this correction for primary assessment) | **No, may duplicate another event for same lead** |
| `generate_lead` | Successful client-reported lead save, optionally includes submission ID | **No, can duplicate a lifecycle record or other events** |
| `funnel_demo_booking_complete` | Public assessment request successfully saved; not a separately confirmed scheduled demo | **No** |
| Canonical Firestore lead with a qualifying lifecycle status and stored first-touch organic acquisition | Business KPI unit | **Yes, one distinct lead record** |

The single `trackLeadFormSubmit` helper itself emits both `lead_form_submit` and `funnel_form_submit`. Other submit paths also emit `generate_lead`; **do not add their counts**. A separate legacy `ProgramLeadForm.tsx` contains a non-persisting submit handler, but no live JSX use was found in the source search. Do not expand this PR to unrelated dormant code.

## Remaining GA4 provider checks

The available Windsor.ai connector currently lists **Search Console only**, not a connected GA4 data source. The GA4 event admin key-event settings and source/medium-scoped completed lead counts therefore **remain unverified**.

Collect, for the same 28-day window, the GA4 `Event name × Key event × Session source/medium × Landing page` export. Identify which of the events listed above have `Mark as key event` enabled, deduplicate by canonical stored lead ID, and reconcile against the Firestore qualified-lead lifecycle. The previously exported **156 'key events' are not established as 156 leads**.

## Deployment safety

This correction changes public lead telemetry source code, so merging into `main` can trigger a Hosting deployment. Keep the PR separate from SEO page PRs #782/#783, verify the isolated PublicAssessmentForm suite, production build, and no regression to Firestore save and WhatsApp fallback. The original user-visible form behavior should not change.
