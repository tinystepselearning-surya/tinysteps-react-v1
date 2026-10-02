export function alreadyReviewedCurrentBilling(progress: Record<string, unknown>, fingerprint: string): boolean {
  return Boolean(progress.billingReviewedAt && progress.billingReviewedFingerprint === fingerprint);
}

export function alreadySentCurrentInvoice(progress: Record<string, unknown>, fingerprint: string): boolean {
  return Boolean(progress.invoiceSentAt && progress.sentBillingFingerprint === fingerprint);
}
