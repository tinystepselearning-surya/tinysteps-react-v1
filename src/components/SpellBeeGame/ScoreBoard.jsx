export default function ScoreBoard({ score, streak, attempts, total }) {
  const accuracy = attempts ? Math.round((score / (attempts * 10)) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl shadow p-4 border border-gray-100 flex flex-wrap gap-4 justify-between">
      <Stat label="Score" value={score} />
      <Stat label="Streak" value={streak} />
      <Stat label="Words tried" value={`${attempts}/${total || 5}`} />
      <Stat label="Accuracy" value={`${accuracy}%`} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
