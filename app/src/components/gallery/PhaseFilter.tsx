export function PhaseFilter({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (v: string) => void;
}) {
  const phases = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  
  return (
    <div role="tablist" aria-label="Filter by phase" className="flex flex-wrap gap-2">
      {phases.map((p) => {
        const isActive = value === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={isActive}
            aria-controls={`games-panel-${p}`}
            onClick={() => onChange(p)}
            className={`
              px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
              ${isActive 
                ? 'bg-gradient-to-r from-orange-400 to-sky-400 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {p === "all" ? "All" : `P${p}`}
          </button>
        );
      })}
    </div>
  );
}
