# Rollback Plan

Use this if post-cutover auth/permission failures appear.

## Trigger conditions

- Deploy pipeline auth failures block releases.
- Callable/admin functions start returning auth/permission errors.
- Critical admin local scripts fail due to credential path mismatch.
- Realtime Database access regression is confirmed.

## Immediate response (0-15 min)

1. Declare incident owner and scribe.
2. Pause further config changes in Firebase Console.
3. Capture failing workflow IDs, function names, and error messages.
4. Notify team to stop running ad hoc migration scripts.

## Technical rollback actions

1. Revert CI auth/deploy workflow commit if the failure source is CI auth path.
2. Re-deploy last known-good commit.
3. Restore previous known-good credential binding (service-account/IAM scope).
4. If Database Secret removal caused impact, pause/remediate per Firebase Console capability and support guidance.

## Validation after rollback

- [ ] CI deploy works end-to-end.
- [ ] One callable function is successful.
- [ ] One admin local script runs successfully.
- [ ] Logs show error rate returning to baseline.

## Monitoring window

- Minimum 48-72 hours intensified monitoring after cutover or rollback.

## Ownership

- Incident owner:
- Rollback executor:
- Comms owner:
- Start time:
- End time:
- Postmortem link:
