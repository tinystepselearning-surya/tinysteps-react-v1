# Codex Handoff — GSC Crawled/Currently Not Indexed Remediation

Copy the prompt below into Codex after opening the Tiny Steps repository.

---

You are taking over the final engineering verification for a high-priority Google Search Console indexing remediation in this repository:

- Repository: `tinystepselearning-surya/tinysteps-react-v1`
- Working branch: `seo/crawled-not-indexed-audit-2026-08-09`
- Pull request: `#15` — `SEO: audit and remediate all 52 crawled-not-indexed GSC URLs`
- Target branch: `main`

## Mission

Finish, test, audit and merge PR #15 only if the entire remediation is technically correct and production-ready.

Google Search Console showed 52 example URLs under **Crawled — currently not indexed**. They have already been classified as:

- 23 genuine canonical pages we want indexed;
- 11 redirect/legacy aliases;
- 12 noindex weekly archive pages;
- 6 XML/RSS discovery resources.

Do **not** try to force all 52 URLs into the index. The required outcome is that only the genuine canonical pages are index-eligible/submission targets, while the other 29 behave according to their intentional redirect/noindex/resource policy.

## Read these files first

Before changing code, read:

1. `scripts/gsc-crawled-not-indexed-manifest.mjs`
2. `scripts/audit-gsc-crawled-not-indexed.mjs`
3. `scripts/write-gsc-index-submission-targets.mjs`
4. `docs/gsc-23-index-target-seo-aeo-geo-audit-2026-08-10.md`
5. any existing GSC/SEO audit document already changed in PR #15
6. `src/lib/blogIndexingPolicy.js`
7. `scripts/generate-sitemaps.js`
8. `src/lib/routeSeoRegistry.js`
9. `src/pages/BlogPostPage.tsx`
10. `src/pages/CourseDetailPage.tsx`
11. `src/lib/publicCoursePages.js`
12. `src/content/parentsMeta.ts`

Treat the manifest as the source of truth for this 52-URL remediation unless you find an objective implementation bug. If you believe a classification must change, stop and explain the evidence in the PR before changing it.

## The 23 remediation index targets

These must remain the only submission targets from this 52-URL issue set:

1. `/blog/june-school-reopening-english-readiness-plan`
2. `/faq`
3. `/parents/choosing-course`
4. `/parents/speech-confidence`
5. `/blog/online-phonics-classes-vs-school`
6. `/parents/common-mistakes`
7. `/blog/long-vowel-sounds-for-kids`
8. `/careers`
9. `/blog/r-controlled-vowels-explained`
10. `/blog/cvc-words-explained-for-parents`
11. `/blog/online-english-classes-for-kids-india`
12. `/book-demo`
13. `/parents/reading-at-home`
14. `/blog/how-phonics-classes-help-kids-read`
15. `/writing-classes-for-kids`
16. `/phonics-games-for-preschoolers`
17. `/blog/child-reads-in-class-but-forgets-at-home`
18. `/blog/digraphs-and-tricky-words`
19. `/blog/week-12-speaking-confidence-seeds`
20. `/parents/getting-started`
21. `/courses/phonics-advanced`
22. `/parents/tracking-progress`
23. `/courses/grammar-mastery`

## Phase 1 — Repository hygiene

1. Fetch the latest remote state and check out `seo/crawled-not-indexed-audit-2026-08-09`.
2. Compare the branch with `main` before touching anything.
3. Confirm PR #15 contains only indexing/SEO/content work relevant to this remediation.
4. Confirm `package.json` dependency versions are unchanged relative to `main`; only the intended SEO scripts/build-chain additions should differ there.
5. Confirm no unrelated Letter Tracing game files or other product features were modified by this branch.
6. Do not weaken existing audits merely to make CI pass.

## Phase 2 — Install and run the full test stack

