export type PublicCourseStage = {
  name: string;
  routePath: string;
  level: string;
  summary: string;
};

export type PublicCoursePageConfig = {
  internalSlug: string;
  publicSlug: string;
  routePath: string;
  name: string;
  h1: string;
  title: string;
  description: string;
  educationalLevel: string;
  track: string;
  breadcrumbName: string;
  teaches?: readonly string[];
  keywords?: readonly string[];
  legacySlugs?: readonly string[];
  stageAuthority?: {
    title: string;
    directAnswer: string;
    entrySignals: readonly string[];
    skillsBuilt: readonly string[];
    exitSignals: readonly string[];
    sequence: readonly PublicCourseStage[];
  };
  relatedLinks?: readonly { label: string; to: string }[];
  faq?: readonly { question: string; answer: string }[];
};

export const PUBLIC_COURSE_PAGE_CONFIGS: readonly PublicCoursePageConfig[];
export const PUBLIC_COURSE_ROUTE_PATHS: readonly string[];
export const PUBLIC_COURSE_SLUGS: readonly string[];

export function resolvePublicCoursePageBySlug(slug: unknown): PublicCoursePageConfig | null;
export function getPublicCoursePathForSlug(slug: unknown): string | null;
export function isCanonicalPublicCourseSlug(slug: unknown): boolean;
