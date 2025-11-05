/**
 * GameGrid.tsx
 * Responsive grid of game cards with loading skeletons and empty state
 */

import type { GameMeta, GameProgress } from "../../types/game";
import GameCard from "./GameCard";
import EmptyState from "../phases/EmptyState";

interface GameGridProps {
  games: GameMeta[];
  progress?: Record<string, GameProgress>;
  parentView?: boolean;
  isLoading?: boolean;
  onPlay?: (gameId: string) => void;
}

function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-md" />
          <div className="h-5 w-16 bg-gray-200 rounded-md" />
        </div>
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function GameGrid({ games, progress, parentView, isLoading, onPlay }: GameGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (games.length === 0) {
    return (
      <EmptyState 
        message="No games match your current filters. Try adjusting your selection." 
        icon="🎯" 
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          progress={progress?.[game.id]}
          parentView={parentView}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
}
