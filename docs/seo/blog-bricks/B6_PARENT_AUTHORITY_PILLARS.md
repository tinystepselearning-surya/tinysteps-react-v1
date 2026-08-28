# Blog SEO Program — B6 Parent Authority Pillars

**Brick:** B6 — Parent authority pillars  
**Frozen baseline:** `6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b06-parent-pillars`  
**New article URLs created:** 0  
**Redirect / canonical / sitemap / indexing changes:** 0

## Objective

B6 strengthens the existing parent-facing URLs that Google Search Console is already testing instead of publishing more overlapping articles.

The guiding rule is:

> Strengthen proven or promising existing URLs, clarify their jobs, and connect them into one useful reading pathway. Do not create another article just because a related keyword exists.

## GSC evidence used

The user shared 3-month Google Search Console screenshots on 2026-08-28. B6 records the exact URL-level metrics that were visible in those screenshots so later editorial work does not depend on memory.

| URL | Clicks | Impressions | B6 role | Action |
|---|---:|---:|---|---|
| `/blog/satpin-phonics-guide` | 269 | 15,190 | Protected authority | Preserve primary intent/title; add only useful hub/diagnostic links |
| `/blog/phonics-for-parents-guide` | 4 | 934 | Parent hub | Keep dedicated research page; strengthen inbound authority network |
| `/blog/why-child-knows-letter-sounds-but-cannot-read-words` | 8 | 460 | Diagnostic owner | Deepen bottleneck diagnosis, evidence and next-step routing |
| `/blog/child-knows-abc-but-cannot-read` | 3 | 134 | Distinct diagnostic | Sharpen alphabet-name vs decoding boundary; cross-link to sounds-known diagnosis |
| `/blog/how-kids-learn-blending` | 3 | 239 | Stage explainer | Own developmental sequence and observable stage transitions |
| `/blog/phonics-blending-activities` | 0 | 154 | Practice satellite | Own exercises and practice selection; link back to explainer/diagnosis |
| `/blog/how-to-improve-reading-fluency-in-children` | 0 | 102 | Fluency pillar | Evidence-harden accuracy, phrasing, oral rereading and meaning guidance |

These aggregate metrics are used as **prioritisation evidence**, not as proof of query-level ownership or ranking causality.

## Why these seven URLs

### SATPIN is protected, not rewritten

`/blog/satpin-phonics-guide` is the strongest blog URL in the supplied GSC evidence by a wide margin. B6 therefore does not retitle or reposition it. It only adds logical links to the complete parent phonics guide and the letter-sounds diagnostic so some of that existing authority can help users navigate deeper.

### The phonics parent guide is the hub

`/blog/phonics-for-parents-guide` already has a dedicated, substantial React research page at `src/pages/blog/PhonicsForParentsResearchPage.tsx`. It includes definitions, the reading sequence, multilingual guidance, a home routine, myths, a programme-quality checklist, FAQs and an evidence appendix.

B6 deliberately avoids duplicating or rewriting that page wholesale. The stronger improvement is to make surrounding high-intent pages point back to it as the broad parent framework.

### The two cannot-read pages remain distinct

B2 established that these are different parent problems:

- `child-knows-abc-but-cannot-read` — alphabet names are present, but usable sound-to-print decoding may not be;
- `why-child-knows-letter-sounds-but-cannot-read-words` — letter sounds are present, but blending, sequencing or transfer is failing.

B6 reinforces this distinction with explicit cross-links and clearer diagnostic language. It does not merge them.

### Blending explanation and activities remain distinct

`how-kids-learn-blending` owns the developmental sequence: oral merging → printed words → connected-text transfer.

`phonics-blending-activities` owns the practical exercises a parent can choose once the bottleneck is understood.

Both pages now link to each other, the cannot-read diagnosis and the broader parent phonics guide. This creates a useful cluster without making both pages target the same job.

### Fluency is evidence-hardened

The previous fluency article contained useful ideas but also overly precise statements such as fixed minute targets, fixed word counts, fixed weekly frequency and a fixed 6–8 week escalation threshold. B6 removes those unsupported absolutes.

