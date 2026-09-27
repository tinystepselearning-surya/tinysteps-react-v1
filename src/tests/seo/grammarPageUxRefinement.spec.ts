import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const grammar = fs.readFileSync(path.join(repoRoot, 'src/pages/grammar.tsx'), 'utf8');

describe('Grammar page UX refinement', () => {
  it('keeps the AI/search ownership layer while reducing parent-facing repetition', () => {
    expect(grammar).toContain('Quick Answer: What do grammar classes for kids include?');
    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(grammar).toContain('What happens in the free grammar assessment?');
    expect(grammar).toContain('Frequently asked questions');

    expect(grammar).not.toContain('Not sure where the grammar gap is?');
    expect(grammar).not.toContain('Why parents choose Tiny Steps grammar support');
    expect(grammar).not.toContain('What parents should compare before choosing grammar classes');
    expect(grammar).not.toContain('Online grammar classes for kids in India and worldwide');
  });

  it('uses four high-value diagnostic signals instead of the previous six-card grid', () => {
    for (const problem of [
      'Child knows grammar rules but cannot use them',
      'Child struggles to build complete sentences',
      'Child mixes past, present, and future',
      'Child writes short answers with repeated grammar errors',
    ]) {
      expect(grammar).toContain(problem);
    }

    expect(grammar).not.toContain('Child makes article/preposition mistakes');
    expect(grammar).not.toContain('Child needs better grammar while speaking');
    expect(grammar).toContain('data-grammar-gap-card');
  });

  it('keeps Grammar sentence-level and removes vague Writing ownership language', () => {
    expect(grammar).toContain('Written sentence accuracy');
    expect(grammar).toContain('written sentence accuracy');
    expect(grammar).not.toContain('Writing clarity');
    expect(grammar).not.toContain('writing clarity');
    expect(grammar).not.toContain('Writing and answer practice');
    expect(grammar).toContain('Choose Writing when');
    expect(grammar).toContain('Choose Spoken English when');
  });

  it('keeps Grammar-owned diagnostics and pathway stages free of pointless self-links', () => {
    expect(grammar).not.toContain("href: '/grammar'");
    expect(grammar).not.toContain('to={item.href}');
    expect(grammar).not.toContain('to={card.href}');
    expect(grammar).toContain("name: 'Written sentence accuracy'");
    expect(grammar).toContain('Paragraph, story, editing, and longer-composition work belongs to the dedicated Writing programme.');
  });

  it('consolidates programme quality criteria and parent evidence into one decision section', () => {
    expect(grammar).toContain('What to look for in a strong grammar programme');
    expect(grammar).toContain('Assessment before placement');
    expect(grammar).toContain('Grammar used in real sentences');
    expect(grammar).toContain('Live correction and retry');
    expect(grammar).toContain('Parent-visible progress');
    expect(grammar).toContain('What grammar parents noticed first');
    expect((grammar.match(/<TestimonialSnippets/g) ?? [])).toHaveLength(1);
  });

  it('keeps international availability visible without a full standalone sales section', () => {
    expect(grammar).toContain('Live online in India and worldwide');
    expect(grammar).toContain('including NRI families');
    expect(grammar).toContain('compatible teacher timings are confirmed before enrolment');
  });

  it('preserves canonical conversion, curriculum and evidence routes', () => {
    for (const href of [
      '/book-demo',
      '/pricing',
      '/class-samples',
      '/curriculum?tab=grammar',
      '/writing-classes-for-kids',
      '/spoken-english-classes-for-kids-online',
      '/parents/tracking-progress',
    ]) {
      expect(grammar).toContain(`to="${href}"`);
    }
  });
});
