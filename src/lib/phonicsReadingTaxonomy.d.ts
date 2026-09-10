export type PhonicsReadingTeachingStage =
  | 'pre-print'
  | 'foundations'
  | 'early-decoding'
  | 'pattern-decoding'
  | 'advanced-decoding'
  | 'reading-transition';

export type PhonicsReadingSkill = {
  readonly id: string;
  readonly label: string;
  readonly skill: string;
  readonly teachingStage: PhonicsReadingTeachingStage;
  readonly prerequisiteIds: readonly string[];
  readonly graphemes: readonly string[];
  readonly phonemes: readonly string[];
  readonly exampleWords: readonly string[];
  readonly exceptions: readonly string[];
  readonly pronunciationConventions: readonly string[];
  readonly relatedSkillIds: readonly string[];
  readonly nextSkillIds: readonly string[];
  readonly knowledgeConceptIds: readonly string[];
  readonly learningBoundary: string;
};

export const PHONICS_READING_TAXONOMY_REVISION: string;
export const PHONICS_READING_TEACHING_STAGES: readonly PhonicsReadingTeachingStage[];
export const PHONICS_READING_TAXONOMY: readonly PhonicsReadingSkill[];
export const PHONICS_READING_TAXONOMY_ORDER: readonly string[];
export function getPhonicsReadingSkill(id: string): PhonicsReadingSkill | null;
export function getPhonicsReadingSkillsByStage(stage: string): readonly PhonicsReadingSkill[];
export function getPhonicsReadingProgression(): readonly PhonicsReadingSkill[];
