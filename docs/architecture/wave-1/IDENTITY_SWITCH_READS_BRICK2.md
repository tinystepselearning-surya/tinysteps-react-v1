# Wave 1 — SWITCH READS Brick 2: Production Shadow Canary

**Migration:** `wave1-identity-foundation-v1`  
**Lifecycle phase:** SWITCH READS preparation  
**Brick:** 2  
**Production read authority after this brick:** legacy  
**Production write authority after this brick:** legacy

## Purpose

Run a deliberately narrow live-production shadow canary against the verified canonical identity layer while preserving the current legacy business result.

Brick 2 wires the Brick 1 adapter into exactly one parent-only callable:

~~~text
getParentWorksheetResources
~~~

This callable already performs a current `users/{uid}` business-identity read before returning parent worksheet resources. Brick 2 replaces that point read on a sampled subset of requests with the legacy-authoritative shadow adapter.

The adapter still returns the legacy `users/{uid}` data as the business result. Canonical records are comparison-only.

## Canary scope

Only authenticated parent worksheet-resource requests are eligible.

Sampling:

~~~text
20% deterministic sample
rotates by authenticated user + IST calendar day
~~~

The purpose of daily rotation is to obtain production coverage across different parent accounts over time without shadow-reading every request.

Non-sampled requests execute the pre-Brick-2 legacy point read exactly as before.

## Read-cost boundary

Healthy non-sampled request:

~~~text
extra identity reads: 0
~~~

Healthy sampled parent request:

~~~text
legacy users/{uid}:       1 read
people/{uid}:             1 shadow read
authIdentities/{...}:     1 shadow read
roleAssignments/{...}:    1 shadow read
~~~

The legacy read is performed inside the adapter and replaces the callable's previous direct `users/{uid}` read. Therefore a healthy sampled request adds:

~~~text
extra legacy reads:       0
extra canonical reads:    3
~~~

For a parent with one current global parent role.

If the shadow adapter itself throws unexpectedly, the callable performs the exact pre-Brick-2 `users/{uid}` point read as a fail-safe. That exceptional path may therefore perform one additional legacy retry read.

No collection-wide identity query is introduced.

## Authority and failure safety

The live callable still authorizes from legacy user data.

Canonical state does not control:

- whether the user exists;
- whether the user is active;
- whether the user has the parent role;
- whether the selected child belongs to the parent;
- which resources are returned.

The possible shadow statuses are:

~~~text
match
legacy_missing
canonical_missing
semantic_mismatch
canonical_read_error
~~~

All statuses remain observational.

If the adapter throws before returning a result:

~~~text
shadow adapter failure
  -> structured warning telemetry
  -> exact legacy users/{uid} fallback read
  -> normal legacy authorization continues
~~~

If the telemetry sink itself throws, that error is swallowed and the business read continues.

## Telemetry

Telemetry uses Cloud Logging only.

No Firestore telemetry document is written.

Healthy sampled observations use event:

~~~text
wave1_identity_shadow_canary
~~~

Unexpected adapter-wrapper failures use:

~~~text
wave1_identity_shadow_canary_adapter_error
~~~

Structured fields include:

- reader name;
- source collection;
- privacy-safe SHA-256 subject token;
- shadow status;
- expected canonical point-read count;
- successful canonical read count;
- missing canonical kinds;
- semantic mismatch field names;
- canonical read-error kinds;
- legacy read latency;
- canonical shadow-read latency;
- sampling percentage;
- IST day bucket.

Telemetry does not contain raw user IDs, names, emails, phone numbers, child IDs or exception messages.

## Production surface chosen

`getParentWorksheetResources` was chosen because:

- it is parent-authenticated;
- it already validates the current Firestore user;
- it is not the login path;
- it is not an admin/finance/attendance authorization primitive;
- it is not session completion;
- a shadow failure can be contained without changing the worksheet result;
- the existing endpoint already performs substantially more Firestore work for ownership/enrollment/resource resolution, so the bounded 20% identity sample is materially smaller than shadowing a core portal read on every request.

No other production reader is wired in Brick 2.

## Implementation

~~~text
functions/src/schoolOS/identity/shadowCanary.ts
functions/src/getParentWorksheetResources.ts
functions/test/identityShadowCanary.spec.ts
~~~

Brick 1 adapter remains:

~~~text
functions/src/schoolOS/identity/readAdapter.ts
~~~

## Regression guarantees

The Brick 2 tests verify:

- IST-day sampling is deterministic;
- 0% and 100% gates behave exactly;
- configured production sample is 20%;
- telemetry contains no raw source ID or raw error message;
- non-sampled requests retain the exact legacy point read;
- sampled requests use the adapter's legacy result without a duplicate legacy read;
- unexpected adapter failure falls back to the pre-Brick-2 legacy read;
- a canonical-only identity is never promoted when legacy is missing;
- telemetry sink failure cannot alter the business result.

## Local validation before merge

Run:

~~~bash
npm --prefix functions run lint
npm --prefix functions run build
npm --prefix functions run test -- test/identityReadAdapter.spec.ts test/identityShadowCanary.spec.ts test/getParentWorksheetResources.spec.ts
npm run test:wave1-identity-foundation
~~~

Do not merge unless all commands pass.

## Deployment expectation

Unlike Brick 1, Brick 2 changes a live Cloud Function source file:

~~~text
functions/src/getParentWorksheetResources.ts
~~~

Therefore the deployment analyzer should identify the affected function and deploy only the necessary Function impact set.

No Hosting or Firestore Rules change is part of this brick.

## Production observation after merge

After successful deployment, allow normal parent worksheet traffic to generate sampled events.

Inspect Cloud Function logs for:

~~~text
wave1_identity_shadow_canary
wave1_identity_shadow_canary_adapter_error
~~~

The production observation is healthy only when sampled traffic shows:

- no adapter errors;
- no canonical read errors;
- no unexplained canonical missing state;
- no unexplained semantic mismatch;
- no parent access regression;
- no material latency regression.

Brick 2 does **not** authorize canonical-primary reads.

## Next brick

After clean shadow-canary evidence:

**SWITCH READS Brick 3 — live legacy-to-canonical synchronization / compatibility path**

That brick is required because legacy remains the current write authority. New or edited identities must be kept canonical-current before a canonical-primary read can be safely enabled.
