# Resources Architecture — R2 Learning Resources Gateway

**Status:** implementation branch  
**Route:** `/resources`  
**Purpose:** promote the former `/resources → /blog` alias into a real educational-discovery gateway without moving or weakening the existing Tiny Steps ecosystem.

## What Brick 2 changes

- `/resources` becomes an independent public `200` route.
- `/resources` becomes self-canonical, indexable, prerendered and sitemap-eligible.
- Firebase no longer redirects `/resources` or `/resources/` to `/blog`.
- Legacy `/main/resources` permanently redirects to `/resources`.
- The R0 semantic registry now protects `/resources` as a `learning-resource-gateway`.
- The route receives dedicated SEO metadata and machine-readable CollectionPage / ItemList / breadcrumb context.
- `llms.txt` now lists the Resources gateway in Core Pages.

## What Brick 2 does not change

- No `/blog/*` URL is moved, renamed, canonicalized elsewhere, or redirected.
- `/blog` remains the complete editorial discovery/archive surface.
- `/phonics`, `/grammar`, and `/speaking` remain commercial programme owners.
- `/parents` remains the parent problem-solving hub.
- `/free-english-games-for-kids` remains the practice ecosystem owner.
- `/for-schools` remains the school/B2B owner.
- Global navigation still says Blog in Brick 2; navigation migration is a later brick.
- `/resources/phonics`, `/resources/grammar`, and `/resources/speaking` remain planned and unpublished.
- No programmatic SEO pages are created.

## Gateway UX

The page deliberately avoids a long article grid. It routes users through six pathways:

1. **Phonics & Reading** → current filtered Phonics library (`/blog?topic=Phonics`)
2. **Grammar & Writing** → current filtered Grammar library (`/blog?topic=Grammar`)
3. **Speaking & Communication** → current filtered Speaking library
4. **Parent Help** → `/parents`
5. **Free Learning Activities** → `/free-english-games-for-kids`
6. **Schools & Educators** → `/for-schools`

The three subject pathways intentionally use the existing editorial library until dedicated subject hubs are built. This prevents thin placeholder pages and avoids premature duplication.

## Search-intent ownership

`/resources` owns broad educational discovery intent:

> English learning resources for kids, parents and educators

It does **not** own:

- live phonics class intent (`/phonics`)
- grammar class intent (`/grammar`)
- speaking/public-speaking class intent (`/speaking`)
- individual learning questions (`/blog/*` owners)
- parent problem routing (`/parents`)
- free practice discovery (`/free-english-games-for-kids`)
- school implementation (`/for-schools`)

Commercial readiness is deliberately **low**. The page prioritizes learning/resource navigation; programme links are secondary and appear only after the resource pathways.

## Technical acceptance contract

Brick 2 is accepted only when all of these are true:

- `PUBLIC_ROUTE_MANIFEST` contains `/resources` as an indexable static route.
- `ROUTE_SEO_REGISTRY['/resources']` is self-canonical.
- `/resources` is absent from Firebase direct redirects.
- React renders `ResourcesPage` at `/resources`.
- `/main/resources` points to `/resources`.
- R0 safety audit passes in the new post-Brick-2 state.
- R2 tests confirm all six destinations and absence of premature subject hubs.
- production build and prerender complete successfully.
- rendered SEO/indexation guards pass.
- `/resources` appears in the static sitemap output.
- existing protected ecosystem routes retain their ownership classification.

## Roll-forward rule

Brick 3 may change the global navigation label/destination from Blog to Resources only after Brick 2 is green and merged.

Brick 4 may publish `/resources/phonics`, `/resources/grammar`, and `/resources/speaking` only after canonical topic ownership is checked against existing article and commercial pages.
