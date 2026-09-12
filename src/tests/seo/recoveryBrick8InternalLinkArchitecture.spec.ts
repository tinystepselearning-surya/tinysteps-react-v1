import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SEO_RECOVERY_BRICK8_AUTHORITY_PATHS,
  SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS,
  isSeoRecoveryRetiredInternalHref,
  normalizeSeoRecoveryInternalHref,
} from '../../config/seoRecoveryBrick8InternalLinks';
import { blogPosts } from '../../content/blog';
import { cleanBlogText } from '../../content/blog/shared/editorialCleanup';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('SEO recovery Brick 8 internal-link architecture', () => {
  it('locks the main authority destinations used by the recovery programme', () => {
    expect(SEO_RECOVERY_BRICK8_AUTHORITY_PATHS).toMatchObject({
      phonicsProgramme: '/phonics',
      phonicsComparison: '/best-online-phonics-classes-for-kids-in-india',
      phonicsFees: '/phonics-fees-india',
      phonicsAssessment: '/book-demo',
      satpinMaster: '/blog/satpin-phonics-guide',
      satpinHomePractice: '/blog/phonics-satpin-launch',
      parentDecodingDiagnostic: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      tracingOwner: '/free-letter-tracing-game-for-kids',
      tracingWithSounds: '/letter-tracing-with-sounds-game',
      wordBuildingPractice: '/free-word-building-game-for-kids',
    });
  });

  it('normalizes retired internal URLs directly to current owners while preserving suffixes', () => {
    for (const [retiredPath, canonicalPath] of Object.entries(SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS)) {
      expect(isSeoRecoveryRetiredInternalHref(retiredPath)).toBe(true);
      expect(normalizeSeoRecoveryInternalHref(retiredPath)).toBe(canonicalPath);
      expect(normalizeSeoRecoveryInternalHref(`${retiredPath}?utm_source=internal#section`)).toBe(
        `${canonicalPath}?utm_source=internal#section`,
      );
    }
  });

  it('normalizes retired Markdown links before blog content is rendered', () => {
    expect(
      cleanBlogText('[Compare phonics providers](/blog/how-to-choose-phonics-classes)'),
    ).toBe(
      '[Compare phonics providers](/best-online-phonics-classes-for-kids-in-india)',
    );

    expect(
      cleanBlogText('[Why sounds are not becoming words](/blog/child-knows-letter-sounds-but-cannot-read)'),
    ).toBe(
      '[Why sounds are not becoming words](/blog/why-child-knows-letter-sounds-but-cannot-read-words)',
    );
  });

  it('keeps every rendered blog-body link off the Brick 8 retired URL set', () => {
    const retiredPaths = Object.keys(SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS);

    for (const post of blogPosts) {
      const renderedBody = post.body.map((block) => String(block.content || '')).join('\n');
      for (const retiredPath of retiredPaths) {
        expect(renderedBody, `${post.slug} still renders retired internal path ${retiredPath}`).not.toContain(retiredPath);
      }
    }
  });

  it('keeps phonics cluster navigation on live owners and avoids current-page self-links', () => {
    const clusterNav = read('src/components/programs/ClusterSeoNav.tsx');

    expect(clusterNav).toContain("href: '/best-online-phonics-classes-for-kids-in-india'");
    expect(clusterNav).toContain("label: 'Compare Online Phonics Classes'");
    expect(clusterNav).not.toContain("href: '/blog/how-to-choose-phonics-classes'");
    expect(clusterNav).toContain('link.href !== normalizedPath');
    expect(clusterNav).toContain('data.hubHref !== normalizedPath');
  });

  it('preserves the intended support-to-owner pathways across the priority authority pages', () => {
    const satpin = read('src/content/blog/posts/phonics/satpin-phonics-guide.ts');
    const diagnostic = read(
      'src/content/blog/posts/parent-tips/why-child-knows-letter-sounds-but-cannot-read-words.ts',
    );
    const tracing = read('src/pages/public/FreeLetterTracingGamePage.tsx');
    const tracingWithSounds = read('src/pages/public/LetterTracingWithSoundsGamePage.tsx');

    expect(satpin).toContain('/phonics');
    expect(diagnostic).toContain('/phonics');
    expect(diagnostic).toContain('/book-demo');

    for (const target of [
      '/letter-tracing-with-sounds-game',
      '/blog/satpin-phonics-guide',
      '/free-word-building-game-for-kids',
      '/phonics',
    ]) {
      expect(tracing).toContain(target);
    }

    for (const target of [
      '/blog/satpin-phonics-guide',
      '/free-word-building-game-for-kids',
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/phonics',
    ]) {
      expect(tracingWithSounds).toContain(target);
    }
  });
});
