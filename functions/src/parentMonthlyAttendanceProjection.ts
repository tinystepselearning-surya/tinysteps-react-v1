// Brick P4 compatibility barrel.
// Keep pure V3 exports available for callers/tests, but route the deployed trigger
// through the V4 guarded orchestration layer. Both V4 gates default disabled.
export * from './parentMonthlyClassAttendanceProjectionV3';
export { onClassSessionReadModelWriteV4 as onClassSessionReadModelWrite } from './parentMonthlyClassAttendanceProjectionV4';
