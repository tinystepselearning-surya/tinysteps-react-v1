import React from 'react';

export default function FeedbackDisplay({ feedback }) {
  if (!feedback) return null;
  return (
    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 space-y-1">
      <p className="text-lg font-bold">Feedback</p>
      <p className="text-sm">Clarity: {feedback.clarity || '-'}/5</p>
      <p className="text-sm">Speed: {feedback.speed || '-'}/5</p>
      <p className="text-sm">Pronunciation: {feedback.pronunciation || '-'}/5</p>
      <p className="text-sm">{feedback.overall || feedback.message || ''}</p>
    </div>
  );
}
