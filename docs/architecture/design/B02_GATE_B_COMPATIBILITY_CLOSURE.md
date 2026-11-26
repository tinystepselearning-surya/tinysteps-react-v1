# B02 Gate B — compatibility closure evidence and adoption decision

27 November 2026 IST. Reviewed draft PR #968 at 7e48ec8f811b3102f247195a0f8639cd3bf9f872; current main 6b289bf1bd30c151328f2582bdec1b31e6f2d977. Owner authorizes completion of compatibility and dormant schema adoption within revision 65, not production activation or main merge. Previous 62/62 offline and 1/1 actual two-tenant emulator results retained, no new backend run.

## 1. Main delta disposition

Fetched actual current contents of all 19 paths changed since original main scan 95b44babd7f3132b212b781eabeec000fced14c8. None contains an exact proposed V2 collection identifier. Observed database/endpoint construction in the relevant delta: PublicAssessmentForm uses leads and setDoc; TrialForm calls subscribeNewsletter; useData retains existing fixed-root progress/classSessions/attendance/enrollments/invoices/courses/curriculum/kids and local batchFetch callers kids/courses/users; ParentDashboard uses existing kids/enrollments/students/config/courses/users/billingCharges/payments/parentWallets/classSessions/parentClassRecordings/parentMonthlyReadModels paths. firebaseConfig initializes existing SDK clients and emulator connections, no new authority imports. Remaining changed files are analytics/privacy/form/display/workflow/tests; inspected content, no direct proposed binding or new candidate authority reference. This is exact changed-file inspection, not transitive proof that every existing callable or helper is safe.

| Current main path | Blob |
|---|---|
| .github/workflows/arg1-demo-request-event-semantics.yml | 3db72bcb8c8a9051119ec8cf02f25474823c3e1c |
| scripts/audit-commercial-c0-foundation.mjs | 99b0d935966d80990ebc429a446f004b596fce96 |
| scripts/test/arg1-demo-request-event-semantics.node-test.mjs | 51bd5e074bf66dc5dd349448bec9e15310fb2606 |
| src/components/Home/GlobalImpactSection.tsx | 79a7ab56cbd3e1c73815c0b00eed836e125e64a0 |
| src/components/common/AdvisorContactForm.tsx | efe4341ef22f36e965d6ff6334925928f6bfcfb5 |
| src/components/common/ConversionTracker.tsx | 52e22066e6bf063c69e020d2df1520750c58e5e5 |
| src/components/forms/PublicAssessmentForm.tsx | 3c0eed95aa6566faf7608f196c20732e0a89037a |
| src/components/forms/TrialForm.tsx | cbd1ed93ba56c9f11a325c46ba8a3c9d897dc401 |
| src/components/programs/ProgramLeadForm.tsx | b8b80155e9482825860ead2262c360fe8349031a |
| src/hooks/useData.ts | d8bd09063fc381cd009cdfaa34753c3f0d8bcd74 |
| src/lib/analytics.ts | 6e923f6cd1711a0d4195fdc7ddb19290302ec2ab |
| src/lib/analyticsPrivacy.ts | 7b06ff8f77b69dd5aae5461a7af8200e98365238 |
| src/lib/conversionTracking.ts | e51255129dc06d0829a358b23ff6d2eef59ffea1 |
| src/lib/firebaseConfig.ts | 8bc89d5f1961a689620935324773223343715243 |
| src/pages/parent/ParentDashboard.tsx | b372a78ae2469e9e2f8347e71d509fc92536e431 |
| src/tests/components/PublicAssessmentForm.spec.tsx | 2365e971dc0762b8b32609eb502aa7d134bdd251 |
| src/tests/hooks/useSessionsForTeacher.spec.tsx | 24565649fae68312f8a4dc81587c2b294e0eea7a |
| src/tests/lib/analyticsPrivacy.spec.ts | f8c8d5029f7d178d09d78683e1dc62322c7453af |
| src/tests/seo/bookAssessmentClickConsolidation.spec.ts | d9c671a31e578ca7ea91032ee67677631dc64749 |

## 2. Relevant legacy identity owner/lane and lifecycle findings

Pinned current-main actual source reads, supplementing prior evidence tables. No V1 modifications.

