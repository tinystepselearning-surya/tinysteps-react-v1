# Brick 05 — Spoken English Clear Territory

Build date: 2026-09-19 IST  
Branch: feature/speaking-seo-geo-growth  
Status: COMPLETE — structurally verified on branch; not deployed.

## 1. Purpose

Brick 5 strengthens `/spoken-english-classes-for-kids-online` as the single commercial owner for everyday Spoken English, English-speaking practice and conversational fluency.

It does not create a second Spoken-English page, a Hyderabad Spoken-English page, a near-me page, or a new formal course-level system.

## 2. Frozen owner boundary

Primary owner: `/spoken-english-classes-for-kids-online`

Owns:
- spoken English classes for kids;
- English speaking classes for kids;
- conversational English / everyday conversation;
- fuller spoken responses;
- vocabulary and grammar in use while speaking;
- conversational fluency;
- subject-qualified local modifiers such as Spoken English for Hyderabad.

Does not own:
- generic grammar-rule accuracy → `/grammar`;
- presentations, storytelling, show-and-tell, audience-facing communication → `/speaking`;
- specialist participation/comfort confidence → `/confidence-building-program-kids`;
- broad Hyderabad English selection → `/online-english-classes-hyderabad`;
- explicit price research → `/pricing`;
- demo/assessment intent → `/book-demo`.

## 3. GSC problem frozen before implementation

Exact window: 2026-06-19 through 2026-09-16.

Page baseline for the canonical owner:
- 2 clicks;
- 261 impressions;
- 0.77% CTR;
- average position 12.25.

For the observed Spoken-English family split into generic non-location, explicit Hyderabad and near-me subsets:

- total impressions: 386;
- canonical Spoken-English owner: 117 impressions (30.31%);
- Hyderabad broad-English page: 241 impressions (62.44%);
- old redirect URL: 20 impressions (5.18%);
- other pages: 8 impressions.

For generic non-location Spoken-English searches alone:
- 256 observed impressions;
- canonical owner: 117 (45.7%);
- Hyderabad page: 111 (43.36%);
- legacy redirect: 20 (7.81%).

This is a relevance-concentration problem, not a justification for another landing page.

## 4. Important query examples

`english speaking classes online for kids`
- canonical owner: 68 impressions, position 18.15;
- old redirect URL: 13 impressions, position 63.77;
- `/courses`: 3 impressions, position 37.67.

`spoken english classes for kids`
- Hyderabad page: 24 impressions, position 8.71;
- canonical owner: 5 impressions, position 9.20.

`online spoken english classes for kids`
- Hyderabad page: 13 impressions, position 15.08;
- canonical owner: 8 impressions, position 10.50;
- legacy redirect: 1 impression, position 48.

`spoken english classes for kids online`
- Hyderabad page: 5 impressions, position 7.20;
- canonical owner: 5 impressions, position 7.20.

An AI-style/oral-assessment query already reaches the canonical owner at position 2:
`recommended online english speaking courses for kids preparing for school oral assessments`.

## 5. Metadata and technical control

Brick 5 deliberately preserves:

Title:
`Spoken English Classes for Kids Online | Live 1:1 | Tiny Steps`

Description:
`Live 1:1 spoken English classes for kids in India and worldwide. Build fuller sentences, conversational fluency, grammar in use and speaking confidence in 35-minute classes.`

Canonical:
`/spoken-english-classes-for-kids-online`

Brick 5 changes no redirect, robots rule, sitemap entry or canonical.

## 6. Everyday-conversation practice flow added

Brick 5 adds a five-step practice flow without claiming these are formal Tiny Steps course levels:

1. give a fuller response;
2. build a useful spoken sentence;
3. add one relevant detail;
4. continue the exchange after a follow-up question;
5. use the same skill in a fresh everyday situation with less prompting.

This directly strengthens everyday conversational-fluency territory while keeping presentation/public-speaking progression separate.

