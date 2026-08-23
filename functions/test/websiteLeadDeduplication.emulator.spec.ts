import * as admin from 'firebase-admin';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { enrichPublicLeadAttribution } from '../src/enrichPublicLeadAttribution';
import {
  buildWebsiteLeadIdentityKey,
  onWebsiteLeadIdentityWrite,
} from '../src/websiteLeadDeduplication';

const describeEmulator = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;
const db = admin.firestore();

const missingSnapshot = { exists: false, data: () => undefined };
const at = (iso: string) => admin.firestore.Timestamp.fromDate(new Date(iso));
const recent = (offsetMs: number) => admin.firestore.Timestamp.fromMillis(Date.now() + offsetMs);

const clearCollection = async (path: string) => {
  const snapshot = await db.collection(path).get();
  await Promise.all(snapshot.docs.map((docSnap) => db.recursiveDelete(docSnap.ref)));
};

const lead = (
  phone: string,
  childName: string,
  receivedAt: admin.firestore.Timestamp,
  extra: Record<string, unknown> = {},
) => ({
  source: 'website',
  parentName: 'Test Parent',
  childName,
  primaryPhone: phone,
  phoneNormalized: phone,
  createdAt: receivedAt,
  receivedAt,
  status: 'new',
  ...extra,
});

const runDedupe = async (
  leadId: string,
  before: FirebaseFirestore.DocumentSnapshot | typeof missingSnapshot = missingSnapshot,
) => {
  const after = await db.collection('leads').doc(leadId).get();
  return onWebsiteLeadIdentityWrite.run({
    params: { leadId },
    data: { before, after },
  } as never);
};

const enrich = (leadId: string, landingPage: string, campaign: string) =>
  enrichPublicLeadAttribution.run({
    data: {
      leadId,
      attribution: {
        landingPage,
        conversionPage: '/assessment',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: campaign,
      },
    },
  } as never);

