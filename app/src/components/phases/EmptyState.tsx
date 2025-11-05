/**
 * EmptyState.tsx
 * Friendly empty state for filtered views
 */

export default function EmptyState({ 
  message = "No games in this filter yet",
  icon = "🎮"
}: { 
  message?: string;
  icon?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
        Nothing here yet
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-md">
        {message}
      </p>
    </div>
  );
}