Use the Node version declared by the repository. Run, in this order:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run gen:sitemaps
npm run seo:route-integrity
npm run seo:indexability-report
npm run seo:gsc-crawled-audit
npm run seo:gsc-index-targets
npm run build
```

If the repository has another stable SEO smoke/rendered check that is intended for CI, run it as well.

For every failure:

- diagnose the real cause;
- fix it on this branch;
- do not bypass, skip or delete the guard unless the guard itself is demonstrably wrong;
- rerun the relevant command and finally rerun the complete sequence.

The final `npm run build` must pass cleanly, including prerendering and the SEO guards it invokes.

## Phase 3 — Verify the 23 genuine pages one by one

Audit the **built/prerendered HTML**, not only React source.

For every one of the 23 URLs verify:

### Indexability / canonical
- renders as a real page, not a soft 404;
- self-referencing canonical points to the exact preferred URL;
- no accidental meta robots `noindex`;
- no `X-Robots-Tag: noindex` applies to the target;
- included in the correct canonical sitemap;
- no competing legacy URL is presented as another canonical target.

### SEO
- unique and descriptive `<title>`;
- useful meta description that matches the visible page;
- exactly one clear primary H1;
- headings form a sensible hierarchy;
- page has enough original, intent-matched information to stand alone;
- images, links and interactive content do not create a blank/thin prerendered page;
- internal links point to preferred canonical URLs, not old aliases.

### AEO / answer usefulness
- main parent/school/user question is answered early when the page is informational;
- comparisons and decisions are expressed clearly rather than keyword-stuffed;
- useful examples, checklists, troubleshooting or next steps are visible where appropriate;
- visible FAQs genuinely answer likely user questions;
- FAQ structured data, when present, matches visible FAQ content exactly.

### GEO / AI discoverability
Do not add invented “AI SEO” tags. Instead verify:
- entity/provider context is clear;
- audience and learning problem are clear;
- content contains specific explanations and practical examples;
- internal topic relationships point to the correct canonical follow-up pages;
- claims are precise enough to be quoted without losing critical context;
- no fabricated citation, unsupported percentage, guaranteed lesson count, guaranteed outcome or pseudo-clinical claim appears.

### Structured data
- JSON-LD parses successfully;
- types match the actual page content;
- Breadcrumb items use canonical URLs;
- Course/Service/FAQ/HowTo data does not claim anything that is absent or contradicted on the visible page;
- do not add `JobPosting` to `/careers` merely because roles are listed. Only use JobPosting on a real current single-job detail page if the repository has one and its data is accurate.

## Phase 4 — Specific page checks

Give these extra attention:

### `/faq`
- Confirm the new durable FAQ inventory is what appears in prerendered HTML.
- Confirm no hard “X% improve in Y lessons” promises remain.
- Confirm no prominent FAQ link goes to one of the noindex weekly archive URLs when an evergreen canonical page exists.
- Confirm visible FAQ and FAQPage JSON-LD agree.

### `/parents/reading-at-home`
- Confirm the old “Science-Backed” / “What research consistently shows” unsupported framing is gone.
- Confirm `/book-demo` is used instead of the old `/?book=1` internal CTA.
- Confirm the 10-minute routine is presented as a practical starting structure, not a universal guarantee.

### `/parents/getting-started`
- Confirm `/book-demo` is the canonical booking CTA.
- Confirm the old “Within 12 hours” promise is gone.
- Confirm assessment language is broad enough to reflect the child’s actual concern rather than claiming every demo tests every skill.
- Verify the current business facts: free, 35 minutes, 1:1 online, ages served, and no-obligation language. If any current production/business source disagrees, update the page and schema consistently.

### `/blog/child-reads-in-class-but-forgets-at-home`
- Confirm the old “path in the brain” analogy and unsupported “this is normal/common” generalisations are gone.
- Keep the page focused on class-to-home transfer, prompt differences, text level and observable reading breakpoints.

### `/phonics-games-for-preschoolers`
- Confirm age and practice-duration wording is readiness-based/flexible and not presented as a universal rule.
- Validate Breadcrumb, HowTo and FAQ structured data against visible content.

### `/blog/week-12-speaking-confidence-seeds`
- This weekly-slug page is intentionally indexable because the content has been converted into an evergreen speaking-confidence resource.
- Confirm other weekly archive policy is not accidentally changed to make all weekly posts indexable.

### `/careers`
- Verify current role names, requirements, application destination and availability against the current product/business source in the repository.
- Do not invent job availability or JobPosting data.

### `/book-demo`
- Verify visible free-demo facts and Service/FAQ structured data are identical and current.

### `/courses/phonics-advanced` and `/courses/grammar-mastery`
- Verify course title, description, curriculum, age/level claims, price or package references, reviews/testimonials, and CTA destination against current shared configuration.
- Do not duplicate these pages into new slugs.

## Phase 5 — Verify the 29 excluded URLs

Using `scripts/gsc-crawled-not-indexed-manifest.mjs` as the source of truth:

### 11 redirects
For each redirect/legacy URL:
- it must not appear in a canonical sitemap;
- internal site links should prefer the destination, not the alias;
- it must permanently consolidate to the manifest target (or Firebase trailing-slash normalization where explicitly specified);
- do not submit it as an independent URL.

### 12 noindex weekly archives
For each:
- `shouldNoindexBlogSlug()` must return true;
- it must be excluded from the blog sitemap;
- rendered/meta robots policy must make it non-indexable;
- do not include it in the submission artifact;
- do not change all weekly posts to indexable just to reduce GSC exclusions.

### 6 XML/RSS resources
- sitemap XML files must remain valid discovery resources;
- RSS files must remain functional and retain their intended `X-Robots-Tag: noindex`;
- none may enter the 23-URL landing-page submission artifact.

## Phase 6 — Internal-link and alias sweep

Search the indexable public source for links to:

- the 12 noindex archive URLs from the manifest;
- `/privacy` instead of `/privacy-policy`;
- `/terms` instead of `/terms-and-conditions`;
- `/main/book-demo` or `/?book=1` instead of `/book-demo`;
- `/courses/advanced-grammar` instead of `/courses/grammar-mastery`;
- `/courses/phonics` or `/main/courses/phonics/` instead of `/courses/phonics-foundation`;
- other manifest redirect aliases.

Where the link is an internal navigational link from an indexable page, replace it with the canonical destination unless there is a deliberate test/redirect-verification reason to retain the alias.

Do not remove the server-side redirect itself merely because internal links were cleaned up.

## Phase 7 — Validate the generated submission artifact

Run:

```bash
npm run seo:gsc-index-targets
```

Then inspect:

`artifacts/gsc-index-submission-targets.txt`

It must contain:

- exactly 23 full URLs;
- exactly 23 unique URLs;
- all on `https://tinystepslearning.com`;
- no redirect aliases;
- no noindex weekly archives;
- no sitemap XML;
- no RSS URL.

