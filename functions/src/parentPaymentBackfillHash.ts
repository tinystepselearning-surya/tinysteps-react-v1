import type {
  ParentPaymentBackfillAllocationRow,
  ParentPaymentBackfillAuditReport,
  ParentPaymentBackfillAuditWarning,
  ParentPaymentBackfillMonthSummary,
  ParentPaymentBackfillPaymentPreview,
  ParentPaymentBackfillParentReport,
} from './parentPaymentBackfillAudit';
import { createHash } from 'crypto';

function sortStrings(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function omitHashNoise<T extends Record<string, unknown>>(value: T): T {
  const out = { ...value };

  delete out.parentName;
  delete out.parentEmail;
  delete out.displayName;
  delete out.generatedAt;
  delete out.generatedAtMs;
  delete out.scannedAt;
  delete out.durationMs;
  delete out.startedAt;
  delete out.completedAt;
  delete out.updatedAt;
  delete out.refreshedAt;

  return out;
}

function normalizeWarningsForHash(warnings: ParentPaymentBackfillAuditWarning[]) {
  return [...warnings]
    .map((warning) => ({
      code: String(warning.code || '').trim(),
      message: String(warning.message || '').trim(),
    }))
    .sort(
      (left, right) =>
        left.code.localeCompare(right.code) || left.message.localeCompare(right.message)
    );
}

function normalizeAllocationRowsForHash(rows: ParentPaymentBackfillAllocationRow[]) {
  return [...rows]
    .map((row) => ({
      chargeId: row.chargeId,
      chargeMonthKey: row.chargeMonthKey,
      previousPaidAmount: row.previousPaidAmount,
      allocationAmount: row.allocationAmount,
      remainingDueAfter: row.remainingDueAfter,
    }))
    .sort(
      (left, right) =>
        left.chargeId.localeCompare(right.chargeId) ||
        String(left.chargeMonthKey || '').localeCompare(String(right.chargeMonthKey || '')) ||
        left.previousPaidAmount - right.previousPaidAmount ||
        left.allocationAmount - right.allocationAmount
    );
}

function normalizePaymentsForHash(payments: ParentPaymentBackfillPaymentPreview[]) {
  return [...payments]
    .map((payment) => ({
      paymentId: payment.paymentId,
      parentId: payment.parentId,
      paidAt: payment.paidAt,
      amount: payment.amount,
      classification: payment.classification,
      baseClassification: payment.baseClassification,
      existingAllocatedAmount: payment.existingAllocatedAmount,
      dryRunAllocatedAmount: payment.dryRunAllocatedAmount,
      dryRunAdvanceAmount: payment.dryRunAdvanceAmount,
      allocationRows: normalizeAllocationRowsForHash(payment.allocationRows || []),
      warnings: sortStrings(
        (payment.warnings || []).map((warning) => String(warning || '').trim()).filter(Boolean)
      ),
      duplicateSuspect: payment.duplicateSuspect === true,
    }))
    .sort((left, right) => left.paymentId.localeCompare(right.paymentId));
}

function normalizeMonthsForHash(months: ParentPaymentBackfillMonthSummary[]) {
  return [...months]
    .map((month) => ({
      monthKey: month.monthKey,
      billedAmount: month.billedAmount,
      existingSettledAmount: month.existingSettledAmount,
      existingDueAmount: month.existingDueAmount,
      dryRunSettledAmount: month.dryRunSettledAmount,
      dryRunDueAmount: month.dryRunDueAmount,
      deltaSettled: month.deltaSettled,
      deltaDue: month.deltaDue,
      statusBefore: month.statusBefore,
      statusAfterDryRun: month.statusAfterDryRun,
      paymentsThatWouldSettleThisMonth: sortStrings(month.paymentsThatWouldSettleThisMonth || []),
    }))
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey));
}

function normalizeParentsForHash(parents: ParentPaymentBackfillParentReport[]) {
  return [...parents]
    .map((parent) => {
      const summary = omitHashNoise(parent.summary);
      return {
        summary: {
          ...summary,
          monthsImpacted: sortStrings(parent.summary.monthsImpacted || []),
        },
        months: normalizeMonthsForHash(parent.months || []),
        payments: normalizePaymentsForHash(parent.payments || []),
        anomalies: normalizeWarningsForHash(parent.anomalies || []),
        drifts: parent.drifts,
      };
    })
    .sort((left, right) => left.summary.parentId.localeCompare(right.summary.parentId));
}

function normalizeReportForHash(report: ParentPaymentBackfillAuditReport) {
  return {
    mode: report.mode,
    dryRun: report.dryRun,
    filters: report.filters,
    totals: {
      ...report.totals,
      classificationCounts: Object.fromEntries(
        Object.entries(report.totals.classificationCounts || {}).sort(([left], [right]) =>
          left.localeCompare(right)
        )
      ),
    },
    parents: normalizeParentsForHash(report.parents || []),
  };
}

export function createParentPaymentBackfillReportHash(
  report: ParentPaymentBackfillAuditReport
): string {
  return createHash('sha256')
    .update(JSON.stringify(normalizeReportForHash(report)))
    .digest('hex');
}
