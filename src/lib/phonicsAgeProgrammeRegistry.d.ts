/** Type contract for the Node-importable publication registry. */
export interface PhonicsAgeProgrammeGuide {
  readonly age: 3 | 4 | 5 | 6;
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly heading: string;
  readonly introduction: string;
  readonly directAnswer: string;
  readonly parentQuestions: readonly string[];
  readonly assessmentFocus: readonly string[];
  readonly classApproach: readonly { readonly title: string; readonly detail: string }[];
  readonly activityHeading: string;
  readonly activityExample: string;
  readonly progressSigns: readonly string[];
  readonly homeGuidance: string;
  readonly courseLabel: string;
  readonly coursePath: string;
  readonly broaderAgePath: string;
  readonly broaderAgeLabel: string;
  readonly faqs: { question: string; answer: string }[];
}

export interface PhonicsAgeProgrammeSeo {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly robots: string;
  readonly ogType: 'website';
}

export const PHONICS_AGE_PROGRAMME_PAGES: readonly PhonicsAgeProgrammeGuide[];
export const PHONICS_AGE_PROGRAMME_PATHS: readonly string[];
export const PHONICS_AGE_PROGRAMME_SEO: Readonly<Record<string, PhonicsAgeProgrammeSeo>>;
export function getPublishedPhonicsAgeProgramme(age: number): PhonicsAgeProgrammeGuide | null;
