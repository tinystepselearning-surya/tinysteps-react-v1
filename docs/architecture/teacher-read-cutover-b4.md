# Teacher Identity Normalization — B4 Read Cutover

## Goal

Move active teacher collection reads to canonical `teacherId` after B3 made teacher collection authorization canonical-only.

## Why this is safe

B1 established `teacherId` as the canonical Firebase Auth UID. B2 made active writers canonical. B3 hardened Firestore authorization so, when `teacherId` exists, stale aliases cannot grant teacher access and teacher collection queries are canonical-only.

Therefore active client alias collection fallbacks no longer provide an authorized compatibility path. They add redundant/denied Firestore operations without improving operational visibility.

Legacy direct-document compatibility remains outside these active collection readers for old documents that genuinely lack `teacherId`.

## Active readers cut over

- `useTeacherSessions` — Today/Schedule realtime sessions
- `useUpcomingSessions` — selected upcoming day
- `TeacherMyStudentsV2` — enrollments and ±60-day session summary window
- `useTeacherFilteredStudents` — schedule student selector
- `useTeacherStudents` — canonical enrollment ownership

## Preserved behavior

- realtime Today/Schedule listener remains realtime
- date windows and session sorting are unchanged
- enrollment/session schedule-integrity validation is unchanged
- transferred/current ownership continues to use canonical enrollment/session `teacherId`
- parent/admin paths are untouched
- attendance, earnings, billing, join links and session writers are untouched
- `kids.teacherIds` remains supported because child-level multi-teacher relationships can be legitimate across courses

## Canonical client ownership rule

Client-side operational ownership now follows the same invariant as Firestore rules:

1. if `teacherId` exists, it is authoritative;
2. stale aliases cannot override it;
3. only when `teacherId` is absent may legacy aliases be considered for direct legacy compatibility.

## Deferred to B5

B4 does not delete alias fields, indexes, the shared legacy fallback helper, or historical compatibility code. Physical alias retirement and dead-code/index cleanup belong to B5 after operational measurements confirm the cutover.
