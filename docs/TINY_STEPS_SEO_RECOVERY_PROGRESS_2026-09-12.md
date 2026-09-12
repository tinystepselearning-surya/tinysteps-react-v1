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

**Status:** ✅ CLOSED — ownership registry built and committed

### Brick artifact

`docs/TINY_STEPS_SEO_RECOVERY_BRICK_1_URL_OWNERSHIP_REGISTRY_2026-09-12.md`

Committed at:

`eeb725c524b69ca03628e3cb06955ea25cf8e856`

### Scope completed

Brick 1 audited and classified the priority recovery URLs across:

- generic commercial phonics
- phonics comparison / provider-selection
- phonics fees / pricing
- reading / fluency / parent-problem landings
- SATPIN
- blending and early decoding
- long vowels / R-controlled vowels / tricky-word practice
- apps, games and home-practice content
- tracing / tracing-with-sounds
- retired phonics aliases and existing redirects

Each priority URL now has one of the required decisions:

- **KEEP AS OWNER**
- **KEEP AS SUPPORTING PAGE**
- **MERGE**
- **301 REDIRECT**
- **REPOSITION TO DIFFERENT INTENT**

### Locked commercial ownership

- `/phonics` — generic online phonics classes / phonics classes for kids.
- `/best-online-phonics-classes-for-kids-in-india` — best/compare/provider-selection intent.
- `/phonics-fees-india` — phonics fee/cost/price intent.
- `/pricing` — cross-programme pricing intent.
- `/book-demo` — free assessment/demo/trial intent.

### Important evidence-based correction

The provisional master plan listed `/blog/child-knows-letter-sounds-but-cannot-read` as the intended surviving diagnostic URL.

Repository evidence showed that Tiny Steps had already completed the opposite consolidation:

`/blog/child-knows-letter-sounds-but-cannot-read`

→ **301** →

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

The existing intent registry explicitly identifies the destination as the canonical owner and records search visibility for both the surviving page and the historical redirect source.

**Brick 1 therefore protects the existing consolidation and does not reverse the redirect.**

This prevents unnecessary canonical churn and preserves accumulated redirect equity.

### New merge decision generated by Brick 1

`/blog/how-to-choose-phonics-classes` is assigned for **MERGE** into:

`/best-online-phonics-classes-for-kids-in-india`

Reason: the blog and commercial comparison page substantially overlap on provider-selection/comparison intent, while the recovery strategy requires one clear commercial comparison owner.

When this merge is physically implemented in Bricks 3–4, the historical aliases:

- `/blog/best-online-phonics-classes-for-kids`
- `/blog/best-phonics-classes-for-kids`

must point **directly** to the final comparison owner rather than creating a redirect chain through the retired `how-to-choose` article.

### Protected distinctions

Brick 1 explicitly keeps these separate:

- ABC-known-but-cannot-read vs letter-sounds-known-but-cannot-read.
- SATPIN master guide vs SATPIN home routine.
- Blending explainer vs blending activities vs daily blending routine.
- Long-vowel concepts vs long-vowel practice.
- R-controlled concepts vs R-controlled practice.
- Plain ABC tracing vs tracing with sounds.
- Generic phonics classes vs reading classes vs fluency programme.

### Production safety

- [x] No new indexable URL created.
- [x] No production page copy changed.
- [x] No production redirect changed.
- [x] No canonical changed.
- [x] No sitemap membership changed.
- [x] Ownership decisions are documented before implementation.

### Definition of Done

- [x] Generic phonics commercial owner locked.
- [x] Comparison owner locked.
- [x] Pricing owner locked.
- [x] SATPIN owner locked.
- [x] Parent-problem owners locked.
- [x] Tracing owners locked.
- [x] Blending/pattern-support roles differentiated.
- [x] Existing redirect lineage reviewed.
- [x] Planned merge and reposition work identified for later bricks.
- [x] Full Brick 1 registry committed to GitHub.

**Brick 1 decision:** CLOSED.

---

## BRICK 2 — Restore `/phonics` as the Main Commercial Authority

**Status:** ⏭️ NEXT

Brick 2 will audit the current `/phonics` implementation against the locked ownership registry and make only the controlled changes required to reinforce it as the generic commercial phonics owner.

Planned Brick 2 scope:

- current title/meta/H1 audit
- opening 250–350 word intent audit
- programme proposition and age-range clarity
- assessment/placement clarity
- curriculum/methodology/outcome coverage
- FAQ and testimonial relevance
- commercial query wording without keyword stuffing
- internal-link intake from existing supporting pages
- schema/canonical safety check
- no URL change
- no new page creation

Brick 2 must be completed before Brick 3 physically removes commercial cannibalisation.
