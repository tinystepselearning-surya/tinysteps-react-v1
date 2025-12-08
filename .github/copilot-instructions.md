# Tiny Steps – Copilot Instructions for a Robust, SOLID App (v3.1)

These instructions tell GitHub Copilot how to help on the Tiny Steps Learning Platform:

- React + TypeScript + Vite  
- Tailwind + shadcn/ui  
- Firebase (Auth, Firestore, Functions)  
- Zustand + React Query  
- Role-based portals: Admin / Teacher / Parent / LP / Kid  

The goal: **a clean, testable, SOLID codebase – not quick hacks.**

---

## 1. Architecture & SOLID Principles (Tiny Steps Flavor)

When Copilot generates code, it should follow these adapted SOLID rules:

### S – Single Responsibility

Each file/component/module does **one clear job**.

Examples:

- A React component = one UI unit (page, card, modal).
- A hook = one concern (e.g., `useKidProgress`, `useAttendance`).
- A function = one business action (e.g., `updateStudentProgress`, `calculateNextSessionDate`).

**Anti-pattern:** huge “god components” mixing UI, Firestore calls, and complex logic.

### O – Open/Closed

Components & hooks should be **easy to extend** but not constantly modified.

Prefer:

- Config via props/options.  
- Utility functions that can be combined.

Avoid:

- `if (role === 'admin')` sprinkled everywhere – instead, compose specialized wrappers or role-specific components.

### L – Liskov Substitution

If we create abstractions/interfaces, subtypes should be safely swappable.

In practice:

- Shared types (`StudentSummary`, `ProgressRecord`) should be consistent across hooks and components.
- Don’t overload one type with role-specific fields that don’t belong.

### I – Interface Segregation

Prefer **small, focused types/hooks** over “mega interfaces”.

Examples:

- `KidProgressSummary`, `AttendanceRecord`, `CurriculumTopicStatus` instead of one giant `StudentEverything` type.
- Separate hooks: `useKidAttendance`, `useKidProgress`, `useKidCurriculum` instead of one `useKidEverything`.

### D – Dependency Inversion

High-level React components depend on **abstractions**, not on Firestore internals directly.

Prefer:

- Hooks like `useKidProgress(studentId)` that hide Firestore details.
- Utility functions in `utils/` or service-style modules.

Avoid:

- Firestore calls spread all over UI components.

---

## 2. Project Structure (What Copilot Must Respect)

