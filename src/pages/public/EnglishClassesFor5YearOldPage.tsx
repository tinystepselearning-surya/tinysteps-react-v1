import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What should a 5-year-old learn in online English classes?',
    answer:
      'At age 5, children should focus on letter sounds, blending readiness, early reading, vocabulary growth, simple sentence formation, and confident responses.',
  },
  {
    question: 'Is age 5 the right time to start phonics?',
    answer:
      'Yes. Age 5 is a strong stage to begin or strengthen phonics, especially when classes are interactive and focused on sounds, blending, and early reading confidence.',
  },
  {
    question: 'What if my 5-year-old knows letters but cannot read words?',
    answer:
      'This is common at age 5. Many children know letter names before blending becomes automatic. Guided phonics and blending practice usually helps bridge this gap.',
  },
  {
    question: 'How long should a class be for a 5-year-old?',
    answer:
      'At this age, classes should be short, focused, and interactive. Children learn best when activities are structured into small segments with active participation.',
  },
  {
    question: 'Can online classes keep a 5-year-old engaged?',
    answer:
      'Yes. Online classes can keep 5-year-olds engaged when lessons use guided interaction, age-appropriate tasks, quick transitions, and positive feedback.',
  },
  {
    question: 'What happens in a Tiny Steps assessment for a 5-year-old?',
    answer:
      'Tiny Steps checks letter-sound readiness, blending, early reading behavior, vocabulary use, sentence responses, and confidence. Parents then receive a clear next-step recommendation.',
  },
];

export default function EnglishClassesFor5YearOldPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/english-classes-for-5-year-old#faq',
    };

    applySeo({
      title: 'English Classes for 5 Year Old | Tiny Steps Learning',
      description:
        'English classes for 5 year old children focused on phonics blending, reading readiness, sentence speaking, and confidence in class participation.',
      canonicalPath: '/english-classes-for-5-year-old',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online English Classes for 5-Year-Old Children</h1>
        <p className="mt-4 text-lg text-slate-700">
          Age-5 support focused on the key bridge from letter sounds to early reading, simple sentences, and confident communication.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
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
          At age 5, children should move from letter familiarity to blending, early reading, and simple sentence confidence. The best results come from interactive, age-appropriate classes with step-by-step guidance.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this page is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Parents of 5-year-olds who need structured early English support.</li>
          <li>• Children who know some letters but are not yet reading confidently.</li>
          <li>• Children who give short answers and need sentence confidence.</li>
          <li>• Families looking for a clear next step before choosing a full program.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What a 5-year-old usually needs at this stage</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sound recall that is consistent (not only letter-name recitation).</li>
          <li>• Blending practice for short words with less guessing.</li>
          <li>• Early sentence reading confidence through decodable text.</li>
          <li>• Vocabulary and sentence-speaking routines for classroom participation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns at age 5</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter sounds are inconsistent even though alphabet names are known.</li>
          <li>• Blending readiness is low and word reading remains effortful.</li>
          <li>• Child gives short answers and avoids longer responses.</li>
          <li>• Vocabulary range is limited during conversation.</li>
          <li>• Attention span drops when tasks are too long or repetitive.</li>
          <li>• Confidence decreases when reading or answering in class-like settings.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What Tiny Steps teaches for 5-year-olds</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter sounds and blending foundations for early reading readiness.</li>
          <li>• Age-appropriate vocabulary building through guided interaction.</li>
          <li>• Simple sentence formation for clearer responses.</li>
          <li>• Early reading routines that reduce guessing and build confidence.</li>
          <li>• Communication practice for confident short classroom-style answers.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How we keep classes interactive and age-appropriate</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Short, focused learning segments that match age-5 attention patterns.</li>
          <li>• Guided prompts and visual cues to support comprehension and participation.</li>
          <li>• Frequent response opportunities instead of passive listening.</li>
          <li>• Positive correction and repeat practice to build confidence gradually.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          letter sounds → blending readiness → early reading → vocabulary → simple sentences → confident responses
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check in the assessment</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter-sound stability and blending readiness</li>
          <li>• Early reading behavior and decoding confidence</li>
          <li>• Vocabulary use and response length</li>
          <li>• Sentence formation quality for age-appropriate speaking</li>
          <li>• Confidence and participation patterns in guided tasks</li>
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • For focused phonics support:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Phonics Program
            </Link>
          </li>
          <li>
            • For reading-readiness progression:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For age progression after this stage:{' '}
            <Link to="/english-classes-for-7-10-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Classes for 7-10 Year Old
            </Link>
          </li>
          <li>
            • For broader national pathway overview:{' '}
            <Link to="/online-english-classes-for-kids-india" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online English Classes for Kids in India
            </Link>
          </li>
          <li>
            • For course comparison before enrollment:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            • For immediate assessment booking:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free Assessment
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Parent action: book a free assessment first</h2>
        <p className="mt-2 text-slate-200">Get a clear age-5 plan for phonics, early reading, vocabulary, and confident responses.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white/70"
          >
            Explore Courses
          </Link>
        </div>
      </section>
    </div>
  );
}
