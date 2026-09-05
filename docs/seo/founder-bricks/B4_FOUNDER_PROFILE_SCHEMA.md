# Brick 4 — Founder ProfilePage & Person Entity Contract

## Goal

Make `/team/vannala-ravali-priya` the single first-party owner of Vannala Ravali Priya's structured person identity while preserving `/team` as the wider Tiny Steps organisation and academic-system authority page.

## Canonical graph

```text
EducationalOrganization
https://tinystepslearning.com/#educational-organization
        │
        └─ founder → Person
                     https://tinystepslearning.com/team/vannala-ravali-priya#person
                              │
                              └─ mainEntityOfPage → ProfilePage
                                 https://tinystepslearning.com/team/vannala-ravali-priya#webpage
```

### Canonical founder URL

`https://tinystepslearning.com/team/vannala-ravali-priya`

### Canonical Person ID

`https://tinystepslearning.com/team/vannala-ravali-priya#person`

### Canonical ProfilePage ID

`https://tinystepslearning.com/team/vannala-ravali-priya#webpage`

The previous root-level founder identifier `https://tinystepslearning.com/#founder` is superseded. New first-party structured data must not recreate it.

## Founder ProfilePage contract

The founder page publishes a `ProfilePage` merged with the site's canonical `WebPage` node. It must:

- use the founder page URL;
- be part of the canonical Tiny Steps `WebSite`;
- use the canonical Tiny Steps `EducationalOrganization` as publisher;
- use the canonical founder Person as both `mainEntity` and `about`;
- include a three-level `BreadcrumbList`: Home → Team → Vannala Ravali Priya.

## Person contract

The founder Person may contain only current evidence-backed public facts:

- name: Vannala Ravali Priya;
- familiar/alternate names already in the shared public-facts contract;
- job title: Founder;
- canonical founder profile URL;
- approved founder portrait;
- `worksFor` → Tiny Steps Early Education / Tiny Steps Learning organization entity;
- academic scope already represented visibly on the founder/team pages.

No degrees, certifications, awards, rankings, years-of-experience claims or previous-employer history are introduced by Brick 4.

## Cross-site first-party references

Brick 4 migrates existing first-party references so the same Person identity is reused:

- `organizationSchema.founder` → canonical founder Person;
- `/team` founder Person node → canonical founder URL and ProfilePage;
- Priya-authored blog bylines and BlogPosting author schema → canonical founder profile;
- default Priya author cards → canonical founder profile.

Academic Team and Research Desk profiles remain organisation-owned and continue to resolve to `/team`.

## `sameAs` boundary

Brick 4 intentionally does **not** add personal `sameAs` URLs. Personal LinkedIn or other verified external founder profiles belong to the later off-site identity brick after the exact public profile URLs and current identity details are confirmed.

Organization-level `sameAs` remains a separate Tiny Steps organization contract and is not copied onto the Person.

## Validation contract

Tests must confirm:

1. one canonical founder Person ID is used;
2. the founder page's merged page node contains `ProfilePage` and `WebPage` types;
3. `ProfilePage.mainEntity` and `ProfilePage.about` point to the Person;
4. `Person.worksFor` points to the canonical Tiny Steps organization;
5. the organization founder relationship points back to that Person;
6. Priya-authored blog profiles use the dedicated founder URL;
7. Team/Research Desk authors remain on `/team`;
8. no personal `sameAs` is added yet;
9. Brick 1–3 visible content and metadata remain unchanged.
