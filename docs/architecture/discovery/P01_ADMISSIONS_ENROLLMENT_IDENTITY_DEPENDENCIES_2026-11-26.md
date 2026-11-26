# P01.1-D3 — admissions, enrollment and identity writer boundaries (26 November 2026 IST)

**Status:** Scoped source evidence verified; P01.1-D/P01.4 remain IN PROGRESS. Baseline main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; continuation of draft PR #933 on unmerged #932. No production reads/writes, endpoint invocations, Auth changes, data migrations, security or runtime changes. Owner/reviewer designation and live approvals remain pending. Paths below relative to functions/src unless prefixed src/. Source contracts and code paths are not verified deployed behavior.

## 1. Admissions versus academic and identity authority

- Prospect identity is not Person identity. Website lead identity uses SHA-256 of normalized phone and child name (websiteLeadDeduplication.ts:21–45), not an immutable learner ID, Firebase UID, course ID or proof of guardianship. Treat hashes as restricted linkable data. Preserve exact existing normalization; no cross-family merge by name.
- A lead is the prospect/workflow aggregate; individual enquiries are historical events; demo attempts are separate records, private contact details in a sidecar. Conversion status is CRM evidence, not by itself an academic enrollment document.
- Academic enrollment creation requires a real learner/course and teacher where applicable, and independent uniqueness/operation evidence. New Person creation is a canonical identity command. Do not use a prospect dedupe key as a learner identifier or auto-create students from demo conversion without an approved domain contract.

## 2. Actual returning-enquiry contract on pinned main

src/pages/admin/leadsPaged.ts:97–137: first-touch receivedAt is authoritative, requestedAt/createdAt historical fallback; latest lastInquiryAt represents submission activity, not updatedAt. Returning enquiry requires website source, selected date range, different Asia/Kolkata calendar day from first touch, latest >= first, latest within range. Four date lanes at 223–254 merge by canonical lead identity. src/pages/admin/LeadsInquiriesWorkspaceV2.tsx:548–577 returns the row to Open / Needs review for the selected range; at 970–974 routes to Review new enquiry, not automatic second demo/enrollment; UI copy at 1074 explicitly distinguishes same-day repeated submissions from a different-day task. Distinct course interest is not part of the canonical phone+child key.

Preserve canonical history and first-touch cohort, returning-parent staff task even for closed/admitted parents, and same-day presentation dedupe. Underlying inquiryCount counts submitted events, not daily unique parents (websiteLeadDeduplication.ts:536–542); do not conflate these metrics. Current UI compares first and latest timestamps; daily enquiry history/review acknowledgement across multiple later dates is not certified by this predicate alone. Verify history queries and handling of multiple dates/course changes before changing behavior.

Pending #929 head 2444e2ee8b915750cfc112881d790739aaf7b378 proposes V2 listener/cache optimization and removal of legacy Leads workspace, not new data schema. PR body says preserve returning IST-date semantics, first touch, closed/admitted decisions, deletion and demo linkage. Main still includes legacy UI (LeadsInquiriesWorkspaceV2.tsx:983–989). Do not treat pending #929 as merged or duplicate its work. PR body is stated intent, not runtime proof; re-pin/delta audit after merge.

## 3. Admissions writer graph

| Source command / trigger | Reads / guard | Writes and boundary |
|---|---|---|
| onWebsiteLeadIdentityWrite — websiteLeadDeduplication.ts:213–645 | current lead, normalized identity index, existing canonical lead, demo/lifecycle conflict guards, capped histories and linked demos | transaction 238 onward reserves/remaps leadIdentityIndex, merges canonical lead, preserves earliest first touch/latest enquiry fields, moves inquiries and communications, updates linked demos, writes leadMergeRedirects and deletes duplicate root. Conflicts flagged instead of unsafe merge. |
| onLeadCreatedCanonicalize — leadLifecycle.ts:111–184 | latest source and original receipt timestamps | transaction repairs canonical receipt, lifecycle defaults and phone normalization; no first-touch rewrite from later enquiry. |
| onLeadEnsureDemoRequest / adminRetryLeadDemoRequest — leadDemoAutoWorkflow.ts:118–127,251–503,506–585 | excludes archived/terminal/synthetic, existing demo, website not canonical-ready/conflict; legacy caller role for retry; phone variants/dedupe key checks | shared idempotent transaction: deterministic lead_ID demo, private sidecar, unique key, lead status/link; may link existing matching demo. No automatic second demo from returning task. |
| onOrphanDemoIdentityRepair — leadDemoAutoWorkflow.ts:620–717 | private contact + matching real lead, safe synthetic lead check | transactions re-link real lead/demo and delete only eligible synthetic record. Do not merge arbitrary orphan by name. |
| adminCreateDemoSession / adminUpdateDemoSessionDetails — demoSessionsLegacy.ts:879–1194 | caller checks, lead, private sidecar, current and next dedupe reservations | transactions write demo + sidecar + lead + keys, remove prior owned key as appropriate. |
| claimDemoSession / updateDemoSessionSchedule — same:1222–1359 | caller and current demo state/assignment | transactional demo updates; preserve assignment and history. |
| completeDemoSession — same:1399–1687 | only assigned demo, assigned teacher or Admin | transaction updates completed attempt; reschedule_requested creates new follow-up demo/private record and related links, not rewriting historical attempt. |
| adminUpdateDemoConversion — same:657–745 | legacy caller profile Admin; optional lastConversionUpdateKey replay | transaction writes conversion/follow-up fields, not enrollments. Separate admin create enrollment commands below. |
| onDemoLeadLifecycleWrite — leadLifecycle.ts:220–350 | prior/current demo, lead, private sidecar, superseded attempt guard | transaction projects lead stage/conversion/timestamps and demo corrections; preserves enrolled outcome and reschedule linkage. |
| onDemoSessionEarningsWrite — demoEarningsV2.ts:120–205 | payable completion transition, conversion bonus rules, original completing teacher | separate earnings writes via ensureEarning; deterministic demo_ID_completion and demo_ID_enrollment_bonus IDs, not academic session earnings. |
| adminUpdateLeadWorkflowRecord — adminLeadWorkflow.ts:160–376 | legacy Admin role check, current lead/demo/private, old/new identity and demo keys | transaction edits linked records and owned indexes together; do not independently overwrite private or dedupe fields. |
| adminDeleteLeadWorkflowRecord — same:384–565 | linked demo/lead discovery, current snapshots/index ownership | transaction deletes active lead roots, updates demo/private/key records as defined; subsequent batch cleanup of redirects. Preserve deliberate delete feature and retained demo/audit/finance history; not general recursive erase. |

