import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applySeo } from '../lib/seo';

type ProgramConfig = {
  slug: string;
  title: string;
  ages: string;
  outcome: string;
  focus: string;
  format: string;
  outcomes: string[];
  learn: string[];
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
};

const PROGRAMS: Record<string, ProgramConfig> = {
  'reading-jumpstart': {
    slug: 'reading-jumpstart',
    title: 'Reading Jumpstart',
    ages: 'Ages 4-7',
    outcome: '10-week summer camp with extra focus on reading',
    focus: 'Full curriculum (phonics, grammar, speaking) with extra focus on foundational reading fluency and decoding',
    format: 'Group classes (1:4 or 1:6) or Premium 1:1',
    outcomes: [
      'Blend CVC words confidently',
      'Read simple sentences with accuracy',
      'Build daily reading stamina',
    ],
    learn: [
      'Sound-letter connection for core sounds',
      'CVC blending routine with speed checks',
      'High-frequency words and sentence reading',
    ],
    steps: [
      'Free reading check and placement',
      '3 live sessions per week + micro practice',
      'Stage progress card and teacher feedback',
    ],
    faq: [
      {
        question: 'What is Reading Jumpstart?',
        answer:
          'A 10-week online summer camp following our core curriculum with extra focus on decoding and reading fluency. Children learn to blend, read simple sentences, and build daily reading stamina with mentor-led sessions and a clear weekly routine.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 4-7 who are just starting to read or need stronger blending and accuracy.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'Improved blending, smoother sentence reading, and a consistent at-home practice habit.',
      },
      {
        question: 'How are group classes different from 1:1?',
        answer:
          'Group classes are more affordable and build motivation through peers. Premium 1:1 is faster and fully personalized for your child.',
      },
    ],
  },
  'phonics-foundations': {
    slug: 'phonics-foundations',
    title: 'Phonics Foundations',
    ages: 'Ages 4-8',
    outcome: '10-week summer camp with extra focus on phonics',
    focus: 'Full curriculum (phonics, grammar, speaking) with extra focus on SATPIN sounds, blending routines, and accuracy',
    format: 'Group classes (1:4 or 1:6) or Premium 1:1',
    outcomes: [
      'Master core sounds',
      'Blend faster with fewer prompts',
      'Improve accuracy on tricky words',
    ],
    learn: [
      'Core sound sets with quick recall drills',
      'Blending with CVC words and short phrases',
      'Word families and decoding strategies',
    ],
    steps: [
      'Free reading check and placement',
      '3 live sessions per week + guided practice',
      'Stage progress card and teacher feedback',
    ],
    faq: [
      {
        question: 'What is Phonics Foundations?',
        answer:
          'A 10-week summer camp that follows our core curriculum with extra focus on sound knowledge, blending, and accuracy using guided practice and short daily routines.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 4-8 who are learning sounds or need better blending and decoding.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'More accurate sound recall, smoother blending, and better confidence in reading short words.',
      },
      {
        question: 'How are group classes different from 1:1?',
        answer:
          'Group classes provide peer energy and affordability. Premium 1:1 focuses on faster, fully personalized progress.',
      },
    ],
  },
  'confident-speaking': {
    slug: 'confident-speaking',
    title: 'Confident Speaking',
    ages: 'Ages 6-12',
    outcome: '10-week summer camp with extra focus on speaking',
    focus: 'Full curriculum (phonics, grammar, speaking) with extra focus on clear speech, structure, and confidence',
    format: 'Group classes (1:4 or 1:6) or Premium 1:1',
    outcomes: [
      'Speak with confidence in 60-90 seconds',
      'Use structure: intro, body, close',
      'Better pronunciation and clarity',
    ],
    learn: [
      'Voice, pace, and clarity routines',
      'Simple speech structures for kids',
      'Confidence drills with feedback',
    ],
    steps: [
      'Quick speaking check and placement',
      '2-3 live sessions per week + mini practice',
      'Stage progress card and teacher feedback',
    ],
    faq: [
      {
        question: 'What is Confident Speaking?',
        answer:
          'A 10-week summer camp that follows our core curriculum with extra focus on speaking clearly, using structure, and building confidence in short talks.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Best for ages 6-12 who want clearer speech, better structure, and more confidence when speaking.',
      },
      {
        question: 'What will my child achieve?',
        answer:
          'Clearer speech, stronger structure, and more confidence in short talks.',
      },
      {
        question: 'How are group classes different from 1:1?',
        answer:
          'Group classes build confidence with peers and are more affordable. Premium 1:1 is faster and fully tailored.',
      },
    ],
  },
};

