import { useNavigate } from 'react-router-dom';
import TinyStepsBrand from '../../components/common/TinyStepsBrand';
import { useAuthStore } from '../../store/useAuthStore';
import { performAppLogout } from '../../lib/auth';

export default function SchoolPortalFoundationPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await performAppLogout('user-clicked-logout');
    navigate('/school/login', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <TinyStepsBrand subtitle="School Partnership" />

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            School Partnership
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Welcome to Tiny Steps
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {user?.displayName
              ? `Hello ${user.displayName}. Your school workspace is ready.`
              : 'Your school workspace is ready.'}
          </p>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-950">
              Your school programme information will appear here once the
              partnership setup is completed.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
