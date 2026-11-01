#!/usr/bin/env node
/**
 * READ ONLY. Inspect the exact production teacher/date index and session
 * attribution completeness for completed months without printing personal data.
 *
 * Requires: gcloud ADC and Firebase Admin SDK credentials with read access.
 * Usage: node scripts/audit-month-close-teacher-filter.mjs --project tinysteps-react-v1
 *
 * No Firestore writes, deployments, index creation, personal data, or CSV exports.
 * Date-bound queries do not measure legacy sessions with no date field.
 */
import { spawnSync } from 'node:child_process';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isRequiredIndex } from './ensure-teacher-earnings-session-index.mjs';

const CAP_PER_MONTH = 2000;
const DEFAULT_MONTHS = ['2026-09', '2026-10'];
const clean = (value) => typeof value === 'string' ? value.trim() : '';
const count = (rows, check) => rows.reduce((sum, row) => sum + Number(check(row)), 0);

const readIndexState = (project) => {
  const args = [
    'firestore', 'indexes', 'composite', 'list',
    `--project=${project}`, '--database=(default)', '--format=json',
  ];
  const result = spawnSync('gcloud', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    throw new Error('Read-only gcloud Firestore index listing failed. Check your credentials and permissions.');
  }
  const indexes = JSON.parse(result.stdout);
  if (!Array.isArray(indexes)) throw new Error('Unexpected Firestore index list response.');
  const required = indexes.filter(isRequiredIndex);
  return { matchCount: required.length, states: required.map((index) => clean(index.state)) };
};

const monthRange = (month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month key.');
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
};

const summarizeSessions = (rows) => {
  const teacherIds = new Set();
  const parentTeachers = new Map();
  const validParentIds = (row) => [
    row.parentId,
    ...(Array.isArray(row.parentIds) ? row.parentIds : []),
  ].map(clean).filter((id) => id && !id.includes('/'));
  rows.forEach((row) => {
    const teacherId = clean(row.teacherId);
    if (!teacherId) return;
    teacherIds.add(teacherId);
    validParentIds(row).forEach((parentId) => {
      if (!parentTeachers.has(parentId)) parentTeachers.set(parentId, new Set());
      parentTeachers.get(parentId).add(teacherId);
    });
  });
  return {
    dateIndexedSessionCount: rows.length,
    canonicalTeacherIdPresent: count(rows, (row) => !!clean(row.teacherId)),
    missingCanonicalTeacherId: count(rows, (row) => !clean(row.teacherId)),
    sessionsWithTeacherAliasOnly: count(rows, (row) =>
      !clean(row.teacherId) && (clean(row.assignedTeacherId) || (Array.isArray(row.teacherIds) && row.teacherIds.length))),
    missingParentIdentifiers: count(rows, (row) => validParentIds(row).length === 0),
    distinctCanonicalTeachers: teacherIds.size,
    distinctParentsAttributableToCanonicalTeachers: parentTeachers.size,
    parentsWithMultipleActualTeachers: [...parentTeachers.values()].filter((ids) => ids.size > 1).length,
  };
};

const args = process.argv.slice(2);
const projectPosition = args.indexOf('--project');
const project = projectPosition >= 0 ? clean(args[projectPosition + 1]) : '';
if (args.includes('--help')) {
  console.log('Usage: node scripts/audit-month-close-teacher-filter.mjs --project tinysteps-react-v1');
} else if (project !== 'tinysteps-react-v1' || args.some((arg, index) =>
  arg !== '--project' && index !== projectPosition + 1)) {
  console.error('Specify exactly --project tinysteps-react-v1. Audit is restricted to the known production project.');
  process.exitCode = 2;
} else {
  try {
    const index = readIndexState(project);
    if (!index.matchCount || !index.states.every((state) => state === 'READY')) {
      throw new Error('Required classSessions(teacherId ASC, date ASC) production index is not confirmed READY.');
    }
    if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: project });
    const db = getFirestore();
    const months = [];
    for (const month of DEFAULT_MONTHS) {
      const { from, to } = monthRange(month);
      const snapshot = await db.collection('classSessions')
        .where('date', '>=', from)
        .where('date', '<=', to)
        .select('date', 'teacherId', 'teacherIds', 'assignedTeacherId', 'parentId', 'parentIds', 'status')
        .limit(CAP_PER_MONTH + 1).get();
      if (snapshot.size > CAP_PER_MONTH) {
        throw new Error(`Month ${month} exceeds the ${CAP_PER_MONTH}-record read ceiling; sample is incomplete.`);
      }
      months.push({ month, ...summarizeSessions(snapshot.docs.map((document) => document.data())) });
    }
    console.log(JSON.stringify({
      projectId: project,
      readOnly: true,
      index: { collectionGroup: 'classSessions', fields: ['teacherId ASC', 'date ASC'], state: 'READY' },
      months,
      limitations: 'Date-indexed sessions only. Historical sessions missing date are outside the scoped query. Counts do not identify individual teachers, children or parents.',
    }, null, 2));
    if (months.some((month) => month.missingParentIdentifiers || month.missingCanonicalTeacherId)) {
      process.exitCode = 3;
      console.error('Attribution gaps detected: review before merging or deploying the teacher filter.');
    }
  } catch (error) {
    console.error(`Read-only audit blocked: ${String(error?.message || error)}`);
    process.exitCode = 1;
  }
}
