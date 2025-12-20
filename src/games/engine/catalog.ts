/**
 * Tiny Steps Games Engine - Catalog Reader
 * 
 * Fetches and parses the games catalog from Firestore.
 * Catalog stored at: config/gamesCatalog
 * 
 * Provides helpers to query active games/topics.
 */

import type { GamesCatalogDoc, CatalogCategory, CatalogGame, GameId, TopicId } from './types';

/**
 * Fetch the games catalog from Firestore.
 * Uses dynamic imports to keep bundle size small.
 * 
 * @returns Catalog document or null if not found
 */
export async function fetchGamesCatalog(): Promise<GamesCatalogDoc | null> {
  try {
    const [{ doc, getDoc }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../../lib/firebaseConfig'),
    ]);

    const catalogDoc = await getDoc(doc(db, 'config', 'gamesCatalog'));
    
    if (!catalogDoc.exists()) {
      console.warn('[GamesCatalog] config/gamesCatalog not found in Firestore');
      return null;
    }

    return catalogDoc.data() as GamesCatalogDoc;
  } catch (error) {
    console.error('[GamesCatalog] Failed to fetch catalog:', error);
    return null;
  }
}

// ========== Catalog Selectors ==========

/**
 * Get all active topics sorted by order.
 * 
 * @param catalog - Games catalog document
 * @returns Array of [topicId, category] sorted by category.order
 */
export function getActiveTopics(catalog: GamesCatalogDoc | null): Array<[string, CatalogCategory]> {
  if (!catalog || !catalog.categories) return [];
  
  return Object.entries(catalog.categories)
    .sort(([, a], [, b]) => a.order - b.order);
}

/**
 * Get all active games for a specific topic, sorted by order.
 * 
 * @param catalog - Games catalog document
 * @param topicId - Topic identifier
 * @returns Array of [gameId, game] sorted by game.order
 */
export function getActiveGamesByTopic(
  catalog: GamesCatalogDoc | null,
  topicId: TopicId
): Array<[GameId, CatalogGame]> {
  if (!catalog || !catalog.games) return [];
  
  return Object.entries(catalog.games)
    .filter(([, game]) => game.active && game.category === topicId)
    .sort(([, a], [, b]) => a.order - b.order);
}

/**
 * Get a specific game by ID.
 * 
 * @param catalog - Games catalog document
 * @param gameId - Game identifier
 * @returns Game config or undefined
 */
export function getGameById(
  catalog: GamesCatalogDoc | null,
  gameId: GameId
): CatalogGame | undefined {
  if (!catalog || !catalog.games) return undefined;
  return catalog.games[gameId];
}

/**
 * Resolve the Firestore progress document ID for a game.
 * Uses catalog override if specified, otherwise returns gameId.
 * 
 * @param catalog - Games catalog document
 * @param gameId - Game identifier
 * @returns Progress document ID
 */
export function resolveProgressDocId(
  catalog: GamesCatalogDoc | null,
  gameId: GameId
): string {
  const game = getGameById(catalog, gameId);
  return game?.progressDocId ?? gameId;
}
