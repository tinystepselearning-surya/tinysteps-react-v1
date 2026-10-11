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
  return Boolean(data.revenueAccrued || data.accruedAt || data.accruedMonthKey ||
    data.billedAt || data.settledAt || data.locked);
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
  const endAt = admin.firestore.Timestamp.fromDate(new Date('2026-10-26T00:00:00+05:30'));
  const collection = db.collection('classSessions');

  const [dateSnap, startSnap] = await Promise.all([
    collection.where('date', '>=', FROM).where('date', '<', TO_EXCLUSIVE).limit(8000).get(),
    collection.where('startAt', '>=', startAt).where('startAt', '<', endAt).limit(8000).get(),
  ]);
  if (dateSnap.size === 8000 || startSnap.size === 8000) {
    fail('Safety query limit reached; no deletes performed.');
  }
  const live = new Map([...dateSnap.docs, ...startSnap.docs].map(s => [s.ref.path, s]));
  if (live.size > expected.size) fail('More future documents exist than the verified backup.');
  for (const [documentPath, snap] of live) {
    const date = String(snap.data().date || '');
    if (!expected.has(documentPath) || expected.get(documentPath) !== date) {
      fail('Live document does not match the verified cutover manifest. No deletes performed.');
    }
    if (financeOrAttendanceExists(snap.data())) {
      fail('A future session now contains attendance/finance state. No deletes performed.');
    }
  }

  const summary = {
    project: PROJECT, cutoff: '2026-10-12 through 2026-10-25 IST',
    backedUp: expected.size, currentlyExisting: live.size,
    absentSinceBackup: expected.size - live.size,
    mode: apply ? 'DELETE' : 'DRY_RUN',
    deleteOnly: 'classSessions documents in verified backup',
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
    for (const snap of docs.slice(i, i + 350)) batch.delete(snap.ref);
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
