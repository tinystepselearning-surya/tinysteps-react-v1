/**
 * Tiny Steps Games Engine - Core Types
 * 
 * Unified type system for all Tiny Steps educational games.
 * Supports skill-based progress tracking with tag deltas.
 */

// ========== Basic Game Identifiers ==========

export type GameId = string;
export type TopicId = string;
export type LevelId = number;
export type SkillTag = string;

// ========== Skill Tag Deltas ==========

/**
 * Represents changes in a skill during gameplay.
 * Used to track learning progress at the tag level.
 */
export interface TagDelta {
  attempts: number;
  correct: number;
  wrong: number;
}

// ========== Level Result ==========

/**
 * Complete result data from a finished level.
 * Submitted at level end (not per-attempt).
 * 
 * Skill tags follow the standard:
 * - letter:<a-z>
 * - sound:<phoneme>
 * - subtopic:<topicId>
 * - confusion:<x-y>
 * - rule:<ruleId>
 */
export interface LevelResult {
  kidId: string;
  gameId: GameId;
  levelId: LevelId;
  completed: boolean;
  stars?: number;
  score?: number;
  accuracyPct?: number;
  durationSec?: number;
  tagDeltas: Record<SkillTag, TagDelta>;
  evidence?: {
    itemId?: string;
    [key: string]: unknown;
  };
}

// ========== Games Catalog Types ==========

/**
 * Category definition in the games catalog.
 */
export interface CatalogCategory {
  label: string;
  order: number;
}

/**
 * Game definition in the games catalog.
 */
export interface CatalogGame {
  title: string;
  category: TopicId;
  totalLevels: number;
  active: boolean;
  order: number;
  progressDocId?: string; // Optional override for Firestore doc ID
}

/**
 * Complete games catalog document from Firestore.
 * Stored at: config/gamesCatalog
 */
export interface GamesCatalogDoc {
  version: number;
  categories: Record<string, CatalogCategory>;
  games: Record<string, CatalogGame>;
}
