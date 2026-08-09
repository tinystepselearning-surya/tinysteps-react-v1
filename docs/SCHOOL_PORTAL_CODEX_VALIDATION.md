# Codex Validation Runbook — School Partnership Portal Bricks 2–11

Use this only after the GitHub feature branch is checked out locally. Do not deploy or merge as part of this validation unless separately instructed.

## Codex objective

Audit the complete School Partnership Portal implementation on `feat/school-portal-brick-2` as a production-critical multi-tenant Firebase/React workflow. Find and fix correctness, RBAC, data-integrity, UX, TypeScript, and regression problems. Prefer conservative evidence semantics over optimistic dashboards.

## Required commands

Run from a clean checkout:

```bash
npm ci
npm ci --prefix functions
npm --prefix functions run build
npm run lint
npm run typecheck
npm run test:unit -- --coverage
npm run build
npm run seo:smoke
```

Run the school-domain Firestore tests with the configured Firestore emulator:

```bash
npx firebase-tools@latest emulators:exec \
  --project tinysteps-react-v1 \
  --only firestore \
  "FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npx vitest run src/tests/firestore/schoolDomain.rules.spec.ts src/tests/firestore/schoolProgramme.rules.spec.ts"
```

If a command fails, inspect the root cause, patch it, and rerun the failed command plus every logically downstream gate. Do not suppress errors or weaken RBAC/tests to make CI green.

## Architecture checks

Verify these invariants directly from code:

- School Admin is a reader, never a programme manager.
- Assigned LP can manage only the school whose `learningPartnerId` matches the current user.
- Admin can manage schools according to the repository’s canonical Admin/superuser semantics.
- Archived schools cannot receive programme mutations.
- Closed academic years are read-only for structure/progress/evidence.
- Nested academic/programme collections are not directly browser-readable/writable.
- `schoolGetProgrammeSnapshot` is the authorised nested read boundary.
- Principal-safe snapshot strips internal-only fields.
- School teachers are school-domain records and do not require Auth users.
- No school child account model has been introduced.
- No reverse `schoolIds[]` array is added to Learning Partner user records.

## Emulator role matrix

Build representative emulator fixtures and exercise:

### Admin

- read any active/paused/archived school as appropriate;
- create academic year;
- add custom grade/class;
- add/edit teacher;
- add/edit multi-teacher section;
- update curriculum;
- update teacher training;
- record review;
- record baseline and post-baseline assessments;
- fetch report snapshot;
- verify audit activity appears.

### Assigned Learning Partner

- read assigned school;
- perform the same permitted operational mutations as Admin;
- fetch full operational snapshot including activity;
- confirm LP cannot access or mutate an unassigned school.

### School Admin / Principal

- read only a school present in active `schoolUsers/{uid}.schoolIds`;
- fetch principal-safe programme snapshot;
- confirm no internal notes/actor UIDs leak;
- confirm every programme mutation callable denies School Admin;
- confirm another school is denied;
- confirm archived school is not exposed as an active principal workspace.

### Other app roles

Teacher, Parent, and Kid users must not gain School Partnership programme access through the new read/mutation callables.

## Data-integrity scenarios

Test all of these explicitly:

1. Duplicate academic year creation is rejected.
2. Duplicate class key/section create is rejected rather than silently overwriting.
3. Section cannot use inactive/nonexistent teachers.
4. Teacher used by an active current-year section cannot be deactivated until unassigned.
5. Class with active sections cannot be deactivated.
6. Closed-year structure mutation is rejected.
7. Closed-year curriculum/training/review/assessment mutation is rejected.
8. Assessment distribution with zero children is rejected.
9. Assessment distribution greater than section count is rejected.
10. If a client sends `studentsAssessed`/`averageReadingLevel`, values must equal server derivation from distribution.
11. Domain scores outside 0–100 are rejected.
12. Assessment can cover fewer children than enrolment; coverage is preserved rather than forcing absentees into TS-0.
13. Baseline alone yields insufficient implementation-health data.
14. Post-baseline evidence + missing teacher training yields needs support.
15. Severe reading/programme-reference gap yields intervention.
16. Only sufficiently current post-baseline evidence + established training may yield on track.
17. Growth excludes sections without both baseline and later checkpoints.
18. Domain growth excludes sections lacking the domain at either side of the matched pair.
19. Browser cannot forge `schools/{schoolId}/activity`.
20. Audit records are server-triggered after successful domain writes.

## Browser workflow smoke test

Using realistic fixture data, inspect the UI at desktop and narrow/mobile widths.

### Admin

Open School Partnerships → Programme and verify:
- year management;
- school naming conventions such as PP1/PP2/K1/K2;
- teacher edit;
- multi-teacher section edit;
- student count edit;
- curriculum stage;
- six-stage teacher training;
- implementation review;
- TSERB assessment;
- report;
- activity.

### Learning Partner

Open LP Dashboard → My Schools and verify:
- only assigned schools appear;
- full operational workspace works;
- switching away/back retains safe state;
- archived school is read-only.

### Principal

Open `/school` and verify:
- linked-school/campus selector;
- no edit/create/save controls;
- management report is understandable without exposing internal notes;
- labels use “programme reference,” not population/age “expected” language.

## Assessment UX checks

- TS-0…TS-9 definitions are visible and readable.
- Entering level counts automatically recalculates assessed total and average TS level.
- Distribution cannot exceed section size.
- Domain score is optional and described.
- History shows checkpoint, coverage, average level, date, and assessment version.
- Baseline and later checkpoints are distinguishable.

## Reporting checks

Verify one school with at least two sections where:
- both sections have baseline;
- only one has a later checkpoint;
- matched growth reports one section, not two;
- a later second-section checkpoint changes the matched count and weighted growth correctly.

Test CSV:
- opens cleanly in spreadsheet software;
- correct escaping of commas/quotes;
- counts and growth match visible report.

Test Print/PDF:
- portal navigation/header is not printed;
- report uses the intended landscape A4 layout;
- tables are not clipped horizontally;
- disclaimers remain visible.

## Regression checks

Confirm no unintended changes to:
- Parent dashboard;
- Teacher dashboard;
- existing Learning Partner parent/teacher assignments;
- Admin user management;
- existing school Brick 1 access-management flow;
- existing Firebase deployment exports/regions;
- SEO/public website routes.

## Final Codex report format

Return:

1. **Blocking defects fixed** — file, defect, fix.
2. **Security/RBAC result** — role matrix PASS/FAIL.
3. **Data-integrity result** — scenario matrix PASS/FAIL.
4. **Automated command results** — exact command and result.
5. **Browser smoke result** — Admin/LP/Principal.
6. **Remaining non-blocking improvements** — clearly separated from release blockers.
7. **Merge recommendation** — READY or NOT READY.

Do not recommend merge if any security, Functions build, Firestore rules, typecheck, unit-test, or production-build gate is failing.
