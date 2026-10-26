import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (name: string) => fs.readFileSync(path.join(process.cwd(), name), 'utf8');

const pages = [
  'src/pages/phonics.tsx',
  'src/pages/grammar.tsx',
  'src/pages/speaking.tsx',
  'src/pages/public/GroupClassPage.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/CoursesPage.tsx',
  'src/pages/CurriculumPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/blog/BlogIndexPage.tsx',
  'src/pages/BlogPostPage.tsx',
  'src/components/marketing/LeadPageSections.tsx',
];

describe('Tiny Steps public sunrise-ocean design system', () => {
  const stylesheet = source('src/index.css');
  const routes = source('src/app/routes.tsx');

  it('defines readable reusable tokens and only enables them in the public shell', () => {
    for (const swatch of ['#17284C', '#212B5C', '#6E95D2', '#755E96', '#CC8994', '#F6CF7E', '#E7F3FF', '#F1EDFC', '#FFE5EB']) {
      expect(stylesheet).toContain(swatch);
    }
    expect(stylesheet).toContain('--ts-sunrise-hero');
    expect(stylesheet).toContain('[data-ts-surface="public"]');
    expect(routes).toContain("data-ts-surface={!hideMarketingChrome && !isContactPage ? 'public' : undefined}");
    expect(routes).toContain("isProtectedAppRoute(normalizedPath)");
  });

  it('uses the common palette throughout high-traffic public pages and blog templates', () => {
    pages.forEach((page) => {
      const code = source(page);
      expect(code, page).toMatch(/#(?:E7F3FF|F4F8FF|F1EDFC|D9EEFF|EAF6FF|CC8994)|ts-sunrise-/);
    });
    expect(source('src/pages/blog/BlogIndexPage.tsx')).toContain('from-[#F1EDFC] to-[#FDECF0]');
    expect(source('src/pages/BlogPostPage.tsx')).toContain('#F1EDFC');
    expect(source('src/components/blog/ResearchArticleHero.tsx')).toContain('#212B5C');
    expect(source('src/components/marketing/LeadPageSections.tsx')).toContain('bg-gradient-to-b from-[#E7F3FF]');
  });

  it('preserves primary programme names, CTA links, blog SEO and conversion mechanics', () => {
    for (const programme of ['phonics', 'grammar', 'speaking']) {
      expect(source(`src/pages/${programme}.tsx`)).toContain('to="/book-demo"');
      expect(routes).toContain(`path: '${programme}', element:`);
    }
    expect(source('src/pages/blog/BlogIndexPage.tsx')).toContain('jsonLd={[breadcrumbSchema, blogSchema, collectionSchema, faqSchema]}');
    expect(source('src/pages/BlogPostPage.tsx')).toContain('buildBlogDemoPath');
    expect(source('src/pages/public/GroupClassPage.tsx')).toContain('createFAQPageSchema(questions)');
    expect(source('src/pages/public/GroupClassPage.tsx')).toContain('maximum of four children per teacher');
  });

  it('documents colour contrast restrictions and future rollout boundaries', () => {
    const designSpec = source('docs/design/sunrise-ocean-palette.md');
    expect(designSpec).toContain('Blush on white: 2.77:1');
    expect(designSpec).toContain('ocean on white: 3.05:1');
    expect(designSpec).toContain('authenticated learning');
    expect(designSpec).toContain('canonical URLs');
  });
});
