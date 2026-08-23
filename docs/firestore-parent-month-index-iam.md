# Parent-month Firestore index IAM

The GitHub Actions identity is:

- `github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

Both the deploy workflow and the index workflow authenticate it through the
`FIREBASE_SERVICE_ACCOUNT_TINYSTEPS_REACT_V1` GitHub secret. The repository does
not currently use Workload Identity Federation.

## Required role

Grant `roles/datastore.indexAdmin` at project scope. It is the narrowest Google
Cloud predefined role intended to manage Firestore index definitions. The
workflow requires `datastore.indexes.get`, `datastore.indexes.list`, and
`datastore.indexes.create`. The role also permits updating and deleting index
definitions, but the workflow only invokes the `list` and `create` commands and
never reads or writes application documents.

Google's [Firestore IAM guide](https://cloud.google.com/firestore/docs/security/iam)
describes this role as index create/modify/delete/list/view access. Google's
current [Firestore role catalog](https://cloud.google.com/iam/docs/roles-permissions/firestore)
surfaces the same control-plane role with `datastore.schemas.*` terminology.
The failed Firestore API call itself reported `datastore.indexes.create`. This
repository therefore uses Google's narrow predefined index-management role and
was verified through the real GitHub Actions workflow after the binding was
applied.

The binding was applied on 2026-08-24. The one-time administrative helper is
retained for reproducible setup or recovery; it is not part of deployment:

```bash
bash scripts/grant-parent-month-attendance-index-iam.sh
```

The ensure script intentionally fails on `PERMISSION_DENIED`; it does not hide or
skip a missing binding.

The 2026-08-24 verification confirmed this role is bound. The first dedicated
workflow run created the exact `classSessions(parentId ASC, date ASC)` index and
waited until it was `READY`. The similar index beginning with `kidIds CONTAINS`
remained `READY` and untouched.

The workflows still use a long-lived service-account JSON credential. Migrating
to Workload Identity Federation is a separate security improvement and should be
handled in a dedicated change, not coupled to this index-only permission fix.

## Verification

Live verification completed with two manual dispatches of **Ensure parent-month
attendance Firestore index**:

1. [Run 32661404292](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/32661404292)
   authenticated the intended service account, created index `CICAgJil_p8K`, and
   observed it reach `READY`.
2. [Run 32661799058](https://github.com/tinystepselearning-surya/tinysteps-react-v1/actions/runs/32661799058)
   found the exact index already `READY` and exited without issuing a create.

Both runs passed all 12 focused tests. No application documents were read or
written, and no unrelated indexes were mutated or deleted.

## Rollback

Remove only this binding:

```bash
gcloud projects remove-iam-policy-binding tinysteps-react-v1 \
  --member="serviceAccount:github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com" \
  --role="roles/datastore.indexAdmin" \
  --condition=None
```

Do not delete the Firestore index during IAM rollback. Removing the binding does
not affect application data or an already-built index.
