import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createServiceSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Does Tiny Steps offer online English classes for kids in Hyderabad?',
    answer:
      'Yes. Tiny Steps offers live online English classes for children in Hyderabad, covering phonics, reading, grammar, sentence formation, and public speaking confidence.',
  },
  {
    question: 'Are the classes online or offline in Hyderabad?',
    answer:
      'Tiny Steps classes are conducted online through live teacher-guided sessions, so children can learn from home without travel.',
  },
  {
    question: 'Which course should my child start with?',
    answer:
      'The right course depends on the child\'s current level. Children with reading difficulty may need phonics or reading support, while children with sentence mistakes may need grammar. Children who are shy or give short answers may benefit from public speaking practice.',
  },
  {
    question: 'Do you offer phonics classes for kids in Hyderabad?',
    answer:
      'Yes. Tiny Steps offers online phonics classes for Hyderabad children who need help with letter sounds, blending, decoding, reading fluency, and confidence.',
  },
  {
    question: 'Is there a free assessment before joining?',
    answer:
      'Yes. Parents can book a free assessment to understand the child\'s current level and receive a suitable course recommendation before enrollment.',
  },
];

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
      name: 'Hyderabad Online English Classes',
      item: 'https://tinystepslearning.com/online-english-classes-hyderabad',
    },
  ],
};

export default function OnlineEnglishClassesHyderabadPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/online-english-classes-hyderabad#faq',
    };
    const serviceSchema = createServiceSchema({
      name: 'Online English Classes for Kids in Hyderabad',
      description:
        'Live online English classes for children in Hyderabad aged 3–12, covering phonics, reading, grammar, sentence formation, and public speaking confidence.',
      serviceType: 'Online English classes for kids',
      areaServed: 'Hyderabad, Telangana, India',
      audienceType: 'Children',
      url: 'https://tinystepslearning.com/online-english-classes-hyderabad',
    });

    applySeo({
      title: 'Online English Classes for Kids in Hyderabad | Tiny Steps Learning',
      description:
        'Live online English classes for kids in Hyderabad covering phonics, reading, grammar, sentence formation, and public speaking. Book a free assessment.',
      canonicalPath: '/online-english-classes-hyderabad',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, serviceSchema, faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online English Classes for Kids in Hyderabad</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-700">
          Live online English classes for Hyderabad children aged 3-12, focused on phonics, reading, grammar, sentence formation, and public speaking confidence.
        </p>
        <ul className="mx-auto mt-6 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• For children aged 3-12</li>
          <li>• 1:1 and small-group online classes</li>
          <li>• Phonics, Grammar, Reading, and Public Speaking paths</li>
          <li>• Free assessment before course recommendation</li>
        </ul>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">Which Tiny Steps class is right for your child?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Phonics Classes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Best for children who know letters but cannot read words confidently, guess words, or struggle with blending.
            </p>
            <Link to="/phonics" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
              Explore Phonics
            </Link>
          </article>

          <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Reading Classes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Best for children who read slowly, avoid passages, forget words, or need stronger fluency and comprehension.
            </p>
            <Link to="/reading-classes-for-kids" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
              Explore Reading Classes
            </Link>
          </article>

          <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Grammar Classes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Best for children who make sentence mistakes, struggle with tenses, punctuation, articles, prepositions, or writing clear sentences.
            </p>
            <Link to="/grammar" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
              Explore Grammar
            </Link>
          </article>

          <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Public Speaking Classes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Best for children who give one-word answers, feel shy, speak unclearly, or need confidence while expressing ideas.
            </p>
            <Link to="/speaking" className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700">
              Explore Public Speaking
            </Link>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why Hyderabad parents choose online classes</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Saves travel time across Hyderabad traffic.</li>
          <li>• Children learn from home in a familiar environment.</li>
          <li>• Parents can choose convenient weekday or weekend slots based on availability.</li>
          <li>• Live teacher guidance gives correction, not just recorded videos.</li>
          <li>• The course path is chosen after checking the child&apos;s level.</li>
        </ul>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          Need the broader India and worldwide page instead? Visit <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-4">online English classes for kids</Link> for the national parent-money page.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How the free assessment works</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">1. Child profile and concerns</h3>
            <p className="mt-2 text-sm text-slate-700">
              We understand your child&apos;s age, school level, and parent concerns.
            </p>
          </article>
          <article className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">2. Skill-level check</h3>
            <p className="mt-2 text-sm text-slate-700">
              We check phonics, reading, grammar, sentence formation, or speaking needs.
            </p>
          </article>
          <article className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">3. Path recommendation</h3>
            <p className="mt-2 text-sm text-slate-700">
              We recommend the right path: Phonics, Reading, Grammar, Public Speaking, or combined support.
            </p>
          </article>
          <article className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">4. Next-step guidance</h3>
            <p className="mt-2 text-sm text-slate-700">
              Parents receive clear next-step guidance before enrollment.
            </p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Not sure which English class your child needs?</h2>
        <p className="mx-auto mt-3 max-w-3xl text-slate-200">
          Start with a free assessment. Tiny Steps will check your child&apos;s current level and recommend the right starting point for phonics, reading, grammar, sentence formation, or public speaking.
        </p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
