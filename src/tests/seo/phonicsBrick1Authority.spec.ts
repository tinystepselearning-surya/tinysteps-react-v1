import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Phonics Brick 1 high-intent authority guardrails', () => {
  it('keeps /phonics as the canonical program owner while the buyer guide remains distinct', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const routes = read('src/app/routes.tsx');

    expect(registry).toContain("'/phonics': {");
    expect(registry).toContain("canonicalPath: '/phonics'");
    expect(registry).toContain("'/best-online-phonics-classes-for-kids-in-india': {");
    expect(registry).toContain("canonicalPath: '/best-online-phonics-classes-for-kids-in-india'");

    expect(routes).toContain("{ path: 'phonics', element: <PhonicsPage /> }");
    expect(routes).toContain("{ path: 'best-online-phonics-classes-for-kids-in-india', element: <BestOnlinePhonicsClassesIndiaPage /> }");
  });

  it('covers the primary and high-value phonics search-intent family', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const page = read('src/pages/phonics.tsx');

    const requiredTerms = [
      'online phonics classes',
      'online phonics classes for kids',
      'online phonics classes for kids in India',
      'phonics classes for kids',
      'phonics classes in India',
      'best online phonics classes',
      'best online phonics classes in India',
      'best phonics classes for kids',
      'best phonics course for kids',
      'live 1:1 phonics classes',
      'structured phonics classes for kids',
      'phonics classes for struggling readers',
    ];

    for (const term of requiredTerms) {
      expect(`${registry}\n${page}`, term).toContain(term);
    }
  });

  it('answers best-class intent with a defensible comparison framework rather than an unsupported ranking claim', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('What should parents look for in the best online phonics classes?');
    expect(page).toContain('Assessment-first placement');
    expect(page).toContain('Explicit, systematic progression');
    expect(page).toContain('Blending and segmenting');
    expect(page).toContain('Decoding instead of guessing');
    expect(page).toContain('Live observation and correction');
    expect(page).toContain('Reading and spelling transfer');
    expect(page).toContain('Pacing matched to readiness');
    expect(page).toContain('Parent-visible progress');

    expect(page).not.toContain("Tiny Steps is India's #1");
    expect(page).not.toContain('Tiny Steps is the best phonics');
    expect(page).toContain('rather than depending on a broad “best” claim');
  });

  it('keeps commercial proof routes visible from the decision section', () => {
    const page = read('src/pages/phonics.tsx');

    for (const href of [
      '/curriculum?tab=phonics',
      '/class-samples',
      '/testimonials',
      '/pricing',
      '/best-online-phonics-classes-for-kids-in-india',
    ]) {
      expect(page, href).toContain(href);
    }
  });

  it('exposes AEO FAQ answers and machine-readable GEO criteria from the same visible concepts', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('What should parents look for in the best online phonics classes?');
    expect(page).toContain('Are 1:1 phonics classes better than group phonics classes?');
    expect(page).toContain("'@type': 'ItemList'");
    expect(page).toContain('#phonics-class-quality-criteria');
    expect(page).toContain("name: 'What parents should look for in online phonics classes'");
    expect(page).toContain('itemListElement: bestClassCriteria.map');
  });

  it('uses the strengthened search snippet without changing the canonical URL', () => {
    const registry = read('src/lib/routeSeoRegistry.js');

    expect(registry).toContain("title: 'Online Phonics Classes for Kids in India | Live 1:1 | Tiny Steps'");
    expect(registry).toContain('what to look for when comparing the best phonics classes');
    expect(registry).toContain("canonicalPath: '/phonics'");
  });
});
