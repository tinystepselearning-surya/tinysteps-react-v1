export default function GameHeader({ score, streak, index, total, onReset }) {
  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 flex items-center justify-between text-white shadow">
      <div>
        <p className="text-sm font-semibold">SpellBee Trainer</p>
        <h1 className="text-2xl font-bold">Ready to spell? 🐝</h1>
        <p className="text-sm opacity-90">
          Word {Math.min(index + 1, total)}/{total || 5} • Streak {streak}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm opacity-90">Score</p>
        <p className="text-3xl font-bold">{score}</p>
        <button
          onClick={onReset}
          className="mt-2 px-3 py-1 text-sm bg-white/90 text-orange-600 font-semibold rounded-lg shadow hover:bg-white"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
