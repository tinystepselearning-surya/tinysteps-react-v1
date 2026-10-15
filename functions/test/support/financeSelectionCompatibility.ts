/**
 * TEST-ONLY bridge: refuses to certify an audit selector when a complete
 * paginated source cannot demonstrably preserve the live legacy ordering.
 * Not imported by deployed Functions. No Firebase client, credentials or writes.
 */
import {evaluateComplete, type Result, type Collected} from './financeReadPagination';

export type SelectionIntent = {
  scope: 'named-parent' | 'global';
  parentId?: string;
  maxPayments: number;
};
export type SelectionPreview = {
  decision: 'COMPLETE_PREVIEW_ONLY' | 'INCOMPLETE_SOURCE' |
    'INCOMPLETE_SELECTION_LIMIT' | 'CONTRACT_DECISION_REQUIRED' | 'INVALID_SCOPE';
  reason: string;
  orderedPaymentIds: string[]; // Synthetic/offline only; never log production IDs.
  checkedRows: number;
  reportHash: null;
  writeAuthorized: false;
  billedReads: null;
};

function preview(decision: SelectionPreview['decision'], reason: string,
  orderedPaymentIds: string[] = [], checkedRows = 0): SelectionPreview {
  return {decision, reason, orderedPaymentIds, checkedRows,
    reportHash: null, writeAuthorized: false, billedReads: null};
}

/**
 * The live loader compares paidAt.toMillis() when it exists; a string or an
 * absent timestamp falls back to zero. The test-only SDK pinned adapter
 * serializes Timestamp fields into ISO strings, losing the ability to
 * distinguish Timestamp from a literal legacy string. A sort based only on
 * those strings is therefore NOT certified as compatible.
 *
 * Global mode is held separately: today it applies an unordered Firestore
 * server limit BEFORE the local paidAt sort, and choosing a globally oldest
 * payment is a business-contract change.
 */
export function previewSelectionWithoutWriteAuthority(
  completeSource: Result, intent: SelectionIntent,
): SelectionPreview {
  if (!intent || !Number.isSafeInteger(intent.maxPayments) ||
    intent.maxPayments < 1 || intent.maxPayments > 1000 ||
    (intent.scope !== 'named-parent' && intent.scope !== 'global')) {
    return preview('INVALID_SCOPE', 'invalid_selection_manifest');
  }
  if (intent.scope === 'global') {
    return preview('CONTRACT_DECISION_REQUIRED', 'global_prelimit_chronology_unapproved');
  }
  if (typeof intent.parentId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(intent.parentId)) {
    return preview('INVALID_SCOPE', 'invalid_parent_scope');
  }
  const inspected = evaluateComplete(completeSource, (records: Collected) => {
    const parentTables = records.filter(x => x.query.kind === 'payments');
    if (records.some(x => x.query.parent !== intent.parentId) ||
      parentTables.length !== 1 ||
      parentTables[0].query.parent !== intent.parentId) {
      return preview('INVALID_SCOPE', 'source_scope_does_not_match_manifest');
    }
    const payments = parentTables[0].rows;
    if (payments.length > intent.maxPayments) {
      return preview('INCOMPLETE_SELECTION_LIMIT', 'all_parent_payments_do_not_fit_approved_selection_limit',
        [], payments.length);
    }
    // Never pretend an adapter-normalized Timestamp string is a proven
    // legacy string or a proven Firestore Timestamp.
    if (payments.some(p => p.data.paidAt !== undefined && p.data.paidAt !== null)) {
      return preview('CONTRACT_DECISION_REQUIRED',
        'paidAt_sdk_type_provenance_lost_in_serialization', [], payments.length);
    }
    const ordered = [...payments].sort((a, b) => a.id.localeCompare(b.id));
    return preview('COMPLETE_PREVIEW_ONLY', 'entire_named_parent_scope_verified_no_date_field',
      ordered.map(x => x.id), payments.length);
  }, () => 'offline-private-preview-no-authorization');
  if (inspected.state !== 'COMPLETE' || !inspected.report) {
    return preview('INCOMPLETE_SOURCE', 'source_not_verified_complete');
  }
  return inspected.report;
}
