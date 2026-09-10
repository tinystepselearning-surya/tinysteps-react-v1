# C0 — Revenue Measurement + Commercial Facts

**Project:** Tiny Steps Commercial SEO & Lead Growth  
**Revision:** `2026-09-10-c0`  
**Base:** `main@71c024928a3b740e646f4b3fe9c5737c9e650ed1`  
**State after validation:** 🔒 C0 measurement/facts contract frozen

## Mission

Create the measurement and facts foundation required before commercial keyword research begins.

C0 does four things only:

1. freezes what **qualified organic lead** means;
2. freezes the planning baseline and growth target;
3. verifies that first-touch attribution and GA4 funnel signals already exist and are usable;
4. exposes one authoritative commercial-facts projection from the existing semantic facts registry.

C0 deliberately does **not** optimize a commercial page. Keyword research starts at C1 and canonical commercial keyword ownership starts at C2.

---

## 1. Primary business KPI

### `qualified_organic_leads_per_day`

A record counts in the primary KPI only when both conditions are true:

- the canonical lead has reached a qualifying positive lifecycle status; and
- its stored first-touch attribution classifies as **organic search**.

The counting unit is **one distinct canonical lead record**, not one GA4 event, click, form view or form submission.

### Qualifying lifecycle statuses

- `qualified`
- `demo_pending_schedule`
- `demo_booked`
- `demo_completed`
- `admission_follow_up`
- `admitted_confirmed`

These preserve qualification after the lead progresses downstream. A lead must not disappear from qualified-lead reporting merely because it advances from `qualified` to a later positive stage.

### Terminal non-qualified statuses

- `not_interested`
- `wrong_fit`
- `no_response`
- `lost`

`new`, `attempted_contact` and `contacted` are operational states but are not yet counted as qualified.

The lifecycle status source of truth remains `functions/src/leadLifecycle.ts`.

---

## 2. Baseline and target

C0 locks the commercial project brief as the planning baseline:

- **Baseline:** 6–7 qualified organic leads/day
- **Target:** sustained 11–12 qualified organic leads/day
- **Timezone:** Asia/Kolkata
- **Monitoring window:** 7 days
- **Primary decision window:** 28 days

The 6–7/day number is explicitly classified as a **declared planning baseline**, not silently relabelled as a telemetry-derived historical average. Future baseline reconciliation can use exported lead records, but C0 does not invent unavailable historical data.

The 28-day view is the primary decision window to reduce overreaction to day-of-week volatility. The 7-day view remains useful for operational monitoring.

---

## 3. Attribution source of truth

The record-level attribution contract already exists in `src/lib/conversionTracking.ts` and is stored with website lead submissions.

Required first-touch fields:

- `landingPage`
- `firstSeenAt`
- `referrerDomain`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `gclid`
- `fbclid`
- `msclkid`

Additional UTM/referrer fields remain available where captured.

### Channel classification

C0 normalizes lead attribution into:

- `organic_search`
- `organic_ai`
- `paid`
- `referral`
- `direct_or_unknown`

Rules are intentionally conservative:

- paid click IDs (`gclid`, `fbclid`, `msclkid`) or paid media UTMs override search referrers and classify as paid;
- known search-engine referrers or explicit organic/SEO medium classify as organic search;
- known AI assistant referrers/sources classify as organic AI;
- other external referrers classify as referral;
- missing attribution remains direct/unknown and is **not backfilled as organic**.

### AI referral policy

AI referrals are valuable to the broader SEO/AEO/GEO programme, but C0 reports them **separately** from the primary organic-search KPI. This prevents the SEO baseline from changing definition halfway through the project.

---

## 4. GA4 event contract

The existing website already emits useful funnel events through `src/lib/analytics.ts` and `src/lib/conversionTracking.ts`.

### Traffic

- `page_view`
- `funnel_landing_page_view`

### Intent

- `funnel_cta_click`
- `book_demo_click`
- `whatsapp_click`

### Submission

- `lead_form_submit`
- `generate_lead`

These events are **diagnostic funnel signals**, not qualified-lead truth.

For example:

`book_demo_click` → strong intent  
`lead_form_submit` / `generate_lead` → successful website submission  
lead lifecycle status → qualification truth

A GA4 event cannot become a qualified lead merely because it is marked as a conversion/key event.

GA4 therefore answers traffic and funnel questions; the canonical lead record answers revenue-quality questions.

---

## 5. Commercial facts source of truth

