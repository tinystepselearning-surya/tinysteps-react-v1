import { useState } from 'react';

export default function ExerciseCard({ exercise, onAnswer, loading, allowSkip, onSkip }) {
  const [selected, setSelected] = useState('');

  if (!exercise) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-50 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-indigo-600 uppercase">{exercise.type}</p>
        {allowSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1"
          >
            Skip
          </button>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 leading-snug">{exercise.prompt}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(exercise.options || []).map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-base font-semibold transition ${
              selected === opt
                ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onAnswer(selected)}
          disabled={!selected || loading}
          className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Check Answer'}
        </button>
        <p className="text-xs text-gray-500">Timer: ~1 min per question</p>
      </div>
    </div>
  );
}
