# Blog hero image system

The blog hero-family registry maps every current public Tiny Steps blog article to one reviewed visual family. The family assignment controls the shared image used by blog cards, article imagery, and structured-data image resolution through resolveBlogHero.

## Production contract

- Compose for a 16:9 crop; current source images are 1920 x 1080 WebP.
- Use premium photorealistic editorial photography.
- Keep the main subject and learning action primarily in the right 55-65% of the frame.
- Preserve roughly 35-45% calm, naturally open space on the left for hero text where the authority layout uses the image in the hero.
- Do not embed titles, logos, watermarks, fake UI, borders, gradients, navy overlays, vignettes, or website effects in the image.
- Keep props restrained and make the learning action explain the article intent.
- Give every family a meaningfully different action, setting, age/stage, prop system, or camera composition.
- Avoid generic stock-photo posing and avoid repeating the same parent-child desk scene.
- Website/CSS owns all hero blending and dark treatment.

## Active visual families

| Family | Visual intent |
| --- | --- |
| listening-for-sounds | Spoken-sound awareness with no print. |
| sound-meets-letter | First sound-to-letter correspondence. |
| blending-into-a-word | Several sounds visibly combined into one word. |
| cracking-the-printed-code | Older reader noticing spelling patterns in real print. |
| breaking-down-longer-words | Multisyllabic word chunking. |
| from-speech-to-spelling | Hear, segment, then write. |
| reading-for-meaning | Read, think, and explain comprehension. |
| fluent-independent-reading | Smooth, confident connected-text reading. |
| finding-the-reading-gap | Calm diagnostic observation of where reading breaks down. |
| learning-live-online | Active child-teacher interaction in a live online lesson. |
| digital-practice-with-purpose | Deliberate educational app practice rather than passive screen time. |
| english-practice-at-home | Natural English practice during ordinary home activity. |
| building-better-sentences | Constructing complete sentences and word order. |
| planning-and-writing-ideas | Organising a main idea and supporting details before drafting. |
| editing-and-improving-writing | Revising and polishing a first draft. |
| finding-your-speaking-voice | Low-pressure speaking-confidence practice. |
| conversation-and-storytelling | Sequenced storytelling and genuine listener interaction. |
| presenting-with-confidence | Prepared public speaking with a small audience. |
| ready-for-the-classroom | Confident classroom participation and school readiness. |
| teacher-training-in-action | Teachers practising instruction with coaching and feedback. |
| planning-a-school-reading-programme | School leaders reviewing progression, evidence, and implementation. |

## Shared authority-template rollout

All 83 registered blog articles use the compact authority presentation layer: dark compact hero, reviewed family image in the hero, sticky left guide index on desktop, mobile guide index, editorial section rendering, evidence treatment, FAQ, author, and tracked conversion surfaces. SATPIN keeps its dedicated teaching experience inside the same shared shell. The five original pilots retain their article-specific hero points and curated TOC selections; all other articles use their category or school-research defaults.

## Mapping rules

- src/content/blog/shared/heroFamilies.ts is the source of truth.
- All 83 current public blog slugs are explicitly mapped exactly once.
- Legacy week source slugs are normalized to their public slug before family resolution.
- There is no category- or audience-based automatic family inference. A future article stays on its stored hero until its image family is editorially reviewed.
- All 21 active family assets must exist under public/blog/hero-families/<family>.webp.
- The older ten family WebPs may remain in the asset directory temporarily for rollback, but they are not active registry families after this migration.

## Verification

The hero-family regression test must verify:

1. the live blog inventory is 83;
2. the explicit mapping contains the same 83 public slugs;
3. no article is unmapped;
4. family counts remain stable;
5. all 21 active WebPs exist and are non-empty;
6. legacy week source slugs normalize to the same public family;
7. future unreviewed posts still fall back safely to their stored hero.
