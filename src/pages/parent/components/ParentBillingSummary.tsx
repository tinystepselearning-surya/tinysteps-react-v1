import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParentBillingSummaryProps = {
  billingLoading: boolean;
  dueNowText: string;
  billedText: string;
  paidText: string;
  billingDetailText: string;
  onOpenPayments: () => void;
};

export default function ParentBillingSummary(props: ParentBillingSummaryProps) {
  const {
    billingLoading,
    dueNowText,
    billedText,
    paidText,
    billingDetailText,
    onOpenPayments,
  } = props;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Billing Snapshot</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Calm monthly summary without admin complexity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenPayments}>
          Open Payments
        </Button>
      </div>

      {billingLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Loading billing summary...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Due Now</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {dueNowText}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Billed</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {billedText}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Paid</div>
              <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {paidText}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            {billingDetailText}
          </div>
        </div>
      )}
    </Card>
  );
}
