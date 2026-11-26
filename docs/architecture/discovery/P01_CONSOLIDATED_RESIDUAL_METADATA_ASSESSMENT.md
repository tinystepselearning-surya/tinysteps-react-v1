# P01.2 — consolidated residual metadata assessment and approval decision

**Status: prepared for private approval; NOT AUTHORIZED OR EXECUTED.** R61 offline index reconciliation accepted. This narrows and corrects the existing [P01 metadata-only packet](P01_METADATA_ONLY_APPROVAL_PACKET_2026-11-26.md); its stricter scope, privacy, stop and independent-review requirements prevail. The proposed batch is not a runnable operator, permission grant, or live assessment. Do not re-run confirmed metadata simply to collect more evidence.

## 1. Evidence that can be reused

| Surface | Current evidence | Disposition |
|---|---|---|
| Project / database | Owner Terminal reports actual default database identity/type/location and successful keyless restricted and administrative metadata connectivity | Reuse privately; current identity must be anchored at start of an approved new batch |
| Whole-database deletion protection | Owner reports successful enablement | Recorded; does not protect individual documents |
| PITR / retention | Owner reports PITR disabled and one-hour version retention | Recovery risk; separate cost and recovery decision, not evidence of backup absence |
| IAM | Project-level IAM checks and connectivity; restricted analytics identity has document-read grants; dedicated administrator has write grants | Neither identity meets the strict metadata-only packet; former metadata-only identity has no tested Firestore grants in latest owner evidence |
| Index source | R61 Mac source-only/self-check PASS; 34 declarations, 32 unique across four priority groups | Reuse validated utility; actual deployed index state not established |
| Rules, indexes, Hosting source | Git source/marker comparison below | Source parity only; no cloud artifact or Rules digest certified |
| Previously attempted metadata | R24 private partial evidence and stop on invalid parameter | Review existing evidence privately; no assumptions about its unreported coverage |

Fresh Git observations at preparation: main 95b44babd7f3132b212b781eabeec000fced14c8; functions marker same; hosting marker 549bb9669465901223674785b0879de39477ed68; Rules marker b181dbca2e835869bf52b3ba0632b957234eae1d; index marker 7f93c81a9eea909f06d76c1a2d6ba1c3df5b6e9f. R61 isolated 40b85bce06f79225a6839409f41aea9441e61c76. Source blobs identical across main, relevant marker and isolated baseline:

| File | Blob |
|---|---|
| firestore.indexes.json | b7e9e4d2cf029b5218294b987240992774e7f9e0 |
| firestore.rules | 161624f9f8e25f2b5aa7aa9cc3a19548f08db30e |
| storage.rules | 39724a79a7ec8c5e9f7c2f4f6ac1803f3230d5e3 |
| firebase.json (Hosting marker) | 89d18ad95fa6c317fd38750d16de10a3c3471739 |

Current index source: 66 declarations in 23 groups; four selected groups contain 34 declarations/32 unique; 19 groups outside selected scope. Do not infer actual deployed counts. Git markers are not proof of deployment. Recheck pins and applicable hold flags before any future authorized execution.

## 2. One bounded residual batch — proposed maximum 13 GET requests

Select only outstanding rows using private evidence, but retain project/database anchors for a new run. Paths below are resource templates, not authorization. P=privately approved project ID; N=project number; D=exact database ID, URL-encoded in URL only; L=actual approved location; U=approved database UID; R=approved full Rules release name; B=bucket; S=site. Verify raw response identifiers against the approved unencoded resource names; a mismatch stops. No wildcard paths. For Hosting omit unless a previously approved narrowly scoped role is acceptable; do not expand scope to get a match.

| Requests | GET endpoint and exact field mask | Required permission candidate / result |
|---:|---|---|
| 1 | cloudresourcemanager.googleapis.com/v3/projects/P ; name,projectId,state | resourcemanager.projects.get; match N/P and ACTIVE |
| 1 | firestore.googleapis.com/v1/projects/P/databases/D ; name,uid,locationId,type,databaseEdition,deleteProtectionState,pointInTimeRecoveryEnablement,versionRetentionPeriod,earliestVersionTime | datastore.databases.getMetadata; match name, U, L, Native/Standard |
| 1 | firestore.googleapis.com/v1/projects/P/databases/D/backupSchedules ; backupSchedules(name,retention,dailyRecurrence,weeklyRecurrence) | datastore.backupSchedules.list; exact schedule parent, cadence and retention |
| 1 | firestore.googleapis.com/v1/projects/P/locations/L/backups ; backups(name,database,databaseUid,snapshotTime,expireTime,state),unreachable ; filter=databaseUid=U | datastore.backups.list; verify name parent, database and U, timestamps and state |
| 4 | firestore.googleapis.com/v1/projects/P/databases/D/collectionGroups/G/indexes ; indexes(name,queryScope,apiScope,density,fields,state),nextPageToken ; G=classSessions,months,billingCharges,teacherEarnings only | datastore.schemas.list; feed approved local evidence to R61 comparator |
| 1 | firestore.googleapis.com/v1/projects/P/databases/D/collectionGroups/gameSessions/fields ; fields(name,indexConfig(usesAncestorConfig,indexes)),nextPageToken ; filter=indexConfig.usesAncestorConfig:false | datastore.schemas.list; compare exact createdAt directional override, no TTL conclusion |
| 2 | firebaserules.googleapis.com/v1/R ; name,rulesetName,updateTime ; exact Firestore and Storage release names | firebaserules.releases.get; compare names, ruleset references and timestamps only |
| 1 | storage.googleapis.com/storage/v1/b/B ; name,projectNumber,location,storageClass,versioning,softDeletePolicy,retentionPolicy,iamConfiguration,lifecycle(rule(action(type),condition(age,numNewerVersions,isLive))) ; projection=noAcl | storage.buckets.get; verify project number and name, record recovery/security settings only |
| 1 optional | firebasehosting.googleapis.com/v1beta1/sites/S/channels/live ; name,updateTime,release(name,type,releaseTime,version(name,status)) | firebasehosting.sites.get candidate; confirm role scope and exact site/channel privately |
| **13** | **12 without Hosting; fewer if residual rows already established** | **No retries, no pagination or other calls within this batch** |

