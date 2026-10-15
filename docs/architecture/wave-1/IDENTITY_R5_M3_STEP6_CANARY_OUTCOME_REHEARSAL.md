# R5 Milestone 3 — Step 6: canary evidence interpretation rehearsal (offline)

**Prepared:** 2026-10-15 (IST)
**Reviewed base:** `main` `e2a22d854b0d38fa2f9cdc8193fb222c8a7be443`
**Decision:** **SYNTHETIC CLASSIFIER VERIFIED LOCALLY; LIVE CANARIES ON HOLD.**
**Scope:** pure, privacy-safe source/test tooling only; no browser login, production SDK, credentials, read/write facade, Firebase deployment or Rules edits.

## Purpose

Issue [#706](https://github.com/tinystepselearning-surya/tinysteps-react-v1/issues/706) still lacks approved test actors, genuine signed-in sessions, exact existing non-sensitive document allowlists, tenant/owner mapping, run budget and designated security-owner signoff. A canary run therefore **must not** begin. Instead, rehearse the **classification** of future, already-redacted browser point-read outcomes without any capability to perform reads.

New source `scripts/milestone3-canary-outcome-reducer.mjs` is pure and retrospective: it accepts **ordinal-only** case labels (1–24), role label, expected allow/deny and one fixed outcome category; outputs only fixed issue categories and counts. It must never be fed raw Firebase SDK exceptions, credentials, UIDs, document paths or JSON snapshots. It does not read environment variables, authenticate, query Firestore or invoke Functions.

### Outcomes and stop policy

| Expected | Observed fixed category | Outcome |
| --- | --- | --- |
| Allowed read | `allowed-existing` | Case PASS (not the full milestone) |
| Allowed read | `allowed-missing` | INCONCLUSIVE — existing fixture not proven |
| Allowed read | `permission-denied` | FAIL — unexpected denial |
| Denied read | `permission-denied` | Case PASS |
| Denied read | `allowed-existing` **or** `allowed-missing` | **STOP — unexpected allow**, even if the document did not exist |
| Either | `unauthenticated`, `network-error`, `timeout`, `other-error` | INCONCLUSIVE |
| Either | Invalid role, duplicate ordinal, invalid outcome or more than 24 records | HOLD, never PASS |

An unexpected allow forces STOP even when other observations are incomplete. Result summaries never echo UID, document paths, error messages or unrecognized fields. `liveExecutionAuthorized:false`, `billedReadsMeasured:false` and `milestone3Exit:NOT_PASSED` are unconditional, including when all **synthetic** cases pass.

This reducer does **not** verify that the observed case came from a real server-backed Firestore request, whether an actor was properly authenticated, or whether a privately approved allowlist exists. An owner-authorized operator is responsible for those checks in a different tool and must store any sensitive evidence privately.

### Automated proof and acceptance

- `node --test scripts/test/milestone3-canary-outcome-reducer.node-test.mjs`: 9 synthetic cases passed in local preparation.
- `Milestone 3 System Verification` includes this test and checks script syntax. Existing source/ledger, Functions, operational and Rules emulator gates must independently pass on the same final PR head.
- Changed paths: this report, one `scripts/milestone3-` pure utility, one `scripts/test/milestone3-` Node test, plus one existing CI workflow. No application or Firebase configuration file changed. Deployment-impact classifier must report 0 Functions, 0 Hosting, 0 Rules/indexes.
- PR merge, when safe, closes **Step 6 offline rehearsal**, NOT issue #706. R5 Milestone 3 exit remains **NOT PASSED** and no cutover is allowed.

### Still-required owner-private next gate

Read [Step 5 owner packet](IDENTITY_R5_M3_STEP5_PRODUCTION_CANARY_READINESS.md). The designated owner must explicitly approve designated non-customer test identities for all six roles (at least two School Admin/Teacher/Parent contexts and two school-assigned Learning Partner contexts), legitimate supported sign-in, exact existing non-sensitive point-read fixtures, expected allow/deny per case, project/build/environment confirmation, no-retry budgets and explicit stop conditions. An operator principal sampler and Cloud Monitoring metric access each require **separate** authorization. Do not put the private approval manifest, identifiers or tokens in GitHub, chat or CI artifacts.

**Current authorization status: NOT APPROVED / NOT RUN. No production data accessed.**
