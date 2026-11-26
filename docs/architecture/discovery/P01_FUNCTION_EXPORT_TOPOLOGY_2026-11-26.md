# P01.1-C — Function topology and field ownership seed (26 November 2026 IST)

**Status:** IN PROGRESS, scoped source findings verified. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; previous P01.1-A/B remain valid at unchanged main. Continuation of draft PR #933 on #932, no release approval. Owner/reviewer pending leadership designation. No runtime code, Rules, data, credentials, production reads/writes, deployment or migration.

## 1. Barrel inventory and scope

Parsed functions/src/index.ts named re-exports: 104 declarations, 198 unique names, 103 distinct direct modules. These are source-export names, not deployed endpoint counts. Individually inspected declarations listed below; static constructor match is not proof of callable authorization, side effects, or deployed resource identity. Full automated scan and attempted 20-module batch exceeded connector tool-call limit; both aborted without repository changes (compare confirmed branch unchanged). This document records independently inspected source instead, without claiming full classification. Future batches must fetch smaller subsets and reconcile unique names to 198.

## 2. Additional Firestore trigger roots

Relative to functions/src. W=onDocumentWritten, C=onDocumentCreated. 13 roots newly mapped beyond the 28 individually listed in P01.1-B, including the previously noted student progress wrapper. Combined mapped trigger roots: 41, not a complete trigger inventory.

| Root | Actual implementation | Event | Source document |
|---|---|---|---|
| onBillingChargeWalletSync | wallet.ts:2230 | W | billingCharges/{chargeId} |
| onAdminAttendanceCorrectionTeacherPayDecisionLink | adminAttendanceCorrectionTeacherPayDecision.ts:290 | C | classSessions/{sessionId}/attendanceCorrections/{correctionId} |
| onAdminAttendanceCorrectionCompletionBridge | adminAttendanceCorrectionCompletionBridge.ts:138 | C | classSessions/{sessionId}/attendanceCorrections/{correctionId} |
| onTeacherEarningsRollupWrite | teacherEarningsRollupTrigger.ts:173 | W | teacherEarnings/{earningId} |
| onTeacherPayWithholdingSync | teacherPayWithholdingSync.ts:92 | W | teacherEarnings/{earningId} |
| onTeacherEarningAdjustmentSync | teacherEarningAdjustmentSync.ts:108 | W | teacherEarnings/{earningId} |
| onLeadCreatedCanonicalize | leadLifecycle.ts:166 | W | leads/{leadId} |
| onDemoLeadLifecycleWrite | leadLifecycle.ts:220 | W | demoSessions/{demoId} |
| onDemoPayoutIntegrityWrite | leadLifecycle.ts:420 | W | teacherEarnings/{earningId} |
| onCurriculumTopicsCanonicalize | phonicsCurriculumEnforcer.ts:89 | W | config/curriculumTopics (constant at line 17) |
| onGameProgressWrite | gameProgressSummary.ts:95 | W | kids/{kidId}/gameProgress/{gameId} |
| onGameSessionCreateTrigger | triggers/onGameSessionCreate.ts:82 | C | kids/{kidId}/gameSessions/{eventId} |
| onStudentProgressReadModelWrite | childCourseProgressProjectionMigrationGuard.ts:37 | W | students/{kidId}/progress/{topicId} |

## 3. Verified callable constructors

50 named barrel exports verified as onCall constructors in inspected source modules. No callables invoked, no endpoint assumed read-only. Line numbers refer to pinned source. P01.1-B already documents some other callable surfaces; this table is a scoped constructor inventory, not an additive count of every callable mentioned previously.

