'use strict';

const nodeCrypto = require('node:crypto');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'tinysteps-react-v1';
const VERSION = 1;
const MAX_HISTORY_DOCS_TO_MIGRATE = 400;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizePhone = (value) => {
  const digits = cleanText(value).replace(/[^\d]/g, '');
  if (digits.length === 14 && digits.startsWith('0091')) return digits.slice(4);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};
const normalizeChildName = (value) =>
  cleanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const identityKey = (lead) => {
  const phone = normalizePhone(lead.phoneNormalized || lead.primaryPhone || lead.whatsappNumber);
  const child = normalizeChildName(lead.childName);
  if (phone.length < 7 || child.length < 2) return null;
  return nodeCrypto.createHash('sha256').update(`${phone}|${child}`).digest('hex');
};
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};
const eventMillis = (lead) =>
  toMillis(lead.receivedAt) || toMillis(lead.requestedAt) || toMillis(lead.createdAt) || Number.MAX_SAFE_INTEGER;
const demoIds = (lead) => {
  const ids = new Set();
  if (Array.isArray(lead.demoIds)) lead.demoIds.forEach((id) => cleanText(id) && ids.add(cleanText(id)));
  if (cleanText(lead.demoSessionId)) ids.add(cleanText(lead.demoSessionId));
  return [...ids];
};
const lifecycleScore = (lead) => {
  let score = demoIds(lead).length > 0 ? 100 : 0;
  const status = cleanText(lead.status).toLowerCase();
  if (['demo_booked', 'demo_completed', 'admission_follow_up', 'admitted_confirmed'].includes(status)) score += 50;
  if (lead.enrolledAt) score += 100;
  if (cleanText(lead.enrollmentId)) score += 100;
  return score;
};
const chooseLifecycleSafeCanonical = (records) =>
  [...records].sort((a, b) => {
    const scoreDiff = lifecycleScore(b.data) - lifecycleScore(a.data);
    if (scoreDiff !== 0) return scoreDiff;
    const timeDiff = eventMillis(a.data) - eventMillis(b.data);
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  })[0];

const isUnsafeForCanonical = (canonical, duplicate) => {
  const canonicalIds = new Set(demoIds(canonical.data));
  const duplicateIds = demoIds(duplicate.data);
  if (duplicateIds.length === 0) return false;
  if (canonicalIds.size === 0) return true;
  return duplicateIds.some((id) => !canonicalIds.has(id));
};

const isUnsafeLifecycleForCanonical = (canonical, duplicate) => {
  const canonicalEnrollmentId = cleanText(canonical.data.enrollmentId);
  const duplicateEnrollmentId = cleanText(duplicate.data.enrollmentId);
  if (duplicateEnrollmentId && canonicalEnrollmentId !== duplicateEnrollmentId) return true;
  const status = cleanText(duplicate.data.status).toLowerCase();
  const conversion = cleanText(duplicate.data.conversionStatus).toLowerCase();
  const lifecycleRich = Boolean(
    duplicate.data.enrolledAt ||
    duplicate.data.demoCreatedAt ||
    duplicate.data.demoAssignedAt ||
    duplicate.data.demoCompletedAt ||
    duplicate.data.demoCancelledAt ||
    ['demo_booked', 'demo_completed', 'admission_follow_up', 'admitted_confirmed'].includes(status) ||
    conversion === 'enrolled'
  );
  return lifecycleRich && demoIds(duplicate.data).length === 0 && !duplicateEnrollmentId;
};

const summarizeLead = (record) => ({
  id: record.id,
  parentName: cleanText(record.data.parentName),
  childName: cleanText(record.data.childName),
  phone: normalizePhone(record.data.phoneNormalized || record.data.primaryPhone || record.data.whatsappNumber),
  status: cleanText(record.data.status),
  programInterest: cleanText(record.data.programInterest),
  interestTrack: cleanText(record.data.interestTrack),
  demoIds: demoIds(record.data),
  receivedAtMs: eventMillis(record.data),
  inquiryHistoryCount: record.inquiryHistoryCount || 0,
  communicationHistoryCount: record.communicationHistoryCount || 0,
});

