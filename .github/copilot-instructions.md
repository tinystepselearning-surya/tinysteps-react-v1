# AI Coding Agent Instructions

Welcome to the TinySteps Online School Web App!
This document defines the rules, workflows, and conventions for all AI coding agents (ChatGPT, Copilot, Claude, etc.) contributing to this project.
Please follow every convention to maintain a unified, secure, and scalable codebase.

🏫 Project Overview

TinySteps is a multi-role online school built to help children learn phonics, grammar, and public speaking through interactive digital games and teacher-led classes.
It provides integrated dashboards for Parents, Teachers, Learning Partners (RMs), Admins, and Kids.

⚙️ Core Tech Stack
Layer	Technology
Frontend	React (with Vite) + TypeScript
Styling	Tailwind CSS
State	React Context + Hooks
Routing	React Router v6
Backend	Firebase (Auth, Firestore, Cloud Functions, Hosting, App Check)
Deployment	Firebase Hosting + GitHub Actions
Testing	Jest + React Testing Library
Tools	ESLint, Prettier, Husky (git hooks)

👥 User Roles & Permissions
Role	Description	Access Highlights
Parent	Monitors child’s progress, attendance, and fees.	Can view but not edit academic or financial data.
Student (Kid)	Plays games, completes worksheets, joins classes.	Must access through parent login (child-safe).
Teacher	Conducts classes, updates progress, assigns worksheets.	Write access to attendance, curriculum, and progress.
Learning Partner (RM)	Manages teachers, parents, and student assignments.	Full visibility on cohorts, fees, and utilization.
Admin	Manages users, roles, and global settings.	Can create users and set roles via Cloud Functions.

Auth roles are verified through custom claims and stored under /users/{uid}.role.
Parent dashboards rely on role-based routing guards.

📁 Directory Structure
src/
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks
├── layouts/           # Shared layouts (Sidebar, Header)
├── providers/         # AuthProvider, RoleProvider, etc.
├── routes/
│   ├── parent/        # Parent portal routes
│   ├── teacher/       # Teacher dashboard routes
│   ├── rm/            # Learning Partner dashboard routes
│   └── admin/         # Admin panel routes
├── services/          # Firestore & Firebase utilities
├── types/             # Shared TypeScript interfaces
└── firebase.ts        # Firebase config & initialization

🧱 Firestore Data Model (v1)

/users/{uid}
  role: "admin" | "rm" | "teacher" | "parent"
  displayName
  email
  settings.weeklyDigest?: boolean

/students/{sid}
  name
  parentIds: string[]
  assignedTeacherId
  assignedRmId
  summary: { phonicsMastery, grammarMastery, speakingMastery, lastUpdated, streakDays, weeklyMinutes }
  Subcollections:
    /attendance/{yyyymmdd} → { status, markedBy, markedAt }
    /curriculum/{topicId} → { title, status, teacherNote, updatedAt }
    /progress/{topicId} → { area, subskill, mastery, scoreBand, lastEvidence, teacherRemark, updatedBy, updatedAt }

/sessions/{sessionId}
  { studentId, teacherId, rmId, courseId, startAt, endAt, status, recordingUrl }

/payments/{paymentId}
  { parentId, studentId, amount, status, createdAt, description }

/teacherNotes/{noteId}
  { parentId, studentId, teacherId, sessionId, message, createdAt }

/tickets/{ticketId}
  { parentId, studentId?, type, message, status, createdAt }

🧩 Active Development Modules
🟣 Parent Portal (current sprint)

Goal: Replace all “Coming Soon” placeholders with functional pages.

Route	Purpose	Key Collections
/parent/dashboard	Home view showing next class, mastery, fees, and notes.	students, sessions, payments, teacherNotes
/parent/children	List all children linked to parent.	students
/parent/schedule	Upcoming and past classes.	sessions
/parent/child/:sid/progress	Detailed learning report by topic.	curriculum, progress
/parent/fees	View active package, payments, upload proof.	payments
/parent/messages	Read teacher notes, recordings, and support tickets.	teacherNotes, sessions, tickets

🟠 Teacher Portal (next)
Dashboard with daily schedule, YTD metrics, and library access.
Class outcome marking, curriculum updates, and earnings tracking.

🟢 Learning Partner / RM Dashboard
Teacher utilization, student count, session load.
Pending fees summary and follow-ups list.

🧠 Development Conventions
Component Rules
- Use functional components with TypeScript.
- Each page or component must have:
  - Loading + Empty state
  - Role validation (RoleGuard)
  - Firestore query hooks
  - Responsive layout (mobile → desktop)
