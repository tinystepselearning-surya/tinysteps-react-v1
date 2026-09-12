# Tiny Steps SEO Recovery — Brick 12 Authority Signals

**Date:** 2026-09-12  
**Status:** CLOSED — surviving owners reinforced through a tiered hub-and-support graph  
**Master reference:** `docs/TINY_STEPS_SEO_RECOVERY_MASTER_PLAN_2026-09-12.md`

## Objective

Re-establish authority around the surviving recovery URLs after consolidation, without creating new SEO pages or flattening every supporting article into a direct commercial CTA.

Brick 12 reinforces the hierarchy already chosen in Bricks 1–11:

| Tier | Role | Recovery owners |
|---|---|---|
| A | Main commercial authority | `/phonics` |
| B | Narrow buyer-decision authorities | `/best-online-phonics-classes-for-kids-in-india`, `/phonics-fees-india` |
| C | Strong informational/free-resource authorities | `/blog/satpin-phonics-guide`, `/blog/why-child-knows-letter-sounds-but-cannot-read-words`, `/free-letter-tracing-game-for-kids` |
| D | Supporting content | Existing narrower articles and practice pages |

The intended model is therefore:

```text
Tier D support
   ↓
Tier B/C specialist owner
   ↓
Tier A /phonics
   ↓
assessment only when the existing conversion architecture says it is appropriate
```

## Audit finding

The repository already had substantial authority infrastructure:

- commercial owners and buyer-intent boundaries were frozen in C2/C7;
- the phonics blog authority layer already routes many articles toward the relevant programme owner;
- the SATPIN master, decoding diagnostic and tracing page already carry upward links;
- Brick 8 already normalized retired internal URLs;
- Brick 11 consolidated the canonical/redirect/discovery layer.

The remaining recovery need was not another blanket internal-link system. It was to add a small number of missing **supporting article → specialist authority** edges so strong specialist pages collect more relevant internal support.

## Implementation

### 1. Brick 12 hierarchy registry

`src/config/seoRecoveryBrick12AuthoritySignals.ts`

The registry explicitly locks:

- one Tier A owner;
- two Tier B owners;
- three Tier C owners;
- the required owner-to-owner edges;
- a targeted set of supporting-blog reinforcement rules.

This makes the recovery hierarchy machine-readable and regression-testable without changing canonical ownership.

### 2. Targeted Tier D → Tier B/C reinforcement

Brick 12 adds or protects specialist signals for these cases:

- SATPIN home routine → SATPIN master;
- blending explainer → letter-sounds-known diagnostic;
- blending activities → letter-sounds-known diagnostic;
- daily blending routine → letter-sounds-known diagnostic;
- CVC explainer → letter-sounds-known diagnostic;
- phonics diagnostic/checklist → letter-sounds-known diagnostic;
- letter-sounds research explainer → letter-sounds-known diagnostic;
- online-vs-school decision support → comparison owner;
- why-online support → comparison owner;
- apps-vs-teacher decision support → comparison owner.

The layer adds a signal only when that destination is missing. Existing links are not duplicated.

### 3. Commercial architecture remains authoritative

`src/content/blog/shared/recoveryAuthoritySignals.ts`

Brick 12 deliberately does **not** add `/phonics`, `/phonics-fees-india`, `/pricing` or `/book-demo` to supporting articles. Those commercial handoffs remain governed by the existing C7 owner/next-step architecture.

This prevents Brick 12 from violating earlier rules such as:

- comparison intent must go through the comparison owner;
- assessment should not be forced onto early practice content;
- one article should not accumulate unnecessary commercial prompts.

### 4. Pipeline order protects earlier recovery decisions

`src/content/blog/index.ts`

The relevant order is now:

```text
editorial cleanup
→ legacy public-slug normalization
→ title/CTR controls
→ C7 commercial handoffs
→ Brick 12 specialist authority reinforcement
→ audience/discovery metadata
```

Therefore Brick 12 can strengthen a specialist hub without becoming a second commercial-routing layer.

### 5. Dedicated broad parent guide preserved

`/blog/phonics-for-parents-guide` has its own dedicated React route and rendering contract. Brick 12 does not layer the normalized-blog post processor onto that page.

Its existing source already links to the letter-sounds diagnostic and `/phonics`, while the SATPIN master already links back to the broader parent guide. That existing relationship is preserved rather than rewritten simply to make the graph symmetrical.

### 6. Existing owner edges protected

The Brick 12 regression contract verifies the existing source relationships:

- `/phonics` → comparison + fees;
- comparison → `/phonics` + fees;
- fees → `/phonics`;
- SATPIN master → `/phonics`;
- decoding diagnostic → `/phonics`;
- tracing → SATPIN master + `/phonics`.

This creates the intended layered graph rather than a collection of isolated pages.

### 7. Regression protection

`src/tests/seo/recoveryBrick12AuthoritySignals.spec.ts`

The regression guard verifies:

- exactly one Tier A, two Tier B and three Tier C recovery owners;
- required owner-to-owner edges remain present;
- SATPIN support feeds the SATPIN master;
- blending/decoding support feeds the diagnostic owner;
- provider-decision support feeds the comparison owner;
- the dedicated broad parent-guide rendering boundary remains intact;
- C7 commercial routing runs before Brick 12 reinforcement;
- Brick 12 rules do not introduce programme, fee, pricing or assessment CTAs;
- reinforcement remains targeted rather than being applied to every phonics article.

## Scope deliberately not changed

Brick 12 does not:

- create a new page;
- change a canonical owner;
- change a URL;
- merge or redirect another page;
- retitle Brick 10 CTR experiments;
- add blanket sitewide exact-match links;
- bypass the comparison or fee owners;
- force assessment CTAs onto practice content.

## Key implementation commits

- `6951261cefadb7274482b66389e1d000b9e6621a` — initial Brick 12 hierarchy registry
- `907077b2c40b7553f92cde10de0867598da8a576` — specialist authority-signal applicator
- `80e7746d06aecccdb578f6d1cd46c8992b1a4348` — wire Brick 12 after C7 commercial handoffs
- `98183dce20120243899f0a7de708a704a9d6d2b2` — tiered regression contract before final specialist-only tightening
- `41ca9291fb1c88b326569a054d9c729c2be1a806` — keep Brick 12 specialist signals non-commercial
- `98183dce20120243899f0a7de708a704a9d6d2b2` / subsequent test update — authority regression refinement

## Definition of done

Brick 12 is closed because the surviving recovery owners now have an explicit, protected hierarchy and narrower support content reinforces the relevant specialist authority before commercial escalation.

The architecture is intentionally layered:

```text
support content
→ specialist informational/comparison authority
→ /phonics
→ assessment when appropriate
```

No new SEO page was created and no recovery owner was changed.

**Brick 12: CLOSED.**

Next recovery stage: **Brick 13 — Build the GSC Measurement Framework.**
