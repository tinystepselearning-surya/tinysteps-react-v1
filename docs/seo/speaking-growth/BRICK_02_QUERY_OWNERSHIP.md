# Brick 02 — Speaking Search Intent & Keyword Ownership Map

Build date: 2026-09-19 IST  
Branch: feature/speaking-seo-geo-growth  
GSC window: 2026-06-19 through 2026-09-16  
GSC settled through: 2026-09-16  
Status: COMPLETE — ownership frozen; no production SEO behavior changed.

## 1. Purpose

Brick 2 converts the Brick 1 baseline into one enforceable search-intent map.

The goal is not to create more landing pages. The goal is to ensure every material Speaking-admission query family has exactly one primary Tiny Steps owner, with supporting pages explicitly prevented from becoming competing commercial owners.

Brick 2 makes no redirect, canonical, robots, sitemap, page-copy, schema, route, pricing, curriculum, lead-flow or deployment change.

## 2. Evidence used

Brick 2 combines four evidence classes:

1. Exact 90-day Google Search Console query/page data from 2026-06-19 through 2026-09-16.
2. The existing repository commercial ownership contract in src/lib/commercialC2KeywordOwnership.ts and src/lib/commercialC3OwnerPageAudit.ts.
3. Brick 1 URL/indexing evidence and protected semantic facts.
4. Current SERP spot checks on 2026-09-19 for public speaking, communication skills, spoken English and confidence-building class intent.

The GSC intent analysis used 199 privacy-thresholded query/page rows matching Speaking-related terms such as public speaking, spoken English, English speaking, communication, confidence, speech, storytelling, presentation, debate, personality and conversation.

The cluster totals below are heuristic groupings of those observed rows. They are directional evidence, not an estimate of all possible search demand.

## 3. Non-negotiable ownership principles

1. One commercial intent = one primary commercial owner.
2. /speaking owns generic Public Speaking and general Communication Skills commercial intent.
3. /spoken-english-classes-for-kids-online owns generic Spoken English and conversational-fluency commercial intent.
4. /confidence-building-program-kids is a narrow specialist owner only for explicit confidence-building programme/class intent.
5. Course-detail pages explain named levels; they do not compete for generic Public Speaking class searches.
6. Informational guides explain problems and skills; they do not become substitute programme pages.
7. Explicit price/cost intent belongs to /pricing.
8. Explicit demo/trial/assessment intent belongs to /book-demo.
9. Mixed/cross-skill English searches belong to the broad chooser /online-english-classes-for-kids rather than being forced into one subject.
10. No new city, "best", AI-prompt or query-variant landing page is authorized by Brick 2.
11. AI-style natural-language questions inherit the owner of the underlying human intent; they do not get separate AI pages.
12. Supporting pages may rank, but their metadata/internal links must not intentionally claim the primary commercial query of another owner.

## 4. Observed ownership health

| Intent cluster | Frozen owner | Observed impressions | Impressions on owner | Owner share |
|---|---|---:|---:|---:|
| Public Speaking commercial | /speaking | 760 | 382 | 50.3% |
| Public Speaking comparison/best | /speaking | 24 | 24 | 100% |
| Public Speaking geo/local variants | /speaking | 92 | 56 | 60.9% |
| Communication classes/skills | /speaking | 21 | 10 | 47.6% |
| Generic Spoken English | /spoken-english-classes-for-kids-online | 380 | 117 | 30.8% |
| Explicit Hyderabad Spoken English | /online-english-classes-hyderabad | 10 | 10 | 100% |
| Mixed phonics + speaking English | /online-english-classes-for-kids | 141 | 9 | 6.4% |

The low owner-share values are not interpreted as evidence that Tiny Steps needs more commercial pages. They show that existing pages are splitting or misrouting relevance.

## 5. Canonical ownership matrix

### S1 — Generic Public Speaking classes

Primary owner: **/speaking**  
Role: programme / admission page  
Priority: P1 for this project

Includes:
- public speaking classes for kids
- public speaking for kids
- online public speaking classes for kids
- public speaking course for kids
- public speaking courses for kids
- public speaking training for kids
- speech classes for kids
- live online public speaking training for kids
- age-qualified generic provider queries such as public speaking classes for 5/6/10 year olds

