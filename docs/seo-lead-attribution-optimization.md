# SEO Lead Attribution Optimization

Last updated: 2026-08-10

## Goal

Make Tiny Steps' website enquiries measurable from first acquisition touch through demo and admission, so SEO and marketing work can be prioritized by the channels and landing pages that produce business outcomes rather than traffic alone.

## What changed

### 1. First-touch acquisition capture

`src/lib/leadAttribution.ts` now keeps a session-scoped first-touch record for:

- first landing page
- first seen timestamp
- external referrer and referrer domain
- UTM source / medium / campaign / term / content
- Google Ads `gclid`
- Meta `fbclid`
- Microsoft Ads `msclkid`

The conversion page and submitted URL continue to update as the visitor navigates. The first-touch values remain stable for the session.

The legacy `ts_landing_page_v1` session key is retained for compatibility. The complete record uses `ts_public_lead_attribution_v2`.

### 2. Acquisition classification

`src/lib/leadAcquisition.ts` normalizes attribution into business-friendly channels:

- Google Organic
- Google Ads
- Bing Organic
- Microsoft Ads
- Instagram
- Facebook / Meta
- LinkedIn
- YouTube
- Referral
- Direct / unknown
- Other campaign

Click identifiers take precedence over referrer inference for paid traffic.

### 3. Security model: strict public create + server enrichment

The existing unauthenticated Firestore lead-create rules remain intentionally narrow. The browser first writes the same strict public lead payload that already passes `firestore.rules`.

After that write succeeds, `enrichPublicLeadAttribution` is called in `asia-south1`. The callable uses the Admin SDK to enrich only a newly created website lead.

Protections include:

- Firestore auto-ID validation
- the target lead must already exist
- the lead must have `source == website`
- enrichment is limited to the first 20 minutes after creation
- enrichment is idempotent; an already-enriched lead is not overwritten
- all marketing metadata is length-limited and sanitized
- acquisition classification is recalculated server-side rather than trusting a client-supplied classification

A failure in attribution enrichment never blocks the original lead or the WhatsApp handoff.

### 4. Stored lead fields after enrichment

New website leads can contain:

- `acquisitionChannel`
- `acquisitionSource`
- `landingPage`
- `conversionPage`
- `attributionEnrichedAt`
- `attribution.landingPage`
- `attribution.conversionPage`
- `attribution.submittedFromUrl`
- `attribution.firstSeenAt`
- `attribution.referrer`
- `attribution.referrerDomain`
- `attribution.utm_source`
- `attribution.utm_medium`
- `attribution.utm_campaign`
- `attribution.utm_content`
- `attribution.utm_term`
- `attribution.gclid`
- `attribution.fbclid`
- `attribution.msclkid`

Existing leads remain valid and require no migration.

### 5. Admin analytics

`Admin > Analytics` now includes **Lead Source Analysis** with 7-, 30-, and 90-day views.

It reports:

- total leads
- attribution coverage
- organic leads
- paid leads
- social leads
- leads that reached demo
- admitted leads
- acquisition-channel breakdown
- top first landing pages
- demo and admission counts per channel / landing page

Older leads without trustworthy first-touch evidence are shown as **Legacy / unattributed** instead of being incorrectly classified as direct traffic.

## Deployment requirement

This change adds a Cloud Function export:

`enrichPublicLeadAttribution`

The production deployment must include Firebase Functions as well as the web application. The web client already uses the configured functions region (`VITE_FUNCTIONS_REGION`, falling back to `asia-south1`), so it matches the function's region.

## Validation checklist

Before merge:

1. Run the web TypeScript/build checks.
2. Run the relevant Vitest suites:
   - `src/tests/lib/leadAcquisition.spec.ts`
   - `src/tests/lib/leadAttribution.spec.ts`
   - `src/tests/lib/publicLeadForm.spec.ts`
   - `src/tests/firestore/publicLeads.rules.spec.ts` when the Firestore emulator is available.
3. Run the Functions TypeScript/build checks.
4. Confirm the existing public lead rules test still passes without widening anonymous write permissions.
5. Review the branch diff for unrelated changes.

After deployment:

1. Open a tagged test URL such as `/phonics?utm_source=qa&utm_medium=test&utm_campaign=attribution-check`.
2. Navigate internally to the assessment form and submit a test lead.
3. Confirm the lead is created even if attribution enrichment is unavailable.
4. Confirm a successful enrichment adds `landingPage`, `conversionPage`, `acquisitionChannel`, `acquisitionSource`, and the full attribution map.
5. Confirm `Admin > Analytics > Lead Source Analysis` includes the test lead in the expected range.
6. Delete/archive the QA lead according to normal admin procedure.

## Interpretation note

This release improves attribution from deployment onward. It does not manufacture historical first-touch data for older leads. Historical records should remain labelled legacy/unattributed unless they already contain trustworthy campaign/referrer evidence.
