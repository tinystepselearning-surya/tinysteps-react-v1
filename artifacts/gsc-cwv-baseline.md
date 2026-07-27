# GSC/CWV deployment-consistency baseline

Date: 2026-07-27  
Repository revision: `dcd14df778c2da9d43cc58f3550b56d55fad3cac`  
Original branch: `main`  
Node/npm: `v22.22.1` / `10.9.4`

## Baseline commands

The worktree was clean before the task. `npm ci` initially hit a root-owned user npm cache and then the restricted network; it completed successfully with `npm_config_cache=/tmp/tinysteps-gsc-npm-cache` after network approval. Baseline lint passed with 11 existing warnings and no errors; typecheck passed; Vitest passed 105 files (3 skipped), 705 tests (4 skipped); the production build prerendered 147/147 routes; and all four existing SEO commands passed.

## Initial public JavaScript

The original homepage requested one module entry, `/assets/index-mlwrUlJn.js`.

| Measurement | Initial entry |
|---|---:|
| Raw | 877.10 KiB |
| Gzip | 273.87 KiB |
| Brotli | 230.91 KiB |

The entry dependency graph eagerly included Firebase Auth/Firestore/Functions-adjacent application code, `AuthBootstrap`, Capacitor/native diagnostics, push navigation, unread reconciliation, and foreground private-app notification infrastructure. A clean homepage browser load requested Firebase application configuration/installations endpoints. The immediate Microsoft Clarity loader also ran from `index.html`. These were public-runtime architecture issues, not route-content requirements.

The homepage additionally reads `public-stats/global-learners.json` directly from the project's public Firebase Storage URL. That request is public data transport rather than Firebase SDK/runtime initialization.

## Corrected baseline Lighthouse mobile evidence

Lighthouse 12.8.2, simulated mobile profile (150 ms RTT, 1,638.4 Kbps, 4× CPU slowdown). The initially captured desktop-preset run was discarded and replaced because the preset had overridden mobile throttling.

| Route | Score | LCP ms | CLS | TBT ms | Speed Index ms | JS transfer KiB | Main thread ms | Third-party ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 81 | 4,267 | 0.000 | 0 | 2,798 | 730.8 | 3,905 | 23 |
| `/phonics` | 84 | 3,630 | 0.000 | 13 | 3,018 | 663.7 | 672 | 11 |
| `/online-english-classes-for-kids` | 89 | 3,179 | 0.000 | 7 | 2,792 | 617.6 | 630 | 14 |
| `/online-english-classes-hyderabad` | 89 | 3,175 | 0.000 | 0 | 2,790 | 616.8 | 564 | 0 |
| `/courses` | 89 | 3,180 | 0.000 | 0 | 2,794 | 625.2 | 663 | 0 |
| `/book-demo` | 89 | 3,181 | 0.000 | 2 | 2,795 | 620.7 | 1,658 | 3 |
| `/blog` | 80 | 4,080 | 0.000 | 1 | 3,318 | 760.3 | 726 | 1 |
| `/terms-and-conditions` | 88 | 3,253 | 0.000 | 1 | 2,867 | 616.8 | 603 | 1 |

Raw evidence is stored as `artifacts/lighthouse-*-baseline.json`.

## Redirect, canonical, and manifest baseline

The repository already declared eight permanent Firebase redirects, including `/terms` and `/terms/` to `/terms-and-conditions`. The original local integrity command passed its 83 public-route and eight-redirect scope. It therefore could not explain a live stale artifact from repository configuration alone.

The missing controls were:

- no deployed build identity;
- CI only checked homepage availability and sitemap availability after deployment;
- no live assertion of redirect status/Location, legal content, canonicals, robots, sitemaps, private headers, or genuine 404 behavior;
- application/private/noindex/feed/utility/404 intents were not represented in the same machine-readable route classification;
- no build-time public-entry dependency exclusion or meaningful gzip budget.

The production audit performed during this task found that `/terms` was then returning the intended HTTP 301 and all content checks passed, indicating the originally observed stale route had been replaced externally during the task. Production still failed 1/184 assertions because `build-info.json` did not exist, so the serving commit remained unverifiable. See `artifacts/live-deployment-baseline.md`.

## Baseline route mismatches

No contradiction was found inside the original limited public-route/redirect checks. The substantive mismatch was between CI's definition of a successful deployment and the actual production contract: a reachable homepage and sitemap could pass even when an arbitrary route served an older release. The implementation report documents the expanded 169-classification model and live 184-assertion contract.
