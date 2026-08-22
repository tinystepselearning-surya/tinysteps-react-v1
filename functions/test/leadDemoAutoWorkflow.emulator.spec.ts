import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  onLeadEnsureDemoRequest,
  onOrphanDemoIdentityRepair,
  shouldEnsureDemoForLead,
} from '../src/leadDemoAutoWorkflow';

if (!admin.apps.length) admin.initializeApp();

const describeEmulator = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;
const db = admin.firestore();

const clearCollection = async (path: string) => {
  const snapshot = await db.collection(path).get();
  await Promise.all(snapshot.docs.map((docSnap) => docSnap.ref.delete()));
};

describe('automatic lead -> demo workflow guards', () => {
  it('waits for website canonicalization before creating a demo', () => {
    expect(shouldEnsureDemoForLead('lead-1', {
      source: 'website',
      parentName: 'Parent',
      childName: 'Child',
      primaryPhone: '9440436379',
      status: 'new',
    })).toBe(false);

    expect(shouldEnsureDemoForLead('lead-1', {
      source: 'website',
      parentName: 'Parent',
      childName: 'Child',
      primaryPhone: '9440436379',
      status: 'new',
      dedupeCanonicalLeadId: 'lead-1',
      dedupeIdentityKey: 'canonical-key',
    })).toBe(true);
  });

  it('never auto-creates from synthetic compatibility leads or terminal leads', () => {
    expect(shouldEnsureDemoForLead('demo_demo-1', {
      source: 'manual',
      childName: 'Child',
      primaryPhone: '9440436379',
      status: 'new',
    })).toBe(false);

    expect(shouldEnsureDemoForLead('lead-closed', {
      source: 'whatsapp',
      childName: 'Child',
      primaryPhone: '9440436379',
      status: 'not_interested',
    })).toBe(false);
  });
});

describeEmulator('automatic lead -> demo workflow emulator integrity', () => {
  beforeEach(async () => {
    await Promise.all([
      clearCollection('demoSessions'),
      clearCollection('demoSessionsPrivate'),
      clearCollection('demoSessionUniqueKeys'),
      clearCollection('leads'),
    ]);
  });

  it('auto-creates exactly one linked open demo for a canonical website enquiry', async () => {
    const leadRef = db.collection('leads').doc('website-lead-1');
    const before = await leadRef.get();
    await leadRef.set({
      parentName: 'Parent One',
      childName: 'Keerthi',
      childAge: 6,
      primaryPhone: '9440436379',
      phoneNormalized: '9440436379',
      source: 'website',
      sourceDetail: 'public_assessment_form',
      status: 'new',
      programInterest: 'Reading',
      mainConcern: 'Reading speed and word accuracy',
      urgency: 'This week',
      timezone: 'Asia/Kolkata',
      dedupeCanonicalLeadId: 'website-lead-1',
      dedupeIdentityKey: 'identity-key',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    const after = await leadRef.get();

    await onLeadEnsureDemoRequest.run({
      params: { leadId: leadRef.id },
      data: { before, after },
    } as never);

    const expectedDemoId = `lead_${leadRef.id}`;
    const [leadSnap, demoSnap, privateSnap, demoList] = await Promise.all([
      leadRef.get(),
      db.collection('demoSessions').doc(expectedDemoId).get(),
      db.collection('demoSessionsPrivate').doc(expectedDemoId).get(),
      db.collection('demoSessions').get(),
    ]);

    expect(leadSnap.data()).toMatchObject({
      status: 'demo_pending_schedule',
      demoSessionId: expectedDemoId,
      demoStatus: 'open',
    });
    expect(demoSnap.data()).toMatchObject({
      leadId: leadRef.id,
      status: 'open',
      childName: 'Keerthi',
      courseInterested: 'Reading',
      autoCreatedFromLead: true,
    });
    expect(privateSnap.data()).toMatchObject({ parentPhone: '9440436379' });
    expect(demoList.size).toBe(1);

    const beforeRepeat = await leadRef.get();
    await leadRef.update({ updatedAt: admin.firestore.Timestamp.now() });
    const afterRepeat = await leadRef.get();
    await onLeadEnsureDemoRequest.run({
      params: { leadId: leadRef.id },
      data: { before: beforeRepeat, after: afterRepeat },
    } as never);

    expect((await db.collection('demoSessions').get()).size).toBe(1);
    expect((await leadRef.get()).data()?.demoSessionId).toBe(expectedDemoId);
  });

  it('repairs an orphan completed demo onto the real lead and removes the safe synthetic duplicate', async () => {
    const realLeadRef = db.collection('leads').doc('real-lead');
    const demoRef = db.collection('demoSessions').doc('demo-orphan');
    const syntheticLeadRef = db.collection('leads').doc('demo_demo-orphan');

    await Promise.all([
      realLeadRef.set({
        parentName: 'Parent',
        childName: 'Keerthi',
        primaryPhone: '9440436379',
        phoneNormalized: '9440436379',
        source: 'website',
        status: 'new',
        dedupeCanonicalLeadId: 'real-lead',
        dedupeIdentityKey: 'identity-key',
        createdAt: admin.firestore.Timestamp.now(),
      }),
      demoRef.set({
        parentName: 'Parent',
        childName: 'Keerthi',
        childGrade: '1',
        courseInterested: 'Reading',
        source: 'Website',
        status: 'completed',
        outcome: 'completed',
        leadId: 'demo_demo-orphan',
        assignedTeacherId: 'teacher-1',
        assignedTeacherName: 'Teacher One',
        completedAt: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        lastUpdatedAt: admin.firestore.Timestamp.now(),
      }),
      db.collection('demoSessionsPrivate').doc('demo-orphan').set({
        parentPhone: '+91 94404 36379',
        parentPhoneKey: '919440436379',
      }),
      syntheticLeadRef.set({
        parentName: 'Parent',
        childName: 'Keerthi',
        primaryPhone: '+91 94404 36379',
        phoneNormalized: '9440436379',
        source: 'manual',
        sourceDetail: 'manual_demo_request',
        status: 'demo_completed',
        demoSessionId: 'demo-orphan',
        demoIds: ['demo-orphan'],
      }),
    ]);

    const before = await demoRef.get();
    await demoRef.update({ lastUpdatedAt: admin.firestore.Timestamp.now() });
    const after = await demoRef.get();

    await onOrphanDemoIdentityRepair.run({
      params: { demoId: demoRef.id },
      data: { before, after },
    } as never);

    expect((await demoRef.get()).data()?.leadId).toBe(realLeadRef.id);
    expect((await realLeadRef.get()).data()).toMatchObject({
      demoSessionId: demoRef.id,
      demoStatus: 'completed',
      status: 'demo_completed',
    });
    expect((await syntheticLeadRef.get()).exists).toBe(false);
  });
});
