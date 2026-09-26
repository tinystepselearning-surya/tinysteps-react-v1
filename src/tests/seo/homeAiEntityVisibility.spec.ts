import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage AI entity visibility and scroll-journey contract', () => {
  const homeSource = read('src/pages/HomePage.tsx');
  const summarySource = read('src/components/Home/HomeEntitySummarySection.tsx');
  const journeySource = read('src/components/Home/HomeScrollJourneySections.tsx');
  const heroSource = read('src/components/Home/ConversionHero.tsx');
  const methodSource = read('src/components/Home/StepTimeline.tsx');
  const pricingSource = read('src/components/Home/PricingCrispSection.tsx');
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
    expect(summarySource).toContain("href: '/reading-classes-for-kids'");
    expect(summarySource).toContain("href: '/grammar'");
    expect(summarySource).toContain("href: '/speaking'");
    expect(summarySource).toContain('to="/online-english-classes-for-kids"');
    expect(summarySource).toContain('to="/curriculum"');

    expect(summarySource).not.toContain('5000+');
    expect(summarySource).not.toContain('15+');
    expect(summarySource).not.toContain('35-minute');
    expect(summarySource).not.toContain('Weekly');
    expect(summarySource).not.toContain('Academic direction:');
    expect(summarySource).not.toContain('/team/vannala-ravali-priya');
  });

  it('keeps one method layer instead of two competing homepage journey models', () => {
    expect(homeSource).toContain('<StepTimeline />');
    expect(homeSource).not.toContain('LearningJourneyRoadmapPPT');
    expect(methodSource).toContain('How teaching changes by skill focus');
    expect(methodSource).toContain('Inside the learning experience');
    expect(methodSource).toContain('id: "reading"');
    expect(methodSource).toContain('title: "Reading & Fluency"');
    expect(methodSource).not.toContain('S.O.L.I.D. Promise');
    expect(methodSource).not.toContain('Use this on your website');
    expect(methodSource).not.toContain('proofTiles');
    expect(methodSource).not.toContain('PROOF YOU CAN SEE');
    expect(methodSource).not.toContain('stageAccents');
  });

  it('preserves the intended conversion sequence after differentiation', () => {
    const renderStart = homeSource.indexOf('<GlobalLearnersMapSection />');
    const order = [
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

  it('keeps diagnosis compact and removes age-table repetition before programme discovery', () => {
    expect(journeySource).toContain('We identify the skill gap before recommending a programme');
    expect(journeySource).toContain('placement is based on the child&apos;s observed skills rather than age alone');
    expect(journeySource).not.toContain('Common starting points by age');
    expect(journeySource).not.toContain('Parent concern');
    expect(journeySource).not.toContain('Age guidance');
    expect(homeSource).not.toContain('<TrustEvidenceSection />');
    expect(journeySource).toContain('Read parent testimonials');
  });

  it('keeps primary programme discovery complete without turning the homepage into a course catalogue', () => {
    expect(journeySource).toContain('Four clear Tiny Steps learning paths');
    expect(journeySource).toContain("path: '/phonics'");
    expect(journeySource).toContain("path: '/reading-classes-for-kids'");
    expect(journeySource).toContain("path: '/grammar'");
    expect(journeySource).toContain("path: '/speaking'");
    expect(journeySource).toContain('to="/courses"');
    expect(journeySource).toContain('Need a specialist path? View all courses');
    expect(journeySource).not.toContain('writing, spoken English, reading-fluency or confidence-specific support');
    expect(journeySource).not.toContain("icon: '🔤'");
    expect(journeySource).not.toContain("icon: '📚'");
    expect(journeySource).not.toContain("icon: '✏️'");
    expect(journeySource).not.toContain("icon: '🎤'");
    expect(journeySource).not.toContain('group-hover:translate-x-0.5 group-hover:text-slate-500');
  });

  it('does not reserve empty viewport height below the hero or repeat desktop proof', () => {
    expect(heroSource).toContain('PUBLIC_LEARNER_REACH_LABEL');
    expect(heroSource).not.toContain('min-h-[82vh]');
    expect(heroSource).not.toContain('md:min-h-screen');
    expect(heroSource).toContain('Shared proof row');
    expect(heroSource).not.toContain('Quick questions? WhatsApp us');
    expect(heroSource).not.toContain('Assessment-led placement • Transparent pricing');
    expect(journeySource).toContain('md:hidden');
    expect(journeySource).toContain('PUBLIC_SITE_FACTS.learnerReach.learnersLabel');
    expect(journeySource).toContain('PUBLIC_SITE_FACTS.learnerReach.countriesLabel');
    expect(journeySource).not.toContain('PUBLIC_SESSION_DURATION_LABEL');
  });

  it('keeps homepage pricing scannable without repeating common plan features', () => {
    expect(pricingSource).toContain('Standard live 1:1 plans');
    expect(pricingSource).toContain('All standard 1:1 packages use the same per-class rate and class duration');
    expect(pricingSource).not.toContain('Around 2 classes per week');
    expect(pricingSource).not.toContain('Around 3–4 classes per week');
    expect(pricingSource).not.toContain('Around 5–6 classes per week');
    expect(pricingSource).not.toContain('Phonics, grammar, or public speaking');
    expect(pricingSource).toContain('Other class formats are available');
    expect(pricingSource).toContain('Compare all formats');
    expect(pricingSource).not.toContain('ULTRA_PREMIUM_PRICING.map');
    expect(pricingSource).not.toContain('Most popular');
    expect(pricingSource).not.toContain('No long-term lock-in');
    expect(pricingSource).not.toContain('Easy class rescheduling');
    expect(pricingSource).not.toContain('Pause anytime between months');
    expect(pricingSource).toContain('Current scheduling, cancellation and refund terms');
  });

  it('keeps assessment reassurance factual and the closing CTA concise', () => {
    expect(reassuranceSource).toContain('Try the assessment before you decide');
    expect(reassuranceSource).toContain('No payment or enrolment commitment is required');
    expect(reassuranceSource).toContain('Recommend a starting point');
    expect(reassuranceSource).not.toContain('What parents leave the assessment with');
    expect(reassuranceSource).not.toContain('current skill level report');
    expect(reassuranceSource).not.toContain('sample practice activities');
    expect(reassuranceSource).not.toContain('Takes 2 minutes');

    expect(finalCtaSource).toContain('One clear next step');
    expect(finalCtaSource).toContain('View real class samples');
    expect(finalCtaSource).not.toContain('5000+ students');
    expect(finalCtaSource).not.toContain('Trustpilot, JustDial, and Reddit');
  });

  it('uses a wide responsive reassurance strip and nine compact homepage FAQs', () => {
    expect(reassuranceSource).toContain('max-w-6xl');
    expect(reassuranceSource).toContain('md:grid-cols-3');
    expect(reassuranceSource).toContain('lg:w-auto');

    const faqQuestionCount = (homeSource.match(/question:/g) || []).length;
    expect(faqQuestionCount).toBe(9);
    expect(journeySource).toContain('Popular parent questions');
    expect(journeySource).toContain('sm:grid-cols-2');
    expect(journeySource).toContain('xl:grid-cols-3');
    expect(journeySource).toContain('className="group h-full rounded-[20px]');
    expect(homeSource).toContain('What age group does Tiny Steps teach?');
    expect(homeSource).toContain('How much do Tiny Steps classes cost?');
    expect(homeSource).toContain('What if I need to cancel or reschedule a class?');
  });

  it('keeps mobile method content complete without duplicate pathway controls', () => {
    expect(methodSource).toContain('Desktop pathway selector. Mobile uses one card per carousel slide');
    expect(methodSource).toContain('CHILD PRACTISES');
    expect(methodSource).toContain('TEACHER GUIDANCE');
    expect(methodSource).toContain('PARENT VISIBILITY');
    expect(methodSource).toContain('openStageModal(s.id)');
  });
});
