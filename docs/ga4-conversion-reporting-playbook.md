# Tiny Steps GA4 Conversion Reporting Playbook (Step 10)

Last updated: 2026-10-24 (P0 assessment event migration; deployment date pending)

Purpose: make Tiny Steps public marketing conversion tracking usable for weekly SEO/AEO decisions without building a heavy dashboard.

---

## 1) Live Event Contract (Source of Truth)

Tracking base:
- GA4 via `gtag` through `src/lib/analytics.ts` (`trackEvent`).
- Public-only behavior in production on `tinystepslearning.com`.
- Internal portal routes are excluded by analytics guardrails.

Conversion event names now live:
1. `book_demo_click`
2. `whatsapp_click`
3. `lead_form_submit`
4. `high_intent_page_cta_click`

### Parameters (current contract)

Common conversion params:
- `page_path`
- `page_type`
- `page_cluster`

Click params:
- `cta_label`
- `destination_path`

Form submit params:
- `form_type`
- optional `topic` (for advisor/program forms)

### Contract notes
- `page_type` currently mirrors `page_cluster` (same value by design in `getPageType`).
- `page_cluster` values: `authority`, `money`, `age`, `problem`, `program`, `seasonal`, `blog`, `parent_hub`, `other`.

---

## 2) Cluster Mapping in Use

From `src/lib/conversionTracking.ts`:

- Authority: `/phonics`, `/grammar`, `/speaking`
- Money: `/reading-classes-for-kids`, `/spoken-english-classes-for-kids`, `/writing-classes-for-kids`, `/phonics-fees-india`, `/online-english-classes-for-kids-india`
- Age: `/english-classes-for-4-year-old`, `/english-classes-for-5-year-old`, `/english-classes-for-6-year-old`, `/english-classes-for-7-10-year-old`
- Problem: `/child-not-reading-properly`, `/slow-reader-child-help`, `/shy-child-speaking-confidence`
- Program: `/reading-fluency-program`, `/confidence-building-program-kids`, `/english-foundation-program`
- Seasonal: `/summer-camp-for-kids-india`, `/summer-reading-program-kids`, `/summer-speaking-camp-kids`
- Blog: paths starting with `/blog`
- Parent hub: paths starting with `/parents`

---

## 3) What Each Event Means for Business Decisions

### `book_demo_click`
Meaning:
- User showed strong lead intent by clicking book-demo/free-assessment CTA.

Use it to answer:
- Which pages trigger strongest "ready to talk" behavior?

### `whatsapp_click`
Meaning:
- User prefers instant conversation over form flow.

Use it to answer:
- Which pages create urgency/questions best, especially pain/problem pages?

### `lead_form_submit`
Meaning:
- **After the assessment-event P0 fix is deployed**, `form_name=public_assessment_form` is emitted only after the Firestore lead write succeeds, along with `funnel_form_submit` and `generate_lead`.
- **Before that deployment**, the same event from the public assessment form was a *submit attempt*, even on a failed database write. Compare pre/post-release series separately; do not retrofit old event counts as saved leads.
- Other forms may use the same event name. In particular, the legacy `program_lead_form` emits it without persisting an enquiry. Filter by `form_name` and confirm source before reporting.
- `lead_form_submit_attempt` is the new attempt-only **diagnostic event** for the public assessment form and must NOT be marked as a GA4 key event.

Use it to answer:
- Which form attempts succeed versus fail, filtered by form name and release period?
- For actual saved enquiries, reconcile post-save `generate_lead` with distinct canonical Firestore lead documents; these browser events do not independently prove qualified parents.

### `funnel_demo_booking_complete`
Meaning:
- The public assessment form no longer emits this event for a saved WhatsApp demo request. **Request saved is not a confirmed class slot**.
- Use the authoritative backend demo scheduling record for booked-demo counts. A dedicated booked event may be emitted **only after** a confirmed slot exists and is deduplicated; that integration is outside this PR.
- Historic events before the release may include *requests* instead of bookings. Do not use them as an uninterrupted booked-demo time series.

### `high_intent_page_cta_click`
Meaning:
- Strong CTA click on mapped high-intent pages for non-book/non-WhatsApp actions (e.g., exploration/next-step CTAs).

Use it to answer:
- Which pages create mid-funnel movement but may still need stronger final conversion prompts?

---

## 4) Signal Interpretation (Good vs Weak)

### Pattern A: strong `book_demo_click`, weak `lead_form_submit`
Interpretation:
- Offer interest is strong, form completion is weak.
Likely actions:
- Reduce friction in form/call scheduling path.
- Improve trust proof near submit points (outcomes, parent signals, clarity of next step).

### Pattern B: strong money-page traffic, weak CTA clicks
Interpretation:
- Ranking/visibility is working, but message-offer match is weak.
Likely actions:
- Improve CTA clarity and value framing on money pages.
- Re-test hero copy and above-the-fold proof.

### Pattern C: strong `whatsapp_click` on problem pages
Interpretation:
- Problem-intent content is resonating; parents want immediate support.
Likely actions:
- Expand top-performing problem cluster pages.
- Add clearer “what happens next” framing from WhatsApp to trial/demo.

