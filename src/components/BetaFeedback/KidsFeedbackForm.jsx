import React, { useState } from 'react';

export function KidsFeedbackForm({ onSubmit, loading, submitted }) {
  const [form, setForm] = useState({
    liked: '',
    favoriteWord: '',
    difficulty: '',
    reuse: '',
    comment: '',
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
        Kids Feedback <span role="img" aria-label="smile">😊</span>
      </h3>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Did you like Practice Buddy?</label>
        <div className="flex gap-2">
          {['yes', 'no', 'maybe'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleChange('liked', option)}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.liked === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              {option === 'yes' ? '😀 Yes' : option === 'no' ? '🙁 No' : '🤔 Maybe'}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Which word was your favorite?</label>
        <input
          value={form.favoriteWord}
          onChange={(e) => handleChange('favoriteWord', e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="cat / pin / tap..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Was it hard or easy?</label>
        <div className="flex gap-2">
          {['easy', 'just right', 'hard'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleChange('difficulty', option)}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.difficulty === option ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              {option === 'easy' ? '🙂 Easy' : option === 'just right' ? '😎 Just right' : '😅 Hard'}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Would you use it again?</label>
        <div className="flex gap-2">
          {['yes', 'no'].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleChange('reuse', option)}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                form.reuse === option ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
              }`}
            >
              {option === 'yes' ? '👍 Yes' : '👎 No'}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800">Anything else?</label>
        <input
          value={form.comment}
          onChange={(e) => handleChange('comment', e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Tell us with emojis!"
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

export default KidsFeedbackForm;
