# C3 — Final 15-Owner Reconciliation

Date: 2026-09-11  
Branch: `seo/c1-parent-commercial-search-universe`  
Scope: 15 user-facing commercial ownership boundaries / 16 machine-readable C2 clusters / 14 unique canonical URLs.

## Status

**Implementation: 15/15 RECONCILED**  
**C1 ownership input: unchanged**  
**C2 canonical ownership: unchanged**  
**Final merge gate: full exact-head CI pending**

The earlier second-pass audit reopened C3 because source facts, metadata, programme handoffs and a small number of trust claims no longer matched the canonical C2 ownership map. Every item from that audit has now been revisited page-by-page.

## Final owner matrix

| Commercial boundary | Canonical owner | Final state |
| --- | --- | --- |
| Generic phonics classes | `/phonics` | Generic provider/1:1/age/worldwide owner; comparison and fee intent handed off. |
| Best/comparison phonics | `/best-online-phonics-classes-for-kids-in-india` | Dedicated comparison/review owner with publisher transparency and no unsupported #1 claim. |
| Phonics fees/cost | `/phonics-fees-india` | Dedicated fee owner with canonical Tiny Steps pricing plus retained anonymised August 2026 market benchmark and methodology. |
| Reading classes | `/reading-classes-for-kids` | Generic reading/tutor/near-me owner; explicit fluency-programme intent handed to the specialist page. |
| Reading fluency programme | `/reading-fluency-program` | Narrow specialist owner for established decoding plus slow/choppy connected reading. |
| Grammar classes | `/grammar` | Grammar mechanics, sentence formation, tenses, punctuation and correction owner. |
| Writing / creative writing | `/writing-classes-for-kids` | Idea development, paragraphs, stories, school writing, editing and independent expression owner. |
| Spoken English | `/spoken-english-classes-for-kids-online` | Everyday conversation, fuller responses and conversational fluency owner. |
| Public speaking | `/speaking` | Public speaking, storytelling, presentation and audience-facing communication owner. |
| General communication skills | `/speaking` | Shares the same canonical Speaking owner; no competing communication URL created. |
| Confidence-building programme | `/confidence-building-program-kids` | Narrow commercial confidence owner around speaking comfort, participation, prompting and independence. |
| Broad/global/NRI English | `/online-english-classes-for-kids` | Global programme chooser for broad English intent. |
| Generic English tutor | `/online-english-classes-for-kids` | Same broad owner strengthened for generic 1:1 tutor intent; subject-qualified tutor searches route to subject owners. |
| Hyderabad English | `/online-english-classes-hyderabad` | Broad local online-service owner for Hyderabad; no physical-centre implication and no subject-qualified duplication. |
| General fees/value | `/pricing` | Cross-programme fee/package/value owner generated from canonical pricing configuration. |
| Demo / assessment / trial | `/book-demo` | Single transactional owner for one free 35-minute live 1:1 assessment and programme-fit recommendation. |

## Reconciliation completed

### Source-level facts

Commercial owner pages now carry their canonical facts directly. The owner-specific Vite text rewrites for `/phonics`, `/phonics-fees-india`, `/reading-classes-for-kids` and `/online-english-classes-for-kids` are removed. Final validation requires commercial owner sources to contain no stale `35–40` standard 1:1 wording.

### Runtime and prerender metadata

The route SEO registry was aligned to the final owner positioning for all changed commercial pages, including Reading Fluency, Writing, Spoken English, Confidence Building, broad English, Hyderabad, Pricing and Book Demo. Final C3 auditing now validates each route entry directly rather than searching the registry globally for loose text fragments.

### Owner boundaries

The final implementation explicitly separates:

- generic Phonics vs Phonics Comparison vs Phonics Fees;
- general Reading vs specialist Reading Fluency;
- Grammar vs Writing;
- Spoken English vs Public Speaking/Communication vs specialist Confidence Building;
- broad/global English vs Hyderabad-local English;
- broad English classes vs generic English-tutor intent on the same canonical URL;
- cross-programme Pricing vs phonics-specific fee research;
- programme pages vs the single Demo/Assessment transactional owner.

No country pages or AI-prompt landing pages were created.

### Canonical programme facts

The reconciled pages use the shared public facts/pricing configuration wherever appropriate, including the standard 35-minute live 1:1 format, ₹400 standard per-class rate, ₹4,800 / ₹6,400 / ₹9,600 standard 1:1 package totals, group pricing, one free 35-minute assessment, ages 3–12 public audience, and India + worldwide delivery where applicable.

### Pricing trust repair

`/pricing` was rebuilt around the canonical pricing configuration. Unsupported package-specific entitlement claims, guaranteed split-payment language and the incorrect game-subscription presentation were removed. Structured data now uses an offer catalog generated from configured standard/group/Ultra Premium pricing. Phonics-specific market benchmarking remains on `/phonics-fees-india`.

### Demo conversion repair

`/book-demo` now covers the complete programme recommendation system while keeping the form problem-led rather than forcing parents to choose a programme themselves. Unsupported `No credit card required`, sub-minute completion and guaranteed-slot availability claims were removed. The free offer is explicitly one 35-minute live 1:1 assessment per child, not a multi-class free course.

## Final verification contract

C3 revision `2026-09-11-c3-r4` requires:

- all 16 C2 clusters audited exactly once;
- all 15 user-facing ownership boundaries retained across 14 unique owner URLs;
- every owner source present and self-canonical/indexable;
- no unresolved `needs-strengthening` implementation signal;
- no owner-specific Vite correction dependency;
- no stale `35–40` standard 1:1 wording on commercial owners;
- Pricing and Demo trust regressions blocked;
- C1/C2 upstream contracts preserved;
- typecheck, full tests, production build/prerender and SEO smoke green on the final exact head.

## Merge decision

C3 implementation reconciliation is complete. The branch may merge only after the final exact-head CI validates C1, C2, C3, the production build/prerender and SEO guards together with current `main`.
