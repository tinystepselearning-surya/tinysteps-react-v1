// src/app/routes.tsx
import { lazy, Suspense, type FC } from 'react';
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const Login = lazy(() => import('../pages/Login'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const CurriculumPage = lazy(() => import('../pages/CurriculumPage'));
const CoursesPage = lazy(() => import('../pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const FAQPage = lazy(() => import('../pages/FAQPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const WhyTinyStepsPage = lazy(() => import('../pages/WhyTinyStepsPage'));
const ForSchoolsPage = lazy(() => import('../pages/ForSchoolsPage'));

// Course Pages
const PhonicsPage = lazy(() => import('../pages/phonics'));
const GrammarPage = lazy(() => import('../pages/grammar'));
const SpeakingPage = lazy(() => import('../pages/speaking'));

// Dashboards
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const TopicsSeedPicklistPage = lazy(() => import('../pages/admin/TopicsSeedPicklistPage'));
const TeacherStudentTopicProgressPage = lazy(() => import('../pages/teacher/TeacherStudentTopicProgressPage'));
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const LessonLibraryPage = lazy(() => import('../pages/teacher/LessonLibraryPage'));
const DebugLessonLibrary = lazy(() => import('../pages/DebugLessonLibrary'));
const SeedTeacherUserPage = lazy(() => import('../pages/dev/SeedTeacherUserPage'));
const ParentDashboard = lazy(() => import('../pages/parent/ParentDashboard'));
const ParentProfile = lazy(() => import('../pages/parent/Profile'));
const ParentPayments = lazy(() => import('../pages/parent/Payments'));
const LPDashboard = lazy(() => import('../pages/lp/LPDashboard'));
const BetaAnalytics = lazy(
  () => import('../pages/admin/beta-analytics.jsx') as any,
);

// Payment Components
const PaymentCallback = lazy(
  () => import('../pages/parent/Payments/PaymentCallback'),
);
const PhonePeCheckout = lazy(
  () => import('../pages/payments/PhonePeCheckout'),
);
const PhonePeCallback = lazy(
  () => import('../pages/payments/PhonePeCallback'),
);

// Layout
import Header from '../components/common/Header';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
const FloatingAssistant = lazy(() => import('../components/common/FloatingAssistant'));
const BackToTopButton = lazy(() => import('../components/common/BackToTopButton'));
import ScrollToTop from '../components/common/ScrollToTop';

const Layout: FC = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fdf4ff,_#f4f8ff_45%,_#ffffff_80%)]">
    <AnalyticsTracker />
    <ScrollToTop />
    <Header />
    <main className="min-h-screen pt-8 md:pt-12 lg:pt-16 pb-16">
      <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
        <Outlet />
      </Suspense>
    </main>
    <Suspense fallback={null}>
      <FloatingAssistant />
      <BackToTopButton />
    </Suspense>
  </div>
);

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: <NotFoundPage />,
      children: [
        // ---------- Public marketing site ----------
        { index: true, element: <HomePage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'blog/:slug', element: <BlogPostPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'why-tiny-steps', element: <WhyTinyStepsPage /> },
        { path: 'courses', element: <CoursesPage /> },
        { path: 'courses/:courseId', element: <CourseDetailPage /> },
        { path: 'curriculum', element: <CurriculumPage /> },
        { path: 'why-us', element: <Navigate to="/why-tiny-steps" replace /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'phonics', element: <PhonicsPage /> },
        { path: 'grammar', element: <GrammarPage /> },
        { path: 'speaking', element: <SpeakingPage /> },
        { path: 'for-schools', element: <ForSchoolsPage /> },

        // ---------- Public auth routes ----------
        { path: 'login', element: <LoginPage /> },
        { path: 'surya/login', element: <Login /> },
        { path: 'admin/login', element: <Navigate to="/surya/login" replace /> },
        { path: 'Surya/login', element: <Navigate to="/surya/login" replace /> },

        { path: 'teacher/login', element: <LoginPage /> },
        { path: 'parent/login', element: <LoginPage /> },
        { path: 'learning-partner/login', element: <LoginPage /> },
        { path: 'learningpartner/login', element: <LoginPage /> }, // alias

        { path: 'kid/login', element: <Navigate to="/parent/login" replace /> },
        { path: 'unauthorized', element: <UnauthorizedPage /> },

        // Dev helper: seed current auth user as teacher (DEV only)
        { path: 'dev/seed-teacher', element: <SeedTeacherUserPage /> },
        // Also accept an absolute path variant in case the router resolves differently
        { path: '/dev/seed-teacher', element: <SeedTeacherUserPage /> },
        // Temporary dev test route to validate client routing quickly
        { path: 'dev/seed-test', element: <div style={{ padding: 20 }}>Dev route working — seed-test</div> },
        { path: '/dev/seed-test', element: <div style={{ padding: 20 }}>Dev route working — seed-test</div> },
        // DEBUG: Direct lesson library test (bypasses all routing issues)
        { path: 'debug-lessons', element: <DebugLessonLibrary /> },
        // Temporary: public test route for Lesson Library (bypasses RoleGate)
        { path: 'teacher/lessons-test', element: <LessonLibraryPage /> },
        // Also accept absolute path variant to avoid any client-side route normalization issues
        { path: '/teacher/lessons-test', element: <LessonLibraryPage /> },

        // ---------- Admin area – ONLY under /surya ----------
        {
          path: 'surya',
          element: (
            <RoleGate
              allowedRoles={['admin']}
              loginPath="/surya/login"
            />
          ),
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'analytics', element: <AdminDashboard /> },
          ],
        },
        { path: 'admin', element: <Navigate to="/surya/login" replace /> },
        { path: 'Surya', element: <Navigate to="/surya" replace /> },

        // ---------- Teacher dashboard ----------
        {
          path: 'teacher',
          element: (
            <RoleGate
              allowedRoles={['teacher']}
              loginPath="/teacher/login"
            />
          ),
          children: [
            { index: true, element: <TeacherDashboard /> },
            { path: 'lessons', element: <LessonLibraryPage /> },
            {
              path: 'students/:kidId/topic-progress',
              element: <TeacherStudentTopicProgressPage />,
            },
          ],
        },
        // Teacher routes with :teacherId param (supports sidebar links)
        {
          path: 'teacher/:teacherId',
          element: (
            <RoleGate
              allowedRoles={['teacher']}
              loginPath="/teacher/login"
            />
          ),
          children: [
            { index: true, element: <TeacherDashboard /> },
            { path: 'lessons', element: <LessonLibraryPage /> },
            { path: 'worksheet-generator', element: <TeacherDashboard /> },
            {
              path: 'students/:kidId/topic-progress',
              element: <TeacherStudentTopicProgressPage />,
            },
          ],
        },
        {
          path: 'teachers',
          element: (
            <RoleGate
              allowedRoles={['teacher']}
              loginPath="/teacher/login"
            />
          ),
          children: [{ index: true, element: <TeacherDashboard /> }],
        },

        // ---------- Parent dashboard + payments ----------
        {
          path: 'parent',
          element: (
            <RoleGate
              allowedRoles={['parent']}
              loginPath="/parent/login"
            />
          ),
          children: [
            { index: true, element: <ParentDashboard /> },
            { path: 'profile', element: <ParentProfile /> },
            { path: 'payments', element: <ParentPayments /> },
            { path: 'kids', element: <ParentDashboard /> },
            { path: 'payments/:invoiceId', element: <PhonePeCheckout /> },
            { path: 'payments/callback', element: <PaymentCallback /> },
            { path: 'payments/phonepe-callback', element: <PhonePeCallback /> },
          ],
        },

        // ---------- Learning Partner dashboard ----------
        {
          path: 'learning-partner',
          element: (
            <RoleGate
              allowedRoles={['learningPartner']}
              loginPath="/learning-partner/login"
            />
          ),
          children: [{ index: true, element: <LPDashboard /> }],
        },
        { path: 'learningpartner', element: <Navigate to="/learning-partner" replace /> },

        // ---------- Misc aliases ----------
        { path: 'kid', element: <Navigate to="/parent/kids" replace /> },
        { path: 'kids/:childId/dashboard', element: <Navigate to="/parent" replace /> },

        // ---------- Beta analytics (admin only) ----------
        {
          path: 'admin/beta-analytics',
          element: (
            <RoleGate
              allowedRoles={['admin']}
              loginPath="/surya/login"
            />
          ),
          children: [{ index: true, element: <BetaAnalytics /> }],
        },

        // ---------- Topics seed picklist (admin only) ----------
        {
          path: 'admin/topics-seed-picklist',
          element: (
            <RoleGate
              allowedRoles={['admin']}
              loginPath="/surya/login"
            />
          ),
          children: [{ index: true, element: <TopicsSeedPicklistPage /> }],
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

export default router;
