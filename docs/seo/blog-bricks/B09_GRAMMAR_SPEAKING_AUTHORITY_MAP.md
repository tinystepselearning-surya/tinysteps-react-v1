# B09 Grammar + Speaking Authority Map

**Branch:** `seo/blog-b09-grammar-speaking-authority-v2`  
**Starting production base:** `4cff97f5c4feba39a8387d8d6870a4293c803f00`  
**URL policy:** zero new blog URLs in B9 unless a proven gap requires one. Current decision: **0 new URLs**.

## Decision

The current 76-post inventory already contains enough material to establish strong Grammar and Speaking & Communication authority without publishing new pillar articles.

B9 therefore strengthens existing owners, improves discovery placement for four parent diagnostics, and builds contextual internal-link relationships between evergreen owners, diagnostic owners and weekly support pages.

## Grammar authority graph

### Broad evergreen owner

`week-7-grammar-nouns-to-paragraphs`

Owns the broad parent intent around how grammar develops from naming words into clear sentences and short paragraphs. It is one of the explicitly indexable Week-series pages under the existing indexing policy.

### Protected diagnostic owners

`how-to-improve-sentence-formation-in-kids`

Owns the parent problem: the child knows words or ideas but cannot reliably build and expand complete sentences. Its B8 first-party checkpoint remains:

oral sentence → core structure → expansion → writing transfer.

`child-knows-grammar-but-makes-mistakes`

Owns the parent problem: the child can recall grammar rules but does not transfer them reliably into spontaneous speaking or fresh writing. Its B8 checkpoint remains:

rule recall → controlled use → spontaneous speaking → written transfer.

These two intents remain separate.

### Grammar support satellites

- `week-8-grammar-tenses` — tense/time control practice
- `week-9-grammar-conjunctions` — joining and expanding ideas
- `week-10-grammar-subject-verb` — subject-verb agreement practice
- `week-11-grammar-creative-writing` — planning and drafting support
- `week-17-grammar-assessment` — low-pressure diagnostic check
- `week-20-grammar-editing-camp` — editing/self-correction
- `week-23-grammar-speaking-bridge` — oral-to-written sentence transfer

Under the existing indexing policy these remain supporting Week-series pages rather than competing evergreen search owners.

## Speaking & Communication authority graph

### Broad evergreen owner

`week-12-speaking-confidence-seeds`

Owns the broad parent intent around building speaking confidence through complete answers, connected ideas, clearer voice, recovery after mistakes and gradual transfer to new listeners or presentation settings. It is one of the explicitly indexable Week-series pages under the existing indexing policy.

### Protected diagnostic owners

`child-understands-english-but-does-not-speak`

Owns the parent problem: the child understands English but hesitates, freezes or cannot answer independently. Its B8 checkpoint remains:

comprehension → modelled response → prompted response → independent response.

`child-gives-one-word-answers`

Owns the parent problem: the child answers briefly and needs help expanding ideas without turning conversation into a test. Its B8 checkpoint remains:

complete sentence → useful detail → reason / example / sequence.

These two intents remain separate.

### Speaking support satellites

- `week-13-speaking-structure` — Hook–Body–Close and organised short talks
- `week-14-speaking-visual-aids` — visual/prop support
- `week-15-speaking-debate-starters` — Claim → Reason → Example
- `week-18-speaking-video-feedback` — one-target feedback and self-review
- `week-21-speaking-competition-prep` — stage rehearsal and performance routines
- `week-24-speaking-family-showcase` — low-pressure audience transfer

Under the existing indexing policy these remain supporting Week-series pages rather than competing evergreen search owners.

## Discovery placement correction

Source categories stay unchanged. B9 changes only the parent-facing discovery read model for four diagnostic posts:

| Slug | Source category | B9 discovery category |
|---|---|---|
| `how-to-improve-sentence-formation-in-kids` | Parent Tips | Grammar |
| `child-knows-grammar-but-makes-mistakes` | Parent Tips | Grammar |
| `child-understands-english-but-does-not-speak` | Parent Tips | Speaking & Communication |
| `child-gives-one-word-answers` | Parent Tips | Speaking & Communication |

This lets the strongest diagnostic pages appear inside the topical lane parents are actually browsing without rewriting their URLs or source editorial categories.

## Cross-skill bridge

`how-phonics-grammar-and-communication-work-together` remains a cross-skill explainer, not the owner of any one Grammar or Speaking diagnosis. Its job is to explain the wider relationship and route readers toward the correct specialist owner.

The intended path is:

reading / phonics bottleneck → phonics authority  
grammar structure bottleneck → Grammar authority graph  
response / confidence bottleneck → Speaking & Communication authority graph

## Commercial boundary

Commercial intent such as "grammar classes for kids", "spoken English classes for kids" and "public speaking classes for kids" continues to belong to the programme / landing-page layer (`/grammar`, `/speaking`, `/courses`, `/book-demo`).

B9 does not create a commercial-intent blog duplicate.

The legacy `spoken-english-classes-for-kids-confidence` source remains retired through the B2-protected redirect to `child-understands-english-but-does-not-speak` and must not be resurrected as an authority owner.

## Internal-link rules

B9 uses contextual links rather than generic "read more" anchors.

Priority relationships:

- broad Grammar owner → sentence-formation diagnostic
- broad Grammar owner → grammar-transfer diagnostic
- sentence formation → conjunction support and oral-to-written bridge
- grammar transfer → tense, subject-verb agreement, assessment and editing support
- broad Speaking owner → understands-but-does-not-speak diagnostic
- broad Speaking owner → one-word-answer diagnostic
- broad Speaking owner → organised-speaking support
- diagnostics → broad owner and the most relevant adjacent diagnosis
- cross-skill explainer → both Grammar and Speaking broad owners plus the diagnostic routes

## Indexability boundary

B9 does not change `src/lib/blogIndexingPolicy.js`.

Existing indexable Week-series owners remain:

- `week-7-grammar-nouns-to-paragraphs`
- `week-12-speaking-confidence-seeds`

The other Grammar and Speaking Week-series pages remain public support pages under the existing noindex policy.

## New URL decision

- new Grammar pillars: **0**
- new Speaking pillars: **0**
- total new blog URLs: **0**
- expected live blog inventory after B9: **76**

Reason: the existing indexable Week 7 and Week 12 pages are broad enough to serve as evergreen topical owners once discovery and internal authority relationships are strengthened. Creating additional broad guides would increase cannibalization risk without adding a clearly unique parent intent.

## Cross-brick protections

- B2 speaking owner and redirect lineages remain unchanged.
- B6 phonics authority ownership remains unchanged.
- B7 visible/schema authorship and evidence rules remain unchanged.
- B8 first-party diagnostic sections remain present and are not rewritten.
- Hero-family architecture remains unchanged.
- No canonical, redirect, sitemap, RSS or indexability policy change is part of B9.
