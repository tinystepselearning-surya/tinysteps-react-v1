import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import TinyStepsBrand from '../../components/common/TinyStepsBrand';
import { performAppLogout } from '../../lib/auth';
import { getSchoolPortalAccess } from '../../services/schoolService';
import type { SchoolRecord } from '../../types/School';
import { useAuthStore } from '../../store/useAuthStore';
import SchoolProgrammeWorkspace from '../schools/SchoolProgrammeWorkspace';

export default function SchoolPortalFoundationPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!data?.schools.length) {
      setSelectedSchoolId(null);
      return;
    }
    setSelectedSchoolId((current) => {
      if (current && data.schools.some((school) => school.id === current)) return current;
      return data.primarySchool?.id || data.schools[0]?.id || null;
    });
  }, [data]);

  const handleLogout = async () => {
    await performAppLogout('user-clicked-logout');
    navigate('/school/login', { replace: true });
  };

  const school: SchoolRecord | null =
    data?.schools.find((item) => item.id === selectedSchoolId) ||
    data?.primarySchool ||
    null;

  const location = school
    ? [school.location.city, school.location.state, school.location.country]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TinyStepsBrand subtitle="School Partnership" />
          <div className="flex flex-wrap items-center gap-2">
            {data && data.schools.length > 1 && (
              <select
                aria-label="Select school or campus"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                value={selectedSchoolId || ''}
                onChange={(event) => setSelectedSchoolId(event.target.value || null)}
              >
                {data.schools.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>

        {isLoading ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Loading your school workspace…
          </section>
        ) : isError ? (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-sm text-red-700 shadow-sm">
            We could not load your school workspace. Please try again or contact the Tiny Steps team.
          </section>
        ) : !data?.access ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm leading-6 text-slate-600 shadow-sm">
            Your School Admin account is active, but a school has not been assigned to this login yet. Please contact the Tiny Steps team.
          </section>
        ) : !school ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm leading-6 text-slate-600 shadow-sm">
            No active school workspace is currently available for this account.
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                Tiny Steps School Partnership
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{school.name}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">{school.schoolCode}</p>
                </div>
                <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                  {school.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Contact Person" value={school.contact.name || 'Not provided'} />
                <Detail label="Designation" value={school.contact.designation || 'Not provided'} />
                <Detail label="Location" value={location || 'Not provided'} />
                <Detail label="Learning Partner" value={school.learningPartnerName || 'Not assigned yet'} />
              </dl>

              {data.schools.length > 1 && (
                <p className="mt-4 text-xs text-slate-500">
                  This login has access to {data.schools.length} linked schools/campuses. Use the selector above to switch views.
                </p>
              )}
            </section>

            <SchoolProgrammeWorkspace school={school} canEdit={false} defaultTab="overview" />
          </div>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