function toTitleCase(value: string) {
  return value
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ProgramPage({ program, batchSlug }: { program: ProgramConfig | null; batchSlug?: string }) {
  if (!program) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900">Program coming soon</h1>
        <p className="mt-3 text-gray-700">
          This summer camp program page is being prepared. Please check the summer camps hub for
          current options.
        </p>
        <div className="mt-6">
          <Link
            to="/summer-camps"
            className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Summer Camps
          </Link>
        </div>
      </div>
    );
  }

  if (batchSlug) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          {program.title}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Batch details coming soon</h1>
        <p className="mt-3 text-gray-700">
          This batch page is a placeholder so parents never hit a dead end. Full schedule and
          enrollment details will be published here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/summer-camps/${program.slug}`}
            className="inline-flex items-center rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700"
          >
            View program details
          </Link>
          <Link
            to="/summer-camps"
            className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Summer Camps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            {program.title}
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
            {program.outcome}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            {program.focus}. {program.format}. {program.ages}.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">{program.ages}</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">10 weeks</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Online</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/summer-camps#batches"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
            >
              View Group Batches
            </Link>
            <Link
              to="/?book=1"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800"
            >
              Request 1:1 Slot
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
            <p className="mt-2 text-sm text-gray-700">
              {program.title} is a 10-week online summer camp that follows our core curriculum
              (phonics, grammar, and speaking) with extra focus on this track. Expect mentor-led
              sessions, practice tasks, and stage-based parent feedback across the full 10 weeks.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Who is it for?</h2>
            <p className="mt-2 text-sm text-gray-700">
              This program is best for {program.ages}. If your child needs a boost in this skill,
              this camp provides structure, feedback, and daily practice that is easy to follow.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
            <p className="mt-2 text-sm text-gray-700">
              Children make measurable progress through clear milestones and teacher feedback.
              Expect stronger skills, more confidence, and a clear next-step plan after 10 weeks.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Group vs Premium 1:1</h2>
            <p className="mt-2 text-sm text-gray-700">
              Group classes build motivation and are more affordable. Premium 1:1 is faster and
              fully personalized. Both include stage-based progress updates and teacher feedback.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">What kids will learn</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {program.learn.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">How it works</h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-700">
              {program.steps.map((item, idx) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Choose your format</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Group Classes
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Best for motivation, peer learning, and affordability. Format: 1:4 or 1:6.
                Includes stage-based progress updates and teacher feedback.
              </p>
              <div className="mt-4">
                <Link
                  to="/summer-camps#batches"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  View Group Batches
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Premium 1:1
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Best for faster progress and personalized attention. Includes a custom plan and
                parent updates.
              </p>
              <div className="mt-4">
                <Link
                  to="/?book=1"
                  className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Request 1:1 Slot
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">FAQs</h3>
          <div className="mt-4 space-y-4">
            {program.faq.map((item) => (
              <div key={item.question}>
                <div className="text-sm font-semibold text-gray-900">{item.question}</div>
                <div className="mt-1 text-sm text-gray-700">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SummerCampProgramPage() {
  const { programSlug, batchSlug } = useParams<{ programSlug: string; batchSlug?: string }>();
  const program = useMemo(() => (programSlug ? PROGRAMS[programSlug] ?? null : null), [programSlug]);

  useEffect(() => {
    const baseTitle = program?.title || 'Summer Camp Program';
    const batchTitle = batchSlug ? `Batch ${toTitleCase(batchSlug)}` : '';
    const title = batchSlug ? `${baseTitle} ${batchTitle} | Tiny Steps` : `${baseTitle} | Tiny Steps`;
    const description = program
      ? `${program.title} for ${program.ages}. ${program.focus}. Group classes or 1:1 options with stage-based progress updates.`
      : 'Summer camp program details coming soon.';

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://tinystepslearning.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Summer Camps',
          item: 'https://tinystepslearning.com/summer-camps',
        },
        ...(program
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: program.title,
                item: `https://tinystepslearning.com/summer-camps/${program.slug}`,
              },
            ]
          : []),
        ...(batchSlug
          ? [
              {
                '@type': 'ListItem',
                position: program ? 4 : 3,
                name: toTitleCase(batchSlug),
                item: `https://tinystepslearning.com/summer-camps/${programSlug}/${batchSlug}`,
              },
            ]
          : []),
      ],
    };

    const courseSchema = program
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: program.title,
          description: program.focus,
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
          },
        }
      : null;

    const faqSchema =
      program && program.faq.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: program.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }
        : null;

    applySeo({
      title,
      description,
      canonicalPath: batchSlug
        ? `/summer-camps/${programSlug}/${batchSlug}`
        : `/summer-camps/${programSlug}`,
      ogType: 'website',
      noIndex: Boolean(batchSlug) || !program,
      jsonLd: [breadcrumbSchema, courseSchema, faqSchema].filter(Boolean) as object[],
    });
  }, [program, programSlug, batchSlug]);

  return <ProgramPage program={program} batchSlug={batchSlug} />;
}
