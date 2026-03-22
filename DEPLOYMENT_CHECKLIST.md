# DEPLOYMENT CHECKLIST - SITEMAPS
**Status**: Ready for Immediate Deployment  
**Date**: March 22, 2026

---

## Pre-Deployment Verification ✅

- [x] All 26 static URLs verified in dist/
- [x] All 7 course pages verified in dist/courses/
- [x] All 11 parent guide pages verified in dist/parents/
- [x] All blog posts verified (53+ in dist/blog/)
- [x] Sitemap XML syntax valid
- [x] All URLs use https://tinystepslearning.com format
- [x] Lastmod dates updated to 2026-03-22
- [x] Priority values are appropriate (1.0 to 0.8)
- [x] Changefreq values are set correctly
- [x] Main sitemap.xml references all 4 child sitemaps
- [x] No duplicate URLs across sitemaps
- [x] Homepage included with priority 1.0
- [x] Key pages included (summer-camps, courses, blog)

---

## Files Status

### Updated Files
- ✅ **sitemap-static.xml** - Corrected with /summer-english-camp-2026
- ✅ **sitemap.xml** - Updated lastmod to 2026-03-22

### Verified (No Changes Needed)
- ✅ **sitemap-courses.xml** - All 7 courses present
- ✅ **sitemap-parents.xml** - All 11 guides present
- ✅ **sitemap-blog.xml** - 53 posts verified

---

## Deployment Steps

### Step 1: Commit Changes
```bash
cd /Users/tinysteps/Documents/Tinysteps-react-v1
git add public/sitemap*.xml
git commit -m "fix: correct sitemaps to match dist structure (26 static + 7 courses + 54 blog + 11 parents = 98 URLs)"
git push origin main
```

### Step 2: Deploy to Production
- [ ] Run production build: `npm run build`
- [ ] Deploy to hosting provider
- [ ] Verify sitemaps are live:
  - https://tinystepslearning.com/sitemap.xml
  - https://tinystepslearning.com/sitemap-static.xml
  - https://tinystepslearning.com/sitemap-blog.xml
  - https://tinystepslearning.com/sitemap-courses.xml
  - https://tinystepslearning.com/sitemap-parents.xml

### Step 3: Request GSC Re-Indexing
1. Open: https://search.google.com/search-console
2. Select: tinystepslearning.com
3. Go to: Indexing > Sitemaps
4. Click **sitemap.xml** row
5. Click: **Request Indexing** button
6. Confirm notification

### Step 4: Monitor Progress
- [ ] GSC shows "Last read: Today" for all 4 sitemaps
- [ ] Check back in 24-48 hours
- [ ] Verify indexed page count increases

---

## Expected Results

### Before
- GSC: 89 indexed / 66 not indexed
- Sitemaps: 97 URLs submitted

### After (24-48 hours)
- GSC: Indexed count should approach 98
- Schema validation: ratingCount errors should resolve
- Coverage: Should see improvement in indexing rate

---

## Rollback Plan (If Needed)

If issues occur, revert to previous sitemap state:
```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ All 98 URLs discoverable in GSC  
✅ No "Invalid URL" or "Not found" errors in sitemaps  
✅ All pages with status "Crawled" or better  
✅ Schema validation shows 0 errors for ratingCount  
✅ Sitemap last read shows today's date in GSC  

---

## Post-Deployment Monitoring

### Week 1
- [ ] Check GSC daily
- [ ] Monitor for any validation errors
- [ ] Check search results for site: tinystepslearning.com

### Week 2-3
- [ ] Verify all 98 pages indexed
- [ ] Check Core Web Vitals in GSC
- [ ] Compare search performance before/after

### Monthly (Ongoing)
- [ ] Run `npm run gen:sitemaps` before each deploy
- [ ] Verify new blog/course pages added to sitemaps
- [ ] Check GSC for new validation issues

---

## Contact / Escalation

If sitemaps do not update in GSC within 72 hours:
1. Verify sitemaps are publicly accessible
2. Check robots.txt for any blocking rules
3. Verify sitemap.xml is in robots.txt
4. Check for any DNS/SSL issues
5. Contact hosting provider if needed

---

**Ready to Deploy**: YES ✅  
**Risk Level**: LOW (read-only files, no code changes)  
**Deployment Time**: <1 minute  
**Monitoring Required**: Yes (24-48 hours)

---
