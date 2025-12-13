import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
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
// Dashboards
import AdminDashboard from '../pages/admin/AdminDashboard';
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const ParentDashboard = lazy(() => import('../pages/parent/ParentDashboard'));
const LPDashboard = lazy(() => import('../pages/lp/LPDashboard'));


// Payments
const PaymentCallback = lazy(() => import('../pages/parent/Payments/PaymentCallback'));
const PhonePeCheckout = lazy(() => import('../pages/payments/PhonePeCheckout'));
const PhonePeCallback = lazy(() => import('../pages/payments/PhonePeCallback'));

// Layout
import Header from '../components/common/Header';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
import FloatingAssistant from '../components/common/FloatingAssistant';
import BackToTopButton from '../components/common/BackToTopButton';
import ScrollToTop from '../components/common/ScrollToTop';

const Layout = () => (_jsxs("div", { className: "min-h-screen bg-[radial-gradient(circle_at_top,_#fdf4ff,_#f4f8ff_45%,_#ffffff_80%)]", children: [
  _jsx(AnalyticsTracker, {}),
  _jsx(ScrollToTop, {}),
  _jsx(Header, {}),
  _jsx("main", { className: "min-h-screen pt-8 md:pt-12 lg:pt-16 pb-16", children: _jsx(Suspense, { fallback: _jsx("div", { className: "px-6 py-10 text-sm text-gray-600", children: "Loading…" }), children: _jsx(Outlet, {}) }) }),
  _jsx(FloatingAssistant, {}),
  _jsx(BackToTopButton, {})
] }));

const router = createBrowserRouter([
  {
    element: _jsx(Layout, {}),
    errorElement: _jsx(NotFoundPage, {}),
    children: [
      {
        index: true,
        element: _jsx(HomePage, {}),
      },
      {
        path: 'blog',
        element: _jsx(BlogPage, {}),
      },
      {
        path: 'blog/:slug',
        element: _jsx(BlogPostPage, {}),
      },
      {
        path: 'pricing',
        element: _jsx(PricingPage, {}),
      },
      {
        path: 'contact',
        element: _jsx(ContactPage, {}),
      },
      {
        path: 'why-tiny-steps',
        element: _jsx(WhyTinyStepsPage, {}),
      },
      {
        path: 'courses',
        element: _jsx(CoursesPage, {}),
      },
      {
        path: 'courses/:courseId',
        element: _jsx(CourseDetailPage, {}),
      },
      {
        path: 'curriculum',
        element: _jsx(CurriculumPage, {}),
      },
      {
        path: 'why-us',
        element: _jsx(Navigate, { to: "/why-tiny-steps", replace: true }),
      },
      {
        path: 'faq',
        element: _jsx(FAQPage, {}),
      },
      {
        path: 'phonics',
        element: _jsx(PhonicsPage, {}),
      },
      {
        path: 'grammar',
        element: _jsx(GrammarPage, {}),
      },
      {
        path: 'speaking',
        element: _jsx(SpeakingPage, {}),
      },

      // Auth
      {
        path: 'login',
        element: _jsx(LoginPage, {}),
      },
      {
        path: 'surya/login',
        element: _jsx(Login, {}),
      },
      {
        path: 'admin/login',
        element: _jsx(Navigate, { to: "/surya/login", replace: true }),
      },
      {
        path: 'Surya/login',
        element: _jsx(Navigate, { to: "/surya/login", replace: true }),
      },
      {
        path: 'teacher/login',
        element: _jsx(LoginPage, {}),
      },
      {
        path: 'parent/login',
        element: _jsx(LoginPage, {}),
      },
      {
        path: 'learning-partner/login',
        element: _jsx(LoginPage, {}),
      },
      {
        path: 'learningpartner/login',
        element: _jsx(LoginPage, {}),
      },
      {
        path: 'kid/login',
        element: _jsx(Navigate, { to: "/parent/login", replace: true }),
      },
      {
        path: 'unauthorized',
        element: _jsx(UnauthorizedPage, {}),
      },

      // ADMIN via /surya only
      {
        path: 'surya',
        element: _jsx(RoleGate, { allowedRoles: ['admin'], loginPath: "/surya/login" }),
        children: [
          {
            path: '',
            element: _jsx(AdminDashboard, {}),
          },
          {
            path: 'analytics',
            element: _jsx(AdminDashboard, {}),
          },
          
        ],
      },
      {
        path: 'admin',
        element: _jsx(Navigate, { to: "/surya/login", replace: true }),
      },
      {
        path: 'Surya',
        element: _jsx(Navigate, { to: "/surya", replace: true }),
      },

      // TEACHER
      {
        path: 'teacher',
        element: _jsx(RoleGate, { allowedRoles: ['teacher'] }),
        children: [
          {
            path: '',
            element: _jsx(TeacherDashboard, {}),
          },
        ],
      },
      {
        path: 'teachers',
        element: _jsx(RoleGate, { allowedRoles: ['teacher'] }),
        children: [
          {
            path: '',
            element: _jsx(TeacherDashboard, {}),
          },
        ],
      },

      // PARENT
      {
        path: 'parent',
        element: _jsx(RoleGate, { allowedRoles: ['parent'], loginPath: "/parent/login" }),
        children: [
          {
            path: '',
            element: _jsx(ParentDashboard, {}),
          },
          {
            path: 'kids',
            element: _jsx(ParentDashboard, {}),
          },
          {
            path: 'payments/:invoiceId',
            element: _jsx(PhonePeCheckout, {}),
          },
          {
            path: 'payments/callback',
            element: _jsx(PaymentCallback, {}),
          },
          {
            path: 'payments/phonepe-callback',
            element: _jsx(PhonePeCallback, {}),
          },
        ],
      },

      // LEARNING PARTNER
      {
        path: 'learning-partner',
        element: _jsx(RoleGate, { allowedRoles: ['learningPartner'] }),
        children: [
          {
            path: '',
            element: _jsx(LPDashboard, {}),
          },
        ],
      },
      {
        path: 'learningpartner',
        element: _jsx(Navigate, { to: "/learning-partner", replace: true }),
      },

      // KID aliases
      {
        path: 'kid',
        element: _jsx(Navigate, { to: "/parent/kids", replace: true }),
      },
      {
        path: 'kids/:childId/dashboard',
        element: _jsx(Navigate, { to: "/parent", replace: true }),
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
