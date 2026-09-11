import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES,
  COMMERCIAL_C1_INTERNATIONAL_COMPLETE_QUERY_COUNT,
  COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES,
} from '../../lib/commercialC1InternationalCoreSubjectCompletion';

const markets = ['uae','usa','uk','australia','singapore','nri'];
const subjects = ['phonics','reading','grammar','writing','spoken_english','public_speaking','communication','broad_english','tutor'];

describe('Commercial C1 complete international core-subject matrix', () => {
  it('adds writing and spoken English for every required international audience', () => {
    expect(COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES).toHaveLength(12);
    for (const market of markets) {
      const rows = COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES.filter((row) => row.market === market);
      expect(rows, market).toHaveLength(2);
      expect(rows.some((row) => row.subject === 'writing')).toBe(true);
      expect(rows.some((row) => row.subject === 'spoken_english')).toBe(true);
    }
  });

  it('produces a 66-query international research matrix with every C1 subject represented', () => {
    expect(COMMERCIAL_C1_INTERNATIONAL_COMPLETE_QUERY_COUNT).toBe(66);
    expect(COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES).toHaveLength(66);
    for (const market of markets) {
      const rows = COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES.filter((row) => row.market === market);
      expect(rows, market).toHaveLength(11);
      for (const subject of subjects) {
        expect(rows.some((row) => row.subject === subject), `${market}:${subject}`).toBe(true);
      }
      expect(rows.some((row) => row.intent === 'price')).toBe(true);
      expect(rows.some((row) => row.intent === 'trial-demo')).toBe(true);
    }
  });

  it('keeps all added international rows research-only for C2 ownership', () => {
    expect(COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES.every((row) => row.status === 'RESEARCHED')).toBe(true);
    expect(COMMERCIAL_C1_INTERNATIONAL_CORE_SUBJECT_QUERIES.every((row) => row.ownershipDeferredTo === 'C2')).toBe(true);
  });
});
