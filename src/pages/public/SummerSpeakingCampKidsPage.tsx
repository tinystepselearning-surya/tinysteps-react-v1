import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What is a summer speaking camp for kids?',
    answer:
      'A summer speaking camp is a focused seasonal communication program that helps children build speaking comfort, sentence clarity, storytelling, and confident expression during school break.',
  },
  {
    question: 'Can summer speaking classes help a shy child?',
    answer:
      'Yes. Summer speaking support can help shy children through guided prompts, low-pressure speaking routines, and steady confidence-building practice.',
  },
  {
    question: 'Is this different from the regular communication program?',
    answer:
      'Yes. This page is a seasonal confidence-building route for summer practice and school-readiness, while the regular communication program is year-round and broader in scope.',
  },
  {
    question: 'What if my child gives only short answers?',
    answer:
      'Short answers often indicate vocabulary, sentence-formation, or confidence gaps. Tiny Steps uses guided answers and structured speaking practice to expand responses gradually.',
  },
  {
    question: 'Do you check sentence formation and confidence before suggesting a path?',
    answer:
      'Yes. Tiny Steps checks vocabulary use, sentence formation, speaking comfort, expression clarity, and confidence before recommending a communication path.',
  },
  {
    question: 'What happens in a Tiny Steps communication assessment?',
    answer:
      'The assessment identifies the child’s current communication stage and key gaps, then recommends the right next pathway for speaking confidence and expression.',
  },
];

export default function SummerSpeakingCampKidsPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/summer-speaking-camp-kids#faq',
    };

    applySeo({
      title: 'Summer Speaking Camp for Kids | Tiny Steps Learning',
      description:
        'Summer speaking camp for kids focused on communication confidence, expressive speaking, vocabulary growth, and presentation readiness through live sessions.',
      canonicalPath: '/summer-speaking-camp-kids',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Speaking Camp for Kids: Communication Confidence</h1>
        <p className="mt-4 text-lg text-slate-700">
          A seasonal communication-confidence pathway with evergreen value for sentence formation, storytelling, expression, and presentation readiness.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free 35-Minute Demo
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          This page is for parents who want structured summer communication practice that improves confidence and school-readiness. Children build vocabulary, sentence clarity, storytelling, expression, and speaking comfort through guided live practice.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this summer speaking camp is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who hesitate while speaking or avoid sharing ideas.</li>
          <li>• Children who need stronger sentence formation and expressive answers.</li>
          <li>• Children preparing for school speaking tasks and presentations.</li>
          <li>• Parents who want confidence-building support during summer break.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common summer communication concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Short one-line answers with low detail</li>
          <li>• Hesitation and speaking pauses</li>
          <li>• Weak sentence formation in responses</li>
          <li>• Fear of speaking in class or groups</li>
          <li>• Low expression and flat delivery</li>
          <li>• Weak storytelling and presentation nervousness</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why summer is useful for confidence-building without school pressure</h2>
        <p className="text-slate-700">
          Summer gives children space to practise speaking with less classroom pressure. With guided routines and regular feedback, children can improve comfort, clarity, and expression before the next school term.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What Tiny Steps focuses on</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Vocabulary development for fuller responses</li>
          <li>• Sentence formation and guided answers</li>
          <li>• Storytelling and expressive speaking</li>
          <li>• Listening and idea organization</li>
          <li>• Presentation readiness</li>
          <li>• Communication confidence in real settings</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between this page and the regular communication program</h2>
        <p className="text-slate-700">
          This page is a seasonal speaking-confidence route for summer practice and school-readiness. For broader seasonal options, see{' '}
          <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Summer Camps
          </Link>
          . For year-round communication progression, use{' '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Speaking Program
          </Link>
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          comfort → vocabulary → sentence formation → guided answers → storytelling → expression → presentation confidence
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a communication path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Speaking comfort and hesitation patterns</li>
          <li>• Vocabulary use and sentence formation ability</li>
          <li>• Response structure and storytelling clarity</li>
          <li>• Expression, listening, and presentation readiness</li>
          <li>• Confidence level in guided speaking tasks</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Helpful next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • Seasonal hub:{' '}
            <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Summer Camps
            </Link>
          </li>
          <li>
            • Year-round communication pathway:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Speaking Program
            </Link>
          </li>
          <li>
            • Confidence-building pathway:{' '}
            <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Confidence Building Program
            </Link>
          </li>
          <li>
            • Support for shy children:{' '}
            <Link to="/shy-child-speaking-confidence" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Shy Child Speaking Confidence
            </Link>
          </li>
          <li>
            • Sentence support pathway:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Program
            </Link>
          </li>
          <li>
            • Full course options:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            • Book assessment:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free 35-Minute Demo
            </Link>
          </li>
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
        <h2 className="text-2xl font-bold">Parent action: choose the right communication path now</h2>
        <p className="mt-2 text-slate-200">Book one free 35-minute 1:1 online demo assessment class for clear next-step guidance in speaking confidence, sentence formation, and expression.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free 35-Minute Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
