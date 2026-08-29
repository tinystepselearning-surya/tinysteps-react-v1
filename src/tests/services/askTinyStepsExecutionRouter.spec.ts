import { describe, expect, it } from 'vitest';
import {
  ASK_TINY_STEPS_EXTERNAL_RESEARCH_ENABLED,
  buildAskTinyStepsLocalFallback,
  planAskTinyStepsExecution,
} from '../../services/askTinyStepsExecutionRouter';

describe('Ask Tiny Steps execution router', () => {
  it('routes exact parent pricing to the zero-AI deterministic lane', () => {
    const plan = planAskTinyStepsExecution('How much do your 1:1 phonics classes cost?');

    expect(plan.mode).toBe('deterministic');
    expect(plan.intent).toBe('pricing');
    expect(plan.sourceIds).toEqual(['pricing']);
    expect(plan.deterministicAnswer).toContain('₹400');
    expect(plan.deterministicAnswer).toContain('₹4,800');
    expect(plan.deterministicAnswer).toContain('/pricing');
  });

  it.each([
    'How long is each class?',
    'How long are your classes?',
    'How long does a class last?',
  ])('answers regular duration from canonical configuration for %s', (question) => {
    const regular = planAskTinyStepsExecution(question);

    expect(regular.mode).toBe('deterministic');
    expect(regular.intent).toBe('timings');
    expect(regular.sourceIds).toEqual(['pricing']);
    expect(regular.deterministicAnswer).toContain('1:1 classes are 35 minutes');
    expect(regular.deterministicAnswer).toContain('40–60 minutes');
  });

  it('answers demo duration from canonical configuration without Gemini', () => {
    const demo = planAskTinyStepsExecution('How long is the demo assessment?');

    expect(demo.mode).toBe('deterministic');
    expect(demo.sourceIds).toEqual(['book-demo']);
    expect(demo.deterministicAnswer).toContain('35 minutes');
  });

  it('answers the core course catalogue deterministically from canonical public facts', () => {
    const plan = planAskTinyStepsExecution('What courses do you offer?');

    expect(plan.mode).toBe('deterministic');
    expect(plan.intent).toBe('courses');
    expect(plan.sourceIds).toEqual(['courses']);
    expect(plan.deterministicAnswer).toContain('Phonics');
    expect(plan.deterministicAnswer).toContain('Grammar');
    expect(plan.deterministicAnswer).toContain('Public Speaking');
    expect(plan.deterministicAnswer).toContain('3–12');
    expect(plan.deterministicAnswer).toContain('/courses');
  });

  it('answers the public learner age range deterministically', () => {
    const plan = planAskTinyStepsExecution('What age groups do you teach?');

    expect(plan.mode).toBe('deterministic');
    expect(plan.intent).toBe('courses');
    expect(plan.sourceIds).toEqual(['courses']);
    expect(plan.deterministicAnswer).toContain('children aged 3–12');
    expect(plan.deterministicAnswer).toContain('/courses');
  });

  it.each([
    ['Do you offer grammar classes?', 'grammar', 'grammar', 'Grammar'],
    ['Do you offer public speaking classes?', 'speaking', 'speaking', 'Public Speaking'],
    ['Do you teach phonics?', 'phonics', 'phonics', 'Phonics'],
  ] as const)(
    'keeps programme availability in the zero-AI deterministic lane: %s',
    (question, expectedIntent, expectedSource, expectedLabel) => {
      const plan = planAskTinyStepsExecution(question);

      expect(plan.mode).toBe('deterministic');
      expect(plan.reason).toBe('verified_fact');
      expect(plan.intent).toBe(expectedIntent);
      expect(plan.sourceIds).toEqual([expectedSource]);
      expect(plan.deterministicAnswer).toContain(expectedLabel);
      expect(plan.deterministicAnswer).toContain(`/${expectedSource}`);
    },
  );

  it('does not turn teaching-method or child-help questions into programme availability facts', () => {
    const methodology = planAskTinyStepsExecution('How do you teach phonics?');
    const guidance = planAskTinyStepsExecution('How can I improve my child’s grammar?');

    expect(methodology.mode).toBe('first_party_grounded');
    expect(methodology.intent).toBe('methodology');
    expect(methodology.sourceIds).toEqual(['why-tiny-steps']);

    expect(guidance.mode).toBe('first_party_grounded');
    expect(guidance.intent).toBe('grammar');
    expect(guidance.sourceIds).toEqual(['grammar']);
  });

  it('routes a blending diagnosis to first-party URL Context instead of generic guidance', () => {
    const plan = planAskTinyStepsExecution(
      'My 6-year-old knows letter sounds but cannot blend words. What should I do?',
    );

    expect(plan.mode).toBe('first_party_grounded');
    expect(plan.sourceIds).toEqual(['sounds-cannot-read', 'letter-sounds-not-enough']);
  });

  it('routes slow reading to fluency authorities and never archived Summer Camp', () => {
    const plan = planAskTinyStepsExecution(
      'My child can read simple words but reads very slowly. What should I work on?',
    );
    const fallback = buildAskTinyStepsLocalFallback(plan);

    expect(plan.mode).toBe('first_party_grounded');
    expect(plan.sourceIds).toEqual(['reading-fluency-guide', 'reading-classes']);
    expect(plan.sourceIds).not.toContain('summer-camps-2026');
    expect(fallback).toContain('accuracy');
    expect(fallback).not.toContain('Summer Camp');
  });

  it('preserves school context for a genuine pricing follow-up and uses exact school facts', () => {
    const plan = planAskTinyStepsExecution('How much does it cost?', {
      recentUserMessages: ['Do you have programs for schools?'],
    });

    expect(plan.isFollowUp).toBe(true);
    expect(plan.audience).toBe('schools');
    expect(plan.mode).toBe('deterministic');
    expect(plan.sourceIds).toEqual(['for-schools']);
    expect(plan.deterministicAnswer).toContain('₹59,000');
    expect(plan.deterministicAnswer).toContain('₹1,49,000');
    expect(plan.deterministicAnswer).toContain('/for-schools');
  });

  it.each(['What is the price?', 'Tell me the fees.', 'How much?'])(
    'preserves school context for the elliptical pricing follow-up %s',
    (question) => {
      const plan = planAskTinyStepsExecution(question, {
        recentUserMessages: ['Do you have programmes for schools?'],
      });

      expect(plan.isFollowUp).toBe(true);
      expect(plan.audience).toBe('schools');
      expect(plan.mode).toBe('deterministic');
      expect(plan.sourceIds).toEqual(['for-schools']);
      expect(plan.deterministicAnswer).toContain('₹59,000');
      expect(plan.deterministicAnswer).not.toContain('₹400');
    },
  );

  it('lets an explicit parent pricing intent override stale school context', () => {
    const plan = planAskTinyStepsExecution('How much are phonics classes for my child?', {
      recentUserMessages: ['Do you have programmes for schools?'],
    });

    expect(plan.audience).toBe('parents');
    expect(plan.intent).toBe('pricing');
    expect(plan.sourceIds).toEqual(['pricing']);
    expect(plan.deterministicAnswer).toContain('₹400');
    expect(plan.deterministicAnswer).not.toContain('₹59,000');
  });

  it('does not invent follow-up state in a fresh chat', () => {
    const plan = planAskTinyStepsExecution('How much does it cost?', {
      recentUserMessages: [],
      currentPath: '/',
    });

    expect(plan.isFollowUp).toBe(false);
    expect(plan.audience).toBe('parents');
    expect(plan.deterministicAnswer).toContain('₹400');
  });

  it('keeps private child-record questions entirely out of Gemini', () => {
    const plan = planAskTinyStepsExecution("Can you tell me my child's attendance and progress?");

    expect(plan.mode).toBe('deterministic');
    expect(plan.reason).toBe('private_account_boundary');
    expect(plan.deterministicAnswer).toContain('secure Parent Dashboard');
  });

  it('blocks visitor URLs before any retrieval lane is selected', () => {
    const plan = planAskTinyStepsExecution(
      'Please read https://example.com and tell me what it says.',
    );

    expect(plan.mode).toBe('deterministic');
    expect(plan.reason).toBe('visitor_url_boundary');
    expect(plan.sourceIds).toEqual([]);
  });

  it('uses Flash-Lite guidance mode only when no first-party source is needed', () => {
    const plan = planAskTinyStepsExecution(
      'What is a simple way to build my child’s English vocabulary at home?',
    );

    expect(plan.mode).toBe('general_guidance');
    expect(plan.sourceIds).toEqual([]);
  });

  it.each([
    {
      question: 'How can I practise blending at home?',
      sourceIds: ['sounds-cannot-read', 'letter-sounds-not-enough'],
    },
    {
      question: 'Why does my child read slowly?',
      sourceIds: ['reading-fluency-guide', 'reading-classes'],
    },
  ])('keeps specific learning questions on their first-party route: $question', ({ question, sourceIds }) => {
    const plan = planAskTinyStepsExecution(question);

    expect(plan.mode).toBe('first_party_grounded');
    expect(plan.sourceIds).toEqual(sourceIds);
    expect(plan.sourceIds).not.toContain('summer-camps-2026');
  });

  it('keeps live external research capability explicitly disabled', () => {
    const plan = planAskTinyStepsExecution(
      'What does the latest research say about teaching reading? Search the web.',
    );

    expect(ASK_TINY_STEPS_EXTERNAL_RESEARCH_ENABLED).toBe(false);
    expect(plan.mode).toBe('external_research_disabled');
    expect(plan.reason).toBe('external_research_not_enabled');
    expect(plan.deterministicAnswer).toContain('not enabled');
  });
});
