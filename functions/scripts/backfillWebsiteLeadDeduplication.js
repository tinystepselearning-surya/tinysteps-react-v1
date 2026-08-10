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
    records.forEach((record) => {
      if (record.id === canonical.id) return;
      if (isUnsafeForCanonical(canonical, record)) {
        conflictReasons.push(`unsafe_demo_lifecycle:${record.id}`);
      }
    });
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
    const liveIdentitySnap = await identityRef.get();
    const liveCanonicalId = liveIdentitySnap.exists
      ? cleanText(liveIdentitySnap.data()?.canonicalLeadId)
      : '';

    // Never overwrite a canonical mapping that changed after the dry-run snapshot/report.
    if (liveCanonicalId && liveCanonicalId !== group.canonicalLeadId) {
      skippedForDrift += 1;
      console.warn(
        `[backfillWebsiteLeadDeduplication] skipped ${group.identityKey}: identity index drifted from ${group.canonicalLeadId} to ${liveCanonicalId}`,
      );
      continue;
    }

    if (!liveCanonicalId) {
      await identityRef.set({
        canonicalLeadId: group.canonicalLeadId,
        identityKey: group.identityKey,
        version: VERSION,
        backfillSeededAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
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
