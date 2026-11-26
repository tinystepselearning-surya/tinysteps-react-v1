# P01 source baseline — 26 November 2026 (IST)

**Brick:** P01.1 source-side inventory, partial; P01.2–P01.3 source evidence only / live HOLD. **Disposition:** SOURCE VERIFIED for the enumerated evidence, not for the full brick or P01 phase. **Owner:** Tiny Steps platform operations (named accountable engineer and reviewer pending owner designation). **Baseline:** [main 701c7ec832dbe9c531964496fa09cd4a4948ddd2](https://github.com/tinystepselearning-surya/tinysteps-react-v1/commit/701c7ec832dbe9c531964496fa09cd4a4948ddd2). Programme revision 1 remains in [PR #932](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/932), open and unmerged, head df281b19145406d139679e0922af3a3bf92ff213; compare showed one Markdown addition and zero behind main at audit. This follow-up is stacked on that branch for review; no production approval implied.

## 1. Scope and governance

Read the proposed programme and reviewed v1 blueprint, enterprise standard, migration roadmap, Wave 1 ledger and controlled verification status for relevant boundaries. The adopted v1 rules prevail: no duplicate authority, no unapproved live mutations, preserve scoped access, bounded migration and rollback. Open PRs include separate leads, enrollment, finance and worksheet changes; none incorporated here. No application code, data, Rules, indexes, deploy workflow, runtime dependency or flags changed. No Firebase calls, credentials, private documents, live user sessions or migration scripts executed. No local checkout available. This is GitHub-pinned source and historical CI evidence, not a complete dependency or production inventory.

## 2. Deployment and CI lineage

| Marker | Commit | Main ahead / behind marker | Source comparison |
|---|---|---|---|
| ci/functions-production | 00950ac1b2560cd0a99a2ae12b541c2af1ab23b4 | 99 / 0 | 74 changed paths overall; no functions/ paths in returned comparison |
| ci/hosting-production | 701c7ec832dbe9c531964496fa09cd4a4948ddd2 | 0 / 0 | identical |
| ci/firestore-rules-production | b181dbca2e835869bf52b3ba0632b957234eae1d | 98 / 0 | 72 changed paths; no firestore.rules diff |
| ci/firestore-indexes-production | 7f93c81a9eea909f06d76c1a2d6ba1c3df5b6e9f | 152 / 0 | 241 changed paths; no firestore.indexes.json diff |

All four markers resolve and are ancestors of pinned main. This is a Git comparison, not deployed resource digests or an executed deployment-impact resolver. `.github/workflows/deploy.yml` lines 3–7, 38–129, 135–145: main push triggers analysis against per-artifact marker baselines; missing/nonancestor markers force recovery deployment; actual deployment is conditional on resolved impact. Do not merge #932 or this follow-up until the existing resolver is run against the then-current main, four marker SHAs and proposed integration SHA, all deployment outputs reviewed, and owner release gate cleared. Never advance markers manually to manufacture a no-deploy result.

- [M3 system verification run 45602427036](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45602427036): scheduled, head exactly pinned main, completed success 25 Nov 2026 11:15:12 UTC. Three jobs successful: Canonical authorization + full Functions; Attendance, scheduling, finance and portals; Firestore Rules deny/allow emulator. This is existing baseline verification, not tests for this documentation or live canary.
- [Deployment run 45050782571](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/45050782571): push, same SHA, success 22 Nov 2026 17:44:12 UTC. Workflow success not proof of every resource being deployed at this SHA.

## 3. Source architecture map (P01.1 subset)

| Surface | Verified source anchor | Disposition |
|---|---|---|
| Router | src/app.tsx → src/app/routes.tsx (963 lines) | Literal path inventory below; dynamic/generated route and role-guard coverage not complete |
| Portals | firebase.json hosting rewrites for founder/admin/teacher/parent/kid/school/learning-partner | Rewrite is not authorization; role matrix and guards still require full audit |
| Backend | functions/src/index.ts (321 lines); 104 matched named re-export declarations | Static re-export inventory below; not a deployed Function count, aliases and declaration classification pending |
| Module boundaries | functions/src directories: ai, attendanceValidation, games, helpers, lib, messaging, notifications, scheduled, scheduling, schoolOS, scripts, triggers, types | Directory names do not prove canonical ownership or dependency closure |
| Identity | functions/src/schoolOS/identity/contracts.ts | Schema version 1; typed Person, AuthIdentity, RoleAssignment, LearnerProfile, GuardianRelationship, Household, Organisation, OrganisationMembership |
| Integration | functions/src/index.ts re-exports attendance validation and finance/scheduling commands; source tree contains messaging and notifications | Provider credential/routing, Teams/OneDrive/WhatsApp/payment behavior not live verified |
| Audit tooling | scripts/audit-identity-references.mjs, audit-academic-enrollment.mjs, audit-shared-experience.mjs, milestone3-system-audit.mjs, milestone3-canary-read-safety-preflight.mjs, resolve-deployment-impact.mjs | Existing tooling to inspect before execution; no new audit framework |
| Mobile | android/app/build.gradle: com.tinystepslearning.app versionName 1.0, versionCode 1; ios/App/App.xcodeproj/project.pbxproj: com.tinystepslearning.ios MARKETING_VERSION 1.2, CURRENT_PROJECT_VERSION 3 | Checked-in build settings only, not store/release adoption |
| Project config | .firebaserc default tinysteps-react-v1; firebase.json Functions nodejs22, Firestore rules/indexes and Storage rules; contactForm hosting rewrite asia-south1 | Not proof of production IAM, database ID, actual regions or runtime |

## 4. P01.3 source path catalogue seed

`firestore.rules` has 1,954 lines. Extracted unique literal match patterns: 138, including database root, recursive matches and nested patterns; these are not actual live collections or proof of permissions. `storage.rules` has 111 lines, 6 matched patterns. Source index config contains 66 composite indexes and 1 field override(s) across 23 distinct collection-group names. No live schema, document counts, field value/type frequency, sensitivity review, cardinality or orphan scan was performed.

Index collection groups: `alerts`, `attendanceValidationCases`, `billingCharges`, `classSessions`, `courses`, `earnings`, `gameStats`, `invoices`, `leaderboards`, `messageThreads`, `messages`, `monthlyReports`, `months`, `notificationTokens`, `payments`, `progress`, `resources`, `sessionRequests`, `sessions`, `students`, `teacherEarnings`, `users`, `weeklyReports`.

### Firestore Rules match patterns

- `/adminSessionsManagement/projectionState`
- `/adminStats/{docId}`
- `/adminStats/{document=**}`
- `/ai-error-logs/{logId}`
- `/ai-usage-logs/{logId}`
- `/attendanceValidationBaselineRanges/{rangeId}`
- `/attendanceValidationCases/{caseId}`
- `/attendanceValidationCases/{document=**}`
- `/attendanceValidationConfig/{configId}`
- `/attendanceValidationDirtySessions/{sessionId}`
- `/attendanceValidationForceFreshRanges/{rangeId}`
- `/attendanceValidationForceFreshRuns/{runId}`
- `/attendanceValidationMicrosoftIdentityClaims/{identityHash}`
- `/attendanceValidationMonthlyParentProgress/{progressId}`
- `/attendanceValidationStaffIdentities/{staffId}`
- `/billingCharges/{chargeId}`
- `/billingCharges/{document=**}`
- `/bulkUploadJobs/{jobId}`
- `/cases/{caseId}`
- `/classSamples/{document=**}`
- `/classSamples/{sampleId}`
- `/classSessions/{document=**}`
- `/classSessions/{sessionId}`
- `/config/curriculumTopics`
- `/config/gamesCatalog`
- `/config/insights`
- `/config/payments`
- `/config/picklists`
- `/courses/{courseId}`
- `/courses/{document=**}`
- `/databases/{database}/documents`
- `/debug/{doc=**}`
- `/demoSessionUniqueKeys/{keyId}`
- `/demoSessions/{demoId}`
- `/demoSessions/{document=**}`
- `/demoSessionsPrivate/{demoId}`
- `/demoSessionsPrivate/{document=**}`
- `/editorialReviewAudit/{docId}`
- `/editorialReviewState/{docId}`
- `/enrollments/{document=**}`
- `/enrollments/{enrollmentId}`
- `/gameData/{document=**}`
- `/invoices/{document=**}`
- `/invoices/{invoiceId}`
- `/kids/{document=**}`
- `/kids/{kidId}`
- `/kids/{kidId}/activity/{docId}`
- `/kids/{kidId}/curriculum/{topicId}`
- `/kids/{kidId}/gameProgress/{docId}`
- `/kids/{kidId}/gameSessions/{sessionId}`
- `/kids/{kidId}/gameSummaries/{docId}`
- `/kids/{kidId}/levelCompletions/{markerId}`
- `/kids/{kidId}/progress/{topicId}`
- `/kids/{kidId}/rollupsApplied/{eventId}`
- `/kids/{kidId}/skillStats/{tagId}`
- `/kids/{kidId}/skillTagStats/{tagId}`
- `/kids/{kidId}/summary/{docId}`
- `/leaderboards/{document=**}`
- `/leads/{document=**}`
- `/leads/{leadId}`
- `/leads/{leadId}/communications/{communicationId}`
- `/lessonAccessSessions/{accessId}`
- `/lessonCatalog/{document=**}`
- `/lessonCatalog/{lessonId}`
- `/lessonDailyAudit/{auditId}`
- `/lessonDailyAudit/{document=**}`
- `/lessonFolders/{document=**}`
- `/lessonFolders/{folderId}`
- `/lesson_view_audit/{sessionId}`
- `/lessons/{document=**}`
- `/lessons/{lessonId}`
- `/messageThreads/{threadId}`
- `/messages/{messageId}`
- `/notificationTokens/{tokenId}`
- `/notifications/{notificationId}`
- `/parentClassRecordings/{document=**}`
- `/parentClassRecordings/{recordingId}`
- `/parentMonthlyReadModels/{document=**}`
- `/parentMonthlyReadModels/{parentId}/months/{monthKey}`
- `/parentPaymentBackfillRuns/{document=**}`
- `/parentPaymentBackfillRuns/{runId}`
- `/parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId}`
- `/parentWallets/{document=**}`
- `/parentWallets/{parentId}`
- `/parentWorksheetLibrary/{document=**}`
- `/parentWorksheetLibrary/{worksheetId}`
- `/parents/{parentId}`
- `/paymentConfirmations/{docId}`
- `/payments/{document=**}`
- `/payments/{paymentId}`
- `/progress/{document=**}`
- `/progress/{progressId}`
- `/publicEditorialReviewState/{docId}`
- `/rescheduleCredits/{creditId}`
- `/rescheduleCredits/{document=**}`
- `/schoolUsers/{document=**}`
- `/schoolUsers/{userId}`
- `/schools/{document=**}`
- `/schools/{schoolId}`
- `/schools/{schoolId}/learningPartnerAssignments/{assignmentId}`
- `/sessions/{document=**}`
- `/students/{document=**}`
- `/students/{kidId}`
- `/students/{kidId}/courseProgress/{courseId}`
- `/students/{kidId}/curriculum/{topicId}`
- `/students/{kidId}/monthlyReports/{docId}`
- `/students/{kidId}/progress/{topicId}`
- `/students/{kidId}/weeklyReports/{reportId}`
- `/teacherDailyAccess/{dailyId}`
- `/teacherDailyAccess/{document=**}`
- `/teacherEarnings/{document=**}`
- `/teacherEarnings/{earningId}`
- `/teacherInquiries/{document=**}`
- `/teacherInquiries/{inquiryId}`
- `/teacherPaymentOffsets/{document=**}`
- `/teacherPaymentOffsets/{offsetId}`
- `/teacherPayouts/{document=**}`
- `/teacherPayouts/{payoutId}`
- `/teachers/{document=**}`
- `/teachers/{teacherId}/availability/{docId}`
- `/teachers/{teacherId}/blockedSlots/{blockId}`
- `/teachers/{teacherId}/classes/{classId}/studentMetrics/{document=**}`
- `/teachers/{teacherId}/earnings/{docId}`
- `/teachers/{teacherId}/sessionRequests/{requestId}`
- `/testimonials/{document=**}`
- `/testimonials/{testimonialId}`
- `/transactions/{transactionId}`
- `/users/{document=**}`
- `/users/{uid}`
- `/users/{userId}/gameStats/{document=**}`
- `/users/{userId}/progress/{document=**}`
- `/virtualClassReminderFlags/{flagId}`
- `/whatsappInboundUnmatched/{docId}`
- `/whatsappInboundUnmatched/{document=**}`
- `/{document=**}`
- `/{path=**}/earnings/{docId}`
- `/{path=**}/months/{monthKey}`
- `/{path=**}/sessionRequests/{requestId}`

### Storage Rules match patterns

- `/b/{bucket}/o`
- `/certificates/{userId}/{allPaths=**}`
- `/images/{allPaths=**}`
- `/pronunciations/{allPaths=**}`
- `/public-stats/global-learners.json`
- `/student_recordings/{userId}/{allPaths=**}`

### Router literal path declarations

- `/kids`
- `/kids/games`
- `:threadId`
- `Surya`
- `Surya/login`
- `admin`
- `admin/attendance-corrections`
- `admin/attendance-validation`
- `admin/login`
- `analytics`
- `attendance-corrections`
- `attendance-validation`
- `attendance-validation/:parentId`
- `attendance-validation/advanced`
- `best-online-phonics-classes-for-kids-in-india`
- `best-online-phonics-classes-india`
- `blog`
- `blog/:slug`
- `blog/phonics-for-parents-guide`
- `blog/week-1-phonics-satpin-launch`
- `blog/week-12-speaking-confidence-seeds`
- `blog/week-7-grammar-nouns-to-paragraphs`
- `blog/week1`
- `blog/week10`
- `blog/week2`
- `blog/week3`
- `blog/week4`
- `blog/week5`
- `blog/week6`
- `blog/week6.html`
- `blog/week7`
- `blog/week8`
- `blog/week8.html`
- `blog/week9`
- `blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading`
- `book-demo`
- `careers`
- `child-not-reading-properly`
- `class-samples`
- `confidence-building-program-kids`
- `contact`
- `courses`
- `courses/:slug`
- `courses/advanced-grammar`
- `courses/advanced-public-speaking`
- `courses/advanced-public-speaking/`
- `courses/basic-grammar`
- `courses/basic-public-speaking`
- `courses/basic-public-speaking/`
- `courses/grammar-essentials`
- `courses/phonics`
- `courses/phonics-foundations`
- `courses/phonics/`
- `courses/public-speaking`
- `courses/public-speaking/`
- `curriculum`
- `debug-lessons`
- `demo-assignments`
- `dev/comet-courier`
- `dev/seed-test`
- `english-classes-for-4-year-old`
- `english-classes-for-5-year-old`
- `english-classes-for-6-year-old`
- `english-classes-for-7-10-year-old`
- `english-foundation-program`
- `english-grammar-writing-classes`
- `english-grammar-writing-classes/`
- `faq`
- `for-schools`
- `founder`
- `founder/login`
- `free-balloon-pop-phonics-game-for-kids`
- `free-english-games-for-kids`
- `free-games-for-kids`
- `free-games/word-meaning-flashcards`
- `free-grammar-games-for-kids`
- `free-grammar-practice-game-for-kids`
- `free-letter-sound-games-for-kids`
- `free-letter-sounds-game-for-kids`
- `free-letter-tracing-game-for-kids`
- `free-letter-tracing-with-sounds-game-for-kids`
- `free-phonics-balloon-pop-game-for-kids`
- `free-phonics-games-for-kids`
- `free-reading-fluency-game-for-kids`
- `free-reading-games-for-kids`
- `free-sentence-building-games-for-kids`
- `free-sentence-making-game-for-kids`
- `free-sound-listening-game-for-kids`
- `free-speaking-games-for-kids`
- `free-speaking-practice-game-for-kids`
- `free-spelling-game-for-kids`
- `free-word-building-game-for-kids`
- `free-word-building-games-for-kids`
- `games`
- `games/comet-courier`
- `games/english-excellence`
- `games/grammar`
- `games/grammar/build-better-sentences`
- `games/grammar/build-better-sentences/choose-better-sentence`
- `games/grammar/build-better-sentences/expand-sentence`
- `games/grammar/build-better-sentences/fill-missing-word`
- `games/grammar/collocation-builder/choose-natural-pair`
- `games/grammar/collocation-builder/fill-sentence`
- `games/grammar/collocation-builder/match-pairs`
- `games/grammar/grammar-fix/fix-full-sentence`
- `games/grammar/grammar-fix/fix-one-error`
- `games/grammar/grammar-fix/spot-one-error`
- `games/grammar/grammar-fix/timed-correction`
- `games/hub`
- `games/phonics`
- `games/phonics/balloon-pop`
- `games/phonics/cvc-word-reader`
- `games/phonics/cvc-word-reader/make-a-word`
- `games/phonics/letter-sound`
- `games/phonics/letter-tracing`
- `games/phonics/letter-tracing-sounds`
- `games/phonics/my-first-words`
- `games/phonics/sentence-stepper`
- `games/phonics/sound-detective`
- `games/phonics/spelling-practice`
- `games/reading/comprehension`
- `games/reading/new-words`
- `games/reading/story-reading`
- `games/reading/word-meaning-flashcards`
- `games/speaking`
- `grammar`
- `group-grammar-classes-for-kids`
- `group-phonics-classes-for-kids`
- `group-public-speaking-classes-for-kids`
- `how-it-works`
- `kid`
- `kid/login`
- `kids`
- `kids/:childId/dashboard`
- `leads`
- `learning-partner`
- `learning-partner/dashboard`
- `learning-partner/login`
- `learningpartner`
- `learningpartner/dashboard`
- `learningpartner/login`
- `lessons`
- `letter-tracing-with-sounds-game`
- `login`
- `messages`
- `online-english-classes-for-kids`
- `online-english-classes-hyderabad`
- `online-phonics-reading-classes`
- `parent`
- `parent/login`
- `parents`
- `parents/choosing-course`
- `parents/common-mistakes`
- `parents/getting-started`
- `parents/helping-with-homework`
- `parents/payments`
- `parents/phonics-mission`
- `parents/reading-at-home`
- `parents/scheduling`
- `parents/speech-confidence`
- `parents/tracking-progress`
- `payments`
- `payments/:invoiceId`
- `payments/callback`
- `payments/phonepe-callback`
- `phonics`
- `phonics-apps-for-preschoolers-india`
- `phonics-classes-for-kids`
- `phonics-classes-for-kids/`
- `phonics-fees-india`
- `phonics-games-for-preschoolers`
- `phonics-learning-games`
- `phonics/age-3`
- `phonics/age-4`
- `phonics/age-5`
- `phonics/age-6`
- `portal`
- `pricing`
- `privacy`
- `privacy-policy`
- `privacy.html`
- `profile`
- `public-speaking-communication-kids`
- `public-speaking-communication-kids/`
- `reading-classes-for-kids`
- `reading-fluency-program`
- `refund-guarantee`
- `resources`
- `resources/grammar`
- `resources/grammar/:slug`
- `resources/phonics`
- `resources/phonics/:slug`
- `resources/speaking`
- `resources/vocabulary`
- `resources/vocabulary/:slug`
- `school`
- `school/login`
- `seasonal/christmas-tree`
- `shy-child-speaking-confidence`
- `sitemap`
- `slow-reader-child-help`
- `speaking`
- `speaking-progress-framework`
- `spoken-english-classes-for-kids`
- `spoken-english-classes-for-kids-online`
- `spoken-english-classes-for-kids/`
- `students/:kidId/topic-progress`
- `summer-camp-for-kids-india`
- `summer-camps`
- `summer-camps/:programSlug`
- `summer-camps/:programSlug/:batchSlug`
- `summer-english-camp-2026`
- `summer-reading-program-kids`
- `summer-speaking-camp-kids`
- `surya`
- `surya/login`
- `teacher`
- `teacher/:teacherId`
- `teacher/lessons-test`
- `teacher/login`
- `teachers`
- `team`
- `team/vannala-ravali-priya`
- `terms-and-conditions`
- `terms-of-service`
- `terms.html`
- `testimonials`
- `unauthorized`
- `why-tiny-steps`
- `why-us`
- `writing-classes-for-kids`

### Functions named re-export declarations (source only)

| Module | Export list |
|---|---|
| `./onSessionComplete` | `onSessionComplete` |
| `./sessionRevenue` | `onSessionRevenueWrite` |
| `./revenue` | `recordPayment, recordTeacherPayout, previewFinanceCutoverArchive, archiveFinanceRecordsThroughMonth, reconcileSessionRevenueMonthKeys, adminVoidSessionCharge` |
| `./recordTeacherPayoutV2` | `recordTeacherPayoutV2` |
| `./voidTeacherOrphanEarnings` | `voidTeacherOrphanEarnings` |
| `./teacherEarningsRollupTrigger` | `onTeacherEarningsRollupWrite` |
| `./wallet` | `getWalletAutomationConfig, setWalletAutomationConfig, previewMissingWalletDeductions, backfillMissingWalletDeductions, onBillingChargeWalletSync, adminReceiveParentPayment, adminTopupParentWallet, adminAdjustParentWallet, initParentWalletOpeningDeficit, reconcileParentWallet` |
| `./parentPaymentBackfillDryRun` | `auditParentPaymentBackfillDryRun` |
| `./parentPaymentBackfillWriteMode` | `applyParentPaymentBackfillForSafeParents` |
| `./financeReconciliationReport` | `runFinanceReconciliationAudit, runFinanceReconciliationAuditDaily` |
| `./auditTeacherEarningsCanonicalCoverage` | `auditTeacherEarningsCanonicalCoverage` |
| `./certifyTeacherEarningsSessionCreateFastPath` | `certifyTeacherEarningsSessionCreateFastPath` |
| `./prepareTeacherFinanceAnalyticsRollups` | `prepareTeacherFinanceAnalyticsRollups` |
| `./reconcileParentPaymentsMonthReadModels` | `reconcileParentPaymentsMonthReadModels` |
| `./legacyFallbackMetrics` | `recordLegacyFallbackUsage` |
| `./scheduling/rollingScheduleCompatibility` | `createSessionsFromSchedule, saveEnrollmentScheduleAndGenerateSessions, repairEnrollmentFutureSessionsFromSchedule, repairCancelledFutureRegularSessionsForEnrollment, pauseEnrollmentUpcomingSessions, resumeEnrollmentSchedule, setEnrollmentStatus, createEnrollment` |
| `./scheduling/rollingScheduleCourseTransition` | `transitionEnrollmentCourse` |
| `./scheduling/rollingScheduleLifecycle` | `saveRollingEnrollmentSchedule, setRollingEnrollmentLifecycle` |
| `./scheduling/rollingScheduleReconciliation` | `reconcileRollingEnrollmentSchedule` |
| `./scheduling/rollingScheduleRepair` | `adminRepairRollingScheduleMaterialization` |
| `./createMakeupSessionFromCredit` | `createMakeupSessionFromCredit` |
| `./saveTeacherSessionProgress` | `saveTeacherSessionProgress, adminAttendanceCorrection` |
| `./scheduling/teacherCalendarActions` | `ensureTeacherCalendarAttendanceSession, createTeacherCalendarAdHocSession` |
| `./attendanceValidation/runValidationCallable` | `runAttendanceValidationRange` |
| `./attendanceValidation/monthlyParentProgressCallable` | `updateAttendanceValidationMonthlyParentProgress` |
| `./attendanceValidation/cachedGroupRevalidationCallable` | `revalidateAttendanceValidationGroupCached` |
| `./attendanceValidation/manualVerificationCallable` | `adminVerifyAttendanceValidationGroup` |
| `./attendanceValidation/classSessionCreateDirtyTrigger` | `onAttendanceValidationHistoricalSessionCreated` |
| `./attendanceValidation/latestCheckCallable` | `runAttendanceValidationLatestCheck` |
| `./attendanceValidation/forceFreshEvidenceCallable` | `forceRefreshAttendanceValidationEvidence` |
| `./attendanceValidation/forceFreshRangeCallable` | `forceRefreshAttendanceValidationRange` |
| `./attendanceValidation/firstTimeBaselineCallable` | `runAttendanceValidationFirstTimeBaseline` |
| `./adminAttendanceCorrectionCompletionBridge` | `onAdminAttendanceCorrectionCompletionBridge` |
| `./adminAttendanceCorrectionTeacherPayDecision` | `prepareAdminAttendanceCorrectionTeacherPayDecision, cancelAdminAttendanceCorrectionTeacherPayDecision, onAdminAttendanceCorrectionTeacherPayDecisionLink` |
| `./teacherPayWithholdingSync` | `onTeacherPayWithholdingSync` |
| `./getAdminTeacherPayWithholdings` | `getAdminTeacherPayWithholdings` |
| `./teacherEarningAdjustmentSync` | `onTeacherEarningAdjustmentSync` |
| `./getAdminTeacherEarningAdjustments` | `getAdminTeacherEarningAdjustments` |
| `./createAdminHistoricalAttendanceSession` | `createAdminHistoricalAttendanceSession` |
| `./getAdminHistoricalAttendanceCandidates` | `getAdminHistoricalAttendanceCandidates` |
| `./phonicsCurriculumEnforcer` | `adminSyncCanonicalPhonicsCurriculum, onCurriculumTopicsCanonicalize` |
| `./parentMonthlyReadModels` | `onParentUserReadModelWrite` |
| `./childCourseProgressProjection` | `onStudentProgressReadModelWrite` |
| `./parentMonthlyBillingProjectionV2` | `onBillingChargeReadModelWrite, onPaymentReadModelWrite` |
| `./parentMonthlyAttendanceProjection` | `onClassSessionReadModelWrite` |
| `./parentCanonicalProjectionBootstrap` | `bootstrapParentCourseProgress, onParentProjectionBootstrapRequest` |
| `./bootstrapParentClassAttendanceV2` | `bootstrapParentClassAttendance` |
| `./adminCreateUser` | `adminCreateUser` |
| `./adminCreateUser` | `backfillTeacherDocs` |
| `./adminDeleteUser` | `adminDeleteUser` |
| `./adminArchiveUser` | `adminArchiveUser` |
| `./founderEditorialReview` | `getFounderEditorialReviewState, setFounderEditorialReviewDecision` |
| `./adminUpdateUser` | `adminUpdateUser` |
| `./adminGenerateResetLink` | `adminGenerateResetLink` |
| `./adminResetPassword` | `adminResetPassword` |
| `./resolveLoginIdentifier` | `resolveLoginIdentifier` |
| `./sessionsManagementSnapshot` | `getSessionsManagementSnapshot, adminRefreshSessionsManagementSnapshot, getSessionsManagementDateSnapshot, refreshSessionsManagementSnapshot4am, onSessionsManagementEnrollmentWrite, onSessionsManagementClassSessionWrite` |
| `./schools` | `adminCreateSchool, adminUpdateSchool, adminAssignSchoolLearningPartner, adminLinkSchoolUser, adminUnlinkSchoolUser` |
| `./schoolAcademic` | `schoolCreateAcademicYear, schoolSetCurrentAcademicYear, schoolUpsertGrade, schoolSetGradeStatus, schoolUpsertSection, schoolSetSectionStatus, schoolUpsertTeacher, schoolSetTeacherStatus` |
| `./schoolProgress` | `schoolUpdateCurriculumProgress, schoolUpdateTeacherTraining` |
| `./schoolEvidence` | `schoolCreateReview, schoolRecordAssessmentSummary` |
| `./schoolRead` | `schoolGetProgrammeSnapshot` |
| `./schoolActivityTriggers` | `onSchoolAcademicYearActivity, onSchoolGradeActivity, onSchoolSectionActivity, onSchoolTeacherActivity, onSchoolCurriculumActivity, onSchoolTrainingActivity, onSchoolReviewActivity, onSchoolAssessmentActivity` |
| `./assignLP` | `assignLPToParent, unassignLPFromParent, assignLPToTeacher, unassignLPFromTeacher, adminSetUserRole` |
| `./updateTeacherProfile` | `updateTeacherProfile` |
| `./gameProgressSummary` | `onGameProgressWrite` |
| `./triggers/onGameSessionCreate` | `onGameSessionCreateTrigger` |
| `./parentStudents` | `createStudentForParent` |
| `./adminCreateStudent` | `adminCreateStudent` |
| `./adminUpdateStudent` | `adminUpdateStudent` |
| `./runInsightsRollupNow` | `runInsightsRollupNow` |
| `./setInsightsEnabled` | `setInsightsEnabled` |
| `./scheduled/batchInsightsRollup` | `batchInsightsRollup11am, batchInsightsRollup5pm, batchInsightsRollup11pm` |
| `./scheduled/globalLearnersRollup` | `globalLearnersRollup` |
| `./games/ensureGamesCatalogNow` | `ensureGamesCatalogNow` |
| `./games/cleanupGamesCatalogNow` | `cleanupGamesCatalogNow` |
| `./games/recordLevelResult` | `recordLevelResult` |
| `./createLessonAccessSession` | `createLessonAccessSession, resolveLessonAccessViewer` |
| `./getParentWorksheetResources` | `getParentWorksheetResources` |
| `./identityLegacySyncTriggers` | `onWave1LegacyUserIdentityWrite, onWave1LegacyKidIdentityWrite, onWave1LegacySchoolIdentityWrite, onWave1LegacySchoolUserIdentityWrite` |
| `./contactForm` | `contactForm` |
| `./enrichPublicLeadAttribution` | `enrichPublicLeadAttribution` |
| `./websiteLeadDeduplication` | `onWebsiteLeadIdentityWrite` |
| `./getProspectiveAcquisitionSummary` | `getProspectiveAcquisitionSummary` |
| `./lifecycle` | `reassignEnrollmentTeacher, repairEnrollmentTeacherSessionConsistency, archiveKid, createAdminManualSession, cancelAdminManualSession` |
| `./auditTeacherTodaySessions` | `auditTeacherTodaySessions` |
| `./auditAllTransferredSessionSnapshotIssues` | `auditAllTransferredSessionSnapshotIssues` |
| `./repairTransferredTeacherSessionSnapshots` | `repairTransferredTeacherSessionSnapshots` |
| `./repairTeacherStudentSnapshots` | `adminRepairTeacherStudentSnapshots` |
| `./traceStudentTransferHistory` | `traceStudentTransferHistory` |
| `./enrollmentCanonicalBackfill` | `adminBackfillEnrollmentCanonicalFields` |
| `./enrollmentCanonicalCoverage` | `runEnrollmentCanonicalCoverage, runEnrollmentCanonicalCoverageDaily` |
| `./demoSessions` | `onDemoSessionEarningsWrite, adminCheckDemoPhoneConflicts, adminCreateDemoSession, adminUpdateDemoSessionDetails, adminUpdateDemoConversion, claimDemoSession, updateDemoSessionSchedule, completeDemoSession, reassignDemoSession, cancelDemoSession, releaseDemoSession, deleteDemoSession, reopenDemoSession` |
| `./leadLifecycle` | `onLeadCreatedCanonicalize, onDemoLeadLifecycleWrite, teacherCancelAssignedDemo, onDemoPayoutIntegrityWrite` |
| `./leadDemoAutoWorkflow` | `onLeadEnsureDemoRequest, adminRetryLeadDemoRequest, onOrphanDemoIdentityRepair` |
| `./leadLifecycleBackfill` | `adminBackfillLeadLifecycle` |
| `./adminLeadWorkflow` | `adminUpdateLeadWorkflowRecord, adminDeleteLeadWorkflowRecord` |
| `./adminCorrectDemoCompletion` | `adminCorrectDemoCompletion` |
| `./ai/refreshPublicKb` | `refreshPublicKb` |
| `./messaging/createOrSyncMessageThread` | `createOrSyncMessageThread` |
| `./messaging/sendMessage` | `sendMessage, markMessageThreadRead, reconcileMyUnreadMessageCount` |
| `./messaging/syncMessageThreadsForActiveStudents` | `syncMessageThreadsForActiveStudents` |
| `./messaging/autoSyncMessageThreads` | `onEnrollmentMessageThreadAutoSync, onKidMessageThreadAutoSync, onStudentMessageThreadAutoSync` |
| `./notifications/classReminders` | `registerNotificationToken, sendTestPushNotification` |

## 5. Wave 1 reconciliation and hold

Authoritative ledger: [identity-foundation-v1.json](../wave-1/migrations/identity-foundation-v1.json). Historical 419 source records, 1,253 canonical records created and reconciled; catch-up 423 source records / 1,265 expected and matched, zero missing/drift/conflicts/unexpected at 4 Oct 2026. Not a current population estimate. Household excluded; no automatic orphan-account merge/deletion. `switchReads.status=r5_milestone3_final_system_verification_in_progress`; `nextBrick=r5_m3_live_role_canary_and_read_model_freshness_read_only_gate`. Preserve more restrictive M3 HOLD; no broad switch, legacy retirement or ledger change.

## 6. Blockers and next actions

| Brick | Status | Required evidence / approval |
|---|---|---|
| P01.1 | IN PROGRESS — scoped source evidence verified | Complete route/role and per-export trigger/schedule/provider dependency inventory; inspect existing static tools; run existing deployment impact resolver on integration candidate; reconcile open PRs by affected path |
| P01.2 | HOLD — live metadata unavailable | Confirm project and operator authorization, read-only metadata access for database IDs, regions, IAM, indexes, backup/PITR, Functions/Hosting/Rules/Storage digests and provider routing. No service account JSON in Git/chat |
| P01.3 | IN PROGRESS — source path seed only; live HOLD | Extend source field/type/owner/sensitivity mapping, identify dynamic collection paths; owner-approved exact bounded live sample scope, row/read ceilings, timeout and redacted aggregate outputs; reconcile source vs live |
| P04 M3 | HOLD | Follow existing controlled verification approval packet: named controlled actors, legitimate sign-ins, private existing fixture allowlist, exact expected decisions, project/origin/revision, time/read/row limits, model-age threshold, stop protocol, separate operator read and monitoring authorization |

Next eligible work: finish P01.1 source-only inventory and prepare P01.2/3 least-privilege access plan; do not advance P02/P04 cutover or runtime implementation until applicable approvals. No new live reads/writes, no migration or current reconciliation counts. Validation: source blobs fetched at pinned SHA, marker comparison and historical CI jobs checked; literal extraction used only as a catalogue seed, not semantic proof. No build/emulator rerun in this session; compare branch diff and read back evidence after commit. Rollback: close/revert docs-only PR; no production state to restore. Monitoring: review CI and marker lineage before merge, and reopen if evidence invalidated.
