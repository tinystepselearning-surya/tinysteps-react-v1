import { lazy, Suspense } from 'react';
import type { FC } from 'react';
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Login from '../pages/Login';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import HomePage from '../pages/HomePage';
import CurriculumPage from '../pages/CurriculumPage';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import BlogPage from '../pages/BlogPage';
import BlogPostPage from '../pages/BlogPostPage';
import PricingPage from '../pages/PricingPage';
import FAQPage from '../pages/FAQPage';
import ContactPage from '../pages/ContactPage';
import WhyTinyStepsPage from '../pages/WhyTinyStepsPage';

// Course Pages
import PhonicsPage from '../pages/phonics';
import GrammarPage from '../pages/grammar';
import SpeakingPage from '../pages/speaking';

// Dashboards (to be created)
import AdminDashboard from '../pages/admin/AdminDashboard';
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const ParentDashboard = lazy(() => import('../pages/parent/ParentDashboard'));
const LPDashboard = lazy(() => import('../pages/lp/LPDashboard'));
const WorksheetGeneratorPage = lazy(() => import('../pages/teacher/WorksheetGeneratorPage'));
const BetaAnalytics = lazy(() => import('../pages/admin/beta-analytics.jsx') as any);

// Payment Components
const PaymentCallback = lazy(() => import('../pages/parent/Payments/PaymentCallback'));
const PhonePeCallback = lazy(() => import('../pages/payments/PhonePeCallback').then(module => ({ default: module.PhonePeCallback })));

// Layout
import Header from '../components/common/Header';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
import FloatingAssistant from '../components/common/FloatingAssistant';
import BackToTopButton from '../components/common/BackToTopButton';
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
    <FloatingAssistant />
    <BackToTopButton />
  </div>
);

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: <NotFoundPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
      
          path: 'blog',
          element: <BlogPage />,
        },
        {
          path: 'blog/:slug',
          element: <BlogPostPage />,
        },
      // 'Suspense' is now imported from React above
        {
          path: 'pricing',
          element: <PricingPage />,
        },
        {
          path: 'contact',
          element: <ContactPage />,
        },
        {
          path: 'why-tiny-steps',
          element: <WhyTinyStepsPage />,
        },
        {
          path: 'courses',
          element: <CoursesPage />,
        },
        {
          path: 'courses/:courseId',
          element: <CourseDetailPage />,
        },
        {
          path: 'curriculum',
          element: <CurriculumPage />,
        },
        {
          path: 'why-us',
          element: <Navigate to="/why-tiny-steps" replace />,
        },
        {
          path: 'faq',
          element: <FAQPage />,
        },
        {
          path: 'phonics',
          element: <PhonicsPage />,
        },
        {
          path: 'grammar',
          element: <GrammarPage />,
        },
        {
          path: 'speaking',
          element: <SpeakingPage />,
        },
        {
          path: 'login',
          element: <LoginPage />,
        },
        {
          path: 'surya/login',
          element: <Login />,
        },
        {
          path: 'admin/login',
          element: <Navigate to="/surya/login" replace />,
        },
        {
          path: 'Surya/login',
          element: <Navigate to="/surya/login" replace />,
        },
        {
          path: 'teacher/login',
          element: <LoginPage />,
        },
        {
          path: 'parent/login',
          element: <LoginPage />,
        },
        {
          path: 'learning-partner/login',
          element: <LoginPage />,
        },
        // Alias without hyphen for convenience (older links / direct typed URLs)
        {
          path: 'learningpartner/login',
          element: <LoginPage />,
        },
        {
          path: 'kid/login',
          element: <Navigate to="/parent/login" replace />,
        },
        {
          path: 'unauthorized',
          element: <UnauthorizedPage />,
        },
        {
          path: 'surya',
          element: <RoleGate allowedRoles={['admin']} loginPath="/surya/login" />,
          children: [
            {
              path: '',
              element: <AdminDashboard />,
            },
            {
              path: 'analytics',
              element: <AdminDashboard />,
            },
          ],
        },
        {
          path: 'admin',
          element: <Navigate to="/surya/login" replace />,
        },
        {
          path: 'Surya',
          element: <Navigate to="/surya" replace />,
        },
        {
          path: 'teacher',
          element: <RoleGate allowedRoles={['teacher']} />,
          children: [
            {
              path: '',
              element: <TeacherDashboard />,
            },
          ],
        },
        {
          path: 'teachers',
          element: <RoleGate allowedRoles={['teacher']} />,
          children: [
            {
              path: '',
              element: <TeacherDashboard />,
            },
          ],
        },
        {
          path: 'parent',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <ParentDashboard />,
            },
            {
              path: 'kids',
              element: <ParentDashboard />,
            },
            {
              path: 'payments/callback',
              element: <PaymentCallback />,
            },
            {
              path: 'payments/phonepe-callback',
              element: <PhonePeCallback />,
            },
          ],
        },
        {
          path: 'learning-partner',
          element: <RoleGate allowedRoles={['learningPartner']} />,
          children: [
            {
              path: '',
              element: <LPDashboard />,
            },
          ],
        },
        {
          // Alias for backwards compatibility
          path: 'learningpartner',
          element: <Navigate to="/learning-partner" replace />,
        },
        {
          path: 'kid',
          element: <Navigate to="/parent/kids" replace />,
        },
        {
          path: 'kids/:childId/dashboard',
          element: <Navigate to="/parent" replace />,
        },
        {
          path: 'teacher/:teacherId/worksheet-generator',
          element: <RoleGate allowedRoles={['teacher']} />,
          children: [
            {
              path: '',
              element: <WorksheetGeneratorPage />,
            },
          ],
        },
        {
          path: 'admin/beta-analytics',
          element: <RoleGate allowedRoles={['admin']} loginPath="/surya/login" />,
          children: [
            {
              path: '',
              element: <BetaAnalytics />,
            },
          ],
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
  }
);

export default router;
