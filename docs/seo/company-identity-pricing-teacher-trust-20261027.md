# Tiny Steps Learning — public identity, group fees, and teaching evidence (27 October 2026)

## Canonical identity and founding-year control
- Parent-facing/public education brand: **Tiny Steps Learning**.
- Official site: https://tinystepslearning.com/
- Location: Hyderabad, Telangana, India.
- Founder: Vannala Ravali Priya, with https://tinystepslearning.com/team/vannala-ravali-priya as the profile authority.
- `SEMANTIC_FACTS.brand.organizationName` and Schema.org `EducationalOrganization.name` use **Tiny Steps Learning**, with the stable `@id` unchanged.
- The previously published **2020** year is now referenced via `SEMANTIC_FACTS.brand.operatingSinceYear` to avoid independent hard-coded dates. **The exact business launch date is NOT independently verified here; confirm with founder/source records before claiming any day/month.**
- Trustpilot profile claim timing (April 2026) is a separate event and should never be represented as the company's opening year.
- Separate legal-entity or company-registration names must remain accurate in legal, tax, invoicing, and payment records; this work changes public educational-organisation identity only.

## Canonical current group offer (do not rewrite existing batches)
- Standard 1:1: **₹400 per 35-minute class**.
- Current public Group Classes: **₹250 per child for one 50-minute class**, **₹3,000 per child for 12 classes**; groups are level/schedule matched, up to four children.
- Current offer source: `NEW_GROUP_CLASS_PLAN` in `src/config/pricing.ts`; project-wide semantic facts and public pricing copy derive from it.
- `GROUP_MONTHLY_FEES` contains **historical group ratios/prices** needed for existing customer and internal billing semantics. Preserve it. Do not show those rows as today's new-enrolment offer.
- Historical search crawls and C4 experiment-control records may still contain old ₹180–₹300 wording. Those archived experiments are not the current product offer and should not be rewritten as though they described current pricing.
- The public pricing page and the FAQ must be the authoritative reference when older search snippets disagree. Search-engine refresh is not instant, and no AI citation can be guaranteed.

## Teachers and qualifications
- `/team` has a teacher-qualification section and a publication-controlled roster in `src/pages/team/publicTeacherProfiles.ts`.
- Initially no named individuals are listed: no verified, permission-cleared name + degree/qualification + subject specialism set was provided for public display.
- Add public educators only after verifying credentials and obtaining written consent for publication; include accurate specialisms and approved public name, not personal phone numbers, email, private HR profiles, or stored identification.
- Do not sync private `teachers`, `users`, or HR data to this public module or auto-render Firestore fields in a marketing page.
- Profile publication requires product owner sign-off; empty roster is intentional rather than an error.

## Academic quality without accreditation confusion
- Lead with specific, auditable programme design: sequenced phonics and English skills, active practice, independent transfer, teacher preparation and progress checks.
- CBSE, NCERT/NCF, ICSE, IB, Cambridge and branded Jolly Phonics are **not** names to borrow as credentials. Refer to source frameworks when explaining evidence or school contexts, but do not assert approval, affiliation, certification or licence without documentation.
- Keep appropriate, concise accuracy disclosures next to official-framework comparisons. Avoid turning every parent-facing paragraph into a defensive accreditation statement.

## Release gates
1. Obtain business confirmation of founding year **2020**, and exact launch date if one is to be published.
2. Receive consent-cleared teacher records (public name, precise qualifications, current teaching areas).
3. Run typecheck, new Vitest tests, relevant existing SEO/pricing tests, build, sitemap and structured data checks.
4. Verify /, /pricing, /faq, /team, /curriculum, /for-schools and both AI-readable files after preview deployment.
5. Do not merge until requirements and CI are reviewed; no production deployment is implied by this branch.
