# TSSA-7/B5 — Internal Linking and External Brand Corroboration

**Audit date:** 25 October 2026 IST · **Decision:** scoped contextual-link correction + verifiable external identity inventory · **Integration:** PR gated on final-head CI, approved merge and Hosting live identity.

## Principle

Keep Tiny Steps’ established **279-item source-level canonical ledger and 28 parent-problem owners** unchanged. Strengthen existing internal routes only where a parent receives a more relevant next step. Do not infer an SEO win from link count, create new “authority pages”, change robots/canonicals, invent backlinks or confuse similarly named organisations.

**Engineering acceptance:**
- Preserve intent-specific Phonics versus broad Reading versus specialist Reading Fluency owners.
- Show a short, useful path from the Phonics/Reading resource hub into the matching teaching guide and programme.
- Protect every existing commercial/demo CTA, published canonical path and indexing policy.
- Reconcile 28 source-level parent-question paths with visible supporting/practice counts, **not** pretend metadata automatically means a rendered or clicked link.
- Preserve existing official-organisation and founder profile contracts; do not add unverified third-party identities, ratings or endorsements to `sameAs`.

## Reconciliation of prior 17-audit findings

| Finding | Source check as of 25 Oct | Decision |
|---|---|---|
| **A04-F003** specialist `/reading-fluency-program` lacked a contextual link to existing `/blog/how-to-improve-reading-fluency-in-children` | Confirmed before B5. Existing direct assessment/reading routes already present | **Fixed in PR:** one clear parent guide section; no new canonical page |
| **A08-F006** Phonics hub slow-reading path led into generic phonics support even when accurate decoding suggests reading fluency | Confirmed before B5. Hub had existing fluency educational guide but only Phonics CTA for live help | **Fixed in PR:** specialist `/reading-fluency-program` for secure decoders; broad `/reading-classes-for-kids` for multiple connected-reading gaps |
| **A08-F005** “Browse all phonics guides” targeting the blog instead of 31 specialist guides | **Already fixed in current main:** `href="#focused-phonics-guides"` explicitly says “Browse 31 phonics pattern guides”, while the blog CTA says “Browse phonics articles” | **No redundant edit** |
| **A05-F001** Beginner/Advanced Grammar curriculum CTAs led to generic curriculum | **Already fixed in main:** dedicated `/courses/grammar` and `/courses/grammar-mastery` level links. Broad `/curriculum?tab=grammar` intentionally remains for the full overview | **No redundant edit** |
| A04-F002 story comprehension diagnostic | Correct direct link to `/blog/why-child-reads-words-but-does-not-understand-story` already exists in `ReadingClassesForKidsPage.tsx` | **No redundant edit** |

**Exact new visible handoffs:** `/resources/phonics` → `/reading-fluency-program`; `/resources/phonics` → `/reading-classes-for-kids`; `/reading-fluency-program` → `/blog/how-to-improve-reading-fluency-in-children`. The original resource/subject course CTAs stay visible and no link becomes forced navigation.

## Live external evidence and attribution boundaries

Dated, publicly accessible material checked on **25 October 2026**:

