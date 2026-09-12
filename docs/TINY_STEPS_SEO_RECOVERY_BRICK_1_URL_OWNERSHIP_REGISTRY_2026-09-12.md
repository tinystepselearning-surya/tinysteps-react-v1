# Tiny Steps SEO Recovery — Brick 1 URL Ownership Registry

**Status:** ✅ BUILT — ownership decisions locked for recovery execution  
**Date:** 2026-09-12  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`  
**Brick 0 baseline:** `e96568da6d1c7a4db9a8f91d3ca54b3c139f5f28`  
**Repository:** `tinystepselearning-surya/tinysteps-react-v1`

---

## 1. Brick 1 objective

Assign one clear job to every priority URL involved in the Tiny Steps phonics recovery before production content, redirects, canonicals, titles, internal links, or sitemap membership are changed.

This registry is the execution contract for Bricks 2–12.

The five allowed decisions are:

- **KEEP AS OWNER** — the URL is the canonical owner of a distinct search intent.
- **KEEP AS SUPPORTING PAGE** — the URL is useful and distinct, but must support a stronger owner rather than target that owner's head query.
- **MERGE** — useful content should be consolidated into the stated destination and the source retired.
- **301 REDIRECT** — the URL is already or should become a permanent alias only.
- **REPOSITION TO DIFFERENT INTENT** — keep the URL, but narrow its title/H1/copy/internal-anchor targeting so it no longer competes with the stated authority owner.

No new indexable URL is introduced by Brick 1.

---

# 2. Locked authority hierarchy

## Tier A — commercial phonics owners

| Intent | Locked owner |
|---|---|
| Generic online phonics classes / phonics classes for kids | `/phonics` |
| Best / compare / provider-selection phonics intent | `/best-online-phonics-classes-for-kids-in-india` |
| Phonics fees / cost / price research | `/phonics-fees-india` |
| Cross-programme price/package intent | `/pricing` |
| Free assessment / trial / demo intent | `/book-demo` |

## Tier B — reading/problem owners related to phonics

| Intent | Locked owner |
|---|---|
| Reading classes / reading tutor | `/reading-classes-for-kids` |
| Reading-fluency programme | `/reading-fluency-program` |
| Broad “child not reading properly” problem | `/child-not-reading-properly` |
| Slow-reader / fluency-help problem | `/slow-reader-child-help` |
| Child knows ABC/letter names but cannot read | `/blog/child-knows-abc-but-cannot-read` |
| Child knows letter sounds but cannot blend/read words | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |

## Tier C — informational phonics authorities

| Intent | Locked owner |
|---|---|
| SATPIN definition / order / method / words / reading | `/blog/satpin-phonics-guide` |
| SATPIN at-home launch routine | `/blog/phonics-satpin-launch` |
| How children learn blending | `/blog/how-kids-learn-blending` |
| Blending activities | `/blog/phonics-blending-activities` |
| Daily blending routine | `/blog/phonics-blending-club` |
| CVC words explanation | `/blog/cvc-words-explained-for-parents` |
| Long-vowel concept guide | `/blog/long-vowel-sounds-for-kids` |
| Long-vowel practice routine | `/blog/phonics-long-vowels` |
| R-controlled vowel concept guide | `/blog/r-controlled-vowels-explained` |
| R-controlled vowel practice routine | `/blog/phonics-r-controlled` |
| Broad parent phonics guide | `/blog/phonics-for-parents-guide` |

## Tier D — free-practice authorities

| Intent | Locked owner |
|---|---|
| ABC / alphabet / letter tracing | `/free-letter-tracing-game-for-kids` |
| Letter tracing specifically paired with sounds | `/letter-tracing-with-sounds-game` |
| Phonics practice-games hub | `/phonics-learning-games` |
| General free English-games hub | `/free-english-games-for-kids` |
| Phonics/reading resource discovery hub | `/resources/phonics` |

---

# 3. Evidence-based correction to the provisional master map

The master plan provisionally listed `/blog/child-knows-letter-sounds-but-cannot-read` as the surviving owner.

Brick 1 repository review found that this would reverse an already-completed consolidation:

- `scripts/blog-consolidation-map.mjs` permanently maps `/blog/child-knows-letter-sounds-but-cannot-read` → `/blog/why-child-knows-letter-sounds-but-cannot-read-words`.
- `scripts/blog-intent-clusters.mjs` explicitly records `/blog/why-child-knows-letter-sounds-but-cannot-read-words` as the canonical owner and the shorter URL as a retired historical source.
- The same cluster records search visibility for both URLs and specifically says to protect the existing consolidation.
- `src/lib/resourcesArchitectureRegistry.js` also protects `/blog/why-child-knows-letter-sounds-but-cannot-read-words` as the editorial diagnostic owner.

**Brick 1 decision:** preserve the current owner and existing one-way redirect. Do **not** reverse it.

This is a correction to the provisional ownership map, not a new SEO expansion decision.

---

# 4. Commercial and high-intent URL registry

| URL | Primary intent | Decision | Destination / authority relationship | Brick action |
|---|---|---|---|---|
| `/phonics` | Generic live online phonics classes for kids | **KEEP AS OWNER** | Top commercial authority | Brick 2 strengthen; Brick 8 receive internal authority |
| `/best-online-phonics-classes-for-kids-in-india` | Best/compare online phonics providers and formats | **KEEP AS OWNER** | Commercial comparison owner | Brick 3 protect from blog competition |
| `/phonics-fees-india` | Phonics fees, cost, price and value research | **KEEP AS OWNER** | Phonics fee owner | Brick 3 keep fee intent separate |
| `/pricing` | Cross-programme Tiny Steps pricing/packages | **KEEP AS OWNER** | Supports programme pages | No generic phonics-head targeting |
| `/book-demo` | Free assessment/demo/trial | **KEEP AS OWNER** | Transactional conversion owner | Receive CTAs; do not target provider queries |
| `/reading-classes-for-kids` | Online reading classes / reading tutor | **KEEP AS OWNER** | Reading programme owner | Keep generic reading distinct from phonics |
| `/reading-fluency-program` | Reading-fluency intervention programme | **KEEP AS OWNER** | Specialist programme | Keep only fluency-specific commercial intent |
| `/child-not-reading-properly` | Broad parent reading-difficulty problem | **KEEP AS OWNER** | Problem landing supporting `/phonics` and reading | Keep broad problem role |
| `/slow-reader-child-help` | Slow reader / hesitant fluency problem | **KEEP AS OWNER** | Problem landing supporting fluency/reading | Keep slow-reader role distinct |
| `/resources/phonics` | Phonics/reading resource discovery | **KEEP AS SUPPORTING PAGE** | Discovery hub; never commercial owner | Link to authorities; do not target “phonics classes” |
| `/phonics-apps-for-preschoolers-india` | How to choose/use phonics apps for ages 3–6 | **KEEP AS SUPPORTING PAGE** | Supports practice + `/phonics` | Keep app-research intent only |
| `/phonics-games-for-preschoolers` | No-print preschool sound/blending games | **KEEP AS SUPPORTING PAGE** | Supports practice ecosystem | Keep preschool activity intent only |
| `/phonics-learning-games` | Phonics practice games hub | **KEEP AS OWNER** | Practice owner | Do not compete with `/phonics` for classes |
| `/free-phonics-games-for-kids` | Free phonics-games category | **KEEP AS SUPPORTING PAGE** | Feeds practice hub | Keep “free games” intent |
| `/free-letter-sound-games-for-kids` | Letter-sound game category | **KEEP AS SUPPORTING PAGE** | Feeds practice hub | Keep category intent |
| `/free-letter-tracing-game-for-kids` | ABC/alphabet/letter tracing | **KEEP AS OWNER** | Major tracing traffic owner | Brick 7 protect |
| `/letter-tracing-with-sounds-game` | Tracing letters while hearing sounds | **KEEP AS OWNER** | Distinct multimodal practice intent | Differentiate from plain tracing |
| `/online-phonics-reading-classes` | Legacy early-reading/phonics commercial route | **301 REDIRECT** | → `/phonics` | Preserve current permanent redirect |
| `/phonics-classes-for-kids` | Legacy generic commercial phonics route | **301 REDIRECT** | → `/phonics` | Preserve current permanent redirect |
| `/best-online-phonics-classes-india` | Legacy comparison alias | **301 REDIRECT** | → `/best-online-phonics-classes-for-kids-in-india` | Preserve direct redirect |
| `/free-letter-tracing-with-sounds-game-for-kids` | Legacy tracing-with-sounds alias | **301 REDIRECT** | → `/letter-tracing-with-sounds-game` | Preserve direct redirect |

---

# 5. Commercial-phonics editorial collision registry

These are the pages most capable of interfering with `/phonics` or the comparison owner.

| URL | Current/desired informational job | Decision | Destination / constraint | Reason |
|---|---|---|---|---|
| `/blog/how-to-choose-phonics-classes` | Provider-selection framework | **MERGE** | → `/best-online-phonics-classes-for-kids-in-india` | Current article and commercial comparison page cover substantially the same provider-comparison framework; the dedicated commercial comparison URL must own this intent |
| `/blog/best-online-phonics-classes-for-kids` | Historical “best classes” duplicate | **301 REDIRECT** | Desired final target → `/best-online-phonics-classes-for-kids-in-india` | Currently redirects to `how-to-choose`; when that page is merged, update directly to final owner to avoid a redirect chain |
| `/blog/best-phonics-classes-for-kids` | Historical “best classes” duplicate | **301 REDIRECT** | Desired final target → `/best-online-phonics-classes-for-kids-in-india` | Same direct-target requirement as above |
| `/blog/why-parents-choose-online-phonics` | Why online delivery may fit a family/child | **REPOSITION TO DIFFERENT INTENT** | Support `/phonics`; avoid “best/provider comparison” targeting | Preserve distinct delivery-fit question, not generic class/provider ownership |
| `/blog/online-phonics-classes-vs-school` | School provision vs targeted online support | **KEEP AS SUPPORTING PAGE** | Support `/phonics` | Distinct modality/child-fit decision; must not claim generic “best classes” intent |
| `/blog/how-phonics-classes-help-kids-read` | Instructional mechanism inside effective classes | **REPOSITION TO DIFFERENT INTENT** | Support `/phonics` | Explain how teaching works, not which provider/class to buy |

**Commercial ownership rule:** generic class-seeking queries resolve to `/phonics`; best/compare/provider-selection queries resolve to the comparison page; fee queries resolve to `/phonics-fees-india`.

---

# 6. Parent-problem and diagnostic registry

| URL | Primary intent | Decision | Relationship |
|---|---|---|---|
| `/blog/child-knows-abc-but-cannot-read` | Child knows alphabet/letter names but cannot read | **KEEP AS OWNER** | Earlier diagnostic stage; do not merge with letter-sounds problem |
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | Child knows letter sounds but cannot blend/decode words | **KEEP AS OWNER** | High-value diagnostic owner |
| `/blog/child-knows-letter-sounds-but-cannot-read` | Historical duplicate of letter-sounds diagnostic | **301 REDIRECT** | → `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |
| `/child-not-reading-properly` | Broad “my child is not reading properly” concern | **KEEP AS OWNER** | Broad problem landing; route specific sub-problems to diagnostic owners |
| `/slow-reader-child-help` | Child reads slowly / fluency concern | **KEEP AS OWNER** | Route decoding-secure children toward fluency support |
| `/blog/how-to-improve-reading-fluency-in-children` | How to improve fluency at home | **KEEP AS SUPPORTING PAGE** | Informational support to `/reading-fluency-program` |
| `/blog/phonics-diagnostics` | Parent phonics assessment/checklist | **KEEP AS OWNER** | Assessment-information intent; support `/book-demo` |
| `/blog/how-phonics-builds-reading-confidence` | How phonics success influences reading confidence | **KEEP AS OWNER** | Existing branded duplicate remains retired |

