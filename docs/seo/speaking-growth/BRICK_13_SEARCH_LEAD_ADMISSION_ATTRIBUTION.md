# Brick 13 — Search → Lead → Admission Attribution

Build date: 2026-09-19 IST
Branch: feature/speaking-seo-geo-growth
Status: **COMPLETE — STRUCTURALLY VERIFIED**
Production deployment: **NO**

## Purpose

Brick 13 connects the Speaking SEO/GEO architecture to business outcomes without pretending that aggregate search data identifies the exact query that caused an individual admission.

Measurement chain:

**Search visibility → canonical lead → stored first touch → demo progression → admitted_confirmed**

Brick 13 reuses the existing Commercial C0 measurement contract, website-lead attribution, demo lifecycle, and Admin Analytics surface. It creates no parallel analytics datastore and no public attribution URL.

## Measurement hierarchy

1. **Google Search Console** — aggregate Google query/page visibility.
2. **Canonical lead record** — one deduplicated lead with stored first-touch attribution.
3. **Demo lifecycle** — demo scheduling/completion/follow-up progression.
4. **Lead status admitted_confirmed** — admission truth propagated from demo conversionStatus=enrolled.

GA4 events remain funnel diagnostics; they are not unique-lead or admission truth.

## Query causality boundary

Current lead records do not store the GSC query that produced an individual click. Therefore:

- query → individual lead join: **NOT AVAILABLE**;
- query → individual admission join: **NOT ALLOWED**;
- first landing page → lead join: **AVAILABLE**;
- first landing page → admission join: **AVAILABLE** through the same canonical lead.

A valid report can say that Google Organic first-touch leads landing on /speaking produced a given number of leads, demos, and admissions. It must not claim that a particular Google query caused those admissions unless future per-lead query evidence exists.

## Central attribution contract

New source: `src/lib/speakingAttribution.ts`

Revision: `2026-09-19-b13-v1`

Brick 13 freezes two separate cohorts.

### Speaking origin

A lead is Speaking origin when its stored first landing page belongs to the frozen Speaking authority territory.

The territory contains **22 existing URLs**:

- seven core Speaking commercial/course/progress/resource owners;
- all fourteen Brick 8 Speaking knowledge URLs;
- /shy-child-speaking-confidence.

Generic decision/evidence pages such as /book-demo, /pricing, /class-samples, and /team are not counted as Speaking-origin SEO.

### Speaking interest

A lead is Speaking interest when the canonical lead explicitly records Speaking/Public Speaking/Communication interest or interestTrack=public_speaking.

These cohorts stay separate. A lead may be Speaking-origin but choose Grammar, or land elsewhere and later choose Speaking.

## Admission truth

Existing backend lifecycle logic already maps demo conversionStatus=enrolled to lead status=admitted_confirmed.

Brick 13 treats only admitted_confirmed as an admitted outcome. Qualified, demo-pending, demo-booked, demo-completed, and admission-follow-up remain funnel stages rather than admissions.

## Attribution integrity defect found and fixed

The browser acquisition classifier already recognized ChatGPT, Gemini, Perplexity, Copilot, and Claude, but the server-side enrichPublicLeadAttribution classifier did not.

That mismatch could persist an AI-origin lead with raw evidence such as utm_source=chatgpt.com as acquisitionChannel=other. The Admin attribution view then trusted that generic stored value.

Brick 13 now aligns browser and server recognition for:

- chatgpt.com / OpenAI;
- gemini.google.com;
- perplexity.ai;
- copilot.microsoft.com / copilot.com;
- claude.ai / Anthropic.

New leads can therefore persist the correct granular AI source after deployment.

For historical rows, resolveStoredLeadAcquisition may reclassify a stored generic `other` only when existing raw UTM/referrer evidence supports a stronger specific source. It does not invent missing attribution or rewrite historical Firestore records.

## Paid precedence

Explicit paid click identifiers remain stronger evidence than source labels:

- gclid → Google Ads;
- msclkid → Microsoft Ads.

Commercial C0 remains the broad KPI grouping authority:

- organic_search;
- organic_ai;
- paid;
- referral;
- direct_or_unknown.

The detailed acquisition table remains granular for diagnosis.

## Existing first-touch persistence reused

