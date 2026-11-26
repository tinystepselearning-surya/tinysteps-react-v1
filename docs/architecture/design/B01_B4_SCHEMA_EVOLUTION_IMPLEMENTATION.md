# B01-B.4 — synthetic additive-only schema evolution

Revision 46 authorizes one consecutive version pair, explicit synthetic record/owner and field IDs, immutable semantic definitions and existing typed contracts, new optional fields only, and exact copy/omit plan. Validate source and target with B01-B.1, preserve absent versus null and all scalar/array values, copy arrays, freeze output and per-field lineage. No implicit default, coercion, rename, retirement, type widening/narrowing, enum change, reference retargeting, destructive transformation or partial output. Diagnostics code-only. Source/target contract inputs are caller supplied; no historical ledger or authenticity proof; stable identity enforced only within the pair. Valid forward projection does not prove older strict consumers accept new populated fields. No real identifiers allocated, migrations, persistence, runtime adoption, authorization, resource-bound or hostile proxy certification.

## Existing authorities
At revision 45 the main and isolated baseline blobs matched for functions/src/schoolOS/identity/contracts.ts (schema version and migration provenance), scripts/migrations/wave1-identity-profile-retirement-lib.mjs (versioned migration planner), and src/types/Enrollment.ts. B01-A also preserves 879 earlier registry items. These remain unchanged; no live record inspection or parity certification. All fixtures use synthetic IDs and values, not actual records.

## Evidence
54/54 pure scenarios passed in available JavaScript environment before commit. Full cumulative pinned Node suite expects 267 tests (213 accepted plus 54 evolution). No pinned Node or CI claim yet. Acceptance requires exact-head regression, scope review and isolated integration. No main release or broader gate waiver.
