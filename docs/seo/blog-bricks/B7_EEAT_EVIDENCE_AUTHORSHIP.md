# B7 — E-E-A-T, Evidence & Authorship

## Status

Brick B7 hardens authorship, evidence transparency, and freshness signals for Tiny Steps blog content. It is intentionally isolated from the frozen blog baseline and must remain unmerged until the ordered B0→B12 integration pass.

Frozen baseline:

`6ba6b988c0203e0641eb149bc18b9e6962f79cd7`

Branch:

`seo/blog-b07-eeat-evidence-authorship`

## Objective

Make trust signals factual and internally consistent without inventing credentials, reviewers, expert endorsements, or artificial update dates.

B7 answers four reader/crawler questions:

1. Who is responsible for this article?
2. Is that responsibility represented the same way in the visible page and structured data?
3. What external evidence is actually cited on this page?
4. Is an update/review date real, or merely copied from publication metadata?

## Audit findings

### 1. Visible author and BlogPosting author could disagree

The generic `BlogPostPage` previously displayed either Priya or `Tiny Steps Academic Team`, while its `BlogPosting` schema always declared `Tiny Steps Learning` as an `Organization` author.

That meant a Priya byline could coexist with an organization-only structured author.

### 2. The generic author panel could show the wrong person

`AboutAuthor` defaulted to Priya. Generic articles did not pass their resolved article author into the component, so team-authored articles could end with a Priya author panel even though their hero said Academic Team.

### 3. Trust copy overreached the available repository evidence

The shared author component contained broad claims such as:

- `10+ years of experience`
- `Reviewed for classroom use`
- text implying a research page had been checked against live lessons

Those statements were not tied to a per-article review record or a reusable repository source proving the claim in that context.

B7 removes those generic claims rather than converting them into stronger-sounding badges.

### 4. Modified dates could imply freshness that was not maintained

The generic renderer set `dateModified = datePublished` whenever no explicit modified date existed.

B7 introduces an explicit optional `modifiedDate` field and emits `dateModified` only when that field is deliberately maintained after a meaningful editorial revision.

### 5. Evidence depth was invisible on generic articles

Some articles contain source links; others are practical Tiny Steps editorial guidance. The shared UI previously did not distinguish the two reliably.

B7 counts external source URLs present in the actual article body/FAQ and displays a factual evidence label. Zero-source articles explicitly say that no external source list is claimed rather than receiving a research-style badge.

### 6. The bespoke Jolly Phonics guide had structured authorship but no visible byline

The dedicated Jolly guide declared Tiny Steps Learning as an Organization author in JSON-LD but showed no matching author identity to readers.

B7 adds a visible linked byline, an author profile URL in BlogPosting schema, a factual authorship panel, and two direct evidence sources for its systematic-phonics claim.

## Author entity contract

### Founder-authored posts

If the source author matches Priya or an existing founder name variant in `PUBLIC_FACTS`, B7 resolves the article to:

- schema type: `Person`
- visible name: `Priya`
- role: `Founder, Tiny Steps Learning`
- profile destination: `/team`
- structured author URL: `https://tinystepslearning.com/team`
- `worksFor`: Tiny Steps Learning

The founder bio uses only responsibilities already represented on the Team page: academic direction, curriculum, lesson design, teacher guidance, teaching quality, and parent communication.

### Academic-team posts

Team-authored content resolves to:

- schema type: `Organization`
- entity name: `Tiny Steps Learning`
- visible role: `Academic Team`
- profile destination: `/team`

The role stays visible in the UI, while the structured author remains the real organization instead of creating a fictional `Person` or a separate unverified organization called “Tiny Steps Academic Team.”

### Research-desk posts

Research-labelled content resolves to:

- schema type: `Organization`
- entity name: `Tiny Steps Learning`
- visible role: `Research Desk`
- profile destination: `/team`

This preserves the useful editorial role label without pretending that “Research Desk” is a separately verifiable author entity.

## Evidence transparency contract

`getBlogEvidenceSummary()` scans article body and FAQ content for unique external HTTP(S) source URLs.

If source links exist, the UI reports the actual count, for example:

`2 external source links cited in this article`

If none exist, the UI says:

`Tiny Steps editorial guidance; no external source list is claimed on this page`

A heading containing Source, Sources, Reference, References, or Evidence is separately detected for audit purposes.

This is intentionally conservative. Presence of a URL does not automatically turn a page into “expert reviewed” or “research proven.”

## Freshness contract

`BlogPost.modifiedDate` is optional.

Rules:

- keep `datePublished` when a real publication date exists;
- emit `dateModified` only when an explicit `modifiedDate` is maintained;
- do not automatically copy the publication date into an “updated” field merely to populate schema;
- visible review/update labels must follow the same rule;
- if no separate update is recorded, say so rather than imply recent review.

## Visible trust changes

### ResearchArticleHero

The author chip is now a keyboard-focusable link to the responsible author/team context.

It displays entity name and editorial role separately, such as:

`Tiny Steps Learning · Research Desk`

or

`Priya · Founder, Tiny Steps Learning`

### AboutAuthor

The component now emphasizes:

- identified author/editorial responsibility;
- evidence actually present on the page;
- update policy;
- Team-page context;
- correction reporting through `/contact`.

Removed global trust claims include `10+ years` and `Reviewed for classroom use`.

### Generic BlogPostPage

Visible byline, author panel, meta author, and BlogPosting JSON-LD all derive from the same `resolveBlogAuthor()` contract.

The sidebar also identifies the responsible entity and states the article's real source-link status.

## Jolly Phonics guide

`/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading` now:

- visibly identifies `Tiny Steps Learning · Academic Team`;
- links the byline to `/team`;
- gives the BlogPosting Organization author a `/team` URL;
- removes the copied publication-date `dateModified` value;
- cites the Education Endowment Foundation phonics summary and National Reading Panel findings for its systematic-phonics evidence statement;
- displays the shared factual authorship/corrections panel.

## Google guidance alignment

B7 follows the current direction in Google Search documentation rather than treating “E-E-A-T” as a badge-adding exercise.

Relevant principles used during implementation:

- make it clear **who** created content;
- provide bylines where readers would reasonably expect them;
- make bylines lead to background/context about the author;
- in Article structured data, use the correct `Person` or `Organization` author type;
- keep visible authors and structured authors aligned;
- provide an author URL when available;
- use modification dates only when they represent a real article modification.

## Regression coverage

`src/tests/seo/blogEditorialTrust.spec.ts` protects:

- the 77-post isolated registry;
- one explicit trust profile for every registry article;
- founder `Person` vs team/research `Organization` semantics;
- `/team` author profile URLs;
- evidence count behavior for sourced and unsourced content;
- generic visible/schema author alignment;
- no automatic publication→modified date fallback;
- removal of unsupported shared trust claims;
- Jolly visible/schema authorship and evidence links.

## Non-goals

B7 does not:

- create new blog URLs;
- change canonical ownership;
- add redirects;
- change sitemap eligibility;
- change robots/noindex policy;
- invent academic, medical, literacy-specialist, or reviewer credentials;
- claim external expert review;
- create synthetic review dates;
- mass-add citations to every article regardless of need;
- change the B6 authority-owner decisions.

## Integration note

B7 is built independently from the frozen baseline. During final B0→B12 integration, conflicts with B4/B5/B6 in shared blog components must be reconciled explicitly rather than resolved by replacing one brick wholesale.
