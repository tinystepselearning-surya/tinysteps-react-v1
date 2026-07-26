export type ParentWalletDisplayKind =
  | "loading"
  | "error"
  | "unavailable"
  | "due"
  | "advance"
  | "settled";

export type ParentWalletDisplayState = {
  kind: ParentWalletDisplayKind;
  label: string;
  amount: number | null;
  amountText: string | null;
  description: string;
};

export type ParentClassChargeStatus = "unsettled" | "settled" | "reversed";

export type ParentClassChargeDisplay = {
  id: string;
  date: Date;
  childName: string;
  courseName?: string;
  amount: number;
  paidAmount: number;
  unsettledAmount: number;
  status: ParentClassChargeStatus;
  note?: string;
};

export type ParentPaymentDisplay = {
  id: string;
  date: Date;
  amount: number;
  method?: string;
  status?: string;
  reference?: string;
  note?: string;
};

export type ParentPaymentPeriodSummary = {
  classDeductions: number | null;
  paymentsRecorded: number | null;
  billedClassCount: number | null;
  settledClassCount: number | null;
  unsettledClassCount: number | null;
};

export type ParentClassChargeFilter = "all_classes" | "pending_payment" | "paid_classes";

export const formatParentPaymentCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

export function getParentWalletDisplayState(params: {
  balance: number | null;
  loading?: boolean;
  error?: boolean;
}): ParentWalletDisplayState {
  const { balance, loading = false, error = false } = params;
  if (loading) {
    return {
      kind: "loading",
      label: "Wallet loading",
      amount: null,
      amountText: null,
      description: "Loading the current wallet status.",
    };
  }
  if (error) {
    return {
      kind: "error",
      label: "Wallet unavailable",
      amount: null,
      amountText: null,
      description: "The current wallet status could not be loaded.",
    };
  }
  if (balance === null || !Number.isFinite(balance)) {
    return {
      kind: "unavailable",
      label: "Wallet unavailable",
      amount: null,
      amountText: null,
      description: "No current wallet balance is available.",
    };
  }
  if (balance < 0) {
    const dueAmount = Math.abs(balance);
    return {
      kind: "due",
      label: "Amount due",
      amount: dueAmount,
      amountText: formatParentPaymentCurrency(dueAmount),
      description: "This is the current amount to add to the wallet.",
    };
  }
  if (balance > 0) {
    return {
      kind: "advance",
      label: "Advance balance",
      amount: balance,
      amountText: formatParentPaymentCurrency(balance),
      description: "Future completed classes may reduce this wallet balance.",
    };
  }
  return {
    kind: "settled",
    label: "No amount due",
    amount: 0,
    amountText: formatParentPaymentCurrency(0),
    description: "The current wallet balance is settled.",
  };
}

export const formatParentPaymentMonth = (monthKey: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return monthKey;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export const filterParentClassCharges = (
  rows: ParentClassChargeDisplay[],
  filter: ParentClassChargeFilter,
): ParentClassChargeDisplay[] => {
  if (filter === "pending_payment") {
    return rows.filter((row) => row.status === "unsettled");
  }
  if (filter === "paid_classes") {
    return rows.filter((row) => row.status === "settled");
  }
  return rows;
};

export const parentClassChargeStatusLabel = (status: ParentClassChargeStatus): string => {
  if (status === "settled") return "Settled";
  if (status === "reversed") return "Reversed";
  return "Unsettled";
};

export const parentPaymentStatusLabel = (status?: string): string => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "Recorded";
  if (normalized === "paid" || normalized === "received" || normalized === "completed") {
    return "Recorded";
  }
  if (normalized === "pending" || normalized === "pending_verification") {
    return "Verification pending";
  }
  if (normalized === "failed") return "Not recorded";
  if (normalized === "reversed" || normalized === "refunded") return "Reversed";
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const resolveVerifiedParentRate = (
  enrollment: Record<string, unknown>,
): number | null => {
  const candidates = [
    enrollment.ratePerSession,
    enrollment.feePerSession,
    enrollment.feePerClass,
  ];
  for (const candidate of candidates) {
    const amount = Number(candidate);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return null;
};
