import { describe, expect, it } from 'vitest';
import {
  ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES,
  selectAskTinyStepsSources,
} from '../../services/askTinyStepsSourceSelector';

describe('Ask Tiny Steps smart source selector', () => {
  it('selects pricing and assessment as the canonical parent pricing sources', () => {
    const selection = selectAskTinyStepsSources('What are your fees and packages?');

    expect(selection.audience).toBe('parents');
    expect(selection.intent).toBe('pricing');
    expect(selection.sourceIds.slice(0, 2)).toEqual(['pricing', 'book-demo']);
    expect(selection.sources.every((source) => source.audience !== 'schools')).toBe(true);
  });

  it('routes a blending problem to the specific support article before broad phonics pages', () => {
    const selection = selectAskTinyStepsSources(
      'My child knows letter sounds but cannot read words. How can I help with blending?',
    );

    expect(selection.intent).toBe('phonics');
    expect(selection.sourceIds).toEqual([
      'sounds-cannot-read',
      'phonics',
      'letter-sounds-not-enough',
    ]);
  });

  it('keeps school queries inside school/both sources and prefers the specific CBSE source', () => {
    const selection = selectAskTinyStepsSources(
      'Does CBSE or NCF include phonics for schools?',
    );

    expect(selection.audience).toBe('schools');
    expect(selection.intent).toBe('school_research');
    expect(selection.sourceIds.slice(0, 2)).toEqual(['cbse-phonics-ncf', 'for-schools']);
    expect(selection.sources.every((source) => source.audience !== 'parents')).toBe(true);
  });

  it('uses archived Summer Camp content only for an explicit historical Summer Camp question', () => {
    const explicit = selectAskTinyStepsSources('What happened in Summer Camp 2026?');
    const normal = selectAskTinyStepsSources('Which course is suitable for my child?');

    expect(explicit.intent).toBe('summer_camp');
    expect(explicit.sourceIds).toContain('summer-camps-2026');
    expect(normal.sourceIds).not.toContain('summer-camps-2026');
  });

  it('uses recent conversation context for a vague follow-up without broadening to arbitrary sources', () => {
    const selection = selectAskTinyStepsSources('How much is it?', {
      recentUserMessages: ['We are a CBSE school looking for teacher training.'],
    });

    expect(selection.audience).toBe('schools');
    expect(selection.sourceIds[0]).toBe('for-schools');
    expect(selection.sourceIds).not.toContain('pricing');
  });

  it('can use the approved current page for a contextual follow-up', () => {
    const selection = selectAskTinyStepsSources('Tell me more about this.', {
      currentPath: '/phonics',
      recentUserMessages: ['I am looking at your phonics programme.'],
    });

    expect(selection.sourceIds).toContain('phonics');
  });

  it('does not spend URL Context tokens on unrelated general-purpose questions', () => {
    const selection = selectAskTinyStepsSources('Who won the cricket match yesterday?');

    expect(selection.intent).toBe('general');
    expect(selection.sourceIds).toEqual([]);
  });

  it('never exceeds the bounded URL Context source count', () => {
    const selection = selectAskTinyStepsSources(
      'Tell me about phonics, blending, reading, curriculum and your courses.',
      { maxSources: 20 },
    );

    expect(selection.sourceIds.length).toBeLessThanOrEqual(
      ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES,
    );
  });
});
