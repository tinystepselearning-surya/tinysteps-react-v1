# Grammar / Sentence Formation — India search-demand pilot (pre-launch; NO SPEND)

**Date:** 1 November 2026 | **Owner:** Tiny Steps | **Tracking:** #845, #853 | **Status:** proposed, not activated.

## Commercial hypothesis and evidence

The existing `/grammar` page is Google's indexed/self-canonical commercial owner and already describes live teacher-led Grammar and sentence formation, Beginner/Advanced placement, free 35-minute demo assessment, 1:1 format and separately conditional small groups. The Parents Hub routing correction #866 was deployed 1 Nov. There is no confirmed indexing/title/canonical defect.

Connected domain Google Search Console **India page-level** `/grammar` impressions/clicks: July 2026 **26/1**, August **25/0**, September **8/0**, October 1–29 **18/0**. July–Oct totals **77/1**. For `online grammar classes for kids` India, Google disclosed only **4 impressions / 0 clicks** Oct 2–29, conditional average position 1 (too small for visibility confidence). This is not Google Ads demand nor a forecast. Earlier Semrush's ~720/month `online english grammar classes` had informational/adult ambiguity; do not treat as qualified child-parent volume.

**Marketing-account limitation:** Connected Windsor.ai source is **Search Console only**; no Google Ads account, spend, CPC, auction volume or conversion-import settings are available here. Account approval, payment/budget and actual search-volume forecasts remain owner decisions; no ads can be launched from this plan.

## Proposed campaign (never auto-enable)

- Name: `TS_IN_Search_Grammar_ParentIntent_Pilot_202611`.
- Goal: **new genuine parent enquiries** for online teacher-led Grammar classes, **not** downloads, free-game visitors, form views or WhatsApp window openings.
- Network: Google Search only to start; no Display expansion, Performance Max, remarketing or search partners in the first controlled stage.
- Geography: India, **people physically in / regularly in targeted location** rather than people merely interested in India; verify actual Google Ads UI option. Language: English. Messaging directed to **parents**, not children; no age targeting or personalised remarketing to minors.
- Default landing: `https://tinystepslearning.com/grammar?utm_source=google&utm_medium=cpc&utm_campaign=ts_grammar_search_pilot_202611&utm_content=grammar_parent_v1`; enable Google Ads auto-tagging so a real `gclid` is preserved when available.
- Manual CPC/Maximize Clicks **with an owner-approved bid cap** for exploration only if reliable qualified-lead conversion volume is unavailable. Do not claim efficient smart bidding without validated conversion feedback.
- **Daily campaign budget and total experiment spend: NOT SET.** Owner must explicitly approve a hard cap and pause authority before publishing. Do not infer CPC, cost per lead, or expected volume from organic GSC.

### Ad group A — online Grammar, exact-only initial candidate list

```text
[online grammar classes for kids]
[grammar classes for kids online]
[online english grammar classes for kids]
[online grammar tutor for kids]
[grammar classes for kids in india]
```

### Ad group B — sentence formation, exact-only exploratory candidates

```text
[sentence formation classes for kids]
[online sentence formation classes for kids]
[english sentence building classes for kids]
```

Terms have not all been verified for meaningful Google Ads India search volume. **Exact match still covers close meaning/intent variants**; review the actual Search Terms report and exclude irrelevant traffic. Do not add broad child-unspecified `grammar classes`, `english grammar classes online`, `online grammar classes`, `sentence making`, or `grammar games` until real search-term quality and lead evidence support expansion.

### Campaign-level exclusions — review carefully before use

```text
"free worksheets"
"grammar worksheet"
"grammar worksheets"
"free grammar games"
"free sentence games"
"download pdf"
"grammar pdf"
"answer key"
"homework answers"
"teacher vacancy"
"teaching jobs"
"lesson plan"
"lesson plans"
"grammar exam"
"hindi grammar"
```

These are initial **negative phrase-match suggestions**, not an account-wide blind exclusion. Do **not** negative-match the word `free` on its own: Tiny Steps legitimately offers a **free demo assessment**, and such searches may have purchase intent. Do not indiscriminately exclude `near me` or `tuition`; assess whether a parent is looking for online rather than offline provision. Google negative keywords do not expand to every close variant, so inspect actual wasteful queries and variants.

