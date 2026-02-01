<!-- Quick reference card for Phase 2 implementation -->

# IMPLEMENTATION QUICK START (Phase 2)

## For Creating Each New Page

### Step 1: Create Page File
```tsx
// src/pages/public/{PageName}.tsx
import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import Meta from '../../components/common/Meta';

export default function {PageName}() {
  useEffect(() => {
    applySeo({
      title: "Your Page Title Here | Tiny Steps",
      description: "Your meta description (160 chars)",
      canonicalPath: "/{your-slug}",
      ogType: "website",
      jsonLd: [/* your schema here */],
    });
  }, []);

  return (
    <div className="container">
      {/* Page content */}
    </div>
  );
}
```

### Step 2: Add Lazy Import to `src/app/routes.tsx`
```tsx
const {PageName} = lazy(() => import('../pages/public/{PageName}'));
```

### Step 3: Add Route Entry
```tsx
{ path: '{your-slug}', element: <{PageName} /> },
```

### Step 4: Test
```bash
npm run dev
# Visit: http://localhost:5173/{your-slug}
```

---

## Meta Tag Templates

### Summer Camp Page
```tsx
title: "Summer English Camp 2026 (Phonics, Grammar & Public Speaking) | Tiny Steps"
description: "Intensive 7-week summer camp for ages 5–12. Phonics, grammar, public speaking with live mentors. Daily practice, capstone video. Limited seats."
keywords: "summer camp kids 2026, English summer camp, phonics camp, speaking camp"
canonical: "/summer-english-camp-2026"
```

### Phonics Lead-Gen
```tsx
title: "Online Phonics & Reading Classes for Kids (Ages 3–8) | Tiny Steps"
description: "1:1 online phonics classes: SATPIN to fluency in 12 weeks. AI-guided practice, weekly progress reports. Book free assessment."
keywords: "online phonics classes, phonics tuition, reading classes for kids"
canonical: "/online-phonics-reading-classes"
```

### Grammar Lead-Gen
```tsx
title: "Online English Grammar & Writing Classes (Ages 5–12) | Tiny Steps"
description: "Master grammar and writing with live mentors. Interactive lessons, games, writing prompts. From nouns to essays."
keywords: "grammar classes online, English grammar, writing classes kids"
canonical: "/english-grammar-writing-classes"
```

### Speaking Lead-Gen
```tsx
title: "Public Speaking & Communication Classes for Kids (Ages 4–12) | Tiny Steps"
description: "Build confidence and communication skills. S.P.E.A.K. method, storytelling, presentations. Start today."
keywords: "public speaking classes kids, communication courses, speech training"
canonical: "/public-speaking-communication-kids"
```

---

## JSON-LD Schema Templates

### Event Schema (Summer Camp)
```tsx
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Summer English Camp 2026",
  "description": "Intensive 7-week summer camp",
  "startDate": "2026-06-01",
  "endDate": "2026-07-20",
  "eventStatus": "EventScheduled",
  "eventAttendanceMode": "OnlineEventAttendanceMode",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://tinystepslearning.com/summer-english-camp-2026"
  },
  "offers": {
    "@type": "Offer",
    "price": "XXXXX",
    "priceCurrency": "INR",
    "url": "https://tinystepslearning.com/summer-english-camp-2026"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Tiny Steps Learning",
    "url": "https://tinystepslearning.com"
  }
}
```

### Course Schema (for Grammar & Speaking pages)
```tsx
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Grammar & Writing Mastery",
  "description": "Learn grammar and writing with live mentors",
  "provider": {
    "@type": "Organization",
    "name": "Tiny Steps Learning",
    "sameAs": "https://tinystepslearning.com"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "name": "Beginner",
      "courseMode": "Online",
      "duration": "P12W"
    }
  ]
}
```

---

## Components You Can Reuse

| Component | Path | Purpose |
|-----------|------|---------|
| ProgramHero | src/components/programs/ProgramHero.tsx | Title + hero image section |
| LevelTabs | src/components/programs/LevelTabs.tsx | Beginner/Intermediate/Advanced tabs |
| LearningJourney | src/components/programs/LearningJourney.tsx | Week-by-week breakdown |
| BookAssessmentForm | src/components/forms/BookAssessmentForm.tsx | CTA booking form |
| FAQAccordion | src/components/FAQ/FAQAccordion.tsx | FAQ section with filters |
| Testimonials | (check HomePage) | Social proof section |

---

## Verification Commands

### Check all routes
```bash
grep -n "path:" src/app/routes.tsx | head -30
```

### Test build
```bash
npm run build
```

### Check for TypeScript errors
```bash
npx tsc --noEmit
```

### Verify sitemap (manual check after update)
```bash
curl https://tinystepslearning.com/sitemap.xml
```

---

## Checklist for Each Page

- [ ] Create `.tsx` file in `src/pages/public/`
- [ ] Import `applySeo` and `Meta`
- [ ] Add `useEffect` with SEO config
- [ ] Add lazy import in `routes.tsx`
- [ ] Add route entry in routes array
- [ ] Test navigation locally
- [ ] Add to sitemap (if not auto-generated)
- [ ] Add to robots.txt Allow list (if needed)
- [ ] Create OG image (900x450px minimum)
- [ ] Add JSON-LD schema
- [ ] Test on mobile
- [ ] Check Core Web Vitals

---

## File Locations (Reference)

```
src/
├── app/
│   ├── routes.tsx                    ← Add lazy imports & routes here
│   └── index.tsx
├── components/
│   ├── common/
│   │   └── Meta.tsx                  ← Meta component
│   ├── programs/
│   │   ├── ProgramHero.tsx
│   │   ├── LevelTabs.tsx
│   │   └── LearningJourney.tsx
│   ├── forms/
│   │   └── BookAssessmentForm.tsx
│   └── FAQ/
│       └── FAQAccordion.tsx
├── pages/
│   ├── public/
│   │   └── seasonal/                 ← Create new pages here
│   ├── phonics.tsx                   ← Template example
│   ├── grammar.tsx                   ← Template example
│   ├── speaking.tsx                  ← Template example
│   └── FAQPage.tsx                   ← Extend this
├── lib/
│   ├── seo.ts                        ← applySeo function
│   └── schemas.ts                    ← JSON-LD schema library
└── content/
    └── parentsMeta.ts                ← Meta pattern example
```

---

## Timeline

| Week | Task | Files |
|------|------|-------|
| Feb 3 | Create 5 page files | SummerCamp, OnlinePhonics, Grammar, Speaking, FAQPage |
| Feb 3 | Add routes | src/app/routes.tsx |
| Feb 10 | Add schemas | schemas.ts (extend) |
| Feb 10 | Add OG images | public/og-*.png |
| Feb 17 | Write copy | Each page component |
| Feb 24 | Submit to GSC | New URLs |

---

## Common Mistakes to Avoid

- ❌ Forgetting `useEffect` wrapper for `applySeo()`
- ❌ Duplicate canonical paths
- ❌ Missing JSON-LD schema closing braces
- ❌ Not adding route to routes.tsx
- ❌ Not testing on mobile
- ❌ Using trailing slashes inconsistently
- ❌ Forgetting to update sitemap

---

## Questions?

See: `AUDIT_SUMMER_CAMP_2026_SEO_GEO.md` for full details

