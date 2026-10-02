# Parent Month Close hardening audit (PR #534)

## Read and write paths

Counts below describe application Firestore operations, not billable document counts within a query. A query can return multiple documents. Firebase callable internals can perform additional finance reads and writes noted below.

| Action | Firestore reads | Writes | Change in this pass |
| --- | --- | --- | --- |
| Open tracker | Bounded parent directory, selected-month progress query, selected-month parent read-model collection-group query | None | No change; no raw `classSessions` scan |
| Open one parent | Exact parent, progress, and parent-month read-model documents; bounded cached AVS case queries and enrollment/display-name reads | None, unless starting a new review | No change to opening scope |
| Mark attendance complete | Callable reads exact parent and progress documents; client refreshes exact parent-month read-model document | One progress write | Adds one exact billing read to prevent stale detail |
| Mark billing reviewed | Callable reads exact parent, progress, and parent-month read-model documents | One progress write only when the reviewed composition changes | Verified billing is returned to the client; no follow-up client read |
| Download invoice | Targeted Parent Payments handoff reads the exact parent and selected-month finance scope; invoice integrity reads charges for **that parent and month only**, then only their linked session IDs | None; PDF is saved locally | Removes lifetime parent-charge and historical linked-session reads |
| Open WhatsApp | None | None | Requires an international normalized parent number already loaded |
| Mark invoice sent | Callable reads exact parent, progress, and parent-month read-model documents | One progress write only for a new billing composition | Explicit confirmation; no write on retry |
| Record payment | `adminReceiveParentPayment` preview and apply use their existing canonical finance reads and writes | Canonical payment/allocation writes only | No workflow payment or Closed write |
| Send reminder | None | None | Manual WhatsApp only |
| Return to tracker | Same selected-month tracker queries as opening it | None | Selected month preserved in route |

The Parent Payments handoff skips month-wide KPI aggregation and month-wide pagination. Window focus can refresh the same selected parent, but does not broaden the scope. AVS and finance page opening paths make no Microsoft Graph calls. Graph remains limited to explicit AVS validation and Teams evidence re-fetch actions. No realtime listener, new workflow collection, stored payment/Closed state, invoice file storage, or reminder/download write was added.

The monthly billing model already contains active charge IDs. Its existing charge pass now emits `billingCompositionFingerprint` using charge IDs, billed classes, and billed amount. Payment settlement fields are excluded. Legacy read models use the existing v1 calculation until rewritten by the normal projection; the calculation is identical to the new canonical field.
