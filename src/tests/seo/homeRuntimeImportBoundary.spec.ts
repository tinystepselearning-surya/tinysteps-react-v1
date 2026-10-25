import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOMEPAGE_SEO_META } from '../../lib/homeSeoMeta.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('homepage first-load SEO bundle boundary', () => {
  it('shares the exact approved homepage metadata with the prerender registry', () => {
    expect(HOMEPAGE_SEO_META).toEqual(ROUTE_SEO_REGISTRY['/']);
    expect(HOMEPAGE_SEO_META.canonicalPath).toBe('/');
  });

  it('keeps the large route registry off the homepage SEO import path', () => {
    const page = read('src/pages/HomePage.tsx');
    const meta = read('src/components/common/Meta.tsx');
    const runtime = read('src/lib/seoRuntime.ts');
    const compat = read('src/lib/seo.ts');

    expect(page).toContain("from '../lib/homeSeoMeta.js'");
    expect(page).not.toContain("from '../lib/routeSeoRegistry.js'");
    expect(meta).toContain("from '../../lib/seoRuntime'");
    expect(meta).not.toContain("from '../../lib/seo'");
    expect(runtime).not.toContain("from './routeSeoRegistry.js'");
    expect(runtime).toContain('export function applySeo(');
    expect(compat).toContain("export { applySeo } from './seoRuntime'");
    expect(compat).toContain("from './routeSeoRegistry.js'");
  });
});
