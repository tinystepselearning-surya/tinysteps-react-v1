# Tiny Steps — Project-wide Sunrise/Ocean colour audit

**Date:** 27 October 2026  
**Status:** implementation in a draft review branch, **not deployed**  
**Scope:** public pages, Admin/Founder, Parent, Teacher, Learning Partner, School Admin, specialised child/game surfaces.

## 1. Baseline and source of truth

Use the existing read-only `node scripts/audit-public-text-palette.mjs`, originally generated on the PR #809 head. Its retained GitHub Actions artifact `public-text-palette-inventory` for run `40376032813` scanned **1,061** source files. This is a **static class/text inventory**, not a rendered WCAG or visual-completeness audit.

| Source group | Files scanned | Legacy warm text-class uses | Interpretation |
| --- | ---: | ---: | --- |
| Public | 187 | 63 | 28 files in the pre-cleanup review queue; inspect context and contrast |
| Protected | 282 | 201 | Protected dashboards, operations, parent/teacher screens; many colours carry status meaning |
| Specialised | 31 | 30 | Games, classroom and learning-feedback surfaces; high risk if semantically replaced |
| Other | 561 | 5 | Mixed code/shared styles; audit usage before migrating |
| **Total** | **1,061** | **299** | Baseline before this draft branch; not the new remaining count |

These counts are deliberately *not* called accessibility failures. `text-amber-` may be an important caution state; `text-orange-` may be a branded heading, a badge, or an instructional sound cue. A mass search-and-replace would create regressions.

## 2. Approved contrast policy

- **Sunrise orange** `#FF7A00`: decorative/large accent on dark navy; **not small text on white**.
- **Orange copy** `#C2410C`: readable public or app emphasis on white.
- **Navy ink** `#17284C` and **body copy** `#405678`: primary reading text.
- **Purple** `#604577` and **ocean** `#315B8A`: readable linked/eyebrow accents on approved pale backgrounds.
- **Lavender** `#D3B9E1`: light text on navy; not body text on white.
- **Pastel surfaces** `#E7F3FF`, `#F1EDFC`, `#FFE5EB`, `#FFF5DF`: background only unless pairing passes WCAG.

## 3. Changes on this draft branch

- Public-scoped design remains untouched for SEO routes, canonical URLs, booking actions and structured data.
- `data-ts-surface="app"` explicitly scopes the authenticated design foundation; standalone public marketing pages retain `data-ts-surface="public"`.
- Shared authenticated app tokens are in `src/index.css`. Portal shells adopt Sunrise/Ocean pages: Admin/Founder, Teacher, Learning Partner and School Admin. Parent keeps its existing `ts-parent-page` architecture and adopts the approved text/background tokens.
- Shared header, mobile tab bar and the Admin and Teacher navigation receive accessible navy/purple accents. Preserve native safe areas and dark-mode variants.
- Initial public clean-up updates non-semantic old orange typography in Team, Founder, Official Profiles, Responsive Teaching, programme FAQs and Course Detail.
- The inventory script now emits **complete per-scope, per-file review queues**, including protected and specialised areas. `node --test scripts/test/projectwide-sunrise-theme.node-test.mjs` guards shell scoping and semantic-state preservation.

## 4. Outstanding review — not complete

1. **Source inventory:** Rerun the read-only tool on the draft head, inspect each remaining flagged file and classify it as branding, decorative, status/semantic, instructional, or actual low-contrast text.
2. **Protected module review:** Go through attendance, payments, calendars, notifications, analytics, classroom feedback, message states and teacher earnings components. Apply brand colours only where they do not erase a meaningful state.
3. **Specialised learning screens:** Keep error/success, phonics sound coding, course-level instructional cues and classroom annotation colours semantically distinct. Assess children's games separately.
4. **Rendered verification:** Authenticated mobile/desktop views, navigation and dialogs; keyboard focus, images/gradients, dark mode, iOS safe areas, overflow; Lighthouse/axe WCAG computed contrasts.
5. **Release:** Do not merge this branch until source tests, TypeScript, all relevant role workflow tests and authenticated screenshot/manual review pass. PR #810 must already be merged before integration.

