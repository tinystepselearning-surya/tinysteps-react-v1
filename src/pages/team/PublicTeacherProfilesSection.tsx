import { GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APPROVED_PUBLIC_TEACHER_PROFILES } from './publicTeacherProfiles';

/**
 * Public teacher roster is deliberately separate from authenticated teacher records.
 * No personal data or unverified qualifications are exposed automatically.
 */
export default function PublicTeacherProfilesSection() {
  return (
    <section id="our-teachers" aria-labelledby="our-teachers-heading" className="bg-[#fffaf3] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Our educators</p>
        <h2 id="our-teachers-heading" className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Meet our teachers and their qualifications
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Our educators support Phonics, Reading, Grammar, Writing and Public Speaking. We review English
          communication, subject understanding, child interaction and teaching readiness, and provide
          programme-specific preparation and academic feedback.
        </p>
        {APPROVED_PUBLIC_TEACHER_PROFILES.length > 0 ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {APPROVED_PUBLIC_TEACHER_PROFILES.map((teacher) => (
              <article key={teacher.publicName} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                  <GraduationCap className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-950">{teacher.publicName}</h3>
                <p className="mt-1 text-sm font-semibold text-orange-700">{teacher.position}</p>
                <p className="mt-4 text-sm font-bold text-slate-900">Verified qualifications</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-700">
                  {teacher.qualifications.map((qualification) => <li key={qualification}>{qualification}</li>)}
                </ul>
                <p className="mt-4 text-sm font-bold text-slate-900">Teaching specialisms</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{teacher.specialisms.join(' · ')}</p>
                {teacher.experienceSummary && <p className="mt-3 text-sm leading-6 text-slate-600">{teacher.experienceSummary}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-orange-100 bg-white p-6">
              <UsersRound className="h-7 w-7 text-orange-700" aria-hidden="true" />
              <h3 className="mt-4 font-heading text-lg font-bold text-slate-950">Teacher background and expertise</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Individual profiles will be published as qualification details are verified and educators
                approve their public display. We do not publish private teacher contact details.
              </p>
            </div>
            <div className="rounded-3xl border border-orange-100 bg-white p-6">
              <ShieldCheck className="h-7 w-7 text-orange-700" aria-hidden="true" />
              <h3 className="mt-4 font-heading text-lg font-bold text-slate-950">Ask about your child&apos;s educator</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Parents can ask our academic team about the experience, qualifications and
                subject specialisms relevant to a proposed teacher.
              </p>
              <Link to="/contact" className="mt-4 inline-flex min-h-11 items-center font-semibold text-orange-700 underline underline-offset-4 hover:text-orange-800">
                Contact our academic team
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
