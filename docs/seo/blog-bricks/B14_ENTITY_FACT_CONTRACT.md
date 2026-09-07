# B14 — Public Entity Fact Contract

## Purpose

This file defines the facts B14 is allowed to strengthen publicly. It is intentionally narrower than a marketing biography.

The rule is:

> **Make verified facts easier to see and connect. Do not manufacture authority signals.**

## Tiny Steps Learning

### Canonical structured-data identity

- Organization type: **EducationalOrganization**
- Canonical organization name: **Tiny Steps Early Education**
- Public brand / alternate name: **Tiny Steps Learning**
- Short alternate name: **Tiny Steps**
- Canonical URL: **https://tinystepslearning.com/**
- Canonical `@id`: **https://tinystepslearning.com/#educational-organization**

Canonical entity:

- Name: **Tiny Steps Learning**
- Short name: **Tiny Steps**
- Type: educational organisation / online English learning school
- Audience: children ages **3–12**
- Core programmes: **Phonics, Grammar, Public Speaking**
- Delivery: **live online classes**
- Standard 1:1 class duration: **35 minutes**
- Small-group sessions: **longer than 35 minutes depending on group size**
- Service geography: India and global online learners
- Canonical website: `https://tinystepslearning.com`

These facts are already centralised in `src/lib/schemas.ts` and related public-fact configuration. B14 must reuse those sources rather than introduce divergent literals where a canonical constant exists.

## Founder

Canonical founder entity:

- Full name: **Vannala Ravali Priya**
- Familiar/display name: **Priya**
- Role: **Founder, Tiny Steps Learning**
- Canonical profile URL: `https://tinystepslearning.com/team/vannala-ravali-priya`
- Canonical Person `@id`: `https://tinystepslearning.com/team/vannala-ravali-priya#person`
- Canonical ProfilePage `@id`: `https://tinystepslearning.com/team/vannala-ravali-priya#webpage`
- Visible biography owner: `/team/vannala-ravali-priya`
- Organisation/team authority owner: `/team`

The earlier root-level founder identifier `https://tinystepslearning.com/#founder` is superseded by the dedicated first-party founder profile. Existing and future first-party references to Priya should resolve to the dedicated Person `@id` above.

Verified public academic responsibilities already represented on the site:

- curriculum direction;
- lesson design/development;
- teacher guidance/development;
- academic/teaching quality;
- parent communication;
- programme-level direction across Phonics, Reading, Grammar, Writing and Public Speaking.

B14 can make these relationships clearer in visible copy and structured data.

## Credentials policy

B14 must **not** add qualifications simply because they would sound authoritative.

Do not publish any of the following without a verified public source and explicit Tiny Steps approval:

- CELTA;
- TESOL;
- TEFL;
- Cambridge teaching certification;
- IB certification/accreditation;
- phonics-trainer certification;
- “certified expert”;
- “licensed specialist”;
- academic degree claims;
- years-of-experience claims;
- reviewer/medical/clinical credentials.

Absence of a credential in public copy is preferable to an unsupported credential.

## Teacher trust contract

Tiny Steps can truthfully describe its **process** where the process is already implemented and documented:

### Teacher preparation

`Select → Prepare → Strengthen`

- review spoken English, child interaction, subject understanding, reliability and online-class readiness;
- provide programme structure, lesson resources, teaching guidance and participation expectations;
- support delivery through feedback, academic review and continued development.

### Academic quality

`Assess → Place → Teach → Practise → Review → Communicate`

This is an operational trust signal. It should not be rewritten as a guaranteed individual outcome.

## School partnership contract

Canonical route: `/for-schools`

Canonical role:

> B2B implementation service for schools seeking a systematic phonics pathway, teacher preparation, classroom resources, assessment/reteaching guidance and ongoing implementation support.

The page may reference official frameworks and research criteria to explain the literacy expectations it is helping schools implement.

It must continue to state that Tiny Steps is an **independent education provider** and that references to CBSE, NCERT, NCF, DfE, Cambridge, IB or other frameworks do **not** imply endorsement, approval, certification or affiliation.

## School value claims

Safe, directly supportable value language:

- clearer parent communication;
- more consistent implementation across classrooms;
- stronger teacher readiness for the agreed programme;
- leadership visibility through implementation reviews and assessment checkpoints;
- access to a sequenced scope, resources, training and support.

Do not promise or imply that Tiny Steps will cause:

- increased enrolment;
- student retention;
- school revenue growth;
- referrals;
- higher reputation;
- guaranteed reading gains;
- faster learning.

## Evidence contract

The `/for-schools` page currently links to:

- NCERT / NCF Foundational Stage material;
- CBSE Foundational Stage / HPC resources;
- UK Department for Education systematic synthetic phonics criteria.

B14 may connect those already-visible sources to the page's structured-data `citation` property. This makes provenance clearer without adding unsupported facts or new schema types.

## External profiles and ratings

Stable organisation-profile URLs may later be included in the organisation's corroboration/distribution strategy when verified.

However:

- Trustpilot score;
- App Store score;
- Google rating;
- review count;
- social follower count

are **volatile values** and must not become permanent hard-coded entity facts unless there is an explicit maintained integration.

## Change-control test

Before future trust/entity copy is published, ask:

1. Is this fact already in a canonical Tiny Steps source or supported by a verifiable public source?
2. Is the visible statement no stronger than the evidence?
3. Does structured data match the visible page?
4. Could a reader reasonably mistake framework compatibility for endorsement?
5. Does this wording describe Tiny Steps' process, or promise an outcome outside Tiny Steps' control?

If any answer exposes ambiguity, the claim should be narrowed before publication.