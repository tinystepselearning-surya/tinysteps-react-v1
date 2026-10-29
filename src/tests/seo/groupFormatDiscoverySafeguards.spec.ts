import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

const groupLinks = [
  { source: 'src/pages/phonics.tsx', route: '/group-phonics-classes-for-kids' },
  { source: 'src/pages/grammar.tsx', route: '/group-grammar-classes-for-kids' },
  { source: 'src/pages/speaking.tsx', route: '/group-public-speaking-classes-for-kids' },
] as const;

describe('SEO-safe discovery release: preserve existing canonical owners', () => {
  const seo = read('src/lib/routeSeoRegistry.js');
  const manifest = read('src/lib/publicRouteManifest.js');
  const pages: Record<string, string> = {
    '/phonics': 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    '/grammar': 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
    '/speaking': 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps',
    '/courses': 'English Courses for Kids: Phonics, Grammar and Public Speaking | Tiny Steps Learning',
    '/group-phonics-classes-for-kids': 'Online Group Phonics Classes for Kids | Tiny Steps',
    '/group-grammar-classes-for-kids': 'Online Group Grammar Classes for Kids | Tiny Steps',
    '/group-public-speaking-classes-for-kids': 'Online Group Public Speaking Classes for Kids | Tiny Steps',
  };

  it('keeps original titles, self-canonicals and sitemap route registration', () => {
    for (const [route, title] of Object.entries(pages)) {
      const owner = seo.split(`'${route}': {`)[1]?.split('\n  },')[0] || '';
      expect(owner, route).toContain(`title: '${title}'`);
      expect(owner, route).toContain(`canonicalPath: '${route}'`);
      expect(manifest, route).toContain(`route('${route}', 'static')`);
    }
  });

  it('adds exactly one matching group link from each established programme owner', () => {
    for (const { source, route } of groupLinks) {
      const code = read(source);
      expect(code, source).toContain(`<Link to="${route}"`);
      expect(code.match(new RegExp(route, 'g'))?.length, source).toBe(1);
      expect(code, source).toContain('to="/book-demo"');
      expect(code, source).not.toContain('rel="nofollow"');
    }
  });

  it('provides parent-usable links from the existing standard group pricing section', () => {
    const pricing = read('src/pages/PricingPage.tsx');
    for (const { route } of groupLinks) expect(pricing).toContain(`<Link to="${route}"`);
    expect(pricing).toContain('const standardGroups = [NEW_GROUP_CLASS_PLAN]');
    expect(pricing).toContain('Group Classes: Fees and Duration');
    expect(pricing).toContain('to="/book-demo"');
  });

  it('adds group discovery without promoting them over one-to-one programme owners in LLM directories', () => {
    for (const name of ['public/llms.txt', 'public/llms-full.txt']) {
      const text = read(name);
      for (const { route } of groupLinks) {
        expect(text.split(`https://tinystepslearning.com${route}`).length - 1, name).toBe(1);
      }
      expect(text).toContain('https://tinystepslearning.com/phonics');
      expect(text).toContain('https://tinystepslearning.com/grammar');
      expect(text).toContain('https://tinystepslearning.com/speaking');
    }
  });

  it('only links to existing teaching evidence, never represents 1:1 footage as a group recording', () => {
    const content = read('src/pages/public/GroupClassPage.tsx');
    expect(content).toContain('to="/class-samples"');
    expect(content).toContain('to="/team"');
    expect(content).toContain('not an available group session');
    expect(content).toContain('not guarantee an immediate batch');
    expect(content).toContain('GROUP_PLAN.monthlyFee / GROUP_PLAN.classes');
    expect(read('src/config/pricing.ts')).toContain('monthlyFee: 3000');
  });
});
