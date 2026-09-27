export const VOCABULARY_GV6_REVISION: '2026-09-27-gv6';
export const VOCABULARY_GV6_STATUS: 'discovery-ai-practice-integration-frozen';
export const VOCABULARY_GV6_PRACTICE_OWNER: '/free-games/word-meaning-flashcards';

export const VOCABULARY_GV6_DISCOVERY_SURFACES: readonly [
  '/resources/vocabulary',
  '/ai-resource-index.json',
  '/ai-resource-index.txt',
  '/llms.txt',
  '/llms-full.txt',
];

export const VOCABULARY_GV6_SEMANTIC_DESTINATIONS: Readonly<{
  reading: '/reading-classes-for-kids';
  speaking: '/spoken-english-classes-for-kids-online';
  writing: '/writing-classes-for-kids';
}>;

export const VOCABULARY_GV6_MEASUREMENT_POLICY: Readonly<{
  publicAnalyticsRequired: true;
  canonicalPathIsMeasurementKey: true;
  expansionDefault: 'HOLD';
  numericThresholdInvented: false;
  evidenceSignals: readonly [
    'search-impressions-and-query-coverage',
    'ai-retrieval-or-citation-coverage',
    'authority-to-practice-engagement',
    'clear-unmet-intent-with-no-existing-canonical-owner',
  ];
  rule: string;
}>;

export const VOCABULARY_GV6_FREEZE_POLICY: Readonly<{
  vocabularyAuthorityGuideCount: 16;
  vocabularyStageCount: 6;
  lexicalBaselineCount: 50;
  layer2VocabularyGuideCount: 16;
  layer3VocabularyPracticeOwnerCount: 1;
  newAuthorityUrlsAllowed: false;
  taxonomyMutationAllowed: false;
  lexicalBaselineExpansionAllowed: false;
  newPracticeOwnerAllowed: false;
  commercialOwnershipMutationAllowed: false;
  llmDiscoveryMustEnumerateAllAuthorityGuides: true;
  semanticTransferMustPreserveCanonicalProgrammeBoundaries: true;
  reopenRequires: readonly [
    'measured-unmet-intent',
    'no-existing-canonical-owner',
    'source-backed-authority-plan',
    'full-publication-quality-gates',
  ];
}>;