Cross-check every line against `GSC_INDEX_TARGETS` in the manifest.

## Phase 8 — Final diff and production-readiness review

Before merging:

1. Run `git diff main...HEAD` and inspect every changed file.
2. Confirm no package dependency drift.
3. Confirm no unrelated application behaviour changed.
4. Confirm all 23 content targets remain useful even if Google never indexes them; they should exist because they help the actual parent/school/user intent.
5. Confirm the site still has its broader healthy sitemap inventory. Do **not** reduce the entire website sitemap to only these 23 URLs—the 23 are only this GSC remediation subset.
6. Run the complete test/build sequence one last time after the final code change.

## Phase 9 — PR and merge

If and only if all checks are green:

1. Commit any final fixes to `seo/crawled-not-indexed-audit-2026-08-09`.
2. Push the branch.
3. Update PR #15 with a concise final audit summary including:
   - 52 URLs audited;
   - 23 index targets;
   - 11 redirects;
   - 12 noindex archives;
   - 6 XML/RSS resources;
   - commands executed and pass/fail results;
   - any remaining non-code operational verification.
4. Mark the PR ready for review if it is still draft.
5. Merge into `main` only after required GitHub checks are green and the repository’s normal merge policy is satisfied. Use the project’s normal merge method; do not bypass protections.

If any required test or production-readiness check remains red, **do not merge**. Report the exact blocker and the relevant file/command.

## Phase 10 — After merge/deployment

Do not automatically request Google indexing unless explicitly authorised.

After production deployment is confirmed:

1. verify several representative target pages on the live domain;
2. verify the canonical sitemaps on production;
3. verify redirects/noindex headers on representative excluded URLs;
4. regenerate or copy the final 23-URL list;
5. provide that exact list for manual Google Search Console URL Inspection / Request Indexing.

The final report must distinguish:

- **technically eligible for indexing** from
- **actually indexed by Google**.

Do not claim Google will index a URL merely because all technical/content checks pass.

---
