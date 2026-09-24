# AVS Refinement Brick 5 — Refined Admin UI

Status: implemented on top of the Brick 3 unified validation backend and Brick 4 fresh-refresh generations.

## Normal operator model

The Attendance Validation page now exposes only two normal range actions:

- **Load Results** — reads cached AVS cases for the selected range. No Microsoft Graph calls.
- **Run Validation** — calls `runAttendanceValidationRange`. The backend decides the cheapest safe path for each session: cached revalidation, first-time evidence, or fresh evidence when stale/missing.

If the unified backend returns `continueValidation`, the normal button becomes **Continue Validation** for the same range.

The selected range is limited to completed service dates through yesterday IST and at most 31 days.

## Advanced

The expensive explicit fresh-read path is moved under **Advanced**:

- **Re-fetch Teams Data**
- **Continue Re-fetch**
- **Retry Failed Re-fetches**

This reuses Brick 4's explicit generation id and per-case checkpoints. It intentionally ignores cached Teams evidence for existing AVS cases.

## Row action

The single-case action is renamed to **Re-fetch this case** and continues to use the existing single-case Force Fresh backend.

## Removed from normal UI

The admin no longer needs to understand or manually sequence:

- Run Latest Check
- Sync Teacher Identities
- Run First-Time Baseline
- Force Fresh Selected Range

Those backend capabilities remain available during the migration/soak period; Brick 5 removes only the old operator controls.

## Read behavior

- no realtime listener;
- no automatic load on page open;
- saved results remain paginated;
- Run Validation reloads the selected saved-results range after completion;
- Re-fetch actions also reload the selected saved-results range.

## Safety invariants

Brick 5 changes UI orchestration only. It does not change:

- AV5.3 calculations;
- strict >1500 seconds per Present row;
- same-day Present pooling;
- non-Present scheduled matching;
- teacher identity proof;
- attendance;
- scheduling;
- billing;
- payments;
- teacher earnings.
