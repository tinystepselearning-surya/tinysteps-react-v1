import fs from 'node:fs';
import path from 'node:path';
import {
  VOCABULARY_AUTHORITY_PAGES,
} from '../src/lib/vocabularyAuthorityRegistry.js';
import {
  VOCABULARY_AUTHORITY_REVISION,
} from '../src/lib/vocabularyAuthoritySeoManifest.js';
import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
} from '../src/lib/grammarVocabularyAuthorityRequirements.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { AI_ANSWER_LAYER_2_LEARNING_CONCEPTS } from '../src/lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const countWords = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;

function knowledgeWords(page) {
  return countWords([
    page.quickAnswer,
    page.concept,
    page.whyItMatters,
    ...(page.teachingPoints || []),
    ...(page.wordGroups || []).flatMap((group) => [group.label, ...(group.words || []), group.note]),
    ...(page.workedExamples || []).flatMap((item) => [item.example, item.explanation]),
    ...(page.examples || []),
    ...(page.commonMistakes || []),
    ...(page.trickyCases || []),
    page.teachingNote,
    ...(page.practicePrompts || []),
    ...(page.faqs || []).flatMap((item) => [item.question, item.answer]),
  ].join(' '));
}

const EXPECTED_IDS = [
  'everyday-vocabulary',
  'feelings-emotions',
  'school-vocabulary',
  'synonyms-antonyms',
  'context-clues',
  'word-families-prefixes-suffixes',
];

if (VOCABULARY_AUTHORITY_REVISION !== '2026-09-27-gv4') fail('revision', VOCABULARY_AUTHORITY_REVISION);
if (VOCABULARY_AUTHORITY_PAGES.length !== 6) fail('page-count', `Expected six GV4 pages; found ${VOCABULARY_AUTHORITY_PAGES.length}.`);
if (VOCABULARY_AUTHORITY_PAGES.map((page) => page.id).join('|') !== EXPECTED_IDS.join('|')) {
  fail('page-order', VOCABULARY_AUTHORITY_PAGES.map((page) => page.id).join(','));
}

const requirementIds = new Set(VOCABULARY_AUTHORITY_REQUIREMENTS.map((item) => item.id));
const publicPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) =>
  entry.id === 'vocabulary-resource-discovery' || entry.id.startsWith('gv4-vocabulary-'),
);
const aiVocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
  item.canonicalPath.startsWith('/resources/vocabulary/'),
);

if (!publicPaths.has('/resources/vocabulary')) fail('hub-route', '/resources/vocabulary');
if (ROUTE_SEO_REGISTRY['/resources/vocabulary']?.canonicalPath !== '/resources/vocabulary') fail('hub-seo', '/resources/vocabulary');
if (owners.length !== 7) fail('owner-count', `Expected 7 Vocabulary owners including hub; found ${owners.length}.`);
if (aiVocabulary.length !== 6) fail('ai-count', `Expected 6 Vocabulary Layer-2 concepts; found ${aiVocabulary.length}.`);

for (const page of VOCABULARY_AUTHORITY_PAGES) {
  if (!requirementIds.has(page.id)) fail('unapproved-requirement', page.id);
  if (page.publicationApproved !== true) fail('publication', page.id);
  if (page.publicationBatch !== 'gv4-first-authority-batch') fail('batch', page.id);
  if (page.practicePath !== '/free-games/word-meaning-flashcards') fail('practice-owner', page.id);
  const words = knowledgeWords(page);
  if (words < 600) fail('knowledge-depth', `${page.id} has ${words} words; minimum is 600.`);
  if ((page.sources || []).length < 2) fail('references', page.id);
  if (new Set((page.sources || []).map((source) => source.url)).size !== page.sources.length) fail('reference-duplicates', page.id);
  if ((page.sources || []).some((source) => !String(source.url).startsWith('https://'))) fail('reference-url', page.id);
  if ((page.teachingPoints || []).length < 3) fail('teaching-points', page.id);
  if ((page.workedExamples || []).length < 3) fail('worked-examples', page.id);
  if ((page.commonMistakes || []).length < 3) fail('mistakes', page.id);
  if ((page.trickyCases || []).length < 2) fail('tricky-cases', page.id);
  if ((page.practicePrompts || []).length < 3) fail('practice-prompts', page.id);
  if ((page.faqs || []).length < 2) fail('faqs', page.id);
  if (!publicPaths.has(page.path)) fail('public-route', page.path);
  if (ROUTE_SEO_REGISTRY[page.path]?.canonicalPath !== page.path) fail('route-seo', page.path);
  const owner = owners.find((entry) => entry.ownerPath === page.path);
  if (!owner) fail('canonical-owner', page.path);
  else {
    if (owner.ownerRole !== 'skill-guide') fail('canonical-role', page.path);
    if (owner.intent !== 'informational') fail('canonical-intent', page.path);
    if (owner.hubPath !== '/resources/vocabulary') fail('canonical-hub', page.path);
  }
  const aiItem = aiVocabulary.find((item) => item.canonicalPath === page.path);
  if (!aiItem) fail('ai-item', page.path);
  else {
    if (aiItem.answer !== page.quickAnswer) fail('ai-answer', page.path);
    if (!aiItem.practicePaths.includes('/free-games/word-meaning-flashcards')) fail('ai-practice', page.path);
  }
}

