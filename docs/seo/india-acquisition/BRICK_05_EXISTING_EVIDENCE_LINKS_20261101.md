# Brick 5/10 — Source-backed teaching and progress evidence links

**Date:** 2026-11-01 IST. Tracks [#842](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/842). GSC URL Inspection after Brick 10 by owner instruction.

## Scope and observed gap
The existing broad commercial owner `/online-english-classes-for-kids` mentions live teacher-led classes, class samples and parent-visible progress in the page's trust panel. Its hero already links to a class sample. But parents who reach the proof list cannot directly follow its three distinct evidence concepts from that section. Verified existing sources:
- `/team`: academic leadership, teacher selection/preparation, development, and quality-control explanations. Does **not** yet establish all named teachers, qualifications or individual photos.
- `/class-samples`: real class sample viewing surface.
- `/parents/tracking-progress`: how parents can assess skill transfer and progress without guaranteed results or interpreting lesson completion as mastery.

## Narrow implementation
Add three simple, accessible internal links below the existing trust list, matching those three destinations. Preserve original layout structure and all other calls to action, hero text, metadata, prices, C2 owner, schema, and booking logic.

**Do not** invent names, qualifications, certifications, star ratings, accreditations, photos or measured learning gains. Do not merge work from the separate teacher-profile/photo enhancement PR without source-backed human review and privacy/consent handling.

## Verification
- [ ] Link source test verifies exact matching semantic destinations.
- [ ] PR-head typecheck and production build/prerender SEO gate succeed.
- [ ] Check no parent/user record or private teacher data is exposed.
- [ ] Review copy/layout and approve before merge.
- [ ] Deployment must be checked separately from code merge.
- [ ] After Brick 10, manual GSC URL Inspection and index-selected canonical review (not claimed yet).

**Outcome hypothesis only:** more credible pre-enrolment investigation via existing evidence surfaces, not guaranteed traffic or conversion increase.
