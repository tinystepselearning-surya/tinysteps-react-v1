# TSOS V2 — Master record and item dictionary design

**Status:** Proposed design for owner and independent review, revision 26. Design artifacts only; no production schema, allocated identifiers, P03 activation or runtime dependency.
**Source pin:** 701c7ec832dbe9c531964496fa09cd4a4948ddd2. Companion [machine-readable registry draft](TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json), [target design](../TSOS_V2_TARGET_DATA_AND_MODULE_DESIGN_DRAFT.md), [V2 programme](../SCHOOL_OS_ENTERPRISE_IMPLEMENTATION_PROGRAMME_V2.md), [v1 architecture](../TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md), [source catalogue](../discovery/P01_SOURCE_RECORD_CATALOGUE_2026-11-26.md).

## 1. Purpose and authority

A master record identifies a logical business record type, not a document instance or mandatory collection. An item identifies a semantic field belonging to a record type. The registry describes definitions, ownership, allowed values, relationships, storage bindings, data classification, access, validation, lifecycle and dependencies. It is metadata, not an alternative business-data store. Continue using typed named Firestore fields and approved domain commands. Do not build a universal item-number/value database, generic cross-domain CRUD endpoint or dynamic execution engine.

Registry source of truth is reviewed Git metadata, versioned with contracts. Initially no runtime dependency, no Firebase metadata collections, no extra production reads and no change to existing application behavior. A future runtime read-only catalogue or configuration distribution may be designed separately; it never grants access.

## 2. Stable identifier rules

- Record codes are globally unique uppercase three-letter proposed identifiers (PER, ENR, etc.). Item codes are qualified by record code and four-digit numeric suffix, e.g. ENR-1002. Initial draft uses 1001 onward; gaps allowed. Do not encode mutable position, label, tenant, environment or PII.
- Draft IDs are proposals until adoption. After adoption, a code is permanent; never recycle it even after retirement. A label or physical field rename keeps the code if semantics remain identical. A genuinely different fact receives a new code, with explicit supersession and migration relationship. Cross-record movement of authority requires reviewed mapping/lineage, not silent aliasing.
- Document IDs identify individual business records; schema codes are not instance IDs. Preserve verified legacy instance IDs or map deterministically with provenance. No field item IDs required in every application document.
- Shared audit fields may be reused through a versioned field set. Define qualified namespace/IDs for shared fields and nested members before allocation; the seed records existing field names/types without claiming those IDs. Composite fields must have bounded shapes and typed members before executable adoption.
- Stable value-set codes are separate from labels/localizations. Never change a code's meaning. Mark obsolete codes deprecated, retain historic interpretation, add replacement mapping with effective date. Do not force legacy enum conversion before transition rules and mappings are approved.

## 3. Registry layers

| Registry | Contents | Status |
|---|---|---|
| Master record | Code, logical type, grain, owner, class, storage binding, schema version, record key, lifecycle | Core seed provided; full grain/key/contract pending |
| Item | Item code, semantic name, definition, type, cardinality, nullability, origin, reference/value set, sensitivity, history and access | Initial seed provided; executable policy/validation pending |
| Value set | Stable codes, version, labels, effective dates, retirement and compatibility | Initial codes provided; labels/version transitions pending |
| Relationship | Typed source/target, multiplicity, effective dates, integrity, ownership | Item-level references seeded; formal inverse/multiplicity and integrity contracts pending |
| Storage mapping | Collection/subcollection/document grain, typed field path, alias, transformation, mapping version, evidence and coverage | Source-backed and candidate bindings distinguished; unverified paths not provisioned |
| Command/query | Owner, authorization, invariant, input/output, idempotency, read budget and revision | Future reviewed contracts; no arbitrary execution |
| Screen/report | Stable screen or report code, approved item/query bindings, presentation and visibility | Future design; rendering never grants permissions |
| Configuration | Versioned typed key, allowed override scopes, effective time, validation and fallback | Future design; code enforces invariants |

Lifecycle: proposed -> reviewed -> adopted -> deprecated -> retired. Only adopted entries may become executable dependencies, after affected implementation and release gates. Deprecated means supported for compatibility; retired does not imply deletion of historical data. Record migration status separately from registry lifecycle.

## 4. First registry seed

The JSON companion provides 29 logical record candidates, 13 with detailed seed items and 16 catalogue-only. There are 76 record-specific item definitions (43 source-backed identity fields, 33 target proposals or candidate mappings) and 18 value-set definitions. Shared inherited identity audit fields are separately described, not included in 76. These are not all fields across the platform.

