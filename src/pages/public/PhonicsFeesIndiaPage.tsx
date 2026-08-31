import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  IndianRupee,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';

type FeeBand = {
  name: string;
  range: string;
  average: string;
};

const oneToOneBands: FeeBand[] = [
  { name: 'Lower Fee Band', range: 'Below ₹350', average: '~₹280' },
  { name: 'Typical Fee Band', range: '₹350–₹550', average: '~₹450' },
  { name: 'Higher Fee Band', range: 'Above ₹550', average: '~₹720' },
];

const groupBands: FeeBand[] = [
  { name: 'Lower Fee Band', range: 'Below ₹200', average: '~₹145' },
  { name: 'Typical Fee Band', range: '₹200–₹299', average: '~₹225' },
  { name: 'Higher Fee Band', range: '₹300+', average: '~₹305' },
];

const qualityChecks = [
  {
    title: 'Curriculum progression',
    text: 'A clear path from sounds to blending, decoding, spelling and connected reading.',
    icon: Layers,
  },
  {
    title: 'Live correction',
    text: 'The teacher hears the child read, identifies the error and gives another attempt.',
    icon: CheckCircle2,
  },
  {
    title: 'Class duration',
    text: 'Compare both price and teaching time: ₹400 for 30 minutes is different from ₹400 for 60 minutes.',
    icon: Clock,
  },
  {
    title: 'Batch size',
    text: 'For groups, confirm how many children share the teacher’s attention.',
    icon: Users,
  },
  {
    title: 'Assessment & placement',
    text: 'Placement should reflect what the child can actually read and spell, not age alone.',
    icon: ClipboardCheck,
  },
  {
    title: 'Progress evidence',
    text: 'Ask how mastered skills, reading transfer and the next target are tracked.',
    icon: Search,
  },
];

const assessmentChecks = [
  'Letter–sound knowledge',
  'Oral blending & segmenting',
  'Word blending & decoding',
  'Tricky-word handling',
  'Spelling / encoding',
  'Sentence reading & transfer',
  'Fluency & comprehension when appropriate',
];

const redFlags = [
  'A large prepaid package is recommended before the child’s current reading level is checked.',
  'Every child starts from the same lesson purely because of age or grade.',
  'The group size is unclear or the child gets very little individual reading time.',
  'The course relies heavily on memorising whole words or guessing from pictures.',
  'The total fee is prominent but the number of live classes is difficult to identify.',
  'There is no clear explanation of how reading or spelling errors are corrected.',
];

const parentGuides = [
  {
    title: 'How to Choose a Phonics Class',
    description: 'Compare fit, teaching quality, transfer evidence and commercial clarity.',
    to: '/blog/how-to-choose-phonics-classes',
    label: 'Decision guide',
  },
  {
    title: 'How Long Does Phonics Take?',
    description: 'Understand why progress depends on starting point, practice and transfer.',
    to: '/blog/how-long-does-phonics-take',
    label: 'Progress guide',
  },
  {
    title: 'Phonics Assessment Checklist for Parents',
    description: 'Check sounds, fresh-word decoding, blending, spelling and reading transfer.',
    to: '/blog/week-22-phonics-diagnostics',
    label: 'Assessment guide',
  },
  { title: 'What Is the Right Age to Start Phonics?', to: '/blog/what-age-to-start-phonics' },
  { title: 'How Phonics Classes Help Kids Read', to: '/blog/how-phonics-classes-help-kids-read' },
  { title: 'Are Phonics Apps Enough?', to: '/blog/are-phonics-apps-enough-for-kids' },
];

const faqItems = [
  {
    question: 'How much do live 1:1 phonics classes cost in India?',
    answer:
      'In the publicly advertised provider sample reviewed for this guide, the central 1:1 fee range was approximately ₹350–₹550 per live class. The sample median was about ₹458 and the average was about ₹474 per class. Session duration and what is included still need to be compared separately.',
  },
  {
    question: 'How much do group phonics classes cost in India?',
    answer:
      'In the reviewed group-class sample, the central range was approximately ₹200–₹299 per child per live class. The sample median was about ₹225 per child per class. Batch size is an important part of the comparison.',
  },
  {
    question: 'Does a higher phonics fee mean better teaching?',
    answer:
      'No. These fee bands describe price only. A higher fee can reflect class format, teacher costs, brand positioning, technology, marketing or package structure, so parents should compare curriculum depth, live correction, assessment, class duration, batch size and progress support as well as price.',
  },
  {
    question: 'How should I compare phonics course packages?',
    answer:
      'Convert each package to an effective live-class fee by dividing the total course fee by the stated number of live classes. Then compare class duration, format, group size and what the program includes.',
  },
  {
    question: 'Should my child be assessed before joining phonics classes?',
    answer:
      'A useful placement process should check what the child can actually do with sounds, blending, decoding, spelling and connected reading. Two children of the same age can need very different starting points.',
  },
  {
    question: 'What does Tiny Steps charge for live 1:1 phonics?',
    answer:
      'Tiny Steps charges ₹400 per live 1:1 class, or ₹4,800 for 12 classes. Classes are typically 35–40 minutes and placement begins with an assessment-first approach.',
  },
];

