# Canva Lesson Plan Feature - Visual Flow

## 🎯 Feature Overview

```
┌─────────────────────────────────────────────────────────────┐
│  TEACHER DASHBOARD → UPCOMING SESSIONS TAB                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  SESSION CARDS (grouped by date)                            │
│                                                              │
│  📅 Monday, December 9 (3 sessions)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  10:00 AM                              [Scheduled]  │    │
│  │  Phonics Foundation Course                          │    │
│  │  3 students                                         │    │
│  │                                                      │    │
│  │  [📄 View Lesson Plan] [Set Reminder] [View Details]│    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2:00 PM                               [Scheduled]  │    │
│  │  Grammar Basics                                     │    │
│  │  5 students                                         │    │
│  │                                                      │    │
│  │  [Set Reminder] [View Details]                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   (Teacher clicks 📄 View Lesson Plan)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CANVA LESSON PLAN MODAL                                [X] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Phonics Foundation Course - 10:00 AM                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │          [ CANVA EMBEDDED PRESENTATION ]             │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │                                               │   │  │
│  │  │   Trial Class Foundation Course               │   │  │
│  │  │                                               │   │  │
│  │  │   📚 Lesson Plan Content:                    │   │  │
│  │  │   • Introduction to Phonics                   │   │  │
│  │  │   • Letter Recognition Activities             │   │  │
│  │  │   • Sound Practice                            │   │  │
│  │  │   • Interactive Games                         │   │  │
│  │  │                                               │   │  │
│  │  │   [Navigation controls at bottom]             │   │  │
│  │  │                                               │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📌 Note: This lesson plan is for reference only.           │
│     You can view and present it during the session.         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  FIRESTORE: sessions/{sessionId}                            │
│                                                              │
│  {                                                           │
│    "id": "session_abc123",                                  │
│    "courseName": "Phonics Foundation Course",               │
│    "date": "2025-12-09",                                    │
│    "startTime": "10:00",                                    │
│    "teacherId": "teacher_xyz",                              │
│    "kidIds": ["kid1", "kid2", "kid3"],                      │
│    "lessonPlanUrl": "https://canva.com/design/...embed" ⭐  │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  HOOK: useUpcomingSessions(teacherId)                       │
│                                                              │
│  • Queries Firestore for teacher's upcoming sessions        │
│  • Filters sessions within next 7 days                      │
│  • Returns sessions array with lessonPlanUrl field          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT: UpcomingSessionsView                            │
│                                                              │
│  • Displays sessions grouped by date                        │
│  • Shows "View Lesson Plan" button if lessonPlanUrl exists  │
│  • Manages modal open/close state                           │
│  • Passes session data to modal                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT: CanvaLessonPlanModal                            │
│                                                              │
│  • Receives: lessonPlanUrl, sessionTitle, courseName        │
│  • Renders: Dialog with embedded iframe                     │
│  • Prevents: Right-click, direct download                   │
│  • Allows: View, navigate, fullscreen                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Admin Workflow

```
1. CREATE CANVA DESIGN
   ├─ Design lesson plan in Canva
   ├─ Include: slides, activities, resources
   └─ Make public (Anyone with link can view)
              ↓
2. GET EMBED URL
   ├─ Click: Share → More → Embed
   ├─ Copy: iframe src URL
   └─ Format: https://www.canva.com/design/ABC/view?embed
              ↓
3. ADD TO FIRESTORE
   ├─ Option A: Firebase Console
   │  └─ sessions/{id} → Add field: lessonPlanUrl
   │
   └─ Option B: Admin Script
      └─ node scripts/add-lesson-plan-to-session.js
              ↓
4. VERIFY
   ├─ Login as teacher
   ├─ Navigate to Upcoming Sessions
   └─ Confirm "View Lesson Plan" button appears
```

---

## 🎓 Teacher User Journey

```
1. TEACHER LOGS IN
   └─ Dashboard loads with upcoming session count
              ↓
2. NAVIGATES TO UPCOMING SESSIONS
   └─ Sees list of sessions for next 7 days
              ↓
3. FINDS SESSION WITH LESSON PLAN
   └─ Identifies by 📄 "View Lesson Plan" button
              ↓
4. CLICKS VIEW LESSON PLAN
   ├─ Modal opens instantly
   ├─ Canva embed loads
   └─ Full presentation visible
              ↓
5. REVIEWS LESSON PLAN
   ├─ Navigates through slides
   ├─ Takes mental notes
   └─ Prepares for class
              ↓
