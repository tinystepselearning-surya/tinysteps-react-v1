# C6-R1 — Evidence Validation + Buyer Intent Architecture

**Date:** 11 September 2026  
**Status:** architecture validated on the C6 branch  
**Branch:** `seo/c6-r0-buyer-intent-audit`

## Mission

Turn C6-R0's buyer-intent inventory into an implementation architecture before changing live commercial pages.

R1 asks:

1. Which comparison and fee query families have enough evidence to deserve stronger treatment?
2. Does that treatment belong inside an existing C2 owner or require a new owner?
3. Which existing owner, if any, is safe to change during the active C4 observation window?

## Evidence used

R1 uses the already-built C1/C2 corpus plus a live SERP spot check on 11 September 2026.

The spot check was directional validation only. It does **not** replace authenticated GSC query data and does not create new ownership by itself.

### Live SERP patterns checked

- `best online public speaking classes for kids India`
  - comparison/listicle surfaces are present;
  - examples observed included current public-speaking buyer guides from Speaking Fever and TalkMaze;
  - conclusion: comparison language is real, but `/speaking` already contains a substantial parent comparison section, so a second Tiny Steps comparison URL is not justified.

- `best online grammar classes for kids India`
  - the Tiny Steps `/grammar` programme owner is already a direct commercial result;
  - the spot check did not establish a stronger separate comparison architecture than the programme owner;
  - conclusion: hold the existing owner, no new best-grammar URL.

- `spoken English classes for kids fees India` / `public speaking classes for kids fees India`
  - provider surfaces commonly answer fees inside programme/buyer pages;
  - conclusion: subject-fee information can be supported through the existing `/pricing` owner without creating separate fee URLs.

- `1 to 1 vs group online English classes for kids`
  - current buyer guides compare teacher attention, participation, child fit, class size and cost/value;
  - conclusion: this is a cross-programme pricing/value decision and belongs on `/pricing`.

### Reference pages from the spot check

- https://speakingfever.com/top-public-speaking-courses-for-kids-india/
- https://talkmaze.com/best/best-online-public-speaking-classes-for-kids
- https://outschool.com/articles/best-online-english-classes-for-kids
- https://outschool.com/articles/group-classes-vs-1-1-tutoring
- https://www.stayeng.com/en/blog/one-to-one-vs-group-english-lessons-for-children/
- https://tinystepslearning.com/blog/online-english-classes-for-kids-india

---

# R1 architecture decisions

## 1. Phonics comparison

**Owner:** `/best-online-phonics-classes-for-kids-in-india`  
**Action:** KEEP DEDICATED OWNER  
**R2 change:** none needed

Why:

- C1 has observed SERP evidence for the explicit `best` query family;
- C2 already gives it dedicated comparison ownership;
- the page already has child-fit gates, format comparison, provider scorecard, demo questions, red flags, fee handoff and assessment CTA.

This is the benchmark comparison owner, not a template to clone into every subject.

---

## 2. Public speaking comparison

**Owner:** `/speaking`  
**Action:** EMBED IN EXISTING OWNER  
**R2 change:** none needed

Why:

- comparison language is visible in the live SERP;
- C1 also contains public-speaking comparison research;
- `/speaking` already has a section titled `What parents should compare before choosing public speaking classes` with concrete selection criteria.

Creating `/best-public-speaking-classes-*` would add ownership pressure without solving a missing parent decision.

---

## 3. Broad English / tutor comparison

**Owner:** `/online-english-classes-for-kids`  
**Action:** EMBED IN EXISTING OWNER / SUPPORT WITH DECISION GUIDE  
**R2 change:** none needed

The broad owner plus the existing parent decision guide already covers programme need, class format, feedback and child fit. R1 does not authorize a competing `best online English classes` URL.

---

## 4. Grammar / writing comparison

**Owner:** `/grammar` for generic grammar; `/writing-classes-for-kids` remains the writing programme owner  
**Action:** HOLD EXISTING OWNERS  
**R2 change:** none

The comparison evidence is weaker than phonics/public speaking and does not justify either a new owner or deliberate `best/comparison` body-copy expansion in R2.

---

## 5. Phonics fee research

**Owner:** `/phonics-fees-india`  
**Action:** KEEP DEDICATED OWNER  
**R2 change:** none needed

It remains materially differentiated through its live 1:1/group market benchmark and research method.

---

## 6. Non-phonics subject fees

**Owner:** `/pricing`  
**Action:** CONSOLIDATE TO PRICING  
**R2 change:** APPROVED

C1 already contains subject-fee rows for:

- reading
- grammar
- writing
- spoken English
- public speaking

Writing, spoken-English and public-speaking fee phrases have observed SERP evidence in C1; reading and grammar remain weaker/hypothesis-led. C2 deliberately assigns all of them to `/pricing`.

### R2 implementation authorised

Add **subject-aware fee/value navigation inside `/pricing`** so a parent arriving with a subject-specific fee question can:

1. see the standard pricing model without inventing programme-specific rates;
2. understand that programme fit and price are separate decisions;
3. move to the correct programme owner for curriculum/fit;
4. move to `/book-demo` for assessment;
5. use `/phonics-fees-india` only when the query is specifically phonics fee research.

No new fee URL is authorised.

---

## 7. 1:1 vs small-group value comparison

**Owner:** `/pricing`  
**Action:** CONSOLIDATE TO PRICING  
**R2 change:** APPROVED

The live SERP pattern and existing Tiny Steps pricing architecture both support this as a cross-programme value decision. `/pricing` already contains the core comparison; R2 may make the programme/subject handoff clearer.

---

## 8. Post-demo enrolment support

**Conversion owner:** `/book-demo` remains unchanged  
**Action:** LATER C6 BRICK

C1 contains enrolment-stage parent questions, but R2 will not expand into post-demo objections or enrolment copy. That work remains isolated for a later C6 brick so the fee/value implementation stays measurable and C5 conversion ownership remains clean.

---

# R2 approval gate

R1 authorises exactly **one live commercial owner for C6-R2 body-copy changes:**

> `/pricing`

R2 may add subject-aware fee/value navigation and improve format/value decision support.

R2 may **not** change:

- `/pricing` title
- `/pricing` meta description
- `/pricing` canonical
- any C4-controlled title/description
- C2 ownership
- `/book-demo` conversion ownership
- commercial URL inventory

No other owner page is approved for R2 body-copy change at this stage.

---

# R1 conclusion

The validated architecture is:

- **Phonics comparison:** dedicated comparison owner stays
- **Public speaking comparison:** existing `/speaking` owner is sufficient
- **Broad English/tutor comparison:** existing broad owner + decision guide
- **Grammar/writing comparison:** hold existing owners
- **Phonics fee research:** dedicated owner stays
- **All other subject fees:** `/pricing`
- **1:1 vs group value:** `/pricing`
- **Conversion:** `/book-demo`

Therefore R1 authorises **no new URLs** and approves **only `/pricing`** for C6-R2 implementation.
