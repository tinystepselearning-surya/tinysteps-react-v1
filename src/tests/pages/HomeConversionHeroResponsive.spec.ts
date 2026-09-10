import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Homepage conversion hero cross-platform layout', () => {
  it('bundles the brand fonts so Windows and macOS use identical font metrics', () => {
    const main = read('src/main.tsx');
    const tailwind = read('tailwind.config.cjs');

    expect(main).toContain("@fontsource-variable/inter/wght.css");
    expect(main).toContain("@fontsource/poppins/latin-900.css");
    expect(tailwind).toContain("heading: ['Poppins', 'Arial', 'sans-serif']");
    expect(tailwind).toContain("body: ['\"Inter Variable\"', 'Inter', '\"Segoe UI\"', 'Arial', 'sans-serif']");
  });

  it('keeps the desktop headline on two intentional lines at compact laptop widths', () => {
    const hero = read('src/components/Home/ConversionHero.tsx');

    expect(hero).toContain('data-hero-line="online-english"');
    expect(hero).toContain('data-hero-line="classes-for-kids"');
    expect(hero.match(/lg:whitespace-nowrap/g) ?? []).toHaveLength(2);
    expect(hero).toContain('lg:text-[clamp(3.5rem,5.35vw,4.65rem)]');
    expect(hero).not.toContain('lg:text-[5.6rem]');
  });

  it('allows both desktop grid columns to shrink without content overflow', () => {
    const hero = read('src/components/Home/ConversionHero.tsx');

    expect(hero).toContain('lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]');
    expect(hero.match(/min-w-0/g) ?? []).toHaveLength(2);
  });
});
