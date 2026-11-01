# Brick 9/10 — AI discoverability and brand-authority entity preflight

**Date:** 2026-11-01 IST. **Tracks:** [issue #849](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/849). **Status:** focused founder-schema review pilot, not an AI recommendation or Google indexing pass.

## Verified from repository main at review start

- `src/config/semanticFacts.ts` already establishes **Tiny Steps Learning** as canonical company name, **Tiny Steps** short name, official website, live 1:1/35-minute session format, age 3–12 audience and parent-facing programme facts.
- `src/lib/schemas.ts` already provides one `EducationalOrganization` node with stable `ORGANIZATION_ID`, `founder` Person with stable `FOUNDER_ID`, founder profile URL and `sameAs` company profiles. Company profiles are distinct from the founder's personal profiles.
- `src/pages/FounderPriyaPage.tsx` already publishes `Person`, `ProfilePage` and source-backed public founder LinkedIn / Instagram `sameAs`, connected with the company `@id`. `/team` describes founder-led academic oversight. These are **source declarations**, not third-party identity verification.
- Missing consistency edge: the *nested* founder Person on the global `organizationSchema` contains the same `FOUNDER_ID` but did not include the founder's existing `sameAs` links. Add `sameAs: [...FOUNDER_PUBLIC_PROFILE_URLS]` and import that canonical projection. Do **not** copy platform URLs or add unverified profiles.

## Exact pilot footprint

One additive `founder.sameAs` field and one import in `src/lib/schemas.ts`. The separate `organizationSchema.sameAs` company profiles, `founder` identifiers, existing profile page schema and links, titles, canonicals, robots, FAQ/course schema, content, pricing and all enquiry forms remain untouched.

The accompanying regression test checks brand/founder facts, consistent Person IDs, two distinct `sameAs` collections, continuity of company profile URLs and founder profile source. The PR gate runs Node tests, TypeScript and the repository's full prerendered SEO build. CI success does not mean Google or Gemini/ChatGPT indexed any page or uses the schema for recommendations.

## Material claims on hold, not silently “corrected”

1. The EducationalOrganization schema contains `foundingDate: '2020'`, **without founding-date documentation in the canonical semantic facts registry**. Do not imply that this is independently verified, do not convert it to `2026` (a website publication date is not proof of business formation), and do not change it without legal/operational source material.
2. `5000+` learners and `15+` countries are present in source. They are not upgraded to objectively audited third-party figures by this work.
3. Teacher biographies, qualifications, employment, profile photos and certification require consent and verified source records; maintain separation from the ongoing teacher-directory PR.
4. External profiles may be linked in JSON-LD but their ownership and platform publication state have **not** been independently validated here. No AI-native recommendation probability or ranking improvement can be claimed.
5. Google URL Inspection/selected-canonical checks for the five main commercial owners are **deferred until after Brick 10**, per owner instruction.

## Release criteria

- [ ] Identity/source tests pass on PR head
- [ ] TypeScript, full build, SEO prerender and triggered project gates pass
- [ ] Reviewer confirms no new founder facts or personal data and no company/individual `sameAs` mix
- [ ] Merge and separate Firebase deployment check after approval
- [ ] Follow up on founding-date documentation and teacher-profile evidence
- [ ] After Brick 10: manual GSC URL Inspection, live crawler test and native LLM answer sampling; monitor parent enquiries with appropriate attribution limits

**Expected effect:** clearer reuse of the same verified-on-site founder profile identifiers; not guaranteed increased search visibility or recommendation rates.
