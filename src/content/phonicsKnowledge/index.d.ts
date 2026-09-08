import type { CanonicalPhonicsCourseId } from '../../../functions/src/phonicsCurriculumConfig';
export type PhonicsKnowledgeStage = 'pre-phonics' | 'foundations' | 'early-decoding' | 'pattern-decoding' | 'advanced-patterns';
export type PhonicsKnowledgeFamily = 'phonological-foundation' | 'sound-symbol' | 'decoding-skill' | 'vowel-system' | 'spelling-rule' | 'digraph' | 'vowel-team' | 'magic-e' | 'syllable-rule' | 'r-controlled' | 'diphthong' | 'alternate-vowel' | 'advanced-pattern';
export type PhonicsExpansionState = 'existing-owner' | 'supporting-only' | 'pilot-wave-1' | 'future-wave-2';
export interface PhonicsKnowledgeCurriculumRef {
  readonly lessonId: `${CanonicalPhonicsCourseId}__lesson-${string}`;
  readonly courseId: CanonicalPhonicsCourseId;
  readonly lessonNumber: number;
  readonly label: string;
}
export interface PhonicsKnowledgeConcept {
  readonly id: string;
  readonly subject: 'phonics-reading';
  readonly publicationStatus: 'dataset-only';
  readonly editorialState: 'needs-human-review';
  readonly publicationApproved: false;
  readonly label: string;
  readonly standardTerm: string | null;
  readonly phonemeDescription: string | null;
  readonly knowledgeStage: PhonicsKnowledgeStage;
  readonly conceptType: PhonicsKnowledgeFamily;
  /** Concept presentation hint only; never canonical lesson order. */
  readonly progressionRank: number;
  readonly searchIntent: string;
  readonly parentQuestion: string;
  readonly quickAnswer: string;
  readonly graphemes: readonly string[];
  /** Curated examples; filter by the child's known correspondences before use. */
  readonly exampleWords: readonly string[];
  readonly contrastWords: readonly string[];
  readonly commonConfusions: readonly string[];
  readonly teachingNotes: readonly string[];
  readonly practiceIdeas: readonly string[];
  readonly prerequisiteIds: readonly string[];
  readonly nextIds: readonly string[];
  readonly curriculumAlignment: 'direct' | 'embedded-skill' | 'prerequisite-context' | 'lesson-theme';
  readonly curriculumRefs: readonly PhonicsKnowledgeCurriculumRef[];
  readonly canonicalOwnerTopicId: string | null;
  readonly supportingPaths: readonly string[];
  readonly expansionState: PhonicsExpansionState;
  readonly futureSlugCandidate: string | null;
  readonly expansionRationale: string;
  readonly distinctValueSignals: readonly string[];
}
export const PHONICS_KNOWLEDGE_DATASET_REVISION: string;
export const PHONICS_KNOWLEDGE_STAGES: readonly PhonicsKnowledgeStage[];
export const PHONICS_KNOWLEDGE_TYPES: readonly PhonicsKnowledgeFamily[];
export const PHONICS_EXPANSION_STATES: readonly PhonicsExpansionState[];
export const PHONICS_KNOWLEDGE_DATASET: readonly PhonicsKnowledgeConcept[];
export function getPhonicsKnowledgeConcept(id: string): PhonicsKnowledgeConcept | null;
export function getPhonicsKnowledgeByCandidateSlug(slug: string): PhonicsKnowledgeConcept | null;
export function getPhonicsKnowledgeByFamily(family: PhonicsKnowledgeFamily): readonly PhonicsKnowledgeConcept[];
export function getPhonicsKnowledgeByExpansionStatus(status: PhonicsExpansionState): readonly PhonicsKnowledgeConcept[];
export function getPhonicsKnowledgeForLesson(lessonId: string): readonly PhonicsKnowledgeConcept[];
export function getPhonicsKnowledgeByCanonicalOwner(topicId: string): readonly PhonicsKnowledgeConcept[];
export function getBrick9PilotCandidates(): readonly PhonicsKnowledgeConcept[];
export function getConceptsWithExistingOwners(): readonly PhonicsKnowledgeConcept[];
