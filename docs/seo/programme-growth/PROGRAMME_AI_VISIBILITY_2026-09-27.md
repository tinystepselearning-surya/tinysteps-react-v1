# Grammar, Reading & Speaking — AI / Answer / Search Visibility Hardening

Date: 2026-09-27

## Scope

This pass strengthens three existing canonical commercial owners without creating new programme URLs:

- `/grammar`
- `/reading-classes-for-kids`
- `/speaking`

The protected `/phonics` programme is deliberately outside the implementation scope.

## Non-negotiable Phonics protection

`/phonics` remains the P1 commercial owner for generic phonics, blending, sound–spelling knowledge and unfamiliar-word decoding.

The `src/pages/phonics.tsx` blob SHA is unchanged between `main` and this branch:

`c2378e822fcf65e1c9aaa51ab02d07493f5fa507`

Reading may link to Phonics when decoding is unstable, but Reading must not claim or reproduce the Phonics commercial territory.

## Canonical owner boundaries

### Reading

`/reading-classes-for-kids` owns connected-text reading after the phonics decision:

- connected-text accuracy;
- sentence reading;
- fluency and phrasing;
- vocabulary in context;
- comprehension;
- retelling;
- reading-aloud confidence.

If unfamiliar-word decoding, blending or sound–spelling knowledge is unstable, route to `/phonics`.

If word reading is reasonably accurate but connected reading alone remains slow/choppy, route to `/reading-fluency-program`.

### Grammar

`/grammar` owns sentence-level grammar control:

- sentence formation;
- parts of speech;
- tenses;
- punctuation;
- correction;
- grammar accuracy in short spoken/written responses.

Paragraph development, stories, creative writing, editing and longer composition remain with `/writing-classes-for-kids`.

Everyday conversational fluency remains with `/spoken-english-classes-for-kids-online`.

### Speaking

`/speaking` owns structured and audience-facing communication:

- structured answers;
- storytelling;
- show-and-tell;
- presentations;
- audience awareness;
- general communication skills.

Everyday conversational fluency remains with Spoken English.
Confidence-only barriers remain with Confidence Building.
Grammar/sentence-control barriers remain with Grammar.

## Visibility layers applied

1. **Visible answer-first copy**
   - concise extractable answer sections;
   - explicit owner/non-owner boundaries;
   - no vague all-purpose programme claims.

2. **Schema / Google-facing semantics**
   - WebPage `about` entities;
   - Course schema on all three programme owners;
   - FAQ schema retained;
   - speakable selectors on the visible answer summaries.

3. **Internal AI retrieval**
   - Ask Tiny Steps source registry tightened so each programme retrieves only for its actual territory;
   - Reading no longer carries `decoding` as an AI retrieval tag.

4. **LLM / answer-engine discovery**
   - `llms.txt` and `llms-full.txt` state the same canonical programme boundaries;
   - no ChatGPT/Gemini/Perplexity-specific landing pages are created.

5. **Commercial architecture**
   - existing C2 canonical owners retained;
   - existing C5 assessment conversion owner retained;
   - no canonical URL changes;
   - no new commercial route;
   - no pricing, lead, Firestore or booking-flow changes.

6. **UX consistency**
   - shared light `ProgrammeHeroSnapshot` component;
   - shared `ProgrammeIntentBoundary` component;
   - restrained white/slate surfaces, thin borders and compact hierarchy;
   - removed decorative Grammar/Speaking hero pyramids rather than adding more visual layers.

## Metadata governance

Existing page titles, descriptions and canonical paths remain unchanged in this pass. The work improves semantic specificity and answer extraction without resetting established snippet controls.

## Measurement

Use GSC page/query evidence after the deployment has had enough time to recrawl. Treat the 2026-08-28 through 2026-09-24 settled window as the pre-change baseline:

- `/phonics`: 118 clicks, 3,629 impressions, CTR 3.25%, average position 5.93 — protected benchmark.
- `/speaking`: 22 clicks, 1,111 impressions, CTR 1.98%, average position 13.16.
- `/grammar` and `/reading-classes-for-kids`: each below the 11-click threshold of the returned top-25 landing-page report.

Success for Grammar, Reading and Speaking must be measured independently. A gain on Reading must not be accepted as a win if Phonics ownership or visibility is weakened.
