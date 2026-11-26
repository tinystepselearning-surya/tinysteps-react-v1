# M04 — record key, storage and scope review matrix

**Status:** Generated design review index for registry v0.6-draft. Not a physical schema, authorization rule, runtime migration or a second editable dictionary. The [registry manifest](../registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json) and its shards own candidate definitions. This snapshot is traceable to the reviewed shard blob SHAs in that manifest. Existing source records keep original keys and values; key labels below are target semantics or source compatibility keys, not instructions to rename document IDs.

## Scope legend
- **T:** tenant-owned root/child; verify trusted tenant context and every related record, not just a tenantId equality check. TEN is the root boundary; tenantId is its identity.
- **I:** identity/person-keyed contract; no automatic global person visibility or cross-customer linkage. Existing global/platform identity and role scope preserved; access requires verified principal, membership, domain relationship and purpose. Staff-private remains restricted server-only pending approval. D02 must settle the tenant identity boundary; no blanket tenantId backfill.
- **O:** scope inherited through verified organisation/school mapping; explicit parent path context for nested year, grade and section IDs. Membership/assignment not itself access; deny if parent unresolved. No standalone bare local IDs.
- **C:** approved platform-shared or tenant-owned catalogue; descendants/links inherit and verify both endpoints' compatible owner/visibility. Published does not mean public; resource link and provider permissions independently checked.
- **H:** household owner/scope held. HMB has candidate tenant scope, but existing HOU has no tenant field. Must bind verified household boundary and member/guardian context before household rollout; no inferred household grouping.
- **P:** existing platform-admin-only business analytics; no reuse as a tenant-scoped view.
- **X:** explicit platform or tenant conditional scope; platform context tightly restricted, tenantId required for tenant context; configuration and integration/audit access separately enforced.

All nested references resolve as contextual keys (parent path plus local ID) and validate relationship ownership before use. Any unresolved alias/key/scope means quarantine or held mapping. Existing collection paths may coexist with source compatibility aliases; an unresolved candidate/probe is not proven empty. A source-catalogue path is not evidence of current live records. REUSE/DESIGN/EXTRACT/EXTEND reflect earlier proposed posture, not approval or current data coverage. PAY/POT/AEV preserve existing source paths; DESIGN posture refers to contract work, not creating duplicate stores.

## Record-by-record review index

### identity-institutional

| Record | Collection candidate | Document key / proposed key | Scope | Evidence / posture |
|---|---|---|---|---|
| PER Person | `people` | personId | I | source-contract / REUSE |
| AUT AuthIdentity | `authIdentities` | authIdentityId | I | source-contract / REUSE |
| ROL RoleAssignment | `roleAssignments` | roleAssignmentId | I | source-contract / REUSE |
| LRN LearnerProfile | `learnerProfiles` | learnerProfileId | I | source-contract / REUSE |
| GUA GuardianRelationship | `guardianRelationships` | guardianRelationshipId | I | source-contract / REUSE |
| HOU Household | `households` | householdId | H | source-contract-held / EXTEND |
| ORG Organisation | `organisations` | organisationId | T | source-contract / REUSE |
| MEM OrganisationMembership | `organisationMemberships` | organisationMembershipId | O | source-contract / REUSE |
| CAM Campus | `campuses` | campusId | T | unresolved-candidate / DESIGN |
| ENR Enrollment | `enrollments` | enrollmentId | T | source-catalogue / EXTRACT |
| CNT PersonContact | `personContacts` | personContactId | I | historical-profile-migration-contract / REUSE |
| PLC PersonLifecycle | `personLifecycle` | personLifecycleId | I | historical-profile-migration-contract / REUSE |
| LDT LearnerDetail | `learnerDetails` | learnerDetailsId | I | historical-profile-migration-contract / EXTEND |
| PPR ParentProfile | `parents` | personId | I | historical-profile-migration-contract / REUSE |
| APR AdminProfile | `admins` | personId | I | historical-profile-migration-contract / REUSE |
| LRM LearnerReadModel | `learnerReadModels` | learnerReadModelId | I | historical-profile-migration-contract / REUSE |
| LPV LearnerProvenance | `learnerProvenance` | learnerProvenanceId | I | historical-profile-migration-contract / REUSE |
| HMB HouseholdMembership | `householdMemberships` | householdMembershipId | T | unresolved-candidate / DESIGN |
| TEN Tenant | `tenants` | tenantId | T | unresolved-candidate / DESIGN |
| TMB TenantMembership | `tenantMemberships` | tenantMembershipId | T | unresolved-candidate / DESIGN |
| OPR OrganisationProfile | `organisationProfiles` | organisationId | O | historical-profile-migration-contract / REUSE |
| OAS OrganisationAssignment | `organisationAssignments` | organisationAssignmentId | O | historical-profile-migration-contract / REUSE |
| IPL InstitutionalPlacement | `institutionalPlacements` | institutionalPlacementId | T | unresolved-candidate / DESIGN |
| BPT SchoolPartnership | `schoolPartnerships` | schoolPartnershipId | T | unresolved-candidate / DESIGN |

