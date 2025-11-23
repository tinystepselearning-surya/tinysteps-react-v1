// src/pages/parent/hooks/useParentChildren.js

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// ⬇️ Adjust if your exports are named differently
import { db, auth } from '../../../lib/firebaseConfig';

/**
 * Map a kid document into the shape KidDashboard / parent views expect.
 */
const mapChildFromSnapshot = (docSnap) => {
  const data = docSnap.data() || {};
  const summary = data.summary || {};

  return {
    // IDs
    id: docSnap.id,
    uid: data.uid ?? docSnap.id,

    // Names
    fullName: data.fullName || data.name || 'Child',
    displayName: data.displayName || data.fullName || data.name || null,
    name: data.name || null,

    // Basic info
    grade: data.grade || data.className || null,
    courses: data.courseNames || data.courses || [],

    // Status + mastery with safe fallbacks
    status: data.status || 'active',
    phonicsMastery:
      summary.phonicsMastery ??
      data.phonicsMastery ??
      (data.phonics && data.phonics.mastery) ??
      0,
    grammarMastery:
      summary.grammarMastery ??
      data.grammarMastery ??
      (data.grammar && data.grammar.mastery) ??
      0,
    speakingMastery:
      summary.speakingMastery ??
      data.speakingMastery ??
      (data.speaking && data.speaking.mastery) ??
      0,

    avatarUrl: data.avatarUrl || null,

    // Keep all original fields as well
    ...data,
  };
};

/**
 * Hook: useParentChildren
 *
 * Reads all kids for the logged-in parent from Firestore.
 * Collection: "kids"
 * Field: parentIds: string[]  (array of parent UIDs)
 *
 * Signature:
 *   - If called with parentIdFromProp, uses that.
 *   - If called with no args (like your TS wrapper), it derives parentUid from Firebase Auth.
 *
 * Returns: { children, loading, error }
 */
export function useParentChildren(parentIdFromProp) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeKids;

    const startKidsListener = (parentId) => {
      // No parent → clear and stop
      if (!parentId) {
        setChildren([]);
        setLoading(false);
        setError(null);
        if (unsubscribeKids) {
          unsubscribeKids();
          unsubscribeKids = undefined;
        }
        return;
      }

      setLoading(true);

      const kidsRef = collection(db, 'kids');
      const q = query(kidsRef, where('parentIds', 'array-contains', parentId));

      if (unsubscribeKids) {
        unsubscribeKids();
        unsubscribeKids = undefined;
      }

      unsubscribeKids = onSnapshot(
        q,
        (snap) => {
          const kids = snap.docs.map((docSnap) => mapChildFromSnapshot(docSnap));
          setChildren(kids);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setChildren([]);
          setLoading(false);
          setError(err?.message || String(err));
        },
      );
    };

    // If parentId explicitly passed, use it (for any legacy callers)
    if (parentIdFromProp) {
      startKidsListener(parentIdFromProp);
    } else {
      // Otherwise derive parent UID from auth (this is what your TS wrapper uses)
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        const parentUid = user?.uid ?? null;
        startKidsListener(parentUid);
      });
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeKids) unsubscribeKids();
    };
  }, [parentIdFromProp]);

  return { children, loading, error };
}

export default useParentChildren;
