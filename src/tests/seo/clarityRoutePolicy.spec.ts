import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const analyticsSource = fs.readFileSync(path.join(repoRoot, 'src/lib/analytics.ts'), 'utf8');

async function getPolicy() {
  // @ts-expect-error Node build policy is an intentionally untyped .mjs module.
  return import('../../../scripts/clarity-route-policy.mjs') as Promise<{
    isClarityAllowedPath: (pathname: string) => boolean;
  }>;
}

describe('Microsoft Clarity route policy', () => {
  it('allows public routes from the authoritative public route policy', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    for (const route of [
      '/',
      '/free-english-games-for-kids',
      '/free-games/word-meaning-flashcards',
      '/games/english-excellence',
      '/online-phonics-reading-classes',
      '/blog/what-is-phonics-for-kids',
      '/courses/phonics-foundation',
      '/curriculum',
      '/pricing',
      '/contact',
      '/class-samples',
    ]) {
      expect(isClarityAllowedPath(route), route).toBe(true);
    }
  });

  it('blocks private, auth, payment-sensitive and unknown routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    for (const route of [
      '/admin',
      '/surya/analytics',
      '/Surya/login',
      '/teacher/teacher-1/students',
      '/parent/profile',
      '/parents/payments',
      '/kids/games/phonics',
      '/student/dashboard',
      '/login',
      '/signup',
      '/auth/callback',
      '/messages/thread-1',
      '/learning-partner/dashboard',
      '/unauthorized',
      '/dev/comet-courier',
      '/future-protected-area',
    ]) {
      expect(isClarityAllowedPath(route), route).toBe(false);
    }
  });

  it('removes the eager HTML loader and keeps one deferred central loader', () => {
    expect(indexHtml).not.toContain('www.clarity.ms/tag/');
    expect(indexHtml).not.toContain('Microsoft Clarity: public routes only');
    expect(analyticsSource.match(/www\.clarity\.ms\/tag\//g)).toHaveLength(1);
    expect(analyticsSource).toContain("script.async = true");
    expect(analyticsSource).toContain('requestIdleCallback');
    expect(analyticsSource).toContain('isPublicAnalyticsPath');
    expect(analyticsSource).not.toContain('clarity("set"');
  });
});
