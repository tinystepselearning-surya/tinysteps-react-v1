import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_FULL_DESCRIPTION,
  STANDARD_PRICING_SUMMARY,
} from '../../config/publicOffer';
import { PER_CLASS_PRICE } from '../../config/pricing';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const pricing = read('src/pages/PricingPage.tsx');
const testimonials = read('src/pages/TestimonialsPage.tsx');
const classSamples = read('src/pages/ClassSamplesPage.tsx');
const bookDemo = read('src/pages/public/BookDemoPage.tsx');
const phonicsFees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');

describe('Phonics Brick 6 conversion-evidence guardrails', () => {
  it('keeps pricing grounded in canonical public offer configuration', () => {
    expect(PER_CLASS_PRICE).toBe(400);
    expect(FREE_DEMO_DURATION_MINUTES).toBe(35);
    expect(STANDARD_PRICING_SUMMARY).toContain('₹400 per class');
    expect(FREE_DEMO_FULL_DESCRIPTION).toContain('before enrolment');

    for (const token of [
      'STANDARD_PRICING_SUMMARY',
      'ONE_TO_ONE_MONTHLY_PACKAGES',
      'GROUP_MONTHLY_FEES',
      'ULTRA_PREMIUM_PRICING',
      'What is included?',
      'How to choose the right plan',
      'to="/book-demo"',
    ]) {
      expect(pricing, token).toContain(token);
    }
  });

  it('keeps /pricing as the general price owner and /phonics-fees-india as the phonics-fee explainer', () => {
    expect(pricing).toContain("getRouteConfig('/pricing')");
    expect(pricing).toContain('Transparent Pricing for Premium 1:1 English Classes');
    expect(phonicsFees).toContain("canonicalPath: '/phonics-fees-india'");
    expect(phonicsFees).toContain('Phonics Class Fees in India');
    expect(phonicsFees).toContain('to="/phonics"');
    expect(pricing).not.toContain("canonicalPath: '/phonics-fees-india'");
  });

  it('makes testimonial evidence explicitly first-party, curated and non-guaranteed', () => {
    expect(testimonials).toContain('curated first-party parent feedback excerpts');
    expect(testimonials).toContain('not as a guarantee');
    expect(testimonials).toContain('They are not universal claims about every learner.');
    expect(testimonials).toContain('How to use parent feedback before you decide');
    expect(testimonials).toContain('Themes parents describe in these reviews');

    for (const destination of ['/class-samples', '/curriculum', '/pricing', '/book-demo']) {
      expect(testimonials, destination).toContain(`to="${destination}"`);
    }

    // Keep self-serving first-party feedback out of Review/AggregateRating structured data.
    expect(testimonials).not.toContain("'@type': 'Review'");
    expect(testimonials).not.toContain("'@type': 'AggregateRating'");
  });

  it('keeps real class samples as observable teaching evidence rather than outcome proof', () => {
    for (const token of [
      'Real Class Moments',
      'What parents can observe in our classes',
      'Child participation, not passive watching',
      'Gentle correction and guided practice',
      'What a Tiny Steps class usually includes',
      'every clip on this page is shared with parent consent',
      'VideoObject',
      'ItemList',
    ]) {
      expect(classSamples, token).toContain(token);
    }
  });

  it('turns the free demo into a verification step instead of an enrolment-pressure step', () => {
    expect(bookDemo).toContain("getRouteConfig('/book-demo')");
    expect(bookDemo).toContain('You do not need to decide during the demo.');
    expect(bookDemo).toContain('What to confirm before you enrol');
    expect(bookDemo).toContain('The demo is for clarity, not a rushed purchase.');
    expect(bookDemo).toContain('Does the demo guarantee progress or a particular result?');
    expect(bookDemo).toContain('no specific result is guaranteed');

    for (const destination of ['/class-samples', '/testimonials', '/curriculum', '/pricing']) {
      expect(bookDemo, destination).toContain(`to="${destination}"`);
    }
  });

  it('connects demo structured data to the canonical Tiny Steps entity and decision checklist', () => {
    for (const token of [
      "'@id': ORGANIZATION_ID",
      "'@id': `${bookDemoCanonicalUrl}#assessment-service`",
      "'@id': `${bookDemoCanonicalUrl}#decision-checklist`",
      "'@type': 'Service'",
      "'@type': 'ItemList'",
      'createWebPageSchema',
      "'@type': 'BreadcrumbList'",
    ]) {
      expect(bookDemo, token).toContain(token);
    }
  });

  it('protects the four-part decision evidence path without adding a new route', () => {
    for (const page of [testimonials, bookDemo]) {
      expect(page).not.toMatch(/scientifically proven|clinically proven|guaranteed results?|learning styles?/i);
    }

    const routes = read('src/app/routes.tsx');
    for (const route of ['pricing', 'testimonials', 'class-samples', 'book-demo']) {
      expect(routes).toContain(`path: '${route}'`);
    }

    expect(routes).not.toContain("path: 'conversion-evidence'");
    expect(routes).not.toContain("path: 'phonics-conversion-evidence'");
  });
});
