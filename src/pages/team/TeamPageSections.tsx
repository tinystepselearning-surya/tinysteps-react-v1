import type { ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  GraduationCap,
  Headphones,
  Layers3,
  MessageCircleMore,
  Mic2,
  PenLine,
  School2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/analytics';
import { PUBLIC_FACTS } from '../../lib/schemas';
import {
  academicSystemCards,
  founderResponsibilities,
  qualitySteps,
  teachingCommunity,
  teacherDevelopmentSteps,
  teamFaqItems,
  trustMetrics,
  type TeamIconKey,
} from './teamPageContent';

const iconMap = {
  book: BookOpenCheck,
  chart: BarChart3,
  compass: Compass,
  headset: Headphones,
  layers: Layers3,
  message: MessageCircleMore,
  mic: Mic2,
  pen: PenLine,
  school: School2,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: UsersRound,
} satisfies Record<TeamIconKey, typeof Compass>;

const primaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-center text-sm font-bold text-white shadow-[0_14px_32px_rgba(234,88,12,0.24)] transition hover:bg-[#ea580c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600';
const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 transition hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-700';

function TrackedLink({
  children,
  className,
  eventName,
  to,
}: {
  children: ReactNode;
  className: string;
  eventName: string;
  to: string;
}) {
  return (
    <Link to={to} className={className} onClick={() => trackEvent(eventName)}>
      {children}
    </Link>
  );
}

function Eyebrow({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${inverse ? 'text-orange-300' : 'text-orange-700'}`}>
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-[-0.025em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description ? <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{description}</p> : null}
    </div>
  );
}

export function TeamHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-orange-100 bg-[#fffaf3] px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -right-32 top-12 h-80 w-80 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-4 h-72 w-72 rounded-full bg-orange-200/50 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
        <div>
          <Eyebrow>Founder-led • Child-centred • Progress-focused</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-heading text-[2.15rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#10243e] min-[430px]:text-[2.45rem] sm:text-5xl lg:text-[3.65rem]">
            The academic team behind confident young readers, writers and speakers
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-xl sm:leading-8">
            Tiny Steps Learning brings together structured curriculum, trained online teachers, guided live practice and clear parent communication to help children use English with greater confidence and independence.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <TrackedLink to="/book-demo" eventName="team_hero_book_assessment" className={primaryButtonClass}>
              Book a Free 35-Minute Assessment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <TrackedLink to="/curriculum" eventName="team_hero_explore_curriculum" className={secondaryButtonClass}>
              Explore Our Curriculum
            </TrackedLink>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Structured English programmes for children ages 3–12
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[590px]">
          <div className="absolute -inset-4 -z-10 rotate-2 rounded-[36px] bg-[#dbeafe]" aria-hidden="true" />
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-[#10243e] p-3 shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[0.88fr_1.12fr]">
              <div className="relative min-h-[330px] overflow-hidden rounded-[22px] bg-slate-200 sm:min-h-[430px]">
                <img
                  src="/priya-founder-tiny-steps-learning.webp"
                  alt="Priya, Founder of Tiny Steps Learning"
                  width={1024}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/90 p-3 shadow-lg backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Founder-led</p>
                  <p className="mt-1 font-heading text-lg font-bold text-slate-950">Priya</p>
                  <p className="text-sm text-slate-600">Founder, Tiny Steps Learning</p>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[22px] bg-white p-5 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">One connected system</p>
                  <h2 className="mt-3 font-heading text-2xl font-bold leading-tight text-slate-950">More than the teacher on screen</h2>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    ['01', 'Structured curriculum'],
                    ['02', 'Prepared teachers'],
                    ['03', 'Guided live practice'],
                    ['04', 'Parent visibility'],
                  ].map(([number, label]) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">{number}</span>
                      <span className="text-sm font-semibold text-slate-800">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
                  <Sparkles className="h-4 w-4 text-orange-500" aria-hidden="true" />
                  Progress-focused by design
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustMetrics() {
  return (
    <section aria-label="Tiny Steps trust metrics" className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
        {trustMetrics.map((metric) => {
          const Icon = iconMap[metric.icon];
          return (
            <div key={metric.label} className="flex min-h-32 flex-col items-center justify-center px-3 py-6 text-center sm:min-h-36">
              <Icon className="mb-3 h-5 w-5 text-orange-600" aria-hidden="true" />
              <strong className="font-heading text-xl font-bold text-slate-950 sm:text-2xl">{metric.value}</strong>
              <span className="mt-1 text-xs font-medium leading-5 text-slate-600 sm:text-sm">{metric.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FounderSection() {
  return (
    <section id="founder" className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="absolute -bottom-5 -left-5 h-full w-full rounded-[30px] bg-orange-100" aria-hidden="true" />
          <figure className="relative overflow-hidden rounded-[30px] border-8 border-white bg-slate-100 shadow-[0_24px_65px_rgba(15,23,42,0.14)]">
            <img
              src="/priya-founder-tiny-steps-learning.webp"
              alt="Priya, Founder of Tiny Steps Learning, reviewing academic materials"
              width={1024}
              height={1024}
              loading="lazy"
              className="aspect-square h-auto w-full object-cover"
            />
          </figure>
        </div>
        <div>
          <SectionHeading eyebrow="Founder & academic leadership" title="Built by an educator. Strengthened by a teaching system." />
          <div className="mt-8 border-l-2 border-orange-400 pl-5 sm:pl-7">
            <h3 className="font-heading text-2xl font-bold text-slate-950">{PUBLIC_FACTS.founder.fullName}</h3>
            <p className="mt-1 font-semibold text-orange-700">
              Founder, Tiny Steps Learning • known to families as {PUBLIC_FACTS.founder.displayName}
            </p>
          </div>
          <div className="mt-7 max-w-3xl space-y-4 text-base leading-7 text-slate-700">
            <p>Priya founded Tiny Steps Learning to make high-quality English learning more structured, personal and measurable for children.</p>
            <p>She leads the academic direction of the organisation, working across curriculum development, lesson design, teacher guidance, teaching quality and parent communication for Phonics, Reading, Grammar, Writing and Public Speaking programmes.</p>
            <p>The goal is not simply to help children complete lessons. It is to keep learning progress observable through evidence such as reading accuracy, sentence formation, language use and increasingly independent communication.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {founderResponsibilities.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fffaf3] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold leading-5 text-slate-800">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AcademicSystemSection() {
  return (
    <section className="bg-[#f3f7fb] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered
          eyebrow="One connected academic system"
          title="Every lesson is supported by more than the teacher on screen"
          description="Tiny Steps is not a teacher-directory marketplace. Educators work within one programme framework, supported by curriculum, resources, academic guidance and parent communication."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {academicSystemCards.map((card, index) => {
            const Icon = iconMap[card.icon];
            return (
              <article key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-black tracking-[0.16em] text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-7 font-heading text-xl font-bold text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ResearchToClassroomSection() {
  const designInputs = [
    {
      title: 'Child development',
      detail: 'Age, readiness, attention and language development shape how lesson demands, examples and pacing are planned.',
    },
    {
      title: 'Learning science',
      detail: 'Prerequisites, guided practice, retrieval, cumulative review and gradual reduction of support inform the progression.',
    },
    {
      title: 'Subject pedagogy',
      detail: 'Early-literacy pedagogy and language-development principles connect phonics, reading, grammar, writing and speaking.',
    },
    {
      title: 'Learner observation',
      detail: 'Recurring errors and observed learner difficulty help the academic team refine examples, practice and review points.',
    },
  ];

  const designProcess = [
    'Review child-development and subject-pedagogy evidence',
    'Map the skill and its prerequisites',
    'Build the curriculum progression',
    'Design lesson objectives, modelling and practice',
    'Prepare teachers around shared instructional principles',
    'Observe the child during class',
    'Adjust pace, prompting, examples and repetition',
    'Review progress and select the next teaching focus',
  ];

  const responsiveBehaviours = [
    'Use short, age-appropriate tasks and predictable lesson routines.',
    'Model clearly, then provide guided practice and guided retries.',
    'Give specific, encouraging feedback and revisit prerequisites when needed.',
    'Adjust prompts, examples, repetition and practice time to the child’s response.',
    'Reduce teacher support gradually as accuracy and independence become secure.',
  ];

  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="academic-design-heading">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <Eyebrow>How Tiny Steps designs learning</Eyebrow>
          <h2 id="academic-design-heading" className="mt-4 font-heading text-3xl font-bold leading-tight tracking-[-0.025em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
            Built around how children actually learn
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            Tiny Steps curriculum development goes beyond choosing topics and worksheets. Research-informed planning draws on child development, learning science, early-literacy pedagogy, language development, classroom observation and recurring learner difficulties.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {designInputs.map((item, index) => (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-[#fffaf3] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <span className="text-xs font-black tracking-[0.16em] text-orange-600">0{index + 1}</span>
              <h3 className="mt-4 font-heading text-xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] bg-[#10243e] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">From research to classroom practice</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {designProcess.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-300 text-xs font-black text-slate-950">{index + 1}</span>
                  <span className="text-sm font-semibold leading-6 text-white/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Research-informed planning. Child-responsive teaching.</p>
            <h3 className="mt-3 font-heading text-2xl font-bold leading-tight text-slate-950">The curriculum is structured, but the child is not forced through it at a fixed speed.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Teachers keep the shared lesson objective and instructional principles while adapting pace, modelling and support to the learner’s readiness and response during class.
            </p>
            <ul className="mt-6 space-y-3">
              {responsiveBehaviours.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-white/80 p-4 text-xs leading-5 text-slate-600">
              This describes evidence-informed teaching practice, not clinical psychology, learning-style classifications or a guarantee that every child progresses at the same rate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeacherDevelopmentSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
        <div className="overflow-hidden rounded-[28px] bg-[#10243e] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Live learning studio</p>
              <p className="mt-2 font-heading text-xl font-bold">A prepared lesson, not improvisation</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <GraduationCap className="h-6 w-6 text-orange-300" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] bg-white p-5 text-slate-950 sm:row-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Lesson pathway</p>
              <div className="mt-5 space-y-4">
                {['Model the skill', 'Practise together', 'Apply independently'].map((label, index) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">{index + 1}</span>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl bg-blue-50 p-4">
                <BookOpenCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-900">Curriculum-led resources</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Lesson decks, reading tasks, activities and application practice.</p>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-white/10 p-5">
              <UsersRound className="h-6 w-6 text-blue-200" aria-hidden="true" />
              <p className="mt-4 font-heading text-lg font-bold">Teacher guidance</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Clear expectations for preparation, participation and child interaction.</p>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-white/10 p-5">
              <MessageCircleMore className="h-6 w-6 text-emerald-200" aria-hidden="true" />
              <p className="mt-4 font-heading text-lg font-bold">Connected feedback</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Academic review and parent insights help strengthen future teaching.</p>
            </div>
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Teacher selection & development" title="Teachers are selected carefully—and supported continuously" />
          <div className="mt-9 space-y-5">
            {teacherDevelopmentSteps.map((step, index) => (
              <article key={step.title} className="grid grid-cols-[48px_1fr] gap-4 rounded-[22px] border border-slate-200 bg-[#fffdf9] p-5 sm:grid-cols-[56px_1fr] sm:p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 font-heading text-sm font-black text-orange-700 sm:h-14 sm:w-14">0{index + 1}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{step.label}</p>
                  <h3 className="mt-1 font-heading text-xl font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function QualitySystemSection() {
  return (
    <section className="bg-[#fff7ed] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading centered eyebrow="How quality is maintained" title="A clear pathway from assessment to visible progress" />
        <ol className="relative mt-14 grid gap-4 md:grid-cols-3 xl:grid-cols-6 xl:gap-3">
          <div className="absolute left-[8.5%] right-[8.5%] top-8 hidden h-px bg-orange-300 xl:block" aria-hidden="true" />
          {qualitySteps.map((step) => (
            <li key={step.title} className="relative rounded-[22px] border border-orange-200 bg-white p-5 shadow-[0_12px_28px_rgba(124,45,18,0.05)] xl:border-0 xl:bg-transparent xl:p-3 xl:text-center xl:shadow-none">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#fff7ed] bg-[#10243e] text-xs font-black text-white xl:mx-auto xl:h-16 xl:w-16">{step.label}</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TeachingCommunitySection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered
          eyebrow="The wider academic team"
          title="The teaching community behind every programme"
          description="Children may learn with different educators, but every programme follows the same structured Tiny Steps academic framework."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {teachingCommunity.map((card, index) => {
            const Icon = iconMap[card.icon];
            return (
              <article key={card.title} className={`rounded-[24px] border border-slate-200 bg-slate-50 p-6 ${index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-heading text-xl font-bold leading-7 text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Link to="/testimonials" className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-bold text-blue-800 underline decoration-blue-200 decoration-2 underline-offset-4 hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
            Read approved parent reviews
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SchoolPartnershipSection() {
  return (
    <section className="bg-[#0b3040] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-4xl">
          <Eyebrow inverse>For schools</Eyebrow>
          <h2 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl">The same academic system can strengthen school classrooms</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">Tiny Steps works with schools that want more than a one-time phonics workshop. We provide structured curriculum, classroom resources, progressive teacher training, implementation guidance, progress review and year-long support.</p>
        </div>
        <TrackedLink
          to="/for-schools"
          eventName="team_school_partnership_click"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200"
        >
          Explore the School Partnership Programme
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </TrackedLink>
      </div>
    </section>
  );
}

export function FinalAssessmentSection() {
  return (
    <section className="bg-[#f3f7fb] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[30px] bg-[#10243e] px-5 py-14 text-center text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:px-10 sm:py-16">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <Eyebrow inverse>Start with clarity</Eyebrow>
          <h2 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">Find the right learning path for your child</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Begin with a free 35-minute 1:1 assessment class. We will understand your child’s current level and recommend the most appropriate starting point.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink to="/book-demo" eventName="team_final_book_assessment" className={primaryButtonClass}>
              Book a Free 35-Minute Assessment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <TrackedLink to="/courses" eventName="team_view_programmes" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              View Programmes
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeamFaqSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8" id="team-faq">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <SectionHeading eyebrow="Frequently asked questions" title="Direct answers about the people and system behind each class" />
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {teamFaqItems.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="faq-question flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left font-heading text-base font-bold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="relative h-8 w-8 shrink-0 rounded-full bg-orange-100 text-orange-700" aria-hidden="true">
                  <span className="absolute left-2 top-[15px] h-0.5 w-4 bg-current" />
                  <span className="absolute left-[15px] top-2 h-4 w-0.5 bg-current transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="faq-answer max-w-3xl pb-5 pr-10 text-sm leading-7 text-slate-600 sm:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
