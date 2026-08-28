# Blog SEO Program — B2 Final Cannibalization & Intent Ownership

**Brick:** B2 — Cannibalization + canonical ownership  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b02-cannibalization-winners`  
**B2 destructive changes:** None — ownership is finalized here; the one new content merge/301 belongs to B3.

## Final result

After the repository audit, live-page review, user-shared 3-month Search Console evidence and content-by-content intent analysis, **B2 has zero unresolved ownership decisions**.

The important correction from the first B2 pass is that “ABC/letter names known but cannot read” and “letter sounds known but cannot blend/read” are **not the same search intent**. They are now separate owners. Conversely, the two reading-confidence articles are sufficiently duplicative that one owner is now selected for a B3 merge.

## Final ownership matrix

| Cluster | Final owner / relationship | Final action |
|---|---|---|
| Child knows ABC/letter names but cannot read | `child-knows-abc-but-cannot-read` | **Keep separately indexable** — earlier diagnostic stage |
| Child already knows letter sounds but cannot blend/read | `why-child-knows-letter-sounds-but-cannot-read-words` | **Protect owner**; legacy `child-knows-letter-sounds-but-cannot-read` remains retired → owner |
| School: why sounds are not enough | `why-letter-sounds-are-not-enough-to-read` | Protect distinct school/research audience |
| CBSE/NCF foundational literacy | `does-cbse-include-phonics-ncf-foundational-literacy` | Protect GSC-visible institutional owner |
| CBSE school scope & sequence | `phonics-scope-and-sequence-for-cbse-schools` | Protect GSC-visible institutional owner |
| International phonics benchmarks | `international-phonics-benchmarks-for-indian-schools` | Protect GSC-visible institutional owner |
| School phonics teacher training | `phonics-teacher-training-for-schools-implementation` | Protect GSC-visible institutional owner |
| Age to start phonics | `what-age-to-start-phonics` | Protect existing retirement of `best-age-to-start-phonics-classes-for-kids` |
| Blending | explainer + activities + weekly routine | Differentiate; do not blanket-merge |
| Reading confidence | `how-phonics-builds-reading-confidence` | **B3 merge planned:** merge unique branded material, then retire `how-tiny-steps-builds-reading-confidence` |
| Phonics class selection | checklist + online/school comparison + online benefits | Differentiate; preserve existing “best classes” retired URLs → checklist owner |
| Apps/games | decision page + activity pages | Differentiate |
| Phonics vs sight words / traditional reading / evidence | three distinct questions | Differentiate |
| Long vowels | `long-vowel-sounds-for-kids` | Evergreen owner + Week 4 public supporting noindex page |
| R-controlled vowels | `r-controlled-vowels-explained` | Evergreen owner + Week 5 public supporting noindex page |
| One-word answers | `child-gives-one-word-answers` | Protect existing retirement of `why-child-answers-only-in-one-word` |
| English-speaking hesitation | `child-understands-english-but-does-not-speak` | Protect existing Firebase Hosting 301 from `spoken-english-classes-for-kids-confidence` |
| Grammar rule knowledge vs sentence formation | two distinct parent problems | Differentiate |

## Search Console evidence captured

The user supplied a Google Search Console **3-month Pages** view on 2026-08-28. B2 now records the visible page metrics directly rather than only keeping a qualitative note.

| URL | Clicks | Impressions | Interpretation |
|---|---:|---:|---|
| `child-knows-abc-but-cannot-read` | 3 | 134 | Real independent visibility for the ABC/letter-name diagnosis |
| `why-child-knows-letter-sounds-but-cannot-read-words` | 8 | 460 | Stronger current owner for the letter-sounds/blending diagnosis |
| retired `child-knows-letter-sounds-but-cannot-read` | 8 | 615 | Historical duplicate equity must be preserved through redirect |
| `does-cbse-include-phonics-ncf-foundational-literacy` | 2 | 55 | Protect institutional owner |
| `phonics-scope-and-sequence-for-cbse-schools` | 1 | 24 | Protect institutional owner |
| `international-phonics-benchmarks-for-indian-schools` | 1 | 20 | Protect institutional owner |
| `phonics-teacher-training-for-schools-implementation` | 1 | 19 | Protect institutional owner |
| `what-age-to-start-phonics` | 0 | 112 | Current evergreen owner |
| retired `best-age-to-start-phonics-classes-for-kids` | 0 | 1403 | High historical impressions but zero clicks; preserve signals, do not reverse redirect from impressions alone |
| `how-kids-learn-blending` | 3 | 239 | Explainer has real visibility |
| `phonics-blending-activities` | 0 | 154 | Activity intent remains separately useful |
| `week-2-phonics-blending-club` | 1 | 25 | Supporting weekly intent |
| `how-phonics-builds-reading-confidence` | 0 | 7 | Generic informational owner selected on content/search-intent quality; branded duplicate will merge into it |
| `how-to-choose-phonics-classes` | 0 | 30 | Selection owner |
| `online-phonics-classes-vs-school` | 0 | 20 | Modality comparison |
| `why-parents-choose-online-phonics` | 0 | 35 | Online-benefit intent |
| retired `best-online-phonics-classes-for-kids` | 2 | 563 | Preserve historical equity through existing redirect to selection owner |
| `long-vowel-sounds-for-kids` | 0 | 15 | Evergreen concept owner |
| `week-4-phonics-long-vowels` | 0 | 10 | Supporting weekly routine |
| `r-controlled-vowels-explained` | 0 | 50 | Evergreen concept owner |
| `week-5-phonics-r-controlled` | 5 | 552 | Meaningful historical weekly visibility: **do not delete/redirect**; preserve as public support page and monitor noindex transition |
| `child-gives-one-word-answers` | 2 | 128 | Current comprehensive owner |
| retired `why-child-answers-only-in-one-word` | 5 | 500 | Preserve historical equity through existing redirect |
| `child-understands-english-but-does-not-speak` | 0 | 34 | Current diagnosis owner |
| redirected `spoken-english-classes-for-kids-confidence` | 0 | 3 | Existing Hosting 301 is appropriate |

These metrics are historical page-performance evidence from the shared 3-month screenshot. A redirected/noindexed URL may still appear because the reporting window includes its earlier state; the numbers are **not** treated as proof that Google currently indexes that URL.

## Why the two “cannot read” pages both survive

### `child-knows-abc-but-cannot-read`

This page starts before functional phonics is established: can the child recite ABC but still fail to identify sounds, hear phonemes, blend or decode? It owns the **alphabet/letter-name → sound/decoding** diagnostic.

### `why-child-knows-letter-sounds-but-cannot-read-words`

This page starts later: the child already knows individual sounds but cannot combine them into functional reading. It owns **sound knowledge → blending/sequencing/transfer**.

The true duplicate is the retired `child-knows-letter-sounds-but-cannot-read`, which already maps to the second owner.

## Reading-confidence merge finalized for B3

Owner:

`how-phonics-builds-reading-confidence`

Merge source:

`how-tiny-steps-builds-reading-confidence`

The branded article contains useful Tiny Steps-specific details — stage matching, warm correction loops, parent-visible progress and consistent correction language — but substantially repeats the generic article’s confidence/decoding/retry/home-routine framework.

**B3 implementation order must be:**

1. extract any genuinely unique branded material;
2. add it to the generic owner as a clearly branded practice/method section;
3. update internal links;
4. add a permanent 301 from the branded URL to the owner;
5. remove the retired source from sitemap/RSS/feed/discovery outputs;
6. preserve the redirect permanently.

B2 does not execute those destructive steps itself.

## English-speaking hesitation is already consolidated

Firebase Hosting already has:

`/blog/spoken-english-classes-for-kids-confidence`
→ **301** →
`/blog/child-understands-english-but-does-not-speak`

B2 now validates that exact Hosting rule instead of incorrectly treating the pair as unresolved.

Commercial query intent such as “spoken English classes for kids” should remain on the dedicated program/landing-page layer, not create another duplicate parent-diagnosis article.

## Age-to-start and one-word-answer redirects

Existing repository lineages remain final:

- `best-age-to-start-phonics-classes-for-kids` → `what-age-to-start-phonics`
- `why-child-answers-only-in-one-word` → `child-gives-one-word-answers`

The legacy URLs had substantial historical impressions/clicks in GSC. That is a reason to preserve their permanent redirects and remove conflicting discovery signals — **not** a reason to recreate duplicate content.

## Weekly long-vowel / R-controlled rule

Final architecture:

- evergreen concept guide = search owner;
- Week-series page = public practice/implementation companion;
- supporting weekly page = noindex under current repository policy;
- no deletion and no redirect.

Special caution: `week-5-phonics-r-controlled` showed **5 clicks / 552 impressions** in the shared three-month GSC view versus **0 / 50** for the evergreen guide. Because that is meaningful historical performance, B10 must explicitly monitor the noindex transition and evergreen-owner visibility rather than assuming the transfer has worked. The weekly page must remain available and internally useful.

## Final executable guard

Run:

```bash
node scripts/audit-blog-intent-ownership.mjs
```

The audit fails if any of the following regressions occurs:

- an unresolved `merge-review` or performance-validation gate returns;
- a canonical/current owner is missing from the real blog registry;
- a retired source disappears from the consolidation map or points to the wrong owner;
- a planned B3 merge source is already redirected before its unique content is merged;
- the Firebase Hosting English-speaking redirect disappears, changes destination or stops being a 301;
- a weekly supporting page stops matching the current noindex policy;
- an evergreen owner becomes noindex;
- a GSC-protected school URL is moved out of `Schools & Research`;
- captured GSC clicks/impressions become invalid or lose their 3-month/2026-08-28 provenance;
- one current, retired or planned-merge URL is assigned conflicting ownership.

The audit is executed by `src/tests/seo/blogIntentOwnership.spec.ts`, so normal CI tests the final B2 specification.

## B2 completion gate

- [x] 18 reviewed intent clusters have final ownership rules.
- [x] **0 unresolved ownership decisions remain.**
- [x] ABC/letter-name and letter-sound/blending parent intents are explicitly separated.
- [x] True letter-sound duplicate redirect lineage is protected.
- [x] Reading-confidence winner and B3 merge source are finalized.
- [x] English-speaking existing Hosting 301 is validated.
- [x] Four GSC-visible school/research owners are protected.
- [x] Age-to-start and one-word-answer legacy redirect equity is protected.
- [x] Long-vowel and R-controlled evergreen/support relationships are validated.
- [x] User-shared GSC metrics are captured with provenance.
- [x] The final ownership audit runs inside the unit-test suite.
- [x] B2 itself introduces no redirect, deletion, canonical migration, sitemap change or article rewrite.

## Handoff to B3

B3 no longer needs to decide **which URLs should own these intents**. It should implement only the final consolidation mechanics that are still missing — principally the reading-confidence content merge/301 and cleanup of any stale retired-source discovery artifacts — while preserving all ownership rules locked by B2.
