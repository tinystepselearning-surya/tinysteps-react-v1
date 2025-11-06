# Routes Scaffold for Tiny Steps v1.0

## Complete Route Structure

```typescript
// app/src/Routes.tsx - Main routing configuration

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ParentLayout from './layouts/ParentLayout';
import KidsLayout from './layouts/KidsLayout';
import TeacherLayout from './layouts/TeacherLayout';
import RMLayout from './layouts/RMLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Onboarding from './pages/auth/Onboarding';

// Parent Pages
import ParentDashboard from './pages/parent/Dashboard';
import ChildProgress from './pages/parent/ChildProgress';
import ChildAttendance from './pages/parent/ChildAttendance';
import ChildWork from './pages/parent/ChildWork';
import Fees from './pages/parent/Fees';
import Messages from './pages/parent/Messages';

// Kids Pages
import KidsZone from './pages/kids/Zone';
import KidsGames from './pages/kids/Games';
import KidsWorksheets from './pages/kids/Worksheets';
import JoinClass from './pages/kids/JoinClass';
import RewardsZone from './pages/kids/RewardsZone';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherCalendar from './pages/teacher/Calendar';
import SessionForm from './pages/teacher/SessionForm';
import StudentProfile from './pages/teacher/StudentProfile';
import TeacherWorksheets from './pages/teacher/Worksheets';
import Resources from './pages/teacher/Resources';
import Earnings from './pages/teacher/Earnings';

// RM Pages
import RMDashboard from './pages/rm/Dashboard';
import TeacherUtilization from './pages/rm/TeacherUtilization';
import StudentCohort from './pages/rm/StudentCohort';
import FeesManagement from './pages/rm/FeesManagement';
import RMReports from './pages/rm/Reports';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CoursesCMS from './pages/admin/CoursesCMS';
import GlobalCalendar from './pages/admin/GlobalCalendar';
import PlansManagement from './pages/admin/PlansManagement';
import PaymentsAdmin from './pages/admin/PaymentsAdmin';
import Compliance from './pages/admin/Compliance';
import Analytics from './pages/admin/Analytics';

// Protected Route HOC
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

// Main Routes Component
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Parent Routes */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ParentDashboard />} />
        <Route path="child/:studentId/progress" element={<ChildProgress />} />
        <Route path="child/:studentId/attendance" element={<ChildAttendance />} />
        <Route path="child/:studentId/work" element={<ChildWork />} />
        <Route path="fees" element={<Fees />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      {/* Kids Routes */}
      <Route path="/kids" element={
        <ProtectedRoute allowedRoles={['student']}>
          <KidsLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/kids/zone" />} />
        <Route path="zone" element={<KidsZone />} />
        <Route path="games" element={<KidsGames />} />
        <Route path="games/:gameId" element={<GamePlayer />} />
        <Route path="worksheets" element={<KidsWorksheets />} />
        <Route path="worksheets/:worksheetId" element={<WorksheetPlayer />} />
        <Route path="join" element={<JoinClass />} />
        <Route path="rewards" element={<RewardsZone />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/teacher/dashboard" />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="calendar" element={<TeacherCalendar />} />
        <Route path="session/:sessionId" element={<SessionForm />} />
        <Route path="student/:studentId" element={<StudentProfile />} />
        <Route path="worksheets" element={<TeacherWorksheets />} />
        <Route path="resources" element={<Resources />} />
        <Route path="earnings" element={<Earnings />} />
      </Route>

      {/* RM Routes */}
      <Route path="/rm" element={
        <ProtectedRoute allowedRoles={['learning-partner']}>
          <RMLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/rm/dashboard" />} />
        <Route path="dashboard" element={<RMDashboard />} />
        <Route path="teachers" element={<TeacherUtilization />} />
        <Route path="students" element={<StudentCohort />} />
        <Route path="fees" element={<FeesManagement />} />
        <Route path="reports" element={<RMReports />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses" element={<CoursesCMS />} />
        <Route path="calendar" element={<GlobalCalendar />} />
        <Route path="plans" element={<PlansManagement />} />
        <Route path="payments" element={<PaymentsAdmin />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

## Folder Structure

```
app/src/
├── Routes.tsx                   # Main routing configuration (above)
├── firebase.ts                  # Firebase initialization
├── main.tsx                     # App entry point
├── App.tsx                      # Root component
├── index.css                    # Global styles
│
├── assets/                      # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/                  # Shared components
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── Tooltip.tsx
│   ├── forms/
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── DatePicker.tsx
│   │   └── FileUpload.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── QuickActions.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ProtectedRoute.tsx
│       └── RoleGuard.tsx
│
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication state
│   ├── useUser.ts              # User profile data
│   ├── useStudent.ts           # Student-specific data
│   ├── useSession.ts           # Session management
│   ├── useAttendance.ts        # Attendance tracking
│   ├── useProgress.ts          # Progress tracking
│   ├── useWorksheets.ts        # Worksheet management
│   ├── useGames.ts             # Games data
│   ├── usePayments.ts          # Payment processing
│   ├── useNotifications.ts     # Notification handling
│   ├── useCalendar.ts          # Calendar operations
│   ├── useFirestore.ts         # Firestore helpers
│   └── useLegacyPage.ts        # Legacy HTML pages
│
├── layouts/                     # Page layouts
│   ├── AppLayout.tsx           # Public pages layout
│   ├── AuthLayout.tsx          # Login/signup layout
│   ├── ParentLayout.tsx        # Parent portal layout
│   ├── KidsLayout.tsx          # Kids zone layout
│   ├── TeacherLayout.tsx       # Teacher portal layout
│   ├── RMLayout.tsx            # RM portal layout
│   └── AdminLayout.tsx         # Admin portal layout
│
├── pages/                       # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Courses.tsx
│   ├── Contact.tsx
│   ├── FAQ.tsx
│   ├── NotFound.tsx
│   │
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Onboarding.tsx
│   │
│   ├── parent/
│   │   ├── Dashboard.tsx
│   │   ├── ChildProgress.tsx
│   │   ├── ChildAttendance.tsx
│   │   ├── ChildWork.tsx
│   │   ├── Fees.tsx
│   │   └── Messages.tsx
│   │
│   ├── kids/
│   │   ├── Zone.tsx
│   │   ├── Games.tsx
│   │   ├── GamePlayer.tsx
│   │   ├── Worksheets.tsx
│   │   ├── WorksheetPlayer.tsx
│   │   ├── JoinClass.tsx
│   │   └── RewardsZone.tsx
│   │
│   ├── teacher/
│   │   ├── Dashboard.tsx
│   │   ├── Calendar.tsx
│   │   ├── SessionForm.tsx
│   │   ├── StudentProfile.tsx
│   │   ├── Worksheets.tsx
│   │   ├── Resources.tsx
│   │   └── Earnings.tsx
│   │
│   ├── rm/
│   │   ├── Dashboard.tsx
│   │   ├── TeacherUtilization.tsx
│   │   ├── StudentCohort.tsx
│   │   ├── FeesManagement.tsx
│   │   └── Reports.tsx
│   │
│   └── admin/
│       ├── Dashboard.tsx
│       ├── UserManagement.tsx (already exists)
│       ├── CoursesCMS.tsx
│       ├── GlobalCalendar.tsx
│       ├── PlansManagement.tsx
│       ├── PaymentsAdmin.tsx
│       ├── Compliance.tsx
│       └── Analytics.tsx
│
├── services/                    # API & business logic
│   ├── adminService.ts         # Admin operations (already exists)
│   ├── authService.ts          # Authentication
│   ├── studentService.ts       # Student CRUD
│   ├── parentService.ts        # Parent operations
│   ├── teacherService.ts       # Teacher operations
│   ├── rmService.ts            # RM operations
│   ├── sessionService.ts       # Session management
│   ├── attendanceService.ts    # Attendance tracking
│   ├── progressService.ts      # Progress updates
│   ├── worksheetService.ts     # Worksheet operations
│   ├── gameService.ts          # Games operations
│   ├── paymentService.ts       # Payment processing
│   ├── notificationService.ts  # Notifications
│   ├── calendarService.ts      # Calendar operations
│   ├── analyticsService.ts     # Analytics & reporting
│   └── auditService.ts         # Audit logging
│
├── types/                       # TypeScript types
│   ├── admin.ts                # Admin types (already exists)
│   ├── user.ts                 # User types
│   ├── student.ts              # Student types
│   ├── parent.ts               # Parent types
│   ├── teacher.ts              # Teacher types
│   ├── rm.ts                   # RM types
│   ├── session.ts              # Session types
│   ├── attendance.ts           # Attendance types
│   ├── progress.ts             # Progress types
│   ├── worksheet.ts            # Worksheet types
│   ├── game.ts                 # Game types
│   ├── payment.ts              # Payment types
│   ├── notification.ts         # Notification types
│   ├── course.ts               # Course types
│   └── common.ts               # Shared types
│
├── utils/                       # Utility functions
│   ├── date.ts                 # Date formatting/calculation
│   ├── format.ts               # String formatting
│   ├── validation.ts           # Form validation
│   ├── calculation.ts          # Score/mastery calculation
│   ├── constants.ts            # App constants
│   ├── helpers.ts              # General helpers
│   └── permissions.ts          # Permission checks
│
├── contexts/                    # React contexts
│   ├── AuthContext.tsx         # Auth state provider
│   ├── UserContext.tsx         # User data provider
│   ├── NotificationContext.tsx # Notifications provider
│   └── ThemeContext.tsx        # Theme provider
│
└── styles/                      # Additional styles
    ├── globals.css
    ├── variables.css
    └── themes/
        ├── kids.css            # Kid-friendly theme
        └── admin.css           # Admin theme
