export type GrammarWritingGr6NodeKind =
  | 'skill'
  | 'tense'
  | 'comparison'
  | 'error'
  | 'writing-stage'
  | 'parent-problem'
  | 'practice'
  | 'public-topic';

export type GrammarWritingGr6Relation =
  | 'prerequisite'
  | 'comparison'
  | 'common-error'
  | 'writing-application'
  | 'practice'
  | 'next-concept'
  | 'diagnostic'
  | 'public-anchor'
  | 'related'
  | 'programme'
  | 'assessment';

export interface GrammarWritingGr6SemanticNode {
  readonly ref: string;
  readonly kind: GrammarWritingGr6NodeKind;
  readonly id: string;
  readonly label: string;
  readonly ownerPath?: string;
}

export interface GrammarWritingGr6SemanticEdge {
  readonly from: string;
  readonly relation: GrammarWritingGr6Relation;
  readonly to: string;
  readonly rationale: string;
}

export interface GrammarWritingGr6PublicLink {
  readonly relation: string;
  readonly targetTopicId: string;
  readonly label: string;
  readonly rationale: string;
}

export interface GrammarWritingGr6PublicJourney {
  readonly sourceTopicId: string;
  readonly links: readonly GrammarWritingGr6PublicLink[];
}

export interface GrammarWritingGr6ResolvedPublicLink extends GrammarWritingGr6PublicLink {
  readonly to: string;
  readonly targetOwnerRole: string;
  readonly targetIntent: string;
}

export interface GrammarWritingGr6TenseJourney {
  readonly conceptRef: string;
  readonly prerequisiteRefs: readonly string[];
  readonly comparisonRefs: readonly string[];
  readonly commonErrorRefs: readonly string[];
  readonly writingApplicationRefs: readonly string[];
  readonly practiceRefs: readonly string[];
  readonly nextConceptRefs: readonly string[];
}

export declare const GRAMMAR_WRITING_GR6_SEMANTIC_REVISION: '2026-09-10-gr6';
export declare const GRAMMAR_WRITING_GR6_RELATION_SEQUENCE: readonly [
  'prerequisite',
  'comparison',
  'common-error',
  'writing-application',
  'practice',
  'next-concept'
];
export declare const GRAMMAR_WRITING_GR6_PRINCIPLES: readonly Readonly<{ id: string; statement: string }>[];
export declare const GRAMMAR_WRITING_GR6_PUBLIC_OWNERS: readonly Readonly<Record<string, unknown>>[];
export declare const GRAMMAR_WRITING_GR6_SEMANTIC_NODES: readonly GrammarWritingGr6SemanticNode[];
export declare const GRAMMAR_WRITING_GR6_SEMANTIC_EDGES: readonly GrammarWritingGr6SemanticEdge[];
export declare const GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS: readonly GrammarWritingGr6PublicJourney[];
export declare const GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS: readonly GrammarWritingGr6PublicJourney[];

export declare function getGrammarWritingGr6SemanticNode(nodeRef: string): GrammarWritingGr6SemanticNode | null;
export declare function getGrammarWritingGr6OutgoingEdges(nodeRef: string, relation?: string | null): readonly GrammarWritingGr6SemanticEdge[];
export declare function getGrammarWritingGr6IncomingEdges(nodeRef: string, relation?: string | null): readonly GrammarWritingGr6SemanticEdge[];
export declare function getGrammarWritingGr6TenseJourney(tenseId: string): GrammarWritingGr6TenseJourney | null;
export declare function getGrammarWritingGr6PublicJourney(topicId: string): GrammarWritingGr6PublicJourney | null;
export declare function getGrammarWritingGr6PublicLinksForPath(
  pathname: string,
  options?: { readonly excludeRelations?: readonly string[]; readonly limit?: number },
): readonly GrammarWritingGr6ResolvedPublicLink[];