Corrections to older illustrative commands: include backup databaseUid AND backup name in the response mask to verify identity and detect wrong-generation database linkage; include index apiScope/density consistent with R61 Standard comparator; omit nonzero pageSize on index and field list due to earlier observed request error (API documents parameter, successful omission still unverified live). Keep pagination indicators. Bucket projectNumber included to check ownership. No collection enumeration, document/object/Auth reads, Rules source retrieval, secrets, callable invocation, functions/scheduler listing, import/export, backup creation, mutation, deployment or automatic remediation. Field override is a separate assessment; no TTL coverage claim. Existing Rules source/deployed digest, Functions/scheduler and full index coverage are still deferred, not waived. Hosting release identifiers alone cannot establish commit equality.

## 3. Permission and reviewer decision

Prefer the existing dormant metadata-only account, not a new server or use of the existing database administrator/analytics reader. A narrow temporary approved metadata role may need restoring; minimum proposed permission candidates in section 2 are not a role grant and must be checked for custom-role support and actual resource-level applicability, including effective inherited/conditional/impersonation access and quota requirements. Hosting custom roles are unsupported; use a separately approved acceptable predefined role or omit. Do not attach any role by default. No entity get/list/create/update/delete, object read/list, Auth listing, IAM modification, impersonation of broader principals or admin permissions for the metadata worker. Owner retains separate administrative capability for specifically approved changes. Review potential broader impersonation chains. Existing account project-level permission output does not independently certify effective resource permissions.

Complete privately before any request: named executive owner and independent security reviewer; named metadata-only operator and effective permission evidence; exact targets and already completed residual rows; immutable reviewed command bundle; explicit UTC start/expiry and max selected request count; optional Hosting and quota decision; secure credential issuance, private evidence storage and expiry/redaction. No secrets, identities or resource manifests in Git or chat. The general instruction to continue engineering is not authorization for live metadata or production reads. AI-led review is not independent certification.

## 4. Execution and result contract for separately approved operator

Proposed absolute maximum window 20 minutes; per-request maximum 15 seconds; zero retries, no automatic pagination. Restrict to selected exact GETs and bounded response sizes; enforce the deadline and stop on expiry, resource mismatch, denial, unsupported fields, partial page, unreachable location, unexpected sensitive response, source drift or scope overflow. No live command adapter is introduced here. Prepare and independently review the actual local execution procedure using the approved values, selected endpoints, credential identity and external controls; do not paste older illustrative scripts unchanged. Do not claim OS isolation or independent review from local CLI alone.

Use accepted R61 comparator only on complete authorized index evidence. Keep raw metadata privately; retain only approved counts, protection status, digest/marker evidence, timestamps and PASS/REVIEW_REQUIRED/INCOMPLETE/NOT_ACCESSED findings. Backup READY and recent snapshot do not establish tested recovery. A missing schedule or backup is a finding after valid complete evidence, not an invitation to create one. Report exact cap, attempted/completed counts, denied/unreachable results, stop reason, exclusions and zero document reads/writes; evidence provenance and identity verification are separate. If any required check is incomplete, report partial, not PASS. A matched subset is not P01.2 closure or M3/production authorization.

## 5. Next decision (no repeat synthetic testing)

Infrastructure owner and independent reviewer review the selected batch and credential scope. Then authorize a single MacBook operator run under the existing packet. If approval cannot yet be obtained, keep live assessment on HOLD and identify whether any existing authorized source-only design work is independently actionable; do not promote P01/P02/P03 or M3 gates. R59 accepted 570 tests and R61 focused utility remain intact. No infrastructure provisioning, new IAM, application access or deployment in this increment.

Public API references (contract review, not live verification): [index list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.collectionGroups.indexes/list), [field list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.collectionGroups.fields/list), [backup list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.locations.backups/list), [backup fields](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.locations.backups), [schedule list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.backupSchedules/list), [Rules release get](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/get), [bucket get](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/get), [Hosting channel](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels/get), [Firestore IAM](https://docs.cloud.google.com/firestore/native/docs/security/iam), [Firebase permissions](https://firebase.google.com/docs/projects/iam/permissions/).