| Path relative to functions/src | Blob | Observed writer/reader disposition |
|---|---|---|
| schoolOS/identity/contracts.ts | be340ac4cb6be06effa1d09e1510a1e75f08c70a | Existing AUT/PER/ORG version/status/type semantics consistent with representative action's restricted required fields. Existing eight canonical collection names, no V2 binding. |
| schoolOS/identity/canonicalPrimaryAuthUserCreate.ts | 7c081a049f515c0c6f23cda39fd0b81e966957e2 | Observed plan documents include people/authIdentities/roleAssignments/personContacts/staffPrivateProfiles/users; probes include people/users/kids. Dynamic transaction set receives planned collection. Preserve; trace complete plan and callsite closure before final adoption. |
| schoolOS/identity/canonicalPrimaryAuthUserUpdate.ts | b2c71c78cd3e30261fd9e3adec6574015e459173 | Observed plans name people/authIdentities/personContacts/roleAssignments/users; transaction resolves required/guarded/operation.collection, may set/delete existing legacy records. Preserve and finish plan closure; no V2 authority write assigned. |
| schoolOS/identity/canonicalPrimaryAuthUserArchive.ts | b197c9dab0494cdf18ad654fcc15fe8728b00750 | Observed people/authIdentities/roleAssignments/personLifecycle/users plans; transaction applies planned set. Shared AUT/PER changes must be observed by current V2 read set. |
| schoolOS/identity/canonicalPrimaryLearnerUpdate.ts | 693bd2da5a3ff1a5a45da1c2bd34cf74712534ab | Direct people/learnerProfiles/learnerDetails/kids reads and transaction sets; no new V2 target. Retain learner identity semantics and V1 behavior. |
| schoolOS/identity/canonicalPrimaryTeacherProfile.ts | b6b07054e409c8779502d48b734a05052c2ab14a | Observed plans people/personContacts/users/teachers and authIdentities/roleAssignments probes; planned transaction sets. Existing profile path preserved. |
| schoolOS/identity/canonicalPrimaryWriter.ts | 30070d813ed9e44b56e59ccf01cc1aada3339825 | Dynamic planned collection references, existing users/people/roleAssignments/kids paths and learner creation transaction; trace complete plan unions. |
| schoolOS/identity/legacyPlanner.ts | 1cc53cd8d5768bc4fe0fed036a74154d120c669e | Planner source inspected; earlier fixed source scope and canonical mapping evidence retained. Need final exact plan target-set disposition with legacySync. |
| schoolOS/identity/legacySync.ts | 5c743bd4fb764904dc2901e0bbd9d82b87092af9 | Dynamic sourceCollection/candidate/expected/stale path references; legacy direct users/kids/schools/schoolUsers/people/authIdentities. Existing writes and deletes preserved, not authorized to execute here. Complete dynamic planner and stale-record path trace. |
| adminCreateUserCanonical.ts | 249386a0717bbefdf3e46d6f41e37d48aade579c | Existing onCall, canonical create and projection maintenance imports; observed users/people. |
| adminUpdateUserCanonical.ts | e7879efb7f1eab7f5fc6e08266e162f299b10628 | Existing onCall, canonical update/compatibility/maintenance imports; users/people. |
| adminArchiveUserCanonical.ts | 00f1db2e0737f95d5c24950d437595e20db0ae7a | Existing onCall, canonical archive/compatibility/maintenance imports; users/people. |
| adminSetUserRoleCanonical.ts | 328cdd120cc8761d9f791f07206ec5776e77a2b0 | Existing role update uses legacy canonical update and projection refresh, users/people. |
| adminCreateUser.ts | 706ab678b4976577d9ea9b5c88fd3abc89a0c25f | Reexports canonical create; existing backfillTeacherDocs uses users/teachers. |
| adminUpdateUser.ts | df430d98ff7b6fdcaa60194377fdb303a216be4a | Reexports canonical update. |
| adminArchiveUser.ts | 6c62c04232da78230cb68926cc3d62066f255841 | Reexports canonical archive. |
| schoolOS/identity/authUserActivation.ts | b191c0634769479d4799a333228fbc53ea97f34b | Existing role/status and write-ID helper; no new V2 service. |
| schoolOS/identity/authAccessReadModelMaintenance.ts | 516ca22de315edfae6e5a22473fe3f2be66738e7 | Strict/best-effort refresh and existing projection deletion on imported fixed collection. |
| schoolOS/identity/authAccessAuthorization.ts | 812429177c5dd9c7fcad6616e4a7d05bac20aeb5 | Existing read-model principal, retained V1 lane. |
| schoolOS/identity/authAccessReadModel.ts | 461dbab181c6d77b21fc75f5871ce6244dc840ab | Current fixed canonical reads and personId-scoped legacy role/membership queries; projection writer uses fixed imported constant. |
| updateTeacherProfile.ts | 72f475b9ffde8b63dbff9e2136b4902d3fd67719 | Existing onCall and canonical teacher profile adapter; observed users read. |
| schools.ts | b0170385bc1d2e155e07d9267392e593111ad53e | Existing schools/users/schoolUsers/learningPartnerAssignments paths and V1 read-model authorization; campus.create does not replace existing school creation. |
| lifecycle.ts | a2f4e3a3d0d47df2f6edb5bdd56d5cb6a0bf9aa9 | Existing enrollment/session/teacher lifecycle uses fixed and imported operational collection constants; no proposed V2 literal, preserve B03 and financial business behavior. |

