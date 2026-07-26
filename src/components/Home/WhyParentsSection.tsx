// WhyTinyStepsPage.tsx
import type { FC } from "react";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
  "Phonics + Grammar + Speaking together",
  "Confidence-first teaching",
  "Clear progress & parent updates",
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
    tag: "Reading",
    title: "Reads with confidence",
    desc: "Stronger decoding, blending, and fluency—without fear of mistakes.",
    bullets: [
      "Systematic phonics + blending practice (step-by-step).",
      "Guided reading + instant feedback to build fluency.",
      "High-frequency words introduced in context (not rote).",
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
    tag: "Speaking",
    title: "Speaks clearly",
    desc: "Daily speaking practice and gentle correction builds clarity and courage.",
    bullets: [
      "Every class includes speaking prompts + guided models.",
      "Pronunciation practice in small, safe steps.",
      "Confidence grows through encouragement—not pressure.",
    ],
    accent: {
      bg: "from-sky-50 to-white",
      glow: "bg-sky-400/20",
      icon: "bg-sky-600",
      pill: "bg-sky-50 text-sky-800 border-sky-200",
      ring: "ring-sky-500/20",
    },
  },
  {
    tag: "Writing",
    title: "Writes better sentences",
    desc: "Children learn structure naturally through activities—no rote rules.",
    bullets: [
      "Grammar taught through activities and sentence building.",
      "Vocabulary + sentence frames for confident writing.",
      "Correctness improves through guided practice, not drilling.",
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
    tag: "Independence",
    title: "Learns independently",
    desc: "Designed to reduce parent pressure—kids can practice with minimal help.",
    bullets: [
      "Clear routines so kids know what to do next.",
      "Small goals + frequent wins keep motivation high.",
      "Parents get updates without needing to teach at home.",
    ],
    accent: {
      bg: "from-orange-50 to-white",
      glow: "bg-orange-400/20",
      icon: "bg-orange-600",
      pill: "bg-orange-50 text-orange-800 border-orange-200",
      ring: "ring-orange-500/20",
    },
  },
];

const trustPillars: Item[] = [
  {
    title: "Live classes (not passive videos)",
    desc: "Real teacher interaction, real attention, real improvement.",
    icon: <IconUsers />,
  },
  {
    title: "Age-right, brain-friendly steps",
    desc: "Tiny, guided activities—never overloaded, never bored.",
    icon: <IconSpark />,
  },
  {
    title: "Multisensory practice",
    desc: "See • say • move • use—so children remember through experience.",
    icon: <IconHand />,
  },
  {
    title: "Parent-friendly communication",
    desc: "You always know what was covered and what comes next.",
    icon: <IconMessage />,
  },
];

