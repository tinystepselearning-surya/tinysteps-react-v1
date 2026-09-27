export type AuthorityRequirement = Readonly<{
  layer: 'grammar-reference-extension' | 'vocabulary-authority';
  state: 'requirements-approved';
  publicationApproved: false;
  hubPath: string;
  evidenceFamilyIds: readonly string[];
  requiredSections: readonly string[];
  order: number;
  id: string;
  label: string;
  proposedPath: string;
  rationale?: string;
  stageId?: string;
  relatedCoreIds?: readonly string[];
  childOutcomes: readonly string[];
  practiceTargets?: readonly string[];
  practiceModes?: readonly string[];
  semanticDomains?: readonly string[];
  crossLinks?: readonly string[];
}>;

export type VocabularyKnowledgeStage = Readonly<{
  id: string;
  order: number;
  label: string;
  purpose: string;
  topicIds: readonly string[];
}>;

export const GRAMMAR_VOCABULARY_AUTHORITY_REVISION: string;
export const GRAMMAR_VOCABULARY_SOURCE_BASIS: Readonly<Record<string, Readonly<{
  id: string;
  label: string;
  url: string;
  use: string;
}>>>;
export const AUTHORITY_PAGE_REQUIRED_SECTIONS: readonly string[];
export const AUTHORITY_PUBLICATION_GATES: Readonly<{
  minimumKnowledgeWords: number;
  minimumAuthoritativeReferences: number;
  minimumWorkedExamples: number;
  minimumFaqs: number;
  requireUniqueCanonicalPath: boolean;
  requireIndexableOnlyWhenComplete: boolean;
  requireAiCorpusInclusionOnlyWhenPublished: boolean;
  requireDescriptiveInternalAnchors: boolean;
  requirePracticeConnection: boolean;
  requireNoThinChildRoutes: boolean;
}>;
export const GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS: readonly AuthorityRequirement[];
export const VOCABULARY_KNOWLEDGE_STAGES: readonly VocabularyKnowledgeStage[];
export const VOCABULARY_AUTHORITY_REQUIREMENTS: readonly AuthorityRequirement[];
export const VOCABULARY_HUB_REQUIREMENT: Readonly<{
  state: 'requirements-approved';
  publicationApproved: false;
  proposedPath: '/resources/vocabulary';
  label: string;
  role: string;
  requiredStageIds: readonly string[];
  practicePath: string;
  programmeConnections: readonly string[];
}>;
export const GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS: Readonly<Record<string, string>>;
