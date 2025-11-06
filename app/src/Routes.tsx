import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import ParentLayout from "./layouts/ParentLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import RMLayout from "./layouts/RMLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import AllCourses from "./pages/courses/All";
import Phonics from "./pages/courses/Phonics";
import Grammar from "./pages/courses/Grammar";
import PublicSpeaking from "./pages/courses/PublicSpeaking";
import Pricing from "./pages/Pricing";
import Curriculum from "./pages/Curriculum";
import FAQ from "./pages/FAQ";
import RoleLoginPage from "./pages/auth/RoleLogin";
import ParentLogin from "./pages/ParentLogin";
import ParentLoginTest from "./pages/ParentLoginTest";
import GuestPortalPage from "./pages/auth/GuestPortal";
import TeacherPortal from "./pages/roles/TeacherPortal";
import LearningManagerPortal from "./pages/roles/LearningManagerPortal";
import KidsPortal from "./pages/roles/KidsPortal";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogArticle from "./pages/blog/BlogArticle";
import OldGamesGallery from "./pages/games/GamesGallery"; // Old simple games library
import PhonicsSoundsMasteryHub from "./pages/games/PhonicsSoundsMasteryHub";
import ElkoninGame from "./pages/games/ElkoninGame";
import KidsGuestLanding from "./pages/KidsGuestLanding";
import KidsPhonicsJourney from "./pages/kids/GamesGallery"; // Phase 0-10 journey with 4 views
import PhaseDetail from "./pages/kids/PhaseDetail"; // Phase detail page
import GamesGalleryEnhanced from "./routes/kids/GamesGalleryEnhanced"; // New enhanced games gallery
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import ParentManagement from "./pages/admin/ParentManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import MembershipManagement from "./pages/admin/MembershipManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import LearningPartnerManagement from "./pages/admin/LearningPartnerManagement";
import RolesPermissions from "./pages/admin/RolesPermissions";
import SystemSettings from "./pages/admin/SystemSettings";
import AuditLogs from "./pages/admin/AuditLogs";
import CoursesOverview from "./pages/admin/CoursesOverview";
import CourseBuilder from "./pages/admin/CourseBuilder";
import LessonBuilder from "./pages/admin/LessonBuilder";
import ContentLibrary from "./pages/admin/ContentLibrary";
import MigrateParents from "./pages/admin/MigrateParents";
import SyncUserClaims from "./pages/admin/SyncUserClaims";
import TestAuth from "./pages/admin/TestAuth";
import { AdminRoute } from "./components/admin/AdminRoute";

// Parent Portal Pages
import ParentDashboard from "./pages/parent/Dashboard";
import ParentChildren from "./pages/parent/Children";
import ParentSchedule from "./pages/parent/Schedule";
import ParentReports from "./pages/parent/Reports";
import ParentFees from "./pages/parent/Fees";
import ParentMessages from "./pages/parent/Messages";

// Teacher Portal Pages
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherCalendar from "./pages/teacher/Calendar";
import TeacherStudents from "./pages/teacher/Students";
import TeacherSessions from "./pages/teacher/Sessions";
import TeacherResources from "./pages/teacher/Resources";
import TeacherPerformance from "./pages/teacher/Performance";

// Learning Partner Portal Pages
import RMDashboard from "./pages/rm/Dashboard";
import RMStudents from "./pages/rm/Students";
import RMTeachers from "./pages/rm/Teachers";
import RMFees from "./pages/rm/Fees";
import RMAnalytics from "./pages/rm/Analytics";
import RMReports from "./pages/rm/Reports";

