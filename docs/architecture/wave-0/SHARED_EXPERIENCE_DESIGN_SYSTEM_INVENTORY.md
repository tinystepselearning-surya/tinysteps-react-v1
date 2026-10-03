# Wave 0 — Shared Experience / Design-System Inventory

**Status:** COMPLETE — STATIC REPOSITORY INVENTORY VERIFIED  
**Wave:** 0 — Architecture Contracts  
**Runtime changes:** None  
**UI rewrite:** Not part of this work package  
**Audit run:** GitHub Actions run 37136234372 — success

## 1. Purpose

This work package identifies the reusable UI foundation already present in Tiny Steps, the portal-specific shell duplication that should converge later, and the design-system rules future School OS migrations must follow.

The objective is **not** to redesign the product now.

The objective is to freeze the target ownership model for authenticated application shells, public shell, desktop/mobile navigation, portal headers, page frames, UI primitives, loading/empty/error/access states, status treatments, responsive/native safe-area behaviour, accessibility defaults and design tokens.

> **Share structure and behaviour. Keep domain content and role-specific workflows separate.**

## 2. Inventory scope

A repository-wide static audit inspected:

~~~text
1,558 source/style files
580 TSX/JSX component files
~~~

Portal roots inventoried:

~~~text
Admin / Founder
Teacher
Parent
Learning Partner
School Admin
~~~

The audit also inspected common/UI components, public Header/Footer/Layout paths, Tailwind configuration, global CSS variables, feature visual tokens, portal navigation/header/sidebar implementations, loading/error/empty/skeleton patterns and accessibility signals.

The generated report is written locally to ignored reports/shared-experience-inventory.json.

## 3. Shared foundations already worth preserving

### 3.1 UI primitives

The repository already has a usable shadcn-style primitive layer under src/components/ui.

Observed file-level adoption:

| Primitive | Files using it |
|---|---:|
| Button | 138 |
| Card | 129 |
| Input | 74 |
| Select | 57 |
| Badge | 55 |
| Dialog | 43 |
| Textarea | 24 |
| Table | 21 |
| Tabs | 15 |
| Form | 14 |
| Alert | 5 |
| Spinner | 1 |

**Decision:** this primitive layer is an asset. Do not replace it with a second component library during School OS migration.

New shared School OS components should compose these primitives rather than duplicate their low-level interaction behaviour.

### 3.2 Mobile navigation

MobileTabBar is already used by **4 of the 5 authenticated portal shells**:

- Admin / Founder;
- Teacher;
- Parent;
- Learning Partner.

School Admin is the only audited portal without it.

**Decision:** MobileTabBar is the canonical mobile bottom-navigation primitive.

Portal-specific tab lists remain configuration, not separate navigation components.

### 3.3 Brand primitive

TinyStepsBrand appears in **14 component files** and already supports controlled subtitle/logo/title variants.

**Decision:** preserve it as the authenticated/public brand primitive rather than recreating role-specific logos/wordmarks.

### 3.4 Shared header foundation

AppShellHeader is currently used by Parent and Learning Partner.

Admin, Teacher and School remain bespoke.

**Decision:** keep AppShellHeader as the semantic header foundation, but evolve it through controlled variants/slots rather than forcing all portals into the current exact visual form.

Required future variants may include standard, compact, operations, native/mobile and institutional.

### 3.5 Cross-portal feature components

Existing shared examples include HolidayCalendar2026, MessagesPanel, TinyStepsBrand, MobileTabBar and the common Dialog/Button/Card/Tabs primitives.

These are evidence that cross-role reuse is practical without merging domain workflows.

## 4. Portal shell inventory

### 4.1 Admin / Founder

Current shell characteristics:

- one AdminDashboard supports Admin and Founder variants;
- shared Admin Header and Sidebar;
- desktop sidebar;
- mobile drawer;
- shared MobileTabBar;
- URL/tab-driven workspace;
- sticky top header;
- dark sidebar visual treatment.

**Classification: PRESERVE + CONVERGE.**

The Admin/Founder portal-prop/variant approach is a good precedent. Do not split Founder into another copied shell.

Long term, move structural behaviour into the shared authenticated shell while retaining an operations visual/navigation variant.

