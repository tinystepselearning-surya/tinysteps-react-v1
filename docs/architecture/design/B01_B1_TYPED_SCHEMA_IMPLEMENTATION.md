# B01-B.1 — isolated typed schema prototype

Revision 40 scope: offline synthetic validator only. No runtime imports, registry compilation, schema adoption, cloud reads/writes or business rules. B01-A baseline remains unchanged. Prototype accepts explicit synthetic contracts and plain JSON-shaped records with separately supplied version; reports deterministic field-level diagnostic codes, never input values. No conversion, defaults, migrations, reference lookup, authorization or tenant checks. Required versus nullable distinguished; unknown keys rejected; finite numbers, safe integers, calendar dates, named timezone recognized by Node Intl, string arrays, exact enum membership. ID/reference strings are syntactic only. Structured, legacy and Timestamp fields fail contract compilation, even when optional; Timestamp is an additional conservative prototype hold until canonical representation is reviewed. No claim that supported primitive shapes imply executable schema readiness. Schema/record inputs intended to be ordinary parsed JSON or controlled plain data, not hostile JavaScript proxies. No resource-bound or hostile-object certification.

## Representative source comparison
Current main and baseline src/types/models.ts blobs match. Course source interface name, area (Phonics/Grammar/Speaking), numeric level, required description, status and other fields remain authoritative. Draft CRS-1004 permits optional nullable integer level, CRS-1005 optional nullable description, CRS-1001 proposed courseId differs from optional source id; tenant/catalogue fields are proposals. Fixture exercises source-derived primitive examples plus synthetic types, not an actual Course contract or full mapping. No registry item changed; all 45 legacy/24 structured design holds retained. No actual records read.

## Evidence and acceptance
43/43 pure synthetic scenarios executed in available JS environment before commit. Full pinned Node verification requires both existing 66 registry tests and new 43 typed-schema tests (expected 109 total). No CI or Node 22.22.1 claim until supplied evidence. Acceptance requires exact commit, review, scope check, no production impact, and regression. Subsequent B01-B.2–B01-B.5 remain separately scoped. No main merge authorized.

```sh
node --test scripts/architecture/registry-validator.node-test.mjs scripts/architecture/typed-schema.node-test.mjs
```
