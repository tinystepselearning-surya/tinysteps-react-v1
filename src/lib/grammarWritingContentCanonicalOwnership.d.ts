import type { CanonicalTopicOwnershipRecord } from './phonicsWave2CanonicalOwnership.js';

export const R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
export const R18_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
export function getR18CanonicalTopicOwner(topicId: string): CanonicalTopicOwnershipRecord | null;
export function getR18CanonicalTopicOwnerPath(topicId: string): string | null;
