import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';

type KidGameShellProps = {
  childId?: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  children: ReactNode;
};

export default function KidGameShell({ childId, title, subtitle, highlight, children }: KidGameShellProps) {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading kid session…
      </div>
    );
  }

  const allowed =
    !!user &&
    !!childId &&
    (user.role === 'parent' || user.role === 'kid');

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div className="bg-white rounded-2xl shadow p-6 max-w-md space-y-3">
          <p className="text-lg font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-600">
            This game is only available when accessed from a logged-in parent account (or the child account directly).
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            onClick={() => navigate('/parent/login')}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Kids Portal · Games</p>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            {highlight && <p className="text-xs text-emerald-700 font-semibold mt-1">{highlight}</p>}
          </div>
          <Link to="/parent" className="text-sm text-indigo-700 hover:underline font-semibold">
            ← Back to Dashboard
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
