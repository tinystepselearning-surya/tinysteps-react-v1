# GSC Index Recovery Deployment Checklist

## 1. Pre-Deployment Checks
- [ ] Confirm all SEO index-recovery changed files are reviewed and staged.
- [ ] Confirm sitemap outputs are regenerated in repo:
  - `public/sitemap.xml`
  - `public/sitemap-blog.xml`
  - (and sitemap index/resources as applicable)
- [ ] Confirm `docs/sitemap-indexability-audit.md` shows:
  - `Non-OK page URLs: 0`
- [ ] Confirm these 12 weekly posts are absent from `public/sitemap-blog.xml`:
  - `/blog/week-26-screen-smart-summer-routine`
  - `/blog/week-22-phonics-diagnostics`
  - `/blog/week-12-speaking-confidence-seeds`
  - `/blog/week-16-phonics-summer-plan`
  - `/blog/week-3-phonics-tricky-words`
  - `/blog/week-19-phonics-multisyllabic`
  - `/blog/week-9-grammar-conjunctions`
  - `/blog/week-15-speaking-debate-starters`
  - `/blog/week-14-speaking-visual-aids`
  - `/blog/week-11-grammar-creative-writing`
  - `/blog/week-23-grammar-speaking-bridge`
  - `/blog/week-17-grammar-assessment`
- [ ] Confirm high-intent upgraded URLs remain in sitemap files.

## 2. Deployment Notes
- Build/typecheck were intentionally not run in Codex during this workflow.
- Owner/maintainer should run any local or CI validation steps manually if required by release policy.
- Deployment should publish updated:
  - Public page content updates
  - `sitemap.xml`
  - `sitemap-blog.xml`
  - sitemap index/resources

## 3. Post-Deployment Live Verification
Check these live URLs after deployment:
- https://tinystepslearning.com/sitemap.xml
- https://tinystepslearning.com/sitemap-blog.xml
- https://tinystepslearning.com/child-not-reading-properly
- https://tinystepslearning.com/slow-reader-child-help
- https://tinystepslearning.com/online-english-classes-for-kids-india
- https://tinystepslearning.com/reading-fluency-program
- https://tinystepslearning.com/shy-child-speaking-confidence

Verification checklist:
- [ ] `sitemap.xml` loads successfully.
- [ ] `sitemap-blog.xml` loads successfully.
- [ ] Priority pages return live HTML and are crawlable.
- [ ] Canonical tags remain self-referencing on upgraded static pages.

## 4. Google Search Console Steps
- [ ] Resubmit `https://tinystepslearning.com/sitemap.xml` in GSC.
- [ ] Use URL Inspection for the top 10 priority URLs (below).
- [ ] Click **Test Live URL** for each.
- [ ] Request indexing only when Live Test indicates indexable.
- [ ] Do not bulk-request indexing for all 128 URLs.

## 5. Top 10 Manual Indexing Priority URLs
Use this exact order:
1. `/child-not-reading-properly`
2. `/slow-reader-child-help`
3. `/online-english-classes-for-kids-india`
4. `/reading-fluency-program`
5. `/shy-child-speaking-confidence`
6. `/english-classes-for-5-year-old`
7. `/english-classes-for-7-10-year-old`
8. `/parents/choosing-course`
9. `/blog/child-knows-abc-but-cannot-read`
10. `/blog/best-online-phonics-classes-for-kids`

## 6. Monitoring Plan
- [ ] Check GSC Page Indexing report after 7 days.
- [ ] Check again after 14 days.
- [ ] Track reduction in **Discovered - currently not indexed** and **Crawled - currently not indexed** counts.
- [ ] Track impressions/click trend for upgraded pages.
- [ ] Watch possible cannibalization in phonics cluster queries.
- [ ] Monitor seasonal pages separately for off-season behavior:
  - `/summer-reading-program-kids`
  - `/summer-speaking-camp-kids`

## Notes
- The 12 weak weekly posts were removed from sitemap inclusion only.
- Those posts were not deleted, noindexed, or redirected in this phase.
