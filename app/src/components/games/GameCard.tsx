/**
 * GameCard.tsx
 * Game catalog card with thumbnail, badge, progress, and CTA
 * Adapts copy based on parentView mode
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { GameMeta, GameProgress } from "../../types/game";
import ProgressBar from "./ProgressBar";
import RatingStars from "./RatingStars";
import SkillTags from "./SkillTags";

interface GameCardProps {
  game: GameMeta;
  progress?: GameProgress;
  parentView?: boolean;
  onPlay?: (gameId: string) => void;
}

export default function GameCard({ game, progress, parentView = false, onPlay }: GameCardProps) {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/kids/game/${game.slug}`);
  };
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(game.id);
    } else {
      navigate(`/kids/game/${game.slug}`);
    }
  };
  
  const getStatusBadge = () => {
    if (!progress) return { label: "New", color: "bg-blue-500" };
    if (progress.status === "completed") return { label: "Completed", color: "bg-emerald-500" };
    if (progress.status === "in_progress") return { label: "In Progress", color: "bg-amber-500" };
    return { label: "Available", color: "bg-gray-400" };
  };
  
  const getDifficultyColor = () => {
    switch (game.difficulty) {
      case "easy": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
      case "hard": return "text-red-600 bg-red-50 border-red-200";
    }
  };
  
  const getDurationLabel = () => {
    switch (game.duration) {
      case "quick": return "⚡ 5 min";
      case "normal": return "⏱️ 15 min";
      case "extended": return "🕐 30+ min";
    }
  };
  
  const statusBadge = getStatusBadge();
  const progressPercent = progress ? (progress.currentLevel / progress.highestLevel) * 100 || progress.accuracy : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      onMouseEnter={() => {
        // Prefetch game route on hover
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/kids/game/${game.slug}`;
        document.head.appendChild(link);
      }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-orange-100/50 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Status badge - top left */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`inline-flex items-center gap-1 rounded-lg ${statusBadge.color} backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white shadow-sm`}>
          {statusBadge.label}
        </span>
      </div>
      
      {/* Premium badge - top right */}
      {game.isPremium && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            ⭐ Premium
          </span>
        </div>
      )}
      
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-orange-100 to-sky-100 overflow-hidden">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center size-full text-6xl">
            {game.icon || "🎮"}
          </div>
        )}
        
        {/* Difficulty badge - bottom left on thumbnail */}
        <div className="absolute bottom-2 left-2">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${getDifficultyColor()}`}>
            {game.difficulty}
          </span>
        </div>
        
        {/* Duration - bottom right on thumbnail */}
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200">
            {getDurationLabel()}
          </span>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        {/* Title & tagline */}
        <h3 className="text-base font-semibold tracking-tight text-gray-900 line-clamp-1 mb-1">
          {game.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {parentView ? game.learningGoals[0] || game.tagline : game.tagline}
        </p>
        
        {/* Skills */}
        <div className="mb-3">
          <SkillTags skills={game.skills} maxDisplay={3} size="sm" />
        </div>
        
        {/* Progress bar (if started) */}
        {progress && progress.status !== "locked" && (
          <div className="mb-3">
            <ProgressBar progress={progressPercent} size="sm" showLabel={false} />
          </div>
        )}
        
        {/* Stars (if completed) */}
        {progress && progress.status === "completed" && (
          <div className="mb-3 flex items-center justify-between">
            <RatingStars rating={progress.starsEarned} size="sm" />
            <span className="text-xs font-semibold text-emerald-600">
              {progress.accuracy}% accuracy
            </span>
          </div>
        )}
        
        {/* CTA Button */}
        <button
          onClick={handlePlayClick}
          className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-orange-400 to-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-500 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
        >
          {parentView 
            ? "📊 View Learning Goals" 
            : progress?.status === "in_progress" 
              ? "▶️ Continue Playing" 
              : progress?.status === "completed"
                ? "🔁 Play Again"
                : "🎮 Start Game"}
        </button>
      </div>
    </motion.div>
  );
}