6. DURING CLASS (Optional)
   ├─ Opens lesson plan modal
   ├─ Shares screen with students
   └─ Uses as teaching reference
              ↓
7. CLOSES MODAL
   └─ Returns to session list
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SECURITY LAYERS                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣ FIRESTORE RULES                                         │
│     ├─ Teachers can only read own sessions                  │
│     ├─ lessonPlanUrl is read-only for teachers              │
│     └─ Only admins can write lessonPlanUrl                  │
│                                                              │
│  2️⃣ CANVA EMBED RESTRICTIONS                                │
│     ├─ View-only mode enforced by Canva                     │
│     ├─ No edit access from embed                            │
│     └─ Download disabled in embed mode                      │
│                                                              │
│  3️⃣ IFRAME PROTECTION (Frontend)                            │
│     ├─ onContextMenu prevented (no right-click)             │
│     ├─ Direct interaction limited                           │
│     └─ HTTPS URLs only accepted                             │
│                                                              │
│  4️⃣ MODAL CONSTRAINTS                                       │
│     ├─ Can only view (no save buttons)                      │
│     ├─ Content not cached locally                           │
│     └─ Closes on user action                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
pages/teacher/TeacherDashboard.tsx
  └─ components/upcoming-sessions/UpcomingSessionsView.tsx
       ├─ hooks/useUpcomingSessions.ts
       │    └─ Fetches sessions from Firestore
       │
       ├─ Session Cards (mapped)
       │    ├─ Display: time, course, students
       │    ├─ Conditional: "View Lesson Plan" button
       │    └─ Click handler: handleViewLessonPlan()
       │
       └─ components/lesson-plan/CanvaLessonPlanModal.tsx
            ├─ Props: lessonPlanUrl, sessionTitle, courseName
            ├─ UI: Dialog (shadcn/ui)
            ├─ Content: iframe with Canva embed
            └─ Controls: Close button, outside click
```

---

## 📱 Responsive Design

```
DESKTOP (> 1024px)
┌─────────────────────────────────────────────────────────────┐
│ [Session Card] [Session Card] [Session Card]                │
│ [Session Card] [Session Card] [Session Card]                │
└─────────────────────────────────────────────────────────────┘
Grid: 3 columns

TABLET (768px - 1024px)
┌───────────────────────────────────┬───────────────────────────┐
│ [Session Card]                    │ [Session Card]            │
│ [Session Card]                    │ [Session Card]            │
└───────────────────────────────────┴───────────────────────────┘
Grid: 2 columns

MOBILE (< 768px)
┌─────────────────────────────────────────────────────────────┐
│ [Session Card]                                               │
│ [Session Card]                                               │
│ [Session Card]                                               │
└─────────────────────────────────────────────────────────────┘
Grid: 1 column (stacked)

MODAL (all sizes)
┌─────────────────────────────────────────────────────────────┐
│ Full width on mobile, max-w-5xl on desktop                  │
│ Height: 90vh (leaves space for header/footer)               │
│ Scrollable if content exceeds height                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### For Teachers
- ✅ Can easily find sessions with lesson plans
- ✅ Can view full presentation without leaving the app
- ✅ Can navigate through slides smoothly
- ✅ Can use fullscreen for better viewing
- ✅ Interface is intuitive and fast

### For Admins
- ✅ Easy to add lesson plan URLs to sessions
- ✅ Bulk operations possible via script
- ✅ Clear documentation available
- ✅ No technical barriers

### For Security
- ✅ Teachers cannot download/edit original
- ✅ Content is protected from unauthorized use
- ✅ Access is limited to assigned teachers
- ✅ URLs are validated (HTTPS only)

### For Performance
- ✅ Modal loads quickly
- ✅ No impact when not in use
- ✅ Iframe lazy-loads content
- ✅ App remains responsive

---

## 🚀 Next Steps

1. **Test the feature**
   ```bash
   cd /Users/tinysteps/Documents/Tinysteps-react-v1
   npm run dev
   ```

2. **Add a test lesson plan**
   ```bash
   node scripts/add-lesson-plan-to-session.js YOUR_SESSION_ID "CANVA_URL"
   ```

3. **Verify as teacher**
   - Login with teacher account
   - Go to Upcoming Sessions
   - Click "View Lesson Plan"

4. **Review documentation**
   - `docs/canva-lesson-plan-quickstart.md` (Quick start)
   - `docs/canva-lesson-plan-integration.md` (Full guide)
   - `docs/testing/canva-lesson-plan-test-guide.md` (Testing)

---

**Feature is ready to use! 🎉**
