#!/usr/bin/env node
'use strict';

/**
 * One-time Tiny Steps cutover reset for existing FUTURE session records only.
 *
 * This does NOT classify cancellations, infer intended classes or touch older
 * attendance / finance collections. Student Management recurrence will be the
 * sole source for freshly generated Oct 12 and Oct 13 sessions.
 *
 * DRY RUN BY DEFAULT. --apply also requires --writers-retired.
 * Never execute apply until the deployed legacy 14-day callable writers have
 * been retired, not merely the Cloud Scheduler jobs paused.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const admin = require('firebase-admin');

const PROJECT = 'tinysteps-react-v1';
const FROM = '2026-10-12';
const TO_EXCLUSIVE = '2026-10-26';
const QUERY_LIMIT = 12000;
const FINANCE_BATCH = 150;
const BACKUP_SHA256 = '589e6f887fe56e0efed6960f126b196ad14050347e49dd3fb4ac428b5290e606';
const BACKUP_NAME = 'TinySteps-Oct12-25-FULL-FIRESTORE-BACKUP-1791693467038.json';
const BACKUP = path.join(os.homedir(), 'Desktop', BACKUP_NAME);
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const writersRetired = args.has('--writers-retired');

function fail(message) { throw new Error(message); }
function istDay() {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(format.formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function shallowBackupDate(document) {
  const fields = document?.fields;
  const day = fields?.type === 'map' ? fields.value?.date : null;
  return typeof day === 'string' ? day : null;
}
function validateManifest() {
  const bytes = fs.readFileSync(BACKUP);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== BACKUP_SHA256) fail('Local backup SHA-256 does not match verified inventory.');
  const parsed = JSON.parse(bytes.toString('utf8'));
  if (parsed.format !== 'TinySteps-Firestore-Typed-Backup-v1' || parsed.projectId !== PROJECT ||
      !Array.isArray(parsed.documents) || parsed.documents.length !== 1152) {
    fail('Backup format, project or expected session count differs.');
  }
  const expected = new Map();
  for (const document of parsed.documents) {
    const documentPath = String(document.path || '');
    const day = shallowBackupDate(document);
    if (!/^classSessions\/[^/]+$/.test(documentPath) || !day || day < FROM || day >= TO_EXCLUSIVE ||
        expected.has(documentPath)) {
      fail('Backup contains a duplicate, out-of-range or unexpected document.');
    }
    expected.set(documentPath, day);
  }
  return expected;
}
function financeOrAttendanceExists(data) {
  const attendance = data.attendance;
  if (attendance && (
    typeof attendance !== 'object' ||
    Object.values(attendance).some(value => value != null)
  )) return true;
  return Boolean(
    data.billingChargeId || data.teacherEarningId ||
    data.financeLocked || data.financeLock || data.lockedAt ||
    data.paidAt || data.settledAt || data.billedAt || data.invoicedAt ||
    data.billingProcessed || data.revenueProcessed || data.revenueAccrued ||
    data.accruedAt || data.accruedMonthKey || data.teacherPayProcessed ||
    data.locked || Number(data.accruedAmount || 0) > 0
  );
}
async function main() {
  const expected = validateManifest();
  const dayNow = istDay();
  if (apply && dayNow !== '2026-10-11') {
    fail('Deletion is restricted to Oct 11 IST, before Oct 12 classes begin.');
  }
  if (apply && !writersRetired) {
    fail('Refusing to apply: --writers-retired must be explicitly acknowledged.');
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), projectId: PROJECT,
    });
  }
  const db = admin.firestore();
  const startAt = admin.firestore.Timestamp.fromDate(new Date('2026-10-12T00:00:00+05:30'));
  const collection = db.collection('classSessions');

  // Scan ALL future dates, not just the 14-day backup range. A document beyond
  // Oct 25 must block this limited reset until it has also been backed up.
  const [dateSnap, startSnap] = await Promise.all([
    collection.where('date', '>=', FROM).limit(QUERY_LIMIT).get(),
    collection.where('startAt', '>=', startAt).limit(QUERY_LIMIT).get(),
  ]);
  if (dateSnap.size === QUERY_LIMIT || startSnap.size === QUERY_LIMIT) {
    fail('Future inventory query safety limit reached; no deletes performed.');
  }
  const future = new Map([...dateSnap.docs, ...startSnap.docs].map(s => [s.ref.path, s]));
  const extra = [...future.values()].filter(s => !expected.has(s.ref.path));
  const extraBeyond = extra.filter(s => String(s.data().date || '') >= TO_EXCLUSIVE);
  console.log(JSON.stringify({
    futureDocumentsSeen: future.size,
    extraNotInBackup: extra.length,
    extraBeyondOctober25: extraBeyond.length,
  }, null, 2));
  if (extra.length > 0) {
    fail('Unbacked future sessions exist. Expand the full-fidelity backup before any deletion.');
  }
  const live = future;
  for (const [documentPath, snap] of live) {
    const data = snap.data();
    const date = String(data.date || '');
    if (expected.get(documentPath) !== date) {
      fail('Live document date differs from the verified manifest. No deletes performed.');
    }
    if (financeOrAttendanceExists(data)) {
      fail('A future session now contains attendance/finance state. No deletes performed.');
    }
    if (
      data.historicalCorrection === true ||
      data.isAdHoc === true || data.isManual === true || data.isMakeup === true ||
      data.manualSessionState != null ||
      data.makeupCreditId != null || data.makeupForSessionId != null ||
      data.rescheduleCreditId != null || data.rescheduledFromSessionId != null ||
      data.originalSessionId != null || data.sourceSessionId != null ||
      data.replacementSessionId != null || data.replacementForSessionId != null ||
      /manual|makeup|ad[_-]?hoc|resched|replacement|one[_-]?off|historical/.test(
        [
          data.source, data.sessionType, data.createdByFlow, data.adHocType,
          data.manualSessionType, data.rescheduleSource, data.replacementSource,
        ].join('|').toLowerCase()
      )
    ) {
      fail('A future manual, makeup, rescheduled, or historical exception needs preservation.');
    }
  }

  // External finance documents are not visible within classSessions fields.
  // Check each exact ID in bounded getAll batches before approving any delete.
  let externalFinanceLinks = 0;
  const sessionIds = [...live.values()].map(s => s.id);
  for (let i = 0; i < sessionIds.length; i += FINANCE_BATCH) {
    const ids = sessionIds.slice(i, i + FINANCE_BATCH);
    const refs = ids.flatMap(id => [
      db.collection('billingCharges').doc(id),
      db.collection('teacherEarnings').doc(id),
    ]);
    const snaps = await db.getAll(...refs);
    externalFinanceLinks += snaps.filter(s => s.exists).length;
  }
  if (externalFinanceLinks > 0) {
    fail('Found ' + externalFinanceLinks + ' external finance links; no deletes performed.');
  }

  const summary = {
    project: PROJECT, cutoff: '2026-10-12 through 2026-10-25 IST',
    backedUp: expected.size, currentlyExisting: live.size,
    absentSinceBackup: expected.size - live.size,
    mode: apply ? 'DELETE' : 'DRY_RUN',
    deleteOnly: 'classSessions documents in verified backup',
    externalFinanceLinks,
    manualOrMakeupPreservedByBlocking: true,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) {
    console.log('DRY RUN ONLY: zero Firestore writes or deletes.');
    return;
  }

  let deleted = 0;
  const docs = [...live.values()];
  for (let i = 0; i < docs.length; i += 350) {
    const batch = db.batch();
    for (const snap of docs.slice(i, i + 350)) {
      // Refuse to delete a document that changed after the safety inventory.
      batch.delete(snap.ref, {lastUpdateTime: snap.updateTime});
    }
    await batch.commit();
    deleted += Math.min(350, docs.length - i);
    console.log('Future documents deleted:', deleted);
  }
  console.log(JSON.stringify({deleted, project: PROJECT, cutoverResetComplete: true}, null, 2));
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
