export type SpeakingCommunicationContentExecutionState = 'published';

export interface SpeakingCommunicationContentExecutionRecord {
  readonly id: string;
  readonly state: SpeakingCommunicationContentExecutionState;
  readonly domainId: string;
  readonly path: string;
  readonly priorAction: 'create';
  readonly rationale: string;
  readonly contentRevision: '2026-09-10-r21';
}

export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION_REVISION: '2026-09-10-r21';
export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION_STATES: readonly SpeakingCommunicationContentExecutionState[];
export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION: readonly SpeakingCommunicationContentExecutionRecord[];
export function getSpeakingCommunicationContentExecution(id: string): SpeakingCommunicationContentExecutionRecord | null;
export function getSpeakingCommunicationContentExecutionByPath(pathname: string): SpeakingCommunicationContentExecutionRecord | null;
export function getPublishedSpeakingCommunicationContentExecutions(): readonly SpeakingCommunicationContentExecutionRecord[];
