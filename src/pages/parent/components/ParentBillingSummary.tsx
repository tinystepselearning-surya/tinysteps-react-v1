import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentBillingSummaryProps = {
  billingLoading: boolean;
  dueNowText: string;
  billedText: string;
  paidText: string;
  deductionsLabel: string;
  paymentsLabel: string;
  billingDetailText: string;
  onOpenPayments: () => void;
};

export default function ParentBillingSummary({
  billingLoading,
  dueNowText,
  billedText,
  paidText,
  deductionsLabel,
  paymentsLabel,
  billingDetailText,
  onOpenPayments,
}: ParentBillingSummaryProps) {
  return (
    <Card className="rounded-[20px] border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">Wallet Summary</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Balance, class deductions and recorded payments.</p>
        </div>
        <Button variant="outline" onClick={onOpenPayments} className="min-h-11 shrink-0 px-3">
          Open Payments
        </Button>
      </div>

      {billingLoading ? (
        <div className="mt-4 space-y-3" aria-label="Loading wallet summary">
          <div className="h-8 w-40 rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">Wallet balance</p>
          <p className="mt-1 break-words text-2xl font-semibold text-slate-950 dark:text-slate-100">{dueNowText}</p>

          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-600 dark:text-slate-300">{deductionsLabel}</dt>
              <dd className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">{billedText}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-600 dark:text-slate-300">{paymentsLabel}</dt>
              <dd className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-100">{paidText}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{billingDetailText}</p>
        </div>
      )}
    </Card>
  );
}
