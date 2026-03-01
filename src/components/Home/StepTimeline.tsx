import React, { useMemo, useState } from "react";
import { Carousel } from "../common/Carousel";
import Modal from "@/common/Modal";

type Stage = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  focusChips: string[];
  childLearns: string[];
  howWeTeach: string[];
  parentGets: string[];
  proofTiles: { label: string; desc: string }[];
  ctaLabel?: string;
};

const stages: Stage[] = [
  {
    id: "phonics",
    icon: "🔤",
    title: "Phonics Foundations",
    subtitle: "Sounds → letters → blending → early reading",
    focusChips: ["Letter sounds", "Blending", "CVC words", "Tricky words"],
    childLearns: [
      "Recognizes sounds clearly (not just letter names)",
      "Blends sounds to read simple words (sat, pin, tap)",
      "Builds handwriting + decoding confidence together",
    ],
    howWeTeach: [
      "Games + short drills (no long worksheets)",
      "Multi-sensory tracing + sound cues",
      "Quick correction without stopping confidence",
    ],
    parentGets: [
      "Clear “what we taught today” note",
      "Simple 3–5 minute home practice prompt",
      "Progress snapshot: what’s strong + what needs practice",
    ],
    proofTiles: [
      { label: "Skill Snapshot", desc: "Sounds/letters mastered + current focus" },
      { label: "Home Practice", desc: "One tiny practice task (3–5 mins)" },
      { label: "Teacher Note", desc: "What helped your child most today" },
      { label: "Next Steps", desc: "What’s coming next (no surprises)" },
    ],
    ctaLabel: "See a sample class flow",
  },
  {
    id: "grammar",
    icon: "🧩",
    title: "Grammar Builder",
    subtitle: "Sentence sense → correct structure → better writing",
    focusChips: ["Sentence building", "Tenses", "Punctuation", "Vocabulary"],
    childLearns: [
      "Makes clean sentences (not memorized lines)",
      "Uses correct verb forms naturally",
      "Improves writing with structure + clarity",
    ],
    howWeTeach: [
      "Story-based grammar (kids remember meaning)",
      "Tiny rules + lots of speaking practice",
      "Examples → guided → independent attempt",
    ],
    parentGets: [
      "Simple explanation of the rule taught (parent-friendly)",
      "Common mistakes to watch for (1–2 only)",
      "Stage skill summary (grammar + writing)",
    ],
    proofTiles: [
      { label: "Rule in 1 Line", desc: "What your child learned today" },
      { label: "Mistake Watch", desc: "1–2 likely errors + quick fix" },
      { label: "Practice Sheet", desc: "Short, focused practice (optional)" },
      { label: "Stage Summary", desc: "What improved + what’s next" },
    ],
    ctaLabel: "See a sample grammar activity",
  },
  {
    id: "speaking",
    icon: "🎤",
    title: "Public Speaking",
    subtitle: "Thinking → speaking → confidence → expression",
    focusChips: ["Clarity", "Fluency", "Confidence", "Stage presence"],
    childLearns: [
      "Speaks without fear of mistakes",
      "Answers in full sentences (not single words)",
      "Uses better words + expression naturally",
    ],
    howWeTeach: [
      "Warm-ups + guided speaking frames",
      "Roleplay + show & tell + storytelling",
      "Gentle coaching: clear, kind corrections",
    ],
    parentGets: [
      "Speaking topic + practice prompt for home",
      "What improved today (confidence/clarity/length)",
      "Next goal for the child (one focus at a time)",
    ],
    proofTiles: [
      { label: "Speaking Prompt", desc: "Today’s topic + easy home prompt" },
      { label: "Coach Note", desc: "What to praise + what to fix gently" },
      { label: "Word Upgrade", desc: "New words used in conversation" },
      { label: "Next Goal", desc: "One clear target for next class" },
    ],
    ctaLabel: "See a sample speaking routine",
  },
  {
    id: "confidence",
    icon: "🌟",
    title: "The Breakthrough Stage",
    subtitle: "Reading + writing + speaking… together in real life",
    focusChips: ["Independent reading", "Confident speaking", "Strong writing", "School success"],
    childLearns: [
      "Reads independently with better fluency",
      "Shares ideas confidently in school and at home",
      "Writes clearer sentences with fewer errors",
    ],
    howWeTeach: [
      "Integrated practice (phonics + grammar + speaking)",
      "Real-life tasks: reading aloud, mini presentations",
      "Ongoing feedback loops (child + parent + teacher)",
    ],
    parentGets: [
      "Parent dashboard-style insights (simple & visual)",
      "Milestone updates you can feel at home",
      "Optional advanced path (based on the child’s pace)",
    ],
    proofTiles: [
      { label: "Milestones", desc: "Visible progress checkpoints" },
      { label: "Insights", desc: "Strengths + focus areas (simple)" },
      { label: "Personal Path", desc: "Child’s pace + next best step" },
      { label: "Maintenance", desc: "Keep skills strong over time" },
    ],
  },
];

