import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  documentId,
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
const DEFAULT_WALLET_AUTOMATION_CUTOVER_MONTH_KEY = '2026-05';
const DEFAULT_WALLET_AUTOMATION_CUTOVER_DATE = '2026-05-01';

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

const normalizeDateOnlyYmd = (value: any): string | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
};

const chunkIds = (ids: string[], size = 10) => {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
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

const receiveParentPaymentModeLabel = (mode: any) => {
  const normalized = String(mode || '').trim().toLowerCase();
  if (normalized === 'wallet_only') return 'Wallet only';
  if (normalized === 'legacy_then_wallet') return 'Legacy dues then wallet';
  return normalized ? normalized.replace(/_/g, ' ') : '—';
};

const isAllocationMode = (value: string): value is ReceiveParentPaymentAllocationMode =>
  value === 'legacy_then_wallet' || value === 'wallet_only';

const formatDateYmd = (value: any) => {
  const dateOnly = normalizeDateOnlyYmd(value);
  if (dateOnly) return dateOnly;
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(0, 10);
};

const toDateInputYmd = (value: any) => {
  const dateOnly = normalizeDateOnlyYmd(value);
  if (dateOnly) return dateOnly;
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
  const [walletAutomationCutoverMonthKey, setWalletAutomationCutoverMonthKey] = useState(
    DEFAULT_WALLET_AUTOMATION_CUTOVER_MONTH_KEY
  );
  const [walletAutomationCutoverDate, setWalletAutomationCutoverDate] = useState(
    DEFAULT_WALLET_AUTOMATION_CUTOVER_DATE
  );
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
    useState<ReceiveParentPaymentAllocationMode>('wallet_only');
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
      setCharges(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((charge) => charge.archived !== true)
      );
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
      setPayments(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((payment) => payment.archived !== true)
      );
    });
    return () => unsub();
  }, [selectedMonth]);

  const rows = useMemo(() => {
    const parentMap = new Map<
      string,
      {
        parentId: string;
        classCharges: number;
        walletPaymentsReceived: number;
        chargesCount: number;
      }
    >();

    const getEntry = (parentId: string) => {
      let entry = parentMap.get(parentId);
      if (!entry) {
        entry = {
          parentId,
          classCharges: 0,
          walletPaymentsReceived: 0,
          chargesCount: 0,
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
      const entry = getEntry(parentId);
      entry.classCharges += amount;
      entry.chargesCount += 1;
    });

    payments.forEach((payment) => {
      const parentId = String(payment.parentId || '');
      if (!parentId) return;
      const amountRaw = Number(payment.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const entry = getEntry(parentId);
      entry.walletPaymentsReceived += amount;
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
      .sort((a, b) => b.classCharges - a.classCharges);
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
          classCharges: number;
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
          classCharges: 0,
        });
      }
      const entry = bucket.get(key)!;
      entry.sessions += 1;
      entry.classCharges += amount;
    });

    const result = new Map<
      string,
      Array<{
        enrollmentId: string;
        kidId: string;
        courseId: string;
        sessions: number;
        classCharges: number;
      }>
    >();

    byParent.forEach((bucket, parentId) => {
      const entries = Array.from(bucket.values()).sort((a, b) => b.classCharges - a.classCharges);
      result.set(parentId, entries);
    });

    return result;
  }, [charges]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.classCharges += row.classCharges;
        acc.walletPaymentsReceived += row.walletPaymentsReceived;
        acc.walletDeductions += row.classCharges;
        acc.netWalletMovement += row.walletPaymentsReceived - row.classCharges;
        return acc;
      },
      { classCharges: 0, walletPaymentsReceived: 0, walletDeductions: 0, netWalletMovement: 0 }
    );
  }, [rows]);

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
      'This will update only the wallet summary totals from the transaction ledger. It will not edit wallet transactions, older payment records, billing charges, or teacher earnings.'
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
      setWalletAutomationCutoverMonthKey(
        String(config.walletCutoverMonthKey || DEFAULT_WALLET_AUTOMATION_CUTOVER_MONTH_KEY)
      );
      setWalletAutomationCutoverDate(
        toDateInputYmd(config.walletCutoverDate) || DEFAULT_WALLET_AUTOMATION_CUTOVER_DATE
      );
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
    setWalletAutomationCutoverMonthKey(DEFAULT_WALLET_AUTOMATION_CUTOVER_MONTH_KEY);
    setWalletAutomationCutoverDate(DEFAULT_WALLET_AUTOMATION_CUTOVER_DATE);
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
    setReceivePaymentAllocationMode('wallet_only');
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
      window.alert('Invalid receipt mode');
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
          `Preview completed. Unassigned amount: ${formatMoney(result.remainingUnapplied)}.`
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
    const walletTopupAmount = Number(receivePaymentResult.walletTopupAmount || 0);
    const confirmed = window.confirm(
      `You are about to receive ${formatMoney(amountReceived)}. Added to wallet: ${formatMoney(walletTopupAmount)}.`
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
        window.alert('Payment was already applied earlier. No duplicate payment write was created.');
      } else {
        const lines = [
          'Parent payment received successfully.',
          `Payment received: ${formatMoney(result.amountReceived)}`,
          `Wallet credited: ${formatMoney(result.walletTopupAmount)}`,
          `Unassigned amount: ${formatMoney(result.remainingUnapplied)}`,
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
  const walletBalanceByParent = useMemo(() => {
    const balances = new Map<string, number>();
    if (!selectedWalletParentId) return balances;
    const balance = Number(walletSummary?.currentBalance);
    if (Number.isFinite(balance)) {
      balances.set(selectedWalletParentId, balance);
    }
    return balances;
  }, [selectedWalletParentId, walletSummary]);
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
            Monthly class charges and wallet receipts by parent.
          </p>
          <p className="text-xs text-muted-foreground">
            Archived records are excluded from active parent payment totals.
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
          <div className="text-xs text-muted-foreground">Monthly class charges</div>
          <div className="text-lg font-semibold">{formatMoney(totals.classCharges)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Wallet payments received</div>
          <div className="text-lg font-semibold">{formatMoney(totals.walletPaymentsReceived)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Wallet deductions</div>
          <div className="text-lg font-semibold">{formatMoney(totals.walletDeductions)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Net wallet movement</div>
          <div className="text-lg font-semibold">{formatMoney(totals.netWalletMovement)}</div>
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
        <h3 className="text-base font-semibold">Monthly class charges</h3>
        <p className="text-xs text-muted-foreground">
          Class charges are shown for monthly review. Parent wallet balance is the source of truth for dues and advance payments.
        </p>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Parent</th>
                <th className="p-2">Classes</th>
                <th className="p-2">Class charges</th>
                <th className="p-2">Wallet balance</th>
                <th className="p-2">Amount to collect / Advance</th>
                <th className="p-2">Action</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={7}>
                    No parent charges found for this month.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isExpanded = expandedParents.has(row.parentId);
                  const breakdown = breakdownByParent.get(row.parentId) || [];
                  const walletBalance = walletBalanceByParent.get(row.parentId);
                  const hasWalletBalance = Number.isFinite(walletBalance);
                  const collectOrAdvanceLabel = !hasWalletBalance
                    ? '—'
                    : walletBalance! < 0
                      ? `Collect ${formatMoney(Math.abs(walletBalance!))}`
                      : walletBalance! > 0
                        ? `Advance ${formatMoney(walletBalance!)}`
                        : 'Settled';
                  return (
                    <React.Fragment key={row.parentId}>
                      <tr className="border-b last:border-b-0">
                        <td className="p-2">{row.parentName}</td>
                        <td className="p-2">{row.chargesCount}</td>
                        <td className="p-2">{formatMoney(row.classCharges)}</td>
                        <td className="p-2">{hasWalletBalance ? formatMoney(walletBalance) : '—'}</td>
                        <td className="p-2">{collectOrAdvanceLabel}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => openReceiveParentPaymentModal(row)}>
                              Receive parent payment
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
                          <td colSpan={7} className="p-2 bg-muted/30">
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
                                      <th className="p-2">Classes</th>
                                      <th className="p-2">Class charges</th>
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
                                          <td className="p-2">{formatMoney(entry.classCharges)}</td>
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
            <p className="text-xs text-muted-foreground">
              Wallet class deductions should start from May 2026. Earlier finance records are archived and excluded from active totals.
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
              <label className="text-sm font-medium">Receipt mode</label>
              <Input value="Wallet only" readOnly />
              <div className="text-xs text-muted-foreground">
                New receipts are added to the parent wallet. Class deductions reduce the wallet balance automatically.
              </div>
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

            {receivePaymentResult ? (
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    Dry run:{' '}
                    <span className="font-medium">{receivePaymentResult.dryRun ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    Receipt mode used:{' '}
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
                    Added to wallet:{' '}
                    <span className="font-medium">
                      {formatMoney(receivePaymentResult.walletTopupAmount)}
                    </span>
                  </div>
                  <div>
                    Unassigned amount:{' '}
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
                    <div className="space-y-2">
                      <div className="text-xs text-amber-700">
                        Some old charge records need cleanup, but the preview used safe fallback
                        rules.
                      </div>
                      <details className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        <summary className="cursor-pointer font-medium">
                          Technical warning details
                        </summary>
                        <ul className="list-disc pl-5 pt-2">
                          {receivePaymentWarnings.map((warning, idx) => (
                            <li key={`${warning}-${idx}`}>{warning}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium">Charge mapping preview</div>
                  {receivePaymentAllocations.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No charge-level mapping records returned.</div>
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

    </div>
  );
}
