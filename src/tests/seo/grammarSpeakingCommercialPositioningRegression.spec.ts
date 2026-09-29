import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C6_R1_ARCHITECTURE } from '../../lib/commercialC6BuyerIntentArchitecture';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Grammar and Speaking commercial positioning regression guard', () => {
  const grammar = read('src/pages/grammar.tsx');
  const speaking = read('src/pages/speaking.tsx');
  const courseRegistry = read('src/lib/publicCoursePages.js');
  const courseDetail = read('src/pages/CourseDetailPage.tsx');

  it('keeps Grammar commercially confident without taking Writing ownership', () => {
    for (const signal of [
      'Trusted by parents in India and internationally',
      'Why families shortlist Tiny Steps for online grammar support',
      'PUBLIC_LEARNER_REACH_LABEL',
      'Live 1:1 grammar teaching',
      'Assessment-first placement',
      'Grammar used in real sentences',
      'Parent-visible progress',
      "'@id': `${canonicalUrl}#tiny-steps-positioning`",
      "name: 'Why families shortlist Tiny Steps for online grammar support'",
    ]) {
      expect(grammar, signal).toContain(signal);
    }

    expect(grammar).toContain('Grammar supports writing, but it is not the writing programme');
    expect(grammar).toContain('/writing-classes-for-kids');
    expect(grammar).not.toContain("Tiny Steps is India's #1");
    expect(grammar).not.toContain('Tiny Steps is the best grammar');
  });

  it('keeps Speaking commercially confident while preserving specialist boundaries', () => {
    for (const signal of [
      'Trusted by parents in India and internationally',
      'Why families shortlist Tiny Steps for public speaking and communication',
      'PUBLIC_LEARNER_REACH_LABEL',
      'Live 1:1 speaking practice',
      'Structured communication, not memorised speeches',
      'Assessment-first placement',
      'Parent-visible progress',
      "'@id': `${canonicalUrl}#tiny-steps-positioning`",
      "name: 'Why families shortlist Tiny Steps for public speaking and communication'",
    ]) {
      expect(speaking, signal).toContain(signal);
    }

    expect(speaking).toContain('Everyday conversational fluency belongs to Spoken English');
    expect(speaking).toContain('Confidence-only barriers belong to Confidence Building');
    expect(speaking).toContain('Confidence-only barriers remain owned by the dedicated');
    expect(speaking).not.toContain("Tiny Steps is India's #1");
    expect(speaking).not.toContain('Tiny Steps is the best public speaking');
  });

  it('keeps Advanced Grammar a grammar-transfer course rather than a second Writing owner', () => {
    expect(courseRegistry).toContain("h1: 'Advanced Grammar Mastery Classes for Kids'");
    expect(courseRegistry).not.toContain("h1: 'Grammar Mastery Classes for Stronger Writing'");
    expect(courseRegistry).toContain("'grammar for writing accuracy'");
    expect(courseRegistry).not.toContain("'writing support for children'");
    expect(courseRegistry).toContain('Idea development, paragraph planning, story composition, and longer writing belong to the dedicated Writing programme.');
    expect(courseRegistry).toContain("to: '/writing-classes-for-kids'");
    expect(courseDetail).toContain('grammar transfer into connected writing');
    expect(courseDetail).toContain('Idea development and longer composition remain with the dedicated Writing programme.');
  });

  it('explains Foundations age guidance without rewriting parent feedback', () => {
    expect(courseRegistry).toContain("question: 'Can an older child be placed in Public Speaking Foundations?'");
    expect(courseRegistry).toContain('Ages 4–7 are the typical guide, but placement is assessment-led.');
    expect(courseDetail).toContain('The published ages 4–7 range is a guide; assessment-led placement can place an older child here');
    expect(courseDetail).toContain('Some families may mention confidence as a change they noticed.');
    expect(courseDetail).toContain('to="/confidence-building-program-kids"');
  });

  it('preserves the existing buyer-intent architecture instead of creating new comparison URLs', () => {
    const grammarDecision = COMMERCIAL_C6_R1_ARCHITECTURE.find((item) => item.id === 'grammar-comparison');
    const speakingDecision = COMMERCIAL_C6_R1_ARCHITECTURE.find((item) => item.id === 'public-speaking-comparison');

    expect(grammarDecision?.canonicalOwnerPath).toBe('/grammar');
    expect(grammarDecision?.action).toBe('HOLD_EXISTING_OWNER');
    expect(grammarDecision?.newUrlAuthorized).toBe(false);

    expect(speakingDecision?.canonicalOwnerPath).toBe('/speaking');
    expect(speakingDecision?.action).toBe('EMBED_IN_EXISTING_OWNER');
    expect(speakingDecision?.newUrlAuthorized).toBe(false);
  });
});
