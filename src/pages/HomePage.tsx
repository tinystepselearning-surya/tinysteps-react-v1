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
    number: '01',
    label: 'Phonics',
    description: 'Letter sounds, sound–letter patterns, blending, decoding and spelling for more independent word reading.',
    path: '/phonics',
    action: 'Explore phonics',
  },
  {
    number: '02',
    label: 'Reading',
    description: 'Build reading accuracy, fluency, vocabulary, comprehension and confidence with texts.',
    path: '/reading-classes-for-kids',
    action: 'Explore reading',
  },
  {
    number: '03',
    label: 'Grammar',
    description: 'Understand grammar, build clear sentences and apply language rules in speaking and writing.',
    path: '/grammar',
    action: 'Explore grammar',
  },
  {
    number: '04',
    label: 'Public Speaking',
    description: 'Develop storytelling, organised answers, presentation skills and confident communication.',
    path: '/speaking',
    action: 'Explore public speaking',
  },
];

const reasons = [
  {
    label: 'Age-aware, skill-led placement',
    description: 'We consider the child’s age, current skills and readiness before recommending a useful starting point.',
  },
  {
    label: 'Purposeful, engaging activities',
    description: 'Teachers use stories, questions, guided practice and feedback to help children think, participate and apply new skills.',
  },
  {
    label: 'Individual pace, visible progress',
    description: 'Teachers adjust their support as children grow more independent, with clear learning goals and next steps for parents.',
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
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => (
            <Link
              key={path.path}
              to={path.path}
              className="group flex min-h-[245px] min-w-0 flex-col rounded-[1.5rem] border border-slate-200 bg-white p-6 transition-colors hover:border-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              <span className="text-xs font-semibold tracking-[0.12em] text-orange-600" aria-hidden="true">{path.number}</span>
              <h3 className="mt-7 text-2xl font-semibold tracking-[-0.035em] text-slate-950">{path.label}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-7 text-slate-600">{path.description}</p>
              <span className="mt-6 text-base font-semibold text-slate-900 group-hover:text-orange-700">
                {path.action} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-slate-600">
          Need everyday conversation practice? <Link to="/spoken-english-classes-for-kids-online" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">Explore Spoken English Classes</Link>.
          {' '}Looking for more courses? <Link to="/courses" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">Browse all courses</Link>.
        </p>
      </div>
    </section>
  );
}

function DifferenceSection() {
  return (
    <section aria-labelledby="difference-title" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">The Tiny Steps approach</p>
        <h2 id="difference-title" className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Thoughtful learning, without the guesswork.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Child-centred teaching means helping each learner understand, practise and use English with growing independence—not simply memorise rules or rush through lessons.
        </p>
        <div className="mt-10 grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-3">
          {reasons.map((reason, index) => (
            <article key={reason.label}>
              <p className="text-sm font-semibold text-orange-700">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-slate-950">{reason.label}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{reason.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-9 max-w-4xl border-t border-slate-200 pt-6 text-sm leading-7 text-slate-600">
          Our transferable English skills support children studying in CBSE, ICSE, IB, Cambridge and other school environments. Tiny Steps is an independent learning provider, not formally affiliated with these school systems.
        </p>
        <Link to="/why-tiny-steps" className="mt-6 inline-block text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">
          See how Tiny Steps teaches <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

function TechnologySection() {
  return (
    <section aria-labelledby="technology-title" className="bg-[#F7F8FA] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Connected learning</p>
          <h2 id="technology-title" className="mt-3 max-w-lg text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Human-led learning. Technology that helps.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Live online classes, purposeful practice and a parent portal make learning accessible and progress easier to follow.
            Technology supports the teacher-child connection; it does not replace it.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link to="/curriculum" className="text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">
              Explore the curriculum
            </Link>
            <Link to="/class-samples" className="text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">
              Watch real classes
            </Link>
          </div>
        </div>
        <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">Your learning connection</p>
          <ol className="mt-6 divide-y divide-white/15">
            <li className="flex gap-5 py-4">
              <span className="font-semibold text-orange-300">01</span>
              <div><h3 className="font-semibold">Live teacher-led classes</h3><p className="mt-1 text-sm leading-6 text-slate-300">Interact, ask questions and practise in real time.</p></div>
            </li>
            <li className="flex gap-5 py-4">
              <span className="font-semibold text-orange-300">02</span>
              <div><h3 className="font-semibold">Skill-focused activities</h3><p className="mt-1 text-sm leading-6 text-slate-300">Apply new knowledge through meaningful practice.</p></div>
            </li>
            <li className="flex gap-5 py-4">
              <span className="font-semibold text-orange-300">03</span>
              <div><h3 className="font-semibold">Parent visibility</h3><p className="mt-1 text-sm leading-6 text-slate-300">Access class information and follow learning progress.</p></div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function ExploreSection() {
  return (
    <section aria-labelledby="explore-title" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Go deeper</p>
        <h2 id="explore-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
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
    <section aria-labelledby="final-invitation-title" className="bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <h2 id="final-invitation-title" className="max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Start with a conversation about your child's learning.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            One free 35-minute 1:1 demo assessment helps identify a suitable starting point.
          </p>
        </div>
        <Link to="/book-demo" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300">
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
