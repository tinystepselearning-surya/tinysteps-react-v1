import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What is a summer reading program for kids?',
    answer:
      'A summer reading program is a focused seasonal learning plan that helps children maintain and improve reading fluency, comprehension, and confidence during school break.',
  },
  {
    question: 'Can summer reading classes help a slow reader?',
    answer:
      'Yes. Summer reading support can help slow readers through guided practice in blending, sentence reading, fluency, and confidence without school-term pressure.',
  },
  {
    question: 'Is this different from regular reading classes?',
    answer:
      'Yes. This page focuses on seasonal reading catch-up and school-readiness, while regular reading classes are year-round and broader in progression.',
  },
  {
    question: 'What if my child knows letters but cannot read words?',
    answer:
      'That usually indicates phonics or blending gaps. Tiny Steps checks decoding readiness first and then recommends the right path for phonics, reading, or combined support.',
  },
  {
    question: 'Do you check phonics and fluency before suggesting a path?',
    answer:
      'Yes. Tiny Steps checks phonics, blending, sentence reading, reading pace, comprehension, and confidence before recommending a reading path.',
  },
  {
    question: 'What happens in a Tiny Steps reading assessment?',
    answer:
      'The assessment identifies the child’s current reading stage and key gaps, then provides a clear next-step recommendation for seasonal and year-round support.',
  },
];

export default function SummerReadingProgramKidsPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/summer-reading-program-kids#faq',
    };

    applySeo({
      title: 'Summer Reading Program for Kids: Prevent Reading Slide | Tiny Steps Learning',
      description:
        'Parent guide to our summer reading program for kids: prevent reading slide, keep fluency steady during vacation, and return to school with stronger reading confidence.',
      canonicalPath: '/summer-reading-program-kids',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Reading Program for Kids: Fluency and Confidence</h1>
        <p className="mt-4 text-lg text-slate-700">
          A seasonal reading improvement pathway with evergreen value for fluency, comprehension, confidence, and smoother school readiness.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          This page is for parents who want a practical summer reading plan that also supports year-round progress. It helps children strengthen reading fluency, comprehension, and confidence while addressing phonics and blending gaps early.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this summer reading program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who read slowly or lose reading consistency during school holidays.</li>
          <li>• Children who need guided support in phonics, blending, and reading confidence.</li>
          <li>• Families who want structured reading catch-up without heavy school pressure.</li>
          <li>• Parents who want better school readiness before the next term starts.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common summer reading concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading very slowly and pausing too often</li>
          <li>• Guessing words instead of decoding carefully</li>
          <li>• Avoiding books or reading practice at home</li>
          <li>• Weak comprehension after reading short passages</li>
          <li>• Forgetting phonics and blending routines</li>
          <li>• Low confidence when asked to read aloud</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why summer is useful for reading catch-up without school pressure</h2>
        <p className="text-slate-700">
          Summer gives children space to rebuild reading habits at a calmer pace. With fewer school deadlines, children can strengthen decoding, fluency, and comprehension through short guided routines that improve confidence before the next academic term.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What Tiny Steps focuses on</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics gaps and sound clarity</li>
          <li>• Blending accuracy for smoother word reading</li>
          <li>• Sentence reading with reduced guessing</li>
          <li>• Reading fluency and pace control</li>
          <li>• Comprehension and vocabulary support</li>
          <li>• Confidence-building through guided correction</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between this page and regular reading classes</h2>
        <p className="text-slate-700">
          This page is a seasonal reading improvement route focused on summer catch-up and school-readiness. For year-round evergreen planning, use{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Reading Classes for Kids
          </Link>
          . For broader seasonal options, see{' '}
          <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            Summer Camps
          </Link>
          .
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          phonics check → blending accuracy → sentence reading → fluency → comprehension → confidence
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a reading path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sound-letter decoding and phonics stability</li>
          <li>• Blending accuracy and word-reading behavior</li>
          <li>• Sentence-level reading pace and fluency</li>
          <li>• Passage understanding and vocabulary use</li>
          <li>• Reading confidence and response patterns</li>
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
            • Year-round reading support:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • Phonics pathway:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Phonics Classes
            </Link>
          </li>
          <li>
            • Parent support guide:{' '}
            <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Child Not Reading Properly
            </Link>
          </li>
          <li>
            • Slow reader support:{' '}
            <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Slow Reader Child Help
            </Link>
          </li>
          <li>
            • Reading fluency pathway:{' '}
            <Link to="/reading-fluency-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Fluency Program
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
              Book Free Assessment
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
        <h2 className="text-2xl font-bold">Parent action: choose the right reading path now</h2>
        <p className="mt-2 text-slate-200">Book a free assessment for a clear next-step recommendation in phonics, reading fluency, and confidence support.</p>
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
