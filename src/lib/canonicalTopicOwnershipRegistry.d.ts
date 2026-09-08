export type CanonicalTopicSubject =
  | 'resources'
  | 'phonics-reading'
  | 'grammar-writing'
  | 'speaking-communication'
  | 'schools-research'
  | 'general-english';

export type CanonicalTopicOwnerRole =
  | 'gateway'
  | 'subject-hub'
  | 'editorial-library'
  | 'editorial-pillar'
  | 'skill-guide'
  | 'activity-guide'
  | 'diagnostic-owner'
  | 'practice-hub'
  | 'practice-category'
  | 'commercial-programme'
  | 'commercial-research'
  | 'commercial-comparison'
  | 'problem-landing'
  | 'support-hub'
  | 'conversion'
  | 'b2b-hub';

export interface CanonicalTopicOwnershipEntry {
  readonly id: string;
  readonly subject: CanonicalTopicSubject;
  readonly intent: string;
  readonly ownerPath: string;
  readonly ownerRole: CanonicalTopicOwnerRole;
  readonly hubPath: string | null;
  readonly queryIntent: string;
  readonly supportingPaths: readonly string[];
  readonly forbiddenCompetingOwners: readonly string[];
}

export const CANONICAL_TOPIC_SUBJECTS: readonly CanonicalTopicSubject[];
export const CANONICAL_TOPIC_OWNER_ROLES: readonly CanonicalTopicOwnerRole[];
export const CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipEntry[];
export const CANONICAL_TOPIC_OWNERS_BY_ID: Readonly<Record<string, CanonicalTopicOwnershipEntry>>;
export function getCanonicalTopicOwner(topicId: string): CanonicalTopicOwnershipEntry;
export function getCanonicalTopicOwnerPath(topicId: string): string;
export function getCanonicalTopicsForSubject(subject: CanonicalTopicSubject): readonly CanonicalTopicOwnershipEntry[];