```

## Priority Implementation Order

### Phase 1: Core Infrastructure (Week 1-2)
1. ✅ Auth system (login, role guards)
2. ✅ Admin user management (already exists)
3. 🔄 Parent dashboard & child switcher
4. 🔄 Teacher dashboard & calendar
5. 🔄 Student profile & summary docs

### Phase 2: Session Management (Week 3-4)
6. Session scheduling
7. Session completion flow
8. Attendance tracking
9. Progress updates
10. Post-class form

### Phase 3: Learning Content (Week 5-6)
11. Worksheets assignment
12. Games integration
13. Kids Zone UI
14. Curriculum tracking
15. Mastery calculation

### Phase 4: Payments & Operations (Week 7-8)
16. Payment gateway integration
17. Manual payment verification
18. Fee tracking & invoices
19. RM dashboard
20. Teacher earnings

### Phase 5: Analytics & Notifications (Week 9-10)
21. Notification system
22. Analytics dashboard
23. Reports generation
24. Compliance tracking
25. Audit trail

## Next Steps

1. **Copy firestore.rules.v1 to firestore.rules** and deploy
2. **Create missing page components** (starting with Parent Dashboard)
3. **Implement service layer** for each domain
4. **Add TypeScript types** for all data models
5. **Build Cloud Functions** for automation

Ready to proceed with Cloud Functions scaffold?
