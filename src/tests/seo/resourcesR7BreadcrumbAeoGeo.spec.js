import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RESOURCE_SUBJECT_PRESENTATION,
  buildBreadcrumbListSchema,
  buildSpeakableSpecification,
  getAeoGeoPresentation,
  getBreadcrumbTrail,
} from '../../lib/breadcrumbAeoGeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';

const repoRoot = process.cwd();
const resourcesSource = fs.readFileSync(path.join(repoRoot, 'src/pages/ResourcesPage.tsx'), 'utf8');
const subjectSource = fs.readFileSync(path.join(repoRoot, 'src/pages/SubjectResourcesPage.tsx'), 'utf8');
const blogSource = fs.readFileSync(path.join(repoRoot, 'src/pages/BlogPostPage.tsx'), 'utf8');
const breadcrumbSource = fs.readFileSync(path.join(repoRoot, 'src/components/common/KnowledgeBreadcrumbs.tsx'), 'utf8');

describe('Resources architecture R7 breadcrumb + AEO/GEO layer', () => {
  it('builds the Resources hierarchy from one shared registry', () => {
    expect(getBreadcrumbTrail({ pathname: '/resources' }).map((item) => item.path)).toEqual(['/', '/resources']);
    expect(getBreadcrumbTrail({ pathname: '/resources/phonics' }).map((item) => item.path)).toEqual(['/', '/resources', '/resources/phonics']);
    expect(getBreadcrumbTrail({ pathname: '/resources/grammar' }).map((item) => item.path)).toEqual(['/', '/resources', '/resources/grammar']);
    expect(getBreadcrumbTrail({ pathname: '/resources/speaking' }).map((item) => item.path)).toEqual(['/', '/resources', '/resources/speaking']);
  });

  it('routes canonical blog topic owners through the correct subject hub', () => {
    const cases = [
      ['/blog/how-kids-learn-blending', 'How Kids Learn Blending', '/resources/phonics'],
      ['/blog/grammar-nouns-to-paragraphs', 'Grammar: Nouns to Paragraphs', '/resources/grammar'],
      ['/blog/child-gives-one-word-answers', 'Child Gives One-Word Answers', '/resources/speaking'],
    ];

    for (const [pathname, title, hubPath] of cases) {
      const trail = getBreadcrumbTrail({ pathname, title });
      expect(trail.map((item) => item.path)).toContain(hubPath);
      expect(trail.at(-1)).toEqual({ name: title, path: pathname });
    }
  });

  it('falls back to Resources > All Guides for blog articles without a subject-owner signal', () => {
    expect(getBreadcrumbTrail({
      pathname: '/blog/example-parent-guide',
      title: 'Example Parent Guide',
      category: 'Parent Tips',
    }).map((item) => item.path)).toEqual(['/', '/resources', '/blog', '/blog/example-parent-guide']);
  });

  it('builds sequential BreadcrumbList JSON-LD from the exact visible trail', () => {
    const trail = getBreadcrumbTrail({ pathname: '/resources/phonics' });
    const schema = buildBreadcrumbListSchema(trail, 'https://tinystepslearning.com');
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema['@id']).toBe('https://tinystepslearning.com/resources/phonics#breadcrumb');
    expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(schema.itemListElement.map((item) => item.name)).toEqual(trail.map((item) => item.name));
  });

  it('derives answer-engine subject context from Brick 5 ownership rather than copied URLs', () => {
    const presentation = getAeoGeoPresentation({ pathname: '/blog/how-kids-learn-blending' });
    expect(presentation.subject).toBe('phonics-reading');
    expect(presentation.subjectHubPath).toBe('/resources/phonics');
    expect(presentation.aboutName).toBe(RESOURCE_SUBJECT_PRESENTATION['phonics-reading'].aboutName);
  });

  it('keeps speakable metadata tied only to visible answer selectors', () => {
    expect(buildSpeakableSpecification()).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.ts-answer-title', '.ts-answer-summary'],
    });
  });

  it('uses the shared contract for visible breadcrumbs and schema on all R7 page families', () => {
    for (const source of [resourcesSource, subjectSource, blogSource]) {
      expect(source).toContain('getBreadcrumbTrail');
      expect(source).toContain('buildBreadcrumbListSchema');
      expect(source).toContain('KnowledgeBreadcrumbs');
    }
    expect(breadcrumbSource).toContain('data-knowledge-breadcrumb="true"');
    expect(breadcrumbSource).toContain('aria-current="page"');
  });

  it('adds an explicit WebPage↔BlogPosting graph while preserving visible-only FAQ schema', () => {
    expect(blogSource).toContain("'@type': 'WebPage'");
    expect(blogSource).toContain("mainEntity: { '@id': getBlogArticleId(articleSlug) }");
    expect(blogSource).toContain("breadcrumb: { '@id': breadcrumbSchema['@id'] }");
    expect(blogSource).toContain('abstract: quickAnswer || undefined');
    expect(blogSource).toContain('if (!post?.faq?.length) return null;');
    expect(resourcesSource).not.toContain("'@type': 'FAQPage'");
    expect(subjectSource).not.toContain("'@type': 'FAQPage'");
  });

  it('keeps every registered subject-specific blog owner inside its canonical Resources subject hierarchy', () => {
    for (const entry of CANONICAL_TOPIC_OWNERSHIP.filter((item) => item.ownerPath.startsWith('/blog/') && RESOURCE_SUBJECT_PRESENTATION[item.subject])) {
      const trail = getBreadcrumbTrail({ pathname: entry.ownerPath, title: entry.queryIntent });
      expect(trail.map((item) => item.path)).toContain(RESOURCE_SUBJECT_PRESENTATION[entry.subject].path);
      expect(new Set(trail.map((item) => item.path)).size).toBe(trail.length);
    }
  });
});
