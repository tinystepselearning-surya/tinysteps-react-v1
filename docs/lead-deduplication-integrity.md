# Lead deduplication integrity

## Goal

Keep one active website lead document for one parent-phone + child identity while preserving every assessment submission as history.

This prevents repeat assessment submissions from inflating lead counts, SEO conversion reporting, demo conversion rates, and admissions conversion rates.

## Canonical identity

Website lead identity is derived server-side from:

1. normalized parent phone, and
2. normalized child name.

The identity is SHA-256 hashed before it is used as the `leadIdentityIndex` document ID. The raw phone and child name are not placed in the index document ID.

Indian numbers entered as `+91 <10-digit-mobile>`, `0091 <10-digit-mobile>`, or `<10-digit-mobile>` normalize to the same identity. Different child names on the same parent phone remain different identities.

The system deliberately does **not** deduplicate on phone alone because one parent can have multiple children.

## Runtime flow

The public assessment form retains its current strict anonymous Firestore create path. No public Firestore update permission is added.

1. Browser creates a normal random-ID `source=website` lead.
2. `onWebsiteLeadIdentityWrite` derives the canonical identity.
3. The first lead claims `leadIdentityIndex/{sha256Identity}`.
4. A later website lead with the same identity is merged into the indexed canonical lead when lifecycle safety checks pass.
5. The later random lead document is deleted only after its business data/history has been preserved.
6. Its submission is preserved under `leads/{canonicalLeadId}/inquiries/{sourceLeadId}`.
7. `leadMergeRedirects/{sourceLeadId}` points late attribution enrichment to the canonical lead.

This gives the operational Leads collection one canonical row while preserving the fact that the parent submitted more than once.

## Canonical fields

The canonical lead tracks:

- `dedupeIdentityKey`
- `dedupeCanonicalLeadId`
- `dedupeVersion`
- `inquiryCount`
- `firstInquiryAt`
- `lastInquiryAt`
- `programInterests[]`
- `interestTracks[]`
- `mergedLeadIds[]`
- latest `programInterest`, `interestTrack`, `mainConcern`, and `urgency`

At runtime the first website submission normally becomes canonical, so its existing `receivedAt` remains the first received date. `leadLifecycle` intentionally treats `receivedAt` as immutable. During historical cleanup, if a later lifecycle-rich record must remain canonical, `firstInquiryAt` preserves the earlier enquiry time rather than trying to rewrite the immutable `receivedAt` cohort anchor.

## Inquiry history

Each assessment submission is persisted as an inquiry event in:

`leads/{canonicalLeadId}/inquiries/{sourceLeadId}`

The interaction stores the submitted programme/concern, path, timestamps, and attribution fields that were available for that submission.

Therefore deduplication removes duplicate *lead rows*, not business history.

Firestore parent deletion does not cascade. Before deleting a historical duplicate, the transaction copies any existing `inquiries` and `communications` documents into the canonical lead. A group with more history than the bounded transaction can safely migrate is marked `duplicate_history_requires_manual_migration` and is not deleted automatically.

## Attribution race safety

PR #16 enriches first-touch attribution after lead persistence. Deduplication can race that detached enrichment.

`enrichPublicLeadAttribution` now supports a server-created `leadMergeRedirects/{sourceLeadId}` record. If the just-created random lead has already been merged/deleted, enrichment resolves the canonical lead and writes the full attribution into the corresponding inquiry event.

If the merged submission is chronologically earlier than the currently indexed canonical record, the redirect is marked `promoteFirstTouch=true`; enrichment may then promote that earlier submission's acquisition data to the canonical first-touch fields.

Later repeat submissions never overwrite canonical first-touch attribution. They update only last-inquiry attribution fields and the inquiry event.

## Safety around demos

Automatic deduplication must never delete a lead that owns lifecycle data that has not been safely migrated.

The runtime merge therefore follows an asymmetric rule:

- canonical has demo(s), fresh duplicate has none: safe to merge the duplicate;
- duplicate has demo(s), canonical has none: do **not** delete the duplicate automatically;
- both reference the same demo(s): safe only when the live demo relationship is consistent; any `demoSessions/{id}.leadId` owned by the duplicate is atomically repointed to the canonical lead before deletion;
- both reference different demo(s): do **not** merge automatically.

Unmatched enrollment identifiers and lifecycle-rich records without a concrete matching demo/enrollment relationship are also left for manual review. An identity index that points to a non-website lead or a different normalized identity is treated as drift and never used for an automatic merge.

Unsafe records are marked with:

