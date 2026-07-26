# Android v1.2 pre-implementation repository report

Date: 2026-07-26 (Asia/Kolkata)

## Preparation and repository safety

- Source branch: `main`
- Source commit: `0cf513fa release: Tiny Steps iOS 1.2 build 3`
- `origin/main` was fetched and is identical to local `main` (`0` ahead, `0` behind).
- Required history is present:
  - `2a5d275d feat(app): harden auth chat badges and class reminders`
  - `101d0f7d feat(parent): add premium native visual polish`
  - `5a422dd3 chore(ios): prepare version 1.2 build 3`
  - `0cf513fa release: Tiny Steps iOS 1.2 build 3`
- The original `main` worktree was not clean before this task. It contained six pre-existing generated feed/sitemap modifications. They were not stashed, reset, edited, or carried into this branch.
- To preserve that work, the requested branch `android-v1.2-production-lift-and-shift` was created from `origin/main` in an isolated Git worktree.
- The isolated branch was clean at creation and `git diff --check` passed.

## Current Android audit

| Area | Current state | Required action |
|---|---|---|
| Android project | Existing Capacitor Android project | Preserve and repair in place; do not recreate |
| applicationId | `com.tinystepslearning.app` | Retain |
| versionName | `1.0` | Update to `1.2` |
| versionCode | `1`; repository history contains no value greater than 1 | Use next valid integer, `2` |
| Firebase config | `android/app/google-services.json` is present; project is `tinysteps-react-v1`; configured package is `com.tinystepslearning.app` | Preserve; do not print or alter credentials |
| Push notifications | Capacitor plugin and shared registration/deep-link logic present; Android permission and channel helpers are partial | Complete Android permission UX, stable channels, metadata and tests |
| Deep links | Push route handling exists in shared TypeScript; Android manifest has no narrow HTTPS app-link filter | Preserve authenticated pending-route handling and add only verified/narrow native routing |
| Notification channels | Shared code creates `messages` and `class_reminders` channels | Verify stable properties and native delivery metadata |
| App icons | Present, but default Android robot/template artwork rather than Tiny Steps production artwork; no monochrome adaptive layer | Replace from existing Tiny Steps artwork and add monochrome asset |
| Splash | Present in density/orientation variants; current theme uses a legacy drawable and requires visual verification | Repair theme/assets for Android 12+ and Tiny Steps branding |
| Signing | Optional local `key.properties` configuration exists; keystores and properties are ignored | Preserve and make unsigned-release behavior explicit |
| Play Store readiness | Blocked by versioning, production icon/splash, release hardening, full builds, signing material, device checks and Play Console declarations | Complete code/build work; report physical-device and console-only checks |

## Toolchain and project state

- Capacitor: `8.3.1`
- Capacitor Android: `8.3.1`
- Android Gradle Plugin: `8.13.0`
- Gradle wrapper: `8.14.3`
- Kotlin: not used by the app module
- Java/JDK: Gradle/AGP-compatible JDK required; the repository pins Node `22.22.1`
- minSdk: `24`
- targetSdk: `36`
- compileSdk: `36`
- Main activity: `com.tinystepslearning.app.MainActivity`, currently an empty `BridgeActivity` subclass
- Manifest: launcher activity exported intentionally; FileProvider is not exported; `INTERNET` and `POST_NOTIFICATIONS` declared
- Cleartext policy: not explicitly disabled
- Backup: currently enabled without an explicit data-extraction policy
- Release minification: disabled
- WebView debugging: no explicit release guard in `MainActivity`
- Status/navigation bars: default theme only; no deliberate edge-to-edge/inset policy
- Keyboard: shared app contains iOS-specific viewport handling; Android-specific resize/back behavior is not implemented

## Version-code decision

The only Android `versionCode` found in the current file and repository history is `1`. No repository Play release notes or Gradle history show a higher uploaded value. The next repository-safe value is therefore `2`. This still requires confirmation against Google Play Console before upload because Play upload history is not available locally.

## Constraints carried into implementation

- Reuse the existing React/TypeScript and Capacitor app.
- Preserve `com.tinystepslearning.app`, Firebase project `tinysteps-react-v1`, app name, production endpoints, shared business logic, and iOS Version 1.2 behavior.
- Do not deploy Firebase or publish to Google Play.
- Do not commit keystores, local properties, build output, screenshots, emulator data, or credentials.
