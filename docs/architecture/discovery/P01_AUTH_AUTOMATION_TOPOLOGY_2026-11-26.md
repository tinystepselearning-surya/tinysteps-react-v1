# P01.1-B — authorization, automation and integration topology (26 Nov 2026 IST)

Status: SOURCE VERIFIED for scoped findings; P01.1 remains IN PROGRESS. Baseline [main 701c7ec832dbe9c531964496fa09cd4a4948ddd2](https://github.com/tinystepselearning-surya/tinysteps-react-v1/commit/701c7ec832dbe9c531964496fa09cd4a4948ddd2), unchanged from [P01.1-A](P01_SOURCE_BASELINE_2026-11-26.md). Prior evidence is not regenerated. Continuation of draft [PR #933](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/933), stacked on proposed programme [#932](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/932). Accountable engineering owner and security reviewer remain to be named by leadership. No runtime changes, credentials, production calls, document reads or writes.

## 1. Portal versus server authorization

Source: src/constants/roles.ts:11–59, src/app/routes.tsx:805–945, src/components/common/RoleGate.tsx:27–96, src/components/common/AuthBootstrap.tsx:76–129.

| Application route | Declared RoleGate roles | Notes |
|---|---|---|
| /surya | admin | /admin alias redirects to login; /Surya redirects to /surya |
| /founder | founder | Requires founder claim AND current users role; no super-user bypass for founder route |
| /teacher, /teacher/:teacherId | teacher | Route identity is not resource authorization |
| /parent | parent | Nested profile, payments, kids routes |
| /kids | kid, parent | Public/legacy redirect paths also exist; do not infer resource ownership from route prefix |
| /learning-partner/dashboard | learningPartner | Legacy spelling redirects |
| /school | schoolAdmin | Current users role must be verified, errors denied |
| /messages | admin, teacher, parent, learningPartner | Thread membership is a separate domain check |

Seven application role labels; shared message/child routes are not new roles. RoleGate resolves users/{uid} with a UID-keyed query, 60-second stale time and five-minute garbage collection, retries once. Effective role falls back to claim when latestRole is null; founder/schoolAdmin paths have stricter current-role verification. Existing super-user email UI bypass applies outside founder route. AuthBootstrap initializes from Firebase Auth/token claims (kid default). Preserve present behavior; this is an experience gate, not a security boundary. Record claim fallback and role-cache age as live revocation/parity questions, not proven exploits. Do not remove bypass or alter role semantics in this docs PR.

| Authorization layer | Source anchor | Verified behavior / remaining question |
|---|---|---|
| Admin callable | functions/src/helpers/canonicalAdminGuard.ts:19–108 | One canonical principal loader; no claims/users fallback; active global admin required; missing/invalid model fails closed |
| Canonical principal | functions/src/schoolOS/identity/authAccessAuthorization.ts:251–303 | Point read keyed by Firebase UID; validates model; active principal and role/membership checked. Freshness not established by source |
| School read | functions/src/helpers/schoolAuthorization.ts:212–285; schoolRead.ts:129–202 | Active global admin, assigned learning partner, or scoped schoolAdmin on nonarchived school; snapshot reads academic/teacher/evidence collections. Not a bounded live canary approval |
| School write | functions/src/helpers/schoolAuthorization.ts:286–383; schoolAcademic.ts:143 onward | Global admin or assigned LP; archived mutation prohibited by default; schoolAdmin not granted manager access. Preserve B2B principal read-only |
| Direct SDK Firestore/Storage | firestore.rules, storage.rules; M3 ledger | Legacy compatibility authority still held; never treat canonical backend guards as deployed Rules parity |
| IAM/operator | Not verified | Admin SDK bypasses Rules; separate metadata permissions and end-user verification |

M3 ledger read at pinned SHA: `milestone3.status=verification_in_progress`, `finalExitGate=not_attempted`, productionMutationsAuthorized=false. Held cutovers (Firestore, Storage, target-user readers, pre-auth login resolver, destructive operations): firestoreRulesCutover=false, storageRulesCutover=false, targetUserBusinessReaderCutover=false, preAuthLoginResolverCutover=false, destructiveOperations=false. No changes to ledger. Full per-callable/SDK resource and membership dependency closure remains pending; no live denial test performed.

## 2. Source-exported scheduled Functions (scoped)

Each listed Function is re-exported by functions/src/index.ts and its definition has been inspected. These seven definitions are source evidence only, not a live Cloud Scheduler inventory. All listed times daily IST.

| Function | IST | Source module / definition line |
|---|---|---|
| runFinanceReconciliationAuditDaily | 02:15 | financeReconciliationReport.ts:1344 |
| globalLearnersRollup | 02:30 | scheduled/globalLearnersRollup.ts:81 |
| runEnrollmentCanonicalCoverageDaily | 02:45 | enrollmentCanonicalCoverage.ts:231 |
| refreshSessionsManagementSnapshot4am | 04:00 | sessionsManagementSnapshot.ts:1074 |
| batchInsightsRollup11am | 11:00 | scheduled/batchInsightsRollup.ts:1033 |
| batchInsightsRollup5pm | 17:00 | scheduled/batchInsightsRollup.ts:1045 |
| batchInsightsRollup11pm | 23:00 | scheduled/batchInsightsRollup.ts:1057 |

Batch insight cron definitions are in UTC (05:30, 11:30, 17:30); others use Asia/Kolkata. Existing index comments explicitly retire the obsolete automatic recurrence schedulers and exclude the 15-minute class reminder pending parent app release. Do not count unexported definitions as active roots. Full export factory/alias resolution and live scheduler health still pending.

## 3. Verified critical Firestore trigger paths

All names below are present in the pinned export barrel and inspected implementation or wrapper. Module paths relative to functions/src; W = onDocumentWritten; C = onDocumentCreated. No handlers executed. This table maps event source, not complete target writes or idempotency proof.

| Root(s) | Event and path | Source |
|---|---|---|
| onWave1LegacyUserIdentityWrite | W users/{sourceId} | identityLegacySyncTriggers.ts:50 |
| onWave1LegacyKidIdentityWrite | W kids/{sourceId} | identityLegacySyncTriggers.ts:56 |
| onWave1LegacySchoolIdentityWrite | W schools/{sourceId} | identityLegacySyncTriggers.ts:62 |
| onWave1LegacySchoolUserIdentityWrite | W schoolUsers/{sourceId} | identityLegacySyncTriggers.ts:68 |
| onSessionsManagementEnrollmentWrite | W enrollments/{enrollmentId} | sessionsManagementSnapshot.ts:945 |
| onSessionsManagementClassSessionWrite | W classSessions/{sessionId} | sessionsManagementSnapshot.ts:1006 |
| onAttendanceValidationHistoricalSessionCreated | C classSessions/{sessionId} | attendanceValidation/classSessionCreateDirtyTrigger.ts:46 |
| onParentUserReadModelWrite | W users/{parentId} | parentMonthlyReadModels.ts:673 |
| onBillingChargeReadModelWrite | W billingCharges/{chargeId} | parentMonthlyBillingProjectionV2.ts:467 |
| onPaymentReadModelWrite | W payments/{paymentId} | parentMonthlyBillingProjectionV2.ts:524 |
| onClassSessionReadModelWrite | W classSessions/{sessionId} | parentMonthlyAttendanceProjection.ts → parentMonthlyClassAttendanceProjectionV3.ts:779 |
| onParentProjectionBootstrapRequest | C parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId} | parentCanonicalProjectionBootstrap.ts:443 |
| onLeadEnsureDemoRequest | W leads/{leadId} | leadDemoAutoWorkflow.ts:506 |
| onOrphanDemoIdentityRepair | W demoSessions/{demoId} | leadDemoAutoWorkflow.ts:633 |
| onWebsiteLeadIdentityWrite | W leads/{leadId} | websiteLeadDeduplication.ts:213 |
| onSchoolAcademicYearActivity | W schools/{schoolId}/academicYears/{academicYearId} | schoolActivityTriggers.ts:92 |
| onSchoolGradeActivity | W schools/{schoolId}/academicYears/{academicYearId}/grades/{gradeId} | schoolActivityTriggers.ts:112 |
| onSchoolSectionActivity | W schools/{schoolId}/academicYears/{academicYearId}/sections/{sectionId} | schoolActivityTriggers.ts:132 |
| onSchoolTeacherActivity | W schools/{schoolId}/teachers/{teacherId} | schoolActivityTriggers.ts:157 |
| onSchoolCurriculumActivity | W schools/{schoolId}/academicYears/{academicYearId}/curriculumProgress/{sectionId} | schoolActivityTriggers.ts:176 |
| onSchoolTrainingActivity | W schools/{schoolId}/academicYears/{academicYearId}/teacherTraining/{teacherId} | schoolActivityTriggers.ts:200 |
| onSchoolReviewActivity | C schools/{schoolId}/academicYears/{academicYearId}/reviews/{reviewId} | schoolActivityTriggers.ts:221 |
| onSchoolAssessmentActivity | C schools/{schoolId}/academicYears/{academicYearId}/assessmentSummaries/{assessmentId} | schoolActivityTriggers.ts:244 |
| onEnrollmentMessageThreadAutoSync | W enrollments/{enrollmentId} | messaging/autoSyncMessageThreads.ts:174 |
| onKidMessageThreadAutoSync | W kids/{kidId} | messaging/autoSyncMessageThreads.ts:204 |
| onStudentMessageThreadAutoSync | W students/{kidId} | messaging/autoSyncMessageThreads.ts:235 |
| onDemoSessionEarningsWrite | W demoSessions/{demoId} | demoSessions.ts → demoEarningsV2.ts:120 |
| onSessionRevenueWrite | W classSessions/{sessionId} | sessionRevenue.ts:312 |

