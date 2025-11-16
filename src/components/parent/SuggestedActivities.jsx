import React from 'react';

export default function SuggestedActivities({ suggestions = [], onPrint }) {
  const printContent = () => {
    if (onPrint) return onPrint();
    window.print();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Home Practice Ideas</p>
          <h3 className="text-lg font-bold text-gray-900">3-5 fun activities (5-10 mins)</h3>
        </div>
        <button
          onClick={printContent}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition"
        >
          Print
        </button>
      </div>
      {suggestions.length === 0 ? (
        <p className="text-sm text-gray-500">No activities yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-indigo-50 bg-indigo-50/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{s.title || `Activity ${idx + 1}`}</p>
                <span className="text-xs text-indigo-700">{s.time || '5-10 mins'}</span>
              </div>
              <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                {(s.steps || []).map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
