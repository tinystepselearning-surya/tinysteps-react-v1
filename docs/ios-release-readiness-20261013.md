# Tiny Steps iOS upgrade readiness — 13 October 2026

Base: `main` at `ce678402df89388cbfd3f07aec6cf30348767467`.

## Scope
- App ID stays `com.tinystepslearning.app`; ship the latest stable web build with a new iOS version/build number.
- iOS Sessions Management reminders should open WhatsApp Business explicitly. If absent, show an error **without** silently contacting parents from personal WhatsApp.
- Restore Firebase Auth on startup before deciding whether the user is signed out. Cached Zustand profile data is **not** an auth credential. An existing signed-in account with missing role claims may reuse only its own cached non-admin UI role.
- Explicit logout, revoked credentials, disabled accounts and security rejections remain respected.

## Work completed in this branch
- Capacitor AppLauncher dependency, native SwiftPM registration, iOS query scheme and Business-specific reminder launcher.
- AuthBootstrap role restoration corrections, fail-closed temporary role-claims recovery, and unit regression coverage.

## Audit fix: actual iOS build gate
- `.github/workflows/ios-native-package.yml` builds full production web assets, runs `npx cap sync ios`, checks that the bundled public index and configuration exist, and compiles `App` for iOS Simulator on a macOS GitHub Actions runner with code signing disabled.
- A passing simulator compile is **not** a signed TestFlight IPA or physical-device proof. Native plugin behavior, signing, provisioning and App Store Connect release remain gated.
- Session-restoration role-claims errors now leave users in initializing/existing authenticated state with a Retry action, rather than silently substituting kid role.

## Critical outstanding device verification
**Persistent login after force-close is not yet proven fixed.** Firebase Web SDK currently stores its native WebView credentials through IndexedDB/localStorage. Use Xcode's existing `[auth-diagnostics]` messages, with no token or PII logging, to compare:
1. First login, cold relaunch, force quit, 24h restart and 7-day restart.
2. `webview` origin, `local-probe`, `preferences-probe`, and `firebase-auth-key` presence.
3. Cases where the Firebase user is null even though the probes persist, and token-revocation cases.
4. Parent, teacher, admin and account-switch behavior.

If WebView credentials are lost, implement a reviewed native Keychain-backed Firebase Auth persistence solution; never store Firebase refresh tokens in Capacitor Preferences or plain localStorage without an explicit security review. Offline startup must not be confused with a verified sign-out.

WhatsApp Business `whatsapp-business://send` is not guaranteed by official Meta documentation. Verify a real iPhone with both WhatsApp apps installed, Business only, regular only, and neither, including prefilled message/recipient. **Do not merge until these behaviors are confirmed.**

## CI baseline
The `main` deploy job succeeded on 11 Oct; a separate Milestone 3 System Verification run failed on 12 Oct in 3 existing tests: `sessionRevenuePresentLatePolicy`, `wave1IdentityAuthorizationHardening`, and `RollingScheduleCompatibilityContract`. Do not attribute those failures to this branch without comparison.

## Release checklist
1. Pass typecheck, focused tests, frontend build, and any relevant iOS/build CI.
2. On a Mac with Xcode: `npm ci && npm run build && npm run cap:sync:ios && npm run cap:open:ios`.
3. Check successful macOS/Xcode simulator compilation in PR CI, then separately verify physical-device APNs, routes, safe areas, calendar, session, attendance, billing and Android/web parity.
4. Set `MARKETING_VERSION` and increment `CURRENT_PROJECT_VERSION` only after confirming the last App Store Connect build (avoid duplicate build numbers).
5. TestFlight smoke test on existing installations; archive and submit only after review. No Firebase backend deployment is required by these changes.
