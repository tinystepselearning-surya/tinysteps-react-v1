import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function runtimeLoadsClarity(pathname: string) {
  const script = indexHtml.match(
    /<!-- Microsoft Clarity: public routes only -->\s*<script[^>]*>([\s\S]*?)<\/script>\s*<!-- End Microsoft Clarity -->/i,
  )?.[1];
  if (!script) throw new Error('Clarity runtime bootstrap was not found');

  let insertedScripts = 0;
  const documentMock = {
    createElement: () => ({ async: 0, src: '' }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => { insertedScripts += 1; } } }],
  };
  const windowMock = { location: { pathname } };

  Function('window', 'document', script)(windowMock, documentMock);
  return insertedScripts === 1;
}

async function getPolicy() {
  // @ts-expect-error Node build policy is an intentionally untyped .mjs module.
  return import('../../../scripts/clarity-route-policy.mjs') as Promise<{
    CLARITY_BLOCKED_PREFIXES: string[];
    CLARITY_ALLOWED_EXACT_PATHS: string[];
    CLARITY_ALLOWED_PREFIXES: string[];
    isClarityAllowedPath: (pathname: string) => boolean;
  }>;
}

describe('Microsoft Clarity route policy', () => {
  it('allows the public games hub and public free-game routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    expect(isClarityAllowedPath('/free-english-games-for-kids')).toBe(true);
    expect(isClarityAllowedPath('/free-games/word-meaning-flashcards')).toBe(true);
    expect(isClarityAllowedPath('/games/english-excellence')).toBe(true);
    expect(runtimeLoadsClarity('/free-english-games-for-kids')).toBe(true);
  });

  it('allows public SEO landing, blog, curriculum, pricing, contact and class-sample routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    for (const route of [
      '/online-phonics-reading-classes',
      '/blog/what-is-phonics-for-kids',
      '/curriculum',
      '/pricing',
      '/contact',
      '/class-samples',
    ]) {
      expect(isClarityAllowedPath(route), route).toBe(true);
      expect(runtimeLoadsClarity(route), route).toBe(true);
    }
  });

  it('blocks admin and Surya routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    expect(isClarityAllowedPath('/admin')).toBe(false);
    expect(isClarityAllowedPath('/surya/analytics')).toBe(false);
    expect(isClarityAllowedPath('/Surya/login')).toBe(false);
    expect(runtimeLoadsClarity('/surya/analytics')).toBe(false);
  });

  it('blocks teacher routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    expect(isClarityAllowedPath('/teacher')).toBe(false);
    expect(isClarityAllowedPath('/teacher/teacher-1/students')).toBe(false);
    expect(runtimeLoadsClarity('/teacher/teacher-1/students')).toBe(false);
  });

  it('blocks parent and child routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    expect(isClarityAllowedPath('/parent/profile')).toBe(false);
    expect(isClarityAllowedPath('/parents/payments')).toBe(false);
    expect(isClarityAllowedPath('/kids/games/phonics')).toBe(false);
    expect(isClarityAllowedPath('/student/dashboard')).toBe(false);
    expect(runtimeLoadsClarity('/parent/profile')).toBe(false);
    expect(runtimeLoadsClarity('/kids/games/phonics')).toBe(false);
  });

  it('blocks authentication, payment and other protected project routes', async () => {
    const { isClarityAllowedPath } = await getPolicy();
    for (const route of [
      '/login',
      '/signup',
      '/auth/callback',
      '/account',
      '/profile',
      '/payment',
      '/payments/history',
      '/checkout',
      '/messages/thread-1',
      '/learning-partner/dashboard',
      '/learningpartner/dashboard',
      '/unauthorized',
      '/dev/comet-courier',
    ]) {
      expect(isClarityAllowedPath(route), route).toBe(false);
      expect(runtimeLoadsClarity(route), route).toBe(false);
    }
  });

  it('keeps the runtime loader asynchronous, unique and guarded by the same prefixes', async () => {
    const policySource = fs.readFileSync(path.join(repoRoot, 'scripts/clarity-route-policy.mjs'), 'utf8');
    const policy = await getPolicy();
    const loaderMatches = indexHtml.match(/https:\/\/www\.clarity\.ms\/tag\//g) || [];

    expect(loaderMatches).toHaveLength(1);
    expect(indexHtml).toContain('t.async=1');
    expect(indexHtml).not.toContain('clarity("set"');

    expect(policySource).not.toContain('clarity("set"');
    for (const route of [
      ...policy.CLARITY_BLOCKED_PREFIXES,
      ...policy.CLARITY_ALLOWED_EXACT_PATHS,
      ...policy.CLARITY_ALLOWED_PREFIXES,
    ]) {
      expect(indexHtml, route).toContain(`'${route}'`);
    }
    expect(policy.isClarityAllowedPath('/future-protected-area')).toBe(false);
    expect(runtimeLoadsClarity('/future-protected-area')).toBe(false);
  });
});
