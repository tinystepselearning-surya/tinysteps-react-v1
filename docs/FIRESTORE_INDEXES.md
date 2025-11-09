# Firestore Index Recommendations

This document lists recommended composite indexes for queries used by the frontend hooks and how to capture exact index suggestions from Firestore at runtime.

Suggested indexes (already added to `firestore.indexes.json`):

- sessions: (teacherId ASC, status ASC, scheduledAt ASC)
- invoices: (parentId ASC, dueDate DESC)
- enrollments: (parentId ASC, status ASC)

Why these are needed
- `useSessionsForTeacher` queries sessions where `teacherId == X` and `status in [...]` and orders by `date` / `scheduledAt`. Firestore may require a composite index for `in` + `orderBy` combos.
- `useInvoices` queries `parentId == X` and orders by `dueDate` desc; composite index helps performance and avoids runtime index errors.

How to capture exact Firestore index links (recommended workflow)

1. Open the app and navigate to the Dev page: `http://localhost:5176/dev`.
2. Use the Dev Admin input to run a query that would exercise the hooks (for example enter a real `parentId` used in your dev Firestore data and click "Refetch").
3. If Firestore needs an index, the web console (browser) will show an error with a direct link to create the index in the Firebase Console. The error message also contains a JSON spec.
4. Click the link or copy the JSON snippet and add it to your `firestore.indexes.json` or create it via Firebase Console.

Applying indexes

- Using Firebase Console: follow the link from the runtime error and create the suggested index.
- Using CLI: you can deploy `firestore.indexes.json` with `firebase deploy --only firestore:indexes` (ensure you have the firebase CLI configured for the correct project).

Notes

- Firestore will always show the exact composite index required for the failing query in the error message.
- The included `firestore.indexes.json` contains recommended indexes; treat them as starting points and refine after exercising the app.
