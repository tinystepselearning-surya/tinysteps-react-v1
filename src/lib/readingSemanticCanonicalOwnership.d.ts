import type { CanonicalTopicOwnershipRecord } from './phonicsWave2CanonicalOwnership.js';

export const R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
export const R16_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipRecord[];
export function getR16CanonicalTopicOwner(topicId: string): CanonicalTopicOwnershipRecord | null;
export function getR16CanonicalTopicOwnerPath(topicId: string): string | null;
