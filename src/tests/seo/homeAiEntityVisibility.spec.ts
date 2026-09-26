import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage AI entity visibility contract', () => {
  const homeSource = read('src/pages/HomePage.tsx');
  const summarySource = read('src/components/Home/HomeEntitySummarySection.tsx');

  it('keeps the entity summary in the initial homepage render path', () => {
    expect(homeSource).toContain('import HomeEntitySummarySection');
    expect(homeSource).toContain('<HomeEntitySummarySection />');

    const summaryIndex = homeSource.indexOf('<HomeEntitySummarySection />');
    const deferredIndex = homeSource.indexOf('showPrimaryBelowFoldSections ?');
    expect(summaryIndex).toBeGreaterThan(-1);
    expect(deferredIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeLessThan(deferredIndex);
  });

  it('publishes explicit homepage WebPage entity semantics', () => {
    expect(homeSource).toContain('createWebPageSchema');
    expect(homeSource).toContain('homeWebPageSchema');
    expect(homeSource).toContain('Children aged 3–12');
    expect(homeSource).toContain('Online English classes for children');
    expect(homeSource).toContain('jsonLd={[organizationSchema, websiteSchema, homeWebPageSchema, homeFaqSchema]}');
  });

  it('states canonical brand facts and links to specialist intent owners', () => {
    expect(summarySource).toContain('What is Tiny Steps Learning?');
    expect(summarySource).toContain('live online English learning school for children aged 3–12');
    expect(summarySource).toContain("href: '/phonics'");
    expect(summarySource).toContain("href: '/grammar'");
    expect(summarySource).toContain("href: '/speaking'");
    expect(summarySource).toContain('to="/online-english-classes-for-kids"');
    expect(summarySource).toContain('to="/curriculum"');
    expect(summarySource).toContain('to="/team/vannala-ravali-priya"');
  });

  it('sources mutable public facts from canonical registries instead of duplicating numbers', () => {
    expect(summarySource).toContain('PUBLIC_AGE_RANGE_LABEL');
    expect(summarySource).toContain('PUBLIC_LEARNER_REACH_LABEL');
    expect(summarySource).toContain('PUBLIC_SESSION_DURATION_LABEL');
    expect(summarySource).toContain('PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes');
    expect(summarySource).toContain('PUBLIC_FACTS.founder.fullName');
  });
});
