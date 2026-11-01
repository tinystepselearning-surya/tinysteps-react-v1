# Brick 4/10 — Homepage → Online English choice gateway

**Date:** 2026-11-01 IST. Tracks [issue #840](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/840). Bricks 1–3 were merged before this work. Owner explicitly defers Google Search Console URL Inspection until **after Brick 10**.

## Verified input
The existing homepage contains a strong premium live 1:1 hero and four learning-pathway cards (Phonics, Reading, Grammar, Public Speaking), a prominent free 35-minute demo CTA and separate group format discovery. Its hero links to specialist subjects, while the broad existing C2 owner `/online-english-classes-for-kids` was not linked directly in `HomePage.tsx` or `ConversionHero.tsx`. The broad page already explains assessment-led placement for undecided parents and has transparent price and appropriate specialist navigation. Semrush and Keywords Everywhere each estimated ~1,000 India monthly Google searches for the broad query; no distinct parent or revenue forecast is inferred.

## Chosen change
Insert exactly one naturally worded contextual link into the homepage's existing "The complete English-learning journey" explanation for parents who do not know which programme fits. No added fifth card, additional CTA, hero copy rewrite, or new landing page. Existing `/phonics`, Reading, Grammar, Speaking and Spoken English targets remain distinct; canonical / pricing / demos / security untouched.

## Verification
Run `node --test scripts/test/india-acquisition-brick4-gateway.node-test.mjs` from PR CI. Also require existing Homepage Mobile Release Gate and SEO Soft 404 Production Build Gate, including prerender, to pass before merge. Mobile visual review is a separate release gate where an interactive screenshot is accessible. Build configuration is not proof of live Google indexing.

### Acceptance
- [ ] Brick 4 source/ownership gate green
- [ ] Homepage Mobile Release Gate green
- [ ] SEO Soft 404 production build green
- [ ] Review exact copy and semantics
- [ ] Approval, merge and Firebase deployment verification
- [ ] **After Brick 10:** Google Search Console URL Inspection for five C2 owners, including Google-selected canonicals

**Risk:** No search uplift guaranteed. This is intended to improve relevant discovery navigation and prospective parent clarity with a single contextual internal link.
