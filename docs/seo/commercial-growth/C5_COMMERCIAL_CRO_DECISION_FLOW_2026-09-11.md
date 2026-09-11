# C5 — Commercial CRO & Decision Flow

**Revision:** 2026-09-11-c5-r1  
**Status:** decision-flow-implemented  
**Primary business KPI:** qualified organic leads per day  
**Commercial goal:** move from ~6–7 qualified organic leads/day toward a sustained 11–12/day without weakening C1–C4 ownership, facts or measurement.

## 1. Why C5 exists

C4 improves the search-result click opportunity. C5 starts after the click.

The parent now has to answer a small number of commercial questions:

1. Is this the right programme or specialist path for my child?
2. If I am comparing options, what should I compare?
3. What does the relevant class format cost?
4. Is Tiny Steps available for my location / family situation?
5. What is the next low-friction step if I am interested?

C5 makes those questions a measurable decision system instead of treating every commercial page as an isolated landing page.

## 2. Constraint: protect the C4 control window

C4 started a fresh post-C3 observation period on 11 September 2026. C5 therefore **does not rewrite titles, descriptions, H1s or broad commercial body copy during that control window**.

C5 adds decision-flow governance and measurement around the already-implemented C3 commercial pages. This avoids contaminating the C4 control period with unnecessary page-copy churn.

C5 explicitly forbids:

- new commercial URLs;
- C2 ownership changes;
- C3 commercial-fact drift;
- C4 title or meta-description mutation;
- direct payment as the primary next step from a commercial owner;
- counting CTA or form events as qualified leads.

## 3. One conversion owner

`/book-demo` remains the single transactional owner for free demo / assessment / trial intent.

All 13 other commercial owner pages keep a direct path to `/book-demo`.

The primary conversion promise remains the canonical Tiny Steps offer:

- one free live 1:1 assessment per child;
- 35 minutes;
- assessment-first programme / starting-point recommendation;
- India and worldwide, subject to compatible timings.

No second demo, assessment, trial or payment owner is created.

## 4. The 14-owner decision map

| Owner | Decision stage | Parent question | Primary next step | Secondary decision paths |
|---|---|---|---|---|
| `/phonics` | Programme fit | Does the child need phonics and where should they start? | `/book-demo` | comparison, phonics fees, pricing |
| `/best-online-phonics-classes-for-kids-in-india` | Provider comparison | Which class format/provider approach fits best? | `/book-demo` | phonics, phonics fees, pricing |
| `/phonics-fees-india` | Price evaluation | What should phonics cost and what does Tiny Steps charge? | `/book-demo` | phonics, pricing |
| `/reading-classes-for-kids` | Programme fit | Broad reading support or narrower fluency support? | `/book-demo` | fluency, pricing |
| `/reading-fluency-program` | Specialist fit | Is decoding secure but connected reading still slow/hesitant? | `/book-demo` | reading, pricing |
| `/grammar` | Programme fit | Is grammar/sentence accuracy the main need? | `/book-demo` | writing, pricing |
| `/writing-classes-for-kids` | Programme fit | Does the child need idea/paragraph/story writing development? | `/book-demo` | grammar, pricing |
| `/spoken-english-classes-for-kids-online` | Programme fit | Is everyday conversational fluency the goal? | `/book-demo` | speaking, pricing |
| `/speaking` | Programme fit | Is public speaking / presentation / communication the need? | `/book-demo` | spoken English, confidence, pricing |
| `/confidence-building-program-kids` | Specialist fit | Is speaking comfort / participation confidence the barrier? | `/book-demo` | speaking, pricing |
| `/online-english-classes-for-kids` | Programme fit | Which English programme fits the child? | `/book-demo` | specialist programme owners, pricing |
| `/online-english-classes-hyderabad` | Local fit | Can Hyderabad families use the same online programme flow? | `/book-demo` | broad English, pricing |
| `/pricing` | Price evaluation | Which format offers the right fit/value? | `/book-demo` | broad English / programme owners |
| `/book-demo` | Conversion | What does the child need and where should they start? | assessment form submission | pricing, broad English |

## 5. New C5 measurement layer

C5 adds two diagnostic events across all 14 commercial owners:

### `commercial_owner_view`

Recorded once per commercial-owner route visit. It includes:

- canonical owner path;
- decision stage;
- C2 owner role(s);
- C2 cluster id(s);
- owner priority;
- primary next-step type;
- first-touch attribution fields already used by the existing funnel.

### `commercial_decision_click`

Recorded only when a click represents a commercial decision, such as:

- assessment / demo;
- pricing;
- programme-owner handoff;
- comparison-owner handoff;
- WhatsApp / phone / email / contact support.

Ordinary educational navigation, such as a curriculum link or same-page anchor, is not promoted into a C5 decision event.

The event also records alignment:

- `primary` — the page's intended primary next step;
- `secondary` — an approved decision-support handoff;
- `supporting-contact` — WhatsApp / phone / email / contact;
- `off-contract` — a commercial-owner destination that is not part of that owner's declared decision path.

This makes funnel leakage visible without blocking normal navigation.

## 6. Existing funnel events remain intact

C5 does not replace the existing analytics contract. It layers on top of:

- `funnel_landing_page_view`;
- `funnel_cta_click`;
- `program_cta_click`;
- `pricing_cta_click`;
- `lead_form_view`;
- `funnel_form_start`;
- `funnel_form_submit`;
- `generate_lead`;
- `funnel_demo_booking_complete`;
- WhatsApp / phone / email events.

C5 also extends the measured landing-page condition to all C5 commercial owners. This closes the previous gap where the Hyderabad commercial owner was not guaranteed to enter the generic funnel-landed-page measurement through the high-intent route map.

## 7. Qualified-lead truth does not change

C5 events are **diagnostic**, not revenue truth.

The primary KPI remains C0:

> **Qualified organic lead = distinct canonical lead record in a qualifying lifecycle status + stored first-touch organic-search attribution.**

A CTA click, WhatsApp click, form start or form submission must not be reported as a qualified lead by itself.

## 8. Route-view dedupe correction

The global conversion tracker previously remembered the last funnel landing path indefinitely. A visitor could leave a commercial page and later return to the same route without generating a new landing observation.

C5 changes the dedupe window so leaving the measured landing surface resets that route-view key. A genuine later return becomes a new measured route visit while duplicate effects on the same route remain suppressed.

## 9. Source-level conversion guard

The C5 audit checks the actual C3 source files, not only the C5 configuration.

It requires:

- exactly 14 commercial owner source files;
- a direct `/book-demo` path on all 13 pre-conversion owners;
- `PublicAssessmentForm` and the `assessment-form` surface on `/book-demo`;
- the assessment form to retain view/start/submit/generate-lead/demo-complete tracking;
- C0, C2, C3 and C4 prerequisite statuses to remain intact.

## 10. What C5 intentionally does not do yet

C5 does **not** blindly rewrite hero copy, button text, page sections or proof ordering while C4 is gathering clean post-C3 search evidence.

After C5 has decision-flow data, later conversion work can answer questions such as:

- which owner pages send the highest proportion of visitors to assessment;
- where parents divert into pricing before assessment;
- which programme handoffs are useful versus distracting;
- whether a page has high CTA activity but weak qualified-lead quality;
- where mobile visitors start but fail to complete the assessment form.

Those decisions should be evidence-led and should preserve the C2 ownership and C3 fact contracts.

## 11. Files

- `src/lib/commercialC5ConversionFlow.ts`
- `src/lib/commercialC5Tracking.ts`
- `src/components/common/ConversionTracker.tsx`
- `src/tests/seo/commercialC5ConversionFlow.spec.ts`
- `scripts/audit-commercial-c5-conversion-flow.mjs`
- `.github/workflows/commercial-c5-cro-decision-flow.yml`

## 12. C5 completion condition

C5-R1 is engineering-complete when:

1. all 14 C3 owner paths are represented exactly once;
2. every C2 cluster resolves to one of those owners;
3. 13 pre-conversion owners keep `/book-demo` as the primary conversion destination;
4. `/book-demo` remains the single assessment submission owner;
5. commercial owner views and meaningful decision clicks are measured;
6. the assessment form retains its existing lead instrumentation;
7. C0–C4 audits, typecheck, repository tests, build/prerender and SEO smoke all pass.

C5 does not need to wait for the C4 CTR observation window to finish because it does not alter the C4 control snippets or broad commercial search copy.
