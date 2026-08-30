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
  role: `Founder & Academic Lead, ${PUBLIC_FACTS.brandName}`,
  bio: `Priya leads ${PUBLIC_FACTS.brandName}'s academic direction across phonics, reading, grammar, writing, and communication, including curriculum design, teacher guidance, and teaching quality.`,
  imageUrl: '/priya-founder-tiny-steps-learning.webp',
  profilePath: '/team',
};

const RESEARCH_AUTHOR: AuthorProfile = {
  name: PUBLIC_FACTS.brandName,
  role: 'Research Desk',
  bio: `${PUBLIC_FACTS.brandName} publishes evidence-led parent explainers and links external sources where claims rely on outside evidence.`,
  profilePath: '/team',
};

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
  highlights,
  ctas,
  evidenceLabel,
  reviewLabel,
  className = '',
}) => {
  const isResearch = variant === 'research';
  const resolvedAuthor = author || (isResearch ? RESEARCH_AUTHOR : DEFAULT_AUTHOR);
  const sectionTitle = title || (isResearch ? 'About the Research Team' : 'About the Author');
  const sectionIntro = intro || (isResearch
    ? 'External evidence is linked where it is used, while Tiny Steps guidance is identified as editorial guidance.'
    : '');
  const sectionHighlights = highlights || [];
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
    <section className={`mt-12 ${className}`.trim()} aria-label="Article author information">
      <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#fffaf4_0%,#f8fbff_72%,#ffffff_100%)] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{sectionTitle}</p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          {resolvedAuthor.imageUrl ? (
            <figure className="m-0 h-20 w-20 shrink-0 overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-md">
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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#0f172a,#17315f)] text-xl font-black text-white shadow-md">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {resolvedAuthor.role ? (
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">{resolvedAuthor.role}</p>
            ) : null}
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{authorName}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{resolvedAuthor.bio}</p>
            {sectionIntro ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{sectionIntro}</p>
            ) : null}

            {(reviewLabel || evidenceLabel) ? (
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {reviewLabel ? (
                  <p>
                    <span className="font-semibold text-slate-900">Reviewed/updated:</span> {reviewLabel}
                  </p>
                ) : null}
                {evidenceLabel ? (
                  <p>
                    <span className="font-semibold text-slate-900">Sources:</span> {evidenceLabel}
                  </p>
                ) : null}
              </div>
            ) : null}

            {sectionHighlights.length ? (
              <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
                {sectionHighlights.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-700">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {note ? <p className="mt-4 text-xs leading-6 text-slate-500">{note}</p> : null}

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
        </div>
      </div>
    </section>
  );
};

export default AboutAuthor;
