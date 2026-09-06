import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  collectionGroup,
  count,
  doc,
  documentId,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  sum,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import jsPDF from 'jspdf';
import { db, functions } from '../../lib/firebaseConfig';
import {
  buildParentPaymentsReportingRow,
  buildParentPaymentsSummaryCards,
  normalizeCanonicalMonthFinanceTotals,
  type ParentMonthlyBillingReadModel,
  type ParentPaymentsReportingRow,
} from './parentPaymentsReporting';
import {
  DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE,
  isSameReceiveParentPaymentPreviewInput,
  normalizeReceivePaymentAllocationRows,
  receiveParentPaymentModeLabel,
  type ReceiveParentPaymentAllocationMode,
  type ReceiveParentPaymentPreviewInput,
} from './parentPaymentReceive';
import {
  PAYMENT_USER_SEARCH_DEBOUNCE_MS,
  PAYMENT_USER_SEARCH_MIN_CHARS,
  searchPaymentUsers,
  useDebouncedValue,
} from './paymentUserSearch';
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
import {
  classifyInvoiceCharges,
  isActiveBillingCharge,
  type InvoiceChargeRow,
} from '../../../functions/src/helpers/serviceDate';

const PAGE_SIZE = 10;
const EPSILON = 0.01;
const AUTO_REFRESH_COOLDOWN_MS = 30_000;

type ParentPaymentsV2Props = {
  onOpenMaintenance?: () => void;
};

type ParentUser = {
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

type WalletSummary = {
  currentBalance?: number;
};

type MonthCursor = QueryDocumentSnapshot<DocumentData> | null;

type MonthPage = {
  ids: string[];
  endCursor: MonthCursor;
  hasMore: boolean;
};

type ReceivePaymentResult = {
  ok?: boolean;
  dryRun?: boolean;
  paymentId?: string;
  amountReceived?: number;
  allocationModeUsed?: string;
  allocatedAmount?: number;
  walletTopupAmount?: number;
  advanceAmount?: number;
  remainingUnapplied?: number;
  chargesScanned?: number;
  chargesIncluded?: number;
  allocationsPreview?: unknown[];
  allocations?: unknown[];
  warnings?: string[];
};

type Summary = ReturnType<typeof buildParentPaymentsSummaryCards> & {
  collectionRate: number;
};

type PaymentStatusLabel = 'Paid' | 'Partial' | 'Unpaid' | 'In Grace' | 'Overdue' | 'Advance' | 'No charges';

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  return `₹${(Number.isFinite(amount) ? Math.round(amount) : 0).toLocaleString('en-IN')}`;
};

const formatDate = (ms: number | null | undefined) => {
  if (!ms || !Number.isFinite(ms)) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
};

const indiaDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return {
    year: parts.find((part) => part.type === 'year')?.value || '',
    month: parts.find((part) => part.type === 'month')?.value || '',
    day: parts.find((part) => part.type === 'day')?.value || '',
  };
};

const monthKeyFromDate = (date: Date) => {
  const { year, month } = indiaDateParts(date);
  return year && month ? `${year}-${month}` : '';
};

const dateInputValueInIndia = (date = new Date()) => {
  const { year, month, day } = indiaDateParts(date);
  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
};

const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const parentName = (user?: ParentUser | null) =>
  String(user?.displayName || user?.name || user?.email || user?.id || 'Unknown parent').trim();

const parentContact = (user?: ParentUser | null) =>
  String(user?.email || user?.phone || user?.phoneLocal || user?.phoneNormalized || '').trim();

const isParentUser = (user: ParentUser) => {
  if (Array.isArray(user.roles)) return user.roles.includes('parent');
  return String(user.role || '').trim().toLowerCase() === 'parent';
};

const chunkIds = (ids: string[], size = 10) => {
  const rows: string[][] = [];
  for (let index = 0; index < ids.length; index += size) rows.push(ids.slice(index, index + size));
  return rows;
};

const resolveChargePaidAmount = (charge: Record<string, unknown>, amount: number) => {
  const paid = Number(charge.paidAmount);
  if (Number.isFinite(paid) && paid > 0) return Math.min(Math.max(paid, 0), amount);
  const outstanding = Number(charge.outstandingAmount);
  if (Number.isFinite(outstanding) && outstanding >= 0) {
    return Math.max(amount - Math.min(Math.max(outstanding, 0), amount), 0);
  }
  const status = String(charge.status || '').trim().toLowerCase();
  return status === 'paid' || status === 'settled' ? amount : 0;
};

