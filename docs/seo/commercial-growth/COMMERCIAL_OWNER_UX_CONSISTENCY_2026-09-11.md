# Commercial Owner UX Consistency — 14 Canonical Pages

Date: 2026-09-11
Branch: `ux/commercial-owner-consistency`

## Goal

Create a coherent commercial experience across all 14 unique C1–C3 owner URLs without changing keyword ownership, page facts, canonicals, structured-data ownership, or commercial intent boundaries.

## Scope

The shared experience layer covers exactly:

- `/phonics`
- `/best-online-phonics-classes-for-kids-in-india`
- `/phonics-fees-india`
- `/reading-classes-for-kids`
- `/reading-fluency-program`
- `/grammar`
- `/writing-classes-for-kids`
- `/spoken-english-classes-for-kids-online`
- `/speaking`
- `/confidence-building-program-kids`
- `/online-english-classes-for-kids`
- `/online-english-classes-hyderabad`
- `/pricing`
- `/book-demo`

## Audit result

Ten owners already use the current Tiny Steps commercial visual language and are protected from unnecessary redesign. Four pages were identified as genuine visual-system outliers and receive scoped visual bridges:

1. `/pricing` — legacy `page-gradient` / `glass-panel` / `gradient-chip` presentation.
2. `/writing-classes-for-kids` — older single-column boxed-document rhythm.
3. `/reading-fluency-program` — narrow `max-w-4xl` utility-card layout with legacy rounded-xl sections.
4. `/confidence-building-program-kids` — older boxed-column rhythm despite current content quality.

No commercial copy is removed or rewritten by this brick.

## Shared scrolling and interaction psychology

All 14 owners receive a small progressive-enhancement layer:

- a 3px top scroll-progress cue so long-form commercial pages communicate progress without taking layout space;
- one delayed assessment CTA after the visitor has engaged with the page instead of repeating an immediate sales interruption at the top;
- CTA copy that changes late in the page from discovery-oriented language to a clearer next-step prompt;
- section entrance feedback as lower sections enter the viewport;
- existing CTA buttons retain their page-specific destinations and conversion interception;
- `/book-demo` explicitly does not receive the floating assessment CTA because the page itself is already the transactional owner;
- anchor targets receive consistent sticky-header scroll offset;
- existing cards, buttons and FAQ disclosures receive subtle press/open feedback.

The buyer-comparison phonics page keeps its existing sticky on-page navigation and active-section logic; the shared layer does not replace or duplicate it.

## Performance / Core Web Vitals contract

The enhancement deliberately avoids a new animation framework or page-level React dependency.

- plain deferred JavaScript public asset;
- no external network calls;
- no Framer Motion dependency;
- no timers that poll continuously;
- scroll and resize listeners are passive and throttled through `requestAnimationFrame`;
- section work uses native `IntersectionObserver` and is scheduled with `requestIdleCallback` where supported;
- reveal motion uses only opacity and transform, not animated dimensions or layout properties;
- page content is never initially hidden, avoiding LCP delays and no-JS invisibility;
- `prefers-reduced-motion` is respected;
- a raw asset-size regression ceiling is enforced in tests;
- all visual changes are CSS-only overlays on existing markup, so the semantic page structure remains intact.

## SEO / C1–C3 protection

This brick must not change:

- the 14 canonical owner URLs;
- the 15 user-facing C1–C3 intent boundaries;
- titles, descriptions or canonical ownership;
- sitemap ownership;
- public commercial facts;
- structured-data semantics;
- C2 keyword ownership;
- C3 owner-page source facts.

The existing C1–C3, GSC, crawl/discovery, dead-URL, sitemap, prerender, build and SEO smoke gates remain the merge criteria.
