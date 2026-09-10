# C2 — Canonical Commercial Keyword Ownership + Cannibalisation Map

Revision: 2026-09-10-c2-r1  
Status: ownership-complete  
Depends on: C1 base research complete, C1 international/AI research complete, C1 observed Google/Bing evidence complete

## Mission

Give every researched commercial parent query exactly one canonical commercial owner before any title, H1, page-copy, redirect, information-architecture or new-URL implementation begins.

C2 does not edit public pages. It resolves ownership and records cannibalisation decisions only. Implementation begins in C3.

## Evidence hierarchy

C2 uses:

1. C1 Google GSC query/page evidence;
2. C1 Bing Web query/page evidence;
3. C1 Bing AI grounding/citation evidence;
4. the 66-query international matrix;
5. the AI-style parent-query layer;
6. frozen KB canonical topic ownership;
7. current route/indexation/redirect manifests;
8. C0 commercial facts and conversion measurement contract.

## Canonical owner matrix

| Commercial cluster | Canonical owner | Priority | Rule |
| --- | --- | --- | --- |
| Generic online phonics classes | `/phonics` | P1 | Own generic provider, 1:1, age and international phonics intent. |
| Best/review/compare phonics | `/best-online-phonics-classes-for-kids-in-india` | P1 | Own explicit comparison intent only. |
| Phonics fees/cost | `/phonics-fees-india` | P1 | Own subject-specific phonics price research. |
| Generic reading classes | `/reading-classes-for-kids` | P2 | Own generic reading, reading-tutor and class-seeking problem intent. |
| Reading fluency programme | `/reading-fluency-program` | P3 | Own explicit reading-fluency programme intent only. |
| Generic grammar classes | `/grammar` | P2 | Own grammar, sentence-formation and grammar-tutor commercial intent. |
| Writing / creative-writing classes | `/writing-classes-for-kids` | P2 | Own writing and creative-writing provider intent. |
| Spoken-English classes | `/spoken-english-classes-for-kids-online` | P2 | Own spoken-English and fluency provider intent. |
| Public speaking | `/speaking` | P2 | Own public-speaking provider intent. |
| Communication skills | `/speaking` | P2 | Own general communication-skills classes. |
| Confidence-building programme | `/confidence-building-program-kids` | P3 | Own explicit confidence-building programme/class intent only. |
| Broad online English | `/online-english-classes-for-kids` | P1 | Own broad/global/NRI English provider intent and generic 1:1 English tutor intent. |
| Hyderabad online English | `/online-english-classes-hyderabad` | P1 | Own explicit Hyderabad/local broad-English intent only. |
| General/cross-programme price | `/pricing` | P1 | Own price/value/package/1:1-vs-group fee intent except phonics-specific fee research. |
| Free demo / assessment / trial | `/book-demo` | P1 | Own explicit transactional trial intent across all programmes and geographies. |

## Mixed-intent precedence

When a query contains more than one signal, C2 resolves ownership in this order:

1. explicit demo/trial/assessment booking → `/book-demo`;
2. phonics-specific fee/cost → `/phonics-fees-india`;
3. other programme or cross-programme price/value → `/pricing`;
4. phonics best/review/compare → `/best-online-phonics-classes-for-kids-in-india`;
5. explicit reading-fluency or confidence-building programme intent → specialist owner;
6. explicit Hyderabad broad-English intent → `/online-english-classes-hyderabad`;
7. otherwise provider/tutor/age/international intent → the relevant core programme owner.

This means a mixed phrase such as **“best online phonics classes in India with fees”** remains comparison-led and belongs to the comparison page, while the fee page supports it. Conversely a pure **“phonics classes fees”** query belongs to `/phonics-fees-india`.

## International ownership decision

C1 proves meaningful whole-site visibility in the USA, UK, Australia, UAE and Singapore, and Bing/Google show commercial phonics visibility. That is enough to research international demand but not enough to justify six separate country owners.

Therefore:

- UAE phonics → `/phonics`
- USA reading → `/reading-classes-for-kids`
- UK phonics → `/phonics`
- Australia public speaking → `/speaking`
- Singapore grammar → `/grammar`
- NRI broad English / generic 1:1 tutor → `/online-english-classes-for-kids`

