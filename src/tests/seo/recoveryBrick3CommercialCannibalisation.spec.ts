// @ts-expect-error Consolidation tooling is executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SEO_RECOVERY_BRICK3_COMMERCIAL_OWNERS,
  SEO_RECOVERY_BRICK3_LEGACY_ALIASES,
  SEO_RECOVERY_BRICK3_PENDING_BRICK4_RETIREMENT,
} from '../../lib/seoRecoveryBrick3CommercialOwnership';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('SEO recovery Brick 3 commercial ownership guardrails', () => {
  it('locks the programme, comparison, fee, pricing and conversion owners', () => {
    expect(SEO_RECOVERY_BRICK3_COMMERCIAL_OWNERS).toEqual({
      genericPhonicsProgramme: '/phonics',
      phonicsComparison: '/best-online-phonics-classes-for-kids-in-india',
      phonicsFees: '/phonics-fees-india',
      crossProgrammePricing: '/pricing',
      assessmentConversion: '/book-demo',
    });
  });

  it('keeps generic phonics intent on /phonics and delegates comparison and fees', () => {
    const phonics = read('src/pages/phonics.tsx');
    const registry = read('src/lib/routeSeoRegistry.js');

    expect(registry).toContain("'/phonics': {");
    expect(registry).toContain("canonicalPath: '/phonics'");
    expect(phonics).toContain('Online Phonics Classes for Kids');
    expect(phonics).toContain('to="/best-online-phonics-classes-for-kids-in-india"');
    expect(phonics).toContain('to="/phonics-fees-india"');

    expect(phonics).not.toContain("'best online phonics classes'");
    expect(phonics).not.toContain("'phonics classes fees'");
  });

  it('keeps best/how-to-choose/provider-selection intent on the comparison owner', () => {
    const comparison = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(comparison).toContain("'best online phonics classes in India'");
    expect(comparison).toContain("'best phonics classes online'");
    expect(comparison).toContain("'how to choose phonics classes'");
    expect(comparison).toContain('const decisionGates = [');
    expect(comparison).toContain('const comparisonFormats = [');
    expect(comparison).toContain('const providerScorecard = [');
    expect(comparison).toContain('const demoQuestions = [');
    expect(comparison).toContain('const redFlags = [');
    expect(comparison).toContain("href: '/phonics-fees-india'");
    expect(comparison).toContain("href: '/phonics'");
  });

  it('keeps fee/cost/price intent on the dedicated fee owner', () => {
    const fees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');

    expect(fees).toContain('Phonics Class Fees in India');
    expect(fees).toContain("'phonics classes fees in India'");
    expect(fees).toContain("'online phonics classes fees'");
    expect(fees).toContain("'phonics classes cost India'");
    expect(fees).toContain("'phonics course price India'");
    expect(fees).toContain('to="/book-demo"');
  });

  it('protects the already-clean generic and comparison aliases', () => {
    const firebase = read('firebase.json');

    for (const [source, destination] of Object.entries(SEO_RECOVERY_BRICK3_LEGACY_ALIASES)) {
      expect(firebase).toContain(`\"source\": \"${source}\"`);
      expect(firebase).toContain(`\"destination\": \"${destination}\"`);
    }
  });

  it('verifies the Brick 4 retirement without creating or restoring a competing owner', () => {
    const comparison = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
    const retiredPostExists = fs.existsSync(path.join(root, 'src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts'));
    const brick1 = read('docs/TINY_STEPS_SEO_RECOVERY_BRICK_1_URL_OWNERSHIP_REGISTRY_2026-09-12.md');

    expect(retiredPostExists).toBe(false);
    expect(comparison).toContain("'how to choose phonics classes'");
    expect(brick1).toContain('`/blog/how-to-choose-phonics-classes`');
    expect(brick1).toContain('/best-online-phonics-classes-for-kids-in-india');
    const retirement = SEO_RECOVERY_BRICK3_PENDING_BRICK4_RETIREMENT;
    for (const source of [retirement.source, ...retirement.historicalSources]) {
      expect(RETIRED_BLOG_PATH_REDIRECTS[source]).toBe(retirement.destination);
    }

    expect(SEO_RECOVERY_BRICK3_PENDING_BRICK4_RETIREMENT).toEqual({
      source: '/blog/how-to-choose-phonics-classes',
      destination: '/best-online-phonics-classes-for-kids-in-india',
      historicalSources: [
        '/blog/best-online-phonics-classes-for-kids',
        '/blog/best-phonics-classes-for-kids',
      ],
      requiredFinalRedirectShape: 'direct-301-to-comparison-owner',
    });
  });
});
