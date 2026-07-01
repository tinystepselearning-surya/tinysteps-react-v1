import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebaseConfig';
import { getDocLogged, getDocsLogged } from '../../lib/firestoreReadLogging';
import { buildTeacherPaymentSelectOptions } from './paymentSelectOptions';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
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
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';

type TeacherUser = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneLocal?: string;
  phoneNormalized?: string;
  role?: string;
  roles?: string[];
};

type TeacherLoadMode = 'none' | 'top10' | 'selected';

const monthKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMoney = (value: any) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

const isReadableDisplayName = (value: unknown) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower === 'unknown' || lower === 'name not found' || lower === 'n/a' || lower === 'na') {
    return false;
  }
  const hasWhitespace = /\s/.test(trimmed);
  const looksLikeLongId =
    !hasWhitespace &&
    ((/^[a-f0-9]{16,}$/i.test(trimmed)) || (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)));
  return !looksLikeLongId;
};

const normalizeStatus = (value: any) => String(value || '').trim().toLowerCase();

const isSettledStatus = (status: string) => status === 'paid' || status === 'settled';

const isSessionEarning = (earning: any) => {
  const source = normalizeStatus(earning?.source);
  if (source === 'session_present_completed') return true;
  return Boolean(String(earning?.sessionId || '').trim());
};

