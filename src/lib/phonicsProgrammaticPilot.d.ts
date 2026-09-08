import type { PhonicsKnowledgeConcept } from '../content/phonicsKnowledge';

export type PhonicsProgrammaticPilotGroup =
  | 'Spelling rules'
  | 'Consonant patterns'
  | 'Vowel patterns'
  | 'Word structure';

export interface PhonicsProgrammaticPilotPage {
  readonly conceptId: string;
  readonly topicId: string;
  readonly slug: string;
  readonly path: `/resources/phonics/${string}`;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly cardTitle: string;
  readonly group: PhonicsProgrammaticPilotGroup;
  readonly publicationState: 'approved-wave-1';
  readonly reviewedRevision: string;
  readonly reviewDecision: string;
  readonly concept: PhonicsKnowledgeConcept;
}

export const PHONICS_PROGRAMMATIC_PILOT_REVISION: string;
export const PHONICS_PROGRAMMATIC_PILOT_PREFIX: '/resources/phonics';
export const PHONICS_PROGRAMMATIC_PILOT_PAGES: readonly PhonicsProgrammaticPilotPage[];
export const PHONICS_PROGRAMMATIC_PILOT_PATHS: readonly `/resources/phonics/${string}`[];
export const PHONICS_PROGRAMMATIC_PILOT_TOPIC_IDS: readonly string[];
export const PHONICS_PROGRAMMATIC_PILOT_SEO: Readonly<Record<string, {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly robots: string;
  readonly ogType: 'website';
}>>;
export const PHONICS_PROGRAMMATIC_PILOT_GROUPS: readonly PhonicsProgrammaticPilotGroup[];

export function getPhonicsProgrammaticPilotPageBySlug(slug: string): PhonicsProgrammaticPilotPage | null;
export function getPhonicsProgrammaticPilotPageByPath(path: string): PhonicsProgrammaticPilotPage | null;
export function getPhonicsProgrammaticPilotPageByConceptId(conceptId: string): PhonicsProgrammaticPilotPage | null;
export function getPhonicsProgrammaticPilotPageByTopicId(topicId: string): PhonicsProgrammaticPilotPage | null;
export function getPhonicsProgrammaticPilotPagesByGroup(group: PhonicsProgrammaticPilotGroup): readonly PhonicsProgrammaticPilotPage[];
