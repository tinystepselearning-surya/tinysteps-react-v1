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

  it('covers generic phonics-provider intent without retaking comparison ownership', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const page = read('src/pages/phonics.tsx');

    const requiredTerms = [
      'online phonics classes',
      'online phonics classes for kids',
      'phonics classes for kids',
      'phonics classes in India',
      'live 1:1 phonics classes',
      'structured phonics classes for kids',
      'phonics classes for struggling readers',
    ];

    for (const term of requiredTerms) {
      expect(`${registry}\n${page}`, term).toContain(term);
    }

    expect(page).not.toContain("'best online phonics classes'");
    expect(page).not.toContain("'phonics classes fees'");
  });

  it('offers programme-fit guidance and delegates provider comparison to its canonical owner', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('How to evaluate an online phonics class for your child');
    expect(page).toContain('Start from the child’s current level');
    expect(page).toContain('Follow a cumulative sequence');
    expect(page).toContain('Correct errors while they happen');
    expect(page).toContain('Check transfer into real reading');
    expect(page).toContain('Want a deeper provider comparison?');
    expect(page).toContain('This programme page stays focused on how Tiny Steps phonics works.');

    expect(page).not.toContain("Tiny Steps is India's #1");
    expect(page).not.toContain('Tiny Steps is the best phonics');
  });

  it('keeps commercial proof routes visible from the decision section', () => {
    const page = read('src/pages/phonics.tsx');

    for (const href of [
      '/curriculum?tab=phonics',
      '/class-samples',
      '/phonics-fees-india',
      '/best-online-phonics-classes-for-kids-in-india',
    ]) {
      expect(page, href).toContain(href);
    }
  });

  it('exposes AEO FAQ answers and machine-readable GEO criteria from the same visible concepts', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('How should parents choose an online phonics class for their child?');
    expect(page).toContain('When is live 1:1 phonics support useful?');
    expect(page).toContain("'@type': 'ItemList'");
    expect(page).toContain('#phonics-class-quality-criteria');
    expect(page).toContain("name: 'How parents can evaluate online phonics classes'");
    expect(page).toContain('itemListElement: classFitCriteria.map');
  });

  it('uses the strengthened search snippet without changing the canonical URL', () => {
    const registry = read('src/lib/routeSeoRegistry.js');

    expect(registry).toContain("title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(registry).toContain('assessment-first placement');
    expect(registry).toContain("canonicalPath: '/phonics'");
  });
});
