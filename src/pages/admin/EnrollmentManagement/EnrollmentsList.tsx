// src/pages/admin/EnrollmentManagement/EnrollmentsList.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
  documentId,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../../../lib/firebaseConfig';
import { normalizeEnrollmentStatus } from '../../../lib/statuses';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useToast } from '@components/hooks/use-toast';
import EnrollmentDetailView from './EnrollmentDetailView';

type Enrollment = {
  id: string;
  courseId?: string; // might be slug / code / docId depending on your data
  kidId?: string;
  studentId?: string;
  childId?: string;
  child?: unknown;
  studentObj?: unknown;
  studentRef?: unknown;
  kidRef?: unknown;
  kidIds?: string[];
  childIds?: string[];
  studentIds?: string[];
  childrenIds?: string[];
  students?: unknown;
  kids?: unknown;
  kidNames?: string[]; // if you later store names directly (optional)
  studentNames?: string[];
  childrenNames?: string[];
  childNames?: string[];
  studentName?: string;
  childName?: string;
  kidName?: string;
  student?: { name?: string };
  kid?: { name?: string };
  childEntity?: { name?: string };
  parentId?: string;
  parentIds?: string[];
  archived?: boolean;
  archivedAt?: unknown;
  status?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  billingCycle?: string;
  ratePerSession?: number;
  feePerSession?: number;
  feePerClass?: number;
  teacherPayPerSession?: number;
  teacherId?: string;
};

type KidDoc = {
  id: string;
  // try many possible name fields
  name?: string;
  fullName?: string;
  displayName?: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;

  // possible id link fields
  studentId?: string;
  uid?: string;
  parentId?: string;
  parentIds?: string[];
  primaryParentId?: string;
  parentEmail?: string;
  status?: string;
};

type CourseDoc = {
  id: string;
  // try many possible title fields
  name?: string;
  title?: string;
  courseName?: string;

  // possible id link fields
  courseId?: string;
  slug?: string;
  code?: string;
};

type EnrollmentIssueRow = {
  issue: string;
  studentParent: string;
  course: string;
  teacher: string;
  enrollmentId: string;
  currentId: string;
  suggestedAction: string;
  actionType?:
    | 'repair_link'
    | 'archive_stale'
    | 'archive_inactive_link'
    | 'convert_trial'
    | 'review_student'
    | 'restore_child_profile'
    | 'none';
  enrollment?: Enrollment;
  repairCandidateKidId?: string;
  repairCandidateName?: string;
  parentLabel?: string;
  kidId?: string;
};

type ParentUserDoc = {
  id: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  whatsapp?: string;
};

function chunk<T>(arr: T[], size = 10) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Normalize various ID shapes into a plain doc id string or undefined
function normalizeId(x: any): string | undefined {
  if (!x) return undefined;
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return undefined;
    const parts = s.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : undefined;
  }
  if (typeof x === 'object') {
    // DocumentReference-ish
    if (typeof x.id === 'string' && x.id) return x.id;
    // some libs expose a path string
    if (typeof x.path === 'string' && x.path) {
      const parts = x.path.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : undefined;
    }
    // fallback: maybe _path or similar internal structure
    if (x._path && Array.isArray(x._path.segments)) {
      const segs = x._path.segments;
      return segs.length ? segs[segs.length - 1] : undefined;
    }
  }
  return undefined;
}

async function fetchEnrollments(): Promise<Enrollment[]> {
  const qy = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

async function fetchCanonicalKids(): Promise<KidDoc[]> {
  const qy = query(collection(db, 'kids'), orderBy('createdAt', 'desc'), limit(2000));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

async function fetchDirectKidsByIds(ids: string[]): Promise<Record<string, KidDoc>> {
  const normalized = (ids ?? []).map(normalizeId).filter(Boolean) as string[];
  if (!normalized.length) return {};

  const byId: Record<string, KidDoc> = {};
  for (const batch of chunk(Array.from(new Set(normalized)), 10)) {
    const snap = await getDocs(query(collection(db, 'kids'), where(documentId(), 'in', batch)));
    snap.docs.forEach((docSnap) => {
      byId[docSnap.id] = { id: docSnap.id, ...(docSnap.data() as any) };
    });
  }
  return byId;
}

async function fetchUsersByIds(ids: string[]): Promise<Record<string, ParentUserDoc>> {
  const normalized = (ids ?? []).map((id) => String(id || '').trim()).filter(Boolean);
  if (!normalized.length) return {};
  const byId: Record<string, ParentUserDoc> = {};
  for (const batch of chunk(Array.from(new Set(normalized)), 10)) {
    const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', batch)));
    snap.docs.forEach((docSnap) => {
      byId[docSnap.id] = { id: docSnap.id, ...(docSnap.data() as any) };
    });
  }
  return byId;
}

/**
 * Kids:
 * 1) docId IN kidIds
 * 2) studentId IN kidIds (if your kid doc id is different)
 * 3) uid IN kidIds (if you store auth uid inside kid doc)
 */
async function fetchKidsByIds(ids: string[]): Promise<Record<string, KidDoc>> {
  // defensively normalize incoming ids (support paths, refs, objects)
  const normalized = (ids ?? []).map(normalizeId).filter(Boolean) as string[];
  if (!normalized.length) return {};
  const batches = chunk(normalized, 10);

  const byAnyKey: Record<string, KidDoc> = {};
  const addKid = (d: any) => {
    const kid = { id: d.id, ...(d.data() as any) } as KidDoc;
    const aliases = [
      kid.id,
      kid.studentId,
      kid.uid,
      (kid as any).kidId,
      (kid as any).childId,
      (kid as any).userId,
    ]
      .map((value) => normalizeId(value))
      .filter(Boolean) as string[];
    aliases.forEach((alias) => {
      byAnyKey[alias] = kid;
    });
  };

  // 1) try docId
  for (const batch of batches) {
    try {
      const q1 = query(collection(db, 'kids'), where(documentId(), 'in', batch));
      const snap = await getDocs(q1);
      snap.docs.forEach(addKid);
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.debug('[EnrollmentList kids lookup failed]', { mode: 'documentId', batch, error });
      }
    }
  }

  // find missing (against normalized list)
  const missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) try studentId
  for (const batch of chunk(missing, 10)) {
    try {
      const q2 = query(collection(db, 'kids'), where('studentId', 'in', batch));
      const snap = await getDocs(q2);
      snap.docs.forEach(addKid);
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.debug('[EnrollmentList kids lookup failed]', { mode: 'studentId', batch, error });
      }
    }
  }
  const stillMissing = normalized.filter((id) => !byAnyKey[id]);
  if (!stillMissing.length) return byAnyKey;

  // 3) try uid
  for (const batch of chunk(stillMissing, 10)) {
    try {
      const q3 = query(collection(db, 'kids'), where('uid', 'in', batch));
      const snap = await getDocs(q3);
      snap.docs.forEach(addKid);
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.debug('[EnrollmentList kids lookup failed]', { mode: 'uid', batch, error });
      }
    }
  }
  // final unresolved kid ids
  const unresolved = normalized.filter((id) => !byAnyKey[id]);
  if (import.meta.env?.DEV && unresolved.length) {
    console.debug('Unresolved kidIds:', unresolved.slice(0, 20));
  }

  return byAnyKey;
}
/**
 * Courses:
 * 1) docId IN courseIds
 * 2) courseId IN courseIds
 * 3) slug IN courseIds
 * 4) id IN courseIds
 */
async function fetchCoursesByIds(ids: string[]): Promise<Record<string, CourseDoc>> {
  // defensively normalize incoming ids (support paths, refs, objects)
  const normalized = (ids ?? []).map(normalizeId).filter(Boolean) as string[];
  if (!normalized.length) return {};
  const batches = chunk(normalized, 10);

  const byAnyKey: Record<string, CourseDoc> = {};
  const addCourse = (d: any) => {
    const course = { id: d.id, ...(d.data() as any) } as CourseDoc;
    byAnyKey[course.id] = course;
    if (course.courseId) byAnyKey[course.courseId] = course;
    if (course.slug) byAnyKey[course.slug] = course;
    if (course.code) byAnyKey[course.code] = course;
  };

  // 1) docId
  for (const batch of batches) {
    const q1 = query(collection(db, 'courses'), where(documentId(), 'in', batch));
    const snap = await getDocs(q1);
    snap.docs.forEach(addCourse);
  }

  let missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2) courseId
  for (const batch of chunk(missing, 10)) {
    const q2 = query(collection(db, 'courses'), where('courseId', 'in', batch));
    const snap = await getDocs(q2);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 2b) try code field (some courses use `code`)
  for (const batch of chunk(missing, 10)) {
    const q2b = query(collection(db, 'courses'), where('code', 'in', batch));
    const snap = await getDocs(q2b);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 3) slug
  for (const batch of chunk(missing, 10)) {
    const q3 = query(collection(db, 'courses'), where('slug', 'in', batch));
    const snap = await getDocs(q3);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 3b) slug normalization fallback: handle common variations like phonics-foundation → phonics-foundations
  const slugVariations = missing.flatMap((id) => {
    const variations = [id];
    // Add plural form if missing 's'
    if (!id.endsWith('s') && !id.endsWith('ies')) variations.push(id + 's');
    // Remove plural 's' if present
    if (id.endsWith('s')) variations.push(id.slice(0, -1));
    // Handle foundation/foundations specifically
    if (id.includes('-foundation') && !id.includes('-foundations')) {
      variations.push(id.replace('-foundation', '-foundations'));
    }
    return variations;
  }).filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

  for (const batch of chunk(slugVariations, 10)) {
    const q3b = query(collection(db, 'courses'), where('slug', 'in', batch));
    const snap = await getDocs(q3b);
    snap.docs.forEach(addCourse);
  }

  missing = normalized.filter((id) => !byAnyKey[id]);
  if (!missing.length) return byAnyKey;

  // 4) id field
  for (const batch of chunk(missing, 10)) {
    const q4 = query(collection(db, 'courses'), where('id', 'in', batch));
    const snap = await getDocs(q4);
    snap.docs.forEach(addCourse);
  }

  // final unresolved ids
  const unresolved = normalized.filter((id) => !byAnyKey[id]);
  if (import.meta.env?.DEV && unresolved.length) {
    console.debug('Unresolved courseIds:', unresolved.slice(0, 20));
  }

  return byAnyKey;
}

