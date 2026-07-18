// @vitest-environment node

import * as admin from 'firebase-admin';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { isSessionCanonicalForEnrollment } from '../../lib/sessionScheduleIntegrity';
import {
  adminDb,
  callFunction,
  clearEmulatorState,
  disposeHarness,
  expectCallableErrorCode,
  initializeAdminClient,
  seedCanonicalFixtures,
  signInFixtureUser,
  signOutFixtureUser,
  waitForDocument,
} from './enrollmentIntegrityHarness';

type FixtureIds = Awaited<ReturnType<typeof seedCanonicalFixtures>>;

const mondayPhonicsSchedule = {
  timezone: 'Asia/Kolkata',
  weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
  weeksAhead: 4,
};
const tuesdayGrammarSchedule = {
  timezone: 'Asia/Kolkata',
  weeklySlots: [{ weekday: 2, time: '18:00', durationMinutes: 40 }],
  weeksAhead: 4,
};

let fixtureSequence = 0;
let ids: FixtureIds;

async function createEnrollment(args: {
  operationId: string;
  courseId: string;
  teacherId?: string;
  schedule?: Record<string, unknown>;
  creditsTotal?: number;
}): Promise<string> {
  const result = await callFunction<Record<string, unknown>, { enrollmentId: string }>('createEnrollment', {
    operationId: args.operationId,
    kidId: ids.kidId,
    courseId: args.courseId,
    teacherId: args.teacherId || ids.teacherAId,
    schedule: args.schedule || mondayPhonicsSchedule,
    creditsTotal: args.creditsTotal ?? 12,
    ratePerSession: 500,
    teacherPayPerSession: 250,
    classesStartDate: '2026-08-03',
  });
  return result.enrollmentId;
}

async function setEnrollmentStatus(enrollmentId: string, status: string): Promise<void> {
  await callFunction('setEnrollmentStatus', { enrollmentId, status, reason: `emulator-${status}` });
}

async function sessionsForEnrollment(enrollmentId: string) {
  return adminDb.collection('classSessions').where('enrollmentId', '==', enrollmentId).get();
}

function validEnrollmentPayload(overrides: Record<string, unknown> = {}) {
  return {
    operationId: `authorization-${fixtureSequence}`,
    kidId: ids.kidId,
    courseId: ids.phonicsCourseId,
    creditsTotal: 4,
    ratePerSession: 500,
    teacherPayPerSession: 250,
    ...overrides,
  };
}

beforeEach(async () => {
  await clearEmulatorState();
  await initializeAdminClient();
  fixtureSequence += 1;
  ids = await seedCanonicalFixtures(`integrity-${fixtureSequence}`);
});

afterAll(async () => {
  await clearEmulatorState();
  await disposeHarness();
});

describe('createEnrollment authorization and validation', () => {
  it('rejects unauthenticated callers with a structured code', async () => {
    await signOutFixtureUser();
    await expect(callFunction('createEnrollment', validEnrollmentPayload()))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'unauthenticated');
        return true;
      });
  });

  it('rejects authenticated users who are neither admins nor Learning Partners', async () => {
    await signInFixtureUser({ uid: `teacher-${fixtureSequence}`, role: 'teacher' });
    await expect(callFunction('createEnrollment', validEnrollmentPayload()))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'permission-denied');
        return true;
      });
  });

  it('allows the assigned Learning Partner and records the authenticated actor', async () => {
    const lpId = `assigned-lp-${fixtureSequence}`;
    await adminDb.collection('kids').doc(ids.kidId).update({ lpId, assignedLPs: [lpId] });
    await signInFixtureUser({ uid: lpId, role: 'learningPartner' });
    const result = await callFunction<Record<string, unknown>, { enrollmentId: string }>(
      'createEnrollment',
      validEnrollmentPayload(),
    );
    const enrollment = await adminDb.collection('enrollments').doc(result.enrollmentId).get();
    expect(enrollment.data()).toMatchObject({
      createdBy: lpId,
      lpId,
      kidId: ids.kidId,
      courseId: ids.phonicsCourseId,
    });
  });

  it('rejects an unassigned Learning Partner', async () => {
    await signInFixtureUser({ uid: `unassigned-lp-${fixtureSequence}`, role: 'learning-partner' });
    await expect(callFunction('createEnrollment', validEnrollmentPayload()))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'permission-denied');
        return true;
      });
  });

  it.each([
    [{ ratePerSession: 0 }, 'invalid-argument'],
    [{ ratePerSession: 'not-a-number' }, 'invalid-argument'],
    [{ teacherPayPerSession: -1 }, 'invalid-argument'],
  ])('rejects invalid monetary input %j', async (override, code) => {
    await expect(callFunction('createEnrollment', validEnrollmentPayload(override)))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, code);
        return true;
      });
  });

  it('rejects missing canonical students and courses with structured codes', async () => {
    await expect(callFunction('createEnrollment', validEnrollmentPayload({
      operationId: `missing-student-${fixtureSequence}`,
      kidId: 'missing-kid',
    }))).rejects.toSatisfy((error: unknown) => {
      expectCallableErrorCode(error, 'not-found');
      return true;
    });
    await expect(callFunction('createEnrollment', validEnrollmentPayload({
      operationId: `missing-course-${fixtureSequence}`,
      courseId: 'missing-course',
    }))).rejects.toSatisfy((error: unknown) => {
      expectCallableErrorCode(error, 'not-found');
      return true;
    });
  });

  it('rejects an inactive course before creating any enrollment writes', async () => {
    await adminDb.collection('courses').doc(ids.phonicsCourseId).update({ status: 'inactive' });
    await expect(callFunction('createEnrollment', validEnrollmentPayload()))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'failed-precondition');
        return true;
      });
    const enrollments = await adminDb.collection('enrollments').get();
    const operations = await adminDb.collection('enrollmentCreationOperations').get();
    expect(enrollments.empty).toBe(true);
    expect(operations.empty).toBe(true);
  });
});

