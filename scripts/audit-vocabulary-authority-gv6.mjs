import fs from 'node:fs';
import path from 'node:path';
import { VOCABULARY_AUTHORITY_REQUIREMENTS, VOCABULARY_KNOWLEDGE_STAGES } from '../src/lib/grammarVocabularyAuthorityRequirements.js';
import { VOCABULARY_AUTHORITY_PAGES } from '../src/lib/vocabularyAuthorityRegistry.js';
import { VOCABULARY_AUTHORITY_PATHS, VOCABULARY_HUB_PATH } from '../src/lib/vocabularyAuthoritySeoManifest.js';
import { VOCABULARY_LEXICAL_ENTRIES } from '../src/lib/vocabularyLexicalModel.ts';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { isPublicAnalyticsPath } from '../src/lib/publicAnalyticsPathPolicy.js';
import {
  AI_ANSWER_LAYER_REVISION,
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
} from '../src/lib/aiAnswerLayerRegistry.js';
import { getCommercialC7R1Mapping } from '../src/lib/commercialC7KnowledgeOwnerMapping.ts';
import { getCommercialC7R2NextStepRule } from '../src/lib/commercialC7IntentNextStepRules.ts';
import { getCommercialC7R3Handoff } from '../src/lib/commercialC7ContextualHandoffImplementation.ts';
import {
  VOCABULARY_GV6_FREEZE_POLICY,
  VOCABULARY_GV6_MEASUREMENT_POLICY,
  VOCABULARY_GV6_PRACTICE_OWNER,
  VOCABULARY_GV6_REVISION,
  VOCABULARY_GV6_SEMANTIC_DESTINATIONS,
  VOCABULARY_GV6_STATUS,
} from '../src/lib/vocabularyGv6Closure.js';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });

if (VOCABULARY_GV6_REVISION !== '2026-09-27-gv6') fail('revision', VOCABULARY_GV6_REVISION);
if (VOCABULARY_GV6_STATUS !== 'discovery-ai-practice-integration-frozen') fail('status', VOCABULARY_GV6_STATUS);
if (VOCABULARY_AUTHORITY_REQUIREMENTS.length !== 16) fail('requirement-count', VOCABULARY_AUTHORITY_REQUIREMENTS.length);
if (VOCABULARY_KNOWLEDGE_STAGES.length !== 6) fail('stage-count', VOCABULARY_KNOWLEDGE_STAGES.length);
if (VOCABULARY_AUTHORITY_PAGES.length !== 16) fail('published-count', VOCABULARY_AUTHORITY_PAGES.length);
if (VOCABULARY_AUTHORITY_PATHS.length !== 16) fail('path-count', VOCABULARY_AUTHORITY_PATHS.length);
if (VOCABULARY_LEXICAL_ENTRIES.length !== 50) fail('lexical-baseline', VOCABULARY_LEXICAL_ENTRIES.length);
if (AI_ANSWER_LAYER_REVISION !== '2026-09-27-gv6') fail('ai-revision', AI_ANSWER_LAYER_REVISION);
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length !== 112) fail('layer2-total', AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length);
if (AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length !== 12) fail('layer3-total', AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length);

const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));
if (!isPublicAnalyticsPath(VOCABULARY_HUB_PATH)) fail('hub-analytics', VOCABULARY_HUB_PATH);

const vocabularyLayer2 = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/vocabulary/'));
if (vocabularyLayer2.length !== 16) fail('layer2-vocabulary', vocabularyLayer2.length);

for (const page of VOCABULARY_AUTHORITY_PAGES) {
  const route = routeByPath.get(page.path);
  if (!route) fail('route', page.path);
  else if (route.indexable === false) fail('indexable', page.path);
  if (ROUTE_SEO_REGISTRY[page.path]?.canonicalPath !== page.path) fail('seo', page.path);
  if (!isPublicAnalyticsPath(page.path)) fail('analytics', page.path);

  const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.ownerPath === page.path);
  if (owners.length !== 1) fail('owner-count', page.path + ':' + owners.length);
  else if (owners[0].subject !== 'vocabulary' || owners[0].ownerRole !== 'skill-guide') fail('owner-contract', page.path);

  const layer2 = vocabularyLayer2.find((entry) => entry.canonicalPath === page.path);
  if (!layer2) fail('layer2-page', page.path);
  else if (layer2.practicePaths?.[0] !== VOCABULARY_GV6_PRACTICE_OWNER) fail('layer2-practice', page.path);

  const r1 = getCommercialC7R1Mapping(page.path);
  const r2 = getCommercialC7R2NextStepRule(page.path);
  const r3 = getCommercialC7R3Handoff(page.path);
  if (!r1 || r1.primaryCommercialOwner !== null || r1.ownerFamily !== 'soft-discovery' || r1.decision !== 'HOLD_SOFT_DISCOVERY') {
    fail('c7-r1', page.path);
  }
  if (!r2 || r2.ruleClass !== 'SOFT_DISCOVERY' || r2.primaryDestination !== null || r2.maxCommercialPrompts !== 0) {
    fail('c7-r2', page.path);
  }
  if (r3 !== null) fail('c7-r3', page.path);
}

