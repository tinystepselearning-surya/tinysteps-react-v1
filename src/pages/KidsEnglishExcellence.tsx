// src/pages/KidsEnglishExcellence.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  title?: string; // legacy fallback (for backward compat)
  desc: string;
  route?: string;
  comingSoon?: boolean;
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
      { gameId: "eem-g01-hear-and-spell", gameTitle: "Hear and Spell", moduleId: "eem-m01-sound-spelling-foundations", gameOrder: 1, desc: "sound → letter match", comingSoon: true },
      { gameId: "eem-g02-letter-tile-spelling", gameTitle: "Letter Tile Spelling", moduleId: "eem-m01-sound-spelling-foundations", gameOrder: 2, desc: "tap tiles to spell", comingSoon: true },
      { gameId: "eem-g03-choose-correct-spelling", gameTitle: "Choose the Correct Spelling", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 3, desc: "pick right letter sound", comingSoon: true },
      { gameId: "eem-g04-sound-spotter", gameTitle: "Sound Spotter", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 4, desc: "find the sound (visual)", route: "/kids/games/phonics/balloon-pop" },
      { gameId: "eem-g05-phonics-pattern-sort", gameTitle: "Phonics Pattern Sort", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 5, desc: "group by sound pattern", route: "/kids/games/phonics/sound-detective" },
    ],
  },
  {
    stageId: "eem-stage-2-build-words",
    stageNumber: 2,
    stageTitle: "Build Words",
    stageOrder: 2,
    tiles: [
      { gameId: "eem-g06-root-word-builder", gameTitle: "Root Word Builder", moduleId: "eem-m03-roots-prefixes", gameOrder: 1, desc: "build from roots", comingSoon: true },
      { gameId: "eem-g07-prefix-power", gameTitle: "Prefix Power", moduleId: "eem-m03-roots-prefixes", gameOrder: 2, desc: "add prefixes (un-, re-)", comingSoon: true },
      { gameId: "eem-g08-suffix-maker", gameTitle: "Suffix Maker", moduleId: "eem-m04-suffixes-word-families", gameOrder: 3, desc: "add suffixes (-ing, -ed)", comingSoon: true },
      { gameId: "eem-g09-word-family-match", gameTitle: "Word Family Match", moduleId: "eem-m04-suffixes-word-families", gameOrder: 4, desc: "drag tiles to build word families", route: "/kids/games/phonics/cvc-word-reader/make-a-word" },
      { gameId: "eem-g10-compound-word-builder", gameTitle: "Compound Word Builder", moduleId: "eem-m05-compounds-word-weaving", gameOrder: 5, desc: "join two words", comingSoon: true },
      { gameId: "eem-g11-word-weaving", gameTitle: "Word Weaving", moduleId: "eem-m05-compounds-word-weaving", gameOrder: 6, desc: "blend + combine", comingSoon: true },
    ],
  },
  {
    stageId: "eem-stage-3-make-sentences",
    stageNumber: 3,
    stageTitle: "Make Sentences",
    stageOrder: 3,
    tiles: [
      { gameId: "eem-g12-sentence-builder", gameTitle: "Sentence Builder", moduleId: "eem-m06-sentence-order-context", gameOrder: 1, desc: "put words in order", route: "/kids/games/phonics/sentence-stepper?pack=4.0" },
      { gameId: "eem-g13-fill-the-blank", gameTitle: "Fill the Blank", moduleId: "eem-m06-sentence-order-context", gameOrder: 2, desc: "complete sentences", route: "/kids/games/phonics/sentence-stepper?pack=4.3" },
      { gameId: "eem-g14-find-correct-sentence", gameTitle: "Find the Correct Sentence", moduleId: "eem-m07-grammar-correctness", gameOrder: 3, desc: "spot the right one", comingSoon: true },
      { gameId: "eem-g15-sentence-repair", gameTitle: "Sentence Repair", moduleId: "eem-m07-grammar-correctness", gameOrder: 4, desc: "fix mistakes", comingSoon: true },
      { gameId: "eem-g16-collocation-builder", gameTitle: "Collocation Builder", moduleId: "eem-m08-collocations-idioms", gameOrder: 5, desc: "word pairs that go together", comingSoon: true },
      { gameId: "eem-g17-idiom-in-a-sentence", gameTitle: "Idiom in a Sentence", moduleId: "eem-m08-collocations-idioms", gameOrder: 6, desc: "use idioms naturally", comingSoon: true },
    ],
  },
  {
    stageId: "eem-stage-4-read-understand",
    stageNumber: 4,
    stageTitle: "Read & Understand",
    stageOrder: 4,
    tiles: [
      { gameId: "eem-g18-story-reading", gameTitle: "Story Reading", moduleId: "eem-m09-story-reading", gameOrder: 1, desc: "read short passages", route: "/kids/games/reading/story-reading" },
      { gameId: "eem-g19-comprehension-questions", gameTitle: "Comprehension Questions", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 2, desc: "who/what/where/why", route: "/kids/games/reading/comprehension" },
      { gameId: "eem-g20-new-words-from-reading", gameTitle: "New Words from Reading", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 3, desc: "vocab in context", route: "/kids/games/reading/new-words" },
      { gameId: "eem-g21-meaning-from-context", gameTitle: "Meaning from Context", moduleId: "eem-m11-context-meaning-relations", gameOrder: 4, desc: "figure out word meaning", comingSoon: true },
      { gameId: "eem-g22-synonym-antonym-hunt", gameTitle: "Synonym & Antonym Hunt", moduleId: "eem-m11-context-meaning-relations", gameOrder: 5, desc: "find similar/opposite words", comingSoon: true },
      { gameId: "eem-g23-crossword-from-reading", gameTitle: "Crossword from Reading", moduleId: "eem-m12-reading-crossword-recall", gameOrder: 6, desc: "puzzle based on passage", comingSoon: true },
    ],
  },
  {
    stageId: "eem-stage-5-speak-confidence",
    stageNumber: 5,
    stageTitle: "Speak with Confidence",
    stageOrder: 5,
    tiles: [
      { gameId: "eem-g24-use-the-word-aloud", gameTitle: "Use the Word Aloud", moduleId: "eem-m13-speaking-expression", gameOrder: 1, desc: "say the word in a sentence", comingSoon: true },
      { gameId: "eem-g25-explain-the-meaning", gameTitle: "Explain the Meaning", moduleId: "eem-m13-speaking-expression", gameOrder: 2, desc: "describe in your own words", comingSoon: true },
      { gameId: "eem-g26-present-argument-guided", gameTitle: "Present an Argument – Guided", moduleId: "eem-m13-speaking-expression", gameOrder: 3, desc: "speak with guide", comingSoon: true },
      { gameId: "eem-g27-present-argument-timed", gameTitle: "Present an Argument – Timed", moduleId: "eem-m13-speaking-expression", gameOrder: 4, desc: "quick presentation", comingSoon: true },
    ],
  },
  {
    stageId: "eem-stage-6-review-championship",
    stageNumber: 6,
    stageTitle: "Review & Championship",
    stageOrder: 6,
    tiles: [
      { gameId: "eem-g28-spaced-review-replay", gameTitle: "Spaced Review Replay", moduleId: "eem-m14-review-arena", gameOrder: 1, desc: "review past lessons", comingSoon: true },
      { gameId: "eem-g29-timed-round-quiz", gameTitle: "Timed Round Quiz", moduleId: "eem-m14-review-arena", gameOrder: 2, desc: "quiz against the clock", comingSoon: true },
      { gameId: "eem-g30-mixed-round-challenge", gameTitle: "Mixed Round Challenge", moduleId: "eem-m14-review-arena", gameOrder: 3, desc: "all skills mixed", comingSoon: true },
      { gameId: "eem-g31-general-knowledge-quick-quiz", gameTitle: "General Knowledge Quick Quiz", moduleId: "eem-m14-review-arena", gameOrder: 4, desc: "knowledge check", comingSoon: true },
      { gameId: "eem-g32-mock-test", gameTitle: "Mock Test", moduleId: "eem-m15-mock-championship", gameOrder: 5, desc: "full-length practice", comingSoon: true },
      { gameId: "eem-g33-championship-mode", gameTitle: "Championship Mode", moduleId: "eem-m15-mock-championship", gameOrder: 6, desc: "final achievement test", comingSoon: true },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const stageStats = useMemo(() => {
    const total = currentStage.tiles.length;
    const playable = currentStage.tiles.filter((t) => !t.comingSoon && !!t.route).length;
    const completed = currentStage.tiles.reduce((acc, t) => {
      const tid = getTileId(currentStage.stageNumber, t.title, t.gameId);
      return acc + (getTileStatus(tid) === "completed" ? 1 : 0);
    }, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, playable, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, store]);

  const overallStats = useMemo(() => {
    const allTiles = STAGES.flatMap((st) => st.tiles.map((t) => getTileId(st.stageNumber, t.title, t.gameId)));
    const total = allTiles.length;
    let completed = 0;
    for (const tid of allTiles) if (getTileStatus(tid) === "completed") completed += 1;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

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
    if (!isTileUnlocked(store, stage.stageId, tile.gameId)) {
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
    <div className="relative min-h-screen flex flex-col items-center justify-start py-8 px-4 overflow-hidden text-slate-900 bg-gradient-to-br from-sky-50 via-indigo-50 to-cyan-50">
      <style>{`
        /* Soft calm blobs (light theme) */
        .soft-blob {
          position: absolute;
          filter: blur(90px);
          opacity: 0.45;
          animation: drift 18s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .b1 { top: -14%; left: -10%; width: 52vw; height: 52vh; background: rgba(56,189,248,0.55); }  /* sky */
        .b2 { top: 8%; right: -14%; width: 60vw; height: 60vh; background: rgba(99,102,241,0.45); animation-delay: -6s; } /* indigo */
        .b3 { bottom: -16%; left: 16%; width: 55vw; height: 45vh; background: rgba(34,211,238,0.40); animation-delay: -9s; } /* cyan */
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          100% { transform: translate(26px, 18px) scale(1.06) rotate(3deg); }
        }

        /* Subtle grain */
        .grain {
          position: absolute; inset: 0; opacity: 0.035; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Tabs */
        .tab-pill { transition: all 0.22s ease; }
        .tab-pill.active { box-shadow: 0 8px 24px rgba(99,102,241,0.20); transform: scale(1.02); }

        /* Compact tiles (light glass) */
        .tile {
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(15,23,42,0.08);
          backdrop-filter: blur(10px);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
          position: relative;
          overflow: hidden;
        }
        .tile:hover {
          transform: translateY(-3px);
          border-color: rgba(99,102,241,0.28);
          background: rgba(255,255,255,0.78);
          box-shadow: 0 14px 28px -16px rgba(15,23,42,0.35);
        }
        .tile.locked { opacity: 0.65; cursor: not-allowed; }
        .tile.locked:hover { transform: none; box-shadow: none; border-color: rgba(15,23,42,0.08); background: rgba(255,255,255,0.65); }

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
          .soft-blob { animation: none !important; }
          .tile { transition: none !important; }
          .pulse, .pulse::after { animation: none !important; }
          .ts-planet .orb { animation: none !important; }
          .ts-planet .shine { animation: none !important; }
          .ts-planet .ring { animation: none !important; }
          .ts-sunRays { animation: none !important; }
          .ts-sunRay { animation: none !important; }
        }
      `}</style>

      {/* Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="soft-blob b1 rounded-full" />
        <div className="soft-blob b2 rounded-full" />
        <div className="soft-blob b3 rounded-full" />
        <div className="grain" />
      </div>

      {/* In-layer top strip */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 mb-2">
        <div className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white/65 backdrop-blur-md px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 text-[11px] font-black text-white">
              TS
            </span>
            <span className="text-sm font-black tracking-wide text-slate-900">Tiny Steps</span>
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

      {/* Header */}
      <div className="relative z-10 text-center max-w-4xl mx-auto mt-2 mb-7 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-slate-900/10 backdrop-blur-md text-xs font-extrabold text-indigo-700 mb-4 shadow-sm">
          <span>🚀</span> Complete English Journey
        </div>

        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-slate-900 to-sky-700 drop-shadow-sm mb-2">
          English Excellence Mission
        </h1>

        <p className="text-base md:text-lg text-slate-700/90 font-semibold">
          Master reading, writing & speaking step by step
        </p>

        {/* Stage progress bar */}
        <div className="mt-6 mx-auto max-w-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>
              Stage {currentStage.stageNumber}: {currentStage.stageTitle}
            </span>
            <span>
              {stageStats.completed}/{stageStats.total} completed • {stageStats.playable} ready
            </span>
          </div>

          <div className="h-3 rounded-full bg-white/70 border border-slate-900/10 overflow-hidden shadow-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-sky-600"
              style={{ width: `${stageStats.pct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-bold text-slate-700/70">
            <span>Overall: {overallStats.completed}/{overallStats.total} completed</span>
            <span className="opacity-40">•</span>
            <span>{overallStats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mb-5 overflow-hidden select-none">
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-sky-50 via-indigo-50 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cyan-50 via-indigo-50 to-transparent z-20 pointer-events-none" />

        <div className="flex overflow-x-auto pb-4 pt-1 gap-3 px-8" style={{ scrollbarWidth: "none" }}>
          {STAGES.map((stage, idx) => (
            <button
              key={idx}
              ref={(el) => {
                tabsRef.current[idx] = el;
              }}
              onClick={() => setSelectedStageIndex(idx)}
              className={`
                tab-pill relative flex-shrink-0 flex items-center gap-3 px-1.5 py-1.5 pr-6 rounded-full border
                ${
                  idx === selectedStageIndex
                    ? "active bg-white/75 border-indigo-500/25 text-slate-900 shadow-sm"
                    : "bg-white/55 border-slate-900/10 text-slate-700/70 hover:bg-white/75 hover:border-slate-900/15"
                }
              `}
              type="button"
            >
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-black shadow-inner
                  ${idx === selectedStageIndex ? "bg-indigo-600 text-white" : "bg-white/60 border border-slate-900/10 text-slate-700"}
                `}
              >
                {stage.stageNumber}
              </div>
              <span className="font-extrabold tracking-wide text-sm">{stage.stageTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Tiles */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-20">
        <div className="tiles-grid">
          {currentStage.tiles.map((tile, idx) => {
            // Patch 2: Use unlock rules based on explicit IDs
            const isUnlocked = !tile.comingSoon && !!tile.route && isTileUnlocked(store, currentStage.stageId, tile.gameId);
            const locked = !isUnlocked;
            const displayTitle = tile.gameTitle ?? tile.title;
            const tileId = getTileId(currentStage.stageNumber, displayTitle, tile.gameId);
            const icon = getIcon(displayTitle);
            const status = getTileStatus(tileId);

            const badgeClass =
              status === "completed"
                ? "bg-emerald-600/10 border-emerald-600/20 text-emerald-700"
                : status === "in_progress"
                ? "bg-sky-600/10 border-sky-600/20 text-sky-700"
                : "bg-slate-900/5 border-slate-900/10 text-slate-700/70";

            const isPulse = pulseTileId === tileId;

            return (
              <div
                key={tile.gameId}
                onClick={() => handleTileClick(currentStage.stageNumber, tile)}
                className={`tile rounded-2xl p-4 flex flex-col gap-3 ${locked ? "locked" : "cursor-pointer"} ${
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
                  <div className="w-10 h-10 rounded-xl bg-white/70 border border-slate-900/10 flex items-center justify-center text-xl shadow-inner">
                    {icon}
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${badgeClass}`}
                      title={`Status: ${statusLabel(status)}`}
                    >
                      {statusLabel(status)}
                    </div>

                    {!locked && (
                      <button
                        type="button"
                        onClick={(e) => toggleCompleted(e, currentStage.stageNumber, tile)}
                        className={`
                          w-8 h-8 rounded-full border flex items-center justify-center text-sm font-black
                          ${
                            status === "completed"
                              ? "bg-emerald-600/10 border-emerald-600/20 text-emerald-700"
                              : "bg-white/60 border-slate-900/10 text-slate-700/70 hover:bg-white/80 hover:text-slate-900"
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
                  <div className="text-base font-extrabold text-slate-900 leading-snug">{displayTitle}</div>
                  <div className="text-xs text-slate-700/70 font-semibold mt-1">{tile.desc}</div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="text-[11px] text-slate-700/60 font-bold">
                    {locked ? "Locked" : status === "completed" ? "Replay anytime" : "Tap to open"}
                  </div>

                  <div
                    className={`
                      text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-sm
                      ${
                        locked
                          ? "bg-white/60 border-slate-900/10 text-slate-500"
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

      </div>
    </div>
  );
};

export default KidsEnglishExcellence;
