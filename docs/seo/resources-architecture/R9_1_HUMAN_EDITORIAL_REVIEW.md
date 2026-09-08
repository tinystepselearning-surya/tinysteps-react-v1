# R9.1 — Human Editorial Review Layer

## Purpose

R9.1 adds truthful human-review governance to the 16-page Brick 9 controlled phonics pilot without moving editorial facts into the Brick 8 knowledge dataset.

The key rule is simple:

> A page may display a human review claim or emit `reviewedBy` structured data only after a real reviewer has approved that exact publication revision.

Infrastructure alone is not evidence of review.

## Architecture

### Brick 8 remains semantic knowledge

`src/content/phonicsKnowledge/**` continues to describe phonics concepts, curriculum alignment, examples, teaching notes, confusions and expansion eligibility. It does not store publication review claims.

### Brick 9 remains the publication ledger

`src/lib/phonicsProgrammaticPilot.js` continues to define the 16 explicitly approved public pages and their publication revision.

### R9.1 is the human review ledger

`src/lib/phonicsEditorialReviewRegistry.js` creates exactly one review record for every Brick 9 pilot page.

Each record contains:

- `conceptId`
- `path`
- `reviewerKey`
- `editorialReviewStatus`
- `reviewedAt`
- `reviewedRevision`
- `reviewNotes`
- `governanceRevision`

Allowed states are:

- `pending`
- `approved`
- `changes-requested`

A pending or changes-requested record must never produce a public review claim.

## Reviewer identity

The review ledger stores only a stable reviewer key. Public identity is resolved through `src/lib/editorialReviewerRegistry.ts`, which projects the existing canonical founder contract from `src/lib/schemas.ts`.

The initial assigned reviewer key is `founder-priya`, resolving to the existing canonical founder entity and profile at `/team/vannala-ravali-priya`.

This avoids duplicating the founder name, profile URL or Person `@id` inside the phonics dataset.

## Public rendering

`PhonicsKnowledgePage.tsx` calls `getApprovedPhonicsEditorialReview(page.path)`.

Only an approved record can render the visible attribution block:

**Reviewed for phonics accuracy by [reviewer]**

The reviewer name links to the canonical profile. The visible block also displays the reviewer role and review date.

Pending pages render no "review pending" badge and no fake expertise claim.

## Structured data

For an approved record only, the page's existing `WebPage` schema adds:

```json
{
  "reviewedBy": {
    "@id": "<canonical reviewer Person id>"
  }
}
```

The referenced Person entity already exists through the canonical Tiny Steps founder/organization graph.

No `reviewedBy` property is emitted for pending or changes-requested records.

## How to approve a page after real review

After the human reviewer actually checks the rendered page against the Tiny Steps curriculum and teaching intent, add an explicit decision to `REVIEW_DECISIONS` in `src/lib/phonicsEditorialReviewRegistry.js`.

An approved decision must include:

- `editorialReviewStatus: 'approved'`
- the real `reviewerKey`
- `reviewedAt` as `YYYY-MM-DD`
- `reviewedRevision` matching the Brick 9 publication revision reviewed
- a concise `reviewNotes` audit note

If corrections are required, use `changes-requested` and explain the requested change in `reviewNotes`. Do not set a review date or reviewed revision until approval.

## Review checklist

A reviewer should check at minimum:

1. the quick answer is accurate and not over-absolute;
2. examples match the described sound/spelling pattern;
3. exceptions and boundaries are represented where materially important;
4. teaching notes reflect the Tiny Steps curriculum sequence;
5. common confusions are pedagogically useful;
6. practice ideas are appropriate for the skill;
7. prerequisite and next-step relationships are sensible;
8. the page does not compete with an existing canonical topic owner;
9. the visible content and structured data make no claim the reviewer did not verify.

## Automated safeguards

R9.1 tests and audits enforce:

- one review record per Brick 9 pilot page;
- unique concept/path review keys;
- approved records require a date and exact reviewed revision;
- non-approved records cannot carry approval metadata;
- changes-requested records require notes;
- reviewer identity resolves from the canonical founder entity;
- visible attribution and `reviewedBy` schema are conditional on approval;
- Brick 8 remains free of review-governance fields;
- prerendered pending pages contain no review claim or `reviewedBy` schema.

## Initial state

R9.1 intentionally starts all 16 pilot records as `pending`.

That means the governance layer is ready, but no page is represented as human-reviewed until a real review is completed and recorded.

## Non-goals

R9.1 does not:

- claim that a review occurred when it did not;
- change the 16 Brick 9 URLs;
- publish Wave 2 concepts;
- change canonical ownership;
- modify Brick 8 curriculum data;
- create author/reviewer keyword stuffing;
- add fake credentials;
- add FAQ/HowTo schema;
- use review attribution as a substitute for content quality.
