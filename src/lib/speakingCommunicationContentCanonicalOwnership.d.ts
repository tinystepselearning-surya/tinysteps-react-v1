import type { CanonicalTopicOwnership } from './canonicalTopicOwnershipRegistry.js';

export const R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnership[];
export const R21_CANONICAL_TOPIC_OWNERSHIP: readonly CanonicalTopicOwnership[];
export function getR21CanonicalTopicOwner(topicId: string): CanonicalTopicOwnership | null;
export function getR21CanonicalTopicOwnerPath(topicId: string): string | null;
