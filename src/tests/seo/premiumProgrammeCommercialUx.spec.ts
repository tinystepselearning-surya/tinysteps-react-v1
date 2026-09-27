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
const faqAccordion = read('src/components/programs/ProgrammeFaqAccordion.tsx');
const commercialUx = read('public/commercial-owner-experience.js');

describe('Premium commercial UX for Reading, Grammar and Speaking', () => {
  it('uses one premium visual system across the three non-Phonics owners', () => {
    expect(reading).toContain('variant="reading"');
    expect(grammar).toContain('variant="grammar"');
    expect(speaking).toContain('variant="speaking"');

    for (const source of [reading, grammar, speaking]) {
      expect(source).toContain('bg-[#fbfbfd]');
      expect(source).toContain('title="What this programme builds"');
      expect(source).toContain('ProgrammeIntentBoundary');
    }

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
    expect(teaching).toContain('eyebrow?: string');
    expect(teaching).toContain('title?: string');
    expect(grammar).toContain('appearance="premium"');
    expect(speaking).toContain('appearance="premium"');
  });

  it('preserves the default teaching appearance for Phonics', () => {
    expect(phonics).toContain('<ResponsiveTeachingSection');
    expect(phonics).not.toContain('appearance="premium"');
    expect(teaching).toContain("appearance = 'default'");
  });

  it('hard-disables the extra floating assessment CTA only on the three premium programme owners', () => {
    expect(commercialUx).toContain(
      "const CTA_DISABLED_PATHS = new Set(['/reading-classes-for-kids', '/grammar', '/speaking'])",
    );
    expect(commercialUx).not.toContain("CTA_DISABLED_PATHS = new Set(['/phonics'");
  });

  it('keeps each page compact without removing its decision-critical owner boundary', () => {
    expect(reading).toContain('This Reading pathway begins after the phonics decision.');
    expect(reading).toContain('Phonics owns sound–spelling knowledge, blending, and decoding unfamiliar words');
    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(speaking).toContain('Everyday conversational fluency belongs to Spoken English');
    expect(speaking).toContain('Confidence-only barriers belong to Confidence Building');
  });

  it('collapses every programme FAQ by default while keeping the full answers in the DOM', () => {
    for (const source of [reading, grammar, speaking]) {
      expect(source).toContain('ProgrammeFaqAccordion');
    }
    expect(reading).toContain('accent="sky"');
    expect(grammar).toContain('accent="orange"');
    expect(speaking).toContain('accent="violet"');
    expect(faqAccordion).toContain('<details');
    expect(faqAccordion).toContain('<summary');
    expect(faqAccordion).not.toContain(' open=');
    expect(faqAccordion).not.toContain('open={');
    expect(faqAccordion).toContain('{item.answer}');
  });

  it('uses progressive disclosure for dense decision and evidence sections', () => {
    expect(reading).toContain("title: 'Assess correctly'");
    expect(reading).toContain('principle.criteria.map');
    expect(grammar).toContain("['What was practised', 'Grammar topics and sentence patterns used in class.']");
    expect(speaking).toContain('Why this source matters');
    expect(speaking).toContain('data-speaking-evidence-kind={item.kind}');
  });

  it('removes the duplicated Speaking teaching block and keeps one shared teaching system', () => {
    expect((speaking.match(/<ResponsiveTeachingSection/g) ?? [])).toHaveLength(1);
    expect(speaking).toContain('title="What a Tiny Steps speaking class looks like"');
    expect(speaking).toContain('eyebrow="See the teaching before you decide"');
  });
});