### academic-delivery

| Record | Collection candidate | Document key / proposed key | Scope | Evidence / posture |
|---|---|---|---|---|
| PRG Programme | `programmes` | programmeId | C | unresolved-probe / DESIGN |
| CRS Course | `courses` | courseId | C | source-catalogue / REUSE |
| CUR CurriculumVersion | `curriculumVersions` | curriculumVersionId | C | unresolved-probe / DESIGN |
| DLV DeliveryOffering | `deliveryOfferings` | deliveryOfferingId | T | unresolved-probe / DESIGN |
| GRP LearningGroup | `learningGroups` | learningGroupId | T | unresolved-probe / DESIGN |
| GPL GroupPlacement | `groupPlacements` | groupPlacementId | T | unresolved-probe / EXTRACT |
| TAS TeachingAssignment | `teachingAssignments` | teachingAssignmentId | T | unresolved-probe / EXTRACT |
| SCP SchedulePlan | `schedulePlans` | schedulePlanId | T | unresolved-probe / EXTRACT |
| SES ClassSession | `classSessions` | sessionId | T | source-catalogue / EXTEND |
| SPT SessionParticipant | `sessionParticipants` | participantId | T | unresolved-candidate / EXTRACT |
| SST SessionStaff | `sessionStaff` | sessionStaffId | T | unresolved-candidate / EXTRACT |
| ATT AttendanceRecord | `attendanceRecords` | attendanceId | T | unresolved-candidate / EXTRACT |
| AEV AttendanceEvidence | `attendanceValidationEvidence` | evidenceId | T | source-catalogue / DESIGN |
| PCM ProgrammeCourse | `programmeCourses` | programmeCourseId | C | unresolved-candidate / DESIGN |
| UNT CurriculumUnit | `curriculumVersions/{curriculumVersionId}/units` | unitId | C | unresolved-candidate / DESIGN |
| SKL Skill | `skills` | skillId | C | unresolved-candidate / DESIGN |
| USK UnitSkill | `curriculumVersions/{curriculumVersionId}/units/{unitId}/skillLinks` | unitSkillId | C | unresolved-candidate / DESIGN |
| AYR AcademicYear | `schools/{schoolId}/academicYears` | academicYearId | O | source-contract / REUSE |
| TRM AcademicTerm | `schools/{schoolId}/academicYears/{yearId}/terms` | academicTermId | O | unresolved-candidate / DESIGN |
| GRD Grade | `schools/{schoolId}/academicYears/{yearId}/grades` | gradeId | O | source-contract / REUSE |
| SEC Section | `schools/{schoolId}/academicYears/{yearId}/sections` | sectionId | O | source-contract / REUSE |
| SEX ScheduleException | `scheduleExceptions` | exceptionId | T | unresolved-candidate / DESIGN |
| CAC CalendarAttendanceClaim | `calendarAttendanceClaims` | existing claimId (learner + IST day + start time) | T | source-catalogue / REUSE |
| MTR MeetingReference | `meetingReferences` | meetingReferenceId | T | unresolved-candidate / DESIGN |
| ACR AttendanceCorrection | `classSessions/{sessionId}/attendanceCorrections` | correctionId | T | source-catalogue / REUSE |
| AVC AttendanceValidationCase | `attendanceValidationCases` | caseId | T | source-catalogue / REUSE |
| AVD AttendanceValidationResolution | `attendanceValidationResolutions` | resolutionId | T | source-catalogue / REUSE |
| SAD SchoolAttendance | `schoolAttendanceRecords` | schoolAttendanceId | T | unresolved-candidate / DESIGN |

### learning-resources

