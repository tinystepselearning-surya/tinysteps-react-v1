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
  ASK_TINY_STEPS_UNAPPROVED_URL_REPLY,
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

  it('blocks visitor-supplied URLs before Firebase AI Logic is called', async () => {
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
