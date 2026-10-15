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

## iOS 27 physical-device launch blocker — confirmed and patched
- iPhone 16 Plus initially presented a black screen and Xcode emitted:
  `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption: Application failed to launch`.
- Root cause: native app only used `@UIApplicationMain` AppDelegate; `UIApplicationSceneManifest`, `SceneDelegate.swift`, and scene creation were absent.
- Patch introduces a single scene-managed `CAPBridgeViewController`, forwards incoming URL/universal links via existing Capacitor 8.3 ApplicationDelegateProxy, preserves AppDelegate push-notification handling, and registers the Swift file in the Xcode target.
- CI adds launch-lifecycle wiring assertions. **Unsigned Simulator compilation does not establish a successful on-device launch.** Rebuild using Xcode 27 and physically verify rendering, login persistence, push and URL handling.
- Current branch is pinned to Capacitor 8.3.x. Future upgrade to Capacitor 8.5+ should replace the compatibility forwarding with official `SceneDelegateProxy` and receive an independent regression pass.
- On existing Mac clone: `git pull --ff-only`, `npx cap sync ios`, reopen Xcode if needed, Product > Clean Build Folder, Run on physical iPhone.

## 15 October mobile Sessions Management and Business link follow-up
- On phone-width layouts, **Today / Tomorrow-Date / Overall Admissions**, Student Updates and Teacher Updates render vertically stacked cards instead of wide tables. Desktop keeps the complete table interface.
- Phone cards retain the join/copy Teams actions, editable parent/teacher reminder templates, editable phone numbers, teacher notification, manual-session cancellation when applicable, and manual Parent/Teacher notified flags. WhatsApp handoff NEVER marks a notification sent.
- Tab groups now wrap button labels within phone width; teacher/status/date filters can shrink without forcing sideways scrolling.
- The dedicated `whatsapp-business://send` scheme is **not an officially guaranteed Meta contract**. The launcher attempts it directly rather than accepting a potentially false-negative `canOpenUrl` result. If launch fails, the app presents a manual copy-number/copy-message handoff to Business; it NEVER falls back to personal Messenger.
- Physical iPhone acceptance: verify 320/375/390/430px widths (no clipped controls or horizontal page pan), scroll down each of the three Sessions modes, exercise every action including confirmation flags, and ensure the persistent bottom navigation remains visible.
- WhatsApp acceptance: try Business-only, both apps, personal-only and neither. Check destination, pre-filled message, and which app actually opens. Mark direct Business launch as unverified until observed; if it fails use the explicit manual Business handoff and consider a future iOS share-extension integration following UX review.
- No iOS IPA has been signed or shipped. Do not merge solely on Simulator compilation or GitHub green checks.

## 15 October compact Sessions cards and WhatsApp Business follow-up
- The phone Sessions view now shows Student / Parent and Course / Teacher in two-column rows beneath the session time and status, with wrapping labels. Session type and row Actions remain accessible.
- The non-working Parent Notified / Teacher Notified checkboxes are removed from the **mobile cards**. Existing desktop checkboxes and stored data are preserved; do not infer delivery from tapping Notify or choosing a share target.
- The third-party `whatsapp-business://` URL failed on the user's actual iPhone. An iOS Share sheet action now offers an OS-supported chooser. Operator copies the recipient phone number, taps **Share message using iOS**, explicitly selects **WhatsApp Business**, selects and confirms the recipient, and sends manually. If Business is absent in the share sheet, copying message/number is the fallback. Do not suggest or silently use personal WhatsApp.
- Because `@capacitor/share` is a new native plugin, macOS installation requires `npm ci --ignore-scripts`, `npx cap sync ios`, Xcode package resolution and a fresh iPhone build, not just a web reload.
- Before marking WhatsApp fixed, verify Business appears as a share destination on the real iPhone and that it accepts reminder text. Automatic recipient selection and delivery status are not supported or claimed.
- No production deployments, Firestore changes, or signed TestFlight release performed.

## 15 October WhatsApp iPhone deep-link research and opt-in chat-link experiment
- Meta officially documents `https://wa.me/<international-number>?text=<encoded-text>` for iOS as its preferred Click-to-Chat universal link, and `whatsapp://send` for WhatsApp Messenger. It does **not** promise the third-party `whatsapp-business://send` scheme or guaranteed selection of the Business installation.
- Apple's `UIApplication.open` can open URL handlers and may display app/website routing; opening a URL does not establish which WhatsApp account eventually opens or whether a reminder was sent. Capacitor's `AppLauncher.openUrl` exposes this launch result but not account identity/delivery.
- Following verified Business-only link failure on iPhone, fallback dialog now offers **Open WhatsApp chat link** that uses the official recipient-prefilled `wa.me` URL. There is no automatic redirect to this link: operator explicitly taps it after seeing prominent warning that personal WhatsApp may open.
- If iOS selects personal Messenger, **return without sending**. The alternative is **Choose WhatsApp Business via iOS Share**, then manually select/verify recipient, or manually copy number and message.
- Physical acceptance requirements: test with only Business installed; both Business and Messenger installed; Business available/not available in iOS share sheet. Confirm which app the official `wa.me` route opens and whether the phone/message survive. If Business is not selected, do not enable one-tap direct mode.
- Deeper future option: fully integrated approved WhatsApp Business Platform messages use a distinct API/account/onboarding/template/consent workflow; they are not an iOS URL-scheme substitute and are out of scope for this manual reminder feature.
- Sources: https://faq.whatsapp.com/425247423114725/ and https://developer.apple.com/documentation/uikit/uiapplication/open(_:options:completionhandler:).
- No change to production messaging, Firestore notified flags, user authentication, or existing browser/Android behavior.
