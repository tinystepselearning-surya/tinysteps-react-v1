import { useState, useMemo } from "react";
import { sampleGames } from "../../data/sampleGamesSimple";
import { GameCard } from "../../components/gallery/GameCard";
import { ParentToggle } from "../../components/gallery/ParentToggle";
import { PhaseFilter } from "../../components/gallery/PhaseFilter";

export default function GamesGalleryEnhanced() {
  const [parentMode, setParentMode] = useState(false);
  const [phase, setPhase] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading] = useState(false);

  // In future: replace local with Firestore onSnapshot and setLoading(true/false).
  const games = sampleGames;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games
      .filter(g => phase === "all" ? true : String(g.phase) === phase)
      .filter(g => q ? (g.title.toLowerCase().includes(q) || g.area.toLowerCase().includes(q)) : true)
      .sort((a, b) => {
        // Default sort: featured first, then by phase, then title
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        if (a.phase !== b.phase) return a.phase - b.phase;
        return a.title.localeCompare(b.title);
      });
  }, [games, phase, search]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Games Gallery</h1>
          <p className="text-sm text-gray-600">
            {parentMode
              ? "Curated learning experiences with clear goals and progress."
              : "Playful practice that adapts to your child. Tap a card to begin."}
          </p>
        </div>
        <ParentToggle checked={parentMode} onChange={setParentMode} />
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PhaseFilter value={phase} onChange={setPhase} />
        <div className="sm:w-64">
          <input
            type="search"
            placeholder="Search games…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search games"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 p-4 animate-pulse">
              <div className="w-full aspect-[16/9] rounded-xl bg-gray-200 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-8 text-center bg-white">
          <h3 className="text-lg font-semibold text-gray-900">No games match this filter yet</h3>
          <p className="text-sm text-gray-600 mt-1">Try switching phases or clearing the search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((g) => (
            <GameCard key={g.id} meta={g} parentMode={parentMode} progressPct={0} />
          ))}
        </div>
      )}
    </section>
  );
}
