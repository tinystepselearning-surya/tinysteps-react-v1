import React from 'react';

export default function DailyProgressCard({ score, total, completed, onStart }) {
  const stars = Array.from({ length: 5 }).map((_, i) => (i < Math.round((score / Math.max(total, 1)) * 5) ? '★' : '☆'));
  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Today's Practice 🎯</p>
        <p className="text-lg font-bold text-gray-900">
          {completed ? `Completed ${score}/${total}` : `${score}/${total} completed`}
        </p>
        <p className="text-xl text-amber-500" aria-label="progress stars">
          {stars.join(' ')}
        </p>
        <p className="text-xs text-gray-500">Takes about 10 minutes.</p>
      </div>
      <button
        onClick={onStart}
        className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
      >
        {completed ? 'View Practice' : score ? 'Continue Practice' : 'Start Practice'}
      </button>
    </div>
  );
}
