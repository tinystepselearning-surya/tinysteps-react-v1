import { CalendarDays, CircleAlert, Landmark, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  formatParentPaymentCurrency,
  formatParentPaymentMonth,
  parentClassChargeStatusLabel,
  parentPaymentStatusLabel,
  type ParentClassChargeDisplay,
  type ParentClassChargeFilter,
  type ParentPaymentDisplay,
  type ParentPaymentPeriodSummary,
  type ParentWalletDisplayState,
} from "./parentPaymentsPresentation";

type ParentPaymentsViewProps = {
  isNativeIOSApp: boolean;
  childName: string;
  walletState: ParentWalletDisplayState;
  walletLastUpdatedLabel: string | null;
  paymentOptionsAvailable: boolean;
  paymentAssistanceText: string;
  selectedMonth: string;
  summary: ParentPaymentPeriodSummary;
  summaryLoading: boolean;
  activityLoading: boolean;
  activityError: boolean;
  activityMode: "charges" | "payments";
  chargeFilter: ParentClassChargeFilter;
  chargeRows: ParentClassChargeDisplay[];
  chargeCounts: {
    all: number;
    unsettled: number;
    settled: number;
  } | null;
  paymentRows: ParentPaymentDisplay[];
  membership: {
    active: boolean;
    enrollmentDateLabel: string | null;
    startDateLabel: string | null;
    endDateLabel: string | null;
  };
  onOpenPaymentOptions: () => void;
  onViewClasses: () => void;
  onMonthChange: (monthKey: string) => void;
  onActivityModeChange: (mode: "charges" | "payments") => void;
  onChargeFilterChange: (filter: ParentClassChargeFilter) => void;
};

const walletToneClass: Record<ParentWalletDisplayState["kind"], string> = {
  loading: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  error: "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20",
  unavailable: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  due: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
  advance: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
  settled: "border-emerald-200 bg-white dark:border-emerald-900/60 dark:bg-slate-900",
};

