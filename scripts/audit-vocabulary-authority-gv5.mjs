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
import { VOCABULARY_LEXICAL_ENTRIES } from '../src/lib/vocabularyLexicalModel.ts';
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
const knowledgeWordCount = (page) => countWords([
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

const EXPECTED_GV5_IDS = [
  'vocabulary-collocations',
  'phrasal-verbs-expressions',
  'vocabulary-for-writing',
  'vocabulary-for-speaking',
];

if (VOCABULARY_AUTHORITY_REVISION !== '2026-09-27-gv5b') fail('revision', VOCABULARY_AUTHORITY_REVISION);
if (VOCABULARY_AUTHORITY_REQUIREMENTS.length !== 16) fail('requirement-count', VOCABULARY_AUTHORITY_REQUIREMENTS.length);
if (VOCABULARY_KNOWLEDGE_STAGES.length !== 6) fail('stage-count', VOCABULARY_KNOWLEDGE_STAGES.length);
if (VOCABULARY_AUTHORITY_PAGES.length !== 16) fail('published-count', VOCABULARY_AUTHORITY_PAGES.length);
if (VOCABULARY_AUTHORITY_PATHS.length !== 16) fail('path-count', VOCABULARY_AUTHORITY_PATHS.length);
if (VOCABULARY_LEXICAL_ENTRIES.length !== 50) fail('lexical-baseline', VOCABULARY_LEXICAL_ENTRIES.length);

const gv4 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv4-first-authority-batch');
const gv5 = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5-natural-english-transfer');
const gv5b = VOCABULARY_AUTHORITY_PAGES.filter((page) => page.publicationBatch === 'gv5b-foundation-completion');
if (gv4.length !== 6) fail('gv4-preservation', gv4.map((page) => page.id).join(','));
if (gv5.length !== 4) fail('gv5-count', gv5.map((page) => page.id).join(','));
if (gv5b.length !== 6) fail('gv5b-count', gv5b.map((page) => page.id).join(','));
if (gv5.map((page) => page.id).join('|') !== EXPECTED_GV5_IDS.join('|')) {
  fail('gv5-order', gv5.map((page) => page.id).join(','));
}

const publishedIds = new Set(VOCABULARY_AUTHORITY_PAGES.map((page) => page.id));
const remaining = VOCABULARY_AUTHORITY_REQUIREMENTS.filter((item) => !publishedIds.has(item.id));
if (remaining.length !== 0) {
  fail('remaining-unpublished', remaining.map((item) => item.id).join(','));
}

const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
for (const requirement of remaining) {
  if (routePaths.has(requirement.proposedPath)) fail('unpublished-route-leak', requirement.proposedPath);
  if (ROUTE_SEO_REGISTRY[requirement.proposedPath]) fail('unpublished-seo-leak', requirement.proposedPath);
  if (CANONICAL_TOPIC_OWNERSHIP.some((entry) => entry.ownerPath === requirement.proposedPath)) fail('unpublished-owner-leak', requirement.proposedPath);
}

const gv5Owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.id.startsWith('gv5-vocabulary-'));
if (gv5Owners.length !== 4) fail('gv5-owner-count', gv5Owners.length);

for (const page of gv5) {
  const words = knowledgeWordCount(page);
  if (words < 600) fail('knowledge-depth', `${page.id}: ${words}`);
  if ((page.sources || []).length < 2) fail('reference-depth', page.id);
  if (new Set(page.sources.map((source) => source.url)).size !== page.sources.length) fail('reference-duplicates', page.id);
  if (page.sources.some((source) => !String(source.url).startsWith('https://'))) fail('reference-url', page.id);
  if ((page.coreIdeas || []).length !== 3) fail('core-ideas', page.id);
  if ((page.workedExamples || []).length !== 3) fail('worked-examples', page.id);
  if ((page.examples || []).length !== 3) fail('examples', page.id);
  if ((page.commonMistakes || []).length !== 3) fail('common-mistakes', page.id);
  if ((page.trickyCases || []).length !== 2) fail('tricky-cases', page.id);
  if ((page.practicePrompts || []).length !== 3) fail('practice-prompts', page.id);
  if ((page.faqs || []).length !== 2) fail('faqs', page.id);
  if (page.practicePath !== '/free-games/word-meaning-flashcards') fail('practice-path', page.id);
  if (!routePaths.has(page.path)) fail('route', page.path);
  if (ROUTE_SEO_REGISTRY[page.path]?.canonicalPath !== page.path) fail('seo', page.path);

  const owner = CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === `gv5-vocabulary-${page.id}`);
  if (!owner) fail('owner', page.path);
  else {
    if (owner.ownerPath !== page.path) fail('owner-path', page.path);
    if (owner.ownerRole !== 'skill-guide') fail('owner-role', page.path);
    if (owner.subject !== 'vocabulary') fail('owner-subject', page.path);
    if (owner.hubPath !== VOCABULARY_HUB_PATH) fail('owner-hub', page.path);
  }
}

