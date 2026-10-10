# Wave 1 — R5 Milestone 3: independent final system verification

**Started:** 2026-10-10  
**Status:** IN PROGRESS; no global reader, Firestore/Storage Rules, or destructive cutover authorized  
**Verified entry baseline:** Milestone 1 exit `38037626614`, Milestone 2 exit `38041660356`, Milestone 2 documentation merge `66fc5d7898eca9f86aa65e3153eca0a084f395bc`, last production Functions marker `81af741aef78ea3d8e3cac66e548455ce3a9b43f`.

## Objective

Verify that the deployed canonical requester-authorization architecture is stable across the actual Tiny Steps operational contracts before declaring a complete system-level exit or approving broader identity-reader and rules cutovers. **Code/CI green is necessary, but not sufficient for an authenticated production canary or live data-parity claim.**

## Major verification tracks

| Track | Gates and real-world business contracts | Independent verification evidence |
|---|---|---|
| M3-A Identity and authorization | Admin must use the UID-keyed `authAccessReadModels`; missing/inactive role denied; school scope is not global; parent/teacher/LP access isolated; zero live consumers of legacy `ensureAdmin` | Entire Functions suite, canonical guard and auth-access model specs, source-tree audit |
| M3-B Scheduling and enrollment | Rolling lifecycle, repair, reconciliation, same-day rescheduling, manual and ad-hoc sessions, course transitions, snapshot freshness, no accidental double generation | Functions scheduling suite, rolling compatibility and UI scheduling regressions; approved production read-only canaries |
| M3-C Attendance and Teams evidence | AVS same-day evidence, multi-session coverage, ambiguous cases, teacher matching, no improper false-present, correction/freeze policy | AVS Functions and admin tests; evidence freshness; production user-specific tests require separate approval |
| M3-D Finance and parent payments | Present-only session charging, consistent monthly invoices, teacher earnings, payout periods, wallet idempotency, correction handling, dry-run safety | Finance Functions and parent-month/UI tests; no write-mode backfill or payout invocation in CI |
| M3-E Messaging and portals | Canonical Admin messaging entry points, parent/teacher role isolation, protected parent progress, school access | Messaging canonical regression, browser identity-hardening and Firestore Rules emulator tests |
| M3-F Rules parity and retirement readiness | Legacy Firestore/Storage Rules, Admin identity exceptions, security allow/deny cases, R5D authorization prerequisites, R6–R8 hard retirement barriers | Rules emulator, static parity inventory, **explicit HOLD** for any production rule or destructive cutover |
| M3-G Production/operational cost | Actual production markers, no unbounded Function fan-out, no extra read amplification, canonical principal freshness and drift | Existing CI deploy impact + scheduled read-only audits; authenticated production/usage evidence **NOT VERIFIED** unless independently obtained |

## Source-derived observations requiring review

1. **R5D RULES CUTOVER STILL HELD — expected.** `firestore.rules` and `storage.rules` currently authorize global Admin using `users/{uid}` and do not yet use `authAccessReadModels/{uid}`. The authoritative ledger intentionally records all global reader/rule switch flags as `false`. Do not mark broad authorization migration complete based on Milestones 1 and 2.
2. **ADMIN EXEMPTION PARITY — high-priority readiness check.** Both legacy Rules include explicit, identity-specific Admin exceptions beyond user role. Canonical `ensureCanonicalAdmin` evaluates global canonical role. Before an R5D rules change, establish whether these identities have the intended canonical RoleAssignments, document any approved special behavior and test both allowed and denied outcomes in the emulator. Do **not** copy identity-specific exceptions to canonical authority by default.
3. **PARENT-PAYMENT AUDIT READ COST — measured cost unavailable.** `parentPaymentBackfillDryRun.ts` applies `limitPayments` to payment queries, but reads parent-scoped billingCharges and wallet transactions without query-level limits. This is an existing issue for a separate bounded performance hardening; do not touch payment behavior during verification.
4. **ROLLING LEGACY DELEGATION — authorization lookup overlap.** `rollingScheduleCompatibility.ts` checks canonical Admin before calling some legacy callable implementations that now also check canonical Admin. This preserves fail-closed behavior but may perform two UID-point reads on delegated requests. Measure before optimizing; do not remove guard checks without a caller identity model.
5. **LEGACY METADATA — reconciled in this audit branch.** Nested `r5.status` and `r5.nextBrick` still pointed to historical C4/C5 work despite an authoritative switchReads closeout for Milestone 2. The Milestone-3 ledger corrects these pointers without changing production authority flags.

These observations are **source-based**. They are not a claim that a real parent, teacher, Admin or school tenant experienced incorrect authorization or expensive reads.

## Automated verification and monitoring

- **Hourly:** existing `Tiny Steps Milestone 3 CI & Production Watch` monitors GitHub Actions, production deployments, checkpoint markers, regressions and anomalies; alerts on material changes without automatic merge or deployment.
- **Daily after merge:** permanent GitHub Actions `Milestone 3 System Verification` runs a read-only source/ledger audit, the full Functions suite and build, priority business regressions and emulator-only Firestore security rules. On branch PR updates it also runs the same gates; manual dispatch is supported.
- **No production mutation:** workflow cannot create live billing events, mark attendance, invoke write-mode migration or transition users. CI runner only inspects repository code, runs tests and uses local emulators.
- **Evidence separation:** a PASS means the named CI/static/emulator surface passed. Authenticated production-canary state remains `NOT VERIFIED` until separately measured.

