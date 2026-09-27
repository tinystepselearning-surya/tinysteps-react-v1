const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const VOCABULARY_GV6_REVISION = '2026-09-27-gv6';
export const VOCABULARY_GV6_STATUS = 'discovery-ai-practice-integration-frozen';

export const VOCABULARY_GV6_PRACTICE_OWNER = '/free-games/word-meaning-flashcards';

export const VOCABULARY_GV6_DISCOVERY_SURFACES = freezeList([
  '/resources/vocabulary',
  '/ai-resource-index.json',
  '/ai-resource-index.txt',
  '/llms.txt',
  '/llms-full.txt',
]);

export const VOCABULARY_GV6_SEMANTIC_DESTINATIONS = freeze({
  reading: '/reading-classes-for-kids',
  speaking: '/spoken-english-classes-for-kids-online',
  writing: '/writing-classes-for-kids',
});

export const VOCABULARY_GV6_MEASUREMENT_POLICY = freeze({
  publicAnalyticsRequired: true,
  canonicalPathIsMeasurementKey: true,
  expansionDefault: 'HOLD',
  numericThresholdInvented: false,
  evidenceSignals: freezeList([
    'search-impressions-and-query-coverage',
    'ai-retrieval-or-citation-coverage',
    'authority-to-practice-engagement',
    'clear-unmet-intent-with-no-existing-canonical-owner',
  ]),
  rule:
    'The completed sixteen-guide Vocabulary estate is measured on canonical public paths. Expansion stays on hold until observed search, AI-retrieval or engagement evidence shows a distinct unmet intent that is not already owned.',
});

export const VOCABULARY_GV6_FREEZE_POLICY = freeze({
  vocabularyAuthorityGuideCount: 16,
  vocabularyStageCount: 6,
  lexicalBaselineCount: 50,
  layer2VocabularyGuideCount: 16,
  layer3VocabularyPracticeOwnerCount: 1,
  newAuthorityUrlsAllowed: false,
  taxonomyMutationAllowed: false,
  lexicalBaselineExpansionAllowed: false,
  newPracticeOwnerAllowed: false,
  commercialOwnershipMutationAllowed: false,
  llmDiscoveryMustEnumerateAllAuthorityGuides: true,
  semanticTransferMustPreserveCanonicalProgrammeBoundaries: true,
  reopenRequires: freezeList([
    'measured-unmet-intent',
    'no-existing-canonical-owner',
    'source-backed-authority-plan',
    'full-publication-quality-gates',
  ]),
});
