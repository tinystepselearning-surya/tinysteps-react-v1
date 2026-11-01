import { Link } from 'react-router-dom';

export type FacultyTrack = 'phonics' | 'grammar' | 'speaking';

const FACULTY_BY_TRACK: Record<FacultyTrack, { title: string; description: string; destination: string; linkLabel: string }> = {
  phonics: {
    title: 'The educators behind our Phonics & Reading programme',
    description: 'Explore the teaching specialisms, internal training and academic guidance supporting our phonics and reading lessons.',
    destination: '/team#teachers-phonics',
    linkLabel: 'Meet our Phonics & Reading educators',
  },
  grammar: {
    title: 'The educators behind our Grammar programme',
    description: 'Learn about our grammar and writing teaching expertise, teacher development and classroom quality practices.',
    destination: '/team#teachers-grammar',
    linkLabel: 'Meet our Grammar & Writing educators',
  },
  speaking: {
    title: 'The educators behind our Public Speaking programme',
    description: 'Discover how our communication educators are supported by programme-specific training and academic guidance.',
    destination: '/team#teachers-public-speaking',
    linkLabel: 'Meet our Public Speaking educators',
  },
};

/** One reusable, factual faculty link for the premium and group programme pages. */
export default function FacultyTrustLink({ track }: { track: FacultyTrack }) {
  const content = FACULTY_BY_TRACK[track];
  return (
    <section aria-label="Our teachers and academic training" className="bg-[#fffaf3] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-3xl border border-orange-100 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Our academic faculty</p>
          <h2 className="mt-2 font-heading text-xl font-bold text-slate-950 sm:text-2xl">{content.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{content.description}</p>
        </div>
        <Link
          to={content.destination}
          className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-full border border-orange-300 bg-orange-50 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-orange-100 sm:self-auto"
        >
          {content.linkLabel}
        </Link>
      </div>
    </section>
  );
}
