#!/usr/bin/env node
'use strict';

/**
 * Tiny Steps Oct 12 cutover: READ-ONLY Firestore -> LOCAL permission-restricted
 * 0600 JSON archive. No Firestore mutation code exists in this script.
 *
 * Save *all* future classSessions documents, not only Oct 12-25.
 * The typed field encoding conforms to Firestore's Document REST value schema:
 * timestamps retain nanoseconds, integers remain decimal strings, bytes are
 * base64, nested maps/arrays, references and geo-points preserve their types.
 *
 * Firestore create/update timestamps are archived as metadata; they are not
 * automatically restorable to their original timestamps. Restore into an
 * isolated project/emulator must be tested before deletion is authorized.
 *
 * IMPORTANT: Uses DocumentSnapshot._fieldsProto to avoid SDK .data()
 * timestamp and special-number precision loss. This is an internal property:
 * if it is not available, FAIL CLOSED before writing a backup file.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const admin = require('firebase-admin');

const PROJECT = 'tinysteps-react-v1';
const FROM = '2026-10-12';
const IST_START = '2026-10-12T00:00:00+05:30';
const QUERY_LIMIT = 12000;
const PREVIOUS_MANIFEST_COUNT = 1152;
const PREVIOUS_BACKUP_TO_EXCLUSIVE = '2026-10-26';
const INVENTORY_REFERENCE_COUNT = 4113;
const FORMAT = 'TinySteps-Firestore-REST-Typed-FutureSessions-v2';

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function fail(message) { throw new Error(message); }
function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function typedTimestamp(raw) {
  if (typeof raw === 'string') return raw;
  if (!raw || typeof raw !== 'object') fail('Unexpected Firestore timestamp wire type');
  const seconds = Number(String(raw.seconds));
  const nanos = Number(raw.nanos || 0);
  if (!Number.isSafeInteger(seconds) || !Number.isInteger(nanos) ||
      nanos < 0 || nanos >= 1e9) fail('Invalid Firestore timestamp precision');
  const start = new Date(seconds * 1000).toISOString().slice(0, 19);
  return start + '.' + String(nanos).padStart(9, '0') + 'Z';
}

/** Converts one native Firestore proto value to its REST typed equivalent. */
function typedValue(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 60) {
    fail('Unexpected Firestore value or excessive nesting');
  }
  const variants = [
    'nullValue', 'booleanValue', 'integerValue', 'doubleValue',
    'timestampValue', 'stringValue', 'bytesValue', 'referenceValue',
    'geoPointValue', 'arrayValue', 'mapValue',
  ].filter(key => own(value, key) && value[key] !== undefined);
  if (variants.length !== 1) fail('Unknown or ambiguous Firestore value variant');
  const kind = variants[0];
  const raw = value[kind];
  if (kind === 'nullValue') return {nullValue: null};
  if (kind === 'booleanValue') return {booleanValue: raw === true};
  if (kind === 'integerValue') return {integerValue: String(raw)};
  if (kind === 'doubleValue') {
    // Firestore REST accepts "NaN", "Infinity", and "-Infinity" as strings.
    // Other values remain numbers, preserving numeric field semantics.
    const number = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isNaN(number)) return {doubleValue: 'NaN'};
    if (number === Infinity) return {doubleValue: 'Infinity'};
    if (number === -Infinity) return {doubleValue: '-Infinity'};
    if (!Number.isFinite(number)) fail('Invalid Firestore double value');
    return {doubleValue: number};
  }
  if (kind === 'timestampValue') return {timestampValue: typedTimestamp(raw)};
  if (kind === 'stringValue') return {stringValue: String(raw)};
  if (kind === 'bytesValue') {
    return {bytesValue: typeof raw === 'string' ?
      raw : Buffer.from(raw).toString('base64')};
  }
  if (kind === 'referenceValue') return {referenceValue: String(raw)};
  if (kind === 'geoPointValue') {
    const point = raw || {};
    const latitude = Number(point.latitude ?? 0);
    const longitude = Number(point.longitude ?? 0);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      fail('Invalid Firestore GeoPoint value');
    }
    return {geoPointValue: {latitude, longitude}};
  }
  if (kind === 'arrayValue') {
    const values = raw?.values || [];
    if (!Array.isArray(values)) fail('Invalid Firestore array');
    return {arrayValue: {values: values.map(v => typedValue(v, depth + 1))}};
  }
  if (kind === 'mapValue') {
    return {mapValue: {fields: typedFields(raw?.fields || {}, depth + 1)}};
  }
  fail('Unsupported Firestore wire variant');
}

function typedFields(input, depth = 0) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    fail('Invalid Firestore map fields');
  }
  return Object.fromEntries(
    Object.entries(input).sort(([a], [b]) => a.localeCompare(b)).map(
      ([field, value]) => [field, typedValue(value, depth + 1)]
    )
  );
}
function metadataTime(ts) {
  if (!ts) fail('Firestore document create/update time not available');
  return typedTimestamp({seconds: ts.seconds, nanos: ts.nanoseconds});
}

