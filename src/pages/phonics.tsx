import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import PageHero from '../components/common/PageHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import ParentReassurance from '../components/programs/ParentReassurance';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import TopicClusterLinks from '../components/programs/TopicClusterLinks';
import ContentTrustNote from '../components/seo/ContentTrustNote';

const levels = [
  {
    name: 'Foundations',
    outcomes: [
      'Letter sounds + structured synthetic phonics SATPIN blending routines',
      'Short vowels + early CVC words',
      'Lesson-by-lesson practice prompts',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/phonics-foundations'
  },
  {
    name: 'Early Phonics',
    outcomes: [
      'Digraphs, vowel teams, silent-e',
      'Magic E + long vowel patterns',
      'Stage check-ins for fluency',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/early-phonics'
  },
  {
    name: 'Advanced Phonics',
    outcomes: [
      'Diphthongs, bossy R, alternate vowels',
      'Multisyllabic decoding + spelling rules',
      'Fluency + comprehension practice',
    ],
    pdf: '/curriculum',
    courseHref: '/courses/advanced-phonics'
  }
];

const stages = [
  { title: 'Stage 1 • Sounds to words', duration: 'Lessons 1–10', description: 'SATPIN, blending club, AI-driven home practice.' },
  { title: 'Stage 2 • Rules & teams', duration: 'Lessons 11–24', description: 'Digraphs, magic-e, vowel teams, tricky patterns.' },
  { title: 'Stage 3 • Fluency & writing', duration: 'Lessons 25–36+', description: 'Reading passages with expression, spelling, and short paragraphs.' }
];

import AutoLinkedText from '../components/seo/AutoLinkedText';

const quickAnswerFaqItems = [
  {
    question: 'What makes Tiny Steps phonics classes different?',
    answer:
      'Tiny Steps focuses on personalized 1:1 phonics learning, step-by-step blending, interactive digital worksheets, reading practice, and clear parent progress updates so children build reading confidence gradually.',
  },
  {
    question: 'Are online phonics classes useful for kids?',
    answer:
      'Yes. Online phonics classes are useful when they teach letter sounds, blending, decoding, and reading practice in a clear sequence with live correction. This helps children move from knowing letters to reading words and sentences.',
  },
  {
    question: 'What age is best to start phonics classes?',
    answer:
      'Many children can start early phonics around ages 3 to 5 when they are ready for sounds, listening games, and letter recognition. Older children can also benefit if they need help with blending, reading fluency, or spelling patterns.',
  },
  {
    question: 'How do phonics classes help a child read?',
    answer:
      'Phonics classes help children connect sounds with letters and blend those sounds into words. This builds decoding skill, so children can read unfamiliar words instead of guessing.',
  },
  {
    question: 'Does Tiny Steps teach phonics through live classes?',
    answer:
      'Yes. Tiny Steps teaches phonics through live guided online classes with teacher support, reading practice, correction, and stage-based progress.',
  },
  {
    question: 'How can parents know if their child needs phonics support?',
    answer:
      'A child may need phonics support if they know the alphabet but cannot read words, guess while reading, struggle with blending, forget words often, or read very slowly.',
  },
];

const faqItems = [
  {
    question: 'What is synthetic phonics?',
    answer:
      'Synthetic phonics teaches children to read by connecting sounds (phonemes) with letters and blending them into words. It builds a clear path from sound awareness to phonics reading confidence.',
  },
  {
    question: 'What is Jolly Phonics?',
    answer:
      'Jolly Phonics is a popular synthetic phonics method that teaches sound-to-letter links and blending routines. Many families use it as an early reading foundation.',
  },
  {
    question: 'Do you follow Jolly Phonics?',
    answer:
      'Our program is based on structured synthetic phonics principles and includes techniques used in methods such as Jolly Phonics. We focus on understanding sounds, blending words, and confident reading development.',
  },
  {
    question: 'My child knows letters but cannot read — what should I do?',
    answer:
      'This usually means blending is not stable yet. Start with guided sound-to-letter practice, blending sounds, and decodable reading so letter knowledge turns into real reading.',
  },
  {
    question: 'How long does it take for a child to start reading?',
    answer:
      'With consistent structured practice, many children begin blending first words within 4–6 lessons. Reading progress depends on starting level, class consistency, and home reinforcement.',
  },
  {
    question: 'Is phonics enough for learning English?',
    answer:
      'Phonics is the reading foundation, but children also need vocabulary, comprehension, grammar, and speaking practice. Strong English grows when decoding and language development progress together.',
  },
  {
    question: 'How is this different from school teaching?',
    answer:
      'School teaching often moves by class pace. Tiny Steps uses level-based structured phonics progression with live correction, so each child gets clearer support and measurable milestones.',
  },
  {
    question: 'What age should phonics start?',
    answer:
      'Most children can begin around ages 3–4 with playful sound work. Older children can also catch up effectively when gaps are addressed with structured synthetic phonics.',
  },
  {
    question: 'Do you offer online phonics classes for families across India?',
    answer:
      'Yes. Tiny Steps supports families across India through live online phonics classes, and also supports learners globally with level-based teaching and parent-visible progress updates.',
  },
];
const schemaFaqItems = Array.from(
  new Map([...quickAnswerFaqItems, ...faqItems].map((item) => [item.question, item])).values(),
);
const PHONICS_RESEARCH_GUIDE_PATH = '/blog/phonics-for-parents-guide';
const PHONICS_SEO_KEYWORDS = [
  'phonics for kids',
  'phonics for parents',
  'synthetic phonics',
  'structured phonics',
  'Jolly Phonics',
  'phonics-based reading',
  'blending sounds into words',
  'what is phonics',
  'why phonics is important',
  'how to teach phonics at home',
  'online phonics classes for kids',
  'online phonics classes for kids in India',
  'phonics classes in India',
  'phonics classes for kids',
  'reading classes for kids',
  'SATPIN phonics',
];

type PhonicsSeoOverrides = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  breadcrumbName?: string;
};

type PhonicsPageProps = {
  seoOverrides?: PhonicsSeoOverrides;
  heroTitleOverride?: string;
  heroSubtitleOverride?: string;
  afterHeroContent?: React.ReactNode;
  afterContent?: React.ReactNode;
  extraJsonLd?: object[];
};

export default function PhonicsPage({
  seoOverrides,
  heroTitleOverride,
  heroSubtitleOverride,
  afterHeroContent,
  afterContent,
  extraJsonLd,
}: PhonicsPageProps) {
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const canonicalPath = seoOverrides?.canonicalPath ?? "/phonics";
  const registry = getRouteConfig(canonicalPath);
  const title = seoOverrides?.title ?? registry?.title ?? "Online Phonics Classes for Kids in India | Tiny Steps Learning";
  const description =
    seoOverrides?.description ??
    registry?.description ??
    "Phonics classes for kids that build sound-letter links, blending, and decoding. Ideal for parents looking for online reading classes for kids in India.";
  const breadcrumbName = seoOverrides?.breadcrumbName ?? "Phonics";
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids in India";
  const heroSubtitle = heroSubtitleOverride ?? "Help your child move from letter sounds to blending, reading, spelling, and reading confidence through premium 1:1 online phonics classes.";
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  useEffect(() => {
    const courseSchema = createCourseSchema({
      name: "Online Phonics Classes for Kids",
      description:
        "Structured online phonics classes for children aged 3–12, covering letter sounds, blending, decoding, reading fluency, and confidence through live guided practice.",
      url: canonicalUrl,
      educationalLevel: 'Foundation to Advanced'
    });
    const phonicsPathwaySchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#phonics-pathway`,
      name: 'Phonics learning pathway for children',
      itemListElement: stages.map((stage, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: stage.title,
          description: `${stage.duration} — ${stage.description}`,
        },
      })),
    };

    const baseJsonLd = [
      courseSchema,
      phonicsPathwaySchema,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
          { "@type": "ListItem", "position": 2, "name": breadcrumbName, "item": canonicalUrl }
        ]
      },
      createFAQPageSchema(schemaFaqItems)
    ];

    applySeo({
      title,
      description,
      keywords: PHONICS_SEO_KEYWORDS,
      canonicalPath,
      ogType: "website",
      jsonLd: extraJsonLd?.length ? [...baseJsonLd, ...extraJsonLd] : baseJsonLd,
    });
  }, [title, description, canonicalPath, breadcrumbName, canonicalUrl, extraJsonLd]);

  return (
    <div>
      <PageHero
        eyebrow="Tiny Steps Phonics"
        title={heroTitle}
        description={heroSubtitle}
        badges={['Ages 3–12', 'Live 1:1 or pods', '35–40 minute sessions']}
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free Assessment
            </Link>
            <Link
              to="/phonics#program"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Explore Phonics Program
            </Link>
          </div>
        )}
      />

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-sky-100 bg-gradient-to-r from-slate-50 to-sky-50 p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">What makes Tiny Steps phonics classes different?</h2>
        <p className="mt-2 text-base text-gray-800">
          Tiny Steps focuses on personalized 1:1 phonics learning, step-by-step blending, interactive digital worksheets, reading practice, and clear parent progress updates so children build reading confidence gradually.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickAnswerFaqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-sky-100 bg-white/90 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">What your child learns</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>• Letter sounds and sound recognition</li>
          <li>• Blending sounds into words</li>
          <li>• CVC words and short vowel reading</li>
          <li>• Digraphs, blends, and advanced phonics patterns</li>
          <li>• Reading fluency and spelling confidence</li>
          <li>• Grammar and sentence formation support where needed</li>
        </ul>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-[#1f2a44] to-[#263e6d] p-6 text-white shadow-sm sm:mx-auto sm:p-8">
        <h2 className="text-2xl font-bold text-white">Not sure where your child should start?</h2>
        <p className="mt-3 text-slate-100">
          Book a free assessment and we will identify your child’s current reading level, phonics gaps, and the right learning path.
        </p>
        <Link
          to="/book-demo"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment
        </Link>
      </section>

      <ContentTrustNote text="This page is created by the Tiny Steps academic team and reviewed by the founder to help parents understand structured phonics and reading development." />

      <section className="mx-4 my-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-auto">
        <h2 className="text-xl font-bold text-slate-900">Proof: how children learn to read</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            '🔤 Sounds',
            '🧩 Blending',
            '📖 Words',
            '📚 Reading',
          ].map((step) => (
            <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-800">
              {step}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Children move step by step from recognizing sounds to reading full sentences with confidence.
        </p>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Do you use Jolly Phonics methods?</h2>
        <p className="mt-3 text-slate-700">
          Our phonics program is based on structured synthetic phonics principles and includes techniques used in methods such as Jolly Phonics.
        </p>
        <p className="mt-2 text-slate-700">
          We focus on helping children understand sounds, blend words, and read confidently — not just memorize.
        </p>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Phonics vs general reading practice</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Phonics instruction</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li>• Teaches sound-letter links directly</li>
              <li>• Builds blending and decoding routines</li>
              <li>• Helps children read unfamiliar words</li>
            </ul>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">General reading practice</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li>• Builds exposure to books and vocabulary</li>
              <li>• Improves comprehension with repetition</li>
              <li>• Works best when decoding is already stable</li>
            </ul>
          </article>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Children progress fastest when phonics decoding and reading practice are built together.
        </p>
      </section>

      {/* Program Facts */}
      <section id="program">
        <ProgramFacts
          ageRange="Ages 3-12"
          format="Live 1:1 or small group online"
          duration={`${PUBLIC_FACTS.sessionDuration}, 2-3x per week`}
          structure="3 levels, 36+ lessons with stage-based progression"
          outcomes={[
            'Master letter sounds and blending—typically within 4-6 lessons',
            'Read CVC words and simple sentences with phonics-based reading confidence',
            'Build fluency with digraphs, vowel teams, and tricky words',
            'Progress from individual sounds to reading full passages with comprehension',
          ]}
        />
      </section>

      {afterHeroContent}
      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />

      {/* Program Proof */}
      <ProgramProof
        metrics={[
          { value: '4-6', label: 'Lessons to blend first words' },
          { value: '30-40', label: 'Lessons to master basic phonics' },
          { value: 'Stage-based', label: 'Clear progress reports every 12 lessons' },
          { value: 'Live 1:1 or group', label: 'Personalized pace and feedback' },
        ]}
      />

      {/* Buyer Guide Section */}
      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 px-5 py-10 shadow-sm sm:mx-auto sm:px-6 sm:py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choosing the best online phonics classes in India</h2>
        <p className="text-gray-700 mb-4">
          Evaluating online phonics programs can be overwhelming. Our comprehensive buyer guide helps parents compare options using a 10-point checklist covering curriculum quality, teacher credentials, class formats (1:1 vs group), trial policies, and pricing transparency.
        </p>
        <p className="text-gray-700 mb-6">
          Whether you're looking for your first phonics program or switching from another provider, this guide includes FAQs from Indian parents and practical tips for making an informed decision.
        </p>
        <p className="text-gray-700 mb-6">
          For focused discovery, parents also explore{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            reading classes for kids
          </Link>
          ,{' '}
          <Link to="/reading-fluency-program" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            reading fluency program
          </Link>
          , and{' '}
          <Link to="/phonics-fees-india" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            phonics fees in India
          </Link>
          . For preschool readiness, some families also review{' '}
          <Link to="/english-classes-for-4-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 4 year old
          </Link>{' '}
          options, while school-age families can compare{' '}
          <Link to="/english-classes-for-6-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 6 year old
          </Link>{' '}
          and{' '}
          <Link to="/english-classes-for-7-10-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 7 to 10 year old
          </Link>{' '}
          pathways, and if decoding is still inconsistent, they use our{' '}
          <Link to="/child-not-reading-properly" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            child not reading properly
          </Link>{' '}
          guide.
        </p>
        <Link 
          to="/best-online-phonics-classes-india"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Read the buyer guide: best online phonics classes in India
          <span className="text-lg">→</span>
        </Link>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,#fff8ed_0%,#ffffff_48%,#eef7ff_100%)] px-5 py-10 shadow-sm sm:mx-auto sm:px-6 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">For parents doing their research</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">What phonics is, why it matters, and how to teach it at home</h2>
        <p className="mt-4 text-gray-700">
          If you are still figuring out what phonics actually means, why some children struggle to blend,
          or how to support reading without pressure, start with our research guide written for parents.
        </p>
        <p className="mt-3 text-gray-700">
          It covers what phonics is, why it is important, how multilingual homes can approach it, and a
          simple 10-minute routine you can use at home.
        </p>
        <Link
          to={PHONICS_RESEARCH_GUIDE_PATH}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-900 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
        >
          Read the phonics research guide
          <span className="text-lg">→</span>
        </Link>
      </section>

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Free tracing practice for home</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Parents looking for immediate practice can use our free browser games:
          {' '}
          <Link to="/free-letter-tracing-game-for-kids" className="font-semibold text-sky-900 underline underline-offset-4">
            Free Letter Tracing Game
          </Link>
          {' '}and{' '}
          <Link to="/letter-tracing-with-sounds-game" className="font-semibold text-sky-900 underline underline-offset-4">
            Letter Tracing With Sounds Game
          </Link>
          .
        </p>
      </section>

      {afterContent}

      <TopicClusterLinks
        title="Learn More About Phonics"
        links={[
          { label: 'What is Phonics for Kids?', href: '/blog/what-is-phonics-for-kids' },
          { label: 'Synthetic Phonics vs Traditional', href: '/blog/synthetic-phonics-vs-traditional-reading' },
          { label: 'Why Child is Not Reading Properly', href: '/child-not-reading-properly' },
          { label: 'Phonics Blending Explained', href: '/blog/phonics-blending-activities' },
          { label: 'CVC Words Guide', href: '/blog/cvc-words-explained-for-parents' },
          { label: 'How Kids Learn Blending', href: '/blog/how-kids-learn-blending' },
          { label: 'Online Phonics Reading Classes', href: '/phonics' },
          { label: 'Phonics Games for Preschoolers', href: '/phonics-games-for-preschoolers' }
        ]}
      />

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Phonics"
        links={[
          { 
            label: 'All Courses', 
            href: '/courses', 
            description: 'Compare all phonics, grammar & speaking courses',
            icon: '🏫'
          },
          {
            label: 'Grammar Pathway',
            href: '/grammar',
            description: 'Build sentence accuracy and writing clarity after decoding',
            icon: '✍️'
          },
          {
            label: 'Speaking Pathway',
            href: '/speaking',
            description: 'Develop communication confidence alongside reading growth',
            icon: '🎤'
          },
          { 
            label: 'Full Curriculum', 
            href: '/curriculum', 
            description: 'See all lesson topics across 3 levels',
            icon: '📚'
          },
          { 
            label: 'Pricing Options', 
            href: '/pricing', 
            description: '1:1 and small group packages',
            icon: '💰'
          },
          { 
            label: 'Why Tiny Steps', 
            href: '/why-tiny-steps', 
            description: 'Our approach and teaching philosophy',
            icon: '⭐'
          },
          { 
            label: 'Phonics Buyer Guide', 
            href: '/best-online-phonics-classes-india', 
            description: 'Compare programs and make an informed choice',
            icon: '🔍'
          },
          { 
            label: 'Phonics Research Guide', 
            href: PHONICS_RESEARCH_GUIDE_PATH, 
            description: 'What phonics is, why it matters, and how to teach it at home',
            icon: '🧠'
          },
          { 
            label: 'Getting Started Guide', 
            href: '/parents/getting-started', 
            description: 'How to prepare for your first assessment',
            icon: '🎓'
          },
          {
            label: 'Parents Hub',
            href: '/parents',
            description: 'Parent guides for routines, support, and progress clarity',
            icon: '👨‍👩‍👧'
          },
          { 
            label: 'Daily Phonics Practice', 
            href: '/parents/phonics-mission', 
            description: '5-minute home practice routine',
            icon: '📝'
          },
          { 
            label: 'Reading at Home Tips', 
            href: '/parents/reading-at-home', 
            description: '10-minute guided reading routine',
            icon: '📖'
          },
          {
            label: 'Reading Fluency Program',
            href: '/reading-fluency-program',
            description: 'Move from slow decoding to smoother reading flow',
            icon: '🚀'
          },
          {
            label: 'Phonics Fees in India',
            href: '/phonics-fees-india',
            description: 'Compare fee-to-outcome fit before enrollment',
            icon: '₹'
          },
          {
            label: 'Class Samples',
            href: '/class-samples',
            description: 'See real class moments before you decide',
            icon: '🎬'
          },
        ]}
      />

      <section className="mx-4 my-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:mx-auto sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Related reading for parents</h2>
        <p className="mt-2 text-sm text-slate-700">Simple guides to help you understand how children learn to read</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              to: '/blog/satpin-phonics-guide',
              title: 'SATPIN Phonics Guide for Parents',
              helper: 'Understand the SATPIN sequence and home practice flow',
            },
            {
              to: '/blog/how-phonics-grammar-and-communication-work-together',
              title: 'How Phonics, Grammar and Communication Work Together',
              helper: 'See how reading connects to sentence formation and expression',
            },
            {
              to: '/blog/how-to-engage-kids-in-english-learning-at-home',
              title: 'How to Engage Kids in English Learning at Home',
              helper: 'Use short daily routines that combine phonics, grammar, and communication',
            },
            {
              to: '/blog/child-knows-letter-sounds-but-cannot-read',
              title: 'Child Knows Sounds but Cannot Read Words',
              helper: 'Understand why blending breaks down and how to support reading at home',
            },
          ].map((item) => (
            <article key={item.to} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Link to={item.to} className="text-base font-semibold text-slate-900 hover:text-sky-700 hover:underline">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-slate-700">{item.helper}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={expandAllFaq}
              disabled={allFaqOpen}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAllFaq}
              disabled={!openFaqIndexes.length}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndexes.includes(index);
            return (
              <article key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-slate-900">{item.question}</span>
                  <span className={`text-xl font-bold text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    +
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden px-5 pb-5 text-slate-700">
                    <AutoLinkedText text={item.answer} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Parent Reassurance */}
      <ParentReassurance programName="our phonics program" />

      {/* Book Assessment CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-[#263e6d] p-6 text-center text-white sm:p-8">
          <p className="mb-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-100">
            TRUSTED BY PARENTS
          </p>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Ready to Start Your Phonics Journey?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-100">
            Book a free 35–40 minute assessment session with our mentors to understand your child's current level and get a personalized phonics learning plan.
          </p>
          <Link
            to="/book-demo"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
