# Tiny Steps School Portal — Bricks 2–11

This branch is the integration build for the remaining School Partnership Portal programme.

## Brick boundaries

- Brick 2 — Academic Structure: academic years, grades, sections, student counts, school teacher records.
- Brick 3 — Learning Partner School Workspace: assigned-school discovery and management workspace.
- Brick 4 — Curriculum Progress: section-level Tiny Steps course/stage verification with append-only history.
- Brick 5 — Teacher Training Progress: school-teacher training status and history.
- Brick 6 — School Admin Dashboard: read-only executive overview, classes and teachers.
- Brick 7 — Reviews & Inspections: append-only Learning Partner classroom/school reviews.
- Brick 8 — Early Reading Benchmark: aggregate section checkpoint assessments and TS-0…TS-9 scale.
- Brick 9 — Curriculum vs Assessment Intelligence: deterministic programme-health signal.
- Brick 10 — Analytics & Reporting: school/grade/domain summaries, print view and CSV export.
- Brick 11 — Governance & Closeout: activity log, auditability, export/security documentation and final RBAC coverage.

## Non-negotiable architecture

- Existing `users/{uid}` remains the authentication identity source.
- `schoolUsers/{uid}` remains School Admin tenant membership.
- School children do **not** receive Tiny Steps user accounts in this programme.
- School teachers are lightweight school records, not Firebase Auth users.
- Teachers do not enter daily lesson progress.
- Learning Partners manage operational school information.
- School Admin/Principal access remains read-only.
- All school-domain client mutations are server callable-only; Firestore browser writes remain denied.
- Current LP assignment is `schools/{schoolId}.learningPartnerId`; no large reverse school arrays are added to LP users.
- Academic history is never hard-deleted by clients.
- Curriculum progress and assessment level remain independent concepts.
- Assessment results in this phase are aggregate section summaries, not individual child dashboards.

## Review workflow

This integration branch must not be merged directly. Codex performs full local validation, then the branch receives an architecture/security review before PR/merge.
