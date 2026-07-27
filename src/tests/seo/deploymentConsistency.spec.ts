import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error The route policy is shared with Node scripts and intentionally authored as ESM JavaScript.
import { PUBLIC_REDIRECT_MANIFEST } from '../../lib/publicRouteManifest.js';
// @ts-expect-error Build tooling is intentionally authored as an executable ESM module.
import { resolveBuildIdentity } from '../../../scripts/write-build-info.mjs';
// @ts-expect-error Deployment verification is intentionally authored as an executable ESM module.
import { parseArgs, verifyLiveDeployment } from '../../../scripts/verify-live-deployment.mjs';

const root = process.cwd();

describe('deployment consistency guardrails', () => {
  it('keeps Firebase, notification and native bootstraps out of the public root module', () => {
    const appSource = fs.readFileSync(path.join(root, 'src/app.tsx'), 'utf8');
    const headerSource = fs.readFileSync(path.join(root, 'src/components/common/Header.tsx'), 'utf8');
    expect(appSource).not.toContain("from './hooks/useAuth'");
    expect(appSource).not.toContain("from './components/common/AuthBootstrap'");
    expect(appSource).not.toContain("from './lib/nativeAuthDiagnostics'");
    expect(appSource).not.toContain("from './lib/notificationBadgeSync'");
    expect(appSource).toContain("lazy(");
    expect(appSource).toContain("import('./components/runtime/ProtectedRuntimeBootstrap')");
    expect(headerSource).not.toContain("import { performAppLogout }");
    expect(headerSource).toContain("await import('../../lib/auth')");
  });

  it('creates a non-sensitive build identity from the expected commit', () => {
    const identity = resolveBuildIdentity({
      cwd: root,
      env: { GITHUB_SHA: 'a'.repeat(40) },
      now: new Date('2026-07-27T12:00:00.000Z'),
    });
    expect(identity).toEqual({
      gitSha: 'a'.repeat(40),
      buildTimestamp: '2026-07-27T12:00:00.000Z',
      applicationVersion: '1.0.0',
    });
    expect(JSON.stringify(identity)).not.toMatch(/secret|token|key/i);
  });

  it('requires all live verification CLI arguments', () => {
    expect(parseArgs([
      '--origin', 'https://tinystepslearning.com/',
      '--expected-sha', 'b'.repeat(40),
      '--report', 'artifacts/live.md',
    ])).toEqual({
      origin: 'https://tinystepslearning.com',
      expectedSha: 'b'.repeat(40),
      report: 'artifacts/live.md',
    });
    expect(() => parseArgs(['--origin', 'https://example.com'])).toThrow('--expected-sha');
  });

  it('parses and passes a complete HTTP-level deployment fixture', async () => {
    const origin = 'https://tinystepslearning.com';
    const sha = 'c'.repeat(40);
    const legalHtml = '<title>Terms and Conditions | Tiny Steps Learning</title><link rel="canonical" href="https://tinystepslearning.com/terms-and-conditions"><meta name="robots" content="noindex, follow"><h1>Terms and Conditions</h1>';
    const homepageHtml = '<title>Tiny Steps</title><link rel="canonical" href="https://tinystepslearning.com/"><meta name="robots" content="index, follow"><h1>Online English Classes for Kids</h1>';
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const redirect = PUBLIC_REDIRECT_MANIFEST.find(
        (entry: { source: string; destination: string; status: number }) => entry.source === url.pathname,
      );
      if (redirect) {
        return new Response('', {
          status: redirect.status,
          headers: { location: redirect.destination },
        });
      }
      if (url.pathname === '/terms-and-conditions') return new Response(legalHtml, { status: 200 });
      if (url.pathname === '/sitemap.xml') {
        return new Response('<sitemapindex><sitemap><loc>https://tinystepslearning.com/sitemap-static.xml</loc></sitemap></sitemapindex>');
      }
      if (url.pathname === '/sitemap-static.xml') {
        return new Response('<urlset><url><loc>https://tinystepslearning.com/</loc></url></urlset>');
      }
      if (url.pathname === '/build-info.json') {
        return new Response(JSON.stringify({ gitSha: sha }), { status: 200 });
      }
      if (url.pathname.startsWith('/__deployment-verification-404-')) {
        return new Response('Not found', { status: 404, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      }
      if (['/parent', '/teacher', '/kids/games/english-excellence'].includes(url.pathname)) {
        return new Response('<title>App</title>', { status: 200, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      }
      if (url.pathname === '/') return new Response(homepageHtml, { status: 200 });
      throw new Error(`Unexpected fixture URL: ${url}`);
    });

    const result = await verifyLiveDeployment({
      origin,
      expectedSha: sha,
      fetchImpl: fetchMock as typeof fetch,
    });
    expect(result.passed).toBe(true);
    expect(result.assertions.find((assertion: { name: string; pass: boolean }) => assertion.name === 'redirect /terms')?.pass).toBe(true);
    expect(result.assertions.find((assertion: { name: string; pass: boolean }) => assertion.name === 'deployed build identity')?.pass).toBe(true);
    expect(result.assertions.find((assertion: { name: string; pass: boolean }) => assertion.name === 'genuine unknown-route 404')?.pass).toBe(true);
  });

  it('keeps the legal page free of obsolete homepage offer strings', () => {
    const legalSource = fs.readFileSync(path.join(root, 'src/pages/TermsAndConditionsPage.tsx'), 'utf8');
    for (const stale of ['3500+ learners', '9+ countries', '₹3,360', '₹6,440', '₹9,240']) {
      expect(legalSource).not.toContain(stale);
    }
  });
});
