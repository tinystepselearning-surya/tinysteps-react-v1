import { ExternalLink } from 'lucide-react';
import { FOUNDER_PUBLIC_PROFILES } from '../../lib/founderProfiles';
import { OFFICIAL_PUBLIC_PROFILES } from '../../lib/officialProfiles';

// Compact source-backed identity links preserve discoverability without
// overwhelming the Team page's founder, teachers and teaching standards.
export function TeamOfficialLinksSection() {
  return (
    <section aria-label="Official Tiny Steps and founder profiles" className="border-t border-[#e9e8e4] bg-[#fffdf9] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <p className="shrink-0 text-sm font-semibold text-[#10243e]">Find Tiny Steps online</p>
          <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-3 text-sm leading-6">
            {OFFICIAL_PUBLIC_PROFILES.map((profile) => (
              <a key={profile.platform} href={profile.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 font-medium text-slate-600 underline-offset-4 transition hover:text-[#9a3412] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                aria-label={`Tiny Steps Learning on ${profile.platform} (opens in a new tab)`}>
                {profile.platform}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-8">
          <p className="shrink-0 text-sm font-semibold text-[#10243e]">Founder profiles</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm leading-6">
            {FOUNDER_PUBLIC_PROFILES.map((profile) => (
              <a key={profile.platform} href={profile.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 font-medium text-slate-600 underline-offset-4 transition hover:text-[#9a3412] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                aria-label={`Vannala Ravali Priya on ${profile.platform} (opens in a new tab)`}>
                {profile.platform}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