async function main() {
  if (process.argv.length !== 2) {
    fail('No arguments accepted. This tool is read-only and writes only a local backup file.');
  }
  if (!admin.apps.length) admin.initializeApp({
    credential: admin.credential.applicationDefault(), projectId: PROJECT,
  });
  const db = admin.firestore();
  const sessions = db.collection('classSessions');
  const fromTimestamp = admin.firestore.Timestamp.fromDate(new Date(IST_START));
  // Both independent indexed criteria are essential: a malformed/missing
  // date field must not hide a future startAt document from the backup.
  const [byDate, byStartAt] = await Promise.all([
    sessions.where('date', '>=', FROM).limit(QUERY_LIMIT).get(),
    sessions.where('startAt', '>=', fromTimestamp).limit(QUERY_LIMIT).get(),
  ]);
  if (byDate.size >= QUERY_LIMIT || byStartAt.size >= QUERY_LIMIT) {
    fail('Inventory reached safety limit; backup not written');
  }
  const all = new Map(
    [...byDate.docs, ...byStartAt.docs].map(doc => [doc.ref.path, doc])
  );
  if (!all.size) fail('No future sessions found; backup not written');

  const documents = [];
  const byDay = {};
  let anomalousDates = 0;
  for (const [documentPath, snap] of [...all.entries()]
    .sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^classSessions\/[^/]+$/.test(documentPath)) {
      fail('Unexpected document path: refusing to create incomplete backup');
    }
    if (!snap._fieldsProto || typeof snap._fieldsProto !== 'object') {
      fail('Firestore raw field metadata unavailable; cannot guarantee fidelity');
    }
    const fields = typedFields(snap._fieldsProto);
    const day = fields.date?.stringValue || 'MISSING';
    if (day === 'MISSING' || day < FROM) anomalousDates += 1;
    byDay[day] = (byDay[day] || 0) + 1;
    const canonicalFields = JSON.stringify(fields);
    documents.push({
      path: documentPath,
      createTime: metadataTime(snap.createTime),
      updateTime: metadataTime(snap.updateTime),
      fields,
      fieldsSha256: sha256(canonicalFields),
    });
  }

  const days = Object.keys(byDay).sort();
  const backup = {
    format: FORMAT,
    projectId: PROJECT,
    databaseId: '(default)',
    generatedAt: new Date().toISOString(),
    cutoverFromYmd: FROM,
    backupScope: 'union of date >= cutover and startAt >= midnight IST',
    documentCount: documents.length,
    queryCounts: {byDate: byDate.size, byStartAt: byStartAt.size},
    anomalousDates,
    documents,
  };
  const bytes = Buffer.from(JSON.stringify(backup, null, 2) + '\n', 'utf8');
  const digest = sha256(bytes);
  const desktop = path.join(os.homedir(), 'Desktop');
  const filename = 'TinySteps-ALL-FUTURE-SES-20261012-' +
    Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.json';
  const destination = path.join(desktop, filename);
  const temp = destination + '.partial';
  const fd = fs.openSync(temp, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, bytes);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  const saved = fs.readFileSync(temp);
  const parsed = JSON.parse(saved.toString('utf8'));
  const unique = new Set(parsed.documents.map(row => row.path));
  const valid = parsed.format === FORMAT && parsed.projectId === PROJECT &&
    parsed.documentCount === all.size && unique.size === all.size &&
    parsed.documents.every(row =>
      sha256(JSON.stringify(row.fields)) === row.fieldsSha256);
  if (!valid || sha256(saved) !== digest) {
    fail('Local backup round-trip integrity verification failed');
  }
  fs.renameSync(temp, destination);
  fs.chmodSync(destination, 0o600);

  const insidePriorRange = Object.entries(byDay)
    .filter(([day]) => day >= FROM && day < PREVIOUS_BACKUP_TO_EXCLUSIVE)
    .reduce((n, [, count]) => n + count, 0);
  console.log(JSON.stringify({
    mode: 'FIRESTORE_READ_ONLY',
    projectId: PROJECT,
    backedUp: documents.length,
    inventoryReference: INVENTORY_REFERENCE_COUNT,
    inventoryCountMatches: documents.length === INVENTORY_REFERENCE_COUNT,
    withinOriginalBackupRange: insidePriorRange,
    originalBackupReference: PREVIOUS_MANIFEST_COUNT,
    outsideOriginalBackupRange: documents.length - insidePriorRange,
    anomalousDates,
    firstSessionDay: days[0],
    lastSessionDay: days[days.length - 1],
    dateBuckets: days.length,
    localFile: destination,
    bytes: saved.length,
    sha256: digest,
    permissions: '0600',
    restoreTested: false,
    firestoreWrites: 0,
    firestoreDeletes: 0,
  }, null, 2));
}
if (require.main === module) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
module.exports = {typedValue, typedFields, typedTimestamp, FORMAT, PROJECT};
