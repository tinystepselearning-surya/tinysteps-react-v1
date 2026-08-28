# IAM Cleanup Runbook

This runbook is rollback-safe and designed for one change at a time.

## Preconditions

- Use a principal with permission to read/write project IAM policy.
- Record baseline policies before edits:
  - project IAM policy
  - relevant secret IAM policies
  - runtime service-account IAM policy

## Change order

1. Narrow `roles/iam.serviceAccountUser` from project scope to the specific runtime service account.
2. Narrow secret access to secret-level on canonical secret only.
3. Keep all other project roles unchanged for initial pass.
4. Test deploy and runtime.
5. Optionally remove additional broad project roles one by one, testing after each removal.

## Validation after each IAM change

1. Deploy functions.
2. Verify scheduled function deploy/update still succeeds.
3. Verify callable function still works.
4. Verify HTTP function still works.
5. Verify Firestore trigger remains active.
6. Verify Ask Tiny Steps succeeds through the separate Firebase AI Logic project.

## Rollback

If any deploy/runtime check fails:

1. Restore the previous IAM binding for the role that was just changed.
2. Re-run deploy.
3. Confirm error is resolved.
4. Stop further IAM tightening until root cause is clear.

## Suggested “one-at-a-time” removal order (future pass)

1. `roles/firebaseauth.admin`
2. `roles/datastore.viewer`
3. `roles/cloudscheduler.admin` (only if replaced by narrower scheduler permissions)

Each removal must be followed by a full deploy + smoke verification cycle.
