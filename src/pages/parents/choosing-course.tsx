import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'How do I know which Tiny Steps course is right for my child?',
    answer:
      'Start with your child’s current gap, not only age. Tiny Steps uses a structured assessment to identify whether phonics, reading, grammar, writing, or communication support should come first.',
  },
  {
    question: 'Should my child start with phonics, reading, grammar, or communication?',
    answer:
      'If reading basics are weak, phonics or reading support usually comes first. If reading is stable but sentence or writing accuracy is low, grammar and writing support may be better. If ideas are clear but speaking is hesitant, communication confidence support is often the right start.',
  },
  {
    question: 'What if my child reads but makes grammar mistakes?',
    answer:
      'This usually means grammar transfer is weak. Your child may need applied grammar and sentence formation practice so correctness appears in real speaking and writing, not only worksheets.',
  },
  {
    question: 'What if my child understands English but gives short answers?',
    answer:
      'Short answers often point to confidence or sentence-formation gaps. Tiny Steps helps children build response length and clarity through guided prompts and structured speaking routines.',
  },
  {
    question: 'Can Tiny Steps suggest a course after assessing my child?',
    answer:
      'Yes. After the assessment, parents receive a clear recommended pathway based on the child’s present level, including what to start first and how to progress next.',
  },
  {
    question: 'Is it better to book a demo before choosing a course?',
    answer:
      'Yes. Booking a free assessment first reduces guesswork and helps parents choose the right course path with more confidence.',
  },
];

const ChoosingCourse: React.FC = () => {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/parents/choosing-course#faq',
    };

    applySeo({
      ...parentsMeta['/parents/choosing-course'],
      jsonLd: [faqSchema],
    });
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">How to Choose the Right Tiny Steps Course for Your Child</h1>

    <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
      <p className="text-sm font-medium text-blue-900">
        Choose the course based on your child&apos;s current skill gap, not only age. This page is a parent decision guide to help you place your child correctly before enrollment.
      </p>
    </div>

    <section className="mt-6">
      <h2 className="font-semibold">Quick Answer for Parents</h2>
      <p className="mt-2">
        Start with the child&apos;s strongest gap first. If reading basics are weak, begin with phonics or reading support. If reading is stable but writing and sentence quality are weak, begin with grammar and writing support. If speaking is hesitant, begin with communication confidence support.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">When to choose phonics</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child knows letters but cannot decode words confidently.</li>
        <li>Blending is slow or inconsistent.</li>
        <li>Reading attempts rely on guessing.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Best next step: <Link to="/phonics" className="text-primary-600 font-medium hover:underline">Explore phonics support</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">When to choose reading support</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child reads slowly or loses meaning in passages.</li>
        <li>Fluency and confidence drop in longer text.</li>
        <li>Reading accuracy is present but flow is weak.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Best next step: <Link to="/reading-classes-for-kids" className="text-primary-600 font-medium hover:underline">Explore reading support</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">When to choose grammar</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child repeats tense, punctuation, or sentence errors.</li>
        <li>Grammar rules are known but not applied while writing or speaking.</li>
        <li>Answer quality is unclear despite reading comprehension.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Best next step: <Link to="/grammar" className="text-primary-600 font-medium hover:underline">Explore grammar support</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">When to choose sentence formation / writing support</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child writes incomplete or disconnected sentences.</li>
        <li>Paragraph structure is weak for age expectations.</li>
        <li>Ideas are present but written expression lacks clarity.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Best next step: <Link to="/writing-classes-for-kids" className="text-primary-600 font-medium hover:underline">Explore writing support</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">When to choose communication confidence support</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child gives short answers or avoids speaking in class.</li>
        <li>Confidence drops in oral response situations.</li>
        <li>Child understands but hesitates to express clearly.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Best next step: <Link to="/speaking" className="text-primary-600 font-medium hover:underline">Explore communication support</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">Common parent confusion</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Child knows letters but cannot read words.</li>
        <li>Child reads slowly despite practice.</li>
        <li>Child makes grammar mistakes repeatedly.</li>
        <li>Child gives short answers and avoids speaking.</li>
        <li>Child writes incomplete or unclear sentences.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Useful guides: <Link to="/child-not-reading-properly" className="text-primary-600 font-medium hover:underline">child not reading properly</Link>,{' '}
        <Link to="/slow-reader-child-help" className="text-primary-600 font-medium hover:underline">slow reader help</Link>,{' '}
        <Link to="/shy-child-speaking-confidence" className="text-primary-600 font-medium hover:underline">shy child speaking confidence</Link>.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">Age-based guidance</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Ages 4-6: start with phonics, blending, and early reading confidence.</li>
        <li>Ages 7-10: focus on reading fluency, grammar transfer, writing clarity, and communication.</li>
        <li>Ages 11-12: focus on structured answers, deeper comprehension, and confident expression.</li>
      </ul>
    </section>

    <section className="mt-6">
      <h2 className="font-semibold">Assessment-first approach</h2>
      <p className="mt-2">
        Tiny Steps checks the child&apos;s actual skill profile before suggesting a course path. This avoids wrong placement and gives parents a clearer, faster route to progress.
      </p>
    </section>

    <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h2 className="font-semibold">FAQs</h2>
      <div className="mt-3 space-y-3 text-sm">
        {faqItems.map((item) => (
          <article key={item.question}>
            <h3 className="font-medium text-slate-900">{item.question}</h3>
            <p className="mt-1 text-gray-700">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mt-8">
      <h2 className="font-semibold">Recommended next step</h2>
      <div className="mt-3 flex flex-col gap-3">
      <Link to="/book-demo" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Book Free Assessment
      </Link>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/courses" className="text-primary-600 font-medium hover:underline">
          Explore Courses
        </Link>
        <span className="text-slate-400">•</span>
        <Link to="/phonics" className="text-primary-600 font-medium hover:underline">
          Phonics Classes
        </Link>
        <span className="text-slate-400">•</span>
        <Link to="/grammar" className="text-primary-600 font-medium hover:underline">
          Grammar Classes
        </Link>
        <span className="text-slate-400">•</span>
        <Link to="/speaking" className="text-primary-600 font-medium hover:underline">
          Speaking Classes
        </Link>
      </div>
      </div>
    </section>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Next steps</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Book a free assessment:</strong> Get placement clarity before selecting a program.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Choose the right pathway:</strong> Select the first focus area with better confidence.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Track progress stage by stage:</strong> Build reading, grammar, writing, and communication with clear milestones.</span>
        </div>
      </div>
    </div>

    <AboutAuthor className="mt-10" />
  </article>
);

}

export default ChoosingCourse;
