import UIKit
import Capacitor

/// Provides the single scene/window required by apps built with the iOS 27 SDK.
/// Keep app-wide push callbacks in AppDelegate.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Do not load Main.storyboard a second time. The manifest has no
        // UISceneStoryboardFile; this is the sole Capacitor bridge controller.
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = CAPBridgeViewController()
        self.window = window
        window.makeKeyAndVisible()

        // Preserve best-effort URL/universal-link delivery for Capacitor 8.3.
        // Revisit this when moving to Capacitor 8.5 SceneDelegateProxy.
        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [:]
            )
        }
        for activity in connectionOptions.userActivities {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                continue: activity,
                restorationHandler: { _ in }
            )
        }
    }

    func scene(_ scene: UIScene, openURLContexts urlContexts: Set<UIOpenURLContext>) {
        for context in urlContexts {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [:]
            )
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}
