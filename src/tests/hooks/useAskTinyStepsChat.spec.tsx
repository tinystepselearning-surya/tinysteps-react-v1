import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({ call: vi.fn() }));

vi.mock('../../services/askTinyStepsService', () => ({
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH: 2_000,
  callAskTinySteps: serviceMocks.call,
}));

import { useAskTinyStepsChat } from '../../hooks/useAskTinyStepsChat';

const lastMessageContent = (messages: Array<{ content: string }>): string =>
  messages[messages.length - 1]?.content ?? '';

describe('useAskTinyStepsChat execution policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('rejects empty and oversized prompts before any model call', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());
    await act(async () => result.current.sendMessage('   '));
    await act(async () => result.current.sendMessage('x'.repeat(2_001)));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toContain('under 2000 characters');
  });

  it('answers parent pricing with zero Gemini calls', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('What are your fees and packages?'));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    const answer = lastMessageContent(result.current.messages);
    expect(answer).toContain('₹400');
    expect(answer).toContain('₹4,800');
    expect(answer).toContain('/pricing');
  });

  it('answers one-to-one class mode and duration with zero Gemini calls', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you provide one-to-one classes?'));
    await act(async () => result.current.sendMessage('How long is each class?'));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    const answer = lastMessageContent(result.current.messages);
    expect(answer).toContain('1:1 classes are 35 minutes');
    expect(answer).toContain('40–60 minutes');
  });

  it('answers private child-record questions with zero Gemini calls', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage("Can you tell me my child's attendance and progress?"));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(lastMessageContent(result.current.messages)).toContain('secure Parent Dashboard');
  });

  it('blocks visitor URLs with zero Gemini calls', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () =>
      result.current.sendMessage('Please read https://example.com and tell me what it says.'),
    );

    expect(serviceMocks.call).not.toHaveBeenCalled();
    expect(lastMessageContent(result.current.messages)).toContain('links supplied by visitors');
  });

  it('uses first-party grounded mode only when synthesis from approved pages is needed', async () => {
    serviceMocks.call.mockResolvedValue('Grounded phonics guidance');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () =>
      result.current.sendMessage(
        'My 6-year-old knows letter sounds but cannot blend words. What should I do?',
      ),
    );

    expect(serviceMocks.call).toHaveBeenCalledTimes(1);
    expect(serviceMocks.call.mock.calls[0][1]).toEqual({
      sourceIds: ['sounds-cannot-read', 'letter-sounds-not-enough'],
      mode: 'first_party_grounded',
    });
  });

  it('uses tool-free general guidance mode for English-learning questions without a first-party route', async () => {
    serviceMocks.call.mockResolvedValue('Use short themed word groups and review them in sentences.');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () =>
      result.current.sendMessage('What is a simple way to build my child’s English vocabulary at home?'),
    );

    expect(serviceMocks.call).toHaveBeenCalledTimes(1);
    expect(serviceMocks.call.mock.calls[0][1]).toEqual({
      sourceIds: [],
      mode: 'general_guidance',
    });
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

  it('keeps a clear new parent synthesis question out of stale school history', async () => {
    serviceMocks.call.mockResolvedValue('Grounded phonics programme answer');
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you have programs for schools?'));
    await act(async () => result.current.sendMessage('Tell me about your phonics classes.'));

    expect(serviceMocks.call).toHaveBeenCalledTimes(1);
    expect(serviceMocks.call.mock.calls[0][0]).toEqual([
      { role: 'user', content: 'Tell me about your phonics classes.' },
    ]);
    expect(serviceMocks.call.mock.calls[0][1]).toEqual({
      sourceIds: ['phonics'],
      mode: 'first_party_grounded',
    });
  });

  it('answers a school pricing follow-up deterministically without parent-price leakage', async () => {
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () => result.current.sendMessage('Do you have programs for schools?'));
    await act(async () => result.current.sendMessage('How much does it cost?'));

    expect(serviceMocks.call).not.toHaveBeenCalled();
    const answer = lastMessageContent(result.current.messages);
    expect(answer).toContain('₹59,000');
    expect(answer).toContain('₹1,49,000');
    expect(answer).not.toContain('₹400');
  });

  it('falls back to focused blending guidance without archived-source leakage', async () => {
    serviceMocks.call.mockRejectedValue(new Error('provider unavailable'));
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () =>
      result.current.sendMessage('My child knows letter sounds but cannot blend words. What should I do?'),
    );

    const answer = lastMessageContent(result.current.messages);
    expect(result.current.error).toBeNull();
    expect(answer).toContain('2–3 sounds');
    expect(answer).not.toContain('Summer Camp');
  });

  it('falls back to focused fluency guidance and never retrieves Summer Camp', async () => {
    serviceMocks.call.mockRejectedValue(new Error('provider unavailable'));
    const { result } = renderHook(() => useAskTinyStepsChat());

    await act(async () =>
      result.current.sendMessage(
        'My child can read simple words but reads very slowly. What should I work on?',
      ),
    );

    const answer = lastMessageContent(result.current.messages);
    expect(answer).toContain('repeated reading');
    expect(answer).toContain('accuracy');
    expect(answer).not.toContain('Summer Camp');
  });
});
