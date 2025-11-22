
export default function ExerciseResult({ result, onNext }) {
  if (!result) return null;
  const { correct, explanation, answer } = result;
  return (
    <div
      className={`mt-3 p-4 rounded-2xl border ${
        correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-lg">
          {correct ? '🎉 Great job!' : 'Try again!'}
        </p>
        {!correct && answer && (
          <span className="text-xs text-amber-700">Answer: {answer}</span>
        )}
      </div>
      <p className="text-sm mt-1">{explanation || (correct ? 'Nice work!' : 'Keep practicing!')}</p>
      {onNext && (
        <button
          onClick={onNext}
          className="mt-3 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition"
        >
          Next
        </button>
      )}
    </div>
  );
}
