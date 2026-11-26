# P01.1-D8 — consolidated source record catalogue, revision 1

**Status:** source catalogue seed, not a final metadata registry. Main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; 26 November 2026 IST. Draft #933 on #932. No production access, runtime changes, schema changes, data reads, migration IDs or permanent record/item IDs assigned. Reuses D1–D7 and source Rules; new helper evidence below. Live cardinality, field presence, requiredness, retention and deployed authorization remain unverified for every row.

## Counting and interpretation

Exact nonrecursive document paths from firestore.rules, with three nested matches expanded and nested adminStats recursive scope preserved separately; normalize variable names to compare structural paths only. 91 distinct concrete Rule patterns, 47 distinct recursive scopes, 133 curated source record entries, 65 overlap, 26 Rules-only unclassified rows, 159 total unique structural document paths in this catalogue. A Rule pattern is not proof that a collection exists, has documents, or is deployed. Exact fixed document names and wildcard patterns remain separate. Server-only records may not have explicit Rule matches. Catalogue is not exhaustive; indirect dynamic paths, indexes and client/native/scripts still require closure.

Kinds: C canonical identity source; O existing operational record/configuration (not approved future canonical assignment); L legacy/compatibility, may still hold operational fields; P projection; E evidence/workflow checkpoint; I lookup/reservation/control; H held/retired historical; U unresolved. Sensitivity proposals R restricted by default, S particularly sensitive, V public-content candidate (not permission). U records default R. Types only when explicit source contract or numeric payload confirmed; all other fields are source names or grouped descriptions; optionality and nullability unknown except explicit typed contracts. Relationship/cardinality expressed by grain in path; actual cardinality unknown. Identity contract common fields schemaVersion:1, createdAt/updatedAt:CanonicalIdentityTimestamp, createdBy/updatedBy:string, migration?:MigrationProvenance|null (contracts.ts:88–101). No secret values, bank data, children or parent values. Paths and descriptions are code evidence; no new business rules authorized. Full effective Rules require overlap review and emulator evidence. D1–D7 anchors referenced in master tracker. Identity paths relative to functions/src/schoolOS/ when beginning identity/.

