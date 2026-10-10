# Wave 1 — R5 Milestone 3: authorization parity and safe production-canary readiness

**Opened:** 2026-10-10  
**Status:** SOURCE / EMULATOR CHARACTERIZATION IN PROGRESS. Live role canaries and production principal coverage are **NOT VERIFIED**.  
**No production writes, Rules deployment, custom-claim changes, Admin grants, reader switch, or destructive retirement are authorized.**

## What is being compared

| Authorization surface | Current decision basis | Important difference / hold |
|---|---|---|
| Canonical Admin Functions | `authAccessReadModels/{firebaseUid}`; `accessActive` + global `admin` role; fail-closed | No UID, token-email, `superUser` or legacy `users` role fallback |
| Firestore client `isAdmin()` | Active/legacy `users/{uid}` plus `role`, `roles`, `superUser` and two identity-specific exception **types** | A user allowed here may be denied by canonical Functions; exceptions require owner decision |
| Firestore `isCurrentActiveAdmin()` | Active/legacy `users/{uid}` plus Admin role/roles, but **not** `superUser` or identity-specific exceptions | Some paths are intentionally stricter than `isAdmin()` even today |
| Storage client `isCurrentAdmin()` | Active/legacy `users/{uid}`; role/roles, `superUser`, identity-specific exception **types** | Image and pronunciation Admin uploads can differ from canonical Function access |
| Legacy School Admin | Active `users/{uid}` plus `schoolUsers/{uid}` active `schoolIds` membership | Canonical scoping uses `schoolAdminOrganisationIds`; compare org-by-org, never globalize |
| Founder | Separate legacy `founder` read-only access on selected management collections | Founder does not imply canonical global Admin |
| Parent, teacher, LP | Active legacy role and per-object or membership checks | Verify positive owner access and negative cross-user/tenant cases |

*The historical Rules contain concrete exception identities. This audit deliberately publishes neither their UID nor email value, token, hash, or lookup result. Rule-pattern presence is tracked, not identity disclosure.*

## Verified baseline and planned characterization

- **Source inventory:** `scripts/milestone3-authorization-parity-audit.mjs` inspects both Rules files, the canonical guard/loader, and the authoritative held-cutover ledger. It fails closed on unexpected authority or cutover changes. Its JSON artifact explicitly identifies high-priority unresolved parity decisions and labels live checks `NOT_VERIFIED`.
- **Source tests:** synthetic rule-shape and fail-closed regression tests; no repository exception literals may appear in report.
- **Firestore emulator:** synthetic active legacy `superUser` access, canonical-only role not yet recognized by legacy Rules, inactive/orphan denial, Founder read-not-write, school tenant isolation, owner-scoped parent wallets, and denied other roles.
- **Canonical code unit tests:** role-only Admin elevation, inactive/disabled principals, founder and school-scope separation, malformed read-model rejection.
- **Storage emulator:** synthetic Admin image/pronunciation writes, denied canonical-only/inactive/orphan Admin, owner-scoped student recording access and server-only certificate writes.
- **Deployment classifier:** this is tests/auditor/docs/CI only, with **0** Functions, Hosting, Firestore Rules, Storage Rules and indexes changed.

A passing emulator test proves the *current rule behavior* for synthetic identities; it does **not** certify that existing exceptions are safe to retire or that production role accounts work.

## Decision register: cannot be silently resolved

| Decision | Owner required | Required evidence | Current disposition |
|---|---|---|---|
| Identity-specific legacy Admin exceptions | Tiny Steps security/business owner | Intended identity function, canonical RoleAssignment status, least-privilege decision | **HOLD** |
| `superUser` legacy privilege | Tiny Steps security/business owner | Authorized role mappings; do not auto-convert legacy flag into canonical Admin | **HOLD** |
| Strict school-admin memberships | School/identity owner | Active `schoolUsers.schoolIds` to canonical organization IDs mapping, negative cross-tenant tests | **HOLD** |
| Founder lifted read-only permissions | Identity/security owner | Positive Founder reads and negative Founder mutations; never substitute global Admin | **HOLD** |
| Storage media writes | Product/security owner | Real media use cases and owner permissions, local Storage emulator, approved role canaries | **HOLD** |

## Read-only production canary protocol (later, with explicitly approved test identities)

1. Identify approved test actors representing global Admin, school Admin in two different tenant contexts, parent, teacher, LP and Founder. Do not use existing parents', students', or teachers' credentials without authorization.
2. Record intended access for one bounded, non-sensitive canary document or resource per role (e.g. admin projection metadata, a synthetic school membership, the actor's own parent-wallet metadata) and explicit negative cross-tenant targets. No write, update, backfill, teacher payout, invoice, attendance adjustment or role mutation.
3. Authenticate as each actor through supported user login, **not** Admin SDK or service-account bypass, and inspect only approved read endpoints. Record allow/deny, error code, principal age/freshness and approximate request count; redact UID, email and child data.
4. Compare `users`, `schoolUsers` and canonical principal projections only through a separately authorized, bounded read-only operator audit, not a cross-collection scan embedded in CI. The existing audit does **not** have production read credentials.
5. Verify measured Firestore reads, per-request authorization lookups, denied and missing-principal rates, and budget thresholds before suggesting any optimization.
6. Require explicit written owner decision and separately green emulator + production gates before scheduling *any* R5D Firestore/Storage Rules or reader cutover.

## Completion distinction

- **Source parity inventory:** can pass without live access.
- **Emulator current-Rules characterization:** can pass without live access.
- **Production role parity and identity coverage:** **NOT VERIFIED** until approved authenticated canaries and bounded production measurements execute.
- **Milestone 3 final exit:** remains **OPEN**; no cutover flag may be enabled by this audit.
