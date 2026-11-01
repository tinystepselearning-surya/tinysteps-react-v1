/**
 * ARG-2 aggregate-only acquisition projection. No PII leaves the Cloud Function.
 * The canonical Firestore backend owns the parent-phone + child-name identity.
 */
export type AcquisitionLeadCandidate = { id: string; data: Record<string, unknown> };

const CHANNELS = new Set([
  'google_organic', 'google_ads', 'bing_organic', 'microsoft_ads',
  'chatgpt', 'google_gemini', 'perplexity', 'microsoft_copilot',
  'claude', 'instagram', 'facebook', 'linkedin', 'youtube',
  'referral', 'direct', 'other',
]);

export function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const ts = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof ts.toMillis === 'function') return timestampMillis(ts.toMillis());
    if (typeof ts.seconds === 'number') {
      return timestampMillis(ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1_000_000));
    }
  }
  return 0;
}

function originalReceiptMillis(data: Record<string, unknown>): number {
  // Parent-child deduplication keeps the earliest inquiry on the canonical lead.
  for (const field of ['firstInquiryAt', 'receivedAtOriginal', 'receivedAt', 'requestedAt', 'createdAt']) {
    const ms = timestampMillis(data[field]);
    if (ms) return ms;
  }
  return 0;
}

function firstChannel(data: Record<string, unknown>): string {
  const nested = data.attribution && typeof data.attribution === 'object'
    ? data.attribution as Record<string, unknown>
    : {};
  const value = data.acquisitionChannel ?? nested.acquisitionChannel;
  return typeof value === 'string' && CHANNELS.has(value) ? value : 'unknown';
}

export function summarizeProspectiveLeadCandidates(
  candidates: AcquisitionLeadCandidate[],
  startInclusiveMs: number,
  endExclusiveMs: number,
): {
  newParentChildEnquiries: number;
  unresolvedCandidateRecords: number;
  channels: Record<string, number>;
  basis: 'first_observed_canonical_parent_child';
} {
  const seenIdentities = new Set<string>();
  const channels: Record<string, number> = {};
  let newParentChildEnquiries = 0;
  let unresolvedCandidateRecords = 0;

  // Bounded query results can overlap across timestamp fields; dedupe by document id.
  const byId = new Map<string, Record<string, unknown>>();
  for (const item of candidates) {
    if (item?.id && !byId.has(item.id)) byId.set(item.id, item.data || {});
  }
  for (const [id, row] of byId) {
    if (row.source !== 'website') continue;
    const firstAt = originalReceiptMillis(row);
    if (!firstAt || firstAt >= endExclusiveMs) {
      unresolvedCandidateRecords += 1;
      continue;
    }
    if (firstAt < startInclusiveMs) continue; // Known child before this period; not new.
    const identity = typeof row.dedupeIdentityKey === 'string' ? row.dedupeIdentityKey : '';
    const canonicalId = typeof row.dedupeCanonicalLeadId === 'string' ? row.dedupeCanonicalLeadId : '';
    if (!/^[a-f0-9]{64}$/.test(identity) || canonicalId !== id) {
      unresolvedCandidateRecords += 1;
      continue; // Pending canonicalization, invalid identity, or merge redirect.
    }
    if (seenIdentities.has(identity)) continue;
    seenIdentities.add(identity);
    newParentChildEnquiries += 1;
    const channel = firstChannel(row);
    channels[channel] = (channels[channel] || 0) + 1;
  }

  return {
    newParentChildEnquiries,
    unresolvedCandidateRecords,
    channels,
    basis: 'first_observed_canonical_parent_child',
  };
}
