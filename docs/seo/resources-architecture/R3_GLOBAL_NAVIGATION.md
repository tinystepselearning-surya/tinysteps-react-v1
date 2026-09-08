# Resources Architecture — R3 Global Navigation Migration

**Status:** implementation branch  
**Primary navigation change:** `Blog` → `Resources`  
**Editorial archive:** `/blog` remains indexable and directly accessible as `All Guides` in the footer.

## Purpose

Brick 3 changes discovery, not ownership.

The main Tiny Steps navigation should now lead users into `/resources`, the educational-discovery gateway created in Brick 2. The existing `/blog` page and every `/blog/*` article remain untouched as the editorial library underneath that gateway.

## What Brick 3 changes

- The primary header item `Blog` (`/blog`) becomes `Resources` (`/resources`).
- The active public header (`src/components/common/Header.tsx`) and the legacy `NavBar` implementation must both route `Resources` to `/resources`; desktop and mobile links in the public header share the same `PRIMARY_LINKS` source.
- Navigation matching recognizes nested `/resources/...` paths so future subject hubs keep the Resources item active.
- The footer adds `Resources` and preserves direct access to `/blog` under the clearer label `All Guides`.

## What Brick 3 does not change

- No `/blog` or `/blog/*` route moves, redirects, canonical changes, title changes, or body changes.
- No changes to `/phonics`, `/grammar`, `/speaking`, `/parents`, `/for-schools`, games, pricing, comparison pages, or assessment routes.
- No `/resources/phonics`, `/resources/grammar`, or `/resources/speaking` publication yet.
- No programmatic SEO pages.
- No change to sitemap ownership or indexation policy beyond relying on the Brick 2 `/resources` route.

## Navigation contract

### Header

- Home → `/`
- Courses → `/courses`
- Curriculum → `/curriculum`
- Resources → `/resources`
- Pricing → `/pricing`
- Parent Login → `/parent/login`

`Blog` is intentionally removed from the primary header so Resources becomes the main educational-discovery entry point.

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
- nested `/resources/...` paths resolve to the Resources active navigation item;
- the footer contains `Resources → /resources`;
- the footer contains `All Guides → /blog`;
- `/resources` and `/blog` remain separate protected, indexable, prerendered, self-canonical routes;
- the three planned subject hubs remain unpublished;
- Brick 2 and R0/R1 regression tests still pass;
- TypeScript, production build/prerender, rendered Resources audit, and SEO smoke pass.

## Roll-forward rule

The next subject-hub brick may publish `/resources/phonics`, `/resources/grammar`, and `/resources/speaking` only after canonical topic ownership is reconciled against existing articles and commercial programme pages.
