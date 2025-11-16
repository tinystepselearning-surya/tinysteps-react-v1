import React from 'react';
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
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const TeacherDashboard = React.lazy(() => import('../pages/teacher/TeacherDashboard'));
const ParentDashboard = React.lazy(() => import('../pages/parent/ParentDashboard'));
const LPDashboard = React.lazy(() => import('../pages/lp/LPDashboard'));
const PracticeBuddyPage = React.lazy(() => import('../pages/kids/PracticeBuddyPage'));
const WorksheetGeneratorPage = React.lazy(() => import('../pages/teacher/WorksheetGeneratorPage'));
const BetaAnalytics = React.lazy(() => import('../pages/admin/beta-analytics.jsx'));
const SpellBeeGamePage = React.lazy(() => import('../pages/kids/games/SpellBeeGamePage'));
const PhonicsMazePage = React.lazy(() => import('../pages/kids/games/PhonicsMazePage'));
const SightWordBingoPage = React.lazy(() => import('../pages/kids/games/SightWordBingoPage'));
const GrammarBuilderPage = React.lazy(() => import('../pages/kids/games/GrammarBuilderPage'));
const PublicSpeakingPage = React.lazy(() => import('../pages/kids/games/PublicSpeakingPage'));
const ReadingAdventurePage = React.lazy(() => import('../pages/kids/games/ReadingAdventurePage'));

// Payment Components
const PaymentCallback = React.lazy(() => import('../pages/parent/Payments/PaymentCallback'));
const PhonePeCallback = React.lazy(() => import('../pages/payments/PhonePeCallback').then(module => ({ default: module.PhonePeCallback })));

// Layout
import Header from '../components/common/Header';
import { Suspense } from 'react';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
import FloatingAssistant from '../components/common/FloatingAssistant';
import BackToTopButton from '../components/common/BackToTopButton';
import ScrollToTop from '../components/common/ScrollToTop';

const Layout: React.FC = () => (
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

const routerOptions: any = {
  future: {
    v7_startTransition: true,
  },
};

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <NotFoundPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'curriculum',
          element: <CurriculumPage />,
        },
        {
          path: 'courses',
          element: <CoursesPage />,
        },
        {
          path: 'courses/:slug',
          element: <CourseDetailPage />,
        },
        {
          path: 'blog',
          element: <BlogPage />,
        },
        {
          path: 'blog/:slug',
          element: <BlogPostPage />,
        },
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
          path: 'kids/:childId/spellbee',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <SpellBeeGamePage />,
            },
          ],
        },
        {
          path: 'kids/:childId/phonics-maze',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <PhonicsMazePage />,
            },
          ],
        },
        {
          path: 'kids/:childId/bingo',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <SightWordBingoPage />,
            },
          ],
        },
        {
          path: 'kids/:childId/bingo/:roomId',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <SightWordBingoPage />,
            },
          ],
        },
        {
          path: 'kids/:childId/grammar-builder',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <GrammarBuilderPage />,
            },
          ],
        },
        {
          path: 'kids/:childId/speaking',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <PublicSpeakingPage />,
            },
          ],
        },
        {
          path: 'kids/:childId/reading-adventure',
          element: <RoleGate allowedRoles={['parent']} loginPath="/parent/login" />,
          children: [
            {
              path: '',
              element: <ReadingAdventurePage />,
            },
          ],
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
  routerOptions
);

export default router;
