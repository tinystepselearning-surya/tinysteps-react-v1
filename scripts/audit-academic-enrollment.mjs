#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'tinysteps-react-v1';
const DEFAULT_REPORT = 'reports/academic-enrollment-audit.json';
const TODAY_YMD = new Date().toISOString().slice(0, 10);

const COURSE_FIELDS = [
  'courseId', 'name', 'title', 'courseName', 'area', 'track', 'level', 'status', 'active',
  'ratePerSession', 'durationMinutes', 'sessionFrequency', 'maxStudentsPerSession',
  'targetAge', 'targetGrade', 'topics', 'prerequisites',
];

const ENROLLMENT_FIELDS = [
  'enrollmentId', 'kidId', 'kidIds', 'studentId', 'childId', 'courseId', 'courseName',
  'teacherId', 'teacherIds', 'lpId', 'parentId', 'parentIds', 'status',
  'ratePerSession', 'feePerClass', 'teacherPayPerSession', 'currency', 'billingCycle',
  'creditsTotal', 'creditsUsed', 'creditsRemaining',
  'topicProgress', 'schedule', 'scheduleMaterialization', 'classesStartDateYmd',
  'creationIntent', 'creationOperationId', 'previousEnrollmentId', 'nextEnrollmentId',
  'transitionOperationId', 'transitionType', 'correctedFromEnrollmentId',
  'supersededByEnrollmentId', 'joinUrl',
];

const SESSION_FIELDS = [
  'enrollmentId', 'courseId', 'teacherId', 'kidId', 'kidIds', 'studentId', 'studentIds',
  'childId', 'childIds', 'childrenIds', 'date', 'status', 'source',
  'ratePerSession', 'feeAmount', 'currency',
];

const ACTIVE_LIKE = new Set([
  'active', 'trial', 'paused', 'enrolled', 'current', 'ongoing',
  'pending_teacher', 'pending_payment', 'pending_lp', 'pending_lp_assignment',
]);

const TERMINAL = new Set([
  'completed', 'discontinued', 'expired', 'cancelled', 'canceled', 'archived', 'inactive',
]);

