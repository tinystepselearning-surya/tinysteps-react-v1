# P1.1 — Founder Entity Corroboration

## Purpose

Strengthen the first-party connection between Tiny Steps Learning and its founder, Vannala Ravali Priya, without changing the existing EducationalOrganization `sameAs` contract.

## Confirmed founder public profile

- LinkedIn: `https://www.linkedin.com/in/ravali-priya-vannala/`

This is a person-level identity and must remain separate from the Tiny Steps Learning company LinkedIn URL:

- `https://www.linkedin.com/company/tiny-steps-learning/`

## Repository-controlled changes

1. Add a dedicated `FOUNDER_PUBLIC_PROFILES` contract for verified person-level founder profiles.
2. Expose the founder LinkedIn URL as an ordinary crawlable link on the `/team` authority surface.
3. Keep the organization profile cards driven by the existing organization-level contract.
4. Use the public brand `Tiny Steps Learning` in the human-visible official identity heading instead of exposing the internal/legal organization-name field there.
5. Add automated tests preventing founder and organization LinkedIn identities from being conflated.

## Boundary

This brick does **not** add the founder LinkedIn URL to `EducationalOrganization.sameAs`.

A future Person-schema update may add the verified founder profile to `Person.sameAs`, but only as a person-level relationship. Organization and founder identities must remain distinct.

## External cleanup note

Search engines may continue to show stale historical LinkedIn results for some time after profile changes. Repository code cannot remove or rewrite third-party search-indexed profile history. The current founder profile should consistently use:

- Name: `Vannala Ravali Priya`
- Role: `Founder, Tiny Steps Learning`
- Website: `https://tinystepslearning.com/`
- Founder page: `https://tinystepslearning.com/team/vannala-ravali-priya`
- Service context: live online English learning for children ages 3–12
- Core areas: Phonics, Reading, Grammar and Public Speaking

Avoid adding previous-employer details to Tiny Steps schema merely to match stale search results.

## Completion contract

P1.1 is complete when:

- the founder public-profile contract is present;
- `/team` exposes the verified founder LinkedIn link;
- the visible identity heading uses `Tiny Steps Learning`;
- founder and organization profile URLs remain separate under automated tests;
- normal typecheck, lint, unit tests, build and SEO/GSC workflows pass.
