import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');
const grammar = read('src/pages/grammar.tsx');
const speaking = read('src/pages/speaking.tsx');
const phonics = read('src/pages/phonics.tsx');
const snapshot = read('src/components/programs/ProgrammeHeroSnapshot.tsx');
const boundary = read('src/components/programs/ProgrammeIntentBoundary.tsx');
const teaching = read('src/components/programs/ResponsiveTeachingSection.tsx');
const commercialUx = read('public/commercial-owner-experience.js');

describe('Premium commercial UX for Reading, Grammar and Speaking', () => {
  it('uses one premium visual system across the three non-Phonics owners', () => {
    expect(reading).toContain('variant="reading"');
    expect(grammar).toContain('variant="grammar"');
    for (const source of [reading, grammar]) {
      expect(source).toContain('bg-[#fbfbfd]');
      expect(source).toContain('title="What this programme builds"');
      expect(source).toContain('ProgrammeIntentBoundary');
    }

    expect(speaking).toContain('bg-[#fbfbfd]');
    expect(speaking).toContain('ProgrammeIntentBoundary');
    expect(speaking).toContain('/blog/hero-families/Tiny_Steps_Speaking.webp');
    expect(speaking).toContain("lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]");
    expect(speaking).not.toContain('appearance="glass-overlay"');

    expect(snapshot).toContain("variant?: 'reading' | 'grammar' | 'speaking'");
    expect(snapshot).toContain('data-premium-programme-visual={variant}');
    expect(snapshot).toContain('Read → understand → explain');
    expect(snapshot).toContain('Notice → correct → apply');
    expect(snapshot).toContain('Think → organise → speak');
  });

  it('keeps the visual upgrade lightweight and component-driven', () => {
    expect(snapshot).toContain("from 'lucide-react'");
    expect(snapshot).not.toContain('<img');
    expect(snapshot).not.toContain('https://');
    expect(boundary).toContain('Use another pathway when');
    expect(teaching).toContain("appearance?: 'default' | 'premium'");
    expect(grammar).toContain('appearance="premium"');
    expect(speaking).toContain('appearance="premium"');
  });

  it('preserves the default teaching appearance for Phonics', () => {
    expect(phonics).toContain('<ResponsiveTeachingSection');
    expect(phonics).not.toContain('appearance="premium"');
    expect(teaching).toContain("appearance = 'default'");
  });

  it('keeps Phonics out of the three-page floating CTA suppression', () => {
    expect(commercialUx).toContain(
      "const DESKTOP_CTA_DISABLED_PATHS = new Set(['/reading-classes-for-kids', '/grammar', '/speaking'])",
    );
    expect(commercialUx).not.toContain("DESKTOP_CTA_DISABLED_PATHS = new Set(['/phonics'");
  });

  it('keeps each page compact without removing its decision-critical owner boundary', () => {
    expect(reading).toContain('This Reading pathway begins after the phonics decision.');
    expect(reading).toContain('Phonics owns sound–spelling knowledge, blending, and decoding unfamiliar words');
    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(speaking).toContain('Everyday conversational fluency belongs to Spoken English');
    expect(speaking).toContain('Confidence-only barriers belong to Confidence Building');
  });

  it('keeps FAQ content collapsed by default on all three premium owners', () => {
    for (const source of [reading, grammar, speaking]) {
      expect(source).toContain('ProgrammeFaqAccordion');
    }
  });
});
