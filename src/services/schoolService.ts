import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import { normalizeAuthRole } from '../constants/roles';

import type {
  CreateSchoolInput,
  SchoolDirectoryUser,
  SchoolPortalAccess,
  SchoolRecord,
  SchoolStatus,
  SchoolUserAccess,
  UpdateSchoolInput,
} from '../types/School';

const asObject = (
  value: unknown,
): Record<string, any> =>
  value && typeof value === 'object'
    ? value as Record<string, any>
    : {};

const asNullableString = (
  value: unknown,
): string | null =>
  typeof value === 'string' && value.trim()
    ? value.trim()
    : null;

const normalizeStatus = (
  value: unknown,
): SchoolStatus => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'paused' || normalized === 'archived') {
    return normalized;
  }
  return 'active';
};

export function toSchoolRecord(
  id: string,
  dataInput: unknown,
): SchoolRecord {
  const data = asObject(dataInput);
  const contact = asObject(data.contact);
  const location = asObject(data.location);

  return {
    id,
    schemaVersion: Number(data.schemaVersion || 1),
    schoolCode: String(data.schoolCode || id),
    name: String(data.name || 'Unnamed school'),
    nameSearch: String(data.nameSearch || data.name || '').toLowerCase(),
    status: normalizeStatus(data.status),
    contact: {
      name: String(contact.name || ''),
      designation: asNullableString(contact.designation),
      email: asNullableString(contact.email),
      phone: asNullableString(contact.phone),
    },
    location: {
      city: asNullableString(location.city),
      state: asNullableString(location.state),
      country: String(location.country || 'India'),
    },
    learningPartnerId: asNullableString(data.learningPartnerId),
    learningPartnerName: asNullableString(data.learningPartnerName),
    learningPartnerEmail: asNullableString(data.learningPartnerEmail),
    learningPartnerAssignedAt: data.learningPartnerAssignedAt,
    currentAcademicYearId: asNullableString(data.currentAcademicYearId),
    createdAt: data.createdAt,
    createdBy: asNullableString(data.createdBy) || undefined,
    updatedAt: data.updatedAt,
    updatedBy: asNullableString(data.updatedBy) || undefined,
  };
}

export async function listSchoolsForAdmin(): Promise<SchoolRecord[]> {
  const snap = await getDocs(collection(db, 'schools'));
  return snap.docs
    .map((item) => toSchoolRecord(item.id, item.data()))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

export async function listSchoolUsersForAdmin(): Promise<SchoolUserAccess[]> {
  const snap = await getDocs(collection(db, 'schoolUsers'));
  return snap.docs.map((item) => {
    const data = item.data();
    return {
      userId: item.id,
      role: 'schoolAdmin',
      schoolIds: Array.isArray(data.schoolIds)
        ? data.schoolIds.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      primarySchoolId: asNullableString(data.primarySchoolId),
      status: data.status === 'unassigned' ? 'unassigned' : 'active',
      createdAt: data.createdAt,
      createdBy: asNullableString(data.createdBy) || undefined,
      updatedAt: data.updatedAt,
      updatedBy: asNullableString(data.updatedBy) || undefined,
    } satisfies SchoolUserAccess;
  });
}

export async function listSchoolDirectoryUsersForAdmin(): Promise<SchoolDirectoryUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((item) => {
      const data = item.data();
      const role = normalizeAuthRole(data.role);
      if (role !== 'learningPartner' && role !== 'schoolAdmin') return null;

      return {
        id: item.id,
        name: String(
          data.displayName || data.name || data.email || item.id,
        ),
        email: String(data.email || ''),
        role,
        status: String(data.status || 'active'),
      } satisfies SchoolDirectoryUser;
    })
    .filter((item): item is SchoolDirectoryUser => item !== null)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}

export async function getSchoolPortalAccess(
  userId: string,
): Promise<SchoolPortalAccess> {
  const accessSnap = await getDoc(doc(db, 'schoolUsers', userId));
  if (!accessSnap.exists()) {
    return { access: null, schools: [], primarySchool: null };
  }

  const raw = accessSnap.data();
  const access: SchoolUserAccess = {
    userId,
    role: 'schoolAdmin',
    schoolIds: Array.isArray(raw.schoolIds)
      ? raw.schoolIds.filter(
          (value): value is string => typeof value === 'string',
        )
      : [],
    primarySchoolId: asNullableString(raw.primarySchoolId),
    status: raw.status === 'unassigned' ? 'unassigned' : 'active',
    createdAt: raw.createdAt,
    createdBy: asNullableString(raw.createdBy) || undefined,
    updatedAt: raw.updatedAt,
    updatedBy: asNullableString(raw.updatedBy) || undefined,
  };

  if (access.status !== 'active') {
    return { access, schools: [], primarySchool: null };
  }

  const results = await Promise.all(
    access.schoolIds.map(async (schoolId) => {
      try {
        const snap = await getDoc(doc(db, 'schools', schoolId));
        if (!snap.exists()) return null;
        return toSchoolRecord(snap.id, snap.data());
      } catch (error) {
        const code = String((error as { code?: unknown })?.code || '');
        if (code.includes('permission-denied')) return null;
        throw error;
      }
    }),
  );

  const schools = results.filter(
    (item): item is SchoolRecord => item !== null,
  );
  const primarySchool =
    schools.find((school) => school.id === access.primarySchoolId) ||
    schools[0] ||
    null;

  return { access, schools, primarySchool };
}

export const createSchool = (input: CreateSchoolInput) =>
  callFunction<{
    ok: true;
    schoolId: string;
    schoolCode: string;
  }>('adminCreateSchool', input);

export const updateSchool = (input: UpdateSchoolInput) =>
  callFunction<{ ok: true; schoolId: string }>('adminUpdateSchool', input);

export const assignSchoolLearningPartner = (input: {
  schoolId: string;
  learningPartnerId: string | null;
}) =>
  callFunction<{
    ok: true;
    schoolId: string;
    changed: boolean;
  }>('adminAssignSchoolLearningPartner', input);

export const linkSchoolUser = (input: {
  schoolId: string;
  userId: string;
  makePrimary?: boolean;
}) =>
  callFunction<{
    ok: true;
    userId: string;
    schoolId: string;
    schoolIds: string[];
    primarySchoolId: string | null;
  }>('adminLinkSchoolUser', input);

export const unlinkSchoolUser = (input: {
  schoolId: string;
  userId: string;
}) =>
  callFunction<{
    ok: true;
    userId: string;
    schoolId: string;
  }>('adminUnlinkSchoolUser', input);
