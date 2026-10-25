# Tiny Steps Homepage 2.0 — final design and release audit

**Review date:** 2026-10-25 (IST)  
**Target branch:** `feature/homepage-premium-gateway-20261025`  
**Production / main:** No merge or deployment performed by this audit.  
**Scope:** Entire redesigned homepage, shared header/footer/support controls, and the five linked programme owner routes. The historical whole-site build/SEO checks cover additional routes, but this is **not** a manual visual inspection of all ~266 site pages.

## Decision

**Design freeze recommended; production merge remains gated on rerunning the checks below and explicit owner approval.** Preserve the approved deep navy (`#102A43`) and sun orange (`#FF7A00`) style, the single photo-led hero, one primary booking CTA in the hero, four aligned programme tiles, and light static sections.

## Evidence and standards used

- Local screenshot review: hero, learning pathways, teaching approach, connected learning, Explore, booking CTA and footer at desktop width (user-supplied 2026-10-25 captures).
- Live connected-browser read of the localhost homepage: verifies the accessible HTML includes five specialist programme hyperlinks and the full gateway, footer and booking navigation.
- User-supplied local logs, **before this final audit's polishing commits**:
  - 266/266 prerender routes successful.
  - Rendered-HTML audit: 260 files, zero canonical/metadata/noindex/soft-404 failures.
  - 299/299 route-indexability checks passed.
  - Public initial JS: 127.77 KiB gzip (150 KiB configured budget).
  - 36/36 focused Vitest tests and 11/11 Playwright tests passed.
- WCAG 2.2: focus visible and not obscured, text contrast, reduced motion, meaningful headings and navigation: https://www.w3.org/TR/WCAG22/
- Google Search Central link guidance: real anchor href values and concise descriptive links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- web.dev animation guidance: avoid continuous layout/paint-intensive animation; prefer low-cost interactions: https://web.dev/articles/animations-guide
- web.dev LCP: prioritise the hero image, avoid lazy loading the LCP candidate: https://web.dev/articles/optimize-lcp

## Section-by-section audit

| Surface | Result | Action |
| --- | --- | --- |
| Header and navigation | Responsive existing header, booking modal intercept retained. | No global nav rewrite; browser/responsive regression remains a release check. |
| Photo-led hero | Clear 1:1 offer, five descriptive deep links, high-priority 94-KB WebP. | Preserve. No duplicated assessment-form entry point. |
| Learning journey | Four semantic owner-route cards with keyboard focus and CSS-only subdued hover. | Keep panel; separate two optional links underneath for mobile clarity. |
| Teaching approach | Three accurate, short principles with semantic headings and no fixed-sequence claim. | Preserve. |
| Connected learning | Actual live classes, worksheet/practice support and parent portal described without invented AI functions. | Preserve. |
| Explore directory | Six descriptive links to curriculum, class samples, pricing, resources, blog and FAQ. | Preserve. |
| Final booking | Contrasting warm panel and one booking CTA. | Preserve; ensure floating dock doesn't overlap it. |
| Homepage footer | Accurate five-programme directory, contact and legal links. | Remove generic trust strip and decorative credit on homepage; reduce homepage social clutter. Other page footers remain unchanged. |
| Floating AI + WhatsApp | Previously fixed high-z control cycled shape and repeatedly animated shadows/pings. | Suppress dock near booking/footer without closing open chat; on homepage, use a compact, static assistant. On other pages, respect reduced-motion preference. |
| Back-to-top | Compact homepage style and OS reduced-motion scroll behaviour. | Preserve. |

## Change safety

- No route registry, canonical ownership, JSON-LD schema, metadata registry, Firestore lead persistence, or WhatsApp handoff has been edited in the final polishing pass.
- No new animation package, network request, font asset, video or heavyweight homepage image.
- Footer changes are scoped to `/`; shared full footer remains on specialist pages.
- Existing AI modal state remains available when the floating dock is temporarily hidden.
- The floating assistant's automatic pulse/size cycle is disabled on `/` and for users preferring reduced motion.

## Tests updated/added — **not yet rerun after these commits**