| Third-party source | Publicly visible corroboration | Evidentiary limit / action |
|---|---|---|
| [Trustpilot — tinystepslearning.com](https://www.trustpilot.com/review/tinystepslearning.com) | A publicly reachable, labelled **claimed** listing named Tiny Steps Learning. The profile explicitly identifies **tinystepslearning.com**, online English learning and phonics/reading/grammar/speaking. Dated third-party reviews are visible | The listing and review opinions are not institutional quality accreditation. Claiming status on the website **does not independently demonstrate account-control access** in this audit. Review count, TrustScore and testimonial conclusions are variable and **not copied into code or schema**. Do not solicit selectively or incentivise |
| [LinkedIn — Tiny Steps Learning English Teacher vacancy](https://in.linkedin.com/jobs/view/online-english-teacher-%E2%80%93-phonics-grammar-communication-at-tiny-steps-learning-4462684326) | Dated third-party job platform page attributes an Online English Teacher opening to Tiny Steps Learning in Hyderabad; described phonics, reading, grammar, communication and live classes | Employer-provided advertisement is **self-asserted information distributed on a third-party platform**, not independent validation of teaching quality. No ranking/backlink inference |
| [LinkedIn — Ravali Priya Vannala profile](https://in.linkedin.com/in/ravali-priya-vannala) | Public result names Tiny Steps Learning in the founder's experience/about fields | Profile information is self-asserted; it does not establish education degrees/certifications, and it is a **person** identity, not organisation `sameAs` |
| [Tiny Steps Learning — official Team hub](https://tinystepslearning.com/team) | First-party team page links official social/organization profiles and founder page | This confirms first-party *declarations*, not independent platform ownership; the existing official profile contract remains untouched |

**Important disambiguation:** LinkedIn also indexes organisations named [Tiny Steps App](https://www.linkedin.com/company/tiny-steps-app) (`tinysteps.care`, IT/childcare SaaS), [Tiny Steps Therapy](https://www.linkedin.com/company/tiny-steps-therapy) (Australia, therapy/community) and [Tiny Steps Learning Center](https://www.linkedin.com/company/tiny-steps-learning-center) (US). These are **not** Tiny Steps Learning at `tinystepslearning.com` and must never enter its official identity, schema or backlinks inventory.

**No invented external links:** Existing B15 official public-profile registry, founder person separation and `EducationalOrganization.sameAs` remain the authority source of truth. Do **not** add Trustpilot or search-result candidates to the production `sameAs` set without verification of legitimate official identity and control. Do not claim “9 backlinks”, a domain-authority score, Dofollow links, third-party editorial endorsements, or Google Business Profile ownership. Public search results cannot establish any of those.

## Reproducible path and release audits

- `scripts/tssa7-b5-authority-path-audit.mjs` exports `artifacts/tssa7-b5/PARENT_28_PATH_AUDIT.csv` and `SUMMARY.json`. It reconciles all **28 registered parent owner entries** by subject, owner, hub, supporting and practice path presence. Missing supporting/practice metadata are **reported**, not silently counted as passes; registered links are **not automatically** live/visible.
- `scripts/test/tssa7-b5-authority-paths.node-test.mjs` protects the new intentional Reading handoffs, all 31-guide anchor, article/blog distinction, Grammar level destinations, demo link and no unverified review-sameAs drift.
- B5 CI performs TypeScript and full public production/prerender/SEO/indexing regressions. Rendered `/resources/phonics` and `/reading-fluency-program` must show the new links and unchanged self-canonical/index-permitted meta.
- Firebase release gate: no Functions, Firestore rules/indexes, teacher/parent app workflow, lead events or fees modifications. Require Hosting deployment and build-id verification before claiming live. Production indexing/rank/click/AI citation improvements must be measured separately (B6/B7).

**Status boundary:** B5 source linkage and evidence ledger can close after CI and release. Independent external account/profile metadata management and measurement of earned backlinks remain external watch items, **not** prerequisites for safely releasing the verified on-site links.


## Observed 28-parent source audit results

Dated GitHub CI `TSSA7_B5_SUMMARY`: **28/28** registered problem owners retain a practice destination, **20/28** explicitly register a secondary supporting destination, and **8/28** omit the optional `supportingPath` field. All eight omissions belong to the existing Speaking problem-route registry `src/lib/speakingCommunicationCompletionArchitecture.js`. Each of those eight **already has a canonical `ownerPath` and a `practicePath`**; they are *not orphaned* and do not by themselves warrant another URL, metadata-only synthetic reference or forced link. This is a transparent structural property of the original SP6 model, not eight broken public web links. A future editorial linking improvement must be checked against the relevant existing article and exact parent task before adding another contextual link.

The B5 CI path output `PARENT_28_PATH_AUDIT.csv` is source-level metadata; it cannot establish that every registered path is a visible link or clicked by a parent. The three new scoped links are separately inspected in generated/prerendered HTML.

## SEO Soft 404 runner regression repaired on the same scope

The existing `.github/workflows/seo-soft404-production-build.yml` used `runs-on: ubuntu-latest`. On 25 October 2026 the GitHub image rolled onto Ubuntu **26.04**, and the repository's pinned Playwright version failed **before page checks** with `Playwright does not support chromium on ubuntu26.04-x64`. This is an **CI environment regression**, not a reproduced Soft 404 in Tiny Steps production. GitHub itself documents the October–November migration of `ubuntu-latest` to Ubuntu 26.04 and advises pinning `ubuntu-24.04` until dependencies are ready: https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/ . The PR pins this one SEO build job to `ubuntu-24.04`, matching the already-green B3/B4/B5 Chromium runners, without altering Firebase/runtime page logic. Re-run the Soft 404 gate and inspect page checks before treating it as repaired.
