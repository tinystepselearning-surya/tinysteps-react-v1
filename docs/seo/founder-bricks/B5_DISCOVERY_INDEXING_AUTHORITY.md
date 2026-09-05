# Brick 5 — Founder Discovery, Indexing & Internal Authority

## Purpose

Brick 5 makes the canonical founder profile a first-class public discovery route instead of relying only on the React router and runtime metadata.

Canonical founder page:

`https://tinystepslearning.com/team/vannala-ravali-priya`

This brick does not add new biography claims or third-party identity links. It strengthens how the existing first-party founder entity is discovered, prerendered and linked internally.

## Public route contract

`/team/vannala-ravali-priya` is registered in `PUBLIC_ROUTE_MANIFEST` as a normal static public route with:

- `intent: index`
- `indexable: true`
- `sitemap: true`
- `prerender: true`
- self-canonical path
- full index/follow robots directives
- SEO registry ownership

Because the sitemap and prerender inventories are derived from this manifest, the founder profile automatically participates in the same build-time discovery pipeline as the other canonical public pages.

## SEO registry contract

The route registry owns the exact founder metadata used by build-time prerendering:

- Title: `Vannala Ravali Priya | Founder of Tiny Steps Learning`
- Canonical: `/team/vannala-ravali-priya`
- OG image: `/priya-founder-tiny-steps-learning.webp`
- Robots: `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`

`FounderPriyaPage.tsx` resolves its title, description, canonical path and robots policy from this registry, with the previously approved literals retained only as safe fallbacks.

## Sitemap and prerender behaviour

The repository generates `public/sitemap-static.xml` during `npm run build` through `npm run gen:sitemaps`.

The founder route is now included in `SITEMAP_STATIC_ROUTES`, so the generated static sitemap emits:

`https://tinystepslearning.com/team/vannala-ravali-priya`

The same manifest entry places the route in `PRERENDER_STATIC_ROUTES`, ensuring the deployed founder URL receives prerendered HTML rather than depending only on client-side discovery.

## Internal authority edges

Brick 5 adds ordinary crawlable links from:

1. `/team` → `/team/vannala-ravali-priya`
2. `/sitemap` → `/team/vannala-ravali-priya`

Brick 4 already connected Priya-authored blog bylines and author schema to the same founder profile, so these links reinforce one canonical person URL rather than creating competing biography destinations.

## Scope boundary

Brick 5 deliberately does **not** add:

- personal LinkedIn `sameAs`;
- other personal social profiles;
- qualifications, awards or certifications;
- years-of-experience claims;
- previous-employer history;
- new founder biography sections.

External corroboration belongs in a later identity-verification brick after the personal profile has been checked and standardized.

## Acceptance criteria

Brick 5 is complete when:

- the founder route exists in the public route manifest;
- the founder route exists in the SEO registry with exact approved metadata;
- sitemap and prerender inventories contain the founder path;
- build-time prerendering injects the correct title, canonical, robots policy and founder image;
- `/team` contains a crawlable founder-profile link;
- the HTML sitemap contains a crawlable founder-profile link;
- the existing Person/ProfilePage graph from Brick 4 remains unchanged;
- no personal `sameAs` is introduced.
