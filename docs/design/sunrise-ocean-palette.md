# Tiny Steps — Sunrise / Ocean Visual Design System

**Status:** experimental review palette, not deployed. Applies to public-facing website pages and blog templates. The authenticated learning, teacher, parent and administrative applications require independent accessibility and workflow review before adapting their theme.

## Inspiration

Primary reference is the user-supplied ocean sunrise: deep navy, blue water, purple sky, blush and warm golden sunlight. The Dawn Blush reference supplies gentle pastels for large surface areas; its explicit swatches are `#FFB3BA`, `#FFD1DC`, `#FFE5B4`, `#FFF1CC` and `#B8E3FF`. The separate multicolour swatch screenshot is a visual reference only: its repeated displayed `#F67659` labels are inconsistent with the visibly different squares and must not be treated as exact swatch metadata.

## Canonical CSS custom properties

Defined once in `src/index.css`:

| Token | Hex | Role |
|---|---|---|
| `--ts-sunrise-ink` | `#17284C` | Headings, paragraphs, dark action buttons |
| `--ts-sunrise-navy` | `#212B5C` | Deep contrast surfaces |
| `--ts-sunrise-body` | `#405678` | Supporting copy on white |
| `--ts-sunrise-ocean` | `#6E95D2` | Decorative blue (not small white-text badge) |
| `--ts-sunrise-purple` | `#755E96` | Link or selected secondary emphasis |
| `--ts-sunrise-blush` | `#CC8994` | Blush accents, decoration only |
| `--ts-sunrise-sunset` | `#F6CF7E` | Sparse gold highlight / illustration details |
| `--ts-sunrise-page` | `#F4F8FF` | Default public site backdrop |
| `--ts-sunrise-blue` | `#E7F3FF` | Hero and section backgrounds |
| `--ts-sunrise-lavender` | `#F1EDFC` | Alternate section background |
| `--ts-sunrise-rose` | `#FFE5EB` | Selective warm alternate section background |
| `--ts-sunrise-cream` | `#FFF5DF` | Sparing warm highlight |
| `--ts-sunrise-border` | `#D7E5F4` | Card outlines and light dividers |
| `--ts-sunrise-surface` | `#FFFFFF` | Reading cards, pricing details, inputs |

The hero gradient `--ts-sunrise-hero` moves from powder blue through pale lavender, blush, then a small cream endpoint. The secondary wash `--ts-sunrise-soft` gives less visual drama to long content sections.

## Practical rules

1. **White reading surface + dark navy text.** Do not put important copy on saturated pink, purple, gold or ocean blue tiles without checking WCAG contrast.
2. **Pastels are secondary structure, not a rainbow of competing cards.** One major hero wash and at most one contrasting light section tone before a neutral reading panel.
3. **Keep blog articles readable.** Use white articles, very light surrounds and consistent links; never recolour syntax blocks, image content, learning diagrams or quoted source figures.
4. **Buttons and conversions.** Use existing tracked links, URLs and form handlers. Dark navy can be the primary CTA; pale ocean/white with navy text can be secondary. Design work must not modify analytics, lead handling or programme prices.
5. **Keep accessible states.** Use native focus rings, ensure no horizontal scroll at mobile width, and honour reduced-motion preferences.
6. **No global forced Tailwind class replacement.** Use public-scoped `ts-sunrise-*` classes and shared CSS variables. Protected routes should not inherit public-site colour overrides.
7. **Preserve route- and intent-level SEO.** Colours should never change canonical URLs, structured data, H1 wording, prerender rules or parent Q&A substance.
8. **Future changes.** New public pages should import/reuse canonical CSS tokens rather than add fresh hard-coded palette values.

## Contrast checks (WCAG formula)

- Ink on sky background: approximately **12.92:1**.
- Ink on blush wash: approximately **12.23:1**.
- Ink on cream wash: approximately **13.42:1**.
- Navy on white: approximately **13.42:1**.
- Purple on white: approximately **5.53:1**.
- **Blush on white: 2.77:1** and **ocean on white: 3.05:1**, therefore **do not use these combinations for normal-size text**.

## Site-wide rollout and quality gates

**Currently touched in the branch:** Public shell, Homepage, primary Phonics/Grammar/Public Speaking commercial pages, 3 group programme pages, Courses, Curriculum, Pricing, Resources gateway, blog index, shared article template and shared article hero.

**Future page-by-page evaluation:** Landing pages with standalone hero templates, parent/school campaign pages, static research articles outside the shared blog renderer, and accessibility of any specialty components. App dashboards/games are not blanket-recoloured to preserve learning functionality.

**Before merging:** Review desktop (1440 px) and mobile (375 px), visual contrast, actual links, blog content flow, above-fold conversion CTAs, and CI/prerender. Do not equate static source assertions with browser-tested proof.
