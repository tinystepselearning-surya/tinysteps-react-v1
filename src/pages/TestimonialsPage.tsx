import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  STATIC_TESTIMONIALS_BY_PROGRAM,
  TESTIMONIAL_PROGRAM_ORDER,
  type StaticTestimonial,
} from '../lib/staticTestimonials';
import { createFAQPageSchema } from '../lib/schemas';

const faqItems = [
  {
    question: 'What do parents say about Tiny Steps Learning?',
    answer:
      'Parents often look for child-friendly teaching, visible progress, structured practice, and clear communication. Tiny Steps focuses on helping parents understand what their child is learning and what needs more practice.',
  },
  {
    question: 'Can Tiny Steps help children who are not confident in English?',
    answer:
      'Tiny Steps supports children through guided live practice in phonics, reading, grammar, sentence formation, and public speaking so they can build confidence step by step.',
  },
  {
    question: 'How do parents know if their child is improving?',
    answer:
      'Parents receive updates about the child’s learning, strengths, practice needs, and next steps. Progress is built gradually through stage-wise learning and teacher-guided correction.',
  },
  {
    question: 'Are Tiny Steps classes suitable for shy children?',
    answer:
      'Yes. Tiny Steps uses gentle prompts, child-friendly topics, and repeated speaking opportunities to help shy children participate more comfortably.',
  },
  {
    question: 'Should I book a class directly or start with assessment?',
    answer:
      'It is better to start with a free 35-minute 1:1 online demo assessment class. The assessment helps identify the child’s current level and the most suitable course path.',
  },
];

const faqSchema = {
  ...createFAQPageSchema(faqItems),
  '@id': 'https://tinystepslearning.com/testimonials#faq',
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
      item: 'https://tinystepslearning.com/testimonials',
    },
  ],
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
        title="Tiny Steps Learning Reviews and Parent Stories"
        description="Read parent stories about Tiny Steps Learning and how children build confidence in phonics, reading, grammar, sentence formation, and public speaking."
        canonical="https://tinystepslearning.com/testimonials"
        jsonLd={[breadcrumbSchema, faqSchema]}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Stories</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Parent Stories and Tiny Steps Learning Reviews</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
          See how parents describe their child’s progress in phonics, reading, grammar, sentence formation, and public speaking through Tiny Steps live online classes.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li>• Parent-friendly progress communication</li>
          <li>• Child-focused live online classes</li>
          <li>• Reading, grammar, and speaking confidence support</li>
          <li>• One free 35-minute 1:1 demo assessment class before course recommendation</li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Explore Courses
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">What parents usually notice first</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• Children become more willing to participate.</li>
            <li>• Reading and blending confidence improves gradually.</li>
            <li>• Sentence formation becomes clearer with guided practice.</li>
            <li>• Children start giving longer answers instead of only short responses.</li>
            <li>• Parents understand what the child is learning and what needs practice.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">How Tiny Steps builds visible progress</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>• One free 35-minute 1:1 demo assessment class to understand the child’s starting level.</li>
            <li>• Structured course path instead of random worksheets.</li>
            <li>• Live teacher correction during reading, speaking, and writing practice.</li>
            <li>• Parent updates after classes or learning milestones.</li>
            <li>• Stage-wise movement from basics to confidence.</li>
          </ul>
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

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Want to see the right path for your child?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
            Start with a free 35-minute 1:1 online demo assessment class. Tiny Steps will check your child’s current level and recommend the right starting point for phonics, reading, grammar, sentence formation, or public speaking.
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
