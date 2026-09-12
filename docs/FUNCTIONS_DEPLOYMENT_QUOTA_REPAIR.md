# Bounded Cloud Functions deployment

## Incident and scope

Production CI/CD run `#2530` (`34713059931`) at commit `3e34735d9b31828f6c6cde397c3903a80151ce01` reached the Functions deployment after successful predeploy validation and then failed during a high-fan-out Functions mutation. The captured incident evidence includes regional HTTP 429/rate-limit failures and terminal failed function targets. A later main run successfully completed its Cloud Functions deployment, so this repair hardens the production deployment path against recurrence rather than treating PR checks as proof of production deployment success.

The nine terminal incident targets were `assignLPToParent`, `createEnrollment`, `createSessionsFromSchedule`, `onAdminAttendanceCorrectionCompletionBridge`, `onAdminAttendanceCorrectionTeacherPayDecisionLink`, `onClassSessionReadModelWrite`, `onParentProjectionBootstrapRequest`, `onSchoolCurriculumActivity`, and `onStudentProgressReadModelWrite`. They are incident references only, not a hard-coded deployment allowlist. A complete deployment plan is derived from the current compiled exports and therefore also includes newer exports such as `adminRepairRollingScheduleMaterialization`.

This change does **not** repair, mutate, or authorize any Sessions Management data. It does not invoke business callables, edit session documents, schedules, finance records, materialization metadata, auth rules, or function business logic.

## Deployment contract

- Discover deployable functions from the compiled `functions/lib/index.js` exports carrying Firebase `__endpoint` metadata. New exports are therefore included automatically.
- Require the verified Gen 2, Node 22, `asia-south1` topology and fail closed on an unexpected platform, runtime, region, duplicate, or unsafe selector.
- Because this repository has no explicit Firebase `codebase` annotation, deploy documented `functions:<export>` selectors in deterministic sequential groups of five.
- Pin the production Functions mutation CLI to Firebase CLI `15.30.0` for reproducibility.
- Preserve the existing production concurrency lock and the explicit retired-function allowlist. No active function is deleted/recreated by this repair.
- Wait at least 60 seconds plus jitter before the first mutation attempt for every batch. Retry waits are 120 and 240 seconds plus jitter.
- Check unfinished Cloud Functions v2 regional operations, with pagination and a ten-minute settlement bound, before and after deployment attempts.
- On a non-zero Firebase CLI exit, retry only terminal failed targets and only when the captured failure is attributable to a transient 429/rate/quota/resource-exhaustion class. Unknown, truncated, mixed, permission, invalid-argument, and build failures stop immediately.
- Recheck the live `main` SHA immediately before every mutation attempt. A stale workflow stops before starting another mutation; an already-running Firebase CLI process is never cancelled by this script.
- Verify every successful target through Cloud Functions v2 and Cloud Run v2: Function state must be `ACTIVE`, the Function revision must match Cloud Run's latest-created and latest-ready revisions, current generation must be observed, reconciliation must be finished, and that revision must receive 100% traffic.
- A failed Functions step exits non-zero, so later IAM/rules/hosting steps do not run.

## Diagnostics and privacy

A sanitized `artifacts/functions-deployment-report.json` records the workflow commit, Firebase CLI version, planned targets, attempts, target classifications, output byte counts/digests, and final verification status. Raw Firebase CLI output and full cloud metadata are intentionally excluded from the artifact because they can contain sensitive operational detail.

The report is diagnostic only. It is not a resume token and never authorizes partial production completion. A fresh workflow run replans the current compiled export set.

## Limits

Batching and backoff reduce deployment-time mutation bursts; they cannot create persistent regional CPU or project quota. If bounded retries still fail with explicit quota evidence, quota/capacity must be reviewed separately. This repair does not automatically lower function CPU, change `maxInstances`, move regions, or broaden IAM.

Read verification requires the existing deployment identity to be able to read Cloud Functions operations/functions and Cloud Run services. Missing permissions fail closed; this change grants no IAM permissions.

## Validation

After the normal Functions dependency install/build:

```sh
node --test scripts/test/functions-deployment.node-test.mjs
node scripts/deploy-functions-batched.mjs --plan
```

`--plan` imports compiled endpoint metadata but invokes no function handler and performs no cloud mutation.

## References

- Firebase: Manage functions / deploy specific functions and quota guidance
- Google Cloud Functions v2: operations list and Function/ServiceConfig resources
- Cloud Run v2: Service reconciliation, revision, generation, and traffic status fields
