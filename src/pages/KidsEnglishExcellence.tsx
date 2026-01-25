// src/pages/KidsEnglishExcellence.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// ============================================================================
// CLEAN PPT-STYLE JOURNEY (Compact + Professional)
// ============================================================================

type JourneyStage = "Phonics" | "Grammar" | "Speaking" | "Breakthrough";

type JourneyStop = {
  id: string; // S1..S8
  stage: JourneyStage;
  title: string;
  bullets: string[];
  left: string; // deprecated, kept for compat
  top: string; // deprecated, kept for compat
  childCanDo: string[];
  nextMilestone: string;
  teacherFocus: string[];
  homePractice: string;
  parentUpdateExample: string;
  t: number; // 0-1 position on road curve
  planet: "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";
};

const JOURNEY_STOPS: JourneyStop[] = [
  {
    id: "S1",
    stage: "Phonics",
    title: "Tracing Foundations",
    bullets: ["Grip + control", "Lines & curves", "Confidence to write"],
    left: "18%",
    top: "80%",
    childCanDo: ["Hold pencil like a pro", "Trace big curves", "Keep lines neat"],
    nextMilestone: "Write first letters with correct formation",
    teacherFocus: ["Grip strength", "Line control", "Confidence building"],
    homePractice: "Trace shapes in sand or on paper for 5 minutes",
    parentUpdateExample: "Your child's grip is getting stronger! Try tracing shapes at home.",
    planet: "mercury",
    t: 0.06,
  },
  {
    id: "S2",
    stage: "Phonics",
    title: "Letter Sounds + Formation",
    bullets: ["26 sounds (not just names)", "Correct start points", "Fewer reversals"],
    left: "12%",
    top: "62%",
    childCanDo: ["Say 26 letter sounds", "Form letters correctly", "Say sounds in order"],
    nextMilestone: "Blend 2-3 sounds into words",
    teacherFocus: ["Sound accuracy", "Letter formation", "Muscle memory"],
    homePractice: "Point to letters and say their sounds (not names)",
    parentUpdateExample: "Perfect sound practice! Your child knows 15/26 sounds now.",
    planet: "venus",
    t: 0.18,
  },
  {
    id: "S3",
    stage: "Phonics",
    title: "Blending → Word Families",
    bullets: ["Blend 2–3 sounds", "CVC words (sat/pin)", "Early spelling from sounds"],
    left: "25%",
    top: "46%",
    childCanDo: ["Blend sounds into words", "Read CVC words", "Spell 3-letter words"],
    nextMilestone: "Read simple sentences smoothly",
    teacherFocus: ["Blending fluency", "Word family patterns", "Spelling sounds"],
    homePractice: "Read 5 simple CVC words together and spell them",
    parentUpdateExample: "Blending click! Your child read 'cat', 'sit', 'dog' perfectly.",
    planet: "earth",
    t: 0.30,
  },
  {
    id: "S4",
    stage: "Phonics",
    title: "Reads Sentences",
    bullets: ["Smooth decoding", "Punctuation pauses", "Simple comprehension"],
    left: "44%",
    top: "58%",
    childCanDo: ["Decode sentences", "Pause at periods", "Answer simple questions"],
    nextMilestone: "Write simple sentences independently",
    teacherFocus: ["Fluency building", "Comprehension", "Punctuation awareness"],
    homePractice: "Read a 3-sentence story and ask 'What happened?'",
    parentUpdateExample: "Reading breakthrough! Your child read a full sentence today.",
    planet: "mars",
    t: 0.42,
  },
  {
    id: "S5",
    stage: "Breakthrough",
    title: "Writes Sentences",
    bullets: ["Clear sentences", "Capital & full stop", "Better speed + neatness"],
    left: "64%",
    top: "52%",
    childCanDo: ["Write full sentences", "Use capitals correctly", "Add periods"],
    nextMilestone: "Spell common words without help",
    teacherFocus: ["Sentence structure", "Punctuation rules", "Speed + accuracy"],
    homePractice: "Write 3 sentences about their day",
    parentUpdateExample: "Writing is flowing! Your child wrote 'The cat sat on the mat.' perfectly.",
    planet: "jupiter",
    t: 0.56,
  },
  {
    id: "S6",
    stage: "Phonics",
    title: "Spelling Rules Mastery",
    bullets: ["Magic-E", "Rabbit rule", "Vowel teams (ai/ee/oa/ie)"],
    left: "58%",
    top: "30%",
    childCanDo: ["Apply magic-e rule", "Use vowel teams", "Spell pattern words"],
    nextMilestone: "Spell multisyllabic words",
    teacherFocus: ["Pattern recognition", "Rule application", "Word structure"],
    homePractice: "Find words with 'ai' or 'ee' sounds in books",
    parentUpdateExample: "Pattern master! Your child spelled 'make', 'tree', 'rain' correctly.",
    planet: "saturn",
    t: 0.68,
  },
  {
    id: "S7",
    stage: "Grammar",
    title: "Grammar + Vocabulary",
    bullets: ["Sentence structure", "Correct verb forms", "Word upgrades"],
    left: "76%",
    top: "18%",
    childCanDo: ["Use correct tenses", "Build complex sentences", "Use varied vocabulary"],
    nextMilestone: "Write short paragraphs with multiple sentences",
    teacherFocus: ["Grammar rules", "Vocabulary expansion", "Sentence variety"],
    homePractice: "Write sentences using 'before', 'after', 'because'",
    parentUpdateExample: "Grammar growth! Your child used past tense correctly in stories.",
    planet: "uranus",
    t: 0.80,
  },
  {
    id: "S8",
    stage: "Speaking",
    title: "Confident Speaking (No Blackout)",
    bullets: ["Stage speaking", "Instant topic speaking", "No freezing — clear framework"],
    left: "88%",
    top: "28%",
    childCanDo: ["Speak on stage", "Handle any topic", "Speak with confidence"],
    nextMilestone: "Present ideas to large groups",
    teacherFocus: ["Speaking confidence", "Presentation skills", "Handling nervousness"],
    homePractice: "Practice 1-minute talks on fun topics",
    parentUpdateExample: "Speaking star! Your child presented without nervousness today.",
    planet: "neptune",
    t: 0.92,
  },
];

