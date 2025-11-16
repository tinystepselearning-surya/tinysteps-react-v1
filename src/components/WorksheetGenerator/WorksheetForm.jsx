import React from 'react';

export function WorksheetForm({ form, onChange, onSubmit, loading, isValid, options }) {
  const handleNumberChange = (e) => {
    const value = Number(e.target.value);
    onChange('questionCount', value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select
            value={form.topic}
            onChange={(e) => onChange('topic', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {options.TOPIC_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            value={form.level}
            onChange={(e) => onChange('level', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {options.LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet style</label>
          <select
            value={form.style}
            onChange={(e) => onChange('style', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {options.STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of questions (5-20)</label>
          <input
            type="number"
            min={5}
            max={20}
            value={form.questionCount}
            onChange={handleNumberChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isValid || loading}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create Worksheet'}
        </button>
        <p className="text-xs text-gray-500">
          Uses Groq `mixtral-8x7b-32768` with safe prompts; capped at 512 tokens in backend.
        </p>
      </div>
    </form>
  );
}

export default WorksheetForm;
