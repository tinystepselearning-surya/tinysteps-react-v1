import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({ call: vi.fn() }));
const telemetryMocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('../../services/askTinyStepsService', () => ({
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH: 2_000,
  callAskTinySteps: serviceMocks.call,
}));

vi.mock('../../lib/askTinyStepsTelemetry', () => ({
  toAskTinyStepsRoutingMetadata: (plan: Record<string, unknown>) => ({
    mode: plan.mode,
    reason: plan.reason,
    audience: plan.audience,
    intent: plan.intent,
    sourceIds: plan.sourceIds,
    isFollowUp: plan.isFollowUp,
  }),
  trackAskTinyStepsRouting: telemetryMocks.track,
}));

import { useAskTinyStepsChat } from '../../hooks/useAskTinyStepsChat';

describe('useAskTinyStepsChat PV-1D telemetry integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits one deterministic routing record with length only, never question or answer text', async () => {
    const question = 'My child Anaya is six. What are your fees?';
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage(question));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(telemetryMocks.track).toHaveBeenCalledTimes(1);

    const telemetryInput = telemetryMocks.track.mock.calls[0][0];
    expect(telemetryInput.promptLength).toBe(question.length);
    expect(telemetryInput.aiAttempted).toBe(false);
    expect(telemetryInput.responsePath).toBe('deterministic');
    expect(telemetryInput.route.intent).toBe('pricing');
    expect(telemetryInput.route).not.toHaveProperty('deterministicAnswer');

    const serialized = JSON.stringify(telemetryInput);
    expect(serialized).not.toContain('Anaya');
    expect(serialized).not.toContain(question);
    expect(serialized).not.toContain('₹400');
  });

  it('records successful grounded AI routing once', async () => {
    serviceMocks.call.mockResolvedValue('Grounded reading guidance');
    const question = 'My child knows letter sounds but cannot blend words. What should I do?';
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage(question));

    expect(serviceMocks.call).toHaveBeenCalledTimes(1);
    expect(telemetryMocks.track).toHaveBeenCalledTimes(1);

    const telemetryInput = telemetryMocks.track.mock.calls[0][0];
    expect(telemetryInput.aiAttempted).toBe(true);
    expect(telemetryInput.responsePath).toBe('ai');
    expect(telemetryInput.route.mode).toBe('first_party_grounded');
    expect(telemetryInput.route.sourceIds).toEqual([
      'sounds-cannot-read',
      'letter-sounds-not-enough',
    ]);
  });

  it('records local fallback after an AI failure without provider error text', async () => {
    serviceMocks.call.mockRejectedValue(new Error('429 Resource exhausted for user@example.com'));
    const question = 'Why does my child read slowly?';
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage(question));

    expect(telemetryMocks.track).toHaveBeenCalledTimes(1);
    const telemetryInput = telemetryMocks.track.mock.calls[0][0];
    expect(telemetryInput.aiAttempted).toBe(true);
    expect(telemetryInput.responsePath).toBe('local_fallback');

    const serialized = JSON.stringify(telemetryInput);
    expect(serialized).not.toContain('Resource exhausted');
    expect(serialized).not.toContain('user@example.com');
  });

  it('does not emit a routing event for an input rejected before execution planning', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('x'.repeat(2_001)));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(telemetryMocks.track).not.toHaveBeenCalled();
  });
});
