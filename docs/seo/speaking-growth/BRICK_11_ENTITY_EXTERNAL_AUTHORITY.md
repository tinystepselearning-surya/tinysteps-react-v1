# Brick 11 — Entity & External Authority

Build date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **COMPLETE — STRUCTURALLY VERIFIED**  
Production deployment: **NO**

## Purpose

Brick 11 binds the Speaking growth system to Tiny Steps' existing organization, founder and official-profile authority architecture.

It does **not** create a second entity system, a Speaking-specific social account, a new founder page, a new review profile or a new public authority URL.

## Existing authority foundation reused

The repository already provides:

- canonical `EducationalOrganization` ID;
- canonical Tiny Steps public brand and organization name;
- canonical founder profile and Person ID;
- verified founder Person `sameAs`;
- organization `sameAs` contract;
- reusable official organization-profile contract;
- crawlable official-profile links on `/team`;
- crawlable founder identity links;
- off-site corroboration copy pack;
- safeguards against unsupported directory, review, accreditation and endorsement claims.

Brick 11 reuses these contracts rather than duplicating them.

## Speaking-specific authority contract

New source:

`src/lib/speakingEntityAuthority.ts`

Revision:

`2026-09-19-b11-v1`

It binds the Speaking project to:

- canonical commercial owner: `/speaking`;
- canonical organization ID: `https://tinystepslearning.com/#educational-organization`;
- public brand: Tiny Steps Learning;
- organization name from the semantic-facts registry;
- canonical founder Person ID and founder profile;
- official organization profile URLs;
- verified founder public profile URLs;
- ages 3–12 audience;
- live online delivery;
- Public Speaking within the canonical core programme set.

## Organization vs founder identity boundary

Brick 11 preserves the existing distinction:

### Organization identity

Organization-level public profiles remain controlled by the official profile registry and `EducationalOrganization.sameAs`.

### Founder identity

Founder-level profiles remain controlled by the founder profile registry and the founder Person `sameAs`.

Founder personal profiles must not be inserted into organization `sameAs`.

Organization profile URLs must not be inserted into founder Person `sameAs` merely for SEO.

## External-authority rules

Brick 11 freezes these rules:

- do not create a new social account purely for SEO;
- do not add an unverified directory to `sameAs`;
- do not add a review platform to `sameAs` unless a legitimate identity surface is verified;
- do not add an accreditation, curriculum board or education body without a real documented relationship;
- do not merge founder Person and organization `sameAs` identities;
- do not publish administration/account-management URLs;
- external profile facts must match the canonical semantic registry;
- external claims must not exceed the first-party evidence available on Tiny Steps.

## External profile alignment pack

Where a platform supports the relevant fields, the consistent public facts are:

- Tiny Steps Learning as the public-facing brand;
- `https://tinystepslearning.com/` as the primary website;
- live online English learning for children aged 3–12 as the service context;
- Phonics, Grammar and Public Speaking as the core programme set;
- Vannala Ravali Priya as Founder where founder information is supported.

These are consistency instructions, not permission to claim unsupported credentials, accreditations or endorsements.

## Current external spot-check — 2026-09-19

A current search-engine spot-check found externally discoverable LinkedIn evidence consistent with the first-party entity:

- the founder LinkedIn profile is discoverable under Ravali Priya Vannala and identifies Tiny Steps Learning;
- recent founder activity describes founding Tiny Steps Learning and references phonics, reading, grammar and communication;
- Tiny Steps Learning brand posts are externally discoverable and describe structured English learning and communication;
- a current Tiny Steps Learning LinkedIn job listing describes live online teaching across phonics, reading, grammar and communication.

This is corroboration evidence only. Search-engine crawlability is not treated as proof of ownership for every declared social platform.

Facebook, Instagram, YouTube, Pinterest and Quora can impose crawler restrictions. Their registry entries must therefore be changed only from verified Tiny Steps account information, not because a generic web crawler did or did not surface them.

## Speaking page relationship

`/speaking` already uses the shared `createWebPageSchema` contract.

That schema binds the page to the canonical Tiny Steps organization through:

- `publisher → EducationalOrganization`;
- `about → EducationalOrganization`.

Brick 11 does not add another Organization node to `/speaking`.

The Speaking page already links parents into the existing authority/evidence system through `/team` and other verified evidence surfaces.

## No new authority route

Brick 11 creates no route such as:

- `/speaking-authority`;
- `/speaking-entity`;
- `/public-speaking-experts`;
- `/speaking-founder`;
- `/speaking-social-profiles`.

Entity authority remains consolidated on the established organization/founder surfaces.

## Regression guard

New test:

`src/tests/seo/speakingGrowthBrick11.spec.ts`

It protects:

- `/speaking` as the canonical commercial owner;
- canonical organization and founder IDs;
- Public Speaking in the core programme set;
- organization `sameAs` parity with verified organization profiles;
- founder/organization identity separation;
- uniqueness of external profile URLs;
- conservative external-authority rules;
- crawlable organization/founder profiles on the existing Team authority surface;
- organization binding through the shared Speaking WebPage schema;
- absence of duplicate Speaking authority routes;
- brand, audience and delivery fact alignment.

## Structural verification

Initial source-level matrix:

- authority contract: **10 / 10**
- external-authority safety rules: **8 / 8**
- existing entity infrastructure: **7 / 7**
- route protection: **3 / 3**
- regression-spec structure: **6 / 6**

**Total: 34 / 34 passed.**

## Implementation delta

Brick 11 runtime/test implementation adds only:

1. `src/lib/speakingEntityAuthority.ts`
2. `src/tests/seo/speakingGrowthBrick11.spec.ts`

No existing production page or entity schema was rewritten because the required authority architecture already exists.

Brick 10 documentation and the master ledger were changed separately to record the skip decision.

## Executable-test limitation

No feature-branch GitHub Actions run is claimed for this Brick 11 head.

Full Vitest, typecheck, production build/prerender and browser QA remain part of the final Bricks 1–13 integration gate.

## Exit decision

Brick 11 is structurally complete when Speaking authority:

- resolves to one canonical Tiny Steps organization;
- keeps founder and organization identities distinct;
- derives external identities from verified central contracts;
- uses current first-party facts consistently;
- refuses unsupported directory/accreditation/review authority inflation;
- introduces no duplicate authority page.

That condition is satisfied on the isolated branch.

**Brick 11 status: COMPLETE — STRUCTURALLY VERIFIED.**