const formatServiceDate = (serviceDate: string | null, includeYear = false) => {
  if (!serviceDate) return '—';
  const date = new Date(`${serviceDate}T00:00:00+05:30`);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

const chargeStudentName = (charge: Record<string, unknown>, kidNames: Record<string, string>) => {
  const direct = String(
    charge.kidName || charge.studentName || charge.childName || charge.kidDisplayName || charge.studentDisplayName || ''
  ).trim();
  if (direct) return direct;
  const kidId = String(charge.kidId || charge.studentId || '').trim();
  return kidNames[kidId] || (kidId ? 'Student' : '—');
};

const createRequestKey = (parentId: string) => {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `parent-payment-v2_${parentId}_${Date.now()}_${random}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
};

const paymentStatusLabel = (row: ParentPaymentsReportingRow): PaymentStatusLabel => {
  if (row.selectedMonthCharges <= EPSILON) return row.advanceAmount > EPSILON ? 'Advance' : 'No charges';
  if (row.selectedMonthDue <= EPSILON) return 'Paid';
  if (row.selectedMonthSettled > EPSILON) return 'Partial';
  if (row.statusLabel === 'Overdue') return 'Overdue';
  if (row.statusLabel === 'In Grace') return 'In Grace';
  return 'Unpaid';
};

const statusClass = (status: PaymentStatusLabel) => {
  if (status === 'Paid' || status === 'Advance') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Partial' || status === 'In Grace') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Overdue') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

async function fetchMonthPage(selectedMonth: string, cursor: MonthCursor): Promise<MonthPage> {
  const monthQuery = query(
    collectionGroup(db, 'months'),
    where('monthKey', '==', selectedMonth),
    orderBy('dueAmount', 'desc'),
    orderBy('lastPaymentAtMs', 'desc'),
    orderBy('parentNameSort', 'asc'),
    orderBy(documentId(), 'asc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(PAGE_SIZE + 1),
  );
  const snapshot = await getDocs(monthQuery);
  const docs = snapshot.docs.slice(0, PAGE_SIZE);
  return {
    ids: docs.map((item) => String(item.data()?.parentId || '').trim()).filter(Boolean),
    endCursor: docs.length ? docs[docs.length - 1] : null,
    hasMore: snapshot.docs.length > PAGE_SIZE,
  };
}

export default function ParentPaymentsV2({ onOpenMaintenance }: ParentPaymentsV2Props): JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState(() => monthKeyFromDate(new Date()));
  const [pageNumber, setPageNumber] = useState(1);
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [pageCursor, setPageCursor] = useState<MonthCursor>(null);
  const [pageStartCursors, setPageStartCursors] = useState<MonthCursor[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSearchParent, setSelectedSearchParent] = useState<ParentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const lastAutoRefreshAtRef = useRef(Date.now());

  const [usersById, setUsersById] = useState<Record<string, ParentUser>>({});
  const [charges, setCharges] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [invoiceIntegrityCharges, setInvoiceIntegrityCharges] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [sessionsById, setSessionsById] = useState<Record<string, Record<string, unknown> | null>>({});
  const [readModels, setReadModels] = useState<Record<string, ParentMonthlyBillingReadModel | null>>({});
  const [wallets, setWallets] = useState<Record<string, WalletSummary | null>>({});
  const [kidNames, setKidNames] = useState<Record<string, string>>({});

  const [summary, setSummary] = useState<Summary>({
    ...buildParentPaymentsSummaryCards([]),
    collectionRate: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ParentUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm, PAYMENT_USER_SEARCH_DEBOUNCE_MS);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveRow, setReceiveRow] = useState<ParentPaymentsReportingRow | null>(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receivePaidAt, setReceivePaidAt] = useState(() => dateInputValueInIndia());
  const [receiveMethod, setReceiveMethod] = useState('UPI');
  const [receiveReference, setReceiveReference] = useState('');
  const [receiveNote, setReceiveNote] = useState('');
  const [receiveMode, setReceiveMode] = useState<ReceiveParentPaymentAllocationMode>(
    DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE,
  );
  const [receiveRequestKey, setReceiveRequestKey] = useState('');
  const [receivePreview, setReceivePreview] = useState<ReceivePaymentResult | null>(null);
  const [receivePreviewInput, setReceivePreviewInput] = useState<ReceiveParentPaymentPreviewInput | null>(null);
  const [receiveBusy, setReceiveBusy] = useState<'preview' | 'apply' | null>(null);
  const [receiveError, setReceiveError] = useState('');

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceRow, setInvoiceRow] = useState<ParentPaymentsReportingRow | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceIntegrityLoading, setInvoiceIntegrityLoading] = useState(false);
  const invoiceLoadRequestRef = useRef(0);

  const activeIds = useMemo(
    () => (selectedSearchParent ? [selectedSearchParent.id] : pageIds),
    [pageIds, selectedSearchParent],
  );

  const refreshPayments = useCallback(async (source: 'manual' | 'focus' = 'manual') => {
    if (loading || refreshing) return;
    if (source === 'focus') {
      const now = Date.now();
      if (now - lastAutoRefreshAtRef.current < AUTO_REFRESH_COOLDOWN_MS) return;
      lastAutoRefreshAtRef.current = now;
    }

    setRefreshing(true);
    setError('');
    try {
      if (!selectedSearchParent) {
        const startCursor = pageStartCursors[pageNumber - 1] || null;
        const page = await fetchMonthPage(selectedMonth, startCursor);
        setPageIds(page.ids);
        setPageCursor(page.endCursor);
        setHasMore(page.hasMore);
      }
      setRefreshKey((value) => value + 1);
    } catch (err) {
      console.error('[ParentPaymentsV2] Failed to refresh payment data', err);
      setError('Unable to refresh parent payments right now.');
    } finally {
      setRefreshing(false);
    }
  }, [loading, pageNumber, pageStartCursors, refreshing, selectedMonth, selectedSearchParent]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'hidden') return;
      void refreshPayments('focus');
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshPayments]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSelectedSearchParent(null);
    setSearchTerm('');
    setSearchResults([]);
    setPageNumber(1);
    setPageStartCursors([null]);

    fetchMonthPage(selectedMonth, null)
      .then((page) => {
        if (!active) return;
        setPageIds(page.ids);
        setPageCursor(page.endCursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => {
        console.error('[ParentPaymentsV2] Failed to load month page', err);
        if (active) setError('Unable to load parent payments for this month.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [selectedMonth]);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    const monthRows = collectionGroup(db, 'months');
    const monthFilter = where('monthKey', '==', selectedMonth);

    Promise.all([
      getAggregateFromServer(query(monthRows, monthFilter), {
        selectedMonthBilled: sum('billedAmount'),
        selectedMonthSettled: sum('settledAmount'),
        selectedMonthOutstanding: sum('dueAmount'),
      }),
      getAggregateFromServer(
        query(monthRows, monthFilter, where('status', 'in', ['paid', 'advance']), where('billedAmount', '>', 0)),
        { total: count() },
      ),
      getAggregateFromServer(query(monthRows, monthFilter, where('status', '==', 'partial')), { total: count() }),
      getAggregateFromServer(query(monthRows, monthFilter, where('dueAmount', '>', 0)), { total: count() }),
    ])
      .then(([totalsSnapshot, paidSnapshot, partialSnapshot, followUpSnapshot]) => {
        if (!active) return;
        const totals = normalizeCanonicalMonthFinanceTotals(totalsSnapshot.data());
        setSummary({
          selectedMonthBilled: totals.selectedMonthBilled,
          selectedMonthSettled: totals.selectedMonthSettled,
          selectedMonthOutstanding: totals.selectedMonthOutstanding,
          paidParents: Number(paidSnapshot.data().total || 0),
          partialParents: Number(partialSnapshot.data().total || 0),
          followUpParents: Number(followUpSnapshot.data().total || 0),
          totalWalletDeficitTillDate: 0,
          totalAdvanceWalletBalance: 0,
          collectionRate: totals.collectionRate,
        });
      })
      .catch((err) => {
        console.error('[ParentPaymentsV2] Failed to load month summary', err);
      })
      .finally(() => active && setSummaryLoading(false));

    return () => {
      active = false;
    };
  }, [selectedMonth, refreshKey]);

  useEffect(() => {
    if (!activeIds.length) {
      setUsersById({});
      setCharges([]);
      setInvoiceIntegrityCharges([]);
      setSessionsById({});
      setReadModels({});
      setWallets({});
      setKidNames({});
      return;
    }

    let active = true;
    const loadScope = async () => {
      setLoading(true);
      setError('');
      try {
        const nextUsers: Record<string, ParentUser> = {};
        for (const ids of chunkIds(activeIds)) {
          const snapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', ids)));
          snapshot.docs.forEach((item) => {
            nextUsers[item.id] = { id: item.id, ...(item.data() as Omit<ParentUser, 'id'>) };
          });
        }
        if (selectedSearchParent) nextUsers[selectedSearchParent.id] = selectedSearchParent;

        const nextCharges: Array<Record<string, unknown> & { id: string }> = [];
        for (const ids of chunkIds(activeIds)) {
          const snapshot = await getDocs(
            query(
              collection(db, 'billingCharges'),
              where('monthKey', '==', selectedMonth),
              where('parentId', 'in', ids),
            ),
          );
          snapshot.docs.forEach((item) => {
            const data = item.data() as Record<string, unknown>;
            if (data.archived !== true) nextCharges.push({ id: item.id, ...data });
          });
        }

        const readModelEntries = await Promise.all(
          activeIds.map(async (parentId) => {
            const snapshot = await getDoc(doc(db, 'parentMonthlyReadModels', parentId, 'months', selectedMonth));
            return [parentId, snapshot.exists() ? (snapshot.data() as ParentMonthlyBillingReadModel) : null] as const;
          }),
        );

        const nextWallets: Record<string, WalletSummary | null> = {};
        for (const ids of chunkIds(activeIds)) {
          const snapshot = await getDocs(query(collection(db, 'parentWallets'), where(documentId(), 'in', ids)));
          snapshot.docs.forEach((item) => {
            nextWallets[item.id] = item.data() as WalletSummary;
          });
        }
        activeIds.forEach((parentId) => {
          if (!(parentId in nextWallets)) nextWallets[parentId] = null;
        });

        const kidIds = Array.from(
          new Set(
            nextCharges
              .map((charge) => String(charge.kidId || charge.studentId || '').trim())
              .filter(Boolean),
          ),
        );
        const nextKidNames: Record<string, string> = {};
        for (const ids of chunkIds(kidIds)) {
          const snapshot = await getDocs(query(collection(db, 'kids'), where(documentId(), 'in', ids)));
          snapshot.docs.forEach((item) => {
            const data = item.data() as Record<string, unknown>;
            nextKidNames[item.id] = String(
              data.fullName || data.name || data.displayName || data.studentName || data.firstName || item.id,
            ).trim();
          });
        }

        if (!active) return;
        setUsersById(nextUsers);
        setCharges(nextCharges);
        setReadModels(Object.fromEntries(readModelEntries));
        setWallets(nextWallets);
        setKidNames(nextKidNames);
      } catch (err) {
        console.error('[ParentPaymentsV2] Failed to load selected scope', err);
        if (active) setError('Some payment details could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadScope();
    return () => {
      active = false;
    };
  }, [activeIds.join('|'), refreshKey, selectedMonth, selectedSearchParent]);

  useEffect(() => {
    const value = debouncedSearch.trim();
    if (value.length < PAYMENT_USER_SEARCH_MIN_CHARS || selectedSearchParent) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);
    searchPaymentUsers<ParentUser>({ db, searchTerm: value, isValidUser: isParentUser })
      .then((rows) => active && setSearchResults(rows))
      .catch(() => active && setSearchResults([]))
      .finally(() => active && setSearchLoading(false));

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedSearchParent]);

  const rows = useMemo(() => {
    return activeIds
      .map((parentId) => {
        const parentCharges = charges.filter((charge) => String(charge.parentId || '') === parentId);
        let classCharges = 0;
        let settled = 0;
        let due = 0;
        let chargeCount = 0;
        const students = new Set<string>();

        parentCharges.forEach((charge) => {
          const status = String(charge.status || '').trim().toLowerCase();
          if (['void', 'cancelled', 'canceled', 'reversed', 'refunded'].includes(status)) return;
          const amount = Math.max(Number(charge.amount) || 0, 0);
          if (amount <= 0) return;
          const paid = resolveChargePaidAmount(charge, amount);
          classCharges += amount;
          settled += paid;
          due += Math.max(amount - paid, 0);
          chargeCount += 1;
          const student = chargeStudentName(charge, kidNames);
          if (student && student !== '—') students.add(student);
        });

        const walletBalance = Number(wallets[parentId]?.currentBalance);
        return buildParentPaymentsReportingRow({
          parentId,
          parentName: parentName(usersById[parentId] || selectedSearchParent),
          studentNames: Array.from(students),
          chargesCount: chargeCount,
          classCharges,
          settledFromCharges: settled,
          dueFromCharges: due,
          receiptMonthPaymentsReceived: 0,
          walletBalance: Number.isFinite(walletBalance) ? walletBalance : null,
          monthlyReadModel: readModels[parentId] || null,
          selectedMonth,
        });
      })
      .sort((left, right) => {
        if (right.selectedMonthDue !== left.selectedMonthDue) return right.selectedMonthDue - left.selectedMonthDue;
        return left.parentName.localeCompare(right.parentName);
      });
  }, [activeIds, charges, kidNames, readModels, selectedMonth, selectedSearchParent, usersById, wallets]);

  const currentReceiveInput = useMemo<ReceiveParentPaymentPreviewInput | null>(() => {
    if (!receiveRow) return null;
    const amount = Number(receiveAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !receivePaidAt) return null;
    return {
      parentId: receiveRow.parentId,
      amount,
      paidAt: receivePaidAt,
      method: receiveMethod.trim(),
      reference: receiveReference.trim(),
      note: receiveNote.trim(),
      allocationMode: receiveMode,
    };
  }, [receiveAmount, receiveMethod, receiveMode, receiveNote, receivePaidAt, receiveReference, receiveRow]);

  const allocations = normalizeReceivePaymentAllocationRows(
    Array.isArray(receivePreview?.allocationsPreview)
      ? receivePreview?.allocationsPreview || []
      : Array.isArray(receivePreview?.allocations)
        ? receivePreview?.allocations || []
        : [],
  );

  const previewIsCurrent = isSameReceiveParentPaymentPreviewInput(receivePreviewInput, currentReceiveInput);

  const openReceive = (row: ParentPaymentsReportingRow) => {
    setReceiveRow(row);
    setReceiveAmount('');
    setReceivePaidAt(dateInputValueInIndia());
    setReceiveMethod('UPI');
    setReceiveReference('');
    setReceiveNote('');
    setReceiveMode(DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE);
    setReceiveRequestKey(createRequestKey(row.parentId));
    setReceivePreview(null);
    setReceivePreviewInput(null);
    setReceiveError('');
    setReceiveOpen(true);
  };

  const previewPayment = async () => {
    if (!currentReceiveInput) {
      setReceiveError('Enter a valid amount and paid date.');
      return;
    }
    try {
      setReceiveBusy('preview');
      setReceiveError('');
      const callable = httpsCallable(functions, 'adminReceiveParentPayment');
      const response = await callable({
        ...currentReceiveInput,
        idempotencyKey: receiveRequestKey,
        dryRun: true,
      });
      setReceivePreview((response.data || {}) as ReceivePaymentResult);
      setReceivePreviewInput(currentReceiveInput);
    } catch (err: any) {
      setReceivePreview(null);
      setReceivePreviewInput(null);
      setReceiveError(err?.message || 'Unable to preview this payment.');
    } finally {
      setReceiveBusy(null);
    }
  };

  const applyPayment = async () => {
    if (!currentReceiveInput || !previewIsCurrent || receivePreview?.dryRun !== true) {
      setReceiveError('Preview the current payment details before recording it.');
      return;
    }
    try {
      setReceiveBusy('apply');
      setReceiveError('');
      const callable = httpsCallable(functions, 'adminReceiveParentPayment');
      await callable({
        ...currentReceiveInput,
        idempotencyKey: receiveRequestKey,
        dryRun: false,
      });
      setReceiveOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (err: any) {
      setReceiveError(err?.message || 'Unable to record this payment.');
    } finally {
      setReceiveBusy(null);
    }
  };

  const openInvoice = async (row: ParentPaymentsReportingRow) => {
    const requestId = invoiceLoadRequestRef.current + 1;
    invoiceLoadRequestRef.current = requestId;
    setInvoiceRow(row);
    setInvoiceOpen(true);
    setInvoiceIntegrityLoading(true);
    setInvoiceIntegrityCharges([]);
    setSessionsById({});
    try {
      const chargeSnapshot = await getDocs(query(collection(db, 'billingCharges'), where('parentId', '==', row.parentId)));
      const parentCharges: Array<Record<string, unknown> & { id: string }> = chargeSnapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) } as Record<string, unknown> & { id: string }))
        .filter((charge) => charge.archived !== true);
      const sessionIds = Array.from(new Set(parentCharges.map((charge) => String(charge.sessionId || '').trim()).filter(Boolean)));
      const nextSessionsById: Record<string, Record<string, unknown> | null> = {};
      for (const ids of chunkIds(sessionIds)) {
        const snapshot = await getDocs(query(collection(db, 'classSessions'), where(documentId(), 'in', ids)));
        snapshot.docs.forEach((item) => {
          nextSessionsById[item.id] = item.data() as Record<string, unknown>;
        });
      }
      sessionIds.forEach((sessionId) => {
        if (!(sessionId in nextSessionsById)) nextSessionsById[sessionId] = null;
      });
      if (invoiceLoadRequestRef.current !== requestId) return;
      setInvoiceIntegrityCharges(parentCharges);
      setSessionsById(nextSessionsById);
    } catch (err) {
      if (invoiceLoadRequestRef.current !== requestId) return;
      console.error('[ParentPaymentsV2] Failed to load invoice integrity scope', err);
      setError('Invoice integrity checks could not be completed. No invoice rows were loaded.');
    } finally {
      if (invoiceLoadRequestRef.current === requestId) setInvoiceIntegrityLoading(false);
    }
  };

  const invoiceIntegrityRows = useMemo(() => {
    if (!invoiceRow) return [];
    return classifyInvoiceCharges({
      charges: invoiceIntegrityCharges.filter(
        (charge) => String(charge.parentId || '') === invoiceRow.parentId && isActiveBillingCharge(charge) && Number(charge.amount) > 0,
      ),
      sessionsById,
      selectedMonth,
    });
  }, [invoiceIntegrityCharges, invoiceRow, selectedMonth, sessionsById]);

  const invoiceCharges = useMemo<Array<InvoiceChargeRow<Record<string, unknown> & { id: string }>>>(() =>
    invoiceIntegrityRows
      .filter((row) => row.integrity === 'VALID' && row.serviceMonthKey === selectedMonth)
      .sort((left, right) => String(left.serviceDate).localeCompare(String(right.serviceDate)) || left.charge.id.localeCompare(right.charge.id)),
  [invoiceIntegrityRows, selectedMonth]);

  const invoiceAnomalies = invoiceIntegrityRows.filter((row) =>
    (String(row.charge.monthKey || '').trim() === selectedMonth || row.serviceMonthKey === selectedMonth) && row.integrity !== 'VALID',
  );
  const invoiceTotals = invoiceCharges.reduce((totals, row) => {
    const amount = Math.max(Number(row.charge.amount) || 0, 0);
    const paid = resolveChargePaidAmount(row.charge, amount);
    return {
      classes: totals.classes + 1,
      billed: totals.billed + amount,
      settled: totals.settled + paid,
      due: totals.due + Math.max(amount - paid, 0),
    };
  }, { classes: 0, billed: 0, settled: 0, due: 0 });
  const invoiceTotalsDifferFromLedger = !invoiceIntegrityLoading && !!invoiceRow && (
    invoiceTotals.classes !== invoiceRow.billedClasses ||
    Math.abs(invoiceTotals.billed - invoiceRow.selectedMonthCharges) > EPSILON ||
    Math.abs(invoiceTotals.settled - invoiceRow.selectedMonthSettled) > EPSILON ||
    Math.abs(invoiceTotals.due - invoiceRow.selectedMonthDue) > EPSILON
  );

  const downloadInvoice = async () => {
    if (!invoiceRow) return;
    setInvoiceSaving(true);
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 44;
      let y = 50;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Tiny Steps Learning', margin, y);
      pdf.setFontSize(15);
      pdf.text('Monthly Invoice', pageWidth - margin, y, { align: 'right' });
      y += 28;
      pdf.setDrawColor(220, 226, 235);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 24;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Parent: ${invoiceRow.parentName}`, margin, y);
      pdf.text(`Period: ${monthLabel(selectedMonth)}`, pageWidth - margin, y, { align: 'right' });
      y += 18;
      if (invoiceRow.studentNames.length) {
        pdf.text(`Student(s): ${invoiceRow.studentNames.join(', ')}`, margin, y);
        y += 18;
      }

      const summaryRows = [
        ['Classes', String(invoiceTotals.classes)],
        ['Billed', `Rs. ${Math.round(invoiceTotals.billed).toLocaleString('en-IN')}`],
        ['Paid / applied', `Rs. ${Math.round(invoiceTotals.settled).toLocaleString('en-IN')}`],
        ['Amount due', `Rs. ${Math.round(invoiceTotals.due).toLocaleString('en-IN')}`],
      ];
      summaryRows.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 105, y);
        y += 17;
      });
      y += 14;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Date', margin, y);
      pdf.text('Student', margin + 90, y);
      pdf.text('Amount', pageWidth - margin, y, { align: 'right' });
      y += 8;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 16;

      pdf.setFont('helvetica', 'normal');
      invoiceCharges.forEach((row) => {
        if (y > 760) {
          pdf.addPage();
          y = 50;
        }
        pdf.text(formatServiceDate(row.serviceDate, true), margin, y);
        pdf.text(chargeStudentName(row.charge, kidNames).slice(0, 42), margin + 90, y);
        pdf.text(`Rs. ${Math.round(Number(row.charge.amount) || 0).toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });
        y += 18;
      });

      y += 12;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 22;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Amount due: Rs. ${Math.round(invoiceTotals.due).toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });

      const safeName = invoiceRow.parentName.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      pdf.save(`tiny-steps-invoice-${safeName || invoiceRow.parentId}-${selectedMonth}.pdf`);
    } finally {
      setInvoiceSaving(false);
    }
  };

  const selectSearchResult = (user: ParentUser) => {
    setSelectedSearchParent(user);
    setSearchTerm(parentName(user));
    setSearchResults([]);
  };

  const clearSelectedParent = () => {
    setSelectedSearchParent(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const goNext = async () => {
    if (!hasMore || !pageCursor || loading || selectedSearchParent) return;
    setLoading(true);
    try {
      const startCursor = pageCursor;
      const page = await fetchMonthPage(selectedMonth, startCursor);
      setPageStartCursors((current) => [...current.slice(0, pageNumber), startCursor]);
      setPageNumber((value) => value + 1);
      setPageIds(page.ids);
      setPageCursor(page.endCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[ParentPaymentsV2] Failed to load next page', err);
      setError('Unable to load the next page.');
    } finally {
      setLoading(false);
    }
  };

  const goPrevious = async () => {
    if (pageNumber <= 1 || loading || selectedSearchParent) return;
    setLoading(true);
    try {
      const nextPageNumber = pageNumber - 1;
      const startCursor = pageStartCursors[nextPageNumber - 1] || null;
      const page = await fetchMonthPage(selectedMonth, startCursor);
      setPageNumber(nextPageNumber);
      setPageIds(page.ids);
      setPageCursor(page.endCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[ParentPaymentsV2] Failed to load previous page', err);
      setError('Unable to load the previous page.');
    } finally {
      setLoading(false);
    }
  };

  const searchVisible =
    !selectedSearchParent && searchTerm.trim().length >= PAYMENT_USER_SEARCH_MIN_CHARS;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Parent Payments</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track monthly dues, record payments, and generate invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-9 w-[170px] bg-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshPayments('manual')}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          {onOpenMaintenance ? (
            <Button variant="outline" size="sm" onClick={onOpenMaintenance}>
              Financial tools
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="p-3">
        <div ref={searchContainerRef} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="shrink-0 text-sm font-medium">Find parent</label>
          <div className="relative min-w-0 flex-1 sm:max-w-2xl">
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(event) => {
                  if (selectedSearchParent) setSelectedSearchParent(null);
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search name, email, phone, or ID"
                autoComplete="off"
                className="h-9"
              />
              {selectedSearchParent ? (
                <Button variant="outline" size="sm" onClick={clearSelectedParent}>Clear</Button>
              ) : null}
            </div>

            {searchVisible ? (
              <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border bg-white shadow-lg">
                {searchLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No matching parent found.</div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectSearchResult(user)}
                      className="flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{parentName(user)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{parentContact(user) || user.id}</span>
                      </span>
                      <span className="text-xs font-medium text-blue-600">Select</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {selectedSearchParent ? (
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border bg-blue-50 px-2.5 py-1.5 text-xs text-blue-900">
              <span className="font-medium">Viewing</span>
              <span className="max-w-[260px] truncate">{parentName(selectedSearchParent)}</span>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Billed</div>
          <div className="mt-1 text-2xl font-semibold">{summaryLoading ? '—' : formatMoney(summary.selectedMonthBilled)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{monthLabel(selectedMonth)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collected / applied</div>
          <div className="mt-1 text-2xl font-semibold">{summaryLoading ? '—' : formatMoney(summary.selectedMonthSettled)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{summaryLoading ? '—' : `${summary.collectionRate.toFixed(1)}% collection rate`}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outstanding</div>
          <div className="mt-1 text-2xl font-semibold">{summaryLoading ? '—' : formatMoney(summary.selectedMonthOutstanding)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Service-month dues only</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Parents with due</div>
          <div className="mt-1 text-2xl font-semibold">{summaryLoading ? '—' : summary.followUpParents}</div>
          <div className="mt-1 text-xs text-muted-foreground">{summaryLoading ? '—' : `${summary.paidParents} paid · ${summary.partialParents} partial`}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
          <div>
            <h3 className="font-semibold">{selectedSearchParent ? 'Selected parent' : 'Monthly payment status'}</h3>
            <p className="text-xs text-muted-foreground">
              Billed, paid and due amounts are shown for the selected service month.
            </p>
          </div>
          {!selectedSearchParent ? <div className="text-xs text-muted-foreground">Page {pageNumber}</div> : null}
        </div>

        {error ? <div className="border-b bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Parent / student</th>
                <th className="px-3 py-2.5 font-semibold">Classes</th>
                <th className="px-3 py-2.5 font-semibold">Billed</th>
                <th className="px-3 py-2.5 font-semibold">Paid</th>
                <th className="px-3 py-2.5 font-semibold">Due</th>
                <th className="px-3 py-2.5 font-semibold">Payment status</th>
                <th className="px-3 py-2.5 font-semibold">Last payment</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Loading payment data…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No billing records found for this scope.</td></tr>
              ) : (
                rows.map((row) => {
                  const displayStatus = paymentStatusLabel(row);
                  return (
                    <tr key={row.parentId} className="border-t align-middle hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">{row.parentName}</div>
                        <div className="mt-0.5 max-w-[300px] truncate text-xs text-muted-foreground">
                          {row.studentNames.length ? row.studentNames.join(', ') : parentContact(usersById[row.parentId]) || 'No student name on charge record'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{row.billedClasses}</td>
                      <td className="px-3 py-2.5 font-medium tabular-nums">{formatMoney(row.selectedMonthCharges)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-emerald-700">{formatMoney(row.selectedMonthSettled)}</td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums">{formatMoney(row.selectedMonthDue)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDate(row.lastPaymentAtMs)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => openReceive(row)}>Receive payment</Button>
                          <Button size="sm" variant="outline" onClick={() => openInvoice(row)}>Invoice</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!selectedSearchParent ? (
          <div className="flex items-center justify-center gap-3 border-t px-4 py-2.5">
            <Button variant="outline" size="sm" disabled={pageNumber <= 1 || loading} onClick={goPrevious}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {pageNumber}</span>
            <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={goNext}>Next</Button>
          </div>
        ) : null}
      </Card>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive parent payment</DialogTitle>
          </DialogHeader>

          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="text-sm font-semibold">{receiveRow?.parentName}</div>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>{monthLabel(selectedMonth)} due: <strong className="text-slate-700">{formatMoney(receiveRow?.selectedMonthDue || 0)}</strong></span>
              <span>Payment status: <strong className="text-slate-700">{receiveRow ? paymentStatusLabel(receiveRow) : '—'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input type="number" min="0" step="1" value={receiveAmount} onChange={(event) => setReceiveAmount(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Paid date</label>
              <Input type="date" value={receivePaidAt} onChange={(event) => setReceivePaidAt(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Method</label>
              <Select value={receiveMethod} onValueChange={setReceiveMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reference <span className="text-muted-foreground">(optional)</span></label>
              <Input value={receiveReference} onChange={(event) => setReceiveReference(event.target.value)} placeholder="Txn / reference ID" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">How should this receipt be applied?</label>
            <Select value={receiveMode} onValueChange={(value) => setReceiveMode(value as ReceiveParentPaymentAllocationMode)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fifo_then_wallet">Apply to oldest outstanding dues first</SelectItem>
                <SelectItem value="wallet_only">Keep the full amount as advance</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Recommended: apply to oldest dues. Any amount left after dues are cleared becomes advance automatically.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Note <span className="text-muted-foreground">(optional)</span></label>
            <Textarea value={receiveNote} onChange={(event) => setReceiveNote(event.target.value)} placeholder="Internal note" />
          </div>

          {receiveError ? <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{receiveError}</div> : null}

          {receivePreview ? (
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Payment preview</div>
                  <div className="text-xs text-muted-foreground">{receiveParentPaymentModeLabel(receivePreview.allocationModeUsed || receiveMode)}</div>
                </div>
                {!previewIsCurrent ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Preview needs refresh</span> : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div><div className="text-xs text-muted-foreground">Received</div><div className="font-semibold">{formatMoney(receivePreview.amountReceived || Number(receiveAmount))}</div></div>
                <div><div className="text-xs text-muted-foreground">Applied to dues</div><div className="font-semibold">{formatMoney(receivePreview.allocatedAmount || 0)}</div></div>
                <div><div className="text-xs text-muted-foreground">Advance</div><div className="font-semibold">{formatMoney(receivePreview.walletTopupAmount ?? receivePreview.advanceAmount ?? 0)}</div></div>
                <div><div className="text-xs text-muted-foreground">Charges matched</div><div className="font-semibold">{receivePreview.chargesIncluded ?? allocations.length}</div></div>
              </div>

              {allocations.length ? (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <div className="grid grid-cols-[90px_1fr_100px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <span>Month</span><span>Student / charge</span><span className="text-right">Applied</span>
                  </div>
                  {allocations.slice(0, 6).map((allocation, index) => (
                    <div key={`${allocation.chargeId}-${index}`} className="grid grid-cols-[90px_1fr_100px] border-t px-3 py-2 text-xs">
                      <span>{allocation.monthKey || '—'}</span>
                      <span className="truncate">{allocation.studentName || allocation.eventDateKey || allocation.chargeId || 'Charge'}</span>
                      <span className="text-right font-medium">{formatMoney(allocation.allocatedAmount)}</span>
                    </div>
                  ))}
                  {allocations.length > 6 ? <div className="border-t px-3 py-2 text-xs text-muted-foreground">+ {allocations.length - 6} more allocations</div> : null}
                </div>
              ) : null}

              {Array.isArray(receivePreview.warnings) && receivePreview.warnings.length ? (
                <details className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <summary className="cursor-pointer font-semibold">Data cleanup warnings</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {receivePreview.warnings.slice(0, 5).map((warning, index) => <li key={index}>{warning}</li>)}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setReceiveOpen(false)} disabled={receiveBusy !== null}>Cancel</Button>
            <Button variant="outline" onClick={previewPayment} disabled={receiveBusy !== null}>
              {receiveBusy === 'preview' ? 'Previewing…' : receivePreview ? 'Refresh preview' : 'Preview payment'}
            </Button>
            <Button onClick={applyPayment} disabled={receiveBusy !== null || receivePreview?.dryRun !== true || !previewIsCurrent}>
              {receiveBusy === 'apply' ? 'Recording…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice · {invoiceRow?.parentName || ''}</DialogTitle>
          </DialogHeader>

          {invoiceRow ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card className="p-3"><div className="text-xs text-muted-foreground">Classes</div><div className="font-semibold">{invoiceTotals.classes}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Billed</div><div className="font-semibold">{formatMoney(invoiceTotals.billed)}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Paid / applied</div><div className="font-semibold">{formatMoney(invoiceTotals.settled)}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Amount due</div><div className="font-semibold">{formatMoney(invoiceTotals.due)}</div></Card>
              </div>

              {invoiceAnomalies.length > 0 || invoiceTotalsDifferFromLedger ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
                  {invoiceAnomalies.length > 0
                    ? `${invoiceAnomalies.length} financial integrity ${invoiceAnomalies.length === 1 ? 'record requires' : 'records require'} review and ${invoiceAnomalies.length === 1 ? 'was' : 'were'} excluded from this invoice. `
                    : ''}
                  {invoiceTotalsDifferFromLedger
                    ? 'Verified invoice totals differ from the canonical monthly ledger. No ledger or read-model values were changed.'
                    : ''}
                </div>
              ) : null}

              {invoiceIntegrityLoading ? (
                <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Verifying linked sessions and service dates…
                </div>
              ) : null}

              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[120px_1fr_110px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Date</span><span>Student</span><span className="text-right">Charge</span>
                </div>
                {invoiceCharges.length ? invoiceCharges.map((row) => {
                  return (
                    <div key={row.charge.id} className="grid grid-cols-[120px_1fr_110px] border-t px-3 py-2 text-sm">
                      <span>{formatServiceDate(row.serviceDate)}</span>
                      <span className="truncate">{chargeStudentName(row.charge, kidNames)}</span>
                      <span className="text-right font-medium">{formatMoney(row.charge.amount)}</span>
                    </div>
                  );
                }) : <div className="border-t px-3 py-6 text-center text-sm text-muted-foreground">{invoiceIntegrityLoading ? 'Loading verified charge rows…' : 'No verified charge rows available.'}</div>}
              </div>

              <p className="text-xs text-muted-foreground">
                This invoice is based on {monthLabel(selectedMonth)} service-month charges and allocations. Historical receipts entered later are reflected after allocation to these charges.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Close</Button>
            <Button onClick={downloadInvoice} disabled={!invoiceRow || invoiceSaving || invoiceIntegrityLoading}>{invoiceSaving ? 'Preparing…' : 'Download PDF'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
