import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BLOG_TECHNICAL_AUTHORITY } from '../../content/blog/shared/technicalAuthority';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { SITE_ORIGIN } from '../../lib/schemas';
import {
  SPEAKING_AI_AGENT_POLICY,
  SPEAKING_AI_ANSWER_OWNERS,
  SPEAKING_AI_DISCOVERY_SURFACES,
  SPEAKING_AI_ENTITY_DISAMBIGUATION_KEYS,
  SPEAKING_AI_EVIDENCE_SOURCE_PATHS,
  SPEAKING_AI_EXPANSION_POLICY,
  SPEAKING_AI_INTENT_BOUNDARIES,
  SPEAKING_AI_KNOWLEDGE_PATHS,
  SPEAKING_AI_VISIBILITY_REVISION,
} from '../../lib/speakingAiVisibility';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const llms = read('public/llms.txt');
const llmsFull = read('public/llms-full.txt');
const robots = read('public/robots.txt');
const speakingSource = read('src/pages/speaking.tsx');
const progressSource = read('src/pages/public/SpeakingProgressFrameworkPage.tsx');
const subjectResourcesSource = read('src/pages/SubjectResourcesPage.tsx');
const routesSource = read('src/app/routes.tsx');
const routeManifestSource = read('src/lib/publicRouteManifest.js');
const brick9TestSource = read('src/tests/seo/speakingGrowthBrick9.spec.ts');
const routeSeoRegistrySource = read('src/lib/routeSeoRegistry.js');
const publicCoursePagesSource = read('src/lib/publicCoursePages.js');
const courseDetailSource = read('src/pages/CourseDetailPage.tsx');
const sitemapStatic = read('public/sitemap-static.xml');
const sitemapCourses = read('public/sitemap-courses.xml');
const sitemapBlog = read('public/sitemap-blog.xml');

