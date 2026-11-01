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
import { pathToFileURL } from 'node:url';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isRequiredIndex } from './ensure-teacher-earnings-session-index.mjs';

export const MAX_SESSION_READS_PER_MONTH = 50_000;
export const SESSION_PAGE_SIZE = 500;
const DEFAULT_MONTHS = ['2026-09', '2026-10'];
const clean = (value) => typeof value === 'string' ? value.trim() : '';

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

/**
 * Accumulate only aggregate counters and deduplication sets. Raw Firestore
 * records are discarded after each page and no personal identifiers are logged.
 */
const createSessionSummary = () => ({
  dateIndexedSessionCount: 0,
  canonicalTeacherIdPresent: 0,
  missingCanonicalTeacherId: 0,
  sessionsWithTeacherAliasOnly: 0,
  missingParentIdentifiers: 0,
  teacherIds: new Set(),
  parentTeachers: new Map(),
});

const validParentIds = (row) => [
  row.parentId,
  ...(Array.isArray(row.parentIds) ? row.parentIds : []),
].map(clean).filter((id) => id && !id.includes('/'));

export function addSessionToAuditSummary(summary, row) {
  summary.dateIndexedSessionCount += 1;
  const teacherId = clean(row.teacherId);
  const parents = validParentIds(row);
  if (!teacherId) {
    summary.missingCanonicalTeacherId += 1;
    if (clean(row.assignedTeacherId) || (Array.isArray(row.teacherIds) && row.teacherIds.length > 0)) {
      summary.sessionsWithTeacherAliasOnly += 1;
    }
  } else {
    summary.canonicalTeacherIdPresent += 1;
    summary.teacherIds.add(teacherId);
    parents.forEach((parentId) => {
      if (!summary.parentTeachers.has(parentId)) summary.parentTeachers.set(parentId, new Set());
      summary.parentTeachers.get(parentId).add(teacherId);
    });
  }
  if (!parents.length) summary.missingParentIdentifiers += 1;
}

export function finalizedSessionAuditSummary(summary) {
  return {
    dateIndexedSessionCount: summary.dateIndexedSessionCount,
    canonicalTeacherIdPresent: summary.canonicalTeacherIdPresent,
    missingCanonicalTeacherId: summary.missingCanonicalTeacherId,
    sessionsWithTeacherAliasOnly: summary.sessionsWithTeacherAliasOnly,
    missingParentIdentifiers: summary.missingParentIdentifiers,
    distinctCanonicalTeachers: summary.teacherIds.size,
    distinctParentsAttributableToCanonicalTeachers: summary.parentTeachers.size,
    parentsWithMultipleActualTeachers: [...summary.parentTeachers.values()].filter((ids) => ids.size > 1).length,
  };
}

/**
 * Read only the selected month with a stable cursor. Pages have a fixed size,
 * and a hard upper bound prevents unintentional unbounded production scans.
 * A complete result is returned only after the final (short/empty) page.
 *
 * Ordering by date retains Firestore's implicit document-ID tie-breaker,
 * including many sessions on the same date. DocumentSnapshot cursors preserve
 * that tie-breaker; never use a date-only cursor here.
 */
export async function auditMonthSessions({
  db,
  month,
  pageSize = SESSION_PAGE_SIZE,
  maxSessions = MAX_SESSION_READS_PER_MONTH,
}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    throw new Error('Invalid read-only session page size.');
  }
  if (!Number.isInteger(maxSessions) || maxSessions < 1) {
    throw new Error('Invalid read-only session ceiling.');
  }
  const { from, to } = monthRange(month);
  const baseQuery = db.collection('classSessions')
    .where('date', '>=', from)
    .where('date', '<=', to)
    .orderBy('date', 'asc')
    .select('date', 'teacherId', 'teacherIds', 'assignedTeacherId', 'parentId', 'parentIds', 'status');

  const summary = createSessionSummary();
  let lastDocument = null;
  let pagesRead = 0;
  while (true) {
    // The extra read checks for overflow when the exact ceiling is reached.
    const remaining = maxSessions - summary.dateIndexedSessionCount;
    const pageLimit = Math.min(pageSize, remaining + 1);
    const pageQuery = lastDocument ? baseQuery.startAfter(lastDocument) : baseQuery;
    const snapshot = await pageQuery.limit(pageLimit).get();
    const docs = snapshot.docs;
    pagesRead += 1;
    if (docs.length > remaining) {
      throw new Error(
        'Month ' + month + ' exceeds the ' + maxSessions.toLocaleString('en-US') + '-record audited read ceiling; no partial result is reported.',
      );
    }
    for (const doc of docs) addSessionToAuditSummary(summary, doc.data());
    if (docs.length < pageLimit) break;
    lastDocument = docs[docs.length - 1];
  }
  return {
    month,
    ...finalizedSessionAuditSummary(summary),
    pagesRead,
    complete: true,
  };
}

const isDirectInvocation = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectInvocation) {
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
      months.push(await auditMonthSessions({ db, month }));
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
}