const SpellBeeFlashTrainer = lazy(() => import("./games/spellbee-flash"));
const SpellBeeGroupDashboard = lazy(() => import("./games/spellbee-flash/GroupDashboard"));
const MeaningMatchGame = lazy(() => import("./games/meaning-match"));
const MeaningMatchDashboard = lazy(() => import("./games/meaning-match/Dashboard"));
const BalloonPopGame = lazy(() => import("./games/balloon-pop"));
const BalloonPopDashboard = lazy(() => import("./games/balloon-pop/Dashboard"));
const BalloonPopIPAGame = lazy(() => import("./games/balloon-pop-ipa"));
const QuickMeaningGame = lazy(() => import("./games/quick-meaning-quiz"));
const QuickMeaningDashboard = lazy(() => import("./games/quick-meaning-quiz/Dashboard"));
const BossLevelGame = lazy(() => import("./games/boss-level"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Courses */}
        <Route path="/courses" element={<AllCourses />} />
        <Route path="/courses/phonics" element={<Phonics />} />
        <Route path="/courses/grammar" element={<Grammar />} />
        <Route path="/courses/public-speaking" element={<PublicSpeaking />} />

        {/* Extras */}
        {/* Kids Zone Routes */}
        <Route path="/kids" element={<KidsGuestLanding />} />
        <Route path="/kids/games" element={<KidsPhonicsJourney />} /> {/* Phase 0-10 journey with 4 views */}
        <Route path="/kids/games-gallery" element={<KidsPhonicsJourney />} /> {/* Phase 0-10 journey with 4 views */}
        <Route path="/kids/games-enhanced" element={<GamesGalleryEnhanced />} /> {/* New enhanced gallery with filters */}
        <Route path="/kids/phonics-journey" element={<KidsPhonicsJourney />} /> {/* Alias route */}
        <Route path="/kids/phase/:phaseId" element={<PhaseDetail />} /> {/* Phase detail page */}
        <Route path="/games" element={<OldGamesGallery />} /> {/* Simple games library */}
        <Route path="/games/games-gallery" element={<KidsPhonicsJourney />} /> {/* Phase 0-10 journey */}
        <Route path="/games/phonics-sounds-mastery" element={<PhonicsSoundsMasteryHub />} />
        <Route path="/games/elkonin" element={<ElkoninGame />} />
        <Route 
          path="/games/balloon-pop-ipa" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopIPAGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/spellbee-flash" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <SpellBeeFlashTrainer />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/spellbee-flash/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <SpellBeeGroupDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/meaning-match" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <MeaningMatchGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/meaning-match/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <MeaningMatchDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <BalloonPopDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop-ipa" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopIPAGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/quick-meaning" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <QuickMeaningGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/quick-meaning/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading…</div>}>
              <QuickMeaningDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/boss-level" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BossLevelGame />
            </Suspense>
          } 
        />
        <Route path="/parents" element={<Navigate to="/login/parents" replace />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/blog/:slug/" element={<BlogArticle />} />

        {/* Admin Routes - Hidden, accessible only via /surya path */}
        <Route path="/surya" element={<AdminLogin />} />
        <Route 
          path="/surya/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
        </Route>
        <Route 
          path="/surya/users" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<UserManagement />} />
        </Route>
        <Route 
          path="/surya/parents" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<ParentManagement />} />
        </Route>
        <Route 
          path="/surya/students" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<StudentManagement />} />
        </Route>
        <Route 
          path="/surya/memberships" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<MembershipManagement />} />
        </Route>
        <Route 
          path="/surya/teachers" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<TeacherManagement />} />
        </Route>
        <Route 
          path="/surya/learning-partners" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<LearningPartnerManagement />} />
        </Route>
        <Route 
          path="/surya/roles" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<RolesPermissions />} />
        </Route>
        <Route 
          path="/surya/settings" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<SystemSettings />} />
        </Route>
        <Route 
          path="/surya/audit-logs" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<AuditLogs />} />
        </Route>
        <Route 
          path="/surya/courses" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<CoursesOverview />} />
          <Route path="new" element={<CourseBuilder />} />
          <Route path=":courseId/edit" element={<CourseBuilder />} />
          <Route path=":courseId/lessons/:lessonId/edit" element={<LessonBuilder />} />
        </Route>
        <Route 
          path="/surya/content" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<ContentLibrary />} />
        </Route>
        <Route 
          path="/surya/migrate-parents" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<MigrateParents />} />
        </Route>
        <Route 
          path="/surya/sync-claims" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route index element={<SyncUserClaims />} />
        </Route>
        <Route path="/test-auth" element={<TestAuth />} />

        {/* Parent Portal Routes - Protected */}
        <Route 
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="children" element={<ParentChildren />} />
          <Route path="schedule" element={<ParentSchedule />} />
          <Route path="reports" element={<ParentReports />} />
          <Route path="fees" element={<ParentFees />} />
          <Route path="messages" element={<ParentMessages />} />
          <Route index element={<Navigate to="/parent/dashboard" replace />} />
        </Route>

        {/* Teacher Portal Routes - Protected */}
        <Route 
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="calendar" element={<TeacherCalendar />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="sessions" element={<TeacherSessions />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="performance" element={<TeacherPerformance />} />
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        </Route>

        {/* Learning Partner Portal Routes - Protected */}
        <Route 
          path="/rm"
          element={
            <ProtectedRoute allowedRoles={["learning-partner"]}>
              <RMLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<RMDashboard />} />
          <Route path="students" element={<RMStudents />} />
          <Route path="teachers" element={<RMTeachers />} />
          <Route path="fees" element={<RMFees />} />
          <Route path="analytics" element={<RMAnalytics />} />
          <Route path="reports" element={<RMReports />} />
          <Route index element={<Navigate to="/rm/dashboard" replace />} />
        </Route>

        {/* Roles */}
        <Route path="/roles/teacher" element={<TeacherPortal />} />
        <Route path="/roles/teacher/" element={<TeacherPortal />} />
        <Route path="/roles/rm" element={<LearningManagerPortal />} />
        <Route path="/roles/rm/" element={<LearningManagerPortal />} />
        <Route path="/roles/learning-manager" element={<LearningManagerPortal />} />
        <Route path="/roles/learning-manager/" element={<LearningManagerPortal />} />
        <Route path="/roles/kids" element={<KidsPortal />} />
        <Route path="/roles/kids/" element={<KidsPortal />} />
        <Route path="/roles/kids/games-gallery" element={<KidsPhonicsJourney />} /> {/* Phase 0-10 journey */}

        {/* Auth */}
        <Route path="/login" element={<Navigate to="/parent-login" replace />} />
        <Route path="/parent-login" element={<ParentLogin />} />
        <Route path="/login/:role" element={<RoleLoginPage />} />
        <Route path="/parent-login-test" element={<ParentLoginTest />} />
        <Route path="/guest" element={<Navigate to="/guest/parents" replace />} />
        <Route path="/guest/:role" element={<GuestPortalPage />} />

        {/* Back-compat if you had /main/courses/... */}
        <Route path="/main/courses" element={<Navigate to="/courses" replace />} />
        <Route path="/main/courses/phonics" element={<Navigate to="/courses/phonics" replace />} />
        <Route path="/main/courses/grammar" element={<Navigate to="/courses/grammar" replace />} />
        <Route path="/main/courses/public-speaking" element={<Navigate to="/courses/public-speaking" replace />} />
      </Route>
    </Routes>
  );
}
