import type {
  SpeakingCommunicationSemanticJourney,
  SpeakingCommunicationSemanticLinkOptions,
  ResolvedSpeakingCommunicationSemanticLink,
} from './speakingCommunicationSemanticJourneyGraph.js';

export const SPEAKING_COMMUNICATION_COMPLETION_SEMANTIC_REVISION: string;
export const SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS: readonly SpeakingCommunicationSemanticJourney[];
export function getSpeakingCommunicationSemanticInternalLinksForPath(pathname: string, options?: SpeakingCommunicationSemanticLinkOptions): readonly ResolvedSpeakingCommunicationSemanticLink[];
export function getSP6SpeakingCommunicationSemanticJourney(topicId: string): SpeakingCommunicationSemanticJourney | null;
