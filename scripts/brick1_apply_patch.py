from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'firestore.rules',
    """function teacherOwnsDocCanonicalFirst(data) {
  return teacherOwnsCanonicalDoc(data)
    || teacherOwnsLegacyDocWithoutCanonical(data);
}
""",
    """function teacherOwnsDocCanonicalFirst(data) {
  return teacherOwnsCanonicalDoc(data)
    || teacherOwnsLegacyDocWithoutCanonical(data);
}

function enrollmentDocPath(enrollmentId) {
  return /databases/$(database)/documents/enrollments/$(enrollmentId);
}

function enrollmentExists(enrollmentId) {
  return enrollmentId is string
    && enrollmentId.size() > 0
    && exists(enrollmentDocPath(enrollmentId));
}

function enrollmentDoc(enrollmentId) {
  return get(enrollmentDocPath(enrollmentId)).data;
}

function enrollmentBelongsToKidCanonicalFirst(data, kidId) {
  return (
    ('kidId' in data)
    && (data.kidId is string)
    && data.kidId == kidId
  ) || (
    !('kidId' in data)
    && (
      (('studentId' in data) && (data.studentId is string) && data.studentId == kidId)
      || (('childId' in data) && (data.childId is string) && data.childId == kidId)
      || (
        ('kidIds' in data)
        && (data.kidIds is list)
        && (kidId in data.kidIds)
      )
    )
  );
}

function teacherCanAccessProgressData(kidId, data) {
  return isTeacher()
    && ('enrollmentId' in data)
    && (data.enrollmentId is string)
    && data.enrollmentId.size() > 0
    && ('courseId' in data)
    && (data.courseId is string)
    && data.courseId.size() > 0
    && enrollmentExists(data.enrollmentId)
    && teacherOwnsCanonicalDoc(enrollmentDoc(data.enrollmentId))
    && enrollmentBelongsToKidCanonicalFirst(enrollmentDoc(data.enrollmentId), kidId)
    && ('courseId' in enrollmentDoc(data.enrollmentId))
    && (enrollmentDoc(data.enrollmentId).courseId is string)
    && enrollmentDoc(data.enrollmentId).courseId == data.courseId;
}

function teacherProgressIdentityUnchanged() {
  return ('enrollmentId' in resource.data)
    && ('courseId' in resource.data)
    && ('enrollmentId' in request.resource.data)
    && ('courseId' in request.resource.data)
    && request.resource.data.enrollmentId == resource.data.enrollmentId
    && request.resource.data.courseId == resource.data.courseId;
}
""",
)

replace_once(
    'firestore.rules',
    """    match /students/{kidId}/progress/{topicId} {
      allow read: if isAdmin()
        || (isTeacher() && isTeacherOfKid(kidId))
        || isParentOfKid(kidId);

      allow create, update, delete: if isAdmin()
        || (isTeacher() && isTeacherOfKid(kidId));
    }
""",
    """    match /students/{kidId}/progress/{topicId} {
      allow read: if isAdmin()
        || teacherCanAccessProgressData(kidId, resource.data)
        || isParentOfKid(kidId);

      allow create: if isAdmin()
        || teacherCanAccessProgressData(kidId, request.resource.data);

      allow update: if isAdmin()
        || (
          teacherCanAccessProgressData(kidId, resource.data)
          && teacherProgressIdentityUnchanged()
          && teacherCanAccessProgressData(kidId, request.resource.data)
        );

      // Preserve the pre-Brick-1 teacher delete capability, but scope it to the
      // canonical enrollment instead of child-level teacher aliases.
      allow delete: if isAdmin()
        || teacherCanAccessProgressData(kidId, resource.data);
    }
""",
)

replace_once(
    'src/hooks/useKidTopicProgress.ts',
    """export function useKidTopicProgress(
  kidId: string | null | undefined,
  courseId?: string | null,
  enabled = true,
): UseKidTopicProgressResult {
""",
    """export function useKidTopicProgress(
  kidId: string | null | undefined,
  courseId?: string | null,
  enabled = true,
  enrollmentId?: string | null,
): UseKidTopicProgressResult {
""",
)

replace_once(
    'src/hooks/useKidTopicProgress.ts',
    """    const normalizedCourseId = String(courseId || '').trim();
    const requiresCourseScope = courseId !== undefined;
    if (!kidId || !enabled || (requiresCourseScope && !normalizedCourseId)) {
""",
    """    const normalizedCourseId = String(courseId || '').trim();
    const normalizedEnrollmentId = String(enrollmentId || '').trim();
    const requiresCourseScope = courseId !== undefined;
    const requiresEnrollmentScope = enrollmentId !== undefined;
    if (
      !kidId
      || !enabled
      || (requiresCourseScope && !normalizedCourseId)
      || (requiresEnrollmentScope && !normalizedEnrollmentId)
    ) {
""",
)

replace_once(
    'src/hooks/useKidTopicProgress.ts',
    """      const progressQuery = normalizedCourseId
        ? query(progressCol, where('courseId', '==', normalizedCourseId))
        : progressCol;
""",
    """      const progressQuery = normalizedCourseId
        ? normalizedEnrollmentId
          ? query(
              progressCol,
              where('courseId', '==', normalizedCourseId),
              where('enrollmentId', '==', normalizedEnrollmentId),
            )
          : query(progressCol, where('courseId', '==', normalizedCourseId))
        : progressCol;
""",
)