| Implementation module | Callable name:line |
|---|---|
| revenue.ts | recordPayment:1047; recordTeacherPayout:1301; adminVoidSessionCharge:1719; previewFinanceCutoverArchive:2072; archiveFinanceRecordsThroughMonth:2209; reconcileSessionRevenueMonthKeys:2373 |
| wallet.ts | getWalletAutomationConfig:1294; setWalletAutomationConfig:1319; previewMissingWalletDeductions:1476; backfillMissingWalletDeductions:1757; adminReceiveParentPayment:2531; adminTopupParentWallet:2774; adminAdjustParentWallet:2836; initParentWalletOpeningDeficit:2908; reconcileParentWallet:3039 |
| lifecycle.ts | createAdminManualSession:1469; cancelAdminManualSession:1574; reassignEnrollmentTeacher:2122; repairEnrollmentTeacherSessionConsistency:2396; archiveKid:2521 |
| scheduling/rollingScheduleCompatibility.ts | setEnrollmentStatus:217; pauseEnrollmentUpcomingSessions:307; resumeEnrollmentSchedule:329; createSessionsFromSchedule:351; repairEnrollmentFutureSessionsFromSchedule:362; repairCancelledFutureRegularSessionsForEnrollment:380; saveEnrollmentScheduleAndGenerateSessions:398; createEnrollment:472 |
| scheduling/rollingScheduleLifecycle.ts | saveRollingEnrollmentSchedule:593; setRollingEnrollmentLifecycle:820 |
| saveTeacherSessionProgress.ts | saveTeacherSessionProgress:477; adminAttendanceCorrection:875 |
| adminAttendanceCorrectionTeacherPayDecision.ts | prepareAdminAttendanceCorrectionTeacherPayDecision:103; cancelAdminAttendanceCorrectionTeacherPayDecision:245 |
| adminCreateUser.ts | backfillTeacherDocs:22 |
| adminCreateUserCanonical.ts | adminCreateUser:378 |
| leadLifecycle.ts | teacherCancelAssignedDemo:361 |
| phonicsCurriculumEnforcer.ts | adminSyncCanonicalPhonicsCurriculum:70 |
| demoSessionsLegacy.ts | adminUpdateDemoConversion:657; adminCheckDemoPhoneConflicts:771; adminCreateDemoSession:879; adminUpdateDemoSessionDetails:1057; claimDemoSession:1222; updateDemoSessionSchedule:1315; completeDemoSession:1399; reassignDemoSession:1737; cancelDemoSession:1814; releaseDemoSession:1854; deleteDemoSession:1907; reopenDemoSession:1982 |

### Wrapper and duplicate-definition controls

- adminCreateUser.ts:20 forwards adminCreateUser to adminCreateUserCanonical.ts:378.
- demoSessions.ts forwards callable definitions to demoSessionsLegacy.ts and the earnings trigger to demoEarningsV2.ts:120. A same-named legacy earnings trigger in demoSessionsLegacy.ts:503 is not the exported root.
- childCourseProgressProjection.ts → childCourseProgressProjectionV2.ts → childCourseProgressProjectionMigrationGuard.ts:37.
- parentMonthlyAttendanceProjection.ts → parentMonthlyClassAttendanceProjectionV3.ts:779.
- revenue.ts contains same-named revenue and earnings triggers, but the barrel selects sessionRevenue.ts and teacherEarningsRollupTrigger.ts.
- lifecycle.ts has older createEnrollment, setEnrollmentStatus and transitionEnrollmentCourse declarations. The barrel uses rollingScheduleCompatibility.ts for the first two and rollingScheduleCourseTransition.ts for the latter. A similarly named compatibility transition is not the barrel root. Do not deploy/retire based on symbol search alone.
- Compatibility endpoints remain source-exported even where legacy generation/repair behavior is retired. Existing disabled-path guards and lifecycle logic must remain intact.

## 4. Identity field contract seed (source, not live)

Source: functions/src/schoolOS/identity/contracts.ts; adopted Wave 0 [ownership map](../wave-0/CURRENT_TO_CANONICAL_MAP.md). All eight identity contracts extend IdentityAuditFields: schemaVersion=1; createdAt/updatedAt Timestamp or FieldValue; createdBy/updatedBy strings; optional migration provenance (migrationId, sourceCollection, sourceId, optional sourceFieldVersion). Sensitivity labels below are proposed, not certified policy. No raw values read. TypeScript declarations are not deployed validation or proof of population.

| Collection | Declared fields (excluding common audit fields) | Owner / classification |
|---|---|---|
| people | personId:string; kind:adult/learner/unknown; status:active/suspended/archived; displayName:string; countryCode?:string/null | Identity; personal, child data restricted |
| authIdentities | authIdentityId, personId, providerSubject:string; provider:firebase; status:active/disabled/archived | Authentication; restricted identifiers |
| roleAssignments | roleAssignmentId, personId:string; role:CanonicalRole; scopeType:global/organisation/household; scopeId:string/null; status:active/inactive | Access; restricted authorization |
| learnerProfiles | learnerProfileId, personId:string; status:PersonStatus; ageYears?:number/null; countryCode?:string/null | Learner identity; restricted child data |
| guardianRelationships | guardianRelationshipId, guardianPersonId, learnerPersonId:string; relationshipType:parent/guardian/other; isPrimary:boolean; status:active/ended | Relationships; restricted family data |
| households | householdId:string; status:active/archived; primaryContactPersonId?:string/null; countryCode?:string/null | Household boundary deferred; no live backfill certification |
| organisations | organisationId, name:string; type:school/company/partner/other; status:active/paused/archived; countryCode?, legacySchoolCode?:string/null | Organisation; internal |
| organisationMemberships | organisationMembershipId, organisationId, personId:string; role:schoolAdmin/teacher/learningPartner/member; status:active/inactive; isPrimary:boolean | Membership; restricted authorization |

