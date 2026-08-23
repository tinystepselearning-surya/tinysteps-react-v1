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
requires a real workflow verification after the binding is applied.

An authorized operator must run this once:

```bash
bash scripts/grant-parent-month-attendance-index-iam.sh
```

The ensure script intentionally fails on `PERMISSION_DENIED`; it does not hide or
skip a missing binding.

The 2026-08-24 read-only audit found that this role was not yet bound and that
the exact `classSessions(parentId ASC, date ASC)` index did not yet exist. A
similar index beginning with `kidIds CONTAINS` is not a substitute and is left
untouched.

The workflows still use a long-lived service-account JSON credential. Migrating
to Workload Identity Federation is a separate security improvement and should be
handled in a dedicated change, not coupled to this index-only permission fix.

## Verification

After the binding is present, manually dispatch **Ensure parent-month attendance
Firestore index**. It lists composite indexes, creates only the missing
`classSessions(parentId ASC, date ASC)` collection-scope index, and waits until
the index is `READY`.

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
