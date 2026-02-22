// src/services/kidsService.ts
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
  arrayRemove,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import type { Kid, NewKidInput } from '../models/kid';

const KIDS_COLLECTION = 'kids';

/** Remove DOB-ish fields so we never store them going forward */
function stripDobFields(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  if ('dob' in obj) delete obj.dob;
  if ('birthdate' in obj) delete obj.birthdate;
  if ('dateOfBirth' in obj) delete obj.dateOfBirth;
}

/** Normalize age input. Supports legacy ageYears -> age */
function normalizeAge(obj: any) {
  if (!obj || typeof obj !== 'object') return;

  // Accept age from either age or ageYears
  const raw = obj.age ?? obj.ageYears;

  // If neither is present, do nothing
  const hasAge =
    Object.prototype.hasOwnProperty.call(obj, 'age') ||
    Object.prototype.hasOwnProperty.call(obj, 'ageYears');

  if (!hasAge) return;

  // Empty string => null
  if (raw === '' || raw == null) {
    obj.age = null;
    delete obj.ageYears;
    return;
  }

  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (Number.isFinite(n)) {
    obj.age = Math.trunc(n);
  } else {
    obj.age = null;
  }

  // keep only one field
  delete obj.ageYears;
}

export async function createKid(input: NewKidInput): Promise<string> {
  const kidRef = doc(collection(db, KIDS_COLLECTION));

  const payload: any = {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // ✅ policy: never store DOB
  stripDobFields(payload);

  // ✅ store age (number)
  normalizeAge(payload);

  await setDoc(kidRef, payload);

  // attach kid id to parent user doc if provided
  try {
    if ((input as any).primaryParentId) {
      await updateDoc(doc(db, 'users', (input as any).primaryParentId), {
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
  const payload: any = { ...changes, updatedAt: serverTimestamp() };

  // If caller sends ageYears, map it
  normalizeAge(payload);

  // If a teacher is assigned, ensure teacherIds is updated
  if (
    Object.prototype.hasOwnProperty.call(changes as any, 'teacherId') &&
    !Object.prototype.hasOwnProperty.call(changes as any, 'teacherIds')
  ) {
    const teacherId = (changes as any).teacherId;
    if (teacherId) {
      payload.teacherIds = arrayUnion(teacherId);
    }
  }

  // If caller still sends dob-ish fields, remove them from payload
  // BUT if you're updating age (or sent dob), we also delete DOB fields from Firestore.
  const touchingAge =
    Object.prototype.hasOwnProperty.call(changes as any, 'age') ||
    Object.prototype.hasOwnProperty.call(changes as any, 'ageYears');

  const touchingDob =
    Object.prototype.hasOwnProperty.call(changes as any, 'dob') ||
    Object.prototype.hasOwnProperty.call(changes as any, 'birthdate') ||
    Object.prototype.hasOwnProperty.call(changes as any, 'dateOfBirth');

  stripDobFields(payload);

  if (touchingAge || touchingDob) {
    // ✅ actively remove DOB from existing docs when age is updated
    payload.dob = deleteField();
    payload.birthdate = deleteField();
    payload.dateOfBirth = deleteField();
  }

  await updateDoc(doc(db, KIDS_COLLECTION, id), payload as any);
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
