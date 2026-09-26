export type PhonicsPrepublicationQualityState = 'passed';

export interface PhonicsPrepublicationConceptInput {
  readonly id?: string;
  readonly parentQuestion?: string;
  readonly quickAnswer?: string;
  readonly searchIntent?: string;
  readonly exampleWords?: readonly unknown[];
  readonly teachingNotes?: readonly unknown[];
  readonly practiceIdeas?: readonly unknown[];
  readonly commonConfusions?: readonly unknown[];
  readonly curriculumRefs?: readonly unknown[];
  readonly supportingPaths?: readonly unknown[];
}

export interface PhonicsPrepublicationApprovalInput {
  readonly topicId?: string;
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly cardTitle?: string;
  readonly group?: string;
}

export interface PhonicsPrepublicationQualityResult {
  readonly state: PhonicsPrepublicationQualityState;
  readonly revision: string;
  readonly checks: readonly string[];
}

export const PHONICS_PREPUBLICATION_QUALITY_REVISION: string;
export const PHONICS_PREPUBLICATION_QUALITY_STATE: PhonicsPrepublicationQualityState;

export function assertPhonicsPrepublicationQuality(
  concept: PhonicsPrepublicationConceptInput | null | undefined,
  approval: PhonicsPrepublicationApprovalInput | null | undefined,
): PhonicsPrepublicationQualityResult;
