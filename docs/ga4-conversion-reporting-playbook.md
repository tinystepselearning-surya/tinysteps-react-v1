# Tiny Steps GA4 Conversion Reporting Playbook (Step 10)

Last updated: 2026-04-05

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
- Successful lead form completion (true conversion event for forms).

Use it to answer:
- Which pages/components convert intent into completed leads?

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
