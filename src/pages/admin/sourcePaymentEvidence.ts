/**
 * Read-only, conservative source-to-payment evidence. No inferred phone/name
 * matching, historical repair or payment claims from admission status alone.
 * A positive result requires an explicit lead -> enrollment ID and a genuine
 * non-refunded billing charge with a positive allocated payment reference.
 */
export type PaymentEvidenceLead = {
  id: string;
  status?: string | null;
  source?: string | null;
  archived?: boolean;
  dedupeCanonicalLeadId?: string | null;
  dedupeConflict?: string | null;
  enrollmentId?: string | null;
  enrollmentIds?: unknown;
};

export type PaymentEvidenceCharge = {
  enrollmentId?: unknown;
  paymentIds?: unknown;
  lastPaymentId?: unknown;
  paidAmount?: unknown;
  status?: unknown;
  archived?: unknown;
};

export const MAX_PAYMENT_EVIDENCE_ENROLLMENTS = 30;

const validId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= 120 && !text.includes('/') ? text : null;
};
const enrolled = (lead: PaymentEvidenceLead): boolean =>
  String(lead.status || '').toLowerCase() === 'admitted_confirmed';
const countable = (lead: PaymentEvidenceLead): boolean =>
  !lead.archived && !String(lead.dedupeConflict || '').trim() &&
  (String(lead.source || '').toLowerCase() !== 'website' ||
    !lead.dedupeCanonicalLeadId || lead.dedupeCanonicalLeadId === lead.id);
const linkedIds = (lead: PaymentEvidenceLead): string[] =>
  Array.from(new Set([lead.enrollmentId, ...(Array.isArray(lead.enrollmentIds) ? lead.enrollmentIds : [])]
    .map(validId).filter((id): id is string => Boolean(id))));

export const linkedEnrolmentIdsForEvidence = (leads: PaymentEvidenceLead[]): string[] =>
  Array.from(new Set(leads.filter((lead) => enrolled(lead) && countable(lead)).flatMap(linkedIds))).sort();

const positivePayment = (charge: PaymentEvidenceCharge): boolean => {
  const status = String(charge.status || '').trim().toLowerCase();
  if (charge.archived === true || ['void', 'reversed', 'refunded', 'cancelled', 'canceled'].includes(status)) return false;
  if (typeof charge.paidAmount !== 'number' || !Number.isFinite(charge.paidAmount) || charge.paidAmount <= 0) return false;
  const hasPaymentId = (Array.isArray(charge.paymentIds) &&
    charge.paymentIds.some((id) => Boolean(validId(id)))) || Boolean(validId(charge.lastPaymentId));
  return hasPaymentId;
};

export type PaymentEvidenceResult = {
  admitted: number;
  confirmedPaid: number;
  unknown: number;
  unlinked: number;
  confirmedLeadIds: string[];
};

export const summarizeSourcePaymentEvidence = (
  leads: PaymentEvidenceLead[],
  charges: PaymentEvidenceCharge[],
): PaymentEvidenceResult => {
  const admissions = leads.filter((lead) => enrolled(lead) && countable(lead));
  const linkOwners = new Map<string, Set<string>>();
  admissions.forEach((lead) => linkedIds(lead).forEach((id) => {
    const owners = linkOwners.get(id) || new Set<string>();
    owners.add(lead.id);
    linkOwners.set(id, owners);
  }));
  const confirmedEnrolments = new Set<string>();
  charges.forEach((charge) => {
    const id = validId(charge.enrollmentId);
    if (id && linkOwners.get(id)?.size === 1 && positivePayment(charge)) confirmedEnrolments.add(id);
  });
  const confirmedLeadIds = Array.from(new Set(admissions
    .filter((lead) => linkedIds(lead).some((id) => confirmedEnrolments.has(id)))
    .map((lead) => lead.id)));
  return {
    admitted: admissions.length,
    confirmedPaid: confirmedLeadIds.length,
    unknown: admissions.length - confirmedLeadIds.length,
    unlinked: admissions.filter((lead) => linkedIds(lead).length === 0).length,
    confirmedLeadIds,
  };
};
