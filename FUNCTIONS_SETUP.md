# Cloud Functions Setup - Prerequisites

## ⚠️ Important: Install Dependencies First

Before deploying the `createAdmin` function, you need to install the required Firebase packages in the `functions` folder.

## 📦 Installation Steps

### 1. Navigate to Functions Folder
```bash
cd functions
```

### 2. Install Required Packages
```bash
npm install firebase-functions firebase-admin
```

### 3. Install TypeScript Dependencies
```bash
npm install --save-dev @types/node typescript
```

### 4. Verify Installation
```bash
npm list firebase-functions firebase-admin
```

Expected output:
```
functions@1.0.0 /path/to/functions
├── firebase-admin@X.X.X
└── firebase-functions@X.X.X
```

### 5. Build TypeScript
```bash
npm run build
```

## 📝 Complete Setup Sequence

```bash
# From project root
cd functions

# Install dependencies
npm install firebase-functions firebase-admin

# Install dev dependencies
npm install --save-dev @types/node typescript

# Build
npm run build

# Return to root
cd ..

# Now you can deploy
firebase deploy --only functions:createAdmin
```

## 🔍 Verify Package.json

Your `functions/package.json` should include:

```json
{
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

## ⚙️ Firebase Configuration

### Check Firebase.json

Ensure your `firebase.json` includes:

```json
{
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ],
    "runtime": "nodejs18"
  }
}
```

### Set Node Version (Optional)

In `functions/package.json`:

```json
{
  "engines": {
    "node": "18"
  }
}
```

## 🐛 Common Issues

### "Cannot find module 'firebase-functions'"

**Solution:**
```bash
cd functions
npm install firebase-functions firebase-admin
```

### "tsc: command not found"

**Solution:**
```bash
cd functions
npm install --save-dev typescript
```

### "Module not found: '@types/node'"

**Solution:**
```bash
cd functions
npm install --save-dev @types/node
```

### Build Errors

**Solution:**
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🚀 Full Clean Install

If you're having persistent issues:

```bash
# From project root
cd functions

# Clean everything
rm -rf node_modules package-lock.json lib

# Fresh install
npm install

# Build
npm run build

# Verify
npm run lint

# Deploy
cd ..
firebase deploy --only functions:createAdmin
```

## 📋 Pre-Deployment Checklist

Before deploying `createAdmin` function:

- [ ] `cd functions` directory
- [ ] Run `npm install firebase-functions firebase-admin`
- [ ] Run `npm install --save-dev @types/node typescript`
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] `functions/lib/createAdmin.js` exists
- [ ] Return to project root
- [ ] Run deployment command

## 🎯 Quick Install Script

Copy and paste this complete setup:

```bash
#!/bin/bash
# Setup Cloud Functions

echo "📦 Installing Cloud Functions dependencies..."
cd functions

echo "1️⃣ Installing runtime dependencies..."
npm install firebase-functions firebase-admin

echo "2️⃣ Installing dev dependencies..."
npm install --save-dev @types/node typescript

echo "3️⃣ Building TypeScript..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd .."
echo "2. firebase functions:config:set bootstrap.token=\"YOUR_SECRET\""
echo "3. firebase deploy --only functions:createAdmin"

cd ..
```

Save as `setup-functions.sh`, make executable with `chmod +x setup-functions.sh`, then run `./setup-functions.sh`.

---

**Note:** These dependencies are required for **all** Firebase Cloud Functions, not just `createAdmin`. Once installed, they'll be available for `onSessionCreate` and other functions too.

---

**Last Updated**: November 2025