async function buildGroupReport(key, records) {
  const identityRef = db.collection('leadIdentityIndex').doc(key);
  const identitySnap = await identityRef.get();
  const indexedCanonicalId = identitySnap.exists
    ? cleanText(identitySnap.data()?.canonicalLeadId)
    : '';
  const recordById = new Map(records.map((record) => [record.id, record]));
  const conflictReasons = [];

  let canonical = null;
  if (indexedCanonicalId) {
    canonical = recordById.get(indexedCanonicalId) || null;
    if (!canonical) {
      conflictReasons.push('identity_index_points_outside_duplicate_group');
    }
  } else {
    canonical = chooseLifecycleSafeCanonical(records);
  }

  if (canonical) {
    for (const record of records) {
      if (record.id === canonical.id) continue;
      if (isUnsafeForCanonical(canonical, record)) {
        conflictReasons.push(`unsafe_demo_lifecycle:${record.id}`);
      }
      if (isUnsafeLifecycleForCanonical(canonical, record)) {
        conflictReasons.push(`unsafe_non_demo_lifecycle:${record.id}`);
      }

      const [inquiriesSnap, communicationsSnap] = await Promise.all([
        db.collection('leads').doc(record.id).collection('inquiries')
          .limit(MAX_HISTORY_DOCS_TO_MIGRATE + 1).get(),
        db.collection('leads').doc(record.id).collection('communications')
          .limit(MAX_HISTORY_DOCS_TO_MIGRATE + 1).get(),
      ]);
      record.inquiryHistoryCount = inquiriesSnap.size;
      record.communicationHistoryCount = communicationsSnap.size;
      if (inquiriesSnap.size + communicationsSnap.size > MAX_HISTORY_DOCS_TO_MIGRATE) {
        conflictReasons.push(`history_migration_limit_exceeded:${record.id}`);
      }

      for (const demoId of demoIds(record.data)) {
        const demoSnap = await db.collection('demoSessions').doc(demoId).get();
        const linkedLeadId = demoSnap.exists ? cleanText(demoSnap.data()?.leadId) : '';
        if (!demoSnap.exists || (linkedLeadId !== record.id && linkedLeadId !== canonical.id)) {
          conflictReasons.push(`inconsistent_demo_link:${record.id}:${demoId}`);
        }
      }
    }
  }

  return {
    identityKey: key,
    indexedCanonicalLeadId: indexedCanonicalId || null,
    canonicalLeadId: canonical?.id || null,
    canonicalSelection: indexedCanonicalId ? 'existing_identity_index' : 'lifecycle_then_earliest',
    conflict: conflictReasons.length > 0,
    conflictReasons,
    leads: [...records]
      .sort((a, b) => eventMillis(a.data) - eventMillis(b.data))
      .map(summarizeLead),
  };
}

async function main() {
  const snapshot = await db.collection('leads').where('source', '==', 'website').get();
  const groups = new Map();

  snapshot.docs.forEach((doc) => {
    const data = doc.data() || {};
    const key = identityKey(data);
    if (!key) return;
    const group = groups.get(key) || [];
    group.push({ id: doc.id, data });
    groups.set(key, group);
  });

  const duplicateGroups = [...groups.entries()].filter(([, records]) => records.length > 1);
  const report = await Promise.all(
    duplicateGroups.map(([key, records]) => buildGroupReport(key, records)),
  );

  console.log(JSON.stringify({
    mode: APPLY ? 'APPLY' : 'DRY_RUN',
    projectId: PROJECT_ID,
    websiteLeadCount: snapshot.size,
    duplicateGroupCount: report.length,
    safeGroupCount: report.filter((group) => !group.conflict).length,
    conflictGroupCount: report.filter((group) => group.conflict).length,
    groups: report,
  }, null, 2));

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply only after the dedupe trigger is deployed and every group has been reviewed.');
    return;
  }

  const safeGroups = report.filter((group) => !group.conflict && group.canonicalLeadId);
  let appliedGroups = 0;
  let skippedForDrift = 0;

  for (const group of safeGroups) {
    const identityRef = db.collection('leadIdentityIndex').doc(group.identityKey);
    const expectedLiveCanonicalId = group.indexedCanonicalLeadId || '';
    const seedResult = await db.runTransaction(async (tx) => {
      const liveIdentitySnap = await tx.get(identityRef);
      const liveCanonicalId = liveIdentitySnap.exists
        ? cleanText(liveIdentitySnap.data()?.canonicalLeadId)
        : '';
      if (liveCanonicalId !== expectedLiveCanonicalId) {
        return { drifted: true, liveCanonicalId };
      }
      if (!liveCanonicalId) {
        tx.create(identityRef, {
          canonicalLeadId: group.canonicalLeadId,
          identityKey: group.identityKey,
          version: VERSION,
          backfillSeededAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      return { drifted: false, liveCanonicalId: liveCanonicalId || group.canonicalLeadId };
    });

    // Never overwrite a canonical mapping that changed after report generation,
    // including an index that appeared or disappeared during the run.
    if (seedResult.drifted) {
      skippedForDrift += 1;
      console.warn(
        `[backfillWebsiteLeadDeduplication] skipped ${group.identityKey}: identity index drifted from ${expectedLiveCanonicalId || '<missing>'} to ${seedResult.liveCanonicalId || '<missing>'}`,
      );
      continue;
    }

    const batch = db.batch();
    group.leads.forEach((lead) => {
      batch.set(db.collection('leads').doc(lead.id), {
        dedupeBackfillRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
    appliedGroups += 1;
  }

  console.log(
    `\nApplied ${appliedGroups} safe groups. Skipped ${skippedForDrift} groups because the identity index changed during execution. Firestore triggers perform the canonical merges.`,
  );
  if (report.some((group) => group.conflict)) {
    console.log('Conflict groups were intentionally skipped and require manual review.');
  }
}

main().catch((error) => {
  console.error('[backfillWebsiteLeadDeduplication] failed', error);
  process.exitCode = 1;
});
