export interface R22SpeakingCommunicationCanonicalOwner {
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

export const R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP: readonly R22SpeakingCommunicationCanonicalOwner[];
export const R22_CANONICAL_TOPIC_OWNERSHIP: readonly R22SpeakingCommunicationCanonicalOwner[];
export function getR22CanonicalTopicOwner(topicId: string): R22SpeakingCommunicationCanonicalOwner | null;
export function getR22CanonicalTopicOwnerPath(topicId: string): string | null;