function pickKidName(k?: KidDoc) {
  if (!k) return '';
  if (k.name) return k.name;
  if (k.fullName) return k.fullName;
  if (k.displayName) return k.displayName;
  if (k.studentName) return k.studentName;
  const fn = [k.firstName, k.lastName].filter(Boolean).join(' ').trim();
  if (fn) return fn;
  return '';
}

function normalizeKidStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveKidStatus(value: unknown): boolean {
  const status = normalizeKidStatus(value);
  return status === '' || status === 'active';
}

function isReadableName(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower === 'unknown' ||
    lower === 'name not found' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return false;
  }
  const hasWhitespace = /\s/.test(trimmed);
  const looksLikeLongId =
    !hasWhitespace &&
    ((/^[a-f0-9]{16,}$/i.test(trimmed)) || (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)));
  return !looksLikeLongId;
}

function pickReadableName(...values: unknown[]): string | null {
  for (const value of values) {
    if (isReadableName(value)) return String(value).trim();
  }
  return null;
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

function isPermissionDeniedError(error: unknown): boolean {
  const code = getErrorCode(error).toLowerCase();
  const message = getErrorMessage(error).toLowerCase();
  return code.includes('permission-denied') || message.includes('missing or insufficient permissions');
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      if (!entry) return [];
      if (typeof entry === 'string') return [entry];
      if (typeof entry === 'object') {
        const candidate = normalizeId(entry);
        if (candidate) return [candidate];
        const nested = (entry as any).id || (entry as any).kidId || (entry as any).studentId || (entry as any).childId;
        return nested ? [String(nested)] : [];
      }
      return [];
    })
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function getEnrollmentStudentIds(enrollment: Enrollment): string[] {
  const ids = [
    enrollment.kidId,
    enrollment.childId,
    enrollment.studentId,
    normalizeId(enrollment.child),
    normalizeId(enrollment.studentObj),
    normalizeId(enrollment.studentRef),
    normalizeId(enrollment.kidRef),
    ...toStringList(enrollment.kidIds),
    ...toStringList(enrollment.childIds),
    ...toStringList(enrollment.studentIds),
    ...toStringList(enrollment.childrenIds),
    ...toStringList(enrollment.kids),
    ...toStringList(enrollment.students),
  ]
    .map(normalizeId)
    .filter(Boolean) as string[];
  return Array.from(new Set(ids));
}

function resolveDisplayStatus(enrollment: Enrollment): string {
  const normalized = normalizeEnrollmentStatus(enrollment.status);
  if (enrollment.archived === true || Boolean(enrollment.archivedAt) || normalized === 'archived') return 'archived';
  return normalized;
}

function isArchivedEnrollment(row: { enrollment: Enrollment; status: string }): boolean {
  return row.status === 'archived' || row.enrollment.archived === true || Boolean(row.enrollment.archivedAt);
}

function isPastEnrollmentStatus(status: string): boolean {
  return (
    status === 'completed' ||
    status === 'discontinued' ||
    status === 'expired' ||
    status === 'cancelled' ||
    status === 'ended' ||
    status === 'past'
  );
}

function isLegacyTrialStatus(status: string): boolean {
  return status === 'trial';
}

function isActiveLikeEnrollment(row: { enrollment: Enrollment; status: string }): boolean {
  if (isArchivedEnrollment(row)) return false;
  if (isPastEnrollmentStatus(row.status)) return false;
  return true;
}

function extractEnrollmentNameCandidates(enrollment: Enrollment): string[] {
  const listValues = [
    ...toStringList(enrollment.studentNames),
    ...toStringList(enrollment.childNames),
    ...toStringList(enrollment.childrenNames),
    ...toStringList(enrollment.kidNames),
  ];
  const inline = [
    enrollment.studentName,
    enrollment.childName,
    enrollment.kidName,
    enrollment.kid?.name,
    enrollment.student?.name,
    enrollment.childEntity?.name,
    (enrollment as any)?.child?.name,
    (enrollment as any)?.studentObj?.name,
    (enrollment as any)?.studentRef?.name,
  ];
  return [...inline, ...listValues]
    .filter((value) => isReadableName(value))
    .map((value) => String(value).trim());
}

function resolvePrimaryStudentIdLikeModal(enrollment: Enrollment): string | null {
  const raw =
    enrollment.kidId ||
    enrollment.studentId ||
    enrollment.childId ||
    (Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : null);
  const normalized = normalizeId(raw);
  return normalized || null;
}