const stageAccents = [
  { glow: "shadow-[0_18px_45px_rgba(255,143,92,0.16)]", border: "from-[#ffe3d0] via-[#fff6e9] to-white", chip: "from-[#ff8f5c] to-[#ffb347]" },
  { glow: "shadow-[0_18px_45px_rgba(89,195,255,0.16)]", border: "from-[#dff3ff] via-white to-[#eafcff]", chip: "from-[#59c3ff] to-[#7ddff8]" },
  { glow: "shadow-[0_18px_45px_rgba(194,140,255,0.14)]", border: "from-[#f2e6ff] via-white to-[#ffe9f6]", chip: "from-[#c28cff] to-[#f472d0]" },
  { glow: "shadow-[0_18px_45px_rgba(52,211,153,0.14)]", border: "from-[#e8fff1] via-white to-[#fff7dd]", chip: "from-[#34d399] to-[#a3e635]" },
];

const solidPromise = [
  { letter: "S", title: "Structured", desc: "A clear path so your child never feels lost." },
  { letter: "O", title: "Outcome-led", desc: "Milestones you can see in reading, writing & speaking." },
  { letter: "L", title: "Low-pressure", desc: "Confidence-first correction—no fear of mistakes." },
  { letter: "I", title: "Interactive", desc: "Games + practice that keeps kids engaged." },
  { letter: "D", title: "Data-backed", desc: "Simple parent updates: what improved + what’s next." },
];