### 4.2 Teacher

Current shell characteristics:

- dedicated TeacherSidebar;
- mobile drawer;
- shared MobileTabBar;
- tab workspace;
- Tiny Steps brand;
- teacher-specific sidebar visual treatment;
- safe lazy-loading of heavy tab views.

The static inventory found src/pages/teacher/components/layout/TeacherHeader.tsx with no inbound source reference.

There is also src/components/teacher/TeacherHeader.tsx, which is referenced only through the unused layout TeacherHeader path in the static source graph.

**Classification: CONVERGE + RETIRE LATER CANDIDATE.**

Keep teacher-specific content/navigation configuration, but use the shared shell substrate.

Do not remove either header file until a focused import/runtime check confirms no lazy/dynamic consumer relies on it.

### 4.3 Parent

Parent is the most mature mobile/native shell and contains important platform patterns:

- shared MobileTabBar;
- native safe-area variables;
- keyboard-aware layout;
- mobile sticky header;
- mobile drawer;
- profile/payment modal;
- responsive desktop/mobile behaviour;
- reduced-motion handling;
- parent semantic visual tokens.

The static inventory found src/pages/parent/components/layout/ParentSidebar.tsx with no inbound source reference.

**Classification: PRESERVE MOBILE/NATIVE BEHAVIOUR + CONVERGE SHELL + RETIRE LEGACY SIDEBAR LATER.**

Parent native/safe-area behaviour should become shared shell capability where other native-capable portals need it. It should not be copy-pasted.

### 4.4 Learning Partner

Current shell uses AppShellHeader, dedicated LPSidebar, Tabs and shared MobileTabBar.

The inventory also found duplicate workspace concepts after the main tab content: My Assigned Teachers and My Assigned Parents are rendered again below the tab workspace.

**Classification: CONVERGE.**

Keep the domain views. Remove duplicated post-tab portal content in a later runtime/UI cleanup brick after behaviour is verified.

Learning Partner should be one of the easiest portals to move onto the shared authenticated shell because it already uses AppShellHeader and MobileTabBar.

### 4.5 School Admin

The School portal currently uses a bespoke page-level shell:

- direct Tiny Steps brand;
- direct school selector;
- direct Logout button;
- page-local loading/error/access cards;
- no shared AppShellHeader;
- no shared MobileTabBar;
- no dedicated shared authenticated navigation substrate.

**Classification: CONVERGE.**

Do not rewrite School programme/business panels.

Wrap them later in the common authenticated shell with an institutional variant. The school/campus switcher belongs in a shell action/selector slot, not in a separate design system.

## 5. Public shell

The routed public application already uses src/components/common/Header.tsx and src/components/common/Footer.tsx.

This is the canonical public shell direction.

A separate legacy src/components/Layout.tsx still exists and has source references, including route/legacy/seasonal paths.

**Decision:** common Header/Footer remain canonical.

The legacy Layout is not approved as a second public design-system authority, but it is not safe to delete yet. Migrate its remaining consumers first, verify route behaviour, then retire it.

## 6. Navigation architecture decision

Today each authenticated portal owns its own navigation list and, except School, most own a separate desktop sidebar implementation.

Target:

~~~text
AuthenticatedAppShell
  ├─ ShellHeader
  ├─ DesktopSideNav
  ├─ MobileDrawer
  ├─ MobileTabBar
  └─ WorkspaceViewport
~~~

Portal code supplies role/portal variant, navigation items, active item, badges/counts, header title/subtitle, actions, optional selector and optional secondary navigation.

The shell owns breakpoint behaviour, scroll containment, safe areas, desktop/mobile transition, focus management, drawer semantics, bottom-tab reserve and consistent workspace width/padding.

**Do not centralize domain permissions into the visual shell.** Authorization remains domain/application logic.

## 7. Page-template decision

Authenticated feature pages should converge toward four composition patterns.

### Workspace

For dashboard/tab-driven operational surfaces:

~~~text
WorkspacePage
  header
  optional filters/actions
  content region
  loading/error/empty contract
~~~

### List

For Users, Enrollments, Teachers, Parents, Leads, Payments, etc.:

