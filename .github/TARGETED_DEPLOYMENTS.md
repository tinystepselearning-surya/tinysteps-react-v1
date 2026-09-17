# Targeted Firebase deployments

`scripts/resolve-deployment-impact.mjs` compares the validated commit with its
Git parent/base before any production mutation job enters the Firebase
concurrency lock. It reports independent decisions for the Functions, Hosting,
and Firestore artifacts in the GitHub Actions job summary.

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

A full fleet deployment is limited to known global inputs:

- `functions/package.json`
- `functions/package-lock.json`
- `functions/tsconfig*.json`
- the Functions section of `firebase.json`
- `functions/src/index.ts` export topology

Unsupported or unresolved dependencies on a deployed Function path fail the
impact-analysis job with a diagnostic. They do not silently turn into a
full-fleet deployment. Invalid or missing Git history also fails before any
mutation.

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
