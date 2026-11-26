# B02-R3.1 — isolated institutional contract prototype

**State: implemented candidate; pinned Mac verification pending; not adopted or authorized for runtime.** Owner explicitly directs the recommended narrowly scoped offline R3.1 implementation after PR #957 design review in conversation. Treat this as owner approval to develop and validate this isolated prototype only, parallel to held discovery/security acceptance. This is not independent review, P02/P03 adoption, R2 live approval or authorization for dependent R3.2+ implementation/activation. R62 remains accepted until scoped verification and integration.

## Scope and implementation

- scripts/architecture/institutional-context-contracts.ts (blob 1c13e2b1cfa74fe010eb3f7081e9e87d1414336b): typed TEN/ORG/CAM candidate DTOs. Organisation type-only Pick of the real existing OrganisationRecord plus tenantId. No SDK runtime import; no Firebase adapter or writes. Deliberately not a persisted record schema: audit/provenance, versioning and migrations remain unadopted.
- scripts/architecture/institutional-context-contracts.node-test.mjs (blob d547314e6dec58918caab60c9ceb00ad2c0667b1): 31 focused cases for valid online/physical shapes, optional/null legacy fields, missing tenant, invalid IDs/names/enums/zones, malformed records/accessors, wrong parent and tenant, immutability, exact registry fields/enum sets and five legacy source blob pins. Negative ownership checks are structural only. Inactive/archived/closed shapes remain valid records, not valid access grants.
- Prospective fixture decisions: ASCII opaque IDs 1–128 characters, no trim/rekey; names 1–200 UTF-16 code units, no surrounding whitespace/control characters or malformed surrogate; optional countryCode uppercase two-letter shape (not ISO membership certification), optional school code bounded 128 characters; IANA-style named zone validated by Intl or UTC (aliases preserved, no canonicalization). Unknown/extra fields and accessor/nonplain inputs rejected. Existing legacy records outside candidate shape are held for mapping, not changed or silently normalized. DTO is intended for ordinary data, not arbitrary executable JS objects or a hostile-process isolation boundary.
- inspectInstitutionalFixture validates a tenant and organisation and optional campus; verifies exact document IDs and owner equality. Missing campus accepted for online. It returns authorizationEvaluated:false, no access decision. No role/membership changes, no auth reader edits, new registry allocation, production collection, migration, query, Rules, workflow or dependency changes.

## Focused acceptance

Use clean exact candidate on Node 22.22.1 and locked Functions TypeScript 5.9.3. Type-only import checks original source shape using existing Functions dependencies. No install if the locked dependencies are already present; if absent, separately use npm ci --prefix functions --include=dev --ignore-scripts --no-audit --no-fund before verification. No cloud credentials or emulator needed.

    test "$(node --version)" = v22.22.1
    test "$(functions/node_modules/.bin/tsc --version)" = 'Version 5.9.3'
    functions/node_modules/.bin/tsc --noEmit --strict --target ES2024 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck --types node --typeRoots functions/node_modules/@types scripts/architecture/institutional-context-contracts.ts
    node --experimental-strip-types --unhandled-rejections=strict --test scripts/architecture/institutional-context-contracts.node-test.mjs

Expected 31/31, zero fail/cancel/skip/todo, type-check exit zero. New code not run in pinned Mac environment; available local Node 22.16.0 / TypeScript 5.8.3 are not the required toolchain. No test count increase or CI claim before actual evidence. R59 accepted 570 and R61 separate focused self-check remain unchanged. Final merge only into isolated baseline after scope/pin and review/acceptance requirements, never main. Independent engineering/security approval and all other gates remain open. Next candidate after scoped acceptance is membership and effective ownership contract, not live role grant or schema adoption.
