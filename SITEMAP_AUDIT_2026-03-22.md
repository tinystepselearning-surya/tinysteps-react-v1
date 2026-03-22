# Sitemap Audit Report - March 22, 2026

## Summary
**Status**: ⚠️ Sitemaps need correction  
**Total URLs in dist**: 98 pages  
**Total URLs in sitemaps**: 97 URLs  
**Gap**: -1 (one course or blog post missing)

## Breakdown by Category

| Category | Actual Pages | Sitemap URLs | Status | Notes |
|----------|---|---|---|---|
| Static | 25 | 26 | ❌ 1 extra | Likely includes removed route; script excludes /summer-english-camp-2026 |
| Blog | 54 | 53 | ❌ 1 missing | Need to add new blog post |
| Courses | 8 | 7 | ❌ 1 missing | Check for new course added |
| Parents | 11 | 11 | ✅ Correct | All parent guides present |
| **TOTAL** | **98** | **97** | **-1** | |

## Action Items

1. **Remove** outdated URL from static sitemap:
   - If `/summer-english-camp-2026` is present, remove it (canonicalized to `/summer-camps`)

2. **Add** missing blog posts (check latest additions)

3. **Add** missing course (verify new course in courses.ts)

4. **Update lastmod** dates to 2026-03-22 for all sitemaps

5. **Verify** all URLs are actually present in dist/

## Recommended Fix

Run: `npm run gen:sitemaps`  
This will automatically regenerate all sitemaps to match actual dist structure and content files.

## GSC Impact

- Current: 89 indexed, 66 not indexed
- After fix: Should improve indexing as GSC will re-crawl updated sitemaps
- Validation: Re-validate sitemaps in GSC after deployment

---
Generated: 2026-03-22 20:55 UTC
