export interface R19CanonicalTopicOwner {
  id: string;
  subject: string;
  intent: string;
  ownerPath: string;
  ownerRole: string;
  hubPath: string;
  queryIntent: string;
  supportingPaths: readonly string[];
  forbiddenCompetingOwners: readonly string[];
  publicationWave?: string;
}

export const R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP: readonly R19CanonicalTopicOwner[];
export const R19_CANONICAL_TOPIC_OWNERSHIP: readonly R19CanonicalTopicOwner[];
export function getR19CanonicalTopicOwner(topicId: string): R19CanonicalTopicOwner | null;
export function getR19CanonicalTopicOwnerPath(topicId: string): string | null;
