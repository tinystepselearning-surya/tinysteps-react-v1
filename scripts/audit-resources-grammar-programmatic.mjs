#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  GRAMMAR_PUBLISHED_RESOURCE_PAGES,
  GRAMMAR_PUBLISHED_RESOURCE_PATHS,
  GRAMMAR_PUBLISHED_RESOURCE_SEO,
  getPublishedGrammarResourcePageBySlug,
} from '../src/lib/grammarPublicationRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { AI_ANSWER_LAYER_2_LEARNING_CONCEPTS } from '../src/lib/aiAnswerLayerRegistry.js';

const root = process.cwd();
const dist = process.argv.includes('--dist');
const errors = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

if (GRAMMAR_PUBLISHED_RESOURCE_PAGES.length !== 42) {
  add('page-count', 'grammar-pseo', `Expected 42 governed Grammar pages, found ${GRAMMAR_PUBLISHED_RESOURCE_PAGES.length}.`);
}

for (const [name, values] of [
  ['id', GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.id)],
  ['slug', GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.slug)],
  ['path', GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.path)],
  ['query', GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.parentQuestion.toLowerCase())],
]) {
  if (new Set(values).size !== values.length) add('duplicate-' + name, 'grammar-pseo', 'Grammar publication values must be unique.');
}

for (let index = 1; index < GRAMMAR_PUBLISHED_RESOURCE_PAGES.length; index += 1) {
  if (GRAMMAR_PUBLISHED_RESOURCE_PAGES[index].progressionRank <= GRAMMAR_PUBLISHED_RESOURCE_PAGES[index - 1].progressionRank) {
    add('progression-order', GRAMMAR_PUBLISHED_RESOURCE_PAGES[index].id, 'Grammar pages must remain in strict curriculum progression order.');
  }
}

for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
  if (page.path !== `/resources/grammar/${page.slug}`) add('path-shape', page.id, page.path);
  if (page.quickAnswer.length < 80) add('thin-quick-answer', page.id, String(page.quickAnswer.length));
  if (page.teachingBoundary.length < 80) add('thin-boundary', page.id, String(page.teachingBoundary.length));
  if (page.examples.length < 2 || page.teachingSteps.length < 3 || page.commonMistakes.length < 3 || page.practiceIdeas.length < 3) {
    add('thin-learning-content', page.id, 'Expected examples plus at least three teaching steps, mistakes and practice ideas.');
  }
  if (!page.curriculumRefs.length) add('missing-curriculum-ref', page.id, page.path);
  if (page.publicationState !== 'published') add('publication-state', page.id, page.publicationState);

  const route = manifestByPath.get(page.path);
  if (!route?.indexable || !route?.prerender || !route?.sitemap || route.canonicalPath !== page.path) {
    add('route-contract', page.id, JSON.stringify(route));
  }
  const seo = ROUTE_SEO_REGISTRY[page.path];
  if (!seo || seo.canonicalPath !== page.path || !String(seo.robots || '').includes('index, follow')) {
    add('seo-contract', page.id, JSON.stringify(seo));
  }
  if (GRAMMAR_PUBLISHED_RESOURCE_SEO[page.path] !== seo) add('seo-registry-identity', page.id, page.path);
  if (getPublishedGrammarResourcePageBySlug(page.slug)?.id !== page.id) add('slug-lookup', page.id, page.slug);
}

if (new Set(GRAMMAR_PUBLISHED_RESOURCE_PATHS).size !== GRAMMAR_PUBLISHED_RESOURCE_PAGES.length) {
  add('path-export-count', 'grammar-pseo', String(GRAMMAR_PUBLISHED_RESOURCE_PATHS.length));
}

const layer2Grammar = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) => item.canonicalPath.startsWith('/resources/grammar/'));
if (layer2Grammar.length !== GRAMMAR_PUBLISHED_RESOURCE_PAGES.length) {
  add('ai-layer-coverage', 'grammar-pseo', `Expected ${GRAMMAR_PUBLISHED_RESOURCE_PAGES.length}, found ${layer2Grammar.length}.`);
}

const subjectHub = fs.readFileSync(path.join(root, 'src/pages/SubjectResourcesPage.tsx'), 'utf8');
const timeline = fs.readFileSync(path.join(root, 'src/components/resources/GrammarResourceTimeline.tsx'), 'utf8');
const pageTemplate = fs.readFileSync(path.join(root, 'src/pages/GrammarKnowledgePage.tsx'), 'utf8');
if (!subjectHub.includes('<GrammarResourceTimeline />')) add('hub-timeline', 'grammar-pseo', 'Grammar hub must render the curriculum timeline.');
if (!timeline.includes('Learn key grammar concepts in curriculum order')) add('timeline-heading', 'grammar-pseo', 'Missing parent-facing chronology heading.');
if (!pageTemplate.includes('getPublishedGrammarResourcePageBySlug')) add('single-renderer', 'grammar-pseo', 'Grammar pages must use one governed renderer.');
if (!pageTemplate.includes('<NotFoundPage />')) add('unknown-slug-safety', 'grammar-pseo', 'Unknown Grammar slugs must return NotFoundPage.');

if (dist) {
  for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
    const file = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(file)) {
      add('missing-prerender', page.id, path.relative(root, file));
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`<link rel="canonical" href="https://tinystepslearning.com${page.path}"`)) {
      add('rendered-canonical', page.id, page.path);
    }
    if (!html.includes(page.quickAnswer)) add('rendered-quick-answer', page.id, page.path);
    if (!html.includes('Grammar guide')) add('rendered-template', page.id, page.path);
  }
}

const report = {
  revision: '2026-09-27-gr-pseo-1',
  pages: GRAMMAR_PUBLISHED_RESOURCE_PAGES.length,
  beginnerPages: GRAMMAR_PUBLISHED_RESOURCE_PAGES.filter((page) => page.level === 'beginner').length,
  advancedPages: GRAMMAR_PUBLISHED_RESOURCE_PAGES.filter((page) => page.level === 'advanced').length,
  dist,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
else console.log(`PASS: ${report.pages} governed Grammar knowledge pages are curriculum-ordered, self-canonical and connected to Resources.`);
