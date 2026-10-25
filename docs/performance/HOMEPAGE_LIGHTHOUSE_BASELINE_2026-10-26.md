# Tiny Steps homepage mobile Lighthouse baseline — 26 October 2026 (IST)

**Status:** measurement completed; optimization changes are in a separate draft PR. No performance score improvement is claimed yet.

## Reproducible source

- Production URL: https://tinystepslearning.com/
- GitHub Actions measurement: https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/40232573804
- Lighthouse CLI version: **12.8.2**, Chrome from Playwright on Ubuntu 24.04
- Run date: 25 October 2026 at 20:50–20:51 UTC (26 October IST)
- Raw artifacts: `homepage-lighthouse-mobile.json` and `homepage-lighthouse-desktop.json`, attached to the run
- This is **one simulated, cold-navigation lab run**. It is **not** Chrome UX Report field data or a 28-day Core Web Vitals verdict.

| Lighthouse metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance score | 87 / 100 | 100 / 100 |
| First Contentful Paint | 1,943 ms | 430 ms |
| Largest Contentful Paint | 2,737 ms | 565 ms |
| Total Blocking Time | 333 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0 |
| Speed Index | 2,950 ms | 511 ms |

## Evidence-backed diagnosis

1. **LCP element: homepage child/laptop hero image.** The image is served from
   `/blog/hero-families/Tiny_Steps_Speaking.webp`, 1131 × 941 physical pixels,
   approximately 94.2 KB transferred. Lighthouse estimates 73–79 KB of avoidable
   bytes from right-sizing/image delivery. It is already discoverable in the initial
   HTML, eagerly loaded and has `fetchpriority=high`, so do **not** add redundant
   preloads or lazy-load the LCP image.
2. **Render/main-thread delay is material.** LCP element timing shows roughly 2.0s
   of render delay in that audit and only ~28ms image transfer time. Image resizing
   should reduce wasted bytes but **cannot be presumed to cure the whole LCP**.
   Main-thread work is reported at ~2.4s; JS execution ~1.3s.
3. **Initial payload.** Total requested data about 327 KiB. Entry JavaScript
   `/assets/index-Bm_Tq3kJ.js` transferred about 111.3 KB; initial stylesheet
   `/assets/index-DRuGt1Z7.css` about 46.7 KB. Lighthouse flagged ~51.6 KB
   potentially unused JS and ~45.2 KB potentially unused CSS. These are
   **simulated opportunities, not proof that bundles or styles can simply be deleted**.
4. **No observed layout instability** in this run (CLS 0). Preserve explicit hero
   dimensions, fixed navigation positioning and stable demo interactions.
5. **SEO and operational safety** is especially important: prerendered public
   route HTML, canonical tags, metadata/JSON-LD and indexed specialist owner routes
   must remain intact. Do not reduce JS bundle size by removing authority facts,
   route registries, or shared application code without dependency tracing.

## Tracked corrective sequence

- **P1: Responsive hero image** — draft PR #802:
  https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/802.
  Keep the approved image and original high-DPR fallback; add right-sized
  derivative assets and `srcSet/sizes`. Test real image load at seven widths,
  preserve priority and CLS. Only claim improvement after a comparable postdeploy run.
- **P2: Main-thread and hydration investigation.** Identify the longest tasks,
  initial JS dependency graph, and how the public prerender interacts with React
  mounting. Audit before implementing; changing `createRoot` to `hydrateRoot`
  without proving markup equivalence would risk severe hydration regressions.
- **P3: CSS critical-path reduction.** Establish which part of the shared Tailwind
  bundle is actually needed above the fold, then trial nonblocking below-fold CSS
  only if visual/SEO regression tests prove it is safe.
- **P4: Follow-up mobile field metrics.** Compare Google Search Console Core Web
  Vitals / CrUX data when available; one Lighthouse run cannot establish real-user
  speed, search ranking effect, or a traffic consequence.

## Release gates

- Full focused TypeScript/Vitest/homepage Playwright suite
- Existing production Hosting build and prerendered SEO/route checks
- Confirm live booking CTA, menu, class samples and both help channels
- Fresh mobile and desktop Lighthouse baseline following actual production deploy
- No permanent new third-party tracker, no fake content, no visual redesign
