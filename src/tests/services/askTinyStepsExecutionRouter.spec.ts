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
    expect(plan.deterministicAnswer).toContain('₹400');
    expect(plan.deterministicAnswer).toContain('₹4,800');
    expect(plan.deterministicAnswer).toContain('/pricing');
  });

  it('answers regular and demo duration from canonical configuration without Gemini', () => {
    const regular = planAskTinyStepsExecution('How long is each class?');
    const demo = planAskTinyStepsExecution('How long is the demo assessment?');

    expect(regular.mode).toBe('deterministic');
    expect(regular.deterministicAnswer).toContain('1:1 classes are 35 minutes');
    expect(regular.deterministicAnswer).toContain('40–60 minutes');
    expect(demo.mode).toBe('deterministic');
    expect(demo.deterministicAnswer).toContain('35 minutes');
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
    expect(plan.deterministicAnswer).toContain('₹59,000');
    expect(plan.deterministicAnswer).toContain('₹1,49,000');
    expect(plan.deterministicAnswer).toContain('/for-schools');
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
