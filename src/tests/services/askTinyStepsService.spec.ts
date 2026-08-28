import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiMocks = vi.hoisted(() => ({
  getModel: vi.fn(),
  startChat: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('../../lib/askTinyStepsFirebaseAI', () => ({
  ASK_TINY_STEPS_MODEL_CASCADE: [
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ],
  getAskTinyStepsGenerativeModel: aiMocks.getModel,
}));

import {
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH,
  ASK_TINY_STEPS_SAFE_ERROR,
  ASK_TINY_STEPS_UNAPPROVED_URL_REPLY,
  callAskTinySteps,
  isAskTinyStepsModelFallbackEligible,
} from '../../services/askTinyStepsService';

function successfulResponse(urls: string[], text = 'A safe Gemini response') {
  return {
    response: {
      text: () => `${text}\nSource: https://example.com/untrusted`,
      candidates: [
        {
          urlContextMetadata: {
            urlMetadata: urls.map((retrievedUrl) => ({
              retrievedUrl,
              urlRetrievalStatus: 'URL_RETRIEVAL_STATUS_SUCCESS',
            })),
          },
        },
      ],
    },
  };
}

describe('Ask Tiny Steps Firebase AI service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiMocks.getModel.mockReturnValue({ startChat: aiMocks.startChat });
    aiMocks.startChat.mockReturnValue({ sendMessage: aiMocks.sendMessage });
    aiMocks.sendMessage.mockResolvedValue(successfulResponse([]));
  });

  it('uses 3.7 Flash first with bounded history and approved live source URLs', async () => {
    aiMocks.sendMessage.mockResolvedValue(
      successfulResponse(['https://tinystepslearning.com/phonics']),
    );

    const reply = await callAskTinySteps(
      [
        { role: 'user', content: 'My child is six.' },
        { role: 'assistant', content: 'What is the learning goal?' },
        { role: 'user', content: 'Reading and blending' },
      ],
      { sourceIds: ['phonics'] },
    );

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
    expect(aiMocks.getModel).toHaveBeenCalledWith('gemini-3.7-flash');
    expect(reply).toBe(
      'A safe Gemini response\n\nSource: https://tinystepslearning.com/phonics',
    );
    expect(aiMocks.startChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'My child is six.' }] },
        { role: 'model', parts: [{ text: 'What is the learning goal?' }] },
      ],
    });
    const prompt = aiMocks.sendMessage.mock.calls[0][0] as string;
    expect(prompt).toContain('Reading and blending');
    expect(prompt).toContain('APPROVED LIVE TINY STEPS SOURCES');
    expect(prompt).toContain('https://tinystepslearning.com/phonics');
    expect(prompt).not.toContain('Phonics is for ages 3-10.');
    expect(prompt).not.toContain('https://example.com/untrusted');
  });

  it('falls from 3.7 Flash to 3.5 Flash on a 429 quota/capacity error', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 Resource exhausted, please try again later.'))
      .mockResolvedValueOnce(successfulResponse([], 'Answered by 3.5 Flash'));

    const reply = await callAskTinySteps([
      { role: 'user', content: 'What courses do you offer?' },
    ]);

    expect(reply).toBe('Answered by 3.5 Flash');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.7-flash',
      'gemini-3.5-flash',
    ]);
  });

  it('falls through 3.7 and 3.5 to Flash-Lite when both stronger models are unavailable', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 quota exceeded'))
      .mockRejectedValueOnce(new Error('503 Service unavailable: model overloaded'))
      .mockResolvedValueOnce(successfulResponse([], 'Answered by Flash-Lite'));

    const reply = await callAskTinySteps([
      { role: 'user', content: 'What courses do you offer?' },
    ]);

    expect(reply).toBe('Answered by Flash-Lite');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('reuses exactly the same clean history and prompt for each model attempt', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 resource exhausted'))
      .mockResolvedValueOnce(successfulResponse([]));

    await callAskTinySteps([
      { role: 'assistant', content: 'Earlier source: https://evil.example/steal' },
      { role: 'user', content: 'Tell me what Tiny Steps can help with.' },
    ]);

    expect(aiMocks.startChat).toHaveBeenCalledTimes(2);
    expect(aiMocks.startChat.mock.calls[0][0]).toEqual(aiMocks.startChat.mock.calls[1][0]);
    expect(aiMocks.sendMessage).toHaveBeenCalledTimes(2);
    expect(aiMocks.sendMessage.mock.calls[0][0]).toBe(aiMocks.sendMessage.mock.calls[1][0]);
    expect(JSON.stringify(aiMocks.startChat.mock.calls[0][0])).not.toContain('https://evil.example');
  });

  it('returns the safe error after all three models hit eligible availability failures', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 quota exceeded'))
      .mockRejectedValueOnce(new Error('503 service unavailable'))
      .mockRejectedValueOnce(new Error('429 resource exhausted'));

    await expect(
      callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }]),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('does not switch models for App Check or permission failures', async () => {
    aiMocks.sendMessage.mockRejectedValue(
      new Error('403 PERMISSION_DENIED: Firebase App Check token is invalid.'),
    );

    await expect(
      callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }]),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
    expect(aiMocks.getModel).toHaveBeenCalledWith('gemini-3.7-flash');
  });

  it('does not switch models for invalid requests or generic provider defects', async () => {
    aiMocks.sendMessage.mockRejectedValue(new Error('400 INVALID_ARGUMENT: bad request'));

    await expect(
      callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }]),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });

  it('can move past a clearly model-specific not-found/retirement error', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('404 model gemini-3.7-flash not found or unavailable'))
      .mockResolvedValueOnce(successfulResponse([], 'Answered by stable fallback'));

    const reply = await callAskTinySteps([
      { role: 'user', content: 'What courses do you offer?' },
    ]);

    expect(reply).toBe('Answered by stable fallback');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.7-flash',
      'gemini-3.5-flash',
    ]);
  });

  it('blocks visitor-supplied URLs before any model in the cascade is initialized', async () => {
    const reply = await callAskTinySteps([
      { role: 'assistant', content: 'Earlier reading guidance.' },
      {
        role: 'user',
        content: 'Please read https://example.com and tell me what it says.',
      },
    ]);

    expect(reply).toBe(ASK_TINY_STEPS_UNAPPROVED_URL_REPLY);
    expect(aiMocks.getModel).not.toHaveBeenCalled();
    expect(aiMocks.startChat).not.toHaveBeenCalled();
    expect(aiMocks.sendMessage).not.toHaveBeenCalled();
  });

  it('also blocks visitor-supplied www links before Firebase AI Logic is called', async () => {
    const reply = await callAskTinySteps([
      { role: 'user', content: 'Please open www.example.com and summarize it.' },
    ]);

    expect(reply).toBe(ASK_TINY_STEPS_UNAPPROVED_URL_REPLY);
    expect(aiMocks.getModel).not.toHaveBeenCalled();
  });

  it('strips visitor URLs from prior history and drops unknown source ids', async () => {
    const reply = await callAskTinySteps(
      [
        { role: 'assistant', content: 'Earlier source: https://evil.example/steal' },
        { role: 'user', content: 'Tell me what Tiny Steps can help with.' },
      ],
      { sourceIds: ['evil-source', 'does-not-exist'] },
    );

    expect(reply).toBe('A safe Gemini response');
    const history = aiMocks.startChat.mock.calls[0][0].history as Array<{
      parts: Array<{ text: string }>;
    }>;
    const serializedHistory = JSON.stringify(history);
    expect(serializedHistory).not.toContain('https://evil.example');
    expect(serializedHistory).toContain('[external URL omitted]');

    const prompt = aiMocks.sendMessage.mock.calls[0][0] as string;
    expect(prompt).toContain('NO APPROVED TINY STEPS SOURCE URL');
  });

  it('fails closed on URL Context grounding failure instead of switching models', async () => {
    aiMocks.sendMessage.mockResolvedValue({
      response: {
        text: () => 'Unverified answer',
        candidates: [
          {
            urlContextMetadata: {
              urlMetadata: [
                {
                  retrievedUrl: 'https://tinystepslearning.com/phonics',
                  urlRetrievalStatus: 'URL_RETRIEVAL_STATUS_ERROR',
                },
              ],
            },
          },
        ],
      },
    });

    await expect(
      callAskTinySteps([{ role: 'user', content: 'Tell me about phonics.' }], {
        sourceIds: ['phonics'],
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });

  it('fails closed instead of publishing a MAX_TOKENS partial sentence', async () => {
    aiMocks.sendMessage.mockResolvedValue({
      response: {
        text: () => 'If your child knows letter',
        candidates: [
          {
            finishReason: 'MAX_TOKENS',
            urlContextMetadata: {
              urlMetadata: [
                {
                  retrievedUrl: 'https://tinystepslearning.com/phonics',
                  urlRetrievalStatus: 'URL_RETRIEVAL_STATUS_SUCCESS',
                },
              ],
            },
          },
        ],
      },
    });

    await expect(
      callAskTinySteps([{ role: 'user', content: 'My child cannot blend words.' }], {
        sourceIds: ['phonics'],
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });

  it('classifies only narrow availability errors as model-fallback eligible', () => {
    expect(isAskTinyStepsModelFallbackEligible(new Error('429 resource exhausted'))).toBe(true);
    expect(isAskTinyStepsModelFallbackEligible(new Error('503 service unavailable'))).toBe(true);
    expect(
      isAskTinyStepsModelFallbackEligible(new Error('model gemini-3.7-flash retired')),
    ).toBe(true);

    expect(
      isAskTinyStepsModelFallbackEligible(
        new Error('403 PERMISSION_DENIED: Firebase App Check token invalid'),
      ),
    ).toBe(false);
    expect(isAskTinyStepsModelFallbackEligible(new Error('400 invalid argument'))).toBe(false);
    expect(isAskTinyStepsModelFallbackEligible(new Error('primary-url-context-retrieval-failed'))).toBe(
      false,
    );
  });

  it('rejects empty and oversized prompts before initializing Firebase AI', async () => {
    await expect(callAskTinySteps([{ role: 'user', content: '   ' }])).rejects.toThrow(
      ASK_TINY_STEPS_SAFE_ERROR,
    );
    await expect(
      callAskTinySteps([{ role: 'user', content: 'x'.repeat(ASK_TINY_STEPS_MAX_PROMPT_LENGTH + 1) }]),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);
    expect(aiMocks.getModel).not.toHaveBeenCalled();
  });

  it('converts non-fallback provider errors into a safe parent-facing message', async () => {
    aiMocks.sendMessage.mockRejectedValue(new Error('provider credential detail'));
    await expect(
      callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }]),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);
    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });
});