Partial exact source findings, not a complete transitive writer graph. Legacy authentication changes do not implicitly acquire V2 grant or fence semantics. Live Firebase token revocation, V1 lifecycle propagation and role change ownership require later activation verification. Shared canonical AUT/PER/ORG remain current transaction inputs, not duplicate identity service.

## 3. Dormant deployment boundary

Actual main and candidate Functions entry files inspected: main 1850b93a1fd6bb7873735c993db7b3608ed68113, candidate 5305337dd4106468aecdc428c5c6286853d70f5d. Neither contains references to server-authority, the candidate modules, registry-successor or V2 collection names. Both retain existing identity exports. functions/tsconfig.json 2ba14d7818a2cc95f3f0fa8b50340f77b2817f08 includes only src, output lib, CommonJS. functions/package.json 89329df4b5efe0ffd707383079baeaf4cf54869c entry lib/index.js, build tsc. firebase.json 89d18ad95fa6c317fd38750d16de10a3c3471739 Functions source functions, Hosting dist. Root package.json 8a646d2fcbafabd6172853d1169e60d5dccc854b inspected build/prebuild/postbuild commands; no direct candidate imports or invocations observed. Deploy workflow 18e0f96d9a7254b449a68334c66c53ad6f612711 unchanged and no candidate reference. New modules outside Functions deployment tree at scripts/architecture/server-authority; backend runner outside production tree. This establishes the direct configured boundary, not complete transitive import or deployment-impact certification. Continue graph and exact integration check. Rules inspection retained, live Rules parity separate.

## 4. Required remaining source evidence

Original report SHA256 af0e258ad95e018a99f86b910c55b47f9d1771d5c2a357b022ebf8552a47b058 retained; 433/435 constructor candidate paths, 276/315 legacy references, broad overlap and false-positive candidates (including a tracked MP3); one literal in approved proposal, no literal on originally scanned main. Path/hash inventory alone does not disclose the expressions/callers. Full clone unavailable in current environment; connector per-file reads cannot be treated as complete affected-path inspection. Need one source-only transfer from owner's existing Git checkout, not another emulator or repeat of literal scan. Standalone local collector prepared, syntax checked on Node 22.16.0 and exercised with two synthetic Git commits (test-only substituted pins): exact blob extraction, deduplication, credential-like-path/asset exclusion, archive verification, clean worktree passed. Actual private-tree extraction not run. Collector SHA256 e29ae67353cddc0bc1359695c1dbc5cd988e19919f0b0ec0a0cea8783b3dfe61, Git blob bbfb12e89502e5a0d3feea92a3118d6d5d388149. It reuses and hash-verifies original report and exact original Git evidence, exports selected tracked source/build/schema/workflow files by Git blob ID, records metadata for excluded paths, deduplicates identical bytes, no execution of source, no credential-file/local-data collection, no database, no emulator, no deployment. Credential-like path filtering is not secret scanning of source content; owner should treat bundle as private repository source. Pin main 6b289bf1bd30c151328f2582bdec1b31e6f2d977, candidate 7e48ec8f811b3102f247195a0f8639cd3bf9f872; later documentation-only successor not a different executable candidate. Bounded source-only bundle supplied by owner for analysis in this project, no external publishing.

Then inspect actual path construction and imported call chains, classify every affected runtime/operator selector by owner/read-write lane and concrete allowed roots; document non-affecting test/docs/asset/unknown artifact residuals based on evidence. Resolve or hold any unbounded selector that could reach reserved V2 roots; verify dormant entry graph; preserve all 61 main newer/different paths. No arbitrary whole-repository security guarantee. No repeated generic R5 or prior offline/backend tests solely for documentation.

## 5. Adoption disposition

**HOLD — affected computed-path/reader-writer closure incomplete.** All nine proposed contracts already approved for dormant implementation and verified in registry candidate/fixtures. Do not change candidate-not-adopted manifest or tested validator to claim final adoption before completing mandatory evidence. No production access needed. Upon closure, record explicit versioned dormant adoption referencing unchanged verified schema and code pins (retain historical registry and test evidence), then one consolidated Gate B technical acceptance, focused current-main B01+B02 integration, CI and deployment-impact review. No main merge or Gate C activation. No new preliminary design review. Current work is source compatibility inspection and documentation, not implementation modification or deployment.
