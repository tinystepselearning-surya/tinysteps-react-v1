import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage AI entity visibility and scroll-journey contract', () => {
  const homeSource = read('src/pages/HomePage.tsx');
  const summarySource = read('src/components/Home/HomeEntitySummarySection.tsx');
  const methodSource = read('src/components/Home/StepTimeline.tsx');
  const reassuranceSource = read('src/components/programs/ParentReassurance.tsx');
  const finalCtaSource = read('src/components/Home/FinalCTASection.tsx');

  it('keeps the entity bridge crawlable without interrupting hero-to-problem recognition', () => {
    const renderStart = homeSource.indexOf('<ConversionHero />');
    const problemIndex = homeSource.indexOf('<ParentProblemRecognitionSection />', renderStart);
    const summaryIndex = homeSource.indexOf('<HomeEntitySummarySection />', renderStart);
    const trustIndex = homeSource.indexOf('<TrustSnapshotSection />', renderStart);
    const deferredIndex = homeSource.indexOf('showPrimaryBelowFoldSections ?', renderStart);

    expect(renderStart).toBeGreaterThan(-1);
    expect(problemIndex).toBeGreaterThan(renderStart);
    expect(summaryIndex).toBeGreaterThan(problemIndex);
    expect(trustIndex).toBeGreaterThan(summaryIndex);
    expect(deferredIndex).toBeGreaterThan(trustIndex);
  });

  it('publishes explicit homepage WebPage entity semantics with brand-first metadata', () => {
    expect(homeSource).toContain('Tiny Steps Learning | Online English Learning for Kids Ages 3–12');
    expect(homeSource).toContain('createWebPageSchema');
    expect(homeSource).toContain('homeWebPageSchema');
    expect(homeSource).toContain('Children aged 3–12');
    expect(homeSource).toContain('Online English learning for children');
    expect(homeSource).toContain('jsonLd={[organizationSchema, websiteSchema, homeWebPageSchema, homeFaqSchema]}');
  });

  it('keeps the entity bridge compact and points to canonical intent owners', () => {
    expect(summarySource).toContain('Tiny Steps Learning at a glance');
    expect(summarySource).toContain('live online English learning school for {PUBLIC_AGE_RANGE_LABEL}');
    expect(summarySource).toContain("href: '/phonics'");
    expect(summarySource).toContain("href: '/grammar'");
    expect(summarySource).toContain("href: '/speaking'");
    expect(summarySource).toContain('to="/online-english-classes-for-kids"');
    expect(summarySource).toContain('to="/curriculum"');
    expect(summarySource).toContain('to="/team/vannala-ravali-priya"');
    expect(summarySource).toContain('PUBLIC_FACTS.founder.fullName');

    expect(summarySource).not.toContain('5000+');
    expect(summarySource).not.toContain('15+');
    expect(summarySource).not.toContain('35-minute');
    expect(summarySource).not.toContain('Weekly');
  });

  it('keeps one method layer instead of two competing homepage journey models', () => {
    expect(homeSource).toContain('<StepTimeline />');
    expect(homeSource).not.toContain('LearningJourneyRoadmapPPT');
    expect(methodSource).toContain('What learning looks like in a Tiny Steps class');
    expect(methodSource).toContain('Inside each pathway');
    expect(methodSource).not.toContain('S.O.L.I.D. Promise');
    expect(methodSource).not.toContain('Use this on your website');
  });

  it('preserves the intended conversion sequence after proof', () => {
    const renderStart = homeSource.indexOf('<TrustEvidenceSection />');
    const order = [
      '<TrustEvidenceSection />',
      '<GlobalLearnersMapSection />',
      '<StepTimeline />',
      '<ClassSamplesSection />',
      '<PricingCrispSection />',
      '<ParentReassurance />',
      '<HomeFaqSection items={homeFaqItems} />',
      '<FinalCTASection />',
    ].map((needle) => homeSource.indexOf(needle, renderStart));

    order.forEach((index) => expect(index).toBeGreaterThan(-1));
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).toBeGreaterThan(order[i - 1]);
    }
  });

  it('keeps assessment reassurance factual and the closing CTA concise', () => {
    expect(reassuranceSource).toContain('A Tiny Steps teacher checks the skills most relevant');
    expect(reassuranceSource).toContain('Recommended starting point');
    expect(reassuranceSource).not.toContain('current skill level report');
    expect(reassuranceSource).not.toContain('sample practice activities');
    expect(reassuranceSource).not.toContain('Takes 2 minutes');

    expect(finalCtaSource).toContain('One clear next step');
    expect(finalCtaSource).toContain('View real class samples');
    expect(finalCtaSource).not.toContain('5000+ students');
    expect(finalCtaSource).not.toContain('Trustpilot, JustDial, and Reddit');
  });

  it('keeps mobile method content complete without duplicate pathway controls', () => {
    expect(methodSource).toContain('Desktop pathway selector. Mobile uses one card per carousel slide');
    expect(methodSource).toContain('CHILD PRACTISES');
    expect(methodSource).toContain('TEACHER GUIDANCE');
    expect(methodSource).toContain('PARENT VISIBILITY');
    expect(methodSource).toContain('openStageModal(s.id)');
  });
});
