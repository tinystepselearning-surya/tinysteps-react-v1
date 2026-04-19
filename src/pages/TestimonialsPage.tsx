import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  STATIC_TESTIMONIALS_BY_PROGRAM,
  TESTIMONIAL_PROGRAM_ORDER,
  type StaticTestimonial,
} from '../lib/staticTestimonials';

const quickAnswerFaqItems = [
  {
    question: 'Why do we keep only a small sample on this page?',
    answer:
      'This page shows a curated sample so parents can quickly understand class experience. Ongoing public feedback is encouraged on trusted third-party review platforms.',
  },
  {
    question: 'What do these parent reviews usually cover?',
    answer:
      'Most reviews mention reading confidence, phonics blending, grammar clarity, sentence formation, speaking confidence, and teacher attention during live classes.',
  },
  {
    question: 'Do all children progress at the same pace?',
    answer:
      'No. Progress depends on starting level, consistency, participation, and home practice support. The learning pathway is structured, but pace is child-specific.',
  },
  {
    question: 'How should parents use this page?',
    answer:
      'Use these reviews as examples of parent experience, then match them with your child’s current learning need before choosing a program track.',
  },
];

const quickAnswerFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/testimonials#quick-answer-faq',
  mainEntity: quickAnswerFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

function ReviewCard({ item }: { item: StaticTestimonial }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-amber-600" aria-label="5 out of 5 stars">
        {'★'.repeat(item.rating)}
      </p>
      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">"{item.quote}"</p>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">— {item.parentName}</p>
        {typeof item.childAge === 'number' ? (
          <p className="text-xs text-slate-500">Parent of a {item.childAge}-year-old learner</p>
        ) : null}
        {item.location ? <p className="text-xs text-slate-500">{item.location}</p> : null}
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.source}</p>
      </div>
    </article>
  );
}

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Meta
        title="Parent Reviews | Tiny Steps Learning"
        description="Browse a curated sample of parent feedback across Tiny Steps phonics, grammar, and public speaking programs."
        canonical="https://tinystepslearning.com/testimonials"
        jsonLd={[quickAnswerFaqSchema]}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Feedback</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Parent Feedback Across Programs</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
          Tiny Steps continues to collect ongoing parent feedback through trusted third-party platforms.
          We keep a small, curated sample here so families can review class experiences quickly.
        </p>
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          For fresh public reviews, parents may also check our third-party review profiles such as Trustpilot, JustDial, and Reddit.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/why-tiny-steps#share-feedback"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Share parent feedback
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Explore courses
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 space-y-10">
          {TESTIMONIAL_PROGRAM_ORDER.map((program) => {
            const items = STATIC_TESTIMONIALS_BY_PROGRAM[program].slice(0, 5);
            return (
              <section key={program}>
                <h2 className="text-2xl font-bold text-slate-900">{program}</h2>
                <p className="mt-1 text-sm text-slate-600">5 curated parent reviews</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <ReviewCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
