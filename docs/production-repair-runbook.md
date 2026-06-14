# Production Repair Runbook

Project: `tinysteps-react-v1`

Issue addressed:

- Enrollment weekly slot time changed
- Existing future regular `classSessions` stayed stale
- Teacher and admin session readers filtered those stale sessions out as non-canonical

Callable added for repair:

- `repairEnrollmentFutureSessionsFromSchedule`

## Important

Deployment alone does not rewrite already-created production `classSessions`.

After deploy, production data still needs repair for the affected enrollment.

## Incident-specific student

- Student: `Inayah fatima`
- Course: `Phonics Foundations`
- Teacher: `Aditi Naidu`
- Expected recurring slots:
  - Tue `6:45 PM`
  - Thu `6:45 PM`

## Repair options

### Option 1: Re-save the schedule in production Admin

After deploy:

1. Open production Admin.
2. Open Inayah fatima's active enrollment.
3. Confirm the weekly slots are:
   - Tue `6:45 PM`
   - Thu `6:45 PM`
4. Save the schedule again.

This should invoke the backend repair path through the existing admin save flow.

### Option 2: Call the repair callable directly

Use the production enrollment id for Inayah first.

Dry run:

```ts
repairEnrollmentFutureSessionsFromSchedule({
  enrollmentId: "<INAYAH_PRODUCTION_ENROLLMENT_ID>",
  dryRun: true
})
```

Apply:

```ts
repairEnrollmentFutureSessionsFromSchedule({
  enrollmentId: "<INAYAH_PRODUCTION_ENROLLMENT_ID>",
  dryRun: false
})
```

## Expected dry-run output

Review these fields before applying:

- `missingSessionsToCreate`
- `staleSessionsToUpdate`
- `duplicateOldTimeSessions`
- `unsafeSessionsSkipped`
- `teacherAliasProblems`
- `finalCounts`

Interpretation:

- `missingSessionsToCreate`: future regular sessions missing at the canonical slot time
- `staleSessionsToUpdate`: future canonical sessions that exist but need denormalized field repair
- `duplicateOldTimeSessions`: safe stale regular sessions at the old time that should be cancelled
- `unsafeSessionsSkipped`: sessions intentionally not touched because they are past, completed, finance-linked, attendance-marked, paused, or exception-like
- `teacherAliasProblems`: sessions missing required teacher alias fields for teacher/admin readers

## Safety rules enforced by the repair

The repair is intentionally narrow.

It does not modify:

- completed sessions
- past sessions
- attendance history
- finance or ledger-linked sessions
- makeup sessions
- rescheduled sessions
- replacement sessions
- manual/ad hoc exception sessions

It only changes safe future regular sessions for the targeted enrollment.

## Production verification checklist

After repair, verify all of the following:

1. Admin Sessions Management shows `Inayah fatima` at `6:45 PM`.
2. Aditi teacher Upcoming Sessions shows `Inayah fatima` at `18:45-19:20`.
3. The old `6:30 PM` future regular session is no longer visible, or is safely cancelled.
4. Past/completed sessions remain unchanged.
5. Attendance and finance records remain unchanged.
6. Makeup/rescheduled/replacement sessions remain unchanged.

## Recommended deploy + repair order

1. Fix deploy IAM first.
2. Deploy only the failed callable:

```bash
npx firebase-tools@latest deploy \
  --only functions:repairEnrollmentFutureSessionsFromSchedule \
  --project tinysteps-react-v1 \
  --non-interactive
```

3. Deploy all functions:

```bash
npx firebase-tools@latest deploy \
  --only functions \
  --project tinysteps-react-v1 \
  --non-interactive
```

4. Deploy hosting:

```bash
npm run build

npx firebase-tools@latest deploy \
  --only hosting \
  --project tinysteps-react-v1 \
  --non-interactive
```

5. Repair Inayah's production enrollment.
6. Run the verification checklist.
