# Tiny Steps SEO Recovery — Brick 6: SATPIN Authority

**Date:** 2026-09-12  
**Status:** ✅ CLOSED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Brick 6 strengthens the existing SATPIN authority structure without creating another SATPIN URL.

Master authority:

`/blog/satpin-phonics-guide`

Supporting implementation page:

`/blog/phonics-satpin-launch`

Commercial pathway:

`/phonics`

The recovery requirement is:

```text
SATPIN home routine
      ↓
SATPIN master guide
      ↓
/phonics
```

The two SATPIN articles remain separate because they serve different user jobs.

---

## Audit Result

The existing master guide was already unusually strong. It already covered:

- what SATPIN means;
- why a small starter set can be useful;
- blending before all six sounds are perfectly mastered;
- letter names versus sounds;
- blendable pronunciation;
- early blending and spelling;
- fresh-word transfer;
- progress signals;
- common difficulties;
- when to move beyond the starter set;
- evidence and references;
- the distinction between the guide and the home routine.

The main weakness was **search framing rather than content depth**. Important query concepts such as `SATPIN order`, `SATPIN words`, `SATPIN sentences`, `SATPIN reading` and `what comes after SATPIN` were present conceptually but were not all explicit authority headings/snippet signals.

Brick 6 therefore uses a controlled strengthening pass rather than replacing the article.

---

## Master Guide Changes

Updated:

`src/content/blog/posts/phonics/satpin-phonics-guide.ts`

### Search-facing title

Changed from:

`SATPIN Phonics Guide for Parents: How to Start and What to Expect`

To:

`SATPIN Phonics: Sounds, Order, Words & Blending Guide`

The new title better reflects the actual query family served by the page without creating a second page for those variants.

### Meta / excerpt

The snippet now explicitly covers:

- SATPIN sounds;
- SATPIN order;
- SATPIN words;
- blending;
- early sentences / reading;
- what comes after SATPIN.

### Explicit authority sections added

The guide now contains dedicated sections for:

- `SATPIN order: why you may see SATPIN, SATIPN or a slightly different sequence`
- `SATPIN words: what can children read with the first set?`
- `SATPIN sentences and early reading: when to move beyond single words`
- `What comes after SATPIN?`

These sections consolidate related search intent into the existing authority rather than generating additional SEO URLs.

### FAQ expansion

Query-shaped FAQs now explicitly cover:

- what SATPIN is;
- SATPIN order;
- SATPIN words;
- why the set is often introduced early;
- whether all six sounds are required before blending;
- how SATPIN words transfer into early reading;
- what comes after SATPIN;
- readiness to move on;
- what to do when sounds are known but blending fails.

---

## Editorial Cleanup

Internal editorial numbering such as `Blog #17`, `Blog #16`, `Blog #5`, etc. was removed from parent-facing copy.

The linked supporting resources remain, but parents now see the topic and link directly rather than internal content-production labels.

The guide continues to state evidence boundaries clearly:

- SATPIN is a useful starter set, not a mandatory universal first sequence;
- the evidence supports systematic and explicit phonics, not a fixed SATPIN duration;
- there is no universal mastery percentage or fixed number of days;
- difficulty with SATPIN is not itself a diagnosis.

---

## SATPIN Order Boundary

The article now answers `SATPIN order` carefully.

It explains that SATPIN names the letters `s, a, t, p, i, n`, while some coherent phonics programmes may teach those letters in a slightly different internal sequence such as `s, a, t, i, p, n`.

The quality principle remains:

- coherent cumulative sequence;
- accurate sound modelling;
- review of previously taught correspondences;
- blending as soon as the taught set permits it.

The page does **not** make an unsupported claim that the acronym order is scientifically mandatory.

---

## SATPIN Words and Reading Boundary

The guide now explicitly owns the conceptual questions:

- which early words can be built from taught SATPIN correspondences;
- why a word bank should not become a memorisation list;
- how fresh-word decoding checks transfer;
- when to move from single words to short matched sentences;
- how early SATPIN reading should preserve left-to-right decoding.

The broader CVC milestone remains owned by:

`/blog/cvc-words-explained-for-parents`

The full developmental blending path remains owned by:

`/blog/how-kids-learn-blending`

Practical blending activities remain owned by:

`/blog/phonics-blending-activities`

The letter-sounds-known-but-reading-fails diagnostic remains owned by:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

This prevents the stronger SATPIN hub from swallowing neighbouring intents.

---

## Home Routine Remains Separate

Source article:

`src/content/blog/posts/phonics/week-1-phonics-satpin-launch.ts`

Public identity:

`/blog/phonics-satpin-launch`

The repository's legacy-week rename registry maps:

`week-1-phonics-satpin-launch` → `phonics-satpin-launch`

The home article is deliberately preserved because it serves a distinct implementation job. Its current framing is already clear:

- `SATPIN at Home` title;
- practical home-plan meta description;
- seven flexible sessions;
- short practice routine;
- word bank;
- games;
- readiness checkpoints;
- troubleshooting.

It explicitly links back to `/blog/satpin-phonics-guide` for the broader SATPIN explanation.

No merge was performed.

---

## Commercial Handoff

The master guide now ends with an appropriate next-step pathway:

- `/phonics` — structured Tiny Steps phonics programme;
- `/book-demo` — free 35-minute 1:1 demo assessment.

The handoff appears only after substantial educational guidance and remains assessment-led rather than hard sales.

---

## Regression Protection

Added:

`src/tests/seo/recoveryBrick6SatpinAuthority.spec.ts`

The guard protects:

- the SATPIN master-guide title and query family;
- explicit order / words / reading / next-step sections;
- evidence and diagnosis boundaries;
- removal of internal `Blog #` numbering;
- home-routine differentiation;
- support-page → master-guide linking;
- the public `phonics-satpin-launch` identity;
- both SATPIN authority URLs in the phonics authority registry;
- links to blending, CVC, diagnostic, `/phonics` and `/book-demo` pathways;
- FAQ coverage for the priority SATPIN query family.

---

## Definition of Done

- [x] No new SATPIN URL created.
- [x] `/blog/satpin-phonics-guide` remains the master SATPIN authority.
- [x] Search title/meta now represent sounds, order, words and blending.
- [x] SATPIN order has a dedicated section.
- [x] SATPIN words have a dedicated section.
- [x] SATPIN sentences / early reading have a dedicated section.
- [x] `What comes after SATPIN?` has a dedicated section.
- [x] FAQ coverage expanded around the same authority page.
- [x] Unsupported claims about a mandatory order or fixed duration avoided.
- [x] Internal editorial numbering removed from parent-facing copy.
- [x] `/blog/phonics-satpin-launch` remains a distinct home-practice article.
- [x] Supporting article continues to link to the master guide.
- [x] Master guide links to the correct diagnostic and blending support pages.
- [x] Master guide hands authority toward `/phonics` and `/book-demo` appropriately.
- [x] Regression protection added.

**Brick 6 decision:** CLOSED.
