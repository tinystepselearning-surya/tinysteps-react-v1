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