### Pattern D: age pages have visibility but low conversions
Interpretation:
- Early intent captured, confidence not strong enough to convert.
Likely actions:
- Add stronger age-specific proof/curriculum outcomes.
- Improve internal linking from age pages to best converting program pages.

### Pattern E: authority pages assist, but don’t close
Interpretation:
- Authority builds trust; conversion may happen on money/program pages.
Likely actions:
- Keep authority pages optimized for credibility and route users to specific conversion pages.

---

## 5) GA4: Step-by-Step How Priya Checks This

Use GA4 (Reports + Explore) in this order.

### A) Quick event health check
1. Open **Reports → Engagement → Events**.
2. Confirm events exist: `book_demo_click`, `whatsapp_click`, `lead_form_submit`, `high_intent_page_cta_click`.
3. Set date range to last 7/28 days.

### B) Which pages are generating conversion events
1. Go to **Explore → Free form**.
2. Add dimensions: `Event name`, `page_path`, `page_cluster`, `page_type`, `cta_label`.
3. Add metric: `Event count`.
4. Filter `Event name` in conversion events above.
5. Sort by `Event count` descending.

### C) Compare clusters
1. In same Exploration, use rows: `page_cluster` then `Event name`.
2. Metric: `Event count`.
3. Compare cluster contribution to total conversion intent.

### D) Landing pages that produce demo/form outcomes
1. Add dimensions: `Landing page + query string`, `Event name`, `page_cluster`.
2. Filter `Event name` to `book_demo_click` and `lead_form_submit`.
3. Find landing pages that produce both vs only click intent.

### E) WhatsApp-heavy pages vs form-heavy pages
1. Rows: `page_path`.
2. Columns: `Event name`.
3. Filter `Event name` to `whatsapp_click`, `lead_form_submit`.
4. Identify pages where WhatsApp dominates and form conversion is weak.

---

## 6) Recommended Weekly Reporting Checklist

1. Which `page_cluster` drives most `book_demo_click` this week?
2. Which pages have high `whatsapp_click` but low `lead_form_submit`?
3. Which authority pages (`/phonics`, `/grammar`, `/speaking`) assist intent best?
4. Which problem pages outperform money pages on conversion intent?
5. Which seasonal pages still produce meaningful conversion events after peak period?
6. Which age pages need stronger proof/internal links based on weak click-to-submit behavior?

---

## 7) Basic SEO/AEO Funnel Model

Use this simple model:

### Stage 1: Visibility / landing traction
- Landing pages and page views (GA4 traffic/landing reports)

### Stage 2: Intent signals
- `high_intent_page_cta_click`
- `whatsapp_click`
- `book_demo_click`

### Stage 3: Lead conversion
- `lead_form_submit`

Interpretation by cluster:
- **Authority:** trust + education; should assist movement to money/program pages.
- **Money:** should produce strong direct `book_demo_click` and some `lead_form_submit`.
- **Age:** usually early/mid intent; should progress to program/money outcomes.
- **Problem:** often high urgency; expect stronger `whatsapp_click` and rising demo intent.
- **Program:** should convert better than broad pages once fit is clear.
- **Seasonal:** can spike quickly; evaluate by period and avoid over-scaling after demand drop.

---

## 8) Decision Rules (Action Framework)

- If `book_demo_click` is high but `lead_form_submit` is low:
  - Improve lead form trust and reduce form friction.
- If a problem page beats money pages:
  - Expand that problem cluster and link it directly to relevant program pages.
- If seasonal pages spike then fade:
  - Keep seasonal strategy but shift effort back to evergreen clusters.
- If age pages get intent clicks but weak conversion:
  - Add stronger age-specific outcomes/proof and improve internal pathing.
- If authority pages drive assisted intent:
  - Keep authority pages as trust hubs and tighten links to converting pages.

---

## 9) Implementation References

Core contract + cluster map:
- `src/lib/conversionTracking.ts`

Shared click tracking:
- `src/components/common/ConversionTracker.tsx`

Submit conversion tracking:
- `src/components/common/AdvisorContactForm.tsx`
- `src/components/forms/TrialForm.tsx`
- `src/components/programs/ProgramLeadForm.tsx`

WhatsApp conversion tracking:
- `src/components/common/ConversionTracker.tsx`
- `src/components/common/FloatingAssistant.tsx`

---

## 10) Known Limits (Current Step)

- This step adds interpretation and reporting guidance only (no dashboard UI build).
- `high_intent_page_cta_click` is intentionally selective (strong CTA labels only) to avoid event spam.
- `book_demo_click` from non-link controls without destination may not fire unless label + destination rules match; this is deliberate for event quality.


---

## Owner-verified GA4 key-event configuration (25 October 2026)

**Source:** Owner-supplied screenshots of GA4 Admin → Data display → Events → **Key events** for property `tinysteps-react-v1`, captured around 00:01 IST on **25 Oct 2026**. Screenshots were inspected in the owner conversation, not uploaded to the repository.

