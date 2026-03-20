# Pre-Cutover Checklist

Mark every item before disabling/removing legacy Firebase Database Secrets.

## Phase 1: Freeze and inventory

- [ ] New ad hoc Firebase scripts are frozen until cutover is complete.
- [ ] `system-inventory-sheet.md` is completed with owners.
- [ ] Every production-critical system has explicit auth method documented.
- [ ] Every system has explicit RTDB dependency status (`yes/no/unknown` resolved to `yes/no`).

## Phase 2: Credential verification

- [ ] No active CI workflow depends on `FIREBASE_TOKEN`.
- [ ] No active source references hardcoded `firebase-adminsdk-*.json` names.
- [ ] `.env` / docs do not instruct token-generator or database-secret flow.
- [ ] GitHub repo/org secrets and variables audited for stale token auth.
- [ ] Local shell/docs runbooks updated to ADC/service-account path.

## Phase 3: Console-side readiness

- [ ] Required service accounts are valid and least-privileged.
- [ ] Function deploy pipeline passes without token auth fallback.
- [ ] Local admin scripts validated with new init path.
- [ ] Realtime Database rules/scripts verified not to depend on secret-based access.
- [ ] Billing/project IAM confirmed for new auth path.

## Cutover gate

- [ ] Smoke tests passed (see `smoke-test-sheet.md`).
- [ ] Rollback owner is assigned and reachable.
- [ ] Change window and monitoring window are confirmed.

## Approval

- Technical owner:
- Operations owner:
- Approval date/time (local):
- Cutover approved: `yes/no`
