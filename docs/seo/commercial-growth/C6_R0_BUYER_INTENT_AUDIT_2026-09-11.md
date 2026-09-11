# C6-R0 — Buyer / Comparison / Fees Intent Audit

**Date:** 11 September 2026  
**Status:** audit complete on branch; no live commercial page changes in R0  
**Branch:** `seo/c6-r0-buyer-intent-audit`

## Mission

Audit the existing Tiny Steps buyer-decision coverage before C6 changes any commercial page.

C6-R0 answers four questions:

1. Which existing URL owns comparison intent?
2. Which existing URL owns fee/value intent?
3. Where do non-phonics buyer queries currently resolve under frozen C2 ownership?
4. Which gaps deserve evidence collection in C6-R1 rather than a new page now?

This brick is deliberately **audit-only**.

---

## Frozen constraints carried into C6

C6-R0 does **not** change:

- commercial titles
- meta descriptions
- canonicals
- C2 keyword ownership
- C4 control snippets
- C5 conversion ownership
- live owner-page body copy
- commercial URLs

`/book-demo` remains the single assessment conversion owner.

---

# Current buyer-intent architecture

## 1. Phonics comparison owner

**Owner:** `/best-online-phonics-classes-for-kids-in-india`

This is the only dedicated C2 `comparison` owner.

The current page already contains substantial parent decision support:

- child-fit decision gates
- live 1:1 vs small-group vs self-practice comparison
- provider scorecard
- questions parents can ask during a demo
- red flags
- Tiny Steps evidence links
- parent-review handoff
- phonics-fee handoff
- direct free-assessment path

### R0 judgment

**KEEP as the dedicated comparison owner.**

Do not clone this template into separate “best grammar”, “best speaking”, “best reading”, or similar pages without evidence that the query family is distinct enough to deserve separate ownership.

---

## 2. Phonics fee-research owner

**Owner:** `/phonics-fees-india`

This is the only dedicated C2 `price-research` owner.

The page currently provides:

- researched live 1:1 fee bands
- researched live-group fee bands
- separate treatment of 1:1 and group economics
- effective per-live-class comparison
- Tiny Steps standard 1:1 price and package context
- small-group context
- parent comparison checklist
- free 35-minute assessment path
- research-method explanation
- handoff to the main pricing hub

### R0 judgment

**KEEP as the subject-specific phonics fee owner.**

Its research layer makes it materially different from a thin fee landing page.

---

## 3. Cross-programme pricing and value owner

**Owner:** `/pricing`

C2 assigns cross-programme fees, package, price, value and 1:1-vs-group cost intent here, except phonics-specific fee research.

The current page already covers:

- standard 1:1 per-class pricing
- 12 / 16 / 24-class package totals
- small-group pricing
- class-duration context
- standard vs native-English-speaking-teacher options
- 1:1 vs group value framing
- free assessment before package choice
- phonics-fee research handoff
- structured offer schema

### R0 judgment

**KEEP `/pricing` as the canonical non-phonics fee/value hub.**

Do not create grammar-fees, speaking-fees, writing-fees, reading-fees, or spoken-English-fees URLs by default.

---

# Buyer-intent evidence inventory

C6-R0 combines three already-built C1 evidence sources:

1. base commercial keyword research
2. international market query research
3. AI-style parent decision prompts

Only parent stages `comparison`, `price`, and `enrolment` are included in the R0 buyer-intent inventory.

Every row is resolved through the existing C2 ownership engine. C6-R0 does not reassign ownership.

---

# Main findings

## Finding A — Phonics is uniquely mature at the bottom of the funnel

Phonics currently has both:

- a dedicated comparison owner, and
- a dedicated fee-research owner.

That is justified by the existing research/evidence architecture and should not be treated as a template that every subject must copy.

---

## Finding B — non-phonics fee intent is already intentionally consolidated

C1 contains fee-oriented research for reading, grammar, writing, spoken English and public speaking.

C2 deliberately resolves non-phonics price intent to `/pricing`.

Some subject-fee phrases have observed SERP evidence; others remain hypotheses. That is enough to justify **subject-aware navigation/value explanation**, but not enough to justify separate fee URLs at R0.

---

## Finding C — non-phonics comparison intent exists, but evidence is uneven

AI-style research contains comparison questions for areas including:

- public speaking
- online English tutor selection
- grammar/writing
- broad English / 1:1 vs group
- NRI value comparison

This is useful buyer-language evidence, but it is not the same as measured search demand.

### R0 judgment

**Do not create new comparison URLs yet.**

C6-R1 should validate query demand and SERP shape first.

---

## Finding D — enrolment-stage decision support is a real later opportunity

C1 includes parent questions such as:

- what to check after a demo before paying
- whether phonics or general English is the right enrolment choice after assessment
- what outcomes/class structure to confirm before enrolling in public speaking

C2 appropriately keeps these with existing programme owners rather than creating another transaction page.

### R0 judgment

C6-R3 can later strengthen post-demo decision support and objections **without creating a second conversion owner**.

---

## Finding E — budget objection data must remain labelled correctly

C1 contains a declared operating prior that approximately 20% of leads may drop because the standard ₹400/class price is outside budget.

That figure is **not systematically measured funnel performance**.

C6 may use it to prioritise objection research, but must not publish or treat it as audited conversion data until C0/C5 measurement supports it.

---

# C6-R0 gaps registered

### Research gap

Non-phonics comparison intent needs real search-demand and SERP validation before page architecture changes.

### CRO/value opportunity

`/pricing` can later provide stronger subject-aware value routes while staying the single cross-programme price owner.

### Enrolment opportunity

Programme owners can later answer post-demo “should I enrol?” questions more explicitly while `/book-demo` stays the conversion owner.

### Architecture guardrail

No mass production of `best-*`, `*-fees`, `comparison-*`, city, country or AI-prompt pages.

---

# C6-R1 recommendation

The next brick should be **evidence validation and comparison architecture**, not page creation.

C6-R1 should:

1. isolate comparison/best/review/value query families from the existing C1/C2 corpus;
2. separate observed search evidence from AI-style research prompts;
3. check which subjects have enough distinct demand to warrant stronger comparison treatment;
4. confirm whether that treatment belongs inside the existing programme owner or merits a dedicated owner;
5. preserve `/pricing` for general/non-phonics fees unless evidence clearly overturns the current C2 decision;
6. make no C4-controlled metadata changes while the C4 observation window is active.

---

# R0 conclusion

The current buyer-intent architecture is fundamentally sound:

- **Comparison:** `/best-online-phonics-classes-for-kids-in-india`
- **Phonics fee research:** `/phonics-fees-india`
- **General fees/value:** `/pricing`
- **Conversion:** `/book-demo`

The biggest C6 opportunity is **better evidence-led decision support inside the existing ownership system**, not more URLs.
