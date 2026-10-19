# High-citation parent journeys — focused review and safe handoff (2026-10-19)

**Context:** AI search follow-up, [Issue #748](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748). Microsoft Clarity owner export, 13–19 Oct 2026: `/free-phonics-games-for-kids` **198 citation occurrences**, `/blog/satpin-phonics-guide` **175**, `/resources/vocabulary/context-clues-for-kids` **172**. These are **Microsoft citations**, not unique visits or leads. The user-supplied Clarity export is the source; the original file is not committed to this PR. Perplexity intentionally out of scope.

**Evidence levels:** GitHub `main` source audited 19 Oct 2026; public web-reader pages were available for games and SATPIN, but some snapshots were weeks/months old, so they are **not an exact live deployment witness**. The public Context Clues result was reachable through indexed textual retrieval but a direct web-reader open returned an error; current served HTML was **not verified in this new audit**. Existing 168-URL E1/E2 CI and release witnesses are separate historical evidence. Container-origin requests failed DNS in this execution environment; **not proof of a production outage**.

## Page-by-page pathway findings

### A. [Free Phonics Games for Kids](https://tinystepslearning.com/free-phonics-games-for-kids) — **one actionable missing educational handoff**

- Latest source: `src/pages/public/FreeEnglishGamesCategoryPage.tsx`, category config `src/lib/publicEnglishGames.ts`.
- Public category already presents letters/sounds and blending games, a category FAQ, the general English games hub and the existing demo-booking path. The shared component did **not** link to any explanatory phonics/parent article from this **specific** high-citation category.
- Learning distinction: finishing a game or matching a sound is *not* proof of decoding. Games should be paired with one fresh offline example using taught knowledge; avoid asking children to decode unfamiliar spellings.
- **Smallest safe change in this PR:** one phonics-category-only non-promotional parent transfer panel, plus two existing canonical links: `/blog/satpin-phonics-guide` and `/blog/why-child-knows-letter-sounds-but-cannot-read-words`. Existing game cards, ready-soon gating, FAQ/schema, heading, game progress and demo CTA remain untouched.
- Scope guard: not shown on Reading/Grammar/Speaking or other games categories that share the component; tested explicitly.

### B. [SATPIN Phonics Guide](https://tinystepslearning.com/blog/satpin-phonics-guide) — **protect, no change**

- Latest source: `src/content/blog/posts/phonics/satpin-phonics-guide.ts`.
- Explains taught sound–spelling correspondences, early blending, when to progress, practice checks and limitations. Already links contextually to `/blog/phonics-for-parents-guide`, CVC, spelling, blending explanations, a parent blending difficulty answer, SATPIN at-home plan, direct Balloon Pop/tracing games, an online games quality guide and phonics/demo routes.
- No new links or broad editorial rewrite justified. Retain canonical owner, cited intent, heading, author and evidence references.

### C. [Context Clues for Kids](https://tinystepslearning.com/resources/vocabulary/context-clues-for-kids) — **protect, no change**

- Latest source: `src/lib/vocabularyAuthorityRegistry.js` and `src/pages/VocabularyKnowledgePage.tsx`.
- Teaches reread → identify textual evidence → propose word meaning → check; allows *not enough information*, and does not conflate inferring vocabulary with guessing a printed word.
- Existing UI renders worked examples, practice prompts, a Vocabulary Adventure link, previous/next vocabulary guides and `relatedPaths` including a public word-meaning activity and reading-classes path.
- Existing links appear fit for purpose. There may be a useful connection from the **parent comprehension** article to this worked context-clues explanation, but that is separately proposed as #754 action N05; check rendered HTML before any later edit. Do not append another source-specific CTA here merely to influence AI bots.

## Validation and risks

1. Only the dedicated Free Phonics Games collection receives the educational guidance; keep all other category routes unchanged.
2. The two links resolve to existing owned canonical article paths in `main`; do not create duplicate pages or sitemap entries.
3. Unit test checks section, visible off-screen transfer description, link hrefs and unchanged demo CTA; negative test checks Grammar games is unaffected.
4. Review the PR diff and run relevant Vitest, TypeScript and pre-render build/SEO gates. **Do not deploy/merge prior to passing checks.** After merge and deployment, verify that public-origin HTML actually contains the panel and both canonical internal links.
5. A citation is not a click or enquiry. No ranking gain, conversion uplift or engine citation change is forecast from this navigation improvement.

**Deferred measurements:** Confirm Clarity dashboard's `AI referral traffic = 43` field unit in its owning UI (CSV omits unit/denominator); compare page/path-level AI referrals with GA4 enquiries before attributing leads. Use proper GSC Generative AI date/country filters to compare India with worldwide exposures. Google current URL Inspection remains #747.