These are selected root/transaction paths, not full helper closure. Multiple lead/demo triggers can react to each other; verify meaningful-change guards, replay, ordering and failure recovery before convergence. No production loop or conflict established.

## 4. Enrollment and learner creation — separate transaction boundaries

| Source | Verified behavior |
|---|---|
| src/lib/createEnrollmentCallable.ts:26–29; src/pages/admin/EnrollmentManagement/CreateEnrollmentForm.tsx:203; src/pages/admin/StudentManagement/AssignCourseModal.tsx:359,410,470 | Separate academic createEnrollment caller; teacher reassignment and rolling schedule saves distinct. Conversion workflow uses demo service (src/services/demoSessionsService.ts:457), not these create commands. |
| scheduling/rollingScheduleCompatibility.ts:472–495 | barrel createEnrollment wrapper calls legacy implementation; canonical rolling requires teacher; retired materialization returns without automatic future sessions. |
| lifecycle.ts:262–471 | reads operation replay, kid/course and teacher, transition record where relevant; transaction 338–466 reads operation/operationalEnrollmentKeys and legacy kid aliases, creates enrollment, reservation, creation operation and audit. Existing ID/lifecycle must be preserved. |
| scheduling/rollingScheduleCourseTransition.ts:112–250 | canonical Admin, operationId, prior transition replay check, progression/correction distinction, current enrollment and new active course/teacher checks. Full subsequent stage writes remain to trace. Do not infer one atomic transaction from entry guard. |
| adminCreateStudent.ts:154–217; parentStudents.ts:403–496,573–581 | actual canonical-primary learner creation via executeCanonicalLearnerCreate; parent handler supports authorized parent/Admin path. Parent compatibility UID mapped to canonical person; legacy status without approved mapping rejected. |
| schoolOS/identity/canonicalPrimaryWriter.ts:297–548 | single Firestore transaction reads selected parent users compatibility and canonical person/role eligibility; generates new person ID; checks all canonical/compatibility targets; creates canonical and compatibility docs, array unions; post-commit verifyCanonicalLearnerWrite. No UID-based independent Person for child. |
| adminUpdateStudent.ts:70–149; schoolOS/identity/canonicalPrimaryLearnerUpdate.ts:323–566 | canonical Admin, transaction reads people/learnerProfiles/learnerDetails/kids, validates active/archived eligibility, writes three canonical docs and one compatibility kid projection, ownership/write marker; read-back verification. learnerDetails is additional current source collection beyond original eight core identity contracts; catalogue it, not a second Person authority. |

Preserve distinct command IDs: enrollmentCreationOperations and operationalEnrollmentKeys are replay and child/course uniqueness records; enrollmentCourseTransitions is lifecycle evidence, not enrollment authority. Existing same learner may have multiple courses. Exact alias and group cardinalities require approved live reconciliation.

## 5. Auth user creation, update and migration compatibility

