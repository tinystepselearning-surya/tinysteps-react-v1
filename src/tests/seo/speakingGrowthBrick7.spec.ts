import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_FRAMEWORK_GUARDRAILS,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
  SPEAKING_PROGRESS_FRAMEWORK_REVISION,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
  SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS,
  SPEAKING_PROGRESS_REVIEW_LOOP,
  createSpeakingProgressObservationTemplate,
} from '../../lib/speakingProgressFramework';
import { SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS } from '../../lib/speakingCommunicationKnowledgeArchitecture.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const frameworkSource = read('src/lib/speakingProgressFramework.ts');
const pageSource = read('src/pages/public/SpeakingProgressFrameworkPage.tsx');
const speakingSource = read('src/pages/speaking.tsx');
const assessmentSource = read('src/pages/public/BookDemoPage.tsx');
const parentProgressSource = read('src/pages/parents/tracking-progress.tsx');
const subjectResourcesSource = read('src/pages/SubjectResourcesPage.tsx');
const routeSeoSource = read('src/lib/routeSeoRegistry.js');
const routeManifestSource = read('src/lib/publicRouteManifest.js');
const routesSource = read('src/app/routes.tsx');
const internalLinksSource = read('src/lib/seo/internalLinkMap.ts');
const sitemapGeneratorSource = read('scripts/generate-sitemaps.js');
const sitemapStatic = read('public/sitemap-static.xml');
const sitemapParents = read('public/sitemap-parents.xml');
const sitemapIndex = read('public/sitemap.xml');
const seoSmoke = read('scripts/seo-smoke.mjs');
const htmlSitemap = read('src/pages/SitemapPage.tsx');
const progressSkillsSource = read('src/lib/progressSkills.ts');
const parentDashboardSource = read('src/pages/parent/ParentDashboard.tsx');
const teacherEditorSource = read('src/components/teacher/StudentTopicProgressEditor.tsx');

