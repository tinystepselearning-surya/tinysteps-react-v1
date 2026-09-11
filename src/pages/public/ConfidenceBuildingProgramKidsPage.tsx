import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import { applySeo } from '../../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const canonicalPath = '/confidence-building-program-kids';
const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const seoTitle = 'Confidence Building Classes for Kids | Live 1:1 | Tiny Steps';
const seoDescription =
  'Live 1:1 confidence-building classes for kids in India and worldwide. Build speaking comfort, participation confidence and independent expression in 35-minute classes.';

const CONFIDENCE_SEO_KEYWORDS = [
  'confidence building classes for kids',
  'confidence building program for kids',
  'online confidence building classes for kids',
  '1 to 1 confidence building classes for kids',
  'speaking confidence classes for kids',
  'confidence classes for shy children',
  'live confidence building classes for kids',
  'online confidence program for kids',
  'confidence building classes for children',
  'confidence building classes for kids worldwide',
];

const faqItems = [
  {
    question: 'What are confidence-building classes for kids?',
    answer:
      'Confidence-building classes give children repeated, guided opportunities to respond, participate, explain simple ideas, and speak with gradually less prompting. The goal is stronger speaking comfort and more independent participation, not performance pressure.',
  },
  {
    question: 'Who is this confidence-building programme for?',
    answer:
      'It is designed for children whose main barrier is speaking confidence itself: they may know what they want to say but hesitate to begin, avoid participating, depend heavily on prompts, or become much quieter in speaking situations.',
  },
  {
    question: 'Is this the same as Spoken English classes?',
    answer:
      'No. Spoken English is the better owner when the main goal is everyday English conversation, sentence expansion, vocabulary in use, or conversational fluency. Confidence Building is for children whose main difficulty is willingness, comfort, participation, or independence while speaking.',
  },
  {
    question: 'Is this the same as Public Speaking & Communication classes?',
    answer:
      'No. Public Speaking & Communication is broader and focuses on structured answers, storytelling, show-and-tell, presentations, audience awareness, and general communication skills. Confidence Building is the specialist pathway when confidence itself is the primary barrier.',
  },
  {
    question: 'What if grammar or sentence accuracy is the real problem?',
    answer:
      'If the child is willing to speak but repeatedly struggles with tense control, sentence structure, articles, prepositions, or grammatical accuracy, the Grammar programme is usually the clearer starting point. The free assessment helps separate confidence from language-skill gaps.',
  },
  {
    question: 'Are Tiny Steps confidence-building classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. The format gives the child direct speaking time, guided retries, and individual pacing.`,
  },
  {
    question: 'Can families outside India join the confidence-building programme?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'How can parents tell whether confidence is improving?',
    answer:
      'Look for observable changes across fresh speaking situations: the child starts responses more readily, needs fewer prompts, gives a little more detail, participates more consistently, recovers from mistakes more comfortably, and transfers confidence to new tasks.',
  },
  {
    question: 'Is this programme a treatment for anxiety or a speech or language disorder?',
    answer:
      'No. Tiny Steps provides educational English and communication support, not clinical diagnosis or treatment. If a child has persistent anxiety, speech, language, hearing, or developmental concerns, parents should also seek guidance from an appropriately qualified professional.',
  },
];

const confidenceSteps = [
  {
    title: '1. Create a safe entry point',
    text: 'Begin with predictable, low-pressure prompts that the child can answer without feeling tested or rushed.',
  },
  {
    title: '2. Build successful speaking turns',
    text: 'Use short, achievable speaking opportunities so the child experiences repeated success rather than one high-pressure performance.',
  },
  {
    title: '3. Guide, retry, and reduce support',
    text: 'Teachers model or prompt only as much as needed, then gradually reduce support as the child becomes more independent.',
  },
  {
    title: '4. Transfer confidence to new tasks',
    text: 'Confidence is checked on fresh questions, topics, and classroom-style speaking situations instead of relying on rehearsed answers.',
  },
];

export default function ConfidenceBuildingProgramKidsPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
        { '@type': 'ListItem', position: 2, name: 'Confidence Building Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Confidence Building Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const courseSchema = createCourseSchema({
      name: 'Confidence Building Classes for Kids',
      description:
        'Live 1:1 online confidence-building classes for children whose primary barrier is speaking comfort, participation confidence, response initiation, or independent expression.',
      url: canonicalUrl,
      educationalLevel: 'School-age confidence support with assessment-led placement',
      teaches: [
        'speaking comfort',
        'participation confidence',
        'response initiation',
        'independent expression',
        'guided speaking confidence',
        'confidence transfer to fresh speaking tasks',
      ],
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
      robots: 'index,follow',
      ogType: 'website',
      keywords: CONFIDENCE_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, faqSchema],
    });
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#fff9f1] via-white to-[#eef8ff] pb-16">
      <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
        <section className="rounded-[28px] border border-orange-100 bg-white/95 p-6 text-center shadow-sm md:p-10">
          <p className="mx-auto inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Specialist speaking-confidence pathway
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
            Confidence Building Classes for Kids
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Live 1:1 online support for children whose main barrier is hesitation, low speaking comfort, limited participation, or dependence on prompts even when they have ideas to share.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Standard 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. Families in India and worldwide can begin with one free {demoMinutes}-minute 1:1 online demo assessment to confirm whether confidence-building is the right pathway.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free {demoMinutes}-Minute Demo
            </Link>
            <Link
              to="/pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              See Class Pricing
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-6 md:p-7">
          <h2 className="text-2xl font-bold text-slate-900">Quick answer: when is Confidence Building the right programme?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Choose this specialist programme when the child&apos;s confidence itself is the main barrier: they hesitate to start, avoid participating, become much quieter under speaking pressure, or rely heavily on adult prompting despite having something to say. If the main goal is broader communication, everyday English fluency, or grammar accuracy, another Tiny Steps programme is the clearer owner.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Signs that confidence may be the main barrier</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'The child knows an answer but often waits for repeated prompting before starting.',
              'The child speaks more freely in comfortable settings but becomes very quiet in class-style situations.',
              'The child avoids volunteering, show-and-tell, or unfamiliar speaking tasks even when the content is manageable.',
              'Mistakes quickly reduce willingness to continue, even when the child can retry with support.',
              'The child needs reassurance before ordinary speaking turns and depends on adults to carry the interaction.',
              'The main concern is participation and speaking comfort rather than decoding, grammar, or conversational English knowledge.',
            ].map((item) => (
              <article key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-700 md:text-base">
                {item}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">How Tiny Steps builds speaking confidence</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {confidenceSteps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 md:text-base">{step.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-700 md:text-base">
            Activities may include short answers, picture talk, simple explanations, storytelling or presentation-style tasks when they are useful for confidence practice. Those activities are tools; the specialist outcome here is greater speaking comfort and independent participation.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Confidence Building vs other Tiny Steps programmes</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            Similar symptoms can come from different learning needs. The free assessment helps identify the primary barrier before placement.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
              <h3 className="font-bold text-slate-900">Confidence Building</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Best when hesitation, participation confidence, speaking comfort, or dependence on prompting is the primary barrier.</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
              <h3 className="font-bold text-slate-900">Public Speaking & Communication</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Best for structured answers, storytelling, show-and-tell, classroom communication, presentations, and audience awareness.</p>
              <Link to="/speaking" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Speaking & Communication</Link>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <h3 className="font-bold text-slate-900">Spoken English</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Best when everyday conversational English, fuller responses, vocabulary in use, or conversational fluency is the main goal.</p>
              <Link to="/spoken-english-classes-for-kids-online" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Spoken English</Link>
            </article>
            <article className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
              <h3 className="font-bold text-slate-900">Grammar</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Best when the child is willing to speak but grammar accuracy, sentence structure, tense control, articles, or prepositions are the main problem.</p>
              <Link to="/grammar" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Grammar</Link>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/70 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Searching about a shy child, or looking for classes?</h2>
          <p className="mt-3 leading-7 text-slate-700">
            If you are still trying to understand why your child hesitates or appears shy while speaking, use our parent diagnostic guide first. If you already want structured live confidence-building classes, this page is the programme owner.
          </p>
          <Link to="/shy-child-speaking-confidence" className="mt-4 inline-block font-semibold underline underline-offset-2">
            Read: Shy Child Speaking Confidence Help
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">What we check before recommending this pathway</h2>
          <ul className="mt-5 space-y-3 text-slate-700">
            <li>• How readily the child starts a response without repeated prompting.</li>
            <li>• Whether confidence changes between familiar, guided, and fresh speaking tasks.</li>
            <li>• How the child reacts to mistakes, retries, wait time, and teacher support.</li>
            <li>• Whether language knowledge—such as grammar or everyday spoken English—is actually the stronger underlying need.</li>
            <li>• Whether broader public-speaking and communication goals are more important than confidence-building itself.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-sky-100 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">How parents can measure confidence progress</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Confidence should be judged through behaviour on fresh speaking tasks rather than promises about a fixed number of classes. Useful signs include faster response initiation, fewer prompts, more consistent participation, calmer retries after mistakes, steadier delivery, and greater willingness to attempt unfamiliar topics.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8" id="faq">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-5 space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 md:text-base">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] bg-slate-900 p-7 text-center text-white md:p-9">
          <h2 className="text-2xl font-bold md:text-3xl">Start with a free confidence assessment</h2>
          <p className="mx-auto mt-3 max-w-3xl leading-7 text-slate-200">
            The free {demoMinutes}-minute 1:1 online assessment helps determine whether your child primarily needs Confidence Building, Spoken English, Grammar, or the broader Speaking & Communication programme.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-7 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Book Free {demoMinutes}-Minute Demo
            </Link>
            <Link to="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white/70">
              See Pricing
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300">
            <Link to="/speaking" className="underline underline-offset-2 hover:text-white">Speaking & Communication</Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <Link to="/spoken-english-classes-for-kids-online" className="underline underline-offset-2 hover:text-white">Spoken English</Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <Link to="/resources/speaking" className="underline underline-offset-2 hover:text-white">Speaking resources</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
