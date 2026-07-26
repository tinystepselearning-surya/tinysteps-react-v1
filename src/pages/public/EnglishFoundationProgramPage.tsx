import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What is an English foundation program for kids?',
    answer:
      'An English foundation program is a structured pathway that builds reading, grammar, sentence formation, writing readiness, and communication confidence together before advanced language demands increase.',
  },
  {
    question: 'How do I know if my child has foundation gaps?',
    answer:
      'A child may have foundation gaps when progress is uneven across skills, such as weak blending, slow reading, grammar mistakes, incomplete sentences, low vocabulary use, or hesitant communication.',
  },
  {
    question: 'Is this program different from regular online English classes?',
    answer:
      'Yes. This foundation page focuses on baseline skill sequencing and placement clarity, while broad class pages usually present general options and program listings.',
  },
  {
    question: 'Does the program include phonics, reading, and grammar?',
    answer:
      'Yes. The pathway can include phonics basics, blending, reading readiness, vocabulary, grammar basics, and sentence formation based on the child’s current stage.',
  },
  {
    question: 'Can this program help with sentence formation and confidence?',
    answer:
      'Yes. Tiny Steps connects sentence formation practice with guided communication tasks so children learn to express ideas more clearly and confidently.',
  },
  {
    question: 'What happens in a Tiny Steps foundation assessment?',
    answer:
      'The assessment checks phonics, blending, reading readiness, grammar control, sentence formation, writing readiness, and communication confidence, then recommends the right starting pathway.',
  },
];

export default function EnglishFoundationProgramPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/english-foundation-program#faq',
    };

    applySeo({
      title: 'English Foundation Program for Kids: Reading, Grammar, and Confidence | Tiny Steps Learning',
      description:
        'English foundation program for kids covering phonics, reading readiness, grammar basics, sentence formation, writing readiness, and communication confidence.',
      canonicalPath: '/english-foundation-program',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          English Foundation Program for Kids: Reading, Grammar, and Confidence
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          A structured foundation pathway for children who need stronger basics before advanced English learning.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
          This page is for parents who feel their child needs stronger English basics before moving into advanced coursework. The foundation pathway builds skills in sequence so reading, grammar, sentence formation, writing, and confidence improve together.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this foundation program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who know some basics but struggle to apply them in school reading, writing, and communication tasks.</li>
          <li>• Children showing mixed gaps across phonics, reading, grammar, sentence formation, and confidence.</li>
          <li>• Parents looking for one coherent baseline-building pathway instead of disconnected short-term activities.</li>
          <li>• Children who need structured reinforcement before joining a more advanced language path.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs a child needs English foundation support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• The child knows letters or rules but cannot apply them confidently in real reading or writing.</li>
          <li>• Reading is hesitant, sentence formation is weak, and grammar errors repeat across tasks.</li>
          <li>• Vocabulary use is limited, resulting in short or incomplete answers.</li>
          <li>• The child avoids communication tasks because of low confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Foundation gaps vs reading, grammar, and confidence gaps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Foundation gaps: multiple basics are unstable together, so progress breaks across skills.</li>
          <li>• Reading gaps: decoding, fluency, or comprehension is the core blocker.</li>
          <li>• Grammar gaps: sentence accuracy and rule application remain weak.</li>
          <li>• Confidence gaps: child knows some content but hesitates to express clearly.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What “foundation” means at Tiny Steps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• A stage-wise plan that builds essential language blocks in the right sequence.</li>
          <li>• Live guided support that links reading, grammar, writing readiness, and communication tasks.</li>
          <li>• Parent-visible progression with clear next steps based on the child’s stage.</li>
          <li>• Practical transfer from class activities to school responses and daily expression.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Skills developed in this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics basics and blending accuracy</li>
          <li>• Reading readiness and vocabulary growth</li>
          <li>• Sentence formation and grammar basics</li>
          <li>• Writing readiness for clearer school responses</li>
          <li>• Communication confidence through guided speaking practice</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How this page is different from the full course catalog</h2>
        <p className="text-slate-700">
          The <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">courses page</Link> is a full program catalog.
          This page is a foundation pathway guide for children who need baseline skills strengthened before moving to advanced tracks. For broader India-level
          program discovery, see{' '}
          <Link
            to="/online-english-classes-for-kids"
            className="font-semibold underline underline-offset-2 hover:text-slate-900"
          >
            Online English Classes for Kids in India
          </Link>
          .
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          sounds → blending → reading readiness → vocabulary → sentence formation → grammar basics → writing readiness → confident communication
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting this pathway</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Letter-sound and blending stability</li>
          <li>• Reading readiness, pace, and basic comprehension</li>
          <li>• Sentence construction and grammar application</li>
          <li>• Writing readiness for age-level tasks</li>
          <li>• Communication confidence and expression clarity</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Helpful next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • Program catalog:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            • Phonics pathway:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online Phonics Classes
            </Link>
          </li>
          <li>
            • Grammar pathway:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Classes for Kids
            </Link>
          </li>
          <li>
            • Reading support pathway:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • Writing support pathway:{' '}
            <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Writing Classes for Kids
            </Link>
          </li>
          <li>
            • Communication pathway:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Communication & Public Speaking
            </Link>
          </li>
          <li>
            • National page overview:{' '}
            <Link
              to="/online-english-classes-for-kids"
              className="font-semibold underline underline-offset-2 hover:text-slate-900"
            >
              Online English Classes for Kids in India
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
        <h2 className="text-2xl font-bold">Parent action: choose the right starting point</h2>
        <p className="mt-2 text-slate-200">
          Book a free assessment to check whether your child should start with phonics, reading support, grammar strengthening, or a complete foundation pathway.
        </p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>
    </div>
  );
}
