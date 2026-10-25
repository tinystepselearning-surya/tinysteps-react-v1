import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why is my child shy to speak in English?',
    answer:
      'Children may speak less English in class than at home because the setting is unfamiliar, they need more time, or English is still developing. Being quiet alone does not establish a language or confidence difficulty.',
  },
  {
    question: 'What if my child understands English but gives only short answers?',
    answer:
      'Short answers alone do not establish a confidence or sentence-building gap. Notice how your child communicates with familiar people and in other languages, and offer low-pressure ways to participate.',
  },
  {
    question: 'Is this a confidence issue or a sentence formation issue?',
    answer:
      'It may relate to comfort, the language task, both, or neither. Look at communication across settings and languages before deciding which educational support, if any, would help.',
  },
  {
    question: 'Can online classes help a shy child speak more confidently?',
    answer:
      'They may help when a child wants language or communication practice in a supportive setting. Speaking should not be forced; the approach needs to fit the child rather than promising a particular result.',
  },
  {
    question: 'How does Tiny Steps encourage children without pressure?',
    answer:
      'Tiny Steps uses predictable routines, choices for responding and time to think. We invite gradual participation without demanding eye contact or forcing children to speak on the spot.',
  },
  {
    question: 'What happens in a Tiny Steps communication assessment?',
    answer:
      'Tiny Steps considers comfort, response choices, vocabulary and sentence use in an educational context. Parents receive learning-focused next steps; this is not a clinical diagnosis.',
  },
];

export default function ShyChildSpeakingConfidencePage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/shy-child-speaking-confidence#faq',
    };

    applySeo({
      title: 'Shy Child Speaking Confidence Help | Tiny Steps Learning',
      description:
        'Support for shy child speaking confidence with guided communication practice, sentence support, vocabulary building, and public speaking readiness.',
      canonicalPath: '/shy-child-speaking-confidence',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Shy Child Speaking Confidence Help for Parents</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child speaks less in class than at home, start by noticing where they feel comfortable and what support helps. Tiny Steps offers gentle communication practice when it fits your child's learning needs.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/speaking"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Speaking Program
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          Some children speak freely at home but feel less comfortable in class; others need more time, language support or a different way to participate. Quiet behaviour by itself does not mean a child has a language deficit. Notice the settings and languages in which your child communicates comfortably, and offer support without pressure.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What parents may notice in different settings</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>Speaks comfortably at home but responds briefly or quietly in class.</li>
          <li>Takes time to join conversations with unfamiliar people.</li>
          <li>Prefers to listen, point, draw or write before speaking.</li>
          <li>Joins more readily when offered choice and time to respond.</li>
          <li>Shows worry about particular speaking situations, even with preparation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why children may speak less English in class</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>The child may feel uncertain or worried in an unfamiliar group.</li>
          <li>The child may still be learning the English words needed for a task.</li>
          <li>The task may require longer English sentences than the child currently uses comfortably.</li>
          <li>The child may benefit from more thinking time or another response option.</li>
          <li>Communication may differ across languages, people and settings.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Comfort and English-learning needs are not the same</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>Comfort: a child may be quiet in unfamiliar settings without having a language difficulty.</li>
          <li>Vocabulary: a child may know the idea but not yet have the English words to express it.</li>
          <li>Sentence building: a child may need support organising a longer English response.</li>
          <li>Setting and language: a child may communicate much more freely with familiar people or in another language.</li>
        </ul>
        <p className="mt-4 text-slate-700">
          If your child consistently cannot speak in a particular setting, experiences significant distress, or has broader communication concerns across languages, speak with their school and an appropriately qualified speech-language professional. Educational classes are not a clinical assessment. For a more detailed comparison, see{' '}
          <Link to="/blog/child-understands-english-but-does-not-speak" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            When a Child Understands English but Does Not Speak
          </Link>.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps builds speaking confidence gently</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>We use low-pressure speaking ladders and child-friendly prompts.</li>
          <li>We offer vocabulary and sentence support when the child would benefit from it.</li>
          <li>We offer choices, guided responses and gradual speaking practice when the child is ready.</li>
          <li>We connect confidence work with grammar clarity and communication practice.</li>
          <li>We keep parent communication clear with practical next steps.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a communication path</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>The child's comfort and ways of responding in different settings</li>
          <li>Vocabulary use in English and, where relevant, the child's other languages</li>
          <li>Sentence formation quality in guided answers</li>
          <li>Clarity, response choices and how support affects participation</li>
          <li>Reading and grammar support needs that may affect speaking confidence</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          notice strengths and comfort → offer choices and thinking time → practise useful language when needed → build independent communication at the child's pace
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

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            For broader speaking-confidence support:{' '}
            <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Confidence Building Program for Kids
            </Link>
          </li>
          <li>
            For structured speaking coaching:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Public Speaking Classes for Kids
            </Link>
          </li>
          <li>
            For sentence formation support:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Program
            </Link>
          </li>
          <li>
            For language confidence through reading support:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            For comparing all public pathways:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            For assessment booking:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free 35-Minute Demo
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Parent action: book one free 35-minute 1:1 online demo assessment class first</h2>
        <p className="mt-2 text-slate-200">Explore education-focused next steps that respect your child's comfort and pace.</p>
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
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
