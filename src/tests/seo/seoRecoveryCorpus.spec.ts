import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { SEO_RECOVERY_BRICK10_EXPERIMENTS } from '../../config/seoRecoveryBrick10CtrExperiments';
import { EXPECTED_RECOVERY_SOURCE_PATHS, EXPECTED_RECOVERY_BLOG_SLUGS, RECOVERY_CTR_TITLES } from './fixtures/seoRecoveryCorpus';

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}
describe('approved SEO recovery corpus and snippet contract', () => {
  it('locks all 83 sources and canonical slugs, not merely the registry count', () => {
    const root = process.cwd();
    const actualFiles = sourceFiles(path.join(root, 'src/content/blog/posts'))
      .map((file) => path.relative(root, file).split(path.sep).join('/')).sort();
    expect(EXPECTED_RECOVERY_SOURCE_PATHS).toHaveLength(83);
    expect(EXPECTED_RECOVERY_BLOG_SLUGS).toHaveLength(83);
    expect(actualFiles).toEqual([...EXPECTED_RECOVERY_SOURCE_PATHS]);
    expect(blogPosts.map((post) => post.slug).sort()).toEqual([...EXPECTED_RECOVERY_BLOG_SLUGS]);
    expect(new Set(blogPosts.map((post) => post.slug)).size).toBe(83);
  });
  it('keeps the five approved CTR experiments and final public titles aligned', () => {
    expect(Object.fromEntries(SEO_RECOVERY_BRICK10_EXPERIMENTS.map((item) => [item.slug, item.title]))).toEqual(RECOVERY_CTR_TITLES);
    for (const [slug, title] of Object.entries(RECOVERY_CTR_TITLES)) {
      expect(blogPosts.find((post) => post.slug === slug)?.title, slug).toBe(title);
    }
  });
  it('does not reintroduce retired provider-selection links in normalized articles', () => {
    for (const post of blogPosts) {
      const body = post.body.map((block) => block.content).join('\n');
      for (const retired of ['how-to-choose-phonics-classes', 'best-online-phonics-classes-for-kids', 'best-phonics-classes-for-kids']) {
        expect(body, post.slug).not.toContain('](/blog/' + retired + ')');
      }
    }
  });
});
