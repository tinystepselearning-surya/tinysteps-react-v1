import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { GROUP_MONTHLY_FEES, formatINR } from '../../config/pricing';
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
    eyebrow: 'Early reading · Phonics · Live small-group learning',
    heading: 'Live Online Group Phonics Classes for Kids',
    description: 'Build early reading skills through letter-sound connections, oral blending, decoding and purposeful practice with other children at a comparable stage. New groups are formed when suitable learners and timings can be matched.',
    ageNote: 'Especially relevant to children developing early phonics and reading foundations; readiness and attention needs matter more than age alone.',
    idealFor: [
      'A child starting to connect letters with their sounds who can take turns in a live class.',
      'A child learning to blend and segment short spoken or written words.',
      'Families wanting structured peer participation and a fixed group learning rhythm.',
    ],
    learningSteps: [
      { title: 'Hear and notice sounds', detail: 'Use listening, rhyme and sound-awareness activities appropriate to the learners\' developmental stage.' },
      { title: 'Connect sounds and symbols', detail: 'Work with explicitly introduced letter-sound patterns before expecting independent word reading.' },
      { title: 'Blend and segment', detail: 'Model how spoken sounds join into words and how words can be broken into sounds for spelling.' },
      { title: 'Transfer into reading', detail: 'Apply known correspondences to fresh decodable words and suitable short texts, with individual checks.' },
    ],
    participation: [
      'Each child gets opportunities to say sounds, blend and read aloud rather than only watching the teacher.',
      'The teacher checks errors and gives a fresh attempt, with prompts adjusted to the group\'s shared level.',
      'Families receive guidance when individual support would be a better fit than a group.',
    ],
    questions: [
      { question: 'What is the difference between group phonics and premium 1:1 phonics?', answer: 'A small group follows a shared progression with children at a similar level. Premium 1:1 adjusts pace and practice continuously to one child. The right format depends on current decoding ability, attention and correction needs.' },
      { question: 'Can a 3-year-old join group phonics?', answer: 'Young children need listening, language play and phonological awareness before formal reading tasks. A group is considered only if the child can participate comfortably in an age-appropriate online session; age alone does not determine placement.' },
      { question: 'Are group phonics demos available immediately?', answer: 'New group demos depend on a suitable set of interested children and compatible schedules. Register your interest and our team will explain the next steps.' },
      { question: 'Will my child practise reading during a group class?', answer: 'The intended format includes guided, individual blending and decoding turns. Activities and pace depend on the learners\' assessed starting points.' },
    ],
    themes: ['letter sounds', 'phonemic awareness', 'blending', 'segmenting', 'decoding', 'early reading'],
  },
  grammar: {
    path: '/group-grammar-classes-for-kids',
    premiumPath: '/grammar',
    name: 'Group Grammar',
    eyebrow: 'Sentence building · Grammar in use · Live small groups',
    heading: 'Small-Group Online Grammar Classes for Kids',
    description: 'Learn to form clearer sentences, notice patterns and apply grammar when speaking and writing. Each group follows a shared learning goal, with time for individual answers and corrective practice.',
    ageNote: 'Most relevant to children ready to work with sentences; beginner and more advanced learners are matched separately.',
    idealFor: [
      'A child who speaks or writes understandable ideas but needs clearer sentence structure.',
      'A learner practising parts of speech, tense choices, punctuation and accurate word order.',
      'Families seeking discussion and applied practice with children of a similar grammar level.',
    ],
    learningSteps: [
      { title: 'Understand the pattern', detail: 'Introduce a focused grammatical idea using clear examples and contrasting sentences.' },
      { title: 'Build a sentence', detail: 'Choose or arrange words to show how meaning changes when grammar changes.' },
      { title: 'Explain and correct', detail: 'Find a meaningful error, explain the correction and make a new sentence independently.' },
      { title: 'Apply in context', detail: 'Use the idea in a short answer, conversation, paragraph or real-world writing task.' },
    ],
    participation: [
      'Children answer independently before comparing their reasoning with classmates.',
      'The teacher checks understanding with new examples instead of relying on repeated worksheets.',
      'Level matching prevents a beginner from being placed into an advanced tense or writing group.',
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
    eyebrow: 'Ideas · Storytelling · Presentations · Live small groups',
    heading: 'Live Online Group Public Speaking Classes for Kids',
    description: 'Develop organised speaking, storytelling and presentation skills in a supportive small group. Children practise expressing ideas to an audience, listening to others and responding to questions.',
    ageNote: 'Designed around speaking readiness and a compatible peer group, not a promise that all children of one age should speak in the same way.',
    idealFor: [
      'A child who has ideas but needs practice organising them for listeners.',
      'A learner working on show-and-tell, storytelling, presentations or classroom responses.',
      'Children ready for collaborative activities, listening turns and supported audience practice.',
    ],
    learningSteps: [
      { title: 'Plan an idea', detail: 'Choose a clear message and organise a beginning, supporting details and ending.' },
      { title: 'Speak for a listener', detail: 'Practise describing, explaining or telling a short story with age-appropriate prompts.' },
      { title: 'Listen and respond', detail: 'Ask relevant questions, notice another perspective and adjust an answer when needed.' },
      { title: 'Try again with feedback', detail: 'Use specific feedback to improve organisation, clarity and independent expression on a fresh task.' },
    ],
    participation: [
      'Every child needs a meaningful individual speaking turn; observing others is only part of the lesson.',
      'Peer listening and questions are structured activities rather than a contest to speak the loudest.',
      'Children who need more gradual participation may be better supported through premium 1:1 sessions.',
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

const groupFee = GROUP_MONTHLY_FEES.find((row) => row.ratio === '1:3');
const groupPrice = groupFee ? formatINR(Math.round(groupFee.monthlyFee / groupFee.classes)) : null;

export default function GroupClassPage({ track }: { track: GroupTrack }) {
  const page = GROUP_CONTENT[track];
  const seo = getRouteConfig(page.path);
  const url = PUBLIC_FACTS.primaryWebsite + page.path;
  const enquiryHref = `/book-demo?format=small_group&program=${track}`;
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
    createFAQPageSchema(page.questions),
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfaf8] text-slate-950">
      <Meta title={seo?.title} description={seo?.description} canonical={url} jsonLd={schemas} />
      <section className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-sky-50 px-5 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600">
            <Link to="/" className="underline underline-offset-4 hover:text-orange-700">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link to="/courses" className="underline underline-offset-4 hover:text-orange-700">Courses</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">{page.name}</span>
          </nav>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-700">{page.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-black leading-tight tracking-tight sm:text-5xl">{page.heading}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{page.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={enquiryHref} className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">
              Register Group Interest
            </Link>
            <Link to={page.premiumPath} className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
              Explore Premium One-to-One
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            We currently support groups formed by siblings or friends. New matched groups and demos are arranged only when enough children with compatible levels and schedules express interest. Registering does not guarantee an immediate batch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold">Live teacher-led classes</span>
            <span className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold">Level and schedule matching</span>
            <span className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold">Individual participation</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="group-fit">
        <h2 id="group-fit" className="text-3xl font-bold tracking-tight">Who may benefit from this group?</h2>
        <p className="mt-3 max-w-3xl text-slate-600">{page.ageNote}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {page.idealFor.map((item, index) => (
            <article key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-sm font-bold text-orange-700">0{index + 1}</span>
              <p className="mt-3 leading-7 text-slate-700">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="group-learning">
        <div className="mx-auto max-w-6xl">
          <h2 id="group-learning" className="text-3xl font-bold tracking-tight">What children practise</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Progression and activities follow children's current skills, rather than an identical lesson for every age.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {page.learningSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Learning step {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-7 text-slate-700">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="group-participation">
        <h2 id="group-participation" className="text-3xl font-bold tracking-tight">How small-group teaching works</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {page.participation.map((item) => (
            <div key={item} className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5 leading-7 text-slate-800">{item}</div>
          ))}
        </div>
      </section>

      <section className="bg-[#102A43] px-5 py-12 text-white sm:px-8 sm:py-16" aria-labelledby="group-choice">
        <div className="mx-auto max-w-6xl">
          <h2 id="group-choice" className="text-3xl font-bold">Small group or premium one-to-one?</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h3 className="text-xl font-bold">Small group</h3>
              <p className="mt-2 leading-7 text-slate-200">A shared learning goal and fixed group rhythm with level-matched peers. Placement depends on sufficient enrolment interest and compatible schedules.</p>
              {groupPrice && <p className="mt-4 font-semibold">Published 1:3 rate: {groupPrice} per child/class · {groupFee?.durationMinutes} minutes</p>}
            </article>
            <article className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h3 className="text-xl font-bold">Premium one-to-one</h3>
              <p className="mt-2 leading-7 text-slate-200">Individual pacing, dedicated teacher attention and flexible support for a child's particular learning needs.</p>
              <Link to={page.premiumPath} className="mt-4 inline-block font-semibold text-orange-200 underline underline-offset-4 hover:text-white">Compare the premium programme</Link>
            </article>
          </div>
          <p className="mt-4 text-sm text-slate-300">Published rates may vary by group size; confirm the current programme, suitable format and schedule before enrolling. <Link to="/pricing" className="underline underline-offset-4">View full pricing</Link>.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="group-faq">
        <h2 id="group-faq" className="text-3xl font-bold tracking-tight">Questions parents ask</h2>
        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {page.questions.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="cursor-pointer text-lg font-semibold leading-7">{question}</summary>
              <p className="mt-3 max-w-3xl leading-7 text-slate-700">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-orange-100 bg-orange-50 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Interested in a suitable small group?</h2>
          <p className="mt-3 leading-7 text-slate-700">Tell us your child's learning needs. We will contact you to discuss level matching, timing and the next possible group demo. There is no obligation to enrol.</p>
          <Link to={enquiryHref} className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">Register Group Interest</Link>
        </div>
      </section>
    </main>
  );
}
