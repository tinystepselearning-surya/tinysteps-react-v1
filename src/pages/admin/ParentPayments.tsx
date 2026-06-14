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
import jsPDF from 'jspdf';
import { db, functions } from '../../lib/firebaseConfig';
import { normalizeFinanceStatus } from '../../lib/statuses';
import {
  buildParentPaymentsReportingRow,
  buildParentPaymentsSummaryCards,
  type ParentMonthlyBillingReadModel,
  type ParentPaymentsReportingRow,
  resolveParentPaymentSettlementSummary,
} from './parentPaymentsReporting';
import {
  DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE,
  isSameReceiveParentPaymentPreviewInput,
  isReceiveParentPaymentAllocationMode,
  normalizeReceivePaymentAllocationRows,
  RECEIVE_PARENT_PAYMENT_STALE_PREVIEW_MESSAGE,
  receiveParentPaymentModeLabel,
  type ReceiveParentPaymentAllocationMode,
  type ReceiveParentPaymentPreviewInput,
} from './parentPaymentReceive';
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

type ParentWalletSummaryMap = Record<string, WalletSummary | null>;

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

type ReceiveParentPaymentResult = {
  ok?: boolean;
  dryRun?: boolean;
  parentId?: string;
  paymentId?: string;
  idempotentReplay?: boolean;
  amountReceived?: number;
  allocationModeUsed?: ReceiveParentPaymentAllocationMode | string;
  parentOutstandingBefore?: number;
  legacyOutstandingBefore?: number;
  allocatedAmount?: number;
  appliedToLegacy?: number;
  walletTopupAmount?: number;
  advanceAmount?: number;
  unallocatedAmount?: number;
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

type ParentInvoiceNormalizedRow = {
  stableKey: string;
  sessionId: string;
  chargeId: string;
  monthKey: string;
  dateLabel: string;
  weekdayLabel: string;
  dateSortValue: number;
  timeLabel: string;
  startDateTimeSortValue: number;
  studentName: string;
  courseName: string;
  teacherName: string;
  sessionTypeLabel: 'Regular' | 'Rescheduled' | 'Makeup' | 'One-off';
  sessionTypeDetailLabel?: string;
  statusLabel: string;
  amount: number;
  rawDateDebugSource: string;
  rawTimeDebugSource: string;
  sourceStatus: string;
  rawSessionStatus: string;
};

type InvoiceMonthSection = {
  monthKey: string;
  monthLabel: string;
  rows: ParentInvoiceNormalizedRow[];
  monthClassCount: number;
  monthTotalAmount: number;
};

type ParentInvoiceData = {
  parentId: string;
  parentName: string;
  generatedDateLabel: string;
  invoicePeriodLabel: string;
  rows: ParentInvoiceNormalizedRow[];
  monthSections: InvoiceMonthSection[];
  studentNames: string[];
  courseNames: string[];
  teacherNames: string[];
  totalCompletedClasses: number;
  totalClassCharges: number;
  selectedMonthSettledAmount: number;
  selectedMonthDueAmount: number;
  settlementSourceLabel: 'Monthly read model' | 'Charge docs fallback';
  sessionTypeBreakdown: {
    regular: number;
    rescheduledOrMakeup: number;
    oneOff: number;
  };
};

type MonthlyChargeRow = {
  parentId: string;
  parentName: string;
  classCharges: number;
  receiptMonthPaymentsReceived: number;
  chargesCount: number;
  settledFromCharges: number;
  dueFromCharges: number;
};

const PDF_LOGO_CANDIDATE_PATHS = [
  '/logo-main.webp',
  '/logo-header.webp',
  '/logo-square.webp',
  '/apple-touch-icon.png',
  '/logo-header-compact.png',
  '/logo-footer-compact.png',
] as const;

type PdfLogoAsset = {
  path: string;
  dataUrl: string;
  format: 'PNG' | 'JPEG' | 'WEBP';
  width: number;
  height: number;
};

const mmToPt = (mm: number) => (mm * 72) / 25.4;
const PDF_LOGO_MAX_WIDTH_PT = mmToPt(34);
const PDF_LOGO_MAX_HEIGHT_PT = mmToPt(18);

let pdfLogoAssetPromise: Promise<PdfLogoAsset | null> | null = null;

const dataUrlToPdfFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
};

const resolveLogoFitSize = (
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  const safeWidth = Math.max(naturalWidth, 1);
  const safeHeight = Math.max(naturalHeight, 1);
  const aspectRatio = safeWidth / safeHeight;

  let finalWidth = Math.min(maxWidth, maxHeight * aspectRatio);
  let finalHeight = finalWidth / aspectRatio;
  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = finalHeight * aspectRatio;
  }

  return { width: finalWidth, height: finalHeight };
};

const readImageDataUrl = async (path: string): Promise<string | null> => {
  try {
    const response = await fetch(path, { cache: 'force-cache' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const readImageNaturalSize = async (
  dataUrl: string
): Promise<{ width: number; height: number } | null> => {
  try {
    const image = new Image();
    return await new Promise<{ width: number; height: number } | null>((resolve) => {
      image.onload = () =>
        resolve({
          width: image.naturalWidth || 0,
          height: image.naturalHeight || 0,
        });
      image.onerror = () => resolve(null);
      image.src = dataUrl;
    });
  } catch {
    return null;
  }
};

const getPdfLogoAsset = async (): Promise<PdfLogoAsset | null> => {
  if (pdfLogoAssetPromise) return pdfLogoAssetPromise;
  pdfLogoAssetPromise = (async () => {
    for (const path of PDF_LOGO_CANDIDATE_PATHS) {
      const dataUrl = await readImageDataUrl(path);
      if (!dataUrl) continue;
      const size = await readImageNaturalSize(dataUrl);
      if (!size || size.width <= 0 || size.height <= 0) continue;
      return {
        path,
        dataUrl,
        format: dataUrlToPdfFormat(dataUrl),
        width: size.width,
        height: size.height,
      };
    }
    return null;
  })();
  return pdfLogoAssetPromise;
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

const formatPdfMoney = (value: any) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Rs. 0';
  return `Rs. ${Math.round(num).toLocaleString('en-IN')}`;
};

const formatDateForFileName = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  if (!year || !month || !day) return date.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
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
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    if (/^\d{13}$/.test(text)) {
      const ms = Number(text);
      return Number.isFinite(ms) ? ms : null;
    }
    if (/^\d{10}$/.test(text)) {
      const seconds = Number(text);
      return Number.isFinite(seconds) ? seconds * 1000 : null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split('-').map(Number);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return Date.UTC(year, month - 1, day);
      }
    }
  }
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

const parseHHMM = (value?: string): { hh: number; mm: number } | null => {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return { hh, mm };
};

const extractSessionDocId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return '';
    if (text.includes('/')) {
      const parts = text.split('/').filter(Boolean);
      return String(parts[parts.length - 1] || '').trim();
    }
    return text;
  }
  if (typeof value === 'object') {
    const refId = String((value as any).id || '').trim();
    if (refId) return refId;
    const refPath = String((value as any).path || '').trim();
    if (refPath) {
      const parts = refPath.split('/').filter(Boolean);
      return String(parts[parts.length - 1] || '').trim();
    }
  }
  return '';
};

