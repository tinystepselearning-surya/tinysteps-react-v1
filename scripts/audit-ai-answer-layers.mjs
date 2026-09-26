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
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../src/lib/phonicsPublicationRegistry.js';
import { GRAMMAR_PUBLISHED_RESOURCE_PAGES } from '../src/lib/grammarPublicationRegistry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });

function walkBlogSources(dirPath) {
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) results.push(...walkBlogSources(fullPath));
    else if (entry.isFile() && fullPath.endsWith('.ts')) results.push(fullPath);
  }
  return results;
}

function expectedLiveBlogCount() {
  const today = new Date().toISOString().slice(0, 10);
  let liveCanonical = 0;

  for (const filePath of walkBlogSources(path.join(root, 'src/content/blog/posts'))) {
    const source = fs.readFileSync(filePath, 'utf8');
    const slug = /slug:\s*'([^']+)'/.exec(source)?.[1];
    const date = /date:\s*'(\d{4}-\d{2}-\d{2})'/.exec(source)?.[1];
    if (!slug) continue;
    if (date && date > today) continue;
    liveCanonical += 1;
  }
  return liveCanonical;
}

const expectedLiveCanonicalBlogs = expectedLiveBlogCount();
if (expectedLiveCanonicalBlogs < 82) {
  fail(
    'editorial-blog-baseline-regression',
    `Expected at least the established 82 live canonical editorial articles; source tree currently resolves to ${expectedLiveCanonicalBlogs}.`,
  );
}

if (AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length !== 28) fail('layer-1-count', 'Expected 28 reconciled parent-problem entries.');
const expectedLayer2Count = 27 + PHONICS_PUBLISHED_RESOURCE_PAGES.length + GRAMMAR_PUBLISHED_RESOURCE_PAGES.length;
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length !== expectedLayer2Count) fail('layer-2-count', `Expected 27 curated concepts plus governed phonics and grammar sets (${expectedLayer2Count} total).`);
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
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/phonics/')).length !== PHONICS_PUBLISHED_RESOURCE_PAGES.length) {
  fail('governed-phonics-count', `Layer 2 must contain exactly the governed ${PHONICS_PUBLISHED_RESOURCE_PAGES.length} focused phonics URLs.`);
}
if (AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/grammar/')).length !== GRAMMAR_PUBLISHED_RESOURCE_PAGES.length) {
  fail('governed-grammar-count', `Layer 2 must contain exactly the governed ${GRAMMAR_PUBLISHED_RESOURCE_PAGES.length} focused grammar URLs.`);
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
for (const token of ['AI_ANSWER_LAYER_MACHINE_JSON_PATH', 'AI_ANSWER_LAYER_MACHINE_TEXT_PATH', 'buildAiResourceIndex', 'buildAiAnswerLlmSection', 'buildEditorialBlogCorpus', 'buildProgrammaticPhonicsCorpus', 'buildProgrammaticGrammarCorpus', 'buildPublicRouteCorpus', 'buildCompleteBlogLlmSection']) {
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
    const programmaticGrammar = index.corpus?.programmatic_grammar_guides || [];
    const additionalPublicRoutes = index.corpus?.additional_public_routes || [];
    if (editorialBlogs.length !== expectedLiveCanonicalBlogs) fail('editorial-blog-corpus-count', `Expected all ${expectedLiveCanonicalBlogs} live canonical blogs; found ${editorialBlogs.length}.`);
    if (programmaticPhonics.length !== PHONICS_PUBLISHED_RESOURCE_PAGES.length) fail('programmatic-phonics-corpus-count', `Expected all ${PHONICS_PUBLISHED_RESOURCE_PAGES.length} governed phonics guides; found ${programmaticPhonics.length}.`);
    if (programmaticGrammar.length !== GRAMMAR_PUBLISHED_RESOURCE_PAGES.length) fail('programmatic-grammar-corpus-count', `Expected all ${GRAMMAR_PUBLISHED_RESOURCE_PAGES.length} governed grammar guides; found ${programmaticGrammar.length}.`);
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
    if (index.corpus_counts?.editorial_blogs !== expectedLiveCanonicalBlogs) fail('corpus-count-summary', `corpus_counts.editorial_blogs must equal ${expectedLiveCanonicalBlogs}.`);
    if (index.corpus_counts?.programmatic_phonics_guides !== PHONICS_PUBLISHED_RESOURCE_PAGES.length) fail('corpus-count-summary', 'programmatic_phonics_guides count drifted.');
    if (index.corpus_counts?.programmatic_grammar_guides !== GRAMMAR_PUBLISHED_RESOURCE_PAGES.length) fail('corpus-count-summary', 'programmatic_grammar_guides count drifted.');

      const expectedTargetPath = RETIRED_BLOG_SOURCE_REDIRECTS.get(item.slug);
      const expectedSourceUrl = 'https://tinystepslearning.com/blog/' + item.slug;
      const expectedTargetUrl = expectedTargetPath ? 'https://tinystepslearning.com' + expectedTargetPath : null;
      if (item.source_url !== expectedSourceUrl) fail('retired-editorial-source-url', item.id);
      if (item.redirect_target_url !== expectedTargetUrl) fail('retired-editorial-target-url', item.id);
      if (item.indexing_state !== 'redirected') fail('retired-editorial-indexing-state', item.id);
      if (item.retrieval_role !== 'redirect-lineage-only') fail('retired-editorial-retrieval-role', item.id);
      if (item.answer_eligible !== false || item.citation_eligible !== false) fail('retired-editorial-eligibility', item.id);
    }

      fail('connected-public-content-count', 'Connected public content total does not reconcile.');
    }

    const representedCorpusUrls = new Set([
      ...editorialBlogs.map((item) => item.canonical_url),
      ...programmaticPhonics.map((item) => item.canonical_url),
      ...programmaticGrammar.map((item) => item.canonical_url),
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
    if (!source.includes(`Generated editorial estate: ${expectedLiveCanonicalBlogs} live canonical Tiny Steps articles`)) {
      fail('llms-blog-corpus-count', `LLM discovery must declare the ${expectedLiveCanonicalBlogs} live canonical editorial articles.`);
    }
  }

  const generatedIndex = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : null;
  for (const item of generatedIndex?.corpus?.editorial_blogs || []) {
    if (!llmsFull.includes(item.canonical_url)) fail('llms-full-blog-coverage', item.canonical_url);
  }
    if (!llmsFull.includes(item.source_url) || !llmsFull.includes(item.redirect_target_url)) {
      fail('llms-full-retired-lineage-coverage', item.id);
    }
  }
}

const report = {
  revision: '2026-09-27-r28-grammar-pseo',
  layer1: AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length,
  layer2: AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.length,
  layer3: AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.length,
  total: AI_ANSWER_LAYER_ALL_ITEMS.length,
  expectedLiveCanonicalBlogs,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
