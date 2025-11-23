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
    <div className="p-4 border rounded-lg max-w-xl mx-auto space-y-3">
      <h2 className="text-lg font-semibold">Groq Live Test (Tiny Steps)</h2>

      <label className="block text-sm">
        Topic for child idea:
        <input
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. animals, birthday, rain, friendship"
        />
      </label>

      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
      >
        {loading ? 'Asking Groq…' : 'Generate Idea'}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {idea && (
        <div className="mt-2 p-2 border rounded bg-slate-50 text-sm whitespace-pre-line">
          {idea}
        </div>
      )}
    </div>
  );
};
