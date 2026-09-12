# Tiny Steps SEO Recovery — Brick 4: Genuine Duplicate Merge

**Date:** 2026-09-12  
**Status:** ✅ CLOSED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Brick 4 executes the first physical consolidation approved by the URL ownership registry. The purpose is to remove a genuine commercial-intent duplicate without creating a new page or weakening the surviving authority URL.

The retired source is:

`/blog/how-to-choose-phonics-classes`

The final authority owner is:

`/best-online-phonics-classes-for-kids-in-india`

The historical aliases are:

- `/blog/best-online-phonics-classes-for-kids`
- `/blog/best-phonics-classes-for-kids`

All three retired paths now resolve directly to the commercial comparison owner. No redirect chain through the retired `how-to-choose` article is permitted.

---

## Why This Merge Is Correct

Brick 1 and Brick 3 established that provider-selection / “best phonics classes” intent belongs to the dedicated commercial comparison page, not to a second editorial article.

Before retirement, the `how-to-choose-phonics-classes` article substantially repeated the same decision job already served by the commercial comparison owner:

- child-fit / placement checks
- teaching-quality checks
- transfer / progress evidence
- format comparison
- trial / assessment questions
- provider scorecard
- red flags
- pricing clarity
- programme / fee / assessment handoffs

The surviving comparison page already contains the equivalent parent decision framework in production source through:

- `decisionGates`
- `comparisonFormats`
- `providerScorecard`
- `demoQuestions`
- `redFlags`
- `pricingQuestions`
- links to `/phonics`
- links to `/phonics-fees-india`
- links to `/book-demo`

Therefore, Brick 4 does **not** duplicate the retired article text into the comparison page. Its useful decision framework is already represented there, so copying it again would add length and duplication rather than authority.

---

## Final Redirect Topology

The final required topology is now encoded as:

```text
/blog/how-to-choose-phonics-classes
    └── 301 → /best-online-phonics-classes-for-kids-in-india

/blog/best-online-phonics-classes-for-kids
    └── 301 → /best-online-phonics-classes-for-kids-in-india

/blog/best-phonics-classes-for-kids
    └── 301 → /best-online-phonics-classes-for-kids-in-india
```

There is no intermediate redirect through another retired blog URL.

Implementation is protected in both:

- `scripts/blog-consolidation-map.mjs`
- `functions/src/notFoundRoute.ts`

The Vite canonical internal-link rewrite already consumes the central consolidation map, so build output rewrites internal references to the final owner rather than generating links to retired URLs.

---

## Source Retirement

Deleted:

`src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts`

This removes the article from the dynamic `import.meta.glob('./posts/**/*.ts')` blog registry. It can no longer render as a separate indexable blog authority after the updated site is built/deployed.

---

## Discovery and Indexing Cleanup

### Sitemap

The sitemap generation pipeline derives blog URLs from the live blog source set. Because the retired source file is deleted, the next normal build no longer includes it in `sitemap-blog.xml`.

The commercial destination remains present in `sitemap-static.xml`.

`scripts/audit-blog-consolidation.mjs` was expanded so blog-to-commercial consolidations are validated correctly:

- retired blog source must not remain in the blog sitemap;
- a surviving blog destination must exist in the blog sitemap;
- a commercial destination must exist in the static sitemap;
- retired URLs must not remain in RSS/Atom discovery files.

### RSS / Atom

`scripts/generate-rss.mjs` no longer lists the retired `how-to-choose` URL as a required feed URL. The source article deletion also removes it from dynamically generated blog feed items.

### LLM discovery files

The prebuild discovery step now removes retired blog URLs whose final destination is a commercial page from:

- `public/llms.txt`
- `public/llms-full.txt`

It also updates the current quality-reviewed editorial counts from:

- 34 → **33** phonics editorial authorities
- 51 → **50** total quality-reviewed editorial authorities

The commercial comparison page remains separately declared in the commercial-owner section.

---

## Authority Registry Cleanup

Updated:

`src/lib/phonicsAuthorityRoutes.js`

Current phonics editorial authority set: **33**.

Updated:

`src/lib/editorialQualityRoutes.js`

Current quality-reviewed editorial authority set: **50** = 33 phonics + 17 parent communication / English-support authorities.

Backward-compatible legacy export names are retained temporarily because older build/audit code imports them. Their values now point to the current 33/50 sets; they do not preserve the retired URL as a live authority.

---

## Intent Registry Cleanup

