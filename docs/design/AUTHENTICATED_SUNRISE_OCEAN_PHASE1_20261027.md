# Authenticated Sunrise/Ocean theme — phase 1 (27 October 2026)

## Goal
Extend Tiny Steps's approved Sunrise/Ocean branding and readable typography beyond the public pages into all authenticated role experiences without changing any domain workflow.

## Implemented in this draft
- Shared `ts-auth-surface` design tokens for light and dark backgrounds, cards, readable ink, muted copy, borders, blue, purple and orange accents. Opt-in at portal roots, not wildcard rules.
- Admin/Founder: opt-in shell plus the common operations header and dark navy sidebar with lavender-purple selection.
- Teacher: opt-in workspace shell, top toolbar and primary sidebar colour system.
- Parent: opt-in shell, refreshed existing parent theme tokens and parent header gradient.
- Learning Partner: opt-in workspace and shared AppShellHeader.
- School Admin: opt-in root, partnership headings, lightly tinted detail surfaces.
- Shared AppShellHeader: branded borders and text with explicit dark-mode contrast.
- Read-only cross-portal colour inventory `node scripts/audit-all-portal-colours.mjs` and shell guards `--strict`.
- Source regression checks `src/tests/ui/authenticatedSunriseOceanTheme.spec.ts`.

## Not yet complete
This draft is the **shell foundation**, not a claim that every inner tab, table, dialogue, calendar, chart, parent lesson, teacher lesson, or game has been recoloured. More than one thousand files exist across the codebase. Per-component review remains necessary, especially the Parent Payments workspace, Admin monthly attendance review, teacher Earnings/Sessions, school programme workspace and Learning Partner management tabs.

The `--strict` check verifies five portal roots adopt the new token scope. It does *not* establish WCAG AA for all pixels. The inventory reports remaining legacy utilities and per-portal examples as **review candidates**, not verified defects. Run and inspect the audit output alongside light/dark screenshots at 320px, 375px, 768px and desktop widths and accessibility checks.

## Non-negotiable exclusions
Do not blindly recolour payment statuses, overdue fees, attendance Present/Absent, holidays, teacher earnings, errors, warnings, classroom annotation colours, student performance scales or child-game correctness feedback. Preserve light/dark contrast and native iOS safe-area/scroll behaviours.

## Next reviews before release
1. Run TypeScript, focused portal/unit tests, whole-source inventory, accessibility scans and production build.
2. Validate Admin/Founder, Teacher, Parent, Learning Partner and School Admin screenshots, including dark mode, on mobile and desktop.
3. Check all tabs for low-contrast text on new backgrounds, dialogs, responsive overflow, calendar statuses and keyboard focus.
4. Reconcile each remaining legacy colour case by meaning, then continue a separate per-component phase.
5. Only merge or deploy once checks and manual functional reviews are green.

No production deployment is performed by this PR.