---

# 7. SATPIN registry

| URL | Primary intent | Decision | Relationship |
|---|---|---|---|
| `/blog/satpin-phonics-guide` | SATPIN meaning, sounds, order, method, words, blending, reading and next steps | **KEEP AS OWNER** | Master SATPIN authority hub |
| `/blog/phonics-satpin-launch` | Practical SATPIN home launch routine | **KEEP AS SUPPORTING PAGE** | → SATPIN guide → `/phonics` |
| `/blog/week-1-phonics-satpin-launch` | Legacy weekly source slug | **301 REDIRECT** | Public cleaned destination is `/blog/phonics-satpin-launch` via existing rename system |

**SATPIN rule:** no second generic SATPIN guide. The launch page owns implementation routine only.

---

# 8. Blending / early-decoding registry

| URL | Primary intent | Decision | Relationship |
|---|---|---|---|
| `/blog/how-kids-learn-blending` | Stage-by-stage explanation of how blending develops | **KEEP AS OWNER** | Explainer owner |
| `/blog/phonics-blending-activities` | Specific blending exercises/activities | **KEEP AS OWNER** | Practice owner |
| `/blog/phonics-blending-club` | Short daily at-home blending routine | **KEEP AS SUPPORTING PAGE** | Routine support; link to explainer + diagnostic owner |
| `/blog/cvc-words-explained-for-parents` | What CVC words are and how decoding works | **KEEP AS OWNER** | CVC concept owner |
| `/blog/benefits-of-phonics-for-kids` | General benefits of phonics | **KEEP AS SUPPORTING PAGE** | Authority/support; not commercial owner |
| `/blog/how-phonics-improves-spelling` | Encoding/spelling benefits and process | **KEEP AS OWNER** | Spelling/encoding intent |
| `/blog/phonics-rules-for-beginners` | Introductory phonics rule overview | **KEEP AS OWNER** | Beginner-rules intent |
| `/blog/phonics-multisyllabic` | Reading multisyllabic words | **KEEP AS OWNER** | Advanced decoding intent |
| `/blog/phonics-comprehension` | Transition from decoding to comprehension | **KEEP AS OWNER** | Post-decoding comprehension bridge |

