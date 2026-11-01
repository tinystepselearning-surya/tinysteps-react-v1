# Brick 1 — Live new-parent cohort and India keyword-volume input contract

> **Business rule updated 1 November 2026 — overrides the parent-phone counting specification below.** The acquisition KPI is **distinct first-observed parent–child enquiry opportunities** (normalized parent phone **plus child name**). **One parent enquiring about two different children counts as two new enquiries; subsequent enquiries for the same child count as repeats.** Distinct parent phone contacts remain a secondary metric. Historical September/October targets calculated using phone-only identity require rebaselining; do not compare them directly. See [ARG-2 issue #856](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/856) and [draft PR #857](https://github.com/tinystepselearning-surya/tinysteps-react-v1/pull/857). The original text is retained as a dated design record and is **not the current counting rule**.

**Status (1 Nov 2026): design only, not an implementation.** Follow-up to [Brick 1 baseline](./BRICK_01_BASELINE_AND_KEYWORD_INTELLIGENCE.md), tracked in #834 and PR #835. This document is based on source inspection of `main`; it does not claim a new production Firestore read.

## Why a separate read model is needed

- `src/pages/admin/LeadSourceAnalysis.tsx` queries `leads` for the selected date range and deduplicates **document IDs**, not parent identities. Its channel, demo and landing-page totals are **lead-record counts**.
- `src/pages/admin/leadFunnelAnalytics.ts` also works at lead/document grain and uses `receivedAt → requestedAt → createdAt` for its IST lead-cohort date.
- `functions/src/leadLifecycle.ts` canonicalizes `receivedAt` and `receivedAtOriginal` and may populate `phoneNormalized` from `primaryPhone` / `whatsappNumber`.
- `functions/scripts/backfillWebsiteLeadDeduplication.js` uses **normalized phone + normalized child name** for website-lead record deduplication. **This must not be reused as the parent KPI**: two children of one parent still represent one new parent.
- `src/lib/leadAcquisition.ts` classifies source from UTM/referrer and explicit stored attribution. A generic `source: 'website'` is **not evidence** of Google or ChatGPT.
- Existing `demoSessionId` or a pending-demo status is not evidence that a demo is **confirmed**.

## Proposed measurement contract (requires owner approval and fixture validation)

1. **Population:** recoverable `leads` records with a known enquiry timestamp, across the available identity lookback, not just leads returned for the chart's selected dates. Establish whether historic standalone `demoSessions` without a linked lead belong in the recovered historical series before adding them. Never count the same enquiry twice.
2. **Identity:** canonical normalized parent phone across phone variants, using fields actually present (`phoneNormalized`, `primaryPhone`, `whatsappNumber`). Validate country-code stripping against actual stored formats. A phone+child key is the wrong grain. Multiple children with one parent phone count once. Shared numbers / invalid or missing numbers require an explicit **unresolved identity** bucket rather than assigning arbitrary distinct IDs. An identity based on phone is a *proxy for a parent*, not proof of distinct people.
3. **Cohort anchor:** earliest recoverable enquiry per normalized parent phone across **all historical records**. Order by the immutable received timestamp where available; use documented historical fallbacks and a deterministic tie-break. Convert timestamps to calendar dates in `Asia/Kolkata`, and include a parent only in the period containing that earliest event. Later enquiries are repeats, not new acquisitions.
4. **Attribution:** attach the original, first-observed evidence to the earliest enquiry, with raw `mainConcern`, classified learning intent and first landing page where present. Keep unknown/ambiguous source and concern explicit. Do not backfill an earlier unknown source from a later ChatGPT or Google enquiry, and record known instrumentation changes on **10 Aug** and **19 Sep 2026**.
5. **Deletion/archival limits:** inspect archived, merged, duplicate and deleted-record behavior before implementation. A complete historical lookback is required to call a cohort “new”; if records were purged or history starts partway through July, disclose **first observed** and the resulting coverage limitation.
6. **Privacy and authorization:** perform identity reconciliation in an approved restricted server-side/read-only path; retain any phone material only in that protected computation. Return aggregate counts and safe metadata to the existing authorized admin surface, never parent names, raw phones, email, identifiable row exports or persistent unsalted phone hashes in reporting artifacts. Verify existing admin claims and Firestore/security rules **before** selecting a callable/function architecture. No Firestore writes or new public endpoints are authorized by this document.
7. **Report dimensions:** period, new parent phone identities, submitted documents, repeat submissions, unresolved identities, attribution coverage, first-touch channel (including unknown), first landing page, recorded parent concern, classified programme intent and provenance. Display attribution confidence and historical coverage next to counts.
8. **Comparability:** release-gated 28-day complete IST cohorts, with monthly reference for July (partial)–October, and documented source-instrumentation changes. GSC Google Search impressions/clicks remain separate site/page/query facts, **not** a computed visitor-to-enquiry conversion rate without defensible joined visitor identity.

## Acceptance tests required before building a live panel

| Synthetic case | Expected outcome |
|---|---|
| Same normalized parent phone enquires in September and October | One September new parent; October repeat |
| One parent phone, two different children | One new parent, not two |
| `+91`, `91`, `0091` formats for the same verified Indian number | One identity, after validated country-code normalization |
| Different internationally formatted numbers that happen to share local digits | Must not be merged |
| Empty, short, malformed or conflicting phone | Unresolved identity recorded; never silently classed as new |
| Later ChatGPT referral after first unknown-source enquiry | First touch remains unknown, with attribution caveat |
| Archived or duplicate lead linked to a demo | No second new parent; no claim of confirmed demo without status evidence |
| Parent first seen outside selected date window | Must not be counted as newly acquired inside window |
| IST midnight boundary, timestamp fallback, tied events | Deterministic and timezone-correct |
| Browser / unauthorised caller | Cannot retrieve identity-level data |
| Missing prior history / unlinked demo evidence | Gap surfaced in completeness metadata, not silently treated as zero |

**Implementation gate:** verify actual production field prevalence and event timeline with authorized read-only access, then document expected results against the previously reviewed aggregate before changing the admin dashboard. The repo code alone does not prove that every historical record has a valid phone or source.

## India commercial keyword-volume input required

A search-volume denominator remains **missing**. Do not invent India national demand from GSC site impressions or the isolated historical 2025 Phonics estimate.

**Source requirements:** Google Keyword Planner (or dated, explicitly comparable third-party source), location **India**, consistent language/search-network filters, monthly dates where available (ideally 24 months), clearly stated close-variant and match-type treatment, data-source/export date and source quality caveats. Some platforms report rounded ranges rather than exact counts: retain those as ranges.

**Import/report schema (proposed; no private export committed):**

| Field | Purpose |
|---|---|
| `source`, `exported_at`, `geo`, `language`, `network` | Reproducible provenance |
| `keyword_original`, `keyword_normalized`, `close_variant_group` | Avoid double-counting aliases |
| `yyyymm`, `monthly_volume` or `volume_low/high` | Period-specific demand with ranges preserved |
| `commercial_intent`, `exclusion_reason` | Separate tuition/provider/trial intent from free resources, jobs and general information |
| `c2_cluster`, `canonical_owner_path` | Reuse frozen C2 ownership and exceptions |
| `device` (if the source actually provides it), `location_segment` (if available) | Optional breakdown; never infer absent slices |

Use the frozen C2 intent rules: price/comparison/trial queries and narrower fluency/local intents have distinct owners; do not assign them a second time to the five generic programme owners. Collapse genuine duplicates and explain overlap/aggregation uncertainty. Report validated India **search-demand estimates**, never “number of distinct parents” or projected guaranteed leads.

## Outstanding Brick 1 gates

- [x] Review existing lead-record analytics, canonical timestamp implementation, phone dedup path and source classifier in repository code.
- [x] Document a privacy-sensitive **design**, separate from the working lead-record admin panel.
- [ ] Inspect authorized live schema and completeness; reconcile a live or properly supplied reviewed aggregate against the historical snapshot.
- [ ] Obtain 5-market India transactional keyword-volume export and validate provenance/variants/monthly coverage.
- [ ] Build/admin-test the new-parent read-only report **only after** separate data-access/security approval.
- [ ] Complete final PR-head checks and owner review. Do **not** merge or deploy as part of this document.
