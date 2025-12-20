/**
 * Tiny Steps Games - Catalog Cache
 * 
 * In-memory cache for games catalog to minimize Firestore reads.
 * Refreshes every 5 minutes to stay current without excessive reads.
 */

import * as admin from 'firebase-admin';

interface GamesCatalogDoc {
  version?: number;
  categories?: Record<string, any>;
  games?: Record<string, {
    title: string;
    category: string;
    totalLevels: number;
    active: boolean;
    order: number;
    progressDocId?: string;
  }>;
}

// Module-level cache
let cachedCatalog: GamesCatalogDoc | null = null;
let lastFetchedAt: number = 0;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get games catalog with in-memory caching.
 * Fetches from Firestore on first call or after cache expires.
 * 
 * @param db - Firestore instance
 * @returns Games catalog document or null if not found
 */
export async function getGamesCatalog(
  db: admin.firestore.Firestore
): Promise<GamesCatalogDoc | null> {
  const now = Date.now();

  // Return cached if still valid
  if (cachedCatalog && (now - lastFetchedAt) < CACHE_TTL_MS) {
    return cachedCatalog;
  }

  // Fetch from Firestore
  try {
    const catalogDoc = await db.doc('config/gamesCatalog').get();

    if (!catalogDoc.exists) {
      console.warn('[getGamesCatalog] config/gamesCatalog not found in Firestore');
      cachedCatalog = null;
      lastFetchedAt = now;
      return null;
    }

    const data = catalogDoc.data() as GamesCatalogDoc;
    cachedCatalog = data;
    lastFetchedAt = now;

    return data;
  } catch (error) {
    console.error('[getGamesCatalog] Failed to fetch catalog:', error);
    // Return stale cache if available
    return cachedCatalog;
  }
}
