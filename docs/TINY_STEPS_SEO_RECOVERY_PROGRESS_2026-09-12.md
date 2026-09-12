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

**Status:** ✅ CLOSED — existing strong owner preserved and recovery-certified

### Brick artifact

`docs/TINY_STEPS_SEO_RECOVERY_BRICK_2_PHONICS_AUTHORITY_2026-09-12.md`

### Regression protection

`src/tests/seo/recoveryBrick2PhonicsAuthority.spec.ts`

Test commit:

`55e528e349e6c0090a7fd4d6626a1721f7f50297`

Brick artifact commit:

`b0dd85ae1ad87c6ee1629b674192a343b836c97f`

### Audit conclusion

The current `/phonics` page already satisfies the intended Brick 2 authority contract. It has:

- self-canonical `/phonics`
- commercial H1 `Online Phonics Classes for Kids`
- aligned title and meta description
- live 1:1 proposition
- ages 3–12
- assessment-first placement
- 35-minute standard live class duration
- three programme levels
- cumulative phonics methodology
- blending, decoding, spelling and reading-fluency coverage
- parent-visible progress
- FAQ coverage and FAQ schema
- Course schema
- pathway and quality-criteria ItemList schema
- testimonials / class-sample / curriculum trust pathways
- explicit handoff to the comparison owner
- explicit handoff to the phonics fee owner
- SATPIN, blending, reading-problem and free-practice support links

### Controlled Brick 2 decision

Because the owner page is already strong, Brick 2 deliberately **did not perform another large rewrite**.

Preserved unchanged:

- URL
- canonical
- title
- meta description
- H1
- hero structure
- programme hierarchy
- sitemap membership
- schema architecture

This reduces ranking volatility and gives later cannibalisation cleanup a cleaner measurement environment.

### Generic alias consolidation confirmed

The repository already permanently consolidates:

- `/phonics-classes-for-kids` → `/phonics`
- `/online-phonics-reading-classes` → `/phonics`

These redirects remain protected.

### Ownership separation confirmed

- `/phonics` remains the generic commercial programme owner.
- `/best-online-phonics-classes-for-kids-in-india` remains the best/compare/provider-selection owner.
- `/phonics-fees-india` remains the phonics fee/cost owner.
- `/book-demo` remains the assessment/demo transactional owner.

### Known cleanup queued for later bricks

The `/phonics` source still contains direct links to the retired historical diagnostic path:

`/blog/child-knows-letter-sounds-but-cannot-read`

The path already 301s to the correct current owner:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

This is not a second indexable owner and therefore does not block Brick 2. Direct-link cleanup is assigned to Brick 8 / Brick 11, where internal-link and technical consolidation are handled systematically.

### Definition of Done

- [x] Generic commercial authority verified.
- [x] Canonical protected.
- [x] Title/meta/H1 verified.
- [x] Assessment-first programme proposition verified.
- [x] Curriculum/methodology/outcomes verified.
- [x] Comparison ownership separated.
- [x] Fee ownership separated.
- [x] Informational/support pathways verified.
- [x] FAQ/schema coverage verified.
- [x] Generic aliases confirmed as redirects into `/phonics`.
- [x] Recovery regression test committed.
- [x] No new indexable page created.
- [x] No unnecessary broad rewrite introduced.

**Brick 2 decision:** CLOSED.

---

## BRICK 3 — Remove Commercial Cannibalisation

**Status:** ⏭️ NEXT

Brick 3 will physically clean the remaining commercial overlap around the now-certified `/phonics` authority owner.

Primary Brick 3 targets:

- protect `/phonics` as generic programme owner
- protect `/best-online-phonics-classes-for-kids-in-india` as comparison owner
- protect `/phonics-fees-india` as fee owner
- audit `/blog/how-to-choose-phonics-classes` against the comparison page and prepare/execute the approved consolidation path
- ensure historical “best phonics” aliases resolve directly to the final comparison owner without redirect chains
- reposition any remaining commercial-support content that still competes for the same head queries
- verify homepage and informational blogs do not present themselves as the generic commercial phonics owner

Brick 3 must not create a new commercial URL.
