# Speaking commercial-search recovery — October 2026 evidence gate

**Status:** evidence-logged, candidate for HUMAN review only; no production SEO copy change.  
**Property:** Google Search Console domain `sc-domain:tinystepslearning.com`  
**Comparison:** 2026-10-02–2026-10-15 versus 2026-10-16–2026-10-29, 14 complete days per period.  
**Owner:** `https://tinystepslearning.com/speaking`. Keep the programme owner, page title, H1, canonical, offer, routes and links unchanged until release approval.

## 1. Verified URL Inspection (user GSC screenshots, 2026-10-31)

- Google Index reports **Page is indexed**. Last indexed crawl: **2026-10-30 05:41:06 local GSC time** by Googlebot smartphone; crawl/fetch/indexing allowed and successful.
- Google-selected canonical **Inspected URL**, equal to user-declared canonical `/speaking`.
- Google Live Test: HTTP 200; substantive prerendered text visible; one valid breadcrumb; one supplementary video detected but not indexed as a watch-page video (expected).
- Live inspection logged **6/47 page resources not loaded** and errors for the dynamic `speaking-CcymznRn.js` and `AnalyticsTracker-CqXZskGf.js` chunks. Later Mac full GET for both yielded HTTP 200 `text/javascript`. Root cause undetermined; do not assume broken production JS or rank penalty.

## 2. Google Search Console page-level performance

| Metric | Oct 2–15 | Oct 16–29 | Direction |
| --- | ---: | ---: | --- |
| Page clicks | 38 | 21 | -44.7% |
| Page impressions | 1,314 | 755 | -42.5% |
| Page CTR | 2.89% | 2.78% | -0.11 pp |
| Average position (all queries) | 7.62 | 6.74 | improved |

**Interpretation:** all-query average position improved while qualified-query performance weakened. This is not evidence of page deindexing.

## 3. Query-level evidence (page+query grain, GSC Web)

| Exact query | Oct 2–15: imps / clicks / position | Oct 16–29: imps / clicks / position |
| --- | --- | --- |
| `public speaking classes for kids` | 66 / 3 / 7.52 | 48 / 1 / 8.29 |
| `online public speaking classes for kids` | 23 / 0 / 10.04 | 13 / 0 / 6.15 |
| `public speaking for kids` | 41 / 1 / 9.0 | 30 / 0 / 8.8 |

The C4 policy's **three pre-defined core query strings** are exactly:
1. `public speaking classes for kids`;
2. `public speaking classes for kids online india`;
3. `public speaking classes for kids usa`.

In the recent 14-day window, the connector supplied **48** impressions for query (1), **2** for query (2), and **0 observed** for (3): **50 reported impressions** across the frozen core query set. Daily connector rows sometimes repeat identically; aggregate a unique (date, page, query, metrics) row once. GSC privacy-thresholded rows and page totals do **not** necessarily reconcile. The 50-impression threshold is met exactly, with limited statistical confidence.

## 4. Explicit C4 release gate

`COMMERCIAL_C4_POLICY` requires:
- `observationDays >= 14` -> **PASS** (14).
- `pageImpressions >= 200` -> **PASS** (755).
- `queryImpressions >= 50` for mapped family -> **PASS AT BOUNDARY** (50).
- The evaluator returns **READY for human review**, **not deployment authorization**; current title and description remain the control, and `qualifiedOrganicLeads` are not yet provided.

## 5. Candidate experiment — do not publish yet

**Control title — unchanged:**
`Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps`

**Control meta description — unchanged in production:**
`Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.`

**Proposed *description-only* candidate for review:**
`Online public speaking classes for kids ages 4–12, taught live 1:1. Practise storytelling, show-and-tell and school presentations. ₹400/class; free 35-min demo.`

The candidate uses only verified on-page facts and tests a clearer, activity-led parent promise; it is **not** a guaranteed CTR or ranking improvement. The title, canonical URL, H1, structured data, course levels, booking destination, and Phonics owner **must not change**. Google is free to rewrite snippets.

**Before implementation or merge:** capture fresh query-specific Google search results for `public speaking classes for kids` and `online public speaking classes for kids` on mobile/desktop with country and date; confirm whether Google's snippet is already displaying the current control; obtain a 14-day qualified-organic-lead baseline. If unable to verify either, keep candidate as documentation only.

## 6. Conversion diagnostic — code verified, production data NOT verified

`src/components/forms/PublicAssessmentForm.tsx`:
- Form submit validates required fields; calls `setDoc` into Firestore `leads` before opening a populated WhatsApp message.
- On Firestore success, calls `trackGenerateLead` (and for one-to-one, `trackDemoBookingComplete` with `booking_type: whatsapp_assessment_request`).
- If Firestore save fails, WhatsApp still opens with an error notice but **there is no saved Firebase lead**. A WhatsApp enquiry is not proof of successful Firestore persistence. A `demo_booking_complete` tracking event represents an assessment **request**, not a confirmed scheduled session; avoid treating it as a booked demo without CRM reconciliation.
- An enrichment callable runs after lead create; an enrichment failure is logged but does not block WhatsApp.

Read-only verification still required:
1. Compare real unique Firestore `leads` creates, WhatsApp enquiry messages and GA4 `generate_lead` events for two equal Indian-time windows; segment organic/paid/direct and surface.
2. Review GA4 stream, consent and event routing **without merging PRs #762/#763/#764** until integration-tested; dedupe real leads by normalized phone and event `submission_id`.
3. Verify on a safe staging environment that a permitted anonymous submission saves once and opens WhatsApp once, and that Firestore failure displays the fallback. Do **not** submit fabricated leads to production or disclose parent PII.
4. Audit mobile /book-demo CTA and validation rendering, and inspect Firebase security rules/test behavior.

## 7. Protected control

`/phonics` page-level GSC: **25 -> 43 clicks**, **1,021 -> 1,937 impressions** for equal 14-day windows, and `online phonics classes for kids` query position **18.53 -> 4.27** on small samples. Protect all Phonics metadata, canonical, H1, internal links, structured data, pricing and conversion routes. Keep no touch on this branch.

## 8. Measurement and decision

Before deploying any description candidate, retain exact control title/description, SERP snapshot and timestamp; then compare the next **complete 14- and 28-day** windows by India, device, queries and Search type against matching prior windows, including actual organic lead conversion. Evaluate position shifts and query mix (CTR alone misleads when rank changes). Roll back on sustained relevant-query deterioration or qualified lead harm.

**This branch is evidence-only. No live page metadata/content, Firebase, analytics events, routes, Phonics or production configuration is modified.**
