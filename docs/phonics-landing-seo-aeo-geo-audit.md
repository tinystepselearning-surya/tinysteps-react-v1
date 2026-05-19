# Phonics Landing Pages SEO/AEO/GEO Audit

## Scope audited
- `/phonics`
- `/best-online-phonics-classes-india`
- `/online-phonics-reading-classes`
- `/phonics-fees-india`
- `/phonics-apps-for-preschoolers-india`
- `/phonics-games-for-preschoolers`

## Executive summary
- Overall technical indexability status remains clean after updates:
  - Total page URLs audited: 128
  - OK page URLs: 128
  - Non-OK page URLs: 0
- Visibility improvements were applied to reduce metadata drift, strengthen answer-engine extraction, and improve geo-intent clarity for phonics landing pages.

## Key findings
1. Canonical/intent mismatch risk
- `/online-phonics-reading-classes` had dedicated landing content but was configured as canonical to `/phonics` in route SEO registry, which can reduce discoverability for early-reader query intent.

2. AEO schema depth opportunity on `/phonics`
- `/phonics` already had Course + FAQ schema, but schema FAQ coverage was narrower than visible FAQ coverage.

3. Metadata consistency risk on `/best-online-phonics-classes-india`
- Page-level metadata in `applySeo` and `Meta` had slight drift from centralized route metadata, and JSON-LD did not expose checklist structure as an explicit extractable list.

## Changes implemented

### 1) Route canonical alignment for discoverability
- Updated route config for `/online-phonics-reading-classes` to self-canonical:
  - `canonicalPath: '/online-phonics-reading-classes'`
- Kept title/description focused on early-reader phonics + reading bridge intent.

### 2) `/phonics` AEO improvements
- Expanded schema FAQ source to include both quick-answer FAQs and full FAQ set (deduped by question).
- Added `ItemList` JSON-LD for phonics pathway stages to improve extraction of progression intent:
  - sounds/words stage
  - rules/teams stage
  - fluency/writing stage
- Added a geo-aware FAQ entry in visible FAQ content:
  - support for families across India and globally.

### 3) `/best-online-phonics-classes-india` metadata + schema consistency
- Connected page metadata to centralized route config values (title/description/canonical path) for consistency.
- Aligned `Meta` component values with applied SEO values.
- Added checklist `ItemList` JSON-LD (`#comparison-checklist`) so answer engines can parse the comparison framework directly.

### 4) `/online-phonics-reading-classes` metadata consistency
- Connected page metadata to route config and canonical URL derivation.
- Kept FAQ/Course/Breadcrumb schema and aligned IDs/URLs with canonical URL variables.

## Files changed
- `src/lib/routeSeoRegistry.js`
- `src/pages/phonics.tsx`
- `src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx`
- `src/pages/public/OnlinePhonicsReadingClassesPage.tsx`
- `docs/sitemap-indexability-audit.md` (regenerated)
- `docs/phonics-landing-seo-aeo-geo-audit.md` (new)

## Post-change validation
- Ran sitemap indexability audit script.
- Result: `Non-OK page URLs: 0` and no canonical conflict flagged.

## Recommended next visibility steps (no code changes in this pass)
1. Re-submit `https://tinystepslearning.com/sitemap.xml` in GSC after deploy.
2. Request indexing first for:
   - `/phonics`
   - `/best-online-phonics-classes-india`
   - `/online-phonics-reading-classes`
   - `/phonics-fees-india`
3. Track query split for cannibalization between:
   - `/phonics`
   - `/best-online-phonics-classes-india`
   - `/online-phonics-reading-classes`
4. Review 14-day trend in GSC for:
   - impressions (phonics queries)
   - CTR changes for India-intent and early-reader-intent terms.
