# GR5 — Grammar & Writing Practice Utility Architecture

Revision: `2026-09-10-gr5`

## Mission

GR5 turns the diagnostic and knowledge architecture from GR1–GR4 into a reusable practice layer. It does **not** create a new SEO page for every exercise type. The same practice contract can be consumed by browser games, teacher tools, worksheet generation, lesson activities or future adaptive practice.

## Frozen practice utilities

1. Tense Comparison
2. Sentence Builder
3. Sentence Expansion
4. Error Correction
5. Punctuation Challenge
6. Editing Practice
7. Paragraph Organiser
8. Conjunction Practice
9. Tense Choice Practice

These nine IDs exactly match the GR4 handoff vocabulary.

## Three practice levels

Every utility has exactly three reusable blueprints:

- **Guided** — the target and/or decision is visible enough to reduce unnecessary load.
- **Independent** — the child must retrieve the relevant rule, structure or strategy with fewer cues.
- **Transfer** — vocabulary, topic, context or writing sample changes so the skill must survive a fresh task.

That produces **27 data-driven blueprints** in total.

## Data-driven contract

A blueprint stores:

- practice kind;
- level;
- task type;
- prompt template;
- required data fields;
- variation axes;
- evaluation rule.

The content data is supplied at runtime. GR5 therefore avoids hardcoding a single fixed worksheet as the practice architecture.

Example conceptually:

`sentence-builder-guided + { units, meaning } → rendered sentence-building task`

The same blueprint can receive different subjects, verbs, topics or sentence units without changing the pedagogical sequence.

## Utility boundaries

### Tense Comparison

Meaning → compare two competing forms → explain difference → fresh contrast.

### Sentence Builder

Idea → complete oral sentence → construct/write → reread. Completeness comes before length.

### Sentence Expansion

Secure sentence → choose one useful detail dimension → add → reread. No adjective stuffing.

### Error Correction

Read → find → explain → fix → reread → transfer. Detection and correction are treated as separate skills.

### Punctuation Challenge

Meaning and sentence boundary → target punctuation function → reread → independent proofreading.

### Editing Practice

Revision of meaning/organisation precedes sentence, grammar/tense and punctuation passes. Mixed correction is not the entry point.

### Paragraph Organiser

Focus → select relevant support → order → connect → reread. No universal five-sentence formula.

### Conjunction Practice

Relationship between ideas → decide whether/how to connect → choose connector/structure → reread. Longer is not automatically better.

### Tense Choice

Intended time meaning → choose tense/form → build verb phrase → use in connected language → audit purposeful vs accidental shifts.

## GR4 diagnostic integration

GR5 derives each utility's parent-problem connections from the frozen GR4 `recommendedPracticeKinds` field. This makes the relationship reciprocal and prevents the practice layer drifting away from the diagnostic layer.

Every Tier-1 GR4 parent problem has at least one GR5 utility.

## Coverage requirements

The GR5 audit fails if practice leaves any of these architecture layers disconnected:

- 14 GR1 grammar/writing skills;
- 9 GR2 tense/control nodes;
- 10 GR3 writing stages;
- 10 GR4 Tier-1 parent problems;
- any of the 9 frozen GR5 practice kinds.

## Public ownership boundary

GR5 reuses existing practice owners such as:

- `grammar-practice`;
- `sentence-building-practice`;
- `grammar-focused-practice-game`.

It may also reference existing informational owners such as the tense, punctuation, conjunction, sentence-formation, paragraph and editing guides for semantic context.

GR5 itself adds:

- no public routes;
- no sitemap targets;
- no canonical owners;
- no new query intents;
- no public game enablement;
- no curriculum changes.

This is intentional. A reusable utility is a capability, not automatically a search-intent owner.

## Existing public games relationship

The repository already has public Grammar and Sentence Building practice categories plus a grammar-focused practice game route. GR5 does not force unfinished gameplay tiles live. Future UI work can consume the GR5 contracts when the corresponding public engine is production-ready.

## Downstream handoff

GR6 can use the frozen IDs to build semantic journeys of the form:

`concept → prerequisite → comparison → common error → writing application → parent problem → practice → next concept`

GR7 should verify that the knowledge, diagnostic, writing and practice layers remain connected after any final public-content strengthening.
