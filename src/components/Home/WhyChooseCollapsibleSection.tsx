import React, { useMemo, useState } from "react";
import { CollapsibleCard } from "../common/CollapsibleCard";
import Button from "../Button/Button";

type WhyCard = {
  id: string;
  icon: string;
  title: string;
  subtext: string;
  gradient: string;
  headline: string;
  childGets: string[];
  parentGets: string[];
  parentBenefit: string;
  cta: string;
};

const SOLID = [
  { k: "S", title: "Structured", desc: "Clear learning path, not random classes." },
  { k: "O", title: "Outcome-led", desc: "Milestones you can see at home." },
  { k: "L", title: "Low-pressure", desc: "Confidence-first correction, no fear." },
  { k: "I", title: "Interactive", desc: "Games + practice that keeps kids engaged." },
  { k: "D", title: "Data-backed", desc: "Simple parent updates: strong + next focus." },
];

const cards: WhyCard[] = [
  {
    id: "structured-path",
    icon: "🧭",
    title: "A Clear Learning Path",
    subtext: "Phonics → Grammar → Speaking → real-life communication",
    gradient: "from-[#e4f3ff] via-white to-[#f2fbff]",
    headline: "Your child always knows what comes next — and why.",
    childGets: [
      "Step-by-step progression (sounds → words → sentences → expression)",
      "Skill-building in the right order (no gaps, no confusion)",
      "Revision loops so learning actually sticks",
      "Smooth transitions between phonics, grammar, and speaking",
    ],
    parentGets: [
      "A simple stage summary: where your child is now",
      "What we are building next (no surprises)",
      "What to do at home (3–5 minutes, optional)",
    ],
    parentBenefit: "Clarity that reduces homework fights and parent stress.",
    cta: "See the stages",
  },
  {
    id: "personalised",
    icon: "🎯",
    title: "Personalised 1:1 Teaching",
    subtext: "Paced to your child — not the batch",
    gradient: "from-[#ffe9cf] via-white to-[#fff2e1]",
    headline: "We adjust pace weekly so your child doesn’t feel “left behind.”",
    childGets: [
      "Short, focused practice (kids don’t get bored)",
      "If stuck: we slow down + reinforce the exact weak spot",
      "If fast: we move ahead without repeating endlessly",
      "Confidence rituals for shy or quiet speakers",
    ],
    parentGets: [
      "One clear note: what improved today",
      "One focus only: what to work on next",
      "No daily heavy homework expectations",
    ],
    parentBenefit: "Less nagging. More natural improvement.",
    cta: "How personalization works",
  },
  {
    id: "mentor-quality",
    icon: "👩‍🏫",
    title: "Mentor Quality & Child Psychology",
    subtext: "Gentle coaching that builds confidence",
    gradient: "from-[#fbe7ff] via-white to-[#f1edff]",
    headline: "We correct without breaking confidence — especially for young kids.",
    childGets: [
      "Kind, clear correction (no embarrassment)",
      "Speaking coaching: clarity, pace, expression",
      "Pronunciation practice that feels playful",
      "Teacher uses examples + guidance (not “just answer!”)",
    ],
    parentGets: [
      "What to praise (so confidence grows faster)",
      "What mistake to watch (only 1–2 at a time)",
      "How to support without becoming the “teacher at home”",
    ],
    parentBenefit: "Your child improves with less pressure and more pride.",
    cta: "Meet our approach",
  },
  {
    id: "progress",
    icon: "📈",
    title: "Progress You Can Actually Feel",
    subtext: "Simple updates, visible milestones",
    gradient: "from-[#eafbf1] via-white to-[#fef6e7]",
    headline: "Parents don’t need big reports — they need clear signals.",
    childGets: [
      "Milestone checks (sounds, reading, sentences, speaking)",
      "Confidence tracking (length of answers, hesitation reduction)",
      "Smart revision so weak areas don’t get hidden",
      "Small wins celebrated so motivation stays high",
    ],
    parentGets: [
      "Weekly snapshot: strong skills + current focus",
      "What changed at home: reading/speaking behavior cues",
      "Next action: a tiny optional practice prompt",
    ],
    parentBenefit: "You’ll notice improvements in daily life — not just on screen.",
    cta: "View a sample update",
  },
];

const WhyChooseCollapsibleSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const expandedIndex = useMemo(() => {
    const idx = cards.findIndex((c) => c.id === expandedId);
    return idx >= 0 ? idx : 0;
  }, [expandedId]);

  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-white to-slate-50/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm">
          </div>

          <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl text-slate-900">
            Why Choose Tiny Steps
          </h2>

          <p className="mt-2 text-base text-slate-600">
            Tap a card to see what your child gets — and what you get as a parent.
          </p>
        </div>

        {/* SOLID Promise */}
        <div className="mb-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SOLID.map((p) => (
              <div
                key={p.k}
                className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold">
                    {p.k}
                  </div>
                  <div className="font-bold text-slate-900">{p.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => {
            const isOpen = expandedId === card.id;

            return (
              <div
                key={card.id}
                className={[
                  "rounded-[28px] p-[1px] bg-gradient-to-br transition-all",
                  card.gradient,
                  isOpen ? "shadow-[0_18px_45px_rgba(15,23,42,0.10)]" : "shadow-none",
                ].join(" ")}
                role="button"
                aria-expanded={isOpen}
                onClick={() => toggleCard(card.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleCard(card.id);
                }}
                tabIndex={0}
              >
                <div
                  className={[
                    "rounded-[26px] bg-white/95 ring-1 ring-slate-200/70 transition-all",
                    isOpen ? "translate-y-[-1px] ring-slate-300" : "hover:ring-slate-300",
                  ].join(" ")}
                >
                  <CollapsibleCard
                    icon={<span aria-hidden="true">{card.icon}</span>}
                    title={card.title}
                    subtext={card.subtext}
                    className="rounded-[26px] bg-transparent ring-0 shadow-none"
                    cta={
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-slate-900 hover:text-white hover:border-slate-900"
                        onClick={(e: any) => {
                          // prevent card toggle if you later wire CTA to navigation/modal
                          e?.stopPropagation?.();
                          // TODO: wire to modal/route if needed
                        }}
                      >
                        {card.cta}
                      </Button>
                    }
                  >
                    {isOpen && (
                      <div className="pt-2">
                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="text-sm font-semibold text-slate-900">{card.headline}</div>

                          <div className="mt-3 grid gap-4">
                            <div>
                              <div className="text-xs font-extrabold tracking-wide text-slate-700">
                                WHAT YOUR CHILD GETS
                              </div>
                              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                {card.childGets.map((point) => (
                                  <li key={point} className="flex items-start gap-2">
                                    <span className="mt-[2px]">✅</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <div className="text-xs font-extrabold tracking-wide text-slate-700">
                                WHAT YOU GET AS A PARENT
                              </div>
                              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                {card.parentGets.map((point) => (
                                  <li key={point} className="flex items-start gap-2">
                                    <span className="mt-[2px]">📩</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-3 text-sm font-semibold text-slate-900">
                            {card.parentBenefit}
                          </div>
                        </div>

                        {/* subtle “stage indicator” for premium feel */}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>Card {idx + 1} of {cards.length}</span>
                          <span className="font-semibold text-slate-700">
                            {expandedIndex === idx ? "Open" : "Tap to open"}
                          </span>
                        </div>
                      </div>
                    )}
                  </CollapsibleCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseCollapsibleSection;
