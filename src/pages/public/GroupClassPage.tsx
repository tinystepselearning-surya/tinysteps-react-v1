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
    eyebrow: 'Phonics · Early reading · Live online small groups',
    heading: 'Live Online Group Phonics Classes for Kids',
    description: 'From hearing letter sounds to blending first words, our live small-group phonics classes help children build early reading foundations with a teacher, individual practice turns and level-matched peers.',
    ageNote: 'Especially suited to early learners around ages 3–6 who are ready for shared online activities. Younger children may need shorter, play-based practice. We consider attention, listening and phonics readiness before recommending a group.',
    idealFor: [
      'Children beginning to hear, recognise and connect letter sounds.',
      'Emerging readers practising how sounds join to make words.',
      'Families looking for a structured phonics routine with a few peers at a similar stage.',
    ],
    learningSteps: [
      { title: 'Listen to sounds', detail: 'Playful listening, rhymes and oral sound games build awareness before formal word reading.' },
      { title: 'Match sounds to letters', detail: 'Children learn and practise useful letter-sound connections through modelling and active responses.' },
      { title: 'Blend and build words', detail: 'Guided turns help each learner join sounds to read and separate sounds to spell.' },
      { title: 'Read with growing independence', detail: 'Children apply familiar sound patterns to fresh, decodable words and short texts when ready.' },
    ],
    participation: [
      'Each child has opportunities to say sounds, blend words and read aloud—not just watch others.',
      'The teacher models, listens, corrects and invites a fresh attempt at the group\'s shared level.',
      'A child who needs more individual attention can be guided towards premium one-to-one phonics.',
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
    eyebrow: 'Grammar · Sentence building · Live online small groups',
    heading: 'Small-Group Online Grammar Classes for Kids',
    description: 'Move beyond memorising grammar rules. Our live small-group classes help children understand sentence patterns, build accurate sentences and use grammar confidently in real speaking and writing tasks.',
    ageNote: 'Generally suited to children around ages 5–12 who are ready to work with sentences. Beginner and advanced learners are matched separately after considering their current grammar and reading skills.'
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
    ageNote: 'Generally suited to children around ages 4–12 who can participate in age-appropriate speaking and listening activities. We match children by communication needs and confidence, not by age alone.'
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
      'Children needing gradual, individualised support can choose premium one-to-one speaking classes.',
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
      answer: 'Our new group format is one teacher with four students, with a 50-minute session at ₹220 per child under the standard plan. We invite suitable families to a group demo when enough level-matched children and compatible timings are available.',
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
    <main className="min-h-screen overflow-x-clip bg-[#F0F8FF] text-[#102A43]">
      <Meta title={seo?.title} description={seo?.description} canonical={url} jsonLd={schemas} />
      <section className="relative overflow-hidden border-b border-sky-100 bg-gradient-to-br from-[#D9EEFF] via-[#F1F9FF] to-[#E5F4FF] px-5 py-14 sm:px-8 sm:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-white/60 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#A9DCFF]/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600">
            <Link to="/" className="underline underline-offset-4 hover:text-orange-700">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link to="/courses" className="underline underline-offset-4 hover:text-orange-700">Courses</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">{page.name}</span>
          </nav>
          <p className="inline-flex max-w-full rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#175C90] shadow-sm">{page.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-heading text-4xl font-black leading-[1.1] tracking-tight text-[#102A43] sm:text-5xl lg:text-[3.6rem]">{page.heading}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#3D5B73] sm:text-xl sm:leading-9">{page.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={enquiryHref} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#102A43] px-7 py-3 font-bold text-white shadow-[0_12px_30px_rgba(16,42,67,0.18)] transition hover:bg-[#1A4268] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]">
              Register Group Interest
            </Link>
            <Link to={page.premiumPath} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-sky-200 bg-white px-7 py-3 font-bold text-[#102A43] shadow-sm transition hover:border-sky-400 hover:bg-sky-50">
              Explore Premium One-to-One
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            We already teach siblings and friends together. New four-student groups are formed by matching children at similar learning stages and suitable timings. Group demos are arranged when enough compatible families are interested; registering does not guarantee an immediate batch.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 text-sm text-[#1F547A]">
            <span className="rounded-full border border-sky-200 bg-white/90 px-4 py-2 font-semibold shadow-[0_4px_16px_rgba(37,99,150,0.06)]">Live teacher-led classes</span>
            <span className="rounded-full border border-sky-200 bg-white/90 px-4 py-2 font-semibold shadow-[0_4px_16px_rgba(37,99,150,0.06)]">Level and schedule matching</span>
            <span className="rounded-full border border-sky-200 bg-white/90 px-4 py-2 font-semibold shadow-[0_4px_16px_rgba(37,99,150,0.06)]">Individual participation</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="group-fit">
        <h2 id="group-fit" className="text-3xl font-bold tracking-tight">Who may benefit from this group?</h2>
        <p className="mt-3 max-w-3xl text-slate-600">{page.ageNote}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {page.idealFor.map((item, index) => (
            <article key={item} className="rounded-3xl border border-[#D2E8FA] bg-white p-6 shadow-[0_12px_35px_rgba(27,85,133,0.08)] transition-shadow hover:shadow-[0_18px_40px_rgba(27,85,133,0.13)]">
              <span className="text-sm font-bold text-orange-700">0{index + 1}</span>
              <p className="mt-3 leading-7 text-slate-700">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-sky-100 bg-gradient-to-b from-white via-[#FAFDFF] to-[#EAF6FF] px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="group-learning">
        <div className="mx-auto max-w-6xl">
          <h2 id="group-learning" className="text-3xl font-bold tracking-tight">What children practise</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Progression and activities follow children's current skills, rather than an identical lesson for every age.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {page.learningSteps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-[#D5EAFE] bg-white/95 p-6 shadow-[0_12px_30px_rgba(27,85,133,0.07)] sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Learning step {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-7 text-slate-700">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="group-participation">
        <h2 id="group-participation" className="text-3xl font-bold tracking-tight">How small-group teaching works</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {page.participation.map((item) => (
            <div key={item} className="rounded-3xl border border-[#CDE7FA] bg-white p-6 leading-7 text-[#244962] shadow-[0_12px_32px_rgba(27,85,133,0.07)]">{item}</div>
          ))}
        </div>
      </section>


      <section className="relative overflow-hidden bg-gradient-to-br from-[#0C2846] via-[#123B61] to-[#0B2A4B] px-5 py-14 text-white sm:px-8 sm:py-20" aria-labelledby="group-choice">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A7DCFF]">Transparent class pricing</p>
          <h2 id="group-choice" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Small group or premium one-to-one?
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#D6EAF9]">
            Both formats offer live teacher-guided learning. Choose a shared, level-matched group or a fully personalised session for your child.
          </p>

          <div className="mt-9 grid items-stretch gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
            <article className="rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-[0_20px_45px_rgba(0,12,31,0.18)] sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-bold">Small-Group Classes</h3>
                <span className="rounded-full border border-sky-200/30 bg-sky-100/15 px-3 py-1.5 text-xs font-bold text-[#D9F0FF]">
                  1 teacher · 4 students
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#D6EAF9]">
                One teacher guides four children at a comparable learning stage, with individual participation, peer interaction and a shared lesson rhythm.
              </p>
              {GROUP_PLAN && (
                <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#D6EAF9]">One teacher · Four students</p>
                  <p className="mt-3 text-4xl font-black tabular-nums text-white">{formatINR(GROUP_PLAN.monthlyFee / GROUP_PLAN.classes)}</p>
                  <p className="mt-1 text-sm font-semibold text-[#D6EAF9]">per child per class · {GROUP_PLAN.durationMinutes} minutes</p>
                  <div className="mt-5 border-t border-white/15 pt-4">
                    <p className="text-sm text-white">12-class package: <strong>{formatINR(GROUP_PLAN.monthlyFee)} per child</strong></p>
                  </div>
                </div>
              )}
              <p className="mt-5 text-sm leading-6 text-[#E5F3FE]">
                <strong>Only one group format: 1 teacher to 4 students.</strong> Children are matched by learning level and suitable schedules. Group demos are organised when a compatible batch can be formed.
              </p>
              <Link to={enquiryHref} className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#DDF1FF] px-5 py-2.5 text-sm font-bold text-[#102A43] transition hover:bg-white">
                Register Group Interest
              </Link>
            </article>

            <article className="flex flex-col rounded-[28px] border border-[#DCEEFE] bg-white p-6 text-[#102A43] shadow-[0_24px_56px_rgba(0,12,31,0.20)] sm:p-8">
              <span className="w-fit rounded-full bg-[#E7F5FF] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#175C90]">
                Dedicated individual attention
              </span>
              <h3 className="mt-5 text-2xl font-bold">Premium One-to-One</h3>
              <p className="mt-3 leading-7 text-[#49677F]">
                Your child receives the teacher's full attention, individual pacing and focused correction tailored to their learning needs.
              </p>
              <div className="mt-8 rounded-2xl border border-[#D5E9FA] bg-gradient-to-br from-[#F0F9FF] to-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#34729E]">One teacher · One child</p>
                <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-[#102A43]">{formatINR(PER_CLASS_PRICE)}</p>
                <p className="mt-1 text-base font-semibold text-[#49677F]">per class · {PREMIUM_DURATION_MINUTES} minutes</p>
              </div>
              <div className="mt-6 space-y-2 text-sm leading-6 text-[#365873]">
                <p>Individual learning pace and teacher guidance</p>
                <p>Focused, child-specific practice and feedback</p>
                <p>Suitable for children needing additional personal support</p>
              </div>
              <Link to={page.premiumPath} className="mt-auto inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#102A43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1A4268] sm:mt-8">
                Explore Premium One-to-One
              </Link>
            </article>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#CEE6F8]">
            These are standard published Indian-teacher rates. Group prices are per child; monthly estimates assume 12 classes. Batch timings and availability are confirmed separately.
            {' '}<Link to="/pricing" className="font-semibold text-white underline underline-offset-4 hover:text-sky-100">View the full pricing details</Link>.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#E7F4FF] via-[#F5FBFF] to-[#ECF8FF] px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="group-faq">
        <div className="mx-auto max-w-4xl">
        <h2 id="group-faq" className="text-3xl font-bold tracking-tight">Questions parents ask</h2>
        <div className="mt-7 overflow-hidden rounded-3xl border border-[#D2E7F8] bg-white px-5 shadow-[0_12px_36px_rgba(27,85,133,0.08)] sm:px-7">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group border-b border-sky-100 py-5 last:border-0">
              <summary className="cursor-pointer text-lg font-semibold leading-7">{question}</summary>
              <p className="mt-3 max-w-3xl leading-7 text-slate-700">{answer}</p>
            </details>
          ))}
        </div>
        </div>
      </section>

      <section className="border-t border-[#B8DFF7] bg-gradient-to-br from-[#D9EEFF] via-[#EAF7FF] to-[#F8FCFF] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white bg-white/85 px-6 py-10 text-center shadow-[0_24px_65px_rgba(25,90,150,0.10)] sm:px-10 sm:py-14">
          <h2 className="text-3xl font-bold">Interested in a suitable small group?</h2>
          <p className="mt-3 leading-7 text-slate-700">Tell us your child's learning needs. We will contact you to discuss level matching, timing and the next possible group demo. There is no obligation to enrol.</p>
          <Link to={enquiryHref} className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#102A43] px-7 py-3 font-bold text-white shadow-lg transition hover:bg-[#1A4268]">Register Group Interest</Link>
        </div>
      </section>
    </main>
  );
}