const resolvePaidAmount = (earning: any, amount: number) => {
  const paidRaw = Number(earning?.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  return isSettledStatus(normalizeStatus(earning?.status)) ? Math.max(amount, 0) : 0;
};

const isTeacherUser = (user: TeacherUser) => {
  if (Array.isArray(user.roles)) return user.roles.includes('teacher');
  return String(user.role || '').toLowerCase() === 'teacher';
};

const chunkIds = (ids: string[], size = 10) => {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
};

const createPayoutRequestKey = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `payout_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const toMillis = (value: any): number | null => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (Number.isFinite(value?.seconds)) return value.seconds * 1000;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-').map(Number);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return Date.UTC(year, month - 1, day);
    }
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDateDisplay = (value: any) => {
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
};

const formatStatusLabel = (value: any) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '—';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const fetchTeacherIdsForMonth = async (
  selectedMonth: string,
  labels: {
    primary: string;
    fallback: string;
    failureContext: string;
  } = {
    primary: 'TeacherPayments:dropdown-rollup-earnings',
    fallback: 'TeacherPayments:dropdown-teacher-earnings-fallback',
    failureContext: '[TeacherPayments] Dropdown rollup query failed, falling back to earnings',
  }
): Promise<string[]> => {
  let nextTeacherIds: string[] = [];
  try {
    const topRollupSnap = await getDocsLogged(
      labels.primary,
      query(
        collectionGroup(db, 'earnings'),
        where('monthKey', '==', selectedMonth),
        orderBy('teacherId', 'asc'),
        limit(10)
      ),
      { source: 'src/pages/admin/TeacherPayments.tsx' },
    );
    nextTeacherIds = topRollupSnap.docs
      .map((docSnap) => String((docSnap.data() as any)?.teacherId || '').trim())
      .filter(Boolean);
  } catch (err) {
    console.warn(labels.failureContext, err);
  }

  if (nextTeacherIds.length === 0) {
    const fallbackSnap = await getDocsLogged(
      labels.fallback,
      query(
        collection(db, 'teacherEarnings'),
        where('monthKey', '==', selectedMonth),
        orderBy('teacherId', 'asc'),
        limit(10)
      ),
      { source: 'src/pages/admin/TeacherPayments.tsx' },
    );
    nextTeacherIds = Array.from(
      new Set(
        fallbackSnap.docs
          .map((docSnap) => String((docSnap.data() as any)?.teacherId || '').trim())
          .filter(Boolean)
      )
    ).slice(0, 10);
  }

  return nextTeacherIds;
};

const fetchTeacherUsersByIds = async (teacherIds: string[]): Promise<TeacherUser[]> => {
  if (teacherIds.length === 0) return [];
  const teacherDocs: TeacherUser[] = [];
  for (const chunk of chunkIds(teacherIds.slice(0, 10))) {
    const snap = await getDocsLogged(
      'TeacherPayments:dropdown-users',
      query(collection(db, 'users'), where(documentId(), 'in', chunk)),
      { source: 'src/pages/admin/TeacherPayments.tsx' },
    );
    snap.docs.forEach((docSnap) => {
      teacherDocs.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
  }
  return teacherDocs.filter(isTeacherUser);
};

const isSessionCompletedLike = (value: unknown): boolean => {
  const normalized = normalizeStatus(value);
  return (
    normalized === 'completed' ||
    normalized === 'present' ||
    normalized === 'late' ||
    normalized === 'attendance_marked' ||
    normalized === 'billable_completed'
  );
};

const isSessionRescheduledOrCancelled = (value: unknown): boolean => {
  const normalized = normalizeStatus(value);
  return (
    normalized.includes('reschedule') ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  );
};

const resolveEarningDateMillis = (session: any, earning: any): number | null => {
  const orderedCandidates = [
    session?.date,
    session?.sessionDate,
    session?.classDate,
    session?.startAt,
    session?.scheduledStartAt,
    session?.startTime,
    earning?.date,
    earning?.sessionDate,
    earning?.classDate,
    earning?.startAt,
    earning?.createdAt,
    earning?.updatedAt,
  ];
  for (const candidate of orderedCandidates) {
    const ms = toMillis(candidate);
    if (Number.isFinite(ms) && ms! > 0) return ms as number;
  }
  return null;
};

const resolveTeacherDetailStatusLabel = (
  includeInTotals: boolean,
  session: any,
  earning: any
): string => {
  const sessionStatus = normalizeStatus(session?.status);
  if (isSessionCompletedLike(sessionStatus)) return 'Completed';
  if (isSessionRescheduledOrCancelled(sessionStatus)) return formatStatusLabel(sessionStatus);
  const earningStatus = normalizeStatus(earning?.status);
  if (isSessionRescheduledOrCancelled(earningStatus)) return formatStatusLabel(earningStatus);
  if (includeInTotals) return 'Included in payout';
  return earningStatus ? formatStatusLabel(earningStatus) : '—';
};

export default function TeacherPayments(): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    monthKeyFromDate(new Date())
  );
  const [loadMode, setLoadMode] = useState<TeacherLoadMode>('none');
  const [loadedTeacherIds, setLoadedTeacherIds] = useState<string[]>([]);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherSearchResults, setTeacherSearchResults] = useState<TeacherUser[]>([]);
  const [teacherSearchLoading, setTeacherSearchLoading] = useState(false);
  const [initialTeacherOptions, setInitialTeacherOptions] = useState<TeacherUser[]>([]);
  const [initialTeacherOptionsLoading, setInitialTeacherOptionsLoading] = useState(true);
  const [selectedTeacherOptionId, setSelectedTeacherOptionId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [rollups, setRollups] = useState<Record<string, any>>({});
  const [loadingRollups, setLoadingRollups] = useState(false);
  const [payoutSaving, setPayoutSaving] = useState<string | null>(null);
  const [correctionSaving, setCorrectionSaving] = useState<string | null>(null);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [kidMap, setKidMap] = useState<Record<string, string>>({});
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [parentMap, setParentMap] = useState<Record<string, string>>({});
  const [sessionMap, setSessionMap] = useState<Record<string, any>>({});
  const [enrollmentMap, setEnrollmentMap] = useState<
    Record<string, { kidId?: string; courseId?: string; studentName?: string }>
  >({});
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutTeacherId, setPayoutTeacherId] = useState('');
  const [payoutMonth, setPayoutMonth] = useState<string>(monthKeyFromDate(new Date()));
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutRequestKey, setPayoutRequestKey] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const searchTerm = teacherSearchTerm.trim();
    if (searchTerm.length < 2) {
      setTeacherSearchResults([]);
      setTeacherSearchLoading(false);
      return;
    }

    let active = true;
    const loadTeacherSearchResults = async () => {
      setTeacherSearchLoading(true);
      try {
        const byId = new Map<string, TeacherUser>();
        const appendDocs = (docs: Array<{ id: string; data: () => any }>) => {
          docs.forEach((docSnap) => {
            const user = { id: docSnap.id, ...(docSnap.data() as any) } as TeacherUser;
            if (!isTeacherUser(user)) return;
            if (!byId.has(user.id)) byId.set(user.id, user);
          });
        };

        const exactQueries = [
          query(collection(db, 'users'), where('email', '==', searchTerm), limit(10)),
          query(collection(db, 'users'), where('phone', '==', searchTerm), limit(10)),
          query(collection(db, 'users'), where('phoneLocal', '==', searchTerm), limit(10)),
          query(collection(db, 'users'), where('phoneNormalized', '==', searchTerm), limit(10)),
          query(collection(db, 'users'), where('displayName', '==', searchTerm), limit(10)),
          query(collection(db, 'users'), where('name', '==', searchTerm), limit(10)),
        ];
        const snaps = await Promise.all(exactQueries.map((ref) => getDocs(ref).catch(() => null)));
        snaps.forEach((snap) => {
          if (snap) appendDocs(snap.docs as Array<{ id: string; data: () => any }>);
        });
        const idSnap = await getDoc(doc(db, 'users', searchTerm)).catch(() => null);
        if (idSnap?.exists()) {
          appendDocs([{ id: idSnap.id, data: () => idSnap.data() }]);
        }

        if (!active) return;
        setTeacherSearchResults(Array.from(byId.values()).slice(0, 10));
      } finally {
        if (active) setTeacherSearchLoading(false);
      }
    };

    void loadTeacherSearchResults();
    return () => {
      active = false;
    };
  }, [teacherSearchTerm]);

  useEffect(() => {
    if (!selectedMonth) {
      setInitialTeacherOptions([]);
      setInitialTeacherOptionsLoading(false);
      return;
    }

    let active = true;
    const loadInitialTeacherOptions = async () => {
      setInitialTeacherOptionsLoading(true);
      try {
        const teacherIds = await fetchTeacherIdsForMonth(selectedMonth);
        const teacherDocs = await fetchTeacherUsersByIds(teacherIds);
        if (!active) return;
        setInitialTeacherOptions(teacherDocs);
      } catch (err) {
        console.warn('[TeacherPayments] Failed to load initial dropdown options', err);
        if (!active) return;
        setInitialTeacherOptions([]);
      } finally {
        if (active) setInitialTeacherOptionsLoading(false);
      }
    };

    void loadInitialTeacherOptions();
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const resetLoadedTeacherScope = () => {
    setLoadMode('none');
    setScopeError('');
    setLoadedTeacherIds([]);
    setTeachers([]);
    setPayouts([]);
    setEarnings([]);
    setRollups({});
    setExpandedTeachers(new Set());
  };

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const parentIds = new Set<string>();
        const kidIds = new Set<string>();
        const courseIds = new Set<string>();
        const enrollmentIds = new Set<string>();
        const sessionIds = new Set<string>();

        payouts.forEach((p) => {
        });

        earnings.forEach((e) => {
          const parentId = String(e.parentId || '');
          if (parentId) parentIds.add(parentId);
          const kidId = String(e.kidId || e.studentId || '');
          if (kidId) kidIds.add(kidId);
          if (Array.isArray(e.kidIds)) {
            e.kidIds
              .map((value: any) => String(value || '').trim())
              .filter(Boolean)
              .forEach((value: string) => kidIds.add(value));
          }
          const courseId = String(e.courseId || '');
          if (courseId) courseIds.add(courseId);
          const enrollmentId = String(e.enrollmentId || '');
          if (enrollmentId) enrollmentIds.add(enrollmentId);
          const sessionId = String(e.sessionId || e.id || '').trim();
          if (sessionId && isSessionEarning(e)) sessionIds.add(sessionId);
        });

        const nextEnrollmentMap: Record<
          string,
          { kidId?: string; courseId?: string; studentName?: string }
        > = {};

        if (enrollmentIds.size > 0) {
          for (const chunk of chunkIds(Array.from(enrollmentIds))) {
            const snap = await getDocs(
              query(collection(db, 'enrollments'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              const resolvedKidId =
                String(
                  data?.kidId || data?.studentId || data?.kidIds?.[0] || ''
                ).trim() || undefined;
              const resolvedCourseId = String(data?.courseId || '').trim() || undefined;
              const studentName =
                String(
                  data?.studentName ||
                    data?.kidName ||
                    data?.childName ||
                    data?.fullName ||
                    data?.displayName ||
                    data?.name ||
                    ''
                ).trim();

              nextEnrollmentMap[docSnap.id] = {
                kidId: resolvedKidId,
                courseId: resolvedCourseId,
                studentName: isReadableDisplayName(studentName) ? studentName : undefined,
              };

              if (resolvedKidId) kidIds.add(resolvedKidId);
              if (resolvedCourseId) courseIds.add(resolvedCourseId);
            });
          }
        }

        setEnrollmentMap(nextEnrollmentMap);

        if (parentIds.size === 0) {
          setParentMap({});
        } else {
          const nextParentMap: Record<string, string> = {};
          for (const chunk of chunkIds(Array.from(parentIds))) {
            const snap = await getDocs(
              query(collection(db, 'users'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              nextParentMap[docSnap.id] =
                String(data?.displayName || data?.name || data?.email || '').trim() || docSnap.id;
            });
          }
          setParentMap(nextParentMap);
        }

        if (kidIds.size === 0) {
          setKidMap({});
        } else {
          const nextKidMap: Record<string, string> = {};
          for (const chunk of chunkIds(Array.from(kidIds))) {
            const snap = await getDocs(
              query(collection(db, 'kids'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              const name =
                data?.fullName ||
                data?.name ||
                data?.displayName ||
                data?.studentName ||
                data?.firstName ||
                '';
              const normalizedName = isReadableDisplayName(name) ? String(name).trim() : '';
              if (normalizedName) {
                nextKidMap[docSnap.id] = normalizedName;
                if (data?.studentId) nextKidMap[data.studentId] = normalizedName;
              }
            });

            const studentsSnap = await getDocs(
              query(collection(db, 'students'), where(documentId(), 'in', chunk))
            );
            studentsSnap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              const name =
                data?.fullName ||
                data?.name ||
                data?.displayName ||
                data?.studentName ||
                data?.firstName ||
                '';
              const normalizedName = isReadableDisplayName(name) ? String(name).trim() : '';
              if (normalizedName) {
                nextKidMap[docSnap.id] = normalizedName;
                if (data?.kidId) nextKidMap[data.kidId] = normalizedName;
              }
            });
          }
          setKidMap(nextKidMap);
        }

        if (courseIds.size === 0) {
          setCourseMap({});
        } else {
          const nextCourseMap: Record<string, string> = {};
          for (const chunk of chunkIds(Array.from(courseIds))) {
            const snap = await getDocs(
              query(collection(db, 'courses'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              nextCourseMap[docSnap.id] = data?.title || data?.name || docSnap.id;
              if (data?.courseId) nextCourseMap[data.courseId] = nextCourseMap[docSnap.id];
              if (data?.slug) nextCourseMap[data.slug] = nextCourseMap[docSnap.id];
            });
          }
          setCourseMap(nextCourseMap);
        }

        if (sessionIds.size === 0) {
          setSessionMap({});
        } else {
          const nextSessionMap: Record<string, any> = {};
          for (const chunk of chunkIds(Array.from(sessionIds))) {
            const snap = await getDocs(
              query(collection(db, 'classSessions'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              nextSessionMap[docSnap.id] = docSnap.data() as any;
            });
          }
          setSessionMap(nextSessionMap);
        }
      } catch (err) {
        console.warn('[TeacherPayments] Failed to load referenced data', err);
      }
    };
    void loadRefs();
  }, [payouts, earnings]);

  useEffect(() => {
    if (!selectedMonth || loadMode === 'none' || loadedTeacherIds.length === 0) {
      setScopeLoading(false);
      setPayouts([]);
      setEarnings([]);
      setTeachers([]);
      setRollups({});
      setLoadingRollups(false);
      setScopeError('');
      return;
    }
    let cancelled = false;
    const loadScopedTeacherFinance = async () => {
      setScopeLoading(true);
      setLoadingRollups(true);
      setScopeError('');
      try {
        const teacherDocs: TeacherUser[] = [];
        for (const chunk of chunkIds(loadedTeacherIds)) {
          const snap = await getDocs(
            query(collection(db, 'users'), where(documentId(), 'in', chunk))
          );
          snap.docs.forEach((docSnap) =>
            teacherDocs.push({ id: docSnap.id, ...(docSnap.data() as any) })
          );
        }

        const loadScopedCollection = async (collectionName: 'teacherPayouts' | 'teacherEarnings') => {
          const rows: any[] = [];
          for (const chunk of chunkIds(loadedTeacherIds)) {
            try {
              const snap = await getDocs(
                query(
                  collection(db, collectionName),
                  where('monthKey', '==', selectedMonth),
                  where('teacherId', 'in', chunk)
                )
              );
              snap.docs.forEach((docSnap) => rows.push({ id: docSnap.id, ...(docSnap.data() as any) }));
            } catch {
              for (const teacherId of chunk) {
                const snap = await getDocs(
                  query(
                    collection(db, collectionName),
                    where('monthKey', '==', selectedMonth),
                    where('teacherId', '==', teacherId)
                  )
                );
                snap.docs.forEach((docSnap) => rows.push({ id: docSnap.id, ...(docSnap.data() as any) }));
              }
            }
          }
          return rows.filter((row) => row.archived !== true);
        };

        const [payoutRows, earningRows, snaps] = await Promise.all([
          loadScopedCollection('teacherPayouts'),
          loadScopedCollection('teacherEarnings'),
          Promise.all(
            loadedTeacherIds.map((teacherId) =>
              getDoc(doc(db, 'teachers', teacherId, 'earnings', selectedMonth))
            )
          ),
        ]);

        const map: Record<string, any> = {};
        loadedTeacherIds.forEach((teacherId, idx) => {
          map[teacherId] = snaps[idx].exists() ? snaps[idx].data() : null;
        });
        if (cancelled) return;
        setTeachers(teacherDocs.filter(isTeacherUser));
        setPayouts(payoutRows);
        setEarnings(earningRows);
        setRollups(map);
        setScopeError('');
      } catch (err) {
        console.error('[TeacherPayments] Failed to load scoped finance data', err);
        if (cancelled) return;
        setTeachers([]);
        setPayouts([]);
        setEarnings([]);
        setRollups({});
        setScopeError('Payment data could not be loaded. Check Firestore rules/indexes.');
      } finally {
        if (!cancelled) {
          setLoadingRollups(false);
          setScopeLoading(false);
        }
      }
    };
    void loadScopedTeacherFinance();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, loadMode, loadedTeacherIds, refreshKey]);

  const paidByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    payouts.forEach((p) => {
      const teacherId = String(p.teacherId || '');
      if (!teacherId) return;
      const amount = Number(p.amount ?? 0);
      if (!Number.isFinite(amount)) return;
      map.set(teacherId, (map.get(teacherId) || 0) + amount);
    });
    return map;
  }, [payouts]);

  const earningsByTeacher = useMemo(() => {
    const map = new Map<
      string,
      {
        entriesCount: number;
        sessions: number;
        sessionEarnings: number;
        earned: number;
        pending: number;
      }
    >();

    earnings.forEach((earning) => {
      const teacherId = String(earning.teacherId || '').trim();
      if (!teacherId) return;

      const status = normalizeStatus(earning.status);
      if (status === 'void') return;

      const amountRaw = Number(earning.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const paidAmount = resolvePaidAmount(earning, amount);
      const pending = Math.max(amount - paidAmount, 0);
      const isSession = isSessionEarning(earning);

      if (!map.has(teacherId)) {
        map.set(teacherId, {
          entriesCount: 0,
          sessions: 0,
          sessionEarnings: 0,
          earned: 0,
          pending: 0,
        });
      }
      const entry = map.get(teacherId)!;
      entry.entriesCount += 1;
      entry.earned += amount;
      entry.pending += pending;
      if (isSession) {
        entry.sessions += 1;
        entry.sessionEarnings += amount;
      }
    });

    return map;
  }, [earnings]);

  const rows = useMemo(() => {
    return teachers.map((t) => {
      const rollup = rollups[t.id] || {};
      const live = earningsByTeacher.get(t.id);
      const hasLiveData = Boolean(live?.entriesCount);
      const earned = hasLiveData
        ? Number(live?.earned ?? 0)
        : Number(rollup.totalEarnings ?? 0) || 0;
      const pending = hasLiveData
        ? Number(live?.pending ?? 0)
        : Number(rollup.pendingEarnings ?? 0) || 0;
      const sessions = hasLiveData
        ? Number(live?.sessions ?? 0)
        : Number(rollup.totalSessions ?? rollup.sessionsCompleted ?? 0) || 0;
      const rateFromRollup = Number(rollup.ratePerSession ?? 0) || 0;
      const fallbackRate =
        sessions > 0 ? Number(live?.sessionEarnings ?? 0) / Math.max(sessions, 1) : 0;
      const rate = rateFromRollup > 0 ? rateFromRollup : fallbackRate;
      const paid = paidByTeacher.get(t.id) || 0;
      return {
        teacherId: t.id,
        teacherName: t.displayName || t.name || t.email || t.id,
        sessions,
        rate,
        earned,
        paid,
        pending,
        balance: earned - paid,
      };
    });
  }, [teachers, rollups, paidByTeacher, earningsByTeacher]);

  const classDetailsByTeacher = useMemo(() => {
    const result = new Map<
      string,
      {
        included: Array<{
          key: string;
          dateLabel: string;
          sortMs: number;
          studentLabel: string;
          courseLabel: string;
          parentLabel: string;
          statusLabel: string;
          amount: number;
        }>;
        excluded: Array<{
          key: string;
          dateLabel: string;
          sortMs: number;
          studentLabel: string;
          courseLabel: string;
          parentLabel: string;
          statusLabel: string;
          amount: number;
        }>;
        completedCount: number;
        totalEarned: number;
      }
    >();

    const ensureBucket = (teacherId: string) => {
      let bucket = result.get(teacherId);
      if (!bucket) {
        bucket = { included: [], excluded: [], completedCount: 0, totalEarned: 0 };
        result.set(teacherId, bucket);
      }
      return bucket;
    };

    earnings.forEach((earning) => {
      const teacherId = String(earning.teacherId || '').trim();
      if (!teacherId || !isSessionEarning(earning)) return;

      const amountRaw = Number(earning.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const sessionId = String(earning.sessionId || earning.id || '').trim();
      const session = sessionId ? sessionMap[sessionId] : undefined;
      const enrollmentId = String(earning.enrollmentId || session?.enrollmentId || '').trim();
      const enrollmentRef = enrollmentId ? enrollmentMap[enrollmentId] : undefined;
      const kidId = String(
        earning.kidId ||
          earning.studentId ||
          earning.kidIds?.[0] ||
          session?.kidId ||
          session?.studentId ||
          enrollmentRef?.kidId ||
          ''
      ).trim();
      const courseId = String(
        earning.courseId || session?.courseId || enrollmentRef?.courseId || ''
      ).trim();
      const parentId = String(earning.parentId || session?.parentId || '').trim();

      const sessionStudentName = String(
        session?.studentName || session?.kidName || session?.childName || ''
      ).trim();
      const earningStudentName = String(
        earning.studentName || earning.kidName || earning.childName || ''
      ).trim();
      const enrollmentStudentName = String(enrollmentRef?.studentName || '').trim();
      const studentLabel =
        (isReadableDisplayName(earningStudentName) && earningStudentName) ||
        (isReadableDisplayName(sessionStudentName) && sessionStudentName) ||
        (isReadableDisplayName(enrollmentStudentName) && enrollmentStudentName) ||
        (isReadableDisplayName(kidMap[kidId]) && String(kidMap[kidId]).trim()) ||
        kidId ||
        'Unknown';

      const courseLabel = courseMap[courseId] || courseId || '—';
      const parentLabel =
        parentMap[parentId] ||
        String(session?.parentName || session?.parentDisplayName || '').trim() ||
        parentId ||
        '—';

      const sortMs = resolveEarningDateMillis(session, earning) || 0;
      const includeInTotals = normalizeStatus(earning.status) !== 'void';
      const statusLabel = resolveTeacherDetailStatusLabel(includeInTotals, session, earning);

      const row = {
        key: `${sessionId || earning.id || 'earning'}_${teacherId}`,
        dateLabel: sortMs > 0 ? formatDateDisplay(sortMs) : '—',
        sortMs,
        studentLabel,
        courseLabel,
        parentLabel,
        statusLabel,
        amount,
      };

      const bucket = ensureBucket(teacherId);
      if (includeInTotals) {
        bucket.included.push(row);
        bucket.completedCount += 1;
        bucket.totalEarned += amount;
      } else {
        bucket.excluded.push(row);
      }
    });

    result.forEach((bucket) => {
      bucket.included.sort((a, b) => b.sortMs - a.sortMs);
      bucket.excluded.sort((a, b) => b.sortMs - a.sortMs);
    });

    return result;
  }, [earnings, sessionMap, enrollmentMap, kidMap, courseMap, parentMap]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    setSelectedTeacherOptionId('');
    setScopeError('');
    resetLoadedTeacherScope();
  };

  const handleLoadTop10Teachers = async () => {
    if (!selectedMonth) return;
    setScopeLoading(true);
    setScopeError('');
    try {
      const nextTeacherIds = await fetchTeacherIdsForMonth(selectedMonth, {
        primary: 'TeacherPayments:top10-rollup-earnings',
        fallback: 'TeacherPayments:top10-teacher-earnings-fallback',
        failureContext: '[TeacherPayments] Top10 rollup query failed, falling back to earnings',
      });

      setExpandedTeachers(new Set());
      setLoadMode('top10');
      setLoadedTeacherIds(nextTeacherIds);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('[TeacherPayments] Failed to load top10 teachers', err);
      setExpandedTeachers(new Set());
      setLoadMode('none');
      setLoadedTeacherIds([]);
      setTeachers([]);
      setPayouts([]);
      setEarnings([]);
      setRollups({});
      setScopeError('Payment data could not be loaded. Check Firestore rules/indexes.');
    } finally {
      setScopeLoading(false);
    }
  };

  const handleApplySelectedTeacher = () => {
    if (!selectedTeacherOptionId) return;
    const selectedUser = selectedTeacherOption?.user || null;
    if (selectedUser) {
      setTeachers([selectedUser]);
    }
    setExpandedTeachers(new Set());
    setLoadMode('selected');
    setLoadedTeacherIds([selectedTeacherOptionId]);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefreshLoadedTeachers = () => {
    if (loadMode === 'none' || loadedTeacherIds.length === 0) return;
    setRefreshKey((prev) => prev + 1);
  };

  const visibleRows = rows;
  const teacherSelectOptions = useMemo(
    () =>
      buildTeacherPaymentSelectOptions({
        loadedTeachers: [...initialTeacherOptions, ...teachers],
        searchResults: teacherSearchResults,
        rows: visibleRows,
        selectedTeacherId: selectedTeacherOptionId,
      }),
    [initialTeacherOptions, selectedTeacherOptionId, teacherSearchResults, teachers, visibleRows]
  );
  const selectedTeacherOption =
    teacherSelectOptions.find((option) => option.id === selectedTeacherOptionId) || null;
  const teacherHasSearchTerm = teacherSearchTerm.trim().length >= 2;
  const teacherSelectEmptyLabel =
    initialTeacherOptionsLoading || teacherSearchLoading
      ? 'Loading options…'
      : teacherHasSearchTerm
        ? 'No search results'
        : 'No teachers found for this month';
  const loadedScopeLabel =
    loadMode === 'top10'
      ? 'Showing top 10 only.'
      : loadMode === 'selected'
        ? 'Showing selected teacher only.'
        : 'No data loaded yet.';

  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  const openPayoutModal = (row: { teacherId: string }) => {
    setPayoutTeacherId(row.teacherId);
    setPayoutMonth(selectedMonth || monthKeyFromDate(new Date()));
    setPayoutAmount('');
    setPayoutNote('');
    setPayoutError(null);
    setPayoutRequestKey(createPayoutRequestKey());
    setPayoutOpen(true);
  };

  const handleRecordPayout = async () => {
    if (!payoutTeacherId) {
      setPayoutError('Select a teacher.');
      return;
    }
    if (!payoutMonth) {
      setPayoutError('Select a month.');
      return;
    }
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      setPayoutError('Enter a non-zero amount (negative allowed).');
      return;
    }

    const paidAt = `${payoutMonth}-01`;
    const method = 'bank_transfer';
    const note = payoutNote?.trim();
    const requestKey = payoutRequestKey || createPayoutRequestKey();
    if (!payoutRequestKey) setPayoutRequestKey(requestKey);
    const selectedTeacher =
      teachers.find((t) => t.id === payoutTeacherId) || null;

    try {
      setPayoutSaving(payoutTeacherId);
      setPayoutError(null);
      const fn = httpsCallable(functions, 'recordTeacherPayout');
      await fn({
        teacherId: payoutTeacherId,
        amount,
        paidAt,
        method,
        note: note || undefined,
        idempotencyKey: requestKey,
      });
      const snap = await getDoc(
        doc(db, 'teachers', payoutTeacherId, 'earnings', payoutMonth)
      );
      setRollups((prev) => ({
        ...prev,
        [payoutTeacherId]: snap.exists() ? snap.data() : null,
      }));
      toast({
        title: 'Payout recorded',
        description: `${selectedTeacher?.displayName || selectedTeacher?.name || selectedTeacher?.email || payoutTeacherId} · ₹${Math.round(amount).toLocaleString('en-IN')}`,
      });
      setRefreshKey((prev) => prev + 1);
      setPayoutRequestKey('');
      setPayoutOpen(false);
    } catch (err: any) {
      const message = err?.message || 'Failed to record payout';
      setPayoutError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPayoutSaving(null);
    }
  };

  const handleFixInvalidEarnings = async (row: { teacherId: string; teacherName: string }) => {
    const confirmation = window.prompt(
      `Type FIX to void orphan/deleted session earnings for ${row.teacherName} in ${selectedMonth}.`
    );
    if (confirmation !== 'FIX') return;

    const noteRaw = window.prompt(
      'Optional correction note (leave blank for default audit note):'
    );
    const note = typeof noteRaw === 'string' ? noteRaw.trim() : '';

    try {
      setCorrectionSaving(row.teacherId);
      const fn = httpsCallable(functions, 'voidTeacherOrphanEarnings');
      const response: any = await fn({
        teacherId: row.teacherId,
        monthKey: selectedMonth,
        note: note || undefined,
      });
      const data = response?.data || {};
      const voidedCount = Number(data.voidedCount ?? 0) || 0;
      const skippedPaidCount = Number(data.skippedPaidCount ?? 0) || 0;
      const orphanCount = Number(data.orphanCount ?? 0) || 0;

      const snap = await getDoc(
        doc(db, 'teachers', row.teacherId, 'earnings', selectedMonth)
      );
      setRollups((prev) => ({
        ...prev,
        [row.teacherId]: snap.exists() ? snap.data() : null,
      }));

      toast({
        title: voidedCount > 0 ? 'Corrections applied' : 'No voidable entries',
        description:
          voidedCount > 0
            ? `${row.teacherName}: voided ${voidedCount} invalid earning entries${skippedPaidCount > 0 ? `, skipped ${skippedPaidCount} paid entries` : ''}.`
            : orphanCount > 0
              ? `${row.teacherName}: ${orphanCount} orphan entries found but already paid/void.`
              : `${row.teacherName}: no orphan session earnings found for ${selectedMonth}.`,
      });
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      const message = err?.message || 'Failed to apply corrections';
      toast({
        title: 'Correction failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCorrectionSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Teacher Payments</h2>
          <p className="text-sm text-muted-foreground">
            Monthly earnings vs payouts for each teacher, with correction tools for invalid session earnings.
          </p>
          <p className="text-xs text-muted-foreground">
            Archived records are excluded from active teacher payment totals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_auto] gap-3 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Teacher search</label>
            <Input
              value={teacherSearchTerm}
              onChange={(e) => setTeacherSearchTerm(e.target.value)}
              placeholder="Search exact teacher email, phone, name, or ID"
            />
            <div className="text-xs text-muted-foreground">
              Enter at least 2 characters. Search is limited to up to 10 matching teachers.
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Selected teacher</label>
            <Select value={selectedTeacherOptionId} onValueChange={setSelectedTeacherOptionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teacherSelectOptions.length === 0 ? (
                  <SelectItem value="__no_teacher_results" disabled>
                    {teacherSelectEmptyLabel}
                  </SelectItem>
                ) : (
                  teacherSelectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleLoadTop10Teachers} disabled={scopeLoading}>
              Load Top 10
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplySelectedTeacher}
              disabled={!selectedTeacherOptionId || scopeLoading}
            >
              Apply / Load Selected
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshLoadedTeachers}
              disabled={loadMode === 'none' || scopeLoading}
            >
              Refresh Loaded Results
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {loadedScopeLabel}
          {loadMode === 'none' ? ' Select a teacher or click Load Top 10.' : ''}
        </div>
        {scopeError ? <div className="text-sm text-red-600">{scopeError}</div> : null}
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Teacher</th>
                <th className="p-2">Sessions</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Earned</th>
                <th className="p-2">Paid</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Pending</th>
                <th className="p-2">Action</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={9}>
                    {scopeError
                      ? 'Payment data could not be loaded. Check Firestore rules/indexes.'
                      : scopeLoading || loadingRollups
                      ? 'Loading…'
                      : loadMode === 'none'
                        ? 'No data loaded yet. Select a teacher or click Load Top 10.'
                        : 'No teachers found for the loaded scope.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const isExpanded = expandedTeachers.has(row.teacherId);
                  const details = classDetailsByTeacher.get(row.teacherId) || {
                    included: [],
                    excluded: [],
                    completedCount: 0,
                    totalEarned: 0,
                  };
                  return (
                    <React.Fragment key={row.teacherId}>
                      <tr className="border-b last:border-b-0">
                        <td className="p-2">{row.teacherName}</td>
                        <td className="p-2">{row.sessions}</td>
                        <td className="p-2">{formatMoney(row.rate)}</td>
                        <td className="p-2">{formatMoney(row.earned)}</td>
                        <td className="p-2">{formatMoney(row.paid)}</td>
                        <td className="p-2">{formatMoney(row.balance)}</td>
                        <td className="p-2">{formatMoney(row.pending)}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={payoutSaving === row.teacherId}
                              onClick={() => openPayoutModal(row)}
                            >
                              {payoutSaving === row.teacherId ? 'Saving…' : 'Record payout / adjust'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={correctionSaving === row.teacherId}
                              onClick={() =>
                                handleFixInvalidEarnings({
                                  teacherId: row.teacherId,
                                  teacherName: row.teacherName,
                                })
                              }
                            >
                              {correctionSaving === row.teacherId ? 'Fixing…' : 'Fix invalid'}
                            </Button>
                          </div>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleTeacher(row.teacherId)}
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-2 bg-muted/30">
                            {details.included.length === 0 ? (
                              <div className="text-xs text-muted-foreground">
                                No completed classes found for this period.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs table-auto">
                                    <thead>
                                      <tr className="text-left border-b">
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Student</th>
                                        <th className="p-2">Course</th>
                                        <th className="p-2">Parent</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Teacher earning amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {details.included.map((entry) => (
                                        <tr key={entry.key} className="border-b last:border-b-0">
                                          <td className="p-2">{entry.dateLabel}</td>
                                          <td className="p-2">{entry.studentLabel}</td>
                                          <td className="p-2">{entry.courseLabel}</td>
                                          <td className="p-2">{entry.parentLabel}</td>
                                          <td className="p-2">{entry.statusLabel}</td>
                                          <td className="p-2">{formatMoney(entry.amount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total completed classes: {details.completedCount} · Total earned:{' '}
                                  {formatMoney(details.totalEarned)}
                                </div>
                                {details.excluded.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium">
                                      Reschedules / Cancellations
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs table-auto">
                                        <thead>
                                          <tr className="text-left border-b">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Student</th>
                                            <th className="p-2">Course</th>
                                            <th className="p-2">Parent</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2">Teacher earning amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {details.excluded.map((entry) => (
                                            <tr key={`${entry.key}_excluded`} className="border-b last:border-b-0">
                                              <td className="p-2">{entry.dateLabel}</td>
                                              <td className="p-2">{entry.studentLabel}</td>
                                              <td className="p-2">{entry.courseLabel}</td>
                                              <td className="p-2">{entry.parentLabel}</td>
                                              <td className="p-2">{entry.statusLabel}</td>
                                              <td className="p-2">{formatMoney(entry.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      Excluded from payout totals unless already included by existing earning status rules.
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record Payout or Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={payoutTeacherId} onValueChange={setPayoutTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.displayName || t.name || t.email || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Month</label>
              <Input
                type="month"
                value={payoutMonth}
                onChange={(e) => setPayoutMonth(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                step="1"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount (negative allowed)"
              />
              <div className="text-xs text-muted-foreground">
                Use a negative amount for adjustments or refunds.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                placeholder="e.g., bank reference or adjustment note"
              />
            </div>

            {payoutError && (
              <div className="text-xs text-red-600">{payoutError}</div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayout} disabled={!!payoutSaving}>
              {payoutSaving ? 'Saving…' : 'Record payout / adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
