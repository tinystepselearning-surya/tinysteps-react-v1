// @vitest-environment node
/**
 * Stage 1 business acceptance tests. Everything below is created exclusively
 * in a Firebase Emulator Suite using a demo- project with no production resources.
 * These checks exercise actual callable Functions and Firestore triggers.
 */
import * as admin from 'firebase-admin';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {deleteApp, initializeApp, type FirebaseApp} from 'firebase/app';
import {
  connectAuthEmulator, getAuth, signInWithEmailAndPassword, type Auth,
} from 'firebase/auth';
import {
  connectFunctionsEmulator, getFunctions, httpsCallable, type Functions,
} from 'firebase/functions';

const PROJECT = 'demo-tinysteps-calendar-test';
const FIRESTORE_HOST = '127.0.0.1:8085';
const AUTH_HOST = '127.0.0.1:9099';
const FUNCTIONS_HOST = '127.0.0.1:5001';
const MONDAY = '2026-10-12';
const PAST_MONDAY = '2026-09-28';

function requireIsolatedEmulators(): void {
  for (const [key, expected] of Object.entries({
    GCLOUD_PROJECT: PROJECT,
    FIRESTORE_EMULATOR_HOST: FIRESTORE_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    FUNCTIONS_EMULATOR_HOST: FUNCTIONS_HOST,
    VIRTUAL_CALENDAR_ATTENDANCE_ENABLED: 'true',
  })) {
    if (process.env[key] !== expected) {
      throw new Error('Stage 1 will not run: ' + key +
        ' must be exactly ' + expected + ', got ' + (process.env[key] || '<unset>'));
    }
  }
  const otherProject = process.env.GOOGLE_CLOUD_PROJECT;
  if (otherProject && otherProject !== PROJECT) {
    throw new Error('Unexpected GOOGLE_CLOUD_PROJECT: ' + otherProject);
  }
  if (!PROJECT.startsWith('demo-') || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Stage 1 forbids production credentials and non-demo projects');
  }
}

// Enforce the safety contract before an SDK client is initialized.
requireIsolatedEmulators();

const adminApp = admin.initializeApp({projectId: PROJECT}, 'virtual-calendar-stage1');
const db = adminApp.firestore();
const adminAuth = adminApp.auth();
let clientApp: FirebaseApp;
let authClient: Auth;
let functionsClient: Functions;
let sequence = 0;
let ids: {teacher: string; kid: string; enrollment: string; parent: string};

const schedule = (slots: Array<{weekday:number; time:string; durationMinutes:number}> = [
  {weekday: 1, time: '17:00', durationMinutes: 35},
]) => ({timezone: 'Asia/Kolkata', weeklySlots: slots, revision: 1});

const delay = (ms:number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function eventually<T>(
  read: () => Promise<T | null>,
  label: string,
  timeoutMs = 45_000,
): Promise<T> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const result = await read();
    if (result !== null) return result;
    await delay(250);
  }
  throw new Error('Timed out waiting for emulator ' + label);
}

async function call<T extends Record<string, unknown> = Record<string, unknown>>(
  name: string, payload: Record<string, unknown>,
): Promise<T> {
  const fn = httpsCallable<Record<string, unknown>, T>(functionsClient, name);
  return (await fn(payload)).data;
}

async function ensure(date = MONDAY, startTime = '17:00', enrollmentId = ids.enrollment) {
  return call<{sessionId: string; created: boolean; ok: boolean}>(
    'ensureTeacherCalendarAttendanceSession', {enrollmentId, date, startTime});
}

async function mark(sessionId: string, status: 'present' | 'absent') {
  return call('saveTeacherSessionProgress', {
    sessionId,
    attendance: {[ids.kid]: {status}},
    meta: {attendanceOnly: true},
  });
}

async function complete(sessionId: string) {
  return call('onSessionComplete', {sessionId});
}

async function ledger(sessionId: string) {
  return Promise.all([
    db.collection('billingCharges').doc(sessionId).get(),
    db.collection('teacherEarnings').doc(sessionId).get(),
  ]);
}

