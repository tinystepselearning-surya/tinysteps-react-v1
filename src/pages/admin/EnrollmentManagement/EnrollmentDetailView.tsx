// src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from '../../../lib/firebaseConfig';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import AssignTeacherModal from './AssignTeacherModal';

interface EnrollmentDetailViewProps {
  enrollmentId: string;
  onClose: () => void;
}

export default function EnrollmentDetailView({
  enrollmentId,
  onClose,
}: EnrollmentDetailViewProps) {
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [course, setCourse] = useState<any | null>(null);
  const [teacher, setTeacher] = useState<any | null>(null);
  const [lp, setLp] = useState<any | null>(null);
  const [parent, setParent] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPaidAt, setPaymentPaidAt] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'bank_transfer' | 'online'>('UPI');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [financialsLoading, setFinancialsLoading] = useState(false);

  const { toast } = useToast();

  /* ---------------- helpers ---------------- */

  const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value: any, fallback = '—') => {
    const d = toDateOrNull(value);
    return d ? d.toLocaleDateString() : fallback;
  };

  const formatMoney = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '₹0';
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  const chargePaidAmount = (charge: any) => {
    const amount = Number(charge?.amount ?? 0);
    const paid = Number(charge?.paidAmount ?? 0);
    const status = String(charge?.status ?? '').toLowerCase().trim();
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const safePaid = Number.isFinite(paid) ? paid : 0;
    if (safePaid > 0) return Math.min(safePaid, safeAmount);
    if (status === 'paid' || status === 'settled') return safeAmount;
    return 0;
  };

  const normalizeStatus = (value?: string) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'active';
    if (raw === 'pending_teacher') return 'trial';
    if (raw === 'pending_payment' || raw === 'pending_lp') return 'active';
    if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
    if (raw === 'canceled') return 'cancelled';
    return raw;
  };

  const getStatusBadge = (status?: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'trial':
        return <Badge variant="secondary">🟡 Trial</Badge>;
      case 'active':
        return <Badge variant="default">🟢 Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">⏸️ Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">🔵 Completed</Badge>;
      case 'discontinued':
        return <Badge variant="outline">⚪ Discontinued</Badge>;
      case 'expired':
        return <Badge variant="outline">⚪ Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">🔴 Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getCanonicalBucket = (status?: string) => {
    const normalized = normalizeStatus(status);
    if (
      normalized === 'completed' ||
      normalized === 'discontinued' ||
      normalized === 'expired' ||
      normalized === 'cancelled'
    ) {
      return 'Past';
    }
    if (normalized === 'trial') return 'Trial';
    if (normalized === 'paused') return 'Paused';
    return 'Active';
  };

  /* ---------------- load enrollment ---------------- */

  const loadEnrollment = useCallback(async () => {
    try {
      const eSnap = await getDoc(
        doc(db, 'enrollments', enrollmentId),
      );

      if (!eSnap.exists()) {
        toast({
          title: 'Enrollment not found',
          description:
            'This enrollment may have been deleted.',
          variant: 'destructive',
        });
        onClose();
        return;
      }

      const data = { id: eSnap.id, ...(eSnap.data() as any) };
      setEnrollment(data);

      const studentId =
        data.studentId ||
        data.kidId ||
        data.childId ||
        (Array.isArray(data.kidIds) ? data.kidIds[0] : null);

      const courseId =
        data.courseId || data.course_id || data.course;

      const fetches = [
        studentId
          ? getDoc(doc(db, 'kids', studentId))
          : null,
        courseId
          ? getDoc(doc(db, 'courses', courseId))
          : null,
        data.teacherId
          ? getDoc(doc(db, 'users', data.teacherId))
          : null,
        data.lpId
          ? getDoc(doc(db, 'users', data.lpId))
          : null,
        data.parentId
          ? getDoc(doc(db, 'users', data.parentId))
          : null,
      ];

      const [
        sSnap,
        cSnap,
        tSnap,
        lSnap,
        pSnap,
      ] = await Promise.all(fetches);

      setStudent(sSnap?.exists() ? { id: sSnap.id, ...sSnap.data() } : null);
      setCourse(cSnap?.exists() ? { id: cSnap.id, ...cSnap.data() } : null);
      setTeacher(tSnap?.exists() ? { id: tSnap.id, ...tSnap.data() } : null);
      setLp(lSnap?.exists() ? { id: lSnap.id, ...lSnap.data() } : null);
      setParent(pSnap?.exists() ? { id: pSnap.id, ...pSnap.data() } : null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message || 'Failed to load enrollment',
        variant: 'destructive',
      });
    }
  }, [enrollmentId, onClose, toast]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  const loadFinancials = useCallback(async () => {
    try {
      setFinancialsLoading(true);
      const chargesQuery = query(
        collection(db, 'billingCharges'),
        where('enrollmentId', '==', enrollmentId)
      );
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('enrollmentId', '==', enrollmentId)
      );

      const [chargesSnap, paymentsSnap] = await Promise.all([
        getDocs(chargesQuery),
        getDocs(paymentsQuery),
      ]);

      const nextCharges: Array<Record<string, any>> = chargesSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      const nextPayments: Array<Record<string, any>> = paymentsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const toSortKey = (value: any) => {
        const d = toDateOrNull(value);
        return d ? d.getTime() : 0;
      };

      nextCharges.sort((a, b) => {
        const aKey = toSortKey(a.createdAt || a.updatedAt || a.paidAt);
        const bKey = toSortKey(b.createdAt || b.updatedAt || b.paidAt);
        return bKey - aKey;
      });

      nextPayments.sort((a, b) => {
        const aKey = toSortKey(a.paidAt || a.createdAt);
        const bKey = toSortKey(b.paidAt || b.createdAt);
        return bKey - aKey;
      });

      setCharges(nextCharges);
      setPayments(nextPayments);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load payment allocations',
        variant: 'destructive',
      });
    } finally {
      setFinancialsLoading(false);
    }
  }, [enrollmentId, toast]);

  useEffect(() => {
    void loadFinancials();
  }, [loadFinancials]);

  /* ---------------- notes ---------------- */

  const saveNote = async () => {
    if (!enrollment || !note.trim()) return;

    try {
      const combined = enrollment.notes
        ? `${enrollment.notes}\n\n${note.trim()}`
        : note.trim();

      await updateDoc(
        doc(db, 'enrollments', enrollment.id),
        {
          notes: combined,
          updatedAt: serverTimestamp(),
        },
      );

      setNote('');
      toast({ title: 'Note saved' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err?.message || 'Failed to save note',
        variant: 'destructive',
      });
    }
  };

  if (!enrollment) {
    return <div className="p-4 text-sm">Loading enrollment…</div>;
  }

  const totalCharges = charges.reduce((sum, charge) => {
    const raw = Number(charge?.amount ?? 0);
    const amount = Number.isFinite(raw) ? raw : 0;
    return sum + amount;
  }, 0);
  const totalPaid = charges.reduce((sum, charge) => sum + chargePaidAmount(charge), 0);
  const outstanding = Math.max(totalCharges - totalPaid, 0);
  const totalPayments = payments.reduce((sum, payment) => {
    const raw = Number(payment?.amount ?? 0);
    const amount = Number.isFinite(raw) ? raw : 0;
    return sum + amount;
  }, 0);
  const totalApplied = payments.reduce((sum, payment) => {
    const rawApplied = Number(payment?.appliedAmount ?? NaN);
    const applied = Number.isFinite(rawApplied)
      ? rawApplied
      : (() => {
        const rawAmount = Number(payment?.amount ?? 0);
        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
        const rawUnapplied = Number(payment?.unappliedAmount ?? 0);
        const unapplied = Number.isFinite(rawUnapplied) ? rawUnapplied : 0;
        return amount - unapplied;
      })();
    return sum + applied;
  }, 0);
  const totalUnapplied = payments.reduce((sum, payment) => {
    const raw = Number(payment?.unappliedAmount ?? NaN);
    if (Number.isFinite(raw)) return sum + raw;
    const rawAmount = Number(payment?.amount ?? 0);
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    const rawApplied = Number(payment?.appliedAmount ?? 0);
    const applied = Number.isFinite(rawApplied) ? rawApplied : 0;
    return sum + (amount - applied);
  }, 0);

  const topicProgress =
    typeof enrollment.topicProgress === 'object'
      ? enrollment.topicProgress
      : {};

  /* ---------------- UI ---------------- */

  const kidId =
    enrollment.kidId ||
    enrollment.studentId ||
    enrollment.childId ||
    (Array.isArray(enrollment.kidIds) ? enrollment.kidIds[0] : null);

  const callSetEnrollmentStatus = async (status: string, reason?: string) => {
    try {
      setActionBusy(status);
      const fn = httpsCallable(functions, 'setEnrollmentStatus');
      await fn({ enrollmentId: enrollment.id, status, reason });
      toast({ title: 'Enrollment updated' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update enrollment',
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
    }
  };

  const callArchiveKid = async () => {
    if (!kidId) {
      toast({ title: 'Missing kidId', variant: 'destructive' });
      return;
    }
    try {
      setActionBusy('archive');
      const fn = httpsCallable(functions, 'archiveKid');
      await fn({ kidId });
      toast({ title: 'Kid archived' });
      await loadEnrollment();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to archive kid',
        variant: 'destructive',
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRecordPayment = async () => {
    if (!enrollment) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      toast({
        title: 'Invalid amount',
        description: 'Enter a non-zero payment amount.',
        variant: 'destructive',
      });
      return;
    }
    if (!paymentPaidAt) {
      toast({
        title: 'Missing date',
        description: 'Select the payment date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPaymentSaving(true);
      const fn = httpsCallable(functions, 'recordPayment');
      await fn({
        enrollmentId: enrollment.id,
        amount,
        paidAt: paymentPaidAt,
        method: paymentMethod,
        note: paymentNote || undefined,
      });
      toast({ title: 'Payment recorded' });
      setPaymentAmount('');
      setPaymentNote('');
      await loadFinancials();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Enrollment Details
        </h3>
        <div className="flex items-center gap-3">
          {getStatusBadge(enrollment.status)}
          <Badge variant="outline">Canonical: {getCanonicalBucket(enrollment.status)}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Raw status: {String(enrollment.status || '—')}
      </div>

      {/* Student & Course */}
      <Card>
        <CardHeader>
          <CardTitle>Student & Course</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><strong>Student:</strong> {student?.name || student?.fullName || 'Unknown'}</div>
          <div><strong>Course:</strong> {course?.name || course?.title || 'Unknown'}</div>
          <div><strong>Teacher:</strong> {teacher?.name || 'Unassigned'}</div>
          <div><strong>Learning Partner:</strong> {lp?.name || 'Unassigned'}</div>
          <div><strong>Parent:</strong> {parent?.name || parent?.email || 'Unknown'}</div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(topicProgress).length === 0 ? (
            <div className="text-sm text-gray-500">
              No progress recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(topicProgress).map(
                ([topicId, t]: any) => (
                  <div
                    key={topicId}
                    className="border rounded p-2 text-sm"
                  >
                    <div><strong>{t?.name || topicId}</strong></div>
                    <div>Status: {t?.status || 'unknown'}</div>
                    <div>Mastery: {t?.mastery ?? 0}%</div>
                    <div>Updated: {formatDate(t?.lastUpdated)}</div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line text-sm mb-2">
            {enrollment.notes || 'No notes yet.'}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
          />
          <Button className="mt-2" onClick={saveNote}>
            Save Note
          </Button>
        </CardContent>
      </Card>

      {/* Payment allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Total charges</div>
              <div className="text-lg font-semibold">{formatMoney(totalCharges)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Paid / applied</div>
              <div className="text-lg font-semibold">{formatMoney(totalPaid)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="text-lg font-semibold">{formatMoney(outstanding)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Unapplied payments</div>
              <div className="text-lg font-semibold">{formatMoney(totalUnapplied)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Charges</div>
                <div className="text-xs text-muted-foreground">
                  {financialsLoading ? 'Loading…' : `${charges.length} items`}
                </div>
              </div>
              <div className="border rounded">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs uppercase text-muted-foreground border-b">
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Paid</div>
                  <div>Status</div>
                  <div>Session</div>
                </div>
                {charges.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">No charges yet.</div>
                ) : (
                  charges.map((charge) => (
                    <div
                      key={charge.id}
                      className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-b-0"
                    >
                      <div>{formatDate(charge.createdAt || charge.updatedAt || charge.paidAt)}</div>
                      <div>{formatMoney(charge.amount)}</div>
                      <div>{formatMoney(chargePaidAmount(charge))}</div>
                      <div className="capitalize">{String(charge.status || 'open')}</div>
                      <div className="truncate" title={String(charge.sessionId || charge.id)}>
                        {String(charge.sessionId || charge.id)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Payments</div>
                <div className="text-xs text-muted-foreground">
                  {financialsLoading ? 'Loading…' : `${payments.length} items`}
                </div>
              </div>
              <div className="border rounded">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs uppercase text-muted-foreground border-b">
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Applied</div>
                  <div>Unapplied</div>
                  <div>Method</div>
                </div>
                {payments.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">No payments yet.</div>
                ) : (
                  payments.map((payment) => {
                    const rawApplied = Number(payment?.appliedAmount ?? NaN);
                    const applied = Number.isFinite(rawApplied)
                      ? rawApplied
                      : (() => {
                        const rawAmount = Number(payment?.amount ?? 0);
                        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
                        const rawUnapplied = Number(payment?.unappliedAmount ?? 0);
                        const unapplied = Number.isFinite(rawUnapplied) ? rawUnapplied : 0;
                        return amount - unapplied;
                      })();
                    const rawUnapplied = Number(payment?.unappliedAmount ?? NaN);
                    const unapplied = Number.isFinite(rawUnapplied)
                      ? rawUnapplied
                      : (() => {
                        const rawAmount = Number(payment?.amount ?? 0);
                        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
                        return amount - applied;
                      })();
                    return (
                      <div
                        key={payment.id}
                        className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-b-0"
                      >
                        <div>{formatDate(payment.paidAt || payment.createdAt)}</div>
                        <div>{formatMoney(payment.amount)}</div>
                        <div>{formatMoney(applied)}</div>
                        <div>{formatMoney(unapplied)}</div>
                        <div className="capitalize">{String(payment.method || '—')}</div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Total payments: {formatMoney(totalPayments)} · Applied: {formatMoney(totalApplied)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record payment */}
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="e.g., 1000"
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
            <div className="space-y-1">
              <label className="text-sm font-medium">Method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'UPI' | 'bank_transfer' | 'online')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g., adjustment or reference"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleRecordPayment} disabled={paymentSaving}>
              {paymentSaving ? 'Saving…' : 'Save Payment'}
            </Button>
            <span className="text-xs text-muted-foreground">
              Edits/deletes are not supported. Use a negative payment for adjustments.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle actions */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => callSetEnrollmentStatus('active')}
            disabled={actionBusy !== null}
          >
            Mark Active
          </Button>
          <Button
            variant="outline"
            onClick={() => callSetEnrollmentStatus('paused')}
            disabled={actionBusy !== null}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            onClick={() => callSetEnrollmentStatus('active')}
            disabled={actionBusy !== null}
          >
            Resume
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!window.confirm('Mark this enrollment as completed?')) return;
              callSetEnrollmentStatus('completed');
            }}
            disabled={actionBusy !== null}
          >
            Complete
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!window.confirm('Discontinue this enrollment?')) return;
              callSetEnrollmentStatus('discontinued');
            }}
            disabled={actionBusy !== null}
          >
            Discontinue
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAssignTeacher(true)}
            disabled={actionBusy !== null}
          >
            Reassign Teacher
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!window.confirm('Archive this kid? This cannot be undone.')) return;
              callArchiveKid();
            }}
            disabled={actionBusy !== null || !kidId}
          >
            Archive Kid
          </Button>
        </CardContent>
      </Card>

      {showAssignTeacher ? (
        <AssignTeacherModal
          enrollment={enrollment}
          onClose={() => {
            setShowAssignTeacher(false);
            void loadEnrollment();
          }}
        />
      ) : null}
    </div>
  );
}
