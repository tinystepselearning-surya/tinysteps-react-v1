import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Verify that /online-phonics-reading-classes is a 301 redirect to /phonics
 * 
 * Rationale: /phonics is the canonical authority page for phonics courses.
 * /online-phonics-reading-classes was a duplicate landing page.
 * To avoid duplicate content penalties, it should permanently redirect.
 */
describe('SEO: /online-phonics-reading-classes redirect behavior', () => {
  const repoRoot = path.resolve(__dirname, '../../..');

  it('is configured as a 301 Firebase redirect to /phonics', () => {
    const firebaseJsonPath = path.join(repoRoot, 'firebase.json');
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf-8'));
    const redirects = firebaseConfig.hosting.redirects as Array<{
      source?: string;
      destination?: string;
      type?: number;
    }>;
    const redirect = redirects.find((r) => r.source === '/online-phonics-reading-classes');
    expect(redirect).toBeDefined();
    expect(redirect?.destination).toBe('/phonics');
    expect(redirect?.type).toBe(301);
  });

  it('has canonicalPath pointing to /phonics in routeSeoRegistry', async () => {
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const config = ROUTE_SEO_REGISTRY['/online-phonics-reading-classes'] as any;
    expect(config).toBeDefined();
    expect(config?.canonicalPath).toBe('/phonics');
  });

  it('points to /phonics and is marked noindex', async () => {
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const config = ROUTE_SEO_REGISTRY['/online-phonics-reading-classes'] as any;

    expect(config?.canonicalPath).toBe('/phonics');
    expect(config?.robots).toMatch(/\bnoindex\b/i);
  });

  it('maintains title and description for the 301 redirect page', async () => {
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const config = ROUTE_SEO_REGISTRY['/online-phonics-reading-classes'] as any;
    // User sees these tags during the redirect process
    expect(config?.title).toBeTruthy();
    expect(config?.description).toBeTruthy();
    expect(config?.title).toContain('Phonics');
  });

  it('is not listed as a core page in llms.txt', () => {
    const llmsPath = path.join(repoRoot, 'public/llms.txt');
    const llmsContent = fs.readFileSync(llmsPath, 'utf-8');
    expect(llmsContent).not.toContain('online-phonics-reading-classes');
  });
});
