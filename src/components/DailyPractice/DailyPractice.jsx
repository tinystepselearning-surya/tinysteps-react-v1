import React from 'react';
import useDailyPractice from './useDailyPractice';
import ExerciseCard from './ExerciseCard';
import ExerciseResult from './ExerciseResult';
import DailyProgressCard from './DailyProgressCard';

export default function DailyPractice({ studentId, onBack }) {
  const {
    loading,
    error,
    exercises,
    currentExercise,
    currentIndex,
    total,
    answer,
    result,
    skip,
    completed,
    score,
    reload,
  } = useDailyPractice(studentId);

  const handleAnswer = (choice) => {
    if (!choice) return;
    answer(choice);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Kids Portal</p>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Today's Practice <span role="img" aria-label="target">🎯</span>
          </h1>
          <p className="text-sm text-gray-600">3-5 quick exercises. Instant feedback.</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 shadow-sm"
          >
            ← Back
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
          {error} <button onClick={reload}>Retry</button>
        </div>
      )}

      <DailyProgressCard
        score={score.correct}
        total={total}
        completed={completed}
        onStart={() => {}}
      />

      {loading && <div className="text-sm text-gray-500">Loading practice…</div>}

      {!loading && currentExercise && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Exercise {currentIndex + 1} of {total}
          </p>
          <ExerciseCard
            exercise={currentExercise}
            onAnswer={handleAnswer}
            loading={false}
            allowSkip={true}
            onSkip={skip}
          />
          <ExerciseResult result={result} />
        </div>
      )}

      {completed && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-lg font-bold text-emerald-700">
            Great job! {score.correct}/{total} correct.
          </p>
          <p className="text-sm text-emerald-700">Your teacher/parent can see your progress.</p>
        </div>
      )}
    </div>
  );
}
