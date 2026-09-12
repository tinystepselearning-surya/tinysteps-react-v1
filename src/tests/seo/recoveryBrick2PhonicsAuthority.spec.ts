import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('SEO Recovery Brick 2 — /phonics commercial authority', () => {
  it('locks /phonics as the generic online-phonics programme owner', () => {
    const ownership = read('src/lib/commercialC2KeywordOwnership.ts');
    const registry = read('src/lib/routeSeoRegistry.js');
    const routes = read('src/app/routes.tsx');

    expect(ownership).toContain("id: 'phonics-provider'");
    expect(ownership).toContain("canonicalOwnerPath: '/phonics'");
    expect(ownership).toContain("primaryQuery: 'online phonics classes for kids'");

    expect(registry).toContain("'/phonics': {");
    expect(registry).toContain("title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(registry).toContain("canonicalPath: '/phonics'");
    expect(routes).toContain("{ path: 'phonics', element: <PhonicsPage /> }");
  });

  it('keeps the visible page aligned to programme intent and assessment-first placement', () => {
    const page = read('src/pages/phonics.tsx');

    for (const signal of [
      'Online Phonics Classes for Kids',
      'Live 1:1 online phonics classes',
      'Ages 3–12',
      'assessment-first placement',
      '35 minutes per live 1:1 class',
      'structured synthetic phonics',
      'blending',
      'decoding',
      'spelling',
      'reading fluency',
      'Parent progress updates',
    ]) {
      expect(page, signal).toContain(signal);
    }
  });

  it('delegates comparison and price research to their dedicated authority URLs', () => {
    const page = read('src/pages/phonics.tsx');
    const ownership = read('src/lib/commercialC2KeywordOwnership.ts');

    expect(page).toContain('/best-online-phonics-classes-for-kids-in-india');
    expect(page).toContain('/phonics-fees-india');
    expect(page).toContain('This programme page stays focused on how Tiny Steps phonics works.');

    expect(ownership).toContain("id: 'phonics-comparison'");
    expect(ownership).toContain("canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india'");
    expect(ownership).toContain("id: 'phonics-price'");
    expect(ownership).toContain("canonicalOwnerPath: '/phonics-fees-india'");
  });

  it('keeps useful informational and free-practice pathways subordinate to /phonics', () => {
    const page = read('src/pages/phonics.tsx');

    for (const href of [
      '/blog/satpin-phonics-guide',
      '/child-not-reading-properly',
      '/blog/how-kids-learn-blending',
      '/blog/phonics-blending-activities',
      '/free-letter-tracing-game-for-kids',
      '/letter-tracing-with-sounds-game',
      '/reading-classes-for-kids',
    ]) {
      expect(page, href).toContain(href);
    }
  });

  it('preserves machine-readable course, pathway, quality and FAQ signals', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('createCourseSchema');
    expect(page).toContain("'@type': 'ItemList'");
    expect(page).toContain('#phonics-pathway');
    expect(page).toContain('#phonics-class-quality-criteria');
    expect(page).toContain('createFAQPageSchema(schemaFaqItems)');
    expect(page).toContain("areaServed: ['India', 'Worldwide']");
  });

  it('keeps historical generic phonics aliases consolidated into /phonics', () => {
    const firebase = read('firebase.json');

    expect(firebase).toContain('{ "source": "/phonics-classes-for-kids", "destination": "/phonics", "type": 301 }');
    expect(firebase).toContain('{ "source": "/online-phonics-reading-classes", "destination": "/phonics", "type": 301 }');
  });
});