- In the displayed six-event key-events table, **`generate_lead` is the only starred/selected key event**, with **2 streams** visible when expanded: `Tiny Steps` and `Tiny Steps App Check`.
- Listed `app_store_subscription_convert`, `app_store_subscription_renew`, `first_open`, `in_app_purchase`, and `purchase` are not marked as key events in that screenshot and show *No stream data detected*.
- `lead_form_submit`, `funnel_form_submit`, and `funnel_demo_booking_complete` are **not** in the displayed key-event list. Do **not** make `lead_form_submit_attempt` a key event.
- Therefore the proposed assessment-form fix **preserves `generate_lead` as the key conversion event** rather than changing its name or GA4 configuration. The change moves two other submit events to the post-save stage and stops falsely completing demo-booking.
- **Now verified by 25 Oct owner CSV exports:** 322 `generate_lead` event occurrences across 139 tracked users in 25 Sep–22 Oct. This exactly matches the earlier 322 GA4 acquisition-report key-event occurrences and is consistent with `generate_lead` being the sole starred key event. The CSVs do **not** establish 322 distinct saved enquiries or identify real parents, form names, streams, unique submission IDs or qualified lead counts. `generate_lead` may also be emitted by trial/advisor forms with other persistence contracts.
- **Release gate:** before production rollout, check GA4 *event-name counts* and **Admin → Data streams** URL + Measurement ID for each of the two streams. Preserve pre/post event semantics in reporting, and reconcile `generate_lead` for `form_name=public_assessment_form` with distinct saved lead IDs. Do not disable either stream or toggle key-event stars based on names alone.


### Three owner GA4 Events exports, 25 Sep–22 Oct 2026 (received 25 October)

Provenance: owner supplied the Explorations event-name daily export, 65-row event-count breakdown, and same event breakdown with total users. Filenames `download (8).csv`, `download (7).csv`, `download (6).csv`; all cover the exact **28 days 25 Sep–22 Oct**. The event-name daily counts sum to the tabulated totals for the relevant conversion events. Aggregated-only figures are retained in this repo; original CSVs are not published here.

| GA4 event name | Event occurrences | GA4 total users | Evidence classification |
|---|---:|---:|---|
| `generate_lead` | **322** | **139** | Count of browser analytics events, NOT canonical Firestore leads |
| `funnel_demo_booking_complete` | **299** | **130** | Historical request-acknowledged event; NOT 299 scheduled demos |
| `lead_form_submit` | **231** | **142** | Historical mixed form-submit semantics including **pre-write** assessment attempts |
| `funnel_form_submit` | **231** | 142 | Same per-day counts as `lead_form_submit`, shared tracker emits both |
| `lead_form_start` | **865** | 495 | Diagnostic form start |
| `lead_form_view` | **4,866** | 1,686 | Diagnostic form views |
| `whatsapp_click` | **1,421** | 654 | Navigations/clicks, not confirmed message deliveries |
| `form_error` | **3** | 2 | Browser-emitted error events; **not** a comprehensive log of Firestore failures |

**Crosscheck:** `generate_lead` is 322 in the 28-day daily export, summary event counts, user/count export, and earlier acquisition report's key-event count (322). Every one of the 28 dates has `funnel_demo_booking_complete <= generate_lead`; 17 dates equal and 11 show differences of 1–4. Total difference = 23 events. The close relationship is **consistent with** a paired instrumentation path in the assessment form but cannot measure actual demo bookings or show which forms produced the 23-event gap.

**Consequence:** Do not infer the 322 event occurrences are distinct leads because they came from 139 tracked users (2.32 events/user). Repeats may be legitimate, duplicate instrumentation, or different lead forms, and users are not a unique-lead key. Counting completed forms against `funnel_demo_booking_complete` will overstate real bookings. The commercial KPI's canonical unit remains a **distinct persisted lead record with business qualification status**, not GA4 events.

**New high-priority parity anomaly:** all **28/28** daily `generate_lead` counts in the owner CSV are **even numbers**; `funnel_demo_booking_complete` is even on **27/28** dates, whereas `lead_form_submit` is even on only **11/28** dates. This is a strong **duplicate-hit / twice-counted-event hypothesis**, not evidence that 322/2=161 genuine leads exist. In checked-in website source, `src/lib/analytics.ts` selects **one** `gtag('config', measurementId)` target per runtime, and exactly three forms call `trackGenerateLead`; code-level inspection alone cannot rule out a second tag integration, forwarding or independent web stream activity. **Before any GA4 conversion reporting decision**, obtain `generate_lead` daily counts **by Stream name / Stream ID** and check whether hits are mirrored 1:1 per day; verify network `tid` for a single approved synthetic stage submission and match `submission_id` where available. Keep the production release held until duplicate attribution is understood.

**Next proof gates:** (1) in GA4 Explore, filter `event_name=generate_lead` and break down by **stream name / form_name** if registered as a custom dimension, preserving date range; (2) inspect both web stream URLs and Measurement IDs before attributing double sends; (3) compare synthetic non-production `submission_id` emissions with a single persisted Firestore lead in an approved staging test and reconcile production aggregated lead counts with admin read-only permission; (4) annotate cutover date in GA4 reports and do not retroactively treat old `funnel_demo_booking_complete` as bookings.