## Explicit milestone exit gates

The milestone may be marked **complete only when**:
1. M1/M2 production checkpoint lineage and current `main` are reconciled; no unexpected deployment.
2. Permanent no-legacy-Admin consumer gate, canonical principal contract, focused critical workflow regressions, complete Functions suite/build and emulator rules pass.
3. Security rule allow/deny parity and the hard-coded Admin exception decision are documented (including positive/negative cases and school tenancy).
4. An authorized, read-only production canary has verified representative Admin, school Admin, teacher, parent and Learning Partner login/access paths with no write side effects, and observations on canonical auth-access model freshness are obtained.
5. Firestore read and error budgets for auth lookups, session snapshots, AVS, payment audits and delegated compatibility calls are quantified; unmeasured cost is not called healthy.
6. All blocking findings have passed separate remediation PRs or are explicitly deferred with a named owner/risk acceptance. Rule/reader cutovers are never triggered as a side effect of a verification PR.
7. Ledger and final independent gate are green and merged to `main`.

**Current exit verdict: NOT ATTEMPTED.** No destructive retirement and no broad identity-reader/Rules switch is authorized in Milestone 3 kickoff.


## First independent verification run — 2026-10-10

**CI:** `38043064008` — PASS across all three independent jobs.

- 240 production source files inspected; no active legacy Admin guard import/call sites.
- Production and Milestone 1–2 ledger evidence checks passed.
- 76 identity/deployment tooling Node tests passed.
- Full Functions suite: **177 passing files, 2 skipped files**; TypeScript build passed.
- Critical workflows: **158 tests across 20 files passed** (AVS, rolling scheduling, sessions, billing, wallet, teacher pay and portal identity).
- Current Firestore Rules emulator: **81 tests across 13 files passed**.
- Deployment impact: **0 Functions, no Hosting, no Firestore rules/indexes**.
- The initial broad operational suite exposed one obsolete AVS test assertion from the earlier canonical Admin migration. Updated that assertion without modifying the production AVS callable. Initial tooling run also needed Functions compilation before dependent Node tests. Both corrections are part of the validated branch.

**Coverage boundary:** These passes concern code, source/ledger and local emulators. Direct signed-in production role canaries, current authAccessReadModels coverage/drift, and live Firestore read quantities remain **NOT VERIFIED**. Existing Rules still use compatibility-era identity checks. Therefore the Milestone-3 final exit gate remains **NOT ATTEMPTED**, with no authorization to switch global identity readers or Rules.

After this PR merges, daily scheduled CI and the existing hourly GitHub CI/production monitor provide ongoing checks; they do not themselves verify authenticated production access or mutate production data.


## R5M3-PARITY1 — Legacy Rules and canonical authorization characterization (2026-10-10)

**Acceptance CI:** `38044733888` — **PASS across all four jobs**, with the Rules-cutover flags unchanged.

- **Source and canonical guard:** privacy-safe production source/R5 ledger report passed, 5 auditor regression cases passed, 10 focused Functions tests passed. Full Functions suite: **178 passing files / 1,257 tests**, 2 files and 25 tests skipped; TypeScript build and focused lint passed.
- **Firestore emulator:** **14 rule-test files passed**, including 6 new synthetic-characterization tests for active legacy `superUser` behavior, canonical-only records not yet used by client Rules, inactive/orphan denial, Founder read-only separation, school-tenant boundaries and wallet owner isolation.
- **Storage emulator:** **4 synthetic tests passed**, using a `demo-` emulator-only project. Rules accepted the modeled active legacy `superUser` image upload, denied canonical-only/inactive/orphan actors, protected student-recording ownership and denied direct certificate uploads.
- **Known emulator warning:** Storage Rules logged an undefined token-email property during a denied test path. The test failed closed as expected; this warning must be considered during the future R5D rule design rather than silently dismissed.
- **Deployment impact:** 0 Functions, no Hosting, Firestore Rules or indexes; current production Rules and Storage Rules were **not modified**.
- **Rule parity findings:** both Rules files contain legacy identity-specific Admin exceptions and `superUser` authorization absent from canonical backend Admin, and canonical-only Admin records cannot authorize those browser Rules until a separately approved cutover. Current School Admin membership and Founder read-only semantics differ by scope and must be preserved intentionally.

The versioned source matrix and role-canary plan are in `IDENTITY_R5_M3_AUTHORIZATION_PARITY_AND_CANARY_PLAN.md`. No hard-coded UID/email exception literals are reproduced in the report or documentation.

**Live authenticated production role canaries, canonical read-model coverage/freshness, and Firestore read costs: NOT VERIFIED.** The next evidence gate is an explicitly approved, user-authenticated *read-only* actor matrix with a bounded, privacy-protected principal-coverage check. All global reader switches, Rules switches and destructive operations remain on **HOLD**. Milestone 3 remains **IN PROGRESS**.