~~~text
ListPage
  PageHeader
  FilterBar
  ResultSummary
  DataTable / responsive cards
  Pagination / cursor controls
  EmptyState
~~~

### Detail

For learner/enrollment/course/payment/entity detail:

~~~text
DetailPage
  PageHeader
  status
  primary facts
  section navigation
  action slots
  audit/history sections where relevant
~~~

### Form / task flow

For create/edit/approval/correction workflows:

~~~text
FormPage
  title/context
  sections
  validation summary
  sticky/consistent action area when appropriate
~~~

These are structural templates, not new business domains.

## 8. Loading, error, empty and access states

State handling is widespread but inconsistent.

Static inventory found:

~~~text
129 files with loading patterns
136 files with error patterns
132 files with empty-state-like patterns
15 files with Skeleton / animate-pulse patterns
~~~

The low Spinner primitive adoption compared with the number of loading implementations confirms there is no single state-presentation contract today.

**Decision:** introduce semantic shared states later: LoadingState, EmptyState, ErrorState, AccessState and InlineState.

Each should support a title, concise description, optional action/retry, compact/full-page modes, screen-reader semantics and minimal layout shift where practical.

Domain-specific wording remains with the feature.

## 9. Status treatment

Status badges/pills are currently implemented across many pages with local colour mappings.

**Decision:** create a semantic StatusBadge/StatusPill contract later.

The shared component should accept semantic tone, label, optional icon and size. Domain adapters translate business statuses into semantic tones.

The design system must **not** impose one global business lifecycle vocabulary.

## 10. Direct HTML controls vs shared primitives

The inventory found direct native-control usage across:

~~~text
164 files containing <button>
34 files containing <select>
54 files containing <input>
34 files containing <table>
~~~

This does not mean every direct HTML control is wrong. Native elements are sometimes appropriate for accessibility, performance or specialized interactions.

Future product UI should default to the shared primitive layer unless there is a documented reason not to.

The target is behavioural consistency, not mechanical replacement.

## 11. Design-token ownership

Current token sources include:

~~~text
tailwind.config.cjs                     177 lines
src/index.css                         1,938 lines
src/styles/designTokens.js               54 lines
src/pages/parent/parentVisualTokens.ts   40 lines
~~~

This is multiple overlapping token authority.

### Canonical direction

Use Tailwind theme plus semantic CSS variables as the canonical product token layer.

Feature tokens such as parentVisualTokens may remain as semantic aliases, but should resolve to shared primitives/tokens rather than independently owning colour, spacing or motion systems.

src/styles/designTokens.js currently has narrow usage and is a **RETIRE LATER / CONVERGE** candidate after remaining consumers move to canonical tokens.

src/index.css already owns valuable cross-platform behaviour including safe-area variables, keyboard-height variable, mobile-tabbar reserve, native scroll/focus behaviour and reduced-motion rules.

Long term, separate foundation variables, authenticated-shell/native layout, feature-specific styles, lesson-viewer/game effects and public marketing effects instead of letting one global stylesheet remain the home for unrelated product systems indefinitely.

## 12. Accessibility and responsive foundations

Static evidence already exists across the repository:

~~~text
133 component files with aria-label
16 with aria-current
21 with sr-only
15 source/style files with prefers-reduced-motion
~~~

This is a useful foundation, but accessibility behaviour is distributed.

Shared shell/components must own defaults for visible keyboard focus, semantic navigation landmarks, current-page state, dialog/drawer focus handling, minimum touch targets, reduced motion, safe-area padding, screen-reader loading/error messaging, colour contrast and responsive overflow.

Target remains **WCAG 2.2 AA** for applicable user-facing surfaces.

## 13. Canonical Shared Experience model

~~~text
Shared Experience System
│
├── Foundations
│   ├── Tailwind + semantic CSS tokens
│   ├── typography
│   ├── spacing/radius/elevation
│   ├── motion/reduced-motion
│   └── responsive/native safe-area rules
│
├── UI primitives
│   ├── Button
│   ├── Card
│   ├── Input / Select / Textarea
│   ├── Dialog
│   ├── Table
│   ├── Tabs
│   └── Badge
│
├── Shared product components
│   ├── TinyStepsBrand
│   ├── AppShellHeader
│   ├── MobileTabBar
│   ├── StatusBadge
│   └── Loading / Empty / Error / Access states
│
├── Shell
│   ├── AuthenticatedAppShell
│   ├── DesktopSideNav
│   ├── MobileDrawer
│   └── WorkspaceViewport
│
└── Page templates
    ├── WorkspacePage
    ├── ListPage
    ├── DetailPage
    └── FormPage
