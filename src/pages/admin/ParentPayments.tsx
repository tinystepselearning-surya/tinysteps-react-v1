import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, documentId, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebaseConfig';
import { normalizeFinanceStatus } from '../../lib/statuses';
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

type ParentUser = {
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

const resolveParentNameCandidate = (row: any): string => {
  const candidates = [
    row?.parentName,
    row?.parentDisplayName,
    row?.parentFullName,
    row?.parent_label,
    row?.parentEmail,
  ];
  for (const candidate of candidates) {
    const text = String(candidate || '').trim();
    if (text) return text;
  }
  return '';
};

const fallbackParentLabel = (parentId: string): string => {
  const normalized = String(parentId || '').trim();
  if (!normalized) return 'Unknown parent';
  const shortId =
    normalized.length > 12 ? `${normalized.slice(0, 8)}…${normalized.slice(-4)}` : normalized;
  return `Archived parent (${shortId})`;
};

const toMillis = (value: any) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (Number.isFinite(value?.seconds)) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const chunkIds = (ids: string[], size = 10) => {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
};

const createPaymentRequestKey = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `payment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeAttendanceStatus = (entry: any): string => {
  if (!entry) return '';
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (typeof entry === 'object' && typeof entry.status === 'string') {
    return entry.status.trim().toLowerCase();
  }
  return '';
};

const isSessionCurrentlyBillable = (session: any): boolean => {
  const status = String(session?.status || '').trim().toLowerCase();
  if (status !== 'completed') return false;
  const attendance = session?.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;
  return Object.values(attendance).some((entry) => {
    const normalized = normalizeAttendanceStatus(entry);
    return normalized === 'present' || normalized === 'late';
  });
};

export default function ParentPayments(): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    monthKeyFromDate(new Date())
  );
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [kidMap, setKidMap] = useState<Record<string, string>>({});
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentParentId, setPaymentParentId] = useState<string | null>(null);
  const [paymentParentName, setPaymentParentName] = useState<string>('');
  const [parentEnrollments, setParentEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPaidAt, setPaymentPaidAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'bank_transfer' | 'online'>('UPI');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentRequestKey, setPaymentRequestKey] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [correctionSavingId, setCorrectionSavingId] = useState<string | null>(null);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const parentIds = new Set<string>();
        const kidIds = new Set<string>();
        const courseIds = new Set<string>();

        charges.forEach((charge) => {
          const parentId = String(charge.parentId || '');
          if (parentId) parentIds.add(parentId);
          const kidId = String(charge.kidId || '');
          if (kidId) kidIds.add(kidId);
          const courseId = String(charge.courseId || '');
          if (courseId) courseIds.add(courseId);
        });

        payments.forEach((payment) => {
          const parentId = String(payment.parentId || '');
          if (parentId) parentIds.add(parentId);
          const kidId = String(payment.kidId || '');
          if (kidId) kidIds.add(kidId);
          const courseId = String(payment.courseId || '');
          if (courseId) courseIds.add(courseId);
        });

        if (parentIds.size === 0) {
          setParents([]);
        } else {
          const parentDocs: ParentUser[] = [];
          for (const chunk of chunkIds(Array.from(parentIds))) {
            const snap = await getDocs(
              query(collection(db, 'users'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) =>
              parentDocs.push({ id: docSnap.id, ...(docSnap.data() as any) })
            );
          }
          setParents(parentDocs);
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
        console.warn('[ParentPayments] Failed to load referenced data', err);
      }
    };
    void loadRefs();
  }, [charges, payments]);

  useEffect(() => {
    if (!selectedMonth) {
      setCharges([]);
      return;
    }
    const q = query(
      collection(db, 'billingCharges'),
      where('monthKey', '==', selectedMonth)
    );
    const unsub = onSnapshot(q, (snap) => {
      setCharges(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) {
      setPayments([]);
      return;
    }
    const q = query(collection(db, 'payments'), where('monthKey', '==', selectedMonth));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [selectedMonth]);

  const rows = useMemo(() => {
    const parentMap = new Map<
      string,
      {
        parentId: string;
        due: number;
        paid: number;
        applied: number;
        unapplied: number;
        lastPaymentAt: number | null;
        chargesCount: number;
        paymentsCount: number;
      }
    >();

    const getEntry = (parentId: string) => {
      let entry = parentMap.get(parentId);
      if (!entry) {
        entry = {
          parentId,
          due: 0,
          paid: 0,
          applied: 0,
          unapplied: 0,
          lastPaymentAt: null,
          chargesCount: 0,
          paymentsCount: 0,
        };
        parentMap.set(parentId, entry);
      }
      return entry;
    };

    charges.forEach((charge) => {
      const parentId = String(charge.parentId || '');
      if (!parentId) return;
      const status = normalizeFinanceStatus(charge.status);
      if (status === 'void') return;
      const amountRaw = Number(charge.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      if (amount <= 0) return;
      const paidRaw = Number(charge.paidAmount ?? NaN);
      const paidAmount = Number.isFinite(paidRaw) ? paidRaw : status === 'paid' ? amount : 0;
      const due = Math.max(amount - paidAmount, 0);
      const entry = getEntry(parentId);
      entry.due += due;
      entry.chargesCount += 1;
    });

    payments.forEach((payment) => {
      const parentId = String(payment.parentId || '');
      if (!parentId) return;
      const amountRaw = Number(payment.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const appliedRaw = Number(payment.appliedAmount ?? NaN);
      const unappliedRaw = Number(payment.unappliedAmount ?? NaN);
      const applied = Number.isFinite(appliedRaw)
        ? appliedRaw
        : Number.isFinite(unappliedRaw)
          ? amount - unappliedRaw
          : amount;
      const unapplied = Number.isFinite(unappliedRaw)
        ? unappliedRaw
        : Number.isFinite(appliedRaw)
          ? amount - appliedRaw
          : 0;
      const paidAt = toMillis(payment.paidAt || payment.createdAt);

      const entry = getEntry(parentId);
      entry.paid += amount;
      entry.applied += applied;
      entry.unapplied += unapplied;
      entry.paymentsCount += 1;
      if (paidAt && (!entry.lastPaymentAt || paidAt > entry.lastPaymentAt)) {
        entry.lastPaymentAt = paidAt;
      }
    });

    const parentNameById = new Map(
      parents.map((p) => [p.id, p.displayName || p.name || p.email || ''])
    );
    const parentNameFromFinance = new Map<string, string>();
    const captureParentName = (row: any) => {
      const parentId = String(row?.parentId || '').trim();
      if (!parentId || parentNameFromFinance.has(parentId)) return;
      const candidate = resolveParentNameCandidate(row);
      if (candidate) parentNameFromFinance.set(parentId, candidate);
    };
    charges.forEach(captureParentName);
    payments.forEach(captureParentName);

    return Array.from(parentMap.values())
      .map((entry) => ({
        ...entry,
        parentName:
          parentNameById.get(entry.parentId) ||
          parentNameFromFinance.get(entry.parentId) ||
          fallbackParentLabel(entry.parentId),
      }))
      .sort((a, b) => b.due - a.due);
  }, [charges, payments, parents]);

  const breakdownByParent = useMemo(() => {
    const byParent = new Map<
      string,
      Map<
        string,
        {
          enrollmentId: string;
          kidId: string;
          courseId: string;
          sessions: number;
          due: number;
          paid: number;
          applied: number;
          unapplied: number;
        }
      >
    >();

    charges.forEach((charge) => {
      const parentId = String(charge.parentId || '');
      if (!parentId) return;
      const status = normalizeFinanceStatus(charge.status);
      if (status === 'void') return;
      const amountRaw = Number(charge.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      if (amount <= 0) return;
      const paidRaw = Number(charge.paidAmount ?? NaN);
      const paidAmount = Number.isFinite(paidRaw) ? paidRaw : status === 'paid' ? amount : 0;
      const due = Math.max(amount - paidAmount, 0);

      const enrollmentId = String(charge.enrollmentId || '');
      const kidId = String(charge.kidId || '');
      const courseId = String(charge.courseId || '');
      const key = enrollmentId || `${kidId}:${courseId}`;

      if (!byParent.has(parentId)) byParent.set(parentId, new Map());
      const bucket = byParent.get(parentId)!;
      if (!bucket.has(key)) {
        bucket.set(key, {
          enrollmentId,
          kidId,
          courseId,
          sessions: 0,
          due: 0,
          paid: 0,
          applied: 0,
          unapplied: 0,
        });
      }
      const entry = bucket.get(key)!;
      entry.sessions += 1;
      entry.due += due;
    });

    payments.forEach((payment) => {
      const parentId = String(payment.parentId || '');
      if (!parentId) return;
      const enrollmentId = String(payment.enrollmentId || '');
      if (!enrollmentId) return;
      const amountRaw = Number(payment.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const appliedRaw = Number(payment.appliedAmount ?? NaN);
      const unappliedRaw = Number(payment.unappliedAmount ?? NaN);
      const applied = Number.isFinite(appliedRaw)
        ? appliedRaw
        : Number.isFinite(unappliedRaw)
          ? amount - unappliedRaw
          : amount;
      const unapplied = Number.isFinite(unappliedRaw)
        ? unappliedRaw
        : Number.isFinite(appliedRaw)
          ? amount - appliedRaw
          : 0;

      const key = enrollmentId;
      if (!byParent.has(parentId)) byParent.set(parentId, new Map());
      const bucket = byParent.get(parentId)!;
      if (!bucket.has(key)) {
        bucket.set(key, {
          enrollmentId,
          kidId: String(payment.kidId || ''),
          courseId: String(payment.courseId || ''),
          sessions: 0,
          due: 0,
          paid: 0,
          applied: 0,
          unapplied: 0,
        });
      }
      const entry = bucket.get(key)!;
      entry.paid += amount;
      entry.applied += applied;
      entry.unapplied += unapplied;
    });

    const result = new Map<
      string,
      Array<{
        enrollmentId: string;
        kidId: string;
        courseId: string;
        sessions: number;
        due: number;
        paid: number;
        applied: number;
        unapplied: number;
      }>
    >();

    byParent.forEach((bucket, parentId) => {
      const entries = Array.from(bucket.values()).sort((a, b) => b.due - a.due);
      result.set(parentId, entries);
    });

    return result;
  }, [charges, payments]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.due += row.due;
        acc.paid += row.paid;
        acc.applied += row.applied;
        acc.unapplied += row.unapplied;
        return acc;
      },
      { due: 0, paid: 0, applied: 0, unapplied: 0 }
    );
  }, [rows]);

  const loadEnrollmentsForParent = async (parentId: string) => {
    setLoadingEnrollments(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'enrollments'), where('parentId', '==', parentId))
      );
      setParentEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (err) {
      console.error('[ParentPayments] Failed to load enrollments', err);
      setParentEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const openPaymentModal = (row: { parentId: string; parentName: string }) => {
    setPaymentParentId(row.parentId);
    setPaymentParentName(row.parentName);
    setPaymentEnrollmentId('');
    setPaymentAmount('');
    setPaymentPaidAt(new Date().toISOString().slice(0, 10));
    setPaymentMethod('UPI');
    setPaymentNote('');
    setPaymentRequestKey(createPaymentRequestKey());
    setParentEnrollments([]);
    setPaymentOpen(true);
    void loadEnrollmentsForParent(row.parentId);
  };

  const handleRecordPayment = async () => {
    if (!paymentParentId) {
      window.alert('Missing parent');
      return;
    }
    if (!paymentEnrollmentId) {
      window.alert('Select an enrollment');
      return;
    }
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      window.alert('Enter a non-zero amount');
      return;
    }
    if (!paymentPaidAt) {
      window.alert('Select the paid date');
      return;
    }

    try {
      setPaymentSaving(true);
      const requestKey = paymentRequestKey || createPaymentRequestKey();
      if (!paymentRequestKey) setPaymentRequestKey(requestKey);
      const fn = httpsCallable(functions, 'recordPayment');
      await fn({
        enrollmentId: paymentEnrollmentId,
        amount,
        paidAt: paymentPaidAt,
        method: paymentMethod,
        note: paymentNote || undefined,
        idempotencyKey: requestKey,
      });
      window.alert('Payment recorded');
      setPaymentRequestKey('');
      setPaymentOpen(false);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const handleRunParentCorrection = async (parentId: string, parentName: string) => {
    const reasonInput = window.prompt(
      `Enter correction reason for ${parentName || parentId} in ${selectedMonth}.`
    );
    const reason = String(reasonInput || '').trim();
    if (!reason) {
      window.alert('Correction reason is required.');
      return;
    }

    const confirm = window.prompt(
      `Type CORRECT to run safe correction (void only non-billable sessions) for ${parentName || parentId}.`
    );
    if (confirm !== 'CORRECT') return;

    const parentCharges = charges.filter(
      (c) =>
        String(c.parentId || '') === parentId &&
        normalizeFinanceStatus(c.status) !== 'void'
    );

    if (parentCharges.length === 0) {
      window.alert('No active charges found for correction.');
      return;
    }

    try {
      setCorrectionSavingId(parentId);
      const adminVoidSessionChargeFn = httpsCallable(functions, 'adminVoidSessionCharge');

      let voidedCharges = 0;
      let skippedBillable = 0;
      let skippedMissingSession = 0;
      const errors: string[] = [];
      const candidateCharges: any[] = [];

      for (const charge of parentCharges) {
        const sessionId = String(charge.sessionId || charge.id || '').trim();
        if (!sessionId) {
          errors.push(`Skipped charge ${charge.id || 'unknown'} (missing session id).`);
          continue;
        }
        try {
          const sessionSnap = await getDoc(doc(db, 'classSessions', sessionId));
          if (!sessionSnap.exists()) {
            skippedMissingSession += 1;
            errors.push(`Skipped session ${sessionId} (session not found).`);
            continue;
          }
          const session = sessionSnap.data() || {};
          if (isSessionCurrentlyBillable(session)) {
            skippedBillable += 1;
            continue;
          }
          candidateCharges.push({ charge, sessionId });
        } catch (err: any) {
          errors.push(
            `Session check failed for ${sessionId}: ${err?.message || 'Unknown error'}`
          );
        }
      }

      for (const { sessionId } of candidateCharges) {
        try {
          await adminVoidSessionChargeFn({
            sessionId,
            reason: `Admin correction (${selectedMonth}) for parent ${parentId}: ${reason}`,
          });
          voidedCharges += 1;
        } catch (err: any) {
          errors.push(
            `Charge void failed for session ${sessionId}: ${err?.message || 'Unknown error'}`
          );
        }
      }

      const summary = [
        `Correction complete for ${parentName || parentId}.`,
        `Voided non-billable sessions: ${voidedCharges}`,
        `Skipped billable sessions: ${skippedBillable}`,
      ];
      if (skippedMissingSession > 0) {
        summary.push(`Skipped missing session docs: ${skippedMissingSession}`);
      }
      summary.push('Note: payment reversals are no longer auto-run from this action.');
      if (errors.length > 0) {
        summary.push(`Failures: ${errors.length}`);
        summary.push(errors.slice(0, 4).join('\n'));
      }
      window.alert(summary.join('\n'));
    } catch (err: any) {
      window.alert(err?.message || 'Failed to run parent correction');
    } finally {
      setCorrectionSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Parent Payments</h2>
          <p className="text-sm text-muted-foreground">
            Monthly dues and payments by parent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Outstanding (charges)</div>
          <div className="text-lg font-semibold">{formatMoney(totals.due)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Payments (month)</div>
          <div className="text-lg font-semibold">{formatMoney(totals.paid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Applied</div>
          <div className="text-lg font-semibold">{formatMoney(totals.applied)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Unapplied</div>
          <div className="text-lg font-semibold">{formatMoney(totals.unapplied)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Parent</th>
                <th className="p-2">Charges</th>
                <th className="p-2">Outstanding</th>
                <th className="p-2">Paid</th>
                <th className="p-2">Applied</th>
                <th className="p-2">Unapplied</th>
                <th className="p-2">Last payment</th>
                <th className="p-2">Action</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={9}>
                    No parent payments found for this month.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isExpanded = expandedParents.has(row.parentId);
                  const breakdown = breakdownByParent.get(row.parentId) || [];
                  return (
                    <React.Fragment key={row.parentId}>
                      <tr className="border-b last:border-b-0">
                        <td className="p-2">{row.parentName}</td>
                        <td className="p-2">{row.chargesCount}</td>
                        <td className="p-2">{formatMoney(row.due)}</td>
                        <td className="p-2">{formatMoney(row.paid)}</td>
                        <td className="p-2">{formatMoney(row.applied)}</td>
                        <td className="p-2">{formatMoney(row.unapplied)}</td>
                        <td className="p-2">
                          {row.lastPaymentAt ? new Date(row.lastPaymentAt).toISOString().slice(0, 10) : '—'}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openPaymentModal(row)}>
                              Record payment
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={correctionSavingId === row.parentId}
                              onClick={() => handleRunParentCorrection(row.parentId, row.parentName)}
                            >
                              {correctionSavingId === row.parentId ? 'Correcting…' : 'Run correction'}
                            </Button>
                          </div>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleParent(row.parentId)}
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
                                No enrollment-level data found for this month.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs table-auto">
                                  <thead>
                                    <tr className="text-left border-b">
                                      <th className="p-2">Student</th>
                                      <th className="p-2">Course</th>
                                      <th className="p-2">Sessions</th>
                                      <th className="p-2">Due</th>
                                      <th className="p-2">Paid</th>
                                      <th className="p-2">Applied</th>
                                      <th className="p-2">Unapplied</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {breakdown.map((entry, idx) => {
                                      const studentLabel =
                                        kidMap[entry.kidId] || entry.kidId || 'Unknown';
                                      const courseLabel =
                                        courseMap[entry.courseId] || entry.courseId || '—';
                                      return (
                                        <tr key={`${entry.enrollmentId || entry.kidId}-${idx}`}>
                                          <td className="p-2">{studentLabel}</td>
                                          <td className="p-2">{courseLabel}</td>
                                          <td className="p-2">{entry.sessions}</td>
                                          <td className="p-2">{formatMoney(entry.due)}</td>
                                          <td className="p-2">{formatMoney(entry.paid)}</td>
                                          <td className="p-2">{formatMoney(entry.applied)}</td>
                                          <td className="p-2">{formatMoney(entry.unapplied)}</td>
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

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent: <span className="font-medium">{paymentParentName || 'Unknown'}</span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Enrollment</label>
              <Select
                value={paymentEnrollmentId}
                onValueChange={(value) => setPaymentEnrollmentId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingEnrollments ? 'Loading…' : 'Select enrollment'} />
                </SelectTrigger>
                <SelectContent>
                  {parentEnrollments.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {loadingEnrollments ? 'Loading…' : 'No enrollments found'}
                    </SelectItem>
                  ) : (
                    parentEnrollments.map((enrollment) => {
                      const kidId =
                        enrollment.kidId ||
                        enrollment.studentId ||
                        (Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : '') ||
                        'Unknown kid';
                      const courseId = enrollment.courseId || 'Unknown course';
                      const status = enrollment.status || 'unknown';
                      return (
                        <SelectItem key={enrollment.id} value={enrollment.id}>
                          {kidId} · {courseId} · {status}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Payments apply to charges for the selected enrollment.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Paid at</label>
                <Input
                  type="date"
                  value={paymentPaidAt}
                  onChange={(e) => setPaymentPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as 'UPI' | 'bank_transfer' | 'online')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g., reference or adjustment note"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={paymentSaving || loadingEnrollments}>
              {paymentSaving ? 'Saving…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
