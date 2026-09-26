import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AI_ANSWER_LAYER_1_PARENT_PROBLEMS,
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
  AI_ANSWER_LAYER_ALL_ITEMS,
  AI_ANSWER_LAYER_MACHINE_JSON_PATH,
  AI_ANSWER_LAYER_MACHINE_TEXT_PATH,
} from '../src/lib/aiAnswerLayerRegistry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });

if (AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length !== 28) fail('layer-1-count', 'Expected 28 reconciled parent-problem entries.');
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length !== 58) fail('layer-2-count', 'Expected 27 curated concepts plus the governed 31-page phonics set.');
if (AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length !== 11) fail('layer-3-count', 'Expected 11 focused practice actions.');

const ids = AI_ANSWER_LAYER_ALL_ITEMS.map((item) => item.id);
if (new Set(ids).size !== ids.length) fail('duplicate-id', 'AI answer-layer IDs must be globally unique.');

const forbiddenCanonicalOwners = new Set(['/phonics', '/grammar', '/speaking', '/book-demo']);
for (const item of AI_ANSWER_LAYER_ALL_ITEMS) {
  if (!item.query?.trim()) fail('missing-query', item.id);
  if (!item.canonicalPath?.startsWith('/')) fail('missing-canonical', item.id);
  if (!item.hubPath?.startsWith('/resources/')) fail('missing-hub', item.id);
  if (forbiddenCanonicalOwners.has(item.canonicalPath)) fail('commercial-answer-owner', item.id + ' -> ' + item.canonicalPath);
}
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/phonics/')).length !== 31) {
  fail('governed-phonics-count', 'Layer 2 must contain exactly the governed 31 focused phonics URLs.');
}

const resourcesPageSource = fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8');
if (!resourcesPageSource.includes('AiAnswerLayerDirectory')) {
  fail('missing-visible-directory', 'src/pages/ResourcesPage.tsx');
}

const subjectHubSource = fs.readFileSync(path.join(root, 'src/pages/SubjectResourcesPage.tsx'), 'utf8');
for (const phrase of ['Learn the pathway', 'Practise the skill', 'Solve a problem']) {
  if (!subjectHubSource.includes(phrase)) fail('subject-layer-contract', phrase);
}

const generator = fs.readFileSync(path.join(root, 'scripts/generate-rss.mjs'), 'utf8');
for (const token of ['AI_ANSWER_LAYER_MACHINE_JSON_PATH', 'AI_ANSWER_LAYER_MACHINE_TEXT_PATH', 'buildAiResourceIndex', 'buildAiAnswerLlmSection']) {
  if (!generator.includes(token)) fail('generator-contract', token);
}

if (process.argv.includes('--generated')) {
  const jsonPath = path.join(root, 'public', AI_ANSWER_LAYER_MACHINE_JSON_PATH.slice(1));
  const textPath = path.join(root, 'public', AI_ANSWER_LAYER_MACHINE_TEXT_PATH.slice(1));
  if (!fs.existsSync(jsonPath)) fail('missing-generated-json', jsonPath);
  if (!fs.existsSync(textPath)) fail('missing-generated-text', textPath);

  if (fs.existsSync(jsonPath)) {
    const index = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(index.layers) || index.layers.length !== 3) fail('generated-layer-count', 'Expected exactly three generated answer layers.');
    let externalReferenceCount = 0;
    for (const layer of index.layers || []) {
      for (const item of layer.items || []) {
        if (!item.answer?.trim()) fail('generated-answer-empty', item.id);
        if (!item.canonical_url?.startsWith('https://tinystepslearning.com/')) fail('generated-canonical-url', item.id);
        if (!Array.isArray(item.reference_urls)) fail('generated-related-references', item.id);
        if (!Array.isArray(item.external_reference_urls)) fail('generated-external-references', item.id);
        else externalReferenceCount += item.external_reference_urls.length;
        if (!Array.isArray(item.practice_urls)) fail('generated-practice-links', item.id);
      }
    }
    if (externalReferenceCount === 0) fail('generated-evidence-coverage', 'Expected at least one visible external evidence reference from canonical editorial sources.');
  }

  const llms = fs.readFileSync(path.join(root, 'public', 'llms.txt'), 'utf8');
  const llmsFull = fs.readFileSync(path.join(root, 'public', 'llms-full.txt'), 'utf8');
  for (const source of [llms, llmsFull]) {
    if (!source.includes('## AI Answer Layers — problem, concept, practice')) fail('llms-layer-section', 'AI answer layer section missing.');
    if (!source.includes('https://tinystepslearning.com/ai-resource-index.json')) fail('llms-json-link', 'Machine JSON link missing.');
  }
}

const report = {
  revision: '2026-09-26-r24-r26',
  layer1: AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length,
  layer2: AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length,
  layer3: AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length,
  total: AI_ANSWER_LAYER_ALL_ITEMS.length,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