const StepTimeline: React.FC = () => {
  const [active, setActive] = useState(0);
  const [modal, setModal] = useState<null | "flow" | "grammar" | "speaking">(null);

  const stage = stages[active];
  const accent = stageAccents[active % stageAccents.length];

  const modalTitle = useMemo(() => {
    if (modal === "flow") return "Sample Class Flow (Phonics)";
    if (modal === "grammar") return "Sample Grammar Activity";
    if (modal === "speaking") return "Sample Speaking Routine";
    return "Details";
  }, [modal]);

  const openStageModal = () => {
    if (stage.id === "phonics") setModal("flow");
    else if (stage.id === "grammar") setModal("grammar");
    else if (stage.id === "speaking") setModal("speaking");
    else setModal("flow");
  };

  const StageSelector = () => (
    <div className="flex flex-wrap justify-center gap-2">
      {stages.map((s, i) => {
        const isActive = i === active;
        const a = stageAccents[i % stageAccents.length];
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActive(i)}
            className={[
              "group rounded-full px-4 py-2 text-sm font-semibold transition",
              isActive
                ? `bg-gradient-to-r ${a.chip} text-white shadow-lg`
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className="mr-2">{s.icon}</span>
            {s.title.replace(" Foundations", "").replace(" Builder", "")}
          </button>
        );
      })}
    </div>
  );

  const StageDetail = () => (
    <div className={`rounded-[28px] p-[1px] bg-gradient-to-br ${accent.border} ${accent.glow}`}>
      <div className="rounded-[26px] bg-white p-6 md:p-7 ring-1 ring-slate-200/60">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{stage.icon}</div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stage.title}</h3>
                <p className="mt-1 text-sm md:text-base text-slate-600">{stage.subtitle}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {stage.focusChips.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {stage.ctaLabel && (
            <button
              onClick={openStageModal}
              className="hidden md:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-700 hover:opacity-95"
            >
              {stage.ctaLabel}
            </button>
          )}
        </div>

        {/* 3 columns */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">CHILD LEARNS</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.childLearns.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[2px]">✅</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">HOW WE TEACH</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.howWeTeach.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[2px]">🧠</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">PARENTS GET</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.parentGets.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[2px]">📩</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Proof tiles */}
        <div className="mt-5">
          <div className="text-xs font-extrabold tracking-wide text-slate-700">PROOF YOU CAN SEE</div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stage.proofTiles.map((t) => (
              <div key={t.label} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 hover:shadow-sm transition">
                <div className="text-sm font-bold text-slate-900">{t.label}</div>
                <div className="mt-1 text-xs text-slate-600">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile CTA */}
        {stage.ctaLabel && (
          <button
            onClick={openStageModal}
            className="mt-6 md:hidden w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-700 hover:opacity-95"
          >
            {stage.ctaLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section data-animate="fade-up" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          </div>

          <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl text-slate-900">
            Learning Stages (Not Random Classes)
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-3xl mx-auto">
            Parents don’t need “more classes.” You need a structured path, visible milestones, and updates that make sense.
          </p>
        </div>

        {/* Stage selector */}
        <div className="mt-8">
          <StageSelector />
        </div>

        {/* Desktop detail */}
        <div className="mt-10 hidden md:block">
          <StageDetail />
        </div>

        {/* Mobile carousel */}
        <div className="mt-10 md:hidden">
          <Carousel className="-mx-2" autoRotateMs={6500}>
            {stages.map((s, i) => (
              <div key={s.id} className="px-2">
                <div className="mb-3 flex justify-center">
                  <button
                    onClick={() => setActive(i)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200"
                  >
                    <span className="mr-2">{s.icon}</span>
                    {s.title}
                  </button>
                </div>
                {/* Render detail for this slide */}
                <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-slate-100 via-white to-slate-50">
                  <div className="rounded-[26px] bg-white p-5 ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{s.subtitle}</p>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-extrabold tracking-wide text-slate-700">PARENTS GET</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {s.parentGets.map((x) => (
                            <li key={x} className="flex gap-2">
                              <span className="mt-[2px]">📩</span>
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {s.ctaLabel && (
                        <button
                          onClick={() => {
                            setActive(i);
                            openStageModal();
                          }}
                          className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-700"
                        >
                          {s.ctaLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* S.O.L.I.D. Promise */}
        <div className="mt-14">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">Our S.O.L.I.D. Promise to Parents</h3>
            <p className="mt-2 text-sm md:text-base text-slate-600">
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {solidPromise.map((p) => (
              <div key={p.letter} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:shadow-sm transition">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold">
                    {p.letter}
                  </div>
                  <div className="font-bold text-slate-900">{p.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <Modal isOpen={!!modal} onClose={() => setModal(null)}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">{modalTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use this on your website to show parents what actually happens in class (no vague promises).
            </p>

            {modal === "flow" && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">1) Warm-up (60 sec)</div>
                  <div className="text-slate-600">Quick sound recall + confidence boost.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">2) Teach (5–7 mins)</div>
                  <div className="text-slate-600">One clear sound/skill + demo.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">3) Guided Practice (8–10 mins)</div>
                  <div className="text-slate-600">Blending + reading with support.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">4) Game Practice (8–10 mins)</div>
                  <div className="text-slate-600">Kids apply the skill in a fun task.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">5) Quick Check + Parent Note (2 mins)</div>
                  <div className="text-slate-600">What improved + what to practice (3–5 mins).</div>
                </div>
              </div>
            )}

            {modal === "grammar" && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Story Hook</div>
                  <div className="text-slate-600">A tiny story where grammar appears naturally.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Rule (in 1 line)</div>
                  <div className="text-slate-600">Example → child repeats → child creates.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Mini Practice</div>
                  <div className="text-slate-600">3–5 questions only (focused, not long).</div>
                </div>
              </div>
            )}

            {modal === "speaking" && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Speaking Frame</div>
                  <div className="text-slate-600">Child gets a simple structure to speak confidently.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Guided Try</div>
                  <div className="text-slate-600">Teacher models → child tries → gentle upgrade.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-bold">Word Upgrade</div>
                  <div className="text-slate-600">2–3 better words replace basic words naturally.</div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
};

export default StepTimeline;
