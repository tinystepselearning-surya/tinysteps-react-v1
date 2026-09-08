# Resources Architecture — R3 Global Navigation Migration

**Status:** implemented and regression-protected  
**Primary navigation change:** `Blog` → `Resources`  
**Editorial archive:** `/blog` remains indexable and directly accessible as `All Guides` in the footer.

## Purpose

Brick 3 changes discovery, not ownership.

The main Tiny Steps navigation should lead users into `/resources`, the educational-discovery gateway created in Brick 2. The existing `/blog` page and every `/blog/*` article remain untouched as the editorial library underneath that gateway.

## What Brick 3 changes

- The primary header item `Blog` (`/blog`) becomes `Resources` (`/resources`).
- The active public-site header is `src/components/common/Header.tsx`; its desktop and mobile menus share the same `PRIMARY_LINKS` source.
- The legacy `src/components/NavBar/NavBar.tsx` also preserves `Resources → /resources` for routes that still render that component.
- Both navigation implementations recognize nested `/resources/...` paths so subject hubs keep the Resources item active.
- The footer adds `Resources` and preserves direct access to `/blog` under the clearer label `All Guides`.

## What Brick 3 does not change

- No `/blog` or `/blog/*` route moves, redirects, canonical changes, title changes, or body changes.
- No changes to `/phonics`, `/grammar`, `/speaking`, `/parents`, `/for-schools`, games, pricing, comparison pages, or assessment routes.
- No programmatic SEO pages.
- No change to sitemap ownership or indexation policy beyond relying on the Brick 2 `/resources` route.

## Navigation contract

### Header

The active public header must expose:

- Courses → `/courses`
- Curriculum → `/curriculum`
- Resources → `/resources`
- Pricing → `/pricing` where responsive rules allow it
- For Schools → `/for-schools`
- Class Samples → `/class-samples`
- Contact → `/contact`
- Login → `/login`

`Blog` is intentionally removed from primary navigation so Resources becomes the main educational-discovery entry point.

### Footer

The Explore section must retain both:

- Resources → `/resources`
- All Guides → `/blog`

This preserves a direct crawlable/user-visible path to the editorial archive without making it the main navigation front door.

## SEO safety principle

`/resources` and `/blog` remain separate protected intent owners:

- `/resources` owns broad educational discovery and routing.
- `/blog` owns the complete editorial guide library/archive.

Changing the navigation destination must not imply canonical consolidation, redirect equivalence, or URL migration between the two.

## Acceptance contract

Brick 3 is accepted only when:

- every active header implementation contains `Resources → /resources`;
- every active header implementation removes `Blog → /blog` from primary navigation;
- desktop and mobile public navigation derive from the same corrected `PRIMARY_LINKS` source;
- nested `/resources/...` paths resolve to the Resources active navigation item;
- the footer contains `Resources → /resources`;
- the footer contains `All Guides → /blog`;
- `/resources` and `/blog` remain separate protected, indexable, prerendered, self-canonical routes;
- approved subject hubs remain `/resources/phonics`, `/resources/grammar`, and `/resources/speaking`;
- R0–R7 regression tests, TypeScript, production build/prerender, rendered Resources audit, and SEO smoke continue to pass.

## Regression lesson

The original R3 test inspected only `src/components/NavBar/NavBar.tsx`. Production uses `src/components/common/Header.tsx` for the public site, so that test could pass while the live header still showed Blog. R3 now explicitly watches and tests the active public header as well as the legacy NavBar.
