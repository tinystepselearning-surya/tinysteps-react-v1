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

  it('keeps a clear new school question out of stale parent pricing history', async () => {
    serviceMocks.call
      .mockResolvedValueOnce('Parent pricing answer')
      .mockResolvedValueOnce('School programme answer');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('How much do phonics classes cost?'));
    await act(async () => result.current.sendMessage('Do you have programs for schools?'));

    expect(serviceMocks.call).toHaveBeenCalledTimes(2);
    expect(serviceMocks.call.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'Do you have programs for schools?' },
    ]);
    expect(serviceMocks.call.mock.calls[1][1].sourceIds).toContain('for-schools');
    expect(serviceMocks.call.mock.calls[1][1].sourceIds).not.toContain('pricing');
  });

  it('preserves only the immediately relevant school turn for a pricing follow-up', async () => {
    serviceMocks.call
      .mockResolvedValueOnce('Yes. Tiny Steps has school programmes.')
      .mockResolvedValueOnce('Current school pricing is on the For Schools page.');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you have programs for schools?'));
    await act(async () => result.current.sendMessage('How much does it cost?'));

    expect(serviceMocks.call).toHaveBeenCalledTimes(2);
    expect(serviceMocks.call.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'Do you have programs for schools?' },
      { role: 'assistant', content: 'Yes. Tiny Steps has school programmes.' },
      { role: 'user', content: 'How much does it cost?' },
    ]);
    expect(serviceMocks.call.mock.calls[1][1].sourceIds).toContain('for-schools');
    expect(serviceMocks.call.mock.calls[1][1].sourceIds).not.toContain('pricing');
  });

  it('uses a concise verified fallback without showing a contradictory outage error', async () => {
    serviceMocks.call.mockRejectedValue(new Error('provider unavailable'));
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('How much do phonics classes cost?'));

    const answer = result.current.messages[result.current.messages.length - 1]?.content ?? '';
    expect(result.current.error).toBeNull();
    expect(answer).toContain('₹400 per class');
    expect(answer).toContain('₹4,800');
    expect(answer).not.toContain('Ultra Premium');
  });

  it('never falls back from a school question to parent 1:1 pricing', async () => {
    serviceMocks.call.mockRejectedValue(new Error('provider unavailable'));
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you have programs for schools?'));

    const answer = result.current.messages[result.current.messages.length - 1]?.content ?? '';
    expect(result.current.error).toBeNull();
    expect(answer).toContain('For Schools');
    expect(answer).not.toContain('₹400');
  });

  it('answers one-to-one mode correctly from the verified fallback', async () => {
    serviceMocks.call.mockRejectedValue(new Error('provider unavailable'));
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you provide one-to-one classes?'));

    const answer = result.current.messages[result.current.messages.length - 1]?.content ?? '';
    expect(answer).toContain('live 1:1 sessions');
    expect(answer).toContain('35 minutes');
    expect(result.current.error).toBeNull();
  });
});
