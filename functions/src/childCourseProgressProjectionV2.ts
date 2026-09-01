// P3 compatibility barrel.
// Keep the V2 import path stable for bootstrap/tests while the corrected saved-lesson
// completion contract lives in the explicit V3 implementation. Pure V3 projection helpers
// remain re-exported here, while the deployed trigger is wrapped by the migration-aware guard.
export {
  MAX_CHILD_PROGRESS_REBUILD_DOCS,
  applyIncrementalSummary,
  buildSummaryFromDocs,
  courseTopicIds,
  curriculumTopicsForCourse,
  docsForCourse,
  normalizeCourseId,
  progressState,
  projectionMatchesCurriculum,
} from './childCourseProgressProjectionV3';
export type {
  CourseProgressSummary,
  ProgressState,
  StageProgressSummary,
} from './childCourseProgressProjectionV3';
export { onStudentProgressReadModelWrite } from './childCourseProgressProjectionMigrationGuard';
