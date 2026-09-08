# Brick 8 — Phonics knowledge dataset

Brick 8 completes the existing modular data layer for a controlled future phonics pilot. It does not render, publish, route, index or approve pages. Bricks 0–7, the editorial library at `/blog`, and all commercial owners remain intact.

**A Brick 9 candidate is not an approved public page merely because it appears in the dataset.**

## Architecture and curriculum source

`src/content/phonicsKnowledge/index.js` is the canonical aggregate. Seven curated concept modules use `schema.js`; private lookup maps return frozen concepts and frozen result arrays. Input collections are copied before freezing so consumers cannot mutate the source. The public TypeScript contract lives in `index.d.ts`.

`curriculum.js` imports `functions/src/phonicsCurriculumConfig.ts` read-only. It derives references from that source; it does not maintain a second lesson list. The existing frontend curriculum continues to derive from the same server configuration.

The canonical structure is **Foundation Phonics 31 + Early Phonics 40 + Advanced Phonics 30 = 101 lessons**. Every reference carries course ID, exact canonical lesson ID, lesson number and canonical label. The audit checks their agreement against the actual source, including its 31/40/30 structure. The JS/TS bridge uses native erasable-type support in Node >=22.18; CI uses the repository's Node 22.22.1 version. Vite handles the same source for TypeScript consumers.

The initial completed dataset has **40 concepts, 112 lesson references and 96 distinct referenced lessons**. All non-revision lessons are represented. The five revision lessons consolidate knowledge rather than requiring five artificial concepts. Concept relationships and `progressionRank` are readiness/presentation hints, never a substitute for canonical lesson order.

## Schema and educational scope

Each concept includes a stable ID, label, subject, stage, family (`conceptType`), parent question, search intent, quick answer, graphemes where appropriate, curated example words, common confusions, teaching notes, actionable practice, prerequisites, next concepts, exact curriculum references, owner reference, supporting existing paths and expansion rationale. Optional standard terminology, phoneme descriptions and contrast examples clarify brand labels and exceptions.

Every concept is `dataset-only`, `needs-human-review`, and `publicationApproved: false`. These fields cannot be configured into a published state through the schema helper.

Alignment distinguishes:

- `direct`: the canonical lesson explicitly names the correspondence or rule.
- `embedded-skill`: decoding/blending applied within a named lesson.
- `prerequisite-context`: oral readiness before print; no invented curriculum lesson.
- `lesson-theme`: the title supports the theme, but exact examples must be checked against teaching materials.

Examples are curated illustrations, not copied lesson word lists or an assertion that every word is independently decodable at the concept's first lesson. Teachers select words based on all correspondences the child knows. EA, IE, UI and advanced spelling families include controlled alternatives; teach one set before mixing them.

Keep Tiny Steps names such as **Monster LE**, **Controlling R**, **Missing and Sleepy Sounds** and **Lazy Vowel** in their curriculum references. Standard terminology explains the linguistic distinction when useful: OO and AU/AW commonly represent monophthongs despite their operational “Diphthong” lesson labels. QU commonly contains two phonemes; `vision` is a voiced-ending contrast rather than a SHUN target example. Accent differences are acknowledged. Do not treat spelling generalisations as exception-free laws.

## Concept families

| Family | Concepts |
| --- | ---: |
| Phonological foundation | 1 |
| Sound–symbol knowledge | 3 |
| Decoding skills | 2 |
| Short-vowel system | 1 |
| Spelling rules | 3 |
| Digraphs | 6 |
| Vowel teams | 5 |
| Magic E | 1 |
| Syllable rules | 2 |
| R-controlled patterns | 3 |
| Diphthong teaching families | 4 |
| Alternate vowel spellings | 4 |
| Advanced patterns | 5 |

The seven modules preserve all five existing curated groups and add later consonants and later vowel families. KN, TCH, WH/PH, UI, the five long-vowel families and Missing/Sleepy Sounds close the initial gaps. The long-vowel families are one reusable concept connected to five canonical lessons, not five generated page records.

## Ownership and expansion governance

