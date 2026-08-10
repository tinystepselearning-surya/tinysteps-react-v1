import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildParentPaymentSelectOptions,
  buildTeacherPaymentSelectOptions,
  resetParentPaymentSelectOptionMemory,
} from '../../pages/admin/paymentSelectOptions';

describe('payment select options', () => {
  beforeEach(() => {
    resetParentPaymentSelectOptionMemory();
  });

  it('shows initial limited parent options when search is empty', () => {
    const options = buildParentPaymentSelectOptions({
      loadedParents: [
        {
          id: 'parent-1',
          displayName: 'Parent One',
          phone: '9999999999',
        },
      ],
      searchResults: [],
      tableRows: [
        {
          parentId: 'parent-1',
          parentName: 'Parent One',
          studentNames: ['Child One'],
        },
      ],
      selectedParentId: '',
    });

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      id: 'parent-1',
      primaryLabel: 'Parent One',
      label: 'Parent One • Child One • 9999999999',
    });
  });

  it('dedupes parent search results against initial and loaded parent rows', () => {
    const options = buildParentPaymentSelectOptions({
      loadedParents: [
        {
          id: 'parent-1',
          displayName: 'Parent One',
          phone: '9999999999',
        },
      ],
      searchResults: [
        {
          id: 'parent-1',
          displayName: 'Parent One',
          email: 'parent1@example.com',
        },
        {
          id: 'parent-2',
          displayName: 'Parent Two',
          email: 'parent2@example.com',
        },
      ],
      tableRows: [
        {
          parentId: 'parent-1',
          parentName: 'Parent One',
          studentNames: ['Child One'],
        },
      ],
      selectedParentId: '',
    });

    expect(options.map((option) => option.id)).toEqual(['parent-1', 'parent-2']);
    expect(options[0].label).toContain('Child One');
  });

  it('keeps the selected parent visible even if not in current search results', () => {
    const options = buildParentPaymentSelectOptions({
      loadedParents: [
        {
          id: 'parent-picked',
          displayName: 'Chosen Parent',
          email: 'chosen@example.com',
        },
      ],
      searchResults: [],
      tableRows: [],
      selectedParentId: 'parent-picked',
    });

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      id: 'parent-picked',
      primaryLabel: 'Chosen Parent',
      label: 'Chosen Parent • chosen@example.com',
    });
  });

  it('keeps the month parent options available while the loaded scope narrows to one parent', () => {
    const monthParents = [
      { id: 'parent-1', displayName: 'Parent One' },
      { id: 'parent-2', displayName: 'Parent Two' },
      { id: 'parent-3', displayName: 'Parent Three' },
    ];
    const monthRows = monthParents.map((parent) => ({
      parentId: parent.id,
      parentName: parent.displayName,
    }));

    const initialOptions = buildParentPaymentSelectOptions({
      loadedParents: monthParents,
      searchResults: [],
      tableRows: monthRows,
      selectedParentId: '',
    });
    expect(initialOptions.map((option) => option.id)).toEqual([
      'parent-1',
      'parent-2',
      'parent-3',
    ]);

    const parentOneScope = buildParentPaymentSelectOptions({
      loadedParents: [monthParents[0]],
      searchResults: [],
      tableRows: [monthRows[0]],
      selectedParentId: 'parent-1',
    });
    expect(parentOneScope.map((option) => option.id)).toEqual([
      'parent-1',
      'parent-2',
      'parent-3',
    ]);

    const parentTwoScope = buildParentPaymentSelectOptions({
      loadedParents: [monthParents[1]],
      searchResults: [],
      tableRows: [monthRows[1]],
      selectedParentId: 'parent-2',
    });
    expect(parentTwoScope.map((option) => option.id)).toEqual([
      'parent-1',
      'parent-2',
      'parent-3',
    ]);
  });

  it('clears remembered parent options when the month/page scope resets', () => {
    buildParentPaymentSelectOptions({
      loadedParents: [
        { id: 'july-parent-1', displayName: 'July Parent One' },
        { id: 'july-parent-2', displayName: 'July Parent Two' },
      ],
      searchResults: [],
      tableRows: [
        { parentId: 'july-parent-1', parentName: 'July Parent One' },
        { parentId: 'july-parent-2', parentName: 'July Parent Two' },
      ],
      selectedParentId: '',
    });

    const resetOptions = buildParentPaymentSelectOptions({
      loadedParents: [],
      searchResults: [],
      tableRows: [],
      selectedParentId: '',
    });
    expect(resetOptions).toEqual([]);

    const augustOptions = buildParentPaymentSelectOptions({
      loadedParents: [{ id: 'aug-parent-1', displayName: 'August Parent One' }],
      searchResults: [],
      tableRows: [{ parentId: 'aug-parent-1', parentName: 'August Parent One' }],
      selectedParentId: '',
    });
    expect(augustOptions.map((option) => option.id)).toEqual(['aug-parent-1']);
  });

  it('shows loaded top10 teachers when search is empty and dedupes search matches', () => {
    const options = buildTeacherPaymentSelectOptions({
      loadedTeachers: [
        {
          id: 'teacher-1',
          displayName: 'Teacher One',
          phone: '8888888888',
        },
      ],
      searchResults: [
        {
          id: 'teacher-1',
          displayName: 'Teacher One',
          email: 'teacher1@example.com',
        },
        {
          id: 'teacher-2',
          displayName: 'Teacher Two',
          email: 'teacher2@example.com',
        },
      ],
      rows: [
        {
          teacherId: 'teacher-1',
          teacherName: 'Teacher One',
        },
      ],
      selectedTeacherId: '',
    });

    expect(options.map((option) => option.id)).toEqual(['teacher-1', 'teacher-2']);
    expect(options[0].label).toContain('Teacher One');
  });

  it('merges initial teacher options with loaded teacher rows without duplicates', () => {
    const options = buildTeacherPaymentSelectOptions({
      loadedTeachers: [
        {
          id: 'teacher-1',
          displayName: 'Teacher One',
          email: 'teacher1@example.com',
        },
        {
          id: 'teacher-2',
          displayName: 'Teacher Two',
          email: 'teacher2@example.com',
        },
      ],
      searchResults: [],
      rows: [
        {
          teacherId: 'teacher-1',
          teacherName: 'Teacher One',
        },
      ],
      selectedTeacherId: '',
    });

    expect(options.map((option) => option.id)).toEqual(['teacher-1', 'teacher-2']);
  });

  it('keeps the selected teacher visible even if not in current search results', () => {
    const options = buildTeacherPaymentSelectOptions({
      loadedTeachers: [
        {
          id: 'teacher-picked',
          displayName: 'Chosen Teacher',
          email: 'chosen.teacher@example.com',
        },
      ],
      searchResults: [],
      rows: [],
      selectedTeacherId: 'teacher-picked',
    });

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      id: 'teacher-picked',
      primaryLabel: 'Chosen Teacher',
      label: 'Chosen Teacher • chosen.teacher@example.com',
    });
  });
});
