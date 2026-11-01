# Tiny Steps — Significant Public Search Readiness Changes

This is an append-only evidence ledger for changes detected by the 202-URL, 24-hour rotating technical readiness audit. The latest state for all 202 URLs is in [MASTER_URL_TRACKER.csv](./MASTER_URL_TRACKER.csv).

## Log protocol

For each **verified meaningful** regression or improvement, record: observed IST and UTC timestamps; exact affected URLs; check modality (origin HTTP/header/live HTML/robots/sitemap/source-only); previous observed state and evidence date; current observed state and evidence date; impact or uncertainty; recommended action; and GitHub commit / supporting URLs as applicable. Never mislabel a tool error as a website failure. Source-only changes may be recorded as such, but cannot certify production deploys. Do not report indexing/ranking/AI citation changes without first-party evidence.

## Current record

- **2026-10-25 IST — Baseline initialized.** 202 selected public source-listed URLs recorded as `NOT_CHECKED`; zero verified transitions documented yet. No live page checks or deployed-system improvements are asserted by this entry.

## 28 October 2026 — tracker CSV integrity repair (operational evidence quality, NOT production SEO regression)

- **Observed:** 2026-10-28, approximately 19:20 IST / 13:50 UTC, during ChatGPT-native Slot 20.
- **Affected resource:** `docs/seo/rolling-public-health/MASTER_URL_TRACKER.csv` on `seo-url-health-tracker`; **not** any production URL or application source.
- **Before (dated evidence):** The 2026-10-28T12:45:37Z tracker commit `d2c85b719a4e86296859590b5cbd4cbb9aff7a3b` contained 202 unique URLs and 190 distinct current-day timestamps, but prior CSV serialization had split reason/evidence text across the final four columns, placing text fragments where `last_verified_status` and `last_verified_at_utc` should be. The intact full-cycle snapshot at 2026-10-26T13:46:16Z (commit `7b2af5fb849f`) had 202 records with proper 22-column semantics and 30 historical PASS values.
- **After (verified readback):** The Slot 20 tracker repair commit `46a824a1cb0af30b27ed63d5721a5d8305afa69d` restored valid 22-column CSV semantics, recovered historical verification fields from the intact snapshot, retained all 190 existing 28 October check timestamps without re-probing, and added 12 genuinely executed Slot 20 probes. All 202 current-day attempts remain `UNVERIFIED` for origin technical readiness; 30 older PASS values remain historical only. Available corrupted evidence fragments were retained with a truncation warning rather than silently treated as complete.
- **Impact / next action:** Operational tracker-integrity issue repaired. Review future CSV writes with a standards-compliant parser and 22-column round-trip validation. This entry is **not** evidence of a deployed-site change, indexing change, or production SEO regression.

## 2 November 2026 — recovery of provider-extracted page text for three phonics URLs (audit evidence only)

- **Before (dated):** On 1 November 2026 IST, tracker rows 24, 26 and 27 recorded `NO_DIRECT_PAGE_TEXT`: exact URL web.open failed and exact-page search had not retrieved those pages (tracker state preceding Slot 3, blob `3ea3ef82a1efacf78915ff6c528546a235f43d9d`). Origin HTTP was also unverified then.
- **After (observed 2 November 2026 IST):** Following internal links from the provider-extracted R-controlled AR guide returned page-specific text for `https://tinystepslearning.com/resources/phonics/er-ir-ur-r-controlled-vowels-phonics` (H1 "How can children spell a sound that may be written er, ir or ur?", `turn412726view4`), `https://tinystepslearning.com/resources/phonics/or-r-controlled-vowels-phonics` (H1 "How should children read or in fork and storm?", `turn412726view3`), and `https://tinystepslearning.com/resources/phonics/y-as-a-vowel-phonics` (H1 "When does y act like a vowel?", `turn412726view5`). The independent HTTPS origin probes for these three began at 2026-11-01T20:46:12.538727Z, 2026-11-01T20:46:17.581548Z and 2026-11-01T20:46:17.581781Z UTC respectively; all failed DNS before HTTP.
- **Scope and next action:** This is an **improvement in available audit retrieval evidence**, not a verified production change, uptime, indexing, canonical, robots or structured-data improvement. All three origin readiness statuses remain `UNVERIFIED`; retry direct origin checks from a working network when possible.
