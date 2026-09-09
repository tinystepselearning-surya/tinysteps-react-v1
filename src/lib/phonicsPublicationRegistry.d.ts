import type { PhonicsKnowledgeConcept } from '../content/phonicsKnowledge';

export type PhonicsPublicationGroup = 'Spelling rules' | 'Consonant patterns' | 'Vowel patterns' | 'Word structure';
export type PhonicsPublicationWave = 'pilot-wave-1' | 'expansion-wave-2';

export interface PhonicsPublishedResourcePage {
  readonly conceptId: string;
  readonly topicId: string;
  readonly slug: string;
  readonly path: `/resources/phonics/${string}`;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly cardTitle: string;
  readonly group: PhonicsPublicationGroup;
  readonly publicationState: 'approved-wave-1' | 'approved-wave-2';
  readonly publicationWave: PhonicsPublicationWave;
  readonly publicationRevision: string;
  readonly publicationApprovalState?: 'approved-for-current-wave';
  readonly publicationApprovalRevision?: string;
  readonly publicationApprovalBasis?: string;
  readonly reviewDecision: string;
  readonly concept: PhonicsKnowledgeConcept;
}

export const PHONICS_PUBLICATION_REVISION: string;
export const PHONICS_PUBLICATION_PREFIX: '/resources/phonics';
export const PHONICS_WAVE_2_PAGE_COUNT: number;
export const PHONICS_WAVE_2_PAGES: readonly PhonicsPublishedResourcePage[];
export const PHONICS_PUBLISHED_RESOURCE_PAGES: readonly PhonicsPublishedResourcePage[];
export const PHONICS_PUBLISHED_RESOURCE_PATHS: readonly `/resources/phonics/${string}`[];
export const PHONICS_PUBLISHED_RESOURCE_TOPIC_IDS: readonly string[];
export const PHONICS_PUBLICATION_GROUPS: readonly PhonicsPublicationGroup[];
export const PHONICS_PUBLISHED_RESOURCE_SEO: Readonly<Record<string, { readonly title: string; readonly description: string; readonly canonicalPath: string; readonly robots: string; readonly ogType: 'website' }>>;
export function getPublishedPhonicsResourcePageBySlug(slug: string): PhonicsPublishedResourcePage | null;
export function getPublishedPhonicsResourcePageByPath(path: string): PhonicsPublishedResourcePage | null;
export function getPublishedPhonicsResourcePageByConceptId(conceptId: string): PhonicsPublishedResourcePage | null;
export function getPublishedPhonicsResourcePageByTopicId(topicId: string): PhonicsPublishedResourcePage | null;
export function getPublishedPhonicsResourcePagesByGroup(group: PhonicsPublicationGroup): readonly PhonicsPublishedResourcePage[];
