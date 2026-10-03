import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const speaking = fs.readFileSync(path.join(root, 'src/pages/speaking.tsx'), 'utf8');

describe('Speaking Commercial Authority v2 — Brick 5 evidence and conversion', () => {
  it('creates one compact pre-enrolment decision rail from verified Tiny Steps surfaces', () => {
    expect(speaking).toContain('const speakingDecisionEvidence = [');
    expect(speaking).toContain('Five things parents can verify before choosing Tiny Steps Speaking');
    expect(speaking).toContain("path: '/curriculum?tab=speaking'");
    expect(speaking).toContain("path: '/class-samples'");
    expect(speaking).toContain('path: SPEAKING_PROGRESS_FRAMEWORK_PATH');
    expect(speaking).toContain("path: '/testimonials'");
    expect(speaking).toContain("path: '/pricing'");
  });

  it('uses canonical public facts for price, duration and assessment instead of inventing an offer', () => {
    expect(speaking).toContain('PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr');
    expect(speaking).toContain('PUBLIC_SESSION_DURATION_LABEL');
    expect(speaking).toContain('PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes');
    expect(speaking).toContain('{speakingClassPriceLabel} for standard live 1:1 classes. Start with a free assessment.');
    expect(speaking).toContain('The Pricing page remains the canonical source for current fees');
  });

  it('keeps real-class, progress and parent-proof evidence bounded', () => {
    expect(speaking).toContain('Watch a real class');
    expect(speaking).toContain('See how progress is measured');
    expect(speaking).toContain('Read parent evidence');
    expect(speaking).toContain('These are curated first-party comments from individual families, not a promise that another child will have the same result.');
    expect((speaking.match(/<TestimonialSnippets/g) ?? [])).toHaveLength(1);
    expect(speaking).toContain('does not guarantee a fixed improvement timeline');
  });

  it('orders detailed evidence before the pricing and assessment conversion block', () => {
    const progress = speaking.indexOf('How parents see speaking progress');
    const parentEvidence = speaking.indexOf('What speaking parents noticed first');
    const comparison = speaking.indexOf('What parents should compare before choosing speaking classes');
    const pricing = speaking.indexOf('id="pricing-and-assessment"');
    expect(progress).toBeGreaterThan(-1);
    expect(parentEvidence).toBeGreaterThan(progress);
    expect(comparison).toBeGreaterThan(parentEvidence);
    expect(pricing).toBeGreaterThan(comparison);
  });

  it('keeps the free assessment as the conversion mechanism and does not introduce a second purchase owner', () => {
    expect(speaking).toContain('Book Free Assessment');
    expect(speaking).toContain('Ready to check the right speaking path for your child?');
    expect(speaking).toContain('if another pathway fits better, the assessment should identify that before enrolment');
    expect(speaking).not.toContain('/speaking-checkout');
    expect(speaking).not.toContain('/speaking-buy');
  });

  it('adds decision-evidence semantic markup without inventing review or rating schema', () => {
    expect(speaking).toContain('const speakingDecisionEvidenceSchema = {');
    expect(speaking).toContain("name: 'What parents can inspect before enrolling in Tiny Steps Speaking'");
    expect(speaking).toContain('speakingDecisionEvidenceSchema');
    expect(speaking).not.toContain("'aggregateRating'");
    expect(speaking).not.toContain('"aggregateRating"');
  });
});