C0 does not create a competing facts table.

The authoritative source remains:

`src/config/semanticFacts.ts`

with pricing math sourced from:

`src/config/pricing.ts`

`src/lib/commercialC0Foundation.ts` exports a read-only commercial projection of those facts for C1+.

Protected fact families include:

- brand positioning;
- public core age range;
- live-online delivery mode;
- standard 1:1 duration;
- free demo-assessment duration/session count/price/path;
- standard 1:1 price;
- small-group price range;
- Phonics, Grammar and Speaking commercial programme paths;
- India/Hyderabad/global-online service-area facts;
- learner/country proof floors.

C1–C12 must reuse the source of truth instead of introducing page-local factual variants.

---

## 6. Measurement hierarchy

Use this hierarchy whenever reports disagree:

1. **Canonical lead record** — deduplication and lifecycle status
2. **Stored first-touch attribution** — lead acquisition source
3. **GA4 events/session reporting** — traffic and funnel diagnosis
4. **GSC/Bing/search data** — query and landing-page visibility

This prevents a click, session or form-submit count from being mistaken for a unique qualified lead count.

---

## 7. C0 scope guard

C0 is forbidden from doing the following:

- commercial keyword research;
- assigning keyword clusters to canonical owners;
- changing title tags or H1s;
- rewriting commercial page copy;
- creating buyer, comparison, fee or city pages;
- creating informational articles;
- reopening PH/GR/SP/KB-FINAL.

Those decisions belong downstream:

- **C1:** parent commercial search universe
- **C2:** keyword ownership + cannibalisation
- **C3–C9:** evidence-led implementation

The C0 audit checks the PR diff and fails if unrelated production/page files are changed in this brick.

---

## 8. Machine-readable implementation

### Registry

`src/lib/commercialC0Foundation.ts`

Provides:

- commercial facts projection;
- lifecycle qualification definition;
- attribution channel classifier;
- qualified-organic and qualified-AI predicates;
- KPI baseline/target/reporting contract;
- event semantics;
- downstream scope guardrails.

### Tests

`src/tests/seo/commercialC0Foundation.spec.ts`

Verifies:

- KB-FINAL remains frozen;
- commercial facts are projected from the semantic facts registry;
- qualifying status semantics are stable;
- organic/AI/paid/referral classification is deterministic;
- GA4 form/CTA events cannot substitute for qualification;
- current runtime attribution fields are still present;
- the baseline/target/reporting windows remain locked;
- C0 has not crossed into C1/C2 work.

### Audit

`scripts/audit-commercial-c0-foundation.mjs`

Verifies source contracts and can write:

`artifacts/commercial-c0-foundation.json`

### Exact-head CI

`.github/workflows/commercial-c0-revenue-measurement-facts.yml`

Runs C0 tests/audit plus repository safety validation on the PR head.

---

## 9. Known limitations, explicitly preserved

C0 does not fabricate missing attribution for historical leads. A historical lead without a reliable source stays `direct_or_unknown` for source-specific analysis unless evidence is available elsewhere.

C0 also does not claim that the declared 6–7/day planning baseline has been reconstructed from historical Firestore records. That requires an actual lead export/query and is a measurement reconciliation exercise, not a reason to weaken the KPI definition.

WhatsApp clicks are intent signals. A WhatsApp-originating conversation becomes a qualified lead only when it exists as a canonical lead record with a qualifying lifecycle status and usable source attribution.

---

## 10. C0 acceptance gate

C0 is complete only when all of the following are true:

- [x] KB-FINAL remains frozen
- [x] qualified-lead lifecycle states are explicitly defined
- [x] organic-search attribution rules are explicit and conservative
- [x] AI referrals are tracked separately
- [x] paid indicators override organic referrers
- [x] unattributed leads are not backfilled as organic
- [x] 6–7/day planning baseline is locked
- [x] sustained 11–12/day target is locked
- [x] 7-day monitoring and 28-day decision windows are locked
- [x] GA4 events are formally separated from qualification truth
- [x] commercial facts have one authoritative source
- [x] runtime attribution/event dependencies are audited
- [x] C0 cannot modify commercial SEO/page architecture
- [ ] exact-head CI green

Once the final CI item passes:

> **C0 — Revenue Measurement + Commercial Facts: 🔒 FROZEN**

Then C1 can begin deep parent commercial keyword research without moving the goalposts on facts, attribution or what counts as business growth.
