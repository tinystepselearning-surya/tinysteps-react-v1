import type { CanonicalTopicOwnershipEntry } from './canonicalTopicOwnershipRegistry.js';

export const R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipEntry[];
export const R22_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipEntry[];
export function getR22CanonicalTopicOwner(topicId: string): CanonicalTopicOwnershipEntry | null;
export function getR22CanonicalTopicOwnerPath(topicId: string): string | null;
