export interface SpeakingCompletionBrick { id: string; label: string; state: 'complete' | 'frozen'; }
export interface SpeakingCompletionGap { id: string; priority: string; action: string; ownerPath: string; supportingPath?: string; rationale: string; }
export interface SpeakingCompletionClusterOwner { id: string; domainId: string; ownerPath: string; supportingPaths?: readonly string[]; }
export interface SpeakingParentProblemRoute { id: string; problem: string; ownerPath: string; supportingPath?: string; practicePath: string; }
export interface SpeakingPracticeRoute { domainId: string; practicePath: string; }
export interface SpeakingCommunicationFreeze { state: 'frozen'; revision: string; reason: string; protectedCommercialOwner: string; protectedSubjectHub: string; protectedSpokenEnglishCommercialOwner: string; contentExpansionAllowed: false; }

export const SPEAKING_COMMUNICATION_COMPLETION_REVISION: string;
export const SPEAKING_COMMUNICATION_COMPLETION_BRICKS: readonly SpeakingCompletionBrick[];
export const SPEAKING_COMMUNICATION_POST_R22_GAPS: readonly SpeakingCompletionGap[];
export const SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS: readonly SpeakingCompletionClusterOwner[];
export const SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES: readonly SpeakingParentProblemRoute[];
export const SPEAKING_COMMUNICATION_PRACTICE_ROUTES: readonly SpeakingPracticeRoute[];
export const SPEAKING_COMMUNICATION_FREEZE: SpeakingCommunicationFreeze;
