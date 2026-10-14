# Wave 1 / R5 Milestone 3 — Step 2 operational contract verification

**Initiated:** 2026-10-14
**Baseline:** `main` at `92a71264cd8934310bcd2ff2c7114808eff189dc` (PR #723 merged).
**Scope:** Independent re-execution of the current scheduling, virtual attendance, teacher ad hoc, parent/teacher UI, billing, earnings and no-write safety regressions.
**State at preparation:** VERIFICATION REQUESTED; CI results and final acceptance must be recorded in PR review. Not a production-readiness certificate.
**Production authority changed:** None. No account access, Firebase deployment, live Firestore read/write, session mutation, payment update, legacy retirement, activation or Rules cutover is authorized by this document.

## Current, source-verified operational contracts

1. **Recurrence / scheduling:** `enrollments.schedule` is the weekly recurrence authority; routine timetable projection must not create `classSessions`. Persisted completed/absent/cancelled/manual/legacy exceptions supersede duplicate virtual occurrences. Old automatic daily/14-day Cloud Function writers have been retired.
2. **Teacher attendance:** Explicit teacher action materializes only the selected occurrence. The existing ownership/schedule/occurrence claim checks prevent a second student/date/startTime authority; absence must be stored as **Absent**, never inferred from an unmarked class. A teacher may correct attendance on past/future dates under the current contract without a 24-hour cutoff.
3. **Teacher ad hoc booking:** One-off attendance sessions must be child- and teacher-scoped, use the approved 35-minute default, and reject overlapping teacher/child bookings while accepting adjacent non-overlapping classes. Existing completed/manual exceptions are protected.
4. **Finance:** Present creates the canonical parent charge and teacher earning once; Absent creates neither. For an unpaid ledger, Present → Absent reverses and Absent → Present safely reopens the original canonical charge/earning and produces compensating wallet transactions with an attendance-finance cycle key. Paid/partly-paid/settled/payment-allocated/payout-linked or manually voided records require `review_required`, preserving cash history and forbidding automatic financial reversal.
5. **Read economy and role boundaries:** Teacher/Parent schedule reads are session-scoped, deduplicated and refreshed deliberately. Admin timetable cache is UID-scoped, bounded and manually refreshed; a user switch or authorization denial cannot display a prior actor's cached records. Verified historical data must remain accessible in explicit history views.
6. **Credits:** New virtual attendance does not debit credits or mint new reschedule credits. Historical credits and financial evidence remain unchanged.

These contracts were reviewed from the currently merged implementations and PRs #710, #713, #714, #715, #716, #719, #720 and #721. Merged PR text is historical context, not proof of today's runtime state or production results.

## Automated independent verification to run on this PR

| Gate | Workflow | Actual coverage / expected evidence |
| --- | --- | --- |
| A | `Milestone 3 System Verification` | Entire Functions suite, canonical requester authorization, app's 20 operational contract files, Firestore/Storage Rules allow/deny emulator, zero backend deployment-impact gate. |
| B | `Virtual Calendar Attendance Review` | Functions and app typechecks, recurring/calendar projection, teacher one-off collisions, read-once and manual refresh, parent calendar, role-shared UI data, full backend tests and deployment impact review. |
| C | `Virtual Calendar Stage 1 - Isolated Firebase Emulator` | Real callable/trigger behavior in isolated `demo-` Firebase Auth/Firestore/Functions; Present, Absent, repeat completion, wallet and charge/earning IDs, reversal, payment-settled review, teacher/child collisions, teacher ownership, 35-minute one-offs and two same-day classes. |
| D | `Virtual Calendar Stage 2 - Isolated Browser Acceptance` | Actual teacher and parent Chromium components using disposable `demo-` Auth/Firestore/Functions; future timetable without writes, parent display of enrollment class and teacher Absent submission with no parent charge. |

Each workflow requires its own **PASS** at the PR's latest head SHA. An earlier green run on a different code revision is insufficient. A failure or unavailable evidence leaves this Step 2 gate **OPEN**; no assertion is waived merely to make CI green.

## Known scope limits and follow-ups

- Stage 2 browser acceptance does **not** yet contain a dedicated browser test for teacher ad hoc creation, teacher Present → Absent → Present cash corrections or multiple organization tenants. Those are exercised at isolated emulator/unit level, not accepted as full UI or production-actor verification.
- Automated tests cannot prove production billing totals, Firestore billed reads, actual Teams meeting join, role freshness under live authentication, or that parents/teachers in production experience the tested behavior.
- The current Stage 1 `demo-` emulator exercises simulated ledger amounts; it is not permission to query, backfill, settle, reverse or audit real customer money.
- More production-readiness work remains in Milestone 3, notably source/parity evidence, approved authenticated **read-only** actor canaries (issue #706), finance bounded-read/completeness review (issue #705), and measured production read budgets.
- Any suspected functional regression requires a separate, targeted application fix with product/finance/security review. Do not fix a business defect by merely changing test expectations.

## Exit criteria for Step 2

- [ ] All four read-only/isolated automation workflows pass on the **same reviewed PR head**.
- [ ] Inspection confirms this PR modifies only this verification document and the three workflow *path filters*, not runtime code, Firebase config, Rules, indexes or data.
- [ ] PR review records the exact run links, status, current baseline, exceptions, and explicit evidence limits.
- [ ] No production deployment is needed after merge; deployment-impact analysis skips all Firebase artifact deployments.

**Important:** Step 2 CI/emulator verification is not Milestone 3 completion or approval of the R5D Rules/reader cutover, production mutation, payment backfill or legacy deletion.