const vocabularyLayer2 = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/vocabulary/'));
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length !== 112) fail('layer2-total', AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length);
if (vocabularyLayer2.length !== 16) fail('layer2-vocabulary', vocabularyLayer2.length);
for (const page of gv5) {
  const item = vocabularyLayer2.find((entry) => entry.canonicalPath === page.path);
  if (!item) fail('layer2-page', page.path);
  else {
    if (item.answer !== page.quickAnswer) fail('layer2-answer', page.path);
    if (item.practicePaths?.[0] !== '/free-games/word-meaning-flashcards') fail('layer2-practice', page.path);
  }
}

if (AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length !== 12) fail('layer3-total', AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length);
const practice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.find((item) => item.id === 'practice-vocabulary');
if (!practice || practice.canonicalPath !== '/free-games/word-meaning-flashcards') fail('practice-owner', practice?.canonicalPath || 'missing');

if (ROUTE_SEO_REGISTRY['/resources/grammar/collocations-for-kids']) fail('grammar-collocation-owner-leak', '/resources/grammar/collocations-for-kids');
if (ROUTE_SEO_REGISTRY['/resources/grammar/phrasal-verbs-for-kids']) fail('grammar-phrasal-owner-leak', '/resources/grammar/phrasal-verbs-for-kids');

if (process.argv.includes('--dist')) {
  const sitemapCandidates = [
    path.join(root, 'dist', 'sitemap-static.xml'),
    path.join(root, 'public', 'sitemap-static.xml'),
  ];
  const sitemapPath = sitemapCandidates.find((candidate) => fs.existsSync(candidate));
  const sitemap = sitemapPath ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemapPath) fail('dist-sitemap', 'sitemap-static.xml missing.');

  for (const page of gv5) {
    const htmlPath = path.join(root, 'dist', page.path.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('dist-page', page.path);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!sitemap.includes(`https://tinystepslearning.com${page.path}`)) fail('dist-sitemap-entry', page.path);
    if (!html.includes(page.cardTitle)) fail('dist-title', page.path);
    if (!html.includes('References and further reading')) fail('dist-references', page.path);
    if (!html.includes('Practise in Vocabulary Adventure')) fail('dist-practice', page.path);
    if (!html.includes(page.sources[0].url)) fail('dist-source-link', page.path);
  }

  const hubPath = path.join(root, 'dist', 'resources', 'vocabulary', 'index.html');
  if (!fs.existsSync(hubPath)) fail('dist-hub', VOCABULARY_HUB_PATH);
  else {
    const hub = fs.readFileSync(hubPath, 'utf8');
    if (!hub.includes('Explore all sixteen vocabulary authority guides')) fail('dist-hub-count', VOCABULARY_HUB_PATH);
  }

  const aiPath = path.join(root, 'public', 'ai-resource-index.json');
  if (!fs.existsSync(aiPath)) fail('ai-index', 'public/ai-resource-index.json missing.');
  else {
    const ai = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
    const corpus = ai.corpus?.vocabulary_authority_guides || [];
    if (corpus.length !== 16) fail('ai-corpus-count', corpus.length);
    for (const page of gv5) {
      const item = corpus.find((entry) => entry.canonical_url === `https://tinystepslearning.com${page.path}`);
      if (!item) fail('ai-corpus-page', page.path);
      else {
        if ((item.external_reference_urls || []).length < 2) fail('ai-reference-depth', page.path);
        if (item.practice_urls?.[0] !== 'https://tinystepslearning.com/free-games/word-meaning-flashcards') fail('ai-practice', page.path);
      }
    }
  }
}

const report = {
  brick: 'GV5',
  revision: VOCABULARY_AUTHORITY_REVISION,
  publishedTotal: VOCABULARY_AUTHORITY_PAGES.length,
  gv4Preserved: gv4.length,
  gv5Published: gv5.length,
  gv5bPublished: gv5b.length,
  remainingUnpublished: remaining.length,
  lexicalBaseline: VOCABULARY_LEXICAL_ENTRIES.length,
  gv5MinimumKnowledgeWords: Math.min(...gv5.map(knowledgeWordCount)),
  gv5MaximumKnowledgeWords: Math.max(...gv5.map(knowledgeWordCount)),
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
