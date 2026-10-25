import { Link } from 'react-router-dom';
import ConversionHero from '../components/Home/ConversionHero';
import Meta from '../components/common/Meta';
import { ROUTE_SEO_REGISTRY } from '../lib/routeSeoRegistry.js';
import { createWebPageSchema, organizationSchema, PUBLIC_FACTS, websiteSchema } from '../lib/schemas';

const homeSeo = ROUTE_SEO_REGISTRY['/'];
const homeUrl = PUBLIC_FACTS.primaryWebsite + '/';

const homeWebPageSchema = {
  ...createWebPageSchema({
    name: homeSeo.title,
    description: homeSeo.description,
    url: homeUrl,
  }),
  '@id': homeUrl + '#webpage',
  mainEntity: { '@id': PUBLIC_FACTS.primaryWebsite + '/#educational-organization' },
  about: [
    { '@type': 'Thing', name: 'Online English learning for children' },
    { '@type': 'Thing', name: 'Letter sounds, phonics, blending, decoding and spelling' },
    { '@type': 'Thing', name: 'Reading fluency, vocabulary and comprehension' },
    { '@type': 'Thing', name: 'Grammar and sentence building' },
    { '@type': 'Thing', name: 'Spoken English and everyday conversation' },
    { '@type': 'Thing', name: 'Public speaking and communication skills' },
  ],
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
    audienceType: 'Children aged 3–12',
  },
};

const homepageSchemas = [organizationSchema, websiteSchema, homeWebPageSchema];

const learningPaths = [
  {
    label: 'Phonics',
    description: 'Connect sounds to letters, blend and decode words, and build spelling skills.',
    path: '/phonics',
  },
  {
    label: 'Reading',
    description: 'Build reading fluency, vocabulary and comprehension with meaningful texts.',
    path: '/reading-classes-for-kids',
  },
  {
    label: 'Grammar',
    description: 'Strengthen grammar, punctuation and sentence building for clearer expression.',
    path: '/grammar',
  },
  {
    label: 'Public Speaking',
    description: 'Develop storytelling, presentations and confident communication.',
    path: '/speaking',
  },
];

const reasons = [
  {
    label: 'Start with what the child knows',
    description: 'We identify strengths, learning gaps and readiness before choosing what to teach next.',
  },
  {
    label: 'Learn through active participation',
    description: 'Children think, read, speak, practise and try again with supportive teacher feedback.',
  },
  {
    label: 'Make progress visible',
    description: 'Teachers check how independently children use new skills and identify the next learning focus for parents.',
  },
];

const exploreLinks = [
  { title: 'Curriculum', description: 'See how the learning pathways are organised.', path: '/curriculum' },
  { title: 'Real class samples', description: 'Take a closer look at our teaching.', path: '/class-samples' },
  { title: 'Pricing', description: 'Understand the available lesson formats and fees.', path: '/pricing' },
  { title: 'Learning resources', description: 'Discover practical English-learning guides.', path: '/resources' },
  { title: 'Parent articles', description: 'Find answers to common learning questions.', path: '/blog' },
  { title: 'FAQs', description: 'Read the practical details before you begin.', path: '/faq' },
];

