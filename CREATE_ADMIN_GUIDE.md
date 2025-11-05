# Create Admin User - Bootstrap Function Guide

## 📋 Overview

This guide explains how to use the `createAdmin` Cloud Function to create your first admin user with proper role claims and Firestore profile.

## 🎯 What This Function Does

The `createAdmin` function:
1. ✅ Verifies the user exists in Firebase Authentication
2. ✅ Sets custom claim `{ role: "admin" }` on the user
3. ✅ Revokes refresh tokens (forces re-authentication)
4. ✅ Creates Firestore document in `/users/{uid}`
5. ✅ Creates username mapping in `/usernames/{username}`
6. ✅ Sets `role: "admin"` in Firestore

## 🚀 Setup Instructions

### Step 1: Create User in Firebase Console

**Before** running the function, create a user in Firebase Authentication:

1. Go to **Firebase Console** → **Authentication**
2. Click **Add User**
3. Enter:
   - Email: `suryaz@tinysteps.com`
   - Password: (choose a strong password)
4. Click **Add User**
5. **Save the credentials** - you'll need them to login

### Step 2: Set Bootstrap Token

Set a one-time secret token for the function:

```bash
firebase functions:config:set bootstrap.token="YOUR_LONG_RANDOM_SECRET_HERE"
```

**Example:**
```bash
firebase functions:config:set bootstrap.token="b8a7f3e9c2d1a5b4e8f9c7d2a3b6e1f4"
```

💡 **Tip**: Generate a strong random token:
```bash
openssl rand -hex 32
```

### Step 3: Deploy the Function

Deploy only the `createAdmin` function:

```bash
firebase deploy --only functions:createAdmin
```

**Expected output:**
```
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: preparing codebase default for deployment
i  functions: current functions in codebase default: createAdmin
i  functions: uploading functions in codebase default...
✔  functions: functions successfully updated
```

### Step 4: Get Your Function URL

After deployment, note the function URL. It will be in this format:

```
https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin
```

**Example:**
```
https://us-central1-tinysteps-learning.cloudfunctions.net/createAdmin
```

You can find your region and project ID:
- **Region**: Check Firebase Console → Functions (usually `us-central1`)
- **Project ID**: Check Firebase Console → Project Settings

### Step 5: Call the Function

Use `curl` to call the function and create the admin user:

```bash
curl -X POST https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: YOUR_LONG_RANDOM_SECRET_HERE" \
  -d '{
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin"
  }'
```

**Full Example:**
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

**Expected Response (Success):**
```json
{
  "ok": true,
  "uid": "abc123def456ghi789",
  "username": "suryaz"
}
```

### Step 6: Verify Admin User

Check that everything was created correctly:

1. **Firebase Console → Authentication**
   - User should exist with email `suryaz@tinysteps.com`

2. **Firebase Console → Firestore Database**
   - Collection: `/users/{uid}` should have:
     ```json
     {
       "email": "suryaz@tinysteps.com",
       "username": "suryaz",
       "usernameLower": "suryaz",
       "displayName": "Surya Admin",
       "role": "admin",
       "status": "active",
       "createdAt": [Timestamp],
       "createdBy": "bootstrap-fn"
     }
     ```
   - Collection: `/usernames/suryaz` should have:
     ```json
     {
       "uid": "abc123def456ghi789"
     }
     ```

3. **Custom Claims**
   - Run this in Firebase Console → Functions → Test:
     ```javascript
     const admin = require('firebase-admin');
     admin.auth().getUser('abc123def456ghi789')
       .then(user => console.log(user.customClaims));
     ```
   - Should show: `{ role: 'admin' }`

### Step 7: Login to Admin Portal

1. Navigate to: `http://localhost:5173/surya` (dev) or `https://tinystepslearning.com/surya` (prod)
2. Login with:
   - Email: `suryaz@tinysteps.com`
   - Password: [password from Step 1]
3. You should be redirected to `/surya/dashboard`

### Step 8: Clean Up (Recommended)

After successfully creating the admin user, delete the function for security:

```bash
firebase functions:delete createAdmin
```

Confirm with `y` when prompted.

**Also remove the bootstrap token:**
```bash
firebase functions:config:unset bootstrap.token
```

---

## 📝 Request Parameters

### Required
- **email** (string): Email address of the user (must already exist in Firebase Auth)

### Optional
- **username** (string): Username for the admin (defaults to part before @ in email)
- **name** (string): Display name (defaults to Firebase Auth displayName or username)

### Example Request Body
```json
{
  "email": "admin@tinysteps.com",
  "username": "admin",
  "name": "Super Admin"
}
```

---

## 🔐 Security Headers

The function requires a special header for authorization:

```
X-Bootstrap-Token: [your-secret-token]
```

