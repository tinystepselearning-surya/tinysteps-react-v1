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
  note: string;
  accent: string;
};

const oneToOneBands: FeeBand[] = [
  {
    name: 'Lower Fee Band',
    range: 'Below ₹350',
    average: '~₹280',
    note: 'Lower-priced live 1:1 options in the reviewed sample.',
    accent: 'border-emerald-200 bg-emerald-50/70',
  },
  {
    name: 'Typical Fee Band',
    range: '₹350–₹550',
    average: '~₹450',
    note: 'The central price range for structured 1:1 phonics in the reviewed sample.',
    accent: 'border-sky-200 bg-sky-50/80',
  },
  {
    name: 'Higher Fee Band',
    range: 'Above ₹550',
    average: '~₹720',
    note: 'Higher-priced 1:1 offerings. A higher fee does not automatically mean higher quality.',
    accent: 'border-amber-200 bg-amber-50/70',
  },
];

const groupBands: FeeBand[] = [
  {
    name: 'Lower Fee Band',
    range: 'Below ₹200',
    average: '~₹145',
    note: 'Lower-priced group options. Always check the actual batch size.',
    accent: 'border-emerald-200 bg-emerald-50/70',
  },
  {
    name: 'Typical Fee Band',
    range: '₹200–₹299',
    average: '~₹225',
    note: 'The central per-child range in the reviewed group-class sample.',
    accent: 'border-sky-200 bg-sky-50/80',
  },
  {
    name: 'Higher Fee Band',
    range: '₹300+',
    average: '~₹305',
    note: 'Higher-priced group programs. Smaller batches may be one reason, but verify before joining.',
    accent: 'border-amber-200 bg-amber-50/70',
  },
];

const qualityChecks = [
  {
    title: 'Curriculum progression',
    text: 'Look for a clear path from sound knowledge to blending, decoding, spelling and connected reading.',
    icon: Layers,
  },
  {
    title: 'Live correction',
    text: 'The teacher should hear the child read, identify the error and give the child another attempt.',
    icon: CheckCircle2,
  },
  {
    title: 'Class duration',
    text: 'A ₹400 class for 30 minutes and a ₹400 class for 60 minutes are not the same comparison.',
    icon: Clock,
  },
  {
    title: 'Batch size',
    text: 'For groups, confirm how many children share the teacher’s attention in each live class.',
    icon: Users,
  },
  {
    title: 'Assessment & placement',
    text: 'The starting level should be based on what the child can actually read and spell, not age alone.',
    icon: ClipboardCheck,
  },
  {
    title: 'Progress evidence',
    text: 'Ask how the provider tracks mastered skills, reading transfer and the next learning target.',
    icon: Search,
  },
];

const assessmentChecks = [
  'Letter–sound knowledge',
  'Oral blending and segmenting',
  'Word blending and decoding',
  'Tricky-word handling',
  'Spelling / encoding',
  'Sentence reading and transfer',
  'Fluency and comprehension when appropriate',
];

const redFlags = [
  'A large prepaid package is recommended before anyone checks the child’s current reading level.',
  'Every child starts from the same lesson purely because of age or grade.',
  'The group size is unclear, or the child gets very little opportunity to read aloud individually.',
  'The course relies heavily on memorising whole words or guessing from pictures instead of decoding.',
  'The package advertises a large total fee but makes the number of live classes difficult to identify.',
  'There is no clear explanation of what happens when a child makes a reading or spelling error.',
];

