export interface SpeakingCompletionCanonicalOwner {
  id: string;
  subject: string;
  intent: string;
  ownerPath: string;
  ownerRole: string;
  hubPath: string;
  queryIntent: string;
  supportingPaths: readonly string[];
  forbiddenCompetingOwners: readonly string[];
  publicationWave: string;
}

export const SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP: readonly SpeakingCompletionCanonicalOwner[];
export const SP6_CANONICAL_TOPIC_OWNERSHIP: readonly SpeakingCompletionCanonicalOwner[];
export function getSP6CanonicalTopicOwner(topicId: string): SpeakingCompletionCanonicalOwner | null;
export function getSP6CanonicalTopicOwnerPath(topicId: string): string | null;
