import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';
import { trackParentCourseInterest } from '../../lib/conversionTracking';

const WHATSAPP_PHONICS_URL = `https://wa.me/919618398383?text=${encodeURIComponent(
  "Hi Tiny Steps! I want help with my child's phonics routine and the right starting class."
)}`;

const trustPoints = [
  { label: 'Daily routine', value: '5-10 minutes' },
  { label: 'Useful age band', value: '3-10 years' },
  { label: 'Main reading goal', value: 'Sound -> blend -> read' },
  { label: 'Parent role', value: 'Calm coach, not examiner' },
];

const principleCards = [
  {
    title: 'Structured synthetic phonics works best',
    detail:
      'Children make faster progress when letter-sound patterns are taught clearly, reviewed often, and used immediately in blending and reading.',
    action: 'Keep practice predictable: review yesterday, teach one small new step, then read.',
  },
  {
    title: 'Small daily wins beat occasional long sessions',
    detail:
      'A short routine is easier to sustain, kinder on attention, and more likely to build confidence than an occasional heavy practice block.',
    action: 'Stop while your child still feels successful, even if you could do more.',
  },
  {
    title: 'Multilingual homes can still do phonics well',
    detail:
      'Home language is not a problem. Oral language in any language supports vocabulary, confidence, and meaning-making while English phonics builds decoding.',
    action: 'Explain instructions in the language your child understands best, then practise the English sounds clearly.',
  },
  {
    title: 'Phonics is one important piece, not the whole puzzle',
    detail:
      'Children also need oral language, vocabulary, comprehension, and confidence. Strong reading grows when decoding links to meaning.',
    action: 'After every short reading task, ask one quick meaning question instead of treating reading as sound work only.',
  },
];

const termCards = [
  {
    title: 'Phonics',
    detail: 'Learning how letters and letter groups match to sounds so children can decode and spell words.',
  },
  {
    title: 'Phonemic awareness',
    detail: 'Hearing and playing with sounds in spoken words, even before looking at letters on a page.',
  },
  {
    title: 'Sight words',
    detail: 'Common words children learn to recognise quickly, especially when parts are not fully decodable yet.',
  },
  {
    title: 'Fluency',
    detail: 'Reading accurately, smoothly, and with enough ease to keep meaning in mind.',
  },
];

const starterPlan = [
  {
    day: 'Day 1',
    title: 'Hear and say the sound',
    focus: 'Pick one target sound and say it clearly 3-5 times.',
    example: 'Examples: /s/, /a/, /t/, /p/, /i/, /n/',
  },
  {
    day: 'Day 2',
    title: 'Match sound to letter',
    focus: 'Point to the written letter, say the sound, and let your child repeat.',
    example: 'Example: point to s and say "/s/, snake sound".',
  },
  {
    day: 'Day 3',
    title: 'Blend two and three sounds',
    focus: 'Move from individual sounds to one short blended word.',
    example: 'Examples: s-a-t -> sat, p-i-n -> pin, t-a-p -> tap',
  },
  {
    day: 'Day 4',
    title: 'Read one short decodable line',
    focus: 'Use a tiny sentence built from sounds already taught.',
    example: 'Examples: "Pat sat." "Sam taps."',
  },
  {
    day: 'Day 5',
    title: 'Spell one word back',
    focus: 'Say a short word aloud and let your child tap the sounds before writing or arranging letters.',
    example: 'Examples: sat, pin, map',
  },
  {
    day: 'Day 6',
    title: 'Review and retry',
    focus: 'Go back to older words and let your child read them with less help.',
    example: 'Mix yesterday and earlier words so practice feels familiar, not new all the time.',
  },
  {
    day: 'Day 7',
    title: 'Celebrate fluency and confidence',
    focus: 'Repeat a tiny reading task from earlier in the week and notice what feels easier.',
    example: 'Praise the retry, the smoother blending, or the clearer sound rather than perfection.',
  },
];

const routineCards = [
  {
    step: 'Minute 1-2',
    title: 'Quick review',
    detail: 'Revisit 2-3 words or sounds from yesterday so the routine starts with success.',
  },
  {
    step: 'Minute 3-5',
    title: 'Teach one small new target',
    detail: 'Introduce one sound, one spelling pattern, or one short word family only.',
  },
  {
    step: 'Minute 6-8',
    title: 'Blend and read',
    detail: 'Tap the sounds, blend them, then read one tiny word or sentence using that pattern.',
  },
  {
    step: 'Minute 9-10',
    title: 'Close with praise',
    detail: 'End with one quick dictation, one re-read, or one celebration line so the session feels light.',
  },
];

