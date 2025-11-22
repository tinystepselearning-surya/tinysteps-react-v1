
export default function ComprehensionQuestion({ question, options, onSelect }) {
  if (!question) return null;
  return (
    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-3">
      <p className="text-sm text-indigo-700 font-semibold">Comprehension Check</p>
      <p className="text-lg font-bold text-gray-900">{question}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {(options || []).map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(opt)}
            className="px-4 py-3 rounded-xl bg-white border border-indigo-200 text-indigo-800 font-semibold hover:border-indigo-300 transition"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
