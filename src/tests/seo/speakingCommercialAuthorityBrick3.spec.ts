import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const speaking = fs.readFileSync(path.join(root, 'src/pages/speaking.tsx'), 'utf8');

describe('Speaking Commercial Authority v2 — Brick 3 parent programme fit', () => {
  it('maps six observable parent scenarios to explicit Tiny Steps pathways', () => {
    expect(speaking).toContain('const speakingParentFitScenarios = [');
    expect(speaking).toContain('Mostly one-word or very short everyday answers');
    expect(speaking).toContain('Ideas are present, but sentence formation is often inaccurate or incomplete');
    expect(speaking).toContain('Speaks comfortably one-to-one but avoids class, group, or unfamiliar speaking situations');
    expect(speaking).toContain('Has ideas but answers wander, jump around, or end without a clear point');
    expect(speaking).toContain('Can answer questions but struggles with storytelling, show-and-tell, or short presentations');
    expect(speaking).toContain('Ready for longer talks, opinions, impromptu speaking, persuasion, or guided debate');
  });

  it('preserves canonical routing boundaries instead of treating every speaking issue as public speaking', () => {
    expect(speaking).toContain("routePath: '/spoken-english-classes-for-kids-online'");
    expect(speaking).toContain("routePath: '/grammar'");
    expect(speaking).toContain("routePath: '/confidence-building-program-kids'");
    expect(speaking).toContain("routePath: '/book-demo'");
    expect(speaking).toContain('routePath: speakingFacts.levels.beginner.canonicalCoursePath');
    expect(speaking).toContain('routePath: speakingFacts.levels.advanced.canonicalCoursePath');
    expect(speaking).toContain('Best fit: this Speaking programme');
  });

  it('explains the observable skill gap and next pathway for each scenario', () => {
    expect(speaking).toContain('What parents may notice');
    expect(speaking).toContain('Pathway to inspect: {scenario.routeName}');
    expect(speaking).toContain('Likely first check: conversational fluency');
    expect(speaking).toContain('Likely support: sentence formation and accuracy');
    expect(speaking).toContain('Likely first check: speaking comfort and participation');
    expect(speaking).toContain('Likely fit: foundational public speaking');
    expect(speaking).toContain('Likely fit: advanced public speaking');
  });

  it('uses multidimensional oracy evidence without converting it into a clinical diagnostic', () => {
    expect(speaking).toContain('Spoken communication is multidimensional.');
    expect(speaking).toContain('https://oracycambridge.org/wp-content/uploads/2020/06/The-Oracy-Skills-Framework-and-Glossary.pdf');
    expect(speaking).toContain('physical, linguistic, cognitive, and social/emotional dimensions');
    expect(speaking).toContain('https://www.asha.org/public/developmental-milestones/communication-milestones/');
    expect(speaking).toContain('These are programme-fit cues, not diagnoses.');
    expect(speaking).toContain('qualified speech-language or hearing professional');
  });

  it('keeps assessment as the final placement mechanism', () => {
    expect(speaking).toContain('then uses the free 1:1 assessment to confirm the pathway');
    expect(speaking).toContain('Final placement is assessment-led.');
    expect(speaking).toContain('The free assessment checks observable performance before recommending a programme.');
  });

  it('adds semantic markup for the parent programme-fit guide', () => {
    expect(speaking).toContain('const speakingParentFitSchema = {');
    expect(speaking).toContain("name: 'Tiny Steps parent speaking-needs routing guide'");
    expect(speaking).toContain('speakingParentFitSchema');
  });
});