---

# 9. Phonics pattern / practice registry

| URL | Primary intent | Decision | Relationship / constraint |
|---|---|---|---|
| `/blog/long-vowel-sounds-for-kids` | Long-vowel concepts and sound patterns | **KEEP AS OWNER** | Concept owner |
| `/blog/phonics-long-vowels` | Long-vowel practice activities | **KEEP AS SUPPORTING PAGE** | Practice-only; do not compete for generic “long vowel sounds” head intent |
| `/blog/r-controlled-vowels-explained` | R-controlled vowel concepts | **KEEP AS OWNER** | Concept owner |
| `/blog/phonics-r-controlled` | R-controlled vowel practice | **KEEP AS SUPPORTING PAGE** | Practice-only; avoid concept-head targeting |
| `/blog/digraphs-and-tricky-words` | Digraphs plus tricky-word conceptual guide | **KEEP AS OWNER** | Combined concept owner; strengthen digraph emphasis |
| `/blog/phonics-tricky-words` | How to teach/practise tricky words without guessing | **KEEP AS SUPPORTING PAGE** | Practical tricky-word routine; distinguish from combined concept guide |
| `/blog/long-vowel-sounds-for-kids` | Long-vowel educational guide | **KEEP AS OWNER** | Also a GSC CTR-improvement candidate in Brick 10 |