The anonymous public lead create remains narrow. Full first-touch attribution is enriched server-side onto the canonical lead with acquisition channel/source, landing/conversion pages, referrer, UTM fields, click IDs, and enrichment timestamp.

Lead merge redirects and canonical lead handling remain unchanged.

## Admin Analytics integration

Brick 13 extends the existing `src/pages/admin/LeadSourceAnalysis.tsx` surface.

No new analytics collection and no new Firestore query are added for Speaking attribution. The existing bounded lead rows are filtered locally.

New cohort controls:

- All leads
- Speaking origin
- Speaking interest

Broad summary chips now use the Commercial C0 channel model:

- Organic search
- Organic AI
- Paid
- Referral
- Direct / unknown

The existing detailed acquisition-channel table remains available.

The UI explicitly states that GSC query visibility is reviewed separately and that business outcomes use stored first-touch channel/landing-page evidence.

## Historical attribution policy

- Missing first-touch evidence remains direct/unknown or legacy/unattributed.
- Historical other may be reclassified only from stored raw evidence.
- Missing attribution is never backfilled as Google Organic.
- AI referrals are never counted as Google Organic.

## Cohort maturity

Admission review uses a **28-day cohort-maturity guide** so recent demo-heavy cohorts are not prematurely judged as conversion failures.

## Main synchronization during Brick 13

Main advanced by one Attendance Validation commit while Brick 13 was being built. It changed twelve attendance-validation files and had zero Speaking/attribution overlap.

Sync PR: **#400 — Sync latest main into Speaking growth branch**

Merge commit: `b454baa4bafb2b3307315f35e47cb1143234584e`

Post-sync branch behind main: **0**

Post-sync Brick 13 critical gate: **18/18 passed**.

## Brick 13 implementation files

Before documentation, Brick 13 intentionally changes/adds:

1. src/lib/leadAcquisition.ts
2. functions/src/enrichPublicLeadAttribution.ts
3. src/lib/leadAttributionDisplay.ts
4. src/lib/speakingAttribution.ts
5. src/pages/admin/LeadSourceAnalysis.tsx
6. src/tests/pages/LeadSourceAnalysis.spec.tsx
7. src/tests/seo/speakingGrowthBrick13.spec.ts

The main-sync merge additionally contains the unrelated Attendance Validation files from main.

## Structural verification

- attribution contract / causality boundaries: **16/16**
- frontend + backend acquisition integrity: **30/30**
- canonical lead / admission truth: **10/10**
- existing Admin Analytics integration: **17/17**
- no-new-public-route protection: **5/5**
- Brick 13 regression-spec coverage: **9/9**

**Total: 87/87 passed.**

Dedicated regression file: `src/tests/seo/speakingGrowthBrick13.spec.ts` with **13 test cases**.

## Protected-surface SHA verification

Compared with Brick 12 re-audited head `f584903e216ee86978b880d2c8d37562db27cb12`, **20/20 protected surfaces remain byte-for-byte unchanged**.

Protected surfaces include Bricks 7–12 contracts, /speaking, the progress framework page, the Speaking resource hub, llms.txt, llms-full.txt, semantic facts, shared schemas, routes, route manifest, parent/teacher progress surfaces, the public lead form, and lead lifecycle source.

## New architecture

- New public URLs: **ZERO**
- New canonical SEO owners: **ZERO**
- New analytics collections: **ZERO**
- New public Firestore read paths: **ZERO**
- Query-level admission claims: **ZERO**

## Executable-test limitation

No exact-head GitHub Actions result is claimed at this structural-close stage. Full Vitest, strict typecheck, Functions tests, production build/prerender, and browser QA remain mandatory at the final integration gate.

## Exit decision

Brick 13 is structurally complete when Tiny Steps can distinguish Google Organic from AI referrals, preserve paid precedence, separate Speaking-origin from Speaking-interest, follow a canonical lead through demo and admitted status, report those cohorts in the existing Admin Analytics surface, preserve unknown attribution as unknown, and avoid fabricating query-level admission causality.

That condition is satisfied on the isolated feature branch.

**Brick 13 status: COMPLETE — STRUCTURALLY VERIFIED.**

Next checkpoint: **full thorough Brick 13 re-audit → final Bricks 1–13 integration gate.**