| Source anchor | Actual write boundary |
|---|---|
| adminCreateUserCanonical.ts:378–755 | canonical Admin; independent generated Person ID, Auth createUser and custom claims before Firestore plan write; claims failure cleanup; Firestore canonical+compat transaction via writeCanonicalAuthUserCreatePlan; access read-model refresh best effort; Auth rollback where eligible on failure. Auth and Firestore are not one atomic transaction. |
| schoolOS/identity/canonicalPrimaryAuthUserCreate.ts:416–660,737–816 | plans decoupled Auth/Person identity semantics, canonical authority + projection marker; transaction checks probes and target absence, writes canonical and compatibility docs. |
| adminUpdateUserCanonical.ts:308–551; adminSetUserRoleCanonical.ts:48–284 | canonical Admin; Auth update/claims and Firestore plan updates; conditional rollback uses canonical writeId evidence; access read model refresh is distinct. Preserve stale/failed refresh and partial-success semantics. |
| schoolOS/identity/canonicalPrimaryAuthUserUpdate.ts:204–507,734–860 | canonical and compatibility plans, required and guarded reads, transaction applies planned writes and projection ownership markers. |
| identityLegacySyncTriggers.ts:22–69; schoolOS/identity/legacySync.ts:947–1160,1249–1375 | users/kids/schools/schoolUsers triggers call legacy sync; transaction rereads source and references, checks migration ownership; sets expected owned docs and removes stale owned rows. Canonical projection marker/authority comparison prevents legacy writer from indiscriminately overwriting canonical-primary records. Do not retire bridge or allow arbitrary writes to ownership markers. |
| schools.ts:257–395,432–500,518–602,627–757 | school create/update, LP assignment and link/unlink access transactions write schools, schoolUsers and assignment history; legacy sync supplies canonical organisation/membership side; exact canonical-primary ownership and access read-model freshness still to verify. |
| assignLP.ts:69–190 | canonical Admin callable guard; relationship helper uses users records. Operational LP links remain compatibility dependencies; do not conflate with organisation membership without field mapping. |

No new authorization model approved. Existing M3 ledger remains governing; canonical backend and legacy UI/Rules paths are not interchangeable. Do not assume Admin SDK bypass is an end-user permission.

## 6. Field and ownership seed

Source-derived only; no actual values, required-field prevalence or live cardinality asserted. Proposed sensitivity: all parent/child, contact, auth, financial and join/reference data restricted.

| Record | Source-observed fields / key | Ownership posture |
|---|---|---|
| leads/{leadId} | receivedAt, receivedAtOriginal, firstInquiryAt, lastInquiryAt, inquiryCount, programInterest, interestTrack, lifecycleVersion, demoSessionId, conversionStatus, enrolledAt | CRM prospect aggregate; first-touch distinct from latest activity |
| leads/{leadId}/inquiries, communications | history documents keyed by submission and migrated history IDs | event/history evidence; no Person authority |
| leadIdentityIndex / leadMergeRedirects | hashed contact+child key, canonicalLeadId, redirect lineage | dedupe workflow/index, not identity truth |
| demoSessions/{demoId} | leadId, status, assignedTeacherId, completedByTeacherId, conversionStatus, rescheduledToDemoId, lastConversionUpdateKey, enrolledAt | admissions attempt and conversion history |
| demoSessionsPrivate/{demoId} | parentPhone and private contact sidecar | restricted admissions PII; preserve separate access |
| demo unique reservation keys | phone variants/child identity references | admission workflow dedupe; exact collection contract pending |
| enrollments/{enrollmentId} | kidId/studentId/kidIds, courseId, teacher identity, status and schedule, financial rate fields | academic enrollment and existing compatibility fields |
| learnerDetails/{personId} | canonical learner detail record; update writer and authority marker | additional learner profile/detail contract, not second Person |
| people, learnerProfiles, guardianRelationships, authIdentities, roleAssignments | existing canonical contract fields from C; canonicalAuthority writeId and _wave1CanonicalProjection compatibility markers | canonical identity domains, staged compatibility |
| schools, schoolUsers, schools/{schoolId}/learningPartnerAssignments | school/profile, access and LP history | existing school operations/membership compatibility until approved convergence |

## 7. Remaining dependency risks and gates

D3-R1: prospect key phone/child and canonical person/enrollment IDs differ; incorrect automatic linking may merge families or create duplicates. D3-R2: returning inquiry display is a dated work item over same aggregate; exact multi-return date history and acknowledgement contract still requires evidence, not a confirmed defect. D3-R3: cross-trigger merge and conversion updates, Auth/Firestore rollback and projection refresh need event ordering/idempotency tests. D3-R4: schoolUsers/LP links and legacy bridge coexist with canonical identity; no broad read/write cutover authorized. Risk candidates, not reported live incidents.

Next D4: school academic/progress/evidence, lesson/resource access, messaging, notifications and remaining shared-service dependency graph; then targeted closure of unresolved D1–D3 writers (including session request producers/Rules, repair, deletion and identity projection helpers). P01.1-D/P01.4 remain in progress, P01.3 source partial, P01.2/live P01.3 HOLD, P04 M3 HOLD. No fresh CI, runtime tests, production reconciliation or deployment-impact resolver executed. Re-pin on main changes, review pending #929/#928/#924/#925/#927 separately; actual resolver and owner approval mandatory before merge. Rollback close/revert documentation only.
