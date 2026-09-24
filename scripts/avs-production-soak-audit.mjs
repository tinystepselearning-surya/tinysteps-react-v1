import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import {
  AVS_SOAK_CASE_READ_CAP,
  AVS_SOAK_DIRTY_READ_CAP,
  AVS_SOAK_RUN_READ_CAP,
  normalizeAvsSoakRange,
  summarizeAttendanceValidationSoak,
} from './avs-production-soak-summary.mjs';

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : '';
}

function currentIstYmd(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function shiftYmd(ymd, days) {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveRange() {
  const today = currentIstYmd();
  const defaultTo = shiftYmd(today, -1);
  const toDate = readArg('--to') || defaultTo;
  const fromDate = readArg('--from') || shiftYmd(toDate, -6);
  return normalizeAvsSoakRange(fromDate, toDate);
}

async function boundedQuery(label, query, cap) {
  const snapshot = await query.limit(cap + 1).get();
  if (snapshot.docs.length > cap) {
    throw Object.assign(
      new Error(`${label} exceeded the bounded read cap.`),
      { code: 'avs-soak-read-cap-exceeded' },
    );
  }
  return snapshot.docs.map((doc) => doc.data() || {});
}

async function run() {
  const projectId = readArg('--project');
  if (projectId !== EXPECTED_PROJECT_ID) {
    throw Object.assign(
      new Error(`--project must be ${EXPECTED_PROJECT_ID}.`),
      { code: 'avs-soak-project-refused' },
    );
  }

  const range = resolveRange();

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
  const db = admin.firestore();

  const casesQuery = db
    .collection('attendanceValidationCases')
    .where('serviceDateYmd', '>=', range.fromDate)
    .where('serviceDateYmd', '<=', range.toDate)
    .orderBy('serviceDateYmd', 'asc');

  const dirtyQuery = db
    .collection('attendanceValidationDirtySessions')
    .where('serviceDateYmd', '>=', range.fromDate)
    .where('serviceDateYmd', '<=', range.toDate)
    .orderBy('serviceDateYmd', 'asc');

  const runsQuery = db
    .collection('attendanceValidationForceFreshRuns')
    .where('toDate', '>=', range.fromDate)
    .orderBy('toDate', 'asc');

  const [cases, dirtySessions, runCandidates] = await Promise.all([
    boundedQuery('attendanceValidationCases', casesQuery, AVS_SOAK_CASE_READ_CAP),
    boundedQuery(
      'attendanceValidationDirtySessions',
      dirtyQuery,
      AVS_SOAK_DIRTY_READ_CAP,
    ),
    boundedQuery(
      'attendanceValidationForceFreshRuns',
      runsQuery,
      AVS_SOAK_RUN_READ_CAP,
    ),
  ]);

  const forceFreshRuns = runCandidates.filter((row) =>
    String(row.fromDate || '').trim() <= range.toDate,
  );

  const report = summarizeAttendanceValidationSoak({
    range,
    asOf: new Date(),
    cases,
    dirtySessions,
    forceFreshRuns,
  });

  const output = {
    ...report,
    projectId,
    reads: {
      attendanceValidationCases: cases.length,
      attendanceValidationDirtySessions: dirtySessions.length,
      attendanceValidationForceFreshRuns: runCandidates.length,
      caps: {
        attendanceValidationCases: AVS_SOAK_CASE_READ_CAP,
        attendanceValidationDirtySessions: AVS_SOAK_DIRTY_READ_CAP,
        attendanceValidationForceFreshRuns: AVS_SOAK_RUN_READ_CAP,
      },
      bounded: true,
    },
    graphCalls: 0,
    operationalWrites: 0,
  };

  console.log(JSON.stringify(output, null, 2));

  const jsonOut = readArg('--json-out');
  if (jsonOut) {
    const resolved = path.resolve(process.cwd(), jsonOut);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  }

  if (output.safety.invariantViolation) {
    process.exitCode = 2;
  }
}

run().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    errorName: error instanceof Error ? error.name : 'unknown',
    errorCode:
      error && typeof error === 'object' && 'code' in error
        ? String(error.code || 'unknown')
        : 'unknown',
  }));
  process.exitCode = 1;
});
