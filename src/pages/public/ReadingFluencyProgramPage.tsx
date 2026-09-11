import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PUBLIC_AGE_RANGE_LABEL,
  PUBLIC_SESSION_DURATION_LABEL,
  PUBLIC_SITE_FACTS,
} from '../../config/publicFacts';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const canonicalPath = '/reading-fluency-program';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;

const READING_FLUENCY_SEO_KEYWORDS = [
  'reading fluency program for kids',
  'reading fluency programme for kids',
  'reading fluency classes for kids online',
  'online reading fluency classes',
  'reading fluency tutor for kids',
  '1 to 1 reading fluency classes',
  'live reading fluency classes for kids',
  'reading fluency course for kids',
];

const faqItems = [
  {
    question: 'What is reading fluency?',
    answer:
      'Reading fluency is the ability to read with accuracy, appropriate pace, natural expression, and understanding. A fluent reader does not pause at every word and can focus on meaning while reading.',
  },
  {
    question: 'Why does my child read slowly even after knowing phonics?',
    answer:
      'Even after phonics improves, some children still struggle with blending automaticity, sentence flow, or reading stamina. They may decode words correctly but not read connected text smoothly.',
  },
  {
    question: 'Should my child read more books to improve fluency?',
    answer:
      'Reading more helps only when text level and guidance are right. If a child has unresolved blending or fluency gaps, guided practice is usually more effective than only increasing reading quantity.',
  },
  {
    question: 'How do I know if the problem is fluency or comprehension?',
    answer:
      'If your child reads accurately but slowly with frequent pauses, fluency may be the main issue. If your child reads the words but cannot explain meaning, comprehension needs focused support.',
  },
  {
    question: 'Should I choose general reading classes or the Reading Fluency Programme?',
    answer:
      'Choose the Reading Fluency Programme when decoding and word accuracy are reasonably secure but connected reading remains slow, hesitant, choppy, or poorly phrased. Choose general reading support when several reading areas need work or the main bottleneck is still unclear.',
  },
  {
    question: 'Can online classes improve reading fluency?',
    answer:
      'Yes. Online classes can improve reading fluency when teachers provide right-level passages, guided correction, repeated reading routines, phrasing practice, and meaning checks.',
  },
  {
    question: 'Are Tiny Steps reading fluency classes live and 1:1?',
    answer:
      `Yes. Tiny Steps provides live 1:1 online learning. Standard classes are ${PUBLIC_SESSION_DURATION_LABEL}, allowing the teacher to hear the child read, correct errors, and adjust fluency practice to the child’s current level.`,
  },
  {
    question: 'What ages can join the Tiny Steps Reading Fluency Programme?',
    answer:
      `Tiny Steps serves ${PUBLIC_AGE_RANGE_LABEL.toLowerCase()} overall, but fluency placement depends on reading readiness rather than age alone. The specialist programme is most appropriate when decoding and word accuracy are already reasonably secure.`,
  },
  {
    question: 'Can families outside India join the reading fluency programme?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide through live online classes. Available timings are confirmed before enrolment.',
  },
  {
    question: 'What happens in a Tiny Steps reading fluency assessment?',
    answer:
      'Tiny Steps checks phonics stability, blending accuracy, sentence and passage reading, phrasing, expression, and comprehension readiness before recommending the right fluency path.',
  },
];

