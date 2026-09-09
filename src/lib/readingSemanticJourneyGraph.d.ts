export type ReadingSemanticRelation = 'hub' | 'prerequisite' | 'next' | 'related' | 'diagnostic' | 'practice' | 'assessment' | 'programme';

export interface ReadingSemanticLinkDefinition {
  relation: ReadingSemanticRelation;
  targetTopicId: string;
  label: string;
  rationale: string;
}

export interface ReadingSemanticJourney {
  sourceTopicId: string;
  links: readonly ReadingSemanticLinkDefinition[];
}

export interface ResolvedReadingSemanticLink extends ReadingSemanticLinkDefinition {
  to: string;
  targetOwnerRole: string;
  targetIntent: string;
}

export interface ReadingSemanticLinkOptions {
  limit?: number;
  relations?: readonly ReadingSemanticRelation[];
  excludeRelations?: readonly ReadingSemanticRelation[];
}

export const READING_SEMANTIC_JOURNEY_REVISION: string;
export const R16_READING_SEMANTIC_JOURNEYS: readonly ReadingSemanticJourney[];
export function getReadingSemanticInternalLinksForPath(pathname: string, options?: ReadingSemanticLinkOptions): readonly ResolvedReadingSemanticLink[];
export function getR16ReadingSemanticJourney(topicId: string): ReadingSemanticJourney | null;
