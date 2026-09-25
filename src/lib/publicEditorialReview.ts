import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type PublicEditorialApproval = {
  conceptId: string;
  reviewerKey: 'founder-priya';
  reviewedAt: string;
  reviewedRevision: string;
};

type PublicEditorialReviewState = {
  approvals?: Record<string, PublicEditorialApproval>;
};

let cachedPromise: Promise<Record<string, PublicEditorialApproval>> | null = null;

async function loadPublicApprovals(): Promise<Record<string, PublicEditorialApproval>> {
  if (!cachedPromise) {
    cachedPromise = getDoc(doc(db, 'publicEditorialReviewState', 'phonics'))
      .then((snap) => {
        if (!snap.exists()) return {};
        const data = snap.data() as PublicEditorialReviewState;
        return data.approvals && typeof data.approvals === 'object' ? data.approvals : {};
      })
      .catch((error) => {
        cachedPromise = null;
        console.warn('[editorial-review] public approval load failed', {
          code: typeof (error as any)?.code === 'string' ? (error as any).code : undefined,
        });
        return {};
      });
  }
  return cachedPromise;
}

export function clearPublicEditorialReviewCache() {
  cachedPromise = null;
}

export function usePublicEditorialApproval(
  conceptId: string,
  publicationRevision: string,
): PublicEditorialApproval | null {
  const [approval, setApproval] = useState<PublicEditorialApproval | null>(null);

  useEffect(() => {
    let active = true;
    if (!conceptId || !publicationRevision) {
      setApproval(null);
      return () => {
        active = false;
      };
    }
    void loadPublicApprovals().then((approvals) => {
      if (!active) return;
      const candidate = approvals[conceptId];
      if (
        candidate &&
        candidate.reviewerKey === 'founder-priya' &&
        candidate.reviewedRevision === publicationRevision &&
        typeof candidate.reviewedAt === 'string'
      ) {
        setApproval(candidate);
        return;
      }
      setApproval(null);
    });
    return () => {
      active = false;
    };
  }, [conceptId, publicationRevision]);

  return approval;
}