describe('Firestore Emulator enrollment uniqueness and simultaneous courses', () => {
  it('allows different courses and preserves independent teacher and schedule identity', async () => {
    const phonicsId = await createEnrollment({
      operationId: 'different-courses-phonics',
      courseId: ids.phonicsCourseId,
      teacherId: ids.teacherAId,
      schedule: mondayPhonicsSchedule,
    });
    const grammarId = await createEnrollment({
      operationId: 'different-courses-grammar',
      courseId: ids.grammarCourseId,
      teacherId: ids.teacherBId,
      schedule: tuesdayGrammarSchedule,
    });

    expect(phonicsId).not.toBe(grammarId);
    const [phonics, grammar] = await Promise.all([
      adminDb.collection('enrollments').doc(phonicsId).get(),
      adminDb.collection('enrollments').doc(grammarId).get(),
    ]);
    expect(phonics.data()).toMatchObject({ courseId: ids.phonicsCourseId, teacherId: ids.teacherAId, status: 'active' });
    expect(grammar.data()).toMatchObject({ courseId: ids.grammarCourseId, teacherId: ids.teacherBId, status: 'active' });
    expect(phonics.data()?.schedule).toEqual(mondayPhonicsSchedule);
    expect(grammar.data()?.schedule).toEqual(tuesdayGrammarSchedule);
  });

  it('rejects duplicate active and paused same-course enrollments', async () => {
    const firstId = await createEnrollment({ operationId: 'duplicate-first', courseId: ids.phonicsCourseId });
    await expect(createEnrollment({ operationId: 'duplicate-active', courseId: ids.phonicsCourseId }))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'already-exists');
        return true;
      });
    await setEnrollmentStatus(firstId, 'paused');
    await expect(createEnrollment({ operationId: 'duplicate-paused', courseId: ids.phonicsCourseId }))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'already-exists');
        return true;
      });

    const enrollments = await adminDb.collection('enrollments')
      .where('kidId', '==', ids.kidId).where('courseId', '==', ids.phonicsCourseId).get();
    expect(enrollments.docs.map((row) => row.id)).toEqual([firstId]);
    const key = await adminDb.collection('operationalEnrollmentKeys')
      .where('enrollmentId', '==', firstId).get();
    expect(key.size).toBe(1);
  });

  it('releases completed history and permits intentional same-course reenrollment', async () => {
    const historicalId = await createEnrollment({ operationId: 'reenroll-history', courseId: ids.phonicsCourseId });
    await setEnrollmentStatus(historicalId, 'completed');
    const currentId = await createEnrollment({ operationId: 'reenroll-current', courseId: ids.phonicsCourseId });

    expect(currentId).not.toBe(historicalId);
    const [historical, current] = await Promise.all([
      adminDb.collection('enrollments').doc(historicalId).get(),
      adminDb.collection('enrollments').doc(currentId).get(),
    ]);
    expect(historical.data()?.status).toBe('completed');
    expect(current.data()?.status).toBe('active');
  });

  it('serializes concurrent duplicate creation through the uniqueness transaction', async () => {
    const results = await Promise.allSettled([
      createEnrollment({ operationId: 'concurrent-a', courseId: ids.phonicsCourseId }),
      createEnrollment({ operationId: 'concurrent-b', courseId: ids.phonicsCourseId }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const successfulId = (results.find((result) => result.status === 'fulfilled') as PromiseFulfilledResult<string>).value;
    const enrollments = await adminDb.collection('enrollments')
      .where('kidId', '==', ids.kidId).where('courseId', '==', ids.phonicsCourseId).get();
    expect(enrollments.size).toBe(1);
    const keys = await adminDb.collection('operationalEnrollmentKeys').where('enrollmentId', '==', successfulId).get();
    expect(keys.size).toBe(1);
  });

  it('keeps generated same-time sessions for different courses distinct', async () => {
    const sameTimeSchedule = {
      timezone: 'Asia/Kolkata',
      weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
      weeksAhead: 2,
    };
    const phonicsId = await createEnrollment({
      operationId: 'same-time-phonics', courseId: ids.phonicsCourseId, schedule: sameTimeSchedule,
    });
    const grammarId = await createEnrollment({
      operationId: 'same-time-grammar', courseId: ids.grammarCourseId, schedule: sameTimeSchedule,
      teacherId: ids.teacherBId,
    });
    await Promise.all([
      callFunction('createSessionsFromSchedule', { enrollmentId: phonicsId, weeksAhead: 2, startDate: '2026-08-03' }),
      callFunction('createSessionsFromSchedule', { enrollmentId: grammarId, weeksAhead: 2, startDate: '2026-08-03' }),
    ]);

    const [phonicsSessions, grammarSessions] = await Promise.all([
      sessionsForEnrollment(phonicsId), sessionsForEnrollment(grammarId),
    ]);
    expect(phonicsSessions.size).toBeGreaterThan(0);
    expect(grammarSessions.size).toBeGreaterThan(0);
    const phonicsFirst = phonicsSessions.docs[0];
    const matchingGrammar = grammarSessions.docs.find((row) =>
      row.data().date === phonicsFirst.data().date && row.data().startTime === phonicsFirst.data().startTime);
    expect(matchingGrammar).toBeDefined();
    expect(matchingGrammar?.id).not.toBe(phonicsFirst.id);
    expect(phonicsFirst.data()).toMatchObject({ enrollmentId: phonicsId, courseId: ids.phonicsCourseId });
    expect(matchingGrammar?.data()).toMatchObject({ enrollmentId: grammarId, courseId: ids.grammarCourseId });
  });
});

describe('Firestore Emulator course transition state machine', () => {
  async function seedTransitionContext(operationId: string) {
    const foundationsId = await createEnrollment({
      operationId: `${operationId}-foundations`,
      courseId: ids.foundationsCourseId,
      teacherId: ids.teacherAId,
      schedule: mondayPhonicsSchedule,
      creditsTotal: 20,
    });
    const grammarId = await createEnrollment({
      operationId: `${operationId}-grammar`,
      courseId: ids.grammarCourseId,
      teacherId: ids.teacherBId,
      schedule: tuesdayGrammarSchedule,
      creditsTotal: 9,
    });
    const batch = adminDb.batch();
    batch.set(adminDb.collection('classSessions').doc(`${operationId}-historical`), {
      enrollmentId: foundationsId,
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      courseId: ids.foundationsCourseId,
      teacherId: ids.teacherAId,
      date: '2026-06-01',
      startTime: '17:00',
      status: 'completed',
      attendance: { [ids.kidId]: { status: 'present' } },
      billedAt: admin.firestore.Timestamp.fromDate(new Date('2026-06-01T12:00:00Z')),
    });
    batch.set(adminDb.collection('classSessions').doc(`${operationId}-future`), {
      enrollmentId: foundationsId,
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      courseId: ids.foundationsCourseId,
      teacherId: ids.teacherAId,
      date: '2026-08-03',
      startTime: '17:00',
      durationMinutes: 35,
      startAt: admin.firestore.Timestamp.fromDate(new Date('2026-08-03T11:30:00Z')),
      status: 'scheduled',
      source: 'schedule_generator',
    });
    batch.set(adminDb.collection('classSessions').doc(`${operationId}-protected`), {
      enrollmentId: foundationsId,
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      courseId: ids.foundationsCourseId,
      teacherId: ids.teacherAId,
      date: '2026-08-10',
      startTime: '17:00',
      startAt: admin.firestore.Timestamp.fromDate(new Date('2026-08-10T11:30:00Z')),
      status: 'scheduled',
      locked: true,
    });
    batch.set(adminDb.collection('classSessions').doc(`${operationId}-grammar-session`), {
      enrollmentId: grammarId,
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      courseId: ids.grammarCourseId,
      teacherId: ids.teacherBId,
      date: '2026-08-04',
      startTime: '18:00',
      status: 'scheduled',
      creditsSnapshot: 9,
    });
    await batch.commit();
    return { foundationsId, grammarId };
  }

  const transitionInput = (operationId: string, foundationsId: string) => ({
    operationId,
    oldEnrollmentId: foundationsId,
    newCourseId: ids.earlyCourseId,
    newTeacherId: ids.teacherBId,
    newSchedule: {
      timezone: 'Asia/Kolkata',
      weeklySlots: [{ weekday: 3, time: '19:00', durationMinutes: 40 }],
      weeksAhead: 3,
    },
    classesStartDate: '2026-08-05',
    creditsTotal: 16,
    ratePerSession: 600,
    teacherPayPerSession: 300,
    reason: 'Completed Foundations in emulator validation',
  });

  it('transitions Foundations, preserves protected history, and isolates Grammar', async () => {
    const operationId = 'transition-complete';
    const { foundationsId, grammarId } = await seedTransitionContext(operationId);
    const result = await callFunction<Record<string, unknown>, { state: string; newEnrollmentId: string }>(
      'transitionEnrollmentCourse', transitionInput(operationId, foundationsId),
    );

    expect(result.state).toBe('complete');
    const [foundations, early, grammar, future, historical, protectedRow, grammarSession] = await Promise.all([
      adminDb.collection('enrollments').doc(foundationsId).get(),
      adminDb.collection('enrollments').doc(result.newEnrollmentId).get(),
      adminDb.collection('enrollments').doc(grammarId).get(),
      adminDb.collection('classSessions').doc(`${operationId}-future`).get(),
      adminDb.collection('classSessions').doc(`${operationId}-historical`).get(),
      adminDb.collection('classSessions').doc(`${operationId}-protected`).get(),
      adminDb.collection('classSessions').doc(`${operationId}-grammar-session`).get(),
    ]);
    expect(foundations.data()).toMatchObject({ status: 'completed', nextEnrollmentId: result.newEnrollmentId });
    expect(foundations.data()?.completedAt).toBeDefined();
    expect(early.data()).toMatchObject({
      status: 'active', courseId: ids.earlyCourseId, teacherId: ids.teacherBId, previousEnrollmentId: foundationsId,
    });
    expect(future.data()?.status).toBe('cancelled');
    expect(historical.data()).toMatchObject({ status: 'completed', attendance: { [ids.kidId]: { status: 'present' } } });
    expect(protectedRow.data()).toMatchObject({ status: 'scheduled', locked: true });
    expect(grammar.data()).toMatchObject({ status: 'active', creditsRemaining: 9, teacherId: ids.teacherBId });
    expect(grammarSession.data()).toMatchObject({ status: 'scheduled', creditsSnapshot: 9 });
    const earlySessions = await sessionsForEnrollment(result.newEnrollmentId);
    expect(earlySessions.size).toBeGreaterThan(0);
    earlySessions.docs.forEach((row) => expect(row.data()).toMatchObject({
      enrollmentId: result.newEnrollmentId, courseId: ids.earlyCourseId, teacherId: ids.teacherBId,
    }));
    const transition = await adminDb.collection('enrollmentCourseTransitions').doc(operationId).get();
    expect(transition.data()?.state).toBe('complete');
    const audits = await adminDb.collection('auditLogs').where('operationId', '==', operationId).get();
    expect(audits.docs.some((row) => row.data().type === 'enrollment_course_transition_completed')).toBe(true);
  });

  it('replays a completed transition idempotently without duplicate enrollment, sessions, or audit', async () => {
    const operationId = 'transition-replay';
    const { foundationsId } = await seedTransitionContext(operationId);
    const input = transitionInput(operationId, foundationsId);
    const first = await callFunction<Record<string, unknown>, { newEnrollmentId: string }>('transitionEnrollmentCourse', input);
    const sessionsBefore = await sessionsForEnrollment(first.newEnrollmentId);
    const auditsBefore = await adminDb.collection('auditLogs').where('operationId', '==', operationId).get();
    const second = await callFunction<Record<string, unknown>, { newEnrollmentId: string }>('transitionEnrollmentCourse', input);
    const sessionsAfter = await sessionsForEnrollment(first.newEnrollmentId);
    const auditsAfter = await adminDb.collection('auditLogs').where('operationId', '==', operationId).get();
    const earlyEnrollments = await adminDb.collection('enrollments')
      .where('kidId', '==', ids.kidId).where('courseId', '==', ids.earlyCourseId).get();

    expect(second.newEnrollmentId).toBe(first.newEnrollmentId);
    expect(earlyEnrollments.size).toBe(1);
    expect(sessionsAfter.size).toBe(sessionsBefore.size);
    expect(auditsAfter.size).toBe(auditsBefore.size);
  });

  it('resumes a valid old_sessions_reconciled persisted state', async () => {
    const operationId = 'transition-partial';
    const foundationsId = await createEnrollment({
      operationId: `${operationId}-old`, courseId: ids.foundationsCourseId, schedule: mondayPhonicsSchedule,
    });
    await setEnrollmentStatus(foundationsId, 'completed');
    const newKeyId = `${encodeURIComponent(ids.kidId)}__${encodeURIComponent(ids.earlyCourseId)}`;
    await Promise.all([
      adminDb.collection('operationalEnrollmentKeys').doc(newKeyId).set({
        kidId: ids.kidId,
        courseId: ids.earlyCourseId,
        reservationOperationId: operationId,
        state: 'reserved',
      }),
      adminDb.collection('enrollmentCourseTransitions').doc(operationId).set({
        operationId,
        oldEnrollmentId: foundationsId,
        oldCourseId: ids.foundationsCourseId,
        kidId: ids.kidId,
        newCourseId: ids.earlyCourseId,
        newTeacherId: ids.teacherBId,
        newSchedule: transitionInput(operationId, foundationsId).newSchedule,
        classesStartDate: '2026-08-05',
        ratePerSession: 600,
        teacherPayPerSession: 300,
        creditsTotal: 16,
        currency: 'INR',
        billingCycle: 'monthly',
        reason: 'Completed Foundations in emulator validation',
        state: 'old_sessions_reconciled',
        retryable: true,
      }),
    ]);

    const result = await callFunction<Record<string, unknown>, { state: string; newEnrollmentId: string }>(
      'transitionEnrollmentCourse', transitionInput(operationId, foundationsId),
    );
    expect(result.state).toBe('complete');
    expect((await adminDb.collection('enrollments').doc(result.newEnrollmentId).get()).data()).toMatchObject({
      courseId: ids.earlyCourseId, previousEnrollmentId: foundationsId, status: 'active',
    });
    expect((await adminDb.collection('operationalEnrollmentKeys').doc(newKeyId).get()).data()?.enrollmentId)
      .toBe(result.newEnrollmentId);
  });

  it('rejects an existing operational target before completing Foundations', async () => {
    const foundationsId = await createEnrollment({ operationId: 'blocked-old', courseId: ids.foundationsCourseId });
    const existingEarlyId = await createEnrollment({ operationId: 'blocked-existing', courseId: ids.earlyCourseId });
    await expect(callFunction('transitionEnrollmentCourse', transitionInput('blocked-transition', foundationsId)))
      .rejects.toSatisfy((error: unknown) => {
        expectCallableErrorCode(error, 'already-exists');
        return true;
      });
    expect((await adminDb.collection('enrollments').doc(foundationsId).get()).data()?.status).toBe('active');
    expect((await adminDb.collection('enrollments').doc(existingEarlyId).get()).data()?.status).toBe('active');
    const earlyEnrollments = await adminDb.collection('enrollments')
      .where('kidId', '==', ids.kidId).where('courseId', '==', ids.earlyCourseId).get();
    expect(earlyEnrollments.size).toBe(1);
  });
});

describe('Firestore Emulator manual-session lifecycle', () => {
  async function createManualContext() {
    const enrollmentId = await createEnrollment({ operationId: 'manual-enrollment', courseId: ids.phonicsCourseId });
    const input = {
      enrollmentId,
      date: '2026-08-03',
      startTime: '12:00',
      durationMins: 35,
      reason: 'Approved one-off emulator validation',
    };
    return { enrollmentId, input };
  }

  it('creates an approved canonical one-off with audit metadata and idempotent identity', async () => {
    const { enrollmentId, input } = await createManualContext();
    const first = await callFunction<typeof input, { sessionId: string; alreadyExisted: boolean }>('createAdminManualSession', input);
    const second = await callFunction<typeof input, { sessionId: string; alreadyExisted: boolean }>('createAdminManualSession', input);
    const [session, enrollment] = await Promise.all([
      adminDb.collection('classSessions').doc(first.sessionId).get(),
      adminDb.collection('enrollments').doc(enrollmentId).get(),
    ]);
    expect(second).toMatchObject({ sessionId: first.sessionId, alreadyExisted: true });
    expect(session.data()).toMatchObject({
      enrollmentId, kidId: ids.kidId, courseId: ids.phonicsCourseId, teacherId: ids.teacherAId,
      manualSessionState: 'approved', status: 'scheduled', manualSessionReason: input.reason,
    });
    expect(session.data()?.approvedAt).toBeDefined();
    expect(isSessionCanonicalForEnrollment(
      { id: session.id, ...session.data() } as Record<string, unknown>,
      { id: enrollment.id, ...enrollment.data() } as Record<string, unknown>,
    )).toBe(true);
    const audits = await adminDb.collection('auditLogs').where('sessionId', '==', first.sessionId).get();
    expect(audits.docs.filter((row) => row.data().type === 'admin_manual_session_created')).toHaveLength(1);
  });

  it('cancels only the James-style 12:00 one-off and preserves recurring rows', async () => {
    const { enrollmentId, input } = await createManualContext();
    const manual = await callFunction<typeof input, { sessionId: string }>('createAdminManualSession', input);
    await Promise.all([
      adminDb.collection('classSessions').doc('james-recurring-1115').set({
        enrollmentId, kidId: ids.kidId, kidIds: [ids.kidId], courseId: ids.phonicsCourseId,
        teacherId: ids.teacherAId, date: input.date, startTime: '11:15', status: 'scheduled',
      }),
      adminDb.collection('classSessions').doc('james-recurring-1150').set({
        enrollmentId, kidId: ids.kidId, kidIds: [ids.kidId], courseId: ids.phonicsCourseId,
        teacherId: ids.teacherAId, date: input.date, startTime: '11:50', status: 'scheduled',
      }),
    ]);
    await callFunction('cancelAdminManualSession', { sessionId: manual.sessionId, reason: 'One-off no longer required' });

    const [cancelled, recurring1115, recurring1150] = await Promise.all([
      adminDb.collection('classSessions').doc(manual.sessionId).get(),
      adminDb.collection('classSessions').doc('james-recurring-1115').get(),
      adminDb.collection('classSessions').doc('james-recurring-1150').get(),
    ]);
    expect(cancelled.data()).toMatchObject({
      status: 'cancelled', manualSessionState: 'cancelled',
      manualSessionCancellationReason: 'One-off no longer required',
    });
    expect(cancelled.data()?.cancelledAt).toBeDefined();
    expect(recurring1115.data()?.status).toBe('scheduled');
    expect(recurring1150.data()?.status).toBe('scheduled');
    expect((await sessionsForEnrollment(enrollmentId)).docs.filter((row) => row.data().status === 'scheduled')).toHaveLength(2);
  });

  it('refuses to cancel a protected manual session without rewriting it', async () => {
    const { input } = await createManualContext();
    const manual = await callFunction<typeof input, { sessionId: string }>('createAdminManualSession', input);
    await adminDb.collection('classSessions').doc(manual.sessionId).set({
      attendance: { [ids.kidId]: { status: 'present' } },
      locked: true,
    }, { merge: true });
    const before = (await adminDb.collection('classSessions').doc(manual.sessionId).get()).data();
    await expect(callFunction('cancelAdminManualSession', {
      sessionId: manual.sessionId, reason: 'Unsafe cancellation attempt',
    })).rejects.toSatisfy((error: unknown) => {
      expectCallableErrorCode(error, 'failed-precondition');
      return true;
    });
    const after = (await adminDb.collection('classSessions').doc(manual.sessionId).get()).data();
    expect(after?.status).toBe(before?.status);
    expect(after?.manualSessionState).toBe(before?.manualSessionState);
    expect(after?.manualSessionCancellationReason).toBeUndefined();
  });
});

describe('Firestore Emulator exact completion and financial identity', () => {
  it('decrements only exact Phonics credits and writes exact finance identities', async () => {
    const phonicsId = await createEnrollment({
      operationId: 'finance-phonics', courseId: ids.phonicsCourseId, creditsTotal: 8,
    });
    const grammarId = await createEnrollment({
      operationId: 'finance-grammar', courseId: ids.grammarCourseId, teacherId: ids.teacherBId,
      schedule: tuesdayGrammarSchedule, creditsTotal: 11,
    });
    const sessionId = 'exact-phonics-completion';
    await adminDb.collection('classSessions').doc(sessionId).set({
      enrollmentId: phonicsId,
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      parentId: ids.parentId,
      courseId: ids.phonicsCourseId,
      teacherId: ids.teacherAId,
      date: '2026-07-18',
      startTime: '10:00',
      durationMinutes: 35,
      status: 'scheduled',
      feeAmount: 500,
    });
    await callFunction('onSessionComplete', {
      sessionId,
      attendance: { [ids.kidId]: { status: 'present' } },
    });
    const charge = await waitForDocument('billingCharges', sessionId);
    const earning = await waitForDocument('teacherEarnings', sessionId);
    const [phonics, grammar] = await Promise.all([
      adminDb.collection('enrollments').doc(phonicsId).get(),
      adminDb.collection('enrollments').doc(grammarId).get(),
    ]);
    expect(phonics.data()).toMatchObject({ creditsRemaining: 7, creditsUsed: 1 });
    expect(grammar.data()).toMatchObject({ creditsRemaining: 11, creditsUsed: 0 });
    expect(charge).toMatchObject({
      sessionId, enrollmentId: phonicsId, courseId: ids.phonicsCourseId,
      kidId: ids.kidId, teacherId: ids.teacherAId, parentId: ids.parentId,
    });
    expect(earning).toMatchObject({
      sessionId, enrollmentId: phonicsId, courseId: ids.phonicsCourseId,
      kidId: ids.kidId, teacherId: ids.teacherAId, parentId: ids.parentId,
    });
  });

  it('fails ambiguous legacy completion without deducting either enrollment', async () => {
    const firstRef = adminDb.collection('enrollments').doc('legacy-phonics-a');
    const secondRef = adminDb.collection('enrollments').doc('legacy-phonics-b');
    await Promise.all([
      firstRef.set({
        kidId: ids.kidId, studentId: ids.kidId, kidIds: [ids.kidId], courseId: ids.phonicsCourseId,
        teacherId: ids.teacherAId, status: 'active', creditsRemaining: 5, creditsUsed: 0,
      }),
      secondRef.set({
        kidId: ids.kidId, studentId: ids.kidId, kidIds: [ids.kidId], courseId: ids.phonicsCourseId,
        teacherId: ids.teacherAId, status: 'current', creditsRemaining: 6, creditsUsed: 0,
      }),
    ]);
    const sessionId = 'ambiguous-legacy-completion';
    await adminDb.collection('classSessions').doc(sessionId).set({
      kidId: ids.kidId,
      kidIds: [ids.kidId],
      parentId: ids.parentId,
      courseId: ids.phonicsCourseId,
      teacherId: ids.teacherAId,
      date: '2026-07-18',
      startTime: '11:00',
      status: 'scheduled',
    });
    await expect(callFunction('onSessionComplete', {
      sessionId,
      attendance: { [ids.kidId]: { status: 'present' } },
    })).rejects.toSatisfy((error: unknown) => {
      expectCallableErrorCode(error, 'failed-precondition');
      return true;
    });
    const [first, second, session, charge, earning] = await Promise.all([
      firstRef.get(), secondRef.get(), adminDb.collection('classSessions').doc(sessionId).get(),
      adminDb.collection('billingCharges').doc(sessionId).get(),
      adminDb.collection('teacherEarnings').doc(sessionId).get(),
    ]);
    expect(first.data()).toMatchObject({ creditsRemaining: 5, creditsUsed: 0 });
    expect(second.data()).toMatchObject({ creditsRemaining: 6, creditsUsed: 0 });
    expect(session.data()?.creditsProcessed).not.toBe(true);
    expect(session.data()?.creditsProcessingError).toContain('multiple operational enrollments');
    expect(charge.exists).toBe(false);
    expect(earning.exists).toBe(false);
  });
});