The revised page is built around:

- decoding accuracy before speed;
- guided repeated oral reading with feedback;
- level-appropriate connected text;
- phrasing and expression;
- comprehension / meaning checks;
- observable independence rather than stopwatch performance.

It also links directly to the earlier-stage diagnostic and blending pages so a parent does not try to solve a decoding problem with fluency drills.

## External evidence used for editorial hardening

B6 used current authoritative reading/search guidance as external verification, separate from the user-provided GSC metrics:

- Google Search Central — create helpful, reliable, people-first content; provide substantial value rather than search-first mass content.
- Google Search Central — use logical, crawlable internal links with useful anchor text.
- Education Endowment Foundation — systematic phonics should be explicit and matched to learners' current sound / letter knowledge; phonics supports reading accuracy but does not replace comprehension and vocabulary teaching.
- IES / What Works Clearinghouse — foundational reading guidance supports sound-letter mapping, decoding / word recognition and connected-text reading for accuracy, fluency and comprehension.
- National Reading Panel — guided repeated oral reading with guidance and feedback supports word recognition, fluency and comprehension.
- Reading Rockets — systematic phonics/decoding and guided oral reading guidance used as parent-readable corroboration.

The articles do not claim that these sources establish one universal timeline for every child.

## Internal authority pathway created

The intended parent route is now clearer:

1. **Starting phonics / broad question** → `/blog/phonics-for-parents-guide`
2. **Strong early SATPIN demand** → `/blog/satpin-phonics-guide`
3. **Knows alphabet names, cannot read** → `/blog/child-knows-abc-but-cannot-read`
4. **Knows letter sounds, cannot make words** → `/blog/why-child-knows-letter-sounds-but-cannot-read-words`
5. **Needs to understand blending development** → `/blog/how-kids-learn-blending`
6. **Needs concrete blending exercises** → `/blog/phonics-blending-activities`
7. **Words are more secure; connected reading is slow/choppy** → `/blog/how-to-improve-reading-fluency-in-children`

Commercial/support routes remain downstream (`/phonics`, `/reading-classes-for-kids`, `/book-demo`) rather than replacing the informational answer.

## Implementation safeguards

`src/content/blog/shared/parentAuthorityPillars.ts` records the seven URLs, their roles, exact user-shared GSC metrics and change policies.

`src/tests/seo/blogParentAuthorityPillars.spec.ts` protects:

- the 77-post isolated registry count;
- all seven authority URLs and exact GSC metrics;
- SATPIN title preservation;
- the dedicated parent-guide research route and its evidence depth;
- distinct ABC vs letter-sounds diagnosis ownership;
- distinct blending explainer vs activity ownership;
- direct authority/evidence links in the cannot-read diagnosis;
- removal of unsupported fixed fluency thresholds;
- fluency's NRP / IES / Reading Rockets evidence and accuracy-first framing.

## Explicit non-goals

B6 does **not**:

- publish a new phonics, blending or fluency article;
- merge the two cannot-read URLs;
- merge blending explanation with blending activities;
- change any slug;
- add redirects;
- change canonical rules;
- change robots / noindex policy;
- change sitemap generation;
- alter school/research ownership;
- redesign the blog index;
- perform B7 authorship/E-E-A-T work beyond evidence needed to make B6 claims responsible.

## Completion gate

- [x] GSC priority URLs are explicit and auditable.
- [x] No new overlapping article URL is introduced.
- [x] SATPIN is protected from unnecessary rewrite.
- [x] Parent phonics guide remains the broad hub.
- [x] ABC and letter-sounds diagnosis pages stay distinct.
- [x] Blending explainer and activity page stay distinct.
- [x] Fluency article removes unsupported fixed thresholds.
- [x] High-value pages are connected with crawlable, descriptive internal links.
- [x] Authority tests cover the real normalized registry.
- [ ] Exact-head full CI passes.
- [ ] Draft PR is updated to merge-ready and kept aside.
