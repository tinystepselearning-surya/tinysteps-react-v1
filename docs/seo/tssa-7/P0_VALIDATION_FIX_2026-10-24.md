# TSSA-7 / P0 — Public Assessment validation remediation
**24 October 2026 · Scoped implementation PR · Not deployed**

## Verified source defect
The shared `PublicAssessmentForm` previously accepted any nonempty parent name and WhatsApp number, but the existing anonymous Firestore `/leads` create policy enforces parent name length 2–80, WhatsApp and normalized-phone length 8–24, child name 1–80, permitted child ages 3–12, and allowlisted support concerns. A parent entering an invalid nonblank number could reach the Firebase write, experience a rejection, and land in the existing WhatsApp fallback rather than seeing an actionable correction before submitting.

## Change
- Added a pure, reusable `validatePublicAssessmentForm()` in `src/lib/publicLeadForm.ts`, called from the shared `PublicAssessmentForm` before any Firestore write or WhatsApp popup.
- Validates name lengths, child age, support concern and international phone formatting (optional leading `+`, digits and common presentation separators). Accepted phones contain **8–15 digits**; raw length **up to 24 characters**, within the existing Firestore limits. This is a pragmatic cross-country format check, **not proof that a phone number is assigned or reachable**.
- UI input `maxLength` now mirrors name/phone raw limits and restored WhatsApp prefills permit the full 24-character range.
- Preserves existing raw `whatsappNumber`/`primaryPhone` and derived `phoneNormalized` values for valid entries, source attribution, submission-ID retry behavior, WhatsApp handoff after save, and failure fallback. **Does not edit `firestore.rules` or change GA4 event ordering.**
- Added unit tests for international/local formats and invalid values, component tests that invalid fields block all outbound calls (no popup, Firestore write, or success analytics), and emulator tests verifying accepted formatted phones and rejecting constrained values.

## Release gates
1. GitHub CI success: React component + pure-helper tests + attribution tests, TypeScript check, Firestore anonymous-create emulator suite. Re-run after any code adjustments.
2. Review PR diff for only scoped files and CI; no lead lifecycle/Cloud Function/Firestore rules/SEO changes.
3. Do not deploy until normal branch merge/release review. **No live form submissions during CI.**
4. Following any approved production rollout: independently validate anonymous Firestore saves and parent-visible errors with approved, privacy-safe testing and check that legitimate international parents can still complete assessment requests.

## Explicit next workstream
The separately verified premature `lead_form_submit` and `funnel_demo_booking_complete` semantics are **not fixed here**; they need their own tested changes after reviewing downstream GA4 key-event selections. Similarly the dual first-touch stores and delayed analytics load are separate measurement QA work. Follow [lead-health #756](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/756) and the P0 audit PR #761.
