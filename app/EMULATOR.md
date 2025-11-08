# Running Firebase Emulator for local end-to-end testing

This guide walks through running the Firebase Emulator locally and validating teacher → parent flows safely.

Prerequisites
- Firebase CLI installed (v11+ recommended)
- Node.js and project dependencies installed (run `npm install` in `app/`)

1) Start the emulators
From the project root (where `firebase.json` exists):

```bash
firebase emulators:start --only firestore,auth
```

This will start the Firestore and Auth emulators and show a local UI at http://localhost:4000 by default.

2) Use the dev UI and seed data
- Open the Emulator UI and create test users (teacher and parent). Note the UIDs.
- Alternatively, sign up using the app's UI (the emulator will capture the auth users).

3) Run the app locally pointed at emulator
In a separate terminal under `app/`:

```bash
npm run dev
```

The web app will use default Firebase config. If using the emulator, the Firebase SDK auto-detects the emulator when started locally by the CLI. If not, you can programmatically connect to the emulator in `src/firebase.ts` using `connectFirestoreEmulator` and `connectAuthEmulator`.

4) Seed test data via the UI
- Sign in as the teacher account you created.
- Open a student's profile and use the "Seed Sample Data" button (provided in the teacher UI) to add attendance and curriculum topics.
- Sign in as the parent for the student and open the Parent Progress page — you should see the seeded attendance and curriculum updates immediately.

4b) Optional: run our automated seed script (recommended)

- We included a script that uses the Admin SDK to create a teacher, parent, and student and link them together. It also seeds a few attendance and curriculum entries.
- From the `app/` folder run (when emulator running):

```bash
# use your emulator host/ports if different
FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099 node tools/seed_emulator.js
```

This will create the following test identities and docs:
- Auth users: `teacher-test@tinysteps.com` (uid: `teacher-test`), `parent-test@tinysteps.com` (uid: `parent-test`)
- Firestore docs: `students/student-test`, `parents/parent-test/children/student-test`, `teachers/teacher-test`
- Also adds sample attendance under `students/student-test/attendance` and curriculum under `students/student-test/curriculum`.

5) Force token refresh after changing custom claims
If you add custom claims to a user (via admin SDK), call in browser console while signed-in as that user:

```js
await firebase.auth().currentUser.getIdToken(true)
window.location.reload()
```

6) Automated E2E with Playwright + Emulator
- Configure Playwright to talk to the emulator (use the emulator auth credentials or create users programmatically via the Admin SDK against the emulator).
- You can run `npm run test:e2e` (requires Playwright setup) after configuring environment variables that point to the emulator host if necessary.

Notes
- Do not point the emulator at production databases.
- The teacher UI includes `Seed Sample Data` so manual seeding is easy without writing admin scripts.

If you want, I can add a tiny seed script that uses the Admin SDK against the emulator to create a teacher + student + parent and link them, so tests can be fully automated. Let me know if you'd like that and which IDs/emails to use.
