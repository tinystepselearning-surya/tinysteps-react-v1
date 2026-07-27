# GSC/CWV deployment-consistency audit and implementation report

Date: 2026-07-27  
Working branch: `fix/gsc-cwv-deployment-consistency`  
Base revision: `dcd14df778c2da9d43cc58f3550b56d55fad3cac`  
Deployment/commit/push/PR: **not performed**

## 1. Root causes confirmed

1. Production deployment success was under-specified. CI checked homepage HTTP 200 and sitemap presence but could not prove the deployed Git SHA or validate redirects, legal content, canonicals, robots, sitemap members, private headers, and genuine 404 responses.
2. The public root eagerly mounted `AuthBootstrap` and private/native infrastructure. That pulled Firebase and Capacitor-adjacent code into the 877.10 KiB public entry and initialized Firebase on public visits.
3. Public components statically imported Firestore/Firebase configuration or an AI modal whose dependency graph reached private Firebase/Functions code.
4. Microsoft Clarity had an immediate loader and duplicated route policy in `index.html`.
5. Route intent was incomplete outside the public route list: auth/noindex, private SPA patterns, feeds/utilities, redirects, and the final genuine 404 did not share one explicit classification.
6. Vite module preload was disabled, the chunk warning threshold was 1,200 KB, and no public-entry gzip/dependency budget could stop regression.

## 2. Root causes rejected

- The repository's Firebase redirect declaration was not missing: both `/terms` and `/terms/` already specified permanent hosting redirects.
- The legal route's React content/canonical was not the cause; the built legal page renders its own title, H1, and canonical.
- Sitemap removal or broad URL renaming was neither necessary nor safe. All 140 current canonical sitemap URLs pass the live verifier.
- The homepage has no image as its measured true LCP candidate, so adding an arbitrary hero-image preload would not address the measured bottleneck.
- No render-blocking custom web-font family or unnecessary font-weight download was found.
- Laboratory Lighthouse does not establish field INP. GSC/CrUX requires a new rolling field-data period after deployment.
- By the time the final read-only production audit ran, the historical `/terms` defect was no longer reproducible: it returned HTTP 301. The remaining live integrity failure is the absent build identity marker.

## 3. Exact files changed

Runtime and public loading:

- `src/app.tsx`
- `src/components/runtime/ProtectedRuntimeBootstrap.tsx`
- `src/components/common/Header.tsx`
- `src/components/common/FloatingAssistant.tsx`
- `src/components/forms/PublicAssessmentForm.tsx`
- `src/components/Home/GlobalLearnersMapSection.tsx`
- `src/lib/analytics.ts`
- `index.html`
- `vite.config.ts`

Route/deployment verification:

- `src/lib/publicRouteManifest.js`
- `scripts/clarity-route-policy.mjs`
- `scripts/write-build-info.mjs`
- `scripts/verify-live-deployment.mjs`
- `scripts/verify-public-bundle.mjs`
- `scripts/generate-route-indexability-report.mjs`
- `.github/workflows/deploy.yml`
- `package.json`

Tests:

- `src/tests/seo/clarityRoutePolicy.spec.ts`
- `src/tests/seo/deploymentConsistency.spec.ts`
- `src/tests/app.nativeAuthPush.spec.tsx`
- `src/tests/components/PublicAssessmentForm.spec.tsx`

Generated outputs:

- `public/sitemap.xml`, `public/sitemap-blog.xml`, `public/sitemap-courses.xml`
- `public/feed.xml`, `public/rss.xml`, `public/blog/feed.xml`, `public/blog/rss.xml`
- `artifacts/gsc-cwv-baseline.md`, `artifacts/gsc-cwv-final.md`
- `artifacts/route-indexability-report.json`, `artifacts/route-indexability-report.md`
- `artifacts/public-bundle-report.json`
- `artifacts/live-deployment-baseline.md`
- `artifacts/lighthouse-*-baseline.json`, `artifacts/lighthouse-*-final.json`

## 4. Before/after initial JavaScript

| Measurement | Before | After | Reduction |
|---|---:|---:|---:|
| Raw | 877.10 KiB | 387.79 KiB | 55.8% |
| Gzip | 273.87 KiB | 122.74 KiB | 55.2% |
| Brotli | 230.91 KiB | 104.57 KiB | 54.7% |

