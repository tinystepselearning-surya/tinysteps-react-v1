import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { buildLeadAttributionDisplay } from '../../lib/leadAttributionDisplay';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('B12 measurement and publishing governance', () => {
  it('keeps the 76-post authority corpus unchanged', () => {
    expect(blogPosts).toHaveLength(76);
  });

  it('turns B11 sourceDetail plus acquisition fields into a useful admin summary', () => {
    expect(
      buildLeadAttributionDisplay({
        source: 'website',
        sourceDetail: 'blog|child-gives-one-word-answers|speaking-confidence|article_end',
        acquisitionChannel: 'google_organic',
        acquisitionSource: 'google.co.in',
        landingPage: '/blog/child-gives-one-word-answers',
        conversionPage: '/book-demo',
      }),
    ).toEqual({
      acquisitionLabel: 'Google Organic',
      contentInfluenceLabel: 'Blog · Child Gives One Word Answers',
      detailLabel:
        'First touch /blog/child-gives-one-word-answers · Converted /book-demo · CTA Article End',
      blogArticleSlug: 'child-gives-one-word-answers',
      blogFamily: 'speaking-confidence',
      ctaPosition: 'article_end',
    });
  });

  it('still surfaces a first-touch blog when a legacy lead has no B11 sourceDetail', () => {
    const display = buildLeadAttributionDisplay({
      source: 'website',
      acquisitionChannel: 'direct',
      landingPage: '/blog/satpin-phonics-guide',
      conversionPage: '/book-demo',
    });

    expect(display.acquisitionLabel).toBe('Direct / unknown');
    expect(display.contentInfluenceLabel).toBe('First touch blog · Satpin Phonics Guide');
    expect(display.blogArticleSlug).toBe('satpin-phonics-guide');
  });

  it('surfaces attribution in the existing Leads & Enquiries read path without adding analytics reads', () => {
    const workspace = readRepoFile('src/pages/admin/LeadsInquiriesWorkspaceV2.tsx');
    const paged = readRepoFile('src/pages/admin/leadsPaged.ts');

    expect(workspace).toContain('buildLeadAttributionDisplay');
    expect(workspace).toContain('sourceDetail?: string | null');
    expect(workspace).toContain('acquisitionChannel?: string | null');
    expect(workspace).toContain('contentInfluenceLabel');
    expect(workspace).toContain('attributionDetail');
    expect(workspace).toContain('Search parent, child, phone, course, teacher or attribution');
    expect(paged).not.toContain("collection(db, 'analytics')");
    expect(paged).not.toContain("collection(db, 'blogAnalytics')");
  });

  it('keeps the real B11 conversion funnel vocabulary intact', () => {
    const tracking = readRepoFile('src/lib/blogConversionTracking.ts');

    for (const eventName of [
      'blog_article_view',
      'blog_cta_impression',
      'blog_cta_click',
      'blog_program_click',
      'blog_demo_start',
      'blog_demo_submit',
    ]) {
      expect(tracking).toContain(`'${eventName}'`);
    }
  });

  it('documents evidence gates instead of authorizing scaled publishing', () => {
    const governance = readRepoFile('docs/seo/blog-bricks/B12_MEASUREMENT_GOVERNANCE.md');
    const template = readRepoFile('docs/seo/blog-bricks/B12_GSC_REVIEW_TEMPLATE.md');

    expect(governance).toContain('New blog URLs in B12: **0**');
    expect(governance).toContain('NEW PAGE GATE');
    expect(governance).toContain('No change is a valid SEO decision');
    expect(governance).toContain('third-party crawler error');
    expect(template).toContain('Location-page gate');
    expect(template).toContain('Do not publish a city/country page by swapping place names');
    expect(template).toContain('blog_demo_submit');
  });
});
