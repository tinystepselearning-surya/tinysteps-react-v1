# AV1 — Microsoft Graph Foundation

Status: **read-only code foundation implemented; production service-principal activation is intentionally gated.**

AV1 establishes the Microsoft Graph read path needed by the Attendance Validation sidecar. It does **not** create or modify attendance, sessions, finance, billing, teacher earnings, reschedule credits, or correction records.

## Goal

Allow a future Tiny Steps backend worker to securely read Microsoft Teams meeting evidence for designated Tiny Steps meeting organizers:

1. resolve a scheduled Teams `onlineMeeting` from the join URL already held by Tiny Steps;
2. list transcript artifacts;
3. retrieve transcript content when required;
4. list meeting attendance reports;
5. list attendance records containing participant and join/leave evidence.

The operational attendance system remains authoritative. Microsoft Graph supplies evidence only.

## Hard boundary inherited from AV0

> Attendance Validation may READ existing attendance, enrollment, session and finance records. It may WRITE only to validation-owned collections. It must not directly mutate operational attendance or financial collections.

AV1 is even narrower: it contains no Firestore writer and no exported Firebase function.

## What this brick adds

`functions/src/attendanceValidation/microsoftGraphClient.ts` is a pure, credential-injected Graph client. It provides:

- Microsoft Entra client-credentials token exchange using the `.default` Graph scope;
- cached application access tokens with expiry skew;
- meeting resolution by organizer object ID + Teams join URL;
- transcript metadata listing;
- attendance-report listing;
- attendance-record listing;
- raw participant attendance intervals containing join time, leave time and interval duration;
- Microsoft-reported total attendance seconds for cross-checking;
- transcript-content retrieval;
- explicit fallback from speaker-attributed WebVTT to speaker-unattributed transcript text only when Microsoft reports `SpeakerAttributionNotAllowed`;
- bounded retry of HTTP 429 and 5xx reads, honoring `Retry-After`;
- one fresh-token retry after HTTP 401;
- explicit classification of missing application-access policy and tenant-disabled transcript API access;
- ambiguous meeting-resolution rejection rather than guessing.

The client never logs or persists the client secret, access token, meeting evidence, or transcript body.

## Attendance evidence contract inherited by AV2–AV5

The normalized evidence design is defined in:

`docs/attendance-validation/attendance-evidence-model.md`

That contract deliberately adopts the useful evidence concepts found in mature attendance platforms without replacing Tiny Steps attendance:

```text
scheduled Tiny Steps session
+ live Teams meeting identity
+ teacher join/leave intervals
+ learner join/leave intervals
+ teacher–learner overlap
+ participation/dwell metrics
+ optional transcript/recording evidence
        ↓
validation classification
        ↓
controlled reconciliation
```

Important rules:

- raw join/leave intervals are preserved before calculating percentages;
- multiple intervals are normalized rather than collapsed to first-join/last-leave only;
- teacher–learner overlap **inside the scheduled Tiny Steps class window** is a primary deterministic signal for 1:1 lessons;
- dwell percentages are derived from raw intervals and remain auditable;
- Microsoft `totalAttendanceInSeconds` is retained as source evidence but does not replace interval-derived calculations;
- transcript and recording availability are supplemental evidence only;
- no transcript, no recording, Graph failure, display-name mismatch or missing artifact may independently mean `Absent`;
- AV4, not AV1, owns threshold calibration and class-proof decisions;
- the only operational attendance outcomes remain `Present`, `Absent`, and `Rescheduled`.

AV1 therefore exposes the raw inputs required by the evidence model but does not implement attendance decisions or dwell thresholds.

## Required Microsoft Graph application permissions

The production backend app must use **Application** permissions, not delegated end-user permissions:

| Permission | Why AV1/AV2 needs it |
| --- | --- |
| `OnlineMeetings.Read.All` | Resolve/read scheduled `onlineMeeting` metadata. |
| `OnlineMeetingTranscript.Read.All` | List and retrieve scheduled-meeting transcripts. |
| `OnlineMeetingArtifact.Read.All` | Read attendance reports and attendance records. |

All three require Microsoft Entra administrator consent.

AV1 deliberately does **not** request `OnlineMeetings.ReadWrite.All` or any Teams/Graph write permission.

Official Microsoft references:

- https://learn.microsoft.com/en-us/graph/api/onlinemeeting-get?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/onlinemeeting-list-transcripts?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/calltranscript-get?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/meetingattendancereport-list?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/attendancerecord-list?view=graph-rest-1.0

## Organizer-scoped application access policy

Microsoft requires an application access policy for these online-meeting application permissions.

Initial Tiny Steps policy must be granted only to the designated organizer account(s), not globally across the tenant.

After registering the Entra application and obtaining its application/client ID:

```powershell
New-CsApplicationAccessPolicy `
  -Identity "TinyStepsAttendanceValidation" `
  -AppIds "<APPLICATION_CLIENT_ID>" `
  -Description "Read-only Teams evidence for Tiny Steps attendance validation"
```

Grant it to each approved organizer by **user object ID**:

```powershell
Grant-CsApplicationAccessPolicy `
  -PolicyName "TinyStepsAttendanceValidation" `
  -Identity "<ORGANIZER_USER_OBJECT_ID>"
