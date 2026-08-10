import React from 'react';
import { Link } from 'react-router-dom';

type AuthorProfile = {
  name: string;
  bio: string;
  role?: string;
  imageUrl?: string;
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
  className?: string;
};

const DEFAULT_AUTHOR: AuthorProfile = {
  name: 'Priya',
  role: 'Tiny Steps Founder',
  bio: 'With 10+ years of experience in early childhood English education, Priya founded Tiny Steps Learning to help children ages 3-12 build phonics, grammar, writing, and speaking confidence through calm, research-informed teaching.',
  imageUrl: '/priya-founder-tiny-steps-learning.webp',
};

const STANDARD_HIGHLIGHTS: AuthorHighlight[] = [
  { label: 'Ages served', value: '3-12 years' },
  { label: 'Focus areas', value: 'Phonics, grammar, speaking' },
  { label: 'Approach', value: 'Learning science + low-pressure routines' },
];

const RESEARCH_HIGHLIGHTS: AuthorHighlight[] = [
  { label: 'Research lens', value: 'Evidence summaries translated into parent actions' },
  { label: 'Classroom fit', value: 'Reviewed against live Tiny Steps teaching practice' },
  { label: 'Family context', value: 'Built for real homes, including multilingual families' },
];

const STANDARD_BADGES = ['Foundations Forever', 'Parent-first teaching'];
const RESEARCH_BADGES = ['Tiny Steps Research Desk', 'Reviewed for classroom use'];

const STANDARD_CTAS: AuthorCta[] = [
  { label: 'Explore the Parents Hub', to: '/parents', variant: 'secondary' },
  { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo', variant: 'primary' },
];

const RESEARCH_CTAS: AuthorCta[] = [
  { label: 'Explore the Parents Hub', to: '/parents', variant: 'secondary' },
  { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo', variant: 'primary' },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'TS';
}

export const AboutAuthor: React.FC<AboutAuthorProps> = ({
  author = DEFAULT_AUTHOR,
  variant = 'standard',
  title,
  intro,
  note,
  badges,
  highlights,
  ctas,
  className = '',
}) => {
  const isResearch = variant === 'research';
  const sectionTitle = title || (isResearch ? 'About the Author and Research Review' : 'About the Author');
  const sectionIntro =
    intro ||
    (isResearch
      ? 'This article was prepared through the Tiny Steps research workflow and checked against what actually works in live lessons, parent coaching, and multilingual home practice.'
      : 'Tiny Steps content is built for families who need clear next steps, strong foundations, and realistic home routines.');
  const sectionNote =
    note ||
    (isResearch
      ? 'Research pages on Tiny Steps are written to answer parent search intent, then tightened against classroom experience so the advice stays practical, calm, and usable.'
      : 'Every Tiny Steps guide is designed to reduce parent guesswork and turn teaching advice into small actions children can repeat with confidence.');
  const sectionBadges = badges || (isResearch ? RESEARCH_BADGES : STANDARD_BADGES);
  const sectionHighlights = highlights || (isResearch ? RESEARCH_HIGHLIGHTS : STANDARD_HIGHLIGHTS);
  const sectionCtas = ctas || (isResearch ? RESEARCH_CTAS : STANDARD_CTAS);
  const initials = getInitials(author.name);

  return (
    <section className={`mt-12 ${className}`.trim()}>
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
              {author.imageUrl ? (
                <figure className="m-0 h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-lg">
                  <img
                    src={author.imageUrl}
                    alt={
                      author.name === 'Priya'
                        ? 'Priya, Founder of Tiny Steps Learning, early childhood English educator'
                        : author.name
                    }
                    width={160}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                  <figcaption className="sr-only">
                    {author.name}
                    {author.role ? `, ${author.role}` : ''}
                  </figcaption>
                </figure>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#0f172a,#17315f)] text-xl font-black text-white shadow-lg">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">
                  {author.role || 'Tiny Steps'}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{author.name}</h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{author.bio}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Why this section matters</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{sectionIntro}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {sectionCtas.map((cta) => (
                <Link
                  key={cta.label}
                  to={cta.to}
                  className={
                    cta.variant === 'secondary'
                      ? 'inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50'
                      : 'inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Editorial note</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{sectionNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutAuthor;
