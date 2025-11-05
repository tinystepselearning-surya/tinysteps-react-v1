# Create Admin - Quick Commands

## 🚀 Quick Setup (Copy & Paste)

### 1. Generate Secret Token
```bash
openssl rand -hex 32
```
Copy the output and use it in the next steps.

---

### 2. Set Bootstrap Token
```bash
firebase functions:config:set bootstrap.token="PASTE_YOUR_TOKEN_HERE"
```

---

### 3. Deploy Function
```bash
firebase deploy --only functions:createAdmin
```

---

### 4. Get Function URL

**Your function URL format:**
```
https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin
```

**Find your values:**
- **REGION**: Check Firebase Console → Functions (usually `us-central1`)
- **PROJECT-ID**: Check Firebase Console → Project Settings

**Example URL:**
```
https://us-central1-tinysteps-learning.cloudfunctions.net/createAdmin
```

---

### 5. Create User in Firebase Console

1. Go to Firebase Console → Authentication
2. Add User:
   - Email: `suryaz@tinysteps.com`
   - Password: [choose strong password]
3. Save credentials

---

### 6. Call Function (Create Admin)

**Template:**
```bash
curl -X POST https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: PASTE_YOUR_TOKEN_HERE" \
  -d '{
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin"
  }'
```

**Example (Replace values):**
```bash
curl -X POST https://us-central1-tinysteps-learning.cloudfunctions.net/createAdmin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: b8a7f3e9c2d1a5b4e8f9c7d2a3b6e1f4" \
  -d '{
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin"
  }'
```

**Expected Success Response:**
```json
{
  "ok": true,
  "uid": "abc123...",
  "username": "suryaz"
}
```

---

### 7. Verify Creation

**Check Firestore:**
```
Firebase Console → Firestore Database
- /users/{uid} → Should have role: "admin"
- /usernames/suryaz → Should exist
```

**Check Custom Claims:**
```bash
firebase auth:export users.json
# Look for customClaims: { role: "admin" }
```

---

### 8. Login to Admin Portal

**Development:**
```
http://localhost:5173/surya
```

**Production:**
```
https://tinystepslearning.com/surya
```

**Credentials:**
- Email: `suryaz@tinysteps.com`
- Password: [from step 5]

---

### 9. Clean Up (After Success)

**Delete function:**
```bash
firebase functions:delete createAdmin
```

**Remove token:**
```bash
firebase functions:config:unset bootstrap.token
```

---

## 🔧 Additional Commands

### Create Another Admin
```bash
# 1. Create user in Firebase Console first
# 2. Then run:
curl -X POST https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: YOUR_TOKEN" \
  -d '{
    "email": "admin2@tinysteps.com",
    "username": "admin2",
    "name": "Second Admin"
  }'
```

### Check Current Config
```bash
firebase functions:config:get
```

### View Function Logs
```bash
firebase functions:log --only createAdmin
```

### Redeploy After Changes
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:createAdmin
```

---

## 📋 Complete Workflow Checklist

- [ ] Generate random token with `openssl rand -hex 32`
- [ ] Set token with `firebase functions:config:set bootstrap.token="..."`
- [ ] Deploy function with `firebase deploy --only functions:createAdmin`
- [ ] Note your function URL (region + project-id)
- [ ] Create user in Firebase Console → Authentication
- [ ] Save email and password
- [ ] Call function with curl (paste your URL and token)
- [ ] Verify response: `{ "ok": true, ... }`
- [ ] Check Firestore: `/users/{uid}` has `role: "admin"`
- [ ] Check Firestore: `/usernames/suryaz` exists
- [ ] Login at `/surya` with credentials
- [ ] Verify access to admin dashboard
- [ ] Delete function with `firebase functions:delete createAdmin`
- [ ] Remove token with `firebase functions:config:unset bootstrap.token`

---

## ❌ Common Errors & Fixes

### Error: "Unauthorized"
```bash
# Check your token matches
firebase functions:config:get

# If different, set it again
firebase functions:config:set bootstrap.token="YOUR_TOKEN"
```

### Error: "User not found"
```bash
# Create user in Firebase Console → Authentication first
# Then run curl command again
```

### Error: "Function not found"
```bash
# Verify deployment
firebase deploy --only functions:createAdmin

# Check function exists
firebase functions:list
```

### Claims Not Working
```bash
# User must logout and login again after function runs
# Or revoke all sessions:
firebase auth:revoke --email suryaz@tinysteps.com
```

---

## 🎯 One-Liner (All Steps Combined)

**For experienced users:**
```bash
# Set token
firebase functions:config:set bootstrap.token="$(openssl rand -hex 32)"

# Deploy
firebase deploy --only functions:createAdmin

# Note: Create user in Firebase Console manually, then call function with curl

# Clean up
firebase functions:delete createAdmin && firebase functions:config:unset bootstrap.token
```

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: November 2025