```

Do not use `-Global` for the initial rollout.

Microsoft notes that application-access-policy changes can take time to propagate before Graph calls begin succeeding.

Official policy reference:

- https://learn.microsoft.com/en-us/graph/cloud-communication-online-meeting-application-access-policy

## Transcript tenant settings

Teams separately controls whether Graph applications may access transcript data.

Teams Admin Center path:

`Meetings → Meeting settings → Transcript API access`

Required:

- **Microsoft Graph access:** On
- **Include speaker attribution:** preferred On, but not required by the AV1 client

Equivalent tenant configuration:

```powershell
Set-CsTeamsMeetingConfiguration `
  -EnableGraphTranscriptAccess true `
  -EnableAttributedTranscripts true `
  -Identity Global
```

The client explicitly handles these Microsoft errors:

- `GraphAccessToTranscriptsDisabled` → configuration failure; never attendance evidence;
- `SpeakerAttributionNotAllowed` → retry transcript content in unattributed format.

Official setting reference:

- https://learn.microsoft.com/en-us/microsoftteams/meeting-transcript-api-access

## Production credential contract

When the Entra app is ready, store one server-side secret object containing only:

```json
{
  "tenantId": "<MICROSOFT_TENANT_ID>",
  "clientId": "<APPLICATION_CLIENT_ID>",
  "clientSecret": "<APPLICATION_CLIENT_SECRET>"
}
```

Recommended Firebase/Google Secret Manager name:

```text
MICROSOFT_GRAPH_ATTENDANCE_VALIDATION
```

Rules:

- never expose this object to React/Vite/browser code;
- never commit it to GitHub;
- never place it in a Firestore document;
- never log the secret or resulting access token;
- bind the secret only to the backend collector/probe function that needs it;
- rotate the client secret independently of application code.

AV1 intentionally does **not** bind this secret yet. Exporting a new production Firebase function before the secret exists could make deployment depend on incomplete tenant configuration. Activation therefore occurs only after the Entra application, admin consent, organizer policy and secret are all confirmed.

## Live Tiny Steps feasibility proof completed during AV1 preparation

A read-only proof using the already-authorized Tiny Steps Microsoft Teams connection successfully demonstrated the complete tenant-side evidence path:

```text
real Tiny Steps Teams meeting reference
        ↓
resolve scheduled onlineMeeting
        ↓
list transcript metadata
        ↓
retrieve transcript content
        ↓
speaker-attributed WebVTT returned
```

The retrieved artifact contained sustained teaching activity, confirming that the transcript is usable evidence rather than empty metadata.

This proof establishes **tenant/API feasibility**, including current transcript access and speaker attribution. It does **not** prove the future Firebase service principal yet, because the connected Teams tool uses an already signed-in Microsoft authorization. The production service-principal proof remains an activation gate below.

No student names, meeting links, meeting codes, passcodes, tenant identifiers, organizer identifiers, or transcript bodies are stored in this repository.

## Production service-principal activation gate

AV1 is production-ready only after all of the following are verified with the new Entra app:

```text
[ ] Entra app registration created
[ ] Application permissions granted:
    OnlineMeetings.Read.All
    OnlineMeetingTranscript.Read.All
    OnlineMeetingArtifact.Read.All
[ ] Admin consent granted
[ ] TinyStepsAttendanceValidation application-access policy created
[ ] Policy granted only to approved organizer account(s)
[ ] Transcript Graph access enabled
[ ] Server-side credential secret created
[ ] App-only token exchange succeeds
[ ] One known meeting resolves by organizer ID + join URL
[ ] Transcript metadata is readable
[ ] Transcript content is readable (attributed or safe unattributed fallback)
[ ] Attendance report is readable
[ ] Attendance records are readable, including join/leave intervals
```

Until every item is green, no scheduled collector is exported or deployed.

## Error semantics

Graph/API failures are evidence-pipeline states, **not attendance states**.

| AV1 condition | Meaning |
| --- | --- |
| `application_access_policy_missing` | Entra/Teams authorization incomplete. |
| `transcript_access_disabled` | Tenant blocks transcript API access. |
| `speaker_attribution_not_allowed` | Transcript may still be retrieved without speaker tags. |
| `unauthorized` | Token invalid/expired; client refreshes once. |
| `forbidden` | Authorization or organizer scope requires investigation. |
| `not_found` | Meeting/artifact not accessible or outside retention. |
| `rate_limited` | Retry safely according to `Retry-After`. |
| `transient` | Retry boundedly for server-side failure. |
| `ambiguous_result` | Never guess which meeting is authoritative. |

None of these may be interpreted as `Absent`.

## Microsoft retention constraint

Teams attendance reports follow Microsoft Teams retention behavior; Microsoft currently documents a one-year retention policy from the meeting date for meeting attendance reports. Therefore the validation collector should ingest evidence incrementally instead of treating Graph as an indefinite historical archive.

## Explicitly deferred to AV2

AV1 does **not**:

- run a scheduled collector;
- call `getAllTranscripts`/delta on a timer;
- write validation evidence to Firestore;
- persist complete transcript bodies;
- normalize overlapping participant intervals;
- compute teacher/learner dwell or teacher–learner overlap metrics;
- match Teams artifacts to Tiny Steps `classSessions`;
- classify teaching activity;
- reconcile attendance;
- create admin validation cases;
- invoke attendance correction;
- alter finance, teacher earnings or reschedule credits.

Those behaviors belong to later bricks after the service-principal activation gate is proven.
