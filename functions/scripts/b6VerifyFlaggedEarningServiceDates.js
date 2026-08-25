'use strict';

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const {
  analyzeTeacherEarningsLegacyMonthCoverage,
} = require('../lib/helpers/teacherEarningsCanonicalAudit');
const {
  resolveCanonicalServiceDate,
  serviceDateFromTimestampIST,
  toDate,
} = require('../lib/helpers/serviceDate');

function readArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function timestampMonthIST(value) {
  const serviceDate = serviceDateFromTimestampIST(value);
  return serviceDate ? serviceDate.slice(0, 7) : null;
}

function serializeDateLike(value) {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : null;
}

function increment(map, key) {
  const safeKey = key || '(unresolved)';
  map.set(safeKey, (map.get(safeKey) || 0) + 1);
}

function sortedRecord(map) {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const projectId = readArg('project', process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '');
  const targetMonthKey = readArg('month');
  const maxDocs = positiveInt(readArg('max-docs', '10000'), 10000);
  const expectedFlagged = positiveInt(readArg('expected-flagged', '83'), 83);
  const outputPath = readArg(
    'output',
    'artifacts/b6-flagged-earning-service-date-verification.json',
  );

  if (!projectId) throw new Error('Missing --project');
  if (!/^\d{4}-\d{2}$/.test(targetMonthKey)) throw new Error('Missing/invalid --month=YYYY-MM');
  if (maxDocs > 10000) throw new Error('--max-docs must be <= 10000');

  if (!admin.apps.length) admin.initializeApp({ projectId });
  const db = admin.firestore();

  const earningSnapshot = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
  if (earningSnapshot.docs.length > maxDocs) {
    throw new Error('Full-ledger evidence truncated; refusing partial verification');
  }

  const earningRows = earningSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() || {}),
  }));
  const rowsById = new Map(earningRows.map((row) => [row.id, row]));
  const legacyCoverage = analyzeTeacherEarningsLegacyMonthCoverage(
    earningRows,
    targetMonthKey,
    100,
  );
  const flaggedSamples = legacyCoverage.samples.derivedTargetRowsStoredInDifferentMonth;

  if (legacyCoverage.derivedTargetRowsStoredInDifferentMonth !== flaggedSamples.length) {
    throw new Error('Flagged rows exceed the existing helper sample bound; refusing partial verification');
  }
  if (flaggedSamples.length !== expectedFlagged) {
    throw new Error(`Expected ${expectedFlagged} flagged rows, found ${flaggedSamples.length}`);
  }

  const flaggedRows = flaggedSamples.map((sample) => {
    const row = rowsById.get(sample.id);
    if (!row) throw new Error(`Flagged teacherEarning missing from bounded snapshot: ${sample.id}`);
    return row;
  });

  const sessionIds = [...new Set(flaggedRows.map((row) => normalizeText(row.sessionId)).filter(Boolean))];
  const sessionRefs = sessionIds.map((sessionId) => db.collection('classSessions').doc(sessionId));
  const sessionSnapshots = sessionRefs.length ? await db.getAll(...sessionRefs) : [];
  const sessionsById = new Map(
    sessionSnapshots.map((docSnap) => [docSnap.id, docSnap.exists ? docSnap.data() || {} : null]),
  );

  const storedEarningMonthGroups = new Map();
  const canonicalSessionMonthGroups = new Map();
  const earnedAtMonthGroups = new Map();
  const createdAtMonthGroups = new Map();
  const updatedAtMonthGroups = new Map();
  const combinationGroups = new Map();
  const verifiedRows = [];
  const actualMismatches = [];
  const missingSessions = [];
  const unresolvedCanonicalServiceDates = [];

  let sessionFoundCount = 0;
  let sessionMissingCount = 0;
  let earningMonthMatchesCanonicalSessionMonthCount = 0;
  let earningMonthDiffersFromCanonicalSessionMonthCount = 0;
  let canonicalJulyCount = 0;
  let canonicalAugustCount = 0;
  let unresolvedCanonicalServiceDateCount = 0;

  for (const earning of flaggedRows) {
    const earningId = normalizeText(earning.id);
    const sessionId = normalizeText(earning.sessionId);
    const earningMonthKey = normalizeText(earning.monthKey) || null;
    const earnedAtMonth = timestampMonthIST(earning.earnedAt);
    const createdAtMonth = timestampMonthIST(earning.createdAt);
    const updatedAtMonth = timestampMonthIST(earning.updatedAt);
    const session = sessionId && sessionsById.has(sessionId) ? sessionsById.get(sessionId) : null;

    increment(storedEarningMonthGroups, earningMonthKey);
    increment(earnedAtMonthGroups, earnedAtMonth);
    increment(createdAtMonthGroups, createdAtMonth);
    increment(updatedAtMonthGroups, updatedAtMonth);

    if (!session) {
      sessionMissingCount += 1;
      increment(canonicalSessionMonthGroups, null);
      const combinationKey = JSON.stringify({
        storedEarningMonth: earningMonthKey,
        canonicalSessionMonth: null,
        earnedAtMonth,
      });
      combinationGroups.set(combinationKey, (combinationGroups.get(combinationKey) || 0) + 1);
      missingSessions.push({ earningId, sessionId: sessionId || null });
      verifiedRows.push({
        earningId,
        sessionId: sessionId || null,
        earningMonthKey,
        canonicalServiceDate: null,
        canonicalServiceMonthKey: null,
        canonicalServiceDateSource: null,
        earnedAtMonth,
        createdAtMonth,
        updatedAtMonth,
      });
      continue;
    }

    sessionFoundCount += 1;
    const canonical = resolveCanonicalServiceDate(session, null);
    increment(canonicalSessionMonthGroups, canonical.serviceMonthKey);

    const combinationKey = JSON.stringify({
      storedEarningMonth: earningMonthKey,
      canonicalSessionMonth: canonical.serviceMonthKey,
      earnedAtMonth,
    });
    combinationGroups.set(combinationKey, (combinationGroups.get(combinationKey) || 0) + 1);

    if (!canonical.serviceMonthKey) {
      unresolvedCanonicalServiceDateCount += 1;
      unresolvedCanonicalServiceDates.push({
        earningId,
        sessionId,
        sessionDate: serializeDateLike(session.date),
        sessionStartAt: serializeDateLike(session.startAt),
      });
    } else {
      if (canonical.serviceMonthKey === '2026-07') canonicalJulyCount += 1;
      if (canonical.serviceMonthKey === '2026-08') canonicalAugustCount += 1;

      if (earningMonthKey === canonical.serviceMonthKey) {
        earningMonthMatchesCanonicalSessionMonthCount += 1;
      } else {
        earningMonthDiffersFromCanonicalSessionMonthCount += 1;
        actualMismatches.push({
          earningId,
          sessionId,
          earningMonthKey,
          canonicalServiceDate: canonical.serviceDate,
          canonicalServiceMonthKey: canonical.serviceMonthKey,
          canonicalServiceDateSource: canonical.source,
          sessionDate: serializeDateLike(session.date),
          sessionStartAt: serializeDateLike(session.startAt),
          earnedAtMonth,
          createdAtMonth,
          updatedAtMonth,
        });
      }
    }

    verifiedRows.push({
      earningId,
      sessionId,
      earningMonthKey,
      canonicalServiceDate: canonical.serviceDate,
      canonicalServiceMonthKey: canonical.serviceMonthKey,
      canonicalServiceDateSource: canonical.source,
      earnedAtMonth,
      createdAtMonth,
      updatedAtMonth,
    });
  }

  const report = {
    ok: true,
    readOnly: true,
    source: 'b6_flagged_earning_service_date_verification_v1',
    projectId,
    targetMonthKey,
    fullLedgerEvidenceComplete: true,
    totalFlaggedRows: flaggedRows.length,
    uniqueSessionIdsRead: sessionIds.length,
    sessionFoundCount,
    sessionMissingCount,
    earningMonthMatchesCanonicalSessionMonthCount,
    earningMonthDiffersFromCanonicalSessionMonthCount,
    canonicalJulyCount,
    canonicalAugustCount,
    unresolvedCanonicalServiceDateCount,
    groups: {
      storedEarningMonth: sortedRecord(storedEarningMonthGroups),
      canonicalSessionMonth: sortedRecord(canonicalSessionMonthGroups),
      earnedAtMonth: sortedRecord(earnedAtMonthGroups),
      createdAtMonth: sortedRecord(createdAtMonthGroups),
      updatedAtMonth: sortedRecord(updatedAtMonthGroups),
      storedCanonicalEarnedAtCombinations: [...combinationGroups.entries()]
        .map(([key, count]) => ({ ...JSON.parse(key), count }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    },
    actualMismatches,
    missingSessions,
    unresolvedCanonicalServiceDates,
    verifiedRows,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('B6 flagged teacher-earning canonical service-date verification');
  console.log(JSON.stringify({
    projectId,
    targetMonthKey,
    totalFlaggedRows: report.totalFlaggedRows,
    uniqueSessionIdsRead: report.uniqueSessionIdsRead,
    sessionFoundCount,
    sessionMissingCount,
    earningMonthMatchesCanonicalSessionMonthCount,
    earningMonthDiffersFromCanonicalSessionMonthCount,
    canonicalJulyCount,
    canonicalAugustCount,
    unresolvedCanonicalServiceDateCount,
    groups: report.groups,
    actualMismatchCount: actualMismatches.length,
    outputPath,
  }, null, 2));
}

main().catch((error) => {
  console.error('B6 flagged service-date verification failed', error);
  process.exitCode = 1;
});
