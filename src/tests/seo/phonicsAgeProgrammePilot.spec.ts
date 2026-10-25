import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_AGE_PROGRAMME_PAGES,
  PHONICS_AGE_PROGRAMME_PATHS,
  getPublishedPhonicsAgeProgramme,
} from '../../lib/phonicsAgeProgrammeRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const origin = 'https://tinystepslearning.com';
const source = (path: string) => fs.readFileSync(path, 'utf8');

describe('TSSA-SCQ Phonics age 3–6 governed programme support family', () => {
  it('publishes exactly four approved age-specific routes; no wildcard age expansion', () => {
    expect(PHONICS_AGE_PROGRAMME_PAGES.map((p) => p.age)).toEqual([3, 4, 5, 6]);
    expect(PHONICS_AGE_PROGRAMME_PATHS).toEqual(['/phonics/age-3', '/phonics/age-4', '/phonics/age-5', '/phonics/age-6']);
    expect(getPublishedPhonicsAgeProgramme(7)).toBeNull();
    expect(getPublishedPhonicsAgeProgramme(8)).toBeNull();
    expect(getPublishedPhonicsAgeProgramme(9)).toBeNull();
    expect(new Set(PHONICS_AGE_PROGRAMME_PATHS).size).toBe(4);
  });

  it('uses existing routing, prerender and exact self-canonical SEO contracts', () => {
    const routes = new Map(PUBLIC_ROUTE_MANIFEST.map((item) => [item.path, item]));
    for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
      expect(routes.get(page.path)?.indexable).toBe(true);
      expect(routes.get(page.path)?.prerender).toBe(true);
      expect(routes.get(page.path)?.sitemap).toBe(true);
      expect(routes.get(page.path)?.canonicalPath).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]).toMatchObject({
        title: page.title,
        description: page.description,
        canonicalPath: page.path,
        ogType: 'website',
      });
      expect(ROUTE_SEO_REGISTRY[page.path].robots).not.toMatch(/noindex/i);
      expect(page.title).toContain(String(page.age));
      expect(page.description.length).toBeGreaterThan(90);
      expect(origin + page.path).not.toBe(origin + '/phonics');
    }
    expect(ROUTE_SEO_REGISTRY['/phonics'].canonicalPath).toBe('/phonics');
    expect(ROUTE_SEO_REGISTRY['/english-classes-for-5-year-old'].canonicalPath)
      .toBe('/english-classes-for-5-year-old');
  });

  it('retains different instructional purposes and evidence-sensitive messages', () => {
    const three = getPublishedPhonicsAgeProgramme(3)!;
    const four = getPublishedPhonicsAgeProgramme(4)!;
    const five = getPublishedPhonicsAgeProgramme(5)!;
    const six = getPublishedPhonicsAgeProgramme(6)!;
    expect(three.directAnswer).toMatch(/playful listening|phonics readiness/i);
    expect(three.introduction).toMatch(/no need to rush/i);
    expect(four.directAnswer).toMatch(/sound awareness/i);
    expect(five.directAnswer).toMatch(/blending|decode/i);
    expect(six.directAnswer).toMatch(/decoding and spelling|decoding/i);
    expect(three.activityExample).not.toEqual(four.activityExample);
    expect(four.activityExample).not.toEqual(five.activityExample);
    expect(five.activityExample).not.toEqual(six.activityExample);
    expect(three.coursePath).toBe('/courses/phonics-foundation');
    expect(five.coursePath).toBe('/courses/phonics-foundation');
    expect(six.coursePath).toBe('/courses/phonics-brush-up');
    expect(four.coursePath).toBe('/courses/phonics-foundation');
    expect(four.assessmentFocus).not.toEqual(five.assessmentFocus);
    for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
      expect(page.parentQuestions).toHaveLength(3);
      expect(page.assessmentFocus.length).toBeGreaterThanOrEqual(3);
      expect(page.classApproach.length).toBeGreaterThanOrEqual(3);
      expect(page.progressSigns.length).toBeGreaterThanOrEqual(3);
      expect(page.faqs.length).toBeGreaterThanOrEqual(3);
      expect(page.coursePath).toMatch(/^\/courses\/phonics-/);
      if (page.age !== 3) expect(page.broaderAgePath).toMatch(/^\/english-classes-for-/);
      else expect(page.broaderAgePath).toBe('/phonics');
      expect([page.heading, page.introduction, page.directAnswer, page.homeGuidance].join(' ').length).toBeGreaterThan(450);
      expect(page.introduction).not.toMatch(/guaranteed|read in \d+ classes/i);
    }
  });

  it('makes all four guides discoverable from the Phonics owner without rewriting other age pages', () => {
    const phonics = source('src/pages/phonics.tsx');
    const router = source('src/app/routes.tsx');
    const ageRenderer = source('src/pages/public/PhonicsByAgePage.tsx');
    for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
      expect(phonics).toContain(`to="${page.path}"`);
      expect(router).toContain(`path: 'phonics/age-${page.age}'`);
      expect(ageRenderer).toContain('createFAQPageSchema');
    }
    expect(ageRenderer).toContain('Book Free 35-Minute Demo');
    expect(ageRenderer).not.toMatch(/guaranteed (recordings|results)|AI-guided home practice/i);
    const concepts = source('docs/seo/phonics/AGE_7_9_UNPUBLISHED_CONTENT_DESIGN_2026-10-25.md');
    expect(concepts).toContain('CONTENT DESIGN ONLY');
    for (const age of [7, 8, 9]) {
      expect(router).not.toContain(`path: 'phonics/age-${age}'`);
      expect(PHONICS_AGE_PROGRAMME_PATHS).not.toContain(`/phonics/age-${age}`);
    }
  });
});