- `src/tests/seo/homeAiEntityVisibility.spec.ts`: 28 static SEO, content, safety and polish tests.
- `src/tests/components/FloatingAssistant.test.tsx`: 12 component tests, including the no-pulse homepage state and specialist-page behaviour.
- `tests/homepage-premium-responsive.spec.ts`: 7 widths (320/375/430/768/1024/1366/1920px) plus dock, footer, reduced-motion, focus and hover cases (11 total).
- `tests/homepage-gateway-destinations.spec.ts`: 5 specialist-link navigation tests and 1 safe booking-modal open test, no lead submission.
- Previous successful test runs **do not** establish that the newest branch revision passes.

## Final release commands

```bash
git switch feature/homepage-premium-gateway-20261025
git pull --ff-only
npm run typecheck
npx vitest run src/tests/seo/homeAiEntityVisibility.spec.ts src/tests/components/FloatingAssistant.test.tsx
npx playwright test tests/homepage-premium-responsive.spec.ts tests/homepage-gateway-destinations.spec.ts
npm run build
```

The full build should again report the expected prerender, rendered HTML, route integrity, public facts, and bundle checks. Investigate new failures rather than suppressing them.

### Browser/manual release gates

1. Anonymous (logged-out) phone, tablet and desktop: no horizontal scrolling, no clipped sticky navigation, no hidden CTA.
2. After support-widget activation: compact AI control, no repetitive pulsing, WhatsApp remains tappable; scroll to the final CTA/footer to ensure the dock hides and back-to-top does not obstruct conversion controls; scroll back up to check return.
3. Keyboard-only: visible focus on hero links, cards, Explore links, CTA and footer; no obscured focus.
4. OS reduced motion: no animated assistant pulse, no unwanted marquee or scrolling animation.
5. Open demo modal and close it; do **not** submit production lead records as part of automation.
6. Measure LCP, INP and CLS under production-equivalent conditions. The 127.77 KiB gzipped JS report alone is not a Web Vitals result.
7. Confirm title/canonical, JSON-LD, cross-links and actual live deployment after approval.

## Open items / scope boundaries

- The footer's old trust-assurance strip remains on non-homepage routes. It should be independently reviewed before a future whole-site footer redesign; that is intentionally **not** part of this homepage-only change.
- No automated test proves pixel-perfect rendering across every device or browser.
- GitHub CI has not produced a branch workflow run in the observed window. The last local logs predate final polish.
- No production merge/deploy, real transaction, test lead, or GitHub deployment workflow was performed.

**Release recommendation:** Conditional **GO for owner visual review**, **NO-GO for merging** until final commands pass and the owner explicitly approves production.

## Addendum — 2026-10-26: parent decision pathways requested after visual review

The owner requested more helpful homepage routes to real class samples, **standard (not Ultra Premium) live 1:1 pricing**, and a compact set of initially collapsed parent FAQs.

**Implemented only in the same unmerged feature branch:**
- A single lightweight `BeforeYouBookSection`, placed after Connected Learning, with three restrained preview cards.
- Class samples: a static CTA to `/class-samples` without embedding videos, loading third-party iframes or adding new imagery to the homepage.
- Standard pricing: values and duration are rendered from `PER_CLASS_PRICE` and `ONE_TO_ONE_MONTHLY_PACKAGES` in `src/config/pricing.ts`. The direct destination is `/pricing#standard-pricing` (an existing target on the pricing page). Do not present Ultra Premium prices on the homepage.
- Parent FAQ: three closed-by-default native HTML `details/summary` questions and a route to the complete `/faq`. No homepage FAQPage JSON-LD was introduced.
- The redundant class-sample, pricing and FAQ items were removed from the Explore directory; Curriculum, Learning Resources and Parent Articles remain there. Thus, all six original informational destinations are preserved.
- Separate source assertions, seven-width responsive preview assertions, keyboard accordion test and three linked-destination Playwright smoke tests were added.

The 2026-10-25 visual freeze applied to the earlier six-section design; these are subsequent owner-requested adjustments. The prior 40/40 Vitest and 18/18 Playwright results do not validate the new previews. Rerun the focused source/component test and both Playwright suites, then typecheck/build, before any merge.

```bash
git switch feature/homepage-premium-gateway-20261025
git pull --ff-only
npm run typecheck
npx vitest run src/tests/seo/homeAiEntityVisibility.spec.ts src/tests/components/FloatingAssistant.test.tsx
npx playwright test tests/homepage-premium-responsive.spec.ts tests/homepage-gateway-destinations.spec.ts
npm run build
```

**Release gate remains:** no production merge without fresh passing checks and explicit owner approval.
