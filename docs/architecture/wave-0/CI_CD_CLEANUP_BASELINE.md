# Wave 0 — CI/CD Cleanup Baseline

**Status:** ACTIVE  
**Goal:** Reduce GitHub Actions runtime, repeated builds, repeated installs and unnecessary deployment work without weakening production safety.

## Repository baseline

The current workflow inventory shows:

- **64** workflow files containing `npm ci`;
- **56** workflow files containing `npm run build`;
- **57** workflow files installing Playwright Chromium;
- **62** workflow files wired to `pull_request`;
- **8** workflow files wired to `push`;
- **64** workflow files exposing `workflow_dispatch`.

These counts are structural repository counts, not a claim that all workflows execute for every change. Path filters reduce execution, but the architecture still contains substantial duplicated setup/build logic across historical brick workflows.

## Main deploy duplication found

Before Phase 1, a Hosting deployment could perform expensive work repeatedly:

1. `build-and-test` installs dependencies, installs Playwright and runs the full application build/prerender.
2. `deploy-to-firebase` installs root dependencies and Playwright again.
3. Firebase Hosting staging deployment reads `firebase.json`, whose `hosting.predeploy` runs `npm run build` again.
4. Firebase Hosting production deployment invokes the same `hosting.predeploy` again.

The bounded Functions deployer also invokes Firebase CLI once per batch of up to five Functions. Because canonical `firebase.json` has Functions predeploy lint/build hooks, those hooks can be repeated for each deployment batch even though the job already compiled the Functions.

## Phase 1 contract — build once, deploy validated output

Phase 1 changes the CI deployment path so:

- validation remains fail-closed;
- Hosting builds once in `build-and-test`;
- the validated `dist` artifact is uploaded on deployable main pushes;
- the deployment job downloads and verifies that artifact's `build-info.json` SHA;
- staging and production deploy the same validated `dist`;
- a generated `.firebase.ci.json` removes only predeploy hooks for CI deployment;
- canonical `firebase.json` remains unchanged, so local/manual Firebase deploys retain their normal safety hooks;
- Functions are linted/built during validation and built once in the deployment job after dependency installation;
- bounded Firebase CLI batches use the generated CI config so they do not re-run lint/build predeploy hooks per batch;
- docs/no-impact changes can skip the heavy `build-and-test` job after impact analysis;
- ordinary frontend PRs run Vitest's dependency-aware affected tests plus a small critical regression pack instead of the complete unit suite;
- the complete unit suite with coverage runs only in a separate manual certification workflow rather than on every PR/main deployment.

## Unit-test execution policy

### Pull requests

For ordinary frontend PRs:

1. run lint and typecheck;
2. run content-specialist tests when the change is content-only;
3. otherwise run `vitest --changed <PR base SHA>` so Vitest selects tests affected by changed modules;
4. always run the small critical regression pack for scheduling/session integrity, attendance reconciliation, parent payment allocation/billing, upcoming sessions and teacher/student delivery views;
5. do **not** instrument the normal PR suite for coverage.

Dependency/test-runner changes that can affect the whole test graph (for example `package.json` or Vitest configuration) may still cause Vitest's changed-mode safety behavior to run the full suite. This is intentional and should remain rare.

Functions and Firestore continue to use their own focused validation/emulator lanes when impacted.

### Main deployment

Main deployment retains the critical regression pack, build/prerender and production verification. It does not repeat the complete ~repository-wide unit suite that was already exercised by affected PR testing and the certification lane.

### Full certification

The complete unit suite with coverage runs **only when explicitly started through `workflow_dispatch`** for a release, audit or deliberate full certification.

There is no scheduled/cron full-suite run. Coverage publishing occurs only in this manual certification workflow.

This keeps comprehensive safety evidence while removing thousands of unrelated test executions from ordinary development iterations.

## Safety retained

Phase 1 does **not** remove:

- unit tests;
- Functions impact analysis;
- bounded Functions deployment;
- Firestore emulator/rules tests;
- staging Hosting deployment;
- stale-main refusal;
- production Hosting verification;
- callable transport verification;
- production deployment markers;
- IndexNow verification/submission;
- Firebase authentication/IAM controls.

## Phase 2 — workflow consolidation

After Phase 1 is green, audit the historical feature/SEO brick workflows and classify each as:

1. **CORE PR GATE** — must remain automatic;
2. **PATH-SCOPED SPECIALIST GATE** — automatic only for narrow owned paths;
3. **MANUAL/DIAGNOSTIC** — `workflow_dispatch` only;
4. **RETIRED HISTORICAL BRICK** — remove after its invariant is covered by consolidated tests/build gates.

The target is a small set of continuously active workflows, not dozens of permanent brick-specific CI pipelines.

No historical workflow should be disabled solely because it is old; its unique invariant must first be proven covered or intentionally moved to a consolidated gate.
