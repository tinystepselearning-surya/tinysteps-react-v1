// src/hooks/useAskTinyStepsChat.ts
import { useState } from 'react';
import { callAskTinySteps } from '../services/askTinyStepsService';

export function useAskTinyStepsChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = { role: 'user' as const, content: trimmedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const replyContent = await callAskTinySteps(updatedMessages);
      const assistantMessage = { role: 'assistant' as const, content: replyContent };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
    setInput('');
  };

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}