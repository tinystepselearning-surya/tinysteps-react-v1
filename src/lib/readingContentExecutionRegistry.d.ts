export type ReadingContentExecutionState = 'published' | 'already-satisfied';

export interface ReadingContentExecutionRecord {
  id: string;
  state: ReadingContentExecutionState;
  domainId: string;
  path: string;
  priorAction: 'create' | 'refresh';
  rationale: string;
  contentRevision: string | null;
}

export const READING_CONTENT_EXECUTION_REVISION: string;
export const READING_CONTENT_EXECUTION_STATES: readonly ReadingContentExecutionState[];
export const READING_CONTENT_EXECUTION: readonly ReadingContentExecutionRecord[];
export function getReadingContentExecution(id: string): ReadingContentExecutionRecord | null;
export function getReadingContentExecutionByPath(pathname: string): ReadingContentExecutionRecord | null;
export function getPublishedReadingContentExecutions(): readonly ReadingContentExecutionRecord[];
