# Tiny Steps SEO Recovery — Brick 5: Parent-Problem Authority

**Date:** 2026-09-12  
**Status:** ✅ CLOSED  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

---

## Objective

Strengthen the canonical parent diagnostic page for the high-intent problem:

> child knows letter sounds / phonics sounds but cannot blend or read words

Canonical owner:

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Historical source preserved as a one-way permanent redirect:

`/blog/child-knows-letter-sounds-but-cannot-read`

→ **301** →

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

Brick 5 does **not** reverse this consolidation and creates no new SEO URL.

---

## Audit Conclusion

The page was already a strong, evidence-led authority article. It already contained:

- exact parent-problem title alignment;
- oral-blending vs printed-blending distinction;
- left-to-right decoding guidance;
- fresh-word transfer;
- connected-text transfer;
- parent practice guidance;
- progress indicators;
- professional-review boundary;
- evidence references;
- links to adjacent diagnostic and support pages;
- `/phonics` and `/book-demo` next-step pathways.

Brick 5 therefore used a **targeted strengthening pass**, not a broad rewrite.

---

## Changes Implemented

### 1. Search-intent language strengthened naturally

The title remains unchanged:

`Why Does My Child Know Letter Sounds But Cannot Read Words?`

The meta description now explicitly includes:

- `cannot blend`
- `read words`
- sound recall
- oral blending
- CVC decoding
- fresh-word transfer

The excerpt also now covers the natural parent wording:

- knows phonics sounds
- cannot blend
- cannot read fresh words

No keyword-variation page was created.

### 2. Internal SEO/editorial language removed

Removed user-facing phrases such as:

- `Blog 50 is the diagnostic owner`
- `For Blog 50`

The replacement section is parent-facing:

`Is this the right guide for your child?`

This keeps repository ownership logic out of the user experience.

### 3. Diagnostic framework expanded from five stages to six

Final protected sequence:

> **Sound recall → Oral blend → Printed blend → CVC decoding → Fresh-word transfer → Connected-text transfer**

This makes the CVC bottleneck explicit rather than leaving it implicit inside printed blending.

### 4. Dedicated CVC decoding stage added

The page now explicitly checks whether a child who knows the sounds can complete the entire decoding sequence on simple, already-taught CVC words.

It also links to:

`/blog/cvc-words-explained-for-parents`

for the broader CVC progression while retaining this page as the diagnostic owner for the sounds-known-but-words-fail problem.

### 5. Adjacent intents remain separated

The page explicitly routes parents according to the actual bottleneck:

- alphabet/letter-name problem → `/blog/child-knows-abc-but-cannot-read`
- blending development → `/blog/how-kids-learn-blending`
- blending activities → `/blog/phonics-blending-activities`
- CVC explanation → `/blog/cvc-words-explained-for-parents`
- fluency problem → `/blog/how-to-improve-reading-fluency-in-children`
- comprehension problem → `/blog/why-child-reads-words-but-does-not-understand-story`

This prevents the diagnostic page from absorbing every reading problem.

### 6. Home-practice flow strengthened

The practical routine now follows:

- sound recall
- oral blend
- printed blend
- CVC word
- fresh word
- sentence
- encoding

The routine remains flexible and avoids unsupported fixed-minute or fixed-word-count claims.

### 7. Structured-support handoff clarified

A new section explains when structured phonics support is worth considering:

- required sounds are already known;
- repeated prompting is still needed;
- simple matched CVC words are not decoded reliably;
- transfer to a fresh word remains weak.

The next step is framed diagnostically:

> identify **where the sequence breaks** and start there.

The page links naturally to:

- `/phonics`
- `/book-demo`

The assessment remains a next-step option, not a hard-sales interruption.

### 8. FAQ coverage strengthened

The FAQ now directly covers parent-language variants including:

- why letter sounds do not become words;
- child knows phonics sounds but cannot blend;
- child can say `s`, `a`, `t` but cannot read `sat`;
- whether more sounds should be taught;
- decoding vs memorising;
- picture guessing;
- when to seek additional help.

---

## Canonical / Redirect Protection

The existing redirect lineage remains unchanged:

```text
/blog/child-knows-letter-sounds-but-cannot-read
    └── 301 → /blog/why-child-knows-letter-sounds-but-cannot-read-words
```

The canonical destination is not redirected back to the historical source.

No new diagnostic URL was created.

---

## Regression Protection

Added:

`src/tests/seo/recoveryBrick5ParentProblemAuthority.spec.ts`

The guard protects:

- one-way historical redirect lineage;
- exact high-intent page title;
- query-aligned snippet language;
- removal of `Blog 50` user-facing copy;
- the complete six-stage decoding sequence;
- CVC decoding coverage;
- separation from ABC, blending, fluency and comprehension intents;
- educational home-practice flow;
- `/phonics` and `/book-demo` next-step handoffs;
- non-diagnostic safety boundary;
- parent-language FAQ coverage.

---

## Implementation Commits

- `d4fcc3011d236d44a4b69a2fed64a224bbb7c818` — strengthen canonical parent decoding authority
- `139febd25ef6b7176e768ba3ffbb314f760bc6b9` — add Brick 5 regression guard

---

## Definition of Done

- [x] Existing canonical owner preserved.
- [x] Historical redirect preserved and not reversed.
- [x] No new SEO URL created.
- [x] Search-intent wording improved naturally.
- [x] Internal repository/editorial numbering removed from user-facing content.
- [x] Sound recall separated from oral blending.
- [x] Oral blending separated from printed blending.
- [x] CVC decoding explicitly added.
- [x] Fresh-word transfer protected.
- [x] Connected-text transfer protected.
- [x] Home-practice sequence improved.
- [x] Adjacent reading intents remain differentiated.
- [x] Structured-support handoff remains assessment-led rather than hard sales.
- [x] FAQ coverage strengthened.
- [x] Regression protection committed.

**Brick 5 decision:** CLOSED.

---

## Next Brick

**Brick 6 — Establish SATPIN as the master authority hub.**

The next canonical focus is:

`/blog/satpin-phonics-guide`

Brick 6 should strengthen the existing SATPIN owner rather than create another SATPIN page, while keeping `/blog/phonics-satpin-launch` differentiated as the practical home-routine support article.
