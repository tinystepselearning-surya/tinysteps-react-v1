# Tiny Steps — AI Answer-Engine Source Readiness & Execution Baseline
**Date:** 2026-10-19 (Asia/Kolkata)  
**Execution owner:** [#748 — parent-first AI answer-engine visibility](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/748)  
**Baseline status:** **source architecture exists; native ChatGPT/Gemini citations and deployed per-page JSON-LD parity unverified**  
**Predecessor:** [GSC #735 technical closeout](../indexing-recovery-735/GSC_TECHNICAL_CLOSEOUT_2026-10-19.md), outcomes continued in #747.

## Goal and success criterion
When a parent asks a real educational question in ChatGPT Search, the Gemini app, Google AI Mode/AI Overviews, Perplexity or a conventional search engine, the appropriate existing Tiny Steps resource should be discoverable, intelligible and **eligible to be selected and cited**. Every answer should be child-appropriate and pedagogically accurate before a contextual programme invitation. Citation is a measurement outcome, **not** a guarantee or a property added by a schema tag.

Never create `/chatgpt`, `/gemini`, `/best-ai-phonics` or mass keyword-variant pages to target engines.

## Verified source-side assets — do not duplicate them
1. **Editorial owners:** A15 enumerated **83 unique published canonical-intent blog articles** in `public/sitemap-blog.xml` and matched source files; a historical 51-entry curated `llms.txt` blog list is *a subset*, not a complete 83-article publication count. Existing 14 Speaking knowledge owners are blog URLs, so **do not add them to the 83 as new articles**.
2. **Educational hubs/knowledge:** A08 audited 31 governed Phonics guide URLs; A09 described the Grammar hub + 38 published children (32 core + 6 reference); A10 described Vocabulary hub + 16 guides; A11 described the Speaking hub and 14 blog-owned knowledge URLs. Counts represent overlapping pathway systems, **not a unique total sitewide**.
3. **Crawler discovery policy:** source `public/robots.txt` explicitly allows public `OAI-SearchBot`, `ChatGPT-User`, `Googlebot`, `Bingbot`, `PerplexityBot`, `Claude-SearchBot` while repeating private-path restrictions. `GPTBot` is a distinct training-control crawler; `Google-Extended` is a Google product-use control token, **not the regular Google Search AI crawler**. Live served robots must be rechecked; source allow does not prove actual visits.
4. **Existing schema:** `src/lib/schemas.ts` supports `BlogPosting` with headline, description, authorship, published/modified dates, image and body; `src/lib/structuredDataGraph.ts` links article, canonical `WebPage`, `Blog` and publisher to one site entity graph; `src/lib/seo.ts` normalizes structured JSON-LD and default indexability. Other page-type schema and FAQs already exist. These assets require **per-page served-HTML and visible-content parity testing** rather than an entirely new schema framework.
5. **Resilience/discovery:** prerendered public HTML; protected 23 resource pages and blog lazy-module import fallbacks (#739/#743); canonical sitemaps/RSS; `public/llms.txt` and `llms-full.txt`. These optional LLM directory files have **no verified independent ranking advantage**.

## Official current platform contract
- Google Search AI Overview/AI Mode eligibility uses foundational **indexed + snippet-eligible** Google Search pages. No additional mandatory AI-specific schema, AI text file or special markup exists. Maintain useful human-visible text, internal links and accurate structured data. Source: https://developers.google.com/search/docs/appearance/ai-features
- Google structured data must match actual visible content and may help features without guaranteeing use. `BlogPosting` can describe a real article, including author/date; don't invent reviewers, tests, outcomes or FAQ answers. Sources: https://developers.google.com/search/docs/appearance/structured-data/article and https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- OpenAI's `OAI-SearchBot` is the relevant ChatGPT Search discovery crawler; `GPTBot` training control is independent. Allowing search discovery does **not** guarantee citation. Source: https://developers.openai.com/api/docs/bots
- Google announced dedicated **Search Generative AI** visibility reporting in 2026, rolled out globally as of August 31, 2026. Prefer that first-party UI in addition to classic page/query performance and traffic attribution. Source: https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports

## Initial parent-question-to-owned-source matrix
This is an **intent/ownership map**, not a claim of actual ChatGPT or Gemini citation. Reuse existing canonical source articles; review factual accuracy and current canonical/visibility in the audit before implementation.

| Parent's question (natural language) | Primary existing Tiny Steps answer owner | Supporting handoff or adjacent context |
|---|---|---|
| My child knows letter sounds but cannot read words — why? | `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | `/blog/how-kids-learn-blending`; /phonics |
| Should my child memorize sight words or learn phonics first? | `/blog/sight-words-or-phonics-first` | `/blog/science-of-phonics-learning` |
| My child reads words but does not understand stories | `/blog/why-child-reads-words-but-does-not-understand-story` | Reading comprehension/fluency guidance |
| How do I improve reading fluency at home? | `/blog/how-to-improve-reading-fluency-in-children` | `/reading-fluency-program` |
| Can phonics apps replace a teacher? | `/blog/are-phonics-apps-enough-for-kids` | /phonics (only when relevant) |
| What age should my child start phonics? | `/blog/what-age-to-start-phonics` | `/blog/what-is-phonics-for-kids` |
| How long does phonics usually take? | `/blog/how-long-does-phonics-take` | Individual child variation, not guarantees |
| My child knows grammar rules but keeps making mistakes | `/blog/child-knows-grammar-but-makes-mistakes` | /grammar, sentence practice |
| My child understands English but does not speak in class | `/blog/child-understands-english-but-does-not-speak` | /speaking, confidence versus language distinction |
| My child answers in only one word | `/blog/child-gives-one-word-answers` | Speaking sentence expansion guide |
| Are online phonics classes better than school phonics? | `/blog/online-phonics-classes-vs-school` | /phonics; **Google index verdict unresolved as of Oct 18** |
| How can I assess my child's phonics stage? | `/blog/phonics-diagnostics` | Explicitly a parent observation guide, not diagnostic test |

## Source- and live-audit gates
### E1 — Retrieval and access (read-only)
- On representative production pages, capture real HTTP 200, robots policy, Content-Type, last-modified/cache headers, redirects, canonical and index/snippet directives; download initial HTML, then use mobile browser with JS enabled and disabled (where practical). If requests fail, log **UNVERIFIED**, never silently substitute checked-in source.
- Test public `OAI-SearchBot` access rules separately from training/grounding controls; honor user/private-page denial and avoid pretending to be verified crawler IPs.
- Check visible answer text present in prerendered document even on JS lazy-chunk failure and direct article links from related hub/parent questions.

### E2 — Structured content parity
For each prioritized answer owner, parse deployed `application/ld+json` and require:
- correct self-canonical and no accidental second canonical owner;
- `BlogPosting` headline matching actual H1/topic, `datePublished` and `dateModified` truthful, non-anonymous visible author/editor where stated, publisher/site `@id` consistency, relevant crawlable image if provided;
- `WebPage` main entity pointing to article, valid graph references, breadcrumbs where relevant;
- `FAQPage` only where a real visible FAQ is present with the same questions/answers, and not as a promise of FAQ rich results;
- machine-readable text and articleBody not contradicting human-visible educational details;
- no false reviews, invented star ratings, pseudo-accreditations, guaranteed reading speed or implied clinical diagnosis.

Evidence needs exact URL, inspection timestamp, snippet of live HTML/schema, pass/fail/unknown, severity and fix ownership. Existing source helpers are **not proof every deployed article emits the same values**.

### E3 — Answer suitability and pedagogy
Prefer succinct upfront answer, clear context/age boundaries, original teaching examples, correct decoding/fluency/comprehension distinctions, parent actions and limitations. Review source dates/claims and credit real evidence/reviewers; remove internal editorial labels and templated filler only where confirmed. Preserve article owners and existing rankings. Explicitly distinguish educational checklists from a clinical assessment.

### E4 — Native answer-engine baseline
Evaluate real platform UIs/sessions, *not* a general web search standing in for Gemini or ChatGPT: start with the 12 mapped prompts, then sample the 220 questions in the 17-audit backlog. Log: date, exact prompt, product/mode, India geography and language, whether a linked Tiny Steps source is cited, accuracy/helpfulness, competitors, click destination and screenshot. Repeat independent prompts/contexts where feasible; do not cherry-pick a favorable answer. Record results as **UNKNOWN/UNTESTED** until sessions happen.

### E5 — Performance/decision review
Track citation coverage (# prompts yielding a first-party citation), correct URL selection, citation link reachability, organic+AI-feature impressions, attributable ChatGPT/Gemini referral traffic where available, and eventual parent enquiries. Include first-party Google Search Generative AI report and Google page/query trends. Any missing citations need **diagnosis first** (not indexed, inaccessible, thin answer, poor evidence, competitor stronger, demand too low), then a tightly scoped content/schema/links PR if justified.

## Current known opportunities and boundaries
A15 identified (source-audit findings): historical weekly posts include repeatable generalized lesson/time/research paragraphs; one parent article exposes internal “Blog 56” labeling; blog listing initially shows nine cards before load-more; school-research proof needs closer editorial claim review. These are **evidence candidates**, not verified Google/ChatGPT ranking causes. Prioritize qualified educational editing over mechanical schema stuffing.

## Delivery stages and release discipline
1. Merge this **documentation-only** baseline (no website deployment impact).
2. Complete production-first E1/E2 checks on 12 priority parent answers and then expand to the 83 blog owners and resource guides.
3. File only reproducer-supported P0/P1 fixes. Gate all implementation PRs on built HTML, JSON-LD validation, TypeScript, SEO CI, mobile hydration/JS-failure smoke and human educational review as relevant.
4. Run native platform E4 evaluation and report exactly what was cited, not generic “AI visible”. Continue with E5 outcome measurement. Manual search-product sessions may require an authenticated browser, and all platform-specific limits must be disclosed.

**No claims in this document imply that ChatGPT or Gemini currently selects Tiny Steps or that perfect schema forces selection.**
