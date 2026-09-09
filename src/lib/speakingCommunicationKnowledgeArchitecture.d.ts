export type SpeakingCommunicationContentAction = 'keep' | 'refresh' | 'consolidate' | 'create';

export interface SpeakingCommunicationKnowledgeDomain {
  readonly id: string;
  readonly order: number;
  readonly label: string;
  readonly summary: string;
  readonly adjacentDomainIds: readonly string[];
}

export interface SpeakingCommunicationContentAuditRecord {
  readonly id: string;
  readonly domainId: string;
  readonly action: SpeakingCommunicationContentAction;
  readonly canonicalTopicId: string | null;
  readonly path: string | null;
  readonly proposedPath: string | null;
  readonly consolidationTarget: string | null;
  readonly implementationState: 'established' | 'proposal-only' | 'hold';
  readonly publicationApproved: false;
  readonly urlChangeAuthorized: false;
  readonly reasons: readonly string[];
}

export const SPEAKING_COMMUNICATION_KNOWLEDGE_REVISION: '2026-09-09-r20';
export const SPEAKING_COMMUNICATION_CONTENT_ACTIONS: readonly SpeakingCommunicationContentAction[];
export const SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS: readonly SpeakingCommunicationKnowledgeDomain[];
export const SPEAKING_COMMUNICATION_CONTENT_AUDIT: readonly SpeakingCommunicationContentAuditRecord[];
export function getSpeakingCommunicationKnowledgeDomain(id: string): SpeakingCommunicationKnowledgeDomain | null;
export function getSpeakingCommunicationContentAuditRecord(id: string): SpeakingCommunicationContentAuditRecord | null;
export function getSpeakingCommunicationContentAuditForDomain(domainId: string): readonly SpeakingCommunicationContentAuditRecord[];
export function getSpeakingCommunicationContentAuditByAction(action: SpeakingCommunicationContentAction): readonly SpeakingCommunicationContentAuditRecord[];