Supporting pages:
- /courses/public-speaking-foundations
- /courses/public-speaking-excellence
- /resources/speaking
- /shy-child-speaking-confidence
- /confidence-building-program-kids
- /spoken-english-classes-for-kids-online
- /class-samples
- /pricing
- /book-demo

Forbidden competing primary claimant:
- /public-speaking-communication-kids

Important rule: age wording alone does not transfer the generic provider query to a course-detail page. /speaking should route the child to the correct level after assessment.

### S2 — General Communication Skills classes

Primary owner: **/speaking**  
Role: same programme owner as Public Speaking

Includes:
- communication classes for kids
- communication skills classes for kids
- online communication classes for kids
- kids communication classes
- structured speaking / clear expression classes

Supporting:
- /confidence-building-program-kids for explicit confidence needs
- /spoken-english-classes-for-kids-online for conversational fluency
- /resources/speaking for informational learning

Forbidden primary claimant:
- /public-speaking-communication-kids

Observed collision: "communication classes for kids" produced 9 impressions and 1 click on the legacy page versus 2 impressions on /speaking, even though /speaking had the stronger average position for its appearances.

### S3 — "Best", comparison and provider-selection Public Speaking queries

Primary owner: **/speaking**

Includes:
- best public speaking classes for kids
- best online public speaking classes for kids
- best public speaking course for kids
- best public speaking classes for kids online

Observed evidence:
- 24 impressions in the classified sample
- 100% of those impressions were already on /speaking

Decision: **do not create a second "best public speaking classes" money page in Brick 2.**

A future neutral editorial guide about how parents can evaluate a Speaking programme may exist as support content, but it must hand commercial intent back to /speaking and must not claim the same primary provider keywords.

### S4 — Public Speaking geographic, country, city and "near me" variants

Primary commercial owner: **/speaking**

Includes:
- public speaking classes for kids online India
- online public speaking classes for kids India
- public speaking for kids in India
- public speaking classes for kids USA
- public speaking classes for kids Hyderabad
- public speaking classes for kids Bangalore
- public speaking classes for kids Chennai
- public speaking classes for kids near me

Decision:
- keep one global online Public Speaking owner;
- do not create city-by-city Public Speaking pages from this low-volume evidence;
- do not imply a physical centre where Tiny Steps is providing an online service.

Observed sample:
- 92 impressions
- 56 on /speaking
- 29 on the legacy public-speaking page
- 4 on /online-english-classes-hyderabad
- 3 on Foundations

Brick 3/4 should reduce leakage without manufacturing thin location pages.

### S5 — Basic / Foundations course-detail intent

Primary owner: **/courses/public-speaking-foundations**

Owns only explicit named-level/detail intent such as:
- Tiny Steps Public Speaking Foundations
- Basic Public Speaking programme
- Public Speaking Foundations curriculum
- Basic Speaking syllabus
- explicit requests for the Foundations lesson structure

It does **not** own:
- generic public speaking classes for kids
- generic 4/5/6/7-year-old provider searches
- public speaking classes near me

GSC returned no observed rows in the 90-day window for the explicit Foundations/Basic/curriculum/syllabus query set. Therefore Brick 2 preserves the course page as a detail owner rather than expanding its acquisition territory.

### S6 — Advanced / Excellence course-detail intent

Primary owner: **/courses/public-speaking-excellence**

Owns only explicit named-level/detail intent such as:
- Tiny Steps Public Speaking Excellence
- Advanced Public Speaking programme
- Advanced Public Speaking curriculum
- Excellence syllabus
- explicit requests for the Advanced lesson structure

It does not compete with /speaking for generic Public Speaking provider searches.

GSC returned no observed rows in the 90-day window for the explicit Advanced/Excellence/curriculum/syllabus query set.

### S7 — Generic Spoken English / English speaking / conversation classes

Primary owner: **/spoken-english-classes-for-kids-online**