const methodSteps: Array<Item & { accent: Outcome["accent"] }> = [
  {
    title: "Build the foundation",
    desc: "Sounds → words → sentences → confident speaking.",
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
    title: "Practice in tiny steps",
    desc: "Short, guided activities that keep children engaged.",
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
    title: "Use it in real life",
    desc: "Stories and speaking tasks turn learning into real English.",
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
    title: "Strengthen gaps early",
    desc: "We notice patterns and fix weak areas before they become habits.",
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
  { left: "Finish portions & worksheets fast", right: "Build a strong foundation before speed" },
  { left: "Lecture + slides, little practice", right: "See–say–move–use (multisensory practice)" },
  { left: "Phonics/grammar/speaking taught separately", right: "Integrated English — real-life usage" },
  { left: "Success = marks + homework", right: "Success = confidence, fluency, understanding" },
  { left: "Parents fill gaps at home", right: "Designed for independence with minimal parent pressure" },
];

/* -------------------- UK Phonics infographic data -------------------- */

type Phase = {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  short: string;
  goal: string;
  what: string[];
  games: { name: string; note: string }[];
  color: {
    pill: string;
    bg: string;
    glow: string;
    ring: string;
    icon: string;
    chip: string;
  };
};

const phases: Phase[] = [
  {
    id: 1,
    title: "Listening & Sound Awareness",
    short: "Listen",
    goal: "Train the ear before the eye (pre-reading).",
    what: ["Sound attention", "Rhyming & patterns", "Hearing sounds in words"],
    games: [
      { name: "Sound Detective", note: "Hear sounds in words (initial sounds)." },
      { name: "Rhyme Time", note: "Rhyming and sound patterns." },
    ],
    color: {
      pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
      bg: "from-emerald-50 to-white",
      glow: "bg-emerald-400/20",
      ring: "ring-emerald-500/20",
      icon: "bg-emerald-700",
      chip: "bg-emerald-100 text-emerald-900",
    },
  },
  {
    id: 2,
    title: "Letter–Sound Introduction",
    short: "Letters",
    goal: "Understand that letters represent sounds (alphabetic code begins).",
    what: ["Letter–sound mapping", "Touch-based multisensory memory", "Correct formation cues"],
    games: [
      { name: "Letter–Sound Match", note: "Match sounds to letters (e.g., s a t p i n)." },
      { name: "Write the Letter (Tracing)", note: "See–say–trace to strengthen memory." },
    ],
    color: {
      pill: "bg-amber-50 text-amber-900 border-amber-200",
      bg: "from-amber-50 to-white",
      glow: "bg-amber-400/20",
      ring: "ring-amber-500/20",
      icon: "bg-amber-700",
      chip: "bg-amber-100 text-amber-950",
    },
  },
  {
    id: 3,
    title: "Blending & Early Reading",
    short: "Blend",
    goal: "Blend sounds to read simple words (decoding starts).",
    what: ["Sound order", "Smooth blending", "CVC word reading"],
    games: [
      { name: "Sound Sequencer", note: "Put sounds in order (c-a-t)." },
      { name: "Blend & Slide", note: "Smooth blending (ssss-aaa-t)." },
      { name: "CVC Word Builder", note: "Build and read 3-letter words." },
    ],
    color: {
      pill: "bg-orange-50 text-orange-900 border-orange-200",
      bg: "from-orange-50 to-white",
      glow: "bg-orange-400/20",
      ring: "ring-orange-500/20",
      icon: "bg-orange-700",
      chip: "bg-orange-100 text-orange-950",
    },
  },
  {
    id: 4,
    title: "Fluency & Confidence",
    short: "Read",
    goal: "More practice (no big new sounds) → faster, confident reading.",
    what: ["Automatic blending", "Confidence & speed", "Reading short sentences"],
    games: [
      { name: "Word Quest", note: "Apply reading skills in game tasks." },
      { name: "Story Builder", note: "Read simple sentences (meaning + flow)." },
    ],
    color: {
      pill: "bg-sky-50 text-sky-900 border-sky-200",
      bg: "from-sky-50 to-white",
      glow: "bg-sky-400/20",
      ring: "ring-sky-500/20",
      icon: "bg-sky-700",
      chip: "bg-sky-100 text-sky-950",
    },
  },
  {
    id: 5,
    title: "Vowels & Variations",
    short: "Understand",
    goal: "Letters can make different sounds (vowels and alternatives).",
    what: ["Vowel clarity", "Early alternatives", "Reading with understanding"],
    games: [
      { name: "Vowel Explorer", note: "Short vowels and contrasts (a/e/i/o/u)." },
      { name: "Advanced Story Builder", note: "Stronger meaning + fluency." },
    ],
    color: {
      pill: "bg-violet-50 text-violet-900 border-violet-200",
      bg: "from-violet-50 to-white",
      glow: "bg-violet-400/20",
      ring: "ring-violet-500/20",
      icon: "bg-violet-700",
      chip: "bg-violet-100 text-violet-950",
    },
  },
];

const journey = [
  { k: "Listen", icon: <IconEar />, desc: "Hear & play with sounds" },
  { k: "Letters", icon: <IconLetter />, desc: "Connect sounds to letters" },
  { k: "Blend", icon: <IconPuzzle />, desc: "Blend sounds to read words" },
  { k: "Read", icon: <IconBook />, desc: "Read smoothly & confidently" },
  { k: "Understand", icon: <IconBulb />, desc: "Read with meaning" },
];

/* -------------------- Page -------------------- */

const WhyTinyStepsPage: FC = () => {
  const [activeOutcome, setActiveOutcome] = useState(0);
  const active = useMemo(() => outcomes[activeOutcome], [activeOutcome]);

  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4 | 5>(2);
  const phase = useMemo(() => phases.find((p) => p.id === activePhase)!, [activePhase]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-10 md:pt-16 md:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
              WHY TINY STEPS • FOUNDATIONS FOREVER
            </span>

            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight">
              English foundations your child can actually use
            </h1>

            <p className="mt-4 text-lg md:text-xl text-slate-600">
              Tiny Steps builds strong phonics, grammar, reading, and speaking through joyful, structured teaching—so
              children become confident and independent learners.
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

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#book-trial" className="w-full sm:w-auto">
                <PrimaryButton>Book Free 35-Minute Demo</PrimaryButton>
              </a>

              <Link to="/courses" className="w-full sm:w-auto">
                <SecondaryButton>View Courses</SecondaryButton>
              </Link>

              <Link to="/curriculum" className="w-full sm:w-auto">
                <SecondaryButton>See Curriculum</SecondaryButton>
              </Link>
            </div>

            <div className="mt-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                <span className="text-emerald-700">
                  <IconWhatsapp />
                </span>
                WhatsApp Advisor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* METHOD (premium tiles) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border bg-gradient-to-br from-slate-50 to-white p-6 md:p-10 shadow-sm">
          <SectionHeading
            kicker="How learning happens"
            title="The Tiny Steps Method"
            desc="Simple, structured, and child-friendly — designed for steady progress."
            center
          />

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {methodSteps.map((it, idx) => (
              <PremiumTile key={it.title} {...it} step={idx + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* UK PHONICS INFOGRAPHIC + PHASE TILES */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border bg-gradient-to-br from-slate-50 to-white p-6 md:p-10 shadow-sm">
          <SectionHeading
            kicker="Research-backed learning path"
            title="Phonics games mapped to UK Phonics Phases (1–5)"
            desc="Children move in the right order: listening → letters → blending → confident reading."
            center
          />

          {/* Journey stepper */}
          <div className="mt-8 rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-slate-900">Your child’s reading journey</div>
              <span className="text-xs font-semibold text-slate-500">Interactive • not videos</span>
            </div>

            <div className="mt-4 relative">
              {/* animated connector line */}
              <div className="pointer-events-none absolute left-5 right-5 top-6 hidden md:block">
                <div className="h-[3px] w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 animate-shimmer" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                {journey.map((j) => (
                  <div key={j.k} className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        {j.icon}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold">{j.k}</div>
                        <div className="text-xs text-slate-600">{j.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                We follow a systematic sequence used in many UK classrooms: build listening first, then letter–sound
                mapping, then blending, then fluency.
              </div>
            </div>
          </div>

          {/* Phase tiles + detail panel */}
          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                {phases.map((p) => (
                  <PhaseTile
                    key={p.id}
                    phase={p}
                    active={p.id === activePhase}
                    onClick={() => setActivePhase(p.id)}
                  />
                ))}
              </div>

              {/* Tracing highlight card */}
              {activePhase === 2 ? (
                <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-slate-900">Why tracing is part of phonics</div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${phase.color.pill}`}>
                      Phase 2 Support Skill
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniSkill icon={<IconEye />} title="See the letter" desc="Recognise shape & direction." />
                    <MiniSkill icon={<IconMouth />} title="Say the sound" desc="Connect sound to symbol." />
                    <MiniSkill icon={<IconFinger />} title="Trace it" desc="Multisensory memory + confidence." />
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Tracing supports reading by strengthening letter–sound memory. It’s not a “handwriting class”—it’s a
                    phonics reinforcement tool.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className={`absolute -top-14 -right-14 h-44 w-44 rounded-full blur-2xl ${phase.color.glow}`} />
                <div className={`absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-2xl ${phase.color.glow}`} />

                <div className="relative p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${phase.color.pill}`}>
                      UK Phase {phase.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Mapped to Tiny Steps games</span>
                  </div>

                  <div className="mt-3 text-2xl font-extrabold tracking-tight">{phase.title}</div>
                  <div className="mt-2 text-slate-600 leading-relaxed">{phase.goal}</div>

                  <div className="mt-5">
                    <div className="text-sm font-extrabold text-slate-900">What your child learns</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {phase.what.map((w) => (
                        <span key={w} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${phase.color.chip}`}>
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-extrabold text-slate-900">Tiny Steps games in this phase</div>
                    <div className="mt-3 space-y-3">
                      {phase.games.map((g) => (
                        <div key={g.name} className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white ${phase.color.icon}`}>
                            <IconCheck />
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900">{g.name}</div>
                            <div className="text-sm text-slate-600">{g.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link to="/curriculum" className="block">
                      <SecondaryButton>See Curriculum</SecondaryButton>
                    </Link>
                    <a href="#book-trial" className="block">
                      <PrimaryButton>Book Assessment</PrimaryButton>
                    </a>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Parents usually notice progress first in <b>confidence</b>—then speed follows naturally.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parent-friendly line */}
          <div className="mt-6 flex justify-center">
            <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              “Listening → sounds → letters → blending → confident reading” — presented as real games.
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES (professional + interactive) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          kicker="What your child gains"
          title="Results parents can see (and children feel)"
          desc="Select an outcome to see what we do in class to build it."
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
                  <a href="#book-trial" className="block" onClick={(e) => e.stopPropagation()}>
                    <PrimaryButton>Book Assessment</PrimaryButton>
                  </a>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Tip: parents usually see progress first in <b>confidence</b>—then speed follows.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENCE (Comparison) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          kicker="What makes us different"
          title="Typical online tuition vs Tiny Steps"
          desc="Same time spent — very different outcomes."
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

        <div className="mt-6 flex justify-center">
          <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Specialised English foundation education — not “just tuition”.
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          kicker="Why parents trust Tiny Steps"
          title="Trust is built into the system"
          desc="Clear plan, strong teaching, and child confidence — all together."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {trustPillars.map((it) => (
            <IconCard key={it.title} {...it} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="book-trial" className="mx-auto max-w-6xl px-4 pb-16 scroll-mt-28">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-700 to-violet-700 p-[1px] shadow-xl">
          <div className="rounded-3xl bg-white/95 p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <div className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500">
                  Book Free 35-Minute Demo
                </div>
                <h3 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
                  Let’s find the right starting point for your child
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  We’ll understand your child’s current level and recommend the best path—so progress feels easy and
                  motivating.
                </p>

                <ul className="mt-6 space-y-3 text-slate-700">
                  <CheckItem>35-minute live 1:1 demo assessment</CheckItem>
                  <CheckItem>Clear course recommendation</CheckItem>
                  <CheckItem>Simple next steps for parents</CheckItem>
                </ul>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-6">
                <div className="flex flex-col gap-3">
                  <a href="#book-trial">
                    <PrimaryButton>Book Free 35-Minute Demo</PrimaryButton>
                  </a>

                  <Link to="/courses">
                    <SecondaryButton>Explore Courses</SecondaryButton>
                  </Link>

                  <Link to="/curriculum">
                    <SecondaryButton>View Curriculum</SecondaryButton>
                  </Link>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
                  >
                    <span className="text-emerald-700">
                      <IconWhatsapp />
                    </span>
                    WhatsApp Advisor
                  </a>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Your nav item “Book Free 35-Minute Demo” can link to <b>#book-trial</b>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* tiny CSS keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-40%); opacity: 0.65; }
          50% { opacity: 1; }
          100% { transform: translateX(220%); opacity: 0.65; }
        }
        .animate-shimmer {
          animation: shimmer 3.2s ease-in-out infinite;
        }
      `}</style>
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
        <p className={`mt-3 text-slate-600 ${center ? "mx-auto max-w-3xl" : "max-w-2xl"}`}>{desc}</p>
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
}: Item & { step: number; accent: Outcome["accent"] }) {
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

/* -------------------- Phonics infographic UI -------------------- */

function PhaseTile({
  phase,
  active,
  onClick,
}: {
  phase: Phase;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm cursor-pointer select-none",
        "transition hover:shadow-md hover:-translate-y-0.5",
        active ? "ring-2 ring-blue-500/25" : "",
      ].join(" ")}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${phase.color.bg}`} />
      <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl ${phase.color.glow}`} />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${phase.color.pill}`}>
            Phase {phase.id}
          </span>
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm",
              phase.color.icon,
              "ring-1",
              phase.color.ring,
              "transition-transform duration-200",
              active ? "scale-[1.03]" : "group-hover:scale-[1.03]",
            ].join(" ")}
          >
            <IconCheck />
          </div>
        </div>

        <div className="mt-3 text-lg font-extrabold">{phase.short}</div>
        <div className="mt-1 text-slate-600 text-sm leading-relaxed">{phase.title}</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {phase.games.slice(0, 2).map((g) => (
            <span key={g.name} className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-bold text-slate-700">
              {g.name}
            </span>
          ))}
          {phase.games.length > 2 ? (
            <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-bold text-slate-600">
              +{phase.games.length - 2} more
            </span>
          ) : null}
        </div>

        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="opacity-70 group-hover:opacity-100 transition">{active ? "Selected" : "View details"}</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <IconArrow />
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniSkill({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          {icon}
        </div>
        <div>
          <div className="text-sm font-extrabold">{title}</div>
          <div className="text-xs text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Icons (no deps) -------------------- */

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16.5 5.5L8.2 13.8 3.5 9.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
      <path d="M4 21c1.2-3.6 4.3-6 8-6s6.8 2.4 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.5 6L20 10l-6.5 2L12 22l-1.5-10L4 10l6.5-2L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconHand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 12V6a1 1 0 0 1 2 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 12V5a1 1 0 0 1 2 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 12V6a1 1 0 0 1 2 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 12V7a1 1 0 0 1 2 0v7c0 3-2 6-6 6H8a4 4 0 0 1-4-4v-2a1 1 0 0 1 2 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="currentColor" strokeWidth="2" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15l3-3 3 2 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWhatsapp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 11.5a7.5 7.5 0 0 1-11.7 6.2L4 19l1.4-4.1A7.5 7.5 0 1 1 20 11.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10.5c.6 2 2.5 3.7 4.5 4.2.5.1 1-.3 1.2-.7l.3-.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Journey icons */
function IconEar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a7 7 0 0 1 7 7c0 4-2 6-4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 19c0 1.5 1.2 2.5 2.8 2.5S16 20.6 16 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10a3 3 0 0 1 6 0c0 2-2 2-2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLetter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 20V4h12v16H6z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 7a2 2 0 1 0-4 0v2H8a2 2 0 0 0-2 2v2h2a2 2 0 1 1 0 4H6v2a2 2 0 0 0 2 2h2v-2a2 2 0 1 1 4 0v2h2a2 2 0 0 0 2-2v-2h-2a2 2 0 1 1 0-4h2v-2a2 2 0 0 0-2-2h-2V7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6a3 3 0 0 1 3-3h13v18H7a3 3 0 0 0-3 3V6z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 4v17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21h6M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3a7 7 0 0 0-4 12c.7.6 1 1.2 1 2h6c0-.8.3-1.4 1-2A7 7 0 0 0 12 3z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* Tracing highlight icons */
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconMouth() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconFinger() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13l-2 8h8l-2-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default WhyTinyStepsPage;
