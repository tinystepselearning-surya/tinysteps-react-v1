# Parent Payments V3 — Firestore Billing + Unified Receipt Ledger

Status: **Development foundation only**. This design is not deployed, migration-enabled or an instruction to modify production Firestore.

## Approved business decisions (19 October 2026)

1. **Firestore's existing class-based billing is authoritative.** Preserve each existing billable class, attendance basis, course, student, service date, existing charge identity, monthKey and billed amount. Never replace billing values with Google Sheet / CSV values.
2. **The future CSV provides receipts only.** Use the received amount and actual receipt date. Source/method and reference are optional. Do not trust or import Sheet Billed, Due, Total Billed, or calculated Paid/Due summary columns as canonical ledger values.
3. **One parent, one cumulative account.** Match the CSV to the canonical Firestore parent ID. Parent name, phone, and student name were exported from Firestore and should help reconcile identity, but are not unique keys. Prefer exported parent ID if supplied. Resolve multiple matches and ambiguous family identities manually rather than creating duplicate parents or guessing.
4. **Receipt allocation:** regular receipts apply to oldest eligible unpaid class charges first. Excess money becomes available advance. Explicit advance receipts are recorded as credit intended for future eligible charges. Future billed classes automatically consume available advance before becoming overdue.
5. **Historical payments are a one-time replacement**, not an additive merge. Back up/archival of old finance records is required, then activate the new receipt generation without double-counting legacy wallet balances/allocations.
6. **Parent statements:** cumulative monthly summary (course/classes/billed/applied/due), dated class rows and attendance/charges, dated receipts and credit balance. Teams data is optional and only displayed if verifiable. Devanshi Shree/Pooja Kumari's reviewed parent-oriented format is the reference.
7. **Not a payment-gateway project:** the operator records externally received money; there is no direct payment initiation requirement.

## Proven existing code dependencies

- UI: `src/pages/admin/ParentPayments.tsx`, `ParentPaymentsV2.tsx` and `ParentPaymentsLegacy.tsx`.
- Receipt write and FIFO: `functions/src/wallet.ts` (`adminReceiveParentPayment`), `functions/src/parentPaymentAllocator.ts`.
- Receipt writer currently updates `payments`, `payments/{id}/allocations`, `billingCharges.paidAmount`, `parentWallets` transactions and revenue rollups. This is why archiving `payments` alone is **not** an effective reset.
- Auto-debit trigger: `onBillingChargeWalletSync` in `functions/src/wallet.ts`.
- Parent and admin read paths: `src/pages/parent/ParentDashboard.tsx`, `src/pages/parent/components/payments/ParentPaymentsView.tsx`, `src/pages/admin/parentPaymentsReporting.ts` and parent monthly models/projections.
- Existing monthly PDF: `src/lib/parentMonthInvoice.ts` and admin `ParentPaymentsV2.tsx`; Parent Month Close has separate invoice handoff. These must converge on a shared future ledger snapshot.

## CSV interpretation and controls

Expected wide-sheet columns include parent name, phone, student names, individual monthly `<month> Paid`, and corresponding `<month> pmt dt` (exact headings to verify against supplied CSV later). Import one receipt for each non-zero monthly paid cell, using the corresponding **actual date**. The month in a header identifies the spreadsheet entry, NOT necessarily the billing month or actual receipt month.

Do **not** use the values in `<month> Billed`, `Total Billed`, `Total Paid`, `Total Due` to overwrite billing or as additional receipts.

The isolated `Advance` column may reflect money already counted in monthly paid entries. **Do not import it as another receipt unless its provenance, non-duplication, and received date have been verified.** Reject undated, zero, negative, non-numeric, duplicate or unmapped receipt rows into a review report. Do not silently invent dates. All monetary values are integer paise.

Data must stay out of GitHub commits: no real parent/child names, numbers or CSV contents in repository fixtures. Imports run through a controlled authenticated admin execution environment, with a dry-run report. An auditable import ledger records source fingerprint, row/column origin, unique transaction key, parent ID, amount, received date, receipt kind, importer identity and run ID.

## Cutover requirements (must all be met before any production writes)

