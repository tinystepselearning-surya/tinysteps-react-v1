# GV5B — Vocabulary Foundation Completion

**Status:** implementation and publication brick  
**Revision:** `2026-09-27-gv5b`  
**Base:** merged GV5 Natural English and Transfer  
**Scope:** publish the six remaining frozen Vocabulary authority requirements and complete the 16/16 estate before GV6 closure

## Purpose

GV5B completes the publication work defined by GV1. After GV5, ten of the sixteen frozen Vocabulary authority requirements were public. GV5B publishes the six intentionally deferred foundation/word-relationship guides so the final GV6 brick can focus on integration, measurement and closure rather than mixed publication and infrastructure work.

GV5B does **not** change the frozen taxonomy, the six-stage progression, the Vocabulary Adventure practice contract, the 50-word lexical baseline, or commercial ownership.

## Published guides

GV5B publishes exactly these six previously deferred guides:

1. **Action Words for Kids**  
   `/resources/vocabulary/action-words-for-kids`
2. **Describing Words for Kids**  
   `/resources/vocabulary/describing-words-for-kids`
3. **Home, Family & Daily Routine Vocabulary**  
   `/resources/vocabulary/home-family-daily-routine-vocabulary`
4. **Food, Clothes & Body Vocabulary**  
   `/resources/vocabulary/food-clothes-body-vocabulary-for-kids`
5. **Nature, Weather, Places & Transport Vocabulary**  
   `/resources/vocabulary/nature-weather-places-transport-for-kids`
6. **Multiple-Meaning & Easily Confused Words**  
   `/resources/vocabulary/multiple-meaning-confused-words-for-kids`

## Final 16-guide progression

The public authority registry and lightweight SEO manifest now follow the original GV1 frozen order:

1. Everyday Vocabulary for Kids
2. Action Words for Kids
3. Feelings & Emotions Vocabulary
4. Describing Words for Kids
5. School Vocabulary for Kids
6. Home, Family & Daily Routine Vocabulary
7. Food, Clothes & Body Vocabulary
8. Nature, Weather, Places & Transport Vocabulary
9. Synonyms & Antonyms for Kids
10. Multiple-Meaning & Easily Confused Words
11. Word Families, Prefixes & Suffixes
12. Context Clues for Kids
13. Collocations for Kids
14. Phrasal Verbs & Common Expressions
15. Vocabulary for Better Writing
16. Vocabulary for Speaking & Conversation

Publication lineage is preserved:

- GV4 first batch: **6**
- GV5 natural-English/transfer batch: **4**
- GV5B foundation-completion batch: **6**
- total: **16**

No frozen Vocabulary requirement remains unpublished.

## Knowledge vs Grammar boundaries

GV1 cross-domain boundaries remain authoritative.

### Action words

- Vocabulary owns lexical meaning, precision, retrieval and choice between action words.
- Grammar continues to own verb structure, tense, agreement and verb-form explanation at `/resources/grammar/verbs-for-kids`.

### Describing words

- Vocabulary owns descriptive meaning, shades of meaning and useful word choice.
- Grammar continues to own adjective structure and sentence behaviour at `/resources/grammar/adjectives-for-kids`.

### Multiple-meaning and confused words

- Vocabulary owns context-based meaning selection and lexical confusion resolution.
- The proposed Grammar route `/resources/grammar/easily-confused-words-for-kids` remains unpublished and therefore must not become a competing canonical owner in GV5B.

## Authority-content contract

Every GV5B guide contains:

- direct answer;
- concept explanation;
- why it matters;
- three core ideas;
- three worked examples;
- additional examples;
- three common mistakes;
- two tricky cases;
- a parent/teacher teaching note;
- three practice prompts;
- two FAQs;
- at least two visible authoritative references;
- related learning paths;
- Vocabulary Adventure as practice.

The minimum knowledge-content floor remains **600 words per guide**.

The GV5B guides materially exceed that floor while keeping examples child-relevant and avoiding unnecessary medical, dietary or transport-policy claims.

## Lexical baseline

The GV2 Vocabulary Adventure lexical model remains exactly **50 entries**.

GV5B does not add or mutate game words. It only connects existing words where there is a genuine semantic fit:

- Action Words uses the existing 10 action entries.
- Describing Words uses the existing 10 description entries.
- Home/Family/Routines reuses matching everyday entries.
- Food/Clothes/Body reuses only existing relevant entries such as `eat`, `sweet` and `bottle`.
- Nature/Weather/Places/Transport reuses existing place/description entries.
- Multiple-Meaning & Easily Confused Words does not invent a synthetic lexical subset.

Vocabulary Adventure remains:

`/free-games/word-meaning-flashcards`

It remains the practice owner, not the canonical knowledge owner.

## Public architecture

GV5B reuses the existing data-driven Vocabulary system:

