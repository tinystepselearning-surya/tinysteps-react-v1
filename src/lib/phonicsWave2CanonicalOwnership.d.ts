export interface CanonicalTopicOwnershipRecord {
  id: string;
  subject: string;
  intent: string;
  ownerPath: string;
  ownerRole: string;
  hubPath: string | null;
  queryIntent: string;
  supportingPaths: readonly string[];
  forbiddenCompetingOwners: readonly string[];
  publicationWave?: string;
}

export const PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
export const R12_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