const hubOwner = owners.find((entry) => entry.id === 'vocabulary-resource-discovery');
if (!hubOwner) fail('hub-owner', '/resources/vocabulary');
else if (hubOwner.ownerRole !== 'subject-hub' || hubOwner.intent !== 'informational') {
  fail('hub-owner-role', `${hubOwner.ownerRole}/${hubOwner.intent}`);
}

if (process.argv.includes('--dist')) {
  const sitemapPath = path.join(root, 'dist', 'sitemap-static.xml');
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemap) fail('dist-sitemap', 'dist/sitemap-static.xml is missing.');

  const renderedPaths = ['/resources/vocabulary', ...VOCABULARY_AUTHORITY_PAGES.map((page) => page.path)];
  for (const routePath of renderedPaths) {
    const htmlPath = path.join(root, 'dist', routePath.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('dist-page', routePath);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('ts-answer-summary')) fail('dist-answer', routePath);
    if (!sitemap.includes(`https://tinystepslearning.com${routePath}`)) fail('dist-sitemap-entry', routePath);
  }

  for (const page of VOCABULARY_AUTHORITY_PAGES) {
    const htmlPath = path.join(root, 'dist', page.path.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(htmlPath)) continue;
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes(page.cardTitle)) fail('dist-title', page.path);
    if (!html.includes('References and further reading')) fail('dist-references', page.path);
    if (!html.includes(page.sources[0].url)) fail('dist-source-link', page.path);
    if (!html.includes('/free-games/word-meaning-flashcards')) fail('dist-practice-link', page.path);
  }

  const aiPath = path.join(root, 'public', 'ai-resource-index.json');
  if (!fs.existsSync(aiPath)) {
    fail('ai-index', 'public/ai-resource-index.json is missing after build.');
  } else {
    const ai = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
    const corpus = ai.corpus?.vocabulary_authority_guides || [];
    if (corpus.length !== 6) fail('ai-corpus-count', `Expected 6 vocabulary corpus pages; found ${corpus.length}.`);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const item = corpus.find((entry) => entry.canonical_url === `https://tinystepslearning.com${page.path}`);
      if (!item) fail('ai-corpus-page', page.path);
      else {
        if (item.content_type !== 'vocabulary-authority-guide') fail('ai-content-type', page.path);
        if ((item.external_reference_urls || []).length < 2) fail('ai-reference-depth', page.path);
        if (!(item.practice_urls || []).includes('https://tinystepslearning.com/free-games/word-meaning-flashcards')) fail('ai-practice-url', page.path);
      }
    }
  }
}

const report = {
  brick: 'GV4',
  revision: VOCABULARY_AUTHORITY_REVISION,
  vocabularyAuthorityPages: VOCABULARY_AUTHORITY_PAGES.length,
  minimumKnowledgeWords: Math.min(...VOCABULARY_AUTHORITY_PAGES.map(knowledgeWords)),
  maximumKnowledgeWords: Math.max(...VOCABULARY_AUTHORITY_PAGES.map(knowledgeWords)),
  canonicalOwners: owners.length,
  aiLayer2VocabularyItems: aiVocabulary.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