| Record | Collection candidate | Document key / proposed key | Scope | Evidence / posture |
|---|---|---|---|---|
| REC RecordingReference | `recordingReferences` | recordingId | T | unresolved-candidate / DESIGN |
| RFL RecordingFolderAccess | `parentClassRecordings` | existing access record ID | T | source-catalogue / REUSE |
| LSN LessonDefinition | `lessonDefinitions` | lessonDefinitionId | C | unresolved-candidate / DESIGN |
| RES LearningResource | `lessons` | lessonId | C | source-catalogue / REUSE |
| LAC LearningActivity | `learningActivities` | activityId | T | unresolved-candidate / DESIGN |
| ASN Assignment | `assignments` | assignmentId | T | unresolved-candidate / DESIGN |
| SUB Submission | `submissions` | submissionId | T | unresolved-candidate / DESIGN |
| FBK Feedback | `feedback` | feedbackId | T | unresolved-candidate / DESIGN |
| ASD AssessmentDefinition | `assessmentDefinitions` | assessmentDefinitionId | C | unresolved-candidate / DESIGN |
| RUB RubricVersion | `rubricVersions` | rubricVersionId | C | unresolved-candidate / DESIGN |
| ASE AssessmentEvidence | `assessmentEvidence` | assessmentEvidenceId | T | unresolved-candidate / DESIGN |
| OBS LearningObservation | `learningObservations` | observationId | T | unresolved-candidate / DESIGN |
| SKE SkillEvidence | `skillEvidence` | skillEvidenceId | T | unresolved-candidate / DESIGN |
| MAS MasteryProjection | `masteryProjections` | masteryProjectionId | T | unresolved-candidate / DESIGN |
| CPG CourseProgressProjection | `students/{kidId}/courseProgress` | courseId (under learner) | T | source-catalogue / REUSE |
| PEV LearningProgressEvent | `students/{kidId}/progressEvents` | progressEventId | T | source-catalogue / REUSE |
| SAG SchoolAssessmentSummary | `schools/{schoolId}/academicYears/{yearId}/assessmentSummaries` | schoolAssessmentSummaryId | T | source-catalogue / REUSE |
| RLA RecordingLearnerAssociation | `recordingLearnerAssociations` | recordingLearnerAssociationId | T | unresolved-candidate / DESIGN |
| RPT AcademicReport | `academicReports` | academicReportId | T | unresolved-candidate / DESIGN |
| CED CredentialAward | `credentialAwards` | credentialAwardId | T | unresolved-candidate / DESIGN |
| WRS WorksheetResource | `parentWorksheetLibrary` | worksheetId | C | source-catalogue / REUSE |
| GRS GameResultEvidence | `kids/{kidId}/gameSessions` | gameResultEventId | T | source-catalogue / REUSE |

### commerce-operations

