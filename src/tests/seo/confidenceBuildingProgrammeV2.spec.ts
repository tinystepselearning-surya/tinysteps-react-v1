import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = fs.readFileSync(
  path.join(root, 'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx'),
  'utf8',
);

describe('Confidence Building programme v2', () => {
  it('uses the current Tiny Steps lead-page design system', () => {
    for (const token of [
      'LeadPageShell',
      'LeadHero',
      'LeadCard',
      'LeadSection',
      'LeadSectionHeading',
      'CourseCTAGroup',
      'FAQSection',
      'FinalLeadCTA',
    ]) {
      expect(source, token).toContain(token);
    }

    expect(source).toContain('Specialist confidence pathway • live 1:1');
    expect(source).toContain('Confidence Building Classes for Kids');
    expect(source).toContain('PUBLIC_AGE_RANGE_LABEL');
  });

  it('keeps Confidence Building narrow and distinct from broader communication owners', () => {
    expect(source).toContain('confidence-and-participation pathway');
    expect(source).toContain('It is not a second general Speaking & Communication programme');
    expect(source).toContain('/speaking');
    expect(source).toContain('/spoken-english-classes-for-kids-online');
    expect(source).toContain('/grammar');
    expect(source).toContain('/shy-child-speaking-confidence');
  });

  it('uses observable, child-responsive confidence goals', () => {
    expect(source).toContain('Starts more readily');
    expect(source).toContain('Needs fewer prompts');
    expect(source).toContain('Recovers after mistakes');
    expect(source).toContain('Transfers to fresh tasks');
    expect(source).toContain('No forced eye contact');
    expect(source).toContain('No accent conformity goal');
    expect(source).toContain('No fixed extroversion target');
    expect(source).toContain('No confidence guarantee in a set number of classes');
  });

  it('preserves assessment, commercial, and educational-clinical boundaries', () => {
    expect(source).toContain('/book-demo');
    expect(source).toContain('/pricing');
    expect(source).toContain('/class-samples');
    expect(source).toContain('Educational, not clinical');
    expect(source).toContain('not clinical diagnosis or treatment');
    expect(source).toContain("robots: 'index,follow'");
  });
});