```text
src/
  components/          # Reusable UI components (cards, modals, buttons, layout)
  pages/               # Page-level screens (route-level)
  portal/
    admin/
    teacher/
    parent/
    lp/
    kid/
  store/               # Zustand slices
  hooks/               # Reusable hooks: data + UI
  utils/               # Pure utilities (no React, no Firestore side effects ideally)
  styles/              # Tailwind config / themes
functions/
  src/                 # Cloud Functions (TS)
firestore.rules        # Firestore security
firestore.indexes.json

Copilot rules:

New reusable UI → src/components/

New role-specific page → src/portal/<role>/

New shared data hook → src/hooks/

New global state slice → src/store/

New general helper → src/utils/

3. React Component Design

Copilot should generate components that are:

Functional + typed:

type Props = { studentId: string };

const KidProgressCard: React.FC<Props> = ({ studentId }) => {
  // ...
};


Presentational vs container separated when complexity grows:

Container components use hooks and pass data down.

Pure presentational components stay dumb and reusable.

Small: If a file crosses ~200 lines, consider splitting.

UI Style

Use shadcn/ui for building blocks (cards, modals, buttons, tabs).

Use Tailwind with:

Rounded corners, soft shadows.

Pastel, kid-friendly palette.

Mobile-first responsiveness (w-full, flex-col, md:flex-row, etc.).

No custom CSS unless necessary; if needed, centralise via styles/.

4. State & Data – Robust Patterns
Zustand (Global State)

Use Zustand when:

The state is shared across multiple components/pages.

Example: current user, role, kid selection, global modals.

Typical pattern for Copilot:

// src/store/uiStore.ts
import { create } from 'zustand';

type UiState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));

React Query / Firestore Hooks

Use hooks for data access:

// src/hooks/useKidProgress.ts
import { useQuery } from '@tanstack/react-query';
import { getKidProgress } from '../utils/progressApi';

export function useKidProgress(studentId: string) {
  return useQuery({
    queryKey: ['kid-progress', studentId],
    queryFn: () => getKidProgress(studentId),
  });
}


And keep Firestore details hidden in utils/progressApi.ts or similar.

5. Firestore & Cloud Functions – Safety First
Data Access Code

All Firestore calls in:

utils/ (for simple direct reads/writes) or

Dedicated hooks/ + functions/src/ (for backend logic).

Use typed converters or typed mapping so we avoid any.

Security Rules

Copilot may draft, you must review:

Principle of least privilege:

Parents: read-only for their child + related records.

Teachers: write attendance, progress, reports for assigned kids.

LP/Admin: broader read; admin broader write.

Never accept a rule that uses:

allow read, write: if true;

6. Error Handling, Logging & Robustness

Copilot should:

Wrap async operations in try/catch where failure is possible.

Surface user-friendly messages:

“Something went wrong. Please try again.”

Log technical details to:

Console (dev)

Future: log service / Cloud Function

Example pattern:

try {
  await updateStudentProgress(...);
} catch (error) {
  console.error('Failed to update progress', error);
  // Show toast / UI error message
}

7. Testing & Manual Verification

When Copilot adds non-trivial logic:

Prefer small pure functions → easy to test.

Keep side effects at the edges (hooks/components).

Always manually verify:

Different roles (admin/teacher/parent/kid) when relevant.

Mobile and desktop breakpoints.

Critical flows: login, attendance, progress updates.

8. How to Use Copilot in This Repo
Good Use-Cases

Ask Copilot for:

Component skeletons:

// Card to show today's sessions with Tailwind and shadcn/ui


Hooks:

// Hook to fetch kid progress data from Firestore using React Query


Utility functions:

// Given sessions and today, return the next upcoming session


Repetitive JSON/picklists:

// More topic entries following this pattern for phonics topics

Things Copilot Must NOT Decide Alone

Firestore collection design or renames.

Security rules and auth logic (you must validate).

Payment/subscription flows.

Anything that changes cross-role behavior (admin vs parent vs kid).

9. Example Copilot Prompts (Copy into Comments)

UI Component

// Create a responsive shadcn Card showing a student's name, course tags, and progress percentage, using Tailwind classes consistent with the project style.


Data Hook

// React Query hook that reads the student's progress documents from Firestore and returns a summary object for the dashboard.


Zustand Store

// Zustand store slice for managing which kid is currently selected in the parent dashboard.


Firestore Rule Draft

// Firestore rule: parents can read only their own child's student document and progress, teachers can write progress only for students they are assigned to.

10. Final Rule for Copilot

Copilot is here to speed up small, well-defined steps.
It must never change the architecture, security, or data model on its own.
## 11. Ask TinySteps – Groq API Chatbot (“Ask TinySteps”)

These instructions tell Copilot how to build and extend the **Ask TinySteps** chatbot powered by the **Groq API**, without breaking security, performance, or app structure.

Goal:  
A small, safe, parent-facing chatbot on the Tiny Steps site that answers questions about **Tiny Steps only** (courses, pricing, schedules, features) using Groq via a **Firebase Cloud Function**. Frontend must **never** call Groq directly.

---

### 11.1 High-Level Architecture

- **Frontend**
  - React component for the chatbot UI (e.g. `AskTinyStepsWidget`).
  - Lives in `src/components/` (or `src/components/Home/` if home-page-only).
  - Uses a **custom hook** to call a **Firebase callable function**.
  - Maintains local chat state (messages, loading, error) only.

- **Backend**
  - Firebase Cloud Function (TypeScript) for Groq calls, e.g. `groqAskTinySteps`.
  - Located in `functions/src/` (e.g. `functions/src/groqAskTinySteps.ts` or added to an existing `groq.ts` module).
  - Reads `GROQ_API_KEY` from Firebase Functions config/secrets (never hard-coded).
  - Implements input validation, rate limiting (basic), and safe error handling.

- **Data**
  - Optional logging to Firestore (e.g. `aiLogs/askTinySteps/`) with **minimal PII**.
  - Logs: timestamp, role (parent/guest), question, truncated answer, status; avoid storing raw emails/phone numbers.

---

### 11.2 Frontend – Component & Hook Design

**Files (suggested):**

- `src/components/AskTinySteps/AskTinyStepsWidget.tsx`  
- `src/components/AskTinySteps/AskTinyStepsBubble.tsx` (optional, if using floating bubble)  
- `src/hooks/useAskTinySteps.ts` (for calling the Cloud Function)

**Component rules for Copilot:**

- Build a **small chat panel** UI:
  - Title like: “Ask Tiny Steps 🤖”.
  - Message list area (user vs bot messages styled differently).
  - Input box + “Ask” button.
  - Loading indicator while waiting for response.
  - Error message area for failures (“I couldn’t answer that. Please try again.”).
- Use **shadcn/ui + Tailwind**:
  - `Card`, `Button`, `Input`, `ScrollArea`, etc.
  - Tailwind for layout: `flex`, `gap-2`, `border`, `rounded-lg`, `shadow`, etc.
- Mobile-first:
  - If used on home hero: simple embedded card.
  - If used as floating bubble: bottom-right, full-width or large panel on small screens.

**Hook (`useAskTinySteps`) – Copilot pattern:**

- Use either:
  - `httpsCallable` from the Firebase client SDK, or
  - A thin `fetch('/api/ask-tinysteps')` wrapper (if an HTTP function is used).
- Encapsulate:
  - `ask(question: string, metadata?: {...})`
  - State: `isLoading`, `error`, maybe `lastAnswer`.
- The widget calls `ask()` and appends to local messages.

Example intention comment for Copilot:

```ts
// Hook to call the groqAskTinySteps callable function and return a promise-based ask() API with loading and error state.
11.3 Backend – Cloud Function Structure

