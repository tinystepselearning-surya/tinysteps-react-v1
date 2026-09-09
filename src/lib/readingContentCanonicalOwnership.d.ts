export interface ReadingCanonicalTopicOwner {
  id: string;
  subject: 'phonics-reading';
  intent: string;
  ownerPath: string;
  ownerRole: 'editorial-pillar';
  hubPath: '/resources/phonics';
  queryIntent: string;
  supportingPaths: readonly string[];
  forbiddenCompetingOwners: readonly string[];
  publicationWave: 'reading-content-r15';
}

export const R15_READING_CANONICAL_TOPIC_OWNERSHIP: readonly ReadingCanonicalTopicOwner[];
export const R15_CANONICAL_TOPIC_OWNERSHIP: readonly object[];
