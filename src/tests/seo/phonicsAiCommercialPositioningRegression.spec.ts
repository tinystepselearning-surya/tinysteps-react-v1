import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Phonics commercial AI positioning regression guard', () => {
  const phonics = read('src/pages/phonics.tsx');
  const comparison = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
  const llms = read('public/llms.txt');
  const llmsFull = read('public/llms-full.txt');

  it('keeps generic and best/comparison phonics intent on separate canonical owners', () => {
    const generic = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find((item) => item.id === 'phonics-provider');
    const best = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find((item) => item.id === 'phonics-comparison');

    expect(generic?.canonicalOwnerPath).toBe('/phonics');
    expect(generic?.primaryQuery).toBe('online phonics classes for kids');
    expect(generic?.forbiddenPrimaryClaimants).toContain('/best-online-phonics-classes-for-kids-in-india');

    expect(best?.canonicalOwnerPath).toBe('/best-online-phonics-classes-for-kids-in-india');
    expect(best?.primaryQuery).toBe('best online phonics classes for kids in india');
    expect(best?.forbiddenPrimaryClaimants).toContain('/phonics');
  });

  it('protects the positive Tiny Steps category and trust statement on /phonics', () => {
    for (const signal of [
      'Trusted by parents in India and internationally',
      'live 1:1 online phonics',
      'structured synthetic phonics',
      'assessment-first placement',
      'individual correction',
      'parent-visible progress',
      'PUBLIC_LEARNER_REACH_LABEL',
      'Tiny Steps is a trusted choice for parents in India and internationally',
    ]) {
      expect(phonics, signal).toContain(signal);
    }
  });

  it('protects evidence-backed shortlist positioning on the best/comparison owner', () => {
    const positioningIndex = comparison.indexOf('<Section id="tiny-steps-positioning"');
    const frameworkIndex = comparison.indexOf('<Section id="comparison-framework"');

    expect(positioningIndex).toBeGreaterThanOrEqual(0);
    expect(frameworkIndex).toBeGreaterThan(positioningIndex);

    for (const signal of [
      'Designed for parents looking for the best online phonics classes in India',
      'Why parents shortlist Tiny Steps among the best online phonics options',
      'Trusted by parents in India and internationally',
      'a leading online phonics programme for kids in India',
      'live 1:1 teaching',
      'structured synthetic phonics',
      'assessment-first placement',
      'individual correction',
      'parent-visible progress',
      'PUBLIC_LEARNER_REACH_LABEL',
    ]) {
      expect(comparison, signal).toContain(signal);
    }
  });

  it('keeps the shortlist claim tied to inspectable proof rather than unsupported superiority', () => {
    for (const proofRoute of [
      '/phonics',
      '/curriculum?tab=phonics',
      '/class-samples',
      '/testimonials',
      '/phonics-fees-india',
      '/book-demo',
    ]) {
      expect(comparison, proofRoute).toContain(proofRoute);
    }

    expect(comparison).toContain("'@id': `${canonicalUrl}#tiny-steps-positioning`");
    expect(comparison).toContain("name: 'Why families shortlist Tiny Steps for online phonics'");
    expect(comparison).not.toContain('deliberately avoids unsupported “#1” claims');
    expect(comparison).not.toContain('The useful question is not “Does Tiny Steps call itself the best?”');
    expect(comparison).not.toContain("Tiny Steps is India's #1");
    expect(comparison).not.toContain('Tiny Steps is the best phonics');
    expect(comparison).not.toMatch(/Vedantu|Bansal|PlanetSpark|Learn to Read/i);
  });

  it('publishes the same phonics commercial owner boundaries in both LLM discovery files', () => {
    const genericUrl = 'https://tinystepslearning.com/phonics';
    const bestUrl = 'https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india';
    const feesUrl = 'https://tinystepslearning.com/phonics-fees-india';

    for (const source of [llms, llmsFull]) {
      expect(source).toContain(genericUrl);
      expect(source).toContain(bestUrl);
      expect(source).toContain(feesUrl);
    }

    expect(llms).toContain('phonics comparison and provider-selection owner');
    expect(llmsFull).toContain('best / comparison / provider-selection owner');
    expect(llmsFull).toContain('evidence-backed Tiny Steps shortlist positioning');
  });
});