- `dedupeConflict="duplicate_has_unmigrated_demo_links"`
- `dedupeConflictCanonicalLeadId`
- `dedupeConflictAt`

Conflict writes are idempotent. The trigger recognizes its existing marker and does not keep rewriting timestamps or fall through into a later destructive merge. If the underlying demo conflict is manually resolved, normal reconciliation can continue.

## Admin identity corrections

An admin may correct a website lead's phone or child name. That changes the canonical identity key.

When the edited lead owns its previous `leadIdentityIndex` entry and the corrected identity is free, the trigger atomically removes the stale identity entry and remaps the lead to the corrected identity.

If the corrected identity already belongs to another canonical lead, the trigger does **not** merge automatically. It records:

- `dedupeConflict="identity_edit_collides_with_existing_lead"`
- `dedupeConflictCanonicalLeadId`
- `dedupeConflictAt`

That conflict is sticky and idempotent until the identity is genuinely changed/resolved, preventing the marker's own write from causing a second-pass destructive merge.

## Existing duplicate backfill

Use:

```bash
node functions/scripts/backfillWebsiteLeadDeduplication.js
```

The default mode is **dry run only**. It prints duplicate groups, existing identity-index ownership, proposed canonical IDs, programme data, demo links, and conflict reasons.

The backfill respects any canonical identity already established by the live runtime trigger. It never silently replaces an existing index just because a batch heuristic would choose another record. When no index exists, it prefers a lifecycle-rich record as canonical before falling back to the earliest record. This avoids deleting a record that already owns demo/enrollment lifecycle data. Earlier enquiry time is still retained in `firstInquiryAt`.

After the production trigger is deployed and every group has been reviewed:

```bash
node functions/scripts/backfillWebsiteLeadDeduplication.js --apply
```

Apply mode:

1. skips groups with unsafe lifecycle/index conflicts,
2. seeds a canonical identity index only when one does not already exist,
3. transactionally re-checks the live index before every group (including appeared/disappeared indexes) and skips the group if it drifted after the report,
4. touches only safe candidate leads,
5. lets the same production Firestore trigger perform the merge.

Application Default Credentials are required. Never run `--apply` against production before reviewing the dry-run output.

## Firestore security

No Firestore rule widening is required.

- Anonymous visitors keep the existing narrow create-only website-lead schema.
- `leadIdentityIndex`, `leadMergeRedirects`, canonical merge writes, and inquiry-history writes are server-side Admin SDK operations.
- No deterministic PII-based lead document ID is exposed to the browser.

## Required validation

Before merge:

- Functions TypeScript build passes.
- Functions unit tests pass, including `websiteLeadDeduplication.spec.ts`.
- Root lint, typecheck, unit tests, build, and SEO smoke remain green.
- Firestore public-lead rule tests remain green with no rule changes.
- A two-submission emulator/production QA verifies one canonical lead, `inquiryCount=2`, two inquiry events, merged programme interests, and preserved first-touch attribution.
- A same-phone/different-child QA verifies two distinct leads.
- A duplicate-owning-demo QA verifies no automatic destructive merge and no conflict-trigger loop.
- An existing-canonical-demo + fresh-repeat-enquiry QA verifies the fresh duplicate can still merge safely.
- An admin identity-edit QA verifies stale index removal, collision protection, and idempotent conflict behavior.
- Historical dry-run/apply QA verifies an existing live identity index is never silently overwritten and index drift causes a skip.

The Functions emulator suite additionally covers simultaneous transactions, conflict-marker second invocations, canonical initialization idempotence, identity corrections/collisions, both attribution race orders, chronologically earlier first-touch promotion, demo-link repointing, and historical subcollection migration.

## Returning leads and cross-channel boundary

A repeat website enquiry updates `updatedAt`, `lastInquiryAt`, and `inquiryCount`, so the current Admin Leads workspace surfaces the canonical row as recently updated. It does not automatically reset `lost`, `no_response`, `not_interested`, or `wrong_fit`, and it never downgrades `admitted_confirmed`; any reactivation policy remains a separate product decision.

This reconciliation is intentionally website-only. It does not merge unmatched WhatsApp leads by phone because a reliable child identity may not be available on that channel.

## Expected Suresh/Rithanyaa result

Two website submissions for the same normalized phone and child should become one canonical lead. `programInterests` should preserve both Reading and Phonics when both were submitted, `inquiryCount` should become 2, and `firstInquiryAt` should preserve the earlier enquiry. Because this example has no demo lifecycle on either duplicate, the earlier website lead should naturally remain canonical, so its existing received date remains the row's received date as well.