Do not allocate registry item IDs before P03 approval. authAccessReadModels is a derived access projection, not independent Person truth; source authAccessReadModel.ts:592,617,651 reads canonical authIdentities, people and roleAssignments. Legacy users/kids/schools/schoolUsers remain in staged migration. No Wave 0 ownership amendment, no ledger edit.

| Mixed contract | Source fields | Existing ownership direction |
|---|---|---|
| Enrollment | src/types/Enrollment.ts: id/studentId/courseId/parentId; optional teacherId/lpId; status; ratePerSession/billingCycle; creditsTotal/Used/Remaining; timestamps | Preserve enrollment identity/history; separate academic, teaching assignment, commerce and entitlement authority gradually. Interface not exhaustive lifecycle schema |
| SchoolAcademicYear/Grade/Section | src/types/SchoolProgramme.ts: schoolId, academicYearId, gradeId, sectionName, studentCount, teacherIds, status | Preserve partner aggregate model; student count is not individual roster |
| SchoolTeacherRecord | SchoolProgramme.ts: id, schoolId, name, email, phone, designation, status | Restricted staff profile; not automatically auth-backed teacher identity |
| AssessmentSummary | SchoolProgramme.ts: sectionId, checkpoint, studentsAssessed, sectionStudentCountSnapshot, averageReadingLevel, levelDistribution, domainScores, assessmentVersion | Aggregate education evidence; not individual learner assessment |

## 5. Critical event fan-out / target ownership seed

Source references below identify collection references and selected downstream responsibilities, NOT complete write closure or proof of conflict. P01.4 must trace exact commands, transactions, idempotency and indirect writes before any authority change.

| Event source | Source anchors and downstream boundary |
|---|---|
| classSessions | sessionRevenue.ts:419,432,626–662 references billingCharges and teacherEarnings by session ID and enrollment; parentMonthlyClassAttendanceProjectionV3.ts:734–736 parentMonthlyReadModels/months; sessionsManagementSnapshot and attendance evidence triggers. Preserve authoritative attendance decision, financial snapshots and reversal semantics |
| teacherEarnings | teacherEarningsRollupTrigger.ts:46,61,122,143 references teacher/month earnings and adminStats/months projections; withholding, adjustment and demo integrity also listen. Ledger vs derived projections; no duplicate authority introduced |
| billingCharges/payments | wallet.ts:2230 and parentMonthlyBillingProjectionV2.ts:382–389,414,467,524 reference wallet and parent/month/internal projections. Preserve payment/charge/allocation truth and deduction idempotency |
| leads/demoSessions | websiteLeadDeduplication.ts:235–236,285,370,462–463,629 references identity index, inquiries, communications, merge redirects; leadDemoAutoWorkflow.ts:255–257 deterministic demo/private IDs; leadLifecycle.ts:236–252 references lead and private sidecar. Preserve returning inquiry and first-touch behavior; audit loops and transaction scope |
| enrollments/kids/students | messaging auto-sync, sessions management snapshot, identity legacy sync, child progress projection. Do not create second learner authority; keep reference mapping |
| classSessions attendanceCorrections | two distinct created-event handlers mapped above. Audit completion/teacher pay decision, retry and month-close protection before change |
| config/curriculumTopics | phonicsCurriculumEnforcer.ts:17,89 explicitly canonicalizes curriculum configuration. Registry cannot bypass domain invariants |

## 6. Verification, remaining work and rollback

P01.1-C partial: 13 new trigger roots, 50 callable constructor definitions, eight identity contracts and academic ownership seed. Cumulative confirmed 41 mapped trigger roots and seven scheduled definitions from B; not all 198 roots classified. Do not sum overlapping narrative counts. No live metadata or samples; P01.2/live P01.3 HOLD. No new CI or production reconciliation. Full export/factory classification, full role/resource/SDK/integration and write dependency closure and actual deployment-impact resolver remain pending. Existing M3 flags unchanged. Review exact candidate diff and owner gate before main merge. Rollback: revert/close docs-only PR. Next: P01.1-C remaining exports in batches no larger than five module fetches per connector call, then verify unique root union and continue P01.3 field mapping; do not repeat this scoped inventory.
