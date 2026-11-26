# P01.2 — restricted infrastructure metadata verification approval packet

**PREPARED — NOT APPROVED — NOT EXECUTED.** Date 26 Nov 2026 IST. Pinned source main 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Source .firebaserc default project tinysteps-react-v1 is a candidate, not confirmation of the active production context. The owner/security operator must verify and approve the exact environment and resource IDs privately before any request. This packet covers metadata only, distinct from M3 actor or database sampling approval. Existing stricter requirements prevail.

## Proposed scope and minimum evidence

| Surface | Read-only metadata evidence requested | Exclusions |
|---|---|---|
| Project / Firestore database | project ID, enabled services, database ID/type/location, edition, deletion protection, PITR/retention settings | no document get/list/query, collection sampling, export or backup creation |
| Indexes and Rules | index definitions/state, current Rules release and source digest where retrievable, Storage Rules metadata | no deploy, validation write, rule change, object listing/content |
| IAM | effective operator permissions and service-account role/binding metadata for approved resource scope; redact principal identifiers in public evidence | no keys, tokens, credential download, role changes, impersonation or secrets payloads |
| Functions and scheduler | deployed function IDs, region/runtime/generation, revision/update time, non-secret trigger type/path and schedule, service account role category, deployment artifact identifier where available | no invocation, retry, pause/resume, update, raw environment-variable/config dump, logs with personal data |
| Hosting / Storage | production site, active release/version and associated commit/digest evidence if available; bucket location, uniform access/public-access prevention/retention/lifecycle metadata | no deploy, object names/content or signed URLs, no object modification |
| Backup / recovery | existing policy/schedule and backup metadata/count/status, retention/PITR enabled; note recovery evidence absent | no backup/restore/export jobs; no RPO/RTO certification from metadata alone |
| External providers | existing approved configuration metadata: routing/region, retention, account type, integration owner; only separately scoped read-only provider access | no Teams meetings, messages, participant lists, child data, email, push, Canva access, payment calls or provider mutations |

No broad project Viewer grant recommendation: use the narrowest existing or separately security-approved metadata read permissions. Operator IAM and end-user Rules checks are distinct. Never request/record service-account keys, secret values, raw environment dumps or individual records. A Git marker does not independently prove a deployed artifact digest. Mark unavailable evidence explicitly.

## Proposed conservative execution limits (owner may approve narrower scope)

- Exact project, database(s), region(s), sites, function/scheduler families, bucket(s), backup metadata, time window and approved provider surfaces listed privately.
- Zero application Firestore document reads/queries, zero object-content reads, zero Auth user listing, zero user sessions, zero mutations, zero callable invocations, zero provider business records. No collection sampling.
- Suggested maximum 40 metadata API requests, 20 minutes, at most one retry for transient error counted within cap; do not paginate beyond approved cap. If inventory exceeds cap, stop and seek separate scoped approval; do not silently claim complete enumeration. These are proposed operator request limits, not billed read guarantees.
- Use metadata field masks where supported. Do not fetch or retain complete configuration payloads containing secrets. If safe field-limited retrieval unavailable, classify inconclusive.
- Stop on project/account mismatch, source drift, permission error, scope overflow, unexpected sensitive response or any mutation risk; sanitize evidence, no further access. Denied/unavailable/missing evidence are distinct.
- No role assignment, installation, secret inspection, database writes or automatic repair to make a verification pass.

## Private approval record (empty means unauthorized)

Owner/security reviewer: [not designated]; authorized metadata operator: [not designated]; project/environment: [unconfirmed]; resource allowlist: [not approved]; credential mechanism/permissions: [not approved]; exact window/cap: [not approved]; allowed providers: [not approved]; evidence retention/redaction: [not approved]; approval reference: [not approved]. Do not check actual principal IDs, secrets or private allowlist into repository. Owner must explicitly approve each scope before execution.

## Output contract and gates

