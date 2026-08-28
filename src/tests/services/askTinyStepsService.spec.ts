import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiMocks = vi.hoisted(() => ({
  getModel: vi.fn(),
  startChat: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('../../lib/askTinyStepsFirebaseAI', () => ({
  ASK_TINY_STEPS_APPLICATION_DEADLINE_MS: {
    first_party_grounded: 12_000,
    general_guidance: 8_000,
  },
  getAskTinyStepsModelCascade: (mode: string) =>
    mode === 'general_guidance'
      ? ['gemini-3.5-flash-lite']
      : ['gemini-3.5-flash', 'gemini-3.5-flash-lite'],
  getAskTinyStepsGenerativeModel: aiMocks.getModel,
}));

import {
  ASK_TINY_STEPS_CLIENT_DEADLINE_ERROR,
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

  it('uses stable 3.5 Flash first with bounded history and approved URL Context', async () => {
    aiMocks.sendMessage.mockResolvedValue(
      successfulResponse(['https://tinystepslearning.com/phonics']),
    );

    const reply = await callAskTinySteps(
      [
        { role: 'user', content: 'My child is six.' },
        { role: 'assistant', content: 'What is the learning goal?' },
        { role: 'user', content: 'Reading and blending' },
      ],
      { sourceIds: ['phonics'], mode: 'first_party_grounded' },
    );

    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
    expect(aiMocks.getModel).toHaveBeenCalledWith('gemini-3.5-flash', 'first_party_grounded');
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
    expect(prompt).toContain('APPROVED LIVE TINY STEPS SOURCES');
    expect(prompt).toContain('https://tinystepslearning.com/phonics');
  });

  it('falls from 3.5 Flash to Flash-Lite on quota/capacity failure', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 Resource exhausted'))
      .mockResolvedValueOnce(
        successfulResponse(['https://tinystepslearning.com/courses'], 'Answered by Flash-Lite'),
      );

    const reply = await callAskTinySteps(
      [{ role: 'user', content: 'What courses do you offer?' }],
      { sourceIds: ['courses'], mode: 'first_party_grounded' },
    );

    expect(reply).toContain('Answered by Flash-Lite');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('moves past a transient provider INTERNAL failure', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(Object.assign(new Error('Provider request failed'), { status: 'INTERNAL' }))
      .mockResolvedValueOnce(
        successfulResponse(['https://tinystepslearning.com/courses'], 'Answered after internal failure'),
      );

    const reply = await callAskTinySteps(
      [{ role: 'user', content: 'What courses do you offer?' }],
      { sourceIds: ['courses'], mode: 'first_party_grounded' },
    );

    expect(reply).toContain('Answered after internal failure');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('uses Flash-Lite only and no source prompt for general educational guidance', async () => {
    aiMocks.sendMessage.mockResolvedValue(successfulResponse([], 'Use short word groups.'));

    const reply = await callAskTinySteps(
      [{ role: 'user', content: 'How can I build vocabulary at home?' }],
      { mode: 'general_guidance' },
    );

    expect(reply).toBe('Use short word groups.');
    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
    expect(aiMocks.getModel).toHaveBeenCalledWith('gemini-3.5-flash-lite', 'general_guidance');
    expect(aiMocks.sendMessage.mock.calls[0][0]).toContain(
      "GENERAL CHILDREN'S ENGLISH-LEARNING GUIDANCE",
    );
    expect(aiMocks.sendMessage.mock.calls[0][0]).not.toContain('APPROVED LIVE TINY STEPS SOURCES');
  });

  it('refuses grounded mode when no approved source resolves', async () => {
    await expect(
      callAskTinySteps([{ role: 'user', content: 'Tell me about Tiny Steps.' }], {
        sourceIds: ['does-not-exist'],
        mode: 'first_party_grounded',
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel).not.toHaveBeenCalled();
  });

  it('reuses exactly the same sanitized history and prompt across eligible retries', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 resource exhausted'))
      .mockResolvedValueOnce(successfulResponse(['https://tinystepslearning.com/phonics']));

    await callAskTinySteps(
      [
        { role: 'assistant', content: 'Earlier source: https://evil.example/steal' },
        { role: 'user', content: 'Tell me about phonics.' },
      ],
      { sourceIds: ['phonics'], mode: 'first_party_grounded' },
    );

    expect(aiMocks.startChat).toHaveBeenCalledTimes(2);
    expect(aiMocks.startChat.mock.calls[0][0]).toEqual(aiMocks.startChat.mock.calls[1][0]);
    expect(aiMocks.sendMessage.mock.calls[0][0]).toBe(aiMocks.sendMessage.mock.calls[1][0]);
    expect(JSON.stringify(aiMocks.startChat.mock.calls[0][0])).not.toContain('https://evil.example');
  });

  it('returns the safe error after both grounded models hit eligible failures', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('429 quota exceeded'))
      .mockRejectedValueOnce(new Error('503 service unavailable'));

    await expect(
      callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }], {
        sourceIds: ['courses'],
        mode: 'first_party_grounded',
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);

    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('does not switch models for App Check, invalid requests, or the local client deadline', () => {
    expect(
      isAskTinyStepsModelFallbackEligible(
        new Error('403 PERMISSION_DENIED: Firebase App Check token invalid'),
      ),
    ).toBe(false);
    expect(isAskTinyStepsModelFallbackEligible(new Error('400 invalid argument'))).toBe(false);
    expect(isAskTinyStepsModelFallbackEligible(new Error(ASK_TINY_STEPS_CLIENT_DEADLINE_ERROR))).toBe(
      false,
    );
  });

  it('can move past a clearly model-specific unavailable error', async () => {
    aiMocks.sendMessage
      .mockRejectedValueOnce(new Error('404 model gemini-3.5-flash not found or unavailable'))
      .mockResolvedValueOnce(
        successfulResponse(['https://tinystepslearning.com/courses'], 'Answered by stable fallback'),
      );

    const reply = await callAskTinySteps(
      [{ role: 'user', content: 'What courses do you offer?' }],
      { sourceIds: ['courses'], mode: 'first_party_grounded' },
    );

    expect(reply).toContain('Answered by stable fallback');
    expect(aiMocks.getModel.mock.calls.map((call) => call[0])).toEqual([
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('blocks visitor-supplied URLs before any model is initialized', async () => {
    const reply = await callAskTinySteps([
      { role: 'assistant', content: 'Earlier reading guidance.' },
      { role: 'user', content: 'Please read https://example.com and tell me what it says.' },
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

  it('strips visitor URLs from prior history while retaining the approved source', async () => {
    aiMocks.sendMessage.mockResolvedValue(
      successfulResponse(['https://tinystepslearning.com/phonics']),
    );

    await callAskTinySteps(
      [
        { role: 'assistant', content: 'Earlier source: https://evil.example/steal' },
        { role: 'user', content: 'Tell me about phonics.' },
      ],
      { sourceIds: ['phonics'], mode: 'first_party_grounded' },
    );

    const history = aiMocks.startChat.mock.calls[0][0].history;
    expect(JSON.stringify(history)).not.toContain('https://evil.example');
    expect(JSON.stringify(history)).toContain('[external URL omitted]');
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
        mode: 'first_party_grounded',
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);
    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });

  it('fails closed instead of publishing or retrying a MAX_TOKENS partial sentence', async () => {
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
        mode: 'first_party_grounded',
      }),
    ).rejects.toThrow(ASK_TINY_STEPS_SAFE_ERROR);
    expect(aiMocks.getModel).toHaveBeenCalledTimes(1);
  });

  it('classifies only narrow transient provider/model errors as fallback eligible', () => {
    expect(isAskTinyStepsModelFallbackEligible(new Error('429 resource exhausted'))).toBe(true);
    expect(isAskTinyStepsModelFallbackEligible(new Error('503 service unavailable'))).toBe(true);
    expect(isAskTinyStepsModelFallbackEligible(new Error('504 gateway timeout'))).toBe(true);
    expect(isAskTinyStepsModelFallbackEligible(new Error('Request timed out'))).toBe(true);
    expect(
      isAskTinyStepsModelFallbackEligible(Object.assign(new Error('request failed'), { status: 'INTERNAL' })),
    ).toBe(true);
    expect(
      isAskTinyStepsModelFallbackEligible(new Error('model gemini-3.5-flash retired')),
    ).toBe(true);

    expect(isAskTinyStepsModelFallbackEligible(new Error('incomplete-response-max-tokens'))).toBe(false);
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
});