const resolveChargeSessionId = (charge: any): string => {
  const sessionCandidates = [
    charge?.sessionId,
    charge?.classSessionId,
    charge?.sessionRef,
    charge?.session,
    charge?.id,
  ];
  for (const candidate of sessionCandidates) {
    const id = extractSessionDocId(candidate);
    if (id) return id;
  }
  return '';
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

const formatWeekdayLabel = (value: any) => {
  const ms = toMillis(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
};

const formatDayMonthShort = (value: any) => {
  const ms = toMillis(value);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
};

const hasAnySourceToken = (value: unknown, tokens: string[]) => {
  const source = String(value || '').trim().toLowerCase();
  if (!source) return false;
  return tokens.some((token) => source.includes(token));
};

const formatStatusLabel = (value: any) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '—';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isSessionCompletedLike = (value: unknown): boolean => {
  const normalized = normalizeFinanceStatus(value);
  return (
    normalized === 'completed' ||
    normalized === 'present' ||
    normalized === 'late' ||
    normalized === 'attendance_marked' ||
    normalized === 'billable_completed'
  );
};

const isSessionRescheduledOrCancelled = (value: unknown): boolean => {
  const normalized = normalizeFinanceStatus(value);
  return (
    normalized.includes('reschedule') ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  );
};

const getIstTimePartsFromMs = (ms: number): { hour: number; minute: number } | null => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const hourText = parts.find((part) => part.type === 'hour')?.value;
  const minuteText = parts.find((part) => part.type === 'minute')?.value;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
};

const formatMinutesToLabel = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const resolveDateWithSource = (
  session: any,
  charge: any
): { ms: number; source: string } => {
  const candidates: Array<{ label: string; value: any }> = [
    { label: 'session.date', value: session?.date },
    { label: 'session.sessionDate', value: session?.sessionDate },
    { label: 'session.classDate', value: session?.classDate },
    { label: 'session.startAt', value: session?.startAt },
    { label: 'session.scheduledStartAt', value: session?.scheduledStartAt },
    { label: 'session.startTime', value: session?.startTime },
    { label: 'charge.date', value: charge?.date },
    { label: 'charge.sessionDate', value: charge?.sessionDate },
    { label: 'charge.classDate', value: charge?.classDate },
    { label: 'charge.startAt', value: charge?.startAt },
    { label: 'charge.scheduledStartAt', value: charge?.scheduledStartAt },
    { label: 'charge.startTime', value: charge?.startTime },
    { label: 'charge.createdAt', value: charge?.createdAt },
    { label: 'charge.updatedAt', value: charge?.updatedAt },
  ];
  for (const candidate of candidates) {
    if (
      typeof candidate.value === 'string' &&
      (candidate.label.endsWith('startTime') || candidate.label.endsWith('endTime'))
    ) {
      if (parseHHMM(candidate.value.trim())) continue;
    }
    const ms = toMillis(candidate.value);
    if (Number.isFinite(ms) && ms! > 0) return { ms: ms as number, source: candidate.label };
  }
  return { ms: 0, source: 'unresolved' };
};

const pickTimeValue = (
  candidates: Array<{ label: string; value: any }>
): { label: string; text: string; ms: number | null; minutes: number | null } => {
  for (const candidate of candidates) {
    if (candidate.value === null || candidate.value === undefined) continue;
    if (typeof candidate.value === 'string') {
      const text = candidate.value.trim();
      if (!text || /^\d{4}-\d{2}-\d{2}$/.test(text)) continue;
      const parsed = parseHHMM(text);
      if (parsed) {
        return {
          label: candidate.label,
          text: `${formatMinutesToLabel(parsed.hh * 60 + parsed.mm)}`,
          ms: null,
          minutes: parsed.hh * 60 + parsed.mm,
        };
      }
      return { label: candidate.label, text, ms: null, minutes: null };
    }
    const ms = toMillis(candidate.value);
    if (!Number.isFinite(ms) || ms! <= 0) continue;
    const parts = getIstTimePartsFromMs(ms as number);
    if (!parts) continue;
    return {
      label: candidate.label,
      text: formatMinutesToLabel(parts.hour * 60 + parts.minute),
      ms: ms as number,
      minutes: parts.hour * 60 + parts.minute,
    };
  }
  return { label: 'unresolved', text: '', ms: null, minutes: null };
};

const resolveSessionTimeLabel = (
  session: any,
  charge: any,
  dateSortValue: number
): { timeLabel: string; startDateTimeSortValue: number; rawTimeDebugSource: string } => {
  const start = pickTimeValue([
    { label: 'session.startAt', value: session?.startAt },
    { label: 'session.startTime', value: session?.startTime },
    { label: 'session.scheduledStartAt', value: session?.scheduledStartAt },
    { label: 'charge.startAt', value: charge?.startAt },
    { label: 'charge.startTime', value: charge?.startTime },
    { label: 'charge.scheduledStartAt', value: charge?.scheduledStartAt },
  ]);
  const end = pickTimeValue([
    { label: 'session.endAt', value: session?.endAt },
    { label: 'session.endTime', value: session?.endTime },
    { label: 'session.scheduledEndAt', value: session?.scheduledEndAt },
    { label: 'charge.endAt', value: charge?.endAt },
    { label: 'charge.endTime', value: charge?.endTime },
    { label: 'charge.scheduledEndAt', value: charge?.scheduledEndAt },
  ]);

  const startDateTimeSortValue =
    start.ms && start.ms > 0
      ? start.ms
      : dateSortValue > 0 && Number.isFinite(start.minutes)
        ? dateSortValue + Number(start.minutes) * 60 * 1000
        : dateSortValue;

  if (!start.text) {
    return {
      timeLabel: '—',
      startDateTimeSortValue,
      rawTimeDebugSource: 'unresolved',
    };
  }

  if (!end.text) {
    return {
      timeLabel: start.text,
      startDateTimeSortValue,
      rawTimeDebugSource: start.label,
    };
  }

  return {
    timeLabel: `${start.text} - ${end.text}`,
    startDateTimeSortValue,
    rawTimeDebugSource: `${start.label} + ${end.label}`,
  };
};

const resolveSessionType = (
  session: any,
  charge: any,
): { sessionTypeLabel: 'Regular' | 'Rescheduled' | 'Makeup' | 'One-off'; sessionTypeDetailLabel?: string } => {
  const sessionSource = String(
    session?.source || session?.sessionSource || session?.scheduleType || session?.sessionType || session?.type || ''
  )
    .trim()
    .toLowerCase();
  const chargeSource = String(charge?.source || '').trim().toLowerCase();
  const adHocType = String(session?.adHocType || charge?.adHocType || '').trim().toLowerCase();

  const hasMakeupMetadata =
    session?.isMakeup === true ||
    charge?.isMakeup === true ||
    Boolean(session?.makeupCreditId || session?.makeupForSessionId || charge?.makeupCreditId || charge?.makeupForSessionId) ||
    hasAnySourceToken(sessionSource, ['makeup']) ||
    hasAnySourceToken(chargeSource, ['makeup']);
  if (hasMakeupMetadata) return { sessionTypeLabel: 'Makeup' };

  const originalDateCandidate = [
    session?.rescheduledFromDate,
    session?.originalDate,
    session?.sourceSessionDate,
    charge?.rescheduledFromDate,
    charge?.originalDate,
    charge?.sourceSessionDate,
  ].find((value) => value !== null && value !== undefined && String(value).trim() !== '');
  let originalDateLabel = '';
  if (originalDateCandidate) {
    const weekday = formatWeekdayLabel(originalDateCandidate);
    const dayMonth = formatDayMonthShort(originalDateCandidate);
    if (weekday !== '—' && dayMonth) {
      originalDateLabel = `${weekday}, ${dayMonth}`;
    }
  }

  const hasRescheduleMetadata =
    session?.isRescheduled === true ||
    charge?.isRescheduled === true ||
    normalizeFinanceStatus(session?.status).includes('reschedule') ||
    Boolean(
      session?.rescheduled ||
      session?.rescheduledFrom ||
      session?.rescheduledFromDate ||
      session?.originalDate ||
      session?.originalSessionId ||
      session?.sourceSessionId ||
      charge?.rescheduled ||
      charge?.rescheduledFrom ||
      charge?.rescheduledFromDate ||
      charge?.originalDate ||
      charge?.originalSessionId ||
      charge?.sourceSessionId
    ) ||
    hasAnySourceToken(sessionSource, ['reschedule']) ||
    hasAnySourceToken(chargeSource, ['reschedule']);
  if (hasRescheduleMetadata) {
    return {
      sessionTypeLabel: 'Rescheduled',
      ...(originalDateLabel ? { sessionTypeDetailLabel: `from ${originalDateLabel}` } : {}),
    };
  }

  const hasOneOffMetadata =
    session?.isAdHoc === true ||
    charge?.isAdHoc === true ||
    session?.isOneOff === true ||
    charge?.isOneOff === true ||
    hasAnySourceToken(adHocType, ['one_off', 'adhoc', 'ad_hoc', 'extra']) ||
    hasAnySourceToken(sessionSource, ['one_off', 'adhoc', 'ad_hoc', 'manual_one_off', 'approved_request']) ||
    hasAnySourceToken(chargeSource, ['one_off', 'adhoc', 'ad_hoc', 'manual_one_off', 'approved_request']);
  if (hasOneOffMetadata) return { sessionTypeLabel: 'One-off' };

  return { sessionTypeLabel: 'Regular' };
};

const resolveParentDetailStatusLabel = (
  includeInTotals: boolean,
  session: any,
  charge: any
): string => {
  const sessionStatus = normalizeFinanceStatus(session?.status);
  if (isSessionCompletedLike(sessionStatus)) return 'Completed';
  if (isSessionRescheduledOrCancelled(sessionStatus)) return formatStatusLabel(sessionStatus);
  const chargeStatus = normalizeFinanceStatus(charge?.status);
  if (isSessionRescheduledOrCancelled(chargeStatus)) return formatStatusLabel(chargeStatus);
  if (includeInTotals) return 'Included in monthly charges';
  return chargeStatus ? formatStatusLabel(chargeStatus) : '—';
};

const monthKeyFromMsIST = (ms: number): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(ms));
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  if (!year || !month) return '';
  return `${year}-${month}`;
};