describeEmulator('website lead deduplication transaction integrity', () => {
  beforeEach(async () => {
    await Promise.all([
      clearCollection('demoSessions'),
      clearCollection('leadIdentityIndex'),
      clearCollection('leadMergeRedirects'),
      clearCollection('leads'),
    ]);
  });

  afterAll(async () => {
    await admin.app().delete();
  });

  it('serializes simultaneous same-identity submissions into one lead with both inquiries and interests', async () => {
    const firstId = 'AAAAAAAAAAAAAAAAAAAA';
    const secondId = 'BBBBBBBBBBBBBBBBBBBB';
    await Promise.all([
      db.collection('leads').doc(firstId).set(lead(
        '+91 8722106429',
        'Rithanyaa',
        at('2026-08-10T10:00:00.000Z'),
        { programInterest: 'Reading', interestTrack: 'reading' },
      )),
      db.collection('leads').doc(secondId).set(lead(
        '0091 8722106429',
        'RITHANYAA',
        at('2026-08-10T10:00:01.000Z'),
        { programInterest: 'Phonics', interestTrack: 'phonics' },
      )),
    ]);

    await Promise.all([runDedupe(firstId), runDedupe(secondId)]);

    const leads = await db.collection('leads').get();
    const indexes = await db.collection('leadIdentityIndex').get();
    expect(leads.size).toBe(1);
    expect(indexes.size).toBe(1);
    const canonical = leads.docs[0];
    expect(canonical.data()).toMatchObject({ inquiryCount: 2 });
    expect(canonical.data().programInterests).toEqual(expect.arrayContaining(['Reading', 'Phonics']));
    expect(canonical.data().interestTracks).toEqual(expect.arrayContaining(['reading', 'phonics']));
    expect((await canonical.ref.collection('inquiries').get()).size).toBe(2);
  });

  it('keeps siblings with the same phone as distinct canonical leads', async () => {
    const firstId = 'CCCCCCCCCCCCCCCCCCCC';
    const secondId = 'DDDDDDDDDDDDDDDDDDDD';
    await db.collection('leads').doc(firstId).set(lead('9876543210', 'Aarav', at('2026-08-10T10:01:00Z')));
    await db.collection('leads').doc(secondId).set(lead('9876543210', 'Anaya', at('2026-08-10T10:01:01Z')));
    await Promise.all([runDedupe(firstId), runDedupe(secondId)]);
    expect((await db.collection('leads').get()).size).toBe(2);
    expect((await db.collection('leadIdentityIndex').get()).size).toBe(2);
  });

  it('merges a fresh duplicate into a demo-owning canonical', async () => {
    const canonicalId = 'EEEEEEEEEEEEEEEEEEEE';
    const duplicateId = 'FFFFFFFFFFFFFFFFFFFF';
    await db.collection('leads').doc(canonicalId).set(lead('9876543211', 'Child', at('2026-08-10T10:02:00Z'), {
      demoSessionId: 'demo-1', demoIds: ['demo-1'], status: 'demo_booked',
    }));
    await runDedupe(canonicalId);
    await db.collection('leads').doc(duplicateId).set(lead('9876543211', 'Child', at('2026-08-10T10:02:01Z')));
    await runDedupe(duplicateId);
    expect((await db.collection('leads').doc(duplicateId).get()).exists).toBe(false);
    expect((await db.collection('leads').doc(canonicalId).get()).data()?.demoSessionId).toBe('demo-1');
  });

  it('marks a duplicate-owned demo conflict once and does not loop or delete on the marker invocation', async () => {
    const canonicalId = 'GGGGGGGGGGGGGGGGGGGG';
    const duplicateId = 'HHHHHHHHHHHHHHHHHHHH';
    await db.collection('leads').doc(canonicalId).set(lead('9876543212', 'Child', at('2026-08-10T10:03:00Z')));
    await runDedupe(canonicalId);
    await db.collection('leads').doc(duplicateId).set(lead('9876543212', 'Child', at('2026-08-10T10:03:01Z'), {
      demoSessionId: 'demo-2', demoIds: ['demo-2'], status: 'demo_booked',
    }));
    const beforeConflict = await db.collection('leads').doc(duplicateId).get();
    await runDedupe(duplicateId);
    const afterConflict = await db.collection('leads').doc(duplicateId).get();
    const conflictAt = afterConflict.data()?.dedupeConflictAt.toMillis();
    await onWebsiteLeadIdentityWrite.run({
      params: { leadId: duplicateId },
      data: { before: beforeConflict, after: afterConflict },
    } as never);
    const repeated = await db.collection('leads').doc(duplicateId).get();
    expect(repeated.exists).toBe(true);
    expect(repeated.data()?.dedupeConflict).toBe('duplicate_has_unmigrated_demo_links');
    expect(repeated.data()?.dedupeConflictAt.toMillis()).toBe(conflictAt);
  });

  it('blocks different demo IDs and repoints an identical demo relationship before a safe delete', async () => {
    const canonicalId = 'IIIIIIIIIIIIIIIIIIII';
    const conflictId = 'JJJJJJJJJJJJJJJJJJJJ';
    await db.collection('leads').doc(canonicalId).set(lead('9876543213', 'Child', at('2026-08-10T10:04:00Z'), {
      demoSessionId: 'demo-a', demoIds: ['demo-a'], status: 'demo_booked',
    }));
    await runDedupe(canonicalId);
    await db.collection('leads').doc(conflictId).set(lead('9876543213', 'Child', at('2026-08-10T10:04:01Z'), {
      demoSessionId: 'demo-b', demoIds: ['demo-b'], status: 'demo_booked',
    }));
    await runDedupe(conflictId);
    expect((await db.collection('leads').doc(conflictId).get()).data()?.dedupeConflict)
      .toBe('duplicate_has_unmigrated_demo_links');

    const sameCanonicalId = 'KKKKKKKKKKKKKKKKKKKK';
    const sameDuplicateId = 'LLLLLLLLLLLLLLLLLLLL';
    await db.collection('leads').doc(sameCanonicalId).set(lead('9876543214', 'Child', at('2026-08-10T10:05:00Z'), {
      demoSessionId: 'demo-same', demoIds: ['demo-same'], status: 'demo_booked',
    }));
    await runDedupe(sameCanonicalId);
    await db.collection('leads').doc(sameDuplicateId).set(lead('9876543214', 'Child', at('2026-08-10T10:05:01Z'), {
      demoSessionId: 'demo-same', demoIds: ['demo-same'], status: 'demo_booked',
    }));
    await db.collection('demoSessions').doc('demo-same').set({ leadId: sameDuplicateId });
    await runDedupe(sameDuplicateId);
    expect((await db.collection('leads').doc(sameDuplicateId).get()).exists).toBe(false);
    expect((await db.collection('demoSessions').doc('demo-same').get()).data()?.leadId).toBe(sameCanonicalId);
  });

  it('migrates existing inquiry and communication history before deleting a historical duplicate', async () => {
    const canonicalId = 'MMMMMMMMMMMMMMMMMMMM';
    const duplicateId = 'NNNNNNNNNNNNNNNNNNNN';
    await db.collection('leads').doc(canonicalId).set(lead('9876543215', 'Child', at('2026-08-10T10:06:00Z')));
    await runDedupe(canonicalId);
    await db.collection('leads').doc(duplicateId).set(lead('9876543215', 'Child', at('2026-08-10T10:06:01Z'), {
      inquiryCount: 2,
    }));
    await Promise.all([
      db.collection('leads').doc(duplicateId).collection('inquiries').doc('historic').set({ mainConcern: 'Reading history' }),
      db.collection('leads').doc(duplicateId).collection('inquiries').doc(duplicateId).set({ landingPage: '/historic-first-touch' }),
      db.collection('leads').doc(duplicateId).collection('communications').doc('message').set({ channel: 'whatsapp', body: 'Follow-up' }),
    ]);
    await runDedupe(duplicateId);
    expect((await db.collection('leads').doc(duplicateId).get()).exists).toBe(false);
    expect((await db.collection('leads').doc(canonicalId).get()).data()?.inquiryCount).toBe(3);
    expect((await db.collection('leads').doc(canonicalId).collection('inquiries').doc('historic').get()).exists).toBe(true);
    expect((await db.collection('leads').doc(canonicalId).collection('inquiries').doc(duplicateId).get()).data()?.landingPage)
      .toBe('/historic-first-touch');
    expect((await db.collection('leads').doc(canonicalId).collection('communications').doc(`${duplicateId}__message`).get()).exists).toBe(true);
  });

  it('remaps an admin identity correction and removes the stale index', async () => {
    const leadId = 'OOOOOOOOOOOOOOOOOOOO';
    const oldPhone = '9876543216';
    const newPhone = '9876543217';
    await db.collection('leads').doc(leadId).set(lead(oldPhone, 'Child', at('2026-08-10T10:07:00Z')));
    await runDedupe(leadId);
    const before = await db.collection('leads').doc(leadId).get();
    await before.ref.update({ primaryPhone: newPhone, phoneNormalized: newPhone });
    await runDedupe(leadId, before);
    const oldKey = buildWebsiteLeadIdentityKey(oldPhone, 'Child') as string;
    const newKey = buildWebsiteLeadIdentityKey(newPhone, 'Child') as string;
    expect((await db.collection('leadIdentityIndex').doc(oldKey).get()).exists).toBe(false);
    expect((await db.collection('leadIdentityIndex').doc(newKey).get()).data()?.canonicalLeadId).toBe(leadId);
  });

  it('keeps an identity-edit collision sticky, then clears it after correction to a free identity', async () => {
    const firstId = 'PPPPPPPPPPPPPPPPPPPP';
    const secondId = 'QQQQQQQQQQQQQQQQQQQQ';
    await db.collection('leads').doc(firstId).set(lead('9876543218', 'Child', at('2026-08-10T10:08:00Z')));
    await db.collection('leads').doc(secondId).set(lead('9876543219', 'Child', at('2026-08-10T10:08:01Z')));
    await runDedupe(firstId);
    await runDedupe(secondId);

    const beforeCollision = await db.collection('leads').doc(secondId).get();
    await beforeCollision.ref.update({ primaryPhone: '9876543218', phoneNormalized: '9876543218' });
    await runDedupe(secondId, beforeCollision);
    const collision = await db.collection('leads').doc(secondId).get();
    const conflictAt = collision.data()?.dedupeConflictAt.toMillis();
    await onWebsiteLeadIdentityWrite.run({
      params: { leadId: secondId }, data: { before: collision, after: collision },
    } as never);
    expect((await collision.ref.get()).data()?.dedupeConflictAt.toMillis()).toBe(conflictAt);

    const beforeCorrection = await collision.ref.get();
    await collision.ref.update({ primaryPhone: '9876543220', phoneNormalized: '9876543220' });
    await runDedupe(secondId, beforeCorrection);
    const corrected = await collision.ref.get();
    expect(corrected.exists).toBe(true);
    expect(corrected.data()?.dedupeConflict).toBeUndefined();
    const freeKey = buildWebsiteLeadIdentityKey('9876543220', 'Child') as string;
    expect((await db.collection('leadIdentityIndex').doc(freeKey).get()).data()?.canonicalLeadId).toBe(secondId);
  });

  it('preserves first-touch when attribution runs before dedupe and records the later attribution summary', async () => {
    const canonicalId = 'RRRRRRRRRRRRRRRRRRRR';
    const duplicateId = 'SSSSSSSSSSSSSSSSSSSS';
    await db.collection('leads').doc(canonicalId).set(lead('9876543221', 'Child', recent(-2_000)));
    await enrich(canonicalId, '/first', 'first-campaign');
    await runDedupe(canonicalId);
    await db.collection('leads').doc(duplicateId).set(lead('9876543221', 'Child', recent(-1_000)));
    await enrich(duplicateId, '/later', 'later-campaign');
    await runDedupe(duplicateId);
    const canonical = (await db.collection('leads').doc(canonicalId).get()).data();
    expect(canonical?.landingPage).toBe('/first');
    expect(canonical?.lastInquiryLandingPage).toBe('/later');
    expect((await db.collection('leads').doc(canonicalId).collection('inquiries').doc(duplicateId).get()).data()?.landingPage)
      .toBe('/later');
  });

  it('follows a dedupe redirect for late attribution without overwriting first-touch', async () => {
    const canonicalId = 'TTTTTTTTTTTTTTTTTTTT';
    const duplicateId = 'UUUUUUUUUUUUUUUUUUUU';
    await db.collection('leads').doc(canonicalId).set(lead('9876543222', 'Child', recent(-2_000)));
    await enrich(canonicalId, '/first', 'first-campaign');
    await runDedupe(canonicalId);
    await db.collection('leads').doc(duplicateId).set(lead('9876543222', 'Child', recent(-1_000)));
    await runDedupe(duplicateId);
    await enrich(duplicateId, '/redirected', 'redirected-campaign');
    const canonical = (await db.collection('leads').doc(canonicalId).get()).data();
    expect(canonical?.landingPage).toBe('/first');
    expect(canonical?.lastInquiryLandingPage).toBe('/redirected');
    expect((await db.collection('leads').doc(canonicalId).collection('inquiries').doc(duplicateId).get()).data()?.landingPage)
      .toBe('/redirected');
  });

  it('promotes chronologically earlier redirected attribution to first-touch', async () => {
    const canonicalId = 'VVVVVVVVVVVVVVVVVVVV';
    const earlierId = 'WWWWWWWWWWWWWWWWWWWW';
    const earlierAt = recent(-2_000);
    const laterAt = recent(-1_000);
    await db.collection('leads').doc(canonicalId).set(lead('9876543223', 'Child', laterAt));
    await enrich(canonicalId, '/later-first', 'later-campaign');
    await runDedupe(canonicalId);
    await db.collection('leads').doc(earlierId).set(lead('9876543223', 'Child', earlierAt));
    await runDedupe(earlierId);
    await enrich(earlierId, '/chronologically-first', 'earlier-campaign');
    const canonical = (await db.collection('leads').doc(canonicalId).get()).data();
    expect(canonical?.landingPage).toBe('/chronologically-first');
    expect(canonical?.firstInquiryAt.toMillis()).toBe(earlierAt.toMillis());
  });

  it('makes canonical initialization effectively idempotent on the second invocation', async () => {
    const leadId = 'XXXXXXXXXXXXXXXXXXXX';
    await db.collection('leads').doc(leadId).set(lead('9876543224', 'Child', at('2026-08-10T10:12:00Z')));
    await runDedupe(leadId);
    const initialized = await db.collection('leads').doc(leadId).get();
    const inquiryRef = initialized.ref.collection('inquiries').doc(leadId);
    const initializedInquiry = await inquiryRef.get();
    const updateTime = initialized.updateTime?.toMillis();
    const inquiryUpdateTime = initializedInquiry.updateTime?.toMillis();
    await onWebsiteLeadIdentityWrite.run({
      params: { leadId }, data: { before: initialized, after: initialized },
    } as never);
    const repeated = await initialized.ref.get();
    expect(repeated.updateTime?.toMillis()).toBe(updateTime);
    expect(repeated.data()?.inquiryCount).toBe(1);
    expect((await inquiryRef.get()).updateTime?.toMillis()).toBe(inquiryUpdateTime);
  });

  it('does not merge through an identity index that points at a mismatched canonical', async () => {
    const wrongCanonicalId = 'YYYYYYYYYYYYYYYYYYYY';
    const candidateId = 'ZZZZZZZZZZZZZZZZZZZZ';
    await db.collection('leads').doc(wrongCanonicalId).set(lead(
      '9876543225', 'Different Child', recent(-2_000),
    ));
    await db.collection('leads').doc(candidateId).set(lead(
      '9876543226', 'Target Child', recent(-1_000),
    ));
    const targetKey = buildWebsiteLeadIdentityKey('9876543226', 'Target Child') as string;
    await db.collection('leadIdentityIndex').doc(targetKey).set({
      canonicalLeadId: wrongCanonicalId,
      identityKey: targetKey,
      version: 1,
    });
    await runDedupe(candidateId);
    const candidate = await db.collection('leads').doc(candidateId).get();
    expect(candidate.exists).toBe(true);
    expect(candidate.data()?.dedupeConflict).toBe('identity_index_canonical_mismatch');
  });
});
