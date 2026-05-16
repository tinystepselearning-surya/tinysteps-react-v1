import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Who needs online reading classes?',
    answer:
      'Online reading classes can help children who read slowly, guess words, avoid reading, forget words often, or struggle to understand short passages and stories.',
  },
  {
    question: 'Are reading classes different from phonics classes?',
    answer:
      'Yes. Phonics classes focus on decoding sounds and words. Reading classes focus more on fluency, accuracy, expression, comprehension, and confidence while reading sentences and passages.',
  },
  {
    question: 'What age group is reading support suitable for?',
    answer:
      'Reading support is suitable for children who are ready for words, sentences, or passages, usually from around age 4 onward, depending on the child’s current level.',
  },
  {
    question: 'Will reading classes improve comprehension?',
    answer:
      'Yes. Reading classes can support comprehension by helping children read carefully, understand meaning, discuss story ideas, and answer simple questions after reading.',
  },
  {
    question: 'How do I know if my child needs phonics or reading support?',
    answer:
      'A free assessment helps identify whether the child needs phonics, blending, fluency, comprehension, grammar, or a combined learning path.',
  },
];

export default function ReadingClassesForKidsPage() {
  useEffect(() => {
    const courseSchema = createCourseSchema({
      name: 'Online Reading Classes for Kids',
      description:
        'Live online reading classes for children aged 4–12 who need support with reading fluency, passage reading, comprehension, accuracy, and reading confidence.',
      url: 'https://tinystepslearning.com/reading-classes-for-kids',
      educationalLevel: 'Foundation to Intermediate',
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/reading-classes-for-kids#faq',
    };

    applySeo({
      title: 'Online Reading Classes for Kids | Tiny Steps Learning',
      description:
        'Live online reading classes for kids who read slowly, guess words, avoid passages, or need stronger fluency, comprehension, and reading confidence.',
      canonicalPath: '/reading-classes-for-kids',
      ogType: 'website',
      jsonLd: [courseSchema, faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online Reading Classes for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Live guided reading support for children who read slowly, guess words, forget words, or need stronger fluency, comprehension, and reading confidence.
        </p>
        <ul className="mx-auto mt-5 grid max-w-2xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• For children aged 4–12</li>
          <li>• Reading fluency and comprehension support</li>
          <li>• Teacher-guided live practice</li>
          <li>• Free assessment before recommendation</li>
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
        <Link
          to="/book-demo"
          className="mt-3 inline-block text-sm font-medium text-slate-700 underline underline-offset-2"
        >
          Prefer direct help? Book a free assessment now.
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are online reading classes for kids?</h2>
        <p className="text-slate-700">
          Online reading classes for kids help children improve fluency, reading accuracy, confidence, and comprehension through live guided teaching. They are especially useful for children who can read some words but are not yet reading smoothly, accurately, or confidently in passages.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When does a child need reading support?</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Your child reads very slowly.</li>
          <li>• Your child guesses words instead of reading carefully.</li>
          <li>• Your child forgets words they read earlier.</li>
          <li>• Your child avoids reading books or passages.</li>
          <li>• Your child can read words but struggles to understand the story.</li>
          <li>• Your child reads in class but loses confidence at home.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps builds reading confidence</h2>
        <ul className="space-y-2 text-slate-700">
          <li>1. We check the child&apos;s current reading level.</li>
          <li>2. We identify whether the gap is phonics, blending, fluency, vocabulary, or comprehension.</li>
          <li>3. We practise reading through guided words, sentences, and short passages.</li>
          <li>4. We support expression, pace, accuracy, and understanding.</li>
          <li>5. Parents receive clear next-step guidance.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Phonics support vs Reading support</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Phonics support</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best when the child struggles to decode words, blend sounds, read CVC words, or understand spelling patterns.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading support</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best when the child can read some words but reads slowly, lacks fluency, forgets words, avoids passages, or struggles with comprehension.
            </p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">FAQs</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Not sure whether your child needs phonics or reading support?</h2>
        <p className="mt-3 text-slate-200">
          Start with a free assessment. Tiny Steps will check your child&apos;s reading stage and recommend whether the right starting point is phonics, reading fluency, grammar, or a combined path.
        </p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