describe('Speaking growth Brick 7 progress framework', () => {
  it('defines the frozen 10-dimension speaking progress profile in the intended order', () => {
    expect(SPEAKING_PROGRESS_FRAMEWORK_REVISION).toBe('2026-09-19-b7-v2');
    expect(SPEAKING_PROGRESS_FRAMEWORK_PATH).toBe('/speaking-progress-framework');
    expect(SPEAKING_PROGRESS_DIMENSIONS).toHaveLength(10);
    expect(SPEAKING_PROGRESS_DIMENSIONS.map((item) => item.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(SPEAKING_PROGRESS_DIMENSIONS.map((item) => item.id)).toEqual([
      'response_expansion',
      'sentence_formation',
      'vocabulary_in_use',
      'idea_organisation',
      'listening_response',
      'storytelling_retelling',
      'delivery_intelligibility',
      'prompt_independence',
      'presentation_audience',
      'fresh_task_transfer',
    ]);
  });

  it('uses four support-to-independence observation bands without treating them as grades', () => {
    expect(SPEAKING_PROGRESS_OBSERVATION_BANDS).toHaveLength(4);
    expect(SPEAKING_PROGRESS_OBSERVATION_BANDS.map((item) => item.order)).toEqual([1,2,3,4]);
    expect(SPEAKING_PROGRESS_OBSERVATION_BANDS.map((item) => item.id)).toEqual([
      'modelled_support',
      'guided_attempt',
      'independent_use',
      'fresh_task_transfer',
    ]);
    expect(pageSource).toContain('These are teaching observations—not grades, age levels or standardised scores.');
  });

  it('maps every dimension to established knowledge and represents all nine speaking domains', () => {
    const domainIds = new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((item: { id: string }) => item.id));
    const representedDomainIds = new Set<string>();
    for (const dimension of SPEAKING_PROGRESS_DIMENSIONS) {
      expect(dimension.knowledgeDomainIds.length).toBeGreaterThan(0);
      for (const domainId of dimension.knowledgeDomainIds) {
        expect(domainIds.has(domainId)).toBe(true);
        representedDomainIds.add(domainId);
      }
    }
    expect(representedDomainIds).toEqual(domainIds);
    expect(
      SPEAKING_PROGRESS_DIMENSIONS.find((item) => item.id === 'idea_organisation')?.knowledgeDomainIds,
    ).toContain('discussion-reasoning');
  });

  it('freezes the shared framework contract deeply enough to prevent accidental runtime mutation', () => {
    expect(Object.isFrozen(SPEAKING_PROGRESS_DIMENSIONS)).toBe(true);
    expect(Object.isFrozen(SPEAKING_PROGRESS_OBSERVATION_BANDS)).toBe(true);
    expect(Object.isFrozen(SPEAKING_PROGRESS_REVIEW_LOOP)).toBe(true);

    for (const dimension of SPEAKING_PROGRESS_DIMENSIONS) {
      expect(Object.isFrozen(dimension)).toBe(true);
      expect(Object.isFrozen(dimension.knowledgeDomainIds)).toBe(true);
    }
    for (const band of SPEAKING_PROGRESS_OBSERVATION_BANDS) expect(Object.isFrozen(band)).toBe(true);
    for (const step of SPEAKING_PROGRESS_REVIEW_LOOP) expect(Object.isFrozen(step)).toBe(true);
  });

  it('creates an empty observation template instead of fabricating scores from historical data', () => {
    const template = createSpeakingProgressObservationTemplate();
    expect(template).toHaveLength(10);
    expect(template.map((item) => item.dimensionId)).toEqual(SPEAKING_PROGRESS_DIMENSIONS.map((item) => item.id));
    for (const item of template) {
      expect(item.bandId).toBeNull();
      expect(item.evidence).toBe('');
      expect(item.supportUsed).toBe('');
      expect(item.freshTaskEvidence).toBe('');
      expect(item.nextTarget).toBe('');
    }
  });

  it('uses a baseline-to-transfer review loop and parent-friendly evidence fields', () => {
    expect(SPEAKING_PROGRESS_REVIEW_LOOP.map((item) => item.id)).toEqual([
      'baseline',
      'focus',
      'guided-practice',
      'fresh-check',
      'next-step',
    ]);
    expect(SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS).toEqual([
      'Current speaking target',
      'Observation band for the target',
      'What the child can now do independently',
      'Support that is still useful',
      'Fresh-task evidence',
      'Next learning priority',
    ]);
  });

  it('hard-codes the non-clinical and no-single-score guardrails', () => {
    const guardrails = SPEAKING_PROGRESS_FRAMEWORK_GUARDRAILS.join(' ');
    expect(guardrails).toContain('Do not average the ten dimensions into one overall speaking score.');
    expect(guardrails).toContain('diagnosis');
    expect(guardrails).toContain('developmental age');
    expect(guardrails).toContain('accent');
    expect(guardrails).toContain('Do not expect every child to progress evenly across all ten dimensions.');
    expect(frameworkSource).not.toContain('overallScore');
    expect(frameworkSource).not.toContain('totalScore');
  });

  it('publishes one informational framework owner without taking the commercial Speaking intent', () => {
    const topic = CANONICAL_TOPIC_OWNERSHIP.find((item: { id: string }) => item.id === 'speaking-progress-measurement');
    expect(topic).toMatchObject({
      subject: 'speaking-communication',
      intent: 'progress-aware',
      ownerPath: '/speaking-progress-framework',
      ownerRole: 'editorial-pillar',
      hubPath: '/resources/speaking',
      queryIntent: 'how to measure speaking progress for kids',
    });

    const commercial = CANONICAL_TOPIC_OWNERSHIP.find((item: { id: string }) => item.id === 'live-public-speaking-classes');
    expect(commercial).toMatchObject({
      ownerPath: '/speaking',
      intent: 'high-commercial',
    });

    const hub = CANONICAL_TOPIC_OWNERSHIP.find((item: { id: string }) => item.id === 'speaking-subject-discovery');
    expect(hub).toMatchObject({
      ownerPath: '/resources/speaking',
      intent: 'informational',
    });
  });

  it('registers an indexable self-canonical public route and app route', () => {
    expect(routeSeoSource).toContain("'/speaking-progress-framework': {");
    expect(routeSeoSource).toContain("canonicalPath: '/speaking-progress-framework'");
    expect(routeSeoSource).toContain("title: 'How Tiny Steps Measures Speaking Progress | 10-Skill Framework'");
    expect(routeManifestSource).toContain("route('/speaking-progress-framework', 'static')");
    expect(routesSource).toContain("const SpeakingProgressFrameworkPage = lazy(() => import('../pages/public/SpeakingProgressFrameworkPage'))");
    expect(routesSource).toContain("{ path: 'speaking-progress-framework', element: <SpeakingProgressFrameworkPage /> }");
  });

  it('publishes evidence-oriented structured data without ratings or fabricated outcome scores', () => {
    expect(pageSource).toContain("'@type': 'DefinedTerm'");
    expect(pageSource).toContain("name: 'Ten Tiny Steps speaking progress dimensions'");
    expect(pageSource).toContain("name: 'Tiny Steps speaking observation bands'");
    expect(pageSource).toContain('createFAQPageSchema(faqItems)');
    expect(pageSource).not.toContain("'@type': 'AggregateRating'");
    expect(pageSource).not.toContain("'@type': 'Rating'");
    expect(pageSource).not.toContain('ratingValue');
    expect(pageSource).not.toContain('overallScore');
  });

  it('connects the framework from the four natural user journeys and internal-link system', () => {
    for (const source of [speakingSource, assessmentSource, parentProgressSource, subjectResourcesSource]) {
      expect(source).toContain('/speaking-progress-framework');
    }
    expect(internalLinksSource).toContain("id: 'speaking-progress-framework'");
    expect(internalLinksSource).toContain("href: '/speaking-progress-framework'");
    expect(htmlSitemap).toContain("to: '/speaking-progress-framework'");
  });

  it('keeps assessment use bounded instead of pretending one session measures all ten dimensions', () => {
    expect(assessmentSource).toContain('The teacher does not force every child through a ten-part test.');
    expect(assessmentSource).toContain('one high-value next target');
    expect(assessmentSource).toContain('not a clinical, developmental-age or standardised language assessment');
    expect(pageSource).toContain('A single session does not need to force all ten');
  });

  it('keeps parent progress communication evidence-led rather than percentage-led', () => {
    expect(parentProgressSource).toContain('Tiny Steps uses four observation bands rather than turning the ten dimensions into one percentage.');
    expect(parentProgressSource).toContain('Existing dashboard summaries remain separate operational views.');
    expect(parentProgressSource).toContain('SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS.map');
    expect(SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS).toContain('What the child can now do independently');
    expect(SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS).toContain('Fresh-task evidence');
    expect(SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS).toContain('Next learning priority');
  });

  it('keeps the existing operational progress-rating contract untouched in Brick 7', () => {
    expect(progressSkillsSource).toContain(
      "speaking: ['Confidence', 'Pronunciation', 'Fluency', 'Idea expression', 'Audience engagement']",
    );
    expect(progressSkillsSource).not.toContain("from './speakingProgressFramework'");
    expect(parentDashboardSource).not.toContain('speakingProgressFramework');
    expect(teacherEditorSource).not.toContain('speakingProgressFramework');
    expect(frameworkSource).not.toContain('firebase');
    expect(pageSource).not.toContain('firestore');
    expect(pageSource).toContain('remain separate operational systems and may');
    expect(pageSource).toContain('still show broader legacy subject-level progress summaries');
    expect(pageSource).toContain('does not silently rewrite historical progress data');
  });

  it('keeps Brick 7 discovery surfaces current and gives the framework exactly one sitemap URL', () => {
    expect(
      (sitemapStatic.match(/<loc>https:\/\/tinystepslearning\.com\/speaking-progress-framework<\/loc>/g) ?? []),
    ).toHaveLength(1);

    for (const route of [
      '/speaking-progress-framework',
      '/speaking',
      '/book-demo',
      '/resources/speaking',
    ]) {
      expect(sitemapStatic).toContain(
        `<loc>https://tinystepslearning.com${route}</loc>\n    <lastmod>2026-09-19</lastmod>`,
      );
    }

    expect(sitemapParents).toContain(
      '<loc>https://tinystepslearning.com/parents/tracking-progress</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
    expect(sitemapIndex).toContain(
      '<loc>https://tinystepslearning.com/sitemap-static.xml</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
    expect(sitemapIndex).toContain(
      '<loc>https://tinystepslearning.com/sitemap-parents.xml</loc>\n    <lastmod>2026-09-19</lastmod>',
    );

    expect(sitemapGeneratorSource).toContain("'/speaking': [appRoutesTs, speakingPageTsx]");
    expect(sitemapGeneratorSource).toContain("'/book-demo': [appRoutesTs, bookDemoPageTsx]");
    expect(sitemapGeneratorSource).toContain("'/resources/speaking': [appRoutesTs, subjectResourcesPageTsx]");
    expect(sitemapGeneratorSource).toContain("'/speaking-progress-framework': [appRoutesTs, speakingProgressFrameworkTs, speakingProgressFrameworkPageTsx]");
    expect(sitemapGeneratorSource).toContain("route === '/parents/tracking-progress'");
    expect(sitemapGeneratorSource).toContain('parentTrackingPageTsx');
    expect(seoSmoke).toContain("'https://tinystepslearning.com/speaking-progress-framework'");
  });
});
