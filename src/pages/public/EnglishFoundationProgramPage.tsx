import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is an English foundation program for kids?',
    answer:
      'An English foundation program builds core reading, grammar, writing, and speaking basics so children can communicate clearly and perform better in school tasks.',
  },
  {
    question: 'Which age group benefits most from an English foundation program?',
    answer:
      'It is usually most useful for ages 5-12 who need balanced support across reading, grammar, writing, and speaking rather than a single-skill class.',
  },
  {
    question: 'Are live online foundation classes effective for long-term confidence?',
    answer:
      'Yes. Live online foundation classes are effective when progression is structured and consistent. Children build stronger basics first, then improve confidence in classwork and communication.',
  },
];

export default function EnglishFoundationProgramPage() {
  useEffect(() => {
    applySeo({
      title: 'English Foundation Program for Kids | Tiny Steps Learning',
      description:
        'English foundation program for kids covering reading, grammar, and speaking basics through age-appropriate progression and live guided support.',
      canonicalPath: '/english-foundation-program',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Foundation Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build strong English basics in reading, grammar, and speaking with a structured, age-appropriate learning pathway.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is an english foundation program for kids?</h2>
        <p className="text-slate-700">
          Tiny Steps offers a live online English foundation program for kids (typically ages 5-12) that builds reading, grammar, writing, and speaking in one structured pathway. Families choose this format when they want clear basics, steady school improvement, and stronger communication confidence.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this program helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Strong English basics across reading, grammar, and speaking.</li>
          <li>• Better sentence accuracy and clearer communication.</li>
          <li>• Age-appropriate progression that avoids learning gaps.</li>
          <li>• Long-term confidence for school and everyday expression.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child needs balanced English improvement, not one isolated skill.</li>
          <li>• Parent wants strong fundamentals before advanced learning.</li>
          <li>• Child needs support in reading, grammar use, and speaking confidence.</li>
          <li>• Parent wants a clear progression with visible outcomes.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps delivers it</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided teaching with consistent mentor feedback.</li>
          <li>• Structured progression matched to age and current level.</li>
          <li>• Interactive learning for reading, grammar, and speaking growth.</li>
          <li>• Parent visibility through practical updates and next-step guidance.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics
          </Link>
          {' • '}
          <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            grammar
          </Link>
          {' • '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            speaking
          </Link>
          {' • '}
          <Link to="/online-english-classes-for-kids-india" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            online english classes for kids india
          </Link>
        </p>
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
        <h2 className="text-2xl font-bold">Ready to build a strong English foundation?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get the right foundational plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
    </div>
  );
}