All eight current identity record interfaces and collection names are reused from `functions/src/schoolOS/identity/contracts.ts`; no new authority or complete live population claim. Source-backed fields retain original TypeScript optionality and explicit nullability. `households` remains a held contract. The identity source includes both Person and LearnerProfile countryCode; semantic equivalence and ownership must be reconciled before removing either. The illustrative PER-1004 dateOfBirth is prospective and unbound, not asserted to exist. It must never be derived from a recorded age; collect it only with approved purpose, access and minimization.

Worked Enrollment seed:

| Item code | Proposed semantic field | Meaning | Current source / disposition |
|---|---|---|---|
| ENR-1001 | enrollmentId | Stable enrollment identity | id; preserve verified ID |
| ENR-1002 | learnerProfileId | Reference to learner profile | studentId; resolve verified aliases, not string-copy assumption |
| ENR-1003 | deliveryOfferingId | Academic delivery offering | courseId; mapping candidate, course is not itself an offering |
| ENR-1004 | status | Enrollment lifecycle | Existing status vocabulary retained pending explicit transition mapping |
| ENR-1005 | effectiveStartAt | Verified start of participation | Unbound proposed field; not automatically createdAt |
| ENR-1006 | effectiveEndAt | Verified end of participation | Unbound proposed field; not automatically updatedAt |

Source `src/types/Enrollment.ts` also has parentId, teacherId, lpId, ratePerSession, billingCycle, creditsTotal/Used/Remaining, createdAt and updatedAt. These are not dropped: parent/guardian/payer, teaching assignment, LP responsibility, commercial/finance terms, credits/entitlement and operational audit fields require separate reviewed destination contracts. Preserve the original values and existing behavior until verified migration. No historical inference or loss. No new fields are mandatory on legacy documents from this draft.

## 5. Field presence, history, security and efficiency

Distinguish absent legacy field, explicit unknown, not applicable, valid null and empty value where relevant. Choose representations per approved field contract rather than applying a universal sentinel. Required means required by the identified contract; proposed target requiredness does not change existing source documents. Record provenance for derived facts and migrate only where justified. Effective dates describe business validity, audit timestamps describe system observation/change. Never replace business dates with migration timestamps.

Data class proposals are conservative; exact field access, classification, retention and masking require domain/security review. Sensitive fields with differing access requirements may require separate documents because Firestore document access must not expose unrelated fields; enforce server authorization and Rules independently. No secrets or real business values in registry files. Keep references and queries tenant/context scoped. Do not expose the registry as a user-accessible data browser without review.

Keep operational reads bounded using existing optimized projections and versioned DTOs. No per-item Firestore lookup, no mandatory runtime joins or registry reads. For each affected screen, compare current and proposed operation/read counts and cost; authorize exceptions explicitly. Indexes, key shape, transaction limits, document sizes and retention are per-record implementation decisions.

## 6. Review and validation plan

Executed design checks: JSON generation checked record/item uniqueness, per-record unique semantic names, qualified ID format, value-set and reference resolution, and source-field bindings. GitHub readback compared all 43 source-backed record-specific identity fields with the pinned TypeScript interfaces for field presence, optionality and explicit nullability. No production schema or field-population test, runtime test, independent acceptance or CI run claimed.

Before adoption: confirm semantic owner and record grain/key, reconcile same-fact duplicates, review all classifications and null/requiredness, validate source mapping with explicit transforms, expand shared/nested field identifiers, define exact type constraints and transition tables, approve version and storage paths, prove access and read-budget contract. Implement schema validation and CI fitness checks only after P03 authorization. Proposed CI rejects duplicate/recycled identifiers, broken references and value sets, illegal ownership, unversioned breaking changes, missing migration/compatibility/retirement evidence and unauthorized dependency changes. Test negative fixtures, legacy compatibility, projection parity, authorization and schema evolution. The draft JSON is not an executable validator.

## 7. Next design slices

1. Review the proposed namespace and record ownership, finalize shared audit and reference semantics; design tenant/campus context without changing the existing identity contract.
2. Complete Programme, Course, CurriculumVersion and DeliveryOffering record grain and field dictionaries; resolve source/path candidates. Complete Enrollment/GroupPlacement/TeachingAssignment/SchedulePlan constraints and source mappings.
3. Extend the dictionary to ClassSession/SessionParticipant/SessionStaff/AttendanceRecord and evidence; preserve operational billing rules and historical occurrence identity.
4. Define Finance and Commerce records, exact minor-unit semantics, entitlements and reconciliation; then physical school and other existing domains.
5. Design screen/report and configuration bindings only against approved contracts. Track catalogue completeness by record family and actual source coverage, not just number of IDs.

No collection creation, code changes, runtime deployment, data migration or live data capture authorized. P01 acceptance and independent sequencing review remain pending; formal P02/P03 and all production gates retained. This is owner-directed design material for review, not a gate waiver.