describe('Speaking growth Brick 12 GEO/AEO/AI visibility layer', () => {
  it('defines one bounded AI visibility contract without creating AI-specific owners', () => {
    expect(SPEAKING_AI_VISIBILITY_REVISION).toBe('2026-09-19-b12-v2');
    expect(SPEAKING_AI_ANSWER_OWNERS).toHaveLength(13);
    expect(new Set(SPEAKING_AI_ANSWER_OWNERS.map((item) => item.id)).size).toBe(13);
    expect(new Set(SPEAKING_AI_ANSWER_OWNERS.map((item) => item.path)).size).toBe(13);
    expect(SPEAKING_AI_EXPANSION_POLICY).toEqual({
      newAiPromptPagesAllowed: false,
      newAiOnlyCommercialPagesAllowed: false,
      duplicateSpeakingOwnerAllowed: false,
      faqRichResultExpectation: false,
      syntheticVideoEvidenceAllowed: false,
      fabricatedExternalAuthorityAllowed: false,
    });
  });

  it('keeps the canonical commercial, course, progress and decision owners explicit', () => {
    const byId = new Map(SPEAKING_AI_ANSWER_OWNERS.map((item) => [item.id, item]));
    expect(byId.get('public-speaking-programme')?.path).toBe('/speaking');
    expect(byId.get('spoken-english-programme')?.path).toBe('/spoken-english-classes-for-kids-online');
    expect(byId.get('confidence-programme')?.path).toBe('/confidence-building-program-kids');
    expect(byId.get('public-speaking-foundations')?.path).toBe('/courses/public-speaking-foundations');
    expect(byId.get('public-speaking-excellence')?.path).toBe('/courses/public-speaking-excellence');
    expect(byId.get('speaking-progress-method')?.path).toBe('/speaking-progress-framework');
    expect(byId.get('speaking-resource-discovery')?.path).toBe('/resources/speaking');
    expect(byId.get('free-assessment')?.path).toBe('/book-demo');
    expect(byId.get('pricing')?.path).toBe('/pricing');
  });

  it('requires every primary answer owner to remain canonical, indexable and sitemap-discoverable', () => {
    const coursePaths = new Set([
      '/courses/public-speaking-foundations',
      '/courses/public-speaking-excellence',
    ]);

    for (const owner of SPEAKING_AI_ANSWER_OWNERS) {
      const absolute = SITE_ORIGIN + owner.path;

      if (coursePaths.has(owner.path)) {
        expect(publicCoursePagesSource).toContain(`routePath: '${owner.path}'`);
        expect(courseDetailSource).toContain(
          'coursePageConfig?.routePath ?? getPublicCoursePathForSlug(rawSlug)',
        );
        expect(sitemapCourses).toContain('<loc>' + absolute + '</loc>');
        continue;
      }

      const marker = "'" + owner.path + "':";
      const start = routeSeoRegistrySource.indexOf(marker);
      expect(start).toBeGreaterThanOrEqual(0);
      const routeBlock = routeSeoRegistrySource.slice(start, start + 1000);
      expect(routeBlock).toContain("canonicalPath: '" + owner.path + "'");
      expect(routeBlock).not.toMatch(/robots:\s*'[^']*noindex/i);
      expect(sitemapStatic).toContain('<loc>' + absolute + '</loc>');
    }
  });

  it('exports the complete knowledge, evidence and entity-disambiguation layers', () => {
    expect(SPEAKING_AI_KNOWLEDGE_PATHS).toHaveLength(14);
    expect(new Set(SPEAKING_AI_KNOWLEDGE_PATHS).size).toBe(14);
    expect(SPEAKING_AI_EVIDENCE_SOURCE_PATHS).toHaveLength(6);
    expect(new Set(SPEAKING_AI_EVIDENCE_SOURCE_PATHS).size).toBe(6);
    expect(SPEAKING_AI_ENTITY_DISAMBIGUATION_KEYS).toEqual(
      expect.arrayContaining([
        'https://tinystepslearning.com',
        'Vannala Ravali Priya',
        '/team/vannala-ravali-priya',
        'Hyderabad, Telangana, India',
        'live online classes',
        'Speaking & Communication',
      ]),
    );
  });

  it('publishes every primary answer owner in both LLM directories', () => {
    for (const owner of SPEAKING_AI_ANSWER_OWNERS) {
      const absolute = SITE_ORIGIN + owner.path;
      expect(llms).toContain(absolute);
      expect(llmsFull).toContain(absolute);
    }
  });

  it('publishes all fourteen Speaking knowledge owners in both LLM directories', () => {
    for (const knowledgePath of SPEAKING_AI_KNOWLEDGE_PATHS) {
      const absolute = SITE_ORIGIN + knowledgePath;
      expect(llms).toContain(absolute);
      expect(llmsFull).toContain(absolute);
    }
  });

  it('requires all fourteen Speaking knowledge owners to remain indexable and sitemap-eligible', () => {
    for (const knowledgePath of SPEAKING_AI_KNOWLEDGE_PATHS) {
      const slug = knowledgePath.replace(/^\/blog\//, '');
      expect(shouldNoindexBlogSlug(slug)).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug)).toBe(true);
      expect(sitemapBlog).toContain(
        '<loc>' + SITE_ORIGIN + knowledgePath + '</loc>',
      );
    }
  });

  it('upgrades the BlogPosting authority graph to all fourteen Speaking knowledge URLs', () => {
    const speakingSlugs = SPEAKING_AI_KNOWLEDGE_PATHS.map((item) =>
      item.replace(/^\/blog\//, ''),
    );

    for (const slug of speakingSlugs) {
      const authority = BLOG_TECHNICAL_AUTHORITY[
        slug as keyof typeof BLOG_TECHNICAL_AUTHORITY
      ];
      expect(authority).toBeTruthy();
      expect(authority.cluster).toBe('Speaking & Communication');
      expect(authority.topics.length).toBeGreaterThan(2);
    }
  });

  it('keeps the important Speaking intent boundaries explicit for answer systems', () => {
    expect(SPEAKING_AI_INTENT_BOUNDARIES).toHaveLength(7);
    expect(llms).toContain('Public Speaking is not the same as Spoken English.');
    expect(llms).toContain('Do not collapse "understands English but does not speak" with "gives one-word answers."');
    expect(llms).toContain('Do not treat every speaking difficulty as confidence.');
    expect(llms).toContain('not a clinical, diagnostic, developmental-age, IQ-style or standardised language assessment');
    expect(llmsFull).toContain('Do not replace /speaking with a blog article');
    expect(llmsFull).toContain('Do not treat a class sample, testimonial or progress observation as a guaranteed outcome.');
  });

  it('keeps crawler, training-crawler and product-control roles explicit while preserving private routes', () => {
    expect(SPEAKING_AI_AGENT_POLICY.searchDiscoveryCrawler).toBe('OAI-SearchBot');
    expect(SPEAKING_AI_AGENT_POLICY.openAiPotentialTrainingCrawler).toBe('GPTBot');
    expect(SPEAKING_AI_AGENT_POLICY.googleGeminiControlToken).toBe('Google-Extended');
    expect(SPEAKING_AI_AGENT_POLICY.appleFoundationModelControlToken).toBe('Applebot-Extended');
    expect(new Set(SPEAKING_AI_AGENT_POLICY.configuredPublicAgents).size).toBe(
      SPEAKING_AI_AGENT_POLICY.configuredPublicAgents.length,
    );

    const privatePaths = ['/admin/', '/teacher/', '/parent/', '/kids/', '/private/'];

    for (const agent of SPEAKING_AI_AGENT_POLICY.configuredPublicAgents) {
      const marker = 'User-agent: ' + agent;
      const start = robots.indexOf(marker);
      expect(start).toBeGreaterThanOrEqual(0);
      const groupEnd = robots.indexOf('\n\n', start);
      const group = robots.slice(start, groupEnd >= 0 ? groupEnd : robots.length);
      expect(group).toContain('Allow: /');
      for (const privatePath of privatePaths) {
        expect(group).toContain('Disallow: ' + privatePath);
      }
    }
  });

  it('keeps the declared discovery surfaces present without adding an AI landing page', () => {
    for (const publicPath of SPEAKING_AI_DISCOVERY_SURFACES) {
      expect(fs.existsSync(path.join(root, 'public', publicPath.slice(1)))).toBe(true);
    }

    for (const forbidden of [
      'speaking-ai',
      'speaking-chatgpt',
      'speaking-gemini',
      'speaking-perplexity',
      'ai-public-speaking',
    ]) {
      expect(routesSource).not.toContain(forbidden);
      expect(routeManifestSource).not.toContain(forbidden);
    }
  });

  it('makes the canonical Speaking Quick Answer speakable', () => {
    expect(speakingSource).toContain('buildSpeakableSpecification');
    expect(speakingSource).toContain('.ts-speaking-answer-title');
    expect(speakingSource).toContain('.ts-speaking-answer-summary');
    expect(speakingSource).toContain('className="ts-speaking-answer-title');
    expect(speakingSource).toContain('className="ts-speaking-answer-summary');
  });

  it('makes the Speaking Progress Framework Quick Answer speakable', () => {
    expect(progressSource).toContain('buildSpeakableSpecification');
    expect(progressSource).toContain('.ts-speaking-progress-answer-title');
    expect(progressSource).toContain('.ts-speaking-progress-answer-summary');
    expect(progressSource).toContain('className="ts-speaking-progress-answer-title');
    expect(progressSource).toContain('className="ts-speaking-progress-answer-summary');
  });

  it('preserves the existing Speaking resource-hub AEO implementation', () => {
    expect(subjectResourcesSource).toContain('buildSpeakableSpecification');
    expect(subjectResourcesSource).toContain('.ts-answer-title');
    expect(subjectResourcesSource).toContain('.ts-answer-summary');
    expect(subjectResourcesSource).toContain('SPEAKING_KNOWLEDGE_CLUSTER_GROUPS');
    expect(subjectResourcesSource).toContain('data-speaking-knowledge-cluster');
  });

  it('restores and protects Brick 9 canonical evidence-source URLs', () => {
    const evidenceStart = speakingSource.indexOf("name: 'Tiny Steps Speaking evidence sources'");
    expect(evidenceStart).toBeGreaterThanOrEqual(0);
    const evidenceBlock = speakingSource.slice(evidenceStart, evidenceStart + 1000);
    expect(evidenceBlock).toContain('item.sourcePath');
    expect(evidenceBlock).not.toContain('item.path');
    expect(brick9TestSource).toContain('item.sourcePath');
  });

  it('keeps AI visibility grounded instead of promising rich-result treatment', () => {
    expect(SPEAKING_AI_EXPANSION_POLICY.faqRichResultExpectation).toBe(false);
    expect(SPEAKING_AI_EXPANSION_POLICY.syntheticVideoEvidenceAllowed).toBe(false);
    expect(llms).toContain('Class samples, parent feedback and progress observations are bounded evidence sources');
    expect(llmsFull).toContain('Do not treat a class sample, testimonial or progress observation as a guaranteed outcome.');
  });
});
