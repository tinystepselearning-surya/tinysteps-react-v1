export type ParentMonthlyBillingReadModel = {
  parentId?: string;
  monthKey?: string;
  schemaVersion?: number;
  modelType?: string;
  refreshedAt?: unknown;
  updatedAt?: unknown;
  generatedAtMs?: number;
  billedAmount?: number;
  billedClassCount?: number;
  settledAmount?: number;
  appliedAmount?: number;
  outstandingAmount?: number;
  dueAmount?: number;
  status?: string;
  lastSettlementAtMs?: number | null;
  lastPaymentAtMs?: number | null;
  lastPaymentId?: string | null;
  allocationRefs?: string[];
  chargeIds?: string[];
  totals?: {
    chargesCount?: number;
    billedAmount?: number;
    billedClassCount?: number;
    settledAmount?: number;
    appliedAmount?: number;
    paidAmountFromCharges?: number;
    outstandingAmount?: number;
    dueAmount?: number;
    paymentsCount?: number;
    paymentsTotal?: number;
    paymentsApplied?: number;
    paymentsUnapplied?: number;
    status?: string;
    lastSettlementAtMs?: number | null;
    lastPaymentAtMs?: number | null;
    lastPaymentId?: string | null;
    allocationRefs?: string[];
    chargeIds?: string[];
  };
  byKid?: Record<
    string,
    {
      kidId?: string;
      chargesCount?: number;
      billedAmount?: number;
      billedClassCount?: number;
      settledAmount?: number;
      appliedAmount?: number;
      paidAmountFromCharges?: number;
      outstandingAmount?: number;
      dueAmount?: number;
      paymentsCount?: number;
      paymentsTotal?: number;
      paymentsApplied?: number;
      paymentsUnapplied?: number;
      status?: string;
      lastSettlementAtMs?: number | null;
      lastPaymentAtMs?: number | null;
      lastPaymentId?: string | null;
      allocationRefs?: string[];
      chargeIds?: string[];
    }
  >;
};

export type ParentPaymentsReportingRowInput = {
  parentId: string;
  parentName: string;
  studentNames: string[];
  chargesCount: number;
  classCharges: number;
  settledFromCharges: number;
  dueFromCharges: number;
  receiptMonthPaymentsReceived: number;
  walletBalance: number | null;
  monthlyReadModel: ParentMonthlyBillingReadModel | null;
  selectedMonth: string;
  now?: Date;
};

export type ParentPaymentsStatusLabel =
  | 'Paid'
  | 'Partial'
  | 'Unpaid'
  | 'Current'
  | 'In Grace'
  | 'Overdue'
  | 'Advance'
  | 'Wallet only';

export type ParentPaymentsFollowUpPriority = 'None' | 'Low' | 'Medium' | 'High';

export type ParentPaymentsReportingRow = {
  parentId: string;
  parentName: string;
  studentNames: string[];
  billedClasses: number;
  selectedMonthCharges: number;
  selectedMonthSettled: number;
  selectedMonthDue: number;
  overallWalletBalance: number | null;
  advanceAmount: number;
  walletDeficitAmount: number;
  statusLabel: ParentPaymentsStatusLabel;
  followUpPriority: ParentPaymentsFollowUpPriority;
  lastPaymentAtMs: number | null;
  settlementSourceLabel: 'Monthly read model' | 'Charge docs fallback';
  receiptMonthPaymentsReceived: number;
  needsFollowUp: boolean;
};

export type ParentPaymentsSummaryCards = {
  selectedMonthBilled: number;
  selectedMonthSettled: number;
  selectedMonthOutstanding: number;
  paidParents: number;
  partialParents: number;
  followUpParents: number;
  totalWalletDeficitTillDate: number;
  totalAdvanceWalletBalance: number;
};

export type ParentPaymentSettlementSummaryInput = {
  chargesCount: number;
  classCharges: number;
  settledFromCharges: number;
  dueFromCharges: number;
  monthlyReadModel: ParentMonthlyBillingReadModel | null;
};

