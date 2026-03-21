// src/services/askTinyStepsService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebaseConfig';

const askTinyStepsCallable = httpsCallable(functions, 'askTinySteps');

export async function callAskTinySteps(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { useRetrieval?: boolean }
): Promise<string> {
  try {
    const result = await askTinyStepsCallable({
      messages,
      useRetrieval: options?.useRetrieval !== false,
    });
    const data = result.data as { reply: { role: string; content: string } };
    if (!data.reply || !data.reply.content) {
      throw new Error('Invalid response from Ask TinySteps service');
    }
    return data.reply.content;
  } catch (error: any) {
    console.error('callAskTinySteps error:', error);
    throw new Error(error.message || 'Failed to get response from Ask TinySteps');
  }
}
