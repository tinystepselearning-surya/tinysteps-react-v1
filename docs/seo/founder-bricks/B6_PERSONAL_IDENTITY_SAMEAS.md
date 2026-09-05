# Brick 6 — Founder personal identity corroboration

## Goal

Connect the canonical first-party founder entity for Vannala Ravali Priya to the known personal LinkedIn profile without mixing the founder's identity with Tiny Steps Learning's organization profiles.

## Canonical entity

- Founder page: `https://tinystepslearning.com/team/vannala-ravali-priya`
- Person `@id`: `https://tinystepslearning.com/team/vannala-ravali-priya#person`
- ProfilePage `@id`: `https://tinystepslearning.com/team/vannala-ravali-priya#webpage`

## Personal corroboration

The founder Person node uses only this personal profile in `sameAs`:

- `https://www.linkedin.com/in/ravali-priya-vannala-2b4b67249/`

The URL is centralized as `FOUNDER_LINKEDIN_URL` and exposed through `FOUNDER_SAME_AS` so all references to the canonical Person remain consistent.

## Organization separation

The Tiny Steps organization keeps its own company/social `sameAs` identities. The personal LinkedIn URL is not inserted into `EducationalOrganization.sameAs`.

The company LinkedIn remains:

- `https://www.linkedin.com/company/tiny-steps-learning/`

Organization-level Quora handling remains governed by the existing organization-profile contract and is not attached to the founder Person.

## Visible identity link

The dedicated founder page contains a crawlable visible link to the personal LinkedIn profile with `rel="me noopener noreferrer"`. The page explicitly distinguishes Priya's personal professional profile from the Tiny Steps Learning company profile.

## Guardrails

Brick 6 does not import or reproduce third-party employment history. In particular, the founder page and Person schema do not add old KLAY/ClassMonitor roles, old titles, degrees, certifications, awards, rankings or unverified professional claims.

`sameAs` is used only to identify the same person across the first-party founder page and the known personal LinkedIn profile. It does not treat the external profile as the source of the current Tiny Steps role.

## Operational note

For the strongest external corroboration, the LinkedIn profile itself should use the same current identity language as the first-party founder page:

- Name: `Vannala Ravali Priya`
- Current role: `Founder, Tiny Steps Learning`
- Website: `https://tinystepslearning.com/team/vannala-ravali-priya`

Search-engine recrawling of LinkedIn can lag behind profile edits, so stale search snippets should not be copied into first-party structured data.

## Validation contract

Automated tests verify:

1. the canonical Person `@id` remains unchanged;
2. the personal LinkedIn URL is centralized;
3. Person `sameAs` contains the personal LinkedIn URL;
4. Team-page Person references use the same identity;
5. organization `sameAs` retains the company LinkedIn and excludes the personal LinkedIn;
6. the founder page publishes a visible `rel="me"` link;
7. no previous-employer claims are introduced by this brick.
