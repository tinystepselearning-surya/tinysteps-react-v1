// public/shared/guard.js
import { auth } from "./firebase-init.js";
import { onAuthStateChanged, getIdTokenResult, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export function mountRoleGuard({ allow, onReady, onBlocked }) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onBlocked?.("unauthenticated");
      return;
    }
    try {
      // force refresh to get latest claims
      const token = await getIdTokenResult(user, true);
      const role = token.claims.role || null;
      if (allow.includes(role)) {
        onReady?.({ user, role });
      } else {
        await signOut(auth);
        onBlocked?.("forbidden");
      }
    } catch (e) {
      onBlocked?.("error");
    }
  });
}

