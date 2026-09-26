export type CentralResourceContentFamily = Readonly<{
  id: string;
  label: string;
  description: string;
  destination: string;
  ownerRole: string;
  discoveryRole: string;
  governedPublishedCount?: number;
}>;

export const CENTRAL_RESOURCE_SYSTEM_REVISION: string;
export const CENTRAL_RESOURCE_GATEWAY: '/resources';
export const CENTRAL_RESOURCE_SUBJECT_HUBS: readonly [
  '/resources/phonics',
  '/resources/grammar',
  '/resources/speaking',
];
export const CENTRAL_RESOURCE_CONTENT_FAMILIES: readonly CentralResourceContentFamily[];

export const CENTRAL_RESOURCE_RECONCILIATION: Readonly<{
  revision: string;
  gateway: '/resources';
  principle: string;
  preserveExistingUrls: true;
  moveExistingUrls: false;
  redirectExistingOwners: false;
  subjectHubs: readonly string[];
  contentFamilies: readonly CentralResourceContentFamily[];
  editorialArchive: '/blog';
  focusedPhonicsHub: '/resources/phonics';
  parentHelpHub: '/parents';
  practiceHub: '/free-english-games-for-kids';
  schoolsHub: '/for-schools';
  aiAnswerArchitecture: Readonly<{
    layers: readonly number[];
    machineJson: '/ai-resource-index.json';
    machineText: '/ai-resource-index.txt';
    retrievalFlow: string;
    connectedCorpus: Readonly<{
      editorialBlogs: 'all-current-public-blogs';
      governedPhonicsGuides: 31;
      additionalPublicRoutes: 'all-route-seo-public-content';
      noindexPolicy: 'connected-as-supporting-only-not-primary-answer-owner';
    }>;
  }>;
}>;