async function loadStudentProfileLikeModal(
  studentId: string,
  enrollment?: Enrollment
): Promise<Record<string, unknown> | null> {
  const collectionsToTry = ['kids'];
  for (const collectionName of collectionsToTry) {
    if (import.meta.env.DEV) {
      console.debug('[EnrollmentList kid profile read]', {
        collectionName,
        docId: studentId,
        enrollmentId: enrollment?.id,
        kidId: enrollment?.kidId,
        kidIds: enrollment?.kidIds,
        studentId: enrollment?.studentId,
        parentId: enrollment?.parentId,
      });
    }
    try {
      const snap = await getDoc(doc(db, collectionName, studentId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Record<string, unknown>;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('[EnrollmentList kid profile read failed]', {
          collectionName,
          docId: studentId,
          enrollmentId: enrollment?.id,
          error,
        });
      }
    }
  }
  return null;
}

function pickCourseName(c?: CourseDoc) {
  if (!c) return '';
  return c.name || c.title || c.courseName || '';
}

export default function EnrollmentsList({ reloadKey }: { reloadKey: number }) {
  const [statusTab, setStatusTab] = useState<'active' | 'past' | 'archived' | 'broken' | 'duplicates'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [issuesPage, setIssuesPage] = useState<number>(1);
  const [showCleanupActions, setShowCleanupActions] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<Enrollment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('active');
  const [editParentRate, setEditParentRate] = useState('');
  const [editTeacherRate, setEditTeacherRate] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [resolvedNameByEnrollmentId, setResolvedNameByEnrollmentId] = useState<Record<string, string>>({});
  const [resolvedStudentIdByEnrollmentId, setResolvedStudentIdByEnrollmentId] = useState<Record<string, string>>({});
  const [restoreIssue, setRestoreIssue] = useState<EnrollmentIssueRow | null>(null);
  const [restoreChildName, setRestoreChildName] = useState('');
  const [restoreAgeInput, setRestoreAgeInput] = useState('');
  const [restoreGradeInput, setRestoreGradeInput] = useState('');
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);
  const unresolvedDebugLoggedRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((u: any) =>
            u.role === 'teacher' || (Array.isArray(u.roles) && u.roles.includes('teacher'))
          )
          .map((u: any) => ({ id: u.id, name: u.displayName || u.name, email: u.email }));
        setTeachers(rows);
      } catch (err) {
        console.warn('[EnrollmentsList] Failed to load teachers', err);
      }
    };
    void loadTeachers();
  }, []);
  const enrollmentsQuery = useQuery({
    queryKey: ['adminEnrollments', reloadKey],
    queryFn: fetchEnrollments,
  });
  const canonicalKidsQuery = useQuery({
    queryKey: ['canonicalKidsForEnrollmentReconciliation'],
    queryFn: fetchCanonicalKids,
  });

  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);

  const allKidIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => {
      getEnrollmentStudentIds(e).forEach((id) => set.add(id));
    });
    return Array.from(set);
  }, [enrollments]);

  const allParentIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((enrollment) => {
      const parentId = String(enrollment.parentId || '').trim();
      if (parentId) set.add(parentId);
      if (Array.isArray(enrollment.parentIds)) {
        enrollment.parentIds
          .map((value) => String(value || '').trim())
          .filter(Boolean)
          .forEach((value) => set.add(value));
      }
    });
    return Array.from(set);
  }, [enrollments]);

  const allCourseIds = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((e) => {
      const id = normalizeId(e.courseId);
      if (id) set.add(id);
    });
    return Array.from(set);
  }, [enrollments]);

  const kidsQuery = useQuery({
    queryKey: ['kidsByIds', allKidIds.join('|')],
    queryFn: () => fetchKidsByIds(allKidIds),
    enabled: allKidIds.length > 0,
  });
  const directKidsQuery = useQuery({
    queryKey: ['kidsDirectByIds', allKidIds.join('|')],
    queryFn: () => fetchDirectKidsByIds(allKidIds),
    enabled: allKidIds.length > 0,
  });
  const parentUsersQuery = useQuery({
    queryKey: ['usersByIdsForEnrollmentReconciliation', allParentIds.join('|')],
    queryFn: () => fetchUsersByIds(allParentIds),
    enabled: allParentIds.length > 0,
  });

  const coursesQuery = useQuery({
    queryKey: ['coursesByIds', allCourseIds.join('|')],
    queryFn: () => fetchCoursesByIds(allCourseIds),
    enabled: allCourseIds.length > 0,
  });

  const kidsMap = kidsQuery.data ?? {};
  const directKidsMap = directKidsQuery.data ?? {};
  const coursesMap = coursesQuery.data ?? {};
  const parentUsersMap = parentUsersQuery.data ?? {};
  const parentIdsForFallback = useMemo(() => {
    const set = new Set<string>();
    enrollments.forEach((enrollment) => {
      const parentId = String(enrollment.parentId || '').trim();
      if (parentId) set.add(parentId);
      if (Array.isArray(enrollment.parentIds)) {
        enrollment.parentIds
          .map((value) => String(value || '').trim())
          .filter(Boolean)
          .forEach((value) => set.add(value));
      }
    });
    return Array.from(set);
  }, [enrollments]);

  const parentKidsQuery = useQuery({
    queryKey: ['kidsByParentIds', parentIdsForFallback.join('|')],
    queryFn: async () => {
      if (parentIdsForFallback.length === 0) return {};
      const output: Record<string, KidDoc[]> = {};
      const seen = new Set<string>();
      const addKidToParents = (docSnap: any) => {
        const data = docSnap.data() as KidDoc;
        const kid: KidDoc = { ...data, id: docSnap.id };
        const name = pickKidName(kid);
        if (!isReadableName(name)) return;
        const linkedParentIds = Array.from(
          new Set(
            [
              String(kid.parentId || '').trim(),
              String(kid.primaryParentId || '').trim(),
              ...(Array.isArray(kid.parentIds) ? kid.parentIds.map((value) => String(value || '').trim()) : []),
            ].filter(Boolean)
          )
        );
        linkedParentIds.forEach((parentId) => {
          const dedupeKey = `${parentId}__${kid.id}`;
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          if (!output[parentId]) output[parentId] = [];
          output[parentId].push(kid);
        });
      };

      for (const batch of chunk(parentIdsForFallback, 10)) {
        try {
          const kidsSnap = await getDocs(query(collection(db, 'kids'), where('parentId', 'in', batch)));
          kidsSnap.docs.forEach(addKidToParents);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.debug('[EnrollmentList kids by parentId lookup failed]', { batch, error });
          }
        }
        try {
          const primaryParentSnap = await getDocs(
            query(collection(db, 'kids'), where('primaryParentId', 'in', batch))
          );
          primaryParentSnap.docs.forEach(addKidToParents);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.debug('[EnrollmentList kids by primaryParentId lookup failed]', { batch, error });
          }
        }
        try {
          const parentIdsSnap = await getDocs(
            query(collection(db, 'kids'), where('parentIds', 'array-contains-any', batch))
          );
          parentIdsSnap.docs.forEach(addKidToParents);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.debug('[EnrollmentList kids by parentIds lookup failed]', { batch, error });
          }
        }
      }
      return output;
    },
    enabled: parentIdsForFallback.length > 0,
  });
  const parentKidsMap = parentKidsQuery.data ?? {};

  useEffect(() => {
    let cancelled = false;

    const resolveNamesLikeModal = async () => {
      const nextNames: Record<string, string> = {};
      const nextIds: Record<string, string> = {};

      for (const enrollment of enrollments) {
        const enrollmentId = String(enrollment.id || '').trim();
        if (!enrollmentId) continue;

        const inlineName = extractEnrollmentNameCandidates(enrollment)[0];
        if (inlineName) {
          nextNames[enrollmentId] = inlineName;
          continue;
        }

        const modalStudentId = resolvePrimaryStudentIdLikeModal(enrollment);
        if (modalStudentId) {
          nextIds[enrollmentId] = modalStudentId;
          try {
            const profile = await loadStudentProfileLikeModal(modalStudentId, enrollment);
            const profileName = pickReadableName(
              profile?.fullName,
              profile?.name,
              profile?.studentName,
              profile?.displayName,
              profile?.childName,
              profile?.kidName
            );
            if (profileName) {
              nextNames[enrollmentId] = profileName;
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.debug('[EnrollmentList unresolved student]', {
                enrollmentId,
                parentId: enrollment.parentId,
                displayedStudentId: modalStudentId,
                error,
              });
            }
          }
        }
      }

      if (cancelled) return;
      setResolvedNameByEnrollmentId((prev) => ({ ...prev, ...nextNames }));
      setResolvedStudentIdByEnrollmentId((prev) => ({ ...prev, ...nextIds }));
    };

    void resolveNamesLikeModal();

    return () => {
      cancelled = true;
    };
  }, [enrollments]);

  const unresolvedDiagnostics = useMemo(() => {
    return enrollments
      .map((enrollment) => {
        const enrollmentId = String(enrollment.id || '').trim();
        const resolvedName = resolvedNameByEnrollmentId[enrollmentId] || null;
        if (resolvedName) return null;
        const studentIdForDebug =
          resolvedStudentIdByEnrollmentId[enrollmentId] ||
          resolvePrimaryStudentIdLikeModal(enrollment) ||
          getEnrollmentStudentIds(enrollment)[0] ||
          '';
        return {
          enrollmentId,
          course: (enrollment as any).courseName || enrollment.courseId || '',
          courseName: (enrollment as any).courseName || '',
          status: enrollment.status,
          kidId: enrollment.kidId,
          kidIds: enrollment.kidIds,
          studentId: enrollment.studentId,
          childId: enrollment.childId,
          parentId: enrollment.parentId,
          parentIds: enrollment.parentIds,
          parentEmail: (enrollment as any).parentEmail || '',
          parentName: (enrollment as any).parentName || '',
          teacherId: enrollment.teacherId || '',
          teacherName: (enrollment as any).teacherName || '',
          courseId: enrollment.courseId || '',
          displayedStudentId: studentIdForDebug,
          allKeys: Object.keys(enrollment || {}),
          enrollment,
        };
      })
      .filter(Boolean);
  }, [enrollments, resolvedNameByEnrollmentId, resolvedStudentIdByEnrollmentId]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;

    const inspectUnresolved = async () => {
      for (const entry of unresolvedDiagnostics as any[]) {
        const enrollmentId = String(entry?.enrollmentId || '').trim();
        if (!enrollmentId || unresolvedDebugLoggedRef.current.has(enrollmentId)) continue;
        unresolvedDebugLoggedRef.current.add(enrollmentId);

        const enrollment = entry?.enrollment as Enrollment | undefined;
        const parentIdsForMatch = Array.from(
          new Set(
            [
              String(enrollment?.parentId || '').trim(),
              ...(Array.isArray(enrollment?.parentIds)
                ? enrollment?.parentIds.map((value) => String(value || '').trim())
                : []),
            ].filter(Boolean)
          )
        );
        const parentCandidateKids = Array.from(
          new Map(
            parentIdsForMatch
              .flatMap((parentId) => parentKidsMap[parentId] || [])
              .map((kid) => [String(kid.id || ''), kid] as const)
          ).values()
        );
        const attemptedKidDocIds = Array.from(
          new Set(
            [
              normalizeId(enrollment?.kidId),
              normalizeId(enrollment?.studentId),
              normalizeId(Array.isArray(enrollment?.kidIds) ? enrollment?.kidIds?.[0] : undefined),
            ].filter(Boolean)
          )
        ) as string[];

        const kidReadResults: Array<{
          docId: string;
          collection: 'kids';
          result: 'found' | 'not-found' | 'permission-denied' | 'error';
          nameFieldsFound?: string[];
        }> = [];
        let errorCode = '';
        let errorMessage = '';

        for (const docId of attemptedKidDocIds) {
          try {
            const snap = await getDoc(doc(db, 'kids', docId));
            if (cancelled) return;
            if (snap.exists()) {
              const data = snap.data() as Record<string, unknown>;
              const nameFieldsFound = ['fullName', 'name', 'displayName', 'studentName', 'childName', 'kidName']
                .filter((field) => isReadableName(data?.[field]));
              kidReadResults.push({
                docId,
                collection: 'kids',
                result: 'found',
                nameFieldsFound,
              });
            } else {
              kidReadResults.push({
                docId,
                collection: 'kids',
                result: 'not-found',
              });
            }
          } catch (error) {
            if (cancelled) return;
            const denied = isPermissionDeniedError(error);
            kidReadResults.push({
              docId,
              collection: 'kids',
              result: denied ? 'permission-denied' : 'error',
            });
            if (!errorCode) errorCode = getErrorCode(error);
            if (!errorMessage) errorMessage = getErrorMessage(error);
          }
        }

        console.debug('[EnrollmentList unresolved student]', {
          enrollmentId,
          courseName: entry?.courseName || entry?.course || '',
          status: entry?.status || '',
          kidId: enrollment?.kidId || '',
          kidIds: enrollment?.kidIds || [],
          studentId: enrollment?.studentId || '',
          childId: enrollment?.childId || '',
          parentId: enrollment?.parentId || '',
          parentIds: enrollment?.parentIds || [],
          parentEmail: entry?.parentEmail || '',
          parentName: entry?.parentName || '',
          teacherId: entry?.teacherId || '',
          teacherName: entry?.teacherName || '',
          courseId: entry?.courseId || '',
          parentCandidateKidIds: parentCandidateKids.map((kid) => String(kid.id || '')),
          parentCandidateKidNames: parentCandidateKids.map((kid) => pickKidName(kid)).filter((name) => isReadableName(name)),
          attemptedKidDocIds,
          kidReadResults,
          reason:
            kidReadResults.length === 0
              ? 'no-attemptable-student-id'
              : kidReadResults.every((result) => result.result === 'not-found')
                ? 'stored student/kid id does not exist'
                : kidReadResults.some((result) => result.result === 'permission-denied')
                  ? 'permission-denied on kids lookup'
                  : '',
          errorCode,
          errorMessage,
        });
      }
    };

    void inspectUnresolved();

    return () => {
      cancelled = true;
    };
  }, [unresolvedDiagnostics, parentKidsMap]);

  const kidLabel = (kidId: string) => {
    const k = kidsMap[kidId];
    const name = pickKidName(k);
    return name || null;
  };

  const courseLabel = (courseId?: string) => {
    if (!courseId) return '—';
    const c = coursesMap[courseId];
    const name = pickCourseName(c);
    return name || `Unknown course (${courseId})`;
  };

  const teacherLabelById = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher) => {
      const id = String(teacher.id || '').trim();
      if (!id) return;
      map.set(id, String(teacher.name || teacher.email || id));
    });
    return map;
  }, [teachers]);

  const enrollmentRows = useMemo(() => {
    return enrollments.map((enrollment) => {
      const enrollmentId = String(enrollment.id || '').trim();
      const modalResolvedName = resolvedNameByEnrollmentId[enrollmentId] || null;
      const primaryName = modalResolvedName || extractEnrollmentNameCandidates(enrollment)[0] || null;
      const studentIds = getEnrollmentStudentIds(enrollment);
      const resolvedNames = studentIds
        .map((id) => kidLabel(id))
        .filter((name): name is string => Boolean(name));
      const parentIds = Array.from(
        new Set(
          [
            String(enrollment.parentId || '').trim(),
            ...(Array.isArray(enrollment.parentIds)
              ? enrollment.parentIds.map((value) => String(value || '').trim())
              : []),
          ].filter(Boolean)
        )
      );
      const parentMatchedKids = Array.from(
        new Map(
          parentIds
            .flatMap((parentId) => parentKidsMap[parentId] || [])
            .map((kid) => [String(kid.id || ''), kid] as const)
        ).values()
      );
      const parentMatchedActiveKids = parentMatchedKids.filter((kid) => isActiveKidStatus(kid.status));
      const parentMatchedPool = parentMatchedActiveKids.length > 0 ? parentMatchedActiveKids : parentMatchedKids;
      const uniqueParentNames = Array.from(
        new Set(
          parentMatchedPool
            .map((kid) => pickKidName(kid))
            .filter((name): name is string => isReadableName(name))
        )
      );
      const parentFallbackName =
        parentMatchedPool.length === 1 && uniqueParentNames.length === 1
          ? uniqueParentNames[0]
          : null;
      const studentName =
        primaryName ||
        (resolvedNames.length > 0 ? resolvedNames.join(', ') : null) ||
        parentFallbackName ||
        'Name not found';
      const studentIdHint =
        studentName === 'Name not found'
          ? resolvedStudentIdByEnrollmentId[enrollmentId] || studentIds[0] || ''
          : '';
      const status = resolveDisplayStatus(enrollment);
      const candidateKidIds = Array.from(
        new Set(
          [
            normalizeId(enrollment.kidId),
            normalizeId(enrollment.studentId),
            normalizeId(enrollment.childId),
            ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds.map((value) => normalizeId(value)) : []),
            ...studentIds.map((value) => normalizeId(value)),
          ].filter(Boolean)
        )
      ) as string[];
      const canonicalKidId = candidateKidIds.find((id) => Boolean(kidsMap[id])) || null;
      const canonicalKid = canonicalKidId ? kidsMap[canonicalKidId] : null;
      const parentDisplay =
        String(
          parentUsersMap[String(enrollment.parentId || '').trim()]?.displayName ||
            parentUsersMap[String(enrollment.parentId || '').trim()]?.fullName ||
            parentUsersMap[String(enrollment.parentId || '').trim()]?.name ||
            parentUsersMap[String(enrollment.parentId || '').trim()]?.email ||
            (enrollment as any).parentName ||
            (enrollment as any).parentEmail ||
            ''
        ).trim() ||
        parentIds[0] ||
        'Unknown parent';
      const courseDisplay = courseLabel(enrollment.courseId);
      const teacherId = String(enrollment.teacherId || '').trim();
      const teacherDisplay =
        teacherLabelById.get(teacherId) ||
        String((enrollment as any).teacherName || '').trim() ||
        (teacherId ? `Teacher (${teacherId})` : '—');

      return {
        enrollment,
        enrollmentId,
        status,
        studentName,
        studentIdHint,
        parentIds,
        parentDisplay,
        courseDisplay,
        teacherDisplay,
        candidateKidIds,
        canonicalKidId,
        canonicalKid,
        hasEnrollmentNameCandidate: extractEnrollmentNameCandidates(enrollment).length > 0,
        parentMatchedActiveKids,
        parentMatchedPool,
      };
    });
  }, [
    enrollments,
    resolvedNameByEnrollmentId,
    resolvedStudentIdByEnrollmentId,
    kidsMap,
    parentKidsMap,
    parentUsersMap,
    teacherLabelById,
  ]);

  const reconciliation = useMemo(() => {
    const canonicalKids = canonicalKidsQuery.data ?? [];
    const canonicalKidsById = new Map<string, KidDoc>();
    canonicalKids.forEach((kid) => {
      canonicalKidsById.set(String(kid.id || '').trim(), kid);
    });

    const activeStudentIds = canonicalKids
      .filter((kid) => isActiveKidStatus(kid.status))
      .map((kid) => String(kid.id || '').trim())
      .filter(Boolean);
    const archivedOrInactiveStudentsCount = Math.max(0, canonicalKids.length - activeStudentIds.length);

    const activeLikeRows = enrollmentRows.filter((row) => isActiveLikeEnrollment(row));
    const pastRows = enrollmentRows.filter((row) => isPastEnrollmentStatus(row.status));
    const archivedRows = enrollmentRows.filter((row) => isArchivedEnrollment(row));
    const legacyTrialRows = enrollmentRows.filter((row) => isLegacyTrialStatus(row.status));
    const brokenLinkIds = new Set<string>();
    const missingCanonicalChildProfileIds = new Set<string>();
    const inactiveStudentLinkIds = new Set<string>();
    const validByParentCourseTeacher = new Set<string>();
    const linkedActiveStudentIds = new Set<string>();

    const buildParentCourseTeacherKey = (row: (typeof enrollmentRows)[number]) => {
      const parentKey =
        String(row.enrollment.parentId || '').trim() ||
        (Array.isArray(row.enrollment.parentIds) ? String(row.enrollment.parentIds[0] || '').trim() : '') ||
        String((row.enrollment as any).parentEmail || '').trim().toLowerCase();
      const courseKey =
        String(row.enrollment.courseId || '').trim() ||
        String((row.enrollment as any).courseName || '').trim().toLowerCase();
      const teacherKey =
        String(row.enrollment.teacherId || '').trim() ||
        String((row.enrollment as any).teacherName || '').trim().toLowerCase();
      return `${parentKey}__${courseKey}__${teacherKey}`;
    };

    const resolveLinkedKidId = (row: (typeof enrollmentRows)[number]) => {
      if (row.canonicalKidId && canonicalKidsById.has(row.canonicalKidId)) return row.canonicalKidId;
      for (const candidateId of row.candidateKidIds) {
        if (canonicalKidsById.has(candidateId)) return candidateId;
      }
      return null;
    };

    const rowLinkedKidIdMap = new Map<string, string | null>();
    activeLikeRows.forEach((row) => {
      const linkedKidId = resolveLinkedKidId(row);
      rowLinkedKidIdMap.set(row.enrollmentId, linkedKidId);
      const isBroken = !linkedKidId;
      if (isBroken) {
        brokenLinkIds.add(row.enrollmentId);
      } else {
        linkedActiveStudentIds.add(linkedKidId);
        const linkedKid = canonicalKidsById.get(linkedKidId);
        if (linkedKid && !isActiveKidStatus(linkedKid.status)) {
          inactiveStudentLinkIds.add(row.enrollmentId);
        }

        validByParentCourseTeacher.add(buildParentCourseTeacherKey(row));
      }
    });

    activeLikeRows.forEach((row) => {
      const currentKidId = String(row.candidateKidIds[0] || '').trim();
      if (!currentKidId) return;
      const primaryParentId =
        String(row.enrollment.parentId || '').trim() ||
        (Array.isArray(row.enrollment.parentIds) ? String(row.enrollment.parentIds[0] || '').trim() : '');
      const parentExists = Boolean(primaryParentId && parentUsersMap[primaryParentId]);
      if (!parentExists) return;
      const canonicalKidDoc = directKidsMap[currentKidId] || null;
      const canonicalKidName = pickReadableName(
        canonicalKidDoc?.fullName,
        canonicalKidDoc?.name,
        canonicalKidDoc?.displayName,
        canonicalKidDoc?.studentName,
        (canonicalKidDoc as any)?.childName,
        (canonicalKidDoc as any)?.kidName
      );
      const hasCanonicalName = Boolean(canonicalKidName);
      if (!canonicalKidDoc || !hasCanonicalName) {
        if (!row.hasEnrollmentNameCandidate) {
          missingCanonicalChildProfileIds.add(row.enrollmentId);
        }
      }
    });

    const staleDuplicateIds = new Set<string>();
    activeLikeRows.forEach((row) => {
      if (!brokenLinkIds.has(row.enrollmentId)) return;
      const compositeKey = buildParentCourseTeacherKey(row);
      if (validByParentCourseTeacher.has(compositeKey)) {
        staleDuplicateIds.add(row.enrollmentId);
      }
    });

    const duplicateActiveEnrollmentIds = new Set<string>();
    const duplicateGroups = new Map<string, string[]>();
    activeLikeRows.forEach((row) => {
      const linkedKidId = rowLinkedKidIdMap.get(row.enrollmentId);
      if (!linkedKidId) return;
      const courseKey =
        String(row.enrollment.courseId || '').trim() ||
        String((row.enrollment as any).courseName || '').trim().toLowerCase();
      const teacherKey =
        String(row.enrollment.teacherId || '').trim() ||
        String((row.enrollment as any).teacherName || '').trim().toLowerCase();
      const key = `${linkedKidId}__${courseKey}__${teacherKey}`;
      const list = duplicateGroups.get(key) ?? [];
      list.push(row.enrollmentId);
      duplicateGroups.set(key, list);
    });
    duplicateGroups.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicateActiveEnrollmentIds.add(id));
      }
    });

    const activeStudentsWithoutEnrollment = activeStudentIds.filter((id) => !linkedActiveStudentIds.has(id));
    const healthyActiveStudents = activeStudentIds.filter((id) => linkedActiveStudentIds.has(id));

    const possibleDuplicateIds = new Set<string>([
      ...Array.from(staleDuplicateIds),
      ...Array.from(duplicateActiveEnrollmentIds),
    ]);

    const issues: EnrollmentIssueRow[] = [];
    enrollmentRows.forEach((row) => {
      const currentId = row.candidateKidIds[0] || '—';
      if (brokenLinkIds.has(row.enrollmentId)) {
        if (missingCanonicalChildProfileIds.has(row.enrollmentId)) {
          const parentLabel = String((row.enrollment as any).parentName || (row.enrollment as any).parentEmail || '').trim() || row.parentDisplay;
          issues.push({
            issue: 'Missing canonical child profile',
            studentParent: `${row.studentName} / ${row.parentDisplay}`,
            course: row.courseDisplay,
            teacher: row.teacherDisplay,
            enrollmentId: row.enrollmentId,
            currentId,
            suggestedAction:
              'Restore canonical child profile using current kid/student ID',
            actionType: 'restore_child_profile',
            enrollment: row.enrollment,
            parentLabel,
          });
          return;
        }
        const singleParentMatch = row.parentMatchedActiveKids.length === 1 ? pickKidName(row.parentMatchedActiveKids[0]) : '';
        const multipleParentMatches = row.parentMatchedActiveKids.length > 1;
        const noParentMatch = row.parentMatchedActiveKids.length === 0;
        const parentLabel = String((row.enrollment as any).parentName || (row.enrollment as any).parentEmail || '').trim() || row.parentDisplay;
        issues.push({
          issue: staleDuplicateIds.has(row.enrollmentId)
            ? 'Possible stale duplicate'
            : 'Broken enrollment link',
          studentParent: `${row.studentName} / ${row.parentDisplay}`,
          course: row.courseDisplay,
          teacher: row.teacherDisplay,
          enrollmentId: row.enrollmentId,
          currentId,
          suggestedAction: staleDuplicateIds.has(row.enrollmentId)
            ? 'Archive stale duplicate'
            : singleParentMatch
              ? `Repair student link (possible match: ${singleParentMatch})`
              : multipleParentMatches
                ? 'Multiple possible children — review manually'
                : noParentMatch
                  ? 'No matching active child — archive stale enrollment if confirmed'
                  : 'Review manually',
          actionType: singleParentMatch ? 'repair_link' : 'archive_stale',
          enrollment: row.enrollment,
          repairCandidateKidId: row.parentMatchedActiveKids.length === 1 ? String(row.parentMatchedActiveKids[0].id || '') : undefined,
          repairCandidateName: row.parentMatchedActiveKids.length === 1 ? pickKidName(row.parentMatchedActiveKids[0]) : undefined,
          parentLabel,
        });
      }
      if (inactiveStudentLinkIds.has(row.enrollmentId)) {
        issues.push({
          issue: 'Active enrollment linked to inactive/archived student',
          studentParent: `${row.studentName} / ${row.parentDisplay}`,
          course: row.courseDisplay,
          teacher: row.teacherDisplay,
          enrollmentId: row.enrollmentId,
          currentId,
          suggestedAction: 'Mark child active (manual) or archive enrollment',
          actionType: 'archive_inactive_link',
          enrollment: row.enrollment,
          parentLabel: String((row.enrollment as any).parentName || (row.enrollment as any).parentEmail || '').trim() || row.parentDisplay,
        });
      }
      if (duplicateActiveEnrollmentIds.has(row.enrollmentId)) {
        issues.push({
          issue: 'Duplicate active enrollment',
          studentParent: `${row.studentName} / ${row.parentDisplay}`,
          course: row.courseDisplay,
          teacher: row.teacherDisplay,
          enrollmentId: row.enrollmentId,
          currentId,
          suggestedAction: 'Review manually',
          actionType: 'none',
        });
      }
      if (isLegacyTrialStatus(row.status)) {
        issues.push({
          issue: 'Legacy trial-status enrollment',
          studentParent: `${row.studentName} / ${row.parentDisplay}`,
          course: row.courseDisplay,
          teacher: row.teacherDisplay,
          enrollmentId: row.enrollmentId,
          currentId,
          suggestedAction: 'Convert to Active',
          actionType: 'convert_trial',
          enrollment: row.enrollment,
        });
      }
    });

    activeStudentsWithoutEnrollment.slice(0, 200).forEach((kidId) => {
      const kid = canonicalKidsById.get(kidId);
      const kidName = pickKidName(kid);
      const parentLabel =
        String(kid?.parentEmail || '').trim() ||
        String(kid?.primaryParentId || kid?.parentId || '').trim() ||
        'Unknown parent';
      issues.push({
        issue: 'Active student without enrollment',
        studentParent: `${kidName || kidId} / ${parentLabel}`,
        course: '—',
        teacher: '—',
        enrollmentId: '—',
        currentId: kidId,
        suggestedAction: 'Review in Student Management',
        actionType: 'review_student',
        parentLabel,
        kidId,
      });
    });

    return {
      totalStudents: canonicalKids.length,
      activeStudents: activeStudentIds.length,
      archivedOrInactiveStudents: archivedOrInactiveStudentsCount,
      healthyActiveStudents: healthyActiveStudents.length,
      activeStudentsWithoutEnrollment: activeStudentsWithoutEnrollment.length,
      totalEnrollments: enrollments.length,
      activeEnrollments: activeLikeRows.length,
      pastEnrollments: pastRows.length,
      archivedEnrollments: archivedRows.length,
      brokenLinks: brokenLinkIds.size,
      missingCanonicalChildProfiles: missingCanonicalChildProfileIds.size,
      possibleDuplicates: possibleDuplicateIds.size,
      duplicateActiveEnrollments: duplicateActiveEnrollmentIds.size,
      inactiveStudentLinkedEnrollments: inactiveStudentLinkIds.size,
      legacyTrialEnrollments: legacyTrialRows.length,
      brokenLinkIds,
      missingCanonicalChildProfileIds,
      staleDuplicateIds,
      duplicateActiveEnrollmentIds,
      possibleDuplicateIds,
      issues,
    };
  }, [canonicalKidsQuery.data, directKidsMap, enrollmentRows, enrollments.length, parentUsersMap]);

  const filteredEnrollmentRows = useMemo(() => {
    if (statusTab === 'active') return enrollmentRows.filter((row) => isActiveLikeEnrollment(row));
    if (statusTab === 'archived') return enrollmentRows.filter((row) => isArchivedEnrollment(row));
    if (statusTab === 'past') {
      return enrollmentRows.filter((row) => isPastEnrollmentStatus(row.status));
    }
  if (statusTab === 'broken') {
      return enrollmentRows.filter((row) => reconciliation.brokenLinkIds.has(row.enrollmentId));
    }
    if (statusTab === 'duplicates') {
      return enrollmentRows.filter((row) => reconciliation.possibleDuplicateIds.has(row.enrollmentId));
    }
    return enrollmentRows;
  }, [enrollmentRows, reconciliation, statusTab]);

  const searchedEnrollmentRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredEnrollmentRows;

    return filteredEnrollmentRows.filter((row) => {
      const haystack = [
        row.enrollmentId,
        row.studentName,
        row.studentIdHint,
        row.courseDisplay,
        row.status,
        row.parentDisplay,
        row.teacherDisplay,
        String(row.enrollment.billingCycle || ''),
        String(row.enrollment.parentId || ''),
        String(row.enrollment.teacherId || ''),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filteredEnrollmentRows, searchQuery]);

  const totalFilteredRows = searchedEnrollmentRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRows / rowsPerPage));

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, statusTab, searchQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedEnrollmentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return searchedEnrollmentRows.slice(start, start + rowsPerPage);
  }, [searchedEnrollmentRows, page, rowsPerPage]);

  const issuesRowsPerPage = 10;
  const totalIssueRows = reconciliation.issues.length;
  const issuesTotalPages = Math.max(1, Math.ceil(totalIssueRows / issuesRowsPerPage));

  useEffect(() => {
    setIssuesPage(1);
  }, [totalIssueRows]);

  useEffect(() => {
    if (issuesPage > issuesTotalPages) {
      setIssuesPage(issuesTotalPages);
    }
  }, [issuesPage, issuesTotalPages]);

  const pagedIssueRows = useMemo(() => {
    const start = (issuesPage - 1) * issuesRowsPerPage;
    return reconciliation.issues.slice(start, start + issuesRowsPerPage);
  }, [issuesPage, reconciliation.issues]);

  const noMatchBrokenIssues = useMemo(() => {
    return reconciliation.issues.filter(
      (issue) =>
        issue.actionType === 'archive_stale' &&
        issue.enrollmentId !== '—' &&
        !issue.repairCandidateKidId &&
        Boolean(issue.enrollment)
    );
  }, [reconciliation.issues]);

  if (enrollmentsQuery.isLoading) {
    return <div className="py-6 text-center">Loading enrollments…</div>;
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="py-6 text-center text-red-600">
        Failed to load enrollments.
      </div>
    );
  }

  const openEdit = (enrollment: Enrollment) => {
    const rawParent =
      enrollment.ratePerSession ??
      enrollment.feePerSession ??
      enrollment.feePerClass ??
      0;
    const rawTeacher =
      enrollment.teacherPayPerSession ?? 0;
    const parentValue = Number(rawParent);
    const teacherValue = Number(rawTeacher);

    setEditEnrollment(enrollment);
    setEditStatus(normalizeEnrollmentStatus(enrollment.status));
    setEditParentRate(Number.isFinite(parentValue) ? String(parentValue) : '');
    setEditTeacherRate(Number.isFinite(teacherValue) ? String(teacherValue) : '');
    setEditTeacherId(enrollment.teacherId || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editEnrollment) return;
    const parentRate = Number(editParentRate);
    if (!Number.isFinite(parentRate) || parentRate <= 0) {
      toast({
        title: 'Invalid fee',
        description: 'Enter a valid fee per session.',
        variant: 'destructive',
      });
      return;
    }
    const teacherRate = Number(editTeacherRate);
    const teacherPayPerSession = Number.isFinite(teacherRate) ? teacherRate : 0;
    const prevTeacherId = String(editEnrollment.teacherId || '').trim();
    const nextTeacherId = String(editTeacherId || '').trim();
    const teacherChanged = prevTeacherId !== nextTeacherId;

    try {
      setSaving(true);
      const updates: Record<string, any> = {
        status: editStatus,
        ratePerSession: parentRate,
        feePerSession: parentRate,
        feePerClass: parentRate,
        teacherPayPerSession,
        updatedAt: serverTimestamp(),
      };

      // When teacher changes to a concrete teacher, use backend reassignment flow
      // so future sessions + kid mapping stay consistent with enrollment teacherId.
      if (!teacherChanged || !nextTeacherId) {
        updates.teacherId = nextTeacherId || null;
      }

      await updateDoc(doc(db, 'enrollments', editEnrollment.id), updates);

      if (teacherChanged && nextTeacherId) {
        const reassignEnrollmentTeacher = httpsCallable(functions, 'reassignEnrollmentTeacher');
        await reassignEnrollmentTeacher({
          enrollmentId: editEnrollment.id,
          newTeacherId: nextTeacherId,
        });
      }

      toast({ title: 'Enrollment updated' });
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (enrollment: Enrollment) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        status: 'archived',
        archived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Enrollment archived' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to archive enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const actorIdOrEmail =
    String(auth.currentUser?.email || '').trim() ||
    String(auth.currentUser?.uid || '').trim() ||
    null;

  const archiveEnrollmentWithReason = async (
    enrollment: Enrollment,
    archiveReason: string
  ) => {
    await updateDoc(doc(db, 'enrollments', enrollment.id), {
      archived: true,
      status: 'archived',
      archivedAt: serverTimestamp(),
      archivedBy: actorIdOrEmail,
      archiveReason,
      updatedAt: serverTimestamp(),
      updatedBy: actorIdOrEmail,
    });
  };

  const handleRepairBrokenLink = async (issue: EnrollmentIssueRow) => {
    if (!issue.enrollment || !issue.repairCandidateKidId || !issue.repairCandidateName) return;
    const oldKidId = String(issue.enrollment.kidId || '').trim() || '—';
    const oldStudentId = String(issue.enrollment.studentId || '').trim() || '—';
    const confirm = window.confirm(
      [
        'Repair enrollment student link?',
        `Enrollment ID: ${issue.enrollment.id}`,
        `Student / Parent: ${issue.studentParent}`,
        `Current kidId: ${oldKidId}`,
        `Current studentId: ${oldStudentId}`,
        `New kidId: ${issue.repairCandidateKidId}`,
        `Child: ${issue.repairCandidateName}`,
      ].join('\n')
    );
    if (!confirm) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'enrollments', issue.enrollment.id), {
        kidId: issue.repairCandidateKidId,
        kidIds: [issue.repairCandidateKidId],
        studentId: issue.repairCandidateKidId,
        studentName: issue.repairCandidateName,
        childName: issue.repairCandidateName,
        kidName: issue.repairCandidateName,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || null,
        repairReason: 'Repaired broken enrollment link from reconciliation',
        previousStudentLink: {
          kidId: issue.enrollment.kidId || null,
          kidIds: Array.isArray(issue.enrollment.kidIds) ? issue.enrollment.kidIds : [],
          studentId: issue.enrollment.studentId || null,
        },
      });
      toast({ title: 'Enrollment link repaired' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to repair enrollment link',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveStaleEnrollment = async (issue: EnrollmentIssueRow) => {
    if (!issue.enrollment) return;
    const confirm = window.confirm(
      [
        'Archive stale/broken enrollment?',
        `Enrollment ID: ${issue.enrollment.id}`,
        `Current student/kid ID: ${issue.currentId || '—'}`,
        `Course: ${issue.course || '—'}`,
        `Teacher: ${issue.teacher || '—'}`,
        `Parent: ${issue.parentLabel || issue.studentParent || '—'}`,
        'This will archive the stale enrollment only. It will not delete schedules, attendance, payments, or earnings.',
      ].join('\n')
    );
    if (!confirm) return;
    try {
      setSaving(true);
      await archiveEnrollmentWithReason(
        issue.enrollment,
        'Archived stale broken enrollment link from reconciliation cleanup'
      );
      toast({ title: 'Stale enrollment archived' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to archive stale enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveInactiveLinkedEnrollment = async (issue: EnrollmentIssueRow) => {
    if (!issue.enrollment) return;
    const confirm = window.confirm(
      [
        'This enrollment is active but the linked child is inactive/archived.',
        'Archive this enrollment only if the child is no longer actively taking this course.',
        `Enrollment ID: ${issue.enrollment.id}`,
        `Course: ${issue.course || '—'}`,
        `Teacher: ${issue.teacher || '—'}`,
        `Parent: ${issue.parentLabel || issue.studentParent || '—'}`,
      ].join('\n')
    );
    if (!confirm) return;
    try {
      setSaving(true);
      await archiveEnrollmentWithReason(
        issue.enrollment,
        'Archived active enrollment linked to inactive/archived child from reconciliation cleanup'
      );
      toast({ title: 'Enrollment archived' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to archive enrollment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConvertLegacyTrialToActive = async (issue: EnrollmentIssueRow) => {
    if (!issue.enrollment) return;
    const confirm = window.confirm(
      [
        'Convert legacy trial enrollment to active?',
        `Enrollment ID: ${issue.enrollment.id}`,
      ].join('\n')
    );
    if (!confirm) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'enrollments', issue.enrollment.id), {
        status: 'active',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || null,
        statusMigrationReason:
          'Converted legacy trial status to active because Tiny Steps no longer uses trial enrollments',
      });
      toast({ title: 'Legacy trial converted to active' });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to convert legacy trial',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkArchiveNoMatchBrokenLinks = async () => {
    if (noMatchBrokenIssues.length === 0) return;
    const ids = noMatchBrokenIssues
      .map((issue) => String(issue.enrollment?.id || issue.enrollmentId || '').trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    const previewIds = ids.slice(0, 10);
    const hiddenCount = Math.max(0, ids.length - previewIds.length);
    const confirm = window.confirm(
      [
        `Archive ${ids.length} no-match broken enrollment link record(s)?`,
        '',
        ...previewIds.map((id) => `- ${id}`),
        hiddenCount > 0 ? `- and ${hiddenCount} more` : '',
        '',
        'This only archives stale enrollment documents. It does not delete schedules, attendance, payments, or earnings.',
      ]
        .filter(Boolean)
        .join('\n')
    );
    if (!confirm) return;

    try {
      setSaving(true);
      const batches = chunk(noMatchBrokenIssues, 400);
      for (const batchIssues of batches) {
        const batch = writeBatch(db);
        batchIssues.forEach((issue) => {
          const enrollmentId = String(issue.enrollment?.id || issue.enrollmentId || '').trim();
          if (!enrollmentId) return;
          batch.update(doc(db, 'enrollments', enrollmentId), {
            archived: true,
            status: 'archived',
            archivedAt: serverTimestamp(),
            archivedBy: actorIdOrEmail,
            archiveReason: 'Archived stale broken enrollment link from reconciliation cleanup',
            updatedAt: serverTimestamp(),
            updatedBy: actorIdOrEmail,
          });
        });
        await batch.commit();
      }
      toast({
        title: 'Bulk archive complete',
        description: `Archived ${ids.length} stale enrollment record(s).`,
      });
      await queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Bulk archive failed',
        description: err?.message || 'Failed to archive stale enrollment records',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openRestoreChildProfile = (issue: EnrollmentIssueRow) => {
    if (!issue.enrollment) return;
    const suggestedName = pickReadableName(
      issue.enrollment.studentName,
      issue.enrollment.childName,
      issue.enrollment.kidName
    );
    setRestoreIssue(issue);
    setRestoreChildName(suggestedName || '');
    setRestoreAgeInput('');
    setRestoreGradeInput('');
  };

  const handleConfirmRestoreChildProfile = async () => {
    if (!restoreIssue?.enrollment) return;
    const enrollment = restoreIssue.enrollment;
    const enrollmentId = String(enrollment.id || '').trim();
    const currentKidId = String(restoreIssue.currentId || '').trim();
    const childName = String(restoreChildName || '').trim();
    if (!enrollmentId || !currentKidId || currentKidId === '—') {
      toast({
        title: 'Invalid enrollment link',
        description: 'Missing enrollment or kid ID for repair.',
        variant: 'destructive',
      });
      return;
    }
    if (!childName) {
      toast({
        title: 'Child name required',
        description: 'Enter child name before restoring the profile.',
        variant: 'destructive',
      });
      return;
    }

    const parentId =
      String(enrollment.parentId || '').trim() ||
      (Array.isArray(enrollment.parentIds) ? String(enrollment.parentIds[0] || '').trim() : '');
    if (!parentId) {
      toast({
        title: 'Missing parent link',
        description: 'Enrollment parentId is missing. Repair manually before restore.',
        variant: 'destructive',
      });
      return;
    }

    const nextParentIds = Array.from(
      new Set(
        [
          parentId,
          ...(Array.isArray(enrollment.parentIds)
            ? enrollment.parentIds.map((value) => String(value || '').trim())
            : []),
        ].filter(Boolean)
      )
    );
    const teacherId = String(enrollment.teacherId || '').trim();
    const nextTeacherIds = Array.from(
      new Set(
        [
          teacherId,
          ...(Array.isArray((enrollment as any).teacherIds)
            ? (enrollment as any).teacherIds.map((value: unknown) => String(value || '').trim())
            : []),
        ].filter(Boolean)
      )
    );

    const ageValue = Number(restoreAgeInput);
    const hasAge = Number.isFinite(ageValue) && ageValue > 0;
    const gradeValue = String(restoreGradeInput || '').trim();

    const actorIdOrEmail =
      String(auth.currentUser?.email || '').trim() ||
      String(auth.currentUser?.uid || '').trim() ||
      null;

    try {
      setRestoreSubmitting(true);
      const kidRef = doc(db, 'kids', currentKidId);
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      const parentRef = doc(db, 'users', parentId);
      const kidSnap = await getDoc(kidRef);

      const batch = writeBatch(db);
      const kidPatch: Record<string, unknown> = {
        fullName: childName,
        name: childName,
        status: 'active',
        primaryParentId: parentId,
        parentIds: nextParentIds,
        teacherId: teacherId || null,
        teacherIds: nextTeacherIds,
        updatedAt: serverTimestamp(),
        updatedBy: actorIdOrEmail,
        repairSource: 'missing-canonical-child-profile',
        repairedFromEnrollmentId: enrollmentId,
        repairedFromBrokenStudentId: currentKidId,
      };
      if (hasAge) kidPatch.age = ageValue;
      if (gradeValue) kidPatch.grade = gradeValue;
      if (!kidSnap.exists()) {
        kidPatch.createdAt = serverTimestamp();
        kidPatch.createdBy = actorIdOrEmail;
      }
      batch.set(kidRef, kidPatch, { merge: true });

      batch.update(enrollmentRef, {
        kidId: currentKidId,
        kidIds: [currentKidId],
        studentId: currentKidId,
        studentName: childName,
        childName: childName,
        kidName: childName,
        updatedAt: serverTimestamp(),
        updatedBy: actorIdOrEmail,
        repairReason: 'Restored missing canonical child profile using existing enrollment kidId',
        previousStudentLink: {
          kidId: enrollment.kidId || null,
          kidIds: Array.isArray(enrollment.kidIds) ? enrollment.kidIds : [],
          studentId: enrollment.studentId || null,
          studentName: (enrollment as any).studentName || null,
          childName: (enrollment as any).childName || null,
          kidName: (enrollment as any).kidName || null,
        },
      });

      batch.set(
        parentRef,
        {
          childIds: arrayUnion(currentKidId),
          updatedAt: serverTimestamp(),
          updatedBy: actorIdOrEmail,
        },
        { merge: true }
      );

      await batch.commit();
      toast({ title: 'Child profile restored', description: 'Canonical kids profile and enrollment names updated.' });
      setRestoreIssue(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminEnrollments'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['canonicalKidsForEnrollmentReconciliation'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['kidsByIds'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['kidsDirectByIds'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['usersByIdsForEnrollmentReconciliation'], exact: false }),
      ]);
    } catch (err: any) {
      toast({
        title: 'Restore failed',
        description: err?.message || 'Failed to restore canonical child profile',
        variant: 'destructive',
      });
    } finally {
      setRestoreSubmitting(false);
    }
  };

  const resolveAndCacheEnrollmentName = async (enrollmentId: string) => {
    try {
      const normalizedEnrollmentId = String(enrollmentId || '').trim();
      if (!normalizedEnrollmentId) return;
      const snap = await getDoc(doc(db, 'enrollments', normalizedEnrollmentId));
      if (!snap.exists()) return;
      const enrollmentData = { id: snap.id, ...(snap.data() as any) } as Enrollment;
      const inlineName = extractEnrollmentNameCandidates(enrollmentData)[0] || null;
      if (inlineName) {
        setResolvedNameByEnrollmentId((prev) => ({
          ...prev,
          [normalizedEnrollmentId]: inlineName,
        }));
        return;
      }
      const studentId = resolvePrimaryStudentIdLikeModal(enrollmentData);
      if (!studentId) return;
      const profile = await loadStudentProfileLikeModal(studentId, enrollmentData);
      const profileName = pickReadableName(
        profile?.name,
        profile?.fullName,
        profile?.studentName,
        profile?.displayName,
        profile?.childName,
        profile?.kidName
      );
      if (profileName) {
        setResolvedNameByEnrollmentId((prev) => ({
          ...prev,
          [normalizedEnrollmentId]: profileName,
        }));
      }
      setResolvedStudentIdByEnrollmentId((prev) => ({
        ...prev,
        [normalizedEnrollmentId]: studentId,
      }));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('[EnrollmentList resolveAndCacheEnrollmentName failed]', {
          enrollmentId,
          errorCode: getErrorCode(error),
          errorMessage: getErrorMessage(error),
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      {(kidsQuery.isLoading || directKidsQuery.isLoading || coursesQuery.isLoading || parentKidsQuery.isLoading || canonicalKidsQuery.isLoading || parentUsersQuery.isLoading) && (
        <div className="text-xs text-muted-foreground">
          Resolving enrollments and reconciliation data…
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div className="rounded border p-2"><div className="text-muted-foreground">Total</div><div className="font-semibold">{reconciliation.totalEnrollments}</div></div>
        <div className="rounded border p-2"><div className="text-muted-foreground">Active</div><div className="font-semibold">{reconciliation.activeEnrollments}</div></div>
        <div className="rounded border p-2"><div className="text-muted-foreground">Past</div><div className="font-semibold">{reconciliation.pastEnrollments}</div></div>
        <div className="rounded border p-2"><div className="text-muted-foreground">Archived</div><div className="font-semibold">{reconciliation.archivedEnrollments}</div></div>
        <div className="rounded border p-2"><div className="text-muted-foreground">Broken links</div><div className="font-semibold">{reconciliation.brokenLinks}</div></div>
        <div className="rounded border p-2"><div className="text-muted-foreground">Possible duplicates</div><div className="font-semibold">{reconciliation.possibleDuplicates}</div></div>
      </div>

      <div className="rounded border p-3 space-y-2">
        <div className="text-sm font-semibold">Student–Enrollment Reconciliation</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div><span className="text-muted-foreground">Total students:</span> <span className="font-medium">{reconciliation.totalStudents}</span></div>
          <div><span className="text-muted-foreground">Active students:</span> <span className="font-medium">{reconciliation.activeStudents}</span></div>
          <div><span className="text-muted-foreground">Archived/inactive students:</span> <span className="font-medium">{reconciliation.archivedOrInactiveStudents}</span></div>
          <div><span className="text-muted-foreground">Healthy active students:</span> <span className="font-medium">{reconciliation.healthyActiveStudents}</span></div>
          <div><span className="text-muted-foreground">Active students without enrollment:</span> <span className="font-medium">{reconciliation.activeStudentsWithoutEnrollment}</span></div>
          <div><span className="text-muted-foreground">Broken enrollment links:</span> <span className="font-medium">{reconciliation.brokenLinks}</span></div>
          <div><span className="text-muted-foreground">Missing canonical child profile:</span> <span className="font-medium">{reconciliation.missingCanonicalChildProfiles}</span></div>
          <div><span className="text-muted-foreground">Possible stale duplicates:</span> <span className="font-medium">{reconciliation.staleDuplicateIds.size}</span></div>
          <div><span className="text-muted-foreground">Duplicate active enrollments:</span> <span className="font-medium">{reconciliation.duplicateActiveEnrollments}</span></div>
          <div><span className="text-muted-foreground">Active enrollment linked to inactive/archived student:</span> <span className="font-medium">{reconciliation.inactiveStudentLinkedEnrollments}</span></div>
          <div><span className="text-muted-foreground">Legacy trial-status enrollments:</span> <span className="font-medium">{reconciliation.legacyTrialEnrollments}</span></div>
        </div>
        <div className="rounded border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Enrollment Cleanup Actions</div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setShowCleanupActions((prev) => !prev)}
            >
              {showCleanupActions ? 'Hide cleanup actions' : 'Show cleanup actions'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="text-muted-foreground">Broken enrollment links:</span> <span className="font-medium">{reconciliation.brokenLinks}</span></div>
            <div><span className="text-muted-foreground">Active linked to inactive/archived child:</span> <span className="font-medium">{reconciliation.inactiveStudentLinkedEnrollments}</span></div>
            <div><span className="text-muted-foreground">Active students without active enrollment:</span> <span className="font-medium">{reconciliation.activeStudentsWithoutEnrollment}</span></div>
            <div><span className="text-muted-foreground">Possible duplicate active enrollments:</span> <span className="font-medium">{reconciliation.duplicateActiveEnrollments}</span></div>
          </div>
          {showCleanupActions ? (
            <>
              <div className="text-xs text-muted-foreground">
                Cleanup actions archive or repair enrollment records only. They do not change schedules, attendance, payments, or teacher earnings.
              </div>
              {noMatchBrokenIssues.length > 0 ? (
                <div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleBulkArchiveNoMatchBrokenLinks()}
                    disabled={saving}
                  >
                    Archive all no-match broken links
                  </Button>
                </div>
              ) : null}
              {reconciliation.issues.length > 0 ? (
                <div className="overflow-x-auto border rounded">
                  <Table className="w-full table-fixed text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[170px]">Issue</TableHead>
                        <TableHead className="w-[240px]">Student / Parent</TableHead>
                        <TableHead className="w-[180px]">Course</TableHead>
                        <TableHead className="w-[160px]">Teacher</TableHead>
                        <TableHead className="w-[170px]">Enrollment ID</TableHead>
                        <TableHead className="w-[170px]">Current Kid/Student ID</TableHead>
                        <TableHead className="w-[220px]">Suggested action</TableHead>
                        <TableHead className="w-[210px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedIssueRows.map((issue, index) => (
                        <TableRow key={`${issue.issue}_${issue.enrollmentId}_${index}`}>
                          <TableCell>{issue.issue}</TableCell>
                          <TableCell className="truncate" title={issue.studentParent}>{issue.studentParent}</TableCell>
                          <TableCell className="truncate" title={issue.course}>{issue.course}</TableCell>
                          <TableCell className="truncate" title={issue.teacher}>{issue.teacher}</TableCell>
                          <TableCell className="truncate" title={issue.enrollmentId}>{issue.enrollmentId}</TableCell>
                          <TableCell className="truncate" title={issue.currentId}>{issue.currentId}</TableCell>
                          <TableCell className="truncate" title={issue.suggestedAction}>{issue.suggestedAction}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {issue.actionType === 'repair_link' && issue.repairCandidateKidId && issue.repairCandidateName ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => void handleRepairBrokenLink(issue)}
                                  disabled={saving}
                                >
                                  Repair Link
                                </Button>
                              ) : null}
                              {issue.actionType === 'restore_child_profile' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => openRestoreChildProfile(issue)}
                                  disabled={saving || restoreSubmitting}
                                >
                                  Restore Child Profile
                                </Button>
                              ) : null}
                              {issue.actionType === 'repair_link' || issue.actionType === 'archive_stale' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => void handleArchiveStaleEnrollment(issue)}
                                  disabled={saving || issue.enrollmentId === '—'}
                                >
                                  Archive Stale Enrollment
                                </Button>
                              ) : null}
                              {issue.actionType === 'convert_trial' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => void handleConvertLegacyTrialToActive(issue)}
                                  disabled={saving}
                                >
                                  Convert to Active
                                </Button>
                              ) : null}
                              {issue.actionType === 'archive_inactive_link' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => void handleArchiveInactiveLinkedEnrollment(issue)}
                                  disabled={saving || issue.enrollmentId === '—'}
                                >
                                  Archive Enrollment
                                </Button>
                              ) : null}
                              {issue.actionType === 'review_student' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => {
                                    toast({
                                      title: 'Review in Student Management',
                                      description: `Search kidId: ${issue.kidId || issue.currentId || '—'} (${issue.parentLabel || 'Parent not available'})`,
                                    });
                                  }}
                                >
                                  Review in Student Management
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                    <div>
                      Showing {(issuesPage - 1) * issuesRowsPerPage + 1}–{Math.min(issuesPage * issuesRowsPerPage, totalIssueRows)} of {totalIssueRows}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIssuesPage((prev) => Math.max(1, prev - 1))}
                        disabled={issuesPage <= 1}
                      >
                        Previous
                      </Button>
                      <span>Page {issuesPage} / {issuesTotalPages}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIssuesPage((prev) => Math.min(issuesTotalPages, prev + 1))}
                        disabled={issuesPage >= issuesTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No reconciliation issues found.</div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusTab('active')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTab === 'active' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('past')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTab === 'past' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
          >
            Past
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('archived')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTab === 'archived' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
          >
            Archived
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('broken')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTab === 'broken' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
          >
            Broken Links
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('duplicates')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTab === 'duplicates' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
          >
            Possible Duplicates
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search student, course, parent..."
            className="h-8 w-[240px] text-xs"
            aria-label="Search enrollments"
          />
          <span className="text-muted-foreground">Rows per page</span>
          <Select value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Use Archive instead of Delete to preserve schedule, payment, and audit history.
      </div>

      {totalFilteredRows === 0 ? (
        <div className="text-sm text-muted-foreground">
          No enrollments found for the selected filter.
        </div>
      ) : (
        <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[200px]">Course</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[200px]">Student(s)</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[110px]">Status</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[100px]">Billing</TableHead>
            <TableHead className="px-3 py-2 text-xs font-semibold w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pagedEnrollmentRows.map((row) => {
            const rawStatus = row.enrollment.status ?? 'unknown';
            const status = row.status;
            const badgeVariant =
              status === 'active' || status === 'paused'
                ? 'default'
                : status === 'cancelled'
                  ? 'destructive'
                  : status === 'completed' || status === 'discontinued' || status === 'expired'
                    ? 'outline'
                    : 'secondary';
            const statusLabel = status === 'trial' ? 'legacy trial' : status;

            return (
              <TableRow key={row.enrollment.id}>
                <TableCell className="px-3 py-2 font-medium">
                  <div className="max-w-[200px] truncate" title={row.courseDisplay}>
                    {row.courseDisplay}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-2">
                  <div className="max-w-[200px] truncate" title={row.studentName}>
                    {row.studentName}
                  </div>
                  {row.studentIdHint ? (
                    <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-muted-foreground" title={row.studentIdHint}>
                      Student ID: {row.studentIdHint}
                    </div>
                  ) : null}
                </TableCell>

                <TableCell className="px-3 py-2">
                  <Badge variant={badgeVariant} title={rawStatus !== status ? `raw: ${rawStatus}` : undefined}>
                    {statusLabel}
                  </Badge>
                </TableCell>

                <TableCell className="px-3 py-2">{row.enrollment.billingCycle ?? '—'}</TableCell>

                <TableCell className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => {
                      setSelectedEnrollmentId(row.enrollment.id);
                      setDetailOpen(true);
                    }}>
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openEdit(row.enrollment)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => handleArchive(row.enrollment)} disabled={saving}>
                      Archive
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}

      {totalFilteredRows > 0 ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, totalFilteredRows)} of {totalFilteredRows}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Enrollment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Fee per session (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={editParentRate}
                  onChange={(e) => setEditParentRate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teacher pay per session (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={editTeacherRate}
                  onChange={(e) => setEditTeacherRate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={editTeacherId || '__none__'} onValueChange={(v) => setEditTeacherId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name || t.email || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enrollment Details & Financial Management</DialogTitle>
          </DialogHeader>
          {selectedEnrollmentId && (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <EnrollmentDetailView
                enrollmentId={selectedEnrollmentId}
                onClose={() => {
                  const closingEnrollmentId = selectedEnrollmentId;
                  setDetailOpen(false);
                  setSelectedEnrollmentId(null);
                  if (closingEnrollmentId) {
                    void resolveAndCacheEnrollmentName(closingEnrollmentId);
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(restoreIssue)}
        onOpenChange={(open) => {
          if (!open) setRestoreIssue(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Restore Child Profile</DialogTitle>
          </DialogHeader>
          {restoreIssue?.enrollment ? (
            <div className="space-y-3 text-sm">
              <div className="rounded border p-3 space-y-1 text-xs">
                <div><span className="text-muted-foreground">Parent:</span> {String((restoreIssue.enrollment as any).parentName || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.displayName || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.name || '—')}</div>
                <div><span className="text-muted-foreground">Parent email:</span> {String((restoreIssue.enrollment as any).parentEmail || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.email || '—')}</div>
                <div><span className="text-muted-foreground">Parent phone:</span> {String(parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.phone || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.phoneNumber || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.mobile || parentUsersMap[String(restoreIssue.enrollment.parentId || '').trim()]?.whatsapp || '—')}</div>
                <div><span className="text-muted-foreground">Course:</span> {restoreIssue.course || '—'}</div>
                <div><span className="text-muted-foreground">Teacher:</span> {restoreIssue.teacher || '—'}</div>
                <div><span className="text-muted-foreground">Enrollment ID:</span> {restoreIssue.enrollmentId || '—'}</div>
                <div><span className="text-muted-foreground">Current kid/student ID:</span> {restoreIssue.currentId || '—'}</div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Child name</label>
                <Input
                  value={restoreChildName}
                  onChange={(event) => setRestoreChildName(event.target.value)}
                  placeholder="Enter child name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Age (optional)</label>
                  <Input
                    type="number"
                    min={1}
                    value={restoreAgeInput}
                    onChange={(event) => setRestoreAgeInput(event.target.value)}
                    placeholder="e.g. 7"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Grade (optional)</label>
                  <Input
                    value={restoreGradeInput}
                    onChange={(event) => setRestoreGradeInput(event.target.value)}
                    placeholder="e.g. Grade 2"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                This will create or repair the canonical child profile using the existing kid/student ID already used by the enrollment and sessions. Existing enrollment, schedule, payment, and attendance history will be preserved.
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreIssue(null)} disabled={restoreSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmRestoreChildProfile()} disabled={restoreSubmitting || !restoreChildName.trim()}>
              {restoreSubmitting ? 'Restoring…' : 'Confirm Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
