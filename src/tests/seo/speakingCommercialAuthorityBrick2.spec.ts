import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const speaking = fs.readFileSync(path.join(root, 'src/pages/speaking.tsx'), 'utf8');

describe('Speaking Commercial Authority v2 — Brick 2 developmental progression', () => {
  it('adds three developmental guidance bands without creating new course products', () => {
    expect(speaking).toContain("ageLabel: 'Ages 4–5'");
    expect(speaking).toContain("title: 'Communication Foundations'");
    expect(speaking).toContain("ageLabel: 'Ages 6–8'");
    expect(speaking).toContain("title: 'Public Speaking Foundations'");
    expect(speaking).toContain("ageLabel: 'Ages 9–12'");
    expect(speaking).toContain("title: 'Advanced Communication & Public Speaking'");
    expect(speaking).toContain('these three age bands are a developmental guide, not three new Tiny Steps course products');
    expect(speaking).toContain('Public Speaking Foundations and Public Speaking Excellence tracks remain the actual course architecture');
  });

  it('positions age four as communication foundations rather than formal speech training', () => {
    expect(speaking).toContain('At this age, public speaking begins with communication—not podium speeches.');
    expect(speaking).toContain('Formal speeches, debate, and sustained presentation performance are not the goal.');
    expect(speaking).toContain('Tiny Steps position: age four is a valid starting point for communication foundations when the work is age-appropriate—but not for adult-style speeches.');
    expect(speaking).toContain('Is age 4 too young to start public speaking classes?');
  });

  it('uses developmentally escalating speaking tasks', () => {
    expect(speaking).toContain('Retell simple stories with a clear sequence');
    expect(speaking).toContain('Give short prepared presentations');
    expect(speaking).toContain('State opinions and support them with reasons');
    expect(speaking).toContain('Practise impromptu and extempore speaking');
    expect(speaking).toContain('Use reasons, examples, and evidence to justify a viewpoint');
    expect(speaking).toContain('Adapt language to audience and respond thoughtfully to questions');
  });

  it('publishes authoritative developmental and curriculum references', () => {
    expect(speaking).toContain('https://www.asha.org/public/developmental-milestones/communication-milestones-4-to-5-years/');
    expect(speaking).toContain('https://www.naeyc.org/node/3807');
    expect(speaking).toContain('https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study');
    expect(speaking).toContain('https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/english');
    expect(speaking).toContain('There is no single global rule that says children should begin public speaking at one exact age.');
  });

  it('keeps assessment-led placement and the existing two-level architecture', () => {
    expect(speaking).toContain('speakingFacts.levels.beginner.canonicalCoursePath');
    expect(speaking).toContain('speakingFacts.levels.advanced.canonicalCoursePath');
    expect(speaking).toContain('assessment determines the appropriate level');
    expect(speaking).toContain('Age 7 sits in both ranges');
  });

  it('adds semantic markup for the age-appropriate progression', () => {
    expect(speaking).toContain("const speakingDevelopmentalStagesSchema = {");
    expect(speaking).toContain("name: 'Tiny Steps age-appropriate public speaking and communication progression'");
    expect(speaking).toContain('speakingDevelopmentalStagesSchema');
  });
});