const practiceItems = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.filter((item) => item.subject === 'vocabulary');
if (practiceItems.length !== 1) fail('vocabulary-practice-count', practiceItems.length);
if (practiceItems[0]?.canonicalPath !== VOCABULARY_GV6_PRACTICE_OWNER) fail('practice-owner', practiceItems[0]?.canonicalPath || 'missing');

const pageById = new Map(VOCABULARY_AUTHORITY_PAGES.map((page) => [page.id, page]));
if (!pageById.get('context-clues')?.relatedPaths.includes(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.reading)) fail('reading-transfer', 'context-clues');
if (!pageById.get('vocabulary-for-speaking')?.relatedPaths.includes(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.speaking)) fail('speaking-transfer', 'vocabulary-for-speaking');
if (!pageById.get('vocabulary-for-writing')?.relatedPaths.includes(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.writing)) fail('writing-transfer', 'vocabulary-for-writing');

if (!VOCABULARY_GV6_MEASUREMENT_POLICY.publicAnalyticsRequired) fail('measurement-analytics', 'disabled');
if (VOCABULARY_GV6_MEASUREMENT_POLICY.expansionDefault !== 'HOLD') fail('measurement-expansion', VOCABULARY_GV6_MEASUREMENT_POLICY.expansionDefault);
if (VOCABULARY_GV6_MEASUREMENT_POLICY.numericThresholdInvented !== false) fail('measurement-threshold', 'must not invent a threshold');
if (VOCABULARY_GV6_FREEZE_POLICY.newAuthorityUrlsAllowed !== false) fail('freeze-new-urls', 'must be false');
if (VOCABULARY_GV6_FREEZE_POLICY.newPracticeOwnerAllowed !== false) fail('freeze-practice-owner', 'must be false');

const generator = fs.readFileSync(path.join(root, 'scripts', 'generate-rss.mjs'), 'utf8');
for (const token of [
  'Vocabulary Authority Library — 16 governed guides',
  'buildVocabularyLlmSection',
  'buildVocabularyAuthorityCorpus',
  'AI_ANSWER_LAYER_MACHINE_JSON_PATH',
  'AI_ANSWER_LAYER_MACHINE_TEXT_PATH',
]) {
  if (!generator.includes(token)) fail('generator-contract', token);
}

if (process.argv.includes('--dist')) {
  const sitemapCandidates = [
    path.join(root, 'dist', 'sitemap-static.xml'),
    path.join(root, 'public', 'sitemap-static.xml'),
  ];
  const sitemapPath = sitemapCandidates.find((candidate) => fs.existsSync(candidate));
  const sitemap = sitemapPath ? fs.readFileSync(sitemapPath, 'utf8') : '';
  if (!sitemapPath) fail('dist-sitemap', 'sitemap-static.xml missing');

  for (const publicPath of [VOCABULARY_HUB_PATH, ...VOCABULARY_AUTHORITY_PATHS]) {
    if (!sitemap.includes('https://tinystepslearning.com' + publicPath)) fail('sitemap-entry', publicPath);
  }

  const llmPaths = [path.join(root, 'public', 'llms.txt'), path.join(root, 'public', 'llms-full.txt')];
  for (const llmPath of llmPaths) {
    if (!fs.existsSync(llmPath)) {
      fail('llm-file', llmPath);
      continue;
    }
    const source = fs.readFileSync(llmPath, 'utf8');
    if (!source.includes('## Vocabulary Authority Library — 16 governed guides')) fail('llm-heading', llmPath);
    if (!source.includes('https://tinystepslearning.com' + VOCABULARY_GV6_PRACTICE_OWNER)) fail('llm-practice', llmPath);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      if (!source.includes('https://tinystepslearning.com' + page.path)) fail('llm-guide', page.path);
    }
    for (const destination of Object.values(VOCABULARY_GV6_SEMANTIC_DESTINATIONS)) {
      if (!source.includes('https://tinystepslearning.com' + destination)) fail('llm-semantic-boundary', destination);
    }
  }

  const aiPath = path.join(root, 'public', 'ai-resource-index.json');
  if (!fs.existsSync(aiPath)) fail('ai-index', 'missing');
  else {
    const ai = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
    if (ai.revision !== '2026-09-27-gv6') fail('ai-index-revision', ai.revision);
    const corpus = ai.corpus?.vocabulary_authority_guides || [];
    if (corpus.length !== 16) fail('ai-corpus-count', corpus.length);
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const item = corpus.find((entry) => entry.canonical_url === 'https://tinystepslearning.com' + page.path);
      if (!item) fail('ai-corpus-page', page.path);
      else if (item.practice_urls?.[0] !== 'https://tinystepslearning.com' + VOCABULARY_GV6_PRACTICE_OWNER) fail('ai-corpus-practice', page.path);
    }
  }
}

console.log(JSON.stringify({
  brick: 'GV6',
  revision: VOCABULARY_GV6_REVISION,
  status: VOCABULARY_GV6_STATUS,
  requirements: VOCABULARY_AUTHORITY_REQUIREMENTS.length,
  published: VOCABULARY_AUTHORITY_PAGES.length,
  lexicalBaseline: VOCABULARY_LEXICAL_ENTRIES.length,
  vocabularyLayer2: vocabularyLayer2.length,
  vocabularyPracticeOwners: practiceItems.length,
  expansionDefault: VOCABULARY_GV6_MEASUREMENT_POLICY.expansionDefault,
  errors,
}, null, 2));

if (errors.length) process.exitCode = 1;
