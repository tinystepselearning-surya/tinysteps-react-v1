import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET } from '../../content/phonicsKnowledge';
import {
  PHONICS_READING_CONCEPT_SNAPSHOT,
  getPhonicsReadingConceptSnapshot,
} from '../../lib/phonicsReadingConceptSnapshot.js';

describe('Session A runtime-safe R8 concept snapshot', () => {
  it('matches the complete R8 concept inventory without importing R8 at runtime', () => {
    expect(PHONICS_KNOWLEDGE_DATASET).toHaveLength(40);
    expect(PHONICS_READING_CONCEPT_SNAPSHOT).toHaveLength(PHONICS_KNOWLEDGE_DATASET.length);
    expect(new Set(PHONICS_READING_CONCEPT_SNAPSHOT.map((entry) => entry.id)).size).toBe(40);

    for (const source of PHONICS_KNOWLEDGE_DATASET) {
      const snapshot = getPhonicsReadingConceptSnapshot(source.id);
      expect(snapshot, source.id).not.toBeNull();
      expect(snapshot?.label).toBe(source.label);
      expect(snapshot?.conceptType).toBe(source.conceptType);
      expect(snapshot?.expansionState).toBe(source.expansionState);
      expect(snapshot?.canonicalOwnerTopicId).toBe(source.canonicalOwnerTopicId);
      expect(snapshot?.futureSlugCandidate).toBe(source.futureSlugCandidate);
      if (snapshot?.supportingOwnerPath) expect(source.supportingPaths).toContain(snapshot.supportingOwnerPath);
    }
  });

  it('uses supporting owner paths only for R8 supporting-only concepts', () => {
    for (const snapshot of PHONICS_READING_CONCEPT_SNAPSHOT) {
      if (snapshot.supportingOwnerPath) expect(snapshot.expansionState).toBe('supporting-only');
    }
  });
});
