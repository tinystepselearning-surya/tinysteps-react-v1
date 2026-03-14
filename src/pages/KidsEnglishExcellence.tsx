// src/pages/KidsEnglishExcellence.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TinyStepsBrand from "../components/common/TinyStepsBrand";
import MagicBento from "../components/common/MagicBento";
import LiquidEther from "../components/components/LiquidEther";
import {
  BBS_STAGE_1A,
  BBS_STAGE_1B,
  BBS_STAGE_1C,
  BBS_STAGE_1D,
  loadBbsProgress,
} from "./kids/games/grammar/buildBetterSentencesProgress";
import {
  GF_STAGE_2A,
  GF_STAGE_2B,
  GF_STAGE_2C,
  GF_STAGE_2D,
  loadGrammarFixProgress,
} from "./kids/games/grammar/grammarFixProgress";
import { CB_STAGE_3A, CB_STAGE_3B, CB_STAGE_3C, loadCollocationBuilderProgress } from "./kids/games/grammar/collocationBuilderProgress";

// ============================================================================
// CLEAN PPT-STYLE JOURNEY (Compact + Professional)
// ============================================================================

type JourneyCategory = "phonics" | "grammar" | "speaking" | "breakthrough";

type JourneyStop = {
  key: string; // "S1"
  title: string;
  category: JourneyCategory;
};

const JOURNEY_STOPS: JourneyStop[] = [
  { key: "S1", title: "Pre-Writing Skills (Tracing)", category: "phonics" },
  { key: "S2", title: "Letter–Sound Correspondence & Letter Formation", category: "phonics" },
  { key: "S3", title: "Blending & Word Families", category: "phonics" },
  { key: "S4", title: "Sentence Reading (Decoding & Fluency)", category: "phonics" },
  { key: "S5", title: "Sentence Writing (Handwriting & Punctuation)", category: "grammar" },
  { key: "S6", title: "Spelling Patterns & Phonics Rules", category: "grammar" },
  { key: "S7", title: "Grammar & Vocabulary", category: "speaking" },
  { key: "S8", title: "Confident Speaking (No Stage Fright)", category: "breakthrough" },
];

const CATEGORY_META: Record<
  JourneyCategory,
  { label: string; pillClass: string; dot: string }
> = {
  phonics: {
    label: "Phonics",
    pillClass: "bg-orange-50 text-orange-800 border-orange-200",
    dot: "#F59E0B",
  },
  grammar: {
    label: "Grammar",
    pillClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "#10B981",
  },
  speaking: {
    label: "Speaking",
    pillClass: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "#8B5CF6",
  },
  breakthrough: {
    label: "Breakthrough",
    pillClass: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "#F59E0B",
  },
};

