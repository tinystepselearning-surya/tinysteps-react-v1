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
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';

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
for (const token of ['AI_ANSWER_LAYER_MACHINE_JSON_PATH', 'AI_ANSWER_LAYER_MACHINE_TEXT_PATH', 'buildAiResourceIndex', 'buildAiAnswerLlmSection', 'buildEditorialBlogCorpus', 'buildProgrammaticPhonicsCorpus', 'buildPublicRouteCorpus', 'buildCompleteBlogLlmSection']) {
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

    const editorialBlogs = index.corpus?.editorial_blogs || [];
    const programmaticPhonics = index.corpus?.programmatic_phonics_guides || [];
    const additionalPublicRoutes = index.corpus?.additional_public_routes || [];
    if (editorialBlogs.length !== 83) fail('editorial-blog-corpus-count', `Expected all 83 current blogs; found ${editorialBlogs.length}.`);
    if (programmaticPhonics.length !== 31) fail('programmatic-phonics-corpus-count', `Expected all 31 governed phonics guides; found ${programmaticPhonics.length}.`);
    if (!additionalPublicRoutes.length) fail('public-route-corpus-empty', 'Expected additional public site routes in the connected corpus.');

    const blogUrls = editorialBlogs.map((item) => item.canonical_url);
    if (new Set(blogUrls).size !== editorialBlogs.length) fail('editorial-blog-corpus-duplicates', 'Editorial blog corpus contains duplicate canonical URLs.');
    for (const item of editorialBlogs) {
      if (!item.canonical_url?.startsWith('https://tinystepslearning.com/blog/')) fail('editorial-blog-canonical', item.id);
      if (!item.title?.trim() || !item.summary?.trim()) fail('editorial-blog-metadata', item.id);
      if (!['indexable', 'noindex'].includes(item.indexing_state)) fail('editorial-blog-indexing-state', item.id);
      if (item.indexing_state === 'noindex' && item.answer_eligible) fail('noindex-answer-eligibility', item.id);
      if (item.indexing_state === 'noindex' && item.retrieval_role !== 'supporting-only-noindex') fail('noindex-retrieval-role', item.id);
    }
    if (index.corpus_counts?.editorial_blogs !== 83) fail('corpus-count-summary', 'corpus_counts.editorial_blogs must equal 83.');
    if (index.corpus_counts?.programmatic_phonics_guides !== 31) fail('corpus-count-summary', 'corpus_counts.programmatic_phonics_guides must equal 31.');
    if (index.corpus_counts?.connected_public_content !== editorialBlogs.length + programmaticPhonics.length + additionalPublicRoutes.length) {
      fail('connected-public-content-count', 'Connected public content total does not reconcile.');
    }

    const representedCorpusUrls = new Set([
      ...editorialBlogs.map((item) => item.canonical_url),
      ...programmaticPhonics.map((item) => item.canonical_url),
      ...additionalPublicRoutes.map((item) => item.canonical_url),
    ]);
    for (const route of PUBLIC_ROUTE_MANIFEST) {
      const rawPath = route.canonicalPath || route.path;
      const normalizedPath = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '');
      const expectedUrl = 'https://tinystepslearning.com' + normalizedPath;
      if (!representedCorpusUrls.has(expectedUrl)) {
        fail('public-route-manifest-coverage', route.path + ' -> ' + expectedUrl);
      }
    }

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
    if (!source.includes('## Complete Editorial Blog Corpus')) fail('llms-blog-corpus-section', 'Complete editorial blog corpus section missing.');
    if (!source.includes('Generated complete corpus: 83 current Tiny Steps editorial articles')) fail('llms-blog-corpus-count', 'LLM discovery must declare all 83 current blogs.');
  }

  const blogLinksInFull = new Set(
    [...llmsFull.matchAll(/https:\/\/tinystepslearning\.com\/blog\/[a-z0-9-]+/g)].map((match) => match[0]),
  );
  if (blogLinksInFull.size < 83) fail('llms-full-blog-coverage', `Expected at least 83 unique current blog URLs in llms-full.txt; found ${blogLinksInFull.size}.`);
}

const report = {
  revision: '2026-09-26-r24-r27',
  layer1: AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length,
  layer2: AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length,
  layer3: AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length,
  total: AI_ANSWER_LAYER_ALL_ITEMS.length,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
