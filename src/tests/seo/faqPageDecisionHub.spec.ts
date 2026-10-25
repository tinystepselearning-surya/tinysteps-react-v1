import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { ASK_TINY_STEPS_KNOWLEDGE_SOURCES } from '../../config/askTinyStepsKnowledgeSources';

describe('FAQ parent decision hub SEO contract', () => {
  it('uses the parent-intent FAQ metadata in the shared route registry', () => {
    const faqSeo = ROUTE_SEO_REGISTRY['/faq'];

    expect(faqSeo?.title).toBe('Parent FAQ: Classes, Fees & English Learning | Tiny Steps');
    expect(faqSeo?.description).toContain('class duration');
    expect(faqSeo?.description).toContain('free assessment');
    expect(faqSeo?.canonicalPath).toBe('/faq');
    expect(faqSeo?.robots).toContain('index');
  });

  it('keeps FAQ discoverable by Ask Tiny Steps for operational parent intents', () => {
    const faqSource = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find((source) => source.id === 'faq');

    expect(faqSource).toBeDefined();
    expect(faqSource?.path).toBe('/faq');
    expect(faqSource?.enabledForAI).toBe(true);
    expect(faqSource?.retrievalPolicy).toBe('always');
    expect(faqSource?.canonicalFor).toEqual(
      expect.arrayContaining(['class duration', 'class format', 'teacher fit', 'scheduling policies']),
    );
    expect(faqSource?.tags).toEqual(
      expect.arrayContaining(['fees', 'rescheduling', 'progress', 'recordings', 'microsoft teams']),
    );
  });
  it('guarantees every completed live class recording in the visible FAQ and terms', () => {
    const faqSource = readFileSync(new URL('../../pages/FAQPage.tsx', import.meta.url), 'utf8');
    const termsSource = readFileSync(new URL('../../pages/TermsAndConditionsPage.tsx', import.meta.url), 'utf8');
    const recordingsQuestion = faqSource.match(/id: 'recordings',[\s\S]*?(?=\n  },\n  {)/)?.[0];

    expect(recordingsQuestion).toBeDefined();
    expect(recordingsQuestion).toContain('every completed live class recording is provided to parents');
    expect(recordingsQuestion).toContain('records every live class');
    expect(recordingsQuestion).toContain('mandatory part of our service');
    expect(recordingsQuestion).toContain('for every completed class');
    expect(recordingsQuestion).toContain('If a recording is missing or inaccessible');
    expect(recordingsQuestion).not.toMatch(/may provide class recordings|where a recording folder has been assigned|recordings are optional/i);

    expect(termsSource).toContain('We record every completed live class and provide its recording');
    expect(termsSource).toContain('Recordings are for private family review');
    expect(termsSource).toContain("const lastUpdated = 'October 26, 2026'");
  });

});