## 7. Live correction/retry clarified

The page now explains a source-supported responsive teaching loop:

1. child attempts the idea;
2. teacher chooses one useful current target rather than interrupting every possible error;
3. child retries;
4. a fresh speaking turn checks transfer with less help.

The page links to `/class-samples` for observable teaching style and `/book-demo` for child-specific placement.

## 8. Programme boundaries strengthened

The existing programme chooser remains and is now supported by a stronger owner definition:

- Spoken English → everyday conversation, fuller responses, fluency;
- Grammar → sentence/rule accuracy when mechanics are the main barrier;
- Public Speaking → storytelling, presentations, show-and-tell and audience communication;
- Confidence Building → willingness, participation comfort and independence when language is adequate.

One FAQ phrase was narrowed from `confidence practice` to `low-pressure response practice` so the Spoken-English page does not absorb specialist confidence territory.

## 9. Hyderabad boundary

Brick 5 adds a parent-facing section explaining that Hyderabad families who specifically need Spoken English use the same canonical Spoken-English programme.

The broad Hyderabad page remains the chooser when the family does not yet know whether the child needs phonics, reading, grammar, writing, Spoken English or Public Speaking.

No Hyderabad Spoken-English landing page was created.

Machine-readable protection was also added:

`/online-english-classes-hyderabad` → `/spoken-english-classes-for-kids-online`

as a `programme-fit-handoff` in `commercialC6InternalCommercialPaths.ts`.

The C6 audit now requires that direct subject-owner handoff.

## 10. Near-me handling

120 observed near-me Spoken-English impressions currently land on the Hyderabad page.

Brick 5 does not interpret that as permission to create near-me pages. Near-me is treated as localized discovery. The local chooser is preserved while the subject-qualified programme owner is strengthened and explicitly linked.

## 11. Observable progress

The page now tells parents to look for:
- longer relevant everyday responses;
- less prompting;
- more useful vocabulary in spontaneous speech;
- better grammar transfer while speaking;
- ability to answer follow-up questions;
- transfer to a fresh conversation.

This is an observable-progress preview only. Brick 7 will define the formal Tiny Steps Speaking Progress Framework.

## 12. Public-fact consistency

Hard-coded `5000+ students served` / `Families in 15+ countries` wording was replaced with the central public-facts source:

- `PUBLIC_SITE_FACTS.learnerReach.learnersLabel`;
- `PUBLIC_SITE_FACTS.learnerReach.countriesLabel`;
- `PUBLIC_LEARNER_REACH_LABEL`.

This keeps the page aligned with the repository's semantic facts.

## 13. Market-direction check

A current category review confirms that large Spoken-English competitors commonly emphasise live personal practice, real conversation, sentence/grammar use, feedback and free trial/demo entry. Brick 5 uses that only as directional market context; Tiny Steps implementation is grounded in its own existing live-class, assessment and correction principles.

## 14. Regression protection

New test:
`src/tests/seo/speakingGrowthBrick5.spec.ts`

It protects:
- frozen title/description/canonical;
- everyday conversation ownership;
- practice-flow language;
- Public Speaking/Grammar/Confidence handoffs;
- no legacy Spoken-English URL link;
- correction/retry boundaries;
- class-sample path;
- Hyderabad broad-chooser vs subject-owner distinction;
- central learner-reach facts;
- observable progress;
- assessment-first conversion.

The existing C6 audit was also strengthened to require the Hyderabad → Spoken English handoff.

## 15. What Brick 5 did not change

- new commercial URLs: ZERO;
- new city pages: ZERO;
- near-me pages: ZERO;
- metadata changes: ZERO;
- canonical changes: ZERO;
- canonical-owner redirect destination changes: ZERO; an explicit trailing-slash legacy alias was added during re-audit;
- sitemap changes: ZERO;
- pricing changes: ZERO;
- formal Spoken-English course levels: ZERO;
- production deployment: ZERO.

