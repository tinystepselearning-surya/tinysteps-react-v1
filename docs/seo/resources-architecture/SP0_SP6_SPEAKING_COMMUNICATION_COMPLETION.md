# Session C — Speaking & Communication Completion (SP0–SP6)

Revision: `2026-09-10-sp6-main-integration`

## Mission

Finish the Speaking & Communication knowledge/practice system **after R20–R22** without restarting the subject or producing a new family of thin pages.

R20 remains the knowledge architecture, R21 remains the three high-value content publications, and R22 remains the established speaking semantic journey layer. Session C is a narrow completion layer on top of those bricks.

## Integration state

PR #284 was retargeted from the R22 stack branch to `main` after R21 landed on `main`. The retargeted comparison therefore validates the remaining R22 ancestry and Session C completion together before production merge. A fresh exact-head Session C gate is required for this normalized `main` comparison.

## SP0 — Post-R22 gap audit

The audit found five remaining gaps and **zero justified new article URLs**:

| Gap | Priority | Closure |
| --- | --- | --- |
| Classroom communication semantic integration | High | Register the substantial existing classroom participation page as a speaking owner and connect it semantically. |
| Vocabulary → spontaneous speaking transfer | Medium | Refresh the R21 conversation owner with a retrieve/use/reuse routine and route sentence-construction difficulty to the existing sentence-formation owner. |
| Oral summarising | Medium-low | Refresh the R21 storytelling owner to distinguish full retelling from concise oral summarising. |
| Parent problem routing | Medium | Add a deterministic problem → existing owner → practice register. |
| Practice continuity | Medium | Map all nine R20 communication domains to existing practice; do not build duplicate generic speaking exercises. |

## SP1 — Conversation & response depth

The R21 conversation guide remains the canonical owner for ordinary reciprocal conversation. It already covers listening, responding, response expansion, follow-up questions, turn-taking, staying on topic, clarification and communication repair.

SP1 adds only the missing spoken-vocabulary transfer bridge:

**RETRIEVE → USE → REUSE**

The routine treats recognition vocabulary and spontaneous retrieval as different demands. It uses a small amount of topic-relevant vocabulary in meaningful turns, then reuses it with a different question, listener or setting. It does not recommend preloading large word lists.

If the child can retrieve words but cannot construct the sentence, the conversation owner routes to `/blog/how-to-improve-sentence-formation-in-kids` instead of creating a competing speaking-sentence page.

## SP2 — Storytelling & organisation

`/blog/how-to-teach-storytelling-to-kids` remains the protected storytelling/retelling owner. It already covers sequence, relevant detail, narrative coherence, listener clarity, original story creation, retelling and prompt fading.

SP2 adds the missing oral-summary distinction:

- **retell** — preserve the important sequence and enough detail for a listener to follow;
- **summarise** — select the central situation, main change/problem and important outcome.

A short-summary prompt is added only after a full retell so concise output does not replace narrative organisation.

## SP3 — Discussion, reasoning & opinions

No new content is created.

`/blog/speaking-debate-starters` already substantially owns:

- position;
- reason;
- example;
- listening before responding;
- agreeing/disagreeing respectfully;
- clarification;
- responding to another viewpoint;
- introductory rebuttal;
- reflection and reconsideration.

The owner remains protected.

## SP4 — Public speaking & delivery

No new content is created.

The established owner set already covers the required ecosystem:

- `/blog/speaking-structure` — purpose, opening/hook, body points, transitions, conclusion, note-card planning and rehearsal;
- `/blog/public-speaking-delivery-for-kids` — pace, audible volume, pauses, emphasis, intelligibility, posture and audience awareness;
- `/blog/speaking-visual-aids` — props, pictures, charts and slides;
- `/blog/speaking-video-feedback` — focused feedback and retry;
- `/blog/speaking-competition-prep` — event-specific preparation.

The R21 delivery owner remains explicit that better speaking is not accent conformity, forced loudness, constant eye contact or theatrical performance.

## SP5 — Parent problems + practice

Nine parent problems are routed to existing substantial owners:

1. understands English but does not speak;
2. one-word answers;
3. hesitation / constant prompting;
4. cannot explain ideas clearly;
5. cannot tell stories clearly;
6. vocabulary disappears during speaking;
7. difficulty speaking to unfamiliar people;
8. cannot express/support opinions;
9. presentation/show-and-tell difficulty.

Every route also names an existing practice continuation. Across the broader architecture, all nine R20 communication domains receive a practice route using the existing free speaking games, Story Cards, family showcase, classroom-routine rehearsal or focused video feedback.

## Existing classroom owner promoted into the graph

`/blog/back-to-school-english-confidence-plan` already owns practical classroom participation routines: answering teachers, asking for clarification, explaining an answer, entering pair/group talk, reading/presenting a short part, repairing a mistake, fading prompts and transferring the skill into a more school-like context.

Session C therefore gives it one additive canonical topic ID:

`classroom-communication-guide`

No URL, title, redirect or commercial ownership is changed.

Its focused pathway connects to:

1. the understands-but-does-not-speak diagnostic;
2. ordinary conversation skills;
3. the existing sentence-formation owner;
4. familiar-audience practice.

Conversation and confidence also receive uncapped inbound semantic relationships to the classroom owner. Their existing R22 visible four-link journeys remain exact because SP6 gives R22 output precedence for every pre-existing R22 source.

## SP6 — Closure and freeze

Session C is complete only if the dedicated gate confirms:

- SP0–SP6 architecture is complete;
- five post-R22 gaps remain closed without any CREATE action;
- all Tier-1 speaking clusters have established owners;
- all nine R20 domains have practice continuations;
- all nine named parent problems route to an established owner and practice;
- SP6 canonical ownership is exactly R22 + one existing classroom owner;
- the visible R22 journeys remain exact;
- classroom semantic inbound/outbound relationships resolve;
- SP1 vocabulary and SP2 summarising refreshes exist in source and rendered output;
- R20 legacy HOLD remains untouched;
- `/resources/speaking`, `/speaking`, and `/spoken-english-classes-for-kids-online` ownership remains unchanged;
- historical R22 → R8 audits remain green;
- full tests, typecheck, production build/prerender, rendered safety, shadowing and SEO smoke pass.

When that exact-head gate is green:

> **SPEAKING & COMMUNICATION = FROZEN**

No further informational expansion should be added unless a future evidence-led audit reopens the subject deliberately.
