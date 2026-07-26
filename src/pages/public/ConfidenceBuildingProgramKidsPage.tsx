import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What is a confidence-building program for kids?',
    answer:
      'A confidence-building program helps children build communication habits step by step, from comfort and vocabulary to clearer sentence formation, expression, and confident responses.',
  },
  {
    question: 'Is this program only for shy children?',
    answer:
      'No. It helps shy children, but it also supports children who understand ideas but cannot express them clearly, give short answers, or struggle with sentence flow and communication confidence.',
  },
  {
    question: 'What if my child understands English but does not express ideas clearly?',
    answer:
      'This usually points to a sentence-formation and expression gap. Tiny Steps builds vocabulary, response structure, and guided speaking routines so children can communicate ideas with clarity.',
  },
  {
    question: 'How does Tiny Steps build confidence without pressure?',
    answer:
      'Tiny Steps uses low-pressure guided speaking, predictable routines, and gradual progression. Children are encouraged to grow through repeated small wins, not forced performance.',
  },
  {
    question: 'Does this program include sentence formation and storytelling?',
    answer:
      'Yes. Sentence formation, guided answers, storytelling, and expression are core parts of this pathway, along with listening and vocabulary support.',
  },
  {
    question: 'What happens in a Tiny Steps communication assessment?',
    answer:
      'Tiny Steps checks confidence pattern, vocabulary, sentence formation, response quality, and expression readiness, then recommends the most suitable communication pathway.',
  },
];

export default function ConfidenceBuildingProgramKidsPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/confidence-building-program-kids#faq',
    };

    applySeo({
      title: 'Confidence Building Program for Kids | Tiny Steps Learning',
      description:
        'Confidence building program for kids focused on expressive speaking, communication confidence, reduced hesitation, vocabulary growth, and public speaking readiness.',
      canonicalPath: '/confidence-building-program-kids',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Confidence Building Program for Kids: Communication Pathway</h1>
        <p className="mt-4 text-lg text-slate-700">
          A structured pathway for children who need steady communication confidence growth through sentence clarity, expression, and guided speaking.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          This page is the Tiny Steps communication pathway guide, not a generic class catalog. It helps parents understand when children need structured confidence-building across listening, vocabulary, sentence formation, expression, and guided speaking progression.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who need communication confidence growth over time.</li>
          <li>• Children who understand but struggle to express full ideas clearly.</li>
          <li>• Children with weak sentence formation, short answers, or low expression.</li>
          <li>• Parents who want a guided pathway instead of random activity classes.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between shyness, low confidence, weak sentence formation, and lack of expression</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Shyness: child hesitates mainly in social or class-speaking situations.</li>
          <li>• Low confidence: child avoids speaking even when ideas are known.</li>
          <li>• Weak sentence formation: child ideas are present but answer structure is incomplete.</li>
          <li>• Lack of expression: child speaks with low clarity, low detail, or low voice confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What confidence-building means at Tiny Steps</h2>
        <p className="text-slate-700">
          At Tiny Steps, confidence-building is a structured communication progression. We develop the child&apos;s ability to listen, process, form sentences, and express ideas clearly with supportive guidance.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Skills developed in this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Listening and response readiness</li>
          <li>• Vocabulary expansion for better idea expression</li>
          <li>• Sentence formation and guided answers</li>
          <li>• Storytelling structure and expression quality</li>
          <li>• Presentation readiness and communication confidence</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How the program is different from random activity classes</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• We use assessment-first placement, not one-size-fits-all activities.</li>
          <li>• We follow a defined communication pathway with measurable milestones.</li>
          <li>• We integrate sentence formation, vocabulary, expression, and confidence together.</li>
          <li>• Parents receive practical next steps, not only participation updates.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          comfort → vocabulary → sentence formation → guided speaking → storytelling → expression → confident communication
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting this pathway</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Communication comfort in guided and open speaking situations</li>
          <li>• Vocabulary range and sentence formation readiness</li>
          <li>• Expression clarity, response depth, and confidence patterns</li>
          <li>• Grammar and reading support needs that influence speaking confidence</li>
          <li>• Best next step: confidence pathway, speaking pathway, or blended support</li>
        </ul>
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
        <h2 className="text-2xl font-bold">Parent action: book one free 35-minute 1:1 online demo assessment class first</h2>
        <p className="mt-2 text-slate-200">Get a clear communication pathway based on your child&apos;s current confidence and expression stage.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white/70"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Related pathways for parents</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • If your concern is mostly hesitation or shy speaking behavior:{' '}
            <Link to="/shy-child-speaking-confidence" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Shy Child Speaking Confidence Help
            </Link>
          </li>
          <li>
            • If you want the core communication/public speaking track:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Speaking Program
            </Link>
          </li>
          <li>
            • If sentence accuracy is limiting expression:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Program
            </Link>
          </li>
          <li>
            • If reading confidence is reducing communication confidence:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
        </ul>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
