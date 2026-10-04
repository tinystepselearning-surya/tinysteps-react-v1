// src/services/kidsService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import type { Kid, NewKidInput } from '../models/kid';

const KIDS_COLLECTION = 'kids';

export async function getKidById(id: string): Promise<Kid | null> {
  const d = await getDoc(doc(db, KIDS_COLLECTION, id));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Kid;
}

export async function listKidsByParent(parentId: string): Promise<Kid[]> {
  const qy = query(collection(db, KIDS_COLLECTION), where('parentIds', 'array-contains', parentId));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Kid));
}

export async function listAllKids(): Promise<Kid[]> {
  const snap = await getDocs(collection(db, KIDS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Kid));
}

export async function deleteKid(id: string): Promise<void> {
  const kidRef = doc(db, KIDS_COLLECTION, id);
  const kidSnap = await getDoc(kidRef);
  if (!kidSnap.exists()) return;

  const data = kidSnap.data() as any;
  const parentIds: string[] = data.parentIds || [];

  const batch = writeBatch(db);

  // remove kid id from parent user docs
  for (const pid of parentIds) {
    const userRef = doc(db, 'users', pid);
    batch.update(userRef, { childIds: arrayRemove(id), updatedAt: serverTimestamp() } as any);
  }

  // delete the kid doc
  batch.delete(kidRef);

  await batch.commit();
}
