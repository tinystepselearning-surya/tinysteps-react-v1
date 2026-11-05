# Homepage Core Web Vitals — no-regression working branch
**Date:** 2026-11-05 (IST)  
**Branch:** perf/homepage-cwv-subgrade-20261105  
**Release status:** INVESTIGATION ONLY / NO-GO for production.

## User approval and constraint

Do not create new interface instability or poorer Web Vitals. Keep current production as-is unless a change demonstrates a positive improvement and passes all relevant regressions. Work on this isolated branch; do not merge into main without an explicit release decision.

## Baseline evidence (user-supplied 2026-11-05 PageSpeed screenshots)

| Real-user metric | Mobile | Desktop | Google good threshold |
| --- | ---: | ---: | ---: |
| LCP | 2.9 s | 1.6 s | <= 2.5 s |
| INP | 405 ms | 287 ms | <= 200 ms |
| CLS | 0.40 | 0.16 | <= 0.10 |

Simulated Lighthouse performance scores: mobile 99, desktop 100. The lab results are not substitutes for CrUX's rolling 28-day field metrics. Search Console reports an INP issue group of 119 similar URLs, not 119 independently measured bad pages.

## Code inspection (not yet root-cause proof)

- src/app/routes.tsx defers Footer and ConversionTracker mounting. Deferred footer activation may affect viewport geometry for some scroll positions and deserves *measurement* before implementation changes.
- src/components/common/FloatingAssistant.tsx has timed mobile help previews and deferred mounting from routes.tsx. It is fixed-position, so do not presume it causes layout shift.
- src/lib/analytics.ts schedules GA4 and Clarity loads through idle scheduling after first interaction or timeout; inspect interaction traces before changing the load/attribution contract.
- src/lib/inpRum.ts already records sampled Event Timing INP candidates for production public pages; use privacy-safe aggregation to identify confirmed hotspots.
- src/components/Home/ConversionHero.tsx already uses a responsive WebP srcSet, explicit image dimensions, eager loading and high fetch priority. Do not regress these.
- src/main.tsx uses createRoot on a React entry that interacts with public prerendered HTML. Do not switch to hydrateRoot without an exact DOM/hydration parity test.

## Diagnostic addition on this branch

tests/homepage-cwv-diagnostics.spec.ts:
- Records in-browser layout-shift entries (excluding shifts with recent input), with anonymized element tag and rectangles only.
- Computes *largest CLS session window* (5-second duration, 1-second gap), not the incorrect sum of all shifts.
- Captures viewport screenshots and attaches JSON evidence in Playwright test results.
- Observes 27 seconds to cover delayed footer/support behavior.
- Verifies booking CTA, loaded responsive hero image, compact mobile navigation, visible footer and no horizontal overflow.
- Runs separately at mobile 390x844 and desktop 1366x850.
- Is intentionally diagnostic: does **not** assert a magic CLS threshold before a comparable main baseline exists.

## How to run

From the repository root, with project dependencies and Playwright Chromium installed:

    npx playwright test tests/homepage-cwv-diagnostics.spec.ts --reporter=line
    npx playwright test tests/homepage-premium-responsive.spec.ts --reporter=line
    npm run typecheck
    npm run test -- --run
    npm run build

Run the diagnostic on *both main and this branch* under the same browser, network, cache, and viewport conditions. Only compare corresponding measurements. Real-world regression safety also requires post-deploy CrUX monitoring.

## Next corrective steps — conditional, not yet authorized to merge

1. Capture actual CLS entries and identify the shifting elements at page load, while idle, during scroll, and after support/footer activation.
2. If delayed footer mounting is proven to cause visible CLS, prototype a minimal stabilizing fix with no blank placeholders or new visual artifacts, and re-run the diagnostic.
3. Use existing cwv_inp_candidate GA4 events to isolate event targets and input/processing/presentation delay. Only then touch the responsible synchronous work.
4. Investigate the 48.7 KiB mobile render-blocking CSS and 410ms estimated opportunity *without* removing critical styles, changing SEO content or introducing FOUC.
5. Preserve mobile booking, navigation, WhatsApp, AI support, pricing, footer, prerendered SEO, canonical/JSON-LD, GA4 attribution and accessibility.

## Non-negotiable merge gates

- Full feature-parity and functional regression checks on responsive breakpoints: 320, 375, 390, 430, 768, 1024, 1366 and 1920 px.
- No new layout jumps, overlapping widgets, delayed CTA, modal failure, horizontal scroll, lost labels, focus traps, visual flicker or font swap instability.
- No degraded LCP, INP or CLS under comparable repeatable lab tests; no increased request/main-thread work without a verified offsetting benefit.
- TypeScript, targeted unit tests, Playwright (including support/chat/booking), production build, prerender SEO and indexing/content gates pass.
- No changes to Firebase, protected portals, tracking conventions, public copy or marketing schema unless separately reviewed.
- Reviewer confirms measured improvement with before/after artifacts and accepts residual uncertainty.
- Draft PR remains **unmerged and undeployed** until these conditions are satisfied.

## Honest limitations

A Playwright session can identify CLS causes and catch UX regressions, but it cannot prove a Google field-metric improvement: real-user CWV is a 28-day population metric influenced by device/network/session differences. This first commit is diagnosis and safety infrastructure; it is not yet a production performance optimization.
