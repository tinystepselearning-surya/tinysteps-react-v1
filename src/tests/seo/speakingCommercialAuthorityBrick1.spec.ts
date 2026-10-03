import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const speaking = fs.readFileSync(path.join(root, 'src/pages/speaking.tsx'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'src/lib/routeSeoRegistry.js'), 'utf8');
const c4 = fs.readFileSync(path.join(root, 'src/lib/commercialC4CtrOptimization.ts'), 'utf8');

describe('Speaking Commercial Authority v2 — Brick 1 acquisition layer', () => {
  it('makes /speaking explicitly own the online public-speaking commercial intent', () => {
    expect(speaking).toContain("const seoTitle = 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps';");
    expect(speaking).toContain('Online Public Speaking Classes for Kids');
    expect(speaking).toContain("const canonicalPath = '/speaking';");
    expect((speaking.match(/<h1\\b/g) ?? [])).toHaveLength(1);
  });

  it('surfaces verified commercial facts above the fold', () => {
    expect(speaking).toContain('speakingAgeRangeLabel');
    expect(speaking).toContain('speakingClassPriceLabel');
    expect(speaking).toContain('PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr');
    expect(speaking).toContain('PUBLIC_SESSION_DURATION_LABEL');
    expect(speaking).toContain('Book Free Assessment');
    expect(speaking).toContain('Watch a Real Class');
    expect(speaking).toContain('View Curriculum');
    expect(speaking).toContain('Parent progress updates');
  });

  it('keeps the route registry aligned with the live-page acquisition snippet', () => {
    expect(registry).toContain("title: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(registry).toContain('₹400/class; free 35-minute assessment.');
    expect(registry).toContain("canonicalPath: '/speaking'");
  });

  it('preserves the historical C4 control and records the new Speaking override explicitly', () => {
    expect(c4).toContain("title: 'Public Speaking & Communication Classes for Kids | Tiny Steps'");
    expect(c4).toContain('COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES');
    expect(c4).toContain("title: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(c4).toContain("authorizedOn: '2026-10-03'");
    expect(c4).toContain("initiative: 'speaking-commercial-authority-v2'");
  });

  it('keeps Brick 1 acquisition assertions independent of later content bricks', () => {
    expect(speaking).toContain('Book Free Assessment');
    expect(speaking).toContain('Watch a Real Class');
    expect(speaking).toContain('View Curriculum');
    expect(speaking).toContain('speakingAgeRangeLabel');
    expect(speaking).toContain('speakingClassPriceLabel');
  });
});
