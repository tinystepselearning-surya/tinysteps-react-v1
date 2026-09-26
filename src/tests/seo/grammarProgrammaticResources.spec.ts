import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GRAMMAR_PROGRAMMATIC_PAGES,
  GRAMMAR_PROGRAMMATIC_PATHS,
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
  GRAMMAR_PROGRAMMATIC_RESOURCE_SEO,
} from '../../lib/grammarProgrammaticRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Governed grammar programmatic resources', () => {
  it('publishes a bounded 32-page set inside a 38-step curriculum-aligned sequence', () => {
    expect(GRAMMAR_PROGRAMMATIC_SEQUENCE).toHaveLength(38);
    expect(GRAMMAR_PROGRAMMATIC_PAGES).toHaveLength(32);
    expect(GRAMMAR_PROGRAMMATIC_PATHS).toHaveLength(32);
    expect(new Set(GRAMMAR_PROGRAMMATIC_PATHS).size).toBe(32);
    expect(GRAMMAR_PROGRAMMATIC_SEQUENCE.map((entry) => entry.order)).toEqual(
      Array.from({ length: 38 }, (_, index) => index + 1),
    );
  });

  it('keeps existing strong canonical owners instead of generating duplicate grammar pages', () => {
    const existing = GRAMMAR_PROGRAMMATIC_SEQUENCE.filter((entry) => entry.state === 'existing-owner');
    expect(existing.map((entry) => entry.path)).toEqual([
      '/blog/punctuation-and-capital-letters-for-kids',
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/grammar-conjunctions',
      '/blog/grammar-subject-verb',
      '/blog/grammar-tenses',
      '/blog/how-to-teach-paragraph-writing-to-kids',
    ]);
    expect(GRAMMAR_PROGRAMMATIC_PATHS.some((route) => route.includes('conjunction'))).toBe(false);
    expect(GRAMMAR_PROGRAMMATIC_PATHS.some((route) => route.includes('subject-verb'))).toBe(false);
  });

  it('requires substantial differentiated content on every generated grammar concept', () => {
    for (const page of GRAMMAR_PROGRAMMATIC_PAGES) {
      expect(page.quickAnswer.length, page.id).toBeGreaterThan(90);
      expect(page.concept.length, page.id).toBeGreaterThan(120);
      expect(page.examples, page.id).toHaveLength(3);
      expect(page.commonMistakes, page.id).toHaveLength(3);
      expect(page.practicePrompts, page.id).toHaveLength(3);
      expect(page.path.startsWith('/resources/grammar/'), page.id).toBe(true);
      expect(page.hubPath, page.id).toBe('/resources/grammar');
    }
  });

  it('registers every grammar concept for routing, sitemap/prerender and SEO metadata', () => {
    const routes = read('src/app/routes.tsx');
    expect(routes).toContain("{ path: 'resources/grammar/:slug', element: <GrammarKnowledgePage /> }");

    const manifestPaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
    for (const page of GRAMMAR_PROGRAMMATIC_PAGES) {
      expect(manifestPaths.has(page.path), page.path).toBe(true);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);
      expect(GRAMMAR_PROGRAMMATIC_RESOURCE_SEO[page.path]?.title, page.path).toBe(page.seoTitle);
    }
  });

  it('publishes explicit informational canonical ownership without touching the commercial grammar owner', () => {
    const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.id.startsWith('gp1-grammar-'));
    expect(owners).toHaveLength(32);
    for (const owner of owners) {
      expect(owner.subject).toBe('grammar-writing');
      expect(owner.intent).toBe('informational');
      expect(owner.ownerRole).toBe('skill-guide');
      expect(owner.hubPath).toBe('/resources/grammar');
      expect(owner.ownerPath.startsWith('/resources/grammar/')).toBe(true);
    }
    expect(owners.some((owner) => owner.ownerPath === '/grammar')).toBe(false);
  });

  it('uses a single safe renderer and exposes the sequence from the Grammar hub', () => {
    const page = read('src/pages/GrammarKnowledgePage.tsx');
    const hub = read('src/pages/SubjectResourcesPage.tsx');
    expect(page).toContain('getGrammarProgrammaticPageBySlug');
    expect(page).toContain('<NotFoundPage />');
    expect(page).toContain('ts-answer-title');
    expect(page).toContain('ts-answer-summary');
    expect(page).toContain("'@type': 'DefinedTerm'");
    expect(hub).toContain('<GrammarProgrammaticGuideGrid />');
  });

  it('keeps public Resource copy reader-facing and maintains reciprocal Resources links', () => {
    const resources = read('src/pages/ResourcesPage.tsx');
    const answerDirectory = read('src/components/resources/AiAnswerLayerDirectory.tsx');
    const subjectHub = read('src/pages/SubjectResourcesPage.tsx');
    const parents = read('src/pages/parents/ParentsHubPage.tsx');
    const games = read('src/pages/public/FreeEnglishGamesHubPage.tsx');
    const schools = read('src/pages/ForSchoolsPage.tsx');
    const blog = read('src/pages/blog/BlogIndexPage.tsx');

    for (const source of [resources, answerDirectory, subjectHub]) {
      expect(source).not.toContain('search engines and AI retrieval systems');
      expect(source).not.toContain('canonical owner');
      expect(source).not.toContain('intent owner');
    }
    expect(parents).toContain('to="/resources"');
    expect(games).toContain('to="/resources"');
    expect(schools).toContain('to="/resources"');
    expect(blog).toContain('to="/resources"');
  });
});