type RoadStageLabel = { label: string; x: number; y: number };
const ROAD_STAGE_LABELS: RoadStageLabel[] = [
  { label: "Phonics", x: 260, y: 260 },
  { label: "Grammar", x: 560, y: 290 },
  { label: "Speaking", x: 700, y: 130 },
  { label: "Breakthrough", x: 860, y: 105 },
];

function StagePill({ stage }: { stage: JourneyStage }) {
  const bg =
    stage === "Phonics"
      ? "rgba(251,146,60,0.18)"
      : stage === "Grammar"
      ? "rgba(59,130,246,0.14)"
      : stage === "Speaking"
      ? "rgba(168,85,247,0.14)"
      : "rgba(34,197,94,0.14)";

  const border =
    stage === "Phonics"
      ? "rgba(251,146,60,0.34)"
      : stage === "Grammar"
      ? "rgba(59,130,246,0.28)"
      : stage === "Speaking"
      ? "rgba(168,85,247,0.28)"
      : "rgba(34,197,94,0.28)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 800,
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        color: "#0f172a",
        whiteSpace: "nowrap",
      }}
    >
      {stage}
    </span>
  );
}

function SvgStageLabel({ label, x, y }: RoadStageLabel) {
  const w = label === "Breakthrough" ? 168 : 120;
  const h = 36;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={999}
        fill="rgba(255,255,255,0.92)"
        stroke="rgba(15,23,42,0.14)"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="#0f172a"
      >
        {label}
      </text>
    </g>
  );
}

function RoadPin({
  id,
  active,
  onClick,
  planet,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  planet: "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ts-planet ${planet} ${active ? "isActive" : ""}`}
      aria-label={`Open ${id}`}
      title={id}
    >
      <span className="orb" aria-hidden />
      <span className="ring" aria-hidden />
      <span className="shine" aria-hidden />
      <span className="label">{id}</span>
    </button>
  );
}