const parentGuides = [
  {
    title: 'How to Choose a Phonics Class',
    description: 'A complete parent comparison framework covering fit, teaching quality, transfer evidence and commercial clarity.',
    to: '/blog/how-to-choose-phonics-classes',
    label: 'Decision guide',
  },
  {
    title: 'How Long Does Phonics Take?',
    description: 'Understand why progress depends on the child’s starting point, practice and reading transfer rather than a fixed promise.',
    to: '/blog/how-long-does-phonics-take',
    label: 'Progress guide',
  },
  {
    title: 'Phonics Assessment Checklist for Parents',
    description: 'Check taught sounds, fresh-word decoding, blending, spelling and reading transfer before deciding the next step.',
    to: '/blog/week-22-phonics-diagnostics',
    label: 'Assessment guide',
  },
  {
    title: 'What Is the Right Age to Start Phonics?',
    description: 'Use readiness signals rather than age alone when deciding whether a child is ready for structured phonics.',
    to: '/blog/what-age-to-start-phonics',
    label: 'Readiness guide',
  },
  {
    title: 'How Phonics Classes Help Kids Read',
    description: 'See how decoding, blending and fluency should connect inside a structured phonics program.',
    to: '/blog/how-phonics-classes-help-kids-read',
    label: 'Learning guide',
  },
  {
    title: 'Are Phonics Apps Enough?',
    description: 'Understand where apps can support practice and where live teacher observation and correction still matter.',
    to: '/blog/are-phonics-apps-enough-for-kids',
    label: 'Format guide',
  },
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

function FeeBandGrid({ bands }: { bands: FeeBand[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {bands.map((band) => (
        <article key={band.name} className={`rounded-3xl border p-6 shadow-sm ${band.accent}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{band.name}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{band.range}</p>
          <div className="mt-5 rounded-2xl bg-white/85 p-4 ring-1 ring-slate-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sample average</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{band.average}</p>
            <p className="text-sm text-slate-500">per live class</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{band.note}</p>
        </article>
      ))}
    </div>
  );
}

export default function PhonicsFeesIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Phonics Classes Fees in India 2026 | 1:1 & Group Price Guide',
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
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    });
  }, []);

  return (
    <main className="overflow-hidden bg-slate-50 text-slate-900">
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              2026 India phonics pricing guide
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Phonics Classes Fees in India
              <span className="block bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent">
                1:1 & Group Price Guide
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              Compare effective per-class fees, understand package pricing, and check what parents should look for before choosing a phonics program.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">Publicly advertised pricing reviewed</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">1:1 and groups analysed separately</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">Package fees normalised per class</span>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Typical 1:1 band</p>
              <p className="mt-2 text-3xl font-black text-slate-950">₹350–₹550</p>
              <p className="mt-1 text-sm text-slate-500">per live class</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Typical group band</p>
              <p className="mt-2 text-3xl font-black text-slate-950">₹200–₹299</p>
              <p className="mt-1 text-sm text-slate-500">per child / live class</p>
            </article>
            <article className="rounded-3xl border border-sky-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                <IndianRupee className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-wide text-sky-200">Tiny Steps 1:1</p>
              <p className="mt-2 text-3xl font-black">₹400</p>
              <p className="mt-1 text-sm text-slate-300">35–40 minute live class</p>
            </article>
          </div>

          <div className="mx-auto mt-7 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-center text-sm leading-6 text-amber-950">
            <strong>Important:</strong> these bands classify <strong>price only</strong>. A higher fee does not automatically mean better teaching, a stronger curriculum or better learning outcomes.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Market comparison</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Live 1:1 Online Phonics Fees</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            We separated 1:1 classes from group classes because personal teaching time changes the price structure significantly.
          </p>
        </div>
        <div className="mt-10">
          <FeeBandGrid bands={oneToOneBands} />
        </div>
        <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Overall sample median</p>
            <p className="mt-1 text-2xl font-black text-slate-950">~₹458</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Overall sample average</p>
            <p className="mt-1 text-2xl font-black text-slate-950">~₹474</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Tiny Steps position</p>
            <p className="mt-1 text-2xl font-black text-sky-700">₹400 · Typical band</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-700">Group classes</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Live Group Online Phonics Fees</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Group prices are shown per child per live class. Batch size should always be checked alongside the fee.
            </p>
          </div>
          <div className="mt-10">
            <FeeBandGrid bands={groupBands} />
          </div>
          <div className="mt-6 grid gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-400">Overall sample median</p>
              <p className="mt-1 text-2xl font-black">~₹225</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Overall sample average</p>
              <p className="mt-1 text-2xl font-black">~₹226</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">What to verify</p>
              <p className="mt-1 text-2xl font-black text-sky-200">Actual batch size</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Calculator className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Package price reality check</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Don’t compare the package price alone</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A larger package can look expensive while having a lower effective class fee. Convert every clearly stated package to the same unit before comparing providers.
            </p>
            <div className="mt-7 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-sm font-semibold text-sky-900">Simple parent formula</p>
              <p className="mt-2 text-xl font-black text-slate-950">Total live-course fee ÷ number of live classes = effective fee per class</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['₹18,000 course', '40 live classes', '₹450 / class'],
              ['₹12,000 course', '40 group classes', '₹300 / child / class'],
              ['₹8,000 course', '60 group classes', '~₹133 / child / class'],
            ].map(([fee, classes, result]) => (
              <article key={fee} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-950">{fee}</p>
                    <p className="mt-1 text-sm text-slate-500">{classes}</p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 flex-none text-slate-400 sm:block" aria-hidden="true" />
                  <p className="text-right text-lg font-black text-sky-700">{result}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-sky-200 ring-1 ring-white/10">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Price is only one part of value
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">What parents should check before paying for a phonics course</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              A useful comparison looks beyond the number on the invoice and asks what the child actually receives in each live class.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {qualityChecks.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-sky-200 bg-sky-50 p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-sky-700">Assessment before placement</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">What should a useful phonics assessment check?</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Two children of the same age can need very different starting points. Placement should reflect what the child can actually do, not only age or grade.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {assessmentChecks.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" aria-hidden="true" />
                  <span className="text-sm font-semibold leading-6 text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-rose-200 bg-rose-50 p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-rose-700">Parent watch-outs</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Red flags worth checking before you enrol</h2>
            <div className="mt-7 space-y-3">
              {redFlags.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/85 p-4 ring-1 ring-rose-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-rose-500" aria-hidden="true" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Tiny Steps pricing</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Transparent 1:1 phonics pricing</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Tiny Steps sits inside the Typical Fee Band identified in the reviewed 1:1 market sample.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-300/40">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 text-white sm:p-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-300/10 px-4 py-2 text-sm font-semibold text-sky-200">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Live 1:1 online phonics
                </div>
                <div className="mt-7 flex items-end gap-3">
                  <p className="text-5xl font-black">₹400</p>
                  <p className="pb-1 text-slate-400">per class</p>
                </div>
                <p className="mt-3 text-lg text-slate-300">₹4,800 for 12 live classes</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {['35–40 minute live class', '1 child : 1 teacher', 'Assessment-first placement', 'Structured phonics progression'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="h-4 w-4 flex-none text-emerald-400" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center bg-gradient-to-br from-sky-100 to-indigo-100 p-7 sm:p-10">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-800">Before choosing a package</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">Start with the child’s current reading stage.</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  A free 1:1 demo assessment helps identify the child’s starting point before a longer learning plan is recommended.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/book-demo" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800">
                    Book Free Demo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link to="/phonics" className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50">
                    Explore Phonics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-700">Continue your research</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Useful phonics guides for parents</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Use the guide that matches the decision you are making next.</p>
          </div>
          <Link to="/blog" className="inline-flex items-center gap-2 font-bold text-sky-700 hover:text-sky-800">
            Browse all guides
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {parentGuides.map((guide) => (
            <Link key={guide.to} to={guide.to} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">{guide.label}</span>
                <BookOpen className="h-5 w-5 text-slate-400 transition group-hover:text-sky-600" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-black leading-7 text-slate-950">{guide.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{guide.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-700">
                Read guide
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">How this comparison was built</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Research methodology</h2>
              </div>
            </div>
            <div className="mt-7 grid gap-5 text-sm leading-7 text-slate-600 md:grid-cols-2">
              <p>
                We reviewed publicly advertised live online phonics pricing available to Indian parents. Live 1:1 and group classes were analysed separately, and provider names are intentionally not displayed in the parent-facing fee bands.
              </p>
              <p>
                When a provider advertised a package rather than a per-class fee, the package total was divided by the clearly stated number of live sessions. Pricing without a reliable session count was not used to manufacture a per-class figure.
              </p>
              <p>
                A provider with multiple clearly comparable package lengths was treated as one provider-level observation so that one company could not dominate the statistics simply by publishing more package options.
              </p>
              <p>
                The resulting ranges are market observations, not quality rankings or a nationwide census. Prices, promotions, session duration and package structures can change, so parents should confirm current terms directly before enrolling.
              </p>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing research last reviewed: August 2026</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Parent questions</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Phonics fees FAQs</h2>
        </div>
        <div className="mt-10 space-y-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.question}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-sky-700 via-indigo-800 to-slate-950 p-8 text-center text-white shadow-2xl shadow-indigo-200/50 sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Sparkles className="h-7 w-7 text-sky-200" aria-hidden="true" />
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Not sure which phonics level your child actually needs?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-sky-100">
            Book one free 35-minute 1:1 online demo assessment class and start with a recommendation based on the child’s current reading stage.
          </p>
          <Link to="/book-demo" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-black text-slate-950 transition hover:bg-sky-50">
            Book Free 35-Minute Demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <ClusterSeoNav cluster="phonics" />
      </div>
    </main>
  );
}
