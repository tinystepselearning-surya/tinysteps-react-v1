export type SpeakingCommunicationSemanticRelation = 'hub' | 'prerequisite' | 'next' | 'related' | 'diagnostic' | 'practice' | 'assessment' | 'programme';

export interface SpeakingCommunicationSemanticLinkDefinition {
  relation: SpeakingCommunicationSemanticRelation;
  targetTopicId: string;
  label: string;
  rationale: string;
}

export interface SpeakingCommunicationSemanticJourney {
  sourceTopicId: string;
  links: readonly SpeakingCommunicationSemanticLinkDefinition[];
}

export interface ResolvedSpeakingCommunicationSemanticLink extends SpeakingCommunicationSemanticLinkDefinition {
  to: string;
  targetOwnerRole: string;
  targetIntent: string;
}

export interface SpeakingCommunicationSemanticLinkOptions {
  limit?: number;
  relations?: readonly SpeakingCommunicationSemanticRelation[];
  excludeRelations?: readonly SpeakingCommunicationSemanticRelation[];
}

export const SPEAKING_COMMUNICATION_SEMANTIC_JOURNEY_REVISION: string;
export const R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS: readonly SpeakingCommunicationSemanticJourney[];
export function getSpeakingCommunicationSemanticInternalLinksForPath(pathname: string, options?: SpeakingCommunicationSemanticLinkOptions): readonly ResolvedSpeakingCommunicationSemanticLink[];
export function getR22SpeakingCommunicationSemanticJourney(topicId: string): SpeakingCommunicationSemanticJourney | null;
