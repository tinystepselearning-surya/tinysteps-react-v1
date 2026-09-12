import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getPhonicsPracticeCapabilityByPath,
} from '../../lib/phonicsPracticeCapabilityRegistry';

const root = process.cwd();
const tracingOwnerPath = '/free-letter-tracing-game-for-kids';
const soundTracingPath = '/letter-tracing-with-sounds-game';

const tracingSource = () => fs.readFileSync(
  path.join(root, 'src/pages/public/FreeLetterTracingGamePage.tsx'),
  'utf8',
);

const soundTracingSource = () => fs.readFileSync(
  path.join(root, 'src/pages/public/LetterTracingWithSoundsGamePage.tsx'),
  'utf8',
);

describe('SEO recovery Brick 7 tracing authority', () => {
  it('keeps the generic ABC/alphabet tracing URL as the primary tracing owner', () => {
    const source = tracingSource();
    const registry = fs.readFileSync(path.join(root, 'src/lib/routeSeoRegistry.js'), 'utf8');

    expect(source).toContain("const PAGE_PATH = '/free-letter-tracing-game-for-kids'");
    expect(source).toContain('Free ABC Tracing Game for Kids');
    expect(source).toContain('Alphabet Letter Tracing Online');
    expect(source).toContain('Practice letter tracing A to Z');
    expect(registry).toContain("'/free-letter-tracing-game-for-kids': {");
    expect(registry).toContain("canonicalPath: '/free-letter-tracing-game-for-kids'");
  });

  it('keeps sound-supported tracing on its own distinct self-canonical URL', () => {
    const source = soundTracingSource();
    const registry = fs.readFileSync(path.join(root, 'src/lib/routeSeoRegistry.js'), 'utf8');

    expect(source).toContain("const PAGE_PATH = '/letter-tracing-with-sounds-game'");
    expect(source).toContain('Letter Tracing With Sounds Game for Kids | Phonics Practice');
    expect(source).toContain('connect each letter with its sound');
    expect(registry).toContain("'/letter-tracing-with-sounds-game': {");
    expect(registry).toContain("canonicalPath: '/letter-tracing-with-sounds-game'");
  });

  it('protects the educational boundary between tracing and decoding', () => {
    const tracingCapability = getPhonicsPracticeCapabilityByPath(tracingOwnerPath);
    const soundCapability = getPhonicsPracticeCapabilityByPath(soundTracingPath);

    expect(tracingCapability?.kind).toBe('tracing');
    expect(tracingCapability?.learningBoundary).toContain('letter-form familiarity');
    expect(tracingCapability?.learningBoundary).toContain('not evidence');

    expect(soundCapability?.kind).toBe('tracing');
    expect(soundCapability?.learningBoundary).toContain('connects print and sound');
    expect(soundCapability?.learningBoundary).toContain('feed into blending');
  });

  it('builds the tracing-to-reading authority path without creating another tracing page', () => {
    const source = tracingSource();

    expect(source).toContain('Letter formation → sounds → blending → reading');
    for (const route of [
      '/letter-tracing-with-sounds-game',
      '/blog/satpin-phonics-guide',
      '/free-word-building-game-for-kids',
      '/phonics',
      '/book-demo',
    ]) {
      expect(source).toContain(route);
    }
  });

  it('makes the sound-enabled tracing page feed into blending rather than compete for generic tracing', () => {
    const source = soundTracingSource();

    expect(source).toContain('Move from sound recall into blending');
    expect(source).toContain('/blog/satpin-phonics-guide');
    expect(source).toContain('/free-word-building-game-for-kids');
    expect(source).toContain('/blog/why-child-knows-letter-sounds-but-cannot-read-words');
    expect(source).toContain('/free-letter-tracing-game-for-kids');
    expect(source).toContain('/phonics');
    expect(source).toContain('Not by itself.');
  });

  it('keeps both tracing resources indexable in the public route and sitemap architecture', () => {
    const manifest = fs.readFileSync(path.join(root, 'src/lib/publicRouteManifest.js'), 'utf8');
    const sitemapGenerator = fs.readFileSync(path.join(root, 'scripts/generate-sitemaps.js'), 'utf8');

    for (const route of [tracingOwnerPath, soundTracingPath]) {
      expect(manifest).toContain(`route('${route}', 'static')`);
      expect(sitemapGenerator).toContain(`'${route}'`);
    }
  });
});
