import { describe, expect, it } from 'vitest';

import {
  normalizeCanonicalLearnerUpdateFields,
} from '../src/schoolOS/identity/canonicalPrimaryLearnerUpdate';

describe('Wave 1 R4 canonical-primary learner update contract', () => {
  it('normalizes the editable learner profile fields', () => {
    expect(
      normalizeCanonicalLearnerUpdateFields({
        displayName: '  Learner   Four  ',
        ageYears: 9,
        grade: ' Grade 3 ',
        status: 'suspended',
        countryCode: 'in',
      }),
    ).toEqual({
      displayName: 'Learner Four',
      ageYears: 9,
      grade: 'Grade 3',
      status: 'suspended',
      countryCode: 'IN',
    });
  });

  it('allows country removal and status preservation', () => {
    expect(
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'Learner Four',
        ageYears: 9,
        grade: 'Grade 3',
        status: null,
        countryCode: null,
      }),
    ).toEqual({
      displayName: 'Learner Four',
      ageYears: 9,
      grade: 'Grade 3',
      status: null,
      countryCode: null,
    });
  });

  it('fails closed on invalid learner update fields', () => {
    expect(() =>
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'A',
        ageYears: 9,
        grade: 'Grade 3',
        status: 'active',
        countryCode: 'IN',
      }),
    ).toThrow('displayName_not_canonical');

    expect(() =>
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'Learner',
        ageYears: 9.5,
        grade: 'Grade 3',
        status: 'active',
        countryCode: 'IN',
      }),
    ).toThrow('ageYears_not_canonical');

    expect(() =>
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'Learner',
        ageYears: 9,
        grade: '',
        status: 'active',
        countryCode: 'IN',
      }),
    ).toThrow('grade_not_canonical');

    expect(() =>
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'Learner',
        ageYears: 9,
        grade: 'Grade 3',
        status: 'trial' as any,
        countryCode: 'IN',
      }),
    ).toThrow('learner_status_not_canonical');

    expect(() =>
      normalizeCanonicalLearnerUpdateFields({
        displayName: 'Learner',
        ageYears: 9,
        grade: 'Grade 3',
        status: 'active',
        countryCode: 'IND',
      }),
    ).toThrow('countryCode_not_iso_alpha2');
  });
});
