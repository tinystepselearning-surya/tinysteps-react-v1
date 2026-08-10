'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'tinysteps-react-v1';
const VERSION = 1;

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
  return crypto.createHash('sha256').update(`${phone}|${child}`).digest('hex');
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
  return score;
};
const hasUnsafeDemoConflict = (records) => {
  const nonEmpty = records.map((record) => demoIds(record.data)).filter((ids) => ids.length > 0);
  if (nonEmpty.length <= 1) return false;
  const reference = new Set(nonEmpty[0]);
  return nonEmpty.slice(1).some((ids) => ids.some((id) => !reference.has(id)) || [...reference].some((id) => !ids.includes(id)));
};
const chooseCanonical = (records) => {
  return [...records].sort((a, b) => {
    const scoreDiff = lifecycleScore(b.data) - lifecycleScore(a.data);
    if (scoreDiff !== 0) return scoreDiff;
    const timeDiff = eventMillis(a.data) - eventMillis(b.data);
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  })[0];
};

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
  const report = duplicateGroups.map(([key, records]) => {
    const conflict = hasUnsafeDemoConflict(records);
    const canonical = conflict ? null : chooseCanonical(records);
    return {
      identityKey: key,
      conflict,
      canonicalLeadId: canonical?.id || null,
      leads: records
        .sort((a, b) => eventMillis(a.data) - eventMillis(b.data))
        .map((record) => ({
          id: record.id,
          parentName: cleanText(record.data.parentName),
          childName: cleanText(record.data.childName),
          phone: normalizePhone(record.data.phoneNormalized || record.data.primaryPhone || record.data.whatsappNumber),
          status: cleanText(record.data.status),
          programInterest: cleanText(record.data.programInterest),
          interestTrack: cleanText(record.data.interestTrack),
          demoIds: demoIds(record.data),
          receivedAtMs: eventMillis(record.data),
        })),
    };
  });

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
    console.log('\nDry run only. Re-run with --apply after reviewing every group and after the dedupe trigger is deployed.');
    return;
  }

  const safeGroups = report.filter((group) => !group.conflict && group.canonicalLeadId);
  for (const group of safeGroups) {
    const identityRef = db.collection('leadIdentityIndex').doc(group.identityKey);
    await identityRef.set({
      canonicalLeadId: group.canonicalLeadId,
      identityKey: group.identityKey,
      version: VERSION,
      backfillSeededAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const batch = db.batch();
    group.leads.forEach((lead) => {
      batch.set(db.collection('leads').doc(lead.id), {
        dedupeBackfillRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }

  console.log(`\nSeeded ${safeGroups.length} safe identity groups and touched their leads. Firestore triggers now perform the canonical merges.`);
  if (report.some((group) => group.conflict)) {
    console.log('Conflict groups were intentionally skipped and require manual review.');
  }
}

main().catch((error) => {
  console.error('[backfillWebsiteLeadDeduplication] failed', error);
  process.exitCode = 1;
});
