// Brick P4 compatibility barrel.
// Keep pure V3 exports available for callers/tests, but route the deployed trigger
// through Brick 1F's shadow-only V4 activation wrapper. Incremental writes remain
// compile-time disabled until a later cutover brick explicitly arms them.
export * from './parentMonthlyClassAttendanceProjectionV3';
export {
  onClassSessionReadModelWriteShadowOnly as onClassSessionReadModelWrite,
} from './parentMonthlyClassAttendanceShadowActivation';
