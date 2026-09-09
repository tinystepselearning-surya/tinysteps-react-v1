export type GrammarWritingContentAction = 'keep' | 'refresh' | 'consolidate' | 'create';

export interface GrammarWritingKnowledgeDomain {
  id: string;
  order: number;
  label: string;
  summary: string;
  adjacentDomainIds: readonly string[];
}

export interface GrammarWritingContentAuditRecord {
  id: string;
  domainId: string;
  action: GrammarWritingContentAction;
  canonicalTopicId: string | null;
  path: string | null;
  proposedPath: string | null;
  reasons: readonly string[];
}

export const GRAMMAR_WRITING_KNOWLEDGE_REVISION: string;
export const GRAMMAR_WRITING_CONTENT_ACTIONS: readonly GrammarWritingContentAction[];
export const GRAMMAR_WRITING_KNOWLEDGE_DOMAINS: readonly GrammarWritingKnowledgeDomain[];
export const GRAMMAR_WRITING_CONTENT_AUDIT: readonly GrammarWritingContentAuditRecord[];
export function getGrammarWritingKnowledgeDomain(id: string): GrammarWritingKnowledgeDomain | null;
export function getGrammarWritingContentAuditRecord(id: string): GrammarWritingContentAuditRecord | null;
export function getGrammarWritingContentAuditForDomain(domainId: string): readonly GrammarWritingContentAuditRecord[];
export function getGrammarWritingContentAuditByAction(action: GrammarWritingContentAction): readonly GrammarWritingContentAuditRecord[];
