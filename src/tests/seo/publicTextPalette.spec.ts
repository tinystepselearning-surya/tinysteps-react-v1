import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const normalTextContrast = (foreground: string, background: string) => {
  const lightness = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lightness(foreground);
  const b = lightness(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe('public Sunrise/Ocean readable text system', () => {
  it('defines dedicated text swatches instead of misusing pastel decoration fills', () => {
    const css = source('src/index.css');
    for (const declaration of [
      '--ts-sunrise-orange: #FF7A00',
      '--ts-sunrise-text-orange: #C2410C',
      '--ts-sunrise-text-ocean: #315B8A',
      '--ts-sunrise-text-purple: #604577',
      '--ts-sunrise-text-on-dark: #D3B9E1',
    ]) expect(css).toContain(declaration);
    expect(css).toContain('[data-ts-surface="public"]');
    expect(source('src/app/routes.tsx')).toContain('isProtectedAppRoute(normalizedPath)');
  });

  it('keeps label text WCAG AA readable over every approved light pastel', () => {
    const lightSurfaces = ['#FFFFFF', '#E7F3FF', '#F1EDFC', '#FFE5EB', '#FFF5DF'];
    for (const surface of lightSurfaces) {
      for (const ink of ['#17284C', '#405678', '#315B8A', '#604577']) {
        expect(normalTextContrast(ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const pastelText of ['#D3B9E1', '#F6CF7E']) {
      expect(normalTextContrast(pastelText, '#212B5C')).toBeGreaterThanOrEqual(4.5);
    }
    expect(normalTextContrast('#C2410C', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(normalTextContrast('#FF7A00', '#FFFFFF')).toBeLessThan(4.5);
  });

  it('prevents legacy orange/amber text utilities returning on high-traffic public pages', () => {
    const guarded = [
      'src/pages/HomePage.tsx',
      'src/pages/phonics.tsx',
      'src/pages/grammar.tsx',
      'src/pages/speaking.tsx',
      'src/pages/CoursesPage.tsx',
      'src/pages/PricingPage.tsx',
      'src/pages/ResourcesPage.tsx',
      'src/pages/ContactPage.tsx',
      'src/pages/FAQPage.tsx',
    ];
    for (const file of guarded) {
      expect(source(file), file).not.toMatch(/(?<![\w-])text-(?:orange|amber|yellow)-(?:50|100|200|300|400|500|600|700|800|900|950)/);
    }
  });

  it('keeps legacy Phonics buyer overrides local instead of mutating site-wide sunrise tokens', () => {
    const css = source('src/components/programs/phonicsBuyerPremium.css');
    expect(css).toContain('.ts-phonics-buyer-premium {');
    expect(css).not.toMatch(/^:root\\s*\\{/m);
    expect(css).toContain('--ts-sunrise-orange: #FF7A00');
    expect(css).toContain('--ts-sunrise-orange-deep: #C2410C');
  });

  it('keeps brand and dark-surface distinctions instead of painting everything pastel', () => {
    expect(source('src/pages/HomePage.tsx')).toContain('text-[#FF7A00]');
    expect(source('src/components/common/Header.tsx')).toContain('text-[#C2410C]');
    expect(source('src/components/common/Footer.tsx')).toContain('text-[#C2410C]');
    expect(source('src/pages/PricingPage.tsx')).toContain('text-[#D3B9E1]');
    expect(source('src/pages/grammar.tsx')).toContain('text-[#604577]');
    expect(source('src/pages/speaking.tsx')).toContain('text-[#604577]');
  });

  it('includes a whole-source read-only inventory and does not blanket change protected learning colours', () => {
    const audit = source('scripts/audit-public-text-palette.mjs');
    expect(audit).toContain('protected_and_specialised_policy');
    expect(audit).toContain('public_legacy_warm_text_file_count');
    expect(audit).toContain('--strict');
    expect(audit).not.toMatch(/firebase deploy|deleteFile|updateDoc|setDoc/);
  });
});