export function LearningJourneyRoadmapPPT() {
  const [activeId, setActiveId] = useState<string>("S1");
  const [pinPos, setPinPos] = useState<Record<string, { xPct: number; yPct: number }>>({});

  const ROAD_W = 1000;
  const ROAD_H = 380;

  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const update = () => {
      const p = pathRef.current;
      if (!p) return;

      const len = p.getTotalLength();
      const next: Record<string, { xPct: number; yPct: number }> = {};

      JOURNEY_STOPS.forEach((s) => {
        const pt = p.getPointAtLength(len * (s.t ?? 0));
        next[s.id] = { xPct: (pt.x / ROAD_W) * 100, yPct: (pt.y / ROAD_H) * 100 };
      });

      setPinPos(next);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const active = useMemo(
    () => JOURNEY_STOPS.find((s) => s.id === activeId) ?? JOURNEY_STOPS[0],
    [activeId]
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
            guided practice, and confidence (no pressure, no "blackout").
          </div>
        </div>
      </div>

      <div style={{ padding: "0 18px 18px" }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.6fr 0.9fr",
            gap: 14,
          }}
        >
          {/* LEFT: Road */}
          <div
            style={{
              borderRadius: 22,
              border: "1px solid rgba(15,23,42,0.06)",
              padding: 14,
              overflow: "hidden",
              position: "relative",
              minHeight: 390,

              // ✅ clear sky blue + soft depth
              background:
                "linear-gradient(180deg, rgba(224,242,254,0.95) 0%, rgba(186,230,253,0.88) 45%, rgba(255,237,213,0.78) 100%)",
              boxShadow: "0 18px 50px rgba(2,6,23,0.08)",
            }}
          >
            {/* ✅ far sun (small, top-left) + subtle star speckles */}
            <div className="ts-sky" aria-hidden>
              <div className="ts-sunFar" />
              <div className="ts-sunRaysFar" />
            </div>

            <div className="ts-roadWrap">
              <svg
                viewBox="0 0 1000 380"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 360,
                  display: "block",
                }}
              >
                <defs>
                  {/* Galaxy gradient */}
                  <linearGradient id="galaxyGrad" x1="0" y1="0" x2="1000" y2="0">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="22%" stopColor="#1e1b4b" />
                    <stop offset="45%" stopColor="#312e81" />
                    <stop offset="64%" stopColor="#7c3aed" />
                    <stop offset="82%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>

                  {/* Sparkle overlay */}
                  <linearGradient id="sparkleGrad" x1="0" y1="0" x2="1000" y2="0">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.65)" />
                  </linearGradient>

                  {/* Soft glow */}
                  <filter id="galaxyGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Galaxy road base glow */}
                <path
                  d="M140 320
                     C 90 260, 160 170, 270 220
                     C 380 270, 340 120, 465 160
                     C 590 200, 540 330, 670 270
                     C 800 200, 660 150, 745 125
                     C 840 100, 870 190, 935 150"
                  fill="none"
                  stroke="rgba(99,102,241,0.18)"
                  strokeWidth="92"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#galaxyGlow)"
                />

                {/* Galaxy road body */}
                <path
                  ref={pathRef}
                  d="M140 320
                     C 90 260, 160 170, 270 220
                     C 380 270, 340 120, 465 160
                     C 590 200, 540 330, 670 270
                     C 800 200, 660 150, 745 125
                     C 840 100, 870 190, 935 150"
                  fill="none"
                  stroke="url(#galaxyGrad)"
                  strokeWidth="70"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#galaxyGlow)"
                  opacity="0.95"
                />

                {/* Star dust (dotted sparkle line) */}
                <path
                  d="M140 320
                     C 90 260, 160 170, 270 220
                     C 380 270, 340 120, 465 160
                     C 590 200, 540 330, 670 270
                     C 800 200, 660 150, 745 125
                     C 840 100, 870 190, 935 150"
                  fill="none"
                  stroke="url(#sparkleGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 22"
                  opacity="0.85"
                />

                {/* A few sparkle stars (light, not clutter) */}
                {[
                  [210, 250, 1.0],
                  [320, 220, 0.9],
                  [420, 190, 0.8],
                  [520, 220, 0.9],
                  [620, 250, 0.8],
                  [740, 210, 0.9],
                  [860, 160, 1.0],
                ].map(([cx, cy, op], i) => (
                  <circle key={i} cx={cx as number} cy={cy as number} r="4.5" fill="rgba(255,255,255,0.85)" opacity={op as number} />
                ))}
              </svg>
            </div>

            {/* Pins (rotating planets) - positioned absolutely over road */}
            <div
              style={{
                position: "absolute",
                inset: 14,
                pointerEvents: "none",
              }}
            >
              {JOURNEY_STOPS.map((s) => {
                const isActive = s.id === activeId;
                const pos = pinPos[s.id];
                if (!pos) return null;
                return (
                  <div
                    key={s.id}
                    style={{
                      position: "absolute",
                      left: `${pos.xPct}%`,
                      top: `${pos.yPct}%`,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "auto",
                    }}
                  >
                    <RoadPin
                      id={s.id}
                      active={isActive}
                      onClick={() => setActiveId(s.id)}
                      planet={s.planet}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stage buttons (bottom) */}
            <div className="ts-stageRow">
              {JOURNEY_STOPS.map((s) => {
                const on = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={`ts-stageBtn ${on ? "active" : ""}`}
                    aria-label={`Select ${s.id} ${s.title}`}
                    title={s.title}
                  >
                    {s.id}: {s.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Power Tiles */}
          <aside
            style={{
              borderRadius: 22,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              padding: 14,
              boxShadow: "0 14px 30px rgba(2,6,23,0.06)",
              alignSelf: "start",
              position: "sticky",
              top: 90,
              height: "fit-content",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 950, fontSize: 18, color: "#0f172a" }}>
                {active.id}
              </div>
              <StagePill stage={active.stage} />
            </div>

            <div style={{ marginTop: 8, fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
              {active.title}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {/* Power tiles grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
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
                    {active.childCanDo.slice(0, 3).map((x) => (
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
                    {active.teacherFocus.slice(0, 3).map((x) => (
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

              {/* Parent update banner */}
              <div
                style={{
                  borderRadius: 18,
                  padding: "12px 12px",
                  border: "1px solid rgba(15,23,42,0.08)",
                  background:
                    "linear-gradient(90deg, rgba(249,115,22,0.14) 0%, rgba(59,130,246,0.12) 55%, rgba(168,85,247,0.12) 100%)",
                  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 13, color: "#0f172a" }}>📩 Parent Update (Example)</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155" }}>Simple • Clear • Actionable</div>
                </div>
                <div style={{ marginTop: 8, color: "#0f172a", fontSize: 13, lineHeight: 1.5 }}>
                  "{active.parentUpdateExample}"
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#475569", textAlign: "right" }}>
              *In the FREE assessment, we identify the right entry point and share next steps clearly.
            </div>
          </aside>
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
  title: string;
  desc: string;
  route?: string;
  comingSoon?: boolean;
};

type Stage = {
  stageNumber: number;
  stageTitle: string;
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
  tiles: Record<string, TileProgress>;
};

// ============================================================================
// STAGES (mapped to existing routes you already have)
// ============================================================================

const STAGES: Stage[] = [
  {
    stageNumber: 1,
    stageTitle: "Letters & Sounds",
    tiles: [
      {
        title: "Letter Tracing",
        desc: "trace letters (basic)",
        route: "/kids/games/phonics/letter-tracing",
      },
      {
        title: "Letter Tracing + Sounds",
        desc: "trace with sound feedback",
        route: "/kids/games/phonics/letter-tracing-sounds",
      },
      {
        title: "Letter Sounds",
        desc: "letter → sound match",
        route: "/kids/games/phonics/letter-sound",
      },
      {
        title: "Balloon Pop",
        desc: "pop the correct sound",
        route: "/kids/games/phonics/balloon-pop",
      },
      {
        title: "Sound Listening",
        desc: "hear and choose",
        route: "/kids/games/phonics/sound-detective",
      },
    ],
  },
  {
    stageNumber: 2,
    stageTitle: "Build Words",
    tiles: [
      {
        title: "Blend 2 Sounds",
        desc: "slide & join (sa, at…)",
        route: "/kids/games/phonics/my-first-words",
      },
      {
        title: "More Blending",
        desc: "blend builder activities",
        route: "/kids/games/phonics?phase=blend_builder",
      },
      {
        title: "Read Tiny Words",
        desc: "CVC word reader (level 1)",
        route: "/kids/games/phonics/cvc-word-reader",
      },
      {
        title: "Word Families",
        desc: "make-a-word (rimes)",
        route: "/kids/games/phonics?phase=cvc_word_reader",
      },
      { title: "Spelling Practice", desc: "hear → spell", comingSoon: true },
    ],
  },
  {
    stageNumber: 3,
    stageTitle: "Make Sentences",
    tiles: [
      {
        title: "Read Sentences",
        desc: "tap-to-read (guided)",
        route: "/kids/games/phonics/sentence-stepper",
      },
      {
        title: "Early Reader Fluency",
        desc: "sentence packs",
        route: "/kids/games/phonics?phase=early_reader_fluency",
      },
      { title: "Sentence Builder", desc: "put words in order", comingSoon: true },
      { title: "Grammar Fix", desc: "simple corrections", comingSoon: true },
      { title: "Better Sentences", desc: "add describing words", comingSoon: true },
    ],
  },
  {
    stageNumber: 4,
    stageTitle: "Read & Understand",
    tiles: [
      { title: "Fluent Reading", desc: "speed + smooth (calm)", comingSoon: true },
      { title: "Story Reading", desc: "short passages", comingSoon: true },
      { title: "New Words from Reading", desc: "vocab in context", comingSoon: true },
      { title: "Comprehension Questions", desc: "who/what/where/why", comingSoon: true },
      { title: "Summarize Simply", desc: "tell 1–2 lines", comingSoon: true },
    ],
  },
  {
    stageNumber: 5,
    stageTitle: "Speak with Confidence",
    tiles: [
      { title: "Picture Talk", desc: "describe what you see", comingSoon: true },
      { title: "Explain Reasons", desc: "because…", comingSoon: true },
      { title: "Storytelling", desc: "beginning–middle–end", comingSoon: true },
      { title: "Everyday Speaking", desc: "roleplay: shop/school", comingSoon: true },
      { title: "Mixed Practice", desc: "fun review", comingSoon: true },
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

const getTileId = (stageNumber: number, tileTitle: string) => `${stageNumber}:${slugify(tileTitle)}`;

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
// COMPONENT
// ============================================================================

const KidsEnglishExcellence: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get("kidId") || "";

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
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
      const tid = getTileId(currentStage.stageNumber, t.title);
      return acc + (getTileStatus(tid) === "completed" ? 1 : 0);
    }, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, playable, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, store]);

  const overallStats = useMemo(() => {
    const allTiles = STAGES.flatMap((st) => st.tiles.map((t) => getTileId(st.stageNumber, t.title)));
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

  const appendEemMeta = (route: string, tileId: string) => {
    const withKid = appendKidId(route);
    const sep = withKid.includes("?") ? "&" : "?";
    const returnTo = "/kids/games/english-excellence";
    return `${withKid}${sep}eemTile=${encodeURIComponent(tileId)}&eemReturn=${encodeURIComponent(returnTo)}`;
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

    const tileId = getTileId(stageNumber, tile.title);
    const status = getTileStatus(tileId);
    const now = Date.now();

    if (status === "not_started") {
      setTileProgress(tileId, {
        status: "in_progress",
        opens: (store.tiles[tileId]?.opens || 0) + 1,
        firstOpenedAt: now,
        lastOpenedAt: now,
      });

      setPulseTileId(tileId);
      window.setTimeout(() => navigate(appendEemMeta(tile.route!, tileId)), 200);
      return;
    }

    setTileProgress(tileId, {
      opens: (store.tiles[tileId]?.opens || 0) + 1,
      lastOpenedAt: now,
    });

    navigate(appendEemMeta(tile.route, tileId));
  };

  const toggleCompleted = (e: React.MouseEvent, stageNumber: number, tile: Tile) => {
    e.stopPropagation();
    e.preventDefault();
    if (tile.comingSoon) return;

    const tileId = getTileId(stageNumber, tile.title);
    const status = getTileStatus(tileId);
    const now = Date.now();

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

      {/* Back */}
      <Link
        to={`/kids/games${kidId ? `?kidId=${kidId}` : ""}`}
        className="absolute top-6 right-6 px-5 py-2 bg-white/70 backdrop-blur-md border border-slate-900/10 text-slate-900 font-semibold rounded-full shadow-sm hover:bg-white/85 hover:scale-105 transition-all duration-200 z-50"
      >
        ← Back to Games Hub
      </Link>

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
            const locked = tile.comingSoon || !tile.route;
            const tileId = getTileId(currentStage.stageNumber, tile.title);
            const icon = getIcon(tile.title);
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
                key={`${tile.title}-${idx}`}
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
                  <div className="text-base font-extrabold text-slate-900 leading-snug">{tile.title}</div>
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

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(appendKidId("/kids/games/phonics"))}
            className="px-5 py-2.5 rounded-full bg-white/70 border border-slate-900/10 text-slate-800 hover:bg-white/85 transition font-bold shadow-sm"
          >
            Browse Full Phonics Library →
          </button>
        </div>
      </div>
    </div>
  );
};

export default KidsEnglishExcellence;
