#!/usr/bin/env node
'use strict';

/**
 * READ ONLY: preview the October 12 (Today) and October 13 (Tomorrow)
 * sessions from live Student Management timetables.
 *
 * Uses the SAME compiled pure planner used by the production daily worker.
 * Must run with functions/lib built for the intended release commit.
 * Does not invoke the nightly writer, change enrolments, or write Firestore.
 */
const admin = require('firebase-admin');
const {buildDailySessionRunPlan} = require('../lib/scheduling/nextDaySessionPlan');

const PROJECT = 'tinysteps-react-v1';
const MAX_ENROLLMENTS = 450;
const BATCH = 100;
const ACTIVE = [
  'active', 'enrolled', 'current', 'ongoing', 'pending_payment', 'pending_lp',
];
const FIRST_DAY = '2026-10-12';
const value = x => typeof x === 'string' ? x.trim() : '';

function childId(row) {
  const ids = Array.isArray(row.kidIds) ? row.kidIds.map(value).filter(Boolean) : [];
  return value(row.kidId) || ids[0] || value(row.studentId) || value(row.childId);
}

function isActiveKid(row) {
  return !(row.archived || row.isArchived || row.archivedAt ||
    row.deleted || row.isDeleted || row.deletedAt) &&
    ['', 'active'].includes(value(row.status).toLowerCase());
}

async function main() {
  if (!admin.apps.length) admin.initializeApp({
    credential: admin.credential.applicationDefault(), projectId: PROJECT,
  });
  const db = admin.firestore();
  const snapshot = await db.collection('enrollments')
    .where('status', 'in', ACTIVE).limit(MAX_ENROLLMENTS).get();
  if (snapshot.size === MAX_ENROLLMENTS) throw Error('Enrollment query safety limit reached');
  const enrollments = snapshot.docs.map(doc => ({id: doc.id, data: doc.data()}));
  const childIds = [...new Set(enrollments.map(e => childId(e.data)).filter(Boolean))];
  const activeKidIds = new Set();
  let childrenFound = 0;
  for (let i = 0; i < childIds.length; i += BATCH) {
    const snaps = await db.getAll(
      ...childIds.slice(i, i + BATCH).map(id => db.collection('kids').doc(id)),
    );
    for (const doc of snaps) {
      if (!doc.exists) continue;
      childrenFound += 1;
      if (isActiveKid(doc.data() || {})) activeKidIds.add(doc.id);
    }
  }

  const plan = buildDailySessionRunPlan({
    todayYmd: FIRST_DAY, enrollments, activeKidIds,
  });
  const planned = plan.plans.flatMap(item => item.occurrences);
  const issueCounts = {};
  for (const issue of plan.plans.flatMap(item => item.issues)) {
    issueCounts[issue.reason] = (issueCounts[issue.reason] || 0) + 1;
  }

  const existing = {};
  for (const day of plan.targetDays) {
    const snap = await db.collection('classSessions')
      .where('date', '==', day).limit(1000).get();
    if (snap.size === 1000) throw Error('Day session query safety limit reached');
    const counts = {};
    for (const doc of snap.docs) {
      const status = value(doc.data().status).toLowerCase() || 'missing';
      counts[status] = (counts[status] || 0) + 1;
    }
    existing[day] = {documents: snap.size, statusCounts: counts};
  }

  const countsByDay = Object.fromEntries(plan.targetDays.map(
    day => [day, planned.filter(x => x.date === day).length],
  ));
  console.log(JSON.stringify({
    projectId: PROJECT, mode: 'READ_ONLY',
    source: 'active_student_management_weekly_timetables',
    targetDays: plan.targetDays,
    enrollmentDocumentsRead: enrollments.length,
    childDocumentsRead: childrenFound,
    activeChildren: activeKidIds.size,
    sessionsExpectedFromTimetables: planned.length,
    expectedByDay: countsByDay,
    skippedByReason: issueCounts,
    liveSessionsBeforeReset: existing,
    firestoreWrites: 0,
    firestoreDeletes: 0,
  }, null, 2));
}
main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
