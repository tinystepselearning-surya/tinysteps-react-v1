# Tiny Steps Local Engineering Workflow

## Daily development

From the Tiny Steps repository on the Mac:

```bash
git fetch origin main
npm run preflight:plan
npm run preflight
```

Use ChatGPT Desktop / Codex to inspect failures, modify code and rerun the same command until green.

## When the change affects global test/build configuration

For changes such as `package.json`, lockfiles, Vitest or TypeScript/Vite configuration, normal preflight intentionally refuses to guess.

Run:

```bash
npm run preflight:full
```

## Full certification

Run only when deliberately requested:

```bash
npm run preflight:full
```

Optional coverage:

```bash
npm run test:full:coverage
```

There is no scheduled full regression run in GitHub.

## Before merge

Recommended sequence:

```text
local changes
   ↓
npm run preflight
   ↓
review diff
   ↓
push branch
   ↓
PR / review
   ↓
merge to main
   ↓
GitHub deployment only
   ↓
production verification
```

## GitHub Actions

GitHub does not re-run the Mac test estate on pull requests.

The only workflow is the deployment workflow. It reacts to `main`, determines Firebase impact, builds required deployment artifacts, deploys and verifies production.

## New-feature rule

Do not create a new `.github/workflows/*.yml` file for a development brick.

Add tests to an appropriate local canonical suite and teach `scripts/preflight.mjs` when that suite should run.

Every temporary test or validation rig must have an explicit retirement decision when its brick stabilizes.
