import React, { useState } from 'react';

const TOPICS = ['Phonics', 'Grammar', 'Spelling', 'Reading', 'Writing'];

export function TeacherFeedbackForm({ onSubmit, loading, submitted }) {
  const [form, setForm] = useState({
    rating: 3,
    timeTaken: '',
    reuse: 'maybe',
    topics: [],
    bugs: '',
    overall: '',
  });

  const toggleTopic = (topic) => {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
        Teacher Feedback <span role="img" aria-label="sparkle">✨</span>
      </h3>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Rate the Worksheet Generator</label>
        <input
          type="range"
          min={1}
          max={5}
          value={form.rating}
          onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
          className="w-full"
        />
        <p className="text-sm text-gray-500">Rating: {form.rating}/5</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">How long to generate? (seconds)</label>
        <input
          value={form.timeTaken}
          onChange={(e) => setForm((p) => ({ ...p, timeTaken: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="e.g., 4s"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Would you use this regularly?</label>
        <div className="flex gap-2">
          {['yes', 'no', 'maybe'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => setForm((p) => ({ ...p, reuse: option }))}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.reuse === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Topics you'd like generated</label>
        <div className="grid grid-cols-2 gap-2">
          {TOPICS.map((topic) => (
            <button
              type="button"
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-2 rounded-xl border text-sm ${
                form.topics.includes(topic) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Any bugs or errors?</label>
        <textarea
          value={form.bugs}
          onChange={(e) => setForm((p) => ({ ...p, bugs: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Overall feedback</label>
        <textarea
          value={form.overall}
          onChange={(e) => setForm((p) => ({ ...p, overall: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {loading ? 'Sending…' : submitted ? 'Saved! 🎉' : 'Submit'}
      </button>
    </form>
  );
}

export default TeacherFeedbackForm;