function JourneyRoadHorizontal({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const n = JOURNEY_STOPS.length;

  // SVG layout (SpellBee style)
  const W = 1100;
  const H = 300;
  const roadY = 150;
  const x0 = 55;
  const x1 = W - 55;

  const xs = JOURNEY_STOPS.map((_, i) =>
    n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1)
  );

  const isTop = (i: number) => i % 2 === 0; // alternate label/pin top-bottom

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 via-indigo-50 to-cyan-50 p-3 shadow-sm">
      <style>{`
  /* remove browser focus rectangle on SVG groups */
  svg g[role="button"]:focus,
  svg g[role="button"]:focus-visible { outline: none; }

  /* gentle floating animation for pins */
  @keyframes tsPinFloat {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
`}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[260px] w-full"
        aria-label="Tiny Steps learning journey roadmap"
        role="img"
      >
        <defs>
          <filter id="tsGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Road */}
        <rect
          x={x0}
          y={roadY - 18}
          width={x1 - x0}
          height={36}
          rx={18}
          fill="#111827"
          opacity={0.92}
        />
        {/* Center dashed line */}
        <line
          x1={x0 + 18}
          y1={roadY}
          x2={x1 - 18}
          y2={roadY}
          stroke="white"
          strokeWidth={4}
          strokeDasharray="10 12"
          opacity={0.9}
        />

        {/* Pins + Labels */}
        {JOURNEY_STOPS.map((s, i) => {
          const x = xs[i];
          const top = isTop(i);
          const active = s.key === activeKey;
          const c = CATEGORY_META[s.category].dot;

          const triH = 28;
          const triW = 28;

          const circleR = 26;
          const circleCy = top ? roadY - (triH + circleR + 6) : roadY + (triH + circleR + 6);
          const triTipY = top ? roadY - 18 : roadY + 18;

          const triBaseY = top ? triTipY - triH : triTipY + triH;

          const labelY = top ? 56 : H - 18;

          return (
            <g
              key={s.key}
              tabIndex={0}
              role="button"
              aria-label={`${s.key} ${s.title}`}
              onClick={() => onSelect(s.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(s.key);
              }}
              className="tsPin"
              style={{
                cursor: "pointer",
                outline: "none",
                animation: "tsPinFloat 3.2s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* triangle pointer */}
              <polygon
                points={
                  top
                    ? `${x},${triTipY} ${x - triW / 2},${triBaseY} ${x + triW / 2},${triBaseY}`
                    : `${x},${triTipY} ${x - triW / 2},${triBaseY} ${x + triW / 2},${triBaseY}`
                }
                fill={c}
                opacity={0.95}
                filter={active ? "url(#tsGlow)" : undefined}
              />

              {/* glow halo (animated) */}
              <circle cx={x} cy={circleCy} r={circleR + 10} fill={c} opacity={0.12}>
                <animate attributeName="opacity" values="0.10;0.28;0.10" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${circleR + 8};${circleR + 13};${circleR + 8}`} dur="2.6s" repeatCount="indefinite" />
              </circle>

              {/* circle */}
              <circle
                cx={x}
                cy={circleCy}
                r={circleR}
                fill="white"
                stroke={active ? c : "#CBD5E1"}
                strokeWidth={active ? 4 : 2}
                filter={active ? "url(#tsGlow)" : undefined}
              />
              <text
                x={x}
                y={circleCy + 6}
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill={active ? "#0F172A" : "#334155"}
              >
                {s.key}
              </text>

              {/* label (wrap S2) */}
              {(() => {
                const labelLines =
                  s.key === "S2"
                    ? ["Letter–Sound Correspondence", "& Letter Formation"]
                    : [s.title];

                const labelStartY = top ? 56 : labelLines.length > 1 ? H - 40 : H - 18;

                return (
                  <text
                    x={x}
                    y={labelStartY}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill="#0F172A"
                  >
                    {labelLines.map((line, idx) => (
                      <tspan key={`${s.key}-${idx}`} x={x} dy={idx === 0 ? 0 : 18}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

    </div>
  );
}

export function LearningJourneyRoadmapPPT() {
  const [activeKey, setActiveKey] = useState<string>("S1");

  const toRoman = (n: number) =>
    ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n);

  const active = useMemo(
    () => {
      // Find stop by key (which is "S1", "S2", etc.)
      // We need journey details so create them dynamically
      const journeyDetails: Record<string, any> = {
        S1: {
          key: "S1",
          title: "Pre-Writing Skills (Tracing)",
          category: "phonics",
          childCanDo: ["Hold pencil like a pro", "Trace big curves", "Keep lines neat"],
          nextMilestone: "Write first letters with correct formation",
          teacherFocus: ["Grip strength", "Line control", "Confidence building"],
          homePractice: "Trace shapes in sand or on paper for 5 minutes",
          parentUpdateExample: "Your child's grip is getting stronger! Try tracing shapes at home.",
        },
        S2: {
          key: "S2",
          title: "Letter–Sound Correspondence & Letter Formation",
          category: "phonics",
          childCanDo: ["Say 26 letter sounds", "Form letters correctly", "Say sounds in order"],
          nextMilestone: "Blend 2-3 sounds into words",
          teacherFocus: ["Sound accuracy", "Letter formation", "Muscle memory"],
          homePractice: "Point to letters and say their sounds (not names)",
          parentUpdateExample: "Perfect sound practice! Your child knows 15/26 sounds now.",
        },
        S3: {
          key: "S3",
          title: "Blending & Word Families",
          category: "phonics",
          childCanDo: ["Blend sounds into words", "Read CVC words", "Spell 3-letter words"],
          nextMilestone: "Read simple sentences smoothly",
          teacherFocus: ["Blending fluency", "Word family patterns", "Spelling sounds"],
          homePractice: "Read 5 simple CVC words together and spell them",
          parentUpdateExample: "Blending click! Your child read 'cat', 'sit', 'dog' perfectly.",
        },
        S4: {
          key: "S4",
          title: "Sentence Reading (Decoding & Fluency)",
          category: "phonics",
          childCanDo: ["Decode sentences", "Pause at periods", "Answer simple questions"],
          nextMilestone: "Write simple sentences independently",
          teacherFocus: ["Fluency building", "Comprehension", "Punctuation awareness"],
          homePractice: "Read a 3-sentence story and ask 'What happened?'",
          parentUpdateExample: "Reading breakthrough! Your child read a full sentence today.",
        },
        S5: {
          key: "S5",
          title: "Sentence Writing (Handwriting & Punctuation)",
          category: "grammar",
          childCanDo: ["Write full sentences", "Use capitals correctly", "Add periods"],
          nextMilestone: "Spell common words without help",
          teacherFocus: ["Sentence structure", "Punctuation rules", "Speed + accuracy"],
          homePractice: "Write 3 sentences about their day",
          parentUpdateExample: "Writing is flowing! Your child wrote 'The cat sat on the mat.' perfectly.",
        },
        S6: {
          key: "S6",
          title: "Spelling Patterns & Phonics Rules",
          category: "grammar",
          childCanDo: ["Apply magic-e rule", "Use vowel teams", "Spell pattern words"],
          nextMilestone: "Spell multisyllabic words",
          teacherFocus: ["Pattern recognition", "Rule application", "Word structure"],
          homePractice: "Find words with 'ai' or 'ee' sounds in books",
          parentUpdateExample: "Pattern master! Your child spelled 'make', 'tree', 'rain' correctly.",
        },
        S7: {
          key: "S7",
          title: "Grammar + Vocabulary",
          category: "speaking",
          childCanDo: ["Use correct tenses", "Build complex sentences", "Use varied vocabulary"],
          nextMilestone: "Write short paragraphs with multiple sentences",
          teacherFocus: ["Grammar rules", "Vocabulary expansion", "Sentence variety"],
          homePractice: "Write sentences using 'before', 'after', 'because'",
          parentUpdateExample: "Grammar growth! Your child used past tense correctly in stories.",
        },
        S8: {
          key: "S8",
          title: "Confident Speaking (No Stage Fright)",
          category: "breakthrough",
          childCanDo: ["Speak on stage", "Handle any topic", "Speak with confidence"],
          nextMilestone: "Present ideas to large groups",
          teacherFocus: ["Speaking confidence", "Presentation skills", "Handling nervousness"],
          homePractice: "Practice 1-minute talks on fun topics",
          parentUpdateExample: "Speaking star! Your child presented without nervousness today.",
        },
      };
      return journeyDetails[activeKey] || journeyDetails["S1"];
    },
    [activeKey]
  );

  return (
    <section
      id="journey-roadmap"
      style={{
        borderRadius: 26,
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 18px 50px rgba(2,6,23,0.08)",
        overflow: "hidden",
        marginBottom: 18,
        background:
          "linear-gradient(180deg, rgba(255,247,237,0.96) 0%, rgba(240,249,255,0.92) 100%)",
      }}
    >
      {/* Clean header (no big orange block) */}
      <div style={{ padding: "18px 18px 12px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ fontSize: 30, fontWeight: 950, color: "#0f172a" }}>
            The Journey
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: "#334155", lineHeight: 1.45 }}>
            <strong>Tracing → Reading → Writing → Confident Speaking</strong> — tiny wins,
            guided practice, and confidence (no pressure, no stage fright).
          </div>
        </div>
      </div>

      <div style={{ padding: "0 18px 18px" }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
          }}
        >
          {/* LEFT: Horizontal Road */}
          <JourneyRoadHorizontal activeKey={activeKey} onSelect={setActiveKey} />

          {/* BOTTOM: Power Tiles */}
          <div
            style={{
              borderRadius: 22,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              padding: 14,
              boxShadow: "0 14px 30px rgba(2,6,23,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 950, fontSize: 18, color: "#0f172a" }}>
                {(() => {
                  const stageNum = Number(String(active.key).replace("S", "")) || 1;
                  const stageRoman = toRoman(stageNum);
                  return `Stage ${stageRoman}`;
                })()}
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${CATEGORY_META[active.category as JourneyCategory].pillClass}`}
              >
                {CATEGORY_META[active.category as JourneyCategory].label}
              </div>
            </div>

            <div style={{ marginTop: 8, fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
              {active.title}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {/* Power tiles grid */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Child Can Do */}
                <div
                  style={{
                    borderRadius: 18,
                    padding: "12px 12px",
                    border: "1px solid rgba(15,23,42,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,247,237,0.90) 100%)",
                    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div style={{ fontWeight: 950, fontSize: 13, color: "#0f172a" }}>Child Can Do</div>
                  </div>
                  <ul style={{ margin: "8px 0 0 18px", padding: 0, color: "#334155", fontSize: 12.8, lineHeight: 1.35 }}>
                    {active.childCanDo.slice(0, 3).map((x: string) => (
                      <li key={x} style={{ marginBottom: 6 }}>{x}</li>
                    ))}
                  </ul>
                </div>

                {/* Next Milestone */}
                <div
                  style={{
                    borderRadius: 18,
                    padding: "12px 12px",
                    border: "1px solid rgba(15,23,42,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(219,234,254,0.75) 100%)",
                    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎯</span>
                    <div style={{ fontWeight: 950, fontSize: 13, color: "#0f172a" }}>Next Milestone</div>
                  </div>
                  <div style={{ marginTop: 10, color: "#334155", fontSize: 13, lineHeight: 1.4, fontWeight: 800 }}>
                    {active.nextMilestone}
                  </div>
                </div>

                {/* Teacher Focus */}
                <div
                  style={{
                    borderRadius: 18,
                    padding: "12px 12px",
                    border: "1px solid rgba(15,23,42,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.75) 100%)",
                    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧑‍🏫</span>
                    <div style={{ fontWeight: 950, fontSize: 13, color: "#0f172a" }}>Teacher Focus</div>
                  </div>
                  <ul style={{ margin: "8px 0 0 18px", padding: 0, color: "#334155", fontSize: 12.8, lineHeight: 1.35 }}>
                    {active.teacherFocus.slice(0, 3).map((x: string) => (
                      <li key={x} style={{ marginBottom: 6 }}>{x}</li>
                    ))}
                  </ul>
                </div>

                {/* 5-min practice */}
                <div
                  style={{
                    borderRadius: 18,
                    padding: "12px 12px",
                    border: "1px solid rgba(15,23,42,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(254,249,195,0.68) 100%)",
                    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏠</span>
                    <div style={{ fontWeight: 950, fontSize: 13, color: "#0f172a" }}>5-min Home Practice</div>
                  </div>
                  <div style={{ marginTop: 10, color: "#334155", fontSize: 12.8, lineHeight: 1.4 }}>
                    {active.homePractice}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Galaxy + Planet animations */}
        <style>
          {`
  /* ---------- Sky layer ---------- */
  .ts-sky{
    position:absolute; inset:0; pointer-events:none; overflow:hidden;
    background:
      radial-gradient(circle at 20% 18%, rgba(255,255,255,0.65) 0 1px, transparent 2px),
      radial-gradient(circle at 62% 26%, rgba(255,255,255,0.45) 0 1px, transparent 2px),
      radial-gradient(circle at 78% 14%, rgba(255,255,255,0.55) 0 1px, transparent 2px),
      radial-gradient(circle at 48% 40%, rgba(255,255,255,0.35) 0 1px, transparent 2px);
    opacity:0.55;
  }

  .ts-sunFar{
    position:absolute; left:18px; top:18px;
    width:88px; height:88px; border-radius:999px;
    background: radial-gradient(circle at 35% 35%, #fff7ed 0%, #fdba74 40%, #f97316 78%, rgba(249,115,22,0) 100%);
    opacity:0.85;
    filter: blur(0.4px);
  }

  .ts-sunRaysFar{
    position:absolute; left:-22px; top:-18px;
    width:220px; height:220px; border-radius:999px;
    background: repeating-conic-gradient(from 220deg, rgba(249,115,22,0.12) 0deg 10deg, rgba(249,115,22,0) 10deg 22deg);
    mask-image: radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 68%);
    opacity:0.35;
  }

  /* ---------- Stage buttons ---------- */
  .ts-stageRow{
    position:relative;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    justify-content:flex-start;
    padding:8px 6px 12px;
    z-index:2;
  }
  .ts-stageBtn{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:10px 14px;
    border-radius:999px;
    border:1px solid rgba(15,23,42,0.12);
    background: rgba(255,255,255,0.70);
    color:#0f172a;
    font-weight:900;
    font-size:13px;
    box-shadow: 0 10px 22px rgba(2,6,23,0.08);
    cursor:pointer;
    transition: transform 140ms ease, box-shadow 140ms ease;
    white-space:nowrap;
  }
  .ts-stageBtn:hover{ transform: translateY(-1px); box-shadow: 0 14px 26px rgba(2,6,23,0.12); }
  .ts-stageBtn.isActive{
    border-color: rgba(249,115,22,0.35);
    background: linear-gradient(90deg, rgba(249,115,22,0.14), rgba(59,130,246,0.12), rgba(168,85,247,0.12));
  }
  .ts-stageIcon{ font-size:16px; line-height:1; }

  /* ---------- Planet pins ---------- */
  @keyframes tsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes tsFloat { 0%{ transform: translate(-50%,-50%) translateY(0px);} 50%{ transform: translate(-50%,-50%) translateY(-6px);} 100%{ transform: translate(-50%,-50%) translateY(0px);} }
  @keyframes tsPulse { 0%{ opacity:0.35;} 50%{ opacity:0.65;} 100%{ opacity:0.35;} }

  .ts-planet{
    width:58px;
    height:58px;
    border-radius:999px;
    border:2px solid rgba(15,23,42,0.38);
    background: rgba(255,255,255,0.78);
    box-shadow: 0 16px 32px rgba(2,6,23,0.16);
    cursor:pointer;
    position:relative;
    overflow:hidden;
  }
  .ts-planetOrb{
    position:absolute;
    inset:6px;
    border-radius:999px;
    background:
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92) 0%, color-mix(in srgb, var(--p) 72%, white 28%) 42%, var(--p) 78%),
      radial-gradient(circle at 70% 80%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%);
    animation: tsSpin 6.5s linear infinite;
    animation-delay: var(--d);
  }
  .ts-planetRing{
    position:absolute;
    inset:-8px;
    border-radius:999px;
    border:2px solid rgba(255,255,255,0.22);
    transform: rotate(22deg);
    animation: tsSpin 10s linear infinite reverse;
    animation-delay: var(--d);
  }
  .ts-planetGlow{
    position:absolute;
    inset:-18px;
    border-radius:999px;
    background: radial-gradient(circle, color-mix(in srgb, var(--p) 42%, transparent 58%) 0%, transparent 68%);
    opacity:0.35;
    animation: tsPulse 2.6s ease-in-out infinite;
  }
  .ts-planetLabel{
    position:absolute;
    inset:0;
    display:grid;
    place-items:center;
    font-weight:950;
    color:#0f172a;
    letter-spacing:0.2px;
  }
  .ts-planet.isActive{
    border:3px solid color-mix(in srgb, var(--p) 75%, white 25%);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--p) 26%, rgba(2,6,23,0.14) 74%);
    transform: scale(1.06);
  }

  /* ---------- Responsive layout ---------- */
  @media (max-width: 980px) {
    #journey-roadmap > div:nth-child(3) > div { grid-template-columns: 1fr !important; }
    .ts-stageRow { justify-content:center; }
  }
          `}
        </style>
      </div>
    </section>
  );
}

// ============================================================================
// TYPES
// ============================================================================

type Tile = {
  gameId: string; // explicit stable ID (e.g., "eem-g01-hear-and-spell")
  gameTitle: string; // display title
  moduleId: string; // module ID (e.g., "eem-m01-sound-spelling-foundations")
  gameOrder: number; // order within stage (1-indexed)
  title?: string; // placeholder skeleton alias for future UI readers
  description?: string; // placeholder skeleton alias for future UI readers
  order?: number; // placeholder skeleton alias for future UI readers
  unlockAfterGameId?: string; // explicit progression dependency
  sampleItems?: Array<{
    itemId: string;
    stageId: string;
    activityType:
      | "reorder"
      | "fillBlank"
      | "chooseBest"
      | "errorSpot"
      | "errorFix"
      | "matchPairs"
      | "contextChoice";
    prompt: unknown;
    answer: unknown;
    options?: string[];
  }>;
  stages?: Array<{
    stageId: string;
    title: string;
    skillFocus: string;
    difficulty: "easy" | "medium" | "hard";
    activityType:
      | "reorder"
      | "fillBlank"
      | "chooseBest"
      | "errorSpot"
      | "errorFix"
      | "matchPairs"
      | "contextChoice";
    masteryTarget: {
      accuracyPct: number;
      maxHints: number;
    };
    hintMode: "guided" | "standard" | "minimal";
    promptShape: string;
    answerShape: string;
    supportsHints: boolean;
    supportsAudio: boolean;
    maxOptions: number;
    minItemsRecommended: number;
  }>;
  desc: string;
  route?: string;
  comingSoon?: boolean;
  /** Game status label: 'live' (actively playable), 'legacyLive' (older version still playable), 'ready' (functional but not prioritized), 'comingSoon' (planned, not yet implemented), 'replaced' (superseded but both exist), 'hidden' (intentionally removed) */
  status?: 'live' | 'legacyLive' | 'ready' | 'comingSoon' | 'replaced' | 'hidden';
  /** If non-null, indicates this game was replaced by the referenced gameId */
  supersededBy?: string;
  roundIds?: string[]; // placeholder for future round data
};

type Stage = {
  stageId: string; // explicit stable ID (e.g., "eem-stage-1-letters-sounds")
  stageNumber: number;
  stageTitle: string;
  stageOrder: number;
  tiles: Tile[];
};

type TileStatus = "not_started" | "in_progress" | "completed";

type TileProgress = {
  status: TileStatus;
  opens: number;
  firstOpenedAt?: number;
  lastOpenedAt?: number;
  completedAt?: number;
};

type ProgressStore = {
  v: 1;
  tiles: Record<string, TileProgress>; // keyed by gameId
};

// ============================================================================
// MISSION CONFIG
// ============================================================================

const MISSION_ID = "english-excellence-mission-v2";
const ALWAYS_OPEN_STAGE_IDS = new Set<string>([
  "eem-stage-1-letters-sounds",
  "eem-stage-2-build-words",
]);

const ACTIVITY_CONTENT_CONTRACTS = {
  reorder: {
    promptShape: "tokenList",
    answerShape: "orderedSentence",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 0,
    minItemsRecommended: 8,
  },
  fillBlank: {
    promptShape: "sentenceWithBlank",
    answerShape: "singleTokenOrPhrase",
    supportsHints: true,
    supportsAudio: true,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
  chooseBest: {
    promptShape: "sentenceOptions",
    answerShape: "optionIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
  errorSpot: {
    promptShape: "singleSentence",
    answerShape: "errorTokenOrIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 0,
    minItemsRecommended: 8,
  },
  errorFix: {
    promptShape: "singleSentenceWithError",
    answerShape: "correctedSentence",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 0,
    minItemsRecommended: 8,
  },
  matchPairs: {
    promptShape: "pairColumns",
    answerShape: "pairedMatches",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 8,
    minItemsRecommended: 8,
  },
  contextChoice: {
    promptShape: "scenarioWithOptions",
    answerShape: "optionIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
} as const;

// ============================================================================
// STAGES (mapped to existing routes you already have)
// ============================================================================
// STAGES (with frozen stageId, gameId, moduleId)
// ============================================================================

const STAGES: Stage[] = [
  {
    stageId: "eem-stage-1-letters-sounds",
    stageNumber: 1,
    stageTitle: "Letters & Sounds",
    stageOrder: 1,
    tiles: [
      { gameId: "eem-g00-letter-tracing", gameTitle: "Letter Tracing", moduleId: "eem-m00-pre-writing-tracing", gameOrder: 0, desc: "trace letter shapes smoothly", route: "/kids/games/phonics/letter-tracing", status: 'live' },
      { gameId: "eem-g00b-letter-tracing-sounds", gameTitle: "Letter Tracing + Sounds", moduleId: "eem-m00-pre-writing-tracing", gameOrder: 1, desc: "trace while hearing letter sounds", route: "/kids/games/phonics/letter-tracing-sounds", status: 'live' },
      { gameId: "eem-g04-letter-sounds", gameTitle: "Letter Sounds", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 2, desc: "letter → sound match", route: "/kids/games/phonics/letter-sound", status: 'live' },
      { gameId: "eem-g04b-balloon-pop", gameTitle: "Balloon Pop", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 3, desc: "pop balloons with the correct sound", route: "/kids/games/phonics/balloon-pop", status: 'live' },
      { gameId: "eem-g05-sound-listening", gameTitle: "Sound Listening", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 4, desc: "listen and tap the correct picture", route: "/kids/games/phonics/sound-detective", status: 'live' },
    ],
  },
  {
    stageId: "eem-stage-2-build-words",
    stageNumber: 2,
    stageTitle: "Build Words",
    stageOrder: 2,
    tiles: [
      { gameId: "eem-g06-blend-2-sounds", gameTitle: "Blend 2 Sounds", moduleId: "eem-m02-blending-foundations", gameOrder: 1, desc: "combine two sounds into words", route: "/kids/games/phonics/my-first-words?level=1", status: 'live' },
      { gameId: "eem-g06b-more-blending", gameTitle: "More Blending", moduleId: "eem-m02-blending-foundations", gameOrder: 2, desc: "blend three sounds and more", route: "/kids/games/phonics/my-first-words?level=2", status: 'live' },
      { gameId: "eem-g08b-read-tiny-words", gameTitle: "Read Tiny Words", moduleId: "eem-m03-cvc-blending", gameOrder: 3, desc: "read 3-letter CVC words", route: "/kids/games/phonics/cvc-word-reader", status: 'live' },
      { gameId: "eem-g09-word-families", gameTitle: "Word Families", moduleId: "eem-m04-suffixes-word-families", gameOrder: 4, desc: "make-a-word (rimes)", route: "/kids/games/phonics/cvc-word-reader/make-a-word", status: 'live' },
      { gameId: "eem-g10-spelling-practice", gameTitle: "Spelling Practice", moduleId: "eem-m05-spelling-pattern-application", gameOrder: 5, desc: "hear → spell", route: "/kids/games/phonics/spelling-practice", status: 'live' },
    ],
  },
  {
    stageId: "eem-stage-3-make-sentences",
    stageNumber: 3,
    stageTitle: "Make Sentences",
    stageOrder: 3,
    tiles: [
      { gameId: "eem-g12-read-sentences", gameTitle: "Read Sentences", moduleId: "eem-m06-sentence-order-context", gameOrder: 1, desc: "tap words in order to read decodable sentences", route: "/kids/games/phonics/sentence-stepper?pack=4.0&eemTile=read_sentences&eemStage=3", status: 'live' },
      { gameId: "eem-g12b-early-reader-fluency", gameTitle: "Early Reader Fluency", moduleId: "eem-m06-sentence-order-context", gameOrder: 2, desc: "read sentences with increasing fluency", route: "/kids/games/phonics/sentence-stepper?pack=4.3&eemTile=early_reader_fluency&eemStage=3", status: 'live' },
      { gameId: "eem-g13-fill-the-blank", gameTitle: "Sentence Builder", moduleId: "eem-m06-sentence-order-context", gameOrder: 3, desc: "put words in order to build sentences", route: "/kids/games/phonics/sentence-stepper?pack=4.2&eemStage=3", status: 'live' },
    ],
  },
  {
    stageId: "eem-stage-4-read-understand",
    stageNumber: 4,
    stageTitle: "Fluent Reading",
    stageOrder: 4,
    tiles: [
      { gameId: "eem-g18-fluent-reading", gameTitle: "Fluent Reading", moduleId: "eem-m09-story-reading", gameOrder: 1, desc: "read passages fluently with expression", route: "/kids/games/reading/story-reading", status: 'live' },
      { gameId: "eem-g18b-story-reading", gameTitle: "Story Reading", moduleId: "eem-m09-story-reading", gameOrder: 2, desc: "read and explore short stories", route: "/kids/games/reading/story-reading", status: 'live' },
      { gameId: "eem-g19-comprehension-questions", gameTitle: "Comprehension Questions", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 3, desc: "who/what/where/why questions", route: "/kids/games/reading/comprehension", status: 'live' },
      { gameId: "eem-g20-new-words-from-reading", gameTitle: "New Words from Reading", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 4, desc: "discover vocabulary in context", route: "/kids/games/reading/new-words", status: 'live' },
      { gameId: "eem-g20b-summarize-simply", gameTitle: "Summarize Simply", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 5, desc: "write simple summaries of stories", route: "/kids/games/reading/new-words", status: 'live' },
      { gameId: "eem-g21-meaning-from-context", gameTitle: "Meaning from Context", moduleId: "eem-m11-context-meaning-relations", gameOrder: 6, desc: "figure out word meaning", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g22-synonym-antonym-hunt", gameTitle: "Synonym & Antonym Hunt", moduleId: "eem-m11-context-meaning-relations", gameOrder: 7, desc: "find similar/opposite words", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g23-crossword-from-reading", gameTitle: "Crossword from Reading", moduleId: "eem-m12-reading-crossword-recall", gameOrder: 8, desc: "puzzle based on passage", comingSoon: true, status: 'comingSoon' },
    ],
  },
  {
    stageId: "eem-stage-5-grammar-practice",
    stageNumber: 5,
    stageTitle: "Grammar Practice",
    stageOrder: 5,
    tiles: [
      {
        gameId: "eem-g15-better-sentences",
        gameTitle: "Build Better Sentences",
        title: "Build Better Sentences",
        moduleId: "eem-m07-grammar-correctness",
        gameOrder: 1,
        order: 1,
        desc: "build and improve clear, meaningful sentences",
        description: "build and improve clear, meaningful sentences",
        route: "/kids/games/grammar/build-better-sentences",
        status: 'live',
        sampleItems: [
          {
            itemId: "gps-sample-01",
            stageId: "gps-1a-reorder-words",
            activityType: "reorder",
            prompt: ["is", "The cat", "sleeping"],
            answer: "The cat is sleeping.",
          },
          {
            itemId: "gps-sample-02",
            stageId: "gps-1c-choose-better-sentence",
            activityType: "chooseBest",
            prompt: "Choose the clearer sentence.",
            options: ["The boy ran.", "The boy ran to school quickly."],
            answer: 1,
          },
        ],
        stages: [
          {
            stageId: "gps-1a-reorder-words",
            title: "Reorder Words",
            skillFocus: "sentence-order",
            difficulty: "easy",
            activityType: "reorder",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.reorder,
          },
          {
            stageId: "gps-1b-fill-missing-word",
            title: "Fill Missing Word",
            skillFocus: "sentence-completion",
            difficulty: "easy",
            activityType: "fillBlank",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.fillBlank,
          },
          {
            stageId: "gps-1c-choose-better-sentence",
            title: "Choose Better Sentence",
            skillFocus: "sentence-quality",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
          {
            stageId: "gps-1d-expand-sentence",
            title: "Expand Sentence",
            skillFocus: "sentence-expansion",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
        ],
      },
      {
        gameId: "eem-g14-grammar-fix",
        gameTitle: "Grammar Fix",
        title: "Grammar Fix",
        moduleId: "eem-m07-grammar-correctness",
        gameOrder: 2,
        order: 2,
        unlockAfterGameId: "eem-g15-better-sentences",
        desc: "spot and fix sentence-level grammar errors",
        description: "spot and fix sentence-level grammar errors",
        route: "/kids/games/grammar/grammar-fix/spot-one-error",
        status: 'live',
        sampleItems: [
          {
            itemId: "gpf-sample-01",
            stageId: "gpf-2a-spot-one-error",
            activityType: "errorSpot",
            prompt: "She go to school every day.",
            answer: "go",
          },
          {
            itemId: "gpf-sample-02",
            stageId: "gpf-2b-fix-one-error",
            activityType: "errorFix",
            prompt: "I saw elephant at the zoo.",
            answer: "I saw an elephant at the zoo.",
          },
        ],
        stages: [
          {
            stageId: "gpf-2a-spot-one-error",
            title: "Spot One Error",
            skillFocus: "error-detection",
            difficulty: "easy",
            activityType: "errorSpot",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.errorSpot,
          },
          {
            stageId: "gpf-2b-fix-one-error",
            title: "Fix One Error",
            skillFocus: "single-error-correction",
            difficulty: "medium",
            activityType: "errorFix",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.errorFix,
          },
          {
            stageId: "gpf-2c-fix-full-sentence",
            title: "Fix Full Sentence",
            skillFocus: "sentence-editing",
            difficulty: "medium",
            activityType: "errorFix",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.errorFix,
          },
          {
            stageId: "gpf-2d-timed-correction",
            title: "Timed Correction",
            skillFocus: "accuracy-under-time",
            difficulty: "hard",
            activityType: "errorSpot",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "minimal",
            ...ACTIVITY_CONTENT_CONTRACTS.errorSpot,
          },
        ],
      },
      {
        gameId: "eem-g16-collocation-builder",
        gameTitle: "Collocation Builder",
        title: "Collocation Builder",
        moduleId: "eem-m08-collocations-idioms",
        gameOrder: 3,
        order: 3,
        unlockAfterGameId: "eem-g14-grammar-fix",
        desc: "choose natural word partnerships",
        description: "choose natural word partnerships",
        route: "/kids/games/grammar/collocation-builder/match-pairs",
        status: 'live',
        sampleItems: [
          {
            itemId: "gpc-sample-01",
            stageId: "gpc-3a-match-pairs",
            activityType: "matchPairs",
            prompt: ["do", "make", "take"],
            answer: ["do homework", "make a cake", "take a photo"],
          },
          {
            itemId: "gpc-sample-02",
            stageId: "gpc-3b-choose-natural-pair",
            activityType: "chooseBest",
            prompt: "Choose the natural collocation.",
            options: ["do a mistake", "make a mistake", "take a mistake"],
            answer: 1,
          },
        ],
        stages: [
          {
            stageId: "gpc-3a-match-pairs",
            title: "Match Pairs",
            skillFocus: "collocation-matching",
            difficulty: "easy",
            activityType: "matchPairs",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.matchPairs,
          },
          {
            stageId: "gpc-3b-choose-natural-pair",
            title: "Choose Natural Pair",
            skillFocus: "collocation-selection",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
          {
            stageId: "gpc-3c-fill-collocation-in-sentence",
            title: "Fill Collocation in Sentence",
            skillFocus: "contextual-collocation",
            difficulty: "medium",
            activityType: "fillBlank",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.fillBlank,
          },
          {
            stageId: "gpc-3d-confusion-practice",
            title: "Confusion Practice",
            skillFocus: "near-confusion-disambiguation",
            difficulty: "hard",
            activityType: "contextChoice",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "minimal",
            ...ACTIVITY_CONTENT_CONTRACTS.contextChoice,
          },
        ],
      },
      {
        gameId: "eem-g17-idiom-in-a-sentence",
        gameTitle: "Idiom in a Sentence",
        title: "Idiom in a Sentence",
        moduleId: "eem-m08-collocations-idioms",
        gameOrder: 4,
        order: 4,
        unlockAfterGameId: "eem-g16-collocation-builder",
        desc: "use idioms appropriately in context",
        description: "use idioms appropriately in context",
        comingSoon: true,
        status: 'comingSoon',
        sampleItems: [
          {
            itemId: "gpi-sample-01",
            stageId: "gpi-4a-match-meaning",
            activityType: "matchPairs",
            prompt: ["piece of cake", "break the ice"],
            answer: ["very easy", "start a conversation"],
          },
          {
            itemId: "gpi-sample-02",
            stageId: "gpi-4b-choose-context",
            activityType: "contextChoice",
            prompt: "Which sentence correctly uses 'piece of cake'?",
            options: [
              "The cake was a piece of cake in the box.",
              "The test was a piece of cake for Ria.",
              "Ria bought a piece of cake notebook.",
            ],
            answer: 1,
          },
        ],
        stages: [
          {
            stageId: "gpi-4a-match-meaning",
            title: "Match Meaning",
            skillFocus: "idiom-meaning",
            difficulty: "easy",
            activityType: "matchPairs",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.matchPairs,
          },
          {
            stageId: "gpi-4b-choose-context",
            title: "Choose Context",
            skillFocus: "idiom-context-fit",
            difficulty: "medium",
            activityType: "contextChoice",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.contextChoice,
          },
          {
            stageId: "gpi-4c-complete-sentence",
            title: "Complete Sentence",
            skillFocus: "idiom-application",
            difficulty: "medium",
            activityType: "fillBlank",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.fillBlank,
          },
          {
            stageId: "gpi-4d-reject-awkward-usage",
            title: "Reject Awkward Usage",
            skillFocus: "appropriateness-judgement",
            difficulty: "hard",
            activityType: "contextChoice",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "minimal",
            ...ACTIVITY_CONTENT_CONTRACTS.contextChoice,
          },
        ],
      },
    ],
  },
  {
    stageId: "eem-stage-6-speak-confidence",
    stageNumber: 6,
    stageTitle: "Speak with Confidence",
    stageOrder: 6,
    tiles: [
      { gameId: "eem-g24-use-the-word-aloud", gameTitle: "Use the Word Aloud", moduleId: "eem-m13-speaking-expression", gameOrder: 1, desc: "say the word in a sentence", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g25-explain-the-meaning", gameTitle: "Explain the Meaning", moduleId: "eem-m13-speaking-expression", gameOrder: 2, desc: "describe in your own words", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g26-present-argument-guided", gameTitle: "Present an Argument – Guided", moduleId: "eem-m13-speaking-expression", gameOrder: 3, desc: "speak with guide", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g27-present-argument-timed", gameTitle: "Present an Argument – Timed", moduleId: "eem-m13-speaking-expression", gameOrder: 4, desc: "quick presentation", comingSoon: true, status: 'comingSoon' },
    ],
  },
  {
    stageId: "eem-stage-7-review-championship",
    stageNumber: 7,
    stageTitle: "Review & Championship",
    stageOrder: 7,
    tiles: [
      { gameId: "eem-g28-spaced-review-replay", gameTitle: "Spaced Review Replay", moduleId: "eem-m14-review-arena", gameOrder: 1, desc: "review past lessons", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g29-timed-round-quiz", gameTitle: "Timed Round Quiz", moduleId: "eem-m14-review-arena", gameOrder: 2, desc: "quiz against the clock", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g30-mixed-round-challenge", gameTitle: "Mixed Round Challenge", moduleId: "eem-m14-review-arena", gameOrder: 3, desc: "all skills mixed", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g31-general-knowledge-quick-quiz", gameTitle: "General Knowledge Quick Quiz", moduleId: "eem-m14-review-arena", gameOrder: 4, desc: "knowledge check", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g32-mock-test", gameTitle: "Mock Test", moduleId: "eem-m15-mock-championship", gameOrder: 5, desc: "full-length practice", comingSoon: true, status: 'comingSoon' },
      { gameId: "eem-g33-championship-mode", gameTitle: "Championship Mode", moduleId: "eem-m15-mock-championship", gameOrder: 6, desc: "final achievement test", comingSoon: true, status: 'comingSoon' },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getTileId = (stageNumber: number, tileTitle: string, gameId?: string) =>
  gameId || `${stageNumber}:${slugify(tileTitle)}`;

const storageKeyForKid = (kidId: string) => `ts_eem_progress_v1_${kidId || "anon"}`;

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("tracing")) return "✍️";
  if (t.includes("balloon")) return "🎈";
  if (t.includes("sound") || t.includes("listening")) return "🔤";
  if (t.includes("blend")) return "🔗";
  if (t.includes("word")) return "📝";
  if (t.includes("sentence") || t.includes("fluency")) return "🧩";
  if (t.includes("read")) return "📖";
  if (t.includes("speak")) return "🗣️";
  return "✨";
};

const statusLabel = (s: TileStatus) => {
  if (s === "completed") return "Completed";
  if (s === "in_progress") return "In progress";
  return "Not started";
};

// ============================================================================
// UNLOCK & READINESS LOGIC (Patch 2)
// ============================================================================

/**
 * Get the tile with a specific gameId within a stage
 */
const getTileByGameId = (stageId: string, gameId: string): Tile | undefined => {
  const stage = STAGES.find((s) => s.stageId === stageId);
  return stage?.tiles.find((t) => t.gameId === gameId);
};

/**
 * Check if a tile is completed based on explicit IDs
 */
const isTileCompleted = (store: ProgressStore, gameId: string): boolean => {
  // Find the tile to get its ID format
  for (const stage of STAGES) {
    for (const tile of stage.tiles) {
      if (tile.gameId === gameId) {
        const tileId = getTileId(stage.stageNumber, tile.gameTitle ?? tile.title, gameId);
        return store.tiles[tileId]?.status === "completed";
      }
    }
  }
  return false;
};

/**
 * Check if a tile is unlocked based on unlock rules within its stage
 * Rules:
 * - First tile is always available (unless comingSoon)
 * - Each next tile unlocks when previous tile is completed
 * - comingSoon tiles are always locked
 */
const isTileUnlocked = (store: ProgressStore, stageId: string, gameId: string): boolean => {
  const stage = STAGES.find((s) => s.stageId === stageId);
  if (!stage) return false;

  const tileIndex = stage.tiles.findIndex((t) => t.gameId === gameId);
  if (tileIndex === -1) return false;

  const tile = stage.tiles[tileIndex];
  if (tile.comingSoon) return false; // Always locked if comingSoon
  if (!tile.route) return false;

  // Stage 1 + Stage 2 are fully playable mission stages:
  // if a real route exists, keep tiles directly tappable.
  if (ALWAYS_OPEN_STAGE_IDS.has(stageId)) return true;

  // Explicit dependency wins when provided.
  if (tile.unlockAfterGameId) {
    return isTileCompleted(store, tile.unlockAfterGameId);
  }

  // First tile is available by default
  if (tileIndex === 0) return true;

  // Check if previous tile is completed
  const prevTile = stage.tiles[tileIndex - 1];
  return isTileCompleted(store, prevTile.gameId);
};

/**
 * Get overall progress for a stage
 */
const getStageProgress = (store: ProgressStore, stageId: string) => {
  const stage = STAGES.find((s) => s.stageId === stageId);
  if (!stage) return { completed: 0, total: 0, pct: 0 };

  const completed = stage.tiles.filter((t) => isTileCompleted(store, t.gameId)).length;
  const total = stage.tiles.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
};

/**
 * Minimal local telemetry logger (no backend writes in Patch 2)
 * Logs to console in dev; can be extended to send to backend later
 */
const logEemTelemetry = (event: {
  missionId: string;
  stageId: string;
  moduleId: string;
  gameId: string;
  gameTitle: string;
  action: "tile_open" | "tile_complete_toggle" | "tile_unlock_check";
}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    mission: event.missionId,
    stage: event.stageId,
    module: event.moduleId,
    game: event.gameId,
    title: event.gameTitle,
    action: event.action,
  };

  // Console log in dev
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.log("[EEM Telemetry]", logEntry);
  }

  // TODO: Wire to backend analytics in Patch 3 (e.g., Firebase, Posthog, etc.)
};

// ============================================================================
// COMPONENT
// ============================================================================

const KidsEnglishExcellence: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get("kidId") || "";
  const bbsProgress = useMemo(() => loadBbsProgress(kidId), [kidId]);
  const grammarFixProgress = useMemo(() => loadGrammarFixProgress(kidId), [kidId]);
  const collocationProgress = useMemo(() => loadCollocationBuilderProgress(kidId), [kidId]);
  const isBbsMasteredForGrammarUnlock = Boolean(
    bbsProgress.gameCompleted && bbsProgress[BBS_STAGE_1D]?.mastered
  );
  const isGrammarFixMasteredForCollocationUnlock = Boolean(
    grammarFixProgress.gameCompleted && grammarFixProgress[GF_STAGE_2D]?.mastered
  );
  const isBbsInProgress =
    Boolean(bbsProgress[BBS_STAGE_1A]?.completed) ||
    Boolean(bbsProgress[BBS_STAGE_1B]?.completed) ||
    Boolean(bbsProgress[BBS_STAGE_1C]?.completed) ||
    Boolean(bbsProgress[BBS_STAGE_1D]?.completed);
  const isGrammarFixInProgress =
    Boolean(grammarFixProgress[GF_STAGE_2A]?.completed) ||
    Boolean(grammarFixProgress[GF_STAGE_2B]?.completed) ||
    Boolean(grammarFixProgress[GF_STAGE_2C]?.completed) ||
    Boolean(grammarFixProgress[GF_STAGE_2D]?.completed);
  const isCollocationMastered = Boolean(
    collocationProgress.gameCompleted && collocationProgress[CB_STAGE_3C]?.mastered
  );
  const isCollocationInProgress =
    Boolean(collocationProgress[CB_STAGE_3A]?.completed) ||
    Boolean(collocationProgress[CB_STAGE_3B]?.completed) ||
    Boolean(collocationProgress[CB_STAGE_3C]?.completed);

  const [selectedStageIndex, setSelectedStageIndex] = useState(() => {
    const raw = searchParams.get("eemStage");
    const stageNum = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(stageNum) && stageNum >= 1 && stageNum <= STAGES.length) {
      return stageNum - 1;
    }
    return 0;
  });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Progress store (per kid)
  const [store, setStore] = useState<ProgressStore>({ v: 1, tiles: {} });

  // “first open” pulse
  const [pulseTileId, setPulseTileId] = useState<string | null>(null);

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (!kidId) {
      try {
        const stored = localStorage.getItem("ts_active_kid_v1") || null;
        if (stored) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("kidId", stored);
          navigate({ search: newParams.toString() }, { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [kidId, navigate, searchParams]);

  // Load per-kid progress
  useEffect(() => {
    const key = storageKeyForKid(kidId);
    const parsed = safeParse<ProgressStore>(localStorage.getItem(key));
    if (parsed && parsed.v === 1 && parsed.tiles) setStore(parsed);
    else setStore({ v: 1, tiles: {} });
     
  }, [kidId]);

  // Save per-kid progress
  useEffect(() => {
    const key = storageKeyForKid(kidId);
    try {
      localStorage.setItem(key, JSON.stringify(store));
    } catch {
      // ignore
    }
  }, [kidId, store]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeTab = tabsRef.current[selectedStageIndex];
    if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedStageIndex]);

  // Optional completion hook: ?eemDone=<tileId>
  useEffect(() => {
    const done = searchParams.get("eemDone");
    if (!done) return;

    setStore((prev) => {
      const next = { ...prev, tiles: { ...prev.tiles } };
      const existing: TileProgress = next.tiles[done] || { status: "not_started", opens: 0 };
      next.tiles[done] = {
        ...existing,
        status: "completed",
        completedAt: Date.now(),
        lastOpenedAt: Date.now(),
      };
      return next;
    });

    const newParams = new URLSearchParams(searchParams);
    newParams.delete("eemDone");
    navigate({ search: newParams.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const currentStage = STAGES[selectedStageIndex];

  const getTileStatus = (tileId: string): TileStatus => store.tiles[tileId]?.status || "not_started";

  const overallStats = useMemo(() => {
    const allTiles = STAGES.flatMap((st) => st.tiles.map((t) => getTileId(st.stageNumber, t.gameTitle, t.gameId)));
    const total = allTiles.length;
    let completed = 0;
    for (const tid of allTiles) if (getTileStatus(tid) === "completed") completed += 1;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const trainingTracks = useMemo(() => {
    return STAGES.map((stage) => {
      const completed = stage.tiles.filter((tile) => isTileCompleted(store, tile.gameId)).length;
      const total = stage.tiles.length;
      const playable = stage.tiles.filter((tile) => !tile.comingSoon && !!tile.route).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        stageId: stage.stageId,
        stageNumber: stage.stageNumber,
        title: stage.stageTitle,
        completed,
        total,
        playable,
        pct,
      };
    });
  }, [store]);

  const totalReadyTracks = useMemo(
    () => trainingTracks.reduce((sum, track) => sum + track.playable, 0),
    [trainingTracks]
  );

  const appendKidId = (route: string) => {
    if (!kidId) return route;
    const sep = route.includes("?") ? "&" : "?";
    return `${route}${sep}kidId=${encodeURIComponent(kidId)}`;
  };

  const appendEemMeta = (route: string, tileId: string, stageNumber: number) => {
    const withKid = appendKidId(route);
    const sep = withKid.includes("?") ? "&" : "?";
    const returnTo = "/kids/games/english-excellence";
    return `${withKid}${sep}eemTile=${encodeURIComponent(tileId)}&eemStage=${encodeURIComponent(
      String(stageNumber)
    )}&eemReturn=${encodeURIComponent(returnTo)}`;
  };

  const handleBackNavigation = () => {
    const parentUrl = new URL("/parent", window.location.origin);
    parentUrl.searchParams.set("tab", "games-progress");
    if (kidId) {
      parentUrl.searchParams.set("kidId", kidId);
    }
    navigate(`${parentUrl.pathname}${parentUrl.search}`);
  };

  const setTileProgress = (tileId: string, patch: Partial<TileProgress>) => {
    setStore((prev) => {
      const next: ProgressStore = { ...prev, tiles: { ...prev.tiles } };
      const existing: TileProgress = next.tiles[tileId] || { status: "not_started", opens: 0 };
      next.tiles[tileId] = { ...existing, ...patch };
      return next;
    });
  };

  const handleTileClick = (stageNumber: number, tile: Tile) => {
    if (tile.comingSoon || !tile.route) return;

    // Patch 2: Check unlock rules based on explicit IDs
    const stage = STAGES[selectedStageIndex];
    const isGrammarFixGate =
      stage.stageId === "eem-stage-5-grammar-practice" && tile.gameId === "eem-g14-grammar-fix";
    const isCollocationGate =
      stage.stageId === "eem-stage-5-grammar-practice" && tile.gameId === "eem-g16-collocation-builder";
    if (isGrammarFixGate && !isBbsMasteredForGrammarUnlock) {
      return;
    }
    if (isCollocationGate && !isGrammarFixMasteredForCollocationUnlock) {
      return;
    }
    if (!isGrammarFixGate && !isCollocationGate && !isTileUnlocked(store, stage.stageId, tile.gameId)) {
      return; // Tile is locked, do not proceed
    }

    const displayTitle = tile.gameTitle ?? tile.title;
    const tileId = getTileId(stageNumber, displayTitle, tile.gameId);
    const status = getTileStatus(tileId);
    const now = Date.now();

    // Log telemetry
    logEemTelemetry({
      missionId: MISSION_ID,
      stageId: stage.stageId,
      moduleId: tile.moduleId,
      gameId: tile.gameId,
      gameTitle: displayTitle,
      action: "tile_open",
    });

    if (status === "not_started") {
      setTileProgress(tileId, {
        status: "in_progress",
        opens: (store.tiles[tileId]?.opens || 0) + 1,
        firstOpenedAt: now,
        lastOpenedAt: now,
      });

      setPulseTileId(tileId);
      window.setTimeout(() => navigate(appendEemMeta(tile.route!, tileId, stageNumber)), 200);
      return;
    }

    setTileProgress(tileId, {
      opens: (store.tiles[tileId]?.opens || 0) + 1,
      lastOpenedAt: now,
    });

    navigate(appendEemMeta(tile.route, tileId, stageNumber));
  };

  const toggleCompleted = (e: React.MouseEvent, stageNumber: number, tile: Tile) => {
    e.stopPropagation();
    e.preventDefault();
    if (tile.comingSoon) return;

    const displayTitle = tile.gameTitle ?? tile.title;
    const tileId = getTileId(stageNumber, displayTitle, tile.gameId);
    const status = getTileStatus(tileId);
    const now = Date.now();

    const stage = STAGES[selectedStageIndex];

    // Log telemetry
    logEemTelemetry({
      missionId: MISSION_ID,
      stageId: stage.stageId,
      moduleId: tile.moduleId,
      gameId: tile.gameId,
      gameTitle: displayTitle,
      action: "tile_complete_toggle",
    });

    if (status === "completed") {
      setTileProgress(tileId, { status: "in_progress", completedAt: undefined, lastOpenedAt: now });
      return;
    }

    const existingOpens = store.tiles[tileId]?.opens || 0;
    setTileProgress(tileId, {
      status: "completed",
      completedAt: now,
      lastOpenedAt: now,
      opens: Math.max(existingOpens, 1),
      firstOpenedAt: store.tiles[tileId]?.firstOpenedAt || now,
    });
  };

  return (
    <div className="relative min-h-screen xl:h-screen flex flex-col items-center justify-start py-4 px-4 overflow-hidden text-slate-900 bg-gradient-to-br from-sky-50 via-indigo-50 to-cyan-50">
      <style>{`
        /* Tabs */
        .tab-pill { transition: all 0.22s ease; }
        .tab-pill.active { box-shadow: 0 8px 24px rgba(99,102,241,0.20); transform: scale(1.02); }

        /* Compact tiles (dark gaming) */
        .tile {
          background: linear-gradient(180deg, rgba(2, 2, 14, 0.97) 0%, rgba(8, 4, 22, 0.93) 100%);
          border: 1px solid rgba(167, 139, 250, 0.32);
          backdrop-filter: blur(10px);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
          position: relative;
          overflow: hidden;
        }
        .tile:hover {
          transform: translateY(-3px);
          border-color: rgba(168, 85, 247, 0.82);
          box-shadow: 0 18px 32px -18px rgba(2, 6, 23, 0.95), 0 0 0 1px rgba(147, 51, 234, 0.3) inset;
        }
        .tile.locked { opacity: 0.72; cursor: not-allowed; }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }

        /* First-open pulse (soft) */
        @keyframes tilePulse {
          0% { box-shadow: 0 0 0 rgba(99,102,241,0); }
          30% { box-shadow: 0 0 32px rgba(99,102,241,0.30); }
          100% { box-shadow: 0 0 0 rgba(99,102,241,0); }
        }
        .pulse { animation: tilePulse 0.70s ease-in-out 1; }
        .pulse::after{
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          border: 2px solid rgba(99,102,241,0.24);
          opacity: 0;
          animation: ring 0.70s ease-in-out 1;
          pointer-events: none;
        }
        @keyframes ring {
          0% { opacity: 0; transform: scale(0.99); }
          30% { opacity: 1; transform: scale(1.00); }
          100% { opacity: 0; transform: scale(1.02); }
        }

        /* Grid */
        .tiles-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 14px;
        }
        @media (min-width: 640px) {
          .tiles-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        }
        @media (min-width: 1024px) {
          .tiles-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        }

        /* LMS dashboard cards */
        .lms-kpi {
          border: 1px solid rgba(167, 139, 250, 0.22);
          background: linear-gradient(180deg, rgba(10, 7, 26, 0.85) 0%, rgba(16, 10, 34, 0.78) 100%);
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 8px 24px -18px rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
        }

        .track-card {
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: rgba(255,255,255,0.72);
          border-radius: 16px;
          padding: 14px;
          min-width: 220px;
          text-align: left;
          transition: all 180ms ease;
          box-shadow: 0 8px 20px -18px rgba(15, 23, 42, 0.4);
        }
        .track-card:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.85);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .track-card.active {
          border-color: rgba(79, 70, 229, 0.35);
          box-shadow: 0 14px 28px -18px rgba(79, 70, 229, 0.45);
          background: rgba(255,255,255,0.9);
        }

        .track-progress {
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }
        .track-progress > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #4f46e5, #0284c7);
        }

        /* ========== PLANET STYLES ========== */
        
        /* Planet orb animations */
        @keyframes pSpin {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        
        @keyframes pFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        /* Base planet styling */
        .ts-planet {
          cursor: pointer;
          transition: all 220ms ease;
          position: relative;
        }

        .ts-planet.isActive {
          filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.6));
          transform: scale(1.15);
        }

        .ts-planet .orb {
          display: block;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          animation: pSpin 8s linear infinite, pFloat 2.8s ease-in-out infinite;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), inset -2px -2px 4px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .ts-planet .ring {
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          width: 70px;
          height: 24px;
          border: 3px solid rgba(217, 119, 6, 0.7);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(75deg);
          animation: pSpin 10s linear infinite reverse;
          box-shadow: 0 0 8px rgba(217, 119, 6, 0.3);
        }

        .ts-planet .shine {
          position: absolute;
          top: 4px;
          left: 8px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0));
          opacity: 0.8;
          animation: pFloat 4.2s ease-in-out infinite 0.4s;
        }

        .ts-planet .label {
          position: absolute;
          top: 56px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          color: rgba(15, 23, 42, 0.7);
          background: rgba(255, 255, 255, 0.85);
          padding: 4px 8px;
          border-radius: 4px;
          pointer-events: none;
          border: 1px solid rgba(99, 102, 241, 0.15);
          opacity: 0;
          transition: opacity 220ms ease;
        }

        .ts-planet:hover .label, .ts-planet.isActive .label {
          opacity: 1;
        }

        /* Mercury: Gray */
        .ts-planet.mercury .orb {
          background: linear-gradient(135deg, #a8a9ad 0%, #6f7073 50%, #4a4b4e 100%);
          animation-duration: 7.2s;
        }

        /* Venus: Yellow with stripes */
        .ts-planet.venus .orb {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #d97706 70%, #b45309 100%);
          background-size: 100% 100%;
          box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35), inset -2px -2px 4px rgba(120, 53, 15, 0.25);
          animation-duration: 8.4s;
        }

        /* Earth: Blue with green swirl */
        .ts-planet.earth .orb {
          background: conic-gradient(
            from 0deg at 50% 50%,
            #0369a1 0%,
            #06b6d4 25%,
            #10b981 35%,
            #84cc16 45%,
            #0369a1 70%,
            #0369a1 100%
          );
          animation-duration: 8s;
        }

        /* Mars: Red */
        .ts-planet.mars .orb {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
          animation-duration: 7.6s;
        }

        /* Jupiter: Brown with stripes */
        .ts-planet.jupiter .orb {
          background: repeating-linear-gradient(
            90deg,
            #92400e 0px,
            #b45309 4px,
            #d97706 8px,
            #f59e0b 12px,
            #d97706 16px,
            #b45309 20px,
            #92400e 24px
          );
          animation-duration: 9.2s;
        }

        /* Saturn: Yellow with rings */
        .ts-planet.saturn .orb {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          animation-duration: 10s;
        }

        .ts-planet.saturn .ring {
          display: block;
        }

        /* Uranus: Cyan */
        .ts-planet.uranus .orb {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
          animation-duration: 8.8s;
        }

        /* Neptune: Deep blue */
        .ts-planet.neptune .orb {
          background: linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%);
          animation-duration: 9.6s;
        }

        /* ========== SUN STYLING ========== */
        
        @keyframes tsRaysSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes tsRaysPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .ts-sunFar {
          position: absolute;
          width: 52px;
          height: 52px;
          top: 16px;
          left: 20px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fef3c7, #fcd34d 30%, #fbbf24 60%, #f59e0b 100%);
          box-shadow: 0 0 28px rgba(251, 191, 36, 0.8), 0 0 56px rgba(251, 191, 36, 0.4), inset -2px -2px 4px rgba(217, 119, 6, 0.3);
          z-index: 5;
        }

        .ts-sunRays {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          animation: tsRaysSpin 18s linear infinite;
          z-index: 3;
        }

        .ts-sunRay {
          position: absolute;
          width: 4px;
          height: 12px;
          background: linear-gradient(to top, rgba(251, 191, 36, 0.8), rgba(251, 191, 36, 0));
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          border-radius: 2px;
          animation: tsRaysPulse 3.5s ease-in-out infinite;
        }

        /* ========== STAGE BUTTONS (BOTTOM) ========== */
        
        .ts-stageRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 12px;
          padding: 0 12px;
        }

        .ts-stageBtn {
          font-size: 12px;
          font-weight: 800;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: rgba(255, 255, 255, 0.75);
          color: #0f172a;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .ts-stageBtn:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(99, 102, 241, 0.25);
        }

        .ts-stageBtn.active {
          background: rgba(249, 115, 22, 0.12);
          border-color: rgba(249, 115, 22, 0.42);
          color: #ea580c;
          font-weight: 900;
        }

        @media (prefers-reduced-motion: reduce) {
          .tile { transition: none !important; }
          .pulse, .pulse::after { animation: none !important; }
          .ts-planet .orb { animation: none !important; }
          .ts-planet .shine { animation: none !important; }
          .ts-planet .ring { animation: none !important; }
          .ts-sunRays { animation: none !important; }
          .ts-sunRay { animation: none !important; }
        }
      `}</style>

      {/* Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <LiquidEther
          className="absolute inset-0 opacity-95"
          style={{ width: "100%", height: "100%" }}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          colors={["#1A063F", "#3B1289", "#6D28D9"]}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          isBounce={false}
          resolution={0.5}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04020d]/74 via-[#090318]/60 to-[#12042c]/76" />
      </div>

      {/* In-layer top strip */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 mb-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/65 backdrop-blur-md px-3 py-2 shadow-sm">
          <TinyStepsBrand
            to=""
            subtitle="Kid workspace"
            className="pointer-events-none px-0 py-0 hover:bg-transparent"
            titleClassName="text-base"
            subtitleClassName="tracking-[0.18em]"
          />

          <div className="text-center text-base md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-slate-900 to-sky-700 whitespace-nowrap overflow-hidden text-ellipsis">
            English Excellence Mission
          </div>

          <button
            type="button"
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-1 rounded-full border border-slate-900/15 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm hover:bg-white"
            aria-label="Go back"
            title="Go back"
          >
            <span aria-hidden>←</span> Back
          </button>
        </div>
      </div>

      {/* LMS Workspace Layout */}
      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-4 pb-4 xl:h-[calc(100vh-124px)]">
        <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-3 items-start xl:h-full">
          {/* Left: Vertical training tracks panel */}
          <aside className="rounded-2xl border border-violet-300/20 bg-slate-950/42 backdrop-blur-md shadow-sm p-2.5 xl:h-full xl:flex xl:flex-col">
            <div
              className="mb-2 bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-lime-300 bg-clip-text text-[10px] font-extrabold uppercase tracking-[0.18em] text-transparent"
              style={{ textShadow: "0 0 12px rgba(56, 189, 248, 0.55)" }}
            >
              Training Tracks
            </div>
            <div
              className="grid gap-1.5 xl:flex-1 xl:min-h-0"
              style={{ gridTemplateRows: `repeat(${trainingTracks.length}, minmax(0, 1fr))` }}
            >
              {trainingTracks.map((track, idx) => (
                <button
                  key={track.stageId}
                  ref={(el) => {
                    tabsRef.current[idx] = el;
                  }}
                  onClick={() => setSelectedStageIndex(idx)}
                  type="button"
                  className={`w-full h-full min-h-0 overflow-hidden text-left rounded-xl border px-2 py-1.5 transition-all ${
                    idx === selectedStageIndex
                      ? "border-violet-400/60 bg-violet-500/12 shadow-sm"
                      : "border-violet-300/20 bg-slate-900/45 hover:bg-slate-900/60 hover:border-violet-300/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black">
                      {track.stageNumber}
                    </span>
                    <span className="text-[10px] font-bold text-violet-100/85">
                      {track.completed}/{track.total}
                    </span>
                  </div>
                  <div className="text-[13px] font-extrabold text-slate-100 leading-tight">{track.title}</div>
                  <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{track.playable} ready</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${track.pct}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Center: KPIs + modules (games area scrolls, layout stays fixed) */}
          <main className="rounded-2xl border border-violet-300/20 bg-slate-950/52 backdrop-blur-md shadow-sm p-3 xl:h-full xl:flex xl:flex-col">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="lms-kpi">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Tracks</div>
                <div className="mt-1 text-xl font-black text-slate-100">{STAGES.length}</div>
              </div>
              <div className="lms-kpi">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Games Ready</div>
                <div className="mt-1 text-xl font-black text-slate-100">{totalReadyTracks}</div>
              </div>
              <div className="lms-kpi">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Completed</div>
                <div className="mt-1 text-xl font-black text-slate-100">{overallStats.completed}</div>
              </div>
              <div className="lms-kpi">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Overall</div>
                <div className="mt-1 text-xl font-black text-slate-100">{overallStats.pct}%</div>
              </div>
            </div>

            <div className="mt-3 xl:flex-1 xl:min-h-0 xl:overflow-y-auto pr-1">
              <MagicBento
                textAutoHide
                enableStars
                enableSpotlight
                enableBorderGlow
                enableTilt={false}
                enableMagnetism={false}
                clickEffect
                spotlightRadius={400}
                particleCount={12}
                glowColor="168, 85, 247"
                disableAnimations={false}
              >
                <div className="tiles-grid">
                {currentStage.tiles.map((tile, idx) => {
                  const isGrammarFixTile =
                    currentStage.stageId === "eem-stage-5-grammar-practice" && tile.gameId === "eem-g14-grammar-fix";
                  const isCollocationTile =
                    currentStage.stageId === "eem-stage-5-grammar-practice" && tile.gameId === "eem-g16-collocation-builder";
                  const isUnlocked = isGrammarFixTile
                    ? isBbsMasteredForGrammarUnlock
                    : isCollocationTile
                      ? isGrammarFixMasteredForCollocationUnlock
                    : !tile.comingSoon && !!tile.route && isTileUnlocked(store, currentStage.stageId, tile.gameId);
                  const grammarTrackUi = currentStage.stageId === "eem-stage-5-grammar-practice"
                    ? (() => {
                        if (tile.gameId === "eem-g15-better-sentences") {
                          if (isBbsMasteredForGrammarUnlock) {
                            return {
                              locked: false,
                              badge: "Complete",
                              badgeClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
                              footer: "Replay anytime",
                            };
                          }
                          if (isBbsInProgress) {
                            return {
                              locked: false,
                              badge: "In Progress",
                              badgeClass: "bg-sky-500/15 border-sky-400/40 text-sky-200",
                              footer: "Tap to continue",
                            };
                          }
                          return {
                            locked: false,
                            badge: "Ready",
                            badgeClass: "bg-violet-500/15 border-violet-400/40 text-violet-200",
                            footer: "Tap to open",
                          };
                        }

                        if (tile.gameId === "eem-g14-grammar-fix") {
                          if (!isBbsMasteredForGrammarUnlock) {
                            return {
                              locked: true,
                              badge: "Locked",
                              badgeClass: "bg-slate-700/30 border-slate-500/35 text-slate-200",
                              footer: "Locked",
                            };
                          }
                          if (isGrammarFixMasteredForCollocationUnlock) {
                            return {
                              locked: false,
                              badge: "Complete",
                              badgeClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
                              footer: "Replay anytime",
                            };
                          }
                          if (isGrammarFixInProgress) {
                            return {
                              locked: false,
                              badge: "In Progress",
                              badgeClass: "bg-sky-500/15 border-sky-400/40 text-sky-200",
                              footer: "Tap to continue",
                            };
                          }
                          return {
                            locked: false,
                            badge: "Ready",
                            badgeClass: "bg-violet-500/15 border-violet-400/40 text-violet-200",
                            footer: "Tap to open",
                          };
                        }

                        if (tile.gameId === "eem-g16-collocation-builder") {
                          if (!isGrammarFixMasteredForCollocationUnlock) {
                            return {
                              locked: true,
                              badge: "Locked",
                              badgeClass: "bg-slate-700/30 border-slate-500/35 text-slate-200",
                              footer: "Locked",
                            };
                          }
                          if (isCollocationMastered) {
                            return {
                              locked: false,
                              badge: "Complete",
                              badgeClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
                              footer: "Replay anytime",
                            };
                          }
                          if (isCollocationInProgress) {
                            return {
                              locked: false,
                              badge: "In Progress",
                              badgeClass: "bg-sky-500/15 border-sky-400/40 text-sky-200",
                              footer: "Tap to continue",
                            };
                          }
                          return {
                            locked: false,
                            badge: "Ready",
                            badgeClass: "bg-violet-500/15 border-violet-400/40 text-violet-200",
                            footer: "Tap to open",
                          };
                        }

                        if (tile.gameId === "eem-g17-idiom-in-a-sentence") {
                          return {
                            locked: true,
                            badge: "Locked",
                            badgeClass: "bg-slate-700/30 border-slate-500/35 text-slate-200",
                            footer: "Locked",
                          };
                        }

                        return null;
                      })()
                    : null;

                  const locked = grammarTrackUi ? grammarTrackUi.locked : !isUnlocked;
                  const displayTitle = tile.gameTitle ?? tile.title;
                  const tileId = getTileId(currentStage.stageNumber, displayTitle, tile.gameId);
                  const icon = getIcon(displayTitle);
                  const status = getTileStatus(tileId);

                  const defaultBadgeClass =
                    status === "completed"
                      ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                    : status === "in_progress"
                      ? "bg-sky-500/15 border-sky-400/40 text-sky-200"
                      : "bg-slate-700/30 border-slate-500/35 text-slate-200";
                  const badgeClass = grammarTrackUi?.badgeClass || defaultBadgeClass;
                  const badgeText = grammarTrackUi?.badge || statusLabel(status);
                  const footerText = grammarTrackUi?.footer || (locked ? "Locked" : status === "completed" ? "Replay anytime" : "Tap to open");

                  const isPulse = pulseTileId === tileId;

                  return (
                    <div
                      key={tile.gameId}
                      onClick={() => handleTileClick(currentStage.stageNumber, tile)}
                      className={`magic-bento-card tile rounded-2xl p-4 flex flex-col gap-3 ${locked ? "locked" : "cursor-pointer"} ${
                        isPulse ? "pulse" : ""
                      }`}
                      style={{
                        animationFillMode: "both",
                        animationDuration: "0.35s",
                        animationDelay: `${idx * 35}ms`,
                        animationName: "fadeInUp",
                      }}
                      onAnimationEnd={() => {
                        if (isPulse) setPulseTileId(null);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-300/20 flex items-center justify-center text-xl shadow-inner">
                          {icon}
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${badgeClass}`}
                            title={`Status: ${badgeText}`}
                          >
                            {badgeText}
                          </div>

                          {!locked && (
                            <button
                              type="button"
                              onClick={(e) => toggleCompleted(e, currentStage.stageNumber, tile)}
                              className={`
                                w-8 h-8 rounded-full border flex items-center justify-center text-sm font-black
                                ${
                                  status === "completed"
                                    ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                                    : "bg-slate-900/45 border-slate-300/25 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                                }
                              `}
                              title={status === "completed" ? "Set to In progress" : "Mark as Completed"}
                              aria-label={status === "completed" ? "Set to In progress" : "Mark as Completed"}
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="min-h-[56px]">
                        <div className="magic-bento-title text-base font-extrabold text-slate-100 leading-snug">{displayTitle}</div>
                        <div className="magic-bento-description text-xs text-slate-300/85 font-semibold mt-1">{tile.desc}</div>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-[11px] text-slate-300/80 font-bold">
                          {footerText}
                        </div>

                        <div
                          className={`
                            text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-sm
                            ${
                              locked
                                ? "bg-slate-800/70 border-slate-400/20 text-slate-300"
                                : "bg-gradient-to-r from-indigo-600 to-sky-600 border-white/40 text-white"
                            }
                          `}
                        >
                          {locked ? "Soon" : "Play"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </MagicBento>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default KidsEnglishExcellence;
