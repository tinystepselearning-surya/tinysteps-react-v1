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
