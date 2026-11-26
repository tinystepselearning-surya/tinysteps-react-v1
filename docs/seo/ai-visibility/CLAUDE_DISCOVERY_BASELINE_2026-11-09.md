# Claude discovery baseline and controlled correction — 2026-11-09

**Status:** investigation + one low-risk evidence-navigation change on a separate branch. No production deployment or ranking claim.

## Scope and constraints

- Preserve currently performing Google Search, Google AI Overviews and Gemini surfaces. Positive Google/Gemini performance was reported by the site owner; this branch does **not** independently quantify it.
- Focus on **Claude** discovery, research-tool page fetches, missing supporting evidence, and answer accuracy.
- Do not change `robots.txt`, sitemap generation, canonical ownership, schema, pricing, lesson order or indexation directives without a reproduced defect.
- Search engines and AI assistants do not publish complete source-selection or recommendation algorithms. A failure to cite a URL is not proof that the page is blocked.

## Baseline observations: reproduced by the owner in Claude

| Stage | Observation | Interpretation | Confidence |
| --- | --- | --- | --- |
| Unbranded recommendation: online phonics classes in India | Tiny Steps omitted from shortlist | Unprompted discovery/inclusion gap in that response; not a universal ranking measure | High observation / low generalisation |
| Brand lookup: `Tiny Steps` | Failed to resolve provider | Brand-entity retrieval failure in that conversation | High observation |
| Explicit website URL | Correctly retrieved home offer and pricing | Site can be read in some Claude tool paths | High observation |
| Follow-up comparison | Method, teaching preparation and reviews labelled unavailable | Incomplete source gathering from linked public pages | High observation |
| Detailed phonics request | Eventually read `/phonics`, blending guide, careers, why-page | Curriculum understood once supporting pages retrieved | High observation |
| Direct URL opening | Several pages marked `Failed`, some later succeeded from web-search results | Consistent with a tool search/fetch constraint, but HTTP response codes unknown | High observation / unresolved root cause |

**Do not infer:** Claude has a fixed inferior index, Firebase blocks Claude, Google AI rankings have fallen, or the site returns 403/5xx. None is established.

## Source-level checks in main at branch cut

- `public/robots.txt`: public `/` allowed for `Claude-SearchBot`, `Claude-User`, `ClaudeBot`; private application routes disallowed. Source file is not proof of production crawler requests.
- `src/lib/publicRouteManifest.js`: `/team` is a static public route.
- `src/pages/TeamPage.tsx`: configured canonical `/team` and organisation/founder/breadcrumb/FAQ schema.
- `src/pages/phonics.tsx`: live programme pathway, synthetic phonics details and examples present. Before this branch it directly linked to `/class-samples`, but did **not** link to `/team` or `/faq`.
- `src/pages/team/teamPageContent.ts`: asserts all teachers are graduate educators with school-classroom experience; `src/pages/public/CareersPage.tsx` and `src/pages/FAQPage.tsx` describe graduation as preferred during recruitment. These claims may both be true (selection vs current staffing). **Do not edit until personnel evidence confirms wording.**

## Implemented on this branch

Add a concise, visible trust-navigation block immediately after the phonics teacher-delivery section with direct links to:

1. `/team` — educators, preparation and teaching quality.
2. `/class-samples` — real class examples.
3. `/faq` — parent FAQs and policies.

This does **not** claim third-party accreditation or a stronger outcome than evidence supports, and it preserves all original programme content and routes. Extend the existing phonics authority test to require the new paths and labels.

## Next validation gates

1. **CI / preview:** `npm run typecheck`, `npx vitest run src/tests/seo/phonicsBrick1Authority.spec.ts src/tests/seo/recoveryBrick2PhonicsAuthority.spec.ts`, `npm run build`, inspect `dist/phonics/index.html` for server-delivered anchors, inspect mobile and desktop rendering. Do not merge on source-only confidence.
2. **Live GET checks:** For `/`, `/phonics`, `/phonics/age-5`, `/team`, `/curriculum`, `/faq`, `/pricing`, `/why-tiny-steps`, `/class-samples`, record HTTP status, final URL, redirects, response type, initial HTML, canonical/noindex and repeatability. Use **GET**, not HEAD alone; vary user-agent as a diagnostic but recognise that spoofing a bot does not simulate its infrastructure.
3. **Hosting / CDN:** Inspect timestamp-correlated logs for verified Claude-SearchBot and Claude-User requests, origin 403/404/429/5xx, redirect loops, security rules and response timeouts. The absence of logs is not proof Claude did not search.
4. **Independent Claude retest:** Use new unseeded chats; test unbranded phonics discovery separately from explicit-name and explicit-URL tests. Record model, date, query, cited URLs, tool errors, recommendations and factual correctness. Preserve negative results.
5. **Editorial verification:** Obtain verified HR/teacher-training evidence and correct any misleading qualification statement only after approval. Check claims about progress reports, fees, recordings and refunds against production policy.
6. **Google safeguard:** Compare relevant Google Search Console query/page metrics before and after deployment, including the seven principal public pages; maintain current canonical and sitemap policies.

## Success criteria

- The three programme evidence links are visible, valid and accessible in initial prerendered HTML.
- No regressions in phonics page layout, internal navigation, canonical or indexability checks.
- Claude can resolve the branded identity and correctly describe phonics progression and available evidence in repeat tests; if direct reads still fail, capture tool errors and origin evidence rather than guessing.
- No claim of improved Claude inclusion, ranking or conversion until repeated third-party response evidence is available.

## Official context

- Claude web search / web fetch: https://support.claude.com/en/articles/10684626-enable-and-use-web-search
- Anthropic crawler user agents: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Google AI Search technical requirements: https://developers.google.com/search/docs/appearance/ai-features