## 16. Brick 5 exit gate

Brick 5 is complete on the isolated feature branch when:
1. the canonical Spoken-English owner remains unchanged;
2. everyday conversation and conversational fluency are unmistakable;
3. fuller-response practice is explicit without claiming Public Speaking presentation territory;
4. Grammar and Confidence boundaries remain visible;
5. Hyderabad subject-qualified intent points to the Spoken-English owner while the local broad chooser remains intact;
6. near-me leakage does not trigger thin location-page creation;
7. live correction/retry is explained using existing Tiny Steps teaching principles;
8. parents can see observable progress signals;
9. learner-reach claims come from central semantic facts;
10. dedicated regression guards are committed.

All ten conditions are satisfied structurally on the feature branch.


## 17. 2026-09-19 pre-Brick-6 re-audit

Brick 5 was fully re-audited before opening Brick 6.

### A. Assessment CTA wording corrected

The first Brick 5 pass used `Book a Free Speaking Assessment` and a `Free speaking assessment` trust chip.

That wording was too ambiguous on a Spoken-English owner because the destination `/book-demo` is the cross-programme English assessment owner and may recommend Spoken English, Grammar, Public Speaking or another path.

The page now uses:
- `Book a Free English Assessment`;
- `Free English assessment`.

The destination remains `/book-demo`; no conversion-owner change was made.

### B. Protected diagnostic intents separated from commercial intent

The page previously used two FAQ questions that closely echoed protected informational owners:

- `child understands English but does not speak`;
- `child gives one-word answers`.

Those editorial intents remain owned by:
- `/blog/child-understands-english-but-does-not-speak`;
- `/blog/child-gives-one-word-answers`.

Brick 5 now frames the FAQ questions as commercial-fit questions instead of broad diagnostic questions, and the page directly links parents to both diagnostic articles when they need to understand the learning problem before choosing classes.

This preserves:
- commercial programme intent on `/spoken-english-classes-for-kids-online`;
- problem-diagnosis intent on the protected editorial owners.

### C. Legacy Spoken-English redirect hardened

The existing legacy alias already had:

`/spoken-english-classes-for-kids -> /spoken-english-classes-for-kids-online (301)`

The re-audit found that the trailing-slash variant was not explicitly represented across the same layers.

Brick 5 now guarantees both:

- `/spoken-english-classes-for-kids -> /spoken-english-classes-for-kids-online (301)`;
- `/spoken-english-classes-for-kids/ -> /spoken-english-classes-for-kids-online (301)`.

Both SPA fallback variants also resolve to the canonical owner.

The SEO smoke now forbids both retired variants from sitemap discovery, and central SEO infrastructure tests assert both 301 contracts.

### D. C6 compatibility verified

The added Hyderabad → Spoken-English programme-fit edge stays inside the existing 14-owner commercial architecture.

The pre-existing C6 test does not assert an exact total edge count; it asserts:
- 14 owners remain frozen;
- 13 direct assessment edges remain intact;
- every edge stays inside existing commercial owners;
- source links actually exist.

Therefore the added programme-fit edge does not violate the C6 owner or conversion contract.

### E. Structured-data handoff remains Brick 6

The Spoken-English page continues to emit semantic `Course` markup through the existing shared schema helper.

Current Google Course-list eligibility requires at least three courses plus the relevant list/carousel structure. Brick 5 does not invent a three-level Spoken-English programme simply to target that enhancement.

Brick 6 must review the wider programme architecture and schema deliberately.

### F. Re-audit decision

Brick 5 is **COMPLETE — RE-AUDITED** on the isolated feature branch.

The re-audit strengthened:
- conversion wording;
- commercial-vs-diagnostic intent separation;
- legacy redirect completeness;
- sitemap regression protection;
- central SEO infrastructure coverage.

No new commercial URL, city page, near-me page, canonical owner or production deployment was introduced.
