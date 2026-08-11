import { describe, expect, it } from 'vitest';
import {
  SEO_CANONICAL_REDIRECTS,
  normalizeSeoPath,
  resolveSeoCanonicalRedirect,
} from '../src/seoCanonicalRedirects';

const EXPECTED_REDIRECTS: Record<string, string> = {
  '/blog/child-reads-words-but-does-not-understand-story':
    '/blog/why-child-reads-words-but-does-not-understand-story',
  '/blog/how-long-does-phonics-take':
    '/blog/how-long-does-it-take-child-to-learn-phonics',
  '/blog/june-school-readiness-english-revision-plan':
    '/blog/june-school-reopening-english-readiness-plan',
  '/blog/why-child-answers-only-in-one-word':
    '/blog/child-gives-one-word-answers',
};

describe('SEO canonical redirects', () => {
  it('contains only the audited high-confidence redirect set', () => {
    expect(SEO_CANONICAL_REDIRECTS).toEqual(EXPECTED_REDIRECTS);
  });

  it('resolves canonical targets with trailing slash/query normalization', () => {
    for (const [source, target] of Object.entries(EXPECTED_REDIRECTS)) {
      expect(resolveSeoCanonicalRedirect(source)).toBe(target);
      expect(resolveSeoCanonicalRedirect(`${source}/`)).toBe(target);
      expect(resolveSeoCanonicalRedirect(`${source}?utm_source=test`)).toBe(target);
    }
  });

  it('does not redirect canonical targets or unrelated public routes', () => {
    for (const target of Object.values(EXPECTED_REDIRECTS)) {
      expect(resolveSeoCanonicalRedirect(target)).toBeNull();
    }

    expect(resolveSeoCanonicalRedirect('/phonics')).toBeNull();
    expect(resolveSeoCanonicalRedirect('/for-schools')).toBeNull();
    expect(resolveSeoCanonicalRedirect('/blog/does-cbse-include-phonics-ncf-foundational-literacy')).toBeNull();
  });

  it('normalizes only URL-path noise and preserves route identity', () => {
    expect(normalizeSeoPath('/blog/example///')).toBe('/blog/example');
    expect(normalizeSeoPath('/blog/example?x=1#section')).toBe('/blog/example');
    expect(normalizeSeoPath('/')).toBe('/');
  });
});
