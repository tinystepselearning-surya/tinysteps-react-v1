import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import { parentWorksheetIsGenerallyBrowseable, loadParentWorksheetResources, parentWorksheetIsAllowed, sanitizeWorksheetUrl } from '../src/getParentWorksheetResources';

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
    // Force a cold bootstrap even if another isolated emulator test has
    // already populated its catalogue.
    batch.set(db.collection('worksheetBundles').doc('parentLibraryV1'), { schemaVersion: 1, ready: false, entriesJson: '' });
    await batch.commit();

    const result = await loadParentWorksheetResources(db, parentA, kidA);
    // General course resources are browseable even outside enrolment;
    // child-targeted and other family's private worksheets remain denied.
    const ourResources = result.resources.filter((row) =>
      row.url === 'https://example.com/a.pdf' || row.url === 'https://example.com/b.pdf');
    expect(ourResources.map((row) => row.title).sort()).toEqual(['Allowed', 'Denied']);
    expect(ourResources[0]).not.toHaveProperty('teacherScript');
    expect(ourResources[0]).not.toHaveProperty('targetCourseIds');
    expect(ourResources[0]).not.toHaveProperty('targetKidIds');
    expect(ourResources[0]).not.toHaveProperty('targetEnrollmentIds');
    expect(ourResources[0]).not.toHaveProperty('targetParentIds');
    expect(ourResources[0]?.id).not.toContain(`allowed-${suffix}`);
    expect(result.enrolledCourseIds).toHaveLength(1);
    await expect(loadParentWorksheetResources(db, parentB, kidA)).rejects.toMatchObject({ code: 'permission-denied' });
  });
});


describe('parent worksheet course browsing access policy', () => {
  it('permits general resources across courses but never child, parent or enrolment overrides', () => {
    expect(parentWorksheetIsGenerallyBrowseable({
      active: true, targetCourseIds: ['other-course'],
    })).toBe(true);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetParentIds: ['all_parents'],
    })).toBe(true);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetKidIds: ['other-child'],
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetChildIds: ['other-child'],
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetEnrollmentIds: ['other-enrollment'],
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetParentIds: ['another-family'],
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], targetStageTags: ['stage-advanced'],
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], active: false,
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetCourseIds: ['other-course'], isArchived: true,
    })).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable({
      targetParentIds: ['all_parents'],
    })).toBe(false);
  });

  it('does not expose child-specific worksheets for parents in other courses', () => {
    const otherFamily = {
      targetCourseIds: ['other-course'],
      targetKidIds: ['other-child'],
      targetEnrollmentIds: ['other-enrollment'],
    };
    expect(parentWorksheetIsAllowed(otherFamily, context)).toBe(false);
    expect(parentWorksheetIsGenerallyBrowseable(otherFamily)).toBe(false);
  });
});
