# B01-A — isolated registry engineering implementation

**Status:** Implementation candidate on isolated branch, independent review and pinned Node integration tests pending. No merge/integration/deployment authorized.
**Authority:** [revision 35 owner amendment](B00_B01_IMPLEMENTATION_ACCEPTANCE_PACKET.md). Development baseline 0a165dbec5b5a605c758fa21526f994a5248cf5d; no changes to existing registry bytes, application, dependencies, Rules, Functions, cloud configuration or CI. All P01/P02/P03 (except this isolated increment), M3, live access, migration and release gates remain open/held.

## Deliverables
- `scripts/architecture/registry-validator-core.mjs`: pure deterministic draft registry validator; validates manifest/shard contracts, owner and identifier uniqueness, counts, item metadata, value sets and shared fields, polymorphic references, previous pinned snapshot compatibility, and rejects premature adoption. Outputs draft structural validity separately from executable readiness (always false for this version).
- `scripts/architecture/registry-validator-files.mjs`: explicit local read-only adapter; exact Git blob hash of raw bytes, UTF-8 validation, file size limit, manifest-listed path allowlist and symlink checks. Intended for a controlled local checkout, not a hostile concurrently modified filesystem.
- `scripts/architecture/validate-registry.mjs`: command-line entry point; exit 0 valid draft, 1 structural rejection, 2 input/usage error; no network, application imports or implicit Git access.
- `scripts/architecture/registry-validator-cases.mjs`: reusable 42 scenarios (positive actual metadata, synthetic mutations and deterministic/no-mutation checks).
- `scripts/architecture/registry-validator.node-test.mjs`: Node test runner for the 42 core cases plus seven filesystem/CLI tests. Local Git read of the pinned previous snapshot only; temporary synthetic/copied metadata fixtures; no Firebase or provider access.

## Executed verification
The committed pure core module (blob 0e305c84ea7b4cb1abc863c876cb192d416fbe1e) was fetched and executed in the available JavaScript V8 environment, with actual registry manifest, five shards and immutable v0.5 snapshot fetched from GitHub. The same 42 test scenarios passed (42/42). All 129 records, 971 unique items and 38 value sets passed structural validation; 879 prior definitions preserved; 43 source-interface definitions present. 45 unvalidated legacy fields and 24 structured fields remain explicit design holds. No runtime schema or live data certification.

Independently recomputed SHA-1 Git blob hashes over exact UTF-8 bytes of manifest, five shards and previous snapshot (7/7 matched GitHub blob SHA; SHA-1 known-vector self-check passed). This separate computation validates fetched byte integrity; the actual Node filesystem adapter and CLI integration suite still require execution in a full checkout. No claim that 49 Node tests or CI passed. Available local environment has Node 22.16.0; repository pins 22.22.1; no GitHub checkout and DNS access to GitHub unavailable from local execution container. GitHub connector supports source read/write but no workflow dispatch. No CI change made to work around this.

## Reproduce in a full checkout (reviewer/authorized developer)
Use pinned Node 22.22.1, full Git history including a743ece8566013e281d7ab1ad7dfceb6c74e5ae2 and the isolated candidate. From repository root:

```sh
node --version
node --test scripts/architecture/registry-validator.node-test.mjs
```

Optional direct CLI (previous snapshot file created in a local temp directory, not a second dictionary):

```sh
prior="$(mktemp)"
git show a743ece8566013e281d7ab1ad7dfceb6c74e5ae2:docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json > "$prior" &&
  node scripts/architecture/validate-registry.mjs --root docs/architecture/registry --previous "$prior"
rm -f "$prior"
```

## Review and exit gate
Independent engineering reviewer verifies code, test coverage, exact pinned Node results, all file scope and actual deployment-impact/marker lineage before merge or integration. No self-certification. The validator checks draft structural metadata only, not exact business field types, semantic correctness, actual production schema, tenant authorization or financial rules. The preceding v0.5 snapshot protects the 879 prior items; newly proposed fields may require reviewed versioning policies later. No runtime registry imports or identifier allocation. B01-A is not the whole P03 phase and does not authorize B01-B/configuration, CI integration or B02. Close only after independent acceptance.