Return privacy-safe matrix of surface, expected source configuration, observed metadata, timestamp, resource/revision identifier safe to publish, evidence provenance, PASS/FAIL/INCONCLUSIVE/NOT ACCESSED, owner and gap. Compare source vs observed rather than assume historical M3 inventory is current. No application data coverage, role parity, backup restore success, latency/cost baseline or production readiness claim from metadata alone. Any configuration mismatch is a finding, not authorization to fix. Metadata-only verification cannot close P01.3–P01.9 or M3.

Existing [M3 approval packet](../wave-1/IDENTITY_R5_M3_PRODUCTION_CANARY_APPROVAL_PACKET.md) remains PREPARED NOT APPROVED and separate; migration ledger at pinned main rechecked M3 verification_in_progress, finalExitGate not_attempted, productionMutationsAuthorized false. Any future approved bounded Firestore sample requires separate exact fixtures/fields/budgets, and any canary requires designated actors/legitimate sessions and existing M3 rules. P01.2 remains HOLD pending explicit approval and usable authorized operator environment; no access attempted. Rollback of this packet is docs-only; no live changes.

## Revision 20 operator procedure

**Approval and ownership.** The Infrastructure Owner supplies the exact project ID and project number, database IDs and locations, Rules release names, bucket, Hosting site, Function names/generations/locations, Scheduler job names and the request window in a private approval record. Security independently reviews effective permissions, inherited access, quota project and expiry. A pre-existing authorized identity is required. This procedure grants nothing. Treat inherited data or write privileges as a blocker for the metadata operator. Endpoint parameters below come from the signed scope. Run no live request until it is complete.

| Approved surface | Minimum service permissions for calls below |
|---|---|
| Resource Manager | `resourcemanager.projects.get` for exact project |
| Service Usage | `serviceusage.services.list` for approved enabled-service page. `serviceusage.services.use` on the approved quota project only if required. |
| Firestore | `datastore.databases.getMetadata` for each database. `datastore.databases.list` only if database enumeration is separately selected. `datastore.schemas.list` for indexes. `datastore.backupSchedules.list` and `datastore.backups.list` for their corresponding calls. |
| Firebase Rules | `firebaserules.releases.get`. Optional `firebaserules.rulesets.get` only if the release source digest is explicitly authorized. |
| Functions and Scheduler | `cloudfunctions.functions.get`, `cloudscheduler.jobs.get`. Scheduler target bodies and headers stay excluded. Do not add `cloudscheduler.jobs.fullView`. |
| Cloud Storage | `storage.buckets.get` on the approved bucket, without object IAM permissions. |
| Firebase Hosting | `firebasehosting.sites.get` via an already authorized Hosting Viewer (`roles/firebasehosting.viewer`). Hosting does not support a custom role for this access. Review any extra role permissions before use and omit Hosting if the role is outside the approved scope. |
| IAM verification | Security reviewer verifies effective scope before execution using existing IAM review access. A direct project policy check, if separately approved, requires `resourcemanager.projects.getIamPolicy`; it does not establish inherited permissions on its own. This is outside the command batch. |
| External providers | Remain out of this executable scope until an owner approves a provider-specific least-privilege plan. |

