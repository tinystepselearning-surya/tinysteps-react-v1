import type * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import {
  buildParentWorksheetBundle,
  decodeParentWorksheetBundle,
  loadParentWorksheetBundle,
  parentWorksheetBundleEntry,
  updateParentWorksheetBundle,
} from '../src/helpers/parentWorksheetBundle';

describe('parent worksheet one-document read model', () => {
  it('redacts all teacher/admin-only fields from the cached projection', () => {
    const entry = parentWorksheetBundleEntry('sheet-1', {
      title: 'Read aloud',
      url: 'https://example.com/a.pdf',
      targetCourseIds: ['phonics'],
      teacherScript: 'private preparation notes',
      updatedByEmail: 'private@example.com',
      createdAt: new Date(),
      notes: 'hidden',
    });
    expect(entry.data).toMatchObject({
      title: 'Read aloud',
      url: 'https://example.com/a.pdf',
      targetCourseIds: ['phonics'],
    });
    expect(entry.data).not.toHaveProperty('teacherScript');
    expect(entry.data).not.toHaveProperty('updatedByEmail');
    expect(entry.data).not.toHaveProperty('createdAt');
    expect(entry.data).not.toHaveProperty('notes');
  });

  it('retrieves all 100 worksheet resources with exactly one document read on the warm path', async () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      parentWorksheetBundleEntry('sheet-' + i, {
        title: 'Worksheet ' + i, url: 'https://example.com/file-' + i,
        targetCourseIds: ['phonics'],
      }));
    const bundle = buildParentWorksheetBundle(entries);
    const reads: string[] = [];
    const db = {
      collection(name: string) {
        if (name !== 'worksheetBundles') throw new Error('Unexpected full-library read');
        return {
          doc(id: string) {
            return {
              async get() {
                reads.push(name + '/' + id);
                return { data: () => bundle };
              },
            };
          },
        };
      },
      runTransaction() { throw new Error('Warm bundles should not use a transaction'); },
    } as unknown as admin.firestore.Firestore;
    const loaded = await loadParentWorksheetBundle(db);
    expect(loaded).toHaveLength(100);
    expect(reads).toEqual(['worksheetBundles/parentLibraryV1']);
    expect(decodeParentWorksheetBundle(bundle)).toEqual(entries);
  });

  it('updates, deduplicates and removes worksheet entries without losing other courses', () => {
    const starting = [
      parentWorksheetBundleEntry('a', { title: 'A', targetCourseIds: ['a'] }),
      parentWorksheetBundleEntry('b', { title: 'B', targetCourseIds: ['b'] }),
    ];
    const revised = updateParentWorksheetBundle(starting, 'a', {
      title: 'Revised A', targetCourseIds: ['a'], teacherScript: 'should not leak',
    });
    expect(revised.map((row) => row.id)).toEqual(['a', 'b']);
    expect(revised[0].data.title).toBe('Revised A');
    expect(revised[0].data).not.toHaveProperty('teacherScript');
    expect(updateParentWorksheetBundle(revised, 'b', null)).toHaveLength(1);
  });

  it('marks oversized bundles unavailable rather than silently truncate worksheets', () => {
    const gigantic = parentWorksheetBundleEntry('large', {
      description: 'X'.repeat(810_000),
    });
    const bundle = buildParentWorksheetBundle([gigantic]);
    expect(bundle).toMatchObject({ ready: false, oversized: true });
    expect(decodeParentWorksheetBundle(bundle)).toBeNull();
  });
});