replace_once(
    'src/hooks/useKidTopicProgress.ts',
    """  }, [courseId, enabled, kidId]);
""",
    """  }, [courseId, enabled, enrollmentId, kidId]);
""",
)

replace_once(
    'src/components/teacher/StudentTopicProgressEditorCanonicalV2.tsx',
    """  } = useKidTopicProgress(kidId, selectedCourseId || null, Boolean(selectedCourseId));
""",
    """  } = useKidTopicProgress(
    kidId,
    selectedCourseId || null,
    Boolean(selectedCourseId && enrollmentId),
    enrollmentId ?? null,
  );
""",
)

hook_test = Path('src/tests/hooks/useKidTopicProgress.spec.tsx')
hook_test_text = hook_test.read_text()
hook_marker = "  it('does not fetch until a course is selected', async () => {\n"
if hook_test_text.count(hook_marker) != 1:
    raise SystemExit('useKidTopicProgress.spec.tsx: insertion marker mismatch')
hook_block = """  it('scopes explicit teacher reads by both courseId and enrollmentId', async () => {
    renderHook(() => useKidTopicProgress(
      'kid-1',
      'phonics-foundations',
      true,
      'enrollment-1',
    ));

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    expect(whereMock).toHaveBeenCalledWith('courseId', '==', 'phonics-foundations');
    expect(whereMock).toHaveBeenCalledWith('enrollmentId', '==', 'enrollment-1');
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'collection' }),
      expect.objectContaining({ kind: 'where', parts: ['courseId', '==', 'phonics-foundations'] }),
      expect.objectContaining({ kind: 'where', parts: ['enrollmentId', '==', 'enrollment-1'] }),
    );
  });

"""
hook_test.write_text(hook_test_text.replace(hook_marker, hook_block + hook_marker, 1))

replace_once(
    'scripts/lib/teacher-progress-enrollment-audit.mjs',
    """  return {
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
""",
    """  return {
    totalExamined: relevant.length,
    withEnrollmentId: withEnrollmentId.length,
    missingEnrollmentId: missingEnrollmentId.length,
    uniqueMapping: relevant.filter((row) => row.kind === 'migratable_unique').length,
    ambiguous: relevant.filter((row) => row.kind === 'ambiguous').length,
    conflicting: relevant.filter((row) => conflictingKinds.has(row.kind)).length,
    conflictingChild: relevant.filter((row) => row.kind === 'conflicting_enrollment_child').length,
    conflictingCourse: relevant.filter((row) => row.kind === 'conflicting_enrollment_course').length,
    missingEnrollment: relevant.filter((row) => row.kind === 'conflicting_enrollment_missing').length,
    unmapped: relevant.filter((row) => row.kind === 'unmapped').length,
    noMatch: relevant.filter((row) => row.kind === 'unmapped').length,
    missingCourseId: relevant.filter((row) => row.kind === 'missing_course_id').length,
    alreadyCorrect: relevant.filter((row) => row.kind === 'already_correct').length,
    wouldUpdate: relevant.filter((row) => row.kind === 'migratable_unique').length,
  };
""",
)

replace_once(
    'scripts/audit-teacher-progress-enrollments.mjs',
    "import { getFirestore, FieldValue } from 'firebase-admin/firestore';\n",
    "import { getFirestore } from 'firebase-admin/firestore';\n",
)
replace_once(
    'scripts/audit-teacher-progress-enrollments.mjs',
    """      // Intentionally do not touch updatedAt/mastery/status. This is authorization metadata only.
      tx.update(source.ref, {
        enrollmentId: candidate.targetEnrollmentId,
        authorizationEnrollmentBackfilledAt: FieldValue.serverTimestamp(),
        authorizationEnrollmentBackfillSource: 'brick1_teacher_progress_authorization',
      });
""",
    """      // Intentionally update only authorization identity. Do not touch updatedAt,
      // mastery, lesson status, completion metadata, or parent-facing projection fields.
      tx.update(source.ref, {
        enrollmentId: candidate.targetEnrollmentId,
      });
""",
)

replace_once(
    'scripts/test/teacher-progress-enrollment-audit.spec.mjs',
    """      conflicting: 1,
      unmapped: 1,
      missingCourseId: 1,
""",
    """      conflicting: 1,
      conflictingChild: 0,
      conflictingCourse: 1,
      missingEnrollment: 0,
      unmapped: 1,
      noMatch: 1,
      missingCourseId: 1,
""",
)

deploy = Path('.github/workflows/deploy.yml')
deploy_text = deploy.read_text()
java_marker = '      - name: Setup Java for Firestore emulator\n'
if deploy_text.count(java_marker) != 1:
    raise SystemExit('deploy.yml: classifier insertion marker mismatch')
classifier_step = """      - name: Run teacher progress enrollment audit classifier tests
        run: npx vitest run scripts/test/teacher-progress-enrollment-audit.spec.mjs

"""
deploy_text = deploy_text.replace(java_marker, classifier_step + java_marker, 1)
old_rules = 'src/tests/firestore/teacherIdentity.rules.spec.ts src/tests/firestore/childCourseProgress.rules.spec.ts"'
new_rules = 'src/tests/firestore/teacherIdentity.rules.spec.ts src/tests/firestore/teacherProgressAuthorization.rules.spec.ts src/tests/firestore/childCourseProgress.rules.spec.ts"'
if deploy_text.count(old_rules) != 1:
    raise SystemExit('deploy.yml: Firestore rule command marker mismatch')
deploy.write_text(deploy_text.replace(old_rules, new_rules, 1))