| Record | Collection candidate | Document key / proposed key | Scope | Evidence / posture |
|---|---|---|---|---|
| CHG Charge | `billingCharges` | sessionId for current source | T | source-catalogue / REUSE |
| PAY Payment | `payments` | paymentId | T | source-catalogue / DESIGN |
| PAL PaymentAllocation | `paymentAllocations` | paymentAllocationId | T | unresolved-candidate / DESIGN |
| ERN Earning | `teacherEarnings` | earningId (session ID or demo-specific key) | T | source-catalogue / REUSE |
| POT Payout | `teacherPayouts` | payoutId | T | source-catalogue / DESIGN |
| CNS ConsentRecord | `consentRecords` | consentRecordId | T | unresolved-candidate / DESIGN |
| FPR FacultyProfile | `teachers` | personId | I | historical-profile-migration-contract / REUSE |
| LPP LearningPartnerProfile | `learningPartners` | personId | I | historical-profile-migration-contract / REUSE |
| SPR StaffPrivateProfile | `staffPrivateProfiles` | staffPrivateProfileId | I | historical-profile-migration-contract / REUSE |
| PDT Product | `products` | productId | C | unresolved-candidate / DESIGN |
| COF CommercialOffer | `commercialOffers` | commercialOfferId | T | unresolved-candidate / DESIGN |
| CAG CommercialAgreement | `commercialAgreements` | commercialAgreementId | T | unresolved-candidate / DESIGN |
| ENT EntitlementGrant | `entitlementGrants` | entitlementGrantId | T | unresolved-candidate / DESIGN |
| BAC BillingAccount | `billingAccounts` | billingAccountId | T | unresolved-candidate / DESIGN |
| WAL WalletBalanceProjection | `parentWallets` | parentId (verified payer alias) | T | source-catalogue / REUSE |
| WTX WalletTransaction | `parentWallets/{parentId}/transactions` | transactionId (legacy replay key) | T | source-catalogue / REUSE |
| TOF TeacherPaymentOffset | `teacherPaymentOffsets` | offsetId | T | source-catalogue / REUSE |
| TWH TeacherPayWithholding | `teacherPayWithholdings` | sessionId | T | source-catalogue / REUSE |
| EAD TeacherEarningAdjustment | `teacherEarningAdjustments` | adjustmentId | T | source-catalogue / REUSE |
| FRC FinanceReconciliationCase | `financeReconciliationCases` | financeReconciliationCaseId | T | unresolved-candidate / DESIGN |
| LED Lead | `leads` | leadId | T | source-catalogue / REUSE |
| INQ Inquiry | `leads/{leadId}/inquiries` | inquiryId | T | source-catalogue / REUSE |
| CMP Campaign | `campaigns` | campaignId | T | unresolved-candidate / DESIGN |
| ADC AdmissionCase | `admissionCases` | admissionCaseId | T | unresolved-candidate / DESIGN |
| DEM DemoAttempt | `demoSessions` | demoAttemptId | T | source-catalogue / REUSE |
| DPR DemoPrivateContact | `demoSessionsPrivate` | demoId (verified DEM alias) | T | source-catalogue / REUSE |
| ARQ AdmissionRecommendation | `admissionRecommendations` | recommendationId | T | unresolved-candidate / DESIGN |
| SSC StudentSuccessCase | `studentSuccessCases` | studentSuccessCaseId | T | unresolved-candidate / DESIGN |
| GLD LearnerGoal | `learnerGoals` | learnerGoalId | T | unresolved-candidate / DESIGN |
| ITV Intervention | `interventions` | interventionId | T | unresolved-candidate / DESIGN |
| FUP FollowUp | `followUps` | followUpId | T | unresolved-candidate / DESIGN |
| FAC FacultyEngagement | `facultyEngagements` | facultyEngagementId | T | unresolved-candidate / DESIGN |
| RCT RecruitmentCase | `recruitmentCases` | recruitmentCaseId | T | unresolved-candidate / DESIGN |
| AVL FacultyAvailability | `facultyAvailability` | facultyAvailabilityId | T | unresolved-candidate / DESIGN |
| TRN FacultyTraining | `facultyTraining` | facultyTrainingId | T | unresolved-candidate / DESIGN |
| QAR TeachingQualityReview | `teachingQualityReviews` | qualityReviewId | T | unresolved-candidate / DESIGN |
| SGC SafeguardingCase | `safeguardingCases` | safeguardingCaseId | T | unresolved-candidate / DESIGN |
| PUP PickupAuthorization | `pickupAuthorizations` | pickupAuthorizationId | T | unresolved-candidate / DESIGN |
| PUE PickupEvent | `pickupEvents` | pickupEventId | T | unresolved-candidate / DESIGN |
| HLT LearnerHealthSafetyProfile | `learnerHealthSafetyProfiles` | learnerHealthSafetyProfileId | T | unresolved-candidate / DESIGN |
| CON Conversation | `messageThreads` | conversationId | T | source-catalogue / REUSE |
| MSG Message | `messageThreads/{threadId}/messages` | messageId | T | source-catalogue / REUSE |
| NIN NotificationIntent | `notificationIntents` | notificationIntentId | T | unresolved-candidate / DESIGN |
| NTF NotificationRecord | `notifications` | notificationRecordId | T | source-catalogue / REUSE |
| NDA NotificationDeliveryAttempt | `notificationDeliveryAttempts` | notificationDeliveryAttemptId | T | unresolved-candidate / DESIGN |
| NDT NotificationDeviceToken | `notificationTokens` | existing token hash ID | T | source-catalogue / REUSE |
| SUP SupportCase | `supportCases` | supportCaseId | T | unresolved-candidate / DESIGN |

### platform

| Record | Collection candidate | Document key / proposed key | Scope | Evidence / posture |
|---|---|---|---|---|
| CFG ConfigurationEntry | `config` | configurationEntryId | X | source-catalogue / REUSE |
| AUD AuditEvent | `auditLogs` | auditEventId | X | source-catalogue / REUSE |
| OUT OutboxEvent | `outboxEvents` | outboxEventId | X | unresolved-candidate / DESIGN |
| IJR IntegrationJobRun | `integrationJobRuns` | integrationJobRunId | X | unresolved-candidate / DESIGN |
| EXT ExternalReference | `externalReferences` | externalReferenceId | X | unresolved-candidate / DESIGN |
| PMD ProjectionMetadata | `projectionMetadata` | projectionMetadataId | X | unresolved-candidate / DESIGN |
| BPM BusinessAnalyticsYear | `adminStats/businessAnalyticsV1/businessAnalyticsYears` | year | P | current-source-contract / REUSE |
| BPC BusinessAnalyticsCurrent | `adminStats/businessAnalyticsV1/businessAnalyticsSnapshots` | current | P | current-source-contract / REUSE |

## Acceptance requirements

For each record, approve exact instance grain, key strategy (including tenant and parent namespace), field type/nullable/default semantics, source alias and coverage, versioning, unique constraints, reader/writer and permission matrix, query shape/index, bounded budget, recovery and lifecycle. For historical fields with unknown mapping retain original data and hold the affected migration; never infer missing facts. This matrix deliberately does not certify all source fields or path availability. No runtime tests, live production queries or changes occurred.