export default function ReadingFluencyProgramPage() {
  const seoTitle = 'Reading Fluency Classes for Kids Online | Tiny Steps Learning';
  const seoDescription =
    'Live 1:1 reading fluency classes for kids in India and worldwide. Build smoother connected reading, phrasing, accuracy and expression after decoding is stable.';

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Reading Classes for Kids', item: `${PUBLIC_FACTS.primaryWebsite}/reading-classes-for-kids` },
        { '@type': 'ListItem', position: 3, name: 'Reading Fluency Programme', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Reading Fluency Programme for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Reading Fluency Programme for Kids',
      description:
        'Live 1:1 online reading fluency classes for kids focused on accurate connected reading, automaticity, phrasing, expression, comprehension, and reading confidence after decoding is reasonably stable.',
      url: canonicalUrl,
      educationalLevel: 'Reading-fluency support after decoding is reasonably stable',
      teaches: ['reading fluency', 'reading accuracy', 'automaticity', 'phrasing', 'expression', 'comprehension', 'reading confidence'],
      areaServed: ['India', 'Worldwide'],
    });

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: 'website',
      keywords: READING_FLUENCY_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, [seoDescription, seoTitle]);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online Reading Fluency Classes for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          For children who can decode many words but still read slowly, hesitantly, or word by word, this specialist live online programme builds smoother connected reading, stronger phrasing, accurate reading, expression, and comprehension confidence.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Tiny Steps offers live 1:1 support in {PUBLIC_SESSION_DURATION_LABEL} standard classes for families in India and worldwide. This page is specifically for reading-fluency class and programme needs. If the child needs broader reading support or the main gap is still unclear, use our <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2">Reading Classes for Kids</Link> programme instead.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-700 sm:text-sm">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Live 1:1 online</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{PUBLIC_SESSION_DURATION_LABEL}</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">India + worldwide</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Skill-readiness placement</span>
        </div>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free {demoMinutes}-Minute Demo
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          Choose specialist reading-fluency support when word reading is reasonably accurate but connected reading remains slow, effortful, choppy, or poorly phrased. If decoding itself is still unstable, <Link to="/phonics" className="font-semibold underline underline-offset-2">phonics support</Link> may need to come first. If several reading areas are weak or the main problem is unclear, start with <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2">general reading classes</Link> instead.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this programme is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child can decode many words but reads in a choppy, word-by-word style.</li>
          <li>• Child pauses often and loses flow in connected text.</li>
          <li>• Child can finish short passages but comprehension drops as length increases.</li>
          <li>• Child avoids reading aloud because it feels effortful.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs of weak reading fluency</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Word-by-word reading even when many words are known.</li>
          <li>• Frequent pauses that break sentence meaning.</li>
          <li>• Slow pace that increases reading fatigue.</li>
          <li>• Flat expression and weak phrasing during read-aloud.</li>
          <li>• Accuracy drops or comprehension drops in longer passages.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between reading accuracy, pace, expression, and comprehension</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading accuracy</h3>
            <p className="mt-2 text-sm text-slate-700">How correctly a child reads the printed words.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Reading pace</h3>
            <p className="mt-2 text-sm text-slate-700">How efficiently the child moves through connected text while maintaining accuracy and meaning.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Expression</h3>
            <p className="mt-2 text-sm text-slate-700">How naturally the child uses phrasing, pauses, emphasis, and voice while reading.</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Comprehension</h3>
            <p className="mt-2 text-sm text-slate-700">How well the child understands, retells, and explains what was read.</p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why fluency cannot be fixed by “just reading more” for every child</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Some children are reading text above their current decoding or blending stability.</li>
          <li>• Repetition without guided correction can reinforce weak reading habits.</li>
          <li>• Speed-only focus can reduce meaning and confidence.</li>
          <li>• Fluency grows through structured passage practice, phrasing work, correction, and meaning checks.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps reading fluency approach</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Step 1: Baseline check for decoding stability, pace pattern, and comprehension under load.</li>
          <li>• Step 2: Targeted fluency work on right-level passages with guided correction.</li>
          <li>• Step 3: Repeated reading and phrasing practice to build more automatic flow.</li>
          <li>• Step 4: Meaning checks and short retell so fluency and understanding grow together.</li>
          <li>• Step 5: Parent update with one clear home focus for the coming week.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Live programme facts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-lg bg-white p-4 text-sm text-slate-700"><strong>Format:</strong> live 1:1 online support.</p>
          <p className="rounded-lg bg-white p-4 text-sm text-slate-700"><strong>Standard class:</strong> {PUBLIC_SESSION_DURATION_LABEL}.</p>
          <p className="rounded-lg bg-white p-4 text-sm text-slate-700"><strong>Starting point:</strong> one free {demoMinutes}-minute 1:1 demo assessment.</p>
          <p className="rounded-lg bg-white p-4 text-sm text-slate-700"><strong>Availability:</strong> India and worldwide, subject to suitable class timings.</p>
        </div>
        <p className="mt-4 text-sm text-slate-700">
          Tiny Steps serves {PUBLIC_AGE_RANGE_LABEL.toLowerCase()} overall. Reading-fluency placement is based on the child’s current reading readiness, not age alone. For current class fees and package options, see the <Link to="/pricing" className="font-semibold underline underline-offset-2">Tiny Steps pricing page</Link>.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a fluency path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Phonics and decoding stability</li>
          <li>• Blending accuracy at word and sentence level</li>
          <li>• Passage reading pace and expression quality</li>
          <li>• Comprehension and retell consistency after reading</li>
          <li>• Reading confidence and response under guided practice</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          phonics gaps → blending accuracy → sentence reading → fluency → comprehension → confidence
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Frequently asked questions</h2>
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Choose the right next step</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • If several reading skills need support or the main gap is unclear:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For parent-facing slow-reader diagnostic guidance:{' '}
            <Link to="/slow-reader-child-help" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Slow Reader Child Help
            </Link>
          </li>
          <li>
            • For broad reading-issue diagnosis:{' '}
            <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Child Not Reading Properly
            </Link>
          </li>
          <li>
            • If decoding is still unstable:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Phonics Support
            </Link>
          </li>
          <li>
            • For immediate assessment booking:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free {demoMinutes}-Minute Demo
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Start with one free {demoMinutes}-minute 1:1 reading assessment</h2>
        <p className="mt-2 text-slate-200">Confirm whether the priority is decoding, fluency, comprehension, or broader reading support before choosing the next path.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free {demoMinutes}-Minute Demo
        </Link>
      </section>
    </div>
  );
}