Includes:
- spoken English classes for kids
- spoken English classes for kids online
- English speaking classes online for kids
- online spoken English classes for kids
- English speaking course for kids
- conversational English classes for kids
- fuller-sentence / conversational-fluency commercial intent

Supporting:
- /speaking when the need is presentation/public-speaking structure
- /grammar when the core gap is grammar mechanics
- /confidence-building-program-kids for explicit confidence programme intent
- /online-english-classes-for-kids for broad/cross-skill selection

Observed problem:
- 380 impressions in the classified generic Spoken-English sample
- only 117 impressions (30.8%) on the intended owner
- 230 impressions landed on /online-english-classes-hyderabad
- 20 impressions remained on the legacy /spoken-english-classes-for-kids redirect URL

This is a major Brick 5 relevance-reclamation problem, not justification for another Spoken-English page.

### S8 — Explicit Hyderabad Spoken English

Primary owner: **/online-english-classes-hyderabad**

Owns:
- spoken English classes in Hyderabad
- online spoken English classes in Hyderabad
- Hyderabad English classes for kids

Observed evidence:
- 10 classified explicit-Hyderabad Spoken-English impressions
- all 10 on the Hyderabad page

Boundary:
- the Hyderabad page is not allowed to become the global Spoken-English owner;
- it must not claim physical-centre/offline proximity if that is not the service offered.

Generic "near me" queries are treated as localized discovery signals rather than authorization for new location pages. The underlying global Spoken-English service remains /spoken-english-classes-for-kids-online, while Google may localize Hyderabad users to the Hyderabad support page.

### S9 — Explicit Confidence Building programme/classes

Primary owner: **/confidence-building-program-kids**

Owns only clear programme intent such as:
- confidence building classes for kids
- confidence building program for kids
- speaking confidence classes when the explicit product sought is confidence-building support

Supporting:
- /speaking
- /shy-child-speaking-confidence

Boundary:
- broad "communication classes" stays on /speaking;
- Spoken-English fluency stays on the Spoken-English owner;
- diagnostic "my child is shy/hesitant" questions stay informational until the underlying need is identified.

Brick 1 already recorded a Google noindex mismatch for this page. Brick 2 preserves ownership but does not assume the page is currently indexable in Google.

### S10 — Shy / hesitant child diagnostic intent

Informational owner: **/shy-child-speaking-confidence**

Examples:
- shy child does not speak
- child hesitates to speak in class
- how to help a shy child speak confidently
- child understands English but avoids speaking

Role:
- diagnose whether the problem is language production, confidence, grammar, or public-speaking structure;
- route to the correct commercial owner.

It is not a generic Public Speaking or Spoken-English commercial owner.

### S11 — Price, fees, cost and value

Primary owner: **/pricing**

Examples:
- public speaking classes fees
- spoken English classes fees
- public speaking course price
- English speaking classes cost
- 1:1 speaking class price

Supporting programme pages may display approved pricing previews, but /pricing owns explicit cross-programme price research.

Brick 2 does not create a dedicated Public Speaking fees page because current evidence does not justify another commercial owner.

### S12 — Demo, trial and assessment

Primary owner: **/book-demo**

Examples:
- free public speaking trial
- public speaking demo class
- free speaking assessment
- spoken English demo
- communication assessment

Programme pages support conversion but do not become separate demo-intent owners.

### S13 — Free learning/practice intent

Commercial owner: **NONE / HOLD**

Observed examples:
- free public speaking classes for kids
- public speaking online course free for kids

Observed sample: 5 impressions, all currently landing on /speaking.

Decision:
- Tiny Steps must not imply that the paid programme itself is free;
- "free trial/demo/assessment" goes to /book-demo;
- free practice/games/activity intent should be served by existing free resources such as /free-speaking-games-for-kids and /free-speaking-practice-game-for-kids;
- no new "free public speaking classes" page is authorized by Brick 2.

### S14 — Speaking skill informational intent

Owner: the closest existing editorial/resource page, not a commercial programme page.

Examples:
- debate topics/starters for kids
- storytelling teaching/practice
- visual aids
- presentation practice
- show-and-tell activities
- speaking games

Commercial handoff: /speaking

