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

describe('Ask Tiny Steps Firebase AI service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiMocks.getModel.mockReturnValue({ startChat: aiMocks.startChat });
    aiMocks.startChat.mockReturnValue({ sendMessage: aiMocks.sendMessage });
    aiMocks.sendMessage.mockResolvedValue({
      response: { text: () => 'A safe Gemini response' },
    });
  });

  it('uses bounded Gemini chat history and approved public snippets', async () => {
    const reply = await callAskTinySteps(
      [
        { role: 'user', content: 'My child is six.' },
        { role: 'assistant', content: 'What is the learning goal?' },
        { role: 'user', content: 'Reading and blending' },
      ],
      {
        approvedSnippets: [
          {
            title: 'Phonics',
            text: 'Phonics is for ages 3-10.',
            url: 'https://tinystepslearning.com/phonics',
          },
        ],
      },
    );

    expect(reply).toBe('A safe Gemini response');
    expect(aiMocks.startChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'My child is six.' }] },
        { role: 'model', parts: [{ text: 'What is the learning goal?' }] },
      ],
    });
    expect(aiMocks.sendMessage).toHaveBeenCalledWith(expect.stringContaining('Reading and blending'));
    expect(aiMocks.sendMessage).toHaveBeenCalledWith(expect.stringContaining('Phonics is for ages 3-10.'));
    expect(aiMocks.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('https://tinystepslearning.com/phonics'),
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

  it('converts provider errors into a safe parent-facing message', async () => {
    aiMocks.sendMessage.mockRejectedValue(new Error('provider credential detail'));
    await expect(callAskTinySteps([{ role: 'user', content: 'What courses do you offer?' }])).rejects.toThrow(
      ASK_TINY_STEPS_SAFE_ERROR,
    );
  });
});
