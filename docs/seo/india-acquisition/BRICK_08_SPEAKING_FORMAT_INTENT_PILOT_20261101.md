# Brick 8/10 — Public Speaking format and parent choice

**Date:** 2026-11-01 IST. **Tracking:** [#847](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/847). **State:** Draft pilot pending review and CI, not a completed ranking recovery.

## Source-verified preflight

The `/speaking` page already owns the generic paid children’s Public Speaking and communication intent under frozen C2 and has significant curriculum, age-appropriate positioning, class samples, public video evidence, first-party parent feedback, progress, pricing, free assessment and specific FAQ material. `/spoken-english-classes-for-kids-online` is a distinct owner for everyday conversational fluency, while `/confidence-building-program-kids` is a separate programme for confidence-specific needs. Group Public Speaking has the existing format owner `/group-public-speaking-classes-for-kids`. No new URL or broad title/H1 rewrite is justified.

Historic keyword providers reported directionally different India monthly volume for `public speaking classes for kids`: KWE ~92 vs Semrush ~210; `public speaking course for kids` KWE ~210. These are overlapping keyword estimates, not actual parent or revenue counts.

## Small factual gap and implementation

The current FAQ implies that small groups *might* be available but does not state the existing four-child limit or level/schedule and demo availability boundaries. Align the FAQ with `src/pages/public/GroupClassPage.tsx`:
- Standard live 1:1 Public Speaking: existing `PUBLIC_SESSION_DURATION_LABEL`, individual pacing and teacher feedback.
- Separate group Public Speaking: at most four children per teacher; readiness and schedule matching; interest alone never guarantees immediate demos or placement.

Only one FAQ question/answer is modified in `src/pages/speaking.tsx`. The existing schema generation derives from the same FAQ array, ensuring displayed and structured content remain aligned. No change to metadata, canonical, pricing constants, enrolment, Firebase, static class samples, academy evidence, Spoken English ownership, confidence specialist, or group enquiry route.

## PR review / release gates

- [ ] Source regression check covering the speaking owner, Spoken English boundary, actual group-format rules and primary CTA
- [ ] TypeScript and full application build/prerender SEO checks
- [ ] Other triggered project CI and manual diff review
- [ ] Owner approval before merge and separately verified Firebase deployment
- [ ] After **Brick 10**, manual GSC URL Inspection and Google-selected canonical for five main owners; compare India query/page metrics and first-observed-parent enquiries

**Not claimed:** current live indexed status, AI recommendation uplift, guaranteed progress, instant group availability, national purchase-intent TAM or qualified lead increase.
