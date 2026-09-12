# Tiny Steps SEO Recovery — Execution Progress

**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`  
**Started:** 2026-09-12  
**Repository:** `tinystepselearning-surya/tinysteps-react-v1`  
**Execution rule:** Complete and verify one brick before moving to the next.

---

## BRICK 0 — Freeze SEO Expansion

**Status:** ✅ CLOSED — baseline established

### Objective

Freeze the current indexable site architecture before consolidation work begins. No new SEO expansion is permitted during the recovery cycle unless it is explicitly approved as part of the recovery plan.

### Baseline

The recovery master plan was committed to `main` at:

`e96568da6d1c7a4db9a8f91d3ca54b3c139f5f28`

This commit is the Brick 0 recovery baseline. The existing site/indexable architecture at this baseline is the inventory to be audited and consolidated; it must not be expanded during the recovery programme.

### Current sitemap source of truth

The repository uses the sitemap index:

- `public/sitemap.xml`

which currently references these four page inventories:

- `public/sitemap-static.xml`
- `public/sitemap-blog.xml`
- `public/sitemap-courses.xml`
- `public/sitemap-parents.xml`

At the baseline, the sitemap index records these child sitemaps with `lastmod` 2026-09-11.

### Freeze rules now in force

Until this recovery plan is completed:

- [x] No new SEO landing pages.
- [x] No new city pages.
- [x] No new “best phonics” variants.
- [x] No new generic SATPIN guide.
- [x] No new generic blending pages unless an existing page genuinely cannot serve the intent and the master plan is explicitly amended.
- [x] No unnecessary URL changes on pages already earning impressions.
- [x] No major navigation redesign as part of this SEO recovery.
- [x] No mass rewrite of all blogs at once.
- [x] No programmatic SEO expansion until the recovery cycle is complete.

### Repository safety check

An open PR search for SEO-related work was reviewed at Brick 0 start.

- PR #320 states that it is a test-only CI fixture correction and explicitly says it makes **no production SEO behavior, ownership, metadata, conversion-flow, knowledge-copy, or URL-architecture change**.
- Older open SEO/analytics PRs remain visible in repository history/workflow, but Brick 0 establishes that no new indexable SEO-page expansion is to be introduced as part of this recovery programme.

### Change-control rule

From this point forward, any recovery change affecting:

- sitemap membership,
- public SEO routes,
- canonical ownership,
- redirects,
- SEO title/H1 ownership,
- or new indexable URLs

must be traceable to a specific brick in the master plan.

If a proposed change creates a new indexable SEO page, the default decision is **STOP / DO NOT ADD** unless the recovery master plan is deliberately revised after the measurement phase.

### Definition of Done

- [x] Expansion freeze documented.
- [x] Git baseline recorded.
- [x] Current sitemap source files identified.
- [x] No new SEO-page creation permitted by the recovery workflow.
- [x] Recovery changes must map to a numbered brick.

**Brick 0 decision:** CLOSED.

---

## BRICK 1 — URL Ownership Registry

**Status:** ⏭️ NEXT

Brick 1 will inventory existing relevant URLs and classify each one as:

- KEEP AS OWNER
- KEEP AS SUPPORTING PAGE
- MERGE
- 301 REDIRECT
- REPOSITION TO DIFFERENT INTENT

No production page changes should be made until the Brick 1 ownership registry is complete and reviewed.
