import assert from 'node:assert/strict';
import test from 'node:test';
import { auditMonthSessions } from './audit-month-close-teacher-filter.mjs';

// In-memory query implementation with Firestore's (date, documentId)
// ordering and document snapshot cursor behavior. No credentials or I/O.
function firestoreStub(records) {
  const documents = records.map((row, index) => ({
    id: String(index).padStart(7, '0'),
    data: () => row,
    date: row.date,
  })).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  let reads = 0;
  const query = (filters = [], afterId = null, max = 1000) => ({
    where(field, op, value) {
      assert.equal(field, 'date');
      return query([...filters, { op, value }], afterId, max);
    },
    orderBy(field, direction) {
      assert.equal(field, 'date');
      assert.equal(direction, 'asc');
      return query(filters, afterId, max);
    },
    select(...fields) {
      assert.ok(fields.includes('teacherId'));
      assert.ok(fields.includes('parentId'));
      return query(filters, afterId, max);
    },
    startAfter(documentSnapshot) {
      assert.ok(documentSnapshot?.id);
      return query(filters, documentSnapshot.id, max);
    },
    limit(nextMax) {
      assert.ok(nextMax > 0 && nextMax <= 1000);
      return query(filters, afterId, nextMax);
    },
    async get() {
      reads += 1;
      const rows = documents.filter((document) =>
        filters.every(({ op, value }) => op === '>='
          ? document.date >= value
          : document.date <= value)
        && (!afterId || document.id > afterId));
      return { docs: rows.slice(0, max) };
    },
  });
  return { db: { collection(name) { assert.equal(name, 'classSessions'); return query(); } }, reads: () => reads };
}

test('audits more than 2,000 sessions completely without stopping after the first page', async () => {
  const sessions = Array.from({ length: 2_501 }, (_, i) => ({
    date: '2026-09-18',
    teacherId: i % 2 === 0 ? 'teacher-a' : 'teacher-b',
    parentId: 'parent-' + (i % 100),
  }));
  const stub = firestoreStub(sessions);
  const result = await auditMonthSessions({ db: stub.db, month: '2026-09', pageSize: 500, maxSessions: 4_000 });
  assert.equal(result.dateIndexedSessionCount, 2501);
  assert.equal(result.canonicalTeacherIdPresent, 2501);
  assert.equal(result.distinctCanonicalTeachers, 2);
  assert.equal(result.distinctParentsAttributableToCanonicalTeachers, 100);
  assert.equal(result.complete, true);
  assert.equal(result.pagesRead, 6);
  assert.equal(stub.reads(), 6);
});

test('does not skip sessions when many records share the same date and the page boundary', async () => {
  const sessions = Array.from({ length: 8 }, (_, i) => ({
    date: '2026-10-01',
    teacherId: i === 7 ? '' : 'teacher-a',
    parentId: i === 6 ? '' : 'parent-' + i,
    assignedTeacherId: i === 7 ? 'teacher-a' : '',
  }));
  const result = await auditMonthSessions({
    db: firestoreStub(sessions).db, month: '2026-10', pageSize: 3, maxSessions: 20,
  });
  assert.equal(result.dateIndexedSessionCount, 8);
  assert.equal(result.missingCanonicalTeacherId, 1);
  assert.equal(result.sessionsWithTeacherAliasOnly, 1);
  assert.equal(result.missingParentIdentifiers, 1);
});

test('fails closed when the month has more than the hard per-month read ceiling', async () => {
  const sessions = Array.from({ length: 11 }, (_, i) => ({
    date: '2026-09-03', teacherId: 'teacher-a', parentId: 'parent-' + i,
  }));
  await assert.rejects(
    auditMonthSessions({ db: firestoreStub(sessions).db, month: '2026-09', pageSize: 3, maxSessions: 10 }),
    /exceeds the 10-record audited read ceiling; no partial result/,
  );
});

test('checks one extra page to confirm completeness at an exact record ceiling', async () => {
  const sessions = Array.from({ length: 6 }, (_, i) => ({
    date: '2026-09-03', teacherId: 'teacher-a', parentId: 'parent-' + i,
  }));
  const result = await auditMonthSessions({ db: firestoreStub(sessions).db, month: '2026-09', pageSize: 3, maxSessions: 6 });
  assert.equal(result.dateIndexedSessionCount, 6);
  assert.equal(result.complete, true);
  assert.equal(result.pagesRead, 3);
});

test('excludes other months and validates scan safety bounds', async () => {
  const stub = firestoreStub([
    { date: '2026-08-31', teacherId: 't', parentId: 'p1' },
    { date: '2026-09-01', teacherId: 't', parentId: 'p2' },
    { date: '2026-09-30', teacherId: 't', parentId: 'p3' },
    { date: '2026-10-01', teacherId: 't', parentId: 'p4' },
  ]);
  const result = await auditMonthSessions({ db: stub.db, month: '2026-09', pageSize: 2, maxSessions: 8 });
  assert.equal(result.dateIndexedSessionCount, 2);
  await assert.rejects(auditMonthSessions({ db: stub.db, month: '2026-13' }), /Invalid month key/);
  await assert.rejects(auditMonthSessions({ db: stub.db, month: '2026-09', pageSize: 0 }), /Invalid read-only session page size/);
});
