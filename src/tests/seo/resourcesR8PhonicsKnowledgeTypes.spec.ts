import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  getPhonicsKnowledgeConcept, getBrick9PilotCandidates, getPhonicsKnowledgeForLesson,
  type PhonicsKnowledgeConcept, type PhonicsExpansionState,
} from '../../content/phonicsKnowledge/index.js';

describe('R8 TypeScript consumer contract', () => {
  it('exposes precise nullable lookups and immutable typed collections', () => {
    expectTypeOf(getPhonicsKnowledgeConcept('satpin')).toEqualTypeOf<PhonicsKnowledgeConcept | null>();
    expectTypeOf(getBrick9PilotCandidates()).toEqualTypeOf<readonly PhonicsKnowledgeConcept[]>();
    const concepts = getPhonicsKnowledgeForLesson('early-phonics__lesson-01');
    expectTypeOf(concepts).toEqualTypeOf<readonly PhonicsKnowledgeConcept[]>();
    const state: PhonicsExpansionState = 'pilot-wave-1';
    expect(getBrick9PilotCandidates().every((c) => c.expansionState === state)).toBe(true);
    expectTypeOf<PhonicsKnowledgeConcept['publicationApproved']>().toEqualTypeOf<false>();
    expectTypeOf<PhonicsKnowledgeConcept['exampleWords']>().toEqualTypeOf<readonly string[]>();
  });
});
