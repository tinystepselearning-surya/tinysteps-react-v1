export const normalizeId = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

export const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalizeId).filter(Boolean)));
};

/**
 * Enrollment child identity is canonical-first. New lifecycle writers persist kidId,
 * studentId, and kidIds from the same canonical child. Legacy studentId/childId/kidIds
 * are consulted only when kidId is absent, so stale aliases cannot override kidId.
 */
export function enrollmentBelongsToKid(enrollment, kidId) {
  const expectedKidId = normalizeId(kidId);
  if (!enrollment || !expectedKidId) return false;

  const canonicalKidId = normalizeId(enrollment.kidId);
  if (canonicalKidId) return canonicalKidId === expectedKidId;

  return (
    normalizeId(enrollment.studentId) === expectedKidId
    || normalizeId(enrollment.childId) === expectedKidId
    || normalizeIdList(enrollment.kidIds).includes(expectedKidId)
  );
}

export function enrollmentCourseMatches(enrollment, courseId) {
  const expectedCourseId = normalizeId(courseId);
  return Boolean(
    enrollment
    && expectedCourseId
    && normalizeId(enrollment.courseId) === expectedCourseId,
  );
}

export function resolveStudentProgressPath(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  if (
    parts.length === 4
    && parts[0] === 'students'
    && parts[2] === 'progress'
    && parts[1]
    && parts[3]
  ) {
    return { kidId: parts[1], topicId: parts[3] };
  }
  return null;
}

function candidateEnrollments(enrollments, kidId, courseId) {
  return enrollments.filter((entry) => (
    enrollmentBelongsToKid(entry.data, kidId)
    && enrollmentCourseMatches(entry.data, courseId)
  ));
}

/**
 * Classifies one /students/{kidId}/progress/{topicId} document for the Brick 1
 * enrollment authorization contract. No inference is permitted when more than one
 * enrollment matches the same child + course.
 */
export function classifyProgressEnrollment({ path, data, enrollments }) {
  const pathIdentity = resolveStudentProgressPath(path);
  if (!pathIdentity) {
    return {
      kind: 'ignored_non_student_progress',
      path,
      kidId: null,
      topicId: null,
      courseId: normalizeId(data?.courseId) || null,
      enrollmentId: normalizeId(data?.enrollmentId) || null,
      candidateEnrollmentIds: [],
    };
  }

  const { kidId, topicId } = pathIdentity;
  const courseId = normalizeId(data?.courseId);
  const enrollmentId = normalizeId(data?.enrollmentId);
  const byId = new Map(enrollments.map((entry) => [entry.id, entry]));

  if (!courseId) {
    return {
      kind: 'missing_course_id',
      path,
      kidId,
      topicId,
      courseId: null,
      enrollmentId: enrollmentId || null,
      candidateEnrollmentIds: [],
    };
  }

  if (enrollmentId) {
    const enrollment = byId.get(enrollmentId);
    if (!enrollment) {
      return {
        kind: 'conflicting_enrollment_missing',
        path,
        kidId,
        topicId,
        courseId,
        enrollmentId,
        candidateEnrollmentIds: [],
      };
    }
    if (!enrollmentBelongsToKid(enrollment.data, kidId)) {
      return {
        kind: 'conflicting_enrollment_child',
        path,
        kidId,
        topicId,
        courseId,
        enrollmentId,
        candidateEnrollmentIds: [enrollmentId],
      };
    }
    if (!enrollmentCourseMatches(enrollment.data, courseId)) {
      return {
        kind: 'conflicting_enrollment_course',
        path,
        kidId,
        topicId,
        courseId,
        enrollmentId,
        candidateEnrollmentIds: [enrollmentId],
      };
    }
    return {
      kind: 'already_correct',
      path,
      kidId,
      topicId,
      courseId,
      enrollmentId,
      candidateEnrollmentIds: [enrollmentId],
    };
  }

  const candidates = candidateEnrollments(enrollments, kidId, courseId);
  const candidateEnrollmentIds = candidates.map((entry) => entry.id).sort();
  if (candidateEnrollmentIds.length === 1) {
    return {
      kind: 'migratable_unique',
      path,
      kidId,
      topicId,
      courseId,
      enrollmentId: null,
      candidateEnrollmentIds,
      targetEnrollmentId: candidateEnrollmentIds[0],
    };
  }
  if (candidateEnrollmentIds.length > 1) {
    return {
      kind: 'ambiguous',
      path,
      kidId,
      topicId,
      courseId,
      enrollmentId: null,
      candidateEnrollmentIds,
    };
  }
  return {
    kind: 'unmapped',
    path,
    kidId,
    topicId,
    courseId,
    enrollmentId: null,
    candidateEnrollmentIds: [],
  };
}

export function summarizeProgressEnrollmentAudit(rows) {
  const relevant = rows.filter((row) => row.kind !== 'ignored_non_student_progress');
  const withEnrollmentId = relevant.filter((row) => Boolean(row.enrollmentId));
  const missingEnrollmentId = relevant.filter((row) => !row.enrollmentId);
  const conflictingKinds = new Set([
    'conflicting_enrollment_missing',
    'conflicting_enrollment_child',
    'conflicting_enrollment_course',
  ]);

  return {
    totalExamined: relevant.length,
    withEnrollmentId: withEnrollmentId.length,
    missingEnrollmentId: missingEnrollmentId.length,
    uniqueMapping: relevant.filter((row) => row.kind === 'migratable_unique').length,
    ambiguous: relevant.filter((row) => row.kind === 'ambiguous').length,
    conflicting: relevant.filter((row) => conflictingKinds.has(row.kind)).length,
    unmapped: relevant.filter((row) => row.kind === 'unmapped').length,
    missingCourseId: relevant.filter((row) => row.kind === 'missing_course_id').length,
    alreadyCorrect: relevant.filter((row) => row.kind === 'already_correct').length,
    wouldUpdate: relevant.filter((row) => row.kind === 'migratable_unique').length,
  };
}

export function buildProgressEnrollmentAudit({ progressDocs, enrollments }) {
  const rows = progressDocs.map((progress) => classifyProgressEnrollment({
    path: progress.path,
    data: progress.data,
    enrollments,
  }));
  return {
    rows,
    summary: summarizeProgressEnrollmentAudit(rows),
  };
}
