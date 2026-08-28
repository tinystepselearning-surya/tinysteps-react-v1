# B12 — Admin Attribution Read Model

## Purpose

B11 writes enough information to distinguish **how a lead arrived** from **which Tiny Steps article influenced the assessment decision**. B12 makes that information understandable inside the existing Admin Leads & Enquiries workspace.

No new analytics collection is introduced.

## Existing canonical lead fields used

| Field | Meaning |
| --- | --- |
| `source` | broad operational source such as `website` |
| `sourceDetail` | B11 content/conversion context, e.g. `blog|<slug>|<family>|<cta>` |
| `acquisitionChannel` | normalized first-touch channel from server enrichment |
| `acquisitionSource` | normalized source/domain from server enrichment |
| `landingPage` | first-touch Tiny Steps landing path |
| `conversionPage` | path where the public lead was submitted |
| `attribution` | bounded UTM/referrer/click-id acquisition metadata written by the existing enrichment flow |

These fields are already stored on the canonical lead document. The Leads workspace already reads that document for workflow purposes, so B12 displays the fields from the same document read.

## Admin display contract

The UI should show two concepts separately:

### Acquisition

Examples:

- `Google Organic`
- `Google Ads`
- `Instagram`
- `Facebook`
- `YouTube`
- `Referral`
- `Direct`

This answers:

> How did this parent originally reach Tiny Steps?

### Content influence

Examples:

- `Blog · Child Gives One Word Answers`
- `Blog · Why Child Knows Letter Sounds But Cannot Read Words`
- `First touch blog · Satpin Phonics Guide`

This answers:

> Which Tiny Steps article/problem was part of the path toward the enquiry?

For B11-attributed leads, the row tooltip/detail can also expose:

- first-touch landing path;
- conversion path;
- CTA position.

## Legacy compatibility

Older leads may not have `sourceDetail` or server-enriched acquisition fields.

B12 therefore degrades in this order:

1. normalized `acquisitionChannel`;
2. UTM source;
3. normalized `acquisitionSource`;
4. referrer domain;
5. broad operational `source`;
6. `Source unavailable`.

For content influence:

1. parse B11 `sourceDetail` when available;
2. otherwise recognize a `/blog/<slug>` first-touch landing page;
3. otherwise show no blog-influence label.

B12 must not invent an article attribution for a lead that has no supporting signal.

## Search behaviour

The existing loaded-page text search may search:

- acquisition label;
- blog influence label;
- first-touch/conversion detail;

This is a convenience for the loaded page only. It must not be presented as a database-wide analytics query.

## Read-cost boundary

B12 explicitly does **not** add:

- a second Firestore listener for attribution;
- a per-row inquiry-subcollection read;
- a new `analytics` collection read;
- a background scan of all leads;
- a GA4/GSC API call on every Admin Leads render.

Aggregate SEO and conversion reporting remains a deliberate reporting workflow, using GSC/analytics exports and the B12 review template rather than turning the operational leads queue into a high-cost analytics warehouse.

## Privacy boundary

The attribution labels describe acquisition and Tiny Steps content context. They do not add new parent or child personal data.

SEO reporting should use aggregate counts. Individual parent details remain inside the existing authorized lead workflow and should not be copied into SEO governance documents.