**Definition of done:** every source review candidate is resolved or explicitly accepted with a reason, sampled rendered styles meet WCAG requirements, and the role workflows pass their existing test gates. Until then this is a first implementation wave, **not a claim of 100% project-wide palette completion**.


## 5. Latest read-only source inventory on the draft branch

The **Projectwide Sunrise Theme Audit** workflow passed on commit `f774e34c7838` (run `40387001308`, artifact `projectwide-text-colour-inventory`). It scanned the same **1,061 files** and produced the following current review queue:

| Scope | Original warm-text classes | Current uses | Files currently flagged |
| --- | ---: | ---: | ---: |
| Public | 63 | **33** | 22 |
| Protected | 201 | **200** | 84 |
| Specialised | 30 | **30** | 11 |
| Other | 5 | **5** | 5 |
| **Total** | **299** | **268** | **122** |

Thus **31 original warm-class uses were retired** through the first pass. This count is not a measure of WCAG compliance or of all background tokens. It excludes raw hex and generic grey/blue class usages tracked separately in the JSON artifact.

### Contextual review examples

- `src/pages/admin/AttendanceValidationDashboard.tsx`: amber/orange status, validation notices and needs-attention messaging. **Preserve meaning** while reviewing contrast.
- `src/pages/admin/ParentPaymentsLegacy.tsx` and `src/pages/admin/AnalyticsDashboardV2.tsx`: warnings, balances due and settlement notices. **Do not convert to neutral brand purple**.
- `src/pages/parent/components/classes/ParentWorksheetLibrary.tsx`: colour-coded curriculum cards; assess whether colour distinguishes a learning track before migrating.
- `src/components/teacher/StudentTopicProgressEditorCanonicalV2.tsx`: needs-practice and curriculum-error states; preserve clear instructional semantics.
- Remaining public classes are concentrated in `HolidayCalendar2026`, Phonics Fees, SATPIN tutorial, teaching sound utilities and testimonial star ratings. A portion are intentional warning, school-holiday, phonics-activity or star-score colours.

The source audit is **complete as an inventory**, but the whole-product **component-by-component visual migration is not yet complete**. These remaining rows are the next bounded review queue; each needs a documented keep/replace decision. Do not claim production deployment or full contrast sign-off from this inventory.


## 6. Reconciliation with duplicate draft PR #812 (27 October)

PR #811 is the canonical theme release. Draft PR #812 was created later with an alternate `ts-auth-surface` root and narrower source inventory. Adopting both roots would create competing CSS precedence and different dark-mode assumptions. The resolution is:

| #812 difference | Decision | Reason |
| --- | --- | --- |
| Separate `ts-auth-surface` stylesheet and opt-in on five root views | **Do not copy** | #811 already scopes to `data-ts-surface="app"`, retains parent/native shell safeguards and integrates public/role routing. |
| Recoloured Admin/Teacher/School operations root classes | **Keep #811 version** | #811 already styles the shell and navigation via reusable app classes while leaving domain status colours intact. |
| Parent header gradient | **Port**, behind scoped `ts-app-parent-hero` selector | Preserve the branded wash without overriding the shared authenticated header or dark-mode contrast. |
| Header label/title improvements for Parent, Learning Partner and Admin | **Port** with explicit dark variants | #811 original shared header used low-contrast labels and a forced dark title, especially on navy surfaces. |
| Extra audit script and separate token contract tests | **Consolidate**, do not duplicate | #811's cross-source inventory is broader; extend its existing release-gate tests to cover the useful contrast and native-safety assertions. |
| #812 browser workflow failure | **Do not inherit branch** | Validate the integrated commit using #811's own CI instead of treating #812's unsuccessful run as releasable. |

**Post-reconciliation release scope:** shared portal visual foundation + selected high-visibility text changes, **not** a component-by-component recolour of the entire repository. Keep original counts (268 warm classes across 122 files on the last completed source audit) as unresolved inventory candidates until the updated artifact proves otherwise.

**Remaining blocking gates:** final integrated CI, authenticated role screenshots/light-dark checks, dashboard workflow smoke tests, and a documented per-component keep/replace classification of residual palette usages. Do not mark the full project-wide text-colour audit or production deployment complete until these are addressed.