const monthLabelFromKey = (monthKey: string): string => {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey || 'Unknown month';
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const normalizeNameList = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

const walletTransactionTypeLabel = (value: any) => {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'topup') return 'Top-up';
  if (type === 'manual_adjustment') return 'Manual adjustment';
  if (type === 'opening_deficit') return 'Opening deficit';
  if (type === 'class_deduction') return 'Class deduction';
  if (type === 'refund') return 'Refund';
  return type ? type.replace(/_/g, ' ') : '—';
};

const resolveChargePaidAmount = (charge: any, amount: number) => {
  const paidRaw = Number(charge?.paidAmount ?? 0);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  const status = normalizeFinanceStatus(charge?.status);
  if (status === 'paid') return Math.max(amount, 0);
  return 0;
};

const parentPaymentStatusBadgeClassName = (statusLabel: ParentPaymentsReportingRow['statusLabel']) => {
  if (statusLabel === 'Paid' || statusLabel === 'Advance') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (statusLabel === 'Partial' || statusLabel === 'In Grace') {
    return 'bg-amber-100 text-amber-800';
  }
  if (statusLabel === 'Current') {
    return 'bg-slate-100 text-slate-700';
  }
  if (statusLabel === 'Overdue') {
    return 'bg-rose-100 text-rose-800';
  }
  if (statusLabel === 'Wallet only') {
    return 'bg-sky-100 text-sky-800';
  }
  return 'bg-slate-100 text-slate-700';
};

