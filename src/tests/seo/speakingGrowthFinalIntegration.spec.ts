import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
} from '../../lib/speakingProgressFramework';
import {
  SPEAKING_KNOWLEDGE_CLUSTER_GROUPS,
  SPEAKING_KNOWLEDGE_CLUSTER_PATHS,
} from '../../lib/speakingKnowledgeCluster';
import { SPEAKING_EVIDENCE_SURFACES } from '../../lib/speakingEvidenceLayer';
import {
  SPEAKING_ENTITY_AUTHORITY,
  SPEAKING_EXTERNAL_AUTHORITY_RULES,
} from '../../lib/speakingEntityAuthority';
import {
  SPEAKING_AI_ANSWER_OWNERS,
  SPEAKING_AI_EXPANSION_POLICY,
  SPEAKING_AI_KNOWLEDGE_PATHS,
} from '../../lib/speakingAiVisibility';
import {
  SPEAKING_ATTRIBUTION_MEASUREMENT,
  SPEAKING_ATTRIBUTION_ORIGIN_PATHS,
} from '../../lib/speakingAttribution';
import {
  COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES,
} from '../../lib/commercialC7ContextualHandoffImplementation';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const firebase = read('firebase.json');
const routes = read('src/app/routes.tsx');
const routeManifest = read('src/lib/publicRouteManifest.js');
const routeSeo = read('src/lib/routeSeoRegistry.js');
const coursePages = read('src/lib/publicCoursePages.js');
const speakingPage = read('src/pages/speaking.tsx');
const spokenEnglishPage = read('src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
const progressSource = read('src/lib/speakingProgressFramework.ts');
const parentTracking = read('src/pages/parents/tracking-progress.tsx');
const brick10 = read('docs/seo/speaking-growth/BRICK_10_SKIP_CLASS_DEMONSTRATION.md');
const sitemapStatic = read('public/sitemap-static.xml');
const sitemapCourses = read('public/sitemap-courses.xml');
const sitemapBlog = read('public/sitemap-blog.xml');
const llms = read('public/llms.txt');
const llmsFull = read('public/llms-full.txt');
const ledger = read('docs/seo/speaking-growth/BRICK_STATUS.md');

const absolute = (pathname: string) => `https://tinystepslearning.com${pathname}`;

describe('Speaking growth Bricks 1–13 final integration contract', () => {
  it('keeps canonical ownership and legacy redirects unambiguous', () => {
    expect(firebase).toContain('"source": "/public-speaking-communication-kids"');
    expect(firebase).toContain('"destination": "/speaking"');
    expect(firebase).toContain('"source": "/spoken-english-classes-for-kids"');
    expect(firebase).toContain('"destination": "/spoken-english-classes-for-kids-online"');
    expect(firebase).toContain('"source": "/courses/basic-public-speaking"');
    expect(firebase).toContain('"destination": "/courses/public-speaking-foundations"');
    expect(firebase).toContain('"source": "/courses/advanced-public-speaking"');
    expect(firebase).toContain('"destination": "/courses/public-speaking-excellence"');

    expect(routes).toContain("{ path: 'speaking', element: <SpeakingPage /> }");
    expect(routes).toContain("{ path: 'speaking-progress-framework', element: <SpeakingProgressFrameworkPage /> }");
    expect(routes).not.toContain('PublicSpeakingCommunicationKidsPage');
    expect(routeManifest).toContain('/speaking');
    expect(routeManifest).toContain('/speaking-progress-framework');
  });

  it('keeps Public Speaking and Spoken English as separate canonical territories', () => {
    expect(routeSeo).toContain("'/speaking':");
    expect(routeSeo).toContain("canonicalPath: '/speaking'");
    expect(routeSeo).toContain("'/spoken-english-classes-for-kids-online':");
    expect(routeSeo).toContain("canonicalPath: '/spoken-english-classes-for-kids-online'");
    expect(speakingPage).toContain('to="/spoken-english-classes-for-kids-online"');
    expect(spokenEnglishPage).toContain('to="/speaking"');
    expect(speakingPage).toContain('to="/confidence-building-program-kids"');
  });

  it('keeps exactly the two canonical Public Speaking course owners', () => {
    expect(coursePages).toContain("routePath: '/courses/public-speaking-foundations'");
    expect(coursePages).toContain("routePath: '/courses/public-speaking-excellence'");
    expect(coursePages).not.toContain("routePath: '/courses/basic-public-speaking'");
    expect(coursePages).not.toContain("routePath: '/courses/advanced-public-speaking'");
    expect(coursePages).not.toContain("routePath: '/courses/public-speaking-communication'");
    expect(sitemapCourses).toContain(`<loc>${absolute('/courses/public-speaking-foundations')}</loc>`);
    expect(sitemapCourses).toContain(`<loc>${absolute('/courses/public-speaking-excellence')}</loc>`);
  });

  it('keeps the level structured-data URLs on canonical course paths', () => {
    const levelSchemaStart = speakingPage.indexOf("name: 'Tiny Steps Public Speaking levels'");
    expect(levelSchemaStart).toBeGreaterThanOrEqual(0);
    const levelSchema = speakingPage.slice(levelSchemaStart, levelSchemaStart + 1200);
    expect(levelSchema).toContain('item.path');
    expect(levelSchema).not.toContain('item.sourcePath');
  });

  it('keeps Brick 7 as a 10-dimension, 4-band observation framework without synthetic scores', () => {
    expect(SPEAKING_PROGRESS_DIMENSIONS).toHaveLength(10);
    expect(SPEAKING_PROGRESS_OBSERVATION_BANDS).toHaveLength(4);
    expect(SPEAKING_PROGRESS_FRAMEWORK_PATH).toBe('/speaking-progress-framework');
    expect(progressSource).toContain('Do not convert the framework into a developmental age, IQ-style result, diagnosis, or clinical label.');
    expect(progressSource.toLowerCase()).toContain('accent');
    expect(progressSource.toLowerCase()).toContain('eye contact');
    expect(progressSource.toLowerCase()).toContain('fresh');
    expect(progressSource.toLowerCase()).toContain('transfer');
    expect(parentTracking).toContain('SPEAKING_PROGRESS_FRAMEWORK_PATH');
  });

  it('keeps Brick 8 on the frozen 14-URL knowledge architecture', () => {
    expect(SPEAKING_KNOWLEDGE_CLUSTER_GROUPS).toHaveLength(5);
    expect(SPEAKING_KNOWLEDGE_CLUSTER_PATHS).toHaveLength(14);
    expect(new Set(SPEAKING_KNOWLEDGE_CLUSTER_PATHS).size).toBe(14);
    expect(SPEAKING_AI_KNOWLEDGE_PATHS).toEqual(SPEAKING_KNOWLEDGE_CLUSTER_PATHS);

    for (const pathname of SPEAKING_KNOWLEDGE_CLUSTER_PATHS) {
      expect(pathname.startsWith('/blog/')).toBe(true);
      expect(sitemapBlog).toContain(`<loc>${absolute(pathname)}</loc>`);
      expect(llms).toContain(absolute(pathname));
      expect(llmsFull).toContain(absolute(pathname));
    }
  });

  it('keeps Brick 9 evidence bounded to six canonical sources with explicit non-proof boundaries', () => {
    expect(SPEAKING_EVIDENCE_SURFACES).toHaveLength(6);
    expect(new Set(SPEAKING_EVIDENCE_SURFACES.map((item) => item.sourcePath)).size).toBe(6);
    for (const item of SPEAKING_EVIDENCE_SURFACES) {
      expect(item.supports.length).toBeGreaterThan(0);
      expect(item.doesNotProve.length).toBeGreaterThan(0);
    }
    const evidenceSchemaStart = speakingPage.indexOf("name: 'Tiny Steps Speaking evidence sources'");
    expect(evidenceSchemaStart).toBeGreaterThanOrEqual(0);
    const evidenceSchema = speakingPage.slice(evidenceSchemaStart, evidenceSchemaStart + 1200);
    expect(evidenceSchema).toContain('item.sourcePath');
  });

  it('keeps Brick 10 intentionally covered by the shared class-samples owner', () => {
    expect(brick10).toContain('/class-samples');
    expect(brick10).toContain('SKIPPED');
    expect(speakingPage).toContain('to="/class-samples"');
    expect(SPEAKING_EVIDENCE_SURFACES.some((item) => item.sourcePath === '/class-samples')).toBe(true);
  });

  it('keeps Brick 11 entity authority conservative and attached to the existing organization', () => {
    expect(SPEAKING_ENTITY_AUTHORITY.commercialOwnerPath).toBe('/speaking');
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES.externalNameMatchAloneIsSufficient).toBe(false);
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES.createNewSocialProfileForSeoOnly).toBe(false);
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES.addUnverifiedDirectoryToSameAs).toBe(false);
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES.mergeFounderAndOrganizationSameAs).toBe(false);
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES.externalClaimsMayExceedFirstPartyEvidence).toBe(false);
  });

  it('keeps Brick 12 bounded to canonical answer owners without AI-specific landing pages', () => {
    expect(SPEAKING_AI_ANSWER_OWNERS).toHaveLength(13);
    expect(new Set(SPEAKING_AI_ANSWER_OWNERS.map((item) => item.path)).size).toBe(13);
    expect(SPEAKING_AI_EXPANSION_POLICY.newAiPromptPagesAllowed).toBe(false);
    expect(SPEAKING_AI_EXPANSION_POLICY.newAiOnlyCommercialPagesAllowed).toBe(false);
    expect(SPEAKING_AI_EXPANSION_POLICY.duplicateSpeakingOwnerAllowed).toBe(false);
    expect(SPEAKING_AI_EXPANSION_POLICY.syntheticVideoEvidenceAllowed).toBe(false);
    expect(SPEAKING_AI_EXPANSION_POLICY.fabricatedExternalAuthorityAllowed).toBe(false);

    for (const forbidden of ['speaking-ai', 'speaking-chatgpt', 'speaking-gemini', 'speaking-perplexity']) {
      expect(routes).not.toContain(forbidden);
      expect(routeManifest).not.toContain(forbidden);
    }
  });

  it('keeps every Brick 12 primary answer owner discoverable', () => {
    const coursePaths = new Set([
      '/courses/public-speaking-foundations',
      '/courses/public-speaking-excellence',
    ]);
    for (const owner of SPEAKING_AI_ANSWER_OWNERS) {
      expect(llms).toContain(absolute(owner.path));
      expect(llmsFull).toContain(absolute(owner.path));
      if (coursePaths.has(owner.path)) {
        expect(sitemapCourses).toContain(`<loc>${absolute(owner.path)}</loc>`);
      } else {
        expect(sitemapStatic).toContain(`<loc>${absolute(owner.path)}</loc>`);
      }
    }
  });

  it('keeps the new progress framework compatible with the existing Commercial C7 handoff graph', () => {
    expect(
      COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES.map((item) => item.path),
    ).toContain('/speaking-progress-framework');
    expect(speakingPage).toContain('SPEAKING_PROGRESS_FRAMEWORK_PATH');
  });

  it('keeps Brick 13 attribution bounded to first-touch evidence and canonical admission truth', () => {
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).toHaveLength(22);
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).toContain('/speaking');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).toContain('/speaking-progress-framework');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/book-demo');
    expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).not.toContain('/pricing');
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.cohortPolicy.originAndInterestMustStaySeparate).toBe(true);
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.causalityPolicy.queryToLeadJoinAvailable).toBe(false);
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.causalityPolicy.queryToAdmissionJoinAllowed).toBe(false);
    expect(SPEAKING_ATTRIBUTION_MEASUREMENT.causalityPolicy.landingPageToAdmissionJoinAvailable).toBe(true);
  });

  it('keeps the master ledger closed through Brick 12 and records Brick 10 as intentionally skipped', () => {
    for (const brick of ['01','02','03','04','05','06','07','08','09','11','12']) {
      expect(ledger).toMatch(new RegExp(`\\| ${brick} \\|[^\\n]*RE-AUDITED`));
    }
    expect(ledger).toMatch(/\| 10 \|[^\n]*SKIPPED/);
    expect(ledger).toMatch(/\| 13 \|[^\n]*(STRUCTURALLY VERIFIED|RE-AUDITED)/);
  });

  it('keeps private product areas outside the public Speaking architecture', () => {
    for (const privatePrefix of ['/admin', '/teacher', '/parent', '/kid', '/surya']) {
      expect(SPEAKING_ATTRIBUTION_ORIGIN_PATHS.some((pathname) => pathname.startsWith(privatePrefix))).toBe(false);
      expect(SPEAKING_AI_ANSWER_OWNERS.some((item) => item.path.startsWith(privatePrefix))).toBe(false);
      expect(SPEAKING_KNOWLEDGE_CLUSTER_PATHS.some((pathname) => pathname.startsWith(privatePrefix))).toBe(false);
    }
  });
});