async function waitForLedger(sessionId: string) {
  return eventually(async () => {
    const [charge, earning] = await ledger(sessionId);
    return charge.exists && earning.exists ? {charge, earning} : null;
  }, 'one billing charge and one teacher earning for ' + sessionId);
}

async function sessionsForCurrentChild(date = MONDAY) {
  return db.collection('classSessions')
    .where('date', '==', date).get()
    .then(snapshot => snapshot.docs.filter(d =>
      d.data().kidId === ids.kid || (d.data().kidIds || []).includes(ids.kid)));
}

beforeAll(async () => {
  // Do not use the legacy emulator harness: it names the live project.
  clientApp = initializeApp({
    projectId: PROJECT,
    apiKey: 'stage-one-emulator-only',
    authDomain: '127.0.0.1',
    appId: 'stage-one-virtual-calendar',
  }, 'stage-one-virtual-calendar');
  authClient = getAuth(clientApp);
  connectAuthEmulator(authClient, 'http://' + AUTH_HOST, {disableWarnings: true});
  functionsClient = getFunctions(clientApp, 'asia-south1');
  connectFunctionsEmulator(functionsClient, '127.0.0.1', 5001);
});

beforeEach(async () => {
  sequence += 1;
  ids = {
    teacher: 'stage1-teacher-' + sequence,
    kid: 'stage1-kid-' + sequence,
    enrollment: 'stage1-enrollment-' + sequence,
    parent: 'stage1-parent-' + sequence,
  };
  const email = ids.teacher + '@example.test';
  const password = 'Stage1EmulatorOnly!123';
  await adminAuth.createUser({uid: ids.teacher, email, password});
  await db.collection('users').doc(ids.teacher).set({
    role: 'teacher', status: 'active', email,
  });
  await db.collection('kids').doc(ids.kid).set({
    name: 'Emulator Child ' + sequence,
    fullName: 'Emulator Child ' + sequence,
    status: 'active', parentId: ids.parent, parentIds: [ids.parent],
  });
  await db.collection('enrollments').doc(ids.enrollment).set({
    kidId: ids.kid, kidIds: [ids.kid], studentId: ids.kid, childId: ids.kid,
    parentId: ids.parent, parentIds: [ids.parent],
    teacherId: ids.teacher, teacherName: 'Test Teacher',
    status: 'active',
    courseId: 'phonics-foundations', courseName: 'Phonics Foundations',
    studentName: 'Emulator Child',
    classesStartDateYmd: '2026-01-01',
    schedule: schedule(),
    ratePerSession: 400, feePerClass: 400, teacherPayPerSession: 175,
    currency: 'INR',
    creditsRemaining: 12, creditsUsed: 3, // historical counters must stay unchanged
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/emulator-only',
  });
  await signInWithEmailAndPassword(authClient, email, password);
});

afterAll(async () => {
  if (clientApp) await deleteApp(clientApp);
  await adminApp.delete();
});

