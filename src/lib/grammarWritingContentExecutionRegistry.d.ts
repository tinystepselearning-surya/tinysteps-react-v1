export type GrammarWritingContentExecutionState = 'published';

export interface GrammarWritingContentExecutionRecord {
  id: string;
  state: GrammarWritingContentExecutionState;
  domainId: string;
  path: string;
  priorAction: 'create';
  rationale: string;
  contentRevision: string;
}

export const GRAMMAR_WRITING_CONTENT_EXECUTION_REVISION: string;
export const GRAMMAR_WRITING_CONTENT_EXECUTION_STATES: readonly GrammarWritingContentExecutionState[];
export const GRAMMAR_WRITING_CONTENT_EXECUTION: readonly GrammarWritingContentExecutionRecord[];
export function getGrammarWritingContentExecution(id: string): GrammarWritingContentExecutionRecord | null;
export function getGrammarWritingContentExecutionByPath(pathname: string): GrammarWritingContentExecutionRecord | null;
export function getPublishedGrammarWritingContentExecutions(): readonly GrammarWritingContentExecutionRecord[];
