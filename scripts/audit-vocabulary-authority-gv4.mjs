import fs from 'node:fs';
import path from 'node:path';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../src/lib/grammarVocabularyAuthorityRequirements.js';
import {
  VOCABULARY_AUTHORITY_PAGES,
  VOCABULARY_AUTHORITY_REVISION,
} from '../src/lib/vocabularyAuthorityRegistry.js';
import {
  VOCABULARY_AUTHORITY_PATHS,
  VOCABULARY_HUB_PATH,
} from '../src/lib/vocabularyAuthoritySeoManifest.js';
import {
  VOCABULARY_LEXICAL_ENTRIES,
} from '../src/lib/vocabularyLexicalModel.ts';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import {
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
} from '../src/lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const countWords = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;

function knowledgeWordCount(page) {
  return countWords([
    page.quickAnswer,
    page.concept,
    page.whyItMatters,
    ...(page.coreIdeas || []),
    ...(page.workedExamples || []).flatMap((item) => [item.example, item.explanation]),
    ...(page.examples || []),
    ...(page.commonMistakes || []),
    ...(page.trickyCases || []),
    page.teachingNote,
    ...(page.practicePrompts || []),
    ...(page.faqs || []).flatMap((item) => [item.question, item.answer]),
  ].join(' '));
}

const EXPECTED_GV4_IDS = [
  'everyday-vocabulary',
  'feelings-emotions',
  'school-vocabulary',
  'synonyms-antonyms',
  'context-clues',
  'word-families-prefixes-suffixes',
];
const EXPECTED_GV5_IDS = [
  'vocabulary-collocations',
  'phrasal-verbs-expressions',
  'vocabulary-for-writing',
  'vocabulary-for-speaking',
];
const EXPECTED_GV5B_IDS = [
  'action-words',
  'describing-words',
  'home-family-routines',
  'food-clothes-body',
  'nature-weather-places-transport',
  'multiple-meaning-confused-words',
];
const EXPECTED_IDS = [
  'everyday-vocabulary',
  'action-words',
  'feelings-emotions',
  'describing-words',
  'school-vocabulary',
  'home-family-routines',
  'food-clothes-body',
  'nature-weather-places-transport',
  'synonyms-antonyms',
  'multiple-meaning-confused-words',
  'word-families-prefixes-suffixes',
  'context-clues',
  ...EXPECTED_GV5_IDS,
];

if (VOCABULARY_AUTHORITY_REVISION !== '2026-09-27-gv5b') fail('revision', VOCABULARY_AUTHORITY_REVISION);
if (VOCABULARY_AUTHORITY_REQUIREMENTS.length !== 16) fail('requirement-count', VOCABULARY_AUTHORITY_REQUIREMENTS.length);
if (VOCABULARY_KNOWLEDGE_STAGES.length !== 6) fail('stage-count', VOCABULARY_KNOWLEDGE_STAGES.length);
if (VOCABULARY_AUTHORITY_PAGES.length !== 16) fail('published-count', VOCABULARY_AUTHORITY_PAGES.length);
if (VOCABULARY_LEXICAL_ENTRIES.length !== 50) fail('lexical-baseline', VOCABULARY_LEXICAL_ENTRIES.length);
if (VOCABULARY_AUTHORITY_PAGES.map((page) => page.id).join('|') !== EXPECTED_IDS.join('|')) {
  fail('publication-order', VOCABULARY_AUTHORITY_PAGES.map((page) => page.id).join(','));
}

const publishedIds = new Set(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id));
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.id === 'gv4-vocabulary-hub' || entry.id.startsWith('gv4-vocabulary-') || entry.id.startsWith('gv5-vocabulary-') || entry.id.startsWith('gv5b-vocabulary-'));
const layer2Vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/vocabulary/'));

if (!routePaths.has(VOCABULARY_HUB_PATH)) fail('hub-route', VOCABULARY_HUB_PATH);
if (ROUTE_SEO_REGISTRY[VOCABULARY_HUB_PATH]?.canonicalPath !== VOCABULARY_HUB_PATH) fail('hub-seo', VOCABULARY_HUB_PATH);
if (owners.length !== 17) fail('owner-count', `Expected 1 Vocabulary hub plus 16 guide owners; found ${owners.length}.`);
if (layer2Vocabulary.length !== 16) fail('ai-layer2-vocabulary-count', `Expected 16 Vocabulary Layer 2 items; found ${layer2Vocabulary.length}.`);
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length !== 112) fail('ai-layer2-total', AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length);
if (AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length !== 12) fail('ai-layer3-total', AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length);

const practice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.find((item) => item.id === 'practice-vocabulary');
if (!practice) fail('practice-owner', 'practice-vocabulary missing.');
else {
  if (practice.canonicalPath !== '/free-games/word-meaning-flashcards') fail('practice-path', practice.canonicalPath);
  if (practice.hubPath !== VOCABULARY_HUB_PATH) fail('practice-hub', practice.hubPath);
}