function LearningPathwaysSection() {
  return (
    <section id="learning-pathways" aria-labelledby="learning-pathways-title" className="scroll-mt-24 bg-[#F7F8FA] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="inline-block max-w-full rounded-lg bg-[#102A43] px-3 py-2 text-sm font-bold uppercase leading-6 tracking-[0.08em] text-[#FF7A00] sm:text-base">The complete English-learning journey</p>
        <h2 id="learning-pathways-title" className="mt-5 max-w-5xl text-3xl font-bold tracking-[-0.04em] text-[#102A43] sm:text-4xl">
          From Letter Sounds to Confident Communication.
        </h2>
        <div className="mt-6 grid gap-5 text-base leading-8 text-slate-600 sm:text-lg lg:grid-cols-2 lg:gap-12">
          <p>
            Tiny Steps brings together phonics, blending and spelling; reading fluency, vocabulary and comprehension; grammar and sentence building; and spoken English, public speaking and communication skills.
          </p>
          <p>
            Instead of following one fixed sequence for every child, we assess their starting point and build the next skills through age-appropriate activities, guided practice and teacher feedback.
          </p>
        </div>
        <div className="mt-9 grid gap-px overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-200 shadow-[0_8px_32px_rgba(16,42,67,0.035)] sm:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => (
            <Link
              key={path.path}
              to={path.path}
              aria-label={`Explore ${path.label} online classes for kids`}
              className="group relative flex min-h-[188px] min-w-0 flex-col bg-white px-6 py-6 outline-none motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#FAFBFD] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#102A43] sm:min-h-[220px] sm:px-7 sm:py-8 lg:px-6"
            >
              <h3 className="text-[clamp(1.18rem,1.7vw,1.45rem)] font-semibold leading-tight tracking-[-0.035em] text-[#102A43]">
                {path.label}
              </h3>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-slate-600">
                {path.description}
              </p>
              <span className="mt-6 w-fit border-b border-transparent pb-1 text-sm font-semibold tracking-[0.01em] text-[#102A43] motion-safe:transition-[border-color] motion-safe:duration-200 group-hover:border-[#FF7A00] group-focus-visible:border-[#FF7A00]">
                Explore
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-x-10 gap-y-3 text-sm leading-7 text-slate-600 sm:flex-row sm:flex-wrap">
          <p>
            Need conversation practice?{' '}
            <Link to="/spoken-english-classes-for-kids-online" className="rounded-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] underline-offset-4 hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]">
              Explore Spoken English Classes
            </Link>
          </p>
          <p>
            Looking for more courses?{' '}
            <Link to="/courses" className="rounded-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] underline-offset-4 hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]">
              Browse all courses
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function DifferenceSection() {
  return (
    <section aria-labelledby="difference-title" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9B4300]">The Tiny Steps approach</p>
        <h2 id="difference-title" className="mt-4 max-w-4xl text-3xl font-bold tracking-[-0.04em] text-[#102A43] sm:text-4xl">
          Child-Centred Teaching. Meaningful Progress.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          Every lesson combines clear learning goals, live teacher guidance and purposeful practice—helping
          children understand, apply and become more independent in English.
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {reasons.map((reason) => (
            <article key={reason.label} className="min-w-0 border-t border-slate-200 pt-6">
              <h3 className="max-w-[18rem] text-xl font-semibold leading-snug tracking-[-0.03em] text-[#102A43]">
                {reason.label}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{reason.description}</p>
            </article>
          ))}
        </div>

        <Link
          to="/why-tiny-steps"
          className="mt-9 inline-block rounded-sm border-b-2 border-[#FF7A00] pb-1 text-sm font-semibold text-[#102A43] transition-colors hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]"
        >
          See how Tiny Steps teaches
        </Link>
      </div>
    </section>
  );
}

function TechnologySection() {
  return (
    <section aria-labelledby="technology-title" className="bg-[#F7F8FA] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9B4300]">Connected learning</p>
          <h2 id="technology-title" className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.04em] text-[#102A43] sm:text-4xl">
            Live Teaching. A Connected Learning Experience.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Children learn with real teachers through interactive online lessons, while parents can access
            class information, learning materials and progress updates through the Tiny Steps platform.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-4 text-sm font-semibold">
            <Link to="/curriculum" className="rounded-sm border-b-2 border-[#FF7A00] pb-1 text-[#102A43] hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]">
              Explore the curriculum
            </Link>
            <Link to="/class-samples" className="rounded-sm border-b-2 border-[#FF7A00] pb-1 text-[#102A43] hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]">
              Watch real classes
            </Link>
          </div>
        </div>
        <div className="min-w-0 rounded-[1.75rem] bg-[#102A43] p-6 text-white sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-orange-300">Your learning connection</p>
          <div className="mt-6 divide-y divide-white/15">
            <div className="py-4 first:pt-0">
              <h3 className="text-lg font-semibold">Live online classrooms</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Children participate, ask questions and receive teacher guidance in real time.
              </p>
            </div>
            <div className="py-4">
              <h3 className="text-lg font-semibold">Purposeful practice</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Worksheets and interactive activities reinforce skills beyond the live lesson.
              </p>
            </div>
            <div className="py-4 last:pb-0">
              <h3 className="text-lg font-semibold">Parent portal</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Parents can join scheduled classes, access worksheets and follow learning progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreSection() {
  return (
    <section aria-labelledby="explore-title" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9B4300]">Go deeper</p>
        <h2 id="explore-title" className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#102A43] sm:text-4xl">
          Explore what matters to you.
        </h2>
        <div className="mt-9 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {exploreLinks.map((item) => (
            <Link key={item.path} to={item.path} className="group flex items-start justify-between gap-3 border-b border-slate-200 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
              <span><span className="block text-base font-semibold text-slate-950 group-hover:text-orange-700">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
              </span>
              <span aria-hidden="true" className="text-slate-400 group-hover:text-orange-700">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalInvitationSection() {
  return (
    <section id="homepage-final-invitation" aria-labelledby="final-invitation-title" className="border-t border-orange-100 bg-[#FFF8F1] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="min-w-0">
          <h2 id="final-invitation-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#102A43] sm:text-4xl">
            Start with a conversation about your child's learning.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            One free 35-minute 1:1 demo assessment helps identify a suitable starting point.
          </p>
        </div>
        <Link to="/book-demo" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#102A43] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B2138] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]">
          Book Free 35-Minute Demo
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Meta
        title={homeSeo.title}
        description={homeSeo.description}
        canonical={homeUrl}
        jsonLd={homepageSchemas}
      />
      <div className="bg-white">
        <ConversionHero />
        <LearningPathwaysSection />
        <DifferenceSection />
        <TechnologySection />
        <ExploreSection />
        <FinalInvitationSection />
      </div>
    </>
  );
}
