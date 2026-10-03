# Wave 0 — Local-First Engineering & Deployment Baseline

**Status:** IMPLEMENTED IN PR #566  
**Goal:** Keep ongoing engineering validation on the local Mac and keep GitHub Actions focused on production deployment.

## 1. Final operating model

Tiny Steps uses a **local-first engineering workflow**.

### Mac / ChatGPT Desktop / Codex

Owns development validation:

- impact-aware unit tests;
- critical regressions;
- lint;
- typecheck;
- Functions lint/build/tests;
- Firestore emulator checks when relevant;
- enrollment emulator checks when relevant;
- Resources/R8 checks when relevant;
- local build verification;
- deliberate full regression/coverage when requested.

### GitHub

Owns:

- repository history;
- branches and pull requests;
- canonical `main`;
- Firebase deployment;
- deployment provenance;
- production markers;
- stale-main protection;
- production verification;
- explicit Functions recovery.

GitHub Actions is **not** the normal development test runner.

## 2. Why this replaced the previous CI model

Before cleanup, the repository had dozens of historical brick workflows. Structural inventory found:

- 64 workflow files containing `npm ci`;
- 56 workflow files containing `npm run build`;
- 57 workflow files installing Playwright Chromium;
- 62 workflow files wired to pull requests.

Many workflows represented temporary construction scaffolding for completed Resources, Grammar, Commercial, SEO, migration and hardening bricks.

That caused:

- repeated dependency installs;
- repeated Chromium installs;
- repeated builds/prerenders;
- overlapping regression suites;
- thousands of unrelated tests per ordinary change;
- many workflow rows for a single PR;
- tests that asserted historical CI structure rather than product invariants.

## 3. GitHub Actions after cleanup

`.github/workflows/` contains one workflow:

```text
deploy.yml
```

It runs automatically only when code reaches `main`.

The deployment pipeline:

```text
main push
   ↓
deployment impact analysis
   ↓
build only affected deployment artifacts
   ↓
stale-main verification
   ↓
staging Hosting when needed
   ↓
bounded Functions / Firestore deployment when needed
   ↓
production Hosting when needed
   ↓
live production verification
   ↓
advance production markers
```

A manual `workflow_dispatch` path remains for explicit surgical Functions recovery.

## 4. Local commands

### Normal work

```bash
npm run preflight
```

The preflight script:

- compares the branch and working tree against `origin/main` / `main`;
- determines affected domains;
- runs relevant tests only;
- runs the critical regression pack for frontend changes;
- runs specialist emulator/resource checks only when affected;
- creates the deploy artifact locally when frontend code changed.

### Preview what would run

```bash
npm run preflight:plan
```

### Deliberate full certification

```bash
npm run preflight:full
```

This is the explicit deep path. It may run:

- complete unit suite;
- Functions validation;
- emulator validation;
- specialist validations;
- the existing deep audit-heavy production build.

It is **not scheduled**.

### Coverage when specifically needed

```bash
npm run test:full:coverage
```

Coverage is also local/on-demand.

## 5. Build separation

The repository now distinguishes:

### Local quality build

```bash
npm run build
```

This retains the existing deep SEO/content/audit pipeline.

### Deployment artifact build

```bash
npm run build:deploy
```

This performs only artifact-producing work required for production:

- RSS generation;
- sitemap generation;
- Vite production build;
- build identity metadata;
- prerendering;
- IndexNow key generation when configured.

GitHub uses `build:deploy`, not the audit-heavy development build.

## 6. Test-retirement rule

Every future feature/migration brick must include a retirement decision at stabilization.

Temporary construction assets should not become permanent by default:

- brick-specific workflows;
- migration-only tests;
- one-time backfill checks;
- temporary canaries;
- rollout assertions;
- duplicate regression suites;
- CI-implementation assertions;
- proof scripts no longer used operationally.

At stabilization:

```text
temporary build tests
      ↓
identify permanent business invariant
      ↓
retain the smallest useful canonical regression
      ↓
retire temporary workflow/test/script scaffolding
```

The target is not the maximum number of tests. The target is the **minimum high-value test estate that provides strong confidence**.

## 7. Deployment safety retained

The cleanup preserves:

- deployed-artifact impact analysis;
- production baseline markers;
- bounded Functions deployment;
- Functions deployment metadata verification;
- stale-main refusal;
- Google/Firebase authentication;
- callable transport/IAM enforcement;
- Firestore rules/index deployment;
- staging Hosting preview;
- live production SHA verification;
- deployment reports;
- IndexNow verification/submission;
- explicit surgical Functions recovery.

These are deployment controls, so they remain in GitHub.

## 8. Engineering rule

> **Local Mac provides development confidence. GitHub provides deployment confidence.**

Do not add a new GitHub Actions test workflow for a feature brick.

If a permanent invariant needs automation:

1. add it to the local preflight system or an existing canonical test suite;
2. keep it impact-aware where possible;
3. document when it can be retired;
4. leave GitHub Actions deployment-only unless the check proves something that can only be known during/after deployment.
