# Resources Architecture — R4 Subject Hubs

**Status:** implementation branch  
**Routes:** `/resources/phonics`, `/resources/grammar`, `/resources/speaking`

## Purpose

Brick 4 creates three subject-level discovery hubs underneath `/resources` without changing the canonical ownership of existing programme pages, problem pages, games, or `/blog/*` editorial authorities.

The hubs are **orchestration pages**, not replacement encyclopedias.

## Human entry model

Every hub uses the same three ways to start:

1. **Learn the pathway** — reach the established explanatory/progression owner.
2. **Practise the skill** — move into the existing free games ecosystem.
3. **Solve a problem** — reach the established diagnostic/problem owner.

The complete filtered blog library remains available as a fourth route, and commercial programme/assessment links remain visually separate and secondary.

## Canonical ownership safeguards

- `/phonics`, `/grammar`, `/speaking` remain the commercial programme owners.
- Existing `/blog/*` URLs remain the detailed informational/diagnostic owners.
- Existing game URLs remain the practice owners.
- `/parents`, `/for-schools`, and `/free-english-games-for-kids` remain independent ecosystem hubs.
- No `/resources/parents`, `/resources/games`, `/resources/schools`, or `/resources/blog` duplicates are created.
- Subject-hub SEO titles intentionally avoid the word `Classes` to reduce overlap with programme pages.
- Subject-hub registry query ownership is branded/navigational (`Tiny Steps ... resource hub`), not a broad topic keyword claim.

## Technical acceptance

All three routes must be indexable, self-canonical, prerendered, in the generated sitemap, present in `ROUTE_SEO_REGISTRY`, protected in `RESOURCE_ECOSYSTEM_REGISTRY`, discoverable from `/resources`, and listed in `llms.txt`.

R0/R1/R2/R3 and repository-wide SEO/GSC guards must continue to pass.

## Brick boundary

Brick 4 does **not** create pattern libraries, programmatic SEO pages, new phonics topic owners, or a semantic internal-link engine. Those remain later bricks after canonical topic ownership is formally reconciled.
