/**
 * game.ts
 * Core game catalog types aligned with Firestore schema
 */

export type GameDifficulty = "easy" | "medium" | "hard";
export type GameDuration = "quick" | "normal" | "extended"; // 5min, 15min, 30min+
export type PhonicsArea = 
  | "listening" 
  | "phoneme-awareness"
  | "letter-sounds" 
  | "blending" 
  | "digraphs"
  | "vowel-teams"
  | "syllables"
  | "fluency"
  | "comprehension";

export type GameStatus = "locked" | "available" | "in_progress" | "completed";

export interface SkillTag {
  id: string;
  label: string;
  color?: string;
}

export interface GameMeta {
  id: string;
  slug: string; // URL-friendly: "balloon-pop-phase-1"
  title: string;
  description: string;
  tagline: string; // one-liner for cards
  
  // Classification
  phaseId: string; // "P0", "P1", etc.
  area: PhonicsArea;
  difficulty: GameDifficulty;
  duration: GameDuration; // minutes
  
  // Media
  thumbnail: string; // path or URL
  icon?: string; // emoji or icon
  
  // Metadata
  ageRange: string; // "3-5", "5-7"
  skills: SkillTag[];
  learningGoals: string[]; // for parent view
  
  // Access
  isFree: boolean;
  isPremium: boolean;
  isWIP?: boolean; // work in progress, hide by default
  
  // Sorting & display
  order: number; // within phase
  featured?: boolean;
  recommendedFor?: string[]; // user traits: ["struggling-blending", "advanced-reader"]
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GameProgress {
  gameId: string;
  userId: string;
  
  // Status
  status: GameStatus;
  startedAt?: Date;
  completedAt?: Date;
  lastPlayedAt: Date;
  
  // Progress metrics
  attemptsTotal: number;
  attemptsSuccessful: number;
  currentLevel: number; // if game has levels
  highestLevel: number;
  
  // Performance KPIs
  accuracy: number; // 0-100
  averageTime?: number; // seconds per attempt
  streak: number; // consecutive correct
  longestStreak: number;
  
  // Stars & ratings (optional)
  starsEarned: number; // 0-3
  
  // Badges/achievements unlocked
  badges?: string[];
  
  // Session history (last 5 plays)
  recentSessions?: SessionSnapshot[];
}

export interface SessionSnapshot {
  timestamp: Date;
  accuracy: number;
  timeSpent: number; // seconds
  starsEarned: number;
  level?: number;
}

export interface UserProgressSummary {
  userId: string;
  
  // Aggregate stats
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  totalTimeSpent: number; // minutes
  totalStarsEarned: number;
  
  // By phase
  phaseProgress: Record<string, {
    gamesCompleted: number;
    gamesTotal: number;
    averageAccuracy: number;
  }>;
  
  // Skill strengths/weaknesses
  skillLevels: Record<PhonicsArea, {
    level: number; // 0-100
    gamesPlayed: number;
    lastPracticed?: Date;
  }>;
  
  // Recommendations
  recommendedGames: string[]; // game IDs
  
  lastUpdated: Date;
}

// Filters & sorting
export interface GameFilters {
  phaseIds: string[]; // empty = all
  areas: PhonicsArea[];
  difficulties: GameDifficulty[];
  durations: GameDuration[];
  onlyFree: boolean;
  onlyCompleted: boolean;
  hideWIP: boolean;
}

export type SortOption = 
  | "recommended" 
  | "name" 
  | "difficulty" 
  | "duration" 
  | "progress"
  | "recent";

export interface GameCatalogState {
  games: GameMeta[];
  progress: Record<string, GameProgress>; // keyed by gameId
  filters: GameFilters;
  searchQuery: string;
  sortBy: SortOption;
  parentView: boolean;
}
