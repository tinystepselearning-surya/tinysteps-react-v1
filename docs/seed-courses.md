# Seeding Courses

This document shows how to seed the `courses` collection in Firestore for both emulator and production environments.

⚠️ IMPORTANT: Seeding production changes data in your production Firestore. Use `seed:courses:prod` only if you are certain.

## Using the Emulator (recommended for local development)

1. Start the Firebase emulators:

```bash
firebase emulators:start --only auth,firestore,functions
```

2. Use the npm script to seed the emulator which sets the right env variables:

```bash
npm run seed:courses:emulator
```

This sets `PROJECT_ID=demo-tinysteps` and connects to the Firestore emulator.

## Using Production (or any real Firebase project)

1. Prepare your environment:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
export GOOGLE_CLOUD_PROJECT=your-production-project-id
```

2. Run the production seeding script (no emulator env variables set):

```bash
npm run seed:courses:prod
```

This will write the course docs into your production Firestore. Be careful and review the payloads in `scripts/courses.json`.

## Where the seed data lives

- `scripts/courses.json` — the canonical list used by the seeding script.
- `scripts/seed-courses.js` — the script that reads the JSON file and writes to Firestore.

## Course document format (example)

- Document ID: `early-phonics`
- Document fields:
  - `id: "early-phonics"` (string)
  - `title: "Early Phonics"` (string)
  - `description: "Early Phonics by Tiny Steps"` (string)
  - `level: "general"` (string)
  - `tags: []` (optional array)
  - `createdAt`, `updatedAt` (timestamps)

## Troubleshooting

- If you see `Error: Unable to detect a Project Id in the current environment` when running the seed: set `GOOGLE_CLOUD_PROJECT` env var or include it in `admin.initializeApp({projectId})`.
- If writes are failing due to security rules, either:
  - Use `admin` SDK credentials/service account to write (for production or emulator seeding), or
  - Temporarily adjust `firestore.rules` to allow writes and restore them after seeding.

## After seeding

- Check the Firestore Emulator UI at http://127.0.0.1:4001/firestore to confirm the docs are present (emulator), or open the Firebase Console in your project for production.
- Launch the app and verify `AssignCourseModal` picks up the courses without fallback (the UI fetches the `courses` collection).

---

If you want, I can add `seed:courses:prod` to your CI/CD pipeline with a git tag deployment to keep seeds reproducible — tell me if you want that and I’ll prepare a PR for the workflow (with secure secrets handling).