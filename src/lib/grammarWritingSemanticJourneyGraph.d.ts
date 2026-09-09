export type GrammarWritingSemanticRelation = 'hub' | 'prerequisite' | 'next' | 'related' | 'diagnostic' | 'practice' | 'assessment' | 'programme';

export interface GrammarWritingSemanticLinkDefinition {
  relation: GrammarWritingSemanticRelation;
  targetTopicId: string;
  label: string;
  rationale: string;
}

export interface GrammarWritingSemanticJourney {
  sourceTopicId: string;
  links: readonly GrammarWritingSemanticLinkDefinition[];
}

export interface ResolvedGrammarWritingSemanticLink extends GrammarWritingSemanticLinkDefinition {
  to: string;
  targetOwnerRole: string;
  targetIntent: string;
}

export interface GrammarWritingSemanticLinkOptions {
  limit?: number;
  relations?: readonly GrammarWritingSemanticRelation[];
  excludeRelations?: readonly GrammarWritingSemanticRelation[];
}

export const GRAMMAR_WRITING_SEMANTIC_JOURNEY_REVISION: string;
export const R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS: readonly GrammarWritingSemanticJourney[];
export function getGrammarWritingSemanticInternalLinksForPath(pathname: string, options?: GrammarWritingSemanticLinkOptions): readonly ResolvedGrammarWritingSemanticLink[];
export function getR19GrammarWritingSemanticJourney(topicId: string): GrammarWritingSemanticJourney | null;
