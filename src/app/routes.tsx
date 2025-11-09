import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import HomePage from '../pages/HomePage';

// Course Pages
import PhonicsPage from '../pages/phonics';
import GrammarPage from '../pages/grammar';
import SpeakingPage from '../pages/speaking';

// Dashboards (to be created)
import AdminDashboard from '../pages/admin/AdminDashboard';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import ParentDashboard from '../pages/parent/ParentDashboard';
import LPDashboard from '../pages/lp/LPDashboard';
import KidDashboard from '../pages/kid/KidDashboard';

// Layout
import Header from '../components/common/Header';
import RoleGate from '../components/common/RoleGate';

const Layout: React.FC = () => (
  <div>
    <Header />
    <Outlet />
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
          path: 'learningpartner/login',
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
          path: 'learningpartner',
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