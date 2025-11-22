import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../lib/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const functionsClient = getFunctions(app, 'us-central1');
const generatePictureComprehension = httpsCallable(functionsClient, 'generatePictureComprehension');

export default function PictureComprehension({ studentId, level = 'Grade 1-2' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exercise, setExercise] = useState(null);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await generatePictureComprehension({ studentId, level });
        setExercise(resp?.data || null);
      } catch (err) {
        setError(err?.message || 'Failed to load comprehension.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [level, studentId]);

  const answer = async (choice) => {
    if (!exercise) return;
    const q = exercise.questions?.[current];
    if (!q) return;
    const correct = q.answer?.trim().toLowerCase() === choice.trim().toLowerCase();
    setResult({ correct, answer: q.answer });
    await addDoc(collection(db, 'student-comprehension-log'), {
      studentId,
      level,
      questionIndex: current,
      choice,
      correct,
      timestamp: serverTimestamp(),
    });
    setTimeout(() => {
      setResult(null);
      setCurrent((prev) => Math.min(prev + 1, (exercise.questions?.length || 1) - 1));
    }, 1200);
  };

  if (loading) return <div className="text-sm text-gray-500">Loading picture comprehension…</div>;
  if (error) return <div className="text-sm text-red-700">{error}</div>;
  if (!exercise) return null;

  const question = exercise.questions?.[current];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-50 space-y-4">
      <div>
        <p className="text-sm text-indigo-600 font-semibold">Picture Comprehension</p>
        <h2 className="text-xl font-bold text-gray-900">Look at the scene and answer the question</h2>
      </div>
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
        <p className="text-sm text-gray-700">{exercise.scenario}</p>
        <p className="text-2xl mt-2">{exercise.imageDescription || '🌳🏫🏠'}</p>
      </div>
      {question && (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-900">
            Q{current + 1}. {question.prompt}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => answer(opt)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-200 text-base font-semibold transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div
          className={`p-3 rounded-xl border ${
            result.correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          {result.correct ? '🎉 Correct!' : `Answer: ${result.answer}`}
        </div>
      )}
    </div>
  );
}
