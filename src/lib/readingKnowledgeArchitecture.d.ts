export type ReadingKnowledgeDomainId =
  | 'oral-language'
  | 'phonological-awareness'
  | 'phonemic-awareness'
  | 'phonics-decoding'
  | 'word-recognition'
  | 'fluency'
  | 'vocabulary'
  | 'comprehension'
  | 'spelling-encoding';

export type ReadingContentAction = 'keep' | 'refresh' | 'consolidate' | 'create';

export interface ReadingKnowledgeDomain {
  id: ReadingKnowledgeDomainId;
  order: number;
  title: string;
  printBoundary: string;
  summary: string;
  adjacentDomainIds: readonly ReadingKnowledgeDomainId[];
}

export interface ReadingContentAuditRecord {
  id: string;
  domainId: ReadingKnowledgeDomainId;
  action: ReadingContentAction;
  path: string | null;
  proposedPath: string | null;
  canonicalTopicId: string | null;
  reasons: readonly string[];
  protectFromCompetingIntent: boolean;
}

export const READING_KNOWLEDGE_REVISION: string;
export const READING_CONTENT_ACTIONS: readonly ReadingContentAction[];
export const READING_KNOWLEDGE_DOMAINS: readonly ReadingKnowledgeDomain[];
export const READING_CONTENT_AUDIT: readonly ReadingContentAuditRecord[];
export function getReadingKnowledgeDomain(id: string): ReadingKnowledgeDomain | null;
export function getReadingContentAuditRecord(id: string): ReadingContentAuditRecord | null;
export function getReadingContentAuditForDomain(domainId: string): readonly ReadingContentAuditRecord[];
export function getReadingContentAuditByAction(action: string): readonly ReadingContentAuditRecord[];
