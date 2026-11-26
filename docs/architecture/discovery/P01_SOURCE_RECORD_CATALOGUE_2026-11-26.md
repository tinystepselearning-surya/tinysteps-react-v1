# P01.1-D8 — consolidated source record catalogue, revision 6

**Status:** source catalogue seed, not a final metadata registry. Main 701c7ec832dbe9c531964496fa09cd4a4948ddd2; 26 November 2026 IST. Draft #933 on #932. No production access, runtime changes, schema changes, data reads, migration IDs or permanent record/item IDs assigned. Reuses D1–D7 and source Rules; new helper evidence below. Live cardinality, field presence, requiredness, retention and deployed authorization remain unverified for every row.

## Counting and interpretation

Exact nonrecursive document paths from firestore.rules, with three nested matches expanded and nested adminStats recursive scope preserved separately; normalize variable names to compare structural paths only. 91 distinct concrete Rule patterns, 47 distinct recursive scopes, 133 original curated source entries, 65 overlap, 26 original Rules-only rows examined in D9, 159 original unique structural document paths; D11 adds nine source-backed paths (168 total); D12 adds seven academic inventory probes (175 total). A Rule pattern is not proof that a collection exists, has documents, or is deployed. Exact fixed document names and wildcard patterns remain separate. Server-only records may not have explicit Rule matches. Catalogue is not exhaustive; indirect dynamic paths, indexes and client/native/scripts still require closure.

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
| adminStats/{docId} | P | mixed administrative aggregate/control namespace | Wave 0 identifies aggregate role; fixed document contracts vary; no uniform schema | R | 1456 | Wave0 CURRENT_TO_CANONICAL_MAP.md:64; D1–D7 report paths |
| ai-error-logs/{logId} | U | technical observability candidate | Admin read/write; current producer and fields not found by exact literal search | R | 1853 | Wave0 map:71; rules:1853–1855 |
| ai-usage-logs/{logId} | U | technical observability candidate | Signed-in write, Admin read; producer/schema not located; do not treat counters as trusted | R | 1848 | Wave0 map:71; rules:1848–1851 |
| attendanceValidationBaselineRanges/{rangeId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1887 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationCases/{caseId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | 1866 | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationConfig/{configId} | I | AVS identity / config | staff mapping and hash claims; sensitive provider linkage; exact fields pending | S | 1920 | rules; D6 automaticTeacherIdentity reference |
| attendanceValidationDirtySessions/{sessionId} | E | AVS checkpoint and work state | cursor/serviceDateYmd, case/session ID, status; max batch 100; dirty schema v1; range concurrency 1 | R | 1881 | attendanceValidation/forceFreshRangePlanner.ts:5–18; baselinePlanner.ts:6–15; dirtySessionMarker.ts:4–7 |
| attendanceValidationEvidence/{evidenceId} | E | attendance validation / not official attendance | run/evidence/case/resolution identity, session links, external Teams evidence; exact field types pending | S | No exact match in inventory | D6 evidenceStore/shadowRunner/manualVerification |
| attendanceValidationForceFreshRanges/{rangeId} | H | AVS historical range generation | Brick 4 documentation says legacy range collection no longer read/written by Brick 4; current planner uses ForceFreshRuns; backend-only Rules; retention unresolved | R | 1893 | refinement-brick-4-fresh-refresh-generations.md:84–85; D8 |
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
| bulkUploadJobs/{jobId} | H | historical CSV import job | Historical adminProcessEnrollmentCSV created and updated jobs. Module removed in fec02e9c9. Rules remain. | R | 1844 | Wave0 map:70; rules:1844–1846 |
| calendarAttendanceClaims/{claimId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| calendarStudentAdHocDays/{dayId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| calendarTeacherAdHocDays/{dayId} | I | scheduling / occurrence reservation | child+IST date/time claim; teacher/student day reservations; exact field schema pending | R | No exact match in inventory | D1 teacherCalendarActions |
| classSamples/{sampleId} | O | commercial video catalogue | title/description/category/ageBand/durationLabel/youtubeUrl/videoId/uploadDate; featured/active:boolean; sortOrder:number; actor/timestamps | R | 1164 | ClassSamplesManagement.tsx:155–183,222,241; ClassSamplesPage.tsx:271–275 |
| classSessions/{sessionId} | O | scheduling / attendance | enrollmentId, kid aliases, teacher/parent, date/time/status, attendance, billingRateSnapshot:number, teacherPayRateSnapshot:number, financialTermsCurrency:string, financialTermsSnapshotVersion:number | R | 1113 | D1/D2; helpers/sessionFinancialRates.ts:150–154 |
| classSessions/{sessionId}/attendanceCorrections/{correctionId} | E | attendance correction | before/after status, actor, financial decision link, completion bridge evidence | R | No exact match in inventory | D1/D2/D7 |
| classSessions/{sessionId}/teacherPayDecisions/{decisionId} | E | teacher pay correction decision | decisionId, pending/linked status, expiry; exact field types pending | R | No exact match in inventory | D2 |
| config/curriculumTopics | O | curriculum configuration | canonical topic definitions and ordering; normalization trigger | R | 1938 | D2/D7 |
| config/finance | O | finance configuration | wallet automation and cutover settings; strict command guard | R | No exact match in inventory | D6 |
| config/gamesCatalog | O | game configuration | catalog and insights enable/freshness metadata | R | 1928 | D5 |
| config/insights | O | game configuration | catalog and insights enable/freshness metadata | R | 1948 | D5 |
| config/payments | U | payment configuration candidate | Admin/parent read; Admin write; exact consumer and field contract not located in this slice; not config/finance | R | 1943 | rules:1943–1946 |
| config/picklists | O | learning progress configuration | topics:TopicDefinition[] (id/label:string, area:TopicArea, subskills?:string[]); mastery/scoreBands/lastEvidence/nextActions:string[] | R | 1933 | useProgressPicklists.ts:8–20,39–44; rules:1933–1936 |
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
| invoices/{invoiceId} | L | invoice-shaped secondary finance representation; authority unverified | Checkout view amount:number, status:string, currency?/childName?/description?/dueDate?/phonepeTransactionId?:string; parentId and lpId Rules fields; no writer proven | S | 1511 | PhonePeCheckout.tsx:15–23,43–57; useInvoices.ts:18–19; Wave0 map:56 |
| kids/{kidId} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 881 | D3/D7; rules; identity bridge |
| kids/{kidId}/activity/{docId} | P | game analytics derived | summary/overview, freshness, skill rollup; exact types pending | R | 1030 | D5 |
| kids/{kidId}/curriculum/{topicId} | L | legacy curriculum compatibility surface | child/topic grain, teacher/Admin write permitted; fields and current producer unknown; not same as students path | R | 912 | rules:912–924 |
| kids/{kidId}/gameProgress/{docId} | O | game progress mixed writers | client and derived progress; do not certify assessment | R | 1013 | D5 |
| kids/{kidId}/gameSessions/{eventId} | E | game result event | eventId/gameId/progressDocId/levelId, schemaVersion 1, createdByUid | R | 999 | D5 |
| kids/{kidId}/gameSummaries/{docId} | P | game analytics derived | summary/overview, freshness, skill rollup; exact types pending | R | 1023 | D5 |
| kids/{kidId}/levelCompletions/{markerId} | I | game replay markers | level/event marker; independent writes | R | 1083 | D5 |
| kids/{kidId}/progress/{topicId} | L | legacy progress compatibility surface | child/topic grain, teacher/Admin write permitted; fields and current producer unknown | R | 903 | rules:903–924 |
| kids/{kidId}/rollupsApplied/{eventId} | I | game replay markers | level/event marker; independent writes | R | 1077 | D5 |
| kids/{kidId}/skillStats/{tagId} | P | alternate skill stats helper | attempts/correct/wrong increment numbers, tagLabel, lastSeenAt, optional lastWrongAt/lastEvidence; helper caller not located; distinct active skillTagStats | R | 1049 | games/helpers/applyTagStats.ts:67–103; rules:1049–1064 |
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
| lesson_view_audit/{sessionId} | E | teacher viewer audit | accessId, teacherId/name, mode, openedAt, blockedActionCount:number, blockedActionTypes; client writes merge by accessId | R | 1793 | FullScreenCanvaViewer.tsx:761–773,787–823,1041–1042 |
| lessons/{lessonId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1533 | D4 |
| loginAliases/{key} | I | authentication compatibility lookup | UID/email aliases; exact key/field shape pending | R | No exact match in inventory | D7 resolveLoginIdentifier |
| mail/{mailId} | E | external email queue | recipient/message; separate from contact record; delivery unverified | S | No exact match in inventory | D7 |
| messageThreads/{threadId} | O | communication thread | kidId, participantIds, unreadCounts, preview/time, status; membership projection component | R | 1428 | D4 |
| messageThreads/{threadId}/messages/{messageId} | O | communication message | senderId, text, clientMessageId, createdAt | S | 1439 | D4 |
| messages/{messageId} | L | legacy top-level message surface | fromId/toId/content, timestamp, read:boolean, participants:string[]; legacy hook reads and creates; live route usage unverified | S | 1411 | useMessages.ts:25–31,91–98; rules:1411–1423 |
| notificationTokens/{tokenId} | O | device registration | hashed token key; raw token and user/device/provider metadata | S | 1825 | D4 |
| notifications/{notificationId} | E | notification records | userId, message reference, state; provider delivery separate | R | 1809 | D4 |
| operationalEnrollmentKeys/{key} | I | academic enrollment uniqueness/replay | child/course operation keys; deterministic IDs; exact fields pending | R | No exact match in inventory | D3 lifecycle.ts:338–466 |
| organisationMemberships/{organisationMembershipId} | C | identity / scoped membership | organisationMembershipId/organisationId/personId:string; role/status:enum; isPrimary:boolean | R | No exact match in inventory | identity/contracts.ts:162–170 |
| organisations/{organisationId} | C | identity / organisation | organisationId/name:string; type/status:enum; countryCode?:string\|null; legacySchoolCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:153–160 |
| parentClassRecordings/{recordingId} | O | parent recording folder access | parentId/name/email, folderName/folderUrl/sourceType optional strings in view, createdAt/updatedAt; Admin direct CRUD, parent query | S | 1155 | ClassRecordingsManagement.tsx:29–39,170–186,229; ParentDashboard.tsx:2429–2437 |
| parentMonthlyReadModels/{parentId}/months/{monthKey} | P | financial/attendance reporting | month grain, rollup totals or child rows; independent projection writers; exact schemas pending | R | 1346 | D1/D7 |
| parentPaymentBackfillRuns/{runId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | 1360 | D2/D6/D7 |
| parentPaymentBackfillRuns/{runId}/parents/{parentId} | E | maintenance and reconciliation evidence | run ID/actor/time/scope/outcome; may be written in dry run; individual contracts pending | R | No exact match in inventory | D2/D6/D7 |
| parentProjectionBootstrapRepairLocks/{parentId}/kids/{kidId}/attendance/{monthKey} | I | parent attendance repair lock | month, repair version/status, timestamps | R | No exact match in inventory | D7 |
| parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId} | E | parent projection repair request | kind, course/month, status, completion/error; ownership validated | R | 1293 | D7 |
| parentWallets/{parentId} | P | wallet balance projection from transaction history | parentId; currentBalance/openingDeficit/totalTopups/totalDeductions/totalAdjustments:number; status/currency; timestamps | R | 1274 | wallet.ts:1116–1133 |
| parentWallets/{parentId}/transactions/{transactionId} | O | wallet ledger | type/direction, amount/signedAmount/balanceBefore/balanceAfter:number; child/enrollment/session/charge/month references nullable as written; idempotencyKey; reversalOfTransactionId; audit | R | 1280 | wallet.ts:1134–1158,1176–1199 |
| parentWorksheetLibrary/{worksheetId} | O | learning resource configuration | content vs catalog visibility; target child/course/parent/enrollment and status; exact schemas pending | R | 1248 | D4 |
| parents/{parentId} | C | Wave1 permanent role profile with compatibility key usage | parent role profile metadata; personId target in Wave1 contract; legacy UID consumers remain; field-level authority and key convergence pending | R | 1364 | Wave1 IDENTITY_PROFILE_RETIREMENT_MIGRATION.md:76–87; D3/D7 |
| password_reset_requests/{requestId} | E | authentication audit | targetUid, requestedBy, mode, success, timestamp; never expose reset links | S | No exact match in inventory | D7 |
| paymentConfirmations/{docId} | H | historical parent payment confirmation | Historical ParentDashboard direct writer removed in 507a99e07. Parent create and Admin Rules remain. | S | 1403 | Wave0 map:61; rules:1403–1406 |
| payments/{paymentId} | O | parent cash receipt | payment ID, allocations, parent/enrollment/month, amount; exact typed receipt schema pending | R | 1265 | D1/D2 |
| people/{personId} | C | identity / canonical-primary | personId:string; kind:PersonKind; status:PersonStatus; displayName:string; countryCode?:string\|null | R | No exact match in inventory | identity/contracts.ts:104–110 |
| personContacts/{personId} | C | identity / private teacher profile | personId:string; contacts phone/timezone nullable; staff profile bank fields restricted; exact per-record type/optionality pending | S | No exact match in inventory | identity/canonicalPrimaryTeacherProfile.ts:246–280 |
| personLifecycle/{personId} | E | identity / archive evidence | canonical lifecycle record; exact key/field types pending | R | No exact match in inventory | identity/canonicalPrimaryAuthUserArchive.ts:195; D7 |
| progress/{progressId} | L | global legacy progress view | studentId/kidId, teacherId/parentId/lpId Rules scope; current hook reads, migration audit exists; exact writer closure pending | R | 1469 | useData.ts:108–109; useProgress.ts:45–50; rules:1469–1506 |
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
| students/{kidId}/curriculum/{topicId} | O | individual curriculum state | status completed/in_progress, updatedAt/by, source attendance, lastSessionId, topicName, conditional courseId/courseLabel/courseName; session progress transaction writes | R | 954 | saveTeacherSessionProgress.ts:672–686 |
| students/{kidId}/monthlyReports/{docId} | H | historical monthly student report | Historical publishWeeklyReport updated monthly aggregates. Module removed in 1e995ab8d. Rules and indexes remain. | R | 982 | rules:982–989; index source |
| students/{kidId}/progress/{topicId} | O | individual learning progress | topic/enrollment/child references, status and educational completion; typed schema pending | R | 925 | D1/D7 |
| students/{kidId}/progressEvents/{eventId} | E | learning progress replay evidence | eventId, course/child linkage; no synthetic progress from identity-only backfill | R | No exact match in inventory | D7 |
| students/{kidId}/weeklyReports/{reportId} | H | historical weekly student report | Historical generateWeeklyReport and publishWeeklyReport wrote this path. Module removed in 1e995ab8d. Rules and indexes remain. | R | 963 | rules:963–980; index source |
| teacherDailyAccess/{dailyId} | P | resource access counters | daily grain, count and last access | R | 1561 | D4 |
| teacherEarningAdjustments/{adjustmentId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | No exact match in inventory | D1/D2 |
| teacherEarnings/{earningId} | O | teacher financial entitlement | session or demo reference; amount:number; status/currency; attendanceFinanceCycle; earnedAt; monthKey; teacherPayRateSnapshot:number | R | 1389 | sessionRevenue.ts:517–540; D1/D3 |
| teacherInquiries/{inquiryId} | O | teacher recruitment workflow | candidateName/phone/email/location/experience/specialization/currentContext/availability/candidateNote/adminNotes:string in view; stage/finalStatus; updatedAt/closedAt; Admin writes | S | 1571 | TeacherInquiriesWorkspace.tsx:39–55,224–238; rules:1571 |
| teacherPayWithholdings/{sessionId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | No exact match in inventory | D1/D2 |
| teacherPaymentOffsets/{offsetId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | 1380 | D1/D2 |
| teacherPayouts/{payoutId} | O | teacher settlement / separate ledgers | cash payout vs noncash offset vs withholding vs adjustment; source/target earnings and amount/month evidence; exact per-record schemas pending | R | 1373 | D1/D2 |
| teachers/{teacherId} | C | Wave1 permanent role profile with compatibility key usage | teacher role profile metadata; personId target in Wave1 contract; legacy UID consumers and nested operational paths remain; field-level authority and key convergence pending | R | No exact match in inventory | Wave1 IDENTITY_PROFILE_RETIREMENT_MIGRATION.md:76–87; D3/D7 |
| teachers/{teacherId}/availability/{docId} | O | teacher availability configuration | fixed config doc; timezone:string, slotIntervalMinutes/minimumNoticeMinutes/bufferBetweenSessionsMinutes:number, weeklyWindows:typed array (id,weekday,startTime,endTime), updatedAt/by | R | 854 | teacherAvailability.ts:7–22; TeacherAvailabilityEditor.tsx:149–150,468–479,506 |
| teachers/{teacherId}/blockedSlots/{blockId} | O | teacher blocked availability window | startAt/endAt Timestamp-like read into Date, reason?:string; date-scoped subscription; owner-write Rule, actual writer unknown | R | 849 | TeacherAvailabilityEditor.tsx:178–210; teacherAvailability.ts:24–29; rules:849–852 |
| teachers/{teacherId}/earnings/{monthKey} | P | financial/attendance reporting | month grain, rollup totals or child rows; independent projection writers; exact schemas pending | R | 859 | D1/D7 |
| teachers/{teacherId}/sessionRequests/{requestId} | O | manual request workflow | request status, startAt, enrollment/child. Historical teacher source producer identified. Current compatibility producer unresolved. | R | 869 | D2/D5 |
| testimonials/{testimonialId} | O | consent-governed review content | status/source/reviewerType, parentName, optional childName/age/city, reviewText/publishedText, rating, consent flags:boolean, course/pageTags:string[], audit timestamps; public submission pending, admin moderation | S | 1175 | testimonials.ts:9–35,685–707; TestimonialsManagement.tsx:182–193 |
| userNotificationState/{uid} | P | unread state projection | unreadMessages, lastMessageAt/updatedAt | R | No exact match in inventory | D4 |
| usernames/{username} | I | authentication compatibility lookup | UID/email aliases; exact key/field shape pending | R | No exact match in inventory | D7 resolveLoginIdentifier |
| users/{uid} | L | identity compatibility and operational legacy | role/status, identity aliases and relationships vary by record; field-specific authority pending | R | 768 | D3/D7; rules; identity bridge |
| virtualClassReminderFlags/{flagId} | O | virtual occurrence reminder workflow | date, dynamic notified boolean/time fields, updatedAt/by; Admin client merge; not scheduled push delivery | R | 1818 | TodaysNotifications.tsx:1395–1398,2203–2213 |
| whatsappInboundUnmatched/{docId} | H | historical Meta WhatsApp unmatched intake | Legacy webhook producer and lead trigger removed in source. Admin Rules remain. Retention, live existence and external producers unresolved. | S | 1759 | Wave0 map:69; rules:1759–1761; 8a07398e8; D13 closure |
| internalBillingProjections/{parentId}/billingMonths/{monthKey} | P | internal billing projection | parent/month grain; transactional companion to parent monthly read model; exact fields pending | R | No exact match in inventory | parentMonthlyBillingProjectionV2.ts:382–395; D1 |
| admins/{personId} | C | identity role profile, existing approved Wave1 target | role-specific profile; not global authorization authority; actual reader/writer key convergence pending | R | No exact match in inventory | Wave1 IDENTITY_PROFILE_RETIREMENT_MIGRATION.md:76–87; migration ledger profileMigration |
| learningPartners/{personId} | C | identity role profile, existing approved Wave1 target | role-specific profile; assignment authority separate; actual key convergence pending | R | No exact match in inventory | Wave1 IDENTITY_PROFILE_RETIREMENT_MIGRATION.md:76–87; migration ledger profileMigration |
| learnerReadModels/{personId} | P | learner derived root snapshots | summary/progress, game aggregates; not identity authority | R | No exact match in inventory | wave1-identity-profile-retirement-lib.mjs:584–598; Wave1 migration doc:174–190 |
| learnerProvenance/{personId} | E | learner repair history | repairedFromBrokenStudentId, repairedFromEnrollmentId, repairSource; historical evidence, not current authority | R | No exact match in inventory | wave1-identity-profile-retirement-lib.mjs:601–615; Wave1 migration doc:192–206 |
| organisationProfiles/{organisationId} | C | organisation operational profile | contact, location, nameSearch, currentAcademicYearId; distinguish canonical org and legacy school pointer | R | No exact match in inventory | wave1-identity-profile-retirement-lib.mjs:646–661; Wave1 migration doc:208–221 |
| organisationAssignments/{assignmentId} | C | organisation LP assignment target | deterministic SHA-256 key, organisationAssignmentId, organisationId, personId, role learningPartner, status active, assignedAt; current authority coexistence pending | R | No exact match in inventory | wave1-identity-profile-retirement-lib.mjs:663–680; Wave1 migration doc:223–247 |
| attendance/{sessionId} | L | legacy attendance reader surface | session grain; useData hook scans entire collection; current mounted caller/writer and existence unverified | R | No exact match in inventory | src/hooks/useData.ts:176–195 |
| attendance/{sessionId}/attendanceRecords/{recordId} | L | legacy attendance detail reader surface | kidId filter, markedAt Timestamp-like, status present/late/absent; reader compares UTC date string; no official attendance authority inferred | R | No exact match in inventory | src/hooks/useData.ts:193–206 |
| curriculum/{topicId} | L | legacy/global curriculum reader surface | courseId filter, sequenceNumber ordering; current mounted caller/writer unverified | R | No exact match in inventory | src/hooks/useData.ts:574–588 |
| programmes/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:667 |
| curriculumVersions/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:668 |
| deliveryOfferings/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:669 |
| learningGroups/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:670 |
| groupPlacements/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:671 |
| teachingAssignments/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:672 |
| schedulePlans/{docId} | U | planned academic architecture inventory probe | schemaVersion selected by existing audit; actual writer, existence, field contract and current authority unknown; no migration inferred | R | No exact match in inventory | scripts/audit-academic-enrollment.mjs:673 |

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

## D8 indirect helper dependencies and risk follow-up

- lifecycle.ts:1625–1691: cancelFutureSessionsByEnrollmentId returns zero under permanent retirement; cancelFutureSessionsByKidId still scans kidId and kidIds, delegates cancelEligibleFutureSessions, filters protected history and external finance, then batches cancellation. archiveKid writes archive first then invokes child cancellation. Do not generalize enrollment retirement to child archiving. Check race between pre-check and batch; no live incident established.
- lifecycle.ts:1237–1286,1693–1917,2439–2483: repairEnrollmentTeacherSessionConsistency delegates future-session repair, which checks billingCharges and teacherEarnings and writes eligible session patches in batches; apply separately syncs kid teacher ownership from active enrollment aliases. Do not assume one transaction. D7 ledger remains scoped.
- wallet.ts:1021–1199: sanitized/truncated transaction doc ID; checks existing idempotency request, reads wallet and transaction inside tx, writes both summary and event. SessionRevenue.ts:359–585 reads/writes charge and earning by same session ID in accrual transaction with enrollment and revenue rollup; bill and pay snapshots independent. D6 wallet reconciliation computes ledger outside summary tx; concurrent append safety remains a targeted test. Keep historical financial evidence and currency/cycle.
- attendanceValidation/forceFreshRangePlanner.ts:5–18 and baselinePlanner.ts:6–15 resolve D6 constants exactly: attendanceValidationForceFreshRuns/{runId}/cases/{caseId}, attendanceValidationBaselineRanges/{rangeId}; 100 per work batch, query cap 101, force-refresh concurrency one. Not a global operation budget. No Teams calls.
- identity/canonicalPrimaryTeacherProfile.ts:246–280 adds personContacts and staffPrivateProfiles as separate private canonical profile surfaces; record bank-field category only, not values. Full field ownership, retention and role-safe access pending. authAccessReadModel.ts:16–62 confirms canonical-derived v1 record, not authority independent of its sources.
- Next D9: resolve U rows and complete typed fields for operational core first, explicit reader/writer edges per concrete path (incl direct browser SDK, native and scripts), add lifecycle/retention and cardinality evidence; integrate existing pending PR deltas only after main changes. Prioritize P01.5/P01.6 readiness and metadata approval handoff over repeated general reconnaissance. P01.3 source partial; P01.1-D/P01.4 in progress; P01.2/live P01.3 and M3 HOLD. No fresh CI, production reconciliation, deploy resolver or owner review. Rollback docs only.

## D9 update — operational field and path-edge closure (26 November 2026)

All 26 former Rules-only rows received targeted source or historical documentation review. 151/159 now have scoped classification, 8 retain U because current producer/schema or precise function remains unknown. Classification includes compatibility and historically documented roles, not active production confirmation. Exact literal code search is not exhaustive and does not prove absence. Rules permission is not evidence of an actual writer. No deletion or migration authorized.

| Resource | Verified reader | Verified writer / effect | Remaining closure |
|---|---|---|---|
| classSamples | ClassSamplesPage, Admin list | Admin direct SDK CRUD | effective public active-only Rules, consent and video metadata |
| parentClassRecordings | ParentDashboard by parentId, Admin | ClassRecordingsManagement direct SDK CRUD | external folder permission/retention, recording router integration |
| teacher availability | availability config and blocked date window subscription | teacher availability config set/delete; blockedSlots producer unknown | cross-timezone/date overlaps; no live edits |
| students curriculum/progress | existing parent course summary and teacher editor | saveTeacherSessionProgress tx, StudentTopicProgressEditor direct progress setDoc | field-level multiwriter ownership, enrollment identity linkage, projection race |
| legacy messages | useMessages hook subscription by participants | useMessages addDoc directly; modern thread callable separate | verify actual mounted caller, retention, role Rules; no legacy removal |
| lesson_view_audit | Admin Rules permission | teacher viewer merges open/blocked/close events | audit replay, retention and privacy |
| virtualClassReminderFlags | TodaysNotifications date query | Admin direct setDoc flags (real sessions write classSessions instead) | occurrence identity, sender status not delivery proof |
| testimonials | testimonials library/public filtered read, Admin list | public pending submission; Admin moderation | published field privacy and consent, effective Rules |
| teacherInquiries | Admin workspace | Admin stage/notes/close mutation. Public Careers writer removed at #717. External intake unresolved. | recruitment producer and PII retention |
| invoices | parent useInvoices and routed checkout | historical PhonePe handlers removed from source. Current writer and deployed status unresolved. | determine secondary finance authority and gateway status |
| progress root | useData/useProgress | admin Rules permission only in this slice | producer/migration mapping; no authority assumption |
| skillStats | parent/Admin Rules | applyTagStats historical writer removed from recordLevelResult. Helper and destructive script remain. | active vs legacy stats producer and idempotency |

Additional source paths found during tracing: useData.ts:184–195 reads attendance/{sessionId}/attendanceRecords and attendance roots; :580–584 reads curriculum root. Add to next catalogue delta after producer and Rules review; do not pretend 159 is exhaustive. Existing 198 root ledger remains scoped; no fresh runtime test, live queries or deployment. Next D10: compile targeted integrity/authorization verification matrix and source-only tests/preflight execution where environment permits; resolve remaining U and high-risk direct writer paths as evidence allows; no phase exit until live metadata, bounded data verification, cost/recovery evidence and owner review. P01.2 and M3 gates remain held.

## D11 migration reconciliation delta

Nine additional source-backed record paths incorporated, including six existing Wave1 profile migration targets missing from this catalogue and three legacy reader paths noted D9. Existing parent/teacher role profile classifications corrected to reflect the approved Wave1 permanent profile contract; compatibility keys/operational fields are still in use and authority is not universally switched. This is not a migration or a decision to retire any legacy record. 168 structural paths, 160 scoped, 8 unresolved; denominator expanded, prior 151/159 remains historical. All nine additions have no exact standalone nonrecursive Rule match; recursive permissions and Admin SDK bypass require separate assessment. Existing historical profile reconciliation was 891/891 matched on 4 Oct 2026, not a new live check. Legacy hook scans may be dormant; verify mounted consumers before changing cost/date semantics or retiring. No live read or runtime change.

## D12 academic inventory probe delta

Existing academic audit collector explicitly reads seven additional collection paths with schemaVersion field selection. Their existence and actual producer are unverified; preserve as U inventory probes, not operational or canonical records. Catalogue now 175 unique paths, 160 scoped, 15 unresolved (eight prior plus seven probes). The denominator change is discovery of previously omitted source references, not a loss of verified coverage. No audit invocation, database access or schema creation.

## D13 closure delta

Reclassified five historical paths with source lineage: Meta WhatsApp unmatched intake, weekly and monthly student reports, CSV import jobs and parent payment confirmations. 175 structural paths, 165 scoped, 10 unresolved (three Rules-only and seven academic probes). Read [D13 closure and acceptance evidence](P01_D13_CLOSURE_AND_BOUNDED_COLLECTOR_2026-11-26.md) for PhonePe, skill statistics, attendance and Firestore REST dependencies. No data retirement or access approval is implied.

## P01 measured verification follow-up

All ten remaining unresolved paths were reviewed. The historical Admin beta analytics reader provides historical context for `ai-error-logs`. Current operational owners and deployed usage for the two AI log paths and `config/payments` remain unverified. The seven planned academic root names are bounded here to source inventory references. They do not establish production resources. No catalogue denominator change. See [measured verification and acceptance](P01_MEASURED_VERIFICATION_AND_ACCEPTANCE_2026-11-26.md) for per-path disposition and responsible roles.