function parseArgs(argv) {
  const out = {
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      DEFAULT_PROJECT_ID,
    report: DEFAULT_REPORT,
    sampleSize: 20,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--project') out.projectId = String(argv[++i] || '').trim();
    else if (key === '--report') out.report = String(argv[++i] || '').trim();
    else if (key === '--sample-size') out.sampleSize = Number(argv[++i]);
    else if (key === '--help' || key === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (!out.projectId) throw new Error('--project must not be empty');
  if (!out.report) throw new Error('--report must not be empty');
  if (!Number.isInteger(out.sampleSize) || out.sampleSize < 0 || out.sampleSize > 100) {
    throw new Error('--sample-size must be an integer from 0 to 100');
  }
  return out;
}

export function text(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function list(...values) {
  const result = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const normalized = text(value);
    if (normalized) result.push(normalized);
  };
  values.forEach(visit);
  return [...new Set(result)];
}

function token(value) {
  return createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12);
}

function row(doc) {
  return { id: doc.id, path: doc.ref.path, data: doc.data() || {} };
}

function mapById(rows) {
  return new Map(rows.map((entry) => [entry.id, entry]));
}

function countBy(values) {
  const counts = {};
  values.forEach((value) => {
    const key = text(value).toLowerCase() || '(missing)';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function percentage(part, total) {
  if (!total) return 100;
  return Math.round((Number(part || 0) / total) * 10000) / 100;
}

function isActiveLike(status) {
  return ACTIVE_LIKE.has(text(status).toLowerCase());
}

function isTerminal(status) {
  return TERMINAL.has(text(status).toLowerCase());
}

function scheduleSource(schedule) {
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return 'unconfigured';
  const weeklySlots = Array.isArray(schedule.weeklySlots) ? schedule.weeklySlots : [];
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const slots = weeklySlots.length || days.length;
  if (!slots) return 'unconfigured';
  if (
    Number(schedule.schemaVersion) === 1 &&
    text(schedule.deliveryMode).toLowerCase() === 'rolling'
  ) {
    return 'canonical_rolling';
  }
  return 'legacy_compatible';
}

function hasLegacyFiniteScheduleFields(schedule) {
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return false;
  return (
    schedule.weeksAhead !== undefined ||
    schedule.plannedSessions !== undefined ||
    Boolean(text(schedule.endDateYmd))
  );
}

function courseStatus(data) {
  const status = text(data.status).toLowerCase();
  if (status) return status;
  if (typeof data.active === 'boolean') return data.active ? 'active' : 'inactive';
  return '(missing)';
}

function makeIssues(sampleSize) {
  const counts = {};
  const samples = {};
  return {
    add(code, source, fields = []) {
      counts[code] = (counts[code] || 0) + 1;
      if (!samples[code]) samples[code] = [];
      if (samples[code].length >= sampleSize) return;
      samples[code].push({
        sourceToken: token(source?.path || source?.id || code),
        sourceKind: String(source?.path || '').split('/')[0] || 'unknown',
        status: text(source?.data?.status).toLowerCase() || null,
        fields: [...new Set(fields)].sort(),
      });
    },
    result() {
      return {
        total: Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
        byCode: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
        samples: Object.fromEntries(Object.entries(samples).sort(([a], [b]) => a.localeCompare(b))),
      };
    },
  };
}

function auditCourses(courses, issues) {
  let academicFieldsComplete = 0;
  let namePresent = 0;
  let areaOrTrackPresent = 0;
  let levelPresent = 0;
  let activeLevelPresent = 0;
  let hasEmbeddedPrice = 0;
  let hasEmbeddedTopics = 0;
  let hasDurationMinutes = 0;
  let hasSessionFrequency = 0;
  let hasMaxStudentsPerSession = 0;
  let hasDeliveryDefaults = 0;
  let maxStudentsGreaterThanOne = 0;
  let activeCourses = 0;
  const activeAreaTrackValues = [];

  for (const course of courses) {
    const data = course.data;
    const status = courseStatus(data);
    if (status === 'active') activeCourses += 1;

    const name = text(data.name) || text(data.title) || text(data.courseName);
    const area = text(data.area) || text(data.track);
    const level = Number(data.level);
    const levelIsPresent = Number.isFinite(level);
    if (name) namePresent += 1;
    if (area) areaOrTrackPresent += 1;
    if (levelIsPresent) levelPresent += 1;
    if (status === 'active' && levelIsPresent) activeLevelPresent += 1;
    if (status === 'active' && area) activeAreaTrackValues.push(area);
    if (name && area && levelIsPresent) academicFieldsComplete += 1;

    if (Number.isFinite(Number(data.ratePerSession)) && Number(data.ratePerSession) > 0) hasEmbeddedPrice += 1;
    if (Array.isArray(data.topics) && data.topics.length > 0) hasEmbeddedTopics += 1;
    const durationPresent = Number.isFinite(Number(data.durationMinutes));
    const frequencyPresent = Boolean(text(data.sessionFrequency));
    const maxStudentsPresent = Number.isFinite(Number(data.maxStudentsPerSession));
    if (durationPresent) hasDurationMinutes += 1;
    if (frequencyPresent) hasSessionFrequency += 1;
    if (maxStudentsPresent) hasMaxStudentsPerSession += 1;
    if (durationPresent || frequencyPresent || maxStudentsPresent) hasDeliveryDefaults += 1;
    if (Number(data.maxStudentsPerSession) > 1) maxStudentsGreaterThanOne += 1;

    if (status === 'active' && !name) issues.add('active_course_missing_name', course, ['name', 'title', 'courseName']);
    if (status === 'active' && !area) issues.add('active_course_missing_area', course, ['area', 'track']);
    if (status === 'active' && !Number.isFinite(level)) issues.add('active_course_missing_level', course, ['level']);
  }

  return {
    total: courses.length,
    activeCourses,
    statusDistribution: countBy(courses.map((course) => courseStatus(course.data))),
    activeAreaTrackDistribution: countBy(activeAreaTrackValues),
    academicFieldsComplete,
    namePresent,
    areaOrTrackPresent,
    levelPresent,
    activeLevelPresent,
    hasEmbeddedPrice,
    hasEmbeddedTopics,
    hasDurationMinutes,
    hasSessionFrequency,
    hasMaxStudentsPerSession,
    hasDeliveryDefaults,
    maxStudentsGreaterThanOne,
  };
}

function auditEnrollments(enrollments, coursesById, issues) {
  let activeLike = 0;
  let terminal = 0;
  let courseResolved = 0;
  let teacherIdPresent = 0;
  let moneySnapshotPresent = 0;
  let creditsPresent = 0;
  let topicProgressPresent = 0;
  let previousNextLinks = 0;
  let transitionLinks = 0;

  const scheduleSources = { canonical_rolling: 0, legacy_compatible: 0, unconfigured: 0 };
  const activeLikeScheduleSources = { canonical_rolling: 0, legacy_compatible: 0, unconfigured: 0 };
  let legacyFiniteScheduleFields = 0;
  let activeLikeLegacyFiniteScheduleFields = 0;
  let activeLikeMissingTeacherId = 0;

  for (const enrollment of enrollments) {
    const data = enrollment.data;
    const status = text(data.status).toLowerCase();
    if (isActiveLike(status)) activeLike += 1;
    if (isTerminal(status)) terminal += 1;

    const courseId = text(data.courseId);
    if (courseId && coursesById.has(courseId)) courseResolved += 1;
    else if (courseId) issues.add('enrollment_missing_course', enrollment, ['courseId']);
    else issues.add('enrollment_missing_courseId', enrollment, ['courseId']);

    if (text(data.teacherId)) teacherIdPresent += 1;
    else if (isActiveLike(status)) activeLikeMissingTeacherId += 1;

    const hasRate = Number.isFinite(Number(data.ratePerSession ?? data.feePerClass)) &&
      Number(data.ratePerSession ?? data.feePerClass) > 0;
    const hasCurrency = Boolean(text(data.currency));
    if (hasRate && hasCurrency) moneySnapshotPresent += 1;
    else if (isActiveLike(status)) issues.add('active_enrollment_missing_money_snapshot', enrollment, ['ratePerSession', 'feePerClass', 'currency']);

    const creditFields = ['creditsTotal', 'creditsUsed', 'creditsRemaining'];
    if (creditFields.some((field) => data[field] !== undefined && data[field] !== null)) creditsPresent += 1;

    if (data.topicProgress && typeof data.topicProgress === 'object' && !Array.isArray(data.topicProgress)) {
      topicProgressPresent += 1;
    }

    const source = scheduleSource(data.schedule);
    scheduleSources[source] += 1;
    if (isActiveLike(status)) activeLikeScheduleSources[source] += 1;
    if (hasLegacyFiniteScheduleFields(data.schedule)) {
      legacyFiniteScheduleFields += 1;
      if (isActiveLike(status)) activeLikeLegacyFiniteScheduleFields += 1;
    }

    if (text(data.previousEnrollmentId) || text(data.nextEnrollmentId)) previousNextLinks += 1;
    if (text(data.transitionOperationId) || text(data.transitionType)) transitionLinks += 1;

    const kidRefs = list(data.kidId, data.kidIds, data.studentId, data.childId);
    if (kidRefs.length > 1) {
      const canonicalKidId = text(data.kidId);
      const aliasesMatch = canonicalKidId && kidRefs.every((id) => id === canonicalKidId);
      if (!aliasesMatch) issues.add('enrollment_multiple_distinct_learner_refs', enrollment, ['kidId', 'kidIds', 'studentId', 'childId']);
    }
  }

  return {
    total: enrollments.length,
    activeLike,
    terminal,
    statusDistribution: countBy(enrollments.map((e) => e.data.status)),
    courseResolved,
    courseResolutionPct: percentage(courseResolved, enrollments.length),
    teacherIdPresent,
    activeLikeMissingTeacherId,
    moneySnapshotPresent,
    creditsPresent,
    topicProgressPresent,
    scheduleSources,
    activeLikeScheduleSources,
    legacyFiniteScheduleFields,
    activeLikeLegacyFiniteScheduleFields,
    previousNextLinks,
    transitionLinks,
  };
}

function auditSessions(sessions, enrollmentsById, coursesById, issues) {
  let withEnrollmentId = 0;
  let enrollmentResolved = 0;
  let courseResolved = 0;
  let multiLearner = 0;
  let futureOrToday = 0;
  let missingEnrollmentTotal = 0;
  let missingEnrollmentPast = 0;
  let futureWithoutEnrollment = 0;
  let futureMultiLearner = 0;
  let hasFinancialSnapshot = 0;
  let futureMissingFinancialSnapshot = 0;

  const sourceDistribution = countBy(sessions.map((session) => session.data.source));

  for (const session of sessions) {
    const data = session.data;
    const enrollmentId = text(data.enrollmentId);
    if (enrollmentId) {
      withEnrollmentId += 1;
      if (enrollmentsById.has(enrollmentId)) enrollmentResolved += 1;
      else {
        missingEnrollmentTotal += 1;
        if (text(data.date) && text(data.date) < TODAY_YMD) missingEnrollmentPast += 1;
        if (text(data.date) >= TODAY_YMD) issues.add('future_session_missing_enrollment', session, ['enrollmentId']);
      }
    }

    const courseId = text(data.courseId);
    if (courseId && coursesById.has(courseId)) courseResolved += 1;
    else if (text(data.date) >= TODAY_YMD && courseId) issues.add('future_session_missing_course', session, ['courseId']);

    const learnerRefs = list(
      data.kidId, data.kidIds, data.studentId, data.studentIds,
      data.childId, data.childIds, data.childrenIds,
    );
    if (learnerRefs.length > 1) multiLearner += 1;

    const date = text(data.date);
    if (date && date >= TODAY_YMD) {
      futureOrToday += 1;
      if (!enrollmentId) futureWithoutEnrollment += 1;
      if (learnerRefs.length > 1) futureMultiLearner += 1;
    }

    const fee = Number(data.ratePerSession ?? data.feeAmount);
    const financialSnapshotPresent = Number.isFinite(fee) && fee > 0 && Boolean(text(data.currency));
    if (financialSnapshotPresent) hasFinancialSnapshot += 1;
    else if (date && date >= TODAY_YMD) futureMissingFinancialSnapshot += 1;
  }

  return {
    total: sessions.length,
    withEnrollmentId,
    enrollmentResolved,
    enrollmentResolutionPct: percentage(enrollmentResolved, withEnrollmentId),
    missingEnrollmentTotal,
    missingEnrollmentPast,
    courseResolved,
    multiLearner,
    futureOrToday,
    futureWithoutEnrollment,
    futureMultiLearner,
    hasFinancialSnapshot,
    futureMissingFinancialSnapshot,
    sourceDistribution,
  };
}

function auditOperationalKeys(keys, enrollmentsById, issues) {
  let resolved = 0;
  for (const key of keys) {
    const enrollmentId = text(key.data.enrollmentId);
    if (enrollmentId && enrollmentsById.has(enrollmentId)) resolved += 1;
    else issues.add('operational_enrollment_key_missing_enrollment', key, ['enrollmentId']);
  }
  return {
    total: keys.length,
    resolved,
    resolutionPct: percentage(resolved, keys.length),
  };
}

function auditTransitions(transitions, enrollmentsById, coursesById, issues) {
  let complete = 0;
  let sourceEnrollmentResolved = 0;
  let destinationEnrollmentResolved = 0;
  let newCourseResolved = 0;

  for (const transition of transitions) {
    const data = transition.data;
    if (text(data.state).toLowerCase() === 'complete') complete += 1;

    const oldEnrollmentId = text(data.oldEnrollmentId);
    const newEnrollmentId = text(data.newEnrollmentId);
    const newCourseId = text(data.newCourseId);

    if (oldEnrollmentId && enrollmentsById.has(oldEnrollmentId)) sourceEnrollmentResolved += 1;
    else if (oldEnrollmentId) issues.add('transition_missing_source_enrollment', transition, ['oldEnrollmentId']);

    if (newEnrollmentId && enrollmentsById.has(newEnrollmentId)) destinationEnrollmentResolved += 1;
    else if (text(data.state).toLowerCase() === 'complete') {
      issues.add('complete_transition_missing_destination_enrollment', transition, ['newEnrollmentId']);
    }

    if (newCourseId && coursesById.has(newCourseId)) newCourseResolved += 1;
    else if (newCourseId) issues.add('transition_missing_course', transition, ['newCourseId']);
  }

  return {
    total: transitions.length,
    complete,
    sourceEnrollmentResolved,
    destinationEnrollmentResolved,
    newCourseResolved,
  };
}

function auditSchoolStructure(schoolRows) {
  const totals = {
    schools: schoolRows.length,
    academicYears: 0,
    grades: 0,
    sections: 0,
    schoolTeachers: 0,
    curriculumProgress: 0,
    teacherTraining: 0,
  };
  let sectionsWithMultipleTeachers = 0;

  schoolRows.forEach((school) => {
    totals.academicYears += school.academicYears.length;
    totals.schoolTeachers += school.teachers.length;
    school.academicYears.forEach((year) => {
      totals.grades += year.grades.length;
      totals.sections += year.sections.length;
      totals.curriculumProgress += year.curriculumProgress.length;
      totals.teacherTraining += year.teacherTraining.length;
      sectionsWithMultipleTeachers += year.sections.filter((section) => list(section.data.teacherIds).length > 1).length;
    });
  });

  return {
    ...totals,
    sectionsWithMultipleTeachers,
    interpretation:
      'School sections are institutional academic-structure groupings. They should not be silently reused as B2C LearningGroup without an explicit DeliveryOffering/GroupPlacement contract.',
  };
}

export function auditAcademicEnrollmentSnapshot(snapshot, options = {}) {
  const sampleSize = Number.isInteger(options.sampleSize) ? options.sampleSize : 20;
  const issues = makeIssues(sampleSize);

  const coursesById = mapById(snapshot.courses);
  const enrollmentsById = mapById(snapshot.enrollments);

  const courses = auditCourses(snapshot.courses, issues);
  const enrollments = auditEnrollments(snapshot.enrollments, coursesById, issues);
  const sessions = auditSessions(snapshot.classSessions, enrollmentsById, coursesById, issues);
  const operationalKeys = auditOperationalKeys(snapshot.operationalEnrollmentKeys, enrollmentsById, issues);
  const transitions = auditTransitions(snapshot.enrollmentCourseTransitions, enrollmentsById, coursesById, issues);
  const schoolStructure = auditSchoolStructure(snapshot.schoolStructure);

  const issueResult = issues.result();

  return {
    generatedAt: new Date().toISOString(),
    mode: 'read_only_academic_enrollment_audit',
    privacy: {
      directContactFieldsRead: false,
      rawIdsInReport: false,
      sampleReferences: 'sha256 tokens only',
    },
    counts: {
      courses: snapshot.courses.length,
      enrollments: snapshot.enrollments.length,
      classSessions: snapshot.classSessions.length,
      operationalEnrollmentKeys: snapshot.operationalEnrollmentKeys.length,
      enrollmentCreationOperations: snapshot.enrollmentCreationOperations.length,
      enrollmentCourseTransitions: snapshot.enrollmentCourseTransitions.length,
    },
    courses,
    enrollments,
    sessions,
    operationalKeys,
    transitions,
    schoolStructure,
    canonicalCollectionInventory: {
      programmes: snapshot.programmes.length,
      curriculumVersions: snapshot.curriculumVersions.length,
      deliveryOfferings: snapshot.deliveryOfferings.length,
      learningGroups: snapshot.learningGroups.length,
      groupPlacements: snapshot.groupPlacements.length,
      teachingAssignments: snapshot.teachingAssignments.length,
      schedulePlans: snapshot.schedulePlans.length,
      note:
        'Zero counts support the repository finding that these canonical concepts are not yet standalone production collections. Their current responsibilities are embedded in Course, Enrollment, school structure, and enrollment rolling-schedule fields.',
    },
    issues: issueResult,
    canonicalDecisions: {
      programme:
        'Programme is a new canonical academic concept above Course. Existing course area/track values are migration inputs, not sufficient long-term Programme identity.',
      course:
        'Preserve existing course IDs where they represent stable academic course identity. Split commercial price and delivery defaults out over time.',
      curriculumVersion:
        'Introduce versioned curriculum ownership rather than treating mutable Course.topics or hard-coded school stage definitions as the permanent curriculum contract.',
      deliveryOffering:
        'Introduce DeliveryOffering between Course and Enrollment. Current enrollment schedule, class mode/capacity defaults, and institutional delivery context are migration inputs.',
      enrollment:
        'Preserve Enrollment IDs and lifecycle history. Enrollment remains one learner in one DeliveryOffering; commercial, finance, schedule, and teaching fields are extracted without rewriting history.',
      teachingAssignment:
        'Enrollment.teacherId is the current expected-teacher compatibility authority and should migrate to TeachingAssignment. Session teacher identity remains actual SessionStaff.',
      schedulePlan:
        'Enrollment.schedule is the current recurring timetable authority for rolling enrollments and should migrate to SchedulePlan. scheduleMaterialization is operational projection/state, not academic truth.',
      learningGroup:
        'No general B2C LearningGroup/GroupPlacement model exists today. Do not infer one from course maxStudentsPerSession or arrays. School Section remains institutional academic structure.',
      classSession:
        'ClassSession remains a physical occurrence. It should reference DeliveryOffering/Enrollment/LearningGroup through participant/staff relationships rather than absorb academic/commercial ownership.',
      commercialSeparation:
        'Course.ratePerSession is a legacy commercial default. Enrollment rate/currency/credits are historical/operational snapshots and must migrate to Commerce/Entitlement/Finance ownership without changing past sessions.',
    },
  };
}

async function readCollection(db, name, fields) {
  const ref = fields?.length ? db.collection(name).select(...fields) : db.collection(name);
  const snap = await ref.get();
  return snap.docs.map(row);
}

async function readSchoolStructure(db) {
  const schools = await readCollection(db, 'schools', ['status', 'currentAcademicYearId']);
  const output = [];

  for (const school of schools) {
    const schoolRef = db.collection('schools').doc(school.id);
    const [yearsSnap, teachersSnap] = await Promise.all([
      schoolRef.collection('academicYears').select('status', 'label').get(),
      schoolRef.collection('teachers').select('status').get(),
    ]);

    const academicYears = [];
    for (const yearDoc of yearsSnap.docs) {
      const yearRef = yearDoc.ref;
      const [gradesSnap, sectionsSnap, curriculumSnap, trainingSnap] = await Promise.all([
        yearRef.collection('grades').select('status', 'gradeKey').get(),
        yearRef.collection('sections').select('status', 'gradeId', 'teacherIds', 'studentCount').get(),
        yearRef.collection('curriculumProgress').select('courseId', 'stageOrder', 'status').get(),
        yearRef.collection('teacherTraining').select('teacherId', 'status').get(),
      ]);
      academicYears.push({
        id: yearDoc.id,
        grades: gradesSnap.docs.map(row),
        sections: sectionsSnap.docs.map(row),
        curriculumProgress: curriculumSnap.docs.map(row),
        teacherTraining: trainingSnap.docs.map(row),
      });
    }

    output.push({
      id: school.id,
      academicYears,
      teachers: teachersSnap.docs.map(row),
    });
  }

  return output;
}

async function collectSnapshot(db) {
  const [
    courses,
    enrollments,
    classSessions,
    operationalEnrollmentKeys,
    enrollmentCreationOperations,
    enrollmentCourseTransitions,
    programmes,
    curriculumVersions,
    deliveryOfferings,
    learningGroups,
    groupPlacements,
    teachingAssignments,
    schedulePlans,
    schoolStructure,
  ] = await Promise.all([
    readCollection(db, 'courses', COURSE_FIELDS),
    readCollection(db, 'enrollments', ENROLLMENT_FIELDS),
    readCollection(db, 'classSessions', SESSION_FIELDS),
    readCollection(db, 'operationalEnrollmentKeys', ['enrollmentId', 'kidId', 'courseId']),
    readCollection(db, 'enrollmentCreationOperations', ['enrollmentId', 'kidId', 'courseId', 'creationIntent', 'state']),
    readCollection(db, 'enrollmentCourseTransitions', ['oldEnrollmentId', 'newEnrollmentId', 'oldCourseId', 'newCourseId', 'state', 'transitionType', 'rolling']),
    readCollection(db, 'programmes', ['schemaVersion']),
    readCollection(db, 'curriculumVersions', ['schemaVersion']),
    readCollection(db, 'deliveryOfferings', ['schemaVersion']),
    readCollection(db, 'learningGroups', ['schemaVersion']),
    readCollection(db, 'groupPlacements', ['schemaVersion']),
    readCollection(db, 'teachingAssignments', ['schemaVersion']),
    readCollection(db, 'schedulePlans', ['schemaVersion']),
    readSchoolStructure(db),
  ]);

  return {
    courses,
    enrollments,
    classSessions,
    operationalEnrollmentKeys,
    enrollmentCreationOperations,
    enrollmentCourseTransitions,
    programmes,
    curriculumVersions,
    deliveryOfferings,
    learningGroups,
    groupPlacements,
    teachingAssignments,
    schedulePlans,
    schoolStructure,
  };
}

async function writeReport(reportPath, report) {
  const absolute = path.resolve(process.cwd(), reportPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return absolute;
}

function printSummary(report, reportPath) {
  console.log('\n=== Tiny Steps Academic & Enrollment Audit ===');
  console.log(`Project: ${report.projectId}`);
  console.log(`Source: ${report.source}`);
  console.log(`Courses: ${report.counts.courses}; active: ${report.courses.activeCourses}`);
  console.log(`Enrollments: ${report.counts.enrollments}; active-like: ${report.enrollments.activeLike}`);
  console.log(`Rolling schedules: ${JSON.stringify(report.enrollments.scheduleSources)}`);
  console.log(`ClassSessions: ${report.counts.classSessions}; future/today: ${report.sessions.futureOrToday}`);
  console.log(`Multi-learner sessions: ${report.sessions.multiLearner}; future/today multi-learner: ${report.sessions.futureMultiLearner}`);
  console.log(`Operational enrollment keys: ${report.operationalKeys.resolved}/${report.operationalKeys.total} resolved`);
  console.log(`Issues: ${report.issues.total}`);
  console.log(`Report: ${reportPath}`);
  console.log('Read-only audit complete. No Firestore writes were performed.\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  npm run audit:academic-enrollment
  node scripts/audit-academic-enrollment.mjs --project tinysteps-react-v1

Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
The script reads academic/enrollment/scheduling structure only and performs no Firestore writes.`);
    return;
  }

  if (!getApps().length) {
    initializeApp({ credential: applicationDefault(), projectId: args.projectId });
  }

  const db = getFirestore();
  const snapshot = await collectSnapshot(db);
  const audit = auditAcademicEnrollmentSnapshot(snapshot, { sampleSize: args.sampleSize });
  const report = {
    ...audit,
    projectId: args.projectId,
    source: process.env.FIRESTORE_EMULATOR_HOST ? 'firestore_emulator' : 'firestore',
  };
  const reportPath = await writeReport(args.report, report);
  printSummary(report, reportPath);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('Academic/enrollment audit failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
