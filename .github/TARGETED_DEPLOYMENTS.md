# Targeted Firebase deployments

`scripts/resolve-deployment-impact.mjs` compares Hosting and Firestore against the
current event parent/base, while Cloud Functions are compared against the last
successfully deployed Functions revision recorded by the reserved
`ci/functions-production` ref. This distinction prevents a stale-guarded
Functions rollout from disappearing when a newer frontend-only commit reaches
`main`. If the production Functions marker is missing or invalid, the workflow
fails safe by requesting a one-time full bounded Functions deployment. It
reports independent decisions for the Functions, Hosting, and Firestore
artifacts in the GitHub Actions job summary.

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
full-fleet deployment. Invalid Git history fails before any mutation. The Functions production marker
is advanced only after the bounded Functions deployment and required callable
transport verification succeed; stale-guarded or failed Functions rollouts do
not advance it.

## Artifact isolation

- Functions changes run Functions build/tests; deployment runs only for a
  non-empty target set or a known global input.
- Hosting source/config changes run frontend validation and Hosting staging/live
  deployment.
- Firestore rules/config changes run emulator validation and rules deployment.
- Production mutations remain serialized by
  `firebase-deployment-tinysteps-react-v1` with `cancel-in-progress: false`.

Non-mutating analysis and validation complete before that production lock is
entered. Deployment reports are uploaded with `if: always()` and contain the
commit, selected plan, plan hash, attempted batches, completed targets,
failed/uncertain targets, and final status.
