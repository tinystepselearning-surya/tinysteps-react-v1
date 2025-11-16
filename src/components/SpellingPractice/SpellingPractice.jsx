import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../lib/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const functionsClient = getFunctions(app, 'us-central1');
const gradeSpelling = httpsCallable(functionsClient, 'gradeSpelling');

export default function SpellingPractice({ studentId, word, onDone }) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await gradeSpelling({ studentId, word, studentAnswer: answer });
      const data = resp?.data || {};
      setResult(data);
      await addDoc(collection(db, 'student-spelling-log'), {
        studentId,
        word,
        studentAnswer: answer,
        correct: data.correct,
        feedback: data.feedback,
        score: data.score,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      setError(err?.message || 'Failed to grade spelling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-50 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Spelling Practice</p>
          <h2 className="text-2xl font-bold text-gray-900">Type the word you see</h2>
        </div>
        {onDone && (
          <button
            onClick={onDone}
            className="text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg"
          >
            Close
          </button>
        )}
      </div>
      <div className="text-3xl font-bold text-indigo-700">{word}</div>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Type the spelling here"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Submit'}
        </button>
      </form>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
          {error}
        </div>
      )}
      {result && (
        <div
          className={`p-4 rounded-2xl border ${
            result.correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          <p className="text-lg font-semibold">
            {result.correct ? '🎉 Correct!' : 'Keep trying!'}
          </p>
          <p className="text-sm mt-1">{result.feedback}</p>
          {!result.correct && (
            <p className="text-sm mt-1">
              Correct spelling: <span className="font-semibold">{result.correctSpelling || word}</span>
            </p>
          )}
          {result.hint && <p className="text-xs text-gray-600 mt-1">Hint: {result.hint}</p>}
        </div>
      )}
    </div>
  );
}
