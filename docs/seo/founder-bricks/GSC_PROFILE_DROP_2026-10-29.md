# 29 October 2026 — GSC ProfilePage item count declined to zero

## Reported evidence
- Owner-provided Search Console screenshot: Profile page > Valid items, count 0 on 27 October 2026 after a period with 1 valid item.
- This is a **rich-result structured-data item count**, not a measurement of whether the URL is indexed or ranking in web search.
- Google: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Google recommends URL Inspection and fresh validation when a valid item count drops without an invalid spike.

## Code and public-page findings
- Canonical public route: https://tinystepslearning.com/team/vannala-ravali-priya
- Existing route registry and public manifest mark page as indexable, self-canonical, prerendered and included in the sitemap.
- Main founder React component already emits ProfilePage and Person via applySeo.
- Existing schema references the Person by @id in ProfilePage.mainEntity; full Person appears separately in JSON-LD.
- Public web-text extraction returned the founder's name, biography and existing LinkedIn link.
- The original Search Console screenshot does **not** give the inspected founder URL, last crawl, Google-selected canonical, rendered JSON-LD, or reason for the missing item. The underlying cause of the decline is **not conclusively proven**.

## Focused hardening
- Provide a typed Person with canonical @id, name, URL and image directly in ProfilePage.mainEntity, while keeping the existing top-level full Person identity under that same @id.
- Owner supplied two personal social URLs: LinkedIn and Instagram. LinkedIn was already in the person graph; Instagram is now added to founder public profiles, visible founder hero and Team links, and Person.sameAs.
- Never add founder personal social URLs to EducationalOrganization.sameAs.
- Keep page canonical, existing founder photograph, existing factual biography, sitemap and indexability unchanged.
- Add a targeted `seo:rendered-check` assertion for **actual initial HTML**, including one ProfilePage, typed mainEntity, canonical Person and both crawlable social links.

## Verification / release steps
1. Run `npx vitest run src/tests/pages/FounderPriyaPage.spec.tsx src/tests/seo/p11FounderEntityCorroboration.spec.ts src/tests/seo/p12FounderPersonSameAs.spec.ts src/tests/seo/founderBrick5Discovery.spec.ts`.
2. Run `npm run typecheck` and `npm run build`, ensuring `seo:rendered-check` passes for `dist/team/vannala-ravali-priya/index.html`.
3. After verified deployment, inspect the live URL using Rich Results Test and GSC URL Inspection: http status, indexed status, Google-selected canonical, last crawl, and rendered JSON-LD.
4. If eligible markup is detected, request recrawl; Search Console report counts may lag days.
5. Do not claim this PR alone guarantees GSC restores the previous count or improves organic traffic. If the live test still shows 0, investigate Google profile rich-result eligibility and Search Console report scope, rather than manufacturing schema.
