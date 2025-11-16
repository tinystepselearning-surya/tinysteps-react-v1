import React from 'react';

export default function PromptDisplay({ prompt, targetTime, topic }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
      <p className="text-sm text-indigo-600 font-semibold">Speaking Prompt</p>
      <h2 className="text-xl font-bold text-gray-900">{prompt || 'Loading prompt…'}</h2>
      <p className="text-sm text-gray-500">Target time: {targetTime || 30}s · Topic: {topic || 'General'}</p>
    </div>
  );
}