const followUpPrioritySortOrder: Record<ParentPaymentsReportingRow['followUpPriority'], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  None: 3,
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
  const [teacherMap, setTeacherMap] = useState<Record<string, string>>({});
  const [sessionMap, setSessionMap] = useState<Record<string, any>>({});
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [selectedWalletParentId, setSelectedWalletParentId] = useState<string>('');
  const [selectedWalletParentName, setSelectedWalletParentName] = useState<string>('');
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletSummariesByParent, setWalletSummariesByParent] = useState<ParentWalletSummaryMap>({});
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [monthlyReadModelsByParent, setMonthlyReadModelsByParent] = useState<
    Record<string, ParentMonthlyBillingReadModel | null>
  >({});
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
    useState<ReceiveParentPaymentAllocationMode>(DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE);
  const [receivePaymentRequestKey, setReceivePaymentRequestKey] = useState('');
  const [receivePaymentPreviewSaving, setReceivePaymentPreviewSaving] = useState(false);
  const [receivePaymentApplySaving, setReceivePaymentApplySaving] = useState(false);
  const [receivePaymentError, setReceivePaymentError] = useState('');
  const [receivePaymentResult, setReceivePaymentResult] =
    useState<ReceiveParentPaymentResult | null>(null);
  const [receivePaymentPreviewInput, setReceivePaymentPreviewInput] =
    useState<ReceiveParentPaymentPreviewInput | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceData, setInvoiceData] = useState<ParentInvoiceData | null>(null);
  const [invoicePdfSaving, setInvoicePdfSaving] = useState(false);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const parentIds = new Set<string>();
        const kidIds = new Set<string>();
        const courseIds = new Set<string>();
        const teacherIds = new Set<string>();
        const sessionIds = new Set<string>();

        charges.forEach((charge) => {
          const parentId = String(charge.parentId || '');
          if (parentId) parentIds.add(parentId);
          const kidId = String(charge.kidId || '');
          if (kidId) kidIds.add(kidId);
          const courseId = String(charge.courseId || '');
          if (courseId) courseIds.add(courseId);
          const teacherId = String(charge.teacherId || '');
          if (teacherId) teacherIds.add(teacherId);
          const sessionId = resolveChargeSessionId(charge);
          if (sessionId) sessionIds.add(sessionId);
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

        if (teacherIds.size === 0) {
          setTeacherMap({});
        } else {
          const nextTeacherMap: Record<string, string> = {};
          for (const chunk of chunkIds(Array.from(teacherIds))) {
            const snap = await getDocs(
              query(collection(db, 'users'), where(documentId(), 'in', chunk))
            );
            snap.docs.forEach((docSnap) => {
              const data = docSnap.data() as any;
              nextTeacherMap[docSnap.id] =
                String(data?.displayName || data?.name || data?.email || '').trim() || docSnap.id;
            });
          }
          setTeacherMap(nextTeacherMap);
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

  const monthlyChargeRows = useMemo(() => {
    const parentMap = new Map<string, MonthlyChargeRow>();

    const getEntry = (parentId: string) => {
      let entry = parentMap.get(parentId);
      if (!entry) {
        entry = {
          parentId,
          classCharges: 0,
          receiptMonthPaymentsReceived: 0,
          chargesCount: 0,
          settledFromCharges: 0,
          dueFromCharges: 0,
          parentName: '',
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
      const paidAmount = resolveChargePaidAmount(charge, amount);
      const entry = getEntry(parentId);
      entry.classCharges += amount;
      entry.chargesCount += 1;
      entry.settledFromCharges += paidAmount;
      entry.dueFromCharges += Math.max(amount - paidAmount, 0);
    });

    payments.forEach((payment) => {
      const parentId = String(payment.parentId || '');
      if (!parentId) return;
      const amountRaw = Number(payment.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const entry = getEntry(parentId);
      entry.receiptMonthPaymentsReceived += amount;
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

  const visibleParentIds = useMemo(
    () => monthlyChargeRows.map((row) => row.parentId),
    [monthlyChargeRows]
  );
  const visibleParentIdsKey = useMemo(() => visibleParentIds.join('|'), [visibleParentIds]);

  const walletParentOptions = useMemo(
    () =>
      monthlyChargeRows
        .map((row) => ({ parentId: row.parentId, parentName: row.parentName }))
        .sort((a, b) => a.parentName.localeCompare(b.parentName)),
    [monthlyChargeRows]
  );

  useEffect(() => {
    setWalletSummariesByParent({});
    if (visibleParentIds.length === 0) return;

    const unsubscribes = visibleParentIds.map((parentId) =>
      onSnapshot(
        doc(db, 'parentWallets', parentId),
        (snap) => {
          setWalletSummariesByParent((prev) => ({
            ...prev,
            [parentId]: snap.exists() ? (snap.data() as WalletSummary) : null,
          }));
        },
        (err) => {
          console.error('[ParentPayments] Failed to load row wallet summary', {
            parentId,
            error: err,
          });
          setWalletSummariesByParent((prev) => ({
            ...prev,
            [parentId]: null,
          }));
        }
      )
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [visibleParentIds, visibleParentIdsKey]);

  useEffect(() => {
    setMonthlyReadModelsByParent({});
    if (!selectedMonth || visibleParentIds.length === 0) return;

    const unsubscribes = visibleParentIds.map((parentId) =>
      onSnapshot(
        doc(db, 'parentMonthlyReadModels', parentId, 'months', selectedMonth),
        (snap) => {
          setMonthlyReadModelsByParent((prev) => ({
            ...prev,
            [parentId]: snap.exists() ? (snap.data() as ParentMonthlyBillingReadModel) : null,
          }));
        },
        (err) => {
          console.error('[ParentPayments] Failed to load monthly billing read model', {
            parentId,
            selectedMonth,
            error: err,
          });
          setMonthlyReadModelsByParent((prev) => ({
            ...prev,
            [parentId]: null,
          }));
        }
      )
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [selectedMonth, visibleParentIds, visibleParentIdsKey]);

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

  const classDetailsByParent = useMemo(() => {
    const result = new Map<
      string,
      {
        included: ParentInvoiceNormalizedRow[];
        excluded: ParentInvoiceNormalizedRow[];
        completedCount: number;
        totalClassCharges: number;
      }
    >();

    const ensureBucket = (parentId: string) => {
      let bucket = result.get(parentId);
      if (!bucket) {
        bucket = { included: [], excluded: [], completedCount: 0, totalClassCharges: 0 };
        result.set(parentId, bucket);
      }
      return bucket;
    };

    charges.forEach((charge) => {
      const parentId = String(charge.parentId || '').trim();
      if (!parentId) return;
      const amountRaw = Number(charge.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const chargeId = String(charge.id || '').trim();
      const sessionId = resolveChargeSessionId(charge);
      const session = sessionId ? sessionMap[sessionId] : undefined;
      const chargeStatus = normalizeFinanceStatus(charge.status);
      const includeInTotals = chargeStatus !== 'void' && amount > 0;

      const kidId = String(charge.kidId || session?.kidId || session?.studentId || '').trim();
      const courseId = String(charge.courseId || session?.courseId || '').trim();
      const teacherId = String(charge.teacherId || session?.teacherId || '').trim();
      const studentName = kidMap[kidId] || kidId || 'Unknown';
      const courseName = courseMap[courseId] || courseId || '—';
      const teacherName =
        teacherMap[teacherId] ||
        String(session?.teacherName || session?.teacherDisplayName || '').trim() ||
        teacherId ||
        '—';
      const { ms: dateSortValue, source: rawDateDebugSource } = resolveDateWithSource(session, charge);
      const { timeLabel, startDateTimeSortValue, rawTimeDebugSource } = resolveSessionTimeLabel(
        session,
        charge,
        dateSortValue,
      );
      const { sessionTypeLabel, sessionTypeDetailLabel } = resolveSessionType(session, charge);
      const statusLabel = resolveParentDetailStatusLabel(includeInTotals, session, charge);
      const monthFromCharge = String(charge?.monthKey || '').trim();
      const monthSortValue = dateSortValue > 0 ? dateSortValue : startDateTimeSortValue;
      const monthKey =
        (/^\d{4}-\d{2}$/.test(monthFromCharge) && monthFromCharge) ||
        (monthSortValue > 0 ? monthKeyFromMsIST(monthSortValue) : 'unknown');
      const sourceStatus = normalizeFinanceStatus(session?.status || charge?.status);
      const rawSessionStatus = String(session?.status || '').trim();

      const row: ParentInvoiceNormalizedRow = {
        stableKey: `${chargeId || 'charge'}_${sessionId || 'session'}_${parentId}`,
        sessionId,
        chargeId,
        monthKey,
        dateLabel: dateSortValue > 0 ? formatDateDisplay(dateSortValue) : '—',
        weekdayLabel: dateSortValue > 0 ? formatWeekdayLabel(dateSortValue) : '—',
        dateSortValue,
        timeLabel,
        startDateTimeSortValue,
        studentName,
        courseName,
        teacherName,
        sessionTypeLabel,
        ...(sessionTypeDetailLabel ? { sessionTypeDetailLabel } : {}),
        statusLabel,
        amount: Number.isFinite(amount) ? amount : 0,
        rawDateDebugSource,
        rawTimeDebugSource,
        sourceStatus,
        rawSessionStatus,
      };
      if (import.meta.env.DEV && row.timeLabel === '—') {
        console.debug('[ParentPayments] Time unresolved for included charge row', {
          parentId,
          chargeId,
          sessionId,
          rawDateDebugSource,
          rawTimeDebugSource,
        });
      }

      const bucket = ensureBucket(parentId);
      if (includeInTotals) {
        bucket.included.push(row);
        bucket.completedCount += 1;
        bucket.totalClassCharges += amount;
      } else {
        bucket.excluded.push(row);
      }
    });

    result.forEach((bucket, parentId) => {
      bucket.included.sort(
        (a, b) => b.startDateTimeSortValue - a.startDateTimeSortValue || a.stableKey.localeCompare(b.stableKey)
      );
      bucket.excluded.sort(
        (a, b) => b.startDateTimeSortValue - a.startDateTimeSortValue || a.stableKey.localeCompare(b.stableKey)
      );

      if (import.meta.env.DEV) {
        const groupedByStudentDate = new Map<string, ParentInvoiceNormalizedRow[]>();
        bucket.included.forEach((entry) => {
          const key = `${entry.studentName}__${entry.dateLabel}`;
          if (!groupedByStudentDate.has(key)) groupedByStudentDate.set(key, []);
          groupedByStudentDate.get(key)!.push(entry);
        });

        groupedByStudentDate.forEach((entries, studentDateKey) => {
          if (entries.length <= 1) return;
          console.info('Same-day multiple classes detected', {
            parentId,
            studentDateKey,
            rowCount: entries.length,
          });
          console.table(
            entries.map((entry) => ({
              dateLabel: entry.dateLabel,
              timeLabel: entry.timeLabel,
              studentName: entry.studentName,
              sessionId: entry.sessionId || '—',
              chargeId: entry.chargeId || '—',
              amount: entry.amount,
              statusLabel: entry.statusLabel,
              rawDateDebugSource: entry.rawDateDebugSource,
              rawTimeDebugSource: entry.rawTimeDebugSource,
            }))
          );

          const sessionCounts = new Map<string, number>();
          const chargeCounts = new Map<string, number>();
          entries.forEach((entry) => {
            if (entry.sessionId) {
              sessionCounts.set(entry.sessionId, (sessionCounts.get(entry.sessionId) || 0) + 1);
            }
            if (entry.chargeId) {
              chargeCounts.set(entry.chargeId, (chargeCounts.get(entry.chargeId) || 0) + 1);
            }
          });
          const repeatedSessionIds = Array.from(sessionCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([id]) => id);
          const repeatedChargeIds = Array.from(chargeCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([id]) => id);
          if (repeatedSessionIds.length > 0 || repeatedChargeIds.length > 0) {
            console.warn('Possible duplicate billing row detected.', {
              parentId,
              studentDateKey,
              repeatedSessionIds,
              repeatedChargeIds,
            });
          }
        });
      }
    });

    return result;
  }, [charges, sessionMap, kidMap, courseMap, teacherMap]);

  const tableRows = useMemo(() => {
    return monthlyChargeRows
      .map((row) => {
        const details = classDetailsByParent.get(row.parentId) || {
          included: [],
          excluded: [],
          completedCount: 0,
          totalClassCharges: 0,
        };
        const studentNames = normalizeNameList(
          [...details.included, ...details.excluded].map((entry) => entry.studentName)
        );
        const walletBalance = Number(walletSummariesByParent[row.parentId]?.currentBalance);
        return buildParentPaymentsReportingRow({
          parentId: row.parentId,
          parentName: row.parentName,
          studentNames,
          chargesCount: row.chargesCount,
          classCharges: row.classCharges,
          settledFromCharges: row.settledFromCharges,
          dueFromCharges: row.dueFromCharges,
          receiptMonthPaymentsReceived: row.receiptMonthPaymentsReceived,
          walletBalance: Number.isFinite(walletBalance) ? walletBalance : null,
          monthlyReadModel: monthlyReadModelsByParent[row.parentId] || null,
          selectedMonth,
        });
      })
      .sort((a, b) => {
        const priorityDiff =
          followUpPrioritySortOrder[a.followUpPriority] - followUpPrioritySortOrder[b.followUpPriority];
        if (priorityDiff !== 0) return priorityDiff;
        if (b.selectedMonthDue !== a.selectedMonthDue) return b.selectedMonthDue - a.selectedMonthDue;
        if (b.selectedMonthCharges !== a.selectedMonthCharges) {
          return b.selectedMonthCharges - a.selectedMonthCharges;
        }
        return a.parentName.localeCompare(b.parentName);
      });
  }, [
    classDetailsByParent,
    monthlyChargeRows,
    monthlyReadModelsByParent,
    selectedMonth,
    walletSummariesByParent,
  ]);

  const summaryCards = useMemo(() => buildParentPaymentsSummaryCards(tableRows), [tableRows]);

  const openWalletTopupModal = () => {
    if (!selectedWalletParentId) {
      window.alert('Select a parent first to add a manual advance wallet credit.');
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
      window.alert(
        'Manual advance wallet credit added. This credits the wallet only and does not settle older dues.'
      );
      setWalletTopupRequestKey('');
      setWalletTopupOpen(false);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to add manual advance wallet credit');
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
    setReceivePaymentAllocationMode(DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE);
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
    if (!isReceiveParentPaymentAllocationMode(allocationModeRaw)) {
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
      if (Number(result.unallocatedAmount ?? result.remainingUnapplied ?? 0) > 0) {
        window.alert(
          `Preview completed. Advance after FIFO settlement: ${formatMoney(
            result.unallocatedAmount ?? result.remainingUnapplied
          )}.`
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
      window.alert('Preview allocation first.');
      return;
    }

    if (!isSameReceiveParentPaymentPreviewInput(currentInput, receivePaymentPreviewInput)) {
      window.alert(RECEIVE_PARENT_PAYMENT_STALE_PREVIEW_MESSAGE);
      return;
    }

    const amountReceived = Number(receivePaymentResult.amountReceived ?? receivePaymentPreviewInput.amount);
    const allocatedAmount = Number(
      receivePaymentResult.allocatedAmount ?? receivePaymentResult.appliedToLegacy ?? 0
    );
    const advanceAmount = Number(
      receivePaymentResult.unallocatedAmount ??
        receivePaymentResult.advanceAmount ??
        receivePaymentResult.remainingUnapplied ??
        0
    );
    const confirmed = window.confirm(
      `You are about to receive ${formatMoney(amountReceived)}. Auto-applied to oldest dues: ${formatMoney(
        allocatedAmount
      )}. Advance wallet balance: ${formatMoney(advanceAmount)}.`
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
          `Auto-applied to oldest dues: ${formatMoney(
            result.allocatedAmount ?? result.appliedToLegacy
          )}`,
          `Advance wallet balance: ${formatMoney(
            result.unallocatedAmount ?? result.advanceAmount ?? result.remainingUnapplied
          )}`,
          `Wallet credited: ${formatMoney(result.amountReceived)}`,
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

  const openInvoiceModal = (row: { parentId: string; parentName: string }) => {
    const parentId = String(row.parentId || '').trim();
    if (!parentId) return;

    setInvoiceOpen(true);
    setInvoiceLoading(true);
    setInvoiceError('');
    setInvoiceData(null);

    try {
      const details = classDetailsByParent.get(parentId) || {
        included: [],
        excluded: [],
        completedCount: 0,
        totalClassCharges: 0,
      };
      const includedRows = [...details.included];
      const rows = [...includedRows]
        .sort(
          (a, b) =>
            a.startDateTimeSortValue - b.startDateTimeSortValue || a.stableKey.localeCompare(b.stableKey)
        );

      const monthBucket = new Map<string, ParentInvoiceNormalizedRow[]>();
      rows.forEach((rowItem) => {
        if (!monthBucket.has(rowItem.monthKey)) monthBucket.set(rowItem.monthKey, []);
        monthBucket.get(rowItem.monthKey)!.push(rowItem);
      });

      const monthSections: InvoiceMonthSection[] = Array.from(monthBucket.entries())
        .map(([monthKey, monthRows]) => ({
          monthKey,
          monthLabel: monthLabelFromKey(monthKey),
          rows: monthRows,
          monthClassCount: monthRows.length,
          monthTotalAmount: monthRows.reduce((sum, rowItem) => sum + rowItem.amount, 0),
        }))
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

      const totalClassCharges = rows.reduce((sum, rowItem) => sum + rowItem.amount, 0);
      const monthlyChargeRow = monthlyChargeRows.find((entry) => entry.parentId === parentId);
      const settlementSummary = resolveParentPaymentSettlementSummary({
        chargesCount: monthlyChargeRow?.chargesCount ?? rows.length,
        classCharges: monthlyChargeRow?.classCharges ?? totalClassCharges,
        settledFromCharges: monthlyChargeRow?.settledFromCharges ?? 0,
        dueFromCharges:
          monthlyChargeRow?.dueFromCharges ?? Math.max(totalClassCharges, 0),
        monthlyReadModel: monthlyReadModelsByParent[parentId] || null,
      });
      const sessionTypeBreakdown = rows.reduce(
        (acc, rowItem) => {
          if (rowItem.sessionTypeLabel === 'Regular') {
            acc.regular += 1;
          } else if (rowItem.sessionTypeLabel === 'One-off') {
            acc.oneOff += 1;
          } else {
            acc.rescheduledOrMakeup += 1;
          }
          return acc;
        },
        { regular: 0, rescheduledOrMakeup: 0, oneOff: 0 },
      );
      const parentName = row.parentName || fallbackParentLabel(parentId);

      setInvoiceData({
        parentId,
        parentName,
        generatedDateLabel: formatDateDisplay(new Date()),
        invoicePeriodLabel: monthLabelFromKey(selectedMonth),
        rows,
        monthSections,
        studentNames: normalizeNameList(rows.map((rowItem) => rowItem.studentName)),
        courseNames: normalizeNameList(rows.map((rowItem) => rowItem.courseName)),
        teacherNames: normalizeNameList(rows.map((rowItem) => rowItem.teacherName)),
        totalCompletedClasses: rows.length,
        totalClassCharges,
        selectedMonthSettledAmount: settlementSummary.selectedMonthSettled,
        selectedMonthDueAmount: settlementSummary.selectedMonthDue,
        settlementSourceLabel: settlementSummary.settlementSourceLabel,
        sessionTypeBreakdown,
      });
    } catch (err: any) {
      console.error('[ParentPayments] invoice build failed', {
        parentId,
        source: 'classDetailsByParent/payments',
        error: err,
      });
      setInvoiceError('Unable to load invoice preview right now.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!invoiceData || invoicePdfSaving) return;

    setInvoicePdfSaving(true);
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      const logoHeight = 26;
      const lineHeight = 11;
      const tableHeaderHeight = 20;
      const tablePaddingX = 3;
      const rowPaddingY = 4;
      const valueColWidth = 150;
      const detailLabelColWidth = 100;
      const detailValueColWidth = (contentWidth / 2) - detailLabelColWidth;
      const shouldShowStudentCourseContext =
        invoiceData.studentNames.length > 1 || invoiceData.courseNames.length > 1;
      const uniqueFeeValues = Array.from(
        new Set(
          invoiceData.rows
            .map((rowItem) => Number(rowItem.amount))
            .filter((value) => Number.isFinite(value))
            .map((value) => Math.round(value))
        )
      );
      const classFeePatternValue =
        uniqueFeeValues.length === 1
          ? formatPdfMoney(uniqueFeeValues[0])
          : uniqueFeeValues.length > 1
            ? 'Class fees vary by class'
            : '—';

      const tableColumns = [
        { key: 'date', label: 'Date', width: mmToPt(28) },
        { key: 'day', label: 'Day', width: mmToPt(14) },
        { key: 'time', label: 'Time', width: mmToPt(36) },
        { key: 'session', label: 'Session', width: mmToPt(42) },
        { key: 'status', label: 'Status', width: mmToPt(32) },
      ] as const;

      let y = margin;

      const ensureSpace = (needed: number, addTopGap = 0) => {
        if (addTopGap > 0) y += addTopGap;
        if (y + needed <= pageHeight - margin) return;
        pdf.addPage();
        y = margin;
      };

      const fitSingleLineText = (text: string, maxWidth: number) => {
        const normalized = String(text || '—');
        if (pdf.getTextWidth(normalized) <= maxWidth) return normalized;
        let current = normalized;
        while (current.length > 1 && pdf.getTextWidth(`${current}…`) > maxWidth) {
          current = current.slice(0, -1);
        }
        return `${current}…`;
      };

      const drawSingleLineText = (
        text: string,
        x: number,
        yTop: number,
        maxWidth: number,
        align: 'left' | 'right' = 'left',
      ) => {
        const fitted = fitSingleLineText(text, maxWidth);
        const textY = yTop + rowPaddingY + lineHeight;
        if (align === 'right') {
          pdf.text(fitted, x + maxWidth, textY, { align: 'right' });
        } else {
          pdf.text(fitted, x, textY);
        }
      };

      const drawKeyValueRow = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
        const startY = y;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(leftLabel, margin + 8, startY + 13);
        pdf.text(rightLabel, margin + contentWidth / 2 + 8, startY + 13);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const leftValueLines = pdf.splitTextToSize(leftValue || '—', detailValueColWidth - 10) as string[];
        const rightValueLines = pdf.splitTextToSize(rightValue || '—', detailValueColWidth - 10) as string[];
        const linesCount = Math.max(leftValueLines.length || 1, rightValueLines.length || 1);
        const rowHeight = Math.max(24, linesCount * lineHeight + 8);

        leftValueLines.forEach((line, idx) => {
          pdf.text(line, margin + 8 + detailLabelColWidth, startY + 13 + idx * lineHeight);
        });
        rightValueLines.forEach((line, idx) => {
          pdf.text(line, margin + contentWidth / 2 + 8 + detailLabelColWidth, startY + 13 + idx * lineHeight);
        });
        y += rowHeight;
      };

      const drawTableHeader = () => {
        pdf.setDrawColor(203, 213, 225);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, y, contentWidth, tableHeaderHeight, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        let x = margin;
        tableColumns.forEach((column) => {
          pdf.line(x, y, x, y + tableHeaderHeight);
          pdf.text(column.label, x + tablePaddingX, y + 13);
          x += column.width;
        });
        pdf.line(x, y, x, y + tableHeaderHeight);
        y += tableHeaderHeight;
      };

      const drawClassTableRow = (rowItem: ParentInvoiceNormalizedRow) => {
        const statusText = 'Completed';
        const sessionText = rowItem.sessionTypeLabel;
        const compactDateLabel =
          rowItem.dateSortValue > 0 ? formatDayMonthShort(rowItem.dateSortValue) : rowItem.dateLabel;
        const textByCol: Record<string, string> = {
          date: compactDateLabel,
          day: rowItem.weekdayLabel,
          time: rowItem.timeLabel,
          session: sessionText,
          status: statusText,
        };

        const rowHeight = rowPaddingY * 2 + lineHeight;

        ensureSpace(rowHeight);
        if (y === margin) {
          drawTableHeader();
        }

        let x = margin;
        pdf.setDrawColor(226, 232, 240);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        tableColumns.forEach((column) => {
          pdf.rect(x, y, column.width, rowHeight, 'S');
          drawSingleLineText(
            textByCol[column.key],
            x + tablePaddingX,
            y,
            column.width - tablePaddingX * 2,
            'left',
          );
          x += column.width;
        });
        y += rowHeight;
      };

      const logoAsset = await getPdfLogoAsset();
      const headerTop = y;
      let renderedLogoWidth = 0;
      let renderedLogoHeight = 0;

      if (logoAsset) {
        const fit = resolveLogoFitSize(
          logoAsset.width,
          logoAsset.height,
          PDF_LOGO_MAX_WIDTH_PT,
          PDF_LOGO_MAX_HEIGHT_PT,
        );
        renderedLogoWidth = fit.width;
        renderedLogoHeight = fit.height;
        try {
          const logoY = headerTop + Math.max((logoHeight - renderedLogoHeight) / 2, 0);
          pdf.addImage(logoAsset.dataUrl, logoAsset.format, margin, logoY, renderedLogoWidth, renderedLogoHeight);
        } catch (error) {
          console.warn('[ParentPayments] Failed to render PDF logo image', {
            path: logoAsset.path,
            error,
          });
          renderedLogoWidth = 0;
          renderedLogoHeight = 0;
        }
      }

      const leftTitleX = margin + (renderedLogoWidth > 0 ? renderedLogoWidth + 10 : 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Tiny Steps Learning', leftTitleX, headerTop + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text('Parent Invoice', leftTitleX, headerTop + 26);
      pdf.setFontSize(9);
      pdf.text(`Generated: ${invoiceData.generatedDateLabel}`, pageWidth - margin, headerTop + 12, {
        align: 'right',
      });
      pdf.text(`Invoice period: ${invoiceData.invoicePeriodLabel}`, pageWidth - margin, headerTop + 26, {
        align: 'right',
      });

      const headerHeight = Math.max(logoHeight, renderedLogoHeight, 30);
      y = headerTop + headerHeight + 14;

      ensureSpace(150);
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margin, y, contentWidth, 128, 'S');
      const detailsTop = y + 8;
      y = detailsTop;
      drawKeyValueRow('Parent', invoiceData.parentName, 'Generated date', invoiceData.generatedDateLabel);
      drawKeyValueRow('Students', invoiceData.studentNames.join(', ') || '—', 'Courses', invoiceData.courseNames.join(', ') || '—');
      drawKeyValueRow('Teachers', invoiceData.teacherNames.join(', ') || '—', 'Invoice type', 'Month-wise class invoice');
      drawKeyValueRow('Class fee', classFeePatternValue, 'Settlement source', invoiceData.settlementSourceLabel);
      y += 12;

      invoiceData.monthSections.forEach((section) => {
        ensureSpace(44, 4);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(section.monthLabel, margin, y + 12);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Completed classes: ${section.monthClassCount}`, margin, y + 26);
        pdf.text(`Month total: ${formatPdfMoney(section.monthTotalAmount)}`, pageWidth - margin, y + 26, {
          align: 'right',
        });
        y += 34;

        if (shouldShowStudentCourseContext) {
          const studentCoursePairs = normalizeNameList(
            section.rows.map((rowItem) => `${rowItem.studentName} — ${rowItem.courseName}`)
          );
          const contextLine = `Student/Course: ${studentCoursePairs.join('; ') || '—'}`;
          ensureSpace(14);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(fitSingleLineText(contextLine, contentWidth), margin, y + 10);
          pdf.setTextColor(15, 23, 42);
          y += 14;
        }

        if (section.rows.length === 0) {
          ensureSpace(22);
          pdf.setDrawColor(226, 232, 240);
          pdf.rect(margin, y, contentWidth, 20, 'S');
          pdf.setFontSize(8.5);
          pdf.text('No completed classes found for this month.', margin + 6, y + 13);
          y += 24;
          return;
        }

        drawTableHeader();
        section.rows.forEach((rowItem) => drawClassTableRow(rowItem));
        y += 8;
      });

      ensureSpace(120, 6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Final Summary', margin, y + 12);
      y += 18;

      const summaryRows: Array<{ label: string; value: string }> = [
        { label: 'Total completed classes', value: String(invoiceData.totalCompletedClasses) },
        { label: 'Total class charges', value: formatPdfMoney(invoiceData.totalClassCharges) },
        {
          label: 'Settled for selected month',
          value: formatPdfMoney(invoiceData.selectedMonthSettledAmount),
        },
        {
          label: 'Selected month due',
          value: formatPdfMoney(invoiceData.selectedMonthDueAmount),
        },
      ];
      if (invoiceData.sessionTypeBreakdown.regular > 0) {
        summaryRows.push({
          label: 'Regular classes',
          value: String(invoiceData.sessionTypeBreakdown.regular),
        });
      }
      if (invoiceData.sessionTypeBreakdown.rescheduledOrMakeup > 0) {
        summaryRows.push({
          label: 'Rescheduled / Makeup classes',
          value: String(invoiceData.sessionTypeBreakdown.rescheduledOrMakeup),
        });
      }
      if (invoiceData.sessionTypeBreakdown.oneOff > 0) {
        summaryRows.push({
          label: 'One-off / Extra classes',
          value: String(invoiceData.sessionTypeBreakdown.oneOff),
        });
      }

      const summaryRowHeight = 22;
      const summaryTableHeight = summaryRows.length * summaryRowHeight;
      ensureSpace(summaryTableHeight + 2);

      pdf.setDrawColor(203, 213, 225);
      summaryRows.forEach((row, idx) => {
        const rowY = y + idx * summaryRowHeight;
        if (idx % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, rowY, contentWidth, summaryRowHeight, 'F');
        }
        pdf.rect(margin, rowY, contentWidth, summaryRowHeight, 'S');
        pdf.line(pageWidth - margin - valueColWidth, rowY, pageWidth - margin - valueColWidth, rowY + summaryRowHeight);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.text(row.label, margin + 8, rowY + 14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(row.value, pageWidth - margin - 8, rowY + 14, { align: 'right' });
      });
      y += summaryTableHeight + 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Tiny Steps Learning · Admin Invoice Export', margin, pageHeight - margin + 6);

      const safeParent = invoiceData.parentName
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const generatedDate = formatDateForFileName(new Date());
      pdf.save(`tiny-steps-invoice-${safeParent || invoiceData.parentId}-${generatedDate}.pdf`);
    } catch (err) {
      console.error('[ParentPayments] Failed to generate invoice PDF', err);
    } finally {
      setInvoicePdfSaving(false);
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
  const receivePaymentWarnings = Array.isArray(receivePaymentResult?.warnings)
    ? receivePaymentResult.warnings
    : [];
  const receivePaymentAllocations = normalizeReceivePaymentAllocationRows(
    Array.isArray(receivePaymentResult?.allocationsPreview)
      ? receivePaymentResult?.allocationsPreview || []
      : Array.isArray(receivePaymentResult?.allocations)
        ? receivePaymentResult?.allocations || []
        : []
  );
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
            Selected-month billing status and till-date wallet position by parent.
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Selected-month billed</div>
          <div className="text-lg font-semibold">{formatMoney(summaryCards.selectedMonthBilled)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Selected-month settled / applied</div>
          <div className="text-lg font-semibold">
            {formatMoney(summaryCards.selectedMonthSettled)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Selected-month outstanding</div>
          <div className="text-lg font-semibold">
            {formatMoney(summaryCards.selectedMonthOutstanding)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Paid parents</div>
          <div className="text-lg font-semibold">{summaryCards.paidParents}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Partial parents</div>
          <div className="text-lg font-semibold">{summaryCards.partialParents}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Follow-up / overdue parents</div>
          <div className="text-lg font-semibold">{summaryCards.followUpParents}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total wallet deficit till date</div>
          <div className="text-lg font-semibold">
            {formatMoney(summaryCards.totalWalletDeficitTillDate)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total advance wallet balance</div>
          <div className="text-lg font-semibold">
            {formatMoney(summaryCards.totalAdvanceWalletBalance)}
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          Selected-month settlement is based on monthly allocation/read model data. Receipt-month
          payments are not treated as settlement unless they are allocated to charges.
        </p>
        <p className="text-xs text-muted-foreground">
          Overall wallet balance shows the till-date wallet position. Selected-month due shows the
          service-month charge status. Receipt-month payments remain informational only and do not
          mark a month as paid by themselves.
        </p>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Parent Wallet</h3>
            <p className="text-xs text-muted-foreground">
              View wallet balance, add manual advance credits, and review recent wallet
              transactions. Use Receive parent payment for normal receipts that should settle dues
              first.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={openWalletTopupModal}
              disabled={!selectedWalletParentId}
            >
              Manual advance wallet credit
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
        <h3 className="text-base font-semibold">Selected-month parent payment status</h3>
        <p className="text-xs text-muted-foreground">
          Read models are used when available. Otherwise, selected-month billed and due fall back to
          charge documents without treating receipt-month payments as settlement.
        </p>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Parent</th>
                <th className="p-2">Student(s)</th>
                <th className="p-2">Billed classes</th>
                <th className="p-2">Selected-month charges</th>
                <th className="p-2">Selected-month settled / applied</th>
                <th className="p-2">Selected-month due</th>
                <th className="p-2">Overall wallet balance</th>
                <th className="p-2">Advance</th>
                <th className="p-2">Status</th>
                <th className="p-2">Last payment date</th>
                <th className="p-2">Follow-up priority</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={12}>
                    No parent charges found for this month.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const isExpanded = expandedParents.has(row.parentId);
                  const details = classDetailsByParent.get(row.parentId) || {
                    included: [],
                    excluded: [],
                    completedCount: 0,
                    totalClassCharges: 0,
                  };
                  const hasWalletBalance = row.overallWalletBalance !== null;
                  const walletDescriptor = !hasWalletBalance
                    ? ''
                    : row.overallWalletBalance! < 0
                      ? `Deficit ${formatMoney(Math.abs(row.overallWalletBalance!))}`
                      : row.overallWalletBalance! > 0
                        ? `Advance ${formatMoney(row.overallWalletBalance!)}`
                        : 'Settled';
                  const studentNamesLabel =
                    row.studentNames.length > 0 ? row.studentNames.join(', ') : '—';
                  return (
                    <React.Fragment key={row.parentId}>
                      <tr className="border-b last:border-b-0">
                        <td className="p-2">{row.parentName}</td>
                        <td className="p-2">
                          <div className="max-w-[180px] truncate" title={studentNamesLabel}>
                            {studentNamesLabel}
                          </div>
                        </td>
                        <td className="p-2">{row.billedClasses}</td>
                        <td className="p-2">{formatMoney(row.selectedMonthCharges)}</td>
                        <td className="p-2">{formatMoney(row.selectedMonthSettled)}</td>
                        <td className="p-2">{formatMoney(row.selectedMonthDue)}</td>
                        <td className="p-2">
                          <div>{hasWalletBalance ? formatMoney(row.overallWalletBalance) : '—'}</div>
                          {walletDescriptor ? (
                            <div className="text-[11px] text-muted-foreground">{walletDescriptor}</div>
                          ) : null}
                        </td>
                        <td className="p-2">
                          {row.advanceAmount > 0 ? formatMoney(row.advanceAmount) : '—'}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${parentPaymentStatusBadgeClassName(row.statusLabel)}`}
                          >
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="p-2">
                          {row.lastPaymentAtMs ? formatDateDisplay(row.lastPaymentAtMs) : '—'}
                        </td>
                        <td className="p-2">{row.followUpPriority}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => openReceiveParentPaymentModal(row)}>
                              Receive parent payment
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openInvoiceModal(row)}>
                              View Invoice
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleParent(row.parentId)}
                            >
                              {isExpanded ? 'Hide details' : 'Details'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={12} className="p-2 bg-muted/30">
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
                                        <th className="p-2 whitespace-nowrap">Date</th>
                                        <th className="p-2 whitespace-nowrap">Day</th>
                                        <th className="p-2 whitespace-nowrap">Time</th>
                                        <th className="p-2 whitespace-nowrap">Student</th>
                                        <th className="p-2 whitespace-nowrap">Course</th>
                                        <th className="p-2 whitespace-nowrap">Session</th>
                                        <th className="p-2 whitespace-nowrap">Status</th>
                                        <th className="p-2 whitespace-nowrap">Class charge</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {details.included.map((entry) => (
                                        <tr key={entry.stableKey} className="border-b last:border-b-0">
                                          <td className="p-2 whitespace-nowrap">{entry.dateLabel}</td>
                                          <td className="p-2 whitespace-nowrap">{entry.weekdayLabel}</td>
                                          <td className="p-2 whitespace-nowrap">{entry.timeLabel}</td>
                                          <td className="p-2">
                                            <div className="max-w-[140px] truncate" title={entry.studentName}>
                                              {entry.studentName}
                                            </div>
                                          </td>
                                          <td className="p-2">
                                            <div className="max-w-[180px] truncate" title={entry.courseName}>
                                              {entry.courseName}
                                            </div>
                                          </td>
                                          <td className="p-2 whitespace-nowrap">
                                            <div
                                              className="max-w-[170px] truncate"
                                              title={
                                                entry.sessionTypeDetailLabel
                                                  ? `${entry.sessionTypeLabel} · ${entry.sessionTypeDetailLabel}`
                                                  : entry.sessionTypeLabel
                                              }
                                            >
                                              {entry.sessionTypeLabel}
                                            </div>
                                          </td>
                                          <td className="p-2 whitespace-nowrap">{entry.statusLabel}</td>
                                          <td className="p-2 whitespace-nowrap">{formatMoney(entry.amount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total completed classes: {details.completedCount} · Selected-month
                                  charges: {formatMoney(row.selectedMonthCharges)} · Selected-month
                                  settled / applied: {formatMoney(row.selectedMonthSettled)} ·
                                  Selected-month due: {formatMoney(row.selectedMonthDue)} · Receipt-month
                                  payments: {formatMoney(row.receiptMonthPaymentsReceived)} · Source:{' '}
                                  {row.settlementSourceLabel}
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
                                            <th className="p-2 whitespace-nowrap">Date</th>
                                            <th className="p-2 whitespace-nowrap">Day</th>
                                            <th className="p-2 whitespace-nowrap">Time</th>
                                            <th className="p-2 whitespace-nowrap">Student</th>
                                            <th className="p-2 whitespace-nowrap">Course</th>
                                            <th className="p-2 whitespace-nowrap">Session</th>
                                            <th className="p-2 whitespace-nowrap">Status</th>
                                            <th className="p-2 whitespace-nowrap">Class charge</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {details.excluded.map((entry) => (
                                            <tr key={`${entry.stableKey}_excluded`} className="border-b last:border-b-0">
                                              <td className="p-2 whitespace-nowrap">{entry.dateLabel}</td>
                                              <td className="p-2 whitespace-nowrap">{entry.weekdayLabel}</td>
                                              <td className="p-2 whitespace-nowrap">{entry.timeLabel}</td>
                                              <td className="p-2">
                                                <div className="max-w-[140px] truncate" title={entry.studentName}>
                                                  {entry.studentName}
                                                </div>
                                              </td>
                                              <td className="p-2">
                                                <div className="max-w-[180px] truncate" title={entry.courseName}>
                                                  {entry.courseName}
                                                </div>
                                              </td>
                                              <td className="p-2 whitespace-nowrap">
                                                <div
                                                  className="max-w-[170px] truncate"
                                                  title={
                                                    entry.sessionTypeDetailLabel
                                                      ? `${entry.sessionTypeLabel} · ${entry.sessionTypeDetailLabel}`
                                                      : entry.sessionTypeLabel
                                                  }
                                                >
                                                  {entry.sessionTypeLabel}
                                                </div>
                                              </td>
                                              <td className="p-2 whitespace-nowrap">{entry.statusLabel}</td>
                                              <td className="p-2 whitespace-nowrap">{formatMoney(entry.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      Excluded from completed-class totals unless already included by existing billing status rules.
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

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-[980px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent Invoice</DialogTitle>
          </DialogHeader>

          {invoiceLoading ? (
            <div className="text-sm text-muted-foreground">Loading invoice…</div>
          ) : invoiceError ? (
            <div className="text-sm text-red-600">{invoiceError}</div>
          ) : !invoiceData ? (
            <div className="text-sm text-muted-foreground">No invoice data found.</div>
          ) : (
            <div className="space-y-4">
              <Card className="p-4 space-y-1">
                <div className="text-lg font-semibold">Tiny Steps Learning</div>
                <div className="text-sm">Parent: {invoiceData.parentName}</div>
                <div className="text-sm">
                  Students: {invoiceData.studentNames.join(', ') || '—'}
                </div>
                <div className="text-sm">
                  Courses: {invoiceData.courseNames.join(', ') || '—'}
                </div>
                <div className="text-sm">
                  Teachers: {invoiceData.teacherNames.join(', ') || '—'}
                </div>
                <div className="text-sm">Completed classes: {invoiceData.rows.length}</div>
                <div className="text-xs text-muted-foreground">
                  Generated date: {invoiceData.generatedDateLabel}
                </div>
              </Card>

              {invoiceData.monthSections.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No completed classes found for this period.
                </div>
              ) : (
                invoiceData.monthSections.map((section) => (
                  <Card key={section.monthKey} className="p-3 space-y-2">
                    <div className="font-medium">{section.monthLabel}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-auto">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="p-2 whitespace-nowrap">Date</th>
                            <th className="p-2 whitespace-nowrap">Day</th>
                            <th className="p-2 whitespace-nowrap">Time</th>
                            <th className="p-2 whitespace-nowrap">Student</th>
                            <th className="p-2 whitespace-nowrap">Course</th>
                            <th className="p-2 whitespace-nowrap">Session</th>
                            <th className="p-2 whitespace-nowrap">Status</th>
                            <th className="p-2 whitespace-nowrap">Class fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((rowItem) => (
                            <tr key={rowItem.stableKey} className="border-b last:border-b-0">
                              <td className="p-2 whitespace-nowrap">{rowItem.dateLabel}</td>
                              <td className="p-2 whitespace-nowrap">{rowItem.weekdayLabel}</td>
                              <td className="p-2 whitespace-nowrap">{rowItem.timeLabel}</td>
                              <td className="p-2">
                                <div className="max-w-[160px] truncate" title={rowItem.studentName}>
                                  {rowItem.studentName}
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="max-w-[210px] truncate" title={rowItem.courseName}>
                                  {rowItem.courseName}
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div
                                  className="max-w-[170px] truncate"
                                  title={
                                    rowItem.sessionTypeDetailLabel
                                      ? `${rowItem.sessionTypeLabel} · ${rowItem.sessionTypeDetailLabel}`
                                      : rowItem.sessionTypeLabel
                                  }
                                >
                                  {rowItem.sessionTypeLabel}
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">{rowItem.statusLabel}</td>
                              <td className="p-2 whitespace-nowrap">{formatMoney(rowItem.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Month completed class count: {section.monthClassCount} · Month total amount:{' '}
                      {formatMoney(section.monthTotalAmount)}
                    </div>
                  </Card>
                ))
              )}

              <Card className="p-4 space-y-1">
                <div className="font-medium">Final Summary</div>
                <div className="text-sm">
                  Total completed classes: {invoiceData.totalCompletedClasses}
                </div>
                <div className="text-sm">
                  Total class charges: {formatMoney(invoiceData.totalClassCharges)}
                </div>
                <div className="text-sm">
                  Settled for selected month:{' '}
                  {formatMoney(invoiceData.selectedMonthSettledAmount)}
                </div>
                <div className="text-sm">
                  Selected month due: {formatMoney(invoiceData.selectedMonthDueAmount)}
                </div>
                <div className="text-sm">
                  Settlement source: {invoiceData.settlementSourceLabel}
                </div>
                {invoiceData.sessionTypeBreakdown.regular > 0 ? (
                  <div className="text-sm">
                    Regular classes: {invoiceData.sessionTypeBreakdown.regular}
                  </div>
                ) : null}
                {invoiceData.sessionTypeBreakdown.rescheduledOrMakeup > 0 ? (
                  <div className="text-sm">
                    Rescheduled / Makeup classes: {invoiceData.sessionTypeBreakdown.rescheduledOrMakeup}
                  </div>
                ) : null}
                {invoiceData.sessionTypeBreakdown.oneOff > 0 ? (
                  <div className="text-sm">
                    One-off / Extra classes: {invoiceData.sessionTypeBreakdown.oneOff}
                  </div>
                ) : null}
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleDownloadInvoicePdf}
              disabled={invoiceLoading || !invoiceData || invoicePdfSaving}
            >
              {invoicePdfSaving ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={walletTopupOpen} onOpenChange={setWalletTopupOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Manual advance wallet credit</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This credits the advance wallet only. It does not settle outstanding dues for the
              selected month. Use Receive parent payment for normal receipts so dues are applied
              FIFO first.
            </div>
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
              {walletTopupSaving ? 'Saving…' : 'Save advance wallet credit'}
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
              <Select
                value={receivePaymentAllocationMode}
                onValueChange={(value) =>
                  setReceivePaymentAllocationMode(
                    isReceiveParentPaymentAllocationMode(value)
                      ? value
                      : DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select receipt mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo_then_wallet">Auto-apply to oldest dues</SelectItem>
                  <SelectItem value="wallet_only">Advance wallet only</SelectItem>
                </SelectContent>
              </Select>
              {receivePaymentAllocationMode === 'wallet_only' ? (
                <div className="text-xs text-muted-foreground">
                  Entire receipt will be added as advance wallet balance. No billing charges will be
                  settled in this mode.
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  This payment will auto-clear oldest unpaid dues first. Any remaining amount
                  becomes advance wallet balance.
                </div>
              )}
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
                    Auto-applied to dues:{' '}
                    <span className="font-medium">
                      {formatMoney(
                        receivePaymentResult.allocatedAmount ?? receivePaymentResult.appliedToLegacy
                      )}
                    </span>
                  </div>
                  <div>
                    Advance wallet balance:{' '}
                    <span className="font-medium">
                      {formatMoney(
                        receivePaymentResult.unallocatedAmount ??
                          receivePaymentResult.advanceAmount ??
                          receivePaymentResult.remainingUnapplied
                      )}
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

                {Number(
                  receivePaymentResult.unallocatedAmount ??
                    receivePaymentResult.advanceAmount ??
                    receivePaymentResult.remainingUnapplied ??
                    0
                ) > 0 ? (
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                    Remaining amount after FIFO settlement will stay as advance wallet balance.
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
                  <div className="text-xs font-medium">FIFO allocation preview</div>
                  {receivePaymentAllocations.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No charge-level allocation rows returned.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-auto">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="p-1">Month</th>
                            <th className="p-1">Student / Date</th>
                            <th className="p-1">Charge</th>
                            <th className="p-1">Previous paid</th>
                            <th className="p-1">Allocation</th>
                            <th className="p-1">Remaining due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivePaymentAllocations.map((allocation, idx) => {
                            const studentOrDate = [allocation.studentName, allocation.eventDateKey]
                              .filter(Boolean)
                              .join(' · ');
                            return (
                              <tr
                                key={`${allocation.chargeId || 'allocation'}-${idx}`}
                                className="border-b last:border-b-0"
                              >
                                <td className="p-1">{allocation.monthKey || '—'}</td>
                                <td className="p-1">
                                  <div>{studentOrDate || '—'}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {allocation.chargeId || '—'}
                                  </div>
                                </td>
                                <td className="p-1">{formatMoney(allocation.chargeAmount)}</td>
                                <td className="p-1">
                                  {formatMoney(allocation.previousPaidAmount)}
                                </td>
                                <td className="p-1">
                                  {formatMoney(allocation.allocatedAmount)}
                                </td>
                                <td className="p-1">
                                  {formatMoney(allocation.remainingDueAfter)}
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
              {receivePaymentPreviewSaving ? 'Previewing…' : 'Preview allocation'}
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
