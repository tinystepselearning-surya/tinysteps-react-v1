# Admin Analytics V3 — Brick 6 External Traffic & Search

Brick 6 adds a server-side read-model pipeline for Google Analytics 4 (GA4) and Google Search Console (GSC). It deliberately keeps those systems separate from the operational Firestore lead/demo/enrollment ledger.

## Measurement contract

- **GA4 Sessions** and **GA4 Engaged Sessions** are website analytics metrics.
- **GSC Clicks**, **Impressions**, **CTR**, and **Average Position** are Google Search metrics.
- A GSC click is **not** treated as a GA4 session.
- Neither provider is joined directly to a lead. Lead attribution remains the Brick 4/5 first-touch and blog-context contract.
- The daily Firestore documents are read-optimized cache/read models only. GA4 and GSC remain the source systems for traffic/search data.
- Missing provider coverage is shown as unavailable/partial, never silently replaced with a plausible zero.

## Runtime functions

- `syncExternalTrafficAnalyticsDaily` — scheduled at 06:45 Asia/Kolkata; refreshes the latest seven days so delayed GSC data can mature.
- `adminSyncExternalTrafficAnalytics` — explicit admin-only selected-period backfill/retry, maximum 31 days per call.
- `getAdminExternalTrafficAnalytics` — admin-only read of the cached selected period plus the immediately preceding equal-length period, maximum 93 days.

Cached documents are stored at:

- `externalTrafficAnalyticsDaily/{YYYY-MM-DD}`
- `externalTrafficAnalyticsMeta/current`

No browser receives Google credentials.

## Server configuration

Set these server-side environment values for the Functions runtime:

- `GA4_PROPERTY_ID` — numeric GA4 property id, for example `123456789` (not the `G-...` measurement id).
- `GSC_SITE_URL` — the exact Search Console property identifier, for example `sc-domain:tinystepslearning.com` or the exact URL-prefix property if that is what is configured.
- `PUBLIC_SITE_ORIGIN` — optional; defaults to `https://tinystepslearning.com`.
- `EXTERNAL_ANALYTICS_SERVICE_ACCOUNT_SECRET` — optional Secret Manager secret name; defaults to `external-analytics-service-account-json`.

## Credential setup

Use a dedicated least-privilege Google service account for analytics reading.

1. Enable the **Google Analytics Data API** and **Google Search Console API** for the service-account project.
2. Add the service-account email as a read-only/viewer user to the required GA4 property.
3. Add the same service-account email as a user to the required Search Console property.
4. Create a JSON key for that dedicated service account and store the complete JSON as the latest version of the Secret Manager secret named `external-analytics-service-account-json` (or the configured override).
5. Grant the Firebase/Cloud Functions runtime service account `Secret Manager Secret Accessor` only for that secret.
6. Deploy the functions, then use **Sync selected period** in Admin Analytics → Acquisition to bootstrap a reporting month. The scheduled refresh maintains the latest seven days thereafter.

The JSON key must never be committed to the repository or exposed through `VITE_*` variables.

## Daily read-model schema

Each daily document stores provider data independently:

- GA4: sessions, engaged sessions, page-level additive metrics, partial/truncation flags.
- GSC: clicks, impressions, impression-weighted position sum, page-level metrics, partial/truncation flags.

Average position is calculated from impression-weighted page/day rows. Active Users are intentionally not summed across daily documents because users are non-additive across dates.

## Freshness and safety

- The current GA4 day is marked partial.
- GSC requests use `dataState: all`; API incomplete-date metadata is honored when available. If it is absent, the latest three calendar days are conservatively marked partial.
- Provider API failures do not overwrite previously synced provider-day data with zeros.
- A provider can fail while the other succeeds; status is preserved independently.
- Page paths are normalized to the Tiny Steps hostname and query/hash noise is removed before storage.
- The page-level cache is the foundation for Brick 7 Content & SEO Analytics, where blog/current-vs-prior interpretation will be added without conflating traffic, search and lead cohorts.
