/**
 * Tiny Steps Games Engine - Games Catalog Hook
 * 
 * React Query hook for fetching and caching the games catalog.
 * Catalog defines all available games, categories, and metadata.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchGamesCatalog } from '../engine/catalog';
import type { GamesCatalogDoc } from '../engine/types';

/**
 * Hook to fetch and cache the games catalog.
 * 
 * The catalog is cached for 24 hours to minimize Firestore reads.
 * Parents should not need frequent refetches during a session.
 * 
 * @returns React Query result with catalog data
 */
export function useGamesCatalog() {
  return useQuery<GamesCatalogDoc | null>({
    queryKey: ['gamesCatalog'],
    queryFn: fetchGamesCatalog,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