Important distinction:
- "presentation skills classes for kids" = commercial → /speaking
- "how to improve presentation skills" = informational → editorial/resource owner

### S15 — Mixed / cross-skill English selection

Primary owner: **/online-english-classes-for-kids**

Examples:
- phonics and spoken English classes for kids
- broad English programme that combines multiple skills
- parent unsure whether the child needs phonics, grammar, speaking or another pathway

Observed classified sample:
- 141 impressions
- only 9 impressions on the broad owner
- most impressions split across phonics comparison, /phonics, Hyderabad and home

This is broad-English architecture evidence. The Speaking project records it because mixed queries affect Speaking admissions, but it must not turn the Spoken-English or Public-Speaking page into a generic everything-English page.

### S16 — AI-style / conversational recommendation queries

No AI-specific owner page is created.

Rule: classify the underlying human need, then use the corresponding canonical owner.

Examples observed in GSC:
- "what online course helps a 6-year-old in jeddah move from memorizing english words to speaking complete sentences?"
  - underlying need: spoken output / sentence formation
  - primary commercial path: /spoken-english-classes-for-kids-online, with Grammar support when mechanics are the main gap
  - current GSC exposure: /courses
- "which online english class gives a child real-time pronunciation and sentence correction during speaking practice?"
  - underlying need: Spoken English / live correction
  - primary commercial path: /spoken-english-classes-for-kids-online
  - evidence/support path: /class-samples
  - current GSC exposure: /class-samples and /courses
- "recommended online english speaking courses for kids preparing for school oral assessments"
  - underlying need: Spoken English
  - primary owner: /spoken-english-classes-for-kids-online

Brick 12 will improve AI citation/answer extraction from the same owner architecture rather than creating prompt-shaped pages.

### S17 — Personality-development adjacent queries

Primary owner only when the request is clearly communication/speaking related: **/speaking**

Tiny Steps should not broaden the page into generic psychological/personality claims merely to chase "personality development" wording.

Observed sample is currently negligible.

## 6. High-confidence cannibalization / misrouting evidence

### C1 — Legacy Public Speaking page splits generic commercial signals

Query: "public speaking classes for kids"
- /speaking: 74 impressions, 1 click, avg position 21.93
- legacy page: 3 impressions, avg position 8.00

Query: "public speaking for kids"
- /speaking: 56 impressions, 1 click, avg position 20.14
- legacy page: 3 impressions, avg position 39.67

Query: "online public speaking courses for kids"
- legacy page: 73 impressions, avg position 48.93
- /speaking: 9 impressions, avg position 29.56

Query: "public speaking online course for beginners (kids focus)"
- legacy page: 230 impressions, avg position 32.35
- /speaking: 25 impressions, avg position 66.48

Query: "communication classes for kids"
- legacy page: 9 impressions, 1 click, avg position 17.22
- /speaking: 2 impressions, avg position 4.00

Conclusion: the two pages are not cleanly differentiated by user intent. Brick 3 should consolidate signals only after preserving the query evidence recorded here.

### C2 — Hyderabad page leaks into global Spoken-English intent

Query: "online spoken english classes for kids"
- /online-english-classes-hyderabad: 13 impressions, avg position 15.08
- canonical Spoken-English owner: 8 impressions, avg position 10.50
- legacy redirect URL: 1 impression, avg position 48

Query: "spoken english classes for kids near me"
- Hyderabad page: 33 impressions, avg position 10.15

Conclusion: explicit Hyderabad intent is healthy, but the Hyderabad page is also collecting non-Hyderabad generic Spoken-English demand. Brick 5 must sharpen global-vs-local ownership without destroying useful local visibility.

### C3 — Course-detail leakage is currently small

Query: "public speaking classes for kids near me"
- Foundations: 3 impressions, avg position 20.67
- /speaking: 1 impression, avg position 6.00

This is not enough evidence to turn Foundations into a generic acquisition owner. The course page remains a detail/support page.

## 7. Current SERP intent validation

Current search spot checks on 2026-09-19 confirm that these query families are commercially distinct:

- Generic Public Speaking searches commonly surface dedicated live-programme pages with free-trial/demo CTAs, structured outcomes and age/course positioning. Examples observed include PlanetSpark, Speaking Fever and Victory Fluent Forum.
- Generic Spoken English searches surface dedicated Spoken-English programme pages focused on conversation, sentence formation, pronunciation and live speaking practice. Examples observed include Spoken Mentor, Speaking Fever, PlanetSpark and Berlitz.
- Confidence-building queries can surface narrower specialist confidence programmes rather than only Public Speaking pages.

This supports keeping Public Speaking, Spoken English and explicit Confidence Building as distinct commercial intents while allowing strong internal handoffs between them.

## 8. Pages Brick 2 explicitly refuses to create

The following are **not authorized**:

- /best-public-speaking-classes-for-kids
- /public-speaking-classes-india
- separate Bangalore/Chennai/Goa/USA Public Speaking pages
- query-specific "near me" pages
- AI-prompt-shaped landing pages
- a second communication-skills commercial page
- another Spoken-English page
- a generic "free public speaking classes" page
- a Public Speaking fees page

A later brick may revisit a new URL only if fresh GSC/SERP/conversion evidence proves that a genuinely distinct intent cannot be served by the current owner architecture.

## 9. Internal-link ownership rules for later bricks

When later bricks edit content:

- commercial Public Speaking anchors → /speaking
- general Communication Skills anchors → /speaking
- generic Spoken English / English speaking anchors → /spoken-english-classes-for-kids-online
- explicit Hyderabad online-English anchors → /online-english-classes-hyderabad
- explicit confidence-building programme anchors → /confidence-building-program-kids
- price/fees anchors → /pricing
- free demo/assessment anchors → /book-demo
- Basic/Foundations named-course anchors → /courses/public-speaking-foundations
- Advanced/Excellence named-course anchors → /courses/public-speaking-excellence
- diagnostic shy-child anchors → /shy-child-speaking-confidence
- broad multi-skill English chooser anchors → /online-english-classes-for-kids
- informational speaking-skill anchors → the matching editorial/resource page

Legacy /public-speaking-communication-kids must not receive new primary commercial internal links.

## 10. Brick handoff

### Brick 3 receives
- the frozen rule that /public-speaking-communication-kids cannot remain a second generic commercial owner;
- exact high-risk overlap queries to protect during consolidation;
- the confidence-programme Google noindex mismatch from Brick 1;
- the generic Spoken-English leakage into the Hyderabad page;
- legacy redirect/internal-link cleanup targets.

### Brick 4 receives
- /speaking keyword territory:
  - generic Public Speaking
  - general Communication Skills
  - comparison/best
  - age-qualified generic provider intent
  - country/city/near-me online variants
  - personality-development adjacency only where clearly communication related.

### Brick 5 receives
- generic Spoken-English territory;
- local-vs-global leakage evidence;
- full-sentence / conversation / pronunciation / grammar-in-use intent boundaries.

### Brick 6 receives
- named Foundations and Excellence course-detail ownership;
- instruction that course pages must support, not cannibalize, /speaking.

### Brick 8 receives
- informational topic boundaries for debate, storytelling, presentations, visual aids, show-and-tell and speaking games.

### Brick 12 receives
- AI-style prompts must resolve to the same human-intent owner map.

## 11. Brick 2 exit gate

Brick 2 is complete when:

1. every material observed Speaking-admission query family has one frozen primary owner or an explicit HOLD;
2. generic Public Speaking and Communication both resolve to /speaking;
3. generic Spoken English resolves to /spoken-english-classes-for-kids-online;
4. explicit Hyderabad intent is separated from global Spoken-English intent;
5. explicit Confidence Building remains narrow and specialist;
6. course-detail pages are prevented from becoming generic acquisition owners;
7. price and demo intent route to their existing cross-programme owners;
8. informational and AI-style queries have explicit routing rules;
9. no duplicate/new commercial page is authorized from weak evidence;
10. no production runtime behavior changes in this brick.

With this map frozen, Brick 3 can safely perform technical consolidation without guessing which URL should own each query.