---

# 10. Games / apps / home-practice editorial registry

| URL | Primary intent | Decision | Relationship / constraint |
|---|---|---|---|
| `/blog/are-phonics-apps-enough-for-kids` | Whether apps alone are sufficient | **KEEP AS OWNER** | Decision question; support app page + `/phonics` |
| `/blog/online-phonics-games` | How to judge/use online phonics games | **REPOSITION TO DIFFERENT INTENT** | Digital-game evaluation, not free-game hub ownership |
| `/blog/phonics-games-for-letter-sounds` | Games specifically for letter-sound recall | **KEEP AS OWNER** | Narrow letter-sound practice intent |
| `/blog/phonics-activities-for-kids-at-home` | Offline/general phonics activities at home | **KEEP AS OWNER** | Home-activity intent |
| `/phonics-apps-for-preschoolers-india` | App-selection/use guide for preschoolers | **KEEP AS SUPPORTING PAGE** | Long-tail static guide; do not duplicate blog app-sufficiency question |
| `/phonics-games-for-preschoolers` | Preschool no-print games | **KEEP AS SUPPORTING PAGE** | Long-tail activity landing; do not target generic online games |
| `/phonics-learning-games` | Practice-game hub | **KEEP AS OWNER** | Destination for actual practice discovery |

---

# 11. General phonics knowledge registry

