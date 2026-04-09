import type { FC } from "react";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Meta from "../components/common/Meta";
import AutoLinkedText from "../components/seo/AutoLinkedText";
import TestimonialsSection from "../components/seo/TestimonialsSection";
import TestimonialSubmissionForm from "../components/seo/TestimonialSubmissionForm";

type Item = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

type ComparisonRow = {
  left: string;
  right: string;
};

const WHATSAPP_URL = "https://wa.me/919618398383";

const valuePills = [
  "Ages 4–12",
  "Live classes, real teachers",
  "Structured curriculum",
  "Parent-visible progress",
];

const trustStrip = [
  { label: "Phonics & Reading", icon: <IconBook /> },
  { label: "Grammar & Writing", icon: <IconEdit /> },
  { label: "Communication", icon: <IconMic /> },
  { label: "Practice Support", icon: <IconHand /> },
];

type Outcome = {
  title: string;
  desc: string;
  tag: string;
  bullets: string[];
  accent: {
    bg: string;
    glow: string;
    icon: string;
    pill: string;
    ring: string;
  };
};

const outcomes: Outcome[] = [
  {
    tag: "Phonics & Reading",
    title: "Strong reading foundations",
    desc: "Master letter sounds, blending, and fluency through structured phonics instruction.",
    bullets: [
      "Clear phonics progression from sounds to fluent reading",
      "Daily blending and decoding practice with immediate feedback",
      "High-frequency words taught in meaningful reading context",
    ],
    accent: {
      bg: "from-emerald-50 to-white",
      glow: "bg-emerald-400/20",
      icon: "bg-emerald-600",
      pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
      ring: "ring-emerald-500/20",
    },
  },
  {
    tag: "Grammar & Sentence Building",
    title: "Clear grammar understanding",
    desc: "Learn grammar through engaging activities that build sentence clarity and writing confidence.",
    bullets: [
      "Interactive grammar games and activities—never rote memorization",
      "Sentence frames and vocabulary expansion in every lesson",
      "Guided practice that makes grammar feel natural and intuitive",
    ],
    accent: {
      bg: "from-violet-50 to-white",
      glow: "bg-violet-400/20",
      icon: "bg-violet-600",
      pill: "bg-violet-50 text-violet-800 border-violet-200",
      ring: "ring-violet-500/20",
    },
  },
  {
    tag: "Communication & Confidence",
    title: "Speaking with confidence",
    desc: "Build speaking confidence through daily practice and encouragement-based coaching.",
    bullets: [
      "Structured speaking prompts with live mentor modeling",
      "Pronunciation coaching delivered in small, comfortable steps",
      "Confidence-building approach—encouragement, not pressure",
    ],
    accent: {
      bg: "from-sky-50 to-white",
      glow: "bg-sky-400/20",
      icon: "bg-sky-600",
      pill: "bg-sky-50 text-sky-800 border-sky-200",
      ring: "ring-sky-500/20",
    },
  },
];

const trustPillars: Item[] = [
  {
    title: "Clear curriculum pathway",
    desc: "Know exactly what your child will learn and when—no surprises, no confusion.",
    icon: <IconChart />,
  },
  {
    title: "Consistent teacher guidance",
    desc: "The same thoughtful teacher approach in every class, building familiarity and trust.",
    icon: <IconUsers />,
  },
  {
    title: "Practice support beyond class",
    desc: "Digital worksheets and activities that reinforce learning without overwhelming parents.",
    icon: <IconHand />,
  },
  {
    title: "Progress you can understand",
    desc: "Clear updates on what's working and what needs focus—transparent, never vague.",
    icon: <IconMessage />,
  },
];

const methodSteps: Array<Item & { accent: Outcome["accent"] }> = [
  {
    title: "Systematic teaching",
    desc: "Sequence phonics, grammar, reading, and speaking in an order that supports natural learning.",
    icon: <IconBlocks />,
    accent: {
      bg: "from-slate-50 to-white",
      glow: "bg-slate-400/15",
      icon: "bg-slate-900",
      pill: "bg-slate-50 text-slate-800 border-slate-200",
      ring: "ring-slate-500/15",
    },
  },
  {
    title: "Engaging practice",
    desc: "Match activities to children's attention spans and learning styles with multisensory practice.",
    icon: <IconSpark />,
    accent: {
      bg: "from-indigo-50 to-white",
      glow: "bg-indigo-400/20",
      icon: "bg-indigo-700",
      pill: "bg-indigo-50 text-indigo-800 border-indigo-200",
      ring: "ring-indigo-500/20",
    },
  },
  {
    title: "Real application",
    desc: "Children use what they learn in stories, conversations, and writing tasks.",
    icon: <IconMic />,
    accent: {
      bg: "from-sky-50 to-white",
      glow: "bg-sky-400/20",
      icon: "bg-sky-700",
      pill: "bg-sky-50 text-sky-800 border-sky-200",
      ring: "ring-sky-500/20",
    },
  },
  {
    title: "Steady mastery",
    desc: "Build each skill fully before advancing—steady progress, always supported.",
    icon: <IconChart />,
    accent: {
      bg: "from-emerald-50 to-white",
      glow: "bg-emerald-400/20",
      icon: "bg-emerald-700",
      pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
      ring: "ring-emerald-500/20",
    },
  },
];

