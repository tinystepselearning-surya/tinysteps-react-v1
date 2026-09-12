# Tiny Steps SEO Recovery — Brick 8 Internal-Link Architecture

**Date:** 2026-09-12  
**Status:** ✅ CLOSED — authority flow rebuilt and retired blog-link hops normalized

## Objective

Rebuild internal linking around the authority owners locked in Bricks 1–7 without creating new SEO pages or changing established URLs.

The target flow is:

> **Free resources → informational authority → problem-solving content → commercial programme → assessment**

Brick 8 focuses on **where internal links point**. Redirect/canonical/sitemap cleanup remains the job of Brick 11.

---

## 1. Authority destinations are now code-controlled

Added:

`src/config/seoRecoveryBrick8InternalLinks.ts`

The registry protects the recovery destinations for:

- generic phonics programme → `/phonics`
- comparison/provider-selection → `/best-online-phonics-classes-for-kids-in-india`
- phonics fees → `/phonics-fees-india`
- assessment → `/book-demo`
- SATPIN master → `/blog/satpin-phonics-guide`
- SATPIN home routine → `/blog/phonics-satpin-launch`
- parent decoding diagnostic → `/blog/why-child-knows-letter-sounds-but-cannot-read-words`
- generic tracing → `/free-letter-tracing-game-for-kids`
- tracing with sounds → `/letter-tracing-with-sounds-game`
- blending/word-building practice → `/free-word-building-game-for-kids`

The same registry contains the recovery-specific retired-path map and a normalizer that preserves query strings and fragments while changing the path to the final owner.

---

## 2. Retired blog links are normalized before rendering

Updated:

`src/content/blog/shared/editorialCleanup.ts`

All blog body content passes through the editorial cleanup pipeline before it is exposed through the normalized blog collection. Brick 8 now converts these historical internal targets directly to the current authority owner:

| Retired internal target | Direct authority target |
|---|---|
| `/blog/child-knows-letter-sounds-but-cannot-read` | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` |
| `/blog/how-to-choose-phonics-classes` | `/best-online-phonics-classes-for-kids-in-india` |
| `/blog/best-online-phonics-classes-for-kids` | `/best-online-phonics-classes-for-kids-in-india` |
| `/blog/best-phonics-classes-for-kids` | `/best-online-phonics-classes-for-kids-in-india` |

This was deliberately implemented in the shared editorial-normalization layer rather than manually editing many historical blog source files. It gives one canonical rule and protects future rendering from reintroducing the same redirect hops.

The existing weekly-blog rename layer remains responsible for historical `week-*` public-path renames such as SATPIN. Brick 8 does not duplicate that mechanism.

---

## 3. Commercial phonics cluster navigation now points to the comparison owner

Updated:

`src/components/programs/ClusterSeoNav.tsx`

Changed the old navigation destination:

`How to Choose a Phonics Class → /blog/how-to-choose-phonics-classes`

into:

`Compare Online Phonics Classes → /best-online-phonics-classes-for-kids-in-india`

The cluster component now also removes links to the **current page**, including the hub link when the hub itself is the current route. This prevents avoidable self-links while keeping the cluster useful from other phonics pages.

---

## 4. Existing support → owner pathways verified

Brick 8 verified the authority flow already established in Bricks 5–7:

### SATPIN

`/blog/phonics-satpin-launch`

→ `/blog/satpin-phonics-guide`

→ `/phonics`

### Parent decoding problem

`/blog/why-child-knows-letter-sounds-but-cannot-read-words`

→ `/phonics`

→ `/book-demo` when an assessment is appropriate

### Tracing

`/free-letter-tracing-game-for-kids`

→ `/letter-tracing-with-sounds-game`

→ `/blog/satpin-phonics-guide`

→ `/free-word-building-game-for-kids`

→ `/phonics`

The tracing-with-sounds page also points directly to the parent diagnostic when the problem has progressed beyond letter formation/sound association into blending or decoding.

---

## 5. Descriptive anchor principle

Brick 8 protects descriptive link labels around the important owners. Examples include:

- `Compare Online Phonics Classes`
- `Explore Tiny Steps phonics classes`
- `SATPIN phonics guide`
- `Free ABC Tracing Game for Kids`
- diagnostic wording describing sounds-known-but-words-not-readable

Generic `click here` style anchors are not introduced for recovery authority links.

---

## 6. Regression protection

Added:

`src/tests/seo/recoveryBrick8InternalLinkArchitecture.spec.ts`

The guard verifies:

- locked authority destinations;
- retired-path normalization;
- query/fragment preservation;
- Markdown/blog-link normalization;
- **all normalized blog body content** is free of the Brick 8 retired URL set;
- phonics cluster navigation targets the comparison owner;
- cluster navigation avoids current-page self-links;
- SATPIN, diagnostic and tracing pages preserve the intended support-to-owner paths.

---

## 7. Deliberately deferred source-level cleanup

Brick 8 separates **rendered internal-link architecture** from later technical/historical cleanup.

A small number of raw source/config/history references may still contain a retired slug, including:

- legacy redirect maps — these must remain because they serve 301s;
- historical SEO/audit documentation — evidence only;
- generated discovery/sitemap artifacts awaiting their normal regeneration;
- dormant metadata/CTA records for retired content;
- isolated static source literals whose destination is already protected by the permanent redirect layer.

These are **not new indexable owners** and are not treated as authority destinations. Brick 11 owns the final technical sweep for redirects, generated discovery files, sitemap/canonical consistency, redirect-hop cleanup, and stale non-rendered metadata.

This boundary is intentional: Brick 8 fixes the architecture used by active content and shared navigation without mixing it with the later technical-consolidation brick.

---

## 8. No expansion introduced

Brick 8 created:

- no new SEO page;
- no new tracing page;
- no new SATPIN page;
- no new phonics landing page;
- no URL migration;
- no canonical change.

Only internal-link authority control, rendered-link normalization and regression protection were added.

---

## Definition of done

- [x] Primary recovery authority paths are centrally recorded.
- [x] Retired recovery blog URLs normalize to final owners before rendering.
- [x] Historical blog source links no longer require one-by-one edits to avoid redirect hops in normalized output.
- [x] Phonics cluster navigation points directly to the comparison authority.
- [x] Cluster navigation avoids avoidable self-links.
- [x] SATPIN support flows into SATPIN master and `/phonics`.
- [x] Parent-problem authority flows into `/phonics` and assessment appropriately.
- [x] Tracing flows into sounds, blending/reading and `/phonics` without changing tracing intent.
- [x] Automated regression protection added.
- [x] No new SEO page created.
- [x] Technical/historical residue explicitly assigned to Brick 11.

**Brick 8 decision:** CLOSED.

**Next:** Brick 9 — systematic quality upgrades of existing pages using the shared quality checklist.
