import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';

const repoRoot = process.cwd();
const experiencePath = path.join(repoRoot, 'public/commercial-owner-experience.js');
const indexPath = path.join(repoRoot, 'index.html');
const experience = fs.readFileSync(experiencePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');

function readOwnerManifest() {
  const match = experience.match(/const OWNER_PATHS = Object\.freeze\(\[([\s\S]*?)\]\);/);
  expect(match, 'commercial owner UX route manifest must exist').not.toBeNull();
  return [...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

describe('Commercial owner UX consistency layer', () => {
  it('covers all and only the 14 unique C1-C3 commercial owner URLs', () => {
    expect(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).toHaveLength(14);

    const manifest = readOwnerManifest();
    expect(manifest).toHaveLength(14);
    expect(new Set(manifest).size).toBe(14);
    expect(new Set(manifest)).toEqual(new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS));
  });

  it('loads the enhancement as a deferred, non-render-blocking public asset', () => {
    expect(index).toContain('<script defer src="/commercial-owner-experience.js"></script>');
  });

  it('keeps the runtime lightweight and CWV-safe by contract', () => {
    const byteSize = Buffer.byteLength(experience, 'utf8');
    expect(byteSize).toBeLessThan(24_000);
    expect(experience).toContain('requestAnimationFrame');
    expect(experience).toContain('IntersectionObserver');
    expect(experience).toContain('requestIdleCallback');
    expect(experience).toContain('prefers-reduced-motion');
    expect(experience).toContain('{ passive: true }');
    expect(experience).toContain('transform: scaleX(0)');
    expect(experience).not.toContain('setInterval(');
    expect(experience).not.toContain('framer-motion');
    expect(experience).not.toContain('https://');
  });

  it('uses transform/opacity for reveal motion rather than layout-changing animation', () => {
    expect(experience).toContain('opacity: .88; transform: translateY(10px)');
    expect(experience).toContain('opacity: 1; transform: translateY(0)');
    expect(experience).toContain('will-change: transform');
  });

  it('does not place a competing floating conversion CTA on the booking page', () => {
    expect(experience).toContain("currentPath !== '/book-demo'");
  });

  it('contains explicit visual bridges only for the four audited legacy outliers', () => {
    for (const path of [
      '/pricing',
      '/writing-classes-for-kids',
      '/reading-fluency-program',
      '/confidence-building-program-kids',
    ]) {
      expect(experience).toContain(`data-ts-commercial-path="${path}"`);
    }
  });
});
