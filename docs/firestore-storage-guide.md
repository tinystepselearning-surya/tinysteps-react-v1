# Firestore & Storage Guidance (Games removed)

This project originally contained design notes for game-related storage patterns (SpellBee, Maze, Bingo, Reading, Public Speaking). As of v2.1 those interactive game features and their data models have been removed from the codebase.

Recommended guidance going forward:
- Keep user profile documents compact. Store only essential fields (name, contact, role, parent/child links).
- If you reintroduce per-feature progress in future, design a separate, opt-in module with clear migration steps and a dedicated collection (do not auto-create many per-user docs at account creation).
- Use Firestore batched writes and transactions for multi-document updates to maintain consistency.
- Prefer Cloud Storage for large media assets and cache them via service worker when needed.

If you need help reworking any of the removed game schemas into a future-safe, opt-in design, I can draft migration steps and minimal schemas on request.