The same inheritance rule applies to all 66 international C1 queries. **No country page is authorized in C2.**

Hyderabad is the exception because an existing page already has substantial observed GSC visibility and a clearly local intent boundary.

## AI-style ownership decision

AI-style prompts do not get separate pages. They resolve semantically to the same owner as equivalent Web-search intent.

Examples:

- “best live online phonics classes for a 5-year-old in Dubai…” → phonics comparison owner;
- “1 to 1 English tutor for a child in the US…” → broad English owner;
- “free online English assessment in UAE…” → `/book-demo`;
- “grammar and writing classes in Singapore…” → `/grammar` for the grammar-led prompt, with writing as support;
- post-demo broad-English enrolment question → `/online-english-classes-for-kids` rather than `/book-demo` because the trial stage is already complete.

All C1 AI-style queries receive `SEMANTIC` accounting status and still have exactly one canonical commercial owner.

## Keyword-accounting rule

Every C1 research item now resolves to exactly one:

- cluster;
- canonical owner path;
- commercial priority; and
- accounting status.

Allowed statuses remain:

`PRIMARY`, `SECONDARY`, `SEMANTIC`, `SUPPORTING`, `NEW OWNER`, `CONSOLIDATED`, `HOLD`, `REJECT`.

C2 creates **zero `NEW OWNER` items**. Hypothesis-only C1 terms that were previously marked HOLD remain HOLD, but still inherit a safe existing canonical owner so they cannot become accidental competing pages.

## Cannibalisation decisions

### `/public-speaking-communication-kids`

**Decision: consolidate to `/speaking` in a later implementation brick.**

Reason: `/speaking` is the frozen public-speaking owner, has materially stronger observed GSC/Bing-AI evidence, and also owns general communication-skills class intent. C1 produced no distinct commercial cluster that requires the legacy combined landing to remain a separate owner.

### `/english-grammar-writing-classes`

**Decision: demote from generic keyword ownership.**

It must not compete with `/grammar` for “grammar classes” or `/writing-classes-for-kids` for writing/creative-writing classes. A later implementation brick may reposition it as a chooser/support surface or reconcile it another way, but C2 does not redirect it because one combined URL cannot safely redirect to two independent programme owners.

### `/online-english-classes-for-kids-india`

**Decision: preserve existing consolidation.**

The route already 301-redirects to `/online-english-classes-for-kids`. Historical GSC impressions for the old URL do not justify resurrecting it.

### `/blog/online-english-classes-for-kids-india`

**Decision: support only.**

It may assist parent decision research but must not become the primary provider-intent owner.

### Resource hubs

`/resources/phonics`, `/resources/grammar` and `/resources/speaking` remain frozen informational discovery hubs. They support commercial owners and do not claim class/course/tutor/fee/demo intent.

## Strongest C2 evidence decisions

The current ownership structure is intentionally asymmetric because the observed search maturity is asymmetric:

- phonics is already the strongest commercial family, so C2 protects three separate mature intent boundaries: generic provider, comparison and price research;
- broad English has enough evidence for a global owner plus an established Hyderabad local owner;
- reading, grammar, writing, spoken English and speaking should concentrate weaker demand onto one core programme owner rather than fragmenting it into new long-tail pages;
- AI and international demand should strengthen existing owners before any geography-specific expansion is considered.

## Guardrails

C2 itself makes no:

- public page changes;
- title/H1 changes;
- copy changes;
- redirect changes;
- new commercial URLs;
- AI-prompt pages;
- country pages;
- frozen KB ownership changes.

These implementation decisions begin at C3.

## C2 completion gate

C2 is complete when:

- every C1 base query resolves once;
- every one of the 66 international queries resolves once;
- every AI-style query resolves once;
- every resolved query has one canonical owner and one accounting status;
- each commercial cluster has exactly one PRIMARY representative;
- international modifiers create zero country owners;
- AI-style prompts create zero AI pages;
- legacy overlap decisions are recorded;
- frozen KB owners remain unchanged;
- route existence and the existing India redirect are audited;
- dedicated C2 tests/audit/typecheck/full tests/build/SEO smoke pass on the exact branch head.
