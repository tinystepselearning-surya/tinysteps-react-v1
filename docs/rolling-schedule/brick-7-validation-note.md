# Brick 7 validation gate

This brick must pass the repository's full main-target pull-request CI before it is merged into `rolling-schedule-integration`.

Validation includes Cloud Functions build/tests, Firestore rules, application lint/typecheck/unit tests/build, and SEO/GSC/resource guards. The validation-only PR must never be merged to `main`.
