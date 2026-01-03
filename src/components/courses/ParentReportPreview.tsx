// @ts-nocheck
import React, { useMemo } from "react";

type Props = {
  track?: "all" | "phonics" | "grammar" | "speaking" | string;
};

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

function Bar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const pct = clampPct(value);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs font-semibold text-slate-600">{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Pill({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70">
      <span className="text-slate-500">{k}:</span> {v}
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-slate-300" />
            <span className="leading-relaxed">{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const ParentReportPreview: React.FC<Props> = ({ track = "all" }) => {
  const model = useMemo(() => {
    const base = {
      week: "Sample week: Week 4",
      childLabel: "Your child",
      sessions: "3/3 attended",
      overall: 78,
      tag: "Parent Insights",
      title: "Sample Weekly Progress Card",
      subtitle:
        "A simple, parent-friendly snapshot — what improved, what needs practice, and what’s next.",
      bars: [
        { label: "Consistency", value: 82, hint: "Attended + practiced on most days" },
        { label: "Understanding", value: 76, hint: "Correct answers + concept clarity" },
        { label: "Confidence", value: 74, hint: "Less hesitation, more independence" },
      ],
      covered: ["Clear weekly learning summary", "Practice plan (2–5 mins/day)", "Teacher notes + next steps"],
      wins: ["More focus during class", "Better follow-through at home", "Small improvements week-on-week"],
      focus: ["One key gap highlighted (so practice stays simple)", "A short next-week goal set"],
      next: ["Continue the same schedule", "Daily micro-practice", "Review progress next week"],
      practice: ["2 minutes: quick revision", "2 minutes: one focused skill", "1 minute: confidence booster"],
    };

    if (track === "phonics") {
      return {
        ...base,
        tag: "Phonics Insights",
        week: "Sample week: Week 4 (Phonics)",
        overall: 72,
        bars: [
          { label: "Letter sounds", value: 74, hint: "18/26 sounds steady + 2 confusing pairs noted" },
          { label: "Blending", value: 69, hint: "CVC reading improving (sat → pin → tap)" },
          { label: "Decodable reading", value: 62, hint: "Reads short phrases with help" },
        ],
        covered: [
          "SATPIN revision + 3 new CVC words",
          "CK rule (back, neck, sock)",
          "2 short decodable sentences (guided)",
        ],
        wins: [
          "Blended 7/10 CVC words without help",
          "Better start points while tracing (a, s)",
          "Less guessing — more sounding out",
        ],
        focus: [
          "Sometimes confuses /p/ and /b/",
          "Needs slower blending for longer words",
        ],
        next: [
          "Add 2 new sounds + 5 practice words",
          "1 decodable page reading",
          "Home practice: 5 mins/day (sound cards + 5 words)",
        ],
        practice: [
          "2 mins: sound flash (5 cards)",
          "2 mins: read 5 CVC words",
          "1 min: one sentence read aloud",
        ],
      };
    }

    if (track === "grammar") {
      return {
        ...base,
        tag: "Grammar Insights",
        week: "Sample week: Week 4 (Grammar)",
        overall: 81,
        bars: [
          { label: "Concept clarity", value: 84, hint: "Understands nouns/verbs in sentences" },
          { label: "Sentence building", value: 78, hint: "Stronger subject–verb matching" },
          { label: "Accuracy", value: 74, hint: "Fewer mistakes after correction" },
        ],
        covered: [
          "Nouns vs verbs (spot + sort)",
          "Make 5 sentences using picture prompts",
          "Punctuation: full stop + question mark",
        ],
        wins: [
          "Used verbs correctly in 4/5 sentences",
          "Less confusion in “is/are” usage",
          "Explained answers in simple words",
        ],
        focus: [
          "Sometimes misses capital letters at sentence start",
          "Needs practice with questions (what/where/when)",
        ],
        next: [
          "Introduce adjectives (describing words)",
          "Sentence expansion (add 2 details)",
          "Home practice: 1 mini worksheet + 1 game",
        ],
        practice: [
          "2 mins: fix 3 sentences",
          "2 mins: make 2 new sentences",
          "1 min: read aloud + punctuation pause",
        ],
      };
    }

    if (track === "speaking") {
      return {
        ...base,
        tag: "Speaking Insights",
        week: "Sample week: Week 4 (Public Speaking)",
        overall: 76,
        bars: [
          { label: "Clarity", value: 72, hint: "Pronunciation + pacing improving" },
          { label: "Structure", value: 68, hint: "Beginning → middle → end attempts" },
          { label: "Confidence", value: 80, hint: "More eye contact + stronger voice" },
        ],
        covered: [
          "Show & Tell (30–45 seconds)",
          "Voice: loud/soft control + pauses",
          "Vocabulary upgrade: 5 better words",
        ],
        wins: [
          "Spoke without stopping 2 times",
          "Better posture + eye contact",
          "Used 2 new words naturally",
        ],
        focus: [
          "Needs slower pace (less rushing)",
          "Add one descriptive detail in every talk",
        ],
        next: [
          "1-minute story: hook → 2 details → close",
          "Question practice (answer in 2 lines)",
          "Home practice: 5 mins/day — record & replay once",
        ],
        practice: [
          "2 mins: read a small passage aloud",
          "2 mins: 4-line talk with pauses",
          "1 min: record + replay once",
        ],
      };
    }

    return base;
  }, [track]);

  return (
    <div className="rounded-3xl bg-white/80 p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {model.tag}
          </div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {model.title}
          </div>
          <div className="mt-1 text-sm text-slate-600">{model.subtitle}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill k="Week" v={model.week.replace("Sample week: ", "")} />
            <Pill k="Sessions" v={model.sessions} />
            <Pill k="Overall" v={`${model.overall}%`} />
          </div>
        </div>

        <div className="mt-2 w-max rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700">
          Sample Preview
        </div>
      </div>

      {/* Overall progress */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Overall progress</div>
          <div className="text-xs font-semibold text-slate-600">{clampPct(model.overall)}%</div>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
            style={{ width: `${clampPct(model.overall)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          This is a mock preview of the parent dashboard report format we’re building.
        </div>
      </div>

      {/* Skill bars */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {model.bars.map((b, i) => (
          <Bar key={i} label={b.label} value={b.value} hint={b.hint} />
        ))}
      </div>

      {/* Sections */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Section title="What we covered" items={model.covered} />
        <Section title="Wins this week" items={model.wins} />
        <Section title="Focus areas" items={model.focus} />
        <Section title="Next week plan" items={model.next} />
      </div>

      {/* Home practice */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Home practice (5 mins/day)</div>
          <div className="text-xs font-semibold text-slate-600">Simple • doable • consistent</div>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {model.practice.map((p, i) => (
            <div key={i} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/60">
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 text-xs text-slate-500">
        Note: This is a preview card — the full report will appear inside the parent dashboard after enrollment.
      </div>
    </div>
  );
};

export default ParentReportPreview;
