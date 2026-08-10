import { describe, expect, it } from 'vitest';
import { resolveWorksheetCourse } from '../../lib/worksheetCourseResolution';

const courses = [
  { id: 'phonics-foundations', name: 'Phonics Foundations', area: 'Phonics', status: 'active' },
  { id: 'early-phonics', name: 'Early Phonics', area: 'Phonics', status: 'active' },
  { id: 'advanced-phonics', name: 'Advanced Phonics', area: 'Phonics', status: 'active' },
  { id: 'grammar-4-6-years', name: 'Grammar 4-6 Years', area: 'Grammar', status: 'active' },
];

describe('worksheet course resolution', () => {
  it('uses a canonical courseId already stored on the lesson', () => {
    expect(resolveWorksheetCourse({
      lesson: { id: 'lesson-1', area: 'phonics', folderId: 'folder-1', courseId: 'early-phonics', courseTitle: 'Early Phonics' },
      folder: { id: 'folder-1', area: 'phonics', title: 'Foundations' },
      courses,
    })).toMatchObject({ courseId: 'early-phonics', courseTitle: 'Early Phonics', source: 'lesson', ambiguous: false });
  });

  it('derives Phonics Foundations from a Foundations lesson folder', () => {
    expect(resolveWorksheetCourse({
      lesson: { id: 'lesson-1', area: 'phonics', folderId: 'folder-1' },
      folder: { id: 'folder-1', area: 'phonics', title: 'Foundations' },
      courses,
    })).toMatchObject({ courseId: 'phonics-foundations', courseTitle: 'Phonics Foundations', source: 'inferred', ambiguous: false });
  });

  it('derives Early Phonics and Advanced Phonics from their exact lesson folders', () => {
    const early = resolveWorksheetCourse({
      lesson: { id: 'lesson-2', area: 'phonics', folderId: 'folder-2' },
      folder: { id: 'folder-2', area: 'phonics', title: 'Early Phonics' },
      courses,
    });
    const advanced = resolveWorksheetCourse({
      lesson: { id: 'lesson-3', area: 'phonics', folderId: 'folder-3' },
      folder: { id: 'folder-3', area: 'phonics', title: 'Advanced Phonics' },
      courses,
    });
    expect(early.courseId).toBe('early-phonics');
    expect(advanced.courseId).toBe('advanced-phonics');
  });

  it('does not guess when the lesson context is too weak', () => {
    expect(resolveWorksheetCourse({
      lesson: { id: 'lesson-x', area: 'phonics', folderId: 'folder-x' },
      folder: { id: 'folder-x', area: 'phonics', title: 'General' },
      courses,
    })).toMatchObject({ courseId: '', source: 'unresolved' });
  });
});