| Document path / grain | Kind | Proposed source owner | Source field/relationship seed | Sensitivity | Rule line(s) | Evidence |
|---|---|---|---|---|---|---|
| adminSessionsManagement/current | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | No exact match in inventory | D7 sessionsManagementSnapshot.ts |
| adminSessionsManagement/projectionState | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | 1448 | D7 sessionsManagementSnapshot.ts |
| adminSessionsManagement/refreshLease | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | No exact match in inventory | D7 sessionsManagementSnapshot.ts |
| adminSessionsManagementDeltas/{deltaId} | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | No exact match in inventory | D7 sessionsManagementSnapshot.ts |
| adminSessionsManagementSnapshots/{snapshotId} | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | No exact match in inventory | D7 sessionsManagementSnapshot.ts |
| adminSessionsManagementSnapshots/{snapshotId}/payload/{shardId} | P | sessions management projection | snapshot schema v3, baseline/revision/deltas, lease and shard metadata; exact per-record schema pending | R | No exact match in inventory | D7 sessionsManagementSnapshot.ts |
| adminStats/enrollmentCanonicalBackfillRuns/runs/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/enrollmentCanonicalCoverage | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/enrollmentCanonicalCoverage/runs/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/financeReconciliationReports/runs/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/legacyFallbackUsage/days/{dayKey} | E | compatibility telemetry | day-keyed counters | R | No exact match in inventory | D7 |
| adminStats/revenueMonthly/months/{monthKey} | P | financial/attendance reporting | month grain, rollup totals or child rows; independent projection writers; exact schemas pending | R | No exact match in inventory | D1/D7 |
| adminStats/teacherEarningsSessionCreateFastPath/months/{monthKey} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/teacherStudentSnapshotRepairRuns/runs/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| adminStats/{docId} | U | Unresolved | No field contract traced; do not infer schema | R | 1456 | firestore.rules literal path only |
| ai-error-logs/{logId} | U | Unresolved | No field contract traced; do not infer schema | R | 1853 | firestore.rules literal path only |
| ai-usage-logs/{logId} | U | Unresolved | No field contract traced; do not infer schema | R | 1848 | firestore.rules literal path only |
| attendanceValidationBaselineRanges/{rangeId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1887 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationCases/{caseId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | 1866 | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationConfig/{configId} | I | AVS identity / config | staff mapping and hash claims; sensitive provider linkage; exact fields pending | S | 1920 | rules; D6 automaticTeacherIdentity reference |
| attendanceValidationDirtySessions/{sessionId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1881 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationEvidence/{evidenceId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | No exact match in inventory | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationForceFreshRanges/{rangeId} | U | Unresolved | No field contract traced; do not infer schema | R | 1893 | firestore.rules literal path only |
| attendanceValidationForceFreshRuns/{runId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1899 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationForceFreshRuns/{runId}/cases/{caseId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1902 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationMicrosoftIdentityClaims/{identityHash} | I | AVS identity / config | staff mapping and hash claims; sensitive provider linkage; exact fields pending | S | 1914 | rules; D6 automaticTeacherIdentity reference |
| attendanceValidationMonthlyParentProgress/{progressId} | P | AVS parent monthly review | parent/month progress state; billing view dependency | R | 1874 | D6 |
| attendanceValidationResolutions/{resolutionId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | No exact match in inventory | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationRuns/{runId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | No exact match in inventory | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationStaffIdentities/{staffId} | I | AVS identity / config | staff mapping and hash claims; sensitive provider linkage; exact fields pending | S | 1910 | rules; D6 automaticTeacherIdentity reference |
| auditLogs/{eventId} | E | operational audit | action/type, entity references, actor, reason, timestamps; multiple producers | R | No exact match in inventory | D1/D2 |
| authAccessReadModels/{uid} | P | authorization projection | firebaseUid/personId/sourceAuthIdentityId:string; personStatus/authStatus:enum; accessActive:boolean; globalRoles:enum[]; schoolAdminOrganisationIds:string[]; authority:canonical-derived; schemaVersion:1 | R | No exact match in inventory | identity/authAccessReadModel.ts:16–62 |
| authIdentities/{authIdentityId} | C | identity / canonical-primary | authIdentityId/personId/providerSubject:string; provider:AuthProvider; status:AuthIdentityStatus | R | No exact match in inventory | identity/contracts.ts:112–118 |
| billingCharges/{sessionId} | O | parent financial obligation | sessionId/enrollmentId/kidId/parentId/teacherId/courseId; amount:number; currency/status; attendanceFinanceCycle; monthKey/serviceDate/serviceMonthKey; billingRateSnapshot:number; timestamps | R | 1256 | sessionRevenue.ts:490–515; D1 |
| bulkUploadJobs/{jobId} | U | Unresolved | No field contract traced; do not infer schema | R | 1844 | firestore.rules literal path only |
| calendarAttendanceClaims/{claimId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| calendarStudentAdHocDays/{dayId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| calendarTeacherAdHocDays/{dayId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| classSamples/{sampleId} | U | Unresolved | No field contract traced; do not infer schema | R | 1164 | firestore.rules literal path only |
| classSessions/{sessionId} | O | scheduling / attendance | enrollmentId, kid aliases, teacher/parent, date/time/status, attendance, billingRateSnapshot:number, teacherPayRateSnapshot:number, financialTermsCurrency:string, financialTermsSnapshotVersion:number | R | 1113 | D1/D2; helpers/sessionFinancialRates.ts:150–154 |
| classSessions/{sessionId}/attendanceCorrections/{correctionId} | E | attendance correction | before/after status, actor, financial decision link, completion bridge evidence | R | No exact match in inventory | D1/D2/D7 |
| classSessions/{sessionId}/teacherPayDecisions/{decisionId} | E | teacher pay correction decision | decisionId, pending/linked status, expiry; exact field types pending | R | No exact match in inventory | D2 |
| config/curriculumTopics | O | curriculum configuration | canonical topic definitions and ordering; normalization trigger | R | 1938 | D2/D7 |
| config/finance | O | finance configuration | wallet automation and cutover settings; strict command guard | R | No exact match in inventory | D6 |
| config/gamesCatalog | O | game configuration | catalog and insights enable/freshness metadata | R | 1928 | D5 |
| config/insights | O | game configuration | catalog and insights enable/freshness metadata | R | 1948 | D5 |
| config/payments | U | Unresolved | No field contract traced; do not infer schema | R | 1943 | firestore.rules literal path only |
| config/picklists | U | Unresolved | No field contract traced; do not infer schema | R | 1933 | firestore.rules literal path only |
| contactSubmissions/{submissionId} | O | public contact workflow | submittedAt/createdAt, status, contact and attribution, userAgent/IP; restricted | S | No exact match in inventory | D7 |
| courses/{courseId} | O | academic catalog | course identity, status, curriculum metadata; exact schema pending | R | 1520 | D2/D3 |
| demoSessionUniqueKeys/{keyId} | I | CRM dedupe/index | hash/key and canonical lead/demo references; exact key and record types pending | R | 1786 | D3/D7 |
| demoSessions/{demoId} | O | admission attempt | leadId, status, assignedTeacherId, completedByTeacherId, conversionStatus, reschedule link, replay key | R | 1763 | D3/D7 |
| demoSessionsPrivate/{demoId} | O | restricted demo contact sidecar | parentPhone and private contact fields; no values | S | 1780 | D3 |
| editorialReviewAudit/{docId} | E | founder editorial governance | review decision, notes, revision and audit; public view separate | R | 331 | D7 |
| editorialReviewState/{docId} | E | founder editorial governance | review decision, notes, revision and audit; public view separate | R | 327 | D7 |
| enrollmentCourseTransitions/{operationId} | E | academic lifecycle | transition operation, old/new enrollment references; staged completion | R | No exact match in inventory | D3 |
| enrollmentCreationOperations/{operationId} | I | academic enrollment uniqueness/replay | child/course operation keys; deterministic IDs; exact fields pending | R | No exact match in inventory | D3 lifecycle.ts:338–466 |
| enrollments/{enrollmentId} | O | academic enrollment / lifecycle | kidId/studentId/kidIds, courseId, teacherId, parentId, status, recurrence and rate snapshots; exact legacy union pending | R | 1091 | D1/D3/D7 |
| enrollments/{enrollmentId}/teacherReassignments/{eventId} | E | academic reassignment | historical teacher references, audit; full field types pending | R | No exact match in inventory | D2 |
| guardianRelationships/{guardianRelationshipId} | C | identity / guardianship | guardianRelationshipId/guardianPersonId/learnerPersonId:string; relationshipType:enum; isPrimary:boolean; status:enum | R | No exact match in inventory | identity/contracts.ts:137–144 |
| households/{householdId} | H | identity / deferred | householdId:string; status:active\|archived; primaryContactPersonId?:string\|null; countryCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:146–151; Wave1 hold |
| invoices/{invoiceId} | U | Unresolved | No field contract traced; do not infer schema | R | 1511 | firestore.rules literal path only |
| kids/{kidId} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 881 | D3/D7; rules; identity bridge |
| kids/{kidId}/activity/{docId} | P | game analytics derived | summary/overview, freshness, skill rollup; exact types pending | R | 1030 | D5 |
| kids/{kidId}/curriculum/{topicId} | U | Unresolved | No field contract traced; do not infer schema | R | 912 | firestore.rules literal path only |
| kids/{kidId}/gameProgress/{docId} | O | game progress mixed writers | client and derived progress; do not certify assessment | R | 1013 | D5 |
| kids/{kidId}/gameSessions/{eventId} | E | game result event | eventId/gameId/progressDocId/levelId, schemaVersion 1, createdByUid | R | 999 | D5 |
| kids/{kidId}/gameSummaries/{docId} | P | game analytics derived | summary/overview, freshness, skill rollup; exact types pending | R | 1023 | D5 |
| kids/{kidId}/levelCompletions/{markerId} | I | game replay markers | level/event marker; independent writes | R | 1083 | D5 |
| kids/{kidId}/progress/{topicId} | U | Unresolved | No field contract traced; do not infer schema | R | 903 | firestore.rules literal path only |
| kids/{kidId}/rollupsApplied/{eventId} | I | game replay markers | level/event marker; independent writes | R | 1077 | D5 |
| kids/{kidId}/skillStats/{tagId} | U | Unresolved | No field contract traced; do not infer schema | R | 1049 | firestore.rules literal path only |
| kids/{kidId}/skillTagStats/{tagId} | P | game analytics derived | summary/overview, freshness, skill rollup; exact types pending | R | 1064 | D5 |
| kids/{kidId}/summary/{docId} | H | frozen game compatibility | legacy summary; no active writer observed per Rules comment | R | 1042 | D5 |
| leadIdentityIndex/{key} | I | CRM dedupe/index | hash/key and canonical lead/demo references; exact key and record types pending | R | No exact match in inventory | D3/D7 |
| leadMergeRedirects/{leadId} | I | CRM dedupe/index | hash/key and canonical lead/demo references; exact key and record types pending | R | No exact match in inventory | D3/D7 |
| leads/{leadId} | O | CRM prospect | receivedAt/receivedAtOriginal/firstInquiryAt/lastInquiryAt, inquiryCount, interestTrack, programInterest, lifecycleVersion, conversionStatus, demoSessionId | R | 1582 | D3/D7 |
| leads/{leadId}/communications/{communicationId} | E | CRM event history | submission/communication ID, timestamps, history; preserve first-touch | R | 1755 | D3 |
| leads/{leadId}/inquiries/{inquiryId} | E | CRM event history | submission/communication ID, timestamps, history; preserve first-touch | R | No exact match in inventory | D3 |
| learnerDetails/{personId} | C | identity / learner detail | person linkage and authority write marker; full contract pending | R | No exact match in inventory | D3 |
| learnerProfiles/{learnerProfileId} | C | identity / learner | learnerProfileId/personId:string; status:PersonStatus; ageYears?:number\|null; countryCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:129–135 |
| lessonAccessSessions/{accessId} | E | resource access grant | lessonId, teacherUid, expiry/status/revocation | S | 1543 | D4 |
| lessonCatalog/{lessonId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1538 | D4 |
| lessonDailyAudit/{auditId} | P | resource access counters | daily grain, count and last access | R | 1555 | D4 |
| lessonFolders/{folderId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1528 | D4 |
| lesson_view_audit/{sessionId} | U | Unresolved | No field contract traced; do not infer schema | R | 1793 | firestore.rules literal path only |
| lessons/{lessonId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1533 | D4 |
| loginAliases/{key} | I | authentication compatibility lookup | UID/email aliases; exact key/field shape pending | R | No exact match in inventory | D7 resolveLoginIdentifier |
| mail/{mailId} | E | external email queue | recipient/message; separate from contact record; delivery unverified | S | No exact match in inventory | D7 |
| messageThreads/{threadId} | O | communication thread | kidId, participantIds, unreadCounts, preview/time, status; membership projection component | R | 1428 | D4 |
| messageThreads/{threadId}/messages/{messageId} | O | communication message | senderId, text, clientMessageId, createdAt | S | 1439 | D4 |
| messages/{messageId} | U | Unresolved | No field contract traced; do not infer schema | R | 1411 | firestore.rules literal path only |
| notificationTokens/{tokenId} | O | device registration | hashed token key; raw token and user/device/provider metadata | S | 1825 | D4 |
| notifications/{notificationId} | E | notification records | userId, message reference, state; provider delivery separate | R | 1809 | D4 |
| operationalEnrollmentKeys/{key} | I | academic enrollment uniqueness/replay | child/course operation keys; deterministic IDs; exact fields pending | R | No exact match in inventory | D3 lifecycle.ts:338–466 |
| organisationMemberships/{organisationMembershipId} | C | identity / scoped membership | organisationMembershipId/organisationId/personId:string; role/status:enum; isPrimary:boolean | R | No exact match in inventory | identity/contracts.ts:162–170 |
| organisations/{organisationId} | C | identity / organisation | organisationId/name:string; type/status:enum; countryCode?:string\|null; legacySchoolCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:153–160 |
| parentClassRecordings/{recordingId} | U | Unresolved | No field contract traced; do not infer schema | R | 1155 | firestore.rules literal path only |
| parentMonthlyReadModels/{parentId}/months/{monthKey} | P | financial/attendance reporting | month grain, rollup totals or child rows; independent projection writers; exact schemas pending | R | 1346 | D1/D7 |
| parentPaymentBackfillRuns/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | 1360 | D2/D6/D7 |
| parentPaymentBackfillRuns/{runId}/parents/{parentId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| parentProjectionBootstrapRepairLocks/{parentId}/kids/{kidId}/attendance/{monthKey} | I | parent attendance repair lock | month, repair version/status, timestamps | R | No exact match in inventory | D7 |
| parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId} | E | parent projection repair request | kind, course/month, status, completion/error; ownership validated | R | 1293 | D7 |
| parentWallets/{parentId} | P | wallet balance projection from transaction history | parentId; currentBalance/openingDeficit/totalTopups/totalDeductions/totalAdjustments:number; status/currency; timestamps | R | 1274 | wallet.ts:1116–1133 |
| parentWallets/{parentId}/transactions/{transactionId} | O | wallet ledger | type/direction, amount/signedAmount/balanceBefore/balanceAfter:number; child/enrollment/session/charge/month references nullable as written; idempotencyKey; reversalOfTransactionId; audit | R | 1280 | wallet.ts:1134–1158,1176–1199 |
| parentWorksheetLibrary/{worksheetId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1248 | D4 |
| parents/{parentId} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 1364 | D3/D7; rules; identity bridge |
| password_reset_requests/{requestId} | E | authentication audit | targetUid, requestedBy, mode, success, timestamp; never expose reset links | S | No exact match in inventory | D7 |
| paymentConfirmations/{docId} | U | Unresolved | No field contract traced; do not infer schema | R | 1403 | firestore.rules literal path only |
| payments/{paymentId} | O | parent cash receipt | payment ID, allocations, parent/enrollment/month, amount; exact typed receipt schema pending | R | 1265 | D1/D2 |
| people/{personId} | C | identity / canonical-primary | personId:string; kind:PersonKind; status:PersonStatus; displayName:string; countryCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:104–110 |
| personContacts/{personId} | C | identity / private teacher profile | personId:string; contacts phone/timezone nullable; staff profile bank fields restricted; exact per-record type/optionality pending | S | No exact match in inventory | identity/canonicalPrimaryTeacherProfile.ts:246–280 |
| personLifecycle/{personId} | E | identity / archive evidence | canonical lifecycle record; exact key/field types pending | R | No exact match in inventory | identity/canonicalPrimaryAuthUserArchive.ts:195; D7 |
| progress/{progressId} | U | Unresolved | No field contract traced; do not infer schema | R | 1469 | firestore.rules literal path only |
| publicEditorialReviewState/{docId} | P | public editorial projection | sanitized review state | V | 320 | D7 |
| public_kb_chunks/{chunkId} | O | public knowledge index | deterministic chunk per URL/index, active state, run metadata; no school records | V | No exact match in inventory | D5 |
| rescheduleCredits/{creditId} | H | historical scheduling | credit state, source/replacement sessions; new booking retired | R | 1136 | D1/D7 |
| roleAssignments/{roleAssignmentId} | C | identity / authorization | roleAssignmentId/personId:string; role:CanonicalRole; scopeType:RoleScopeType; scopeId:string\|null; status:active\|inactive | R | No exact match in inventory | identity/contracts.ts:120–127 |
| schoolUsers/{uid} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 794 | D3/D7; rules; identity bridge |
| schools/{schoolId} | O | school operations / compatibility organisation | currentAcademicYearId, status, LP reference; canonical organisation mapping separate | R | 806 | D3/D4 |
| schools/{schoolId}/academicYears/{yearId} | O | school academic year | ay-start-end key, start/end year, status | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/assessmentSummaries/{assessmentId} | E | school programme evidence | historical state, review or aggregate assessment; no individual pupil inferred | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/curriculumProgress/{sectionId} | O | school programme progress | current state per section or school teacher, stage/status; schema v2 | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/curriculumProgressHistory/{eventId} | E | school programme evidence | historical state, review or aggregate assessment; no individual pupil inferred | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/grades/{gradeId} | O | school grade | grade key/label/order/status | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/reviews/{reviewId} | E | school programme evidence | historical state, review or aggregate assessment; no individual pupil inferred | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/sections/{sectionId} | O | school cohort | gradeId, sectionName, studentCount, teacherIds, status | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/teacherTraining/{teacherId} | O | school programme progress | current state per section or school teacher, stage/status; schema v2 | R | No exact match in inventory | D4 |
| schools/{schoolId}/academicYears/{yearId}/teacherTrainingHistory/{eventId} | E | school programme evidence | historical state, review or aggregate assessment; no individual pupil inferred | R | No exact match in inventory | D4 |
| schools/{schoolId}/activity/{activityId} | P | school activity timeline | entity/type/actor/time/metadata; async derived | R | No exact match in inventory | D4 |
| schools/{schoolId}/learningPartnerAssignments/{assignmentId} | E | school assignment history | LP, school, actor/date; exact types pending | R | 824 | D3/D4 |
| schools/{schoolId}/teachers/{teacherId} | O | school-local staff | school teacher status/profile; not platform tutor ID | R | No exact match in inventory | D4 |
| staffPrivateProfiles/{personId} | C | identity / private teacher profile | personId:string; contacts phone/timezone nullable; staff profile bank fields restricted; exact per-record type/optionality pending | S | No exact match in inventory | identity/canonicalPrimaryTeacherProfile.ts:246–280 |
| students/{kidId} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 991 | D3/D7; rules; identity bridge |
| students/{kidId}/courseProgress/{courseId} | P | learning progress projection | course-level summary; transactional event updates/bootstrap | R | 946 | D7 |
| students/{kidId}/curriculum/{topicId} | U | Unresolved | No field contract traced; do not infer schema | R | 954 | firestore.rules literal path only |
| students/{kidId}/monthlyReports/{docId} | U | Unresolved | No field contract traced; do not infer schema | R | 982 | firestore.rules literal path only |
| students/{kidId}/progress/{topicId} | O | individual learning progress | topic/enrollment/child references, status and educational completion; typed schema pending | R | 925 | D1/D7 |
| students/{kidId}/progressEvents/{eventId} | E | learning progress replay evidence | eventId, course/child linkage; no synthetic progress from identity-only backfill | R | No exact match in inventory | D7 |
| students/{kidId}/weeklyReports/{reportId} | U | Unresolved | No field contract traced; do not infer schema | R | 963 | firestore.rules literal path only |
| teacherDailyAccess/{dailyId} | P | resource access counters | daily grain, count and last access | R | 1561 | D4 |
| teacherEarningAdjustments/{adjustmentId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | No exact match in inventory | D1/D2 |
| teacherEarnings/{earningId} | O | teacher financial entitlement | session or demo reference; amount:number; status/currency; attendanceFinanceCycle; earnedAt; monthKey; teacherPayRateSnapshot:number | R | 1389 | sessionRevenue.ts:517–540; D1/D3 |
| teacherInquiries/{inquiryId} | U | Unresolved | No field contract traced; do not infer schema | R | 1571 | firestore.rules literal path only |
| teacherPayWithholdings/{sessionId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | No exact match in inventory | D1/D2 |
| teacherPaymentOffsets/{offsetId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | 1380 | D1/D2 |
| teacherPayouts/{payoutId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | 1373 | D1/D2 |
| teachers/{teacherId} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | No exact match in inventory | D3/D7; rules; identity bridge |
| teachers/{teacherId}/availability/{docId} | U | Unresolved | No field contract traced; do not infer schema | R | 854 | firestore.rules literal path only |
| teachers/{teacherId}/blockedSlots/{blockId} | U | Unresolved | No field contract traced; do not infer schema | R | 849 | firestore.rules literal path only |
| teachers/{teacherId}/earnings/{monthKey} | P | financial/attendance reporting | month grain, rollup totals or child rows; independent projection writers; exact schemas pending | R | 859 | D1/D7 |
| teachers/{teacherId}/sessionRequests/{requestId} | O | manual request workflow | request status, startAt, enrollment/child; producer unresolved | R | 869 | D2/D5 |
| testimonials/{testimonialId} | U | Unresolved | No field contract traced; do not infer schema | R | 1175 | firestore.rules literal path only |
| userNotificationState/{uid} | P | unread state projection | unreadMessages, lastMessageAt/updatedAt | R | No exact match in inventory | D4 |
| usernames/{username} | I | authentication compatibility lookup | UID/email aliases; exact key/field shape pending | R | No exact match in inventory | D7 resolveLoginIdentifier |
| users/{uid} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 768 | D3/D7; rules; identity bridge |
| virtualClassReminderFlags/{flagId} | U | Unresolved | No field contract traced; do not infer schema | R | 1818 | firestore.rules literal path only |
| whatsappInboundUnmatched/{docId} | U | Unresolved | No field contract traced; do not infer schema | R | 1759 | firestore.rules literal path only |
| internalBillingProjections/{parentId}/billingMonths/{monthKey} | P | internal billing projection | parent/month grain; transactional companion to parent monthly read model; exact fields pending | R | No exact match in inventory | parentMonthlyBillingProjectionV2.ts:382–395; D1 |

## Recursive Rules scopes — not individual records

| Scope | Rule line(s) |
|---|---|
| users/{document=**} | 341 |
| schools/{document=**} | 345 |
| schoolUsers/{document=**} | 349 |
| kids/{document=**} | 353 |
| students/{document=**} | 357 |
| enrollments/{document=**} | 361 |
| classSessions/{document=**} | 365 |
| rescheduleCredits/{document=**} | 369 |
| teachers/{document=**} | 373 |
| courses/{document=**} | 377 |
| lessonFolders/{document=**} | 381 |
| lessons/{document=**} | 385 |
| lessonCatalog/{document=**} | 389 |
| lessonDailyAudit/{document=**} | 393 |
| teacherDailyAccess/{document=**} | 397 |
| leads/{document=**} | 401 |
| teacherInquiries/{document=**} | 405 |
| demoSessions/{document=**} | 409 |
| demoSessionsPrivate/{document=**} | 413 |
| whatsappInboundUnmatched/{document=**} | 417 |
| parentClassRecordings/{document=**} | 421 |
| classSamples/{document=**} | 425 |
| testimonials/{document=**} | 429 |
| parentWorksheetLibrary/{document=**} | 433 |
| billingCharges/{document=**} | 437 |
| payments/{document=**} | 441 |
| parentWallets/{document=**} | 445 |
| parentMonthlyReadModels/{document=**} | 449 |
| parentPaymentBackfillRuns/{document=**} | 453 |
| teacherPayouts/{document=**} | 457 |
| teacherPaymentOffsets/{document=**} | 461 |
| teacherEarnings/{document=**} | 465 |
| adminStats/{document=**} | 469 |
| progress/{document=**} | 473 |
| invoices/{document=**} | 477 |
| attendanceValidationCases/{document=**} | 481 |
| {path=**}/earnings/{docId} | 485, 864 |
| {path=**}/months/{monthKey} | 489, 1352 |
| gameData/{document=**} | 760 |
| users/{userId}/progress/{document=**} | 832 |
| users/{userId}/gameStats/{document=**} | 836 |
| leaderboards/{document=**} | 840 |
| teachers/{teacherId}/classes/{classId}/studentMetrics/{document=**} | 845 |
| {path=**}/sessionRequests/{requestId} | 874 |
| sessions/{document=**} | 1106 |
| adminStats/{docId}/{document=**} | 1460 |
| debug/{doc=**} | 1857 |

## Storage surfaces (separate from Firestore)

Existing A/D4 source scope: certificates/{userId}/{allPaths=**}, images/{allPaths=**}, pronunciations/{allPaths=**}, public-stats/global-learners.json, student_recordings/{userId}/{allPaths=**}. No live bucket/object enumeration. Record media references, provider links, permissions, retention and recovery separately; public aggregate/content must never disclose private data.

## Newly traced indirect helper dependencies and risk follow-up

- lifecycle.ts:1625–1691: cancelFutureSessionsByEnrollmentId returns zero under permanent retirement; cancelFutureSessionsByKidId still scans kidId and kidIds, delegates cancelEligibleFutureSessions, filters protected history and external finance, then batches cancellation. archiveKid writes archive first then invokes child cancellation. Do not generalize enrollment retirement to child archiving. Check race between pre-check and batch; no live incident established.
- lifecycle.ts:1237–1286,1693–1917,2439–2483: repairEnrollmentTeacherSessionConsistency delegates future-session repair, which checks billingCharges and teacherEarnings and writes eligible session patches in batches; apply separately syncs kid teacher ownership from active enrollment aliases. Do not assume one transaction. D7 ledger remains scoped.
- wallet.ts:1021–1199: sanitized/truncated transaction doc ID; checks existing idempotency request, reads wallet and transaction inside tx, writes both summary and event. SessionRevenue.ts:359–585 reads/writes charge and earning by same session ID in accrual transaction with enrollment and revenue rollup; bill and pay snapshots independent. D6 wallet reconciliation computes ledger outside summary tx; concurrent append safety remains a targeted test. Keep historical financial evidence and currency/cycle.
- attendanceValidation/forceFreshRangePlanner.ts:5–18 and baselinePlanner.ts:6–15 resolve D6 constants exactly: attendanceValidationForceFreshRuns/{runId}/cases/{caseId}, attendanceValidationBaselineRanges/{rangeId}; 100 per work batch, query cap 101, force-refresh concurrency one. Not a global operation budget. No Teams calls.
- identity/canonicalPrimaryTeacherProfile.ts:246–280 adds personContacts and staffPrivateProfiles as separate private canonical profile surfaces; record bank-field category only, not values. Full field ownership, retention and role-safe access pending. authAccessReadModel.ts:16–62 confirms canonical-derived v1 record, not authority independent of its sources.
- Next D9: resolve U rows and complete typed fields for operational core first, explicit reader/writer edges per concrete path (incl direct browser SDK, native and scripts), add lifecycle/retention and cardinality evidence; integrate existing pending PR deltas only after main changes. Prioritize P01.5/P01.6 readiness and metadata approval handoff over repeated general reconnaissance. P01.3 source partial; P01.1-D/P01.4 in progress; P01.2/live P01.3 and M3 HOLD. No fresh CI, production reconciliation, deploy resolver or owner review. Rollback docs only.
