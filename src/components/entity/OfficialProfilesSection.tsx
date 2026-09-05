import { ExternalLink, ShieldCheck } from 'lucide-react';
import { OFFICIAL_PUBLIC_PROFILES } from '../../lib/officialProfiles';
import { PINTEREST_PROFILE } from '../../lib/pinterestProfile';
import { PUBLIC_FACTS } from '../../lib/schemas';

const visibleProfiles = [...OFFICIAL_PUBLIC_PROFILES, PINTEREST_PROFILE];

export function OfficialProfilesSection() {
  return (
    <section
      aria-labelledby="official-tiny-steps-profiles"
      className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Official identity
            </div>
            <h2
              id="official-tiny-steps-profiles"
              className="mt-3 font-heading text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-3xl"
            >
              Find {PUBLIC_FACTS.organizationName} online
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              These are the public profiles Tiny Steps uses alongside tinystepslearning.com. Keeping the same name,
              website and learning focus across these profiles helps families identify the official Tiny Steps presence.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Official Tiny Steps public profiles">
            {visibleProfiles.map((profile) => (
              <li key={profile.platform}>
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-orange-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
                  aria-label={`${PUBLIC_FACTS.brandName} on ${profile.platform} (opens in a new tab)`}
                >
                  <span>
                    <span className="block text-sm font-bold text-slate-950">{profile.platform}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{profile.purpose}</span>
                  </span>
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-orange-600"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
