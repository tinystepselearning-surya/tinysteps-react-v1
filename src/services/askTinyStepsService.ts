import type { Content } from 'firebase/ai';
import { getAskTinyStepsGenerativeModel } from '../lib/askTinyStepsFirebaseAI';

export const ASK_TINY_STEPS_MAX_PROMPT_LENGTH = 2_000;
export const ASK_TINY_STEPS_MAX_HISTORY_MESSAGES = 8;
export const ASK_TINY_STEPS_SAFE_ERROR =
  'TinySteps AI is temporarily unavailable. Please try again in a moment.';

type AskMessage = { role: 'user' | 'assistant'; content: string };
type ApprovedSnippet = { title: string; text: string; url?: string };

function cleanMessages(messages: AskMessage[]): AskMessage[] {
  return messages
    .filter(
      (message): message is AskMessage =>
        Boolean(message) &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        Boolean(message.content.trim()),
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, ASK_TINY_STEPS_MAX_PROMPT_LENGTH),
    }))
    .slice(-ASK_TINY_STEPS_MAX_HISTORY_MESSAGES);
}

function toGeminiHistory(messages: AskMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

function buildCurrentPrompt(question: string, snippets: ApprovedSnippet[]): string {
  const approvedContext = snippets
    .slice(0, 2)
    .map(
      (snippet, index) =>
        `[${index + 1}] ${snippet.title}${snippet.url ? `\nSource URL: ${snippet.url}` : ''}\n${snippet.text.slice(0, 500)}`,
    )
    .join('\n---\n');

  if (!approvedContext) return question;
  return `APPROVED TINY STEPS SNIPPETS (use only when relevant):\n${approvedContext}\n\nPARENT QUESTION:\n${question}`;
}

export async function callAskTinySteps(
  messages: AskMessage[],
  options?: { approvedSnippets?: ApprovedSnippet[] },
): Promise<string> {
  const submitted = messages[messages.length - 1];
  if (
    !submitted ||
    submitted.role !== 'user' ||
    typeof submitted.content !== 'string' ||
    !submitted.content.trim() ||
    submitted.content.trim().length > ASK_TINY_STEPS_MAX_PROMPT_LENGTH
  ) {
    throw new Error(ASK_TINY_STEPS_SAFE_ERROR);
  }

  const clean = cleanMessages(messages);
  const lastMessage = clean[clean.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error(ASK_TINY_STEPS_SAFE_ERROR);
  }
  try {
    const model = getAskTinyStepsGenerativeModel();
    const chat = model.startChat({
      history: toGeminiHistory(clean.slice(0, -1)),
    });
    const result = await chat.sendMessage(
      buildCurrentPrompt(lastMessage.content, options?.approvedSnippets ?? []),
    );
    const reply = result.response.text().trim();
    if (!reply) {
      throw new Error('empty-response');
    }
    return reply;
  } catch {
    // Never expose provider details or parent conversation history in UI/logs.
    throw new Error(ASK_TINY_STEPS_SAFE_ERROR);
  }
}