Hooks
- Prefix shared hooks with use (e.g., useParentDashboard, useTeacherData).
- Always handle cleanup and onSnapshot unsubscribes where live data is needed.
Styling
- Use Tailwind CSS classes.
- Avoid inline styles or external CSS unless for global overrides.
- Consistent UI colors:
  - Primary: #6B4EFF (TinySteps purple)
  - Accent: #FF7A00
  - Background: #F9FAFB
TypeScript
- Use strict mode ("strict": true).
- Define interfaces in src/types/models.ts.
- Use as const for enums (e.g., role strings).
Data Fetching
- Prefer Firestore queries inside hooks (src/services/).
- Use getDocs for static views; onSnapshot for live updates.
- Always convert timestamps to milliseconds for React state.

🔒 Firestore Rules (Scaffold)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // USERS
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // only admin via functions
    }
    // STUDENTS
    match /students/{sid} {
      allow read: if request.auth != null &&
        (request.resource.data.parentIds.hasAny([request.auth.uid]) ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher','rm','admin']);
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher','rm','admin'];
      match /attendance/{id} {
        allow read: if resource.data != null;
        allow write: if request.auth != null && hasRole(['teacher','admin']);
      }
      match /curriculum/{topicId} {
        allow read: if resource.data != null;
        allow write: if request.auth != null && hasRole(['teacher','admin']);
      }
      match /progress/{topicId} {
        allow read: if resource.data != null;
        allow write: if request.auth != null && hasRole(['teacher','admin']);
      }
    }
    // PAYMENTS
    match /payments/{pid} {
      allow read: if request.auth != null &&
        (resource.data.parentId == request.auth.uid ||
         hasRole(['rm','admin']));
      allow write: if request.auth != null &&
        (hasRole(['rm','admin']) ||
         resource.data.parentId == request.auth.uid);
    }
    // SESSIONS
    match /sessions/{sid} {
      allow read: if request.auth != null && hasRole(['teacher','rm','admin','parent']);
      allow write: if request.auth != null && hasRole(['teacher','rm','admin']);
    }
    // TEACHER NOTES & TICKETS
    match /teacherNotes/{nid} {
      allow read: if request.auth != null &&
        (resource.data.parentId == request.auth.uid || hasRole(['teacher','rm','admin']));
      allow write: if request.auth != null && hasRole(['teacher','admin']);
    }
    match /tickets/{tid} {
      allow read: if request.auth != null &&
        (resource.data.parentId == request.auth.uid || hasRole(['rm','admin']));
      allow write: if request.auth != null &&
        (resource.data.parentId == request.auth.uid || hasRole(['rm','admin']));
    }
    function hasRole(roles) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in roles;
    }
  }
}

🧭 Workflow for AI Agents / Copilot
- Use existing route structure.
- Parent pages → src/routes/parent/
- Teacher pages → src/routes/teacher/
- RM pages → src/routes/rm/
- Check Firestore schema before querying.
- Always query using indexed fields (parentIds, teacherId, rmId).
- Convert Firestore timestamps via a helper (tsToMs()).
- Follow UI style from existing components.
- Use <Card>, <ProgressBar>, <StatusPill>, etc., when present.
- Keep spacing, shadows, and typography consistent.
- Every new page must include:
  - Header title + description
  - Loading state
  - Empty state
  - Responsive grid
  - Error fallback
Role Enforcement:
- Use RoleGuard to restrict routes.
- Redirect unauthorized users to /signin.
Firestore Writes:
- Wrap all writes in try/catch with toast notification.
- Log metadata: updatedBy, updatedAt.

🧪 Testing & QA
- Each dashboard page must have:
  - Mock data JSON for storybook/dev.
  - Snapshot tests for UI rendering.
  - ESLint + TypeScript pass.
- Run lint before commits:
  npm run lint
- Optional: Use Firebase Emulator for local Firestore testing.

🧭 Commit & PR Guidelines
- Write meaningful messages:
  feat(parent): implement schedule view
  fix(rules): allow parent read for student summary
- Every PR must:
  - Pass lint & build.
  - Include screenshots or screen recordings of UI.

🔮 Future Integrations
- Auto-generated parent progress PDF reports
- Class reschedule & feedback forms
- AI-based personalized suggestions for practice
- In-app notifications (Firestore triggers → Cloud Messaging)

Summary for AI Agents
- When extending this app:
  - Always respect role-based access and child-safety.
  - Use typed hooks and consistent Firestore structure.
  - Never use hardcoded user IDs or local mock data in production routes.
  - Keep the design friendly, readable, and data-driven.