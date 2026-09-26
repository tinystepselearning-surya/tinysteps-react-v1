import { GRAMMAR_PUBLISHED_RESOURCE_PAGES } from './grammarPublicationRegistry.js';

export const CENTRAL_RESOURCE_SYSTEM_REVISION = '2026-09-27-r28-grammar-pseo';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const CENTRAL_RESOURCE_GATEWAY = '/resources';

export const CENTRAL_RESOURCE_SUBJECT_HUBS = freezeList([
  '/resources/phonics',
  '/resources/grammar',
  '/resources/speaking',
]);

export const CENTRAL_RESOURCE_CONTENT_FAMILIES = freezeList([
  freeze({
    id: 'editorial-guides',
    label: 'Editorial guides',
    description: 'Parent-friendly phonics, reading, grammar, writing, speaking and research articles.',
    destination: '/blog',
    ownerRole: 'editorial-library',
    discoveryRole: 'resource-content',
  }),
  freeze({
    id: 'focused-phonics',
    label: 'Focused phonics library',
    description: 'The governed 31-page phonics pattern and spelling resource set, organised inside Phonics & Reading.',
    destination: '/resources/phonics',
    ownerRole: 'skill-guide-library',
    discoveryRole: 'resource-content',
    governedPublishedCount: 31,
  }),
  freeze({
    id: 'focused-grammar',
    label: 'Grammar knowledge path',
    description: 'Curriculum-ordered grammar concept guides from word foundations through tense control, clauses and coherent writing.',
    destination: '/resources/grammar',
    ownerRole: 'skill-guide-library',
    discoveryRole: 'resource-content',
    governedPublishedCount: GRAMMAR_PUBLISHED_RESOURCE_PAGES.length,
  }),
  freeze({
    id: 'parent-help',
    label: 'Parent help',
    description: 'Problem-first support for reading, learning, progress and course-choice concerns.',
    destination: '/parents',
    ownerRole: 'support-hub',
    discoveryRole: 'resource-content',
  }),
  freeze({
    id: 'interactive-practice',
    label: 'Interactive practice',
    description: 'Free tracing, phonics, reading, grammar, sentence and speaking activities.',
    destination: '/free-english-games-for-kids',
    ownerRole: 'practice-hub',
    discoveryRole: 'resource-content',
  }),
  freeze({
    id: 'schools-educators',
    label: 'Schools & educators',
    description: 'Implementation guidance, research, teacher development and school partnership resources.',
    destination: '/for-schools',
    ownerRole: 'b2b-hub',
    discoveryRole: 'resource-content',
  }),
]);

export const CENTRAL_RESOURCE_RECONCILIATION = freeze({
  revision: CENTRAL_RESOURCE_SYSTEM_REVISION,
  gateway: CENTRAL_RESOURCE_GATEWAY,
  principle: 'one-resource-center-preserve-existing-canonical-owners',
  preserveExistingUrls: true,
  moveExistingUrls: false,
  redirectExistingOwners: false,
  subjectHubs: CENTRAL_RESOURCE_SUBJECT_HUBS,
  contentFamilies: CENTRAL_RESOURCE_CONTENT_FAMILIES,
  editorialArchive: '/blog',
  focusedPhonicsHub: '/resources/phonics',
  focusedGrammarHub: '/resources/grammar',
  parentHelpHub: '/parents',
  practiceHub: '/free-english-games-for-kids',
  schoolsHub: '/for-schools',
  aiAnswerArchitecture: freeze({
    layers: freezeList([1, 2, 3]),
    machineJson: '/ai-resource-index.json',
    machineText: '/ai-resource-index.txt',
    retrievalFlow: 'parent-problem -> canonical-answer -> learning-concept -> focused-practice',
    connectedCorpus: freeze({
      editorialBlogs: 'all-current-public-blogs',
      governedPhonicsGuides: 31,
      governedGrammarGuides: GRAMMAR_PUBLISHED_RESOURCE_PAGES.length,
      additionalPublicRoutes: 'all-route-seo-public-content',
      noindexPolicy: 'connected-as-supporting-only-not-primary-answer-owner',
    }),
  }),
});
