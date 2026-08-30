import { beforeEach, describe, expect, it, vi } from 'vitest';

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../lib/analytics', () => ({
  trackEvent: analyticsMocks.trackEvent,
}));

import {
  ASK_TINY_STEPS_ROUTING_EVENT,
  buildAskTinyStepsRoutingTelemetry,
  toAskTinyStepsRoutingMetadata,
  trackAskTinyStepsRouting,
} from '../../lib/askTinyStepsTelemetry';
import { planAskTinyStepsExecution } from '../../services/askTinyStepsExecutionRouter';

describe('Ask Tiny Steps PV-1D routing telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records deterministic routing metadata without conversation or answer content', () => {
    const privateQuestion = 'My child Anaya needs help. What are your fees?';
    const plan = planAskTinyStepsExecution(privateQuestion);
    const route = toAskTinyStepsRoutingMetadata(plan);

    const payload = buildAskTinyStepsRoutingTelemetry({
      route,
      promptLength: privateQuestion.length,
      aiAttempted: false,
      responsePath: 'deterministic',
      totalLatencyMs: 17,
    });

    expect(route).toEqual({
      mode: 'deterministic',
      reason: 'verified_fact',
      audience: 'parents',
      intent: 'pricing',
      sourceIds: ['pricing'],
      isFollowUp: false,
    });
    expect(route).not.toHaveProperty('deterministicAnswer');

    expect(payload).toEqual({
      schema_version: 'pv1d_v1',
      route_mode: 'deterministic',
      route_reason: 'verified_fact',
      audience: 'parents',
      intent: 'pricing',
      is_follow_up: 0,
      source_count: 1,
      primary_source_id: 'pricing',
      source_ids: 'pricing',
      prompt_length_bucket: '1_80',
      ai_attempted: 0,
      ai_result: 'not_attempted',
      model_lane: 'none',
      response_path: 'deterministic',
      total_latency_ms: 17,
    });

    const serialized = JSON.stringify({ route, payload });
    expect(serialized).not.toContain('Anaya');
    expect(serialized).not.toContain('What are your fees');
    expect(serialized).not.toContain('₹400');
    expect(serialized).not.toContain('question');
    expect(serialized).not.toContain('answer');
    expect(serialized).not.toContain('message');
  });

  it('records the grounded model lane and approved source IDs, not prompt text', () => {
    const question = 'My child knows letter sounds but cannot blend words. What should I do?';
    const plan = planAskTinyStepsExecution(question);

    const payload = buildAskTinyStepsRoutingTelemetry({
      route: toAskTinyStepsRoutingMetadata(plan),
      promptLength: question.length,
      aiAttempted: true,
      responsePath: 'ai',
      totalLatencyMs: 1_234,
    });

    expect(payload.route_mode).toBe('first_party_grounded');
    expect(payload.model_lane).toBe('grounded_flash_cascade');
    expect(payload.ai_attempted).toBe(1);
    expect(payload.ai_result).toBe('success');
    expect(payload.response_path).toBe('ai');
    expect(payload.source_count).toBe(2);
    expect(payload.source_ids).toBe('sounds-cannot-read|letter-sounds-not-enough');
    expect(JSON.stringify(payload)).not.toContain(question);
  });

  it('distinguishes a verified local fallback after an AI attempt', () => {
    const question = 'Why does my child read slowly?';
    const plan = planAskTinyStepsExecution(question);

    const payload = buildAskTinyStepsRoutingTelemetry({
      route: toAskTinyStepsRoutingMetadata(plan),
      promptLength: question.length,
      aiAttempted: true,
      responsePath: 'local_fallback',
      totalLatencyMs: 8_100,
    });

    expect(payload.ai_result).toBe('fallback');
    expect(payload.response_path).toBe('local_fallback');
    expect(payload.model_lane).toBe('grounded_flash_cascade');
  });

  it('uses only bounded technical values and emits one GA4 event', () => {
    const plan = planAskTinyStepsExecution(
      'What is a simple way to build my child’s English vocabulary at home?',
    );

    trackAskTinyStepsRouting({
      route: toAskTinyStepsRoutingMetadata(plan),
      promptLength: 2_001,
      aiAttempted: true,
      responsePath: 'ai',
      totalLatencyMs: 999_999,
    });

    expect(analyticsMocks.trackEvent).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith(
      ASK_TINY_STEPS_ROUTING_EVENT,
      expect.objectContaining({
        prompt_length_bucket: 'over_2000',
        total_latency_ms: 60_000,
        model_lane: 'flash_lite_guidance',
      }),
    );
  });
});
