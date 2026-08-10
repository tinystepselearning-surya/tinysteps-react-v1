import { describe, expect, it } from 'vitest';
import {
  existingArchivedState,
  explicitTeacherScriptPatch,
  removeLessonWorksheetResource,
  worksheetResourceProjectionPatch,
} from '../../lib/adminWorksheetResources';

const oldResource = { id: 'worksheet-1', title: 'Old', url: 'https://example.com/old.pdf', active: true, archived: false };
const nextResource = { ...oldResource, title: 'Edited' };

describe('admin worksheet resource integrity', () => {
  it('creates and edits worksheet projections without modifying teacherScript', () => {
    const patch = worksheetResourceProjectionPatch([], nextResource);
    expect(patch.worksheetResources).toEqual([nextResource]);
    expect(patch).not.toHaveProperty('teacherScript');
  });

  it('moves a worksheet by removing the old projection and adding the new projection independently', () => {
    const oldLesson = removeLessonWorksheetResource([oldResource], oldResource.id);
    const newLesson = worksheetResourceProjectionPatch([], nextResource).worksheetResources;
    expect(oldLesson).toEqual([]);
    expect(newLesson).toEqual([nextResource]);
  });

  it('preserves archived state during edits so restore remains explicit', () => {
    expect(existingArchivedState({ archived: true })).toBe(true);
    expect(existingArchivedState({ isArchived: true })).toBe(true);
    expect(existingArchivedState({ archived: false })).toBe(false);
  });

  it('class-script state is absent even when worksheet projection inputs change or move', () => {
    expect(Object.keys(worksheetResourceProjectionPatch([oldResource], nextResource))).toEqual(['worksheetResources']);
  });

  it('changes or clears script only through the explicit script patch', () => {
    expect(explicitTeacherScriptPatch('  New script  ')).toEqual({ teacherScript: 'New script' });
    expect(explicitTeacherScriptPatch('')).toEqual({ teacherScript: '' });
  });

  it('projects hide, activate, archive, and restore state without changing identity', () => {
    const hidden = worksheetResourceProjectionPatch([], { ...oldResource, active: false }).worksheetResources[0];
    const archived = worksheetResourceProjectionPatch([hidden], { ...hidden, archived: true }).worksheetResources[0];
    const restored = worksheetResourceProjectionPatch([archived], { ...archived, archived: false }).worksheetResources[0];
    expect(hidden).toMatchObject({ id: 'worksheet-1', active: false });
    expect(archived).toMatchObject({ id: 'worksheet-1', archived: true });
    expect(restored).toMatchObject({ id: 'worksheet-1', archived: false });
  });
});
