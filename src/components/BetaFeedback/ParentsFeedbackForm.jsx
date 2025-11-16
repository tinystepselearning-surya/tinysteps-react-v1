import React, { useState } from 'react';

export function ParentsFeedbackForm({ onSubmit, loading, submitted }) {
  const [form, setForm] = useState({
    improved: '',
    enjoyment: 3,
    pay: '',
    suggestions: '',
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
        Parent Feedback <span role="img" aria-label="heart">💜</span>
      </h3>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Has your child's phonics improved?</label>
        <div className="flex gap-2">
          {['yes', 'no', 'too early to tell'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleChange('improved', option)}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.improved === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              } text-sm`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Does your child enjoy Practice Buddy?</label>
        <input
          type="range"
          min={1}
          max={5}
          value={form.enjoyment}
          onChange={(e) => handleChange('enjoyment', Number(e.target.value))}
          className="w-full"
        />
        <p className="text-sm text-gray-500">Enjoyment: {form.enjoyment}/5</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Would you pay for this feature?</label>
        <div className="flex gap-2">
          {['yes', 'no', 'unsure'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleChange('pay', option)}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.pay === option ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
              } text-sm`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Suggestions for improvement?</label>
        <textarea
          value={form.suggestions}
          onChange={(e) => handleChange('suggestions', e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {loading ? 'Sending…' : submitted ? 'Thanks! 🎉' : 'Submit'}
      </button>
    </form>
  );
}

export default ParentsFeedbackForm;
