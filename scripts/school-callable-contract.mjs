export const SCHOOL_CALLABLE_REGION = 'asia-south1';

export const SCHOOL_BROWSER_CALLABLES = Object.freeze([
  'adminCreateSchool',
  'adminUpdateSchool',
  'adminAssignSchoolLearningPartner',
  'adminLinkSchoolUser',
  'adminUnlinkSchoolUser',
  'schoolGetProgrammeSnapshot',
  'schoolCreateAcademicYear',
  'schoolSetCurrentAcademicYear',
  'schoolUpsertGrade',
  'schoolSetGradeStatus',
  'schoolUpsertSection',
  'schoolSetSectionStatus',
  'schoolUpsertTeacher',
  'schoolSetTeacherStatus',
  'schoolUpdateCurriculumProgress',
  'schoolUpdateTeacherTraining',
  'schoolCreateReview',
  'schoolRecordAssessmentSummary',
]);

export const EXISTING_CRITICAL_FUNCTIONS = Object.freeze([
  'batchInsightsRollup11am',
  'batchInsightsRollup5pm',
  'batchInsightsRollup11pm',
  'onGameProgressWrite',
  'onGameSessionCreateTrigger',
]);

export const SCHOOL_BACKEND_TRIGGERS = Object.freeze([
  'onSchoolAcademicYearActivity',
  'onSchoolGradeActivity',
  'onSchoolSectionActivity',
  'onSchoolTeacherActivity',
  'onSchoolCurriculumActivity',
  'onSchoolTrainingActivity',
  'onSchoolReviewActivity',
  'onSchoolAssessmentActivity',
]);
