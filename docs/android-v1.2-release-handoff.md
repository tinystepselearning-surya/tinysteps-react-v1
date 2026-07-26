# Tiny Steps Android 1.2 release handoff

## Release identity

| Item | Value |
|---|---|
| Branch | `android-v1.2-production-lift-and-shift` |
| Source | `main` at `0cf513fa` (`release: Tiny Steps iOS 1.2 build 3`) |
| Application ID | `com.tinystepslearning.app` |
| Display name | Tiny Steps |
| Version name | `1.2` |
| Version code | `2` |
| Minimum SDK | 24 |
| Target / compile SDK | 36 / 36 |
| Firebase project | `tinysteps-react-v1` |
| Capacitor | 8.3.1 |
| Android Gradle Plugin / Gradle | 8.13.0 / 8.14.3 |

Version code 2 is the next repository-known value after the existing code 1. The Play
Console must still be checked before upload because upload history is not stored in Git.

## Implementation

- Reused the existing React/TypeScript application and Android Capacitor project. No
  second frontend, backend, data model, reminder scheduler, or Android-only Firestore
  read path was introduced.
- Extended the final native parent shell to Android while preserving the released iOS
  detection used for iOS billing behavior.
- Added Android system inset handling, 48dp navigation/header targets, press feedback,
  Android keyboard-resize handling, and predictable hardware/gesture Back behavior.
- Back dismisses the keyboard or active sheet/menu first, returns a conversation to the
  inbox, returns secondary tabs to Home, and backgrounds the app at the Home root.
- Preserved the production Home, Classes, Messages, Payments, Insights, Skills, Games,
  profile, menu, worksheet, recording, calendar, wallet, and lesson-tracker data and
  calculations.
- Added strict native deep-link allowlisting, cold-launch handling, authenticated
  pending-route persistence, route-once behavior, and safe HTTPS external opening.
- Added an Android 13+ notification education prompt, denial persistence, and a route
  to the system notification settings. The app remains usable after denial.
- Added stable `messages` and `class_reminders` notification channels before token
  registration. Token registration/refresh persists active state; logout unregisters
  native push; production logging does not reveal tokens.
- Preserved the single in-app foreground banner and same-thread suppression.
- Added Tiny Steps legacy, round, adaptive, and monochrome icons plus density-aware
  splash artwork.
- Disabled cleartext traffic, release WebView debugging, and application backup; narrowed
  deep-link filters; added extraction/backup rules and local-only signing configuration.

## Firebase and notification boundary

The tracked `google-services.json` identifies Firebase project `tinysteps-react-v1` and
package `com.tinystepslearning.app`; it was not replaced or exposed in logs. Functions,
Firestore, Firebase Auth, and production endpoints are unchanged.

The deployed `deliverPushToUser` payload does not currently set
`android.notification.channelId` or `android.notification.notificationCount`.
Consequently:

- background notifications use the manifest default `messages` channel;
- a background class reminder cannot reliably select `class_reminders` until the
  backend supplies that channel ID;
- exact launcher badge numerals cannot be guaranteed from the current system
  notification payload. Launcher badge support also varies by OEM.

The unread aggregate and thread-specific mark-read behavior remain the source of truth.
No hardcoded badge value or unreliable badge library was added. Resolving the two payload
limitations requires a separately approved Functions change and deployment.

## Validation

| Check | Result |
|---|---|
| TypeScript typecheck | Pass |
| Root lint | Pass, 0 errors (11 pre-existing warnings) |
| Root Vitest | Pass: 105 files passed, 3 skipped; 705 tests passed, 4 skipped |
| Production web build / prerender | Pass |
| SEO route integrity | Pass |
| Functions build | Pass |
| Functions lint | Pass |
| Functions Vitest | Pass: 13 files, 108 tests |
| `npx cap sync android` | Pass; App, Browser, Haptics, Preferences, Push Notifications detected |
| Android debug APK | Pass |
| Android unit tests | Pass |
| Android lint | Pass |
| Android release APK | Pass |
| Android release AAB | Pass |
| Final combined Gradle verification | Pass: 711 tasks, build successful |
| Diff whitespace check | Pass |

Focused tests cover native platform/deep-link contracts, Android manifest/security/
notification/version contracts, invalid-route rejection, and conversation-to-inbox Back
behavior. Existing shared tests cover durable auth restoration, explicit logout,
notification registration and refresh, single-banner/same-thread behavior, mark-read,
duplicate sends, and parent-screen data behavior.

## Artifacts and signing

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

The debug APK is debug-signed. The release APK and AAB are unsigned because no production
keystore or local `key.properties` was present. Signing reads local properties when
provided; keystores and signing secrets are ignored and were not created or committed.
The AAB is review-ready but not Play-upload-ready until the owner configures the intended
upload key / Play App Signing.

## Device matrix still required

No emulator or physical Android device was attached to this run. Before promoting beyond
internal testing, execute the requested Pixel/current Android, small-screen, Android 13+
permission, gesture/three-button navigation, light/dark, 1.0/1.3 font-scale, and real-phone
matrix. This must include force-stop/restart auth, Gboard/Samsung Keyboard, foreground and
background FCM, same-thread suppression, class reminder routing, Pixel/Samsung badges,
QR scanning, WhatsApp installed/unavailable, external documents, cutouts, and all parent
screens.

## Google Play internal-test checklist

1. Confirm Play Console package ownership and that version code 2 has never been uploaded.
2. Configure the production upload key or enroll in Play App Signing, then generate a
   signed AAB from this exact commit.
3. Upload only to Internal testing; do not promote automatically.
4. Complete App access with working parent-review credentials and navigation notes.
5. Complete Ads, Content rating, Target audience and content, Data safety, privacy policy,
   account/data-deletion, and any Families declarations applicable to the actual audience.
6. Data Safety review must include all behavior across Firebase Auth/Firestore/Functions/
   FCM and third-party SDKs: account identifiers/contact data, parent/child profile and
   learning/progress records, class and message content, FCM tokens/device identifiers,
   support interactions, and payment/wallet metadata. Legal/product owners must confirm
   collection purpose, sharing, retention, optionality, and deletion answers.
7. Notification explanation: “Enable notifications to receive new-message alerts and
   reminders shortly before scheduled classes. Tiny Steps remains usable if declined.”
8. Tester CSV must contain one Google/Google Workspace email address per row. If this is
   a personal developer account created after 13 November 2023, confirm whether the
   current 12-testers-for-14-continuous-days production-access rule applies.
9. Internal release notes:
   “Android test release of the refreshed Tiny Steps parent experience, including Home,
   Classes, Messages, Payments, Insights, Skills, improved notifications, unread counts,
   persistent login and class reminders.”
10. Store assets: 512x512 32-bit PNG app icon (maximum 1024KB); 1024x500 JPEG or 24-bit
    non-alpha PNG feature graphic; at least two accurate phone screenshots, plus large
    screen assets if those form factors are distributed. Capture assets from the signed
    release after the device audit.
11. Privacy policy: `https://tinystepslearning.com/privacy-policy`.
12. Support contact: `Priya@tinystepslearning.com`.

No Google Play publication or Firebase deployment was performed.
