// src/hooks/useParentFilteredData.ts
import { useMemo } from 'react';
// Import *all* exports from the legacy JS hook
import * as legacyModule from '../pages/parent/hooks/useParentChildren.js';

export interface FilteredChild {
  id?: string;
  uid?: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  age?: number | string | null;
  grade?: string | null;
  enrollmentCount?: number;
  averageMastery?: number;
  // we’ll extend this in KidDashboard (status, mastery fields)
}

interface UseParentFilteredChildrenResult {
  children: FilteredChild[];
  loading: boolean;
  error: string | null;
}

/**
 * Resolve the actual hook function from the legacy JS module.
 * It supports:
 *   - export function useParentChildren() {}
 *   - export const useParentChildren = () => {}
 *   - export default function () {}
 */
function resolveLegacyHook(): () => any {
  const mod: any = legacyModule;

  // Case 1: module itself is a function (rare)
  if (typeof mod === 'function') return mod;

  // Case 2: named export useParentChildren
  if (typeof mod.useParentChildren === 'function') {
    return mod.useParentChildren;
  }

  // Case 3: default export is a function
  if (typeof mod.default === 'function') {
    return mod.default;
  }

  throw new Error(
    'Legacy hook not found in /src/pages/parent/hooks/useParentChildren.js',
  );
}

// Resolve once at module load — we only *call* it inside our hook
const legacyHook = resolveLegacyHook();

/**
 * Try to recognize an array of "children" objects by their keys.
 */
function looksLikeChildArray(arr: any[]): boolean {
  if (!arr.length) return true; // empty is ok
  const first = arr[0];
  if (typeof first !== 'object' || first == null) return false;

  const keys = Object.keys(first);
  const childishKeys = [
    'fullName',
    'displayName',
    'name',
    'grade',
    'uid',
    'id',
    'studentId',
  ];

  return keys.some((k) => childishKeys.includes(k));
}

/**
 * Deep search for an array that looks like children anywhere inside rawResult.
 */
function findChildArrayDeep(
  node: any,
  depth = 0,
  visited = new Set<any>(),
): any[] | null {
  if (!node || typeof node !== 'object') return null;
  if (visited.has(node)) return null;
  visited.add(node);

  if (Array.isArray(node)) {
    if (looksLikeChildArray(node)) return node;
    // if it's some other array (like docs), let the caller handle that
    return null;
  }

  if (depth > 5) return null; // avoid going crazy deep

  for (const value of Object.values(node)) {
    if (!value || typeof value !== 'object') continue;
    const found = findChildArrayDeep(value, depth + 1, visited);
    if (found) return found;
  }

  return null;
}

/**
 * Normalize whatever the legacy hook returns into an array of children.
 */
function normalizeChildren(rawResult: any): FilteredChild[] {
  if (!rawResult) return [];

  // 1) If legacy hook already returns { children: [...] } or { kids: [...] }
  const direct = rawResult.children ?? rawResult.kids;
  if (Array.isArray(direct)) {
    return direct as FilteredChild[];
  }

  // 2) If the hook itself returns an array of children
  if (Array.isArray(rawResult) && looksLikeChildArray(rawResult)) {
    return rawResult as FilteredChild[];
  }

  // 3) ReactFire / Firestore-style: { data: [...] }
  if (Array.isArray(rawResult.data) && looksLikeChildArray(rawResult.data)) {
    return rawResult.data as FilteredChild[];
  }

  // 4) Firestore snapshot: { docs: [ { id, data() }, ... ] }
  if (Array.isArray(rawResult.docs)) {
    const mapped = rawResult.docs.map((doc: any) => {
      const base =
        typeof doc.data === 'function'
          ? doc.data()
          : doc.data ?? doc; // defensive
      return {
        id: doc.id ?? base?.id,
        ...base,
      } as FilteredChild;
    });

    if (looksLikeChildArray(mapped)) {
      return mapped;
    }
  }

  // 5) Map object: { childId1: {...}, childId2: {...} }
  if (typeof rawResult === 'object' && rawResult !== null) {
    const values = Object.values(rawResult);
    const keys = Object.keys(rawResult);

    if (values.length && typeof values[0] === 'object') {
      const mapped = keys.map((key, index) => {
        const value: any = values[index] ?? {};
        return {
          id: value.id ?? value.uid ?? key,
          ...value,
        } as FilteredChild;
      });

      if (looksLikeChildArray(mapped)) {
        return mapped;
      }
    }
  }

  // 6) Last resort: deep search anywhere inside rawResult
  const deep = findChildArrayDeep(rawResult);
  if (deep && Array.isArray(deep)) {
    return deep as FilteredChild[];
  }

  // Fallback: nothing that looks like children
  return [];
}

/**
 * TS-friendly wrapper around the legacy JS hook.
 * Keeps all the old Firestore logic but returns a clean
 * { children, loading, error } object.
 */
export function useParentFilteredChildren(): UseParentFilteredChildrenResult {
  // Call the legacy hook (this is a real React hook)
  const rawResult: any = legacyHook();

  const children: FilteredChild[] = useMemo(
    () => normalizeChildren(rawResult),
    [rawResult],
  );

  const loading: boolean =
    rawResult?.loading ??
    rawResult?.isLoading ??
    rawResult?.fetching ??
    false;

  const errorValue = rawResult?.error ?? rawResult?.errorMessage ?? null;
  const error: string | null =
    typeof errorValue === 'string'
      ? errorValue
      : errorValue?.message ?? null;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    try {
      // Shallow log the keys + child count
      const keys =
        rawResult && typeof rawResult === 'object'
          ? Object.keys(rawResult)
          : null;

      console.log('[useParentFilteredChildren][wrapped]', {
        rawResultType: typeof rawResult,
        rawResultKeys: keys,
        childrenCount: children.length,
        loading,
        error,
        sampleChild: children[0] ?? null,
      });
    } catch {
      console.log('[useParentFilteredChildren][wrapped]', {
        childrenCount: children.length,
        loading,
        error,
        sampleChild: children[0] ?? null,
      });
    }
  }

  return { children, loading, error };
}