File (example): functions/src/groqAskTinySteps.ts

Copilot should generate:

A callable or HTTP function, e.g.:

// Firebase callable function: groqAskTinySteps
// Validates input, calls Groq API with Tiny Steps system prompt, returns a short answer string.


Steps inside the function:

Validate data.message (string, length within limit, e.g. 1–500 chars).

Optional: read user role / uid from context.auth.

Build a system prompt restricting the domain:

Answer only about: Tiny Steps courses, schedules, pricing, platform features, how classes work, policies, etc.

Decline or gently redirect if asked medical, legal, financial, or unrelated personal questions.

Style: friendly, concise, parent-facing, clear, no jargon.

Call Groq using GROQ_API_KEY from environment; keep timeout reasonable.

Truncate or limit token count; avoid huge responses.

Return { answer, usageMeta }.

On error: log to Functions logs and return a safe, generic error message.

Security & Config rules for Copilot:

Never commit the API key:

Use functions.config() or secret manager:

e.g. functions.config().groq.api_key or similar.

Input validation:

Reject empty messages.

Limit maximum length and strip obvious dangerous content.

Output safety:

If Groq fails or returns nonsense, return a friendly fallback string.

Logging:

If logging to Firestore, store:

uid (if authenticated),

role (if known),

question (possibly truncated),

createdAt,

success flag,

but no passwords, access tokens, or payment data.

11.4 System Prompt Guidance for Groq (Tiny Steps Tone)

Copilot should embed a short, strict system prompt, for example:

Identity:

“You are Ask TinySteps, a helpful assistant for the Tiny Steps Learning online English school.”

Scope:

Answer only about Tiny Steps: courses (Phonics, Grammar, Public Speaking), age groups, class format, timings, pricing ranges, platform features, and how parents can use the app.

If the user asks unrelated questions (medical, legal, personal advice), respond with a gentle refusal and suggest they talk to an appropriate professional.

Style:

Warm, encouraging, parent-friendly, short paragraphs or bullets.

Avoid technical jargon and internal implementation details.

Safety:

No promises about guaranteed results.

No collection of sensitive personal data; if the user shares it, do not repeat it.

Copilot should keep the prompt in a constant/on the server, not in the client.

11.5 Integration with Existing Groq Usage

If there is already a Groq helper (e.g. for groqKidIdea):

Reuse the existing Groq client and HTTP utilities.

Do not duplicate API client configuration.

Keep all Groq-related helpers in a shared module (e.g. functions/src/groqClient.ts) and import it.

Intention comment for Copilot:

// Reuse the existing Groq client helper instead of creating a new one; only add AskTinySteps-specific prompt and function.

11.6 Example Copilot Prompts (for this feature)

Frontend widget:

// React component: AskTinyStepsWidget - a small chat panel that lets a parent type a question, shows a list of messages, and calls the useAskTinySteps hook. Use shadcn Card, Input, Button and Tailwind for a kid-friendly design.


Hook:

// Hook: useAskTinySteps - wraps the Firebase callable function groqAskTinySteps, exposes ask(message: string) and loading/error state.


Cloud Function:

// Firebase callable function groqAskTinySteps: validate input, build a Tiny Steps system prompt, call Groq using GROQ_API_KEY from config, return a short safe answer for parents.


Logging:

// Helper to log AskTinySteps usage to Firestore under aiLogs/askTinySteps with minimal PII (uid, role, question snippet, success flag, timestamp).

11.7 Final Rule for Ask TinySteps

The Ask TinySteps chatbot is supporting marketing and parent queries, not a general-purpose AI.
Copilot must always:

Keep all Groq calls on the backend,

Protect keys and personal data,

And stay within the Tiny Steps topic/domain.