| URL | Primary intent | Decision | Relationship / constraint |
|---|---|---|---|
| `/blog/phonics-for-parents-guide` | Broad parent phonics overview | **KEEP AS OWNER** | Parent education hub; must link down to specific authorities |
| `/blog/what-is-phonics-for-kids` | Basic definition of phonics | **KEEP AS OWNER** | Definition intent |
| `/blog/what-age-to-start-phonics` | Right age/readiness to start phonics | **KEEP AS OWNER** | Existing “best age” duplicate remains retired |
| `/blog/how-long-does-phonics-take` | Expected timeline and progression | **KEEP AS OWNER** | Duration/timeline intent |
| `/blog/synthetic-phonics-vs-traditional-reading` | Synthetic phonics vs traditional reading | **KEEP AS OWNER** | Method-comparison intent |
| `/blog/science-of-phonics-learning` | Evidence / phonics vs sight-word research explanation | **KEEP AS OWNER** | Evidence-oriented intent |
| `/blog/sight-words-or-phonics-first` | Sequencing decision: sight words or phonics first | **KEEP AS OWNER** | Narrow sequencing question |
| `/blog/how-phonics-builds-reading-confidence` | Reading-confidence mechanism | **KEEP AS OWNER** | Keep distinct from programme landing |
| `/blog/how-phonics-classes-help-kids-read` | Teaching mechanism inside classes | **REPOSITION TO DIFFERENT INTENT** | Avoid commercial-class head terms |

---

# 12. Seasonal/supporting phonics pages

| URL | Primary intent | Decision | Relationship |
|---|---|---|---|
| `/blog/phonics-summer-plan` | Summer phonics practice routine | **KEEP AS SUPPORTING PAGE** | Seasonal practice support |
| `/blog/prevent-summer-slide-reading` | Preventing summer reading loss | **KEEP AS OWNER** | Seasonal reading-retention intent |

These pages stay subordinate to evergreen phonics/reading owners and must not become generic phonics landing pages.

---

# 13. Existing redirects that must stay one-way

The following existing consolidations are protected during recovery unless a later brick presents stronger current evidence:

| Source | Destination | Decision |
|---|---|---|
| `/online-phonics-reading-classes` | `/phonics` | Protect 301 |
| `/phonics-classes-for-kids` | `/phonics` | Protect 301 |
| `/best-online-phonics-classes-india` | `/best-online-phonics-classes-for-kids-in-india` | Protect 301 |
| `/blog/child-knows-letter-sounds-but-cannot-read` | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | Protect 301 |
| `/blog/best-age-to-start-phonics-classes-for-kids` | `/blog/what-age-to-start-phonics` | Protect consolidation |
| `/blog/how-tiny-steps-builds-reading-confidence` | `/blog/how-phonics-builds-reading-confidence` | Protect consolidation |
| `/free-letter-tracing-with-sounds-game-for-kids` | `/letter-tracing-with-sounds-game` | Protect 301 |

Do not resurrect retired URLs merely because historical GSC impressions exist. Redirect equity and current canonical architecture take priority unless post-change measurement demonstrates a clear failure.

---

# 14. Planned merge/redirect work generated by Brick 1

Brick 1 identifies the following future implementation work. **No production redirect/content change is made in this brick.**

## A. Commercial comparison consolidation — execute in Bricks 3–4

1. Merge useful unique material from `/blog/how-to-choose-phonics-classes` into `/best-online-phonics-classes-for-kids-in-india`.
2. 301 `/blog/how-to-choose-phonics-classes` → `/best-online-phonics-classes-for-kids-in-india`.
3. Update historical redirect sources so they point directly to the final comparison owner:
   - `/blog/best-online-phonics-classes-for-kids`
   - `/blog/best-phonics-classes-for-kids`
4. Remove internal links that point to the soon-retired intermediate blog.
5. Ensure no redirect chain remains.

## B. Commercial-support repositioning — execute in Bricks 3 and 9

Narrow these pages so they stop competing with commercial head terms:

- `/blog/why-parents-choose-online-phonics` → delivery-fit/online-suitability intent.
- `/blog/how-phonics-classes-help-kids-read` → teaching-mechanism intent.
- `/blog/online-phonics-games` → digital-game evaluation/use intent.

## C. Pattern-practice differentiation — execute in Bricks 8–10

