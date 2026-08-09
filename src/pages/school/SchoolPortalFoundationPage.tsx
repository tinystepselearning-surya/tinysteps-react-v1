import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import TinyStepsBrand from '../../components/common/TinyStepsBrand';
import { performAppLogout } from '../../lib/auth';
import { getSchoolPortalAccess } from '../../services/schoolService';
import { useAuthStore } from '../../store/useAuthStore';

export default function SchoolPortalFoundationPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['school-portal-access', user?.uid],
    enabled: Boolean(user?.uid),
    queryFn: () => getSchoolPortalAccess(user!.uid),
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    await performAppLogout('user-clicked-logout');
    navigate('/school/login', { replace: true });
  };

  const school = data?.primarySchool || null;
  const location = school
    ? [school.location.city, school.location.state, school.location.country]
        .filter(Boolean)
        .join(', ')
    : '';

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
            Tiny Steps School Partnership
          </p>

          {isLoading ? (
            <p className="mt-5 text-sm text-slate-600">Loading your school workspace…</p>
          ) : isError ? (
            <p className="mt-5 text-sm text-red-700">
              We could not load your school workspace. Please try again or contact the Tiny Steps team.
            </p>
          ) : !data?.access ? (
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
              Your School Admin account is active, but a school has not been assigned to this login yet. Please contact the Tiny Steps team.
            </p>
          ) : !school ? (
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
              No active school workspace is currently available for this account.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{school.name}</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">{school.schoolCode}</p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Contact Person" value={school.contact.name || 'Not provided'} />
                <Detail label="Designation" value={school.contact.designation || 'Not provided'} />
                <Detail label="Location" value={location || 'Not provided'} />
                <Detail
                  label="Learning Partner"
                  value={school.learningPartnerName || 'Not assigned yet'}
                />
                <Detail label="Partnership Status" value={school.status} />
              </dl>

              {data.schools.length > 1 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-950">
                    Linked campuses/schools: {data.schools.length}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
                    {data.schools.map((linkedSchool) => (
                      <li key={linkedSchool.id}>{linkedSchool.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-slate-900">{value}</dd>
    </div>
  );
}
