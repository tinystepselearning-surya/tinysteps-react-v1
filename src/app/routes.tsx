import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
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
]);