for (const page of VOCABULARY_AUTHORITY_PAGES) {
  const words = knowledgeWordCount(page);
  if (!page.publicationApproved) fail('publication-approved', page.id);
  if (!['gv4-first-authority-batch', 'gv5-natural-english-transfer', 'gv5b-foundation-completion'].includes(page.publicationBatch)) fail('publication-batch', page.id);
  if (words < 600) fail('knowledge-depth', `${page.id}: ${words}`);
  if ((page.sources || []).length < 2) fail('reference-depth', page.id);
  if (new Set((page.sources || []).map((source) => source.url)).size !== page.sources.length) fail('reference-duplicates', page.id);
  if (page.sources.some((source) => !String(source.url).startsWith('https://'))) fail('reference-url', page.id);
  if ((page.workedExamples || []).length < 3) fail('worked-examples', page.id);
  if ((page.coreIdeas || []).length < 3) fail('core-ideas', page.id);
  if ((page.faqs || []).length < 2) fail('faqs', page.id);
  if ((page.practicePrompts || []).length < 3) fail('practice-prompts', page.id);
  if (page.practicePath !== '/free-games/word-meaning-flashcards') fail('page-practice-path', page.id);
  if (!routePaths.has(page.path)) fail('public-route', page.path);
  if (ROUTE_SEO_REGISTRY[page.path]?.canonicalPath !== page.path) fail('route-seo', page.path);

  const owner = owners.find((entry) => entry.ownerPath === page.path);
  if (!owner) fail('canonical-owner', page.path);
  else {
    if (owner.ownerRole !== 'skill-guide') fail('owner-role', page.path);
    if (owner.hubPath !== VOCABULARY_HUB_PATH) fail('owner-hub', page.path);
  }

  const aiItem = layer2Vocabulary.find((item) => item.canonicalPath === page.path);
  if (!aiItem) fail('ai-owner', page.path);
  else if (aiItem.answer !== page.quickAnswer) fail('ai-answer', page.path);
}

for (const requirement of VOCABULARY_AUTHORITY_REQUIREMENTS.filter((item) => !publishedIds.has(item.id))) {
  if (routePaths.has(requirement.proposedPath)) fail('unpublished-route-leak', requirement.proposedPath);
  if (ROUTE_SEO_REGISTRY[requirement.proposedPath]) fail('unpublished-seo-leak', requirement.proposedPath);
  if (CANONICAL_TOPIC_OWNERSHIP.some((entry) => entry.ownerPath === requirement.proposedPath)) {
    fail('unpublished-owner-leak', requirement.proposedPath);
  }
}

if (process.argv.includes('--dist')) {
  const sitemapCandidates = [
    path.join(root, 'dist', 'sitemap-static.xml'),
    path.join(root, 'public', 'sitemap-static.xml'),
  ];
  const sitemapPath = sitemapCandidates.find((candidate) => fs.existsSync(candidate));
  const sitemap = sitemapPath ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemapPath) fail('dist-sitemap', 'sitemap-static.xml missing.');

  const pathsToRender = [VOCABULARY_HUB_PATH, ...VOCABULARY_AUTHORITY_PATHS];
  for (const routePath of pathsToRender) {
    const htmlPath = path.join(root, 'dist', routePath.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('dist-page', routePath);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!sitemap.includes(`https://tinystepslearning.com${routePath}`)) fail('dist-sitemap-entry', routePath);

    if (routePath === VOCABULARY_HUB_PATH) {
      if (!html.includes('Build words children can understand, remember and actually use')) fail('dist-hub-title', routePath);
      if (!html.includes('Vocabulary Adventure')) fail('dist-hub-practice', routePath);
      continue;
    }

    const page = VOCABULARY_AUTHORITY_PAGES.find((entry) => entry.path === routePath);
    if (!page) continue;
    if (!html.includes(page.cardTitle)) fail('dist-title', routePath);
    if (!html.includes('References and further reading')) fail('dist-references', routePath);
    if (!html.includes('Practise in Vocabulary Adventure')) fail('dist-practice', routePath);
    if (!html.includes(page.sources[0].url)) fail('dist-source-link', routePath);
  }

  const aiPath = path.join(root, 'public', 'ai-resource-index.json');
  if (!fs.existsSync(aiPath)) {
    fail('ai-index', 'public/ai-resource-index.json missing.');
  } else {
    const ai = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
    const vocabularyCorpus = ai.corpus?.vocabulary_authority_guides || [];
    if (vocabularyCorpus.length !== 16) fail('ai-corpus-count', vocabularyCorpus.length);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const item = vocabularyCorpus.find((entry) => entry.canonical_url === `https://tinystepslearning.com${page.path}`);
      if (!item) {
        fail('ai-corpus-page', page.path);
        continue;
      }
      if (item.content_type !== 'vocabulary-authority-guide') fail('ai-content-type', page.path);
      if ((item.external_reference_urls || []).length < 2) fail('ai-reference-depth', page.path);
      if (item.practice_urls?.[0] !== 'https://tinystepslearning.com/free-games/word-meaning-flashcards') fail('ai-practice', page.path);
    }
  }
}

const report = {
  brick: 'GV4-preservation-under-GV5B',
  revision: VOCABULARY_AUTHORITY_REVISION,
  vocabularyStages: VOCABULARY_KNOWLEDGE_STAGES.length,
  authorityRequirements: VOCABULARY_AUTHORITY_REQUIREMENTS.length,
  publishedAuthorityGuides: VOCABULARY_AUTHORITY_PAGES.length,
  unpublishedAuthorityGuides: VOCABULARY_AUTHORITY_REQUIREMENTS.length - VOCABULARY_AUTHORITY_PAGES.length,
  lexicalBaseline: VOCABULARY_LEXICAL_ENTRIES.length,
  minimumKnowledgeWords: Math.min(...VOCABULARY_AUTHORITY_PAGES.map(knowledgeWordCount)),
  maximumKnowledgeWords: Math.max(...VOCABULARY_AUTHORITY_PAGES.map(knowledgeWordCount)),
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