This token must match the value set in Step 2.

---

## ❌ Error Responses

### 401 Unauthorized
**Cause**: Missing or invalid `X-Bootstrap-Token` header

**Response:**
```
Unauthorized
```

**Solution**: Check the token matches what you set in `firebase functions:config:set`

### 400 Bad Request
**Cause**: Missing required `email` field

**Response:**
```
Missing 'email'
```

**Solution**: Include `email` in request body

### 404 Not Found
**Cause**: User doesn't exist in Firebase Authentication

**Response:**
```
User not found: suryaz@tinysteps.com
```

**Solution**: Create the user in Firebase Console → Authentication first

### 500 Internal Server Error
**Cause**: Various Firebase errors (permissions, network, etc.)

**Response:**
```json
{
  "ok": false,
  "error": "Error message here"
}
```

**Solution**: Check Firebase Console logs for details

---

## 🧪 Testing with Different Tools

### Using Postman

1. **Method**: POST
2. **URL**: `https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin`
3. **Headers**:
   - `Content-Type: application/json`
   - `X-Bootstrap-Token: YOUR_SECRET_HERE`
4. **Body** (raw JSON):
   ```json
   {
     "email": "suryaz@tinysteps.com",
     "username": "suryaz",
     "name": "Surya Admin"
   }
   ```

### Using JavaScript (Browser Console)

```javascript
fetch('https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Bootstrap-Token': 'YOUR_SECRET_HERE'
  },
  body: JSON.stringify({
    email: 'suryaz@tinysteps.com',
    username: 'suryaz',
    name: 'Surya Admin'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Using Python

```python
import requests

url = "https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin"
headers = {
    "Content-Type": "application/json",
    "X-Bootstrap-Token": "YOUR_SECRET_HERE"
}
data = {
    "email": "suryaz@tinysteps.com",
    "username": "suryaz",
    "name": "Surya Admin"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

---

## 🔄 Creating Multiple Admins

To create additional admin users, repeat Steps 1 and 5 with different emails:

```bash
# Create user in Firebase Console first, then:

curl -X POST https://[REGION]-[PROJECT-ID].cloudfunctions.net/createAdmin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: YOUR_SECRET_HERE" \
  -d '{
    "email": "admin2@tinysteps.com",
    "username": "admin2",
    "name": "Admin Two"
  }'
```

---

## 🛠️ Troubleshooting

### "User not found" Error
**Problem**: Function returns 404 with "User not found: email@domain.com"

**Solution**:
1. Go to Firebase Console → Authentication
2. Verify the user exists with that exact email
3. If not, create the user first
4. Try again

### "Unauthorized" Error
**Problem**: Function returns 401 Unauthorized

**Solution**:
1. Check the token in your curl command matches exactly what you set:
   ```bash
   firebase functions:config:get
   ```
2. Make sure there are no extra spaces or characters
3. Try setting the token again

### Function URL Not Found
**Problem**: curl returns 404 or "Function not found"

**Solution**:
1. Verify deployment succeeded:
   ```bash
   firebase deploy --only functions:createAdmin
   ```
2. Check the function URL in Firebase Console → Functions
3. Make sure you're using the correct region and project ID

### Custom Claims Not Applied
**Problem**: User can't access admin portal after creation

**Solution**:
1. The user must **logout and login again** for claims to take effect
2. Check claims in Firebase Console:
   ```bash
   firebase auth:export users.json
   # Check the customClaims field for your user
   ```
3. If claims are missing, run the function again

---

## 📊 What Gets Created

After successful execution:

### Firebase Authentication
- User has custom claim: `{ role: "admin" }`
- Refresh tokens are revoked (forces re-login)

### Firestore `/users/{uid}`
```typescript
{
  email: "suryaz@tinysteps.com",
  username: "suryaz",
  usernameLower: "suryaz",
  displayName: "Surya Admin",
  role: "admin",
  status: "active",
  createdAt: Timestamp,
  createdBy: "bootstrap-fn"
}
```

### Firestore `/usernames/suryaz`
```typescript
{
  uid: "abc123def456ghi789"
}
```

---

## ⚠️ Important Notes

1. **One-Time Use**: This function is meant for initial setup only
2. **Delete After Use**: Remove the function after creating admin users
3. **Secure Token**: Never commit the bootstrap token to git
4. **User Must Exist**: Create user in Firebase Auth before calling function
5. **Force Re-login**: User must logout and login again for claims to work
6. **Username Uniqueness**: Usernames are stored lowercase in `/usernames/`

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console → Functions → Logs
2. Verify Firebase Auth user exists
3. Check Firestore security rules allow admin writes
4. Ensure you have billing enabled (Cloud Functions require Blaze plan)

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Function Name**: `createAdmin`
