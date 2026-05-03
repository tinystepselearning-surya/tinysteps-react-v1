import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
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

type WalletSummary = {
  currentBalance?: number;
  openingDeficit?: number;
  totalTopups?: number;
  totalDeductions?: number;
  totalAdjustments?: number;
  status?: string;
  currency?: string;
  lastUpdatedAt?: any;
};

type WalletTransaction = {
  id: string;
  type?: string;
  direction?: string;
  amount?: number;
  signedAmount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  method?: string;
  paidAt?: any;
  note?: string;
  reference?: string;
  reason?: string;
  createdAt?: any;
  createdBy?: string;
  idempotencyKey?: string;
  sourceSystem?: string;
};

type WalletAdjustmentDirection = 'credit' | 'debit';

type OpeningDeficitMigrationResult = {
  ok?: boolean;
  dryRun?: boolean;
  parentId?: string;
  outstandingAmount?: number;
  chargesScanned?: number;
  chargesIncluded?: number;
  chargesExcluded?: number;
  transactionCreated?: boolean;
  idempotentReplay?: boolean;
  balanceAfter?: number;
  idempotencyKey?: string;
  warnings?: string[];
};

type OpeningDeficitPreviewInput = {
  cutoverMonthKey: string;
  cutoverDate: string;
  note: string;
};

type WalletReconcileSeverity = 'info' | 'warning' | 'critical';

type WalletReconcileAnomaly = {
  code?: string;
  message?: string;
  transactionId?: string;
  severity?: WalletReconcileSeverity | string;
};

type WalletReconcileResult = {
  ok?: boolean;
  parentId?: string;
  walletExists?: boolean;
  transactionCount?: number;
  summary?: {
    currentBalance?: number;
    openingDeficit?: number;
    totalTopups?: number;
    totalDeductions?: number;
    totalAdjustments?: number;
  };
  computed?: {
    ledgerBalance?: number;
    openingDeficit?: number;
    totalTopups?: number;
    totalDeductions?: number;
    totalAdjustments?: number;
    creditCount?: number;
    debitCount?: number;
  };
  drift?: {
    currentBalance?: number;
    openingDeficit?: number;
    totalTopups?: number;
    totalDeductions?: number;
    totalAdjustments?: number;
    hasDrift?: boolean;
  };
  anomalies?: WalletReconcileAnomaly[];
  warnings?: string[];
  fixSummary?: boolean;
  summaryFixed?: boolean;
  fixedFields?: string[];
};

type WalletAutomationConfigSnapshot = {
  walletClassDeductionsEnabled?: boolean;
  walletCutoverMonthKey?: string | null;
  walletCutoverDate?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  lastEnabledAt?: string | null;
  lastDisabledAt?: string | null;
};

type WalletAutomationConfigResult = {
  ok?: boolean;
  exists?: boolean;
  config?: WalletAutomationConfigSnapshot;
  changed?: {
    enabledChanged?: boolean;
    cutoverChanged?: boolean;
  };
};

type ReceiveParentPaymentAllocationMode = 'legacy_then_wallet' | 'wallet_only';

type ReceiveParentPaymentResult = {
  ok?: boolean;
  dryRun?: boolean;
  parentId?: string;
  paymentId?: string;
  idempotentReplay?: boolean;
  amountReceived?: number;
  allocationModeUsed?: ReceiveParentPaymentAllocationMode | string;
  legacyOutstandingBefore?: number;
  appliedToLegacy?: number;
  walletTopupAmount?: number;
  remainingUnapplied?: number;
  chargesScanned?: number;
  chargesIncluded?: number;
  allocationsPreview?: any[];
  allocations?: any[];
  walletTransactionId?: string | null;
  walletBalanceAfter?: number;
  migratedByOpeningDeficit?: boolean;
  warnings?: string[];
};

type ReceiveParentPaymentPreviewInput = {
  parentId: string;
  amount: number;
  paidAt: string;
  method: string;
  reference: string;
  note: string;
  allocationMode: ReceiveParentPaymentAllocationMode;
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

const createWalletTopupRequestKey = (parentId: string) => {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const raw = `admin_topup_${parentId}_${Date.now()}_${randomSuffix}`;
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
};

const createWalletAdjustmentRequestKey = (parentId: string) => {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const raw = `admin_adjust_${parentId}_${Date.now()}_${randomSuffix}`;
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
};

const createReceiveParentPaymentRequestKey = (parentId: string) => {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const raw = `receive_parent_payment_${parentId}_${Date.now()}_${randomSuffix}`;
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 140);
};

const isMonthKeyLike = (value: string) => /^\d{4}-\d{2}$/.test(value.trim());
const isAllocationMode = (value: string): value is ReceiveParentPaymentAllocationMode =>
  value === 'legacy_then_wallet' || value === 'wallet_only';

const receiveParentPaymentModeLabel = (mode: any) => {
  const normalized = String(mode || '').trim().toLowerCase();
  if (normalized === 'wallet_only') return 'Wallet only';
  if (normalized === 'legacy_then_wallet') return 'Legacy dues then wallet';
  return normalized ? normalized.replace(/_/g, ' ') : '—';
};

const formatDateYmd = (value: any) => {
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(0, 10);
};

const toDateInputYmd = (value: any) => {
  const ms = toMillis(value);
  if (!ms) return '';
  return new Date(ms).toISOString().slice(0, 10);
};

const walletTransactionTypeLabel = (value: any) => {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'topup') return 'Top-up';
  if (type === 'manual_adjustment') return 'Manual adjustment';
  if (type === 'opening_deficit') return 'Opening deficit';
  if (type === 'class_deduction') return 'Class deduction';
  if (type === 'refund') return 'Refund';
  return type ? type.replace(/_/g, ' ') : '—';
};

