export default function GameOver({ score, results, onPlayAgain }) {
  const correctCount = results.filter((r) => r.correct).length;
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 text-center space-y-3">
      <h2 className="text-2xl font-bold text-gray-900">Great spelling! 🎉</h2>
      <p className="text-lg text-gray-700">
        You spelled {correctCount} of {results.length} words correctly. Score: {score}
      </p>
      <div className="space-y-2 text-sm text-left bg-gray-50 border border-gray-100 rounded-xl p-3">
        {results.map((r, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="font-semibold">{r.word}</span>
            <span className={r.correct ? 'text-emerald-600' : 'text-amber-700'}>
              {r.correct ? '✅' : '❌'}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onPlayAgain}
        className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-yellow-500 text-white font-semibold shadow hover:bg-yellow-600 transition"
      >
        Play again
      </button>
    </div>
  );
}