The final public-entry budget is 150 KiB gzip, leaving about 22% headroom while preventing silent return to the baseline. The build also fails if the initial dependency graph contains Firebase Auth/Functions/Firestore/config, Capacitor App/Preferences, push, or native diagnostics. Fresh 30+ second browser sessions on all eight priority routes requested no such runtime. The homepage's one direct public-statistics Storage fetch remains separate from SDK code.

Protected/native behavior is retained in the lazy `ProtectedRuntimeBootstrap`: one `AuthBootstrap` owner, native login restoration, push registration/open routing, unread reconciliation, foreground notifications, and badge synchronization. The focused native cold-start/push suite and the full suite pass.

## 5. Before/after Lighthouse mobile

Lighthouse 12.8.2, identical simulated mobile profile. JS transfer includes all script requests observed during the run.

| Route | Score | LCP ms | CLS | TBT ms | Speed Index ms | JS KiB | Main thread ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` before | 81 | 4,267 | 0.000 | 0 | 2,798 | 730.8 | 3,905 |
| `/` after | 88 | 3,311 | 0.000 | 0 | 3,605 | 154.9 | 3,219 |
| `/phonics` before | 84 | 3,630 | 0.000 | 13 | 3,018 | 663.7 | 672 |
| `/phonics` after | 93 | 2,883 | 0.000 | 0 | 2,270 | 189.3 | 356 |
| `/online-english-classes-for-kids` before | 89 | 3,179 | 0.000 | 7 | 2,792 | 617.6 | 630 |
| after | 95 | 2,577 | 0.000 | 0 | 2,041 | 143.1 | 284 |
| `/online-english-classes-hyderabad` before | 89 | 3,175 | 0.000 | 0 | 2,790 | 616.8 | 564 |
| after | 95 | 2,577 | 0.000 | 0 | 2,040 | 142.4 | 287 |
| `/courses` before | 89 | 3,180 | 0.000 | 0 | 2,794 | 625.2 | 663 |
| `/courses` after | 95 | 2,580 | 0.000 | 0 | 2,045 | 150.7 | 366 |
| `/book-demo` before | 89 | 3,181 | 0.000 | 2 | 2,795 | 620.7 | 1,658 |
| `/book-demo` after | 95 | 2,582 | 0.000 | 0 | 2,044 | 146.5 | 740 |
| `/blog` before | 80 | 4,080 | 0.000 | 1 | 3,318 | 760.3 | 726 |
| `/blog` after | 88 | 3,488 | 0.000 | 0 | 2,500 | 285.7 | 446 |
| `/terms-and-conditions` before | 88 | 3,253 | 0.000 | 1 | 2,867 | 616.8 | 603 |
| after | 95 | 2,584 | 0.000 | 0 | 2,120 | 142.4 | 326 |

All routes retain CLS 0 and TBT well under 200 ms. Seven routes improve Speed Index; homepage Speed Index varies upward in this local sample even though LCP, score, transferred JS, and main-thread work improve. Third-party execution fell from 0–23 ms to 0 ms in all final runs because analytics is deferred past the Lighthouse critical window. Local LCP improved on every route but did not reproducibly reach 2.5 seconds; that target is not claimed.

## 6. Redirect and canonical matrix

| Source | Expected destination | Hosting result |
|---|---|---|
| `/terms` | `/terms-and-conditions` | 301 PASS |
| `/terms/` | `/terms-and-conditions` | 301 PASS |
| `/online-english-classes-for-kids-india` | `/online-english-classes-for-kids` | 301 PASS |
| `/online-phonics-reading-classes` | `/phonics` | 301 PASS |
| `/how-it-works` | `/curriculum` | 301 PASS |
| `/spoken-english-classes-for-kids` | `/spoken-english-classes-for-kids-online` | 301 PASS |
| `/games` | `/phonics-learning-games` | 301 PASS |
| `/games/english-excellence` | `/phonics-learning-games` | 301 PASS |

The built browser preview rendered the correct meaningful title, H1, and self-canonical for `/`, `/phonics`, `/online-english-classes-for-kids`, `/online-english-classes-hyderabad`, `/courses`, `/book-demo`, `/blog`, and `/terms-and-conditions`. The real HTTP production verifier independently passed every redirect and canonical assertion. Vite preview does not emulate Firebase hosting redirects; hosting behavior is validated against `firebase.json` locally and through raw production HTTP.

## 7. Sitemap/indexability totals

- 140 canonical production sitemap URLs checked: all HTTP 200, self-canonical, indexable, titled, and with meaningful H1.
- 169 explicit/resolved local classifications checked: 169 PASS, including every canonical sitemap URL.
- 147 prerender routes generated: 147 PASS.
- 83 public manifest entries and eight redirects remain aligned with SEO registry, generated sitemaps, prerender output, and Firebase configuration.
- Redirect, auth/noindex, private SPA, feed/utility, and genuine-404 patterns are excluded from canonical sitemaps.
- Representative private routes return HTTP 200 with `X-Robots-Tag: noindex, nofollow, noarchive`.
- A random unknown route returns HTTP 404 with the same noindex header.

The generated JSON/Markdown report can classify a future GSC export as expected exclusion, unexpected exclusion, unexpected indexing, or valid indexed page.

## 8. Tests executed and results

- `npm run lint`: PASS, zero errors; 11 pre-existing hook warnings.
- `npm run typecheck`: PASS.
- `npm run test -- --run`: PASS, 106 files passed / 3 skipped; 706 tests passed / 4 skipped.
- `ANALYZE=true npm run build`: PASS; 147/147 prerenders, route integrity PASS, 169/169 indexability PASS, bundle dependency/budget PASS, offer consistency PASS.
- `npm run seo:smoke`: PASS.
- `npm run seo:route-integrity`: PASS.
- `npm run seo:indexation-check`: PASS.
- `npm run seo:rendered-check`: PASS.
- Playwright clean-browser acceptance: PASS on eight priority public routes, including late/deferred request observation.
- Read-only live verifier: 183/184 PASS; expected predeployment failure is only the missing `build-info.json`.

## 9. Remaining risks

1. No production deployment was authorized. The new build identity, runtime split, and CI enforcement are not live yet.
2. The current live release passes content/routing assertions but cannot be tied to a Git SHA. That is why the live baseline report remains red.
3. Mobile LCP remains above 2.5 seconds in local simulation, especially homepage and blog. A subsequent content/rendering pass may be warranted, but it should use field attribution and avoid speculative layout changes.
4. GSC's 28-URL mobile CWV group and 116 not-indexed pages cannot change immediately. CrUX uses a rolling field window, and the Pages export still needs reason-level mapping.
5. The public global-learners map depends on a direct public Firebase Storage JSON request; it does not initialize Firebase runtime, but the endpoint's availability/CORS policy remains an external dependency.
6. Desktop was not re-baselined with a separate Lighthouse matrix. The public entry is materially smaller and no desktop layout was changed, but production desktop CWV should remain monitored.

## 10. Exact manual deployment command

Run only after these changes are reviewed and committed so the marker SHA represents the intended revision:

```bash
FIREBASE_PROJECT_ID=tinysteps-react-v1 bash .github/scripts/firebase-hosting-deploy.sh live
```

Firebase Hosting's configured predeploy hook runs `npm run build`. This command was **not** executed during this task.

## 11. Postdeployment verification command

Use the deployed commit SHA, not an uncommitted working-tree SHA:

```bash
node scripts/verify-live-deployment.mjs \
  --origin https://tinystepslearning.com \
  --expected-sha "$(git rev-parse HEAD)" \
  --report artifacts/live-deployment-verification.md
```

The production GitHub workflow runs the same contract against `${{ github.sha }}`, uploads the report even on failure, and fails the job on any routing/content/indexability/identity contradiction.

## 12. GSC validation steps

1. Open the Mobile Core Web Vitals issue and confirm the exact failing metric and affected 28-URL group.
2. Deploy, then require the postdeployment verifier to pass all assertions with the expected SHA.
3. Start **Validate Fix** only after that production verification passes.
4. Export the Pages report by reason group and join URLs to `artifacts/route-indexability-report.json`.
5. Treat intended noindex/redirect/private/404 results as expected exclusions; investigate missing `index` rows and indexed non-`index` rows.
6. Request indexing only for a small lead-critical canonical set such as `/`, `/phonics`, `/online-english-classes-for-kids`, `/online-english-classes-hyderabad`, `/courses`, and `/book-demo`.

## Acceptance status

Repository/local acceptance is complete: routing intent, public-runtime isolation, material JS reduction, mobile lab improvement, protected/native regression coverage, build/SEO checks, and CI live verification are in place. Production build-identity acceptance remains intentionally pending until an authorized deployment.
