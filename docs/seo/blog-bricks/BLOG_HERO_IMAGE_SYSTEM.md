# Blog hero image system

The blog hero-family registry gives selected posts a stable visual intent without replacing their current `hero`. A family asset becomes eligible only after its finished WebP is added to `public/blog/hero-families/` and the family is added to `AVAILABLE_BLOG_HERO_FAMILY_ASSETS`. Until then, `resolveBlogHero` returns the post's existing hero, so planned assets never create broken requests.

## Production contract

- Compose for a 16:9 card crop; target a source size around 1600 × 900.
- Deliver WebP for production.
- Do not embed text, logos, fake UI screenshots, or watermarks.
- Do not depict school uniforms that imply a specific real school.
- Do not use photorealistic identifiable children. Prefer stylized educational illustration.
- Use a consistent Tiny Steps pastel, warm, educational art direction.
- Keep subjects clearly separated so responsive crops remain legible.
- Keep faces and important content away from extreme edges.
- Give every family a meaningfully different composition; do not repeat the same parent-child pose.
- Make the scene explain the article intent rather than serving as unrelated decoration.

## Families and concepts

| Family | Intended composition |
| --- | --- |
| `satpin-letter-sounds` | Letter cards, sound objects, and early phonics materials. |
| `blending-early-reading` | A child blending sound cards or building a word. |
| `reading-fluency` | A child reading connected text with calm guided support. |
| `parent-home-practice` | A parent and child doing a short home-learning activity. |
| `grammar-sentence-building` | A child arranging word cards into a sentence. |
| `speaking-communication` | Children speaking and listening with conversation cues. |
| `school-readiness-routines` | Backpack, books, a routine checklist, and a home-school transition. |
| `schools-research` | Curriculum documents, teacher planning, and an assessment or research context. |
| `teacher-classroom-support` | A teacher modelling or rehearsing with a small group. |
| `general-phonics` | A broad phonics scene without SATPIN-specific dominance. |

## Asset paths

Assets follow `public/blog/hero-families/<family>.webp`, producing public URLs such as `/blog/hero-families/reading-fluency.webp`.

To publish a family image:

1. Add the reviewed WebP at the contracted path.
2. Add that family to `AVAILABLE_BLOG_HERO_FAMILY_ASSETS`.
3. Run the hero-family tests, blog SEO tests, production build, and SEO smoke checks.

Slug mappings remain explicit in `src/content/blog/shared/heroFamilies.ts`. School research posts use their existing `audience` or `discoveryCategory` metadata rather than title matching. Do not assign a family unless the editorial intent is clear.
