import React, { useState } from 'react';
import ChatMessage from './ChatMessage';
import { useTeacherCopilot } from './useTeacherCopilot';

export default function TeacherCopilot({ teacherId }) {
  const { messages, ask, loading, error, sentCount, exportTxt } = useTeacherCopilot(teacherId);
  const [question, setQuestion] = useState('');

  const submit = (e) => {
    e.preventDefault();
    ask(question);
    setQuestion('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Teacher Copilot</p>
            <h1 className="text-3xl font-bold text-gray-900">Ask about phonics, grammar, or teaching tips</h1>
            <p className="text-sm text-gray-500">Max 5 questions per session. Keeps last 10 messages.</p>
          </div>
          <button
            onClick={exportTxt}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Export chat
          </button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">Ask a question to get started.</div>
          )}
          {messages.map((m, idx) => (
            <ChatMessage key={idx} role={m.role} content={m.content} />
          ))}
        </div>

        <form onSubmit={submit} className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Ask a question</label>
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me about phonics, grammar, or teaching tips"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <p className="text-xs text-gray-500">Questions used: {sentCount}/5</p>
        </form>
      </div>
    </div>
  );
}
