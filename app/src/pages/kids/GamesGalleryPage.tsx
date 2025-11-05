/**
 * GamesGalleryPage.tsx
 * Main games catalog with filters, search, and sorting
 * Can be used standalone at /kids/games-gallery or embedded in other views
 */

import { useState, useMemo, useEffect } from "react";
import { useGameCatalog } from "../../contexts/GameCatalogContext";
import { SAMPLE_GAMES } from "../../data/sampleGames";
import type { SortOption } from "../../types/game";
import GalleryHeader from "../../components/games/GalleryHeader";
import GameFilters from "../../components/games/GameFilters";
import GameGrid from "../../components/games/GameGrid";

interface GamesGalleryPageProps {
  embedded?: boolean; // Hide header when embedded in another view
}

export default function GamesGalleryPage({ embedded = false }: GamesGalleryPageProps) {
  const {
    filters,
    searchQuery,
    sortBy,
    parentView,
    setFilters,
    setSearchQuery,
    setSortBy,
    setParentView,
    resetFilters,
  } = useGameCatalog();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Filter and sort games
  const filteredGames = useMemo(() => {
    let games = SAMPLE_GAMES;
    
    // Hide WIP games
    if (filters.hideWIP) {
      games = games.filter((g) => !g.isWIP);
    }
    
    // Phase filter
    if (filters.phaseIds.length > 0) {
      games = games.filter((g) => filters.phaseIds.includes(g.phaseId));
    }
    
    // Area filter
    if (filters.areas.length > 0) {
      games = games.filter((g) => filters.areas.includes(g.area));
    }
    
    // Difficulty filter
    if (filters.difficulties.length > 0) {
      games = games.filter((g) => filters.difficulties.includes(g.difficulty));
    }
    
    // Duration filter
    if (filters.durations.length > 0) {
      games = games.filter((g) => filters.durations.includes(g.duration));
    }
    
    // Only free
    if (filters.onlyFree) {
      games = games.filter((g) => g.isFree);
    }
    
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      games = games.filter((g) =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.tagline.toLowerCase().includes(query) ||
        g.skills.some((s) => s.label.toLowerCase().includes(query))
      );
    }
    
    return games;
  }, [filters, searchQuery]);
  
  // Sort games
  const sortedGames = useMemo(() => {
    const games = [...filteredGames];
    
    switch (sortBy) {
      case "name":
        return games.sort((a, b) => a.title.localeCompare(b.title));
      
      case "difficulty":
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        return games.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
      
      case "duration":
        const durOrder = { quick: 1, normal: 2, extended: 3 };
        return games.sort((a, b) => durOrder[a.duration] - durOrder[b.duration]);
      
      case "recommended":
      default:
        // Featured first, then by phase order
        return games.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.order - b.order;
        });
    }
  }, [filteredGames, sortBy]);
  
  return (
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-rose-50"}>
      <div className={embedded ? "" : "mx-auto max-w-7xl px-4 py-8 md:px-6"}>
        {/* Header - only show if not embedded */}
        {!embedded && (
          <GalleryHeader
            title={parentView ? "📊 Learning Games Library" : "🎮 Games Gallery"}
            description={
              parentView
                ? "Browse educational games and track your child's learning progress"
                : "Explore fun phonics games matched to your level"
            }
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            parentView={parentView}
            onParentViewChange={setParentView}
          />
        )}
        
        {/* Search bar for embedded mode */}
        {embedded && (
          <div className="mb-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games by name, skill, or topic..."
                className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        )}
        
        {/* Filters toggle (mobile) */}
        <div className="mt-6 lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showFilters ? "Hide Filters" : "Show Filters"} ({filteredGames.length} games)
          </button>
        </div>
        
        {/* Main content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <GameFilters
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />
          </aside>
          
          {/* Games grid */}
          <main>
            {/* Sort bar */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {sortedGames.length} game{sortedGames.length !== 1 ? 's' : ''} found
              </p>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="recommended">Recommended</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
            
            {/* Grid */}
            <GameGrid
              games={sortedGames}
              parentView={parentView}
              isLoading={isLoading}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