const ageBenchmarks = [
  {
    age: 'Ages 3-4',
    target: 'Early sound play and letter familiarity',
    signs: 'Many children begin noticing rhymes, first sounds, and a few familiar letters.',
    parentMove: 'Keep practice oral, playful, and short. Focus on hearing and saying sounds clearly.',
  },
  {
    age: 'Ages 5-6',
    target: 'Simple sound-symbol links and CVC blending',
    signs: 'Many children can begin blending simple words like sat, pin, map, and tap with support.',
    parentMove: 'Use clear sound prompts and short decodable words instead of abstract worksheets.',
  },
  {
    age: 'Ages 7-8',
    target: 'More secure decoding and sentence reading',
    signs: 'Children often move from isolated word reading into short phrases and simple decodable lines.',
    parentMove: 'If blending is still shaky, go back to sound-by-sound reading rather than guessing from context.',
  },
  {
    age: 'Ages 8-10',
    target: 'Gap-closing with targeted phonics support',
    signs: 'If a child still guesses, skips sounds, or cannot blend smoothly, structured practice can still help a lot.',
    parentMove: 'Keep the routine respectful and age-appropriate. Focus on confidence, not babyish materials.',
  },
];

const troubleshooting = [
  {
    problem: 'My child says letter names instead of sounds',
    fix: 'Model the sound once, point to the letter, and try again. Keep the correction brief so momentum is not lost.',
  },
  {
    problem: 'My child can say sounds but cannot blend',
    fix: 'Slow the sounds down, then slide them together: /c/ ... /a/ ... /t/ -> cat. Use your finger to sweep left to right.',
  },
  {
    problem: 'My child resists phonics time',
    fix: 'Cut the routine down to 5 minutes for a few days, offer one choice, and finish with a success moment before stopping.',
  },
  {
    problem: 'We speak another language at home',
    fix: 'That is fine. Use your home language to explain the task if needed, then practise the English sounds clearly and briefly.',
  },
];

const parentScripts = [
  'Show me each sound first. Then we will say it fast together.',
  'Try it slowly. Good. Now blend it one more time.',
  'You fixed that word yourself. That is exactly how reading gets stronger.',
  'We only need a few calm minutes today. Small practice still counts.',
];

const faqItems = [
  {
    question: 'What if my child is not in SATPIN yet?',
    answer:
      'That is fine. This page is not locked to one sequence. Start with whatever sounds or patterns your child already knows and keep the routine tiny and predictable.',
  },
  {
    question: 'Can I use this page if my child is older and still struggling to read?',
    answer:
      'Yes. Older children often need the same decoding foundations, just with more respectful examples and less babyish presentation.',
  },
  {
    question: 'How much daily practice is enough?',
    answer:
      'For most families, 5-10 calm minutes a day is a better target than long weekend sessions. The routine matters more than intensity.',
  },
  {
    question: 'Does phonics alone make a fluent reader?',
    answer:
      'No. Phonics is essential for decoding, but children also grow through vocabulary, oral language, comprehension, and confidence-building.',
  },
];

const supportSignals = [
  'Reading struggle stays severe even after several weeks of calm, structured practice',
  'Your child avoids speaking, reading aloud, or trying new words because frustration feels too high',
  'You notice persistent speech, hearing, or language concerns that go beyond ordinary early reading frustration',
  'Your child seems to lose previously learned sounds or skills rather than gradually building them',
];