describe('virtual-calendar Stage 1 business acceptance (isolated emulator)', () => {
  it('does not persist a class until attendance is requested; retries reuse one canonical session', async () => {
    expect(await sessionsForCurrentChild()).toHaveLength(0);
    const first = await ensure();
    expect(first).toMatchObject({ok: true, created: true});
    const second = await ensure();
    expect(second).toMatchObject({ok: true, created: false, sessionId: first.sessionId});
    expect(await sessionsForCurrentChild()).toHaveLength(1);
    const claimId = ids.kid + '_20261012_1700';
    expect((await db.collection('calendarAttendanceClaims').doc(claimId).get())
      .data()?.sessionId).toBe(first.sessionId);
    expect((await db.collection('classSessions').doc(first.sessionId).get())
      .data()?.attendance).toBeNull();
  });

  it('records Present once, completes idempotently, and produces exactly one charge/earning', async () => {
    const {sessionId} = await ensure();
    await mark(sessionId, 'present');
    const first = await complete(sessionId);
    expect(first.success).toBe(true);
    const amounts = await waitForLedger(sessionId);
    expect(Number(amounts.charge.data()?.amount)).toBe(400);
    expect(Number(amounts.earning.data()?.amount)).toBe(175);

    const replay = await complete(sessionId);
    expect(replay.success).toBe(true);
    expect(replay.skipped).toBe(true);
    const again = await waitForLedger(sessionId);
    expect(Number(again.charge.data()?.amount)).toBe(400);
    expect(Number(again.earning.data()?.amount)).toBe(175);
    expect(await sessionsForCurrentChild()).toHaveLength(1);
    expect((await db.collection('enrollments').doc(ids.enrollment).get()).data())
      .toMatchObject({creditsRemaining: 12, creditsUsed: 3});
    expect((await db.collection('rescheduleCredits').get()).empty).toBe(true);
  });

  it('never charges an Absent class; Present/Absent can be marked on an old date', async () => {
    const {sessionId} = await ensure(PAST_MONDAY);
    await mark(sessionId, 'absent');
    const saved = (await db.collection('classSessions').doc(sessionId).get()).data();
    expect(saved?.attendance?.[ids.kid]?.status).toBe('absent');
    expect(saved?.date).toBe(PAST_MONDAY);
    const result = await complete(sessionId);
    expect(result.success).toBe(true);
    await delay(1_500);
    const [charge, earning] = await ledger(sessionId);
    expect(charge.exists).toBe(false);
    expect(earning.exists).toBe(false);
    expect((await db.collection('enrollments').doc(ids.enrollment).get()).data())
      .toMatchObject({creditsRemaining: 12, creditsUsed: 3});
  });

  it('allows an old completed Absent class to be corrected to Present and accrued once', async () => {
    const {sessionId} = await ensure(PAST_MONDAY);
    await mark(sessionId, 'absent');
    await complete(sessionId);
    await mark(sessionId, 'present');
    const {charge, earning} = await waitForLedger(sessionId);
    expect(Number(charge.data()?.amount)).toBe(400);
    expect(Number(earning.data()?.amount)).toBe(175);
    expect(await sessionsForCurrentChild(PAST_MONDAY)).toHaveLength(1);
    expect((await db.collection('enrollments').doc(ids.enrollment).get()).data())
      .toMatchObject({creditsRemaining: 12, creditsUsed: 3});
  });

  it('reverses an unsettled Present charge and earning when corrected to Absent', async () => {
    const {sessionId} = await ensure();
    await mark(sessionId, 'present');
    await complete(sessionId);
    await waitForLedger(sessionId);
    await mark(sessionId, 'absent');
    await eventually(async () => {
      const [charge, earning] = await ledger(sessionId);
      const row = (await db.collection('classSessions').doc(sessionId).get()).data();
      return charge.data()?.status === 'void' && earning.data()?.status === 'void'
        && row?.revenueAccrued === false ? true : null;
    }, 'reversal of unbilled correction for ' + sessionId);
    expect((await db.collection('classSessions').doc(sessionId).get())
      .data()?.attendance?.[ids.kid]?.status).toBe('absent');
    expect((await db.collection('enrollments').doc(ids.enrollment).get()).data())
      .toMatchObject({creditsRemaining: 12, creditsUsed: 3});
  });

  it('reactivates the same charge and teacher earning on Present -> Absent -> Present', async () => {
    const financeConfigRef = db.collection('config').doc('finance');
    await financeConfigRef.set({
      walletClassDeductionsEnabled: true,
      walletCutoverMonthKey: '2026-01',
    });
    const walletTransactions = () =>
      db.collection('parentWallets').doc(ids.parent).collection('transactions').get();
    const walletBalance = async () =>
      (await db.collection('parentWallets').doc(ids.parent).get()).data()?.currentBalance;
    const assertLedger = async (sessionId: string, status: 'void' | 'open', cycle: number) =>
      eventually(async () => {
        const [charge, earning] = await ledger(sessionId);
        const session = (await db.collection('classSessions').doc(sessionId).get()).data();
        if (charge.data()?.status !== status ||
            earning.data()?.status !== (status === 'open' ? 'unpaid' : 'void') ||
            charge.data()?.attendanceFinanceCycle !== cycle ||
            earning.data()?.attendanceFinanceCycle !== cycle ||
            session?.revenueAccrued !== (status === 'open')) return null;
        return {charge, earning, session};
      }, status + ' canonical ledger revision ' + cycle);
    const waitWallet = (expectedCount: number, expectedBalance: number) =>
      eventually(async () => {
        const wallet = await walletTransactions();
        const balance = Number(await walletBalance());
        if (wallet.size !== expectedCount || balance !== expectedBalance) return null;
        return wallet;
      }, 'wallet entries=' + expectedCount + ' balance=' + expectedBalance);
    try {
      const {sessionId} = await ensure();
      await mark(sessionId, 'present');
      await complete(sessionId);
      await assertLedger(sessionId, 'open', 1);
      await waitWallet(1, -400);

      // Same attendance again never creates another charge or debit.
      await mark(sessionId, 'present');
      await mark(sessionId, 'present');
      await complete(sessionId);
      expect((await walletTransactions()).size).toBe(1);

      await mark(sessionId, 'absent');
      await assertLedger(sessionId, 'void', 1);
      await waitWallet(2, 0);

      await mark(sessionId, 'present');
      const restored = await assertLedger(sessionId, 'open', 2);
      expect(restored.charge.id).toBe(sessionId);
      expect(restored.earning.id).toBe(sessionId);
      expect(restored.charge.data()?.amount).toBe(400);
      expect(restored.earning.data()?.amount).toBe(175);
      await waitWallet(3, -400);
      // Teacher's monthly pay model is derived from the one canonical earning,
      // and must recover after the void -> unpaid transition.
      await eventually(async () => {
        const rollup = await db.collection('teachers').doc(ids.teacher)
          .collection('earnings').doc('2026-10').get();
        return Number(rollup.data()?.totalEarnings) === 175 ? rollup : null;
      }, 'teacher earnings monthly rollup restored to 175');
      expect((await db.collection('billingCharges')
        .where('sessionId', '==', sessionId).get()).size).toBe(1);
      expect((await db.collection('teacherEarnings')
        .where('sessionId', '==', sessionId).get()).size).toBe(1);
      expect(await sessionsForCurrentChild()).toHaveLength(1);
      expect((await db.collection('calendarAttendanceClaims').doc(ids.kid + '_20261012_1700').get())
        .data()?.sessionId).toBe(sessionId);

      await mark(sessionId, 'present');
      await complete(sessionId);
      expect((await walletTransactions()).size).toBe(3);
      const walletDocs = (await walletTransactions()).docs.map(d => d.data());
      expect(walletDocs.filter(x => x.type === 'class_deduction')).toHaveLength(2);
      expect(walletDocs.filter(x => x.type === 'class_deduction_reversal')).toHaveLength(1);
      expect((await db.collection('enrollments').doc(ids.enrollment).get()).data())
        .toMatchObject({creditsRemaining: 12, creditsUsed: 3});
    } finally {
      await financeConfigRef.set({walletClassDeductionsEnabled: false}, {merge: true});
    }
  });

  it('permits admin attendance correction to restore the same unpaid charge and earning', async () => {
    const {sessionId} = await ensure();
    await mark(sessionId, 'present');
    await complete(sessionId);
    await waitForLedger(sessionId);

    const adminUid = 'stage1-finance-admin-' + sequence;
    const email = adminUid + '@example.test';
    const password = 'Stage1EmulatorOnly!123';
    await adminAuth.createUser({uid: adminUid, email, password});
    await db.collection('users').doc(adminUid).set({
      role: 'admin', status: 'active', email, fullName: 'Finance Test Admin',
    });
    await signInWithEmailAndPassword(authClient, email, password);

    await call('adminAttendanceCorrection', {
      sessionId, kidId: ids.kid, newStatus: 'absent',
      reason: 'Verified test attendance correction',
    });
    await eventually(async () => {
      const [charge, earning] = await ledger(sessionId);
      const row = (await db.collection('classSessions').doc(sessionId).get()).data();
      return row?.revenueAccrued === false &&
        charge.data()?.status === 'void' && earning.data()?.status === 'void'
        ? true : null;
    }, 'admin attendance void and financial reversal');

    await call('adminAttendanceCorrection', {
      sessionId, kidId: ids.kid, newStatus: 'present',
      reason: 'Verified teacher-led class did happen',
    });
    await eventually(async () => {
      const [charge, earning] = await ledger(sessionId);
      const row = (await db.collection('classSessions').doc(sessionId).get()).data();
      return row?.revenueAccrued === true &&
        charge.data()?.status === 'open' &&
        charge.data()?.attendanceFinanceCycle === 2 &&
        earning.data()?.status === 'unpaid' &&
        earning.data()?.attendanceFinanceCycle === 2 ? true : null;
    }, 'admin restores single canonical charge and earning');
    expect(await sessionsForCurrentChild()).toHaveLength(1);
    expect((await db.collection('billingCharges')
      .where('sessionId', '==', sessionId).get()).size).toBe(1);
    expect((await db.collection('teacherEarnings')
      .where('sessionId', '==', sessionId).get()).size).toBe(1);
  });

  it('accepts attendance for a future date before the class starts', async () => {
    const {sessionId} = await ensure('2026-10-19');
    await mark(sessionId, 'absent');
    expect((await db.collection('classSessions').doc(sessionId).get())
      .data()?.attendance?.[ids.kid]?.status).toBe('absent');
  });

  it('serializes simultaneous create-and-save requests to one student/time authority', async () => {
    const ensures = await Promise.allSettled([ensure(), ensure()]);
    const successes = ensures.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof ensure>>> =>
      r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThan(0);
    const sessionId = successes[0].value.sessionId;
    const saved = await Promise.allSettled([
      mark(sessionId, 'present'), mark(sessionId, 'present'),
    ]);
    expect(saved.some(r => r.status === 'fulfilled')).toBe(true);
    expect(await sessionsForCurrentChild()).toHaveLength(1);
    expect((await db.collection('calendarAttendanceClaims').doc(ids.kid + '_20261012_1700').get())
      .data()?.sessionId).toBe(sessionId);
    expect((await db.collection('classSessions').doc(sessionId).get())
      .data()?.attendance?.[ids.kid]?.status).toBe('present');
    await complete(sessionId);
    await waitForLedger(sessionId);
    expect((await db.collection('billingCharges').doc(sessionId).get()).exists).toBe(true);
    expect((await db.collection('teacherEarnings').doc(sessionId).get()).exists).toBe(true);
  });

  it('reuses one legacy-ID session rather than generating a duplicate', async () => {
    const legacyId = 'old-attendance-' + sequence;
    await db.collection('classSessions').doc(legacyId).set({
      enrollmentId: ids.enrollment, kidId: ids.kid, kidIds: [ids.kid],
      teacherId: ids.teacher, courseId: 'phonics-foundations',
      date: PAST_MONDAY, startTime: '17:00:00',
      status: 'scheduled', attendance: null,
      feeAmount: 400, teacherPayPerSession: 175, currency: 'INR',
    });
    const found = await ensure(PAST_MONDAY);
    expect(found).toMatchObject({sessionId: legacyId, created: false});
    expect(await sessionsForCurrentChild(PAST_MONDAY)).toHaveLength(1);
    await mark(legacyId, 'absent');
    expect((await db.collection('classSessions').doc(legacyId).get())
      .data()?.attendance?.[ids.kid]?.status).toBe('absent');
  });

  it('fails closed when two historical records already occupy the same student/date/time', async () => {
    for (const suffix of ['a', 'b']) {
      await db.collection('classSessions').doc('legacy-' + suffix + '-' + sequence).set({
        enrollmentId: ids.enrollment, kidId: ids.kid,
        teacherId: ids.teacher, courseId: 'phonics-foundations',
        date: PAST_MONDAY, startTime: '17:00', status: 'scheduled',
        feeAmount: 400, teacherPayPerSession: 175,
      });
    }
    await expect(ensure(PAST_MONDAY)).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    });
    expect(await sessionsForCurrentChild(PAST_MONDAY)).toHaveLength(2);
    expect((await db.collection('calendarAttendanceClaims')
      .doc(ids.kid + '_20260928_1700').get()).exists).toBe(false);
  });

  it('retains settled charge and payout unchanged if teacher tries a billability correction', async () => {
    const {sessionId} = await ensure();
    await mark(sessionId, 'present');
    await complete(sessionId);
    await waitForLedger(sessionId);
    await Promise.all([
      db.collection('billingCharges').doc(sessionId).update({status: 'paid', paidAmount: 400}),
      db.collection('teacherEarnings').doc(sessionId).update({status: 'paid', paidAmount: 175}),
    ]);
    await expect(mark(sessionId, 'absent')).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    });
    expect((await db.collection('classSessions').doc(sessionId).get())
      .data()?.attendance?.[ids.kid]?.status).toBe('present');
    const [charge, earning] = await ledger(sessionId);
    expect(charge.data()).toMatchObject({status: 'paid', paidAmount: 400});
    expect(earning.data()).toMatchObject({status: 'paid', paidAmount: 175});
  });

  it('supports two genuine class times on one day without merging occurrences', async () => {
    await db.collection('enrollments').doc(ids.enrollment).update({
      schedule: schedule([
        {weekday: 1, time: '17:00', durationMinutes: 35},
        {weekday: 1, time: '18:00', durationMinutes: 35},
      ]),
    });
    const a = await ensure(MONDAY, '17:00');
    const b = await ensure(MONDAY, '18:00');
    expect(a.sessionId).not.toBe(b.sessionId);
    await mark(a.sessionId, 'present');
    await mark(b.sessionId, 'absent');
    expect(await sessionsForCurrentChild()).toHaveLength(2);
    expect((await db.collection('calendarAttendanceClaims').get()).docs
      .filter(d => d.data().childId === ids.kid)).toHaveLength(2);
  });

  it('accepts one standard 35-minute ad hoc booking but blocks regular/duplicate overlaps', async () => {
    const callAdHoc = (startTime: string, durationMinutes = 35) =>
      call<{sessionId: string; created: boolean}>('createTeacherCalendarAdHocSession', {
        enrollmentId: ids.enrollment, date: MONDAY, startTime, durationMinutes,
      });
    await expect(callAdHoc('17:10')).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    });
    await expect(callAdHoc('18:00', 45)).rejects.toMatchObject({
      code: 'functions/invalid-argument',
    });
    const booking = await callAdHoc('18:00');
    expect(booking.created).toBe(true);
    expect((await callAdHoc('18:00')).sessionId).toBe(booking.sessionId);
    await expect(callAdHoc('18:10')).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    });
    const saved = (await db.collection('classSessions').doc(booking.sessionId).get()).data();
    expect(saved).toMatchObject({source: 'teacher_ad_hoc', durationMinutes: 35});
    expect(saved?.attendance).toBeNull();
    const [charge, earning] = await ledger(booking.sessionId);
    expect(charge.exists).toBe(false);
    expect(earning.exists).toBe(false);
  });

  it('blocks ad hoc overlap with another teacher’s virtual class for the same child', async () => {
    await db.collection('enrollments').doc('stage1-second-enrollment-' + sequence).set({
      kidId: ids.kid, kidIds: [ids.kid], teacherId: 'unrelated-teacher-' + sequence,
      status: 'active', courseId: 'basic-grammar', classesStartDateYmd: '2026-01-01',
      schedule: schedule([{weekday: 1, time: '18:00', durationMinutes: 35}]),
      ratePerSession: 400, teacherPayPerSession: 175,
    });
    await expect(call('createTeacherCalendarAdHocSession', {
      enrollmentId: ids.enrollment, date: MONDAY, startTime: '18:15', durationMinutes: 35,
    })).rejects.toMatchObject({code: 'functions/failed-precondition'});
  });

  it('rejects a teacher who is not assigned to the enrollment', async () => {
    const uid = 'unassigned-stage1-teacher-' + sequence;
    const email = uid + '@example.test';
    const password = 'Stage1EmulatorOnly!123';
    await adminAuth.createUser({uid, email, password});
    await db.collection('users').doc(uid).set({role:'teacher', status:'active', email});
    await signInWithEmailAndPassword(authClient, email, password);
    await expect(ensure()).rejects.toMatchObject({code: 'functions/permission-denied'});
    expect(await sessionsForCurrentChild()).toHaveLength(0);
  });
});