export type ParentPaymentSettlementSummary = {
  billedClasses: number;
  selectedMonthCharges: number;
  selectedMonthSettled: number;
  selectedMonthDue: number;
  settlementSourceLabel: 'Monthly read model' | 'Charge docs fallback';
  hasReadModel: boolean;
  readModelStatus: string | null;
  lastPaymentAtMs: number | null;
};

const EPSILON = 0.01;

const normalizeAmount = (value: unknown): number => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
};

const isMonthKeyLike = (value: string): boolean => /^\d{4}-\d{2}$/.test(value.trim());

const parseMonthKey = (value: string): { year: number; month: number } | null => {
  const trimmed = value.trim();
  if (!isMonthKeyLike(trimmed)) return null;
  const [yearText, monthText] = trimmed.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
};

const toMonthOrdinal = (value: string): number | null => {
  const parsed = parseMonthKey(value);
  if (!parsed) return null;
  return parsed.year * 12 + (parsed.month - 1);
};

const monthKeyFromDate = (date: Date): string => {
  const formatParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = formatParts.find((part) => part.type === 'year')?.value || '';
  const month = formatParts.find((part) => part.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
};

const resolveLastPaymentAtMs = (readModel: ParentMonthlyBillingReadModel | null): number | null => {
  const directTopLevel = Number(readModel?.lastSettlementAtMs ?? readModel?.lastPaymentAtMs);
  if (Number.isFinite(directTopLevel) && directTopLevel > 0) return directTopLevel;

  const directTotals = Number(
    readModel?.totals?.lastSettlementAtMs ?? readModel?.totals?.lastPaymentAtMs
  );
  if (Number.isFinite(directTotals) && directTotals > 0) return directTotals;

  if (!readModel?.byKid) return null;
  let latest: number | null = null;
  Object.values(readModel.byKid).forEach((row) => {
    const candidate = Number(row?.lastSettlementAtMs ?? row?.lastPaymentAtMs);
    if (!Number.isFinite(candidate) || candidate <= 0) return;
    if (!latest || candidate > latest) latest = candidate;
  });
  return latest;
};

const resolveReadModelMetrics = (
  readModel: ParentMonthlyBillingReadModel | null
): {
  billedClasses: number | null;
  billedAmount: number | null;
  settledAmount: number | null;
  dueAmount: number | null;
  lastPaymentAtMs: number | null;
  status: string | null;
} => {
  if (!readModel?.totals && readModel?.billedAmount == null && readModel?.dueAmount == null) {
    return {
      billedClasses: null,
      billedAmount: null,
      settledAmount: null,
      dueAmount: null,
      lastPaymentAtMs: null,
      status: null,
    };
  }

  return {
    billedClasses: Number.isFinite(Number(readModel?.billedClassCount ?? readModel?.totals?.billedClassCount))
      ? normalizeAmount(readModel?.billedClassCount ?? readModel?.totals?.billedClassCount)
      : Number.isFinite(Number(readModel?.totals?.chargesCount))
        ? normalizeAmount(readModel?.totals?.chargesCount)
      : null,
    billedAmount: Number.isFinite(Number(readModel?.billedAmount ?? readModel?.totals?.billedAmount))
      ? normalizeAmount(readModel?.billedAmount ?? readModel?.totals?.billedAmount)
      : null,
    settledAmount: Number.isFinite(
      Number(
        readModel?.settledAmount ??
          readModel?.appliedAmount ??
          readModel?.totals?.settledAmount ??
          readModel?.totals?.appliedAmount ??
          readModel?.totals?.paidAmountFromCharges
      )
    )
      ? normalizeAmount(
          readModel?.settledAmount ??
            readModel?.appliedAmount ??
            readModel?.totals?.settledAmount ??
            readModel?.totals?.appliedAmount ??
            readModel?.totals?.paidAmountFromCharges
        )
      : null,
    dueAmount: Number.isFinite(
      Number(
        readModel?.dueAmount ??
          readModel?.outstandingAmount ??
          readModel?.totals?.dueAmount ??
          readModel?.totals?.outstandingAmount
      )
    )
      ? normalizeAmount(
          readModel?.dueAmount ??
            readModel?.outstandingAmount ??
            readModel?.totals?.dueAmount ??
            readModel?.totals?.outstandingAmount
        )
      : null,
    lastPaymentAtMs: resolveLastPaymentAtMs(readModel),
    status: String(readModel?.status || readModel?.totals?.status || '').trim().toLowerCase() || null,
  };
};

const mapReadModelStatusLabel = (status: string | null): ParentPaymentsStatusLabel | null => {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  if (status === 'current') return 'Current';
  if (status === 'in_grace') return 'In Grace';
  if (status === 'overdue') return 'Overdue';
  if (status === 'advance') return 'Advance';
  if (status === 'unpaid') return 'Unpaid';
  return null;
};

export const resolveParentPaymentSettlementSummary = (
  input: ParentPaymentSettlementSummaryInput
): ParentPaymentSettlementSummary => {
  const readModelMetrics = resolveReadModelMetrics(input.monthlyReadModel);
  const hasReadModel =
    readModelMetrics.billedAmount !== null ||
    readModelMetrics.settledAmount !== null ||
    readModelMetrics.dueAmount !== null;

  const billedClasses = readModelMetrics.billedClasses ?? normalizeAmount(input.chargesCount);
  const selectedMonthCharges = readModelMetrics.billedAmount ?? normalizeAmount(input.classCharges);
  const selectedMonthSettled = Math.min(
    readModelMetrics.settledAmount ?? normalizeAmount(input.settledFromCharges),
    selectedMonthCharges
  );
  const selectedMonthDue = Math.min(
    Math.max(readModelMetrics.dueAmount ?? normalizeAmount(input.dueFromCharges), 0),
    selectedMonthCharges
  );

  return {
    billedClasses,
    selectedMonthCharges,
    selectedMonthSettled,
    selectedMonthDue,
    settlementSourceLabel: hasReadModel ? 'Monthly read model' : 'Charge docs fallback',
    hasReadModel,
    readModelStatus: readModelMetrics.status,
    lastPaymentAtMs: readModelMetrics.lastPaymentAtMs,
  };
};

const resolveFollowUpStatus = (
  selectedMonth: string,
  selectedMonthCharges: number,
  settledAmount: number,
  dueAmount: number,
  now: Date
): ParentPaymentsStatusLabel => {
  if (selectedMonthCharges <= EPSILON) {
    return 'Wallet only';
  }
  if (dueAmount <= EPSILON) return 'Paid';
  if (settledAmount > EPSILON) return 'Partial';

  const selectedOrdinal = toMonthOrdinal(selectedMonth);
  const currentOrdinal = toMonthOrdinal(monthKeyFromDate(now));
  if (selectedOrdinal == null || currentOrdinal == null) {
    return 'Unpaid';
  }
  if (selectedOrdinal <= currentOrdinal - 2) return 'Overdue';
  if (selectedOrdinal === currentOrdinal - 1) return 'In Grace';
  if (selectedOrdinal >= currentOrdinal) return 'Current';
  return 'Current';
};

const resolveFollowUpPriority = (
  statusLabel: ParentPaymentsStatusLabel,
  selectedMonth: string,
  now: Date
): ParentPaymentsFollowUpPriority => {
  if (statusLabel === 'Paid' || statusLabel === 'Advance') return 'None';
  if (statusLabel === 'Overdue') return 'High';
  if (statusLabel === 'Partial') {
    const selectedOrdinal = toMonthOrdinal(selectedMonth);
    const currentOrdinal = toMonthOrdinal(monthKeyFromDate(now));
    if (selectedOrdinal != null && currentOrdinal != null && selectedOrdinal <= currentOrdinal - 2) {
      return 'High';
    }
    return 'Medium';
  }
  if (statusLabel === 'In Grace' || statusLabel === 'Wallet only') return 'Medium';
  if (statusLabel === 'Current') return 'Low';
  return 'Low';
};

export const buildParentPaymentsReportingRow = (
  input: ParentPaymentsReportingRowInput
): ParentPaymentsReportingRow => {
  const now = input.now || new Date();
  const settlementSummary = resolveParentPaymentSettlementSummary({
    chargesCount: input.chargesCount,
    classCharges: input.classCharges,
    settledFromCharges: input.settledFromCharges,
    dueFromCharges: input.dueFromCharges,
    monthlyReadModel: input.monthlyReadModel,
  });
  const billedClasses =
    settlementSummary.hasReadModel && settlementSummary.billedClasses > 0
      ? settlementSummary.billedClasses
      : normalizeAmount(input.chargesCount);
  const selectedMonthCharges = settlementSummary.selectedMonthCharges;
  const selectedMonthSettled = settlementSummary.selectedMonthSettled;
  const selectedMonthDue = settlementSummary.selectedMonthDue;
  const overallWalletBalance =
    input.walletBalance == null || !Number.isFinite(Number(input.walletBalance))
      ? null
      : Number(input.walletBalance);
  const advanceAmount = overallWalletBalance && overallWalletBalance > EPSILON ? overallWalletBalance : 0;
  const walletDeficitAmount =
    overallWalletBalance && overallWalletBalance < -EPSILON ? Math.abs(overallWalletBalance) : 0;

  let statusLabel = resolveFollowUpStatus(
    input.selectedMonth,
    selectedMonthCharges,
    selectedMonthSettled,
    selectedMonthDue,
    now
  );
  const readModelStatusLabel = mapReadModelStatusLabel(settlementSummary.readModelStatus);
  if (
    readModelStatusLabel &&
    !(
      selectedMonthDue > EPSILON &&
      (readModelStatusLabel === 'Paid' || readModelStatusLabel === 'Advance')
    )
  ) {
    statusLabel = readModelStatusLabel;
  }
  if (selectedMonthCharges > EPSILON && selectedMonthDue <= EPSILON && advanceAmount > EPSILON) {
    statusLabel = 'Advance';
  }

  return {
    parentId: input.parentId,
    parentName: input.parentName,
    studentNames: input.studentNames,
    billedClasses,
    selectedMonthCharges,
    selectedMonthSettled,
    selectedMonthDue,
    overallWalletBalance,
    advanceAmount,
    walletDeficitAmount,
    statusLabel,
    followUpPriority: resolveFollowUpPriority(statusLabel, input.selectedMonth, now),
    lastPaymentAtMs: settlementSummary.lastPaymentAtMs,
    settlementSourceLabel: settlementSummary.settlementSourceLabel,
    receiptMonthPaymentsReceived: normalizeAmount(input.receiptMonthPaymentsReceived),
    needsFollowUp: selectedMonthCharges > EPSILON && selectedMonthDue > EPSILON,
  };
};

export const buildParentPaymentsSummaryCards = (
  rows: ParentPaymentsReportingRow[]
): ParentPaymentsSummaryCards => {
  return rows.reduce<ParentPaymentsSummaryCards>(
    (acc, row) => {
      acc.selectedMonthBilled += row.selectedMonthCharges;
      acc.selectedMonthSettled += row.selectedMonthSettled;
      acc.selectedMonthOutstanding += row.selectedMonthDue;

      if (row.selectedMonthCharges > EPSILON && row.statusLabel === 'Partial') {
        acc.partialParents += 1;
      }
      if (
        row.selectedMonthCharges > EPSILON &&
        (row.statusLabel === 'Paid' || row.statusLabel === 'Advance')
      ) {
        acc.paidParents += 1;
      }
      if (row.needsFollowUp) {
        acc.followUpParents += 1;
      }
      if (row.walletDeficitAmount > EPSILON) {
        acc.totalWalletDeficitTillDate += row.walletDeficitAmount;
      }
      if (row.advanceAmount > EPSILON) {
        acc.totalAdvanceWalletBalance += row.advanceAmount;
      }
      return acc;
    },
    {
      selectedMonthBilled: 0,
      selectedMonthSettled: 0,
      selectedMonthOutstanding: 0,
      paidParents: 0,
      partialParents: 0,
      followUpParents: 0,
      totalWalletDeficitTillDate: 0,
      totalAdvanceWalletBalance: 0,
    }
  );
};
