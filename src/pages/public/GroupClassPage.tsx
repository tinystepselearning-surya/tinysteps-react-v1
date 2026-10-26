import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { NEW_GROUP_CLASS_PLAN, ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';
import { getRouteConfig } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

export type GroupTrack = 'phonics' | 'grammar' | 'speaking';

type GroupPageContent = {
  path: string;
  premiumPath: string;
  name: string;
  eyebrow: string;
  heading: string;
  description: string;
  ageNote: string;
  idealFor: string[];
  learningSteps: Array<{ title: string; detail: string }>;
  participation: string[];
  questions: Array<{ question: string; answer: string }>;
  themes: string[];
};

const GROUP_CONTENT: Record<GroupTrack, GroupPageContent> = {
  phonics: {
    path: '/group-phonics-classes-for-kids',
    premiumPath: '/phonics',
    name: 'Group Phonics',
    eyebrow: 'Phonics · Live Online Small Groups',
    heading: 'Live Online Group Phonics Classes for Kids',
    description: 'Live group phonics classes help children progress from sound awareness and blending to decoding longer words and reading fluently. Teachers guide level-matched learners through meaningful practice and individual response turns.',
    ageNote: 'Our phonics pathway spans beginning and developing readers, generally ages 3–12. Group placement depends on your child’s current skills, readiness for a shared online lesson and compatible peers—not age alone.',
    idealFor: [
      'Children building sound awareness and letter–sound connections.',
      'Developing readers practising blending, decoding and spelling patterns.',
      'Older learners working on more complex word patterns with peers at a similar stage.',
    ],
    learningSteps: [
      { title: 'Understand sounds', detail: 'Build sound awareness and letter–sound knowledge at the child’s current level.' },
      { title: 'Blend and segment', detail: 'Join sounds to read words and separate sounds to support spelling.' },
      { title: 'Explore phonics patterns', detail: 'Practise digraphs, vowel patterns and longer words when ready.' },
      { title: 'Apply in reading', detail: 'Use known phonics patterns to decode unfamiliar words and connected texts.' },
    ],
    participation: [
      'Each child has opportunities to say sounds, blend words and read aloud—not just watch others.',
      'The teacher models, listens, corrects and invites a fresh attempt at the group\'s shared level.',
      'A child who needs more individual attention can be guided towards one-to-one phonics classes.',
    ],
    questions: [
      { question: 'What is the difference between group phonics and one-to-one phonics?', answer: 'A small group follows a shared progression with children at a similar level. One-to-one classes adjust pace and practice continuously to one child. The right format depends on current decoding ability, attention and correction needs.' },
      { question: 'Can a 3-year-old join group phonics?', answer: 'Young children need listening, language play and phonological awareness before formal reading tasks. A group is considered only if the child can participate comfortably in an age-appropriate online session; age alone does not determine placement.' },
      { question: 'Are group phonics demos available immediately?', answer: 'New group demos depend on a suitable set of interested children and compatible schedules. Register your interest and our team will explain the next steps.' },
      { question: 'Will my child practise reading during a group class?', answer: 'Yes. Children have guided blending, decoding and reading turns matched to their current phonics stage. Activities and pace depend on the group’s assessed starting level.' },
      { question: 'Are group phonics classes only for beginners?', answer: 'No. The curriculum covers beginning phonics, blending, digraphs, more advanced sound patterns and longer-word decoding. Groups are formed only when learners at a compatible stage and suitable timings are available.' },
    ],
    themes: ['letter sounds', 'phonemic awareness', 'blending', 'segmenting', 'digraphs', 'vowel patterns', 'decoding longer words', 'reading fluency'],
  },
  grammar: {
    path: '/group-grammar-classes-for-kids',
    premiumPath: '/grammar',
    name: 'Group Grammar',
    eyebrow: 'Grammar · Sentence building · Live online small groups',
    heading: 'Small-Group Online Grammar Classes for Kids',
    description: 'Move beyond memorising grammar rules. Our live small-group classes help children understand sentence patterns, build accurate sentences and use grammar confidently in real speaking and writing tasks.',
    ageNote: 'Generally suited to children around ages 5–12 who are ready to work with sentences. Beginner and advanced learners are matched separately after considering their current grammar and reading skills.',
    idealFor: [
      'Children who have ideas but need help building clear, complete sentences.',
      'Learners working on tenses, punctuation, word order and grammar accuracy.',
      'Families who value guided discussion, correction and independent application in small groups.',
    ],
    learningSteps: [
      { title: 'Notice the pattern', detail: 'Compare meaningful sentences to understand one grammar idea at a time.' },
      { title: 'Create clear sentences', detail: 'Choose, order and change words to communicate ideas more accurately.' },
      { title: 'Think, explain and correct', detail: 'Spot an error, explain the correction and create a fresh sentence independently.' },
      { title: 'Use grammar in real tasks', detail: 'Apply learning to answers, conversations, short writing and meaningful examples.' },
    ],
    participation: [
      'Every learner first thinks and answers independently before discussing ideas with peers.',
      'The teacher checks understanding through fresh examples, explanation and guided correction.',
      'Beginner and advanced grammar learners join separate, suitably matched groups.',
    ],
    questions: [
      { question: 'What ages are group grammar classes suitable for?', answer: 'Placement is based on sentence readiness and current grammar understanding, not just the child\'s age. Children need to be able to participate in the intended group tasks.' },
      { question: 'Will my child get individual correction in a group?', answer: 'Yes, a group lesson is planned with individual response and feedback opportunities, although the teacher cannot provide the same uninterrupted attention as in a premium 1:1 class.' },
      { question: 'Do you have beginner and advanced group grammar?', answer: 'The curriculum covers different stages. New batches can proceed only when enough children with compatible levels and timings register interest.' },
      { question: 'When can we attend a group demo?', answer: 'Our team first reviews enquiries to match programme level and suitable schedules. A group demo is arranged when enough compatible families are available.' },
    ],
    themes: ['sentence formation', 'parts of speech', 'tenses', 'punctuation', 'grammar application'],
  },
  speaking: {
    path: '/group-public-speaking-classes-for-kids',
    premiumPath: '/speaking',
    name: 'Group Public Speaking',
    eyebrow: 'Public speaking · Storytelling · Confident expression',
    heading: 'Live Online Group Public Speaking Classes for Kids',
    description: 'Help your child express ideas clearly, tell engaging stories and speak to an audience. Our live small-group public speaking classes combine individual speaking turns, thoughtful listening and supportive teacher feedback.',
    ageNote: 'Generally suited to children around ages 4–12 who can participate in age-appropriate speaking and listening activities. We match children by communication needs and confidence, not by age alone.',
    idealFor: [
      'Children who have ideas but need practice organising and sharing them clearly.',
      'Learners building confidence with storytelling, show-and-tell and presentations.',
      'Children ready to practise speaking to peers, listening carefully and responding to questions.',
    ],
    learningSteps: [
      { title: 'Organise an idea', detail: 'Plan a clear beginning, useful details and a strong ending before speaking.' },
      { title: 'Speak with purpose', detail: 'Practise short explanations, show-and-tell, stories and presentations with thoughtful prompts.' },
      { title: 'Listen and connect', detail: 'Learn to ask relevant questions, consider other viewpoints and respond to an audience.' },
      { title: 'Improve with feedback', detail: 'Use teacher feedback to try again with clearer structure, expression and independence.' },
    ],
    participation: [
      'Each child has meaningful opportunities to speak, rather than spending the lesson only listening.',
      'Peers practise listening, asking questions and offering respectful responses.',
      'Children needing gradual, individualised support can choose one-to-one speaking classes.',
    ],
    questions: [
      { question: 'How is public speaking different from spoken English?', answer: 'Public speaking focuses on communicating organised ideas to listeners through storytelling, explanations, show-and-tell and presentations. Everyday conversational fluency is a separate learning need.' },
      { question: 'Will every child speak during the class?', answer: 'The group lesson design includes individual speaking turns and feedback, with participation adapted to the child\'s readiness. Exact speaking time depends on class size and activities.' },
      { question: 'Are shy children required to present in front of a group?', answer: 'No. Participation should be encouraged through manageable choices and gradual practice, not forced. We recommend the most suitable format after understanding the child\'s needs.' },
      { question: 'Can we join a group immediately?', answer: 'New group placements and demos depend on similar learning levels and compatible schedules. Register your interest to discuss the next available options.' },
    ],
    themes: ['storytelling', 'show and tell', 'structured answers', 'presentations', 'audience awareness', 'peer listening'],
  },
};

const GROUP_PLAN = NEW_GROUP_CLASS_PLAN;
const PREMIUM_DURATION_MINUTES = ONE_TO_ONE_MONTHLY_PACKAGES[0].durationMinutes;

export default function GroupClassPage({ track }: { track: GroupTrack }) {
  const page = GROUP_CONTENT[track];
  const seo = getRouteConfig(page.path);
  const url = PUBLIC_FACTS.primaryWebsite + page.path;
  const enquiryHref = `/book-demo?format=small_group&program=${track}`;
  const questions = [
    ...page.questions,
    {
      question: 'How many children are in a Tiny Steps group class?',
      answer: 'Our group classes have a maximum of four children per teacher. Children are matched by learning level and compatible schedules. A 50-minute group class costs ₹250 per child, and a group demo is arranged when a suitable batch is forming.',
    },
  ];
  const schemas = [
    createWebPageSchema({ name: seo?.title || page.heading, description: seo?.description || page.description, url }),
    createCourseSchema({ name: page.name + ' Online Classes for Kids', description: page.description, url, teaches: page.themes, areaServed: 'India' }),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_FACTS.primaryWebsite + '/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: PUBLIC_FACTS.primaryWebsite + '/courses' },
        { '@type': 'ListItem', position: 3, name: page.name, item: url },
      ],
    },
    createFAQPageSchema(questions),
  ];

  return (
    <main className="group-commercial-page min-h-screen overflow-x-clip bg-[#F4F8FF] text-[#17284C]">
      <Meta title={seo?.title} description={seo?.description} canonical={url} jsonLd={schemas} />
      {/* Keep the sticky site navigation from overlapping content in PDF print views. */}
      <style>{`
        @media print {
          body:has(.group-commercial-page) header.fixed,
          body:has(.group-commercial-page) header.sticky { position: static !important; }
          .group-commercial-page section { break-inside: auto; }
        }
      `}</style>

      {/* The hero establishes the offer immediately, without repeating the entire page. */}
      <section className="ts-sunrise-hero border-b border-[#D9EAF7] bg-gradient-to-br from-[#D9EEFF] via-[#F4FAFF] to-[#EAF6FF] px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="group-page-title">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-[#516D84] sm:mb-9">
            <Link to="/" className="hover:text-[#144F7B] hover:underline">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/courses" className="hover:text-[#144F7B] hover:underline">Courses</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-[#102A43]">{page.name}</span>
          </nav>

          <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(285px,0.78fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#246D9C]">{page.eyebrow}</p>
              <h1 id="group-page-title" className="mt-3 max-w-3xl font-heading text-[clamp(2.1rem,4vw,3.35rem)] font-extrabold leading-[1.12] tracking-tight">
                {page.heading}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#47657B] sm:text-lg sm:leading-8">{page.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to={enquiryHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D476D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]">
                  Register Group Interest
                </Link>
                <Link to={page.premiumPath} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#BDD9EC] bg-white px-5 py-3 text-sm font-semibold text-[#154A72] transition hover:bg-[#E9F5FC]">
                  Explore One-to-One Classes
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-xs leading-5 text-[#557185]">
                New groups are formed when children with compatible learning levels and schedules are available. Registering does not guarantee an immediate batch.
              </p>
            </div>

            <aside aria-label="Group class at a glance" className="rounded-2xl border border-[#C6E2F3] bg-white p-5 shadow-[0_12px_30px_rgba(28,80,116,0.07)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#34749C]">At a glance</p>
              <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight">{formatINR(GROUP_PLAN.monthlyFee / GROUP_PLAN.classes)}
                <span className="ml-2 text-sm font-medium text-[#57738A]">/ child / class</span>
              </p>
              <div className="mt-4 divide-y divide-[#E6F0F7] border-y border-[#E6F0F7] text-sm">
                <div className="flex justify-between gap-4 py-3"><span className="text-[#5A7387]">Duration</span><strong>{GROUP_PLAN.durationMinutes} minutes</strong></div>
                <div className="flex justify-between gap-4 py-3"><span className="text-[#5A7387]">Format</span><strong>Live, teacher-led</strong></div>
                <div className="flex justify-between gap-4 py-3"><span className="text-[#5A7387]">Placement</span><strong>Level-matched</strong></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#58768C]">Class timings and demos depend on suitable batch formation.</p>
            </aside>
          </div>
        </div>
      </section>

      {/* Educational substance is consolidated into one balanced section. */}
      <section className="bg-white px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="group-learning">
        <div className="mx-auto grid max-w-6xl gap-9 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2474A5]">Who it is for</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.7rem]">A group that fits your child</h2>
            <p className="mt-3 text-sm leading-6 text-[#536B7F]">{page.ageNote}</p>
            <ul className="mt-5 space-y-3">
              {page.idealFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#334F64]">
                  <span aria-hidden="true" className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#378FBD]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-l-[3px] border-[#8CCBEF] bg-[#F2F9FF] px-4 py-3 text-sm leading-6 text-[#43647C]">
              We match children by learning readiness and compatible schedules, rather than age alone.
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2474A5]">Learning journey</p>
            <h2 id="group-learning" className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.7rem]">What children practise</h2>
            <p className="mt-3 text-sm leading-6 text-[#536B7F]">A clear progression, adjusted to the children's starting skills.</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {page.learningSteps.map((step, index) => (
                <li key={step.title} className="min-w-0 rounded-xl border border-[#E0EDF6] bg-[#F7FBFF] px-4 py-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3281AD]">Step {index + 1}</p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-[#143C5B]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4B667B]">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Participation is short, specific and paired with the curriculum. */}
      <section className="border-y border-[#DDECF6] bg-[#F1EDFC] px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="group-participation">
        <div className="mx-auto max-w-6xl">
          <h2 id="group-participation" className="text-xl font-bold tracking-tight sm:text-2xl">How group learning works</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-3">
            {page.participation.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#375770]">
                <span aria-hidden="true" className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#236E9C]">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A single compact comparison keeps the rates legible, without oversized cards. */}
      <section className="ts-sunrise-dark-band bg-gradient-to-br from-[#0C2846] via-[#123B61] to-[#0B2A4B] px-5 py-11 text-white sm:px-8 sm:py-14" aria-labelledby="group-choice">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#A5D9F8]">Simple, transparent pricing</p>
              <h2 id="group-choice" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Group Classes or One-to-One Classes?</h2>
            </div>
            <Link to="/pricing" className="text-sm font-semibold text-[#D4EBFC] underline underline-offset-4 hover:text-white">Full pricing details</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6">
              <h3 className="text-lg font-bold">Group Classes</h3>
              <p className="mt-1 min-h-[40px] text-sm leading-6 text-[#D8EAF7]">Learn with peers at a similar stage, with individual participation and guided practice.</p>
              <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatINR(GROUP_PLAN.monthlyFee / GROUP_PLAN.classes)}
                <span className="ml-2 text-sm font-medium text-[#D8EAF7]">per child / class</span>
              </p>
              <p className="mt-1 text-sm text-[#D8EAF7]">{GROUP_PLAN.durationMinutes} minutes · {formatINR(GROUP_PLAN.monthlyFee)} for 12 classes</p>
              <Link to={enquiryHref} className="mt-5 inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#102A43] transition hover:bg-[#E2F3FF]">Register Group Interest</Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-[#D4E7F7] bg-white p-5 text-[#102A43] sm:p-6">
              <h3 className="text-lg font-bold">One-to-One Classes</h3>
              <p className="mt-1 min-h-[40px] text-sm leading-6 text-[#536D82]">A dedicated teacher, individual pacing and focused feedback tailored to your child.</p>
              <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatINR(PER_CLASS_PRICE)}
                <span className="ml-2 text-sm font-medium text-[#536D82]">per class</span>
              </p>
              <p className="mt-1 text-sm text-[#536D82]">{PREMIUM_DURATION_MINUTES} minutes · Personalised instruction</p>
              <Link to={page.premiumPath} className="mt-5 inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1C456A]">Explore One-to-One Classes</Link>
            </article>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#D0E3F0]">Standard Indian-teacher rates. Group fees are per child. New group demos depend on compatible learners and schedules.</p>
        </div>
      </section>

      <section className="bg-[#F5FAFF] px-5 py-10 sm:px-8 sm:py-12" aria-labelledby="group-faq">
        <div className="mx-auto max-w-5xl">
          <h2 id="group-faq" className="text-2xl font-bold tracking-tight sm:text-3xl">Questions parents ask</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-[#DDEBF5] bg-white px-4 sm:px-6">
            {questions.map(({ question, answer }) => (
              <details key={question} className="group border-b border-[#E5EEF6] py-3.5 last:border-0">
                <summary className="cursor-pointer py-1 text-sm font-semibold leading-6 text-[#173C59] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#378FBD] sm:text-base">{question}</summary>
                <p className="max-w-3xl pb-2 pt-2 text-sm leading-6 text-[#4B687E]">{answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-4 rounded-xl border border-[#BFDDF0] bg-[#E6F4FF] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold">Interested in Group Classes?</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#48687F]">Tell us about your child. We'll contact you when a suitable group demo can be arranged.</p>
            </div>
            <Link to={enquiryHref} className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1D476D]">Register Group Interest</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
