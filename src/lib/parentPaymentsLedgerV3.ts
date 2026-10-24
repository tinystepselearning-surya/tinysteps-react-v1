// Re-export the shared pure finance model from the backend source of truth.
// It performs no Firebase IO and can be safely imported by client-side views.
export {
  projectParentLedger,
  type LedgerReceiptKind,
  type LedgerChargeInput,
  type LedgerReceiptInput,
  type LedgerChargeResult,
  type LedgerMonthResult,
  type ParentLedgerResult,
} from '../../functions/src/parentLedgerProjectionV3';