const formatWalletTransactionAmount = (tx: WalletTransaction) => {
  const signed = Number(tx.signedAmount);
  if (Number.isFinite(signed)) {
    const abs = formatMoney(Math.abs(signed));
    return signed >= 0 ? `+${abs}` : `-${abs}`;
  }
  const amount = Number(tx.amount);
  if (!Number.isFinite(amount)) return '₹0';
  const direction = String(tx.direction || '').trim().toLowerCase();
  const abs = formatMoney(Math.abs(amount));
  if (direction === 'credit') return `+${abs}`;
  if (direction === 'debit') return `-${abs}`;
  return formatMoney(amount);
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
  const [selectedWalletParentId, setSelectedWalletParentId] = useState<string>('');
  const [selectedWalletParentName, setSelectedWalletParentName] = useState<string>('');
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletSummaryLoading, setWalletSummaryLoading] = useState(false);
  const [walletTransactionsLoading, setWalletTransactionsLoading] = useState(false);
  const [walletSummaryError, setWalletSummaryError] = useState<string>('');
  const [walletTransactionsError, setWalletTransactionsError] = useState<string>('');
  const [walletTopupOpen, setWalletTopupOpen] = useState(false);
  const [walletTopupAmount, setWalletTopupAmount] = useState('');
  const [walletTopupMethod, setWalletTopupMethod] = useState('');
  const [walletTopupPaidAt, setWalletTopupPaidAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [walletTopupReference, setWalletTopupReference] = useState('');
  const [walletTopupNote, setWalletTopupNote] = useState('');
  const [walletTopupRequestKey, setWalletTopupRequestKey] = useState('');
  const [walletTopupSaving, setWalletTopupSaving] = useState(false);
  const [walletAdjustmentOpen, setWalletAdjustmentOpen] = useState(false);
  const [walletAdjustmentDirection, setWalletAdjustmentDirection] = useState<WalletAdjustmentDirection | ''>('');
  const [walletAdjustmentAmount, setWalletAdjustmentAmount] = useState('');
  const [walletAdjustmentReason, setWalletAdjustmentReason] = useState('');
  const [walletAdjustmentReference, setWalletAdjustmentReference] = useState('');
  const [walletAdjustmentNote, setWalletAdjustmentNote] = useState('');
  const [walletAdjustmentRequestKey, setWalletAdjustmentRequestKey] = useState('');
  const [walletAdjustmentSaving, setWalletAdjustmentSaving] = useState(false);
  const [walletOpeningDeficitOpen, setWalletOpeningDeficitOpen] = useState(false);
  const [walletOpeningDeficitCutoverMonthKey, setWalletOpeningDeficitCutoverMonthKey] = useState('');
  const [walletOpeningDeficitCutoverDate, setWalletOpeningDeficitCutoverDate] = useState('');
  const [walletOpeningDeficitNote, setWalletOpeningDeficitNote] = useState(
    'Opening deficit from historical unpaid dues'
  );
  const [walletOpeningDeficitPreviewSaving, setWalletOpeningDeficitPreviewSaving] = useState(false);
  const [walletOpeningDeficitApplySaving, setWalletOpeningDeficitApplySaving] = useState(false);
  const [walletOpeningDeficitError, setWalletOpeningDeficitError] = useState('');
  const [walletOpeningDeficitResult, setWalletOpeningDeficitResult] =
    useState<OpeningDeficitMigrationResult | null>(null);
  const [walletOpeningDeficitPreviewInput, setWalletOpeningDeficitPreviewInput] =
    useState<OpeningDeficitPreviewInput | null>(null);
  const [walletReconcileOpen, setWalletReconcileOpen] = useState(false);
  const [walletReconcileReportSaving, setWalletReconcileReportSaving] = useState(false);
  const [walletReconcileFixSaving, setWalletReconcileFixSaving] = useState(false);
  const [walletReconcileError, setWalletReconcileError] = useState('');
  const [walletReconcileResult, setWalletReconcileResult] =
    useState<WalletReconcileResult | null>(null);
  const [walletAutomationOpen, setWalletAutomationOpen] = useState(false);
  const [walletAutomationLoading, setWalletAutomationLoading] = useState(false);
  const [walletAutomationSaving, setWalletAutomationSaving] = useState(false);
  const [walletAutomationError, setWalletAutomationError] = useState('');
  const [walletAutomationExists, setWalletAutomationExists] = useState(false);
  const [walletAutomationConfig, setWalletAutomationConfig] =
    useState<WalletAutomationConfigSnapshot | null>(null);
  const [walletAutomationEnabled, setWalletAutomationEnabled] = useState(false);
  const [walletAutomationCutoverMonthKey, setWalletAutomationCutoverMonthKey] = useState('');
  const [walletAutomationCutoverDate, setWalletAutomationCutoverDate] = useState('');
  const [walletAutomationNote, setWalletAutomationNote] = useState('');
  const [walletAutomationConfirmationText, setWalletAutomationConfirmationText] = useState('');
  const [receivePaymentOpen, setReceivePaymentOpen] = useState(false);
  const [receivePaymentParentId, setReceivePaymentParentId] = useState<string>('');
  const [receivePaymentParentName, setReceivePaymentParentName] = useState<string>('');
  const [receivePaymentAmount, setReceivePaymentAmount] = useState('');
  const [receivePaymentPaidAt, setReceivePaymentPaidAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [receivePaymentMethod, setReceivePaymentMethod] = useState('UPI');
  const [receivePaymentReference, setReceivePaymentReference] = useState('');
  const [receivePaymentNote, setReceivePaymentNote] = useState('');
  const [receivePaymentAllocationMode, setReceivePaymentAllocationMode] =
    useState<ReceiveParentPaymentAllocationMode>('legacy_then_wallet');
  const [receivePaymentRequestKey, setReceivePaymentRequestKey] = useState('');
  const [receivePaymentPreviewSaving, setReceivePaymentPreviewSaving] = useState(false);
  const [receivePaymentApplySaving, setReceivePaymentApplySaving] = useState(false);
  const [receivePaymentError, setReceivePaymentError] = useState('');
  const [receivePaymentResult, setReceivePaymentResult] =
    useState<ReceiveParentPaymentResult | null>(null);
  const [receivePaymentPreviewInput, setReceivePaymentPreviewInput] =
    useState<ReceiveParentPaymentPreviewInput | null>(null);

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

  const walletParentOptions = useMemo(
    () =>
      rows
        .map((row) => ({ parentId: row.parentId, parentName: row.parentName }))
        .sort((a, b) => a.parentName.localeCompare(b.parentName)),
    [rows]
  );

  useEffect(() => {
    if (!selectedWalletParentId) {
      setSelectedWalletParentName('');
      return;
    }
    const selected = walletParentOptions.find((item) => item.parentId === selectedWalletParentId);
    setSelectedWalletParentName(selected?.parentName || fallbackParentLabel(selectedWalletParentId));
  }, [selectedWalletParentId, walletParentOptions]);

  useEffect(() => {
    if (!selectedWalletParentId) {
      setWalletSummary(null);
      setWalletSummaryError('');
      setWalletSummaryLoading(false);
      return;
    }

    setWalletSummaryLoading(true);
    setWalletSummaryError('');
    const walletRef = doc(db, 'parentWallets', selectedWalletParentId);
    const unsub = onSnapshot(
      walletRef,
      (snap) => {
        setWalletSummary(snap.exists() ? (snap.data() as WalletSummary) : null);
        setWalletSummaryLoading(false);
      },
      (err) => {
        console.error('[ParentPayments] Failed to load wallet summary', err);
        setWalletSummary(null);
        setWalletSummaryLoading(false);
        setWalletSummaryError(
          'Unable to load wallet summary. If wallet rules are not deployed yet, deploy Phase 1 backend first.'
        );
      }
    );

    return () => unsub();
  }, [selectedWalletParentId]);

  useEffect(() => {
    if (!selectedWalletParentId) {
      setWalletTransactions([]);
      setWalletTransactionsError('');
      setWalletTransactionsLoading(false);
      return;
    }

    setWalletTransactionsLoading(true);
    setWalletTransactionsError('');
    const transactionsQuery = query(
      collection(db, 'parentWallets', selectedWalletParentId, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(
      transactionsQuery,
      (snap) => {
        setWalletTransactions(
          snap.docs.map((docSnap) => ({
            ...(docSnap.data() as Omit<WalletTransaction, 'id'>),
            id: docSnap.id,
          }))
        );
        setWalletTransactionsLoading(false);
      },
      (err) => {
        console.error('[ParentPayments] Failed to load wallet transactions', err);
        setWalletTransactions([]);
        setWalletTransactionsLoading(false);
        setWalletTransactionsError(
          'Unable to load wallet transactions. If wallet rules are not deployed yet, deploy Phase 1 backend first.'
        );
      }
    );

    return () => unsub();
  }, [selectedWalletParentId]);

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
    setSelectedWalletParentId(row.parentId);
    setSelectedWalletParentName(row.parentName || fallbackParentLabel(row.parentId));
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

  const openWalletTopupModal = () => {
    if (!selectedWalletParentId) {
      window.alert('Select a parent first to add wallet top-up.');
      return;
    }
    setWalletTopupAmount('');
    setWalletTopupMethod('');
    setWalletTopupPaidAt(new Date().toISOString().slice(0, 10));
    setWalletTopupReference('');
    setWalletTopupNote('');
    setWalletTopupRequestKey(createWalletTopupRequestKey(selectedWalletParentId));
    setWalletTopupOpen(true);
  };

  const handleWalletTopup = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }

    const amount = Number(walletTopupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Enter an amount greater than zero');
      return;
    }

    const requestKey =
      walletTopupRequestKey || createWalletTopupRequestKey(selectedWalletParentId);
    if (!walletTopupRequestKey) {
      setWalletTopupRequestKey(requestKey);
    }

    try {
      setWalletTopupSaving(true);
      const fn = httpsCallable(functions, 'adminTopupParentWallet');
      await fn({
        parentId: selectedWalletParentId,
        amount,
        method: walletTopupMethod.trim() || undefined,
        paidAt: walletTopupPaidAt || undefined,
        reference: walletTopupReference.trim() || undefined,
        note: walletTopupNote.trim() || undefined,
        idempotencyKey: requestKey,
      });
      window.alert('Wallet top-up added');
      setWalletTopupRequestKey('');
      setWalletTopupOpen(false);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to add wallet top-up');
    } finally {
      setWalletTopupSaving(false);
    }
  };

  const openWalletAdjustmentModal = () => {
    if (!selectedWalletParentId) {
      window.alert('Select a parent first to add manual adjustment.');
      return;
    }
    setWalletAdjustmentDirection('credit');
    setWalletAdjustmentAmount('');
    setWalletAdjustmentReason('');
    setWalletAdjustmentReference('');
    setWalletAdjustmentNote('');
    setWalletAdjustmentRequestKey(createWalletAdjustmentRequestKey(selectedWalletParentId));
    setWalletAdjustmentOpen(true);
  };

  const handleWalletAdjustment = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }

    if (walletAdjustmentDirection !== 'credit' && walletAdjustmentDirection !== 'debit') {
      window.alert('Select direction');
      return;
    }

    const amount = Number(walletAdjustmentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Enter an amount greater than zero');
      return;
    }

    const reason = walletAdjustmentReason.trim();
    if (!reason) {
      window.alert('Reason is required');
      return;
    }

    const requestKey =
      walletAdjustmentRequestKey || createWalletAdjustmentRequestKey(selectedWalletParentId);
    if (!walletAdjustmentRequestKey) {
      setWalletAdjustmentRequestKey(requestKey);
    }

    try {
      setWalletAdjustmentSaving(true);
      const fn = httpsCallable(functions, 'adminAdjustParentWallet');
      await fn({
        parentId: selectedWalletParentId,
        amount,
        direction: walletAdjustmentDirection,
        reason,
        reference: walletAdjustmentReference.trim() || undefined,
        note: walletAdjustmentNote.trim() || undefined,
        idempotencyKey: requestKey,
      });
      window.alert('Wallet adjustment added');
      setWalletAdjustmentDirection('credit');
      setWalletAdjustmentAmount('');
      setWalletAdjustmentReason('');
      setWalletAdjustmentReference('');
      setWalletAdjustmentNote('');
      setWalletAdjustmentRequestKey('');
      setWalletAdjustmentOpen(false);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to add wallet adjustment');
    } finally {
      setWalletAdjustmentSaving(false);
    }
  };

  const openWalletOpeningDeficitModal = () => {
    if (!selectedWalletParentId) {
      window.alert('Select a parent first to preview opening deficit.');
      return;
    }
    setWalletOpeningDeficitCutoverMonthKey('');
    setWalletOpeningDeficitCutoverDate('');
    setWalletOpeningDeficitNote('Opening deficit from historical unpaid dues');
    setWalletOpeningDeficitResult(null);
    setWalletOpeningDeficitPreviewInput(null);
    setWalletOpeningDeficitError('');
    setWalletOpeningDeficitOpen(true);
  };

  const getOpeningDeficitCallableError = (err: any, fallback: string) => {
    const original = String(err?.message || fallback);
    const lower = original.toLowerCase();
    if (
      (lower.includes('function') && lower.includes('not found')) ||
      lower.includes('function not found') ||
      lower.includes('unavailable')
    ) {
      return 'Opening deficit function is not available yet. Please deploy the latest functions and try again.';
    }
    return original;
  };

  const handlePreviewOpeningDeficit = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }

    const cutoverMonthKey = walletOpeningDeficitCutoverMonthKey.trim();
    if (cutoverMonthKey && !isMonthKeyLike(cutoverMonthKey)) {
      window.alert('cutoverMonthKey must be in YYYY-MM format');
      return;
    }

    const cutoverDate = walletOpeningDeficitCutoverDate.trim();
    const note = walletOpeningDeficitNote.trim();
    const previewInput: OpeningDeficitPreviewInput = {
      cutoverMonthKey,
      cutoverDate,
      note,
    };

    try {
      setWalletOpeningDeficitPreviewSaving(true);
      setWalletOpeningDeficitError('');
      setWalletOpeningDeficitResult(null);
      const fn = httpsCallable(functions, 'initParentWalletOpeningDeficit');
      const response = await fn({
        parentId: selectedWalletParentId,
        cutoverMonthKey: cutoverMonthKey || undefined,
        cutoverDate: cutoverDate || undefined,
        dryRun: true,
        note: note || undefined,
      });
      const result = (response.data || {}) as OpeningDeficitMigrationResult;
      setWalletOpeningDeficitPreviewInput(previewInput);
      setWalletOpeningDeficitResult(result);
      if (Number(result.outstandingAmount || 0) <= 0) {
        window.alert('No opening deficit found for this parent.');
      }
    } catch (err: any) {
      const message = getOpeningDeficitCallableError(err, 'Failed to preview opening deficit');
      setWalletOpeningDeficitError(message);
      window.alert(message);
    } finally {
      setWalletOpeningDeficitPreviewSaving(false);
    }
  };

  const handleApplyOpeningDeficit = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }
    if (!walletOpeningDeficitPreviewInput || walletOpeningDeficitResult?.dryRun !== true) {
      window.alert('Preview deficit first.');
      return;
    }

    const outstandingAmount = Number(walletOpeningDeficitResult?.outstandingAmount || 0);
    if (outstandingAmount <= 0) {
      window.alert('No deficit applied because there are no unpaid historical dues.');
      return;
    }

    const confirmed = window.confirm(
      `You are about to create a negative opening wallet balance of ${formatMoney(outstandingAmount)}. This cannot be edited directly later; corrections must be done through wallet adjustments.`
    );
    if (!confirmed) return;

    try {
      setWalletOpeningDeficitApplySaving(true);
      setWalletOpeningDeficitError('');
      const fn = httpsCallable(functions, 'initParentWalletOpeningDeficit');
      const response = await fn({
        parentId: selectedWalletParentId,
        cutoverMonthKey: walletOpeningDeficitPreviewInput.cutoverMonthKey || undefined,
        cutoverDate: walletOpeningDeficitPreviewInput.cutoverDate || undefined,
        dryRun: false,
        note: walletOpeningDeficitPreviewInput.note || undefined,
      });
      const result = (response.data || {}) as OpeningDeficitMigrationResult;
      setWalletOpeningDeficitResult(result);

      if (result.idempotentReplay === true) {
        window.alert('Opening deficit was already applied earlier. No duplicate transaction was created.');
      } else if (result.transactionCreated === true) {
        window.alert('Opening deficit applied successfully.');
      } else if (Number(result.outstandingAmount || 0) <= 0) {
        window.alert('No deficit applied because there are no unpaid historical dues.');
      } else {
        window.alert('Opening deficit request completed.');
      }

      setWalletOpeningDeficitOpen(false);
    } catch (err: any) {
      const message = getOpeningDeficitCallableError(err, 'Failed to apply opening deficit');
      setWalletOpeningDeficitError(message);
      window.alert(message);
    } finally {
      setWalletOpeningDeficitApplySaving(false);
    }
  };

  const openWalletReconcileModal = () => {
    if (!selectedWalletParentId) {
      window.alert('Select a parent first to run wallet reconciliation.');
      return;
    }
    setWalletReconcileError('');
    setWalletReconcileResult(null);
    setWalletReconcileOpen(true);
  };

  const getWalletReconcileCallableError = (err: any, fallback: string) => {
    const original = String(err?.message || fallback);
    const lower = original.toLowerCase();
    if (
      (lower.includes('function') && lower.includes('not found')) ||
      lower.includes('function not found') ||
      lower.includes('unavailable')
    ) {
      return 'Wallet reconciliation function is not available yet. Please deploy the latest functions and try again.';
    }
    return original;
  };

  const handleRunWalletReconciliation = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }
    try {
      setWalletReconcileReportSaving(true);
      setWalletReconcileError('');
      setWalletReconcileResult(null);
      const fn = httpsCallable(functions, 'reconcileParentWallet');
      const response = await fn({
        parentId: selectedWalletParentId,
        fixSummary: false,
      });
      const result = (response.data || {}) as WalletReconcileResult;
      setWalletReconcileResult(result);
      if (result.walletExists === false) {
        window.alert('No wallet exists for this parent yet. Add a top-up or opening deficit first.');
      }
    } catch (err: any) {
      const message = getWalletReconcileCallableError(err, 'Failed to run wallet reconciliation');
      setWalletReconcileError(message);
      window.alert(message);
    } finally {
      setWalletReconcileReportSaving(false);
    }
  };

  const handleFixWalletSummaryDrift = async () => {
    if (!selectedWalletParentId) {
      window.alert('Missing parent');
      return;
    }

    if (!walletReconcileResult?.drift?.hasDrift) {
      window.alert('No drift found to fix.');
      return;
    }

    const hasCriticalAnomalies = (walletReconcileResult.anomalies || []).some(
      (anomaly) => String(anomaly.severity || '').trim().toLowerCase() === 'critical'
    );
    if (hasCriticalAnomalies) {
      window.alert('Cannot fix summary while critical anomalies are present.');
      return;
    }

    if (walletReconcileResult.walletExists === false) {
      window.alert('No wallet exists for this parent yet. Add a top-up or opening deficit first.');
      return;
    }

    const confirmed = window.confirm(
      'This will update only the wallet summary totals from the transaction ledger. It will not edit wallet transactions, historical payments, billing charges, or teacher earnings.'
    );
    if (!confirmed) return;

    try {
      setWalletReconcileFixSaving(true);
      setWalletReconcileError('');
      const fn = httpsCallable(functions, 'reconcileParentWallet');
      const response = await fn({
        parentId: selectedWalletParentId,
        fixSummary: true,
      });
      const result = (response.data || {}) as WalletReconcileResult;
      setWalletReconcileResult(result);
      if (result.summaryFixed === true) {
        const fields = Array.isArray(result.fixedFields) ? result.fixedFields.join(', ') : '';
        window.alert(
          fields
            ? `Wallet summary drift fixed successfully. Updated fields: ${fields}`
            : 'Wallet summary drift fixed successfully.'
        );
      } else {
        window.alert('Fix summary request completed with no summary changes.');
      }
    } catch (err: any) {
      const message = getWalletReconcileCallableError(err, 'Failed to fix wallet summary drift');
      setWalletReconcileError(message);
      window.alert(message);
    } finally {
      setWalletReconcileFixSaving(false);
    }
  };

  const getWalletAutomationCallableError = (err: any, fallback: string) => {
    const original = String(err?.message || fallback);
    const lower = original.toLowerCase();
    if (
      (lower.includes('function') && lower.includes('not found')) ||
      lower.includes('function not found') ||
      lower.includes('unavailable')
    ) {
      return 'Wallet automation config function is not available yet. Please deploy the latest functions and try again.';
    }
    return original;
  };

  const loadWalletAutomationConfig = async () => {
    try {
      setWalletAutomationLoading(true);
      setWalletAutomationError('');
      const fn = httpsCallable(functions, 'getWalletAutomationConfig');
      const response = await fn({});
      const result = (response.data || {}) as WalletAutomationConfigResult;
      const config = (result.config || {}) as WalletAutomationConfigSnapshot;
      setWalletAutomationExists(result.exists === true);
      setWalletAutomationConfig(config);
      setWalletAutomationEnabled(config.walletClassDeductionsEnabled === true);
      setWalletAutomationCutoverMonthKey(String(config.walletCutoverMonthKey || ''));
      setWalletAutomationCutoverDate(toDateInputYmd(config.walletCutoverDate));
      setWalletAutomationConfirmationText('');
    } catch (err: any) {
      const message = getWalletAutomationCallableError(err, 'Failed to load wallet automation settings');
      setWalletAutomationError(message);
      window.alert(message);
    } finally {
      setWalletAutomationLoading(false);
    }
  };

  const openWalletAutomationModal = () => {
    setWalletAutomationOpen(true);
    setWalletAutomationError('');
    setWalletAutomationExists(false);
    setWalletAutomationConfig({
      walletClassDeductionsEnabled: false,
      walletCutoverMonthKey: null,
      walletCutoverDate: null,
      updatedAt: null,
      updatedBy: null,
      lastEnabledAt: null,
      lastDisabledAt: null,
    });
    setWalletAutomationEnabled(false);
    setWalletAutomationCutoverMonthKey('');
    setWalletAutomationCutoverDate('');
    setWalletAutomationNote('');
    setWalletAutomationConfirmationText('');
    void loadWalletAutomationConfig();
  };

  const handleSaveWalletAutomationConfig = async () => {
    const cutoverMonthKey = walletAutomationCutoverMonthKey.trim();
    if (cutoverMonthKey && !isMonthKeyLike(cutoverMonthKey)) {
      window.alert('cutoverMonthKey must be in YYYY-MM format');
      return;
    }

    const cutoverDate = walletAutomationCutoverDate.trim();
    const note = walletAutomationNote.trim();
    const confirmationText = walletAutomationConfirmationText.trim();

    if (walletAutomationEnabled && !cutoverMonthKey && !cutoverDate) {
      window.alert('Cannot enable wallet class deductions without a cutover month or cutover date.');
      return;
    }
    if (walletAutomationEnabled && confirmationText !== 'ENABLE WALLET DEDUCTIONS') {
      window.alert('Confirmation text is required to enable wallet class deductions.');
      return;
    }

    try {
      setWalletAutomationSaving(true);
      setWalletAutomationError('');
      const fn = httpsCallable(functions, 'setWalletAutomationConfig');
      const response = await fn({
        walletClassDeductionsEnabled: walletAutomationEnabled,
        walletCutoverMonthKey: cutoverMonthKey || null,
        walletCutoverDate: cutoverDate || null,
        note: note || undefined,
        confirmationText: confirmationText || undefined,
      });
      const result = (response.data || {}) as WalletAutomationConfigResult;
      if (result.ok === true) {
        window.alert('Wallet automation settings updated.');
      } else {
        window.alert('Wallet automation settings update completed.');
      }
      setWalletAutomationConfirmationText('');
      await loadWalletAutomationConfig();
    } catch (err: any) {
      const message = getWalletAutomationCallableError(err, 'Failed to update wallet automation settings');
      setWalletAutomationError(message);
      window.alert(message);
    } finally {
      setWalletAutomationSaving(false);
    }
  };

  const openReceiveParentPaymentModal = (row: { parentId: string; parentName: string }) => {
    const parentId = String(row.parentId || '').trim();
    if (!parentId) {
      window.alert('Missing parent');
      return;
    }
    const parentName = row.parentName || fallbackParentLabel(parentId);
    setSelectedWalletParentId(parentId);
    setSelectedWalletParentName(parentName);
    setReceivePaymentParentId(parentId);
    setReceivePaymentParentName(parentName);
    setReceivePaymentAmount('');
    setReceivePaymentPaidAt(new Date().toISOString().slice(0, 10));
    setReceivePaymentMethod('UPI');
    setReceivePaymentReference('');
    setReceivePaymentNote('');
    setReceivePaymentAllocationMode('legacy_then_wallet');
    setReceivePaymentRequestKey(createReceiveParentPaymentRequestKey(parentId));
    setReceivePaymentResult(null);
    setReceivePaymentPreviewInput(null);
    setReceivePaymentError('');
    setReceivePaymentOpen(true);
  };

  const getReceiveParentPaymentCallableError = (err: any, fallback: string) => {
    const original = String(err?.message || fallback);
    const lower = original.toLowerCase();
    if (
      (lower.includes('function') && lower.includes('not found')) ||
      lower.includes('function not found') ||
      lower.includes('unavailable')
    ) {
      return 'Receive parent payment function is not available yet. Please deploy the latest functions and try again.';
    }
    if (lower.includes('opening deficit') || (lower.includes('migrated') && lower.includes('wallet'))) {
      return 'This parent already has opening deficit migration. Please use Wallet-only mode so payment is not applied twice to old dues.';
    }
    return original;
  };

  const buildReceivePaymentPreviewInput = (): ReceiveParentPaymentPreviewInput | null => {
    const parentId = String(receivePaymentParentId || '').trim();
    if (!parentId) {
      window.alert('Missing parent');
      return null;
    }

    const amount = Number(receivePaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Enter an amount greater than zero');
      return null;
    }

    const allocationModeRaw = String(receivePaymentAllocationMode || '').trim();
    if (!isAllocationMode(allocationModeRaw)) {
      window.alert('Select a valid allocation mode');
      return null;
    }

    return {
      parentId,
      amount,
      paidAt: receivePaymentPaidAt.trim(),
      method: receivePaymentMethod.trim(),
      reference: receivePaymentReference.trim(),
      note: receivePaymentNote.trim(),
      allocationMode: allocationModeRaw,
    };
  };

  const isSameReceivePaymentPreviewInput = (
    a: ReceiveParentPaymentPreviewInput | null,
    b: ReceiveParentPaymentPreviewInput | null
  ) => {
    if (!a || !b) return false;
    return (
      a.parentId === b.parentId &&
      a.amount === b.amount &&
      a.paidAt === b.paidAt &&
      a.method === b.method &&
      a.reference === b.reference &&
      a.note === b.note &&
      a.allocationMode === b.allocationMode
    );
  };

  const handlePreviewReceiveParentPayment = async () => {
    const previewInput = buildReceivePaymentPreviewInput();
    if (!previewInput) return;

    const requestKey =
      receivePaymentRequestKey || createReceiveParentPaymentRequestKey(previewInput.parentId);
    if (!receivePaymentRequestKey) {
      setReceivePaymentRequestKey(requestKey);
    }

    try {
      setReceivePaymentPreviewSaving(true);
      setReceivePaymentError('');
      setReceivePaymentResult(null);
      const fn = httpsCallable(functions, 'adminReceiveParentPayment');
      const response = await fn({
        parentId: previewInput.parentId,
        amount: previewInput.amount,
        paidAt: previewInput.paidAt || undefined,
        method: previewInput.method || undefined,
        reference: previewInput.reference || undefined,
        note: previewInput.note || undefined,
        allocationMode: previewInput.allocationMode,
        dryRun: true,
        idempotencyKey: requestKey,
      });
      const result = (response.data || {}) as ReceiveParentPaymentResult;
      setReceivePaymentPreviewInput(previewInput);
      setReceivePaymentResult(result);
      if (Number(result.remainingUnapplied || 0) > 0) {
        window.alert(
          `Preview completed. Remaining unapplied amount: ${formatMoney(result.remainingUnapplied)}.`
        );
      }
    } catch (err: any) {
      const message = getReceiveParentPaymentCallableError(err, 'Failed to preview parent payment split');
      setReceivePaymentError(message);
      window.alert(message);
    } finally {
      setReceivePaymentPreviewSaving(false);
    }
  };

  const handleApplyReceiveParentPayment = async () => {
    const currentInput = buildReceivePaymentPreviewInput();
    if (!currentInput) return;

    if (!receivePaymentPreviewInput || receivePaymentResult?.dryRun !== true) {
      window.alert('Preview split first.');
      return;
    }

    if (!isSameReceivePaymentPreviewInput(currentInput, receivePaymentPreviewInput)) {
      window.alert('Inputs changed after preview. Preview split again before applying payment.');
      return;
    }

    const amountReceived = Number(receivePaymentResult.amountReceived ?? receivePaymentPreviewInput.amount);
    const appliedToLegacy = Number(receivePaymentResult.appliedToLegacy || 0);
    const walletTopupAmount = Number(receivePaymentResult.walletTopupAmount || 0);
    const confirmed = window.confirm(
      `You are about to receive ${formatMoney(amountReceived)}. The system will apply ${formatMoney(appliedToLegacy)} to old dues and add ${formatMoney(walletTopupAmount)} to wallet.`
    );
    if (!confirmed) return;

    const requestKey =
      receivePaymentRequestKey || createReceiveParentPaymentRequestKey(receivePaymentPreviewInput.parentId);
    if (!receivePaymentRequestKey) {
      setReceivePaymentRequestKey(requestKey);
    }

    try {
      setReceivePaymentApplySaving(true);
      setReceivePaymentError('');
      const fn = httpsCallable(functions, 'adminReceiveParentPayment');
      const response = await fn({
        parentId: receivePaymentPreviewInput.parentId,
        amount: receivePaymentPreviewInput.amount,
        paidAt: receivePaymentPreviewInput.paidAt || undefined,
        method: receivePaymentPreviewInput.method || undefined,
        reference: receivePaymentPreviewInput.reference || undefined,
        note: receivePaymentPreviewInput.note || undefined,
        allocationMode: receivePaymentPreviewInput.allocationMode,
        dryRun: false,
        idempotencyKey: requestKey,
      });
      const result = (response.data || {}) as ReceiveParentPaymentResult;
      setReceivePaymentResult(result);
      if (result.idempotentReplay === true) {
        window.alert('Payment was already applied earlier. No duplicate allocation was created.');
      } else {
        const lines = [
          'Parent payment received successfully.',
          `Payment received: ${formatMoney(result.amountReceived)}`,
          `Applied to legacy dues: ${formatMoney(result.appliedToLegacy)}`,
          `Wallet credited: ${formatMoney(result.walletTopupAmount)}`,
          `Remaining unapplied: ${formatMoney(result.remainingUnapplied)}`,
        ];
        if (result.paymentId) lines.push(`Payment ID: ${result.paymentId}`);
        if (Number.isFinite(Number(result.walletBalanceAfter))) {
          lines.push(`Wallet balance after: ${formatMoney(result.walletBalanceAfter)}`);
        }
        window.alert(lines.join('\n'));
      }
    } catch (err: any) {
      const message = getReceiveParentPaymentCallableError(err, 'Failed to receive parent payment');
      setReceivePaymentError(message);
      window.alert(message);
    } finally {
      setReceivePaymentApplySaving(false);
    }
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

  const walletCurrentBalance = Number(walletSummary?.currentBalance ?? 0);
  const walletOpeningDeficit = Number(walletSummary?.openingDeficit ?? 0);
  const walletTotalTopups = Number(walletSummary?.totalTopups ?? 0);
  const walletTotalDeductions = Number(walletSummary?.totalDeductions ?? 0);
  const walletTotalAdjustments = Number(walletSummary?.totalAdjustments ?? 0);

  const walletBalanceLabel =
    walletCurrentBalance > 0
      ? 'Available balance'
      : walletCurrentBalance < 0
        ? 'Deficit / amount to be topped up'
        : 'No balance available';
  const walletReconcileAnomalies = Array.isArray(walletReconcileResult?.anomalies)
    ? walletReconcileResult.anomalies
    : [];
  const walletReconcileWarnings = Array.isArray(walletReconcileResult?.warnings)
    ? walletReconcileResult.warnings
    : [];
  const walletReconcileHasCriticalAnomalies = walletReconcileAnomalies.some(
    (anomaly) => String(anomaly.severity || '').trim().toLowerCase() === 'critical'
  );
  const walletReconcileCanFixSummaryDrift =
    walletReconcileResult?.walletExists === true &&
    walletReconcileResult?.drift?.hasDrift === true &&
    !walletReconcileHasCriticalAnomalies;
  const walletAutomationCurrentConfig = walletAutomationConfig || {};
  const walletAutomationIsEnabled =
    walletAutomationCurrentConfig.walletClassDeductionsEnabled === true;
  const receivePaymentWarnings = Array.isArray(receivePaymentResult?.warnings)
    ? receivePaymentResult.warnings
    : [];
  const receivePaymentAllocations = Array.isArray(receivePaymentResult?.allocationsPreview)
    ? receivePaymentResult?.allocationsPreview || []
    : Array.isArray(receivePaymentResult?.allocations)
      ? receivePaymentResult?.allocations || []
      : [];
  const receivePaymentCanApply =
    receivePaymentResult?.dryRun === true &&
    !!receivePaymentPreviewInput &&
    !receivePaymentPreviewSaving;

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

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Parent Wallet</h3>
            <p className="text-xs text-muted-foreground">
              View wallet balance, add top-ups, and review recent wallet transactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={openWalletTopupModal}
              disabled={!selectedWalletParentId}
            >
              Add wallet top-up
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={openWalletAdjustmentModal}
              disabled={!selectedWalletParentId}
            >
              Manual adjustment
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={openWalletOpeningDeficitModal}
              disabled={!selectedWalletParentId}
            >
              Opening deficit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={openWalletReconcileModal}
              disabled={!selectedWalletParentId}
            >
              Reconcile wallet
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={openWalletAutomationModal}
            >
              Wallet automation
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Selected parent</label>
          <Select value={selectedWalletParentId} onValueChange={setSelectedWalletParentId}>
            <SelectTrigger className="w-full md:w-[340px]">
              <SelectValue placeholder="Select parent to view wallet" />
            </SelectTrigger>
            <SelectContent>
              {walletParentOptions.length === 0 ? (
                <SelectItem value="__no_parent" disabled>
                  No parents available for this month
                </SelectItem>
              ) : (
                walletParentOptions.map((item) => (
                  <SelectItem key={item.parentId} value={item.parentId}>
                    {item.parentName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedWalletParentId ? (
            <div className="text-xs text-muted-foreground">
              Parent ID: {selectedWalletParentId}
            </div>
          ) : null}
        </div>

        {!selectedWalletParentId ? (
          <div className="text-sm text-muted-foreground">
            Select a parent to view wallet details.
          </div>
        ) : walletSummaryLoading ? (
          <div className="text-sm text-muted-foreground">Loading wallet summary…</div>
        ) : walletSummaryError ? (
          <div className="text-sm text-red-600">{walletSummaryError}</div>
        ) : !walletSummary ? (
          <div className="text-sm text-muted-foreground">
            No wallet created yet. Add a top-up to create the wallet.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">{walletBalanceLabel}</div>
                <div className="text-lg font-semibold">{formatMoney(walletCurrentBalance)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Opening deficit</div>
                <div className="text-lg font-semibold">{formatMoney(walletOpeningDeficit)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-lg font-semibold capitalize">
                  {String(walletSummary.status || 'active')}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Total top-ups</div>
                <div className="text-lg font-semibold">{formatMoney(walletTotalTopups)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Total deductions</div>
                <div className="text-lg font-semibold">{formatMoney(walletTotalDeductions)}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Total adjustments</div>
                <div className="text-lg font-semibold">{formatMoney(walletTotalAdjustments)}</div>
              </Card>
            </div>
            <div className="text-xs text-muted-foreground">
              Currency: {String(walletSummary.currency || 'INR')} · Last updated:{' '}
              {formatDateYmd(walletSummary.lastUpdatedAt)}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">Recent wallet transactions</div>
          {!selectedWalletParentId ? (
            <div className="text-sm text-muted-foreground">
              Select a parent to view wallet transactions.
            </div>
          ) : walletTransactionsLoading ? (
            <div className="text-sm text-muted-foreground">Loading wallet transactions…</div>
          ) : walletTransactionsError ? (
            <div className="text-sm text-red-600">{walletTransactionsError}</div>
          ) : walletTransactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No wallet transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Date</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Direction</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Balance after</th>
                    <th className="p-2">Method / Reference</th>
                    <th className="p-2">Note / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTransactions.map((tx) => {
                    const typeLabel = walletTransactionTypeLabel(tx.type);
                    const direction = String(tx.direction || '').trim().toLowerCase();
                    const directionLabel =
                      direction === 'credit' ? 'Credit' : direction === 'debit' ? 'Debit' : '—';
                    const method = String(tx.method || '').trim();
                    const reference = String(tx.reference || '').trim();
                    const note = String(tx.note || '').trim();
                    const reason = String(tx.reason || '').trim();
                    const description = String(tx.description || '').trim();
                    return (
                      <tr key={tx.id} className="border-b last:border-b-0">
                        <td className="p-2">{formatDateYmd(tx.createdAt || tx.paidAt)}</td>
                        <td className="p-2">{typeLabel}</td>
                        <td className="p-2">{directionLabel}</td>
                        <td className="p-2">{formatWalletTransactionAmount(tx)}</td>
                        <td className="p-2">{formatMoney(tx.balanceAfter)}</td>
                        <td className="p-2">
                          {[method, reference].filter(Boolean).join(' / ') || '—'}
                        </td>
                        <td className="p-2">
                          {[note, reason, description].filter(Boolean).join(' · ') || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <div>
        <h3 className="text-base font-semibold">Legacy monthly billing / historical payments</h3>
        <p className="text-xs text-muted-foreground">
          Existing billingCharges/payments allocation flow remains unchanged.
        </p>
        <p className="text-xs text-muted-foreground">
          Use Receive parent payment for new receipts. It clears old dues first and adds any excess to wallet.
        </p>
        <p className="text-xs text-amber-700">
          Legacy record payment does not add excess to wallet. For normal new receipts, use Receive parent payment.
        </p>
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
                            <Button size="sm" onClick={() => openReceiveParentPaymentModal(row)}>
                              Receive parent payment
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openPaymentModal(row)}>
                              Legacy record payment
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedWalletParentId(row.parentId)}
                            >
                              Wallet
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

      <Dialog open={walletTopupOpen} onOpenChange={setWalletTopupOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add wallet top-up</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent:{' '}
              <span className="font-medium">
                {selectedWalletParentName || fallbackParentLabel(selectedWalletParentId)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                step="1"
                value={walletTopupAmount}
                onChange={(e) => setWalletTopupAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Method (optional)</label>
                <Input
                  value={walletTopupMethod}
                  onChange={(e) => setWalletTopupMethod(e.target.value)}
                  placeholder="UPI / bank transfer / online"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Paid date (optional)</label>
                <Input
                  type="date"
                  value={walletTopupPaidAt}
                  onChange={(e) => setWalletTopupPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input
                value={walletTopupReference}
                onChange={(e) => setWalletTopupReference(e.target.value)}
                placeholder="e.g., bank ref no."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={walletTopupNote}
                onChange={(e) => setWalletTopupNote(e.target.value)}
                placeholder="Optional admin note"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWalletTopupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWalletTopup} disabled={walletTopupSaving}>
              {walletTopupSaving ? 'Saving…' : 'Add wallet top-up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletAdjustmentOpen} onOpenChange={setWalletAdjustmentOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Manual wallet adjustment</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent:{' '}
              <span className="font-medium">
                {selectedWalletParentName || fallbackParentLabel(selectedWalletParentId)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Direction</label>
              <Select
                value={walletAdjustmentDirection}
                onValueChange={(value) =>
                  setWalletAdjustmentDirection(value as WalletAdjustmentDirection)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit: Add balance</SelectItem>
                  <SelectItem value="debit">Debit: Reduce balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                step="1"
                value={walletAdjustmentAmount}
                onChange={(e) => setWalletAdjustmentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={walletAdjustmentReason}
                onChange={(e) => setWalletAdjustmentReason(e.target.value)}
                placeholder="Reason for this adjustment"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input
                value={walletAdjustmentReference}
                onChange={(e) => setWalletAdjustmentReference(e.target.value)}
                placeholder="e.g., ticket or approval ref"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={walletAdjustmentNote}
                onChange={(e) => setWalletAdjustmentNote(e.target.value)}
                placeholder="Optional admin note"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWalletAdjustmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWalletAdjustment} disabled={walletAdjustmentSaving}>
              {walletAdjustmentSaving ? 'Saving…' : 'Save adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletOpeningDeficitOpen} onOpenChange={setWalletOpeningDeficitOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Opening deficit migration</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent:{' '}
              <span className="font-medium">
                {selectedWalletParentName || fallbackParentLabel(selectedWalletParentId)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Preview unpaid historical dues first. Applying will create one opening deficit
              transaction and reduce this wallet balance. Historical billing and payment records will
              not be changed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Cutover month key (optional)</label>
                <Input
                  value={walletOpeningDeficitCutoverMonthKey}
                  onChange={(e) => setWalletOpeningDeficitCutoverMonthKey(e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cutover date (optional)</label>
                <Input
                  type="date"
                  value={walletOpeningDeficitCutoverDate}
                  onChange={(e) => setWalletOpeningDeficitCutoverDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={walletOpeningDeficitNote}
                onChange={(e) => setWalletOpeningDeficitNote(e.target.value)}
                placeholder="Opening deficit from historical unpaid dues"
              />
            </div>

            {walletOpeningDeficitError ? (
              <div className="text-sm text-red-600">{walletOpeningDeficitError}</div>
            ) : null}

            {walletOpeningDeficitResult ? (
              <Card className="p-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Preview status: {walletOpeningDeficitResult.dryRun === true ? 'Dry run' : 'Applied'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>Outstanding amount: <span className="font-medium">{formatMoney(walletOpeningDeficitResult.outstandingAmount)}</span></div>
                  <div>Charges scanned: <span className="font-medium">{walletOpeningDeficitResult.chargesScanned ?? 0}</span></div>
                  <div>Charges included: <span className="font-medium">{walletOpeningDeficitResult.chargesIncluded ?? 0}</span></div>
                  <div>Charges excluded: <span className="font-medium">{walletOpeningDeficitResult.chargesExcluded ?? 0}</span></div>
                  <div>Idempotency key: <span className="font-mono text-xs">{walletOpeningDeficitResult.idempotencyKey || '—'}</span></div>
                  <div>Balance after: <span className="font-medium">{formatMoney(walletOpeningDeficitResult.balanceAfter)}</span></div>
                </div>
                {Number(walletOpeningDeficitResult.outstandingAmount || 0) <= 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No opening deficit found for this parent.
                  </div>
                ) : null}
                {Array.isArray(walletOpeningDeficitResult.warnings) &&
                walletOpeningDeficitResult.warnings.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-amber-700">Warnings</div>
                    <ul className="list-disc pl-5 text-xs text-amber-700">
                      {walletOpeningDeficitResult.warnings.map((warning, idx) => (
                        <li key={`${warning}-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWalletOpeningDeficitOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviewOpeningDeficit}
              disabled={walletOpeningDeficitPreviewSaving || walletOpeningDeficitApplySaving}
            >
              {walletOpeningDeficitPreviewSaving ? 'Previewing…' : 'Preview deficit'}
            </Button>
            {walletOpeningDeficitResult?.dryRun === true ? (
              <Button
                onClick={handleApplyOpeningDeficit}
                disabled={
                  walletOpeningDeficitApplySaving ||
                  walletOpeningDeficitPreviewSaving ||
                  Number(walletOpeningDeficitResult.outstandingAmount || 0) <= 0
                }
              >
                {walletOpeningDeficitApplySaving ? 'Applying…' : 'Apply opening deficit'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletReconcileOpen} onOpenChange={setWalletReconcileOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>Wallet reconciliation</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent:{' '}
              <span className="font-medium">
                {selectedWalletParentName || fallbackParentLabel(selectedWalletParentId)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Reconciliation compares the wallet summary with the transaction ledger. Report-only
              mode does not change any data.
            </p>

            {walletReconcileError ? (
              <div className="text-sm text-red-600">{walletReconcileError}</div>
            ) : null}

            {walletReconcileResult ? (
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    Wallet exists:{' '}
                    <span className="font-medium">
                      {walletReconcileResult.walletExists ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    Transaction count:{' '}
                    <span className="font-medium">{walletReconcileResult.transactionCount ?? 0}</span>
                  </div>
                </div>

                {walletReconcileResult.walletExists === false ? (
                  <div className="text-xs text-muted-foreground">
                    No wallet exists for this parent yet. Add a top-up or opening deficit first.
                  </div>
                ) : null}

                <div className="space-y-1">
                  <div className="text-xs font-medium">Summary vs Ledger</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <Card className="p-2 space-y-1">
                      <div className="text-xs text-muted-foreground">Summary</div>
                      <div>Current balance: <span className="font-medium">{formatMoney(walletReconcileResult.summary?.currentBalance ?? 0)}</span></div>
                      <div>Opening deficit: <span className="font-medium">{formatMoney(walletReconcileResult.summary?.openingDeficit ?? 0)}</span></div>
                      <div>Total top-ups: <span className="font-medium">{formatMoney(walletReconcileResult.summary?.totalTopups ?? 0)}</span></div>
                      <div>Total deductions: <span className="font-medium">{formatMoney(walletReconcileResult.summary?.totalDeductions ?? 0)}</span></div>
                      <div>Total adjustments: <span className="font-medium">{formatMoney(walletReconcileResult.summary?.totalAdjustments ?? 0)}</span></div>
                    </Card>
                    <Card className="p-2 space-y-1">
                      <div className="text-xs text-muted-foreground">Computed from ledger</div>
                      <div>Current balance: <span className="font-medium">{formatMoney(walletReconcileResult.computed?.ledgerBalance ?? 0)}</span></div>
                      <div>Opening deficit: <span className="font-medium">{formatMoney(walletReconcileResult.computed?.openingDeficit ?? 0)}</span></div>
                      <div>Total top-ups: <span className="font-medium">{formatMoney(walletReconcileResult.computed?.totalTopups ?? 0)}</span></div>
                      <div>Total deductions: <span className="font-medium">{formatMoney(walletReconcileResult.computed?.totalDeductions ?? 0)}</span></div>
                      <div>Total adjustments: <span className="font-medium">{formatMoney(walletReconcileResult.computed?.totalAdjustments ?? 0)}</span></div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium">Drift</div>
                  {walletReconcileResult.drift?.hasDrift ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>Current balance drift: <span className="font-medium">{formatMoney(walletReconcileResult.drift?.currentBalance ?? 0)}</span></div>
                      <div>Opening deficit drift: <span className="font-medium">{formatMoney(walletReconcileResult.drift?.openingDeficit ?? 0)}</span></div>
                      <div>Total top-ups drift: <span className="font-medium">{formatMoney(walletReconcileResult.drift?.totalTopups ?? 0)}</span></div>
                      <div>Total deductions drift: <span className="font-medium">{formatMoney(walletReconcileResult.drift?.totalDeductions ?? 0)}</span></div>
                      <div>Total adjustments drift: <span className="font-medium">{formatMoney(walletReconcileResult.drift?.totalAdjustments ?? 0)}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No drift found.</div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium">Anomalies</div>
                  {walletReconcileAnomalies.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No anomalies reported.</div>
                  ) : (
                    <div className="space-y-2">
                      {walletReconcileAnomalies.map((anomaly, idx) => {
                        const severity = String(anomaly.severity || 'info').toLowerCase();
                        const severityClass =
                          severity === 'critical'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : severity === 'warning'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700';
                        return (
                          <div
                            key={`${anomaly.code || 'anomaly'}-${idx}`}
                            className={`rounded border p-2 text-xs ${severityClass}`}
                          >
                            <div className="font-medium capitalize">
                              Severity: {severity || 'info'}
                              {anomaly.transactionId ? ` · Tx: ${anomaly.transactionId}` : ''}
                            </div>
                            <div>{anomaly.message || anomaly.code || 'Unknown anomaly'}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium">Warnings</div>
                  {walletReconcileWarnings.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No warnings.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-xs text-amber-700">
                      {walletReconcileWarnings.map((warning, idx) => (
                        <li key={`${warning}-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {walletReconcileResult.summaryFixed === true ? (
                  <div className="text-xs text-emerald-700">
                    Summary fixed successfully.
                    {Array.isArray(walletReconcileResult.fixedFields) &&
                    walletReconcileResult.fixedFields.length > 0
                      ? ` Updated fields: ${walletReconcileResult.fixedFields.join(', ')}`
                      : ''}
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWalletReconcileOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRunWalletReconciliation}
              disabled={walletReconcileReportSaving || walletReconcileFixSaving}
            >
              {walletReconcileReportSaving ? 'Running…' : 'Run report'}
            </Button>
            {walletReconcileCanFixSummaryDrift ? (
              <Button
                onClick={handleFixWalletSummaryDrift}
                disabled={walletReconcileFixSaving || walletReconcileReportSaving}
              >
                {walletReconcileFixSaving ? 'Fixing…' : 'Fix summary drift'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletAutomationOpen} onOpenChange={setWalletAutomationOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Wallet automation settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Automatic wallet deductions are disabled by default. Enable only after setting a safe
              cutover month or date.
            </p>

            {walletAutomationLoading ? (
              <div className="text-sm text-muted-foreground">Loading wallet automation settings…</div>
            ) : null}

            {walletAutomationError ? (
              <div className="text-sm text-red-600">{walletAutomationError}</div>
            ) : null}

            {!walletAutomationLoading ? (
              <Card className="p-3 space-y-2">
                <div className="text-xs font-medium">Current config</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    Status:{' '}
                    <span className="font-medium">
                      {walletAutomationIsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    Cutover month:{' '}
                    <span className="font-medium">
                      {walletAutomationCurrentConfig.walletCutoverMonthKey || '—'}
                    </span>
                  </div>
                  <div>
                    Cutover date:{' '}
                    <span className="font-medium">
                      {formatDateYmd(walletAutomationCurrentConfig.walletCutoverDate)}
                    </span>
                  </div>
                  <div>
                    Updated at:{' '}
                    <span className="font-medium">
                      {formatDateYmd(walletAutomationCurrentConfig.updatedAt)}
                    </span>
                  </div>
                  <div>
                    Last enabled at:{' '}
                    <span className="font-medium">
                      {formatDateYmd(walletAutomationCurrentConfig.lastEnabledAt)}
                    </span>
                  </div>
                  <div>
                    Last disabled at:{' '}
                    <span className="font-medium">
                      {formatDateYmd(walletAutomationCurrentConfig.lastDisabledAt)}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    Updated by:{' '}
                    <span className="font-medium">
                      {walletAutomationCurrentConfig.updatedBy || '—'}
                    </span>
                  </div>
                </div>
                {!walletAutomationExists ? (
                  <div className="text-xs text-muted-foreground">
                    Automation is currently disabled.
                  </div>
                ) : null}
              </Card>
            ) : null}

            <div className="space-y-1">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={walletAutomationEnabled}
                  onChange={(e) => setWalletAutomationEnabled(e.target.checked)}
                />
                Enable automatic class deductions
              </label>
            </div>

            {walletAutomationEnabled ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                Warning: After this is enabled, future eligible billing charges on or after cutover
                can deduct from parent wallets automatically.
              </div>
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                Automatic wallet deductions are currently off. Completed classes will not deduct
                wallet balance automatically.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Cutover month key (optional)</label>
                <Input
                  value={walletAutomationCutoverMonthKey}
                  onChange={(e) => setWalletAutomationCutoverMonthKey(e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cutover date (optional)</label>
                <Input
                  type="date"
                  value={walletAutomationCutoverDate}
                  onChange={(e) => setWalletAutomationCutoverDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={walletAutomationNote}
                onChange={(e) => setWalletAutomationNote(e.target.value)}
                placeholder="Optional admin note"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Confirmation text {walletAutomationEnabled ? '(required to enable)' : '(optional)'}
              </label>
              <Input
                value={walletAutomationConfirmationText}
                onChange={(e) => setWalletAutomationConfirmationText(e.target.value)}
                placeholder="ENABLE WALLET DEDUCTIONS"
              />
              <div className="text-xs text-muted-foreground">
                Type exactly: ENABLE WALLET DEDUCTIONS
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWalletAutomationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveWalletAutomationConfig}
              disabled={walletAutomationSaving || walletAutomationLoading}
            >
              {walletAutomationSaving ? 'Saving…' : 'Save settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receivePaymentOpen} onOpenChange={setReceivePaymentOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Receive parent payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm">
              Parent:{' '}
              <span className="font-medium">
                {receivePaymentParentName || fallbackParentLabel(receivePaymentParentId)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (₹)</label>
                <Input
                  type="number"
                  step="1"
                  value={receivePaymentAmount}
                  onChange={(e) => setReceivePaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Paid date</label>
                <Input
                  type="date"
                  value={receivePaymentPaidAt}
                  onChange={(e) => setReceivePaymentPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Method (optional)</label>
                <Input
                  value={receivePaymentMethod}
                  onChange={(e) => setReceivePaymentMethod(e.target.value)}
                  placeholder="UPI / cash / bank transfer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reference (optional)</label>
                <Input
                  value={receivePaymentReference}
                  onChange={(e) => setReceivePaymentReference(e.target.value)}
                  placeholder="Txn/ref id"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Allocation mode</label>
              <Select
                value={receivePaymentAllocationMode}
                onValueChange={(value) => {
                  if (isAllocationMode(value)) {
                    setReceivePaymentAllocationMode(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select allocation mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legacy_then_wallet">
                    Clear old dues first, add excess to wallet
                  </SelectItem>
                  <SelectItem value="wallet_only">Add full amount to wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={receivePaymentNote}
                onChange={(e) => setReceivePaymentNote(e.target.value)}
                placeholder="Optional note for this receipt"
              />
            </div>

            {receivePaymentError ? (
              <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {receivePaymentError}
              </div>
            ) : null}

            {receivePaymentResult?.migratedByOpeningDeficit === true &&
            String(receivePaymentAllocationMode) === 'legacy_then_wallet' ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                This parent appears migrated by opening deficit. Use wallet-only payment.
              </div>
            ) : null}

            {receivePaymentResult ? (
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    Dry run:{' '}
                    <span className="font-medium">{receivePaymentResult.dryRun ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    Allocation mode used:{' '}
                    <span className="font-medium">
                      {receiveParentPaymentModeLabel(receivePaymentResult.allocationModeUsed)}
                    </span>
                  </div>
                  <div>
                    Amount received:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.amountReceived)}
                    </span>
                  </div>
                  <div>
                    Legacy outstanding before:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.legacyOutstandingBefore)}
                    </span>
                  </div>
                  <div>
                    Applied to legacy dues:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.appliedToLegacy)}
                    </span>
                  </div>
                  <div>
                    Added to wallet:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.walletTopupAmount)}
                    </span>
                  </div>
                  <div>
                    Remaining unapplied:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.remainingUnapplied)}
                    </span>
                  </div>
                  <div>
                    Charges scanned / included:{' '}
                    <span className="font-medium">
                      {Number(receivePaymentResult.chargesScanned ?? 0)} /{' '}
                      {Number(receivePaymentResult.chargesIncluded ?? 0)}
                    </span>
                  </div>
                </div>

                {Number(receivePaymentResult.walletTopupAmount || 0) > 0 ? (
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                    Excess amount will be added to wallet.
                  </div>
                ) : null}

                {receivePaymentResult.idempotentReplay === true ? (
                  <div className="text-xs text-slate-700">
                    This request was already applied earlier. No duplicate write was created.
                  </div>
                ) : null}

                {receivePaymentResult.paymentId ? (
                  <div className="text-xs text-muted-foreground">
                    Payment ID: {receivePaymentResult.paymentId}
                  </div>
                ) : null}
                {Number.isFinite(Number(receivePaymentResult.walletBalanceAfter)) ? (
                  <div className="text-xs text-muted-foreground">
                    Wallet balance after: {formatMoney(receivePaymentResult.walletBalanceAfter)}
                  </div>
                ) : null}

                <div className="space-y-1">
                  <div className="text-xs font-medium">Warnings</div>
                  {receivePaymentWarnings.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No warnings.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-xs text-amber-700">
                      {receivePaymentWarnings.map((warning, idx) => (
                        <li key={`${warning}-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium">Allocation preview</div>
                  {receivePaymentAllocations.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No charge-level allocations returned.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-auto">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="p-1">Charge</th>
                            <th className="p-1">Amount</th>
                            <th className="p-1">Before</th>
                            <th className="p-1">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivePaymentAllocations.map((allocation: any, idx: number) => {
                            const chargeId = String(
                              allocation?.chargeId || allocation?.billingChargeId || allocation?.id || ''
                            ).trim();
                            const allocAmount = Number(
                              allocation?.allocatedAmount ?? allocation?.amount ?? 0
                            );
                            const before = Number(
                              allocation?.outstandingBefore ?? allocation?.before ?? 0
                            );
                            const after = Number(
                              allocation?.outstandingAfter ?? allocation?.after ?? 0
                            );
                            return (
                              <tr key={`${chargeId || 'allocation'}-${idx}`} className="border-b last:border-b-0">
                                <td className="p-1">{chargeId || '—'}</td>
                                <td className="p-1">{formatMoney(allocAmount)}</td>
                                <td className="p-1">{formatMoney(before)}</td>
                                <td className="p-1">{formatMoney(after)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceivePaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handlePreviewReceiveParentPayment}
              disabled={receivePaymentPreviewSaving || receivePaymentApplySaving}
            >
              {receivePaymentPreviewSaving ? 'Previewing…' : 'Preview split'}
            </Button>
            {receivePaymentCanApply ? (
              <Button
                onClick={handleApplyReceiveParentPayment}
                disabled={receivePaymentApplySaving || receivePaymentPreviewSaving}
              >
                {receivePaymentApplySaving ? 'Applying…' : 'Apply payment'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Legacy record payment</DialogTitle>
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
              <div className="text-xs text-amber-700">
                This legacy flow does not add excess amount to wallet. Use Receive parent payment for normal new receipts.
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
              {paymentSaving ? 'Saving…' : 'Save legacy payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
