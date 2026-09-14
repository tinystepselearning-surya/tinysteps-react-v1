# P1.2 — Founder Person `sameAs`

## Purpose

P1.2 completes the verified founder-identity link between the canonical Tiny Steps founder page and Vannala Ravali Priya's confirmed public LinkedIn profile.

## Canonical founder identity

- Founder: `Vannala Ravali Priya`
- Familiar display name: `Priya`
- Canonical founder page: `https://tinystepslearning.com/team/vannala-ravali-priya`
- Canonical Person `@id`: `https://tinystepslearning.com/team/vannala-ravali-priya#person`
- Verified founder LinkedIn: `https://www.linkedin.com/in/ravali-priya-vannala/`

## Implementation

The canonical `Person` node emitted on `/team/vannala-ravali-priya` now publishes:

```json
"sameAs": [
  "https://www.linkedin.com/in/ravali-priya-vannala/"
]
```

The founder page also exposes the same verified profile as an ordinary crawlable external link so the structured identity relationship is backed by a human-visible first-party link.

## Identity boundary

The founder personal LinkedIn profile is a **Person** identity and is deliberately not added to `EducationalOrganization.sameAs`.

Tiny Steps Learning's organization-level LinkedIn identity remains:

`https://www.linkedin.com/company/tiny-steps-learning/`

This preserves a clean separation between the organization entity and the founder entity.

## Safety / scope

- No unverified personal profile is added.
- No biography or employment-history claim is introduced.
- No review, directory or accreditation identity is added.
- Public ages remain 3–12.
- Standard 1:1 classes remain exactly 35 minutes.
- The existing Organization `sameAs` architecture remains unchanged.