const PhonicsMission: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema('How to Run a 7-Day Phonics Mission at Home', [
      'Day 1: Hear and say one target sound clearly',
      'Day 2: Match the target sound to the written letter',
      'Day 3: Blend two and three sounds into one short word',
      'Day 4: Read one short decodable line',
      'Day 5: Spell one word back using tap-and-blend',
      'Day 6: Review and retry earlier words with less help',
      'Day 7: Re-read and celebrate smoother decoding',
    ]);

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Phonics Mission', item: 'https://tinystepslearning.com/parents/phonics-mission' },
      ],
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    applySeo({
      ...parentsMeta['/parents/phonics-mission'],
      keywords: [
        'daily phonics practice for parents',
        'how to teach phonics at home',
        'phonics routine for kids',
        'phonics activities for multilingual homes',
        'phonics blending practice',
      ],
      jsonLd: [howToSchema, breadcrumbSchema, faqSchema],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link to="/parents" className="hover:text-slate-700">Parents Hub</Link> / <span>Phonics Mission</span>
      </nav>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff6ea_0%,#ffffff_42%,#eef6ff_100%)] shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Tiny Steps • Parent Practice Guide
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Phonics Mission: A Research-Backed 7-Day Starter Plan for Parents
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Use this page when you want a simple daily phonics routine that helps your child connect
            letters to sounds, blend short words, and build reading confidence without pressure.
            It is designed for ages 3-10 and works well for multilingual homes too.
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
            Trust signals parents already use: 5000+ students, families across 15+ countries, and a structured phonics pathway that moves from sound to blend to read.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/?book=1"
              onClick={() => trackParentCourseInterest({
                page_path: '/parents/phonics-mission',
                cta_label: 'Book Free Assessment',
                cta_location: 'hero',
                destination_path: '/book-demo',
                program: 'phonics',
              })}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free Assessment
            </Link>
            <a
              href={WHATSAPP_PHONICS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackParentCourseInterest({
                page_path: '/parents/phonics-mission',
                cta_label: 'WhatsApp for phonics help',
                cta_location: 'hero',
                destination_path: '/contact',
                program: 'phonics',
              })}
              className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              WhatsApp for Phonics Help
            </a>
            <Link
              to="/blog/phonics-for-parents-guide"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Read Full Phonics Guide
            </Link>
            <Link
              to="/blog/week-1-phonics-satpin-launch"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Start with SATPIN Week 1
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.label} className="rounded-2xl border border-white/90 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{point.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{point.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Executive summary</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Why this page exists</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Phonics is the code that links letters to sounds. This page turns that idea into a warm,
            realistic daily routine so parents can support decoding at home with little wins instead of
            long, stressful sessions. The approach is short, concrete, and grounded in what research
            consistently supports: clear instruction, repetition, blending practice, and confidence.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            It also assumes real family life: your child&apos;s exact level may be unclear, your home may be
            multilingual, and you may only have 5-10 minutes a day. That is enough to make phonics practice useful.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Assumptions used</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
            <li>Your child has at least some familiarity with letters.</li>
            <li>You can do a short routine most days, even if it is only 5 minutes.</li>
            <li>Any technology used is simple: talking, recording, or reviewing together.</li>
            <li>Home language is a resource, not a barrier, during practice.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">What strong phonics support looks like at home</h2>
        <p className="mt-2 text-sm text-slate-600">
          Research ideas translated into parent actions you can actually use.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {principleCards.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                Parent move: {item.action}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Quick term guide for parents</h2>
        <p className="mt-2 text-sm text-slate-600">
          These are the words parents often hear when reading support starts.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {termCards.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">7-day phonics mission starter plan</h2>
        <p className="mt-2 text-sm text-slate-600">
          A simple one-week reset that moves from sound awareness to short reading.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {starterPlan.map((item) => (
            <div key={item.day} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{item.day}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.focus}</p>
              <p className="mt-3 text-sm font-medium text-slate-900">{item.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Your 10-minute daily routine</h2>
        <p className="mt-2 text-sm text-slate-600">This is the repeatable structure to use after the first week too.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routineCards.map((card) => (
            <div key={card.step} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{card.step}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Age-based benchmarks to keep parents grounded</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use these as rough guideposts, not as pressure points or comparisons.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {ageBenchmarks.map((item) => (
            <div key={item.age} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{item.age}</h3>
              <p className="mt-2 text-sm font-medium text-slate-900">{item.target}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.signs}</p>
              <p className="mt-3 text-sm text-slate-700">
                <strong>Parent move:</strong> {item.parentMove}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Troubleshooting in real time</h2>
          <div className="mt-4 space-y-3">
            {troubleshooting.map((item) => (
              <div key={item.problem} className="rounded-xl border border-rose-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{item.problem}</p>
                <p className="mt-1 text-sm text-slate-700">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Parent script bank</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {parentScripts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3 className="mt-6 text-base font-semibold text-slate-900">When to seek extra help</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {supportSignals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parents also ask</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <AboutAuthor className="mt-12" />

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Need a personalized phonics plan?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Book a free assessment to identify your child&apos;s current reading stage and get a practical
          home routine matched to that level. If you want structured live support, we can help with that too.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/?book=1"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/phonics"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore Phonics Classes
          </Link>
        </div>
      </section>
    </article>
  );
};

export default PhonicsMission;