Sources: [Firestore Native IAM](https://docs.cloud.google.com/firestore/native/docs/security/iam), [Firebase IAM](https://firebase.google.com/docs/projects/iam/permissions/), [Google Cloud authentication](https://docs.cloud.google.com/docs/authentication/rest), [Service Usage list](https://docs.cloud.google.com/service-usage/docs/reference/rest/v1/services/list), [Functions get](https://docs.cloud.google.com/functions/docs/reference/rest/v2/projects.locations.functions/get), [Scheduler get](https://docs.cloud.google.com/scheduler/docs/reference/rest/v1beta1/projects.locations.jobs/get), [Storage get](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/get), [Hosting live channel get](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels/get).

### Exact commands for an approved operator

Stage the private variables below through the approved operator environment, without storing values in Git. Use a new Bash process in a private working directory with command tracing and history recording disabled. Use only the lines for approved surfaces. One call per exact resource and location. The count covers metadata API requests, separate from credential issuance. Check account locally with `gcloud auth list --filter=status:ACTIVE --format='value(account)'`, match privately to the named operator, and confirm the approved time window and evidence retention. The first HTTP result must match both project identifiers and show an active project. The first mismatch, permission or endpoint error stops the run. No implicit pagination or retries.

```bash
set +x
set -euo pipefail
umask 077
: "${P01_ACCOUNT:?}" "${P01_PROJECT:?}" "${P01_PROJECT_NUMBER:?}"
: "${P01_APPROVAL_REFERENCE:?}"
P01_PRIVATE=$(mktemp -d)
trap 'unset P01_TOKEN; rm -rf -- "$P01_PRIVATE"' EXIT
P01_TOKEN=$(gcloud auth print-access-token --account="$P01_ACCOUNT" --quiet)
P01_START=$SECONDS
P01_CALLS=0
mget() {
  local label=$1 url=$2 fields=$3
  shift 3
  (( P01_CALLS < 40 && SECONDS - P01_START < 1185 ))
  P01_CALLS=$((P01_CALLS + 1))
  local quota=()
  if [[ -n ${P01_QUOTA_PROJECT:-} ]]; then
    quota=(-H "X-Goog-User-Project: $P01_QUOTA_PROJECT")
  fi
  printf 'header = "Authorization: Bearer %s"\n' "$P01_TOKEN" |
    curl --disable --config - --silent --show-error --fail --proto '=https' \
      --retry 0 --max-time 15 --get "${quota[@]}" --data-urlencode "fields=$fields" \
      "$@" "$url" --output "$P01_PRIVATE/$label.json"
}
mget project "https://cloudresourcemanager.googleapis.com/v3/projects/$P01_PROJECT" 'name,projectId,state'
jq -e --arg id "$P01_PROJECT" --arg name "projects/$P01_PROJECT_NUMBER" \
  '.projectId == $id and .name == $name and .state == "ACTIVE"' "$P01_PRIVATE/project.json" >/dev/null

# Enable only approved calls. Inputs below are the exact authorized resource names.
F="https://firestore.googleapis.com/v1/projects/$P01_PROJECT"
D="$F/databases/$P01_DATABASE" # URL-encode the ID in this variable, e.g. %28default%29.
mget services "https://serviceusage.googleapis.com/v1/projects/$P01_PROJECT_NUMBER/services" \
  'services(config(name),state),nextPageToken' --data-urlencode 'filter=state:ENABLED' --data-urlencode 'pageSize=50'
# Optional enumeration, if separately selected.
mget databases "$F/databases" 'databases(name,locationId,type),unreachable'
mget database "$D" 'name,uid,locationId,type,databaseEdition,deleteProtectionState,versionRetentionPeriod,earliestVersionTime,pointInTimeRecoveryEnablement'
mget indexes "$D/collectionGroups/$P01_COLLECTION_GROUP/indexes" 'indexes(name,queryScope,fields,state),nextPageToken' --data-urlencode 'pageSize=50'
mget field_overrides "$D/collectionGroups/$P01_COLLECTION_GROUP/fields" \
  'fields(name,indexConfig(usesAncestorConfig,indexes)),nextPageToken' \
  --data-urlencode 'filter=indexConfig.usesAncestorConfig:false' --data-urlencode 'pageSize=50'
mget schedules "$D/backupSchedules" 'backupSchedules(name,retention,dailyRecurrence,weeklyRecurrence)'
P01_DATABASE_UID=$(jq -er '.uid | select(type == "string" and length > 0)' "$P01_PRIVATE/database.json")
mget backups "$F/locations/$P01_FIRESTORE_LOCATION/backups" 'backups(database,snapshotTime,expireTime,state),unreachable' \
  --data-urlencode "filter=databaseUid=$P01_DATABASE_UID"
mget rules "https://firebaserules.googleapis.com/v1/projects/$P01_PROJECT/releases/$P01_RULES_RELEASE" 'name,rulesetName,updateTime'
mget bucket "https://storage.googleapis.com/storage/v1/b/$P01_BUCKET" \
  'name,location,storageClass,versioning,softDeletePolicy,retentionPolicy,iamConfiguration,lifecycle(rule(action(type),condition(age,numNewerVersions,isLive)))' --data-urlencode 'projection=noAcl'
mget hosting "https://firebasehosting.googleapis.com/v1beta1/sites/$P01_SITE/channels/live" \
  'name,updateTime,release(name,type,releaseTime,version(name,status))'
mget function "https://cloudfunctions.googleapis.com/v2/projects/$P01_PROJECT/locations/$P01_FUNCTION_REGION/functions/$P01_FUNCTION" \
  'name,environment,state,updateTime,buildConfig(runtime),serviceConfig(revision),eventTrigger(eventType,triggerRegion)'
mget scheduler "https://cloudscheduler.googleapis.com/v1beta1/projects/$P01_PROJECT/locations/$P01_JOB_REGION/jobs/$P01_JOB" \
  'name,schedule,timeZone,state'
```

For each additional approved resource supply a distinct label to avoid overwriting private evidence. For named Rules releases, preserve the separators in the exact approved release ID. If separately authorized to hash Rules source, read the exact `rulesetName` returned for the same project with `mget ruleset "https://firebaserules.googleapis.com/v1/$P01_RULESET_NAME" 'source(files(name,content))'`. Canonically sort files by name, serialize the file array with `jq -cS '.source.files | sort_by(.name)'`, and hash the resulting bytes with `shasum -a 256`. Retain only the digest and compare against the local source normalized the same way. Delete temporary source at exit. The command batch never fetches function environment variables, scheduler targets, objects or documents. The single-field line covers explicitly overridden indexes for the exact approved group. TTL configuration, if approved, uses a separate counted call with filter `ttlConfig:*` and a mask of `fields(name,ttlConfig),nextPageToken`. The Cloud Storage lifecycle mask omits path/object-specific conditions. Keep those dimensions unverified if they need broader scope.

Review returned next-page indicators and database or backup `unreachable` entries in private output. Missing surfaces, denied requests, partial results and unverified deployment digests retain distinct statuses. Do not rerun an unsupported mask without review. Hosting and Functions metadata identifiers alone do not establish a Git commit. Document any unavailable required field as unverified. If the host requires quota billing, the security reviewer must authorize the quota project explicitly before any request. Remove temporary output on exit and retain only approved sanitized aggregates.

## Revision 21 — first metadata batch for owner approval

**PROPOSED, NOT APPROVED, NOT EXECUTED.** Owner direction to proceed with the programme is recorded; the exact operator, privately approved resource manifest, permissions and expiry are not yet supplied. No credentials or infrastructure requests have been used. Do not treat programme direction as approval for any live call.

Source expectations at `701c7ec832dbe9c531964496fa09cd4a4948ddd2`: `.firebaserc` default project candidate `tinysteps-react-v1`; `firebase.json` Hosting site candidate `tinysteps-react-v1`, Functions runtime nodejs22, Rules and index files; `src/lib/firebaseConfig.ts:24–26,49–62,74,129` defaults to `tinysteps-react-v1.firebasestorage.app` and uses the default Firestore selector, but public environment configuration can override project/bucket. These are source expectations, not evidence of the actual project number, database location, release names, bucket ownership or deployed artifacts. `firestore.indexes.json` has 66 composite index entries across 23 groups and one explicit field override (`gameSessions.createdAt`). The 198 Function roots and seven scheduler definitions are source counts, not deployed resource counts. Full per-resource metadata cannot fit in one 40-request batch.

Prioritize the following bounded first batch for recovery and security baseline. All identifiers must be privately confirmed against the approved account/project before execution. No wildcards or discovery outside the manifest. Existing Revision 20 request templates are manual operator commands, not an enforcement adapter. Prepare and independently review only the selected lines, distinct output labels, exact masks and private values before executing; do not paste the entire illustrative command block as a production run.

| Order | Metadata operation | Expected source baseline / comparison | Maximum calls |
|---|---|---|---:|
| 1 | Exact active project | Confirm both privately approved project ID and number | 1 |
| 2 | Exact default database candidate | Confirm actual database name, UID, type and location; PITR, retention, deletion protection | 1 |
| 3 | Backup schedules for verified database | Policy, cadence, retention; no creation | 1 |
| 4 | Backup inventory for verified database UID and location | Existing backup status and age, unreachable locations reported separately | 1 |
| 5 | Exact Firestore and Storage Rules releases | Compare release identifiers/update times; source digest not authorized in this batch | 2 |
| 6 | Exact Storage bucket | Location, versioning, retention and access configuration only | 1 |
| 7 | Exact Hosting live channel | Release/version status; omit if existing Hosting role is not within approved scope | 1 |
| 8 | Composite indexes: classSessions, months, billingCharges, teacherEarnings | 23 + 7 + 2 + 2 = 34 source definitions across four selected groups, compare normalized field ordering/query scope/state; no assumption of live match | 4 |
| 9 | Explicit field overrides in gameSessions | Compare source-createdAt configuration; no TTL or global enumeration | 1 |
| | Maximum first-batch requests | 13 (12 if Hosting excluded), zero retries | 13 |

Proposed first batch: 20-minute absolute approved window (also respect the existing per-request 15-second timeout), at most 13 metadata requests, zero retries, no automatic pagination, no document/object/Auth/provider data, no mutations. The original maximum of 40 is not authorization and does not apply to a narrower signed batch. The operator must reduce the command counter ceiling from 40 to the signed first-batch limit, check expiry as well as elapsed time before each request, and use only the selected request lines. Require exact resource identity in the response before dependent calls, particularly the database name/location/UID and backup database linkage. Stop on mismatched resource, unexpected sensitive content, permission/endpoint error, expired scope or pagination indicator; incomplete scope is not PASS. A valid empty backup/schedule response is evidence only for that verified scope; unreachable/partial results are inconclusive. Before cleanup, retain only the agreed sanitized matrix in the private evidence store, never raw configuration or token.

API contract cross-check (public documentation, no live API invocation): the Firestore backup filter accepts `databaseUid` and may return unreachable locations; explicit field overrides use the existing `indexConfig.usesAncestorConfig:false` filter and pagination token. Hosting custom IAM roles are unsupported; omit the Hosting call if its existing predefined role exceeds approved scope. References: [Backup list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.locations.backups/list), [Field configuration list](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.collectionGroups.fields/list), [Firebase IAM permissions](https://firebase.google.com/docs/projects/iam/permissions/).

Deferred, not approved: other 19 source composite-index groups, any additional field/TTL inventory, enabled-service and database enumeration, Rules source digest, Functions and Scheduler metadata and deployed digests, independent effective IAM evidence, provider metadata and later recovery exercises. Security review of effective operator permissions is mandatory before batch 1 and not replaced by a project policy snapshot. Plan subsequent bounded batches after review of the first result. Even a successful first batch is partial P01.2 evidence, not acceptance or permission to read application data.

Private approval still required: executive owner approval reference; named existing metadata-only operator; independent security reviewer; exact project number, database ID/location, Rules release names, bucket/site and four group names/override group; effective IAM and quota scope; absolute start/expiry, cap and evidence retention. Confirm exclusions and optional Hosting disposition. Do not put identities, tokens or private manifests in Git or chat. No usable authenticated Cloud/Firebase metadata connector is available in this review environment. A designated operator must execute in their approved environment; Codex is optional, not required. Until then P01.2 remains HOLD, P01.5 application data and M3 remain separately held, and P02 is not authorized.
