import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import { fetchParentWorksheetCandidates, loadParentWorksheetResources, parentWorksheetIsAllowed, sanitizeWorksheetUrl } from '../src/getParentWorksheetResources';

const context = { parentId: 'parent-a', kidId: 'kid-a', courseIds: new Set(['course-a']), enrollmentIds: new Set(['enrollment-a']) };

describe('getParentWorksheetResources authorization', () => {
  it('allows only active records matching server-resolved course, child, and enrollment context', () => {
    expect(parentWorksheetIsAllowed({ active: true, targetCourseIds: ['course-a'], targetKidIds: ['kid-a'], targetEnrollmentIds: ['enrollment-a'] }, context)).toBe(true);
    expect(parentWorksheetIsAllowed({ active: true, targetCourseIds: ['course-b'] }, context)).toBe(false);
    expect(parentWorksheetIsAllowed({ active: true, targetCourseIds: ['course-a'], targetKidIds: ['kid-b'] }, context)).toBe(false);
    expect(parentWorksheetIsAllowed({ active: true, targetCourseIds: ['course-a'], targetEnrollmentIds: ['enrollment-b'] }, context)).toBe(false);
    expect(parentWorksheetIsAllowed({ active: false, targetCourseIds: ['course-a'] }, context)).toBe(false);
    expect(parentWorksheetIsAllowed({ archived: true, targetCourseIds: ['course-a'] }, context)).toBe(false);
  });

  it('supports intentional legacy parent targets without broadening other parents', () => {
    expect(parentWorksheetIsAllowed({ targetParentIds: ['parent-a'] }, context)).toBe(true);
    expect(parentWorksheetIsAllowed({ targetParentIds: ['parent-b'] }, context)).toBe(false);
    expect(parentWorksheetIsAllowed({ targetParentIds: ['all_parents'] }, context)).toBe(true);
  });

  it('sanitizes returned URLs', () => {
    expect(sanitizeWorksheetUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
    expect(sanitizeWorksheetUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeWorksheetUrl('data:text/html,test')).toBeNull();
    expect(sanitizeWorksheetUrl('http://example.com/file.pdf')).toBeNull();
  });
});

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('getParentWorksheetResources Firestore integration', () => {
  it('resolves ownership/enrollments server-side and excludes another family/course and teacher fields', async () => {
    const db = admin.firestore();
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const parentA = `parent-a-${suffix}`;
    const parentB = `parent-b-${suffix}`;
    const kidA = `kid-a-${suffix}`;
    const courseA = `course-a-${suffix}`;
    const courseB = `course-b-${suffix}`;
    const batch = db.batch();
    batch.set(db.collection('kids').doc(kidA), { parentIds: [parentA] });
    batch.set(db.collection('enrollments').doc(`enrollment-a-${suffix}`), { kidId: kidA, courseId: courseA, status: 'active' });
    batch.set(db.collection('parentWorksheetLibrary').doc(`allowed-${suffix}`), { title: 'Allowed', url: 'https://example.com/a.pdf', targetCourseIds: [courseA], teacherScript: 'never return' });
    batch.set(db.collection('parentWorksheetLibrary').doc(`denied-${suffix}`), { title: 'Denied', url: 'https://example.com/b.pdf', targetCourseIds: [courseB] });
    await batch.commit();

    const resources = await loadParentWorksheetResources(db, parentA, kidA);
    expect(resources).toHaveLength(1);
    expect(resources[0]).toMatchObject({ title: 'Allowed' });
    expect(resources[0]).not.toHaveProperty('teacherScript');
    expect(resources[0]).not.toHaveProperty('targetCourseIds');
    expect(resources[0]).not.toHaveProperty('targetKidIds');
    expect(resources[0]).not.toHaveProperty('targetEnrollmentIds');
    expect(resources[0]).not.toHaveProperty('targetParentIds');
    expect(resources[0]?.id).not.toContain(`allowed-${suffix}`);
    await expect(loadParentWorksheetResources(db, parentB, kidA)).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

type WorksheetRow = { id: string; data: Record<string, unknown> };

function fakeWorksheetLibrary(rows: WorksheetRow[]) {
  const queries: Array<{ field: string; op: string; values: string[] }> = [];
  const db = {
    collection(name: string) {
      if (name !== 'parentWorksheetLibrary') throw new Error('Unexpected collection: ' + name);
      return {
        where(field: string, op: string, values: string[]) {
          if (op !== 'array-contains-any') throw new Error('Unexpected query operator: ' + op);
          queries.push({ field, op, values });
          return {
            async get() {
              const docs = rows.filter((row) => {
                const targets = row.data[field];
                return Array.isArray(targets) && values.some((value) => targets.includes(value));
              }).map((row) => ({ id: row.id, data: () => row.data }));
              return { docs };
            },
          };
        },
        get() {
          throw new Error('Full worksheet-library scans are forbidden');
        },
      };
    },
  } as unknown as admin.firestore.Firestore;

  return { db, queries };
}

describe('parent worksheet targeted Firestore reads', () => {
  const auth = {
    parentId: 'parent-a',
    kidId: 'kid-a',
    courseIds: new Set(['course-a']),
    enrollmentIds: new Set(['enrollment-a']),
  };

  it('reads only course and legacy-parent candidates, never the whole library', async () => {
    const rows: WorksheetRow[] = [];
    for (let i = 0; i < 100; i++) {
      rows.push({ id: 'unrelated-' + String(i).padStart(3, '0'),
        data: { targetCourseIds: ['course-other'], title: 'Unrelated' } });
    }
    rows.push(
      { id: 'course', data: { title: 'Course', targetCourseIds: ['course-a'] } },
      { id: 'legacy-parent', data: { title: 'Parent', targetParentIds: ['parent-a'] } },
      { id: 'legacy-all', data: { title: 'All', targetParentIds: ['all_parents'] } },
      { id: 'different-parent', data: { targetParentIds: ['parent-b'] } },
    );
    const fake = fakeWorksheetLibrary(rows);
    const docs = await fetchParentWorksheetCandidates(fake.db, auth.parentId, auth.courseIds);
    expect(docs.map((doc) => doc.id)).toEqual(['course', 'legacy-all', 'legacy-parent']);
    expect(fake.queries).toEqual([
      { field: 'targetCourseIds', op: 'array-contains-any', values: ['course-a'] },
      { field: 'targetParentIds', op: 'array-contains-any', values: ['parent-a', 'all_parents'] },
    ]);
  });

  it('deduplicates matching course and parent targets but still denies unauthorized course overrides', async () => {
    const fake = fakeWorksheetLibrary([
      { id: 'both', data: { targetCourseIds: ['course-a'], targetParentIds: ['parent-a'] } },
      { id: 'foreign-course', data: { targetCourseIds: ['course-other'], targetParentIds: ['parent-a'] } },
      { id: 'wrong-child', data: { targetCourseIds: ['course-a'], targetKidIds: ['kid-b'] } },
      { id: 'wrong-enrollment', data: { targetParentIds: ['all_parents'], targetEnrollmentIds: ['enrollment-b'] } },
      { id: 'archived', data: { targetCourseIds: ['course-a'], archived: true } },
      { id: 'inactive', data: { targetCourseIds: ['course-a'], active: false } },
    ]);
    const docs = await fetchParentWorksheetCandidates(fake.db, auth.parentId, auth.courseIds);
    expect(docs.filter((doc) => parentWorksheetIsAllowed(doc.data(), auth)).map((doc) => doc.id)).toEqual(['both']);
    expect(docs.filter((doc) => doc.id === 'both')).toHaveLength(1);
  });

  it('batches more than 30 active course IDs without losing worksheets', async () => {
    const courseIds = new Set(Array.from({ length: 32 }, (_, i) => 'course-' + String(i).padStart(2, '0')));
    const fake = fakeWorksheetLibrary([
      { id: 'first', data: { targetCourseIds: ['course-00'] } },
      { id: 'last', data: { targetCourseIds: ['course-31'] } },
      { id: 'parent-only', data: { targetParentIds: ['all_parents'] } },
    ]);
    const docs = await fetchParentWorksheetCandidates(fake.db, auth.parentId, courseIds);
    expect(docs.map((doc) => doc.id)).toEqual(['first', 'last', 'parent-only']);
    expect(fake.queries).toHaveLength(3);
    expect(fake.queries[0].values).toHaveLength(30);
    expect(fake.queries[1].values).toHaveLength(2);
    expect(fake.queries[2].field).toBe('targetParentIds');
  });

  it('queries legacy parent assignments even when there are no active courses', async () => {
    const fake = fakeWorksheetLibrary([
      { id: 'legacy', data: { targetParentIds: ['parent-a'] } },
      { id: 'course', data: { targetCourseIds: ['course-a'] } },
    ]);
    const docs = await fetchParentWorksheetCandidates(fake.db, auth.parentId, new Set());
    expect(docs.map((doc) => doc.id)).toEqual(['legacy']);
    expect(fake.queries).toHaveLength(1);
    expect(fake.queries[0].field).toBe('targetParentIds');
  });
});
