import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { deleteDoc, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import type { Kid, NewKidInput } from '../models/kid';

const KIDS_COLLECTION = 'kids';

export async function createKid(input: NewKidInput): Promise<string> {
  const kidRef = doc(collection(db, KIDS_COLLECTION));
  const payload: any = {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(kidRef, payload);

  // attach kid id to parent user doc if provided
  try {
    if (input.primaryParentId) {
      await updateDoc(doc(db, 'users', input.primaryParentId), {
        childIds: arrayUnion(kidRef.id),
        updatedAt: serverTimestamp(),
      } as any);
    }
  } catch (err) {
    // best-effort; ignore failures here so createKid remains idempotent for creation
    console.warn('Failed to update parent with child id', err);
  }

  return kidRef.id;
}

export async function getKidById(id: string): Promise<Kid | null> {
  const d = await getDoc(doc(db, KIDS_COLLECTION, id));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Kid;
}

export async function updateKid(id: string, changes: Partial<Kid>): Promise<void> {
  await updateDoc(doc(db, KIDS_COLLECTION, id), { ...changes, updatedAt: serverTimestamp() } as any);
}

export async function listKidsByParent(parentId: string): Promise<Kid[]> {
  const q = query(collection(db, KIDS_COLLECTION), where('parentIds', 'array-contains', parentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Kid));
}

export async function listAllKids(): Promise<Kid[]> {
  const snap = await getDocs(collection(db, KIDS_COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Kid));
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
