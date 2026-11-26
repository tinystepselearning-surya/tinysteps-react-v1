# P01.1-D4 — school operations, learning resources and shared services (26 November 2026 IST)

**Status:** Scoped source evidence verified; broader P01.1-D/P01.4 IN PROGRESS. Pinned main 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Continuation of draft #933 stacked on #932. No production access, runtime/security changes, notifications sent or live mutation. Named engineering owner and reviewer pending. All Function anchors relative to functions/src unless explicitly prefixed src/. Source evidence does not establish production behavior.

## 1. School academic domain and ownership

| Command/source | Resource reads and checks | Writes / boundary |
|---|---|---|
| schoolCreateAcademicYear / schoolSetCurrentAcademicYear — schoolAcademic.ts:143–255 | school manager, deterministic ay-start-end ID, one-year span, school/current target | transaction creates/switches year, closes previous year and updates schools/{schoolId}.currentAcademicYearId atomically |
| schoolUpsertGrade / schoolSetGradeStatus — same:259–333 | year and grade, duplicate key, active section check on deactivation | point read then merge/update; active section guard is outside write transaction |
| schoolUpsertTeacher / schoolSetTeacherStatus — same:337–402 | school manager, school-local teacher record | school-local teachers write/update; do not identify with platform Auth teacher without explicit relationship |
| schoolUpsertSection / schoolSetSectionStatus — same:405–515 | school/year, active grade, assigned school teachers, teacher list cap 10 | section record write/update after validation; no unified transaction with grade/teacher lifecycle |
| schoolUpdateCurriculumProgress — schoolProgress.ts:109–218 | school manager, active section, approved course/stage, existing current record | transaction at 147 writes section-keyed curriculumProgress and separate curriculumProgressHistory record (schemaVersion 2) |
| schoolUpdateTeacherTraining — same:220–330 | active school teacher, supported core track, completedUnits/currentStage consistency | transaction at 277 writes teacher-keyed teacherTraining and teacherTrainingHistory (schemaVersion 2) |
| schoolCreateReview — schoolEvidence.ts:217–273 | school manager, year, optional active section, canonical actor display name, implementation/mastery/status fields | creates review evidence with summary/recommendation, next review date; schemaVersion 1 |
| schoolRecordAssessmentSummary — same:277–364 | active section, positive student count <=500, checkpoint, valid distribution and domain scores, count bounded by section population | creates aggregate assessment summary (schemaVersion 2); no individual pupil record inferred |
| schoolGetProgrammeSnapshot — schoolRead.ts:129–260 | ensureSchoolReader, year list/selected year, teachers, grades, sections, progress, training, reviews, assessments, activity limit 100 | reads assembled view, no business record write; source does not prove bounded total school-year reads |
| eight school activity triggers — schoolActivityTriggers.ts:29–59,92–270 | actor role from users, changed/created source record | asynchronous schools/{schoolId}/activity random document ID with entity, summary, actor, metadata; not in command transaction |

School access boundary: helpers/schoolAuthorization.ts:212–383 (D1/B) distinguishes global admin, assigned learning partner and scoped schoolAdmin reader; manager writes exclude schoolAdmin. Archived school management restricted. schoolRead.ts:63–128 serializes source records and removes selected internal fields for schoolAdmin (notes in curriculum/training/assessment, actor IDs, audit fields; activity returns empty object). This is a denylist transformation, not a future-proof field allowlist. Do not assert that every new source field is safe for principal access. School-local teachers/sections and aggregate assessment records are not equivalent to platform tutor identities, individualized enrollment or preschool pupil register. Actual source does not establish all requirements for physical preschool; P09 remains separate.

Frontend source: src/services/schoolProgrammeService.ts:227–296 uses schoolGetProgrammeSnapshot and derives structure/progress, 300–377 routes year/grade/teacher/section commands through callFunction. Maintain school scope at server even if client uses a shared dashboard.

## 2. School collection field seed

All paths below nested under schools/{schoolId} unless specified. Fields are observed source groups, not live required-field/type/cardinality evidence.