const comparison: ComparisonRow[] = [
  { left: "Rush through content to cover more", right: "Systematic skill-building—never rushed, always supported" },
  { left: "Only conversation practice or only phonics", right: "All four skills—phonics, grammar, reading, speaking" },
  { left: "Ad-hoc lesson plans, no clear pathway", right: "Structured curriculum designed for steady mastery" },
  { left: "Limited parent visibility", right: "Transparent progress tracking, clear next steps" },
];

const WhyTinyStepsPage: FC = () => {
  const [activeOutcome, setActiveOutcome] = useState(0);

  const active = useMemo(() => outcomes[activeOutcome], [activeOutcome]);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
      { '@type': 'ListItem', position: 2, name: 'Why Tiny Steps', item: 'https://tinystepslearning.com/why-tiny-steps' }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Meta
        title="Why Tiny Steps | Premium Online English Learning School for Children"
        description="Tiny Steps is a premium online English learning school building strong phonics, reading, grammar, and communication through structured teaching and parent-visible progress."
        canonical="https://tinystepslearning.com/why-tiny-steps"
        jsonLd={[breadcrumbSchema]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
              PREMIUM ONLINE ENGLISH LEARNING
            </span>

            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight">
              Premium English learning built on phonics, grammar, and confidence
            </h1>

            <p className="mt-4 text-lg md:text-xl text-slate-600">
              <AutoLinkedText text="Live 1:1 and small-group classes with trained mentors, structured curriculum you can understand, and transparent progress tracking parents trust." />
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {valuePills.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <span className="text-emerald-700">
                    <IconCheck />
                  </span>
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/?book=1" className="w-full sm:w-auto">
                <PrimaryButton>Book Free Assessment Class</PrimaryButton>
              </Link>
              <Link to="/courses" className="w-full sm:w-auto">
                <SecondaryButton>View Courses</SecondaryButton>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
              <Link to="/curriculum" className="hover:text-slate-900">See curriculum</Link>
              <Link to="/contact" className="hover:text-slate-900">Contact team</Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-slate-900">
                Chat on WhatsApp - opens new window
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {trustStrip.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-slate-700">
                <span className="text-slate-500">{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE TEACH */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          kicker="Our approach"
          title="How children learn best"
          desc="Systematic teaching, engaging practice, real application, and steady mastery."
          center
        />

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {methodSteps.map((it, idx) => (
            <PremiumTile key={it.title} {...it} step={idx + 1} desc={<AutoLinkedText text={it.desc} />} />
          ))}
        </div>
      </section>

      {/* WHAT WE TEACH */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeading
          kicker="What we teach"
          title="Three core pillars of English learning"
          desc="Select a pillar to see how we build it in class."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* left: selectable outcomes */}
          <div className="lg:col-span-7 grid gap-4 md:grid-cols-2">
            {outcomes.map((o, idx) => {
              const isActive = idx === activeOutcome;
              return (
                <OutcomeSelectCard
                  key={o.title}
                  outcome={o}
                  active={isActive}
                  onClick={() => setActiveOutcome(idx)}
                />
              );
            })}
          </div>

          {/* right: detail panel */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className={`absolute -top-14 -right-14 h-44 w-44 rounded-full blur-2xl ${active.accent.glow}`} />
              <div className={`absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-2xl ${active.accent.glow}`} />

              <div className="relative p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${active.accent.pill}`}>
                    {active.tag}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">How we build it</span>
                </div>

                <div className="mt-3 text-2xl font-extrabold tracking-tight">{active.title}</div>
                <div className="mt-2 text-slate-600 leading-relaxed">{active.desc}</div>

                <div className="mt-5 space-y-3">
                  {active.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white ${active.accent.icon}`}>
                        <IconCheck />
                      </span>
                      <div className="text-slate-700">{b}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link to="/curriculum" className="block" onClick={(e) => e.stopPropagation()}>
                    <SecondaryButton>View Curriculum</SecondaryButton>
                  </Link>
                  <Link to="/courses" className="block" onClick={(e) => e.stopPropagation()}>
                    <SecondaryButton>Compare Courses</SecondaryButton>
                  </Link>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Tip: parents usually see progress first in <b>confidence</b>—then speed follows.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          kicker="What makes us different"
          title="Premium, structured English learning"
          desc="Not random lessons—a complete learning pathway."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <CompareCard
            title="Many online classes…"
            tone="muted"
            rows={comparison.map((r) => ({ text: r.left, ok: false }))}
          />
          <CompareCard
            title="Tiny Steps…"
            tone="bright"
            rows={comparison.map((r) => ({ text: r.right, ok: true }))}
          />
        </div>
      </section>

      {/* WHAT PARENTS GET */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          kicker="What parents actually get"
          title="Clarity, support, and visible progress"
          desc="A structured pathway where you understand what's being taught, how it's taught, and how your child is progressing."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {trustPillars.map((it) => (
            <IconCard key={it.title} {...it} />
          ))}
        </div>
      </section>

      {/* SAFETY & QUALITY */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          kicker="Safety & Quality"
          title="Teaching with care and structure"
          desc="Trained educators, transparent communication, and careful placement."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <IconUsers />
            </div>
            <div className="mt-4 text-lg font-extrabold">Experienced educators</div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              <AutoLinkedText text="Mentors trained in phonics instruction, child development, and confidence-building correction techniques." />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <IconChart />
            </div>
            <div className="mt-4 text-lg font-extrabold">Assessment-first placement</div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              <AutoLinkedText text="Free assessment to identify the right starting level—so your child's progress feels steady and motivating, never frustrating." />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <IconMessage />
            </div>
            <div className="mt-4 text-lg font-extrabold">Transparent updates</div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              <AutoLinkedText text="Clear progress notes after each session: what was practiced, what improved, and simple next steps—no jargon, just clarity." />
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY COMMITMENT */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50/30 p-6 md:p-8 shadow-sm">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-bold tracking-[0.2em] text-emerald-700">
                NO HIDDEN SURPRISES
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Clear process, transparent pricing, zero pressure
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <IconCheck />
                </span>
                <div className="text-slate-700">
                  <span className="font-semibold">Free assessment before enrollment</span> — understand your child's level with no obligation to continue
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <IconCheck />
                </span>
                <div className="text-slate-700">
                  <span className="font-semibold">Visible pricing page</span> — all course packages and pricing clearly listed at <Link to="/pricing" className="text-blue-700 hover:underline">/pricing</Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <IconCheck />
                </span>
                <div className="text-slate-700">
                  <span className="font-semibold">Clear program pathways</span> — see the full curriculum structure at <Link to="/curriculum" className="text-blue-700 hover:underline">/curriculum</Link> before starting
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <IconCheck />
                </span>
                <div className="text-slate-700">
                  <span className="font-semibold">Flexible scheduling</span> — reschedule classes easily when needed, no complex policies
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <IconCheck />
                </span>
                <div className="text-slate-700">
                  <span className="font-semibold">Support when you need it</span> — reach the team via <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">WhatsApp</a>, email, or parent dashboard
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700">
              <strong>Our commitment:</strong> <AutoLinkedText text="You'll always know what your child is learning, how they're progressing, and what comes next. No confusing tracks, no surprise charges, no pressure to upgrade." />
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection
        title="Parent trust, in their own words"
        subtitle="Approved testimonials from families who experienced Tiny Steps classes."
        pageTag="why-tiny-steps"
        limit={6}
        viewAllHref="/testimonials"
      />

      <div id="share-feedback" className="scroll-mt-28">
        <TestimonialSubmissionForm
          pageTag="why-tiny-steps"
          title="Share your Tiny Steps experience"
          description="We review every submission before publishing. Your feedback helps other families choose confidently."
          compact
        />
      </div>

      {/* FOUNDER STORY SNIPPET */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="inline-flex items-center rounded-full border bg-slate-100 px-3 py-1 text-xs font-bold tracking-[0.2em] text-slate-700">
                OUR STORY
              </div>
              <h2 className="mt-3 text-2xl font-extrabold">Why Tiny Steps exists</h2>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/priya-founder-tiny-steps-learning.webp"
                    alt="Priya, Founder of Tiny Steps Learning"
                    width={72}
                    height={72}
                    loading="lazy"
                    decoding="async"
                    className="h-[72px] w-[72px] rounded-xl border border-slate-200 object-cover object-center"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Founder</p>
                    <p className="text-lg font-extrabold text-slate-900">Priya</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  With 10+ years in early childhood English education, Priya built Tiny Steps to help children ages
                  3-12 strengthen phonics, grammar, writing, and speaking with calm, structured teaching.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 text-slate-700 leading-relaxed">
              <p>
                Tiny Steps Learning was founded by educators who saw firsthand how structured, kind instruction transforms struggling readers into confident communicators—often in just 12–16 weeks.
              </p>
              <p>
                Working with international schools implementing phonics-first curriculum, the founding team realized that many children weren't getting the systematic, age-appropriate support they needed. Generic tuition rushed through content. Apps lacked live guidance. Parents felt lost.
              </p>
              <p>
                Tiny Steps was built to solve this: <strong>live 1:1 or small-group classes</strong> with trained mentors, <strong>structured curriculum</strong> parents can understand, and <strong>transparent progress tracking</strong> so families see real improvement—not vague promises.
              </p>
              <p className="text-sm text-slate-600">
                Since 2020, Tiny Steps has supported 5000+ families across 15+ countries including India, UAE, Vietnam, Singapore, Malaysia, UK, Canada, USA, Sweden, Germany, and Australia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* APPROACH EXPLAINER */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeading
          kicker="How it works"
          title="The Tiny Steps teaching process"
          desc="Assessment → Placement → Live Teaching → Practice → Progress Tracking → Next Steps"
          center
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">1</span>
              <div className="text-lg font-extrabold">Free Assessment</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Understand your child's current reading level, letter-sound knowledge, and speaking confidence. No sales pitch—just honest placement guidance.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">2</span>
              <div className="text-lg font-extrabold">Custom Learning Plan</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Receive a clear recommendation: which program (Phonics, Grammar, or Speaking), which level, and a 12–16 week roadmap showing exactly what will be covered.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">3</span>
              <div className="text-lg font-extrabold">Live Guided Teaching</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              35-minute live classes (1:1 or small group) with trained mentors using multisensory practice, gentle correction, and age-appropriate pacing.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-lg font-bold text-white">4</span>
              <div className="text-lg font-extrabold">Practice & Reinforcement</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Digital worksheets, practice games, and optional 5-minute home activities that reinforce class learning without overwhelming parents.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">5</span>
              <div className="text-lg font-extrabold">Progress Tracking</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              After every session, parents receive a short update: what was practiced today, one improvement observed, and one focus area for next class. Stage-based milestone reports every 12 lessons.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">6</span>
              <div className="text-lg font-extrabold">Next Step Guidance</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              At level completion, receive clear guidance: continue to advanced phonics, transition to grammar, add public speaking, or graduate with confidence.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            <strong>No rushing, no gaps, no confusion.</strong> Just systematic skill-building with visible progress.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="book-trial" className="mx-auto max-w-6xl px-4 py-10 scroll-mt-28">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-700 to-violet-700 p-[1px] shadow-xl">
          <div className="rounded-3xl bg-white/95 p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <div className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500">
                  Book free assessment class
                </div>
                <h3 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
                  Find the right starting point through a free assessment
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Understand your child's current level and receive a clear recommendation—so progress feels natural and motivating from day one.
                </p>

                <ul className="mt-6 space-y-3 text-slate-700">
                  <CheckItem>Quick level check</CheckItem>
                  <CheckItem>Clear course recommendation</CheckItem>
                  <CheckItem>Simple next steps</CheckItem>
                </ul>

                <div className="mt-6 text-sm font-semibold text-slate-600">
                  Foundations that last. Confidence that grows.
                </div>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-6">
                <div className="flex flex-col gap-3">
                  <Link to="/?book=1">
                    <PrimaryButton>Book Free Assessment Class</PrimaryButton>
                  </Link>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <Link to="/courses" className="hover:text-slate-900">
                      View courses
                    </Link>
                    <Link to="/curriculum" className="hover:text-slate-900">
                      See curriculum
                    </Link>
                    <Link to="/contact" className="hover:text-slate-900">
                      Contact team
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

/* -------------------- UI blocks -------------------- */

function SectionHeading({
  kicker,
  title,
  desc,
  center,
}: {
  kicker: string;
  title: string;
  desc?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="text-xs font-bold tracking-[0.22em] text-slate-500 uppercase">{kicker}</div>
      <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
      {desc ? (
        <p className={`mt-3 text-slate-600 ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{desc}</p>
      ) : null}
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-full rounded-xl bg-gradient-to-r from-slate-900 via-blue-700 to-violet-700 px-5 py-3 text-sm md:text-base font-bold text-white shadow-lg hover:opacity-95 active:opacity-90 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-full rounded-xl border bg-white px-5 py-3 text-sm md:text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition"
    >
      {children}
    </button>
  );
}

function IconCard({ title, desc, icon }: Item) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          {icon}
        </div>
        <div>
          <div className="text-lg font-extrabold">{title}</div>
          <div className="mt-1 text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function PremiumTile({
  title,
  desc,
  icon,
  step,
  accent,
}: Omit<Item, "desc"> & {
  desc: React.ReactNode;
  step: number;
  accent: Outcome["accent"];
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm",
        "transition hover:shadow-md hover:-translate-y-0.5",
        "focus-within:ring-2 focus-within:ring-blue-500/30",
      ].join(" ")}
    >
      <div className={`absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-gradient-to-br ${accent.bg}`} />
      <div className={`absolute -top-14 -right-14 h-44 w-44 rounded-full blur-2xl ${accent.glow}`} />
      <div className={`absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-2xl ${accent.glow}`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${accent.pill}`}>
            Step {step}
          </span>

          <div
            className={[
              "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm",
              accent.icon,
              "ring-1",
              accent.ring,
              "transition-transform duration-200 group-hover:scale-[1.03]",
            ].join(" ")}
          >
            {icon}
          </div>
        </div>

        <div className="mt-3 text-lg font-extrabold">{title}</div>
        <div className="mt-1 text-slate-600 text-sm leading-relaxed">{desc}</div>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="opacity-70 group-hover:opacity-100 transition">Learn more</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <IconArrow />
          </span>
        </div>
      </div>
    </div>
  );
}

function OutcomeSelectCard({
  outcome,
  active,
  onClick,
}: {
  outcome: Outcome;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm cursor-pointer select-none",
        "transition hover:shadow-md hover:-translate-y-0.5",
        active ? "ring-2 ring-blue-500/25" : "",
      ].join(" ")}
      aria-pressed={active}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${outcome.accent.bg}`} />
      <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl ${outcome.accent.glow}`} />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${outcome.accent.pill}`}>
            {outcome.tag}
          </span>

          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm",
              outcome.accent.icon,
              "transition-transform duration-200",
              active ? "scale-[1.03]" : "group-hover:scale-[1.03]",
            ].join(" ")}
          >
            <IconCheck />
          </div>
        </div>

        <div className="mt-3 text-lg font-extrabold">{outcome.title}</div>
        <div className="mt-1 text-slate-600 text-sm leading-relaxed">{outcome.desc}</div>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="opacity-70 group-hover:opacity-100 transition">{active ? "Selected" : "Select"}</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <IconArrow />
          </span>
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "muted" | "bright";
  rows: { text: string; ok: boolean }[];
}) {
  const header =
    tone === "bright"
      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
      : "bg-slate-100 text-slate-900";

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className={`px-5 py-4 font-extrabold ${header}`}>{title}</div>
      <div className="p-5 space-y-3">
        {rows.map((r, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div
              className={[
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white",
                r.ok ? "bg-emerald-600" : "bg-slate-400",
              ].join(" ")}
            >
              {r.ok ? <IconCheck /> : <IconX />}
            </div>
            <div className="text-slate-700">{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
        <IconCheck />
      </span>
      <span className="text-slate-700">{children}</span>
    </li>
  );
}

/* -------------------- Icons (no deps) -------------------- */

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M8 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.5 5.5L8.2 13.8 3.5 9.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4 21c1.2-3.6 4.3-6 8-6s6.8 2.4 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.5 6L20 10l-6.5 2L12 22l-1.5-10L4 10l6.5-2L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 12V6a1 1 0 0 1 2 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 12V5a1 1 0 0 1 2 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 12V6a1 1 0 0 1 2 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M13 12V7a1 1 0 0 1 2 0v7c0 3-2 6-6 6H8a4 4 0 0 1-4-4v-2a1 1 0 0 1 2 0v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v11H7l-3 3V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconBlocks() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h10v10H7V7z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 4h6v6H4V4zM14 14h6v6h-6v-6z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7 15l3-3 3 2 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default WhyTinyStepsPage;
