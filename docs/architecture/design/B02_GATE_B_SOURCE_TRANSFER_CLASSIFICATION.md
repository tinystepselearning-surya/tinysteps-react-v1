# B02 Gate B — source transfer and computed-path classification progress

27 November 2026 IST. Owner authorized continued compatibility closure and dormant adoption subject to the mandatory compatibility gate. This evidence supplements B02_GATE_B_COMPATIBILITY_CLOSURE.md; it does not supersede its HOLD for adoption.

## Exact inputs

- Uploaded archive SHA-256 34fffd2a22b34b130dde63e63e0fed56f928b35d4c8d331fd5b0f028ecacfda2 matched owner-local output; ZIP CRC test passed.
- Manifest current-main 6b289bf1bd30c151328f2582bdec1b31e6f2d977 (3419 tracked, 2521 included); candidate 7e48ec8f811b3102f247195a0f8639cd3bf9f872 (3551 tracked, 2587 included). 2645 unique included blobs, 25754578 bytes. Included paths extracted separately and each referenced blob verified by Git blob hash.
- GitHub compare to main returned identical at inspection. PR head 2daa722bb74653a5be454bb5e1ed36e27901e1fb remained draft/open. Compare from tested 7ba5fd1735cc8ffac0663781feaef97392efc65f to that head contained only two evidence documents and collector. Prior 62/62 offline plus 1/1 local actual-adapter owner evidence retained.
- No credentials, production data or repository source execution beyond focused pure registry validation. No backend rerun.

## Additional inspection performed

TypeScript compiler parser traversed included JS/TS source (including JSX/TSX). Inventory of syntactic call expressions named collection, collectionGroup, doc, document, listCollections, listDocuments, recursiveDelete: 3321 main / 3333 candidate. Nonliteral apparent collection/collectionGroup/document argument expressions: 160 / 167, respectively. Nonliteral apparent doc arguments: 1058 / 1054. These are triage counts, NOT confirmed dynamic Firestore root counts: chained doc IDs, tests, local functions and alternate calling signatures are included; aliases, other languages, REST and computed member accesses require separate disposition. No case-insensitive tsosV2 fragment found in included main files; candidate matches limited to 8 architecture/verification/registry paths. This does not cover excluded source-like artifacts or dynamically assembled names.

| Source area | Observed disposition |
|---|---|
| firestore.rules | Recursive wildcard matches for earnings, months, sessionRequests; nested recursive wildcard under adminStats/{docId}. None overlaps the nine V2 root names as top-level collections. No live Rules proof. |
| Collection-group calls | Observed groups progress, students, months, earnings, sessionRequests, inquiries, gameSessions; none names a V2 root. |
| functions/src/businessAnalytics/business-analytics-refresh-store.mjs | Source kinds explicitly bounded to leads, inquiries, billingCharges, enrollments; inquiries group only. Publication validates distinct document paths matching adminStats/businessAnalyticsV1/businessAnalyticsYears/{year} or businessAnalyticsSnapshots/current. Control path fixed; cursor doc(after) is used as an inquiries query ordering cursor, not direct document read. |
| functions/src/businessAnalytics/scheduled-refresh.mjs | Stage/control fixed under adminStats/businessAnalyticsV1; verifyStage checks exact expected year/snapshot paths and stage metadata before publication. Preserve daily closed-day business behavior. |
| src/hooks/useRealtime.ts | Generic collection parameter; three observed callsites use sessions, invoices, progress literals. |
| src/pages/admin/ParentPaymentsLegacy.tsx and TeacherPayments.tsx | Scoped loaders constrained to billingCharges/payments and teacherPayouts/teacherEarnings respectively. |
| src/pages/teacher/TeacherStudentTopicProgressPage.tsx | Dynamic readName restricted to enrollments/students/kids. |
| functions/src/sessionsManagementSnapshot.ts | readDocsByIds callers observed with users, enrollments, kids, courses, students; snapshot/delta constants to be included in residual constant trace. |
| functions/src/schoolOS/identity/canonicalPrimaryPlanner.ts | Plan literal target roots people, learnerProfiles, guardianRelationships, learnerDetails, learnerPrivateProfiles, learnerReadModels, kids, users. |
| functions/src/schoolOS/identity/legacyPlanner.ts and readAdapter.ts | Planner maps to existing IDENTITY_COLLECTIONS members; shadow adapter source callsites users/kids/schools/schoolUsers. Full writer/stale-plan reachability remains to close. |
| functions/src/scripts/wipeSingleKidGameplayData.ts | Recursive listCollections traversal starts from fixed kids/{kidId} and configured gameplay subcollections; not database-root traversal. No execution authorized. |
| functions/src/scripts/wipeKidGameData.ts | Inspected gameplay path construction anchored at kids/{kidId}; full CLI path input/caller disposition still required. No execution authorized. |
| scripts/investigate_schedule_cancellations.mjs | REST structured-query collectionId callsites limited to enrollments, kids, auditLogs, classSessions. |
| scripts/runTeacherStudentSnapshotRepair.mjs | Observed REST structured query from classSessions; repair mutation path validation remains to be traced. |
| src/pages/admin/StudentManagement/StudentList.tsx | req.path from collection-group snapshot ref.path; group sessionRequests distinct from reserved top-level roots; preserve behavior. |

## Local validation

Node v22.16.0 in analysis environment ran scripts/architecture/server-authority/registry-successor.node-test.mjs against extracted candidate: 17 passed, 0 failed/cancelled/skipped/todo. Supplementary evidence only, not replacement for owner pinned Node 22.22.1 results. Registry remains 0.7-gate-b-candidate, candidate-not-adopted. Historical registry and physical overlay untouched.

## Residual work and disposition

HOLD adoption. Finish classification of remaining dynamic selector expressions and imported constants, canonical plan/stale-path call chains, generic client helper and CLI/REST inputs, alternate syntaxes and deployment graph. Record exact per-path dispositions and explain metadata-only residuals; do not equate parser inventory with exhaustiveness. Resolve any demonstrably reachable reserved-root conflict with focused tests. Preserve 61 main-only/differing paths during integration. No application or registry change in this evidence increment. No production access, writes, deletions, live activation, merge, deployment or repeated R5. No further Mac source transfer required for these snapshots.
