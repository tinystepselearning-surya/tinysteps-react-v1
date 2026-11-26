# B02-R1C follow-up — isolated Firestore backend compatibility

**Status:** focused emulator experiment PASS; combined acceptance regression and isolated integration pending. Scope under Revision 56: offline backend compatibility, not B02-R2 or production authorization. Base 8598c93af20e7d50e8b4d1557da91b6d98a48871. Preserve 505/505 owner-verified baseline; no accepted executable source modified.

## Why this experiment

The 60 local SDK tests used a controlled gRPC server, not Firestore itself. Existing P01 D13 finance experiments already passed actual pinned readTime behavior with Firestore emulator 1.19.8 (see [D13 evidence](../discovery/P01_D13_CLOSURE_AND_BOUNDED_COLLECTOR_2026-11-26.md) and the existing [finance workflow](../../../.github/workflows/milestone3-firestore-finance.yml)). Reuse its exact emulator artifact/version/checksum and Java 21. The earlier 1.22.0 finance attempt had failures; do not silently switch versions or normalize away an identity decoder incompatibility.

## Controlled identity-specific experiment

New probe uses the actual locked generated Firestore v1 SDK (Firestore 7.11.6, resolved GAX 4.6.1, grpc-js 1.14.1, google-auth-library 9.15.1, retry-request 7.0.2), prior single-attempt options and unchanged accepted decoded-response collector. The probe constructs fixed synthetic descriptors independently rather than parameterizing the existing request lane's fixed synthetic loopback project; this is a backend protocol experiment, not end-to-end canonical sampler or live operator verification. No runtime code, new dependencies, Rules, CI, IAM or registry changes.

| Step | Expected evidence |
|---|---|
| Seed three local synthetic documents | Projection, matching role assignment, unrelated role assignment; each includes a field not requested by the mask |
| Strong masked point read | Only expected fields, server readTime |
| Local synthetic revocation | Update projection and role assignment after anchor, never a real actor |
| Historical point and person-filtered query | Same exact readTime, original active state, unrelated role excluded, unselected fields omitted |
| Empty query and missing legacy point | Correct empty/missing result and same snapshot, accepted by unchanged collector |
| Fresh point and query | New snapshot observes inactive state; do not interpret prior snapshot as current authorization |

7 logical read RPCs max; 2 local fixture commits containing 5 synthetic document writes max; query limit 51; max received message 65536 bytes; local 5-second RPC timeout, 2-second drain watchdog. Fixture setup mutates only disposable emulator state; read lane never writes. No claimed physical retry counts or billed-read maximum for actual backend. Test fails closed on unexpected decoded frame shape or timestamp; capture stage diagnostic only, investigate exact failure, do not widen decoder silently. No production reads/writes or real credentials.

## Owner execution

Prerequisites: same clean local checkout and locked Functions dependencies as prior tests, Node v22.22.1, Java 21, bash, lsof, shasum. Existing finance workflow pins jar SHA256 9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d. Use existing verified jar or download the exact artifact from https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.19.8.jar into a local tooling directory. The runner copies the jar into a fresh temporary directory and verifies the checksum before starting a new loopback-only Java process on dedicated port 8788; refuses an existing listener, confirms its own PID is listening, uses demo-tsos-identity-transport and sanitized environment with fresh HOME. Stops and removes only its own temporary fixture process/directory on exit. No Firebase CLI, real project, ADC discovery, deploy, imported data or production credentials. This is process configuration, not OS network egress certification. Do not launch against any existing emulator or real project.

From exact reviewed candidate head:
```bash
bash scripts/verification/run-identity-transport-emulator.sh /absolute/path/to/cloud-firestore-emulator-v1.19.8.jar
```
Record exact checkout, jar checksum, Node version, Java major, test status and code-only stage diagnostics. No need to rerun 505 unchanged tests just to establish this separate experiment; run full cumulative regression before accepting any changed executable candidate. A failure or unavailable prerequisite is NOT PASS. Actual emulator behavior is not production Firestore or browser Rules authorization; historical snapshot semantics do not prove current revocation propagation. Independent security, signed private operator approval, IAM and B02-R2 remain HOLD. No automatic architecture integration or production deployment.

## Owner verification and acceptance checkpoint (26 November 2026)
Exact tested commit 5bcfc9153f3330903e0c65ea7c50858843c33fd0, Mac Node v22.22.1, Homebrew Java 21.0.13.1, Firestore emulator 1.19.8 checksum verified. Previous Java 25 attempt stopped before startup as designed. The subsequent attempt passed 1/1, zero fail/cancel/skip/todo, case 407.403958 ms, total 529.087708 ms. Owner Terminal evidence, not CI or independent security review. All declared stage diagnostics passed: local fixture seed, server field mask and timestamp, historical point and filtered query after synthetic mutation, empty query and missing legacy point, fresh snapshot observing changed synthetic projection and role. Seven logical reads, two local fixture commits, five synthetic writes; physical retries and production billed reads not measured. DEP0040 warning persists separately. Homebrew installation also upgraded 20 local formula dependencies and cleaned older local packages/cache; no repository dependency changes inferred. Java 21 selected within subshell, no permanent Java PATH change required.

Reviewed diff against Revision 56 base: exactly three added files. Tested probe blob 265f6c2b32e66f70fc95039358e507b356b0778b and runner blob 6676dbade1e49b02202c5b56f6207118e43e45cb; accepted 505-test sources unchanged. Main remained 95b44babd7f3132b212b781eabeec000fced14c8 at review. This establishes compatibility of the tested decoder and fixed synthetic descriptors with this emulator. It does not exercise the entire canonical sampler on the emulator, all response variants, browser Rules, live revocation propagation, real IAM, backend cancellation or billing. The prior 505 and this one test are separately verified checkpoints, not yet a unified 506-test run on the expanded candidate. Before isolated acceptance of the new executable files, perform the documented full cumulative regression (505 prior cases plus focused emulator test, same clean head and pinned dependencies). No automatic merge, no production activity. R2 remains HOLD. Next review should close only concrete gaps needed for an independently approved live operator, not extend the suite merely to increase counts.
