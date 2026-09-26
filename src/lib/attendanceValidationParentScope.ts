import { collection, getDocs, limit, query, where, type Query, type DocumentData } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface AvsParentOption { id: string; label: string }
export async function loadAvsParentOptions(): Promise<AvsParentOption[]> {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'parent'), limit(2001)));
  if (snapshot.docs.length > 2000) throw new Error('Parent directory exceeds the 2,000-parent selector bound.');
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, label: [data.displayName, data.fullName, data.name, data.email]
      .find((value) => typeof value === 'string' && value.trim()) || doc.id };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export async function loadAvsParentEnrollmentIds(parentId: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(db, 'enrollments'), where('parentId', '==', parentId), limit(301)));
  if (snapshot.docs.length > 300) throw new Error('Parent exceeds the safe enrollment query bound.');
  return snapshot.docs.map((doc) => doc.id);
}

export async function loadAvsParentCases(base: Query<DocumentData>, enrollmentIds: string[], pageSize: number) {
  const docs = [];
  for (let i = 0; i < enrollmentIds.length; i += 30) {
    const snapshot = await getDocs(query(base, where('enrollmentId', 'in', enrollmentIds.slice(i, i + 30)), limit(pageSize)));
    docs.push(...snapshot.docs);
  }
  // A common date/document cursor makes chunk merging deterministic across pages.
  return docs.sort((a, b) => String(b.data().serviceDateYmd).localeCompare(String(a.data().serviceDateYmd))
    || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0, pageSize);
}
