import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  STATIC_TESTIMONIALS_BY_PROGRAM,
  TESTIMONIAL_PROGRAM_ORDER,
  type StaticTestimonial,
} from '../lib/staticTestimonials';
import { createFAQPageSchema, createWebPageSchema } from '../lib/schemas';

const CANONICAL_URL = 'https://tinystepslearning.com/testimonials';

const faqItems = [
  {
    question: 'What do parents say about Tiny Steps Learning?',
    answer:
      'This page publishes a curated set of first-party parent feedback excerpts across Tiny Steps phonics, grammar, and public speaking programs. They describe individual family experiences and should be used as one decision signal alongside class samples, curriculum, pricing, and your child’s own demo assessment.',
  },
  {
    question: 'Do parent reviews guarantee the same result for my child?',
    answer:
      'No. Every child starts at a different level and progresses at a different pace. Parent feedback can show the kinds of changes families noticed, but it is not a promise or guarantee of a particular outcome.',
  },
  {
    question: 'How should I use reviews when choosing an online English program?',
    answer:
      'Look for repeated themes such as teacher attention, structured practice, correction, child participation, and parent communication. Then verify those points by watching class samples, reviewing the curriculum and pricing, and using the free demo assessment to check your child’s fit.',
  },
  {
    question: 'Can I see actual classes and pricing before I decide?',
    answer:
      'Yes. Parents can review Tiny Steps class samples, the curriculum roadmap, and current pricing before booking or enrolling. The free demo assessment then helps identify the child’s current level and recommended starting point.',
  },
  {
    question: 'How do parents know if their child is improving?',
    answer:
      'Parents receive updates about the child’s learning, strengths, practice needs, and next steps. Progress is built gradually through stage-wise learning and teacher-guided correction.',
  },
  {
    question: 'Should I book a class directly or start with assessment?',
    answer:
      'It is better to start with a free 35-minute 1:1 online demo assessment class. The assessment helps identify the child’s current level and the most suitable course path.',
  },
];

const faqSchema = {
  ...createFAQPageSchema(faqItems),
  '@id': `${CANONICAL_URL}#faq`,
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://tinystepslearning.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Testimonials',
      item: CANONICAL_URL,
    },
  ],
};

const webpageSchema = createWebPageSchema({
  name: 'Tiny Steps Learning parent feedback and review evidence',
  description:
    'Curated first-party parent feedback excerpts across Tiny Steps phonics, grammar and public speaking programs, with links to class samples, curriculum, pricing and the free assessment.',
  url: CANONICAL_URL,
});

const reviewDecisionSignals = [
  {
    title: 'Look for repeated teaching themes',
    description: 'Notice patterns such as teacher attention, structured practice, correction, participation and parent communication.',
  },
  {
    title: 'Watch the teaching in practice',
    description: 'Use real class samples to check pacing, child participation and how teachers respond to mistakes.',
  },
  {
    title: 'Check the roadmap and price',
    description: 'Review the curriculum and current pricing so the learning path and practical commitment are clear before enrolment.',
  },
  {
    title: 'Verify fit with your own child',
    description: 'Use the free demo assessment to understand the child’s starting level and recommended next step.',
  },
];

const reviewDecisionSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${CANONICAL_URL}#decision-signals`,
  name: 'How parents can use Tiny Steps feedback when deciding',
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: reviewDecisionSignals.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.title,
    description: item.description,
  })),
};

function ReviewCard({ item }: { item: StaticTestimonial }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-amber-600" aria-label="5 out of 5 stars">
        {'★'.repeat(item.rating)}
      </p>
      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">“{item.quote}”</p>
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
        title="Tiny Steps Learning Reviews and Parent Feedback"
        description="Read curated first-party parent feedback across Tiny Steps phonics, grammar and public speaking programs, then compare class samples, curriculum and pricing before deciding."
        canonical={CANONICAL_URL}
        jsonLd={[breadcrumbSchema, webpageSchema, reviewDecisionSchema, faqSchema]}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Feedback</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Parent Feedback and Tiny Steps Learning Reviews</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
          Read curated first-party feedback excerpts from Tiny Steps families across phonics, grammar, and public speaking programs. Use these experiences as one part of your decision—not as a guarantee of the result another child will have.
        </p>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-slate-700">
          <strong className="text-slate-900">How to read this page:</strong> individual children start at different levels and progress at different speeds. Compare the themes in parent feedback with the teaching you can observe in class samples, the curriculum roadmap, current pricing, and your child’s own demo assessment.
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/class-samples"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Watch Class Samples
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Check Pricing
          </Link>
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Book Free 35-Minute Demo
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">Themes parents describe in these reviews</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• Greater willingness to participate in guided learning.</li>
            <li>• More confidence with reading, blending, sentence formation, or speaking.</li>
            <li>• Teacher correction that is specific and encouraging.</li>
            <li>• Structured practice instead of disconnected activities.</li>
            <li>• Clearer parent visibility of what is being practised next.</li>
          </ul>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            These are themes within the curated excerpts shown below. They are not universal claims about every learner.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">How to use parent feedback before you decide</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reviewDecisionSignals.map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Step {index + 1}</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link to="/class-samples" className="text-slate-700 underline underline-offset-4">Class samples</Link>
            <Link to="/curriculum" className="text-slate-700 underline underline-offset-4">Curriculum roadmap</Link>
            <Link to="/pricing" className="text-slate-700 underline underline-offset-4">Current pricing</Link>
            <Link to="/book-demo" className="text-slate-700 underline underline-offset-4">Free assessment</Link>
          </div>
        </section>

        <div className="mt-10 space-y-10">
          {TESTIMONIAL_PROGRAM_ORDER.map((program) => {
            const items = STATIC_TESTIMONIALS_BY_PROGRAM[program].slice(0, 5);
            return (
              <section key={program}>
                <h2 className="text-2xl font-bold text-slate-900">{program}</h2>
                <p className="mt-1 text-sm text-slate-600">5 curated first-party parent feedback excerpts</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <ReviewCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Verify the fit with your own child</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
            Parent feedback can help you understand recurring experiences, but the strongest decision evidence is your child’s own response. Start with a free 35-minute 1:1 online demo assessment class, then review the recommended path, class format, and current pricing before enrolling.
          </p>
          <Link
            to="/book-demo"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free 35-Minute Demo
          </Link>
        </section>
      </section>
    </main>
  );
}
