import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  addSchoolAccess,
  normalizeSchoolIds,
  normalizeSchoolStatus,
  removeSchoolAccess,
} from '../src/helpers/schools';

describe(
  'school-domain helpers',
  () => {
    it(
      'normalizes school status',
      () => {
        expect(
          normalizeSchoolStatus(
            'ACTIVE',
          ),
        ).toBe('active');

        expect(
          normalizeSchoolStatus(
            ' paused ',
          ),
        ).toBe('paused');

        expect(
          normalizeSchoolStatus(
            'invalid',
          ),
        ).toBeNull();
      },
    );

    it(
      'deduplicates school ids',
      () => {
        expect(
          normalizeSchoolIds([
            'a',
            'a',
            'b',
            '',
          ]),
        ).toEqual([
          'a',
          'b',
        ]);
      },
    );

    it(
      'links first school as primary',
      () => {
        expect(
          addSchoolAccess(
            [],
            null,
            'school-a',
          ),
        ).toEqual({
          schoolIds: [
            'school-a',
          ],
          primarySchoolId:
            'school-a',
        });
      },
    );

    it(
      'keeps existing primary unless makePrimary is requested',
      () => {
        expect(
          addSchoolAccess(
            ['school-a'],
            'school-a',
            'school-b',
            false,
          ),
        ).toEqual({
          schoolIds: [
            'school-a',
            'school-b',
          ],
          primarySchoolId:
            'school-a',
        });

        expect(
          addSchoolAccess(
            [
              'school-a',
              'school-b',
            ],
            'school-a',
            'school-b',
            true,
          ).primarySchoolId,
        ).toBe(
          'school-b',
        );
      },
    );

    it(
      'promotes another school when primary access is removed',
      () => {
        expect(
          removeSchoolAccess(
            [
              'school-a',
              'school-b',
            ],
            'school-a',
            'school-a',
          ),
        ).toEqual({
          schoolIds: [
            'school-b',
          ],
          primarySchoolId:
            'school-b',
        });
      },
    );

    it(
      'becomes unassigned when final school is removed',
      () => {
        expect(
          removeSchoolAccess(
            ['school-a'],
            'school-a',
            'school-a',
          ),
        ).toEqual({
          schoolIds: [],
          primarySchoolId:
            null,
        });
      },
    );
  },
);