function ParentWalletStatusCard({
  state,
  lastUpdatedLabel,
  paymentOptionsAvailable,
  paymentAssistanceText,
  onOpenPaymentOptions,
}: {
  state: ParentWalletDisplayState;
  lastUpdatedLabel: string | null;
  paymentOptionsAvailable: boolean;
  paymentAssistanceText: string;
  onOpenPaymentOptions: () => void;
}) {
  if (state.kind === "loading") {
    return (
      <section
        aria-label="Loading wallet status"
        role="status"
        className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <span className="sr-only">Loading wallet status…</span>
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-9 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full max-w-sm rounded bg-slate-100 dark:bg-slate-800" />
      </section>
    );
  }

  const isAlert = state.kind === "error";
  return (
    <section
      aria-labelledby="parent-wallet-status-title"
      role={isAlert ? "alert" : undefined}
      className={`rounded-[20px] border p-4 shadow-sm ${walletToneClass[state.kind]}`}
      data-wallet-state={state.kind}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100">
          {state.kind === "due" || state.kind === "error" ? (
            <CircleAlert className="h-5 w-5" aria-hidden="true" />
          ) : (
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p id="parent-wallet-status-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {state.label}
          </p>
          {state.amountText ? (
            <p className="mt-1 break-words text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {state.amountText}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{state.description}</p>
          {lastUpdatedLabel ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Updated {lastUpdatedLabel}</p>
          ) : null}
        </div>
      </div>

      {paymentOptionsAvailable ? (
        <Button
          type="button"
          onClick={onOpenPaymentOptions}
          className="mt-4 min-h-11 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
        >
          View payment options
        </Button>
      ) : (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white/70 px-3 py-3 text-sm leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          {paymentAssistanceText}
        </p>
      )}
    </section>
  );
}

const summaryValue = (value: number | null, currency = false): string =>
  value === null ? "Unavailable" : currency ? formatParentPaymentCurrency(value) : value.toLocaleString("en-IN");

function ParentPaymentSummary({
  monthLabel,
  summary,
  loading,
}: {
  monthLabel: string;
  summary: ParentPaymentPeriodSummary;
  loading: boolean;
}) {
  return (
    <section aria-labelledby="parent-payment-summary-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h2 id="parent-payment-summary-title" className="text-sm font-semibold text-slate-950 dark:text-slate-100">
          Recent activity · {monthLabel}
        </h2>
      </div>
      {loading ? (
        <div role="status" aria-label="Loading payment period summary" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          <span className="sr-only">Loading payment period summary…</span>
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot}>
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-2 h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <dt className="text-xs text-slate-500">Class deductions</dt>
            <dd className="mt-1 break-words text-base font-semibold text-slate-950 dark:text-slate-100">
              {summaryValue(summary.classDeductions, true)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Payments recorded</dt>
            <dd className="mt-1 break-words text-base font-semibold text-slate-950 dark:text-slate-100">
              {summaryValue(summary.paymentsRecorded, true)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Class charges</dt>
            <dd className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {summaryValue(summary.billedClassCount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Settled / unsettled</dt>
            <dd className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {summary.settledClassCount === null || summary.unsettledClassCount === null
                ? "Unavailable"
                : `${summary.settledClassCount} / ${summary.unsettledClassCount}`}
            </dd>
          </div>
        </dl>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Based on the recent wallet transactions currently available for the selected period.
      </p>
    </section>
  );
}

function ParentClassChargeRow({ row }: { row: ParentClassChargeDisplay }) {
  const statusLabel = parentClassChargeStatusLabel(row.status);
  return (
    <li
      data-charge-id={row.id}
      className="min-w-0 border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <time dateTime={row.date.toISOString()} className="text-xs font-medium text-slate-500">
            {row.date.toLocaleDateString("en-IN")}
          </time>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
            {[row.childName, row.courseName].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-semibold text-slate-950 dark:text-slate-50">
            {formatParentPaymentCurrency(row.amount)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{statusLabel}</p>
        </div>
      </div>
      {row.status === "unsettled" && row.unsettledAmount > 0 ? (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          Unsettled amount {formatParentPaymentCurrency(row.unsettledAmount)}
          {row.paidAmount > 0 ? ` · ${formatParentPaymentCurrency(row.paidAmount)} applied` : ""}
        </p>
      ) : null}
      {row.note ? <p className="mt-2 break-words text-xs text-slate-500">{row.note}</p> : null}
    </li>
  );
}

function ParentPaymentTransactionRow({ row }: { row: ParentPaymentDisplay }) {
  return (
    <li
      data-payment-id={row.id}
      className="min-w-0 border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <time dateTime={row.date.toISOString()} className="text-xs font-medium text-slate-500">
            Recorded {row.date.toLocaleDateString("en-IN")}
          </time>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
            {row.method || "Payment recorded"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-semibold text-slate-950 dark:text-slate-50">
            {formatParentPaymentCurrency(row.amount)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {parentPaymentStatusLabel(row.status)}
          </p>
        </div>
      </div>
      {row.reference ? (
        <p className="mt-2 break-all text-xs text-slate-500" title={row.reference}>
          Reference: {row.reference}
        </p>
      ) : null}
      {row.note ? <p className="mt-2 break-words text-xs text-slate-500">{row.note}</p> : null}
    </li>
  );
}

export default function ParentPaymentsView({
  isNativeIOSApp,
  childName,
  walletState,
  walletLastUpdatedLabel,
  paymentOptionsAvailable,
  paymentAssistanceText,
  selectedMonth,
  summary,
  summaryLoading,
  activityLoading,
  activityError,
  activityMode,
  chargeFilter,
  chargeRows,
  chargeCounts,
  paymentRows,
  membership,
  onOpenPaymentOptions,
  onViewClasses,
  onMonthChange,
  onActivityModeChange,
  onChargeFilterChange,
}: ParentPaymentsViewProps) {
  const monthLabel = formatParentPaymentMonth(selectedMonth);
  const emptyChargeCopy =
    chargeFilter === "pending_payment"
      ? `No unsettled class charges in ${monthLabel}.`
      : chargeFilter === "paid_classes"
        ? `No settled class charges in ${monthLabel}.`
        : `No class charges in ${monthLabel}.`;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-2" data-testid="parent-payments-view">
      <header className={isNativeIOSApp ? "sr-only" : ""}>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Payments</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Wallet status, class deductions and recorded payments for {childName}.
        </p>
      </header>

      <ParentWalletStatusCard
        state={walletState}
        lastUpdatedLabel={walletLastUpdatedLabel}
        paymentOptionsAvailable={paymentOptionsAvailable}
        paymentAssistanceText={paymentAssistanceText}
        onOpenPaymentOptions={onOpenPaymentOptions}
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="parent-payment-month" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Activity period
          </label>
          <input
            id="parent-payment-month"
            aria-label="Payment activity month"
            type="month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{monthLabel}</p>
          <p className="mt-1 text-xs text-slate-500">Wallet activity is available from May 2026.</p>
        </div>
        <ParentPaymentSummary monthLabel={monthLabel} summary={summary} loading={summaryLoading} />
      </div>

      <section aria-labelledby="parent-payment-activity-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="parent-payment-activity-title" className="text-base font-semibold text-slate-950 dark:text-slate-100">
              Payment activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">{monthLabel}</p>
          </div>
          <Button type="button" variant="outline" onClick={onViewClasses} className="min-h-11 shrink-0 px-3">
            View classes
          </Button>
        </div>

        <div role="tablist" aria-label="Payment activity type" className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            role="tab"
            aria-selected={activityMode === "charges"}
            onClick={() => onActivityModeChange("charges")}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 aria-selected:bg-white aria-selected:text-slate-950 aria-selected:shadow-sm dark:text-slate-300 dark:aria-selected:bg-slate-900 dark:aria-selected:text-slate-100"
          >
            Class charges
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activityMode === "payments"}
            onClick={() => onActivityModeChange("payments")}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 aria-selected:bg-white aria-selected:text-slate-950 aria-selected:shadow-sm dark:text-slate-300 dark:aria-selected:bg-slate-900 dark:aria-selected:text-slate-100"
          >
            Payments
          </button>
        </div>

        {activityMode === "charges" ? (
          <div role="tabpanel" className="mt-4">
            <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" aria-label="Class charge filters">
              {([
                ["all_classes", "All", chargeCounts?.all],
                ["pending_payment", "Unsettled", chargeCounts?.unsettled],
                ["paid_classes", "Settled", chargeCounts?.settled],
              ] as const).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={chargeFilter === id}
                  onClick={() => onChargeFilterChange(id)}
                  className="min-h-11 shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 aria-pressed:border-slate-950 aria-pressed:bg-slate-950 aria-pressed:text-white dark:border-slate-700 dark:text-slate-300 dark:aria-pressed:border-slate-100 dark:aria-pressed:bg-slate-100 dark:aria-pressed:text-slate-950"
                >
                  {label}{count === undefined ? "" : ` ${count}`}
                </button>
              ))}
            </div>
            {activityLoading ? (
              <div role="status" aria-label="Loading class charges" className="mt-3 space-y-3">
                <span className="sr-only">Loading class charges…</span>
                {[0, 1, 2].map((slot) => <div key={slot} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />)}
              </div>
            ) : activityError ? (
              <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">Class charges could not be loaded.</p>
            ) : chargeRows.length === 0 ? (
              <p role="status" className="mt-4 text-sm text-slate-600 dark:text-slate-300">{emptyChargeCopy}</p>
            ) : (
              <ul className="mt-2">
                {chargeRows.map((row) => <ParentClassChargeRow key={row.id} row={row} />)}
              </ul>
            )}
          </div>
        ) : (
          <div role="tabpanel" className="mt-4">
            {activityLoading ? (
              <div role="status" aria-label="Loading recorded payments" className="space-y-3">
                <span className="sr-only">Loading recorded payments…</span>
                {[0, 1, 2].map((slot) => <div key={slot} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />)}
              </div>
            ) : activityError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">Recorded payments could not be loaded.</p>
            ) : paymentRows.length === 0 ? (
              <p role="status" className="text-sm text-slate-600 dark:text-slate-300">No payment records in {monthLabel}.</p>
            ) : (
              <ul>
                {paymentRows.map((row) => <ParentPaymentTransactionRow key={row.id} row={row} />)}
              </ul>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="parent-membership-context-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h2 id="parent-membership-context-title" className="text-sm font-semibold text-slate-950 dark:text-slate-100">Account context</h2>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Class enrolment</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{membership.active ? "Active" : "Inactive"}</span>
        </div>
        <dl className="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {[
            ["Enrolled", membership.enrollmentDateLabel],
            ["Started", membership.startDateLabel],
            ["Ends", membership.endDateLabel],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">{value || "Unavailable"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
