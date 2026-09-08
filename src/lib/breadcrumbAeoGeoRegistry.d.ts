export type ResourceKnowledgeSubject =
  | 'phonics-reading'
  | 'grammar-writing'
  | 'speaking-communication';

export type BreadcrumbItem = Readonly<{
  name: string;
  path: string;
}>;

export type ResourceSubjectPresentation = Readonly<{
  label: string;
  path: string;
  aboutName: string;
}>;

export const RESOURCE_SUBJECT_PRESENTATION: Readonly<Record<ResourceKnowledgeSubject, ResourceSubjectPresentation>>;

export function getBreadcrumbTrail(input?: {
  pathname?: string;
  title?: string;
  category?: string;
}): readonly BreadcrumbItem[];

export type BreadcrumbListSchema = Readonly<{
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  '@id': string;
  itemListElement: readonly Readonly<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>[];
}>;

export function buildBreadcrumbListSchema(
  items: readonly BreadcrumbItem[],
  siteOrigin: string,
): BreadcrumbListSchema;

export type AeoGeoPresentation = Readonly<{
  subject: ResourceKnowledgeSubject | null;
  subjectHubPath: string | null;
  aboutName: string | null;
  breadcrumbPath: string;
  answerSelectors: readonly string[];
}>;

export function getAeoGeoPresentation(input?: {
  pathname?: string;
  category?: string;
}): AeoGeoPresentation;

export type SpeakableSpecification = Readonly<{
  '@type': 'SpeakableSpecification';
  cssSelector: readonly string[];
}>;

export function buildSpeakableSpecification(
  selectors?: readonly string[],
): SpeakableSpecification | null;

export function normalizeBreadcrumbPath(pathname?: string): string;
