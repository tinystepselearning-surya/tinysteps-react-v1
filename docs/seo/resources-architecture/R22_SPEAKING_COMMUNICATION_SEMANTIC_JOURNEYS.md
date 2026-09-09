# R22 — Speaking & Communication Semantic Journeys

Revision: `2026-09-10-r22`

## Scope

R22 finishes the Speaking & Communication knowledge architecture by connecting the three R21 parent guides with substantial existing speaking resources through the established `BlogSemanticPathway` system.

This is an **additive semantic-linking brick**. It creates no article, route, redirect, canonical transfer, programme page or taxonomy page.

R22 follows the same discipline used for Reading and Grammar/Writing:

- preserve strong existing content;
- name established owners only when an explicit topic ID is useful for the graph;
- connect pages by learning relationship rather than publication date or keyword similarity;
- keep the visible pathway concise;
- keep conversion links outside the educational pathway UI;
- preserve every unaffected upstream semantic journey exactly.

## Non-rigid communication model

The graph is not a claim that every child must move through one fixed ladder.

Speaking performance can differ by listener, setting, topic, language, familiarity, confidence and task demand. A child may therefore enter at conversation, response expansion, storytelling, speech organisation, delivery, discussion or feedback depending on the observed need.

The graph deliberately avoids defining good communication as:

- speaking loudly;
- being extroverted;
- using one preferred accent;
- maintaining constant eye contact;
- performing theatrically;
- producing longer answers regardless of relevance.

## Seven established owners named in R22

R21 already owns the three newly published parent intents. R22 adds canonical IDs only for seven substantial pages that already existed and were protected by R20:

| Topic ID | Existing owner |
| --- | --- |
| `speech-structure-guide` | `/blog/speaking-structure` |
| `speaking-visual-aids-guide` | `/blog/speaking-visual-aids` |
| `speaking-debate-guide` | `/blog/speaking-debate-starters` |
| `speaking-video-feedback-guide` | `/blog/speaking-video-feedback` |
| `speaking-competition-preparation-guide` | `/blog/speaking-competition-prep` |
| `speaking-family-showcase-practice` | `/blog/speaking-family-showcase` |
| `story-card-speaking-bridge` | `/blog/grammar-speaking-bridge` |

No ownership is moved. These IDs simply allow the additive semantic graph to resolve existing pages explicitly.

## Eight focused journeys

R22 adds eight source journeys with four focused edges each: **8 journeys / 32 edges**.

1. **Conversation skills** → short-answer diagnostic, confidence/context transfer, discussion, familiar-audience practice.
2. **One-word answers** → reciprocal conversation, oral storytelling, response-initiation diagnostic, speaking practice.
3. **Oral storytelling & retelling** → complete responses, speech structure, Story Cards, familiar-audience retelling.
4. **Speech structure** → storytelling sequence, delivery, visual aids, focused video feedback.
5. **Public-speaking delivery** → structure, confidence/context transfer, focused feedback, competition-specific preparation.
6. **Speaking confidence** → understands-but-does-not-speak diagnostic, everyday conversation, family practice, delivery.
7. **Discussion/debate** → conversation/listening, speech organisation, focused feedback, confidence transfer.
8. **Video feedback** → delivery target, structure check, competition rehearsal, supportive confidence framing.

Directed `next` edges remain acyclic. They describe useful continuation, not mandatory progression.

## R22 precedence rule

Some established speaking pages already had generic Brick 6 links. For a page with an explicit R22 journey, the R22 edges take the first visible slots and upstream links become supplemental after deduplication.

This is intentionally narrow:

- R22 pages receive the more specific Speaking & Communication pathway;
- pages without an R22 journey return the upstream R19/R16/Brick 6 output unchanged;
- the visible component remains capped at four links.

This prevents a legacy generic speaking link from crowding out a more useful R22 diagnostic or skill continuation while preserving upstream behavior elsewhere.

## Runtime composition

`BlogSemanticPathway` now resolves through:

`R22 Speaking → R19 Grammar/Writing → R16 Reading → Brick 6`

The component still applies:

- `limit: 4`;
- `excludeRelations: ['assessment', 'programme']`.

Therefore assessment and programme edges may remain available to other explicit consumers of the graph, but they do not enter the educational pathway cards rendered inside blog articles.

## Protected commercial and URL boundaries

R22 does not change:

- `/resources/speaking` — informational Speaking & Communication hub;
- `/speaking` — live public-speaking programme owner;
- `/spoken-english-classes-for-kids-online` — spoken-English commercial owner;
- `/blog/spoken-english-classes-for-kids-confidence` — remains the R20 consolidation candidate on **HOLD** with no new redirect, deletion or canonical transfer.

R22 publishes no additional URL and authorizes no URL change.

## Regression boundary

R22 must preserve exact output for unaffected earlier semantic journeys. The dedicated gate pins representative historical behavior including:

- Brick 6 / R16 phonics blending;
- R19 punctuation/capitalisation;
- the R21 speaking publication and ownership contract;
- R20 commercial-owner and legacy-HOLD boundaries.

Historical R16/R19 source guards remain compatible because the R22 runtime adapter explicitly documents that it composes the R19 adapter, which composes R16 and Brick 6.

## Acceptance

R22 is complete only when:

1. exactly seven established speaking pages receive additive canonical IDs;
2. the full R22 ownership view is exactly R21 + 7 owners;
3. all topic IDs and query intents remain unique;
4. exactly eight focused journeys and 32 edges exist;
5. every source and target resolves through canonical ownership;
6. every R22 journey contains four unique destinations;
7. directed `next` edges remain acyclic;
8. R22-specific links take precedence only on covered speaking pages;
9. unaffected Reading and Grammar/Writing outputs remain exact;
10. the runtime component uses the R22 adapter, caps the pathway at four links and excludes assessment/programme relations;
11. speaking hub/programme ownership and the legacy consolidation HOLD remain unchanged;
12. source tests, typecheck, production build/prerender, rendered audits, structural Resources safety and SEO smoke all pass.
