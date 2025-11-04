// public/shared/guard.js
import { auth } from "./firebase-init.js";

const FALLBACK_USER = {
  uid: "demo-user",
  displayName: "Guest User",
  email: "guest@tinystepslearning.com",
};

export function mountRoleGuard({ allow = [], onReady }) {
  const role = allow[0] || "guest";

  queueMicrotask(() => {
    try {
      Object.defineProperty(auth, "currentUser", {
        configurable: true,
        value: { ...FALLBACK_USER, uid: `${role}-demo` },
      });
    } catch {
      /* auth.currentUser may be readonly in mocks */
    }

    onReady?.({
      user: { ...FALLBACK_USER, uid: `${role}-demo` },
      role,
    });
  });

  return () => undefined;
}
