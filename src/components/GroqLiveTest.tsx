// src/components/GroqLiveTest.tsx
import React, { useState } from 'react';
import { getGroqKidIdea } from '../lib/firebaseFunctions';

export const GroqLiveTest: React.FC = () => {
  const [topic, setTopic] = useState('animals');
  const [idea, setIdea] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    setIdea('');

    try {
      const result = await getGroqKidIdea(topic);
      setIdea(result);
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Groq Live Test (Tiny Steps)</h2>

      <label className="block text-sm">
        Topic for child idea:
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. animals, birthday, rain, friendship"
        />
      </label>

      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
      >
        {loading ? 'Asking Groq…' : 'Generate Idea'}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {idea && (
        <div className="mt-2 whitespace-pre-line rounded border bg-slate-50 p-2 text-sm">
          {idea}
        </div>
      )}
    </div>
  );
};
