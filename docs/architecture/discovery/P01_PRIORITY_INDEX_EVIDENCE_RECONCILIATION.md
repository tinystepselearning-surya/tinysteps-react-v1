# P01.2 residual index evidence — offline reconciliation increment

Status: scoped offline utility validation PASS; isolated acceptance under existing owner direction, effective on verified merge; no additional live metadata access, document reads, index edits or deployment. R60 and 570 accepted engineering tests remain unchanged. Existing P01.2 authorization packet and R60 host/trust gates remain controlling.

## Source finding

The current main, production index marker and isolated R60 baseline have the same firestore.indexes.json blob b7e9e4d2cf029b5218294b987240992774e7f9e0. These are Git observations, not live index state. The first-batch scope previously counted 34 source declarations across four groups. Exact duplicate inspection of that source yields:

| Group | Declarations | Exact unique definitions |
|---|---:|---:|
| classSessions | 23 | 23 |
| months | 7 | 7 |
| billingCharges | 2 | 1 |
| teacherEarnings | 2 | 1 |
| Total | 34 | 32 |

No inference that duplicate source declarations caused duplicate deployed indexes, excess reads or bills. Do not edit, delete or deploy indexes based on this finding. The source field override and all other groups remain separately assessed.

## New local implementation

scripts/discovery/reconcile-priority-index-evidence.mjs (blob 193fa62819ca3bcf263fc28e643722b909a39c1b) reads only local bounded regular files and checks the exact source Git blob. No cloud SDK, token, network or cloud write path. It handles Standard Native mode directional/array indexes only; compare collection versus collection-group scope and ordered fields, normalize omitted terminal __name__ and Standard density/apiScope defaults, collapse duplicate source definitions, reject unsupported/malformed response or wrong resource identity, distinguish partial page, missing group, missing index, not READY and extra definition. Public output is aggregate group counts and fixed statuses; does not emit resource identifiers, raw metadata or credentials. Supplied evidence match is not an independent live verification claim.

Run on clean isolated candidate with pinned Node 22.22.1:

    node scripts/discovery/reconcile-priority-index-evidence.mjs --source-only
    node scripts/discovery/reconcile-priority-index-evidence.mjs --self-check

The self-check uses actual pinned source and disposable in-memory synthetic metadata; no cloud calls. Expected 34/32/2 with selfCheck PASS. Owner Mac execution passed at exact candidate cd9fe9e380aacee94cd0cd1e56b1cbcbe8a6b76d, with Node 22.22.1 and clean checkout enforced by the submitted command chain; prior 570 unaffected. No full cumulative rerun required solely for this separately scoped tool.

Future use only AFTER separate metadata authorization and independently reviewed collection; keep private evidence file outside the repository with restrictive permissions. Input shape: databaseResource (exact approved project/database resource string), databaseEdition STANDARD, groups mapping only the four above to individual index-list response pages. Approved API field mask should include indexes(name,queryScope,apiScope,density,fields,state),nextPageToken; no pagination beyond separately approved scope. Empty API list may omit indexes. Nonempty page token is incomplete, not evidence of missing indexes. No request is made by this tool. Use --evidence-file followed by private local path; report aggregate only. Exit 2 means supplied scope not matched/ready; exit 1 malformed/unsupported input or source drift. Never take actions based solely on a match; source-vs-deployed digest, effective resource permissions, evidence provenance and independent acceptance remain required.

References: Google Cloud Firestore Standard edition index overview (https://docs.cloud.google.com/firestore/native/docs/standard-index-overview), REST index definition (https://docs.cloud.google.com/firestore/docs/reference/rest/Shared.Types), density (https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/Density), API scope (https://docs.cloud.google.com/firestore/docs/reference/rest/Shared.Types/ApiScope). No expanded metadata batch approved. P01.2 and M3 HOLD; no phase advancement, production writes, deployment, admin execution or changes to existing business semantics.

## Owner execution evidence and disposition

Owner-provided Terminal output confirms both source-only and self-check commands completed on the pinned candidate. Both report 34 declarations, 32 unique definitions and two duplicate declarations, with the per-group counts above; selfCheck PASS. Both correctly retain liveVerified false, productionWritesPerformed false and NOT_ACCEPTED/NOT_VERIFIED in the absence of live metadata. Tool and index source blobs re-fetched and matched. This is scoped offline validation, not CI, independent review, actual deployed index parity or P01.2 acceptance. Do not add self-check assertions to the previously accepted 570-test total. No need to repeat unchanged suites. Merge PR #955 only into the isolated architecture baseline after verifying the final documentation-only delta, exact head and base, and unchanged production refs. R61 effective only on verified merge; all existing independent review, metadata approval and live gates remain HOLD. No remediation or deletion of duplicate declarations is authorized by this acceptance.
