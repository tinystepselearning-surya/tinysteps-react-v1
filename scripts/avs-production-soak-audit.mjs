import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import {
  AVS_SOAK_CASE_READ_CAP,
  AVS_SOAK_CHECKPOINT_READ_CAP,
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
  const range = normalizeAvsSoakRange(fromDate, toDate);
  if (range.toDate >= today) {
    throw Object.assign(
      new Error(
        'AVS soak audit supports completed service dates through yesterday IST only.',
      ),
      { code: 'avs-soak-incomplete-date-refused' },
    );
  }
  return range;
}

async function boundedQueryData(label, query, cap) {
  const snapshot = await query.limit(cap + 1).get();
  if (snapshot.docs.length > cap) {
    throw Object.assign(
      new Error(`${label} exceeded the bounded read cap.`),
      { code: 'avs-soak-read-cap-exceeded' },
    );
  }
  return snapshot.docs.map((doc) => doc.data() || {});
}

async function boundedQueryDocs(label, query, cap) {
  const snapshot = await query.limit(cap + 1).get();
  if (snapshot.docs.length > cap) {
    throw Object.assign(
      new Error(`${label} exceeded the bounded read cap.`),
      { code: 'avs-soak-read-cap-exceeded' },
    );
  }
  return snapshot.docs;
}

async function loadRunCheckpoints(runDocs, cap) {
  const forceFreshRuns = [];
  const forceFreshCheckpoints = [];

  for (let runIndex = 0; runIndex < runDocs.length; runIndex += 1) {
    const runDoc = runDocs[runIndex];
    const runData = runDoc.data() || {};
    const runKey = `run-${runIndex}`;
    const remaining = cap - forceFreshCheckpoints.length;

    if (remaining <= 0) {
      throw Object.assign(
        new Error('attendanceValidationForceFreshRunCheckpoints exceeded the bounded read cap.'),
        { code: 'avs-soak-read-cap-exceeded' },
      );
    }

    const checkpointSnapshot = await runDoc.ref
      .collection('cases')
      .limit(remaining + 1)
      .get();

    if (checkpointSnapshot.docs.length > remaining) {
      throw Object.assign(
        new Error('attendanceValidationForceFreshRunCheckpoints exceeded the bounded read cap.'),
        { code: 'avs-soak-read-cap-exceeded' },
      );
    }

    forceFreshRuns.push({
      ...runData,
      _soakRunKey: runKey,
      _soakRunOrder: runIndex,
    });

    for (
      let checkpointIndex = 0;
      checkpointIndex < checkpointSnapshot.docs.length;
      checkpointIndex += 1
    ) {
      const checkpointData =
        checkpointSnapshot.docs[checkpointIndex].data() || {};
      forceFreshCheckpoints.push({
        ...checkpointData,
        _soakRunKey: runKey,
        _soakRunOrder: runIndex,
        _soakCheckpointOrder: checkpointIndex,
        _soakRunUpdatedAt: runData.updatedAt ?? null,
        _soakRunCreatedAt: runData.createdAt ?? null,
      });
    }
  }

  return { forceFreshRuns, forceFreshCheckpoints };
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

  const [cases, dirtySessions, runCandidateDocs] = await Promise.all([
    boundedQueryData(
      'attendanceValidationCases',
      casesQuery,
      AVS_SOAK_CASE_READ_CAP,
    ),
    boundedQueryData(
      'attendanceValidationDirtySessions',
      dirtyQuery,
      AVS_SOAK_DIRTY_READ_CAP,
    ),
    boundedQueryDocs(
      'attendanceValidationForceFreshRuns',
      runsQuery,
      AVS_SOAK_RUN_READ_CAP,
    ),
  ]);

  const overlappingRunDocs = runCandidateDocs.filter((doc) =>
    String(doc.data()?.fromDate || '').trim() <= range.toDate,
  );

  const {
    forceFreshRuns,
    forceFreshCheckpoints,
  } = await loadRunCheckpoints(
    overlappingRunDocs,
    AVS_SOAK_CHECKPOINT_READ_CAP,
  );

  const report = summarizeAttendanceValidationSoak({
    range,
    asOf: new Date(),
    cases,
    dirtySessions,
    forceFreshRuns,
    forceFreshCheckpoints,
  });

  const output = {
    ...report,
    projectId,
    reads: {
      attendanceValidationCases: cases.length,
      attendanceValidationDirtySessions: dirtySessions.length,
      attendanceValidationForceFreshRuns: runCandidateDocs.length,
      attendanceValidationForceFreshRunCheckpoints:
        forceFreshCheckpoints.length,
      caps: {
        attendanceValidationCases: AVS_SOAK_CASE_READ_CAP,
        attendanceValidationDirtySessions: AVS_SOAK_DIRTY_READ_CAP,
        attendanceValidationForceFreshRuns: AVS_SOAK_RUN_READ_CAP,
        attendanceValidationForceFreshRunCheckpoints:
          AVS_SOAK_CHECKPOINT_READ_CAP,
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
