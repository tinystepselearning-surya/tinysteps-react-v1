import { describe, expect, it } from 'vitest';
import {
  readWorksheetBundleEntries,
  worksheetBundlePatch,
} from '../../lib/parentWorksheetBundle';

describe('admin worksheet catalogue transaction projection', () => {
  it('writes only safe worksheet fields and preserves the rest of the catalogue', () => {
    const start = worksheetBundlePatch(
      { schemaVersion: 1, ready: true, entriesJson: JSON.stringify([
        { id: 'other', data: { title: 'Other', targetCourseIds: ['grammar'] } },
      ]) },
      'new',
      { title: 'New', url: 'https://example.com/new.pdf', teacherScript: 'private',
        targetCourseIds: ['phonics'], updatedByEmail: 'internal@example.com' },
    );
    const entries = readWorksheetBundleEntries(start);
    expect(entries?.map((row) => row.id)).toEqual(['new', 'other']);
    expect(entries?.[0].data).toMatchObject({ title: 'New', targetCourseIds: ['phonics'] });
    expect(entries?.[0].data).not.toHaveProperty('teacherScript');
    expect(entries?.[0].data).not.toHaveProperty('updatedByEmail');
    const second = worksheetBundlePatch(start, 'new', { title: 'Edited', targetCourseIds: ['phonics'] });
    expect(readWorksheetBundleEntries(second)?.[0].data.title).toBe('Edited');
  });

  it('invalidates absent catalogue safely before its first server bootstrap', () => {
    expect(worksheetBundlePatch(undefined, 'sheet', { title: 'New' })).toMatchObject({
      schemaVersion: 1, ready: false,
    });
  });
});
