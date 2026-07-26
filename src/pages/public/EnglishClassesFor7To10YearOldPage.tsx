import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What should children aged 7-10 learn in online English classes?',
    answer:
      'At this stage, children should build reading fluency, grammar accuracy, sentence formation, paragraph writing, and confident oral responses. Learning should be connected to real school tasks and clear expression.',
  },
  {
    question: 'Can Tiny Steps help if my child reads but makes grammar mistakes?',
    answer:
      'Yes. Many children in this age band can read but struggle with grammar transfer while speaking or writing. Tiny Steps focuses on applied grammar through guided sentence and answer practice.',
  },
  {
    question: 'What if my child gives short answers or avoids speaking?',
    answer:
      'This often indicates a confidence and sentence-formation gap. Tiny Steps uses guided prompts, response structures, and communication practice to help children move from short replies to clearer explanations.',
  },
  {
    question: 'Do these classes include writing and sentence formation?',
    answer:
      'Yes. Writing and sentence formation are core parts of the 7-10 pathway, along with reading fluency, grammar accuracy, and communication confidence.',
  },
  {
    question: 'How do you decide whether my child needs grammar, reading, or communication support?',
    answer:
      'Tiny Steps uses a structured assessment to identify the main gap first, then recommends a clear path across reading, grammar, sentence formation, writing, and communication.',
  },
  {
    question: 'What happens in a Tiny Steps assessment for ages 7-10?',
    answer:
      'The assessment checks reading fluency, comprehension, grammar usage, sentence quality, writing structure, and response confidence. Parents receive a practical next-step recommendation.',
  },
];

export default function EnglishClassesFor7To10YearOldPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/english-classes-for-7-10-year-old#faq',
    };

    applySeo({
      title: 'English Classes for 7 to 10 Year Old | Tiny Steps Learning',
      description:
        'English classes for 7 to 10 year old children focused on reading comprehension, grammar usage, writing clarity, speaking confidence, and communication skills.',
      canonicalPath: '/english-classes-for-7-10-year-old',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online English Classes for Ages 7-10</h1>
        <p className="mt-4 text-lg text-slate-700">
          Age-band support for children who need stronger reading fluency, grammar accuracy, writing quality, and confident communication for school and daily expression.
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
          For ages 7-10, children need to move from basic correctness to independent expression. That means better reading fluency, clearer grammar use, stronger writing structure, and confident spoken answers.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this page is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Parents of children aged 7-10 who need targeted English skill growth.</li>
          <li>• Children who read but struggle with grammar, writing, or response quality.</li>
          <li>• Children who avoid speaking or give very short classroom answers.</li>
          <li>• Families seeking a stage-based plan instead of disconnected tuition activities.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children aged 7-10 usually need at this stage</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading fluency with stronger understanding, not only word recognition.</li>
          <li>• Grammar accuracy that appears in everyday writing and speaking.</li>
          <li>• Sentence formation that supports complete, logical responses.</li>
          <li>• Paragraph writing structure for school answer quality.</li>
          <li>• Clear communication confidence in class discussions and oral responses.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns for ages 7-10</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading fluency is weak despite regular school reading.</li>
          <li>• Grammar mistakes repeat in writing and speech.</li>
          <li>• Sentence formation is unclear or incomplete.</li>
          <li>• Child gives short answers and avoids detailed speaking.</li>
          <li>• Writing gaps appear in paragraph structure and clarity.</li>
          <li>• Confidence drops during class participation or assessments.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What Tiny Steps teaches for ages 7-10</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading fluency and comprehension for meaning-focused learning.</li>
          <li>• Applied grammar for accurate writing and speaking.</li>
          <li>• Sentence formation practice for complete and structured answers.</li>
          <li>• Paragraph writing support for stronger school responses.</li>
          <li>• Communication practice for confident oral expression.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How classes move from basics to independent expression</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Start with reading clarity and fluency baseline.</li>
          <li>• Strengthen grammar usage in real sentence contexts.</li>
          <li>• Build sentence and paragraph structure with guided templates.</li>
          <li>• Train structured oral answers with explanation cues.</li>
          <li>• Progress toward independent written and spoken expression.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          reading fluency → grammar accuracy → sentence formation → paragraph writing → structured answers → confident communication
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check in the assessment</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading fluency and comprehension level</li>
          <li>• Grammar control in written and spoken responses</li>
          <li>• Sentence and paragraph structure quality</li>
          <li>• Response depth in oral explanations</li>
          <li>• Confidence patterns in communication tasks</li>
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
            • For broader multi-age planning:{' '}
            <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online English Classes for Kids India
            </Link>
          </li>
          <li>
            • For earlier-stage pathway context:{' '}
            <Link to="/english-classes-for-5-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Classes for 5-Year-Old Children
            </Link>
          </li>
          <li>
            • For reading-focused support:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For grammar-focused support:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Classes
            </Link>
          </li>
          <li>
            • For speaking-focused support:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Speaking Classes
            </Link>
          </li>
          <li>
            • For writing-focused support:{' '}
            <Link to="/writing-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Writing Classes for Kids
            </Link>
          </li>
          <li>
            • For course comparison:{' '}
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
        <p className="mt-2 text-slate-200">Get a clear ages 7-10 pathway for reading, grammar, writing, and confident communication.</p>
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
