import React, { useMemo, useState } from "react";
import { Carousel } from "../common/Carousel";
import Modal from "@/common/Modal";

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  focusChips: string[];
  childLearns: string[];
  howWeTeach: string[];
  parentGets: string[];
  ctaLabel?: string;
};

const stages: Stage[] = [
  {
    id: "phonics",
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
      "Short home practice prompt connected to the lesson",
      "Progress snapshot: what’s strong + what needs practice",
    ],
    ctaLabel: "See a sample class flow",
  },
  {
    id: "reading",
    title: "Reading & Fluency",
    subtitle: "Accurate reading → smoother sentences → meaning",
    focusChips: ["Accuracy", "Fluency", "Vocabulary", "Comprehension"],
    childLearns: [
      "Reads connected text with increasing accuracy and independence",
      "Builds smoother phrasing without turning reading into a speed race",
      "Explains key ideas and answers meaning-based questions",
    ],
    howWeTeach: [
      "Right-level text with live modelling and guided rereading",
      "Phrasing, vocabulary, retelling, and comprehension checks",
      "Correction that returns the child to the text instead of encouraging guessing",
    ],
    parentGets: [
      "The current reading focus: accuracy, fluency, vocabulary, or comprehension",
      "Examples of what is becoming more secure",
      "A clear next reading priority for upcoming practice",
    ],
  },
  {
    id: "grammar",
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
    ctaLabel: "See a sample grammar activity",
  },
  {
    id: "speaking",
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
    ctaLabel: "See a sample speaking routine",
  },
  {
    id: "confidence",
    title: "Integrated Practice",
    subtitle: "Reading + writing + speaking together in meaningful tasks",
    focusChips: ["Independent reading", "Clear writing", "Confident speaking", "Skill transfer"],
    childLearns: [
      "Practises reading with increasing independence",
      "Connects sentence and writing skills across activities",
      "Explains ideas in longer, more organised responses",
    ],
    howWeTeach: [
      "Integrated practice across reading, grammar, writing, and speaking",
      "Real-use tasks such as reading aloud, short writing, and mini presentations",
      "Ongoing feedback based on the child’s current focus areas",
    ],
    parentGets: [
      "Milestone updates in clear parent-friendly language",
      "Visible strengths and current focus areas",
      "A recommended next step based on the child’s progress",
    ],
  },
];

const StepTimeline: React.FC = () => {
  const [active, setActive] = useState(0);
  const [modal, setModal] = useState<null | "flow" | "grammar" | "speaking">(null);

  const stage = stages[active];

  const modalTitle = useMemo(() => {
    if (modal === "flow") return "Sample Class Flow (Phonics)";
    if (modal === "grammar") return "Sample Grammar Activity";
    if (modal === "speaking") return "Sample Speaking Routine";
    return "Details";
  }, [modal]);

  const openStageModal = (stageId = stage.id) => {
    if (stageId === "phonics") setModal("flow");
    else if (stageId === "grammar") setModal("grammar");
    else if (stageId === "speaking") setModal("speaking");
    else setModal("flow");
  };

  const StageSelector = () => (
    <div className="flex flex-wrap justify-center gap-2">
      {stages.map((s, i) => {
        const isActive = i === active;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActive(i)}
            className={[
              "group rounded-full px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-slate-950 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            {s.title.replace(" Foundations", "").replace(" Builder", "")}
          </button>
        );
      })}
    </div>
  );

  const StageDetail = () => (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{stage.title}</h3>
              <p className="mt-1 text-sm text-slate-600 md:text-base">{stage.subtitle}</p>
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
              onClick={() => openStageModal()}
              className="hidden rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:inline-flex"
            >
              {stage.ctaLabel}
            </button>
          )}
        </div>

        {/* 3 columns */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">CHILD LEARNS</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.childLearns.map((x) => (
                <li key={x} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">HOW WE TEACH</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.howWeTeach.map((x) => (
                <li key={x} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-extrabold tracking-wide text-slate-700">PARENTS GET</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {stage.parentGets.map((x) => (
                <li key={x} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile CTA */}
        {stage.ctaLabel && (
          <button
            onClick={() => openStageModal()}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 md:hidden"
          >
            {stage.ctaLabel}
          </button>
        )}
    </div>
  );

  return (
    <section data-animate="fade-up" className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Inside the learning experience</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 md:text-4xl">
            How teaching changes by skill focus
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Choose a focus to see what the child practises, how the teacher guides the skill, and what parents can see as learning progresses.
          </p>
        </div>

        {/* Desktop pathway selector. Mobile uses one card per carousel slide to avoid duplicate controls. */}
        <div className="mt-7 hidden md:block">
          <StageSelector />
        </div>

        {/* Desktop detail */}
        <div className="mt-8 hidden md:block">
          <StageDetail />
        </div>

        {/* Mobile carousel */}
        <div className="mt-8 md:hidden">
          <Carousel className="-mx-2" autoRotateMs={6500}>
            {stages.map((s, i) => (
              <div key={s.id} className="px-2">
                <div className="mb-3 flex justify-center">
                  <button
                    onClick={() => setActive(i)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-200"
                  >
                    {s.title}
                  </button>
                </div>
                {/* Render detail for this slide */}
                <div className="rounded-[22px] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{s.subtitle}</p>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="text-xs font-extrabold tracking-wide text-slate-700">CHILD PRACTISES</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {s.childLearns.slice(0, 2).map((x) => (
                            <li key={x} className="flex gap-2">
                              <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="text-xs font-extrabold tracking-wide text-slate-700">TEACHER GUIDANCE</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {s.howWeTeach.slice(0, 2).map((x) => (
                            <li key={x} className="flex gap-2">
                              <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                        <div className="text-xs font-extrabold tracking-wide text-slate-700">PARENT VISIBILITY</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {s.parentGets.slice(0, 2).map((x) => (
                            <li key={x} className="flex gap-2">
                              <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {s.ctaLabel && (
                        <button
                          onClick={() => {
                            setActive(i);
                            openStageModal(s.id);
                          }}
                          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          {s.ctaLabel}
                        </button>
                      )}
                    </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

      </div>

      {/* Modal */}
      {modal && (
        <Modal isOpen={!!modal} onClose={() => setModal(null)}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">{modalTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is a simple example of how a Tiny Steps teacher can structure live guided practice for the selected pathway.
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
                  <div className="text-slate-600">What improved + what to practise next.</div>
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
