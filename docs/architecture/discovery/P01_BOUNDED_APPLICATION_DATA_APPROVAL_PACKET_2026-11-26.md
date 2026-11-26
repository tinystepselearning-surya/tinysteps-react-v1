# P01.5 bounded application-data verification approval packet

**Prepared. Approval and execution pending.** This packet is independent of P01.2 metadata and the M3 actor canary. No production collector or endpoint is enabled. The revision 20 emulator harness is test-only. The existing unbounded audit commands are excluded.

## Decision to sign privately

The executive owner approves purpose and scope. The data owners for identity/admissions, academic operations, attendance and Finance approve their fields and denominators. Security approves the named read-only operator, vetted adapter, credential expiry and evidence handling. An independent reviewer verifies the candidate SHA, exclusions and actual calls. Use an owner-controlled existing fixture family and two existing school contexts only if every path and scope can be approved without contacting actual customers or creating fixtures. If a suitable cohort is unavailable, report that domain unverified.

Enter approval reference, exact environment/project/database, source SHA, operator and reviewers, UTC expiry and execution window, target paths and masks, expected relationships, comparison rule, query predicates/order, per-call and total caps, rollback-free separation and reporting/retention. Keep this manifest in the approved private store. No authority is inferred from an empty field.

## Proposed first run

| Cohort | Evidence | Proposed field and query boundaries |
|---|---|---|
| Identity and enrollment | Eligible learner, guardian, teacher, course and active enrollment key link | Exact point reads for named identity references, then approved enrollment/key IDs. Select only relationship IDs, role/activity flags, schema/revision and scope. No Auth user listing or demographic fields. |
| Schedule and attendance | Distinct occurrences and official attendance linked to the same enrollment and date | Exact session/attendance IDs or one explicitly approved enrollment/date predicate and document-ID order. Select key, status, revision and scheduled time. No Teams evidence, media or live refresh. |
| Finance | Approved service charges and ledger event references reconcile with wallet/summary for exact service period | Prefer exact known IDs. Use only explicit parent+period predicates and preapproved field mask. Amounts only if Finance signs the necessity. No bank/provider fields, payment action or balancing writes. |
| School | Grade/section/year and membership references stay within approved school | Exact roots and exact child refs for two independent school contexts. Compare aliases, active flag and scope. No roster scan or safeguarding/health fields. |

Proposed per-run ceilings: one approved database, one fixed verification plan, at most **20 SDK read dispatches**, **100 returned-document slots reserved including sentinels**, **10 minutes** and **zero retries**. Use point limit 1 and explicit collection cap+1 at most 21 for any approved set query, with at most four set queries. A cap hit or unverifiable partial read stops the cohort. Separately record transaction setup/finalization if required, network attempts versus SDK attempts, and no billed-read inference. Require pinned `readTime` or vetted read-only transaction semantics, stable deterministic order, server field masks, independent app and transport budget verification and short timeouts. Where an approved exact reference could require a follow-on call, reserve it and allowlist it before any dispatch. No runtime path construction from untrusted data, listener, broad scan or automatic continuation.

Operator IAM is separate from client Rules. For a separately reviewed Firestore data reader, point reads/batch get require `datastore.entities.get`, data queries require `datastore.entities.list` and `datastore.entities.get`, and explicit read-only transactions require `datastore.databases.get`. These are database permissions, not per-field enforcement. Use a separate approved identity and an independently reviewed enforcement layer. Do not reuse metadata IAM or base access on a broad project Viewer grant. An IAM grant alone does not meet the private path and field constraints. [Firestore Native IAM](https://docs.cloud.google.com/firestore/native/docs/security/iam)

No tool is approved for production execution by this packet. Before signatures can activate an operator run, independently verify the exact implementation and negative tests, field masks, snapshot and retry behavior, credential scope, cost ceiling and kill switch. Require explicit approval again for any broader plan, different environment, missing coverage, or future transport.

Stop on mismatch, expiry, denial, missing/inconsistent evidence, unknown source, response shape violation, forbidden fields, overflow, cost ceiling or unexpected effects. Output privacy-safe eligible/examined counts, mismatch categories with disposition, failed/denied/inconclusive denominators, timestamp/watermark and observed operation counts. Retain no raw rows, source paths, identifiers, contact data or per-family balances. Keep aggregate evidence for the privately approved duration. Permanently exclude raw application rows from GitHub, chat or CI artifacts. Any permitted cost observation is a separate metadata/metrics decision. Live results and owner review are necessary before P01 acceptance.

**Signatures and exact scope:** Executive Owner __ / Domain Owners __ / Security __ / Operator __ / Independent Reviewer __ / Approved manifest and SHA __ / Window and retention __. **Status remains on hold.**
