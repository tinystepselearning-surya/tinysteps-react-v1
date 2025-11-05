# Firebase Configuration Fix - Summary

## ✅ All Issues Resolved

### 1. ✅ Clean `.env.local` Created
**Location:** `app/.env.local`

**Fixed:** No spaces around `=` signs (was causing zsh parse errors)

```env
VITE_FIREBASE_API_KEY=AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y
VITE_FIREBASE_AUTH_DOMAIN=tinysteps-react-v1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tinysteps-react-v1
VITE_FIREBASE_STORAGE_BUCKET=tinysteps-react-v1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=31484691215
VITE_FIREBASE_APP_ID=1:31484691215:web:2e8854696bc7e27b63347a
```

---

### 2. ✅ `firebase.ts` Updated with App Check Debug Mode
**Location:** `app/src/firebase.ts`

**Changes:**
- ✅ Added dev-only App Check debug token
- ✅ Simplified App Check initialization (uses `"debug"` fallback)
- ✅ Removed unused `appCheckSiteKey` variable
- ✅ Added `ensureAdminReady()` utility function

**Key Code:**
```typescript
// DEV ONLY: allow localhost through App Check
if (import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || "debug"
    ),
    isTokenAutoRefreshEnabled: true,
  });
}
```

---

### 3. ✅ Admin Claims Refresh Function Added
**Location:** `app/src/firebase.ts`

**Function:** `ensureAdminReady()`

**Purpose:** Force-refresh admin custom claims after login to avoid stale token issues

**Usage:**
```typescript
import { ensureAdminReady } from "./firebase";

// Call before admin operations
await ensureAdminReady();
```

**What it does:**
- Refreshes ID token to get latest custom claims
- Logs claims to console for debugging
- Warns if user doesn't have admin role
- Returns claims object

---

### 4. ✅ AdminRoute Updated to Use ensureAdminReady
**Location:** `app/src/components/admin/AdminRoute.tsx`

**Changes:**
- ✅ Imports `ensureAdminReady` from firebase
- ✅ Calls it before checking Firestore admin role
- ✅ Ensures custom claims are fresh before protected reads

**Code:**
```typescript
try {
  // Force-refresh admin claims first
  await ensureAdminReady();
  
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const hasAdminRole = userDoc.exists() && userDoc.data()?.role === "admin";
  setIsAdmin(hasAdminRole);
} catch (error) {
  console.error("Admin check failed:", error);
  setIsAdmin(false);
}
```

---

### 5. ✅ Firestore Security Rules Deployed
**Location:** `firestore.rules`

**Deployed:** ✅ Successfully deployed to `tinysteps-react-v1`

**Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.role == 'admin'; }

    // Users can read their own profile; admins can read/write all
    match /users/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow write: if isAdmin();
    }

    // Usernames are publicly readable; only admins can write
    match /usernames/{username} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Default: signed-in users can read; only admins can write
    match /{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

**Security:**
- ✅ Admin role checked via custom claims (`request.auth.token.role`)
- ✅ Users can only read their own profile
- ✅ Only admins can write to `/users` and `/usernames`
- ✅ All writes require admin role by default

---

## 🚀 Next Steps

### 1. Start the Dev Server
```bash
cd ~/Documents/Tinysteps-react-v1/app
npm run dev
```

### 2. Test Admin Login
Navigate to: `http://localhost:5173/surya`

**Expected behavior:**
- ✅ No App Check errors (debug mode enabled)
- ✅ No env loading errors (clean .env.local)
- ✅ Admin claims refresh on login
- ✅ Console shows: `"User claims: { role: 'admin', ... }"`

### 3. Monitor Console Output
Open browser DevTools and check for:
```
User claims: { role: "admin", ... }
```

If you see `"User does not have admin role"`, the custom claim is not set. Run `createAdmin` function first.

---

## 🔧 Troubleshooting

### Issue: "App Check token fetch failed"
**Solution:** Dev mode is enabled, but if you still see errors:
```bash
# Add to .env.local (optional)
VITE_RECAPTCHA_V3_SITE_KEY=debug
```

### Issue: "Permission denied" on Firestore reads
**Solution:** 
1. Check console for claims: `await ensureAdminReady()`
2. Verify user has `role: "admin"` in custom claims
3. If not, run `createAdmin` Cloud Function

### Issue: "Missing custom claim"
**Solution:** Deploy and call `createAdmin` function:
```bash
cd ~/Documents/Tinysteps-react-v1/functions
npm run build
firebase deploy --only functions:createAdmin

# Then call it (see CREATEADMIN_DEPLOYMENT.md)
```

---

## 📋 Files Modified

| File | Status | Changes |
|------|--------|---------|
| `app/.env.local` | ✅ Created | Clean env vars (no spaces) |
| `app/src/firebase.ts` | ✅ Edited | App Check debug + ensureAdminReady() |
| `app/src/components/admin/AdminRoute.tsx` | ✅ Edited | Calls ensureAdminReady() |
| `firestore.rules` | ✅ Deployed | Role-based security rules |

---

## ✅ Verification Checklist

- [x] `.env.local` has no spaces around `=`
- [x] `firebase.ts` enables App Check debug mode in dev
- [x] `firebase.ts` exports `ensureAdminReady()` function
- [x] `AdminRoute.tsx` calls `ensureAdminReady()` before checks
- [x] Firestore rules deployed successfully
- [x] Rules check `request.auth.token.role == 'admin'`

---

**Status:** ✅ All fixes complete and deployed  
**Ready for:** Testing at `http://localhost:5173/surya`  
**Last Updated:** November 6, 2025