## Proposed responsive search ad text (pre-launch copy, not published)

**Candidate headlines (all 30 characters or fewer):**

- Online Grammar for Kids
- Build Real English Sentences
- Live 1:1 Grammar Classes
- Grammar Help for Ages 5–12
- Sentence Formation for Kids
- Free 35-Minute Assessment
- Grammar & Sentence Building
- English Grammar for Children
- Online Classes With Teachers
- Correct Word Order & Tenses

**Candidate descriptions (all 90 characters or fewer):**

- Live 1:1 online Grammar classes. Build better sentences through guided practice.
- For children ages 5–12. Start with a free 35-minute demo assessment.
- Grammar, word order, tenses and punctuation. Clear level-based teaching and feedback.
- Explore online Grammar for kids in India. Review levels and fees before joining.

Only approved claims; no fabricated testimonials, tutor certifications, guaranteed class availability, outcome promises, or claimed school-board accreditation. Final assets must be approved against the live price, class duration, age placement and Google Ads policies before uploading.

## Conversion measurement / lead accounting: HARD LAUNCH GATE

Source inspection, 1 Nov 2026:
- `src/lib/leadAttribution.ts` stores first-touch landing and click/UTM data in the session; `src/lib/leadAcquisition.ts` classifies `utm_source=google + utm_medium=cpc` or `gclid` as `google_ads`.
- `src/lib/publicLeadForm.ts` creates only allowed anonymous lead fields; it retains UTM fields in `attribution`, while the server enrichment stores privileged `gclid`, `landingPage=/grammar`, `conversionPage=/book-demo` and acquisition channel.
- `src/components/forms/PublicAssessmentForm.tsx` sends `generate_lead` **after successful Firestore lead save**, then opens/prefills WhatsApp. **A WhatsApp link open is not a confirmed send or booked demo.** Enrichment is a separate asynchronous call and can fail.
- Added **synthetic browser + isolated demo-Firestore emulator tests** for a paid Grammar landing via `gclid` and a CPC-only UTM fallback, both through the booking conversion and server persistence. Tests do not create live leads or prove a Google Ads conversion import.
- Before spend, verify in the actual Google Ads + GA4 account that the **primary lead conversion fires once per genuinely saved new-parent enquiry**, not on clicks, retries, page views or WhatsApp opens; verify consent handling, deduplication and conversion source without customer PII in analytics. A deduplicated saved lead may still need a trusted contact-validation step to count as **qualified**.
- Track: spend; clicks; relevant parent-intent search terms; saved form enquiries (and failures separately); valid new-parent phone-deduped leads; class-fit; qualified lead count; cost per **qualified** enquiry. Report demo requested/booked separately, not as conversions or admissions.

## Stop/go and scope

**No launch until:** (1) owner approves geography, actual campaign budget/total cap and account; (2) Google Ads keyword volumes, forecast CPC and negative exclusions are reviewed in account; (3) production consent, lead save and Ads conversion counting verified *read-only* / staging without synthetic production leads; (4) paid source persistence tests pass; (5) one person owns manual daily search-term/lead-quality reviews. No connected Ads account today.

Review first search-term quality every day; compare performance only after enough genuine eligible clicks and leads to be meaningful. **Pause immediately** on incorrect landing, missing conversion data, sudden invalid leads, or spend-cap breach. No invented guaranteed lead quantity, CPL or fixed ROI. Any expansion beyond exact match requires explicit approval.

**Out of scope:** No PR #858 changes; no meta-title/canonical/schema edits; no redirects/new landing pages; no production form, lead, ads-budget or Firebase writes in this project. Keywords and creative remain proposal-only.

Sources: Tiny Steps connected India GSC observed data through 29 Oct 2026 and current repo source; [Google Ads keyword matching](https://support.google.com/google-ads/answer/7478529), [Google Ads negative keywords](https://support.google.com/google-ads/answer/2453972), [Google Ads search terms](https://support.google.com/google-ads/answer/2472708).