| Resource | Key and source field groups | Role |
|---|---|---|
| schools root | currentAcademicYearId, existing school status/LP | school operations scope and current-year pointer |
| academicYears/{yearId} | ay-start-end; label, start/end year, status planned/current/closed, schema/audit | academic period |
| academicYears/{yearId}/grades/{gradeId} | grade key, label, sort order, status | class/grade structure |
| academicYears/{yearId}/sections/{sectionId} | gradeId, sectionName, studentCount, teacherIds, status | scoped cohort, not an individual enrollment |
| teachers/{teacherId} | school-local teacher profile/status | local staff record |
| academicYears/{yearId}/curriculumProgress/{sectionId} | courseId, stageOrder/status, grade/section, latestVerifiedAt/by, notes | current section progress |
| academicYears/{yearId}/curriculumProgressHistory/{eventId} | previous/current progress, changedAt/by | historical evidence |
| academicYears/{yearId}/teacherTraining/{teacherId} | trainingTrackId, completedUnits, currentStage, progressPercent/status, latestTrainingAt/by | training state |
| academicYears/{yearId}/teacherTrainingHistory/{eventId} | previous/current training, changedAt/by | evidence |
| academicYears/{yearId}/reviews/{reviewId} | optional section/grade, ratings, mastery, summary/recommendation, reviewedAt/by | review evidence |
| academicYears/{yearId}/assessmentSummaries/{assessmentId} | checkpoint, reading level distribution, domain scores, population/coverage, version, assessedAt/by | aggregate assessment evidence |
| activity/{activityId} | school/year, entityType/Id, type, summary, actorUid/kind, metadata, occurredAt | derived timeline; not primary business event |

## 3. Lesson and worksheet resources

| Source | Verified boundary |
|---|---|
| createLessonAccessSession.ts:160–280 | authenticated teacher/Admin role checks, active lesson, generated access ID and expiry; transaction writes lessonAccessSessions, lessonDailyAudit and teacherDailyAccess counters |
| same:285–442 resolveLessonAccessViewer | checks caller role, owner UID unless Admin, revoked/expired and active source lesson; resolves Canva URL. Read access not equivalent to external provider revocation; provider link policy remains to verify |
| src/pages/teacher/LessonLibraryPage.tsx:171,292–300 | reads lessonCatalog metadata, calls createLessonAccessSession instead of direct restricted lesson URL read |
| getParentWorksheetResources.ts:40–98,144–221,225–271 | authenticated active parent; legacy/shadow identity selection; child ownership via kids/students/nested parent child links, alias enrollment queries, active enrollment context; source library get() at 234, per-course title reads; active/target child/course/parent/enrollment filters |
| src/pages/parent/ParentDashboard.tsx:2451–2460,5322–5324 | worksheet query keyed by parent UID and selected child; explicit refresh path |

Main still reads the full parentWorksheetLibrary, not one document per parent. Pending #925 head 697fcce12654fb6d42d49e0bab9abf19742460d0 proposes worksheetBundles/parentLibraryV1, default enrolled courses, local course switching, bounded payload/fallback and redaction. PR body explicitly limits one-read target to warm catalogue content, not identity/ownership/enrollment reads. Combined #927 overlaps it; do not absorb or duplicate pending work. Current implementation does not certify target read count or cross-course privacy. Refresh mapping after merge.

Field seed: lessons/lessonCatalog = restricted content vs teacher-visible metadata; lessonAccessSessions/{accessId} = lessonId, teacherUid, createdAt, expiresAt, status/revokedAt; lessonDailyAudit and teacherDailyAccess = daily counters and last access; parentWorksheetLibrary = active/archive state, targetKidIds/targetChildIds, targetCourseIds, targetParentIds, targetEnrollmentIds, URL metadata. Preserve restrictive parent targeting, never broaden access by a client-only filter. Existing compatibility child ownership is not canonical guardian proof. Source authorization migration remains gated.

## 4. Messaging and notification service

| Root/source | Reads / guard | Write / external boundary |
|---|---|---|
| createOrSyncMessageThread — messaging/createOrSyncMessageThread.ts:249–283,353–428,435–593 | kids/students/enrollments, users metadata, participant IDs (parent/teacher/LP); caller Admin or participant | deterministic student_KID thread; transaction replaces participantIds, merges display metadata, preserves existing createdAt |
| autoSyncMessageThreads.ts:119–260 | enrollment/kid/student change-comparable guards, before/after child IDs | asynchronous rebuild and upsert thread; sync errors logged/returned false, actual recovery/freshness unverified |
| sendMessage — messaging/sendMessage.ts:153–316 | authenticated sender, thread membership or Admin, nonempty bounded text, phone-number block | transaction writes new message, thread preview/unread counts, recipient userNotificationState and notifications; push delivered separately after commit |
| markMessageThreadRead — same:320–391 | participant check in transaction | clears thread unread and adjusts aggregate user state; push update after commit |
| reconcileMyUnreadMessageCount — same:395–425 | authenticated user, all participant threads | recomputes and writes userNotificationState; not read-only despite reconciliation name |
| registerNotificationToken — notifications/classReminders.ts:314–381 | authenticated user, valid token, role/platform/provider/device metadata | hashed token-key upsert transaction; raw token stored, ownership reassignment and timestamps; never expose token values |
| sendTestPushNotification — same:385–426 | canonical Admin, target user and active tokens | actual provider send, invalid-token deactivation writes; never invoke as read-only canary |

