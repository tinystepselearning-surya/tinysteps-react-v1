import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  formatParentPaymentCurrency,
  type ParentWalletDisplayState,
} from "./parentPaymentsPresentation";

type VerifiedParentRate = {
  enrollmentId: string;
  courseLabel: string;
  amount: number;
  verified: true;
};

type ParentProfilePaymentsPanelProps = {
  walletState: ParentWalletDisplayState;
  paymentsTotal: number | null;
  paymentsScopeLabel: string;
  loading: boolean;
  lastUpdatedLabel: string | null;
  verifiedParentRates: VerifiedParentRate[];
  onOpenPayments: () => void;
};

export default function ParentProfilePaymentsPanel({
  walletState,
  paymentsTotal,
  paymentsScopeLabel,
  loading,
  lastUpdatedLabel,
  verifiedParentRates,
  onOpenPayments,
}: ParentProfilePaymentsPanelProps) {
  return (
    <Card className="rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Payments</div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">A concise account summary.</p>
        </div>
        <Button type="button" variant="outline" onClick={onOpenPayments} className="min-h-11 shrink-0 px-3">
          Open Payments
        </Button>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading profile payment summary" className="mt-4 grid grid-cols-2 gap-3">
          <span className="sr-only">Loading profile payment summary…</span>
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs text-slate-500">{walletState.label}</dt>
            <dd className="mt-1 break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
              {walletState.amountText || "Unavailable"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs text-slate-500">{paymentsScopeLabel}</dt>
            <dd className="mt-1 break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
              {paymentsTotal === null ? "Unavailable" : formatParentPaymentCurrency(paymentsTotal)}
            </dd>
          </div>
        </dl>
      )}

      {lastUpdatedLabel ? <p className="mt-3 text-xs text-slate-500">Updated {lastUpdatedLabel}</p> : null}

      {verifiedParentRates.length > 0 ? (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent class rates</p>
          <dl className="mt-2 space-y-2">
            {verifiedParentRates.map((rate) => (
              <div key={rate.enrollmentId} className="flex items-start justify-between gap-3 text-sm">
                <dt className="min-w-0 break-words text-slate-600 dark:text-slate-300">{rate.courseLabel}</dt>
                <dd className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                  {formatParentPaymentCurrency(rate.amount)} per class
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}