`canonicalOwnerTopicId` resolves only to the existing Brick 5 registry. SATPIN, blending progression and CVC explanation remain `existing-owner`. Broad long-vowel and r-controlled guides remain supporting editorial authorities; no new registry owner is invented to accommodate a candidate. Practice support points to existing games/categories and retains the R6 internal-link architecture.

| State | Count | Meaning |
| --- | ---: | --- |
| existing-owner | 3 | Existing owner retains intent; no candidate slug |
| supporting-only | 6 | Useful knowledge without a standalone page proposal |
| pilot-wave-1 | 16 | Potential first-wave topics, still unapproved |
| future-wave-2 | 15 | Deferred opportunities, outside the first pilot |

The 16 Wave 1 concepts are CK, Floss, QU, CH, SH, TH, NG, soft/hard C, AI, EE, EA, IE, OA, Magic E, Rabbit Rule and consonant-le.

`ownershipScreen.js` records an explicit comparison against established related articles for each pilot. The fingerprint binds that assessment to its ID, search intent, question, slug and graphemes. A changed or new proposal fails until its comparison is revisited. This is an editorial screening snapshot, **not** a claim of human approval or a complete automated semantic-equivalence classifier.

The audit checks Brick 5 owner IDs/subjects/current paths, exact normalized query collisions, protected established intent aliases, reserved commercial/discovery intent, and candidate slugs against static/canonical paths, blog source and normalized public slugs, and redirect sources. Supporting URLs must exist. The shared blog normalization helper is reused rather than loading Vite's `import.meta.glob` in Node.

Before Brick 9 may publish anything, a human must confirm distinct search intent and demand, educational depth, accurate examples and lesson scope, the relationship to sibling concepts and existing owners, differentiated original page value, and the proposed URL. Recheck all current owner/route/blog/redirect surfaces. Update the comparison when the proposal changes. An existing guide mentioning a pattern is not by itself a new-page opportunity; a narrow page must solve a distinct problem beyond that mention. Do not promote thin entries to satisfy a quota.

## Acceptance gate

Run from the repository root:

```sh
npx vitest run src/tests/seo/resourcesR src/content/phonicsCurriculum
node scripts/audit-resources-r8-phonics-knowledge.mjs --base <PR-base-SHA>
node scripts/audit-semantic-internal-links.mjs
node scripts/audit-canonical-topic-ownership.mjs
node scripts/audit-resources-r7-aeo-geo.mjs
node scripts/audit-resources-r0.mjs
npm run typecheck
npm run build
node scripts/audit-resources-r8-phonics-knowledge.mjs --dist
node scripts/audit-resources-r0-rendered.mjs --strict
npm run seo:smoke
```

The dedicated R8 workflow runs these gates, including R1 and canonical curriculum tests. Existing PR workflows cover the full repository CI, dead URLs, crawl/discovery, GSC content quality and GSC revalidation. The build already runs route integrity, indexation and indexability reports. Do not claim completion until the final PR head is green across every required workflow.

Negative tests exercise bad/malformed/out-of-range references, duplicate IDs/slugs/references, invalid relationships and cycles, missing educational fields, mutable inputs, ownership/slug collisions and publishing attempts. The CLI exits nonzero on real violations and prints counts, errors and nonblocking warnings. Example reuse and explicit practice checks are guardrails; they cannot replace academic review.

The git delta gate permits only R8 data, tests, audits, documentation and its dedicated workflow. It therefore rejects **any** route, public article, manifest, canonical, sitemap, llms, redirect or prerender change, including dynamic routes that contain no literal candidate slug. Source scans also reject production imports of the dataset; output scans reject candidate pages and references in generated HTML, sitemaps and llms files. Run the git delta check before build-generated outputs and the rendered check after the build.

## Explicit non-goals and remaining editorial work

No new public URLs, granular React routes, generated pages, sitemap entries, llms entries, redirects, canonical changes, blog rewrites, commercial ownership transfers, fabricated FAQ schema, hidden GEO text, location pages or Brick 9 implementation are part of this change. `/blog` remains the editorial library and does not redirect to `/resources`.

Human review remains outstanding for all concepts. The precise scope of Missing/Sleepy Sounds and the less common long-vowel examples needs teacher confirmation against lesson materials. These are deliberately visible nonblocking data-review warnings; they block future publication, not completion of the R8 data and governance layer.
