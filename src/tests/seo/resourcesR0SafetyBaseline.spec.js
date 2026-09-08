import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  RESOURCE_CTA_POLICIES,
  RESOURCE_COMMERCIAL_READINESS,
  RESOURCE_ECOSYSTEM_REGISTRY,
  RESOURCE_PERFORMANCE_PRIORITY_PATHS,
  RESOURCE_SEARCH_INTENTS,
} from '../../lib/resourcesArchitectureRegistry.js';

describe('Resources architecture R0 safety baseline', () => {
  it('keeps semantic registry paths unique and classifications valid', () => {
    const paths = RESOURCE_ECOSYSTEM_REGISTRY.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);

    for (const item of RESOURCE_ECOSYSTEM_REGISTRY) {
      expect(RESOURCE_SEARCH_INTENTS).toContain(item.primaryIntent);
      expect(RESOURCE_CTA_POLICIES).toContain(item.ctaPolicy);
      expect(RESOURCE_COMMERCIAL_READINESS).toContain(item.commercialReadiness);
    }
  });

  it('protects the Brick 2 /resources gateway while subject hubs remain planned', () => {
    const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));

    expect(byPath.get('/resources')).toMatchObject({
      currentState: 'route',
      pageFamily: 'learning-resource-gateway',
      protection: 'protected',
    });

    for (const path of ['/resources/phonics', '/resources/grammar', '/resources/speaking']) {
      expect(byPath.get(path)).toMatchObject({ currentState: 'planned', protection: 'planned' });
    }
  });

  it('protects the existing ecosystem instead of duplicating it under /resources', () => {
    const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((item) => [item.path, item]));
    for (const path of [
      '/phonics',
      '/grammar',
      '/speaking',
      '/parents',
      '/for-schools',
      '/free-english-games-for-kids',
      '/blog',
    ]) {
      expect(byPath.get(path)?.protection).toBe('protected');
    }

    expect(byPath.has('/resources/parents')).toBe(false);
    expect(byPath.has('/resources/games')).toBe(false);
    expect(byPath.has('/resources/schools')).toBe(false);
    expect(byPath.has('/resources/blog')).toBe(false);
  });

  it('includes every required pre-change performance priority path', () => {
    for (const path of [
      '/resources',
      '/blog',
      '/phonics',
      '/grammar',
      '/speaking',
      '/parents',
      '/for-schools',
      '/free-english-games-for-kids',
      '/book-demo',
    ]) {
      expect(RESOURCE_PERFORMANCE_PRIORITY_PATHS).toContain(path);
    }
  });

  it('passes the executable structural R0 audit without account-bound analytics files', () => {
    expect(() => {
      execFileSync(process.execPath, ['scripts/audit-resources-r0.mjs'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
    }).not.toThrow();
  });
});
