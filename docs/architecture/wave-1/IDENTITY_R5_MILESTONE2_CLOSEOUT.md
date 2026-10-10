# Wave 1 — R5 Milestone 2 final authorization closeout

**Scope:** Remaining legacy `ensureAdmin` requester authorization boundaries after Milestone 1. This document is the production evidence ledger for R5C2C33–R5C2C38, not a claim that all School OS identity readers or security rules have switched.

## Six bounded production deployments

| Slice | Authorization boundary | Pull request | Acceptance CI | Production CI | Verified Function roots |
|---|---|---|---|---|---|
| C33 | Parent payment dry-run audit | #691 | 38038798336 | 38039242562 | 2/2 |
| C34 | Teacher payouts, orphan earnings, certification, demo correction | #692 | 38039355014 | 38039489423 | 4/4 |
| C35 | Learning Partner assignment and Admin role change | #693 | 38039642887 | 38039760999 | 5/5 |
| C36 | Sessions Management, teacher-pay correction, payment write mode | #694 | 38040501680 | 38040636479 | 10/10 |
| C37 | Wallet and revenue | #695 | 38040503935 | 38040891677 | 16/16 |
| C38 | Legacy enrollment lifecycle and finite scheduler compatibility | #696 | 38040587015 | 38041278948 | 14/14 |

Production checkpoint marker after C38: `81af741aef78ea3d8e3cac66e548455ce3a9b43f`.
All deployments used bounded Function batches: **51 Function deployment-root operations across six batches** (not 51 unique Functions). No batch required a full Functions deployment, Hosting deployment, Firestore Rules update or index change.

## Migration coverage

- C33–C35: earlier production-verified Admin cutovers.
- C36–C38: **seven source modules and 34 legacy Admin guard call sites** migrated to `ensureCanonicalAdmin`.
- Across C33–C38: **44 legacy guard call sites** migrated (count of source authorization call sites, not distinct deployed Functions).
- Canonical requester authority is `authAccessReadModels/{firebaseUid}`, with inactive/missing principal and non-Admin roles denied. No fallback to `users/{uid}` or claims for requester Admin authorization.
- Historical `functions/src/helpers/adminGuard.ts` remains in source deliberately, but is no longer imported by production modules. Removing that helper is a separate deletion/retirement decision, not necessary for Milestone 2.
- The new permanent `canonicalAdminMilestone2Exit.spec.ts` inventories the entire `functions/src` tree, detects any reintroduced legacy Admin import/call, asserts all 34 C36–C38 guards and verifies the canonical guard authority.

## Read and business-behavior safety

Existing `ensureAdmin` performed one `users/{uid}` point read. `ensureCanonicalAdmin` performs one `authAccessReadModels/{uid}` point read. This replaces, rather than adds to, the per-guard point-read lookup. Delegated compatibility paths which already applied both wrapper and legacy guards continue to do two authorization checks; this migration does not add a third.

No scheduler generation, Teams links, class attendance billing, wallet transactions, teacher earnings, payouts, demo corrections, read-model building or Firestore query strategy was intentionally changed beyond requester Admin authorization. Parent-payment backfill's existing parent-scoped query read-cost concerns remain separate performance-hardening work.

## Independent exit verification

The source-code exit preflight workflow `38041348297` passed: source-import sweep, focused authorization tests, browser identity-hardening regression, complete Functions suite, TypeScript build, lint, and zero production deployment impact for the closeout/test changes.

**Formal ledger-inclusive Milestone-2 exit verdict: PASSED (2026-10-10).** Final workflow `38041660356` succeeded: six C33–C38 production records checkpoint-verified, permanent no-legacy-Admin guard sweep, focused and browser identity regressions, full Functions suite, TypeScript build, lint, and zero-deployment-impact classifier. Production marker remains `81af741aef78ea3d8e3cac66e548455ce3a9b43f`. No additional Functions, Hosting, Firestore Rules or indexes required by closeout. Milestone 2 is complete and the next independent work phase is Milestone 3 final system regression/verification; any global identity reader or rule cutover remains separately gated.

## Exclusions and transition

This milestone does not activate a global canonical identity reader switch, change Firestore or Storage Rules, delete historical compatibility documents, or certify all business workflows under live canaries. Those higher-level verification and eventual retirement decisions belong to the subsequent Milestone-3 review.