- Keep `/blog/long-vowel-sounds-for-kids` as concept owner; make `/blog/phonics-long-vowels` practice-only.
- Keep `/blog/r-controlled-vowels-explained` as concept owner; make `/blog/phonics-r-controlled` practice-only.
- Keep `/blog/digraphs-and-tricky-words` as concept owner; make `/blog/phonics-tricky-words` practical teaching/routine content.

---

# 15. Protected “do not merge” pairs

Brick 1 explicitly rejects these tempting but incorrect blanket merges:

| Pages | Why they stay separate |
|---|---|
| `child-knows-abc-but-cannot-read` vs `why-child-knows-letter-sounds-but-cannot-read-words` | Different diagnostic stage: letter-name/alphabet knowledge vs sound knowledge already present but blending failing |
| `satpin-phonics-guide` vs `phonics-satpin-launch` | Master explanation vs practical home routine |
| `how-kids-learn-blending` vs `phonics-blending-activities` vs `phonics-blending-club` | Developmental explanation vs activity library vs short daily routine |
| `long-vowel-sounds-for-kids` vs `phonics-long-vowels` | Concept/explanation vs practice |
| `r-controlled-vowels-explained` vs `phonics-r-controlled` | Concept/explanation vs practice |
| `free-letter-tracing-game-for-kids` vs `letter-tracing-with-sounds-game` | Plain alphabet tracing vs tracing explicitly integrated with phoneme audio |
| `/phonics` vs `/reading-classes-for-kids` | Generic phonics programme vs broader reading-support class intent |
| `/reading-classes-for-kids` vs `/reading-fluency-program` | Broad reading support vs decoding-secure fluency intervention |

---

# 16. Query-owner consistency targets for later measurement

| Query family | Expected Tiny Steps owner |
|---|---|
| phonics classes / online phonics classes / phonics classes online | `/phonics` |
| online phonics classes for kids | `/phonics` |
| best phonics classes online / best online phonics classes India | `/best-online-phonics-classes-for-kids-in-india` |
| phonics classes fees / phonics course cost | `/phonics-fees-india` |
| SATPIN / SATPIN phonics / SATPIN method / SATPIN order | `/blog/satpin-phonics-guide` |
| child knows ABC but cannot read | `/blog/child-knows-abc-but-cannot-read` |
| child knows letter sounds but cannot read / cannot blend | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |
| ABC tracing / alphabet tracing / letter tracing | `/free-letter-tracing-game-for-kids` |
| letter tracing with sounds | `/letter-tracing-with-sounds-game` |
| how kids learn blending | `/blog/how-kids-learn-blending` |
| phonics blending activities | `/blog/phonics-blending-activities` |
| long vowel sounds | `/blog/long-vowel-sounds-for-kids` |
| r-controlled vowels | `/blog/r-controlled-vowels-explained` |

---

# 17. Brick 1 acceptance checklist

- [x] Generic commercial phonics has one owner: `/phonics`.
- [x] Best/compare/provider-selection intent has one owner: `/best-online-phonics-classes-for-kids-in-india`.
- [x] Phonics fee intent has one owner: `/phonics-fees-india`.
- [x] SATPIN has one master informational owner.
- [x] Parent ABC-vs-letter-sounds diagnostic stages are separated.
- [x] Existing letter-sounds consolidation is protected instead of reversed.
- [x] Tracing and tracing-with-sounds are differentiated.
- [x] Blending explainer, activities and routine are differentiated.
- [x] Long-vowel and R-controlled concept/practice pairs are differentiated.
- [x] Commercially overlapping `how-to-choose-phonics-classes` is assigned for merge into the comparison owner.
- [x] Historical “best phonics” blog aliases are assigned to direct final redirects after consolidation.
- [x] Existing important one-way redirects are protected.
- [x] No new indexable SEO URL is proposed.
- [x] No production page behavior was changed in Brick 1.

---

# 18. Brick 1 decision

**BRICK 1 — CLOSED.**

The URL ownership model is now fixed for recovery execution. Production changes begin with **Brick 2 — strengthen `/phonics` as the uncontested generic commercial phonics owner**, followed by Brick 3 commercial cannibalisation cleanup and Brick 4 physical merges/redirects.

If a later brick discovers evidence strong enough to change an ownership decision, the change must be explicitly documented in the recovery progress log before implementation.