- `VocabularyHubPage`
- shared `VocabularyKnowledgePage`
- dynamic `/resources/vocabulary/:slug` route
- lightweight SEO manifest
- public route manifest integration
- sitemap/prerender pipeline
- breadcrumb/AEO/GEO handling
- public analytics prefix
- AI answer layer
- generated machine corpus
- visible source references

No six new React page components are created.

## Canonical ownership

The six new owners use the dedicated namespace:

- `gv5b-vocabulary-action-words`
- `gv5b-vocabulary-describing-words`
- `gv5b-vocabulary-home-family-routines`
- `gv5b-vocabulary-food-clothes-body`
- `gv5b-vocabulary-nature-weather-places-transport`
- `gv5b-vocabulary-multiple-meaning-confused-words`

Each owner is:

- subject: `vocabulary`
- intent: `informational`
- role: `skill-guide`
- hub: `/resources/vocabulary`

The original GV4 hub owner remains unchanged.

## Commercial/C7 boundary

All Vocabulary authority pages remain soft-discovery knowledge surfaces.

GV5B must not infer a commercial owner from words such as:

- action;
- describing;
- family;
- food;
- body;
- transport;
- speaking;
- writing.

C7 R1/R2/R3 regression tests cover the complete published Vocabulary estate and require:

- R1 primary commercial owner: `null`
- R1 family: `soft-discovery`
- R1 decision: `HOLD_SOFT_DISCOVERY`
- R2 rule: `SOFT_DISCOVERY`
- R2 primary/secondary destinations: `null`
- R2 commercial prompt cap: `0`
- R3 commercial handoff: `null`

The frozen C2/C4/C5/C6 architecture and `/book-demo` single conversion owner remain unchanged.

## AI and machine discovery

Before GV5B:

- Layer 1: **28**
- Layer 2: **106**
- Layer 3: **12**
- Vocabulary authority guides: **10**
- Vocabulary machine corpus: **10**

After GV5B:

- Layer 1: **28**
- Layer 2: **112**
- Layer 3: **12**
- Vocabulary authority guides: **16**
- Vocabulary machine corpus: **16**

Every published guide remains answer-eligible, self-canonical and connected to Vocabulary Adventure only as a practice URL.

## Hub closure

The Vocabulary hub now presents the complete estate:

- all sixteen authority guides;
- all six stages;
- no planned/unpublished Vocabulary requirement;
- the same Vocabulary Adventure practice continuation.

The progression view remains useful for GV6 semantic/deep-link integration even though every frozen topic is now public.

## C7 exact-byte protection

GV5B intentionally changes two C7-protected files:

- `src/pages/VocabularyHubPage.tsx`
- `src/lib/canonicalTopicOwnershipRegistry.js`

Their final reviewed Git blob IDs are pinned in the existing C7 exact-byte repair map and regression test. This remains fail-closed: any later byte change requires an explicit reviewed repin.

No path-wide C7 exception is introduced.

## Performance

The public bundle policy remains unchanged:

**150 KiB gzip maximum**

GV5B adds content data and lightweight manifest records but reuses the existing shared renderer. The dedicated workflow runs the same public bundle guard after production build/prerender.

## Validation

GV5B adds:

- `src/tests/seo/vocabularyAuthorityGv5b.spec.ts`
- `scripts/audit-vocabulary-authority-gv5b.mjs`
- `.github/workflows/resources-gv5b-vocabulary-foundation-completion.yml`

The validation matrix checks:

- exactly 16 frozen requirements;
- exactly 16 published guides;
- exact 1–16 progression order;
- 6 GV4 + 4 GV5 + 6 GV5B lineage;
- zero unpublished Vocabulary requirements;
- 600+ knowledge words for each GV5B guide;
- source depth and unique HTTPS references;
- exact 50-word lexical baseline;
- one canonical owner per guide;
- no C7 commercial handoff;
- Layer 2 = 112;
- Layer 3 = 12;
- Vocabulary corpus = 16;
- sitemap coverage;
- prerendered HTML;
- visible references;
- Vocabulary Adventure practice links;
- historical GV4/GV5 preservation;
- typecheck;
- production build;
- 150 KiB gzip public bundle guard.

## GV5B closure conditions

GV5B is complete when:

- all six `gv5b-foundation-completion` guides are substantial and public;
- total Vocabulary authority guides = **16**;
- public order matches the 16 frozen GV1 requirements;
- no Vocabulary requirement remains unpublished;
- every guide is self-canonical and prerendered;
- every guide has one canonical informational owner;
- the 50-word lexical baseline remains exactly 50;
- Vocabulary Adventure remains the one practice owner;
- AI Layer 2 = **112**;
- AI Layer 3 = **12**;
- machine Vocabulary corpus = **16**;
- C7 R1/R2/R3 keeps all Vocabulary authority pages noncommercial;
- exact reviewed C7 blob pins match the final hub and canonical-registry bytes;
- the 150 KiB gzip guard passes;
- full repository CI is green;
- branch is behind `main` by zero before merge.

After this closure, the next planned brick is **GV6 — Discovery, AI and Practice Integration**, with no remaining Vocabulary publication backlog.
