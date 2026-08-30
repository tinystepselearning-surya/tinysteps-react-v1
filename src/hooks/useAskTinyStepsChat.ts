// src/hooks/useAskTinyStepsChat.ts
import { useCallback, useRef, useState } from 'react';
import {
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH,
  callAskTinySteps,
} from '../services/askTinyStepsService';
import {
  buildAskTinyStepsLocalFallback,
  planAskTinyStepsExecution,
} from '../services/askTinyStepsExecutionRouter';
import {
  trackAskTinyStepsRouting,
  type AskTinyStepsResponsePath,
} from '../lib/askTinyStepsTelemetry';

type ChatRole = 'user' | 'assistant';
export type AskChatMessage = { role: ChatRole; content: string };

function historyForAI(messages: AskChatMessage[], maxMessages = 3): AskChatMessage[] {
  return messages.slice(-maxMessages).map((message) => ({
    role: message.role,
    content: String(message.content || '').slice(0, ASK_TINY_STEPS_MAX_PROMPT_LENGTH),
  }));
}

export function useAskTinyStepsChat() {
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const trimmed = (textOverride ?? input).trim();
      if (!trimmed || loading || requestInFlightRef.current) return;
      if (trimmed.length > ASK_TINY_STEPS_MAX_PROMPT_LENGTH) {
        setError(`Please keep your question under ${ASK_TINY_STEPS_MAX_PROMPT_LENGTH} characters.`);
        return;
      }

      const requestStartedAt = Date.now();
      requestInFlightRef.current = true;
      const userMsg: AskChatMessage = { role: 'user', content: trimmed };
      setMessages((previous) => [...previous, userMsg]);
      setInput('');
      setLoading(true);
      setError(null);

      try {
        const recentUserMessages = messages
          .filter((message) => message.role === 'user')
          .map((message) => message.content)
          .slice(-1);

        const plan = planAskTinyStepsExecution(trimmed, {
          recentUserMessages,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });

        let assistantText = plan.deterministicAnswer?.trim() ?? '';
        let aiAttempted = false;
        let responsePath: AskTinyStepsResponsePath = assistantText
          ? 'deterministic'
          : 'local_fallback';

        if (!assistantText && (plan.mode === 'first_party_grounded' || plan.mode === 'general_guidance')) {
          aiAttempted = true;

          // A standalone question gets no stale history. A genuine follow-up gets
          // only the immediately preceding user/assistant turn plus this message.
          const conversation = plan.isFollowUp
            ? historyForAI([...messages.slice(-2), userMsg], 3)
            : [userMsg];

          try {
            const aiReply = await callAskTinySteps(conversation, {
              sourceIds: plan.sourceIds,
              mode: plan.mode,
            });
            if (aiReply?.trim()) {
              assistantText = aiReply.trim();
              responsePath = 'ai';
            }
          } catch {
            responsePath = 'local_fallback';
            // Do not expose provider/model diagnostics in the visitor UI.
            console.warn('AskTinySteps AI unavailable; using the verified local fallback.');
          }
        }

        if (!assistantText) {
          assistantText = buildAskTinyStepsLocalFallback(plan);
          responsePath = 'local_fallback';
        }

        const assistantMsg: AskChatMessage = { role: 'assistant', content: assistantText };
        setMessages((previous) => [...previous, assistantMsg]);

        trackAskTinyStepsRouting({
          plan,
          promptLength: trimmed.length,
          aiAttempted,
          responsePath,
          totalLatencyMs: Date.now() - requestStartedAt,
        });
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}
