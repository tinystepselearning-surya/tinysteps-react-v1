import type { CanonicalTopicOwnershipEntry } from './canonicalTopicOwnershipRegistry.js';

export const R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipEntry[];
export const R21_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnershipEntry[];
export function getR21CanonicalTopicOwner(topicId: string): CanonicalTopicOwnershipEntry | null;
export function getR21CanonicalTopicOwnerPath(topicId: string): string | null;
