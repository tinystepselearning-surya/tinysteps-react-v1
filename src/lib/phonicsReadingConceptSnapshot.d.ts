export type PhonicsReadingConceptSnapshotEntry = Readonly<{
  id: string;
  label: string;
  conceptType: string;
  expansionState: string;
  canonicalOwnerTopicId: string | null;
  supportingOwnerPath: string | null;
  futureSlugCandidate: string | null;
}>;

export const PHONICS_READING_CONCEPT_SNAPSHOT_REVISION: string;
export const PHONICS_READING_CONCEPT_SNAPSHOT: readonly PhonicsReadingConceptSnapshotEntry[];
export function getPhonicsReadingConceptSnapshot(conceptId: string): PhonicsReadingConceptSnapshotEntry | null;