function FeeBandGrid({ bands, group = false }: { bands: FeeBand[]; group?: boolean }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
      {bands.map((band) => {
        const isTypical = band.name === 'Typical Fee Band';
        return (
          <article
            key={band.name}
            className={`bg-white px-4 py-4 lg:px-4 xl:px-5 ${isTypical ? 'bg-sky-50/70 ring-1 ring-inset ring-sky-200' : ''}`}
          >
            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isTypical ? 'text-sky-800' : 'text-slate-500'}`}>
              {band.name}
            </p>
            <p className="mt-2 whitespace-nowrap text-[1.55rem] font-black tracking-tight text-slate-950 xl:text-[1.7rem]">
              {band.range}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Avg <strong className="text-base text-slate-900">{band.average}</strong>
              {group ? ' / child' : ''}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export default function PhonicsFeesIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Phonics Class Fees in India 2026 | 1:1 & Group Price Guide',
      description:
        'Compare 2026 phonics class fees in India for live 1:1 and group classes, package costs, quality checks, assessment questions and parent red flags.',
      canonicalPath: '/phonics-fees-india',
      ogType: 'website',
      keywords: [
        'phonics classes fees in India',
        'phonics class fees India',
        'online phonics classes fees',
        '1 to 1 phonics class fees',
        'group phonics class fees',
        'phonics course price India',
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    });
  }, []);

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50/50">
        <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-6 py-11 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-sky-800 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              2026 India phonics pricing guide
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.03]">
              Phonics Class Fees in India
              <span className="mt-1 block bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent">
                1:1 & Group Price Guide
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Compare effective per-class fees, decode package pricing and see what parents should verify before choosing a phonics program.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#market-pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Compare fees <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                to="/book-demo"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                Book free assessment
              </Link>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Public prices reviewed · 1:1 and groups analysed separately · Updated August 2026
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-200/50 backdrop-blur sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Typical 1:1</p>
                <p className="mt-2 text-3xl font-black text-slate-950">₹350–₹550</p>
                <p className="mt-1 text-sm text-slate-500">per live class</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Typical group</p>
                <p className="mt-2 text-3xl font-black text-slate-950">₹200–₹299</p>
                <p className="mt-1 text-sm text-slate-500">per child / live class</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5 text-white sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-200">Tiny Steps 1:1</p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="text-3xl font-black">₹400</p>
                      <p className="pb-1 text-sm text-slate-300">per class</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-xs text-slate-200">
                    <div>35–40 min</div>
                    <div className="mt-0.5">1 child : 1 teacher</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              <strong>Price is not a quality ranking.</strong> Higher fees do not automatically mean stronger teaching or better outcomes.
            </div>
          </div>
        </div>
      </section>

      <section id="market-pricing" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Market pricing</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Compare 1:1 and group fees separately
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Personal teaching time changes the economics significantly, so combining the two formats would be misleading.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Live 1:1 online phonics</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">One child, one teacher</h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Median <strong className="text-slate-900">~₹458</strong></div>
                <div className="mt-1">Average <strong className="text-slate-900">~₹474</strong></div>
              </div>
            </div>
            <FeeBandGrid bands={oneToOneBands} />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Price bands describe position in the reviewed sample—not teaching quality.
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Live group online phonics</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Price per child</h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Median <strong className="text-slate-900">~₹225</strong></div>
                <div className="mt-1">Average <strong className="text-slate-900">~₹226</strong></div>
              </div>
            </div>
            <FeeBandGrid bands={groupBands} group />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Group prices are per child; always verify the <strong className="text-slate-800">actual batch size</strong>.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-9">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[.82fr_1.18fr]">
            <div className="bg-slate-950 p-6 text-white sm:p-7">
              <div className="flex items-center gap-2 text-sm font-bold text-sky-200">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
                Tiny Steps 1:1
              </div>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-black">₹400</span>
                <span className="pb-1 text-sm text-slate-300">per live class</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">₹4,800 for 12 classes · 35–40 min · 1 child : 1 teacher</p>
            </div>
            <div className="bg-sky-50 p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Where ₹400 sits</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Inside the Typical Fee Band</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The reviewed 1:1 central band is ₹350–₹550 per live class. Tiny Steps sits inside that range, with assessment-first placement before a longer plan is recommended.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Book free demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/phonics"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:border-slate-400"
                >
                  Explore phonics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="grid items-start gap-7 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Calculator className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Package price reality check</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Compare the cost per live class—not just the package total
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">
              Convert every clearly stated package to the same unit before comparing providers.
            </p>
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold text-slate-900">
              Total live-course fee ÷ number of live classes = effective fee per class
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {[
              ['₹18,000 course', '40 live classes', '₹450 / class'],
              ['₹12,000 course', '40 group classes', '₹300 / child / class'],
              ['₹8,000 course', '60 group classes', '~₹133 / child / class'],
            ].map(([price, sessions, result], index) => (
              <div
                key={price}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1fr_auto_1fr] ${index ? 'border-t border-slate-200' : ''}`}
              >
                <div>
                  <p className="font-bold text-slate-950">{price}</p>
                  <p className="mt-1 text-sm text-slate-500">{sessions}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="text-right text-lg font-black text-sky-700">{result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-sky-200 ring-1 ring-white/10">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Price is only one part of value
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">What parents should check before paying</h2>
            <p className="mt-3 text-lg leading-8 text-slate-300">
              A useful comparison asks what the child actually receives in each live class—not only what appears on the invoice.
            </p>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {qualityChecks.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-sky-200 bg-sky-50 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Assessment before placement</p>
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">What should a useful phonics assessment check?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Two children of the same age can need very different starting points.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {assessmentChecks.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-sky-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Parent watch-outs</p>
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Red flags worth checking before you enrol</h2>
            <div className="mt-5 space-y-2">
              {redFlags.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 ring-1 ring-rose-100">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Parent guides</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Continue your phonics research</h2>
              <p className="mt-2 text-sm text-slate-600">Choose the guide that matches the decision you are making next.</p>
            </div>
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900">
              Browse all guides <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {parentGuides.slice(0, 3).map((guide) => (
              <Link
                key={guide.to}
                to={guide.to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">{guide.label}</span>
                  <BookOpen className="h-4 w-4 text-slate-400 group-hover:text-sky-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700">
                  Read guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {parentGuides.slice(3).map((guide) => (
              <Link
                key={guide.to}
                to={guide.to}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
              >
                {guide.title}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[.62fr_1.38fr] lg:px-8 lg:py-12">
        <details className="group h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-950">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-700" aria-hidden="true" />
              How we calculated these prices
            </span>
            <span className="text-slate-400 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>We reviewed publicly advertised live online phonics pricing available to Indian parents and analysed 1:1 and group classes separately.</p>
            <p>Where a provider advertised a package, the total was divided by the clearly stated number of live sessions. Unclear or conflicting session counts were excluded from the statistical calculation.</p>
            <p>A provider with several comparable package lengths was treated as one provider-level observation so one company could not dominate the sample.</p>
            <p className="font-semibold text-slate-800">These are market observations, not quality rankings or a nationwide census. Pricing last reviewed: August 2026.</p>
          </div>
        </details>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Parent questions</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Phonics fees FAQs</h2>
          <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqItems.map((item) => (
              <details key={item.question} className="group p-5 open:bg-slate-50/60">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-slate-950">
                  <span>{item.question}</span>
                  <span className="mt-0.5 text-xl font-light text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8 lg:pb-7">
        <div className="rounded-[2rem] bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-950 px-6 py-6 text-white shadow-xl shadow-indigo-200/30 sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-100">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="max-w-2xl text-2xl font-black">Not sure which phonics level your child actually needs?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                Book one free 35-minute 1:1 online demo assessment class and start with a recommendation based on the child’s current reading stage.
              </p>
            </div>
          </div>
          <Link
            to="/book-demo"
            className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 lg:mt-0"
          >
            Book Free 35-Minute Demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="pb-24 sm:pb-20">
        <ClusterSeoNav cluster="phonics" compact />
      </div>
    </main>
  );
}