`scripts/blog-intent-clusters.mjs` now records the phonics class-selection cluster as resolved.

The retired provider-selection article is no longer a current slug.

The two surviving informational support pages remain distinct:

- `/blog/online-phonics-classes-vs-school` — delivery-mode / context comparison
- `/blog/why-parents-choose-online-phonics` — online-format benefits / parent-fit explanation

These are not merged simply because they share “online phonics” vocabulary. Their user jobs remain distinct from the commercial provider-selection owner.

---

## Regression Protection

Added:

`src/tests/seo/recoveryBrick4DuplicateMerge.spec.ts`

The guard protects all of the following:

- all three retired provider-selection URLs point directly to the final comparison owner;
- no old alias points through the retired `how-to-choose` URL;
- the retired article source file remains deleted;
- the retired slug stays out of the phonics and overall editorial authority registries;
- the surviving commercial comparison page retains the useful parent decision framework;
- the remaining informational class-selection articles stay differentiated;
- server-side redirect wiring remains present;
- feed/discovery generation remains aware of the retirement;
- the consolidation audit continues to support a commercial destination.

Existing phonics/indexability and LLM-discovery regression tests were updated to reflect the intentional 33/50 authority counts.

---

## Commits

- `19dbd29805308daa0eaa3bf61847816ed026c72b` — consolidation map: direct final-owner topology
- `d2dc29e20d8647efc652178df73e30c2da7fd2ca` — server redirect topology
- `d0f4ae19583a0d74b8aced2a87037dc3621cc722` — consolidation audit supports commercial destinations
- `37cca7615558860828150d9a06add881728ae622` — remove retired blog from RSS required URLs
- `4f859870606b0eedc75fb1eb64777adbe92887bc` — remove retired article from phonics authority set
- `fe83cc687d21d9156a8a765143fcaacc405e36de` — adjust overall editorial authority registry
- `63765a17ab170d14efa43ec6eb42229aa2cc7ba4` — align phonics crawlability regression
- `87699d76c00c49b241ec0cd1892eb9eff44ec67c` — align quality editorial discovery regression
- `361e4bd57f3b36cd3bb049df36b5b20d8d6d90a5` — retain compatible phonics authority export names
- `8eb32cbacd51f992fdfbf4278b7e84a006d673df` — retain compatible overall authority export names
- `b68b34c677389e8d3532a57b64837bb9d0bcae5a` — remove retired URL from blog SEO smoke target
- `03341c055b04da69296ed66f8cefde3742b759ae` — delete duplicate blog source
- `8dfdf6ac349969b1d6bfca7b28c7e2c3e3456865` — update intent ownership matrix
- `41311eee83f5bbdb8330d014f29b3a4757aa65e0` — normalize RSS + LLM discovery outputs during prebuild
- `cb1fc1b0d87152fe827cd710da021cd3e46da771` — Brick 4 regression guard

---

## Deferred Cleanup — Not a Blocker

A few historical references may remain in non-authoritative source metadata or old audit documentation, for example:

- publication-date metadata for the retired slug;
- a dormant CTA override keyed to the retired slug;
- previously committed generated sitemap/feed/LLM files before the next normal prebuild regenerates them;
- historical audit reports describing the old state.

These do **not** create a second live article because the source article has been removed and the redirect topology is now canonical. Direct stale-source cleanup belongs to the later internal-link / technical-consolidation bricks (Brick 8 / Brick 11) rather than expanding Brick 4 into a sitewide cleanup.

---

## Definition of Done

- [x] Genuine commercial duplicate identified from the locked registry.
- [x] Useful source concepts confirmed present on the surviving comparison owner.
- [x] Duplicate article source deleted.
- [x] Retired source permanently maps to the final commercial owner.
- [x] Both historical “best phonics” aliases map directly to the same final owner.
- [x] No redirect chain through the retired article remains in the canonical redirect map.
- [x] Blog authority registry no longer treats the retired article as live.
- [x] Overall editorial authority registry no longer treats the retired article as live.
- [x] RSS generation no longer requires the retired URL.
- [x] Prebuild LLM-discovery cleanup added.
- [x] Consolidation audit supports blog-to-commercial destinations.
- [x] Intent ownership matrix updated.
- [x] Dedicated Brick 4 regression protection added.
- [x] No new SEO URL created.
- [x] Distinct informational support pages preserved rather than over-merged.

**Brick 4 decision: CLOSED.**
