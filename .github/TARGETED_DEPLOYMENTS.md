# Targeted Firebase deployments

`scripts/resolve-deployment-impact.mjs` compares every production Firebase
artifact against its own last successfully deployed revision instead of assuming
that the immediately previous `main` commit reached production.

Reserved production refs:

- `ci/functions-production`
- `ci/hosting-production`
- `ci/firestore-rules-production`
- `ci/firestore-indexes-production`

This closes the queue/stale-guard gap where a frontend, rules, or index rollout
can be cancelled or superseded and a later unrelated commit would otherwise see
no local change and silently skip the missed production mutation. Missing or
invalid markers fail safe: Functions request a one-time full bounded deployment;
Hosting, Firestore rules, and Firestore indexes each request one recovery
deployment. Each marker advances only after its corresponding production
mutation succeeds, and the Hosting marker advances only after live build-identity
verification passes.

Pull-request validation continues to compare against the PR base and never
advances production markers. The GitHub Actions summary reports the event
baseline and all artifact-production baselines independently.

## Functions targeting

For ordinary `functions/src/**` changes, the resolver builds local TypeScript
dependency graphs for both revisions. It follows static relative `import`,
`export ... from`, `require()`, and dynamic `import()` edges transitively from
the explicit exports in `functions/src/index.ts`. The union of the before and
after graphs makes deleted and renamed modules safe to analyze. Only reached
Function export IDs are passed to the bounded deployer through
`FUNCTIONS_DEPLOY_ONLY`.

Test files (`functions/test/**`, `**/__tests__/**`, `*.spec.*`, and `*.test.*`)
require validation but never create a production Function target. A changed
source module with no path from a deployed export similarly produces zero
deployment targets.

An intentionally retired Function export may bypass the full-fleet topology rule only when its export ID is explicitly allowlisted in the impact resolver, the topology change removes that export without adding or moving another Function root, and the production Function is deleted through a separate explicit cleanup mutation. This mechanism currently exists only for the temporary AV2.1 proof endpoint and must not be generalized implicitly.

A full fleet deployment is limited to known global inputs:

- `functions/package.json`
- `functions/package-lock.json`
- `functions/tsconfig*.json`
- the Functions section of `firebase.json`
- `functions/src/index.ts` export topology

Unsupported or unresolved dependencies on a deployed Function path fail the
impact-analysis job with a diagnostic. They do not silently turn into a
full-fleet deployment. Invalid Git history fails before any mutation. Production marker refs are
operational pointers, not release branches; after a verified recovery they may
move to the current successful `main` SHA even when an old marker is invalid or
diverged. The Functions marker is advanced only after the bounded Functions
deployment and required callable transport verification succeed; stale-guarded
or failed rollouts do not advance it.

## Artifact isolation

- Functions changes run Functions build/tests; deployment runs only for a
  non-empty target set or a known global input.
- Hosting source/config changes since the last successful Hosting marker run
  frontend validation and Hosting staging/live deployment.
- Firestore rules changes since the last successful rules marker run emulator
  validation and rules deployment.
- Firestore index changes since the last successful indexes marker run emulator
  validation and index deployment.
- If a prior artifact rollout was cancelled, stale-guarded, or failed, the next
  eligible `main` run carries that artifact forward even when the newest commit
  itself changes only another subsystem.
- Production mutations remain serialized by
  `firebase-deployment-tinysteps-react-v1` with `cancel-in-progress: false`.

Non-mutating analysis and validation complete before that production lock is
entered. Deployment reports are uploaded with `if: always()` and contain the
commit, selected plan, plan hash, attempted batches, completed targets,
failed/uncertain targets, and final status.
