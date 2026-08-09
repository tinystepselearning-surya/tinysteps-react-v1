import { describe, expect, it } from 'vitest';

import { averageReadingLevelFromDistribution } from '../../constants/schoolAssessment';
import type { ReadingLevelDistribution } from '../../types/SchoolProgramme';

const distribution = (
  partial: Partial<ReadingLevelDistribution>,
): ReadingLevelDistribution => ({
  TS0: 0,
  TS1: 0,
  TS2: 0,
  TS3: 0,
  TS4: 0,
  TS5: 0,
  TS6: 0,
  TS7: 0,
  TS8: 0,
  TS9: 0,
  ...partial,
});

describe('Tiny Steps early reading distribution', () => {
  it('derives assessed count and weighted TS level from one source of truth', () => {
    const result = averageReadingLevelFromDistribution(
      distribution({ TS2: 4, TS3: 6 }),
    );

    expect(result.studentsAssessed).toBe(10);
    expect(result.averageReadingLevel).toBe(2.6);
  });

  it('returns zero safely for an empty distribution', () => {
    expect(averageReadingLevelFromDistribution(distribution({}))).toEqual({
      studentsAssessed: 0,
      averageReadingLevel: 0,
    });
  });

  it('rounds weighted averages to two decimals', () => {
    const result = averageReadingLevelFromDistribution(
      distribution({ TS1: 1, TS2: 2 }),
    );

    expect(result.studentsAssessed).toBe(3);
    expect(result.averageReadingLevel).toBe(1.67);
  });
});
