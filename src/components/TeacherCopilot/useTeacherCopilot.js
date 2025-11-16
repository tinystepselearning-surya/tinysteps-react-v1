import { useCallback, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebaseConfig';

const functionsClient = getFunctions(app, 'us-central1');
const generateAIResponse = httpsCallable(functionsClient, 'generateAIResponse');

const ALLOWED_TOPICS = ['phonics', 'grammar', 'teaching', 'reading', 'writing', 'lesson', 'worksheet'];
const MAX_QUESTIONS = 5;

export function useTeacherCopilot(teacherId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentCount, setSentCount] = useState(0);

  const isAllowed = (text) => {
    const lower = text.toLowerCase();
    return ALLOWED_TOPICS.some((t) => lower.includes(t));
  };

  const ask = useCallback(
    async (question) => {
      setError('');
      if (!question || !question.trim()) return;
      if (!isAllowed(question)) {
        setError('Please ask about phonics, grammar, or teaching topics.');
        return;
      }
      if (sentCount >= MAX_QUESTIONS) {
        setError('You reached the 5-question limit for this session.');
        return;
      }

      const basePrompt = [
        'You are a helpful teaching assistant for English language education.',
        'Answer the teacher\'s question about phonics, grammar, or pedagogy.',
        'Keep responses concise (2-3 sentences) and actionable.',
        `Teacher question: ${question}`,
      ].join('\n');

      const userMsg = { role: 'user', content: question, ts: Date.now() };
      setMessages((prev) => [...prev.slice(-9), userMsg]);
      setLoading(true);
      try {
        const resp = await generateAIResponse({
          prompt: basePrompt,
          studentId: `teacher-${teacherId || 'unknown'}`,
          featureType: 'worksheet',
        });
        const data = resp?.data || {};
        const aiText = data.response || 'Sorry, I could not generate a response.';
        const aiMsg = { role: 'assistant', content: aiText, ts: Date.now() };
        setMessages((prev) => [...prev.slice(-9), aiMsg]);
        setSentCount((c) => c + 1);
      } catch (err) {
        setError(err?.message || 'Could not fetch answer.');
      } finally {
        setLoading(false);
      }
    },
    [sentCount, teacherId]
  );

  const exportTxt = () => {
    const content = messages
      .map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher-copilot-chat.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    messages,
    ask,
    loading,
    error,
    sentCount,
    exportTxt,
  };
}

export default useTeacherCopilot;