src/pages/admin/AdminDashboard.tsx:396 calls createOrSyncMessageThread; src/lib/pushNotifications.ts:479–480 calls registerNotificationToken. Full parent/teacher messaging frontend callsites and SDK writers remain pending. Existing class reminder scheduler retirement (B) remains; push utility presence not evidence of scheduled reminders.

Field seed: messageThreads/{threadId} = kidId, participantIds, names/roles, status, unreadCounts, lastMessageAt/preview; nested messages/{messageId} = senderId, text, clientMessageId, createdAt; notifications/{id} = userId and message reference; userNotificationState/{uid} = unreadMessages, lastMessageAt/updatedAt; notificationTokens/{hashedId} = userId, raw token, platform/provider, device/app metadata, lastSeenAt/status. Private messages, contact/identity data and device tokens restricted. Notification IDs derive from message ID + recipient (sendMessage.ts:106–110); clientMessageId is stored on a random new message doc, not observed as a uniqueness reservation. Preserve phone-number restriction, scoped membership and notification counts.

## 5. Source Rules and Storage boundaries

| Path | Inspected exact Rules |
|---|---|
| schools, schoolUsers, school learningPartnerAssignments | firestore.rules:794–829 scoped current role access, direct create/update/delete denied |
| parentWorksheetLibrary | 1248–1251 Admin read/write; parent authorized callable |
| messageThreads and nested messages | 1428–1444 Admin/participant reads, direct writes denied |
| lessonFolders, lessonCatalog | 1528–1540 teacher/Admin read, Admin write |
| lessons | 1533–1535 Admin-only read/write |
| lessonAccessSessions | 1543–1553 Admin or own unexpired active teacher read, no direct write |
| lessonDailyAudit/teacherDailyAccess | 1555–1565 Admin or own teacher read, direct write denied |
| notifications | 1809–1813 Admin read/write, own recipient read; overlapping allow statements OR, subsequent false does not revoke Admin allow |
| notificationTokens | 1825–1842 scoped client create/update/delete and Admin permissions as declared; not server-only |

Source exact matches only, not complete effective Rules proof; founder recursive reads and Admin SDK bypass remain relevant. Storage.rules: public aggregate global-learners JSON read/no client write; public image/pronunciation read/Admin write via legacy users role; owner-scoped student recordings uploads with size <10 MiB, owner-scoped certificate reads/server-only write. No bucket names or object contents fetched; no secrets/identifiers copied. Preserve storage ownership and legacy M3 gates. External Canva, FCM and native push runtime delivery/configuration not verified.

## 6. Risk candidates and next gate

D4-R1: school grade/section state checks and writes not globally atomic; school access redaction denylist requires explicit schema evolution and cross-school tests. D4-R2: activity writes use auto IDs, message send uses auto message ID despite clientMessageId; delivery replay may duplicate evidence/messages if surrounding retry logic does not prevent it. Verify event retry/client behavior before proposed idempotency change; no observed live duplicate. D4-R3: message membership is an asynchronous projection of legacy resource links; verify removal/reassignment and stale thread access, notification token ownership and provider privacy; do not assume current membership freshness. D4-R4: resource access and external link revocation are distinct; worksheet warm read optimization pending #925/#927, do not certify. These are risk candidates, not confirmed incidents.

Pinned migration ledger rechecked: milestone3.status=verification_in_progress, finalExitGate=not_attempted, productionMutationsAuthorized=false. No new tests/CI, external provider calls, runtime or live data verification. No approval for cutover. P01.1-D/P01.4 remain IN PROGRESS; P01.3 source partial, P01.2/live P01.3 HOLD, P04 M3 HOLD. Next D5: systematic remaining writer closure and evidence-gap matrix across D1–D4, including direct client paths, scripts, game/insights/AI/shared projections, identity bridge helpers, session request producers and Rules, read/write classifications. Do not repeat completed source slices. Actual deployment impact resolver and owner approval before merge; close/revert docs-only rollback.