~~~

Portal/domain code stays responsible for navigation content, business data, permissions, domain lifecycle, actions and role-specific workflow.

## 14. Migration classifications

| Current construct | Classification | Decision |
|---|---|---|
| src/components/ui/* | **PRESERVE** | canonical primitive foundation |
| MobileTabBar | **PRESERVE** | canonical mobile navigation primitive |
| TinyStepsBrand | **PRESERVE** | canonical brand primitive |
| AppShellHeader | **PRESERVE + EXTEND** | controlled shell-header variants |
| Admin/Founder shared dashboard variant | **PRESERVE** | good controlled-variant precedent |
| Admin Sidebar | **CONVERGE** | move to shared DesktopSideNav substrate |
| Teacher Sidebar | **CONVERGE** | same substrate, teacher config |
| LP Sidebar | **CONVERGE** | same substrate, LP config |
| Parent current custom/native shell | **PRESERVE BEHAVIOUR + CONVERGE STRUCTURE** | make safe-area/native behaviour reusable |
| School bespoke shell | **CONVERGE** | institutional AuthenticatedAppShell variant |
| Parent legacy Sidebar | **RETIRE LATER CANDIDATE** | no inbound static source reference |
| Teacher layout Header | **RETIRE LATER CANDIDATE** | no inbound static source reference |
| public common Header/Footer | **PRESERVE** | canonical public shell |
| legacy src/components/Layout.tsx | **CONVERGE / RETIRE LATER** | still referenced; migrate consumers first |
| Tailwind + semantic CSS vars | **PRESERVE / CANONICALIZE** | canonical token foundation |
| JS designTokens.js | **CONVERGE / RETIRE LATER** | move remaining usage |
| parent semantic tokens | **PRESERVE AS ALIASES** | feature semantics, not independent design authority |
| page-local loading/error/empty UI | **CONVERGE** | shared semantic state components |
| page-local status colours | **CONVERGE** | semantic StatusBadge contract |
| LP duplicated post-tab content | **RETIRE LATER** | remove after behaviour verification |

## 15. Implementation sequencing

Do **not** rewrite all portals at once.

Recommended later implementation order:

~~~text
1. Define canonical tokens + shell contracts
2. Build AuthenticatedAppShell without changing business content
3. Move Learning Partner first
4. Move School portal
5. Move Teacher
6. Move Admin/Founder
7. Move Parent last, preserving native/mobile behaviour exactly
8. Consolidate page templates/states/status patterns incrementally
9. Retire old shell files only after import/runtime verification
~~~

Parent is intentionally last because it has the most specialized native/mobile/safe-area behaviour.

## 16. Audit-tool retirement decision

The repository audit is migration scaffolding.

| Asset | Status | Retirement rule |
|---|---|---|
| scripts/audit-shared-experience.mjs | KEEP through shell/design-system consolidation | retire after convergence, or narrow to permanent design-system governance checks |
| scripts/test/shared-experience-inventory.node-test.mjs | KEEP while audit exists | retire with audit unless converted to permanent structural invariants |
| inventory document | PERMANENT | architecture/governance record |
| GitHub audit workflow | RETIRED | one-off workflow already removed |

No scheduled GitHub workflow should be created for this inventory.

## 17. Exit gate

This work package is complete because:

- current portal shells are inventoried;
- reusable primitives/assets are identified;
- public vs authenticated shell ownership is separated;
- desktop/mobile navigation convergence is defined;
- legacy shell candidates are registered but not destructively removed;
- token ownership is defined;
- page templates and semantic state/status contracts are defined;
- accessibility/native behaviour is part of the shared-system contract;
- implementation order avoids a risky big-bang UI rewrite;
- no runtime UI change is required to complete Wave 0.

Next: **Wave 0 Work Package 6 — Migration Standard & Wave 0 Exit Review**.
