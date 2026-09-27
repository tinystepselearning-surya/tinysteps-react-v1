import fs from 'node:fs';
import path from 'node:path';
import {
  GRAMMAR_PROGRAMMATIC_PAGES,
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
} from '../src/lib/grammarProgrammaticRegistry.js';
import {
  GRAMMAR_REFERENCE_EXTENSION_PAGES,
  GRAMMAR_REFERENCE_EXTENSION_REVISION,
} from '../src/lib/grammarReferenceExtensionRegistry.js';
import { GRAMMAR_KNOWLEDGE_PAGES } from '../src/lib/grammarKnowledgeRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { AI_ANSWER_LAYER_2_LEARNING_CONCEPTS } from '../src/lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const countWords = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;

function knowledgeWordCount(page) {
  return countWords([
    page.quickAnswer,
    page.concept,
    page.whyItMatters,
    ...(page.examples || []),
    ...(page.commonMistakes || []),
    ...(page.practicePrompts || []),
    ...(page.rulePoints || []),
    ...(page.workedExamples || []).flatMap((item) => [item.example, item.explanation]),
    page.teachingNote,
    ...(page.trickyCases || []),
    ...(page.faqs || []).flatMap((item) => [item.question, item.answer]),
  ].join(' '));
}

const EXPECTED_IDS = [
  'determiners',
  'countable-uncountable-nouns',
  'noun-phrases',
  'verb-forms-irregular-verbs',
  'word-order-focus',
  'common-grammar-mistakes',
];

if (GRAMMAR_REFERENCE_EXTENSION_REVISION !== '2026-09-27-gv3') {
  fail('revision', GRAMMAR_REFERENCE_EXTENSION_REVISION);
}
if (GRAMMAR_PROGRAMMATIC_SEQUENCE.length !== 38) {
  fail('core-sequence', `Expected preserved 38-step Grammar sequence; found ${GRAMMAR_PROGRAMMATIC_SEQUENCE.length}.`);
}
if (GRAMMAR_PROGRAMMATIC_PAGES.length !== 32) {
  fail('core-pages', `Expected preserved 32 generated core Grammar guides; found ${GRAMMAR_PROGRAMMATIC_PAGES.length}.`);
}
if (GRAMMAR_REFERENCE_EXTENSION_PAGES.length !== 6) {
  fail('reference-count', `Expected six GV3 reference guides; found ${GRAMMAR_REFERENCE_EXTENSION_PAGES.length}.`);
}
if (GRAMMAR_KNOWLEDGE_PAGES.length !== 38) {
  fail('knowledge-count', `Expected 38 total Grammar knowledge pages; found ${GRAMMAR_KNOWLEDGE_PAGES.length}.`);
}
if (GRAMMAR_REFERENCE_EXTENSION_PAGES.map((page) => page.id).join('|') !== EXPECTED_IDS.join('|')) {
  fail('reference-order', GRAMMAR_REFERENCE_EXTENSION_PAGES.map((page) => page.id).join(','));
}

const publicPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const ownerByPath = new Map(
  CANONICAL_TOPIC_OWNERSHIP
    .filter((entry) => entry.id.startsWith('gv3-grammar-ref-'))
    .map((entry) => [entry.ownerPath, entry]),
);
const aiGrammarItems = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
  item.canonicalPath.startsWith('/resources/grammar/'),
);
if (aiGrammarItems.length !== 38) fail('ai-grammar-count', `Expected 38 Grammar AI concept owners; found ${aiGrammarItems.length}.`);

for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
  const words = knowledgeWordCount(page);
  if (page.publicationApproved !== true) fail('publication', page.id);
  if (page.publicationBatch !== 'gv3-first-reference-batch') fail('publication-batch', page.id);
  if (words < 600) fail('knowledge-depth', `${page.id} has ${words} words; minimum is 600.`);
  if ((page.sources || []).length < 2) fail('references', page.id);
  if (new Set((page.sources || []).map((source) => source.url)).size !== page.sources.length) fail('duplicate-references', page.id);
  if ((page.workedExamples || []).length < 3) fail('worked-examples', page.id);
  if ((page.faqs || []).length < 2) fail('faqs', page.id);
  if ((page.rulePoints || []).length < 3) fail('rules', page.id);
  if (!publicPaths.has(page.path)) fail('public-route', page.path);
  if (ROUTE_SEO_REGISTRY[page.path]?.canonicalPath !== page.path) fail('route-seo', page.path);
  const owner = ownerByPath.get(page.path);
  if (!owner) fail('canonical-owner', page.path);
  else if (owner.ownerRole !== 'skill-guide' || owner.intent !== 'informational') fail('canonical-role', page.path);
  const aiItem = aiGrammarItems.find((item) => item.canonicalPath === page.path);
  if (!aiItem) fail('ai-owner', page.path);
  else if (aiItem.answer !== page.quickAnswer) fail('ai-answer', page.path);
}

if (ownerByPath.size !== 6) fail('owner-count', `Expected six GV3 canonical owners; found ${ownerByPath.size}.`);

if (process.argv.includes('--dist')) {
  const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemap) fail('dist-sitemap', 'dist/sitemap.xml is missing.');

  for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
    const htmlPath = path.join(root, 'dist', page.path.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('dist-page', page.path);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes(page.cardTitle)) fail('dist-title', page.path);
    if (!html.includes('References and further reading')) fail('dist-references', page.path);
    if (!html.includes(page.sources[0].url)) fail('dist-source-link', page.path);
    if (!sitemap.includes(`https://tinystepslearning.com${page.path}`)) fail('dist-sitemap-entry', page.path);
  }

  const aiPath = path.join(root, 'public', 'ai-resource-index.json');
  if (!fs.existsSync(aiPath)) {
    fail('ai-index', 'public/ai-resource-index.json is missing after build.');
  } else {
    const ai = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
    const grammarCorpus = ai.corpus?.programmatic_grammar_guides || [];
    for (const page of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
      const item = grammarCorpus.find((entry) => entry.canonical_url === `https://tinystepslearning.com${page.path}`);
      if (!item) fail('ai-corpus-page', page.path);
      else {
        if (item.content_type !== 'grammar-reference-extension') fail('ai-content-type', page.path);
        if ((item.external_reference_urls || []).length < 2) fail('ai-reference-depth', page.path);
      }
    }
  }
}

const report = {
  brick: 'GV3',
  revision: GRAMMAR_REFERENCE_EXTENSION_REVISION,
  coreSequenceSteps: GRAMMAR_PROGRAMMATIC_SEQUENCE.length,
  corePublishedGuides: GRAMMAR_PROGRAMMATIC_PAGES.length,
  referenceGuides: GRAMMAR_REFERENCE_EXTENSION_PAGES.length,
  totalGrammarKnowledgePages: GRAMMAR_KNOWLEDGE_PAGES.length,
  minimumKnowledgeWords: Math.min(...GRAMMAR_REFERENCE_EXTENSION_PAGES.map(knowledgeWordCount)),
  maximumKnowledgeWords: Math.max(...GRAMMAR_REFERENCE_EXTENSION_PAGES.map(knowledgeWordCount)),
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
