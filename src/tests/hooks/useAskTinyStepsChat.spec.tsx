import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({ call: vi.fn() }));

vi.mock('../../services/askTinyStepsService', () => ({
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH: 2_000,
  ASK_TINY_STEPS_SAFE_ERROR: 'TinySteps AI is temporarily unavailable. Please try again in a moment.',
  callAskTinySteps: serviceMocks.call,
}));

import { useAskTinyStepsChat } from '../../hooks/useAskTinyStepsChat';

describe('useAskTinyStepsChat submission guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('rejects empty and oversized prompts', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());
    await act(async () => result.current.sendMessage('   '));
    await act(async () => result.current.sendMessage('x'.repeat(2_001)));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toContain('under 2000 characters');
  });

  it('passes registry-selected source ids to Firebase AI Logic', async () => {
    serviceMocks.call.mockResolvedValue('Our current pricing is on the pricing page.');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('What are your fees and packages?'));

    expect(serviceMocks.call).toHaveBeenCalledTimes(1);
    expect(serviceMocks.call.mock.calls[0][1]).toEqual({
      sourceIds: expect.arrayContaining(['pricing', 'book-demo']),
    });
    expect(result.current.messages[result.current.messages.length - 1]?.content).toContain('pricing');
  });

  it('prevents duplicate submissions even before React rerenders loading state', async () => {
    let resolveRequest!: (value: string) => void;
    serviceMocks.call.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = renderHook(() => useAskTinyStepsChat());

    let first!: Promise<void>;
    act(() => {
      first = result.current.sendMessage('Tell me about your teaching methodology');
      void result.current.sendMessage('Tell me about your teaching methodology');
    });
    expect(serviceMocks.call).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest('We use personalized, activity-led learning.');
      await first;
    });
    expect(result.current.messages).toHaveLength(2);
  });
});
