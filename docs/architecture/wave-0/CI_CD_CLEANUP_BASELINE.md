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
- docs/no-impact changes can skip the heavy `build-and-test` job after impact analysis.

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
