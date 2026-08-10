import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import { loadParentWorksheetResources, parentWorksheetIsAllowed, sanitizeWorksheetUrl } from '../src/getParentWorksheetResources';

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
