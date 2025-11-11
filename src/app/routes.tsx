import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
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

// Course Pages
import PhonicsPage from '../pages/phonics';
import GrammarPage from '../pages/grammar';
import SpeakingPage from '../pages/speaking';

// Dashboards (to be created)
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const TeacherDashboard = React.lazy(() => import('../pages/teacher/TeacherDashboard'));
const ParentDashboard = React.lazy(() => import('../pages/parent/ParentDashboard'));
const LPDashboard = React.lazy(() => import('../pages/lp/LPDashboard'));
const KidDashboard = React.lazy(() => import('../pages/kid/KidDashboard'));

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
          path: 'admin/login',
          element: <LoginPage />,
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
        {
          path: 'kid/login',
          element: <LoginPage />,
        },
        {
          path: 'unauthorized',
          element: <UnauthorizedPage />,
        },
        {
          path: 'Surya',
          element: <RoleGate allowedRoles={['admin']} />,
          children: [
            {
              path: '',
              element: <AdminDashboard />,
            },
          ],
        },
        {
          path: 'admin',
          element: <RoleGate allowedRoles={['admin']} />,
          children: [
            {
              path: '',
              element: <AdminDashboard />,
            },
          ],
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
          path: 'parent',
          element: <RoleGate allowedRoles={['parent']} />,
          children: [
            {
              path: '',
              element: <ParentDashboard />,
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
          path: 'kid',
          element: <RoleGate allowedRoles={['kid']} />,
          children: [
            {
              path: '',
              element: <KidDashboard />,
            },
          ],
        },
      ],
    },
  ],
  routerOptions
);

export default router;
