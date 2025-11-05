export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full" aria-label={label ?? "Progress"}>
      <div
        className="h-2 w-full rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-[width] duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
      {label && <span className="sr-only">{label}: {safe}%</span>}
    </div>
  );
}
