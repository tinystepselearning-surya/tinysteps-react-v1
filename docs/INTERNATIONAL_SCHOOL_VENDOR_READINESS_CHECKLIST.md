# Tiny Steps — International School Vendor Readiness Checklist

This checklist sits beside the School Partnership Portal. It covers organisational controls that international schools may request during academic, safeguarding, privacy, accessibility, technology, or procurement review.

It is not legal advice. Requirements vary by country, school, contract and the nature of Tiny Steps staff access to learners/data.

## 1. Educational proposition and claims

- [ ] Tiny Steps scope is clearly defined as foundational reading / phonics implementation support.
- [ ] School retains ownership of its wider curriculum and statutory/accreditation obligations.
- [ ] TSERB is described as an internal, internationally informed programme benchmark—not an internationally normed or standardized test.
- [ ] Any statement about outcomes can be traced to actual evidence and assessment coverage.
- [ ] No “reading age”, diagnosis or developmental-age claim is made from TSERB alone.
- [ ] Assessment limitations are visible in management reporting.

## 2. Safeguarding and child protection

- [ ] Tiny Steps has a written safeguarding / child-protection policy appropriate to its role.
- [ ] Staff who may interact with or observe children know the school’s safeguarding expectations before access.
- [ ] Background/vetting checks are completed where required by law, contract or school policy.
- [ ] A named Tiny Steps safeguarding contact exists.
- [ ] Staff know how and to whom to report a safeguarding concern.
- [ ] Direct communication with children outside agreed school channels is prohibited unless explicitly authorised by the school and consistent with applicable policy.
- [ ] Classroom observation / assessment roles are agreed with the school, including supervision expectations.
- [ ] Photography, recording or collection of child-identifiable evidence is prohibited by default unless separately approved and governed.

## 3. Data minimisation and privacy

- [ ] Data inventory identifies every school-data category collected by the portal/service.
- [ ] School-child accounts are not created for the current partnership model.
- [ ] Portal stores aggregate section benchmark summaries rather than individual child profiles in this phase.
- [ ] Optional school-teacher contact data is limited to what operations genuinely require.
- [ ] Privacy notice explains relevant processing.
- [ ] School data-processing terms / DPA are available when required.
- [ ] Data controller/processor responsibilities are clarified contractually where applicable.
- [ ] Hosting/data-region and relevant subprocessors are documented for procurement review.
- [ ] Data-retention and deletion schedule is documented.
- [ ] School export/deletion request process is documented.
- [ ] Access is removed promptly when staff assignments or employment change.

## 4. Security

- [ ] Role/tenant model is documented: Tiny Steps Admin, assigned Learning Partner, School Admin.
- [ ] Cross-school access tests are part of CI/regression testing.
- [ ] Nested programme writes are server-authorised; browser direct writes are denied.
- [ ] Sensitive secrets are not committed to the client bundle.
- [ ] Dependency vulnerabilities are reviewed and classified before enterprise/international procurement claims are made.
- [ ] Security-update/remediation process has an owner and target turnaround by severity.
- [ ] Backup/restore approach is documented.
- [ ] Security incident process identifies technical owner, communication owner and school escalation path.
- [ ] MFA is enabled/required for privileged Tiny Steps accounts where the selected identity setup supports it.
- [ ] SSO/SAML is assessed when a customer contract requires it rather than built prematurely.

## 5. Accessibility and inclusive digital use

- [ ] Portal is evaluated against WCAG 2.2 AA as the target before claiming accessibility conformance.
- [ ] Keyboard-only use is tested for all Admin/LP/School Admin workflows.
- [ ] Focus order/visible focus is checked.
- [ ] Form controls have programmatic labels.
- [ ] Error messages are understandable and not colour-only.
- [ ] Colour contrast is verified.
- [ ] Tables/reports remain understandable at browser zoom and on smaller screens.
- [ ] Print/PDF remains legible without relying on colour alone.
- [ ] Accessible authentication expectations are reviewed.
- [ ] No claim of WCAG conformance is made until an actual evaluation supports it.

## 6. Service continuity and school support

- [ ] Named Learning Partner assigned.
- [ ] Named backup/hand-over owner exists.
- [ ] LP reassignment procedure preserves school history and continuity.
- [ ] Support/escalation route is given to school leadership.
- [ ] Review cadence is documented.
- [ ] New teacher onboarding process is documented.
- [ ] School closures/term calendars are considered when measuring instructional time.
- [ ] Contractual support/availability expectations are documented for larger customers.

## 7. Assessment quality assurance

- [ ] TSERB administration guide and scoring guide are versioned.
- [ ] Equivalent forms are controlled.
- [ ] Assessor calibration occurs before formal baseline.
- [ ] Moderation/double-scoring is sampled during pilots.
- [ ] EAL/multilingual fairness rules are used.
- [ ] Accent variation is not treated as error when the intended phonemic evidence is valid.
- [ ] Access arrangements are documented and used consistently.
- [ ] Assessment coverage appears alongside results.
- [ ] Low-coverage evidence cannot produce a confident section-health label.
- [ ] Baseline alone cannot be presented as programme impact.
- [ ] Section-level growth is not described as matched-individual growth unless individual matching was separately established.

## 8. Leadership reporting

- [ ] Report distinguishes attainment, growth, implementation quality, teacher development and data quality.
- [ ] Report identifies insufficient data rather than forcing a positive/negative judgment.
- [ ] Programme-reference levels are labelled internal.
- [ ] Current and historical evidence is retained.
- [ ] CSV/PDF exports are checked with representative school data.
- [ ] Multi-campus reporting requirements are agreed before implementation.
- [ ] School board/owner reporting terminology is agreed with the customer.

## 9. International school implementation profile

Before baseline, complete `INTERNATIONAL_SCHOOL_IMPLEMENTATION_PROFILE.md`, including:

- [ ] time zone;
- [ ] actual academic-year dates;
- [ ] curriculum/framework context;
- [ ] class naming;
- [ ] language/EAL context;
- [ ] access/accommodation context;
- [ ] teacher cohort;
- [ ] baseline/checkpoint windows;
- [ ] reporting recipients;
- [ ] privacy/procurement requirements.

## 10. Internal sign-off before calling a customer “international-ready”

Educational owner:
- [ ] curriculum crosswalk checked
- [ ] TSERB protocol/form appropriate for cohort
- [ ] assessment claim language checked

Learning Partner owner:
- [ ] implementation profile complete
- [ ] teacher training plan agreed
- [ ] observation cadence agreed

Technology owner:
- [ ] CI green
- [ ] security rules green
- [ ] production build green
- [ ] accessibility review status known
- [ ] privacy/security questionnaire responses evidence-backed

Commercial owner:
- [ ] proposal promises only delivered functionality
- [ ] contract/service expectations agreed
- [ ] no accreditation/endorsement claim is implied without formal authorisation