28 individually mapped trigger roots, not full trigger inventory. Additional wrapper chain onStudentProgressReadModelWrite: childCourseProgressProjection.ts → childCourseProgressProjectionV2.ts → childCourseProgressProjectionMigrationGuard.ts. Source inspection: import { onDocumentWritten } from 'firebase-functions/v2/firestore'; ; export const onStudentProgressReadModelWrite = onDocumentWritten( ; document: 'students/{kidId}/progress/{topicId}',. Not counted in 28. Do not mistake similarly named legacy trigger definitions in parentMonthlyReadModels.ts for the actual exported V2/V3 implementations. Identity legacy triggers share a factory with retry:true, and delegate to handleLegacyIdentityWrite; do not infer actual mutation authority from trigger names alone. ClassSession, leads, demoSessions and enrollment multiple-consumer paths require explicit writer/trigger/idempotency closure in P01.4 before any change.

## 4. Integration and side-effect boundaries

| Surface | Verified source | Remaining evidence |
|---|---|---|
| Microsoft Teams attendance | attendanceValidation/microsoftGraphClient.ts uses Graph v1.0 and app OAuth; runValidationCallable.ts:26–29,93,140–142 references configured secrets; occurrenceSelectingGraphClient.ts, teamsEvidenceCollector.ts, virtualTeamsDiscovery.ts exist | Actual tenant, permissions, meeting ownership, read budgets, evidence parity and provider health unknown; do not invoke Graph |
| Firebase Cloud Messaging | notifications/classReminders.ts:128,161,205,299,314,346,385; token persistence and sendEachForMulticast; exported registerNotificationToken and sendTestPushNotification | No test push; no production token access; scheduled reminder intentionally excluded from barrel |
| Public contact | contactForm.ts:152,179,183 onRequest; adds contactSubmissions and mail documents | HTTP submission is mutating; exclude from canary; delivery extension/provider status unverified |
| Public knowledge refresh | ai/refreshPublicKb.ts:29,255 public /kb.json origin and callable | Not a harmless read; full side effects and deployed state unverified |
| Payment gateway | src/lib/phonepe.ts, src/pages/payments/PhonePeCheckout.tsx and PhonePeCallback.tsx | Utility/source presence not proof of active payment gateway, accounting authority or current provider contract; no payment call |
| WhatsApp | functions/src/index.ts explicitly states Meta WhatsApp Cloud API integration retired; normal website links/forms independent | External manual workflows and actual routing unknown |
| OneDrive recordings | no provider runtime implementation established in inspected sources | External routing, sharing and retention evidence needed; no external content access |

## 5. PR interaction and deployment gate

Current main is unchanged; prior #932/#933 unmerged. Reviewed actual changed filenames of open PRs: #929 Leads UI/read optimization (11 files); #928 discontinued enrollment UI (1); #927 combined finance/worksheets (23); #925 worksheets (15); #924 finance (9). #927 overlaps both #924/#925 including Function exports and Rules. These are separate proposed changes, not baseline behavior. Re-pin and recompute affected source inventory after any merge. Do not merge duplicate overlapping PRs or fold them into P01.

Marker comparison against previous #933 head c181fae376bc4462ab39e940032ae000fd4c7835: all four ancestors (behind_by=0); Functions 102 commits ahead, 76 changed paths; Hosting 3/2; Rules 101/74; indexes 155/243. No functions/ path or deployment global/config change in Functions marker comparison; Hosting diff only the two Markdown files; no firestore.rules or firebase.json change in Rules marker comparison; no firestore.indexes.json or firebase.json change in indexes comparison. Source classifier scripts/deployment/functions-impact-lib.mjs:138–183 ignores ordinary docs paths for runtime deployment, distinguishes artifact-specific config and code. Thus no intended deployment change from this documentation; this is a static assessment, NOT an executed resolver result. The resolver needs actual Git objects and ancestor checks for all refs plus the exact integration SHA (scripts/resolve-deployment-impact.mjs:23–95). No authenticated local checkout available. Keep merge HOLD until the actual resolver passes at current candidate, no unexpected outputs, and owner gate is cleared. Never advance markers manually.

## 6. P01.2/P01.3 approval and evidence plan (proposed, not permission)

| Evidence | Read-only method / boundary | Completion requirement |
|---|---|---|
| Project identity, database/region and backup/PITR | Restricted metadata access; inspect project/database descriptions and backup policy only; no exports or restore actions | Exact project ID, database IDs, mode, region, backup retention and PITR status; timestamp and operator |
| Functions, schedules, Hosting, Rules, indexes and Storage | Read-only deployed resource metadata, released versions/digests, IAM policy scope (no keys), scheduler descriptions; no invocations | Source/deployed comparison and explicit unknowns; no confidential settings or principals copied into Git |
| Provider routing | Owner-authorized metadata/configuration inventory; no Graph token, signed link, message, payment or private content retrieval | Redacted contract/owner, environment, retention and observed integration status |
| Collection/field catalogue | First complete source mapping; propose exact approved existing document paths in private execution manifest, no arbitrary collection scan | Explicit fields allowed, row/read ceilings, sample scope, sensitivity categories, aggregates-only reporting; record omissions and unknowns |
| M3 role canaries | Existing approval packet and controlled verification status; independently authorized supported sign-ins and bounded sampler | Named actors/fixtures kept privately, allowed/denied matrix, exact time and operation ceilings, age threshold, stop protocol, separate Monitoring authorization |

Proposed metadata-first, zero document reads until approved sampling manifest; zero write budget throughout P01. Stop on wrong project, permission mismatch, unknown side effects, cap breach, or PII exposure; no credential escalation. Do not put identifiers, credentials, raw child/guardian records or signed URLs in repository. Existing milestone3-system-audit and milestone3-canary-read-safety-preflight are source-only scripts by inspected headers; their full behavior and local execution still need verification. The latter explicitly blocks snapshot getters/refresh and payment dry-run/write-mode callables from live canaries; dry-run naming alone does not establish safety.

## 7. Progress, verification and rollback

- P01.1-B scoped role/automation/integration evidence recorded; P01.1 still IN PROGRESS. Remaining full per-export classification (including aliases/factories), trigger target-write dependency graph, frontend role/resource/SDK access closure, and actual deployment impact resolver.
- P01.2 HOLD; P01.3 source-only partial, live HOLD. No sample access authorized or available here. P04 M3 HOLD unchanged; no new production reconciliation.
- Verification: GitHub pinned source read, comparison, PR filename review and ledger hold checks. No new local builds/emulator tests/CI execution claimed. Follow-up branch read-back and docs-only diff required. Prior 25 Nov CI run remains historical baseline, not live proof.
- Rollback: close draft PR or revert only this docs commit; no runtime/data restoration needed. Monitoring: re-pin main/markers before merge; reconcile overlapping PR changes; revisit if source changes.
- Next eligible source slice P01.1-C: resolve remaining export aliases and declaration types, then targeted P01.3 source field/owner mapping. Live work only after relevant approvals.
