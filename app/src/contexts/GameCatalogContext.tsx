/**
 * GameCatalogContext.tsx
 * Global state for game filters, search, sort, and parent view
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { GameFilters, SortOption } from "../types/game";

interface GameCatalogContextValue {
  filters: GameFilters;
  searchQuery: string;
  sortBy: SortOption;
  parentView: boolean;
  
  setFilters: (filters: Partial<GameFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  setParentView: (enabled: boolean) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: GameFilters = {
  phaseIds: [],
  areas: [],
  difficulties: [],
  durations: [],
  onlyFree: false,
  onlyCompleted: false,
  hideWIP: true,
};

const GameCatalogContext = createContext<GameCatalogContextValue | null>(null);

export function GameCatalogProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GameFilters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [parentView, setParentView] = useState(false);
  
  const setFilters = useCallback((partial: Partial<GameFilters>) => {
    setFiltersState((prev: GameFilters) => ({ ...prev, ...partial }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setSearchQuery("");
    setSortBy("recommended");
  }, []);
  
  return (
    <GameCatalogContext.Provider
      value={{
        filters,
        searchQuery,
        sortBy,
        parentView,
        setFilters,
        setSearchQuery,
        setSortBy,
        setParentView,
        resetFilters,
      }}
    >
      {children}
    </GameCatalogContext.Provider>
  );
}

export function useGameCatalog() {
  const context = useContext(GameCatalogContext);
  if (!context) {
    throw new Error("useGameCatalog must be used within GameCatalogProvider");
  }
  return context;
}
