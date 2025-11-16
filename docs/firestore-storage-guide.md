# Firestore & Storage Optimization (Phase 4 Games)

## Batch Operations
- Prefer batched writes for progress updates and streaks to cut write costs and reduce contention.
- Example: update userProgress skills in one batch instead of 100 writes.

## Collection-Group Queries
- Use collectionGroup for cross-user analytics (e.g., `gameStats` across all users) to power leaderboards and teacher dashboards efficiently.

## Denormalization
- Copy lightweight profile fields (name, avatar) into leaderboards to avoid joins and speed queries.

## Indexes
- Add composite indexes for complex queries: e.g., `users/progress/spellbee` on (accuracy asc, lastPlayed desc, levelReached asc) for fast filtering/sorting.

## Sharded Counters
- Spread hot counters across shards (e.g., `gamePlayCount_shard_0..9`) to avoid single-doc contention; sum shards for totals.

## Offline + Sync
- Cache game data for offline play (SpellBee starter words, Maze templates, Bingo cards). Sync attempts when back online.

## Storage Tips
- Store large static datasets (word banks, mazes, prompts) once in `gameData/{game}` and read via callable (`getGameContent`) to avoid repeated downloads.
- Consider gzipping JSON if serving via Hosting/Storage for faster payloads.
- Store media (audio/pronunciations, images) in Cloud Storage, not Firestore docs. Cache via service worker when needed (e.g., pronunciations/spellbee/{word}.mp3).
- For progressive images: load a thumb from Storage first, then swap in the full asset once loaded.

## Game-Specific Schemas
- SpellBee (`users/{uid}/progress/spellbee`): store `accuracy`, `wordsLearned`, `currentLevel`, `nextReviewDue` (array of timestamps for spaced repetition), `masteredWords`, `learningWords`, `failedAttempts` map for typo patterns.
- Maze (`users/{uid}/progress/maze`): `mazesMastered`, `currentLevel`, `levelProgress` per level (completed/total/accuracy), `personalBest` (fastestCompletion, maxStreak, highestAccuracy), `recentSessions` array (date, maze id, time, accuracy).
- Reading (`users/{uid}/progress/reading`): `currentLevel`, `booksRead`, `chaptersCompleted`, `avgComprehension`, `readingTime`, `favoriteBooks`, `sessionHistory` (date, book, chapter, readingTime, comprehensionScore, wpm, recordingUrl pointing to Cloud Storage).

## Real-Time Dashboards
- Teacher dashboard: listen to `teachers/{teacherId}/classes/{classId}/studentMetrics` with `onSnapshot` for accuracy/streak/lastActive to keep class overview live.
- Parent dashboard: listen to `users/{parentId}/children/{childId}/dailyMetrics` ordered by date for recent accuracy/points charts.
