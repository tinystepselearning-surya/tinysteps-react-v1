import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  COMMERCIAL_C3_OWNER_PAGE_AUDITS,
  COMMERCIAL_C3_POLICY,
  COMMERCIAL_C3_RECONCILIATION_STATUS,
  COMMERCIAL_C3_REVISION,
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS,
} from '../../lib/commercialC3OwnerPageAudit';

const repoRoot = path.resolve(process.cwd());
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const lower = (relativePath: string) => read(relativePath).toLowerCase();

const ownerSources = Array.from(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.sourcePath)));

describe('Commercial C3 final canonical-owner reconciliation', () => {
  it('locks the final 15-boundary / 14-page architecture against all 16 C2 clusters', () => {
    expect(COMMERCIAL_C3_REVISION).toBe('2026-09-11-c3-r4');
    expect(COMMERCIAL_C3_RECONCILIATION_STATUS).toBe('15-of-15-reconciled');
    expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS).toHaveLength(16);
    expect(COMMERCIAL_C3_POLICY.expectedUserFacingOwnershipBoundaries).toBe(15);
    expect(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).toHaveLength(14);
    expect(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.clusterId)).size).toBe(16);
    expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.ownerPath === '/speaking')).toHaveLength(2);
    expect(COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.ownerPath === '/online-english-classes-for-kids')).toHaveLength(2);

    for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
      const matches = COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.clusterId === cluster.id);
      expect(matches, cluster.id).toHaveLength(1);
      expect(matches[0]?.ownerPath, cluster.id).toBe(cluster.canonicalOwnerPath);
    }
  });

  it('points every audited owner to a real source file with no unresolved signal status', () => {
    for (const entry of COMMERCIAL_C3_OWNER_PAGE_AUDITS) {
      expect(fs.existsSync(path.join(repoRoot, entry.sourcePath)), `${entry.ownerPath} -> ${entry.sourcePath}`).toBe(true);
      for (const status of [entry.seo, entry.aeo, entry.geo, entry.conversion, entry.schema, entry.highIntent]) {
        expect(status, `${entry.clusterId} still needs strengthening`).not.toBe('needs-strengthening');
      }
    }
  });

  it('keeps country-page and AI-prompt-page creation at zero', () => {
    expect(COMMERCIAL_C3_POLICY.countryPagesCreated).toBe(0);
    expect(COMMERCIAL_C3_POLICY.aiPromptPagesCreated).toBe(0);
    expect(COMMERCIAL_C3_POLICY.sourceLevelFactsRequired).toBe(true);
  });

  it('keeps the final programme boundaries visible in owner source', () => {
    const reading = lower('src/pages/public/ReadingClassesForKidsPage.tsx');
    expect(reading).toContain('/reading-fluency-program');
    expect(reading).toContain('/writing-classes-for-kids');

    const fluency = lower('src/pages/public/ReadingFluencyProgramPage.tsx');
    expect(fluency).toContain('/reading-classes-for-kids');
    expect(fluency).toContain('reading fluency');

    const grammar = lower('src/pages/grammar.tsx');
    expect(grammar).toContain('/writing-classes-for-kids');
    expect(grammar).toContain('/spoken-english-classes-for-kids-online');

    const writing = lower('src/pages/public/WritingClassesForKidsPage.tsx');
    expect(writing).toContain('/grammar');
    expect(writing).toContain('creative writing');

    const spoken = lower('src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
    expect(spoken).toContain('/speaking');
    expect(spoken).toContain('/confidence-building-program-kids');

    const speaking = lower('src/pages/speaking.tsx');
    expect(speaking).toContain('/spoken-english-classes-for-kids-online');
    expect(speaking).toContain('/confidence-building-program-kids');

    const confidence = lower('src/pages/public/ConfidenceBuildingProgramKidsPage.tsx');
    expect(confidence).toContain('/speaking');
    expect(confidence).toContain('/shy-child-speaking-confidence');
  });

  it('keeps broad English as one global chooser plus generic tutor owner', () => {
    const source = lower('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
    for (const token of [
      'online english tutor for kids',
      '1 to 1 english tutor for kids online',
      'nri families',
      'uae',
      'united states',
      'united kingdom',
      'australia',
      'singapore',
      '/online-english-classes-hyderabad',
    ]) {
      expect(source, token).toContain(token);
    }
    expect(source).not.toContain('ages 9 to 13');
  });

  it('keeps all commercial owner facts at source instead of relying on owner-specific Vite rewrites', () => {
    const vite = read('vite.config.js');
    for (const obsoleteOwnerRewrite of [
      "id.includes('/src/pages/public/OnlineEnglishClassesForKidsPage.tsx')",
      "id.includes('/src/pages/public/PhonicsFeesIndiaPage.tsx')",
      "id.includes('/src/pages/public/ReadingClassesForKidsPage.tsx')",
      "id.includes('/src/pages/phonics.tsx')",
    ]) {
      expect(vite, obsoleteOwnerRewrite).not.toContain(obsoleteOwnerRewrite);
    }

    for (const sourcePath of ownerSources) {
      expect(read(sourcePath), `${sourcePath} still contains stale 35–40 wording`).not.toContain('35–40');
    }
  });

  it('keeps the pricing owner tied to canonical pricing and removes unsupported commercial promises', () => {
    const pricing = read('src/pages/PricingPage.tsx');
    expect(pricing).toContain('ONE_TO_ONE_MONTHLY_PACKAGES');
    expect(pricing).toContain('GROUP_MONTHLY_FEES');
    expect(pricing).toContain('ULTRA_PREMIUM_PRICING');
    expect(pricing).toContain("'@type': 'OfferCatalog'");
    expect(pricing).toContain('/phonics-fees-india');
    for (const stale of [
      'Optional Game Subscriptions',
      'Daily AI reading/speaking coach prompts',
      'Monthly parent Q&A call',
      'we’ll arrange it',
      'We set up 2-month or 3-month payment splits for most families.',
    ]) {
      expect(pricing, stale).not.toContain(stale);
    }
  });

  it('keeps demo/assessment as the single transactional owner without unsupported friction claims', () => {
    const demo = read('src/pages/public/BookDemoPage.tsx');
    expect(demo).toContain('programmeRoutes');
    expect(demo).toContain("areaServed: ['India', 'Worldwide']");
    expect(demo).toContain('Is the free demo a multi-class free trial?');
    expect(demo).toContain('/confidence-building-program-kids');
    expect(demo).not.toContain('No credit card required');
    expect(demo).not.toContain('Takes less than a minute');
    expect(demo).not.toContain("availability: 'https://schema.org/InStock'");
  });
});
