import { collection, doc, getDoc, getDocs, limit, query, where, type Query, type DocumentData } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { buildPhoneFromParts } from './phone';

export interface AvsParentOption { id: string; label: string; phone?: string }

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

function normalizeExplicitInternationalPhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return '';

  const digits = trimmed.slice(1).replace(/\D/g, '');
  const normalized = digits ? `+${digits}` : '';
  return E164_PHONE.test(normalized) ? normalized : '';
}

export function normalizedParentWhatsAppPhone(data: Record<string, unknown>): string {
  const explicitInternationalPhone = [
    data.phoneNormalized,
    data.phone,
    data.whatsappE164,
    data.whatsappPhone,
  ]
    .map(normalizeExplicitInternationalPhone)
    .find(Boolean);

  if (explicitInternationalPhone) return explicitInternationalPhone;

  const fromCanonicalParts = buildPhoneFromParts(
    typeof data.phoneCountryCode === 'string' ? data.phoneCountryCode : '',
    typeof data.phoneLocal === 'string' ? data.phoneLocal : '',
  );

  return E164_PHONE.test(fromCanonicalParts) ? fromCanonicalParts : '';
}

function parentLabel(id: string, data: Record<string, unknown>): string {
  return [data.displayName, data.fullName, data.name, data.email]
    .find((value) => typeof value === 'string' && value.trim()) as string || id;
}

export async function loadAvsParentOptionById(parentId: string): Promise<AvsParentOption> {
  const normalizedParentId = String(parentId || '').trim();
  if (!normalizedParentId || normalizedParentId.includes('/')) {
    throw new Error('Invalid attendance validation parent.');
  }
  const snapshot = await getDoc(doc(db, 'users', normalizedParentId));
  if (!snapshot.exists()) throw new Error('Parent account was not found.');
  const data = snapshot.data() as Record<string, unknown>;
  if (data.role !== 'parent') throw new Error('Selected account is not a parent.');
  return { id: snapshot.id, label: parentLabel(snapshot.id, data), phone: normalizedParentWhatsAppPhone(data) || undefined };
}

export async function loadAvsParentOptions(): Promise<AvsParentOption[]> {
  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'parent'), limit(2001)));
  if (snapshot.docs.length > 2000) throw new Error('Parent directory exceeds the 2,000-parent selector bound.');
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return { id: doc.id, label: parentLabel(doc.id, data), phone: normalizedParentWhatsAppPhone(data) || undefined };
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
