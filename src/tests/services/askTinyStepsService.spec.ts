import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiMocks = vi.hoisted(() => ({
  getModel: vi.fn(),
  startChat: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('../../lib/askTinyStepsFirebaseAI', () => ({
  getAskTinyStepsGenerativeModel: aiMocks.getModel,
}));

import {
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH,
  ASK_TINY_STEPS_SAFE_ERROR,
  callAskTinySteps,
} from '../../services/askTinyStepsService';

function successfulResponse(urls: string[]) {
  return {
    response: {
      text: () => 'A safe Gemini response\nSource: https://example.com/untrusted',
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

  it('uses bounded Gemini chat history and approved live source URLs instead of copied snippets', async () => {
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

  it('ignores unknown source ids so user-controlled URLs cannot enter URL Context', async () => {
    const reply = await callAskTinySteps(
      [{ role: 'user', content: 'Please read https://example.com and tell me about it.' }],
      { sourceIds: ['https://example.com', 'not-a-real-source'] },
    );

    expect(reply).toBe('A safe Gemini response');
    const prompt = aiMocks.sendMessage.mock.calls[0][0] as string;
    expect(prompt).toContain('NO APPROVED TINY STEPS SOURCE URL');
    expect(prompt).not.toContain('URL: https://example.com');
  });

  it('fails closed when Gemini cannot retrieve the primary approved source', async () => {
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

  it('converts provider errors into a safe parent-facing message', async () => {
    aiMocks.sendMessage.mockRejectedValue(new Error('provider credential detail'));
    await expect(callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }])).rejects.toThrow(
      ASK_TINY_STEPS_SAFE_ERROR,
    );
  });
});
