import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const schemas = read('src/lib/schemas.ts');
const semanticFacts = read('src/config/semanticFacts.ts');
const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');
const grammar = read('src/pages/grammar.tsx');
const speaking = read('src/pages/speaking.tsx');
const phonics = read('src/pages/phonics.tsx');

describe('Commercial owner content hardening', () => {
  it('keeps FAQ speakable selectors compatible with the collapsed summary/div markup', () => {
    expect(schemas).toContain("cssSelector: ['.faq-question', '.faq-answer']");
    expect(schemas).toContain("normalize-space(@class)");
    expect(schemas).toContain("' faq-question '");
    expect(schemas).toContain("' faq-answer '");
    expect(schemas).not.toContain('//h3[@class="faq-question"]');
    expect(schemas).not.toContain('//p[@class="faq-answer"]');
  });

  it('keeps Grammar commercial semantics sentence-level while leaving Writing as the composition handoff', () => {
    expect(semanticFacts).toContain("label: 'Grammar & Sentence Building'");
    expect(semanticFacts).toContain("claim: 'Structured grammar, sentence-building and sentence-accuracy progression.'");
    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(grammar).toContain('written sentence accuracy');
    expect(grammar).toContain('Choose Writing when');
  });

  it('uses one source of truth for Reading buyer criteria in both visible content and structured data', () => {
    expect(reading).toContain('const readingDecisionPrinciples = [');
    expect(reading).toContain('readingDecisionPrinciples.map((criterion, index)');
    expect(reading).toContain('readingDecisionPrinciples.map((principle, index)');
  });

  it('routes ambiguous Speaking placement to assessment instead of assuming the advanced level', () => {
    expect(speaking).toContain('Has ideas but answers wander, jump around, or end without a clear point');
    expect(speaking).toContain('Check the right speaking level');
    expect(speaking).toContain('to="/book-demo"');
    expect(speaking).toContain('Not sure which speaking path fits your child?');
  });

  it('does not bring Phonics into this hardening pass', () => {
    expect(phonics).not.toContain('readingDecisionPrinciples');
    expect(phonics).not.toContain('Grammar & Sentence Building');
  });
});
