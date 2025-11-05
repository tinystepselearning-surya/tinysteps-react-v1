# createAdmin Function - Deployment Guide

## ✅ Function Successfully Built

The `createAdmin` function is now ready to deploy using **Firebase Functions v2 API** with proper secrets support.

---

## 🚀 Deployment Steps

### Step 1: Set the Bootstrap Secret

Set the `BOOTSTRAP_TOKEN` secret (you'll be prompted to enter the value):

```bash
firebase functions:secrets:set BOOTSTRAP_TOKEN
```

**When prompted**, enter your secret token. You can generate one with:
```bash
openssl rand -hex 32
```

**Example token:** `57e61e067d592c3cc73b68f39b3f8d99125ca23e3e3ed1ba333b5a61db77581a`

**💡 Save this token** - you'll need it to call the function!

---

### Step 2: Deploy the Function

Deploy only the `createAdmin` function:

```bash
firebase deploy --only functions:createAdmin
```

**Expected output:**
```
✔  functions[us-central1-createAdmin] Successful create operation.
Function URL (createAdmin(us-central1)): https://us-central1-tinysteps-react-v1.cloudfunctions.net/createAdmin
```

**📝 Note the URL** - you'll use it in the next step.

---

### Step 3: Call the Function

Use `curl` to create an admin user:

#### Option A: Create Admin from Existing User

If the user already exists in Firebase Authentication:

```bash
curl -X POST "https://us-central1-tinysteps-react-v1.cloudfunctions.net/createAdmin" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: 57e61e067d592c3cc73b68f39b3f8d99125ca23e3e3ed1ba333b5a61db77581a" \
  -d '{
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin"
  }'
```

#### Option B: Create Admin + Auth User Together

If the user doesn't exist yet, add `"createIfMissing": true`:

```bash
curl -X POST "https://us-central1-tinysteps-react-v1.cloudfunctions.net/createAdmin" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: 57e61e067d592c3cc73b68f39b3f8d99125ca23e3e3ed1ba333b5a61db77581a" \
  -d '{
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin",
    "createIfMissing": true
  }'
```

**⚠️ Important:** Replace `57e61e067d592c3cc73b68f39b3f8d99125ca23e3e3ed1ba333b5a61db77581a` with your actual token!

---

### Step 4: Verify Success

**Expected Response:**
```json
{
  "ok": true,
  "uid": "abc123xyz789",
  "username": "suryaz"
}
```

**What was created:**
1. ✅ Custom claim set: `{ role: "admin" }`
2. ✅ Firestore document: `/users/{uid}`
3. ✅ Username mapping: `/usernames/suryaz`
4. ✅ Refresh tokens revoked (forces re-login)

---

### Step 5: Login to Admin Portal

Navigate to the admin portal:

**Development:**
```
http://localhost:5173/surya
```

**Production:**
```
https://tinystepslearning.com/surya
```

**Login with:**
- Email: `suryaz@tinysteps.com`
- Password: `Temp@123456` (if created with `createIfMissing: true`)
- Or your existing password

**⚠️ Change the temporary password immediately after first login!**

---

### Step 6: Verify Admin Access

Check that everything was created correctly:

**1. Firebase Console → Authentication**
- User exists with email `suryaz@tinysteps.com`

**2. Firebase Console → Firestore Database**
- `/users/{uid}` document has `role: "admin"`
- `/usernames/suryaz` document exists

**3. Test Admin Portal**
- Can access `/surya/dashboard`
- Can view statistics
- Can manage users

---

### Step 7: Clean Up (Optional but Recommended)

After creating admin user(s), delete the function for security:

```bash
firebase functions:delete createAdmin
```

This removes the bootstrap function from production.

**Keep the secret** in case you need to redeploy it later:
```bash
# View secrets
firebase functions:secrets:access BOOTSTRAP_TOKEN

# Delete secret (only if you're sure you won't need it)
firebase functions:secrets:destroy BOOTSTRAP_TOKEN
```

---

## 📋 Request Parameters

### Required
- **email** (string): Email address of the user

### Optional
- **username** (string): Username (defaults to part before @ in email)
- **name** (string): Display name (defaults to username)
- **createIfMissing** (boolean): Create Auth user if doesn't exist (default: false)

---

## 🔐 Security Notes

### Token Security
- The `BOOTSTRAP_TOKEN` is stored as a **Google Cloud Secret**
- Only the function can access it at runtime
- Never commit the token to git
- Use a strong random value (32+ hex characters)

### Function Security
- Only accepts POST requests
- Requires exact token match in `X-Bootstrap-Token` header
- Returns 401 Unauthorized for invalid tokens
- Returns 404 if user not found (unless `createIfMissing: true`)

### Temporary Password
If using `createIfMissing: true`:
- Default password: `Temp@123456`
- ⚠️ **User MUST change this immediately**
- Consider sending password reset email instead

---

## ❌ Troubleshooting

### Error: "Unauthorized: bad token"
**Cause:** Token mismatch

**Solution:**
```bash
# Check what token is set
firebase functions:secrets:access BOOTSTRAP_TOKEN

# Reset if needed
firebase functions:secrets:set BOOTSTRAP_TOKEN
firebase deploy --only functions:createAdmin
```

### Error: "User not found: email@domain.com"
**Cause:** User doesn't exist in Firebase Auth

**Solution:**
- Add `"createIfMissing": true` to request body, OR
- Create user manually in Firebase Console → Authentication

### Error: "Missing email"
**Cause:** Request body doesn't include email field

**Solution:**
```bash
# Ensure JSON includes "email"
-d '{"email":"user@domain.com","username":"user","name":"User Name"}'
```

### Function not found (404)
**Cause:** Function not deployed or wrong URL

**Solution:**
```bash
# Redeploy
firebase deploy --only functions:createAdmin

# Check deployed functions
firebase functions:list

# Verify URL in output
```

### Deployment fails with "secrets not found"
**Cause:** Secret not set before deployment

**Solution:**
```bash
# Set secret first
firebase functions:secrets:set BOOTSTRAP_TOKEN

# Then deploy
firebase deploy --only functions:createAdmin
```

---

## 📊 What Gets Created

### Firebase Authentication
- User record with email
- Custom claim: `{ role: "admin" }`
- Refresh tokens revoked

### Firestore Database

**/users/{uid}**
```json
{
  "email": "suryaz@tinysteps.com",
  "username": "suryaz",
  "usernameLower": "suryaz",
  "displayName": "Surya Admin",
  "role": "admin",
  "status": "active",
  "createdAt": "2025-11-06T...",
  "createdBy": "bootstrap-fn"
}
```

**/usernames/suryaz**
```json
{
  "uid": "abc123xyz789"
}
```

---

## 🔄 Creating Multiple Admins

To create additional admin users, simply call the function again:

```bash
curl -X POST "https://us-central1-tinysteps-react-v1.cloudfunctions.net/createAdmin" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: YOUR_TOKEN" \
  -d '{
    "email": "admin2@tinysteps.com",
    "username": "admin2",
    "name": "Second Admin",
    "createIfMissing": true
  }'
```

---

## 🎯 Quick Reference

**Set Secret:**
```bash
firebase functions:secrets:set BOOTSTRAP_TOKEN
```

**Deploy:**
```bash
firebase deploy --only functions:createAdmin
```

**Call Function:**
```bash
curl -X POST "https://us-central1-tinysteps-react-v1.cloudfunctions.net/createAdmin" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: YOUR_TOKEN" \
  -d '{"email":"user@domain.com","username":"user","name":"Full Name","createIfMissing":true}'
```

**Login:**
```
http://localhost:5173/surya
or
https://tinystepslearning.com/surya
```

**Clean Up:**
```bash
firebase functions:delete createAdmin
```

---

**Last Updated:** November 6, 2025  
**API Version:** Firebase Functions v2  
**Status:** ✅ Ready to Deploy
