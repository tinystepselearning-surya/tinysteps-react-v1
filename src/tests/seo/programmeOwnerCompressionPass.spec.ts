import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');
const grammar = read('src/pages/grammar.tsx');
const speaking = read('src/pages/speaking.tsx');
const faq = read('src/components/programs/ProgrammeFaqAccordion.tsx');
const phonics = read('src/pages/phonics.tsx');

describe('Commercial owner compression pass', () => {
  it('uses one collapsed FAQ component on Reading, Grammar and Speaking', () => {
    expect(faq).toContain('<details key={item.question} className="group">');
    expect(faq).not.toContain(' open');

    expect(reading).toContain('<ProgrammeFaqAccordion items={faqItems} accent="sky" />');
    expect(grammar).toContain('<ProgrammeFaqAccordion items={faqItems} accent="orange" />');
    expect(speaking).toContain('<ProgrammeFaqAccordion items={faqItems} accent="violet" />');
  });

  it('keeps the three heroes and owner boundaries intact while compressing the middle journey', () => {
    expect(reading).toContain('Online Reading Classes for Kids');
    expect(reading).toContain('This Reading pathway begins after the phonics decision.');
    expect(grammar).toContain('Online Grammar Classes for Kids');
    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(speaking).toContain('Online Public Speaking Classes for Kids');
    expect(speaking).toContain('Everyday conversational fluency belongs to Spoken English');
  });

  it('removes repeated pathway presentation on Grammar and Speaking', () => {
    expect(grammar).not.toContain("['1 Parts of speech', '2 Sentence structure', '3 Tenses'");
    expect(grammar).toContain('grammarPathwayCards.map((card, index)');
    expect(speaking).not.toContain("['1 Complete responses', '2 Organise ideas', '3 Storytelling'");
    expect(speaking).toContain('speakingPathwayCards.map((card, index)');
  });

  it('keeps trust content but reveals less of the Speaking evidence layer at once', () => {
    expect(speaking).toContain('SPEAKING_EVIDENCE_SURFACES.map');
    expect(speaking).toContain('<details');
    expect(speaking).toContain('Open evidence source');
    expect(speaking).toContain('Does not prove:');
  });

  it('keeps Phonics outside this visual refinement', () => {
    expect(phonics).not.toContain('ProgrammeFaqAccordion');
    expect(phonics).not.toContain('data-ts-premium-programme-owner');
  });
});
