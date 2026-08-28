import { describe, expect, it } from 'vitest';
import {
  ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES,
  selectAskTinyStepsSources,
} from '../../services/askTinyStepsSourceSelector';

describe('Ask Tiny Steps smart source selector', () => {
  it('uses only the canonical pricing page for parent pricing', () => {
    const selection = selectAskTinyStepsSources('What are your fees and packages?');
    expect(selection.audience).toBe('parents');
    expect(selection.intent).toBe('pricing');
    expect(selection.sourceIds).toEqual(['pricing']);
  });

  it('routes one-to-one class-mode questions to the canonical pricing source', () => {
    const selection = selectAskTinyStepsSources('Do you provide one-to-one classes?');
    expect(selection.intent).toBe('class_mode');
    expect(selection.sourceIds).toEqual(['pricing']);
  });

  it('keeps 1:1 pricing questions in pricing intent', () => {
    const selection = selectAskTinyStepsSources('What are your fees for 1:1 classes?');
    expect(selection.intent).toBe('pricing');
    expect(selection.sourceIds).toEqual(['pricing']);
  });

  it('uses pricing for regular duration and book-demo for demo duration', () => {
    const regular = selectAskTinyStepsSources('What is the duration of each class?');
    const demo = selectAskTinyStepsSources('How long is the demo assessment?');

    expect(regular.intent).toBe('timings');
    expect(regular.sourceIds).toEqual(['pricing']);
    expect(demo.intent).toBe('assessment');
    expect(demo.sourceIds).toEqual(['book-demo']);
  });

  it('uses FAQ for schedule and slot questions instead of pricing', () => {
    const selection = selectAskTinyStepsSources('Do you have weekend slots?');
    expect(selection.intent).toBe('timings');
    expect(selection.sourceIds).toEqual(['faq']);
  });

  it('routes a blending problem to two specific diagnostic sources without broad-page padding', () => {
    const selection = selectAskTinyStepsSources(
      'My child knows letter sounds but cannot read words. How can I help with blending?',
    );
    expect(selection.intent).toBe('phonics');
    expect(selection.sourceIds).toEqual(['sounds-cannot-read', 'letter-sounds-not-enough']);
    expect(selection.sourceIds).not.toContain('phonics');
  });

  it('routes very slow reading to fluency sources', () => {
    const selection = selectAskTinyStepsSources(
      'My child can read simple words but reads very slowly. What should I work on?',
    );
    expect(selection.intent).toBe('reading');
    expect(selection.sourceIds).toEqual(['reading-fluency-guide', 'reading-classes']);
    expect(selection.sourceIds).not.toContain('summer-camps-2026');
  });

  it('uses only the canonical phonics page for a generic phonics question', () => {
    const selection = selectAskTinyStepsSources('Tell me about your phonics classes.');
    expect(selection.intent).toBe('phonics');
    expect(selection.sourceIds).toEqual(['phonics']);
  });

  it('keeps school queries inside school/both sources and prefers the specific CBSE source', () => {
    const selection = selectAskTinyStepsSources('Does CBSE or NCF include phonics for schools?');
    expect(selection.audience).toBe('schools');
    expect(selection.intent).toBe('school_research');
    expect(selection.sourceIds).toEqual(['cbse-phonics-ncf', 'for-schools']);
    expect(selection.sources.every((source) => source.audience !== 'parents')).toBe(true);
  });

  it('does not mistake a parent mentioning school for an institutional user', () => {
    const selection = selectAskTinyStepsSources(
      'My child is struggling to read words at school. Which course can help?',
    );
    expect(selection.audience).toBe('parents');
    expect(selection.sourceIds).not.toContain('for-schools');
  });

  it('uses the For Schools page as institutional context for an ambiguous pricing question', () => {
    const selection = selectAskTinyStepsSources('What are your prices?', {
      currentPath: '/for-schools',
    });
    expect(selection.audience).toBe('schools');
    expect(selection.sourceIds).toEqual(['for-schools']);
    expect(selection.sourceIds).not.toContain('pricing');
  });

  it('uses archived Summer Camp content only for an explicit historical Summer Camp question', () => {
    const explicit = selectAskTinyStepsSources('What happened in Summer Camp 2026?');
    const normal = selectAskTinyStepsSources('Which course is suitable for my child?');
    expect(explicit.intent).toBe('summer_camp');
    expect(explicit.sourceIds).toContain('summer-camps-2026');
    expect(normal.sourceIds).not.toContain('summer-camps-2026');
  });

  it('uses recent school context for a vague pricing follow-up without switching to parent pricing', () => {
    const selection = selectAskTinyStepsSources('How much is it?', {
      recentUserMessages: ['We are a CBSE school looking for teacher training.'],
    });
    expect(selection.audience).toBe('schools');
    expect(selection.sourceIds[0]).toBe('for-schools');
    expect(selection.sourceIds).not.toContain('pricing');
  });

  it('does not invent follow-up context when there is no previous user turn', () => {
    const selection = selectAskTinyStepsSources('How much does it cost?', {
      currentPath: '/',
      recentUserMessages: [],
    });
    expect(selection.audience).toBe('parents');
    expect(selection.intent).toBe('pricing');
    expect(selection.sourceIds).toEqual(['pricing']);
    expect(selection.sourceIds).not.toContain('home');
  });

  it('does not let stale school history contaminate a clear new parent question', () => {
    const selection = selectAskTinyStepsSources('What are your regular class fees for my child?', {
      recentUserMessages: ['We are a CBSE school looking for teacher training.'],
    });
    expect(selection.audience).toBe('parents');
    expect(selection.intent).toBe('pricing');
    expect(selection.sourceIds).toEqual(['pricing']);
  });

  it('can use the approved current page for a genuine contextual follow-up', () => {
    const selection = selectAskTinyStepsSources('Tell me more about this.', {
      currentPath: '/phonics',
      recentUserMessages: ['I am looking at your phonics programme.'],
    });
    expect(selection.sourceIds).toContain('phonics');
  });

  it('does not spend URL Context tokens on unrelated questions even on the homepage', () => {
    const selection = selectAskTinyStepsSources('Who won the cricket match yesterday?', {
      currentPath: '/',
    });
    expect(selection.intent).toBe('general');
    expect(selection.sourceIds).toEqual([]);
  });

  it('caps URL Context at two approved sources', () => {
    const selection = selectAskTinyStepsSources(
      'Tell me about phonics, blending, reading, curriculum and your courses.',
      { maxSources: 20 },
    );
    expect(ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES).toBe(2);
    expect(selection.sourceIds.length).toBeLessThanOrEqual(2);
  });
});
