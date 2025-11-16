import React from 'react';

export default function StoryResult({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
      <p className="text-sm font-semibold text-gray-700">Your choices:</p>
      {history.map((h, idx) => (
        <div key={idx} className="flex justify-between text-sm">
          <span>{h.snippet?.snippet?.replace('______', '____')}</span>
          <span className={h.correct ? 'text-emerald-600' : 'text-amber-700'}>
            {h.choice?.text} {h.correct ? '✅' : '❌'}
          </span>
        </div>
      ))}
    </div>
  );
}
