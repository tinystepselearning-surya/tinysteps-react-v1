# Tiny Steps – Copilot Instructions for a Robust, SOLID App (v3.1)

> Purpose: These instructions guide GitHub Copilot to generate maintainable, testable code for the Tiny Steps Learning Platform.
> North Star: **Clean architecture + SOLID**, not quick hacks.

## Stack
- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Firebase (Auth, Firestore, Functions)
- Zustand + React Query
- Role-based portals: Admin / Teacher / Parent / LP / Kid

---

## 1) Architecture & SOLID Principles (Tiny Steps Flavor)

### S — Single Responsibility
Each file/module does **one clear job**.
- Component = one UI unit (page/card/modal)
- Hook = one concern (`useKidProgress`, `useAttendance`)
- Function = one business action (`updateStudentProgress`, `calculateNextSessionDate`)

Avoid: “god components” mixing UI + Firestore + business logic.

### O — Open/Closed
Prefer patterns that are **easy to extend** without rewriting:
- Configure via props/options
- Compose small utilities

Avoid:
- `if (role === 'admin')` sprinkled across UI; instead use role-specific components/routes or wrappers.

### L — Liskov Substitution
Shared abstractions/types must be safely swappable:
- Keep shared types consistent across hooks/components
- Don’t overload global types with role-specific fields

### I — Interface Segregation
Prefer small focused types/hooks over mega-interfaces:
- `KidProgressSummary`, `AttendanceRecord`, `CurriculumTopicStatus`
Avoid:
- `StudentEverything` and `useKidEverything`

### D — Dependency Inversion
UI depends on **abstractions**, not Firestore internals:
- Use hooks/services that hide Firestore details
- Keep Firestore calls out of UI components

---

## 2) Project Structure (Copilot Must Respect)

```text
src/
  components/          # Reusable UI (cards, modals, buttons, layout)
  pages/               # Route-level screens
  portal/
    admin/
    teacher/
    parent/
    lp/
    kid/
  store/               # Zustand slices
  hooks/               # Reusable hooks (data + UI state helpers)
  utils/               # Pure utilities / thin service modules
  styles/              # Tailwind config / themes
functions/
  src/                 # Cloud Functions (TS)
firestore.rules
firestore.indexes.json
```

Placement rules

New reusable UI → src/components/

New role-specific page → src/portal/<role>/

New shared data hook → src/hooks/

New global state slice → src/store/

New general helper/service → src/utils/

## 3) React Component Design

### Typed functional components

```ts
type Props = { studentId: string };

export const KidProgressCard: React.FC<Props> = ({ studentId }) => {
  return null;
};
```

### Container vs Presentational
Container: uses hooks, handles loading/error, prepares props

Presentational: dumb, reusable, UI-only

### File size discipline
If a file crosses ~200 lines or mixes concerns, split it.

## 4) UI Style Rules
Use shadcn/ui primitives: Card, Button, Input, Tabs, Dialog, ScrollArea, etc.

Use Tailwind for layout and polish:

- rounded corners, soft shadows
- kid-friendly pastel palette
- mobile-first (`w-full`, `flex-col`, `md:flex-row`, etc.)

Avoid custom CSS unless necessary; if needed, centralize in styles/.

## 5) State & Data — Robust Patterns

### 5.1 Zustand (Global State)
Use Zustand when state is shared across multiple areas:

- current user + role
- selected kid
- global UI toggles/modals

Example:

```ts
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
```

### 5.2 React Query + Firestore (via hooks + service layer)
Rules:

- Hooks orchestrate queries/mutations
- Firestore details live in a thin service module in `src/utils/*Api.ts`
- Avoid `any`; use typed mapping/converters where possible

Example:

```ts
// src/hooks/useKidProgress.ts
import { useQuery } from '@tanstack/react-query';
import { getKidProgress } from '../utils/progressApi';

export function useKidProgress(studentId: string) {
  return useQuery({
    queryKey: ['kid-progress', studentId],
    queryFn: () => getKidProgress(studentId),
    enabled: !!studentId,
  });
}
```

## 6) Firestore & Cloud Functions — Safety First

### 6.1 Data access code
All Firestore calls must be in:

- `src/utils/` (simple reads/writes, thin wrappers)
- `src/hooks/` (React Query wrappers)
- `functions/src/` (privileged logic, external API calls, admin ops)

Avoid Firestore calls inside UI components.

### 6.2 Security rules (non-negotiable)
Copilot may draft rules, but you must review.

Principle of least privilege:

- Parents: read-only for their child + related records
- Teachers: write attendance/progress only for assigned kids
- LP/Admin: broader read; Admin broader write

Never accept:

```txt
allow read, write: if true;
```

## 7) Error Handling, Logging & Robustness
Wrap async operations in try/catch where failure is possible.

Show user-friendly messages:

“Something went wrong. Please try again.”

Log technical details:

- `console.error(...)` in dev
- Functions logs on backend

Example:

```ts
try {
  await updateStudentProgress(...);
} catch (error) {
  console.error('Failed to update progress', error);
  // show toast / inline error
}
```

## 8) Testing & Manual Verification
When adding non-trivial logic:

- Prefer small pure functions → easy to test
- Keep side effects at the edges (hooks/services/functions)

Always manually verify:

- Role behavior (admin/teacher/parent/kid/LP)
- Mobile + desktop breakpoints
- Critical flows (auth, attendance, progress updates, payments if touched)

## 9) How to Use Copilot in This Repo

### Good use-cases
Ask Copilot for:

- Component skeletons (shadcn + Tailwind)
- React Query hooks
- Pure utility functions
- Repetitive JSON/picklists

### Copilot must NOT decide alone
Copilot must not change without explicit instruction:

- Firestore collection design/renames/migrations
- Security rules and auth logic (draft only; you validate)
- Payment/subscription flows
- Anything that changes cross-role behavior or permissions

## 10) Example Copilot Prompts (Paste Into Comments)

### UI component

```ts
// Create a responsive shadcn Card showing a student's name, course tags, and progress percentage.
// Use Tailwind consistent with Tiny Steps styling.
```

### Data hook

```ts
// React Query hook to read a student's progress documents from Firestore and return a summary object.
// Hide Firestore details in src/utils/progressApi.ts and keep types strict.
```

### Zustand store

```ts
// Zustand slice to manage the currently selected kid in the parent dashboard.
// Include setSelectedKid(id) and clearSelectedKid().
```

### Firestore rule draft

```txt
// Firestore rules draft:
// - parents can read only their own child's student + progress docs
// - teachers can write progress only for assigned students
// - deny all by default
```

## 11) Final Rule
Copilot should speed up small, well-defined steps.
It must never change architecture, security, roles/permissions, or data model on its own.
