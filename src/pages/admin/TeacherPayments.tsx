import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebaseConfig';
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
  role?: string;
  roles?: string[];
};

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

export default function TeacherPayments(): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    monthKeyFromDate(new Date())
  );
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [rollups, setRollups] = useState<Record<string, any>>({});
  const [loadingRollups, setLoadingRollups] = useState(false);
  const [payoutSaving, setPayoutSaving] = useState<string | null>(null);
  const [correctionSaving, setCorrectionSaving] = useState<string | null>(null);
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [kidMap, setKidMap] = useState<Record<string, string>>({});
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [enrollmentMap, setEnrollmentMap] = useState<
    Record<string, { kidId?: string; courseId?: string; studentName?: string }>
  >({});
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutTeacherId, setPayoutTeacherId] = useState('');
  const [payoutMonth, setPayoutMonth] = useState<string>(monthKeyFromDate(new Date()));
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const teacherIds = new Set<string>();
        const kidIds = new Set<string>();
        const courseIds = new Set<string>();
        const enrollmentIds = new Set<string>();

        payouts.forEach((p) => {
          const tid = String(p.teacherId || '');
          if (tid) teacherIds.add(tid);
        });

        earnings.forEach((e) => {
          const tid = String(e.teacherId || '');
          if (tid) teacherIds.add(tid);
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
                ).trim() || undefined;

              nextEnrollmentMap[docSnap.id] = {
                kidId: resolvedKidId,
                courseId: resolvedCourseId,
                studentName,
              };

              if (resolvedKidId) kidIds.add(resolvedKidId);
              if (resolvedCourseId) courseIds.add(resolvedCourseId);
            });
          }
        }

        setEnrollmentMap(nextEnrollmentMap);

        if (teacherIds.size === 0) {
          setTeachers([]);
        } else {
          const teacherDocs: TeacherUser[] = [];
          for (const chunk of chunkIds(Array.from(teacherIds))) {
            const snap = await getDocs(
              query(collection(db, 'users'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) =>
              teacherDocs.push({ id: docSnap.id, ...(docSnap.data() as any) })
            );
          }
          setTeachers(teacherDocs.filter(isTeacherUser));
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
              nextKidMap[docSnap.id] = name || docSnap.id;
              if (data?.studentId) nextKidMap[data.studentId] = name || docSnap.id;
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
              nextKidMap[docSnap.id] = name || nextKidMap[docSnap.id] || docSnap.id;
              if (data?.kidId) nextKidMap[data.kidId] = name || data.kidId;
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
      } catch (err) {
        console.warn('[TeacherPayments] Failed to load referenced data', err);
      }
    };
    void loadRefs();
  }, [payouts, earnings]);

  useEffect(() => {
    if (!selectedMonth) {
      setPayouts([]);
      return;
    }
    const q = query(
      collection(db, 'teacherPayouts'),
      where('monthKey', '==', selectedMonth)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPayouts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) {
      setEarnings([]);
      return;
    }
    const q = query(
      collection(db, 'teacherEarnings'),
      where('monthKey', '==', selectedMonth)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEarnings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    const loadRollups = async () => {
      if (!selectedMonth || teachers.length === 0) {
        setRollups({});
        return;
      }
      setLoadingRollups(true);
      try {
        const snaps = await Promise.all(
          teachers.map((t) =>
            getDoc(doc(db, 'teachers', t.id, 'earnings', selectedMonth))
          )
        );
        const map: Record<string, any> = {};
        teachers.forEach((t, idx) => {
          map[t.id] = snaps[idx].exists() ? snaps[idx].data() : null;
        });
        if (!cancelled) setRollups(map);
      } finally {
        if (!cancelled) setLoadingRollups(false);
      }
    };
    void loadRollups();
    return () => {
      cancelled = true;
    };
  }, [teachers, selectedMonth]);

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

  const breakdownByTeacher = useMemo(() => {
    const byTeacher = new Map<
      string,
      Map<
        string,
        {
          enrollmentId: string;
          kidId: string;
          courseId: string;
          studentName: string;
          sessions: number;
          earned: number;
          paid: number;
        }
      >
    >();

    earnings.forEach((earning) => {
      const teacherId = String(earning.teacherId || '');
      if (!teacherId) return;
      const status = normalizeStatus(earning.status);
      if (status === 'void') return;
      const enrollmentId = String(earning.enrollmentId || '');
      const kidId = String(earning.kidId || earning.studentId || earning.kidIds?.[0] || '');
      const courseId = String(earning.courseId || '');
      const studentName = String(
        earning.studentName || earning.kidName || earning.childName || ''
      ).trim();
      const key = enrollmentId || kidId || studentName || earning.id;
      const amountRaw = Number(earning.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const paidAmount = resolvePaidAmount(earning, amount);

      if (!byTeacher.has(teacherId)) byTeacher.set(teacherId, new Map());
      const bucket = byTeacher.get(teacherId)!;
      if (!bucket.has(key)) {
        bucket.set(key, {
          enrollmentId,
          kidId,
          courseId,
          studentName,
          sessions: 0,
          earned: 0,
          paid: 0,
        });
      }
      const entry = bucket.get(key)!;
      if (!entry.studentName && studentName) {
        entry.studentName = studentName;
      }
      entry.sessions += 1;
      entry.earned += amount;
      entry.paid += paidAmount;
    });

    const result = new Map<string, Array<{
      enrollmentId: string;
      kidId: string;
      courseId: string;
      studentName: string;
      sessions: number;
      earned: number;
      paid: number;
      balance: number;
    }>>();

    byTeacher.forEach((bucket, teacherId) => {
      const entries = Array.from(bucket.values())
        .map((entry) => ({
          ...entry,
          balance: entry.earned - entry.paid,
        }))
        .sort((a, b) => b.balance - a.balance);
      result.set(teacherId, entries);
    });

    return result;
  }, [earnings]);

  const visibleRows = useMemo(() => {
    if (teacherFilter === 'all') return rows;
    return rows.filter((row) => row.teacherId === teacherFilter);
  }, [rows, teacherFilter]);

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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[160px]"
          />
          <label className="text-sm font-medium">Teacher</label>
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teachers</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName || t.name || t.email || t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    {loadingRollups ? 'Loading…' : 'No teachers found.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const isExpanded = expandedTeachers.has(row.teacherId);
                  const breakdown = breakdownByTeacher.get(row.teacherId) || [];
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
                            {breakdown.length === 0 ? (
                              <div className="text-xs text-muted-foreground">
                                No earnings found for this month.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs table-auto">
                                  <thead>
                                    <tr className="text-left border-b">
                                      <th className="p-2">Student</th>
                                      <th className="p-2">Course</th>
                                      <th className="p-2">Sessions</th>
                                      <th className="p-2">Earned</th>
                                      <th className="p-2">Paid</th>
                                      <th className="p-2">Balance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {breakdown.map((entry, idx) => {
                                      const enrollmentRef = entry.enrollmentId
                                        ? enrollmentMap[entry.enrollmentId]
                                        : undefined;
                                      const resolvedKidId =
                                        entry.kidId || enrollmentRef?.kidId || '';
                                      const studentLabel =
                                        kidMap[resolvedKidId] ||
                                        entry.studentName ||
                                        enrollmentRef?.studentName ||
                                        resolvedKidId ||
                                        'Unknown';
                                      const resolvedCourseId =
                                        entry.courseId || enrollmentRef?.courseId || '';
                                      const courseLabel =
                                        courseMap[resolvedCourseId] ||
                                        resolvedCourseId ||
                                        '—';
                                      return (
                                        <tr key={`${entry.enrollmentId || entry.kidId}-${idx}`}>
                                          <td className="p-2">{studentLabel}</td>
                                          <td className="p-2">{courseLabel}</td>
                                          <td className="p-2">{entry.sessions}</td>
                                          <td className="p-2">{formatMoney(entry.earned)}</td>
                                          <td className="p-2">{formatMoney(entry.paid)}</td>
                                          <td className="p-2">{formatMoney(entry.balance)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
