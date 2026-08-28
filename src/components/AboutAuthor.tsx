import React from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_FACTS } from '../lib/schemas';

type AuthorProfile = {
  name: string;
  bio: string;
  role?: string;
  imageUrl?: string;
  profilePath?: string;
};

type AuthorHighlight = {
  label: string;
  value: string;
};

type AuthorCta = {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary';
};

type AboutAuthorProps = {
  author?: AuthorProfile;
  variant?: 'standard' | 'research';
  title?: string;
  intro?: string;
  note?: string;
  badges?: string[];
  highlights?: AuthorHighlight[];
  ctas?: AuthorCta[];
  evidenceLabel?: string;
  reviewLabel?: string;
  className?: string;
};

const DEFAULT_AUTHOR: AuthorProfile = {
  name: PUBLIC_FACTS.founder.displayName,
  role: `Founder, ${PUBLIC_FACTS.brandName}`,
  bio: `Priya is the founder of ${PUBLIC_FACTS.brandName} and leads academic direction across curriculum, lesson design, teacher guidance, teaching quality, and parent communication.`,
  imageUrl: '/priya-founder-tiny-steps-learning.webp',
  profilePath: '/team',
};

const RESEARCH_AUTHOR: AuthorProfile = {
  name: PUBLIC_FACTS.brandName,
  role: 'Research Desk',
  bio: `${PUBLIC_FACTS.brandName} publishes research-labelled parent explainers under the school's academic editorial responsibility. External evidence is identified with source links where it is used.`,
  profilePath: '/team',
};

const STANDARD_HIGHLIGHTS: AuthorHighlight[] = [
  { label: 'Editorial scope', value: 'Phonics, reading, grammar, writing, and speaking' },
  { label: 'Publisher', value: PUBLIC_FACTS.brandName },
  { label: 'Corrections', value: 'Contact Tiny Steps if you spot an error or outdated claim' },
];

const RESEARCH_HIGHLIGHTS: AuthorHighlight[] = [
  { label: 'Evidence standard', value: 'External sources are linked where claims rely on outside evidence' },
  { label: 'Editorial responsibility', value: PUBLIC_FACTS.brandName },
  { label: 'Update standard', value: 'Dates change only when a meaningful editorial revision is recorded' },
];

const STANDARD_BADGES = ['Author identified', 'Editorial responsibility'];
const RESEARCH_BADGES = ['Research Desk', 'Source transparency'];

const STANDARD_CTAS: AuthorCta[] = [
  { label: 'Meet the Tiny Steps team', to: '/team', variant: 'secondary' },
  { label: 'Report a correction', to: '/contact', variant: 'secondary' },
];

const RESEARCH_CTAS: AuthorCta[] = [
  { label: 'Meet the Tiny Steps team', to: '/team', variant: 'secondary' },
  { label: 'Report a correction', to: '/contact', variant: 'secondary' },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'TS';
}

export const AboutAuthor: React.FC<AboutAuthorProps> = ({
  author,
  variant = 'standard',
  title,
  intro,
  note,
  badges,
  highlights,
  ctas,
  evidenceLabel,
  reviewLabel,
  className = '',
}) => {
  const isResearch = variant === 'research';
  const resolvedAuthor = author || (isResearch ? RESEARCH_AUTHOR : DEFAULT_AUTHOR);
  const sectionTitle = title || (isResearch ? 'Authorship and Editorial Responsibility' : 'About the Author');
  const sectionIntro =
    intro ||
    (isResearch
      ? 'This page identifies who is responsible for the article and distinguishes cited external evidence from Tiny Steps editorial guidance.'
      : 'This page identifies the responsible author or editorial team so readers can see who stands behind the guidance.');
  const sectionNote =
    note ||
    'Published dates are retained. An updated or reviewed date should appear only when a meaningful editorial revision is explicitly recorded.';
  const sectionBadges = badges || (isResearch ? RESEARCH_BADGES : STANDARD_BADGES);
  const sectionHighlights = highlights || (isResearch ? RESEARCH_HIGHLIGHTS : STANDARD_HIGHLIGHTS);
  const sectionCtas = ctas || (isResearch ? RESEARCH_CTAS : STANDARD_CTAS);
  const initials = getInitials(resolvedAuthor.name);
  const authorName = resolvedAuthor.profilePath ? (
    <Link
      to={resolvedAuthor.profilePath}
      className="rounded-sm underline decoration-slate-300 underline-offset-4 transition hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      {resolvedAuthor.name}
    </Link>
  ) : resolvedAuthor.name;

  return (
    <section className={`mt-12 ${className}`.trim()} aria-label="Article authorship and editorial information">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#fff8ef_0%,#f8fbff_58%,#ffffff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200/80 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-700">
              {sectionTitle}
            </span>
            {sectionBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {resolvedAuthor.imageUrl ? (
                <figure className="m-0 h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-lg">
                  <img
                    src={resolvedAuthor.imageUrl}
                    alt={
                      resolvedAuthor.name === PUBLIC_FACTS.founder.displayName
                        ? 'Priya, Founder of Tiny Steps Learning'
                        : resolvedAuthor.name
                    }
                    width={160}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                  <figcaption className="sr-only">
                    {resolvedAuthor.name}
                    {resolvedAuthor.role ? `, ${resolvedAuthor.role}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#0f172a,#17315f)] text-xl font-black text-white shadow-lg">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">
                  {resolvedAuthor.role || 'Tiny Steps'}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{authorName}</h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{resolvedAuthor.bio}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editorial responsibility</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{sectionIntro}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {sectionCtas.map((cta) => (
                <Link
                  key={cta.label}
                  to={cta.to}
                  className={
                    cta.variant === 'primary'
                      ? 'inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
                      : 'inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50'
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {evidenceLabel ? (
              <div className="rounded-[1.6rem] border border-sky-100 bg-sky-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Evidence on this page</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{evidenceLabel}</p>
              </div>
            ) : null}

            {reviewLabel ? (
              <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Review status</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{reviewLabel}</p>
              </div>
            ) : null}

            {sectionHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.6rem] border border-slate-200/90 bg-white/90 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{item.value}</p>
              </div>
            ))}

            <div className="rounded-[1.6rem] border border-primary-100 bg-primary-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Update policy</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{sectionNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutAuthor;
