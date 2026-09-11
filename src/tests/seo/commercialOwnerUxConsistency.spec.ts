import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';

const repoRoot = process.cwd();
const experiencePath = path.join(repoRoot, 'public/commercial-owner-experience.js');
const indexPath = path.join(repoRoot, 'index.html');
const experience = fs.readFileSync(experiencePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');

describe('Commercial owner UX consistency layer', () => {
  it('covers every unique C1-C3 commercial owner exactly once', () => {
    expect(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).toHaveLength(14);

    for (const ownerPath of COMMERCIAL_C3_UNIQUE_OWNER_PATHS) {
      const escaped = ownerPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = experience.match(new RegExp(`['\"]${escaped}['\"]`, 'g')) ?? [];
      expect(matches, `${ownerPath} must appear once in the commercial UX route manifest`).toHaveLength(1);
    }
  });

  it('loads the enhancement as a deferred, non-blocking public asset', () => {
    expect(index).toContain('<script defer src="/commercial-owner-experience.js"></script>');
  });

  it('keeps the runtime lightweight and CWV-safe by contract', () => {
    const byteSize = Buffer.byteLength(experience, 'utf8');
    expect(byteSize).toBeLessThan(16_000);
    expect(experience).toContain('requestAnimationFrame');
    expect(experience).toContain('IntersectionObserver');
    expect(experience).toContain("prefers-reduced-motion: reduce");
    expect(experience).toContain("{ passive: true }");
    expect(experience).toContain('transform: scaleX(0)');
    expect(experience).not.toContain('setInterval(');
    expect(experience).not.toContain('framer-motion');
    expect(experience).not.toContain('https://');
  });

  it('does not place a competing floating conversion CTA on the booking page', () => {
    expect(experience).toContain("currentPath !== '/book-demo'");
  });

  it('contains explicit legacy bridges only for identified visual outliers', () => {
    expect(experience).toContain('data-ts-commercial-path="/pricing"');
    expect(experience).toContain('data-ts-commercial-path="/writing-classes-for-kids"');
  });
});
