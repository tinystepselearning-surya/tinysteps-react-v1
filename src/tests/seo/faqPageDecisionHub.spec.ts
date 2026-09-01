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
});
