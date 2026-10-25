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

describe('TSSA-SCQ Phonics age 4/5 commercial-support pilot', () => {
  it('publishes exactly two approved age-specific routes; no wildcard age expansion', () => {
    expect(PHONICS_AGE_PROGRAMME_PAGES.map((p) => p.age)).toEqual([4, 5]);
    expect(PHONICS_AGE_PROGRAMME_PATHS).toEqual(['/phonics/age-4', '/phonics/age-5']);
    expect(getPublishedPhonicsAgeProgramme(6)).toBeNull();
    expect(new Set(PHONICS_AGE_PROGRAMME_PATHS).size).toBe(2);
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
    const four = getPublishedPhonicsAgeProgramme(4)!;
    const five = getPublishedPhonicsAgeProgramme(5)!;
    expect(four.directAnswer).toMatch(/sound awareness/i);
    expect(five.directAnswer).toMatch(/blending|decode/i);
    expect(four.activityExample).not.toEqual(five.activityExample);
    expect(four.assessmentFocus).not.toEqual(five.assessmentFocus);
    for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
      expect(page.parentQuestions).toHaveLength(3);
      expect(page.assessmentFocus.length).toBeGreaterThanOrEqual(3);
      expect(page.classApproach.length).toBeGreaterThanOrEqual(3);
      expect(page.progressSigns.length).toBeGreaterThanOrEqual(3);
      expect(page.faqs.length).toBeGreaterThanOrEqual(3);
      expect(page.coursePath).toMatch(/^\/courses\/phonics-/);
      expect(page.broaderAgePath).toMatch(/^\/english-classes-for-/);
      expect([page.heading, page.introduction, page.directAnswer, page.homeGuidance].join(' ').length).toBeGreaterThan(450);
      expect(page.introduction).not.toMatch(/guaranteed|read in \d+ classes/i);
    }
  });

  it('makes both pages discoverable from the Phonics owner without rewriting the other age pages', () => {
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
  });
});
