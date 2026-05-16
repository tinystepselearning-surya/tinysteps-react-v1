import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import PublicAssessmentForm from '../../components/forms/PublicAssessmentForm';

const assessmentFaqItems = [
  {
    question: 'Is the Tiny Steps assessment class free?',
    answer:
      'Yes. The Tiny Steps assessment class is free. It helps parents understand the child\'s current English level and the right learning path before choosing a course.',
  },
  {
    question: 'What will be checked in the assessment?',
    answer:
      'The assessment may check phonics, reading, grammar, sentence formation, and speaking confidence depending on the child\'s age and current level.',
  },
  {
    question: 'How long is the assessment class?',
    answer:
      'The assessment is usually a short live online session designed to understand the child\'s level and recommend the right next step.',
  },
  {
    question: 'Will parents get a course recommendation?',
    answer:
      'Yes. Parents receive a clear recommendation on whether the child should start with phonics, grammar, reading, public speaking, or a combined learning path.',
  },
  {
    question: 'Is there pressure to enroll after the assessment?',
    answer:
      'No. The assessment is meant to give parents clarity. Families can decide after understanding the child\'s needs and the recommended learning path.',
  },
];

export default function BookDemoPage() {
  useEffect(() => {
    applySeo({
      title: 'Book Free English Assessment Class for Kids | Tiny Steps Learning',
      description:
        'Book a free 1:1 online English assessment for your child. Understand their level in phonics, reading, grammar, sentence formation, and speaking confidence.',
      canonicalPath: '/book-demo',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Free Assessment Class',
          description: 'Free 1:1 English assessment for kids ages 3-12',
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Tiny Steps Learning',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        },
        createFAQPageSchema(assessmentFaqItems),
      ],
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-5xl px-6 py-14 text-center md:py-16">
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
          Book a Free English Assessment Class for Your Child
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-700">
          A friendly 1:1 online assessment to understand your child&apos;s current level in phonics, reading, grammar, sentence formation, and speaking confidence.
        </p>

        <ul className="mx-auto mt-6 grid max-w-3xl gap-3 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">For children aged 3–12</li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">Live online assessment</li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">Personalized course recommendation</li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">No pressure to enroll</li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#assessment-form"
            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            Book Free Assessment
          </a>
          <Link
            to="/courses"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Explore Courses
          </Link>
        </div>

        <div id="assessment-form" className="mx-auto mt-12 max-w-2xl">
          <PublicAssessmentForm source="book_demo_page" autoFocusFirstField />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">What happens in the assessment?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Understand Current Stage</h3>
            <p className="text-gray-600">We understand your child&apos;s age and current English level.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Skill Check</h3>
            <p className="text-gray-600">
              We check reading, phonics, grammar, sentence formation, or speaking needs based on the child&apos;s stage.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Path Recommendation</h3>
            <p className="text-gray-600">
              We identify the right learning path: Phonics, Grammar, Reading, or Public Speaking.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <span className="text-2xl font-bold text-orange-600">4</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Clear Next Step</h3>
            <p className="text-gray-600">Parents receive a clear recommendation for the next step.</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Who should book this?</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <ul className="space-y-3 text-gray-700">
              <li>• Your child knows letters but cannot read words confidently.</li>
              <li>• Your child reads slowly or guesses words.</li>
              <li>• Your child speaks in one-word answers or short broken sentences.</li>
              <li>• Your child knows grammar rules but makes mistakes while speaking or writing.</li>
              <li>• Your child is shy or lacks confidence while speaking.</li>
              <li>• You are unsure which Tiny Steps course is right.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">Assessment outcomes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Current level clarity</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Right course recommendation</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Suggested learning path</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Parent-friendly next steps</div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Book your free assessment class today. No commitment required.
        </p>
        <a
          href="#assessment-form"
          className="inline-block rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          Book Free Assessment Now
        </a>
      </section>
    </div>
  );
}
