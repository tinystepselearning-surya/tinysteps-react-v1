# Firebase Upgrade Packet

This packet operationalizes the upgrade plan before any Firebase Console cutover.

## Contents

1. [`system-inventory-sheet.md`](./system-inventory-sheet.md)
2. [`pre-cutover-checklist.md`](./pre-cutover-checklist.md)
3. [`smoke-test-sheet.md`](./smoke-test-sheet.md)
4. [`rollback-plan.md`](./rollback-plan.md)
5. [`repo-inventory-baseline.md`](./repo-inventory-baseline.md) (generated)

## Usage order

1. Run inventory baseline:

```bash
npm run inventory:firebase-auth
```

2. Complete `system-inventory-sheet.md` with external systems and owners.
3. Execute `pre-cutover-checklist.md` and get sign-off.
4. Execute smoke tests from `smoke-test-sheet.md`.
5. Cut over and monitor based on `rollback-plan.md`.

## Gate rule

Do not remove/disable Firebase legacy Database Secrets until:

- inventory is complete,
- pre-cutover checklist is fully green,
- smoke tests pass,
- rollback owner is on-call.