1. Capture immutable versioned backups of old `payments`, payment allocation subcollections, `parentWallets` and subcollections, charge settlement fields, monthly read-model snapshots and affected aggregates. Produce record counts, parent totals, checksums and a restore procedure. **Do not delete the historic records.**
2. Route **all** payment writes and reads (admin, parent portal, legacy maintenance, month close, invoices, revenue/analytics as applicable) behind a consistent versioned ledger gate. Never allow new V3 receipts to be double-applied by older wallet automations. Retire old manual payment writers from normal use.
3. The V3 source of truth is immutable receipts plus payment allocations against existing Firestore billing charges. An idempotent allocator produces deterministic settlement; old settled fields and old wallet balances cannot leak into V3 presentation. Don't change any `billingCharges.amount` or attendance data. If settlement fields must be projected back for legacy interfaces, do so only via a reviewed and reversible compatibility projection.
4. Stage and preview matching and import for 100% of CSV receipt entries. Abort on ambiguous identity, duplicate receipt, missing date, mismatch or negative totals. No partial automatic acceptance of a mismatched parent group.
5. Run finance reconciliation, validate parent-by-parent totals, monthly amounts and conservation (`received = applied + available credit`), verify archive exclusion, and compare against invoice PDF and portal.
6. Establish restore and rollback checkpoints, approval, and support for live receipts entered during the migration window. A freeze or replay queue prevents losing new payments mid-cutover.
7. Enable V3 on production only when tests, emulator, security rules, rollout guard, and financial approval are complete.

## Current implementation in this branch

- `src/lib/parentPaymentsLedgerV3.ts`: isolated deterministic projection using **only** supplied Firestore charge amounts + new receipt entries, without Firestore I/O or mutations. Events are replayed in received/service date order, receipts settle oldest outstanding debt; advance remains for future eligible charges. It reports billed, received, allocated, advance, due, and grouped monthly values.
- `src/tests/lib/parentPaymentsLedgerV3.spec.ts`: FIFO, surplus, explicit advance, future charge settlement, excluded classes, as-of history, deterministic ordering, duplicate/invalid guards, integer-paise conservation.

These files are **foundation only**, not a replacement of the current production payment flow. More lifecycle cases (refunds, same-day billing conventions, reversed class charges, late attendance correction, disputed historic receipts, credit transfers) need explicit acceptance before activating this model.

## Delivery stages

- **Stage 1 — foundation**: contract, isolated calculation and tests (in this draft branch).
- **Stage 2 — new backend ledger:** admin-authorized immutable receipt write/reversal, versioned projections/reading endpoints, security, idempotency, advance settlement and bounded pagination.
- **Stage 3 — UI + invoices:** consolidated Sheets-like family balances, per-parent receipts and advance, PDF with month/class/attendance/receipt details, consistent parent portal / Parent Month Close.
- **Stage 4 — historical receipt migration:** CSV mapping, parent reconciliation, dry run and migration rehearsal in emulator/test project. Only after acceptance: backup and controlled production archive/cutover.
- **Stage 5 — release:** finance test cases, signed-off per-parent parity, cost/read regression check, staging verification, PR merge, controlled rollout and post-cutover alerts.

## Known reconciliation exception from 19 October screenshots

Spreadsheet displays Total Billed ₹1,340,148 and Total Paid ₹1,139,426, arithmetic difference ₹200,722; displayed Total Due ₹196,122. **₹4,600 discrepancy requires source-level reconciliation**, potentially due to advances/credits/negative dues; do not force figures to match. These screenshot numbers are not accepted as a live Firestore truth.

## Acceptance criteria

- Imported total billed is **always zero**; billed totals must equal Firestore class charges.
- Historical receipt import changes only the new payments/allocations/credits and their versioned projections, never original class charges.
- No legacy payment, wallet, or archive affects V3 financial totals twice.
- Every reported rupee can be traced to its class charge or actual receipt and date.
- Explicit advances and surplus amounts are visible and automatically applied when eligible later charges arise.
- Same account totals are displayed on admin table, parent portal and exported invoice.
- All removed/non-billable classes show ₹0 charge while preserving attendance source evidence.
- Future CSV import is previewed and reviewed before any production mutation.
