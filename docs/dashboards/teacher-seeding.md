# Teacher Dashboard Seed Data

Use `scripts/seed-teacher-dashboard.js` to provision demo data for the teacher portal collections used by the new hooks.

## Prerequisites

1. Download a Firebase service-account JSON for the Tiny Steps project.
2. Export `GOOGLE_APPLICATION_CREDENTIALS` so `firebase-admin` can use it.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/tinysteps/service-account.json"
```

3. Provide the UID of the teacher (and optional parent UID) you want to seed against:

```bash
export SEED_TEACHER_UID="<firebase-teacher-uid>"
export SEED_PARENT_UID="<firebase-parent-uid>" # optional, defaults to demo-parent-uid
```

## Running the Seed Script

```bash
npm run seed:teacher
```

The script creates/updates documents in these collections:

- `kids/seed-kid-*` with teacher + parent references
- `sessions/session-*` with today’s schedule
- `progress/{teacherId}-{kidId}` progress snapshots
- `teacherEarnings/{teacherId}` monthly summary
- `teacherStats/{teacherId}` KPI + chart datasets

Feel free to edit the arrays inside `scripts/seed-teacher-dashboard.js` to match real users/courses.
