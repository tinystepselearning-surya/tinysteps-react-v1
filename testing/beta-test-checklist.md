## Tiny Steps AI Phase 1 — Internal Beta Checklist (1 Week, 10 Kids + 3 Teachers)

### Kids’ Practice Buddy (SATPIN + CVC)
- [ ] Can a 6-year-old understand the UI (self-serve, icons, hint toggles)?
- [ ] AI responses are age-appropriate (no complex vocab, no unsafe content).
- [ ] Kids enjoy experience (ask “was it fun?” verbally; score 1-5).
- [ ] Audio/pronunciation (if enabled) sounds correct and clear.
- [ ] Timeout handling: spinner shows, friendly fallback appears within 30s.
- [ ] All whitelisted CVC words return responses (spot check full list).
- [ ] Daily limit enforcement: 10 sessions/day (11th request blocked gracefully).
- [ ] Engagement rating (1-5) recorded after session.
- [ ] Feedback collected: “What did you like?” / “What was hard?”

### Worksheet Generator (Teachers)
- [ ] Teachers can generate a worksheet in <5 clicks (<20s prep).
- [ ] Questions are correct and grade-appropriate for selected level.
- [ ] PDF download works and matches preview.
- [ ] Teacher can edit content before saving.
- [ ] Generated content free of typos/format errors.
- [ ] Performance: response <5 seconds (target) / <30s absolute timeout.
- [ ] Worksheet quality rating (1-5) captured.
- [ ] Feedback: “Would you use this regularly?” + topics requested.

### Safety & Security
- [ ] Kid cannot access other kids’ data (cross-student read fails).
- [ ] Parent cannot access teacher-only features (route + rules deny).
- [ ] Rate limiting works: Practice Buddy >10/day blocked; callable >100/day/student blocked.
- [ ] Error logging present in `ai-error-logs` for failure cases.
- [ ] Groq API key secured in Secret Manager (not exposed client-side).
- [ ] Firestore rules verified for `ai-sessions`, `ai-usage-logs`, `worksheets`, `teacher-worksheet-logs`.

### Performance
- [ ] Response time <30s; track average (<5s goal) via console timestamps.
- [ ] Firestore reads/writes per request <5 (spot check via emulator logs or Firestore debug).
- [ ] Error rate <1% across the week (count errors / total calls).
- [ ] Uptime 100% (no callable downtime; monitor logs).

### Test Instructions
1. Use staging Firebase project with emulators where possible; sign in with kid/teacher roles.
2. For kids: Provide 5-minute guided tour, let them pick 3 words, observe without prompting answers.
3. For teachers: Generate 2 worksheets (one Phonics, one Grammar), edit 1 field, download PDF, save to library.
4. Record timestamps: start request, response received; note any spinner >10s.
5. Verify Firestore writes: `ai-sessions`, `student-ai-history`, `worksheets`, `teacher-worksheet-logs`, `ai-error-logs`.
6. After each session, capture ratings and open comments (forms below).

### Data Collection Template (per session)
- Tester type: Kid | Teacher | Parent
- User id (or alias):
- Feature: Practice Buddy | Worksheet Generator
- Word/topic used:
- Start time / Response time (s):
- Outcome: Success | Error (status/message)
- Engagement/Quality rating (1-5):
- Notes: (free text)

### Feedback Prompt (verbal for kids, form for others)
- What did you like most?
- What was confusing or hard?
- If you could change one thing, what would it be?

### Feedback Form Links
- Kids: beta-feedback/kids
- Teachers: beta-feedback/teachers
- Parents: beta-feedback/parents

### Exit Criteria (end of week)
- ≥50 total sessions logged.
- Avg response <5s; no response >30s.
- Error rate <1%.
- Kid engagement ≥4/5 average.
- Teacher satisfaction ≥4/5 average.
- All P0/P1 bugs fixed or ticketed with owners/dates.
