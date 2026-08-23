import * as admin from 'firebase-admin';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { onDemoSessionEarningsWrite } from '../src/demoEarningsV2';
import { deleteDemoSession } from '../src/demoSessionsLegacy';
import { adminBackfillLeadLifecycle } from '../src/leadLifecycleBackfill';
import { onDemoLeadLifecycleWrite, onLeadCreatedCanonicalize } from '../src/leadLifecycle';

const describeEmulator = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;
const db = admin.firestore();
const timestampForTest = (iso: string) =>
  admin.firestore.Timestamp.fromDate(new Date(iso));

const clearCollection = async (path: string) => {
  const snapshot = await db.collection(path).get();
  await Promise.all(snapshot.docs.map((docSnap) => docSnap.ref.delete()));
};

describeEmulator('canonical lead funnel emulator integrity', () => {
  beforeEach(async () => {
    await Promise.all([
      clearCollection('demoSessions'),
      clearCollection('demoSessionsPrivate'),
      clearCollection('leads'),
      clearCollection('teacherEarnings'),
      clearCollection('users'),
    ]);
    await db.collection('users').doc('admin-1').set({ role: 'admin' });
  });

  afterAll(async () => {
    await admin.app().delete();
  });

  it('backfills a reschedule cohort transactionally, accurately, and idempotently', async () => {
    const firstCreatedAt = admin.firestore.Timestamp.fromDate(new Date('2026-01-02T06:30:00.000Z'));
    const secondCreatedAt = admin.firestore.Timestamp.fromDate(new Date('2026-01-03T06:30:00.000Z'));
    const completedAt = admin.firestore.Timestamp.fromDate(new Date('2026-01-03T07:30:00.000Z'));

    await Promise.all([
      db.collection('demoSessions').doc('attempt-1').set({
        parentName: 'Parent',
        childName: 'Child',
        childGrade: '1',
        courseInterested: 'Phonics',
        source: 'WhatsApp',
        requestReceivedDate: '2026-01-01',
        createdAt: firstCreatedAt,
        status: 'completed',
        outcome: 'reschedule_requested',
        completedAt: firstCreatedAt,
        rescheduledToDemoId: 'attempt-2',
      }),
      db.collection('demoSessionsPrivate').doc('attempt-1').set({ parentPhone: '+91 99999 00000' }),
      db.collection('demoSessions').doc('attempt-2').set({
        parentName: 'Parent',
        childName: 'Child',
        childGrade: '1',
        courseInterested: 'Phonics',
        source: 'WhatsApp',
        createdAt: secondCreatedAt,
        assignedAt: secondCreatedAt,
        completedAt,
        status: 'completed',
        outcome: 'completed',
        conversionStatus: 'enrolled',
        enrolledAt: completedAt,
        assignedTeacherId: 'teacher-2',
        assignedTeacherName: 'Teacher Two',
        completedByTeacherId: 'teacher-2',
        completedByTeacherName: 'Teacher Two',
        rescheduledFromDemoId: 'attempt-1',
      }),
      db.collection('demoSessionsPrivate').doc('attempt-2').set({ parentPhone: '+91 99999 00000' }),
    ]);

    const dryRun = await adminBackfillLeadLifecycle.run({
      data: { limit: 50 },
      auth: { uid: 'admin-1' },
    } as never);
    expect(dryRun).toMatchObject({ dryRun: true, leadGroups: 1, demosLinked: 2 });
    expect((await db.collection('leads').get()).empty).toBe(true);

    const applied = await adminBackfillLeadLifecycle.run({
      data: { limit: 50, dryRun: false },
      auth: { uid: 'admin-1' },
    } as never);
    expect(applied).toMatchObject({ dryRun: false, leadGroups: 1, demosLinked: 2, leadsCreated: 1 });

    const leadSnap = await db.collection('leads').doc('demo_attempt-1').get();
    expect(leadSnap.data()).toMatchObject({
      source: 'whatsapp',
      status: 'admitted_confirmed',
      demoSessionId: 'attempt-2',
      demoCompletedByTeacherId: 'teacher-2',
    });
    expect(leadSnap.data()?.demoIds).toEqual(expect.arrayContaining(['attempt-1', 'attempt-2']));
    const originalReceivedAt = leadSnap.data()?.receivedAt.toMillis();
    expect(originalReceivedAt).toBe(new Date('2026-01-01T12:00:00+05:30').getTime());
    expect((await db.collection('demoSessions').doc('attempt-1').get()).data()?.leadId).toBe('demo_attempt-1');
    expect((await db.collection('demoSessions').doc('attempt-2').get()).data()?.leadId).toBe('demo_attempt-1');

    const repeated = await adminBackfillLeadLifecycle.run({
      data: { limit: 50, dryRun: false },
      auth: { uid: 'admin-1' },
    } as never);
    expect(repeated).toMatchObject({ demosLinked: 0, leadsCreated: 0, leadsUpdated: 1 });
    expect((await db.collection('leads').doc('demo_attempt-1').get()).data()?.receivedAt.toMillis())
      .toBe(originalReceivedAt);
  });

  it('creates exactly one completion earning and one enrollment bonus under retried events', async () => {
    const demoRef = db.collection('demoSessions').doc('earning-delivered');
    await demoRef.set({
      status: 'assigned',
      outcome: null,
      conversionStatus: null,
      assignedTeacherId: 'teacher-1',
      assignedTeacherName: 'Teacher One',
      completedByTeacherId: 'teacher-1',
      completedByTeacherName: 'Teacher One',
      parentName: 'Parent',
      childName: 'Child',
      courseInterested: 'Phonics',
    });
    const beforeCompletion = await demoRef.get();
    await demoRef.update({
      status: 'completed',
      outcome: 'completed',
      completedAt: admin.firestore.Timestamp.now(),
    });
    const afterCompletion = await demoRef.get();
    const completionEvent = {
      params: { demoId: demoRef.id },
      data: { before: beforeCompletion, after: afterCompletion },
    } as never;
    await onDemoSessionEarningsWrite.run(completionEvent);
    await onDemoSessionEarningsWrite.run(completionEvent);

    const completion = await db.collection('teacherEarnings').doc('demo_earning-delivered_completion').get();
    expect(completion.data()).toMatchObject({ amount: 100, teacherId: 'teacher-1', status: 'unpaid' });

    const beforeEnrollment = await demoRef.get();
    await demoRef.update({ conversionStatus: 'enrolled', enrolledAt: admin.firestore.Timestamp.now() });
    const afterEnrollment = await demoRef.get();
    const enrollmentEvent = {
      params: { demoId: demoRef.id },
      data: { before: beforeEnrollment, after: afterEnrollment },
    } as never;
    await onDemoSessionEarningsWrite.run(enrollmentEvent);
    await onDemoSessionEarningsWrite.run(enrollmentEvent);

    const bonus = await db.collection('teacherEarnings').doc('demo_earning-delivered_enrollment_bonus').get();
    expect(bonus.data()).toMatchObject({ amount: 100, teacherId: 'teacher-1', status: 'unpaid' });
    expect((await db.collection('teacherEarnings').get()).size).toBe(2);
  });

  it('does not let a late trigger from a superseded attempt regress the current reschedule', async () => {
    const receivedAt = admin.firestore.Timestamp.fromDate(new Date('2026-01-01T06:30:00.000Z'));
    const leadRef = db.collection('leads').doc('lead-race');
    const oldDemoRef = db.collection('demoSessions').doc('attempt-old');
    await Promise.all([
      leadRef.set({
        receivedAt,
        demoSessionId: 'attempt-new',
        demoIds: ['attempt-old', 'attempt-new'],
        status: 'demo_pending_schedule',
      }),
      oldDemoRef.set({
        leadId: 'lead-race',
        status: 'assigned',
        assignedTeacherId: 'teacher-1',
      }),
    ]);
    const before = await oldDemoRef.get();
    await oldDemoRef.update({
      status: 'completed',
      outcome: 'reschedule_requested',
      rescheduledToDemoId: 'attempt-new',
      completedAt: admin.firestore.Timestamp.now(),
    });
    const after = await oldDemoRef.get();
    await onDemoLeadLifecycleWrite.run({
      params: { demoId: oldDemoRef.id },
      data: { before, after },
    } as never);

    expect((await leadRef.get()).data()).toMatchObject({
      receivedAt,
      demoSessionId: 'attempt-new',
      status: 'demo_pending_schedule',
      demoStatus: 'open',
    });
  });

  it('restores the original receivedAt if a later write tries to change it', async () => {
    const leadRef = db.collection('leads').doc('immutable-lead');
    const original = admin.firestore.Timestamp.fromDate(new Date('2026-01-01T06:30:00.000Z'));
    const changed = admin.firestore.Timestamp.fromDate(new Date('2026-02-01T06:30:00.000Z'));
    await leadRef.set({ receivedAt: original, lifecycleVersion: 2, status: 'new' });
    const before = await leadRef.get();
    await leadRef.update({ receivedAt: changed });
    const after = await leadRef.get();
    await onLeadCreatedCanonicalize.run({
      params: { leadId: leadRef.id },
      data: { before, after },
    } as never);
    expect((await leadRef.get()).data()?.receivedAt.toMillis()).toBe(original.toMillis());
  });

  it('does not rewrite a linked lead when the same demo lifecycle event is delivered twice', async () => {
    const leadRef = db.collection('leads').doc('idempotent-demo-lead');
    const demoRef = db.collection('demoSessions').doc('idempotent-demo');
    await Promise.all([
      leadRef.set({
        receivedAt: timestampForTest('2026-08-01T06:30:00.000Z'),
        parentName: 'Parent',
        childName: 'Child',
        source: 'website',
        lifecycleVersion: 2,
        status: 'demo_pending_schedule',
      }),
      db.collection('demoSessionsPrivate').doc(demoRef.id).set({ parentPhone: '9999900000' }),
      demoRef.set({
        leadId: leadRef.id,
        parentName: 'Parent',
        childName: 'Child',
        childGrade: '1',
        courseInterested: 'Phonics',
        source: 'Website',
        status: 'open',
        createdAt: timestampForTest('2026-08-01T06:30:00.000Z'),
      }),
    ]);
    const before = await demoRef.get();
    await demoRef.update({
      status: 'assigned',
      assignedAt: timestampForTest('2026-08-23T07:00:00.000Z'),
      assignedTeacherId: 'teacher-1',
      assignedTeacherName: 'Teacher One',
    });
    const after = await demoRef.get();
    const repeatedEvent = { params: { demoId: demoRef.id }, data: { before, after } } as never;
    await onDemoLeadLifecycleWrite.run(repeatedEvent);
    const firstWrite = await leadRef.get();
    await onDemoLeadLifecycleWrite.run(repeatedEvent);
    const secondWrite = await leadRef.get();

    expect(secondWrite.updateTime?.toMillis()).toBe(firstWrite.updateTime?.toMillis());
    expect(secondWrite.data()).toMatchObject({
      status: 'demo_booked',
      demoSessionId: demoRef.id,
      demoStatus: 'assigned',
    });
  });

  it.each(['parent_no_show', 'teacher_no_show', 'reschedule_requested'])(
    'does not credit a completion earning for %s',
    async (outcome) => {
      const demoRef = db.collection('demoSessions').doc(`earning-${outcome}`);
      await demoRef.set({
        status: 'assigned',
        assignedTeacherId: 'teacher-1',
        assignedTeacherName: 'Teacher One',
      });
      const before = await demoRef.get();
      await demoRef.update({ status: 'completed', outcome, completedAt: admin.firestore.Timestamp.now() });
      const after = await demoRef.get();
      await onDemoSessionEarningsWrite.run({
        params: { demoId: demoRef.id },
        data: { before, after },
      } as never);
      expect((await db.collection('teacherEarnings').get()).empty).toBe(true);
    },
  );

  it('never overwrites or deletes a paid earning, even when legacy amount data is incomplete', async () => {
    const demoRef = db.collection('demoSessions').doc('paid-demo');
    const earningRef = db.collection('teacherEarnings').doc('demo_paid-demo_completion');
    await Promise.all([
      demoRef.set({
        status: 'assigned',
        outcome: null,
        assignedTeacherId: 'teacher-1',
        assignedTeacherName: 'Teacher One',
      }),
      db.collection('demoSessionsPrivate').doc('paid-demo').set({ parentPhone: '+919999900000' }),
      earningRef.set({
        demoId: 'paid-demo',
        teacherId: 'teacher-legacy',
        amount: 0,
        status: 'paid',
        source: 'demo_completed',
        payoutIds: ['payout-1'],
      }),
    ]);
    const before = await demoRef.get();
    await demoRef.update({ status: 'completed', outcome: 'completed', completedAt: admin.firestore.Timestamp.now() });
    const after = await demoRef.get();
    await onDemoSessionEarningsWrite.run({
      params: { demoId: demoRef.id },
      data: { before, after },
    } as never);
    expect((await earningRef.get()).data()).toMatchObject({
      status: 'paid',
      amount: 0,
      teacherId: 'teacher-legacy',
      payoutIds: ['payout-1'],
    });

    await expect(deleteDemoSession.run({
      data: { demoId: 'paid-demo' },
      auth: { uid: 'admin-1' },
    } as never)).rejects.toMatchObject({ code: 'failed-precondition' });
    expect((await demoRef.get()).exists).toBe(true);
    expect((await earningRef.get()).exists).toBe(true);
  });
});
