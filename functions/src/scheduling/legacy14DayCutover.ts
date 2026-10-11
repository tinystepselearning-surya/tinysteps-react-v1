/**
 * October 2026 cutover: stop all legacy multi-day class-session generation.
 *
 * This is intentionally source-controlled and fail-closed; no Cloud Run
 * environment variable or canary can re-enable the old 14-day writers.
 * Student Management still owns the recurring enrollment timetable. Only the
 * separate daily generator may create new scheduled sessions after cutover.
 *
 * Do not change this switch to true as an operational rollback. The old
 * materialization architecture is retired, not temporarily paused.
 */
export const LEGACY_14_DAY_SESSION_WRITES_RETIRED = true;

export function assertLegacy14DayWritesNotRetired(): void {
  if (LEGACY_14_DAY_SESSION_WRITES_RETIRED) {
    throw new Error('Legacy 14-day session generation is retired. Use the daily timetable generator.');
  }
}
