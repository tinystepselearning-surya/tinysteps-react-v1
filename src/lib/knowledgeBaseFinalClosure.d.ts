export interface KnowledgeBaseFinalSession {
  readonly id: 'session-a' | 'session-b' | 'session-c';
  readonly label: string;
  readonly status: 'frozen';
  readonly closureEvidence: string;
  readonly protectedHub: string;
}

export interface KnowledgeBaseFinalCommercialOwner {
  readonly id: string;
  readonly subject: 'phonics-reading' | 'grammar-writing' | 'speaking-communication' | 'general-english';
  readonly path: string;
  readonly topicId: string | null;
}

export interface KnowledgeBaseFinalPolicy {
  readonly informationalExpansion: 'frozen';
  readonly reopenKnowledgeBase: 'evidence-required';
  readonly newInformationalOwners: 'hold';
  readonly commercialSeoExpansion: 'separate-project';
  readonly keywordResearch: 'commercial-project';
  readonly rule: string;
}

export interface KnowledgeBaseFinalSnapshot {
  readonly revision: string;
  readonly status: 'frozen';
  readonly sessions: readonly KnowledgeBaseFinalSession[];
  readonly protectedHubs: readonly string[];
  readonly protectedCommercialOwners: readonly KnowledgeBaseFinalCommercialOwner[];
  readonly policy: KnowledgeBaseFinalPolicy;
}

export const KNOWLEDGE_BASE_FINAL_REVISION: string;
export const KNOWLEDGE_BASE_FINAL_STATUS: 'frozen';
export const KNOWLEDGE_BASE_FINAL_SESSIONS: readonly KnowledgeBaseFinalSession[];
export const KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS: readonly string[];
export const KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS: readonly KnowledgeBaseFinalCommercialOwner[];
export const KNOWLEDGE_BASE_FINAL_POLICY: KnowledgeBaseFinalPolicy;
export function getKnowledgeBaseFinalSnapshot(): Readonly<KnowledgeBaseFinalSnapshot>;
