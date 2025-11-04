import React from "react";

/**
 * KidsGamesGallery
 * -------------------------------------------------------------
 * SCIENCE‑ALIGNED DESIGN NOTES
 * - Cognitive load: small chunks, clear hierarchy, one skill focus per tile
 * - Retrieval & spacing: daily Smart Review card promotes spaced retrieval
 * - Mastery learning: phase progression by competence, not time
 * - UDL (multiple means): audio support later, visuals, short text, motor‑friendly tap targets
 * - Growth mindset: positive, effort‑focused microcopy; no public leaderboards
 * - Accessibility: WCAG AA contrast; large tap targets; focus outlines; ARIA roles
 * - Privacy: child‑only, private stats (COPPA/GDPR‑K conscious) — no public comparison
 */

// Lightweight progress ring (SVG) -------------------------------------------
function ProgressRing({ size = 60, stroke = 8, value = 0 }: { size?: number; stroke?: number; value?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (val: number) => {
    if (val >= 100) return '#10b981'; // emerald-500
    if (val >= 75) return '#3b82f6';  // blue-500
    if (val >= 50) return '#f59e0b';  // amber-500
    if (val >= 25) return '#f97316';  // orange-500
    return '#ef4444';                  // red-500
  };
  
  return (
    <svg width={size} height={size} className="shrink-0" aria-label={`progress ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-gray-200" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className="fill-none transition-all duration-500"
        stroke={getColor(value)}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="text-xs font-bold fill-gray-700">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// Mini bar (for simple KPI bars) --------------------------------------------
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-gray-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-xs text-gray-700 text-right">{value}%</span>
    </div>
  );
}

// Badge list (for Grammar rules earned) -------------------------------------
function Badge({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// Tiny sparkline (weekly reflections / speaking practice) -------------------
function Sparkline({ points }: { points: number[] }) {
  const width = 120;
  const height = 36;
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * (height - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
      <path d={d} className="fill-none stroke-orange-500" strokeWidth={2} />
    </svg>
  );
}

// Data model (replace with Firestore later) ---------------------------------
const data = {
  phases: [
    {
      id: "p0",
      title: "PHASE 0: Pre‑Phonics & Phonological Awareness",
      ages: "Ages 3–5",
      tagline: "Hear patterns before letters.",
      skills: [
        { name: "Listening", oneLiner: "Hear same vs different sounds.", viz: { type: "ring", value: 65 } },
        { name: "Phonological", oneLiner: "Rhyme, syllables, blending.", viz: { type: "bars", rows: [{ k: "Rhyme", v: 60 }, { k: "Syllables", v: 40 }, { k: "Blend", v: 30 }] } },
      ],
      games: [
        { name: "Rhyme Match", oneLiner: "Find words that rhyme.", progress: 20, difficulty: "Easy", durationMin: 4 },
        { name: "Syllable Claps", oneLiner: "Clap and count beats.", progress: 15, difficulty: "Easy", durationMin: 4 },
        { name: "Sound Detective", oneLiner: "Hear first/last sound.", progress: 10, difficulty: "Easy", durationMin: 5 },
        { name: "Blend & Segment", oneLiner: "Say the word by parts.", progress: 10, difficulty: "Easy", durationMin: 5 },
        { name: "Alliteration Hunt", oneLiner: "Spot same starting sound.", progress: 5, difficulty: "Easy", durationMin: 4 },
      ],
    },
    {
      id: "p1",
      title: "PHASE 1: Early Phonics",
      ages: "Ages 3–6",
      tagline: "Start with simple sounds.",
      skills: [
        { name: "Phonics", oneLiner: "Master letter sounds, blends.", viz: { type: "ring", value: 72 } },
        { name: "Engagement", oneLiner: "Play daily, build streaks.", viz: { type: "bars", rows: [{ k: "Streak", v: 60 }, { k: "Minutes", v: 45 }] } },
      ],
      games: [
        { name: "Listen & Tap (2–4)", oneLiner: "Hear a sound, tap it.", progress: 60, difficulty: "Easy", durationMin: 5, path: "/games/balloon-pop-ipa" },
        { name: "Balloon Pop IPA", oneLiner: "Match phoneme to letter.", progress: 40, difficulty: "Easy", durationMin: 5, path: "/games/balloon-pop-ipa" },
        { name: "Sound Sort", oneLiner: "Sort by starting sound.", progress: 25, difficulty: "Easy", durationMin: 4 },
        { name: "Trace & Say", oneLiner: "Trace letters, say sounds.", progress: 10, difficulty: "Easy", durationMin: 6 },
      ],
    },
    {
      id: "p2",
      title: "PHASE 2: Core Phonics & Rules",
      ages: "Ages 5–7",
      tagline: "Blend, digraphs, key rules.",
      skills: [
        { name: "Phonics", oneLiner: "Blend sounds into words.", viz: { type: "ring", value: 48 } },
        { name: "Phonics Rules", oneLiner: "Apply CK, Floss, Rabbit.", viz: { type: "badges", earned: ["CK", "Floss"], all: ["CK", "Floss", "Rabbit", "Magic‑E"] } },
      ],
      games: [
        { name: "Short Vowel Sounds", oneLiner: "Master a, e, i, o, u separately.", progress: 40, difficulty: "Easy", durationMin: 5 },
        { name: "Blend Builder", oneLiner: "Tap to build CVC words.", progress: 35, difficulty: "Easy", durationMin: 6 },
        { name: "Consonant Blends", oneLiner: "cl, bl, sl, st, sp, sn, sm, sw.", progress: 30, difficulty: "Medium", durationMin: 6 },
        { name: "Digraph Dash", oneLiner: "sh, ch, th, wh, ph.", progress: 20, difficulty: "Medium", durationMin: 6 },
        { name: "Magic‑E Lab", oneLiner: "Make vowels say names.", progress: 10, difficulty: "Medium", durationMin: 6 },
        { name: "Long Vowel Sounds", oneLiner: "Long a, e, i, o, u patterns.", progress: 25, difficulty: "Medium", durationMin: 6 },
        { name: "Vowel Teams", oneLiner: "ai, ee, ea, oa, ue, ie, ei, oe, ay, oi.", progress: 15, difficulty: "Medium", durationMin: 7 },
        { name: "Diphthongs", oneLiner: "ow, ou, oi, oy sounds.", progress: 10, difficulty: "Medium", durationMin: 6 },
        { name: "Y as Vowel", oneLiner: "Y makes short i (gym) & long i (cry).", progress: 5, difficulty: "Medium", durationMin: 5 },
        { name: "Rabbit Rule", oneLiner: "Double consonant practice.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "CK vs K", oneLiner: "Pick correct final spelling.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Floss Rule", oneLiner: "ff, ll, ss endings.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "LE Endings", oneLiner: "candle, bubble, purple, little.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Bossy R", oneLiner: "ar, er, ir, or, ur control vowels.", progress: 8, difficulty: "Medium", durationMin: 6 },
        { name: "Soft C & Hard C", oneLiner: "city vs cat, cent vs cup.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Soft G & Hard G", oneLiner: "gem vs goat, giant vs game.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Silent Letters", oneLiner: "kn (knee), wr (write), mb (lamb).", progress: 0, difficulty: "Hard", durationMin: 6 },
        { name: "Three J Sounds", oneLiner: "j (jump), ge (age), dge (bridge).", progress: 0, difficulty: "Hard", durationMin: 6 },
      ],
    },
    {
      id: "p2b",
      title: "PHASE 2B: Spelling & Orthographic Mapping",
      ages: "Ages 5–8",
      tagline: "Map sounds to spellings.",
      skills: [
        { name: "Spelling", oneLiner: "Build words from sounds.", viz: { type: "ring", value: 30 } },
        { name: "Tricky Words", oneLiner: "Learn non‑decodable words.", viz: { type: "bars", rows: [{ k: "HFW", v: 20 }, { k: "Review", v: 35 }] } },
      ],
      games: [
        { name: "Word Tile Builder", oneLiner: "Drag letters to build.", progress: 10, difficulty: "Easy", durationMin: 6 },
        { name: "Dictation Dojo", oneLiner: "Listen, spell, check.", progress: 5, difficulty: "Medium", durationMin: 6 },
        { name: "Tricky Word Mapper", oneLiner: "Map heart words visually.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "HFW Sprint", oneLiner: "Quick sight‑word recall.", progress: 0, difficulty: "Easy", durationMin: 4 },
      ],
    },
    {
      id: "p3",
      title: "PHASE 3: Vocabulary & Word Power",
      ages: "Ages 5–9",
      tagline: "Grow words by themes.",
      skills: [
        { name: "Vocabulary", oneLiner: "Master words by topics.", viz: { type: "bars", rows: [{ k: "Animals", v: 50 }, { k: "Food", v: 30 }, { k: "Home", v: 20 }] } },
      ],
      games: [
        { name: "SpellBee Trainer", oneLiner: "Meanings, IPA, spellings.", progress: 55, difficulty: "Medium", durationMin: 7, path: "/kids/games/spellbee-flash" },
        { name: "Theme Words", oneLiner: "Animals, food, places, home.", progress: 25, difficulty: "Easy", durationMin: 6 },
        { name: "Synonym Sprint", oneLiner: "Pick stronger word choice.", progress: 10, difficulty: "Medium", durationMin: 5 },
        { name: "Antonym Arcade", oneLiner: "Find the opposite word.", progress: 5, difficulty: "Medium", durationMin: 5 },
        { name: "Collocation Cards", oneLiner: "Words that go together.", progress: 0, difficulty: "Medium", durationMin: 5 },
      ],
    },
    {
      id: "p3b",
      title: "PHASE 3B: Morphology & Word Study",
      ages: "Ages 6–12",
      tagline: "Prefixes, suffixes, roots.",
      skills: [
        { name: "Morphology", oneLiner: "Build words with parts.", viz: { type: "ring", value: 15 } },
      ],
      games: [
        { name: "Affix Factory", oneLiner: "Add un‑, re‑, pre‑, -ful.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Root Builder", oneLiner: "geo, tele, photo basics.", progress: 0, difficulty: "Hard", durationMin: 7 },
        { name: "Compound Combo", oneLiner: "Make new words quickly.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "Syllable Types Quest", oneLiner: "Open/closed, magic‑e, r‑controlled.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Advanced Vowel Teams", oneLiner: "igh, eigh, ough, augh patterns.", progress: 0, difficulty: "Hard", durationMin: 7 },
        { name: "Triple Blends", oneLiner: "scr, spl, str, spr, squ.", progress: 0, difficulty: "Hard", durationMin: 6 },
      ],
    },
    {
      id: "p4",
      title: "PHASE 4: Grammar Galaxy",
      ages: "Ages 6–10",
      tagline: "Rules for clear sentences.",
      skills: [
        { name: "Grammar", oneLiner: "Earn rule achievement badges.", viz: { type: "badges", earned: ["Noun Star", "Verb Voyager"], all: ["Noun Star", "Verb Voyager", "Tense Trek", "Punctuation Pro", "Clause Crafter"] } },
      ],
      games: [
        { name: "Noun Star", oneLiner: "Spot and sort nouns.", progress: 45, difficulty: "Easy", durationMin: 6 },
        { name: "Verb Voyager", oneLiner: "Choose correct verb form.", progress: 30, difficulty: "Medium", durationMin: 6 },
        { name: "Tense Trek", oneLiner: "Past, present, future.", progress: 10, difficulty: "Medium", durationMin: 6 },
        { name: "Punctuation Patrol", oneLiner: "Fix sentence punctuation.", progress: 5, difficulty: "Medium", durationMin: 6 },
        { name: "Preposition Playground", oneLiner: "In, on, under, behind.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "Article Arcade", oneLiner: "a, an, the made simple.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "Clause Crafter", oneLiner: "Join ideas with conjunctions.", progress: 0, difficulty: "Hard", durationMin: 7 },
      ],
    },
    {
      id: "p5",
      title: "PHASE 5: Reading Comprehension",
      ages: "Ages 7–11",
      tagline: "Understand, infer, conclude.",
      skills: [
        { name: "Reading", oneLiner: "Fluency, accuracy, prosody.", viz: { type: "bars", rows: [{ k: "Fluency", v: 30 }, { k: "Accuracy", v: 35 }, { k: "Prosody", v: 20 }] } },
      ],
      games: [
        { name: "Story Quests", oneLiner: "Read, answer, progress bars.", progress: 20, difficulty: "Medium", durationMin: 8 },
        { name: "Inference Detective", oneLiner: "Clues to smart answers.", progress: 10, difficulty: "Medium", durationMin: 7 },
        { name: "Main Idea Maze", oneLiner: "Find central message.", progress: 5, difficulty: "Medium", durationMin: 6 },
        { name: "Nonfiction Explorer", oneLiner: "Charts, captions, features.", progress: 0, difficulty: "Medium", durationMin: 7 },
        { name: "QAR Coach", oneLiner: "Right there vs think & search.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Fluency Lab", oneLiner: "WCPM & expressive reading.", progress: 0, difficulty: "Medium", durationMin: 5 },
      ],
    },
    {
      id: "p6",
      title: "PHASE 6: Speaking & Listening",
      ages: "Ages 6–12",
      tagline: "Clear speech, active listening.",
      skills: [
        { name: "Speaking", oneLiner: "Recordings and confidence score.", viz: { type: "spark", points: [1, 2, 3, 2, 4, 5, 4] } },
        { name: "Listening", oneLiner: "Follow directions, summarize.", viz: { type: "bars", rows: [{ k: "Directions", v: 20 }, { k: "Notes", v: 10 }] } },
      ],
      games: [
        { name: "Pronunciation Coach", oneLiner: "Listen, repeat, get score.", progress: 15, difficulty: "Medium", durationMin: 6 },
        { name: "Prosody Coach", oneLiner: "Stress, rhythm, intonation.", progress: 10, difficulty: "Medium", durationMin: 6 },
        { name: "Dialogue Dojo", oneLiner: "Turn‑taking and eye contact.", progress: 10, difficulty: "Easy", durationMin: 5 },
        { name: "Directions Dash", oneLiner: "Listen, follow multi‑steps.", progress: 5, difficulty: "Medium", durationMin: 6 },
        { name: "Functional Phrases", oneLiner: "Polite everyday English.", progress: 5, difficulty: "Easy", durationMin: 5 },
      ],
    },
    {
      id: "p7",
      title: "PHASE 7: Creative Writing Lab",
      ages: "Ages 8–12",
      tagline: "Plan, draft, improve, publish.",
      skills: [
        { name: "Writing", oneLiner: "Rubric‑based growth timeline.", viz: { type: "bars", rows: [{ k: "Ideas", v: 20 }, { k: "Details", v: 15 }, { k: "Structure", v: 10 }] } },
      ],
      games: [
        { name: "Story Starter Studio", oneLiner: "Prompts spark imagination.", progress: 0, difficulty: "Easy", durationMin: 7 },
        { name: "Picture Prompt", oneLiner: "Describe what you see.", progress: 0, difficulty: "Easy", durationMin: 6 },
        { name: "Paragraph Builder", oneLiner: "Link sentences logically.", progress: 0, difficulty: "Medium", durationMin: 7 },
        { name: "Sentence Workshop", oneLiner: "Fix, expand, combine.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Revision Station", oneLiner: "Edit and polish writing.", progress: 0, difficulty: "Medium", durationMin: 6 },
      ],
    },
    {
      id: "p8",
      title: "PHASE 8: Cognitive Skills & Strategy",
      ages: "Ages 6–12",
      tagline: "Boost memory, focus, sequencing.",
      skills: [
        { name: "Working Memory", oneLiner: "Hold and use information.", viz: { type: "ring", value: 10 } },
        { name: "Attention & Focus", oneLiner: "Stay on task, fewer slips.", viz: { type: "bars", rows: [{ k: "Focus", v: 20 }, { k: "Accuracy", v: 25 }] } },
        { name: "Sequencing", oneLiner: "Order steps logically.", viz: { type: "bars", rows: [{ k: "Order", v: 15 }, { k: "Recall", v: 15 }] } },
      ],
      games: [
        { name: "Sound Span", oneLiner: "Hear sequence, tap repeat.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Sentence Sequencer", oneLiner: "Order parts to make sense.", progress: 0, difficulty: "Medium", durationMin: 6 },
        { name: "Pattern Pathways", oneLiner: "Find next in pattern.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Category Sorter", oneLiner: "Group by rule quickly.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "Word Memory Pairs", oneLiner: "Flip cards, find matches.", progress: 0, difficulty: "Easy", durationMin: 5 },
        { name: "Logic Riddles", oneLiner: "Pick answer using clues.", progress: 0, difficulty: "Hard", durationMin: 7 },
      ],
    },
    {
      id: "p9",
      title: "PHASE 9: Mastery Revision & Showcase",
      ages: "Ages 6–12",
      tagline: "Revise, reflect, celebrate growth.",
      skills: [
        { name: "Revision", oneLiner: "Coverage across all phases.", viz: { type: "bars", rows: [{ k: "P1–3", v: 70 }, { k: "P4–6", v: 40 }, { k: "P7–8", v: 20 }] } },
        { name: "Portfolio", oneLiner: "Best work compiled neatly.", viz: { type: "ring", value: 0 } },
        { name: "Confidence", oneLiner: "Self‑rating trend line.", viz: { type: "spark", points: [2, 3, 3, 4, 5] } },
      ],
      games: [
        { name: "Grand Review Quest", oneLiner: "Mixed rounds from all phases.", progress: 0, difficulty: "Medium", durationMin: 8 },
        { name: "Boss Battle Mix", oneLiner: "Beat 80% mastery targets.", progress: 0, difficulty: "Medium", durationMin: 7 },
        { name: "Fluency Booth", oneLiner: "Read aloud, get WCPM.", progress: 0, difficulty: "Medium", durationMin: 5 },
        { name: "Speech Spotlight", oneLiner: "Record 60‑second talk.", progress: 0, difficulty: "Easy", durationMin: 6 },
        { name: "Writing Publish", oneLiner: "Export rubric‑scored PDF.", progress: 0, difficulty: "Medium", durationMin: 8 },
        { name: "Showcase Reel", oneLiner: "Auto‑cut highlights to video.", progress: 0, difficulty: "Easy", durationMin: 6 },
        { name: "Certificate Maker", oneLiner: "Earn and download certificate.", progress: 0, difficulty: "Easy", durationMin: 3 },
      ],
    },
  ],
};

// Helpers -------------------------------------------------------------------
function SkillTile({ name, oneLiner, viz }: { name: string; oneLiner: string; viz: any }) {
  return (
    <div className="rounded-2xl bg-white/80 shadow-sm ring-1 ring-gray-100 p-4 flex items-center gap-4" role="listitem">
      <div className="w-16">{
        viz?.type === "ring" ? (
          <ProgressRing value={viz.value ?? 0} />
        ) : viz?.type === "bars" ? (
          <div className="space-y-2 w-40">
            {viz.rows?.slice(0, 3).map((r: any) => (
              <Bar key={r.k} label={r.k} value={r.v} />
            ))}
          </div>
        ) : viz?.type === "badges" ? (
          <div className="flex flex-col gap-2 w-40">
            <div className="flex flex-wrap gap-1">
              {viz.all?.map((b: string) => (
                <Badge key={b} active={viz.earned?.includes(b)}>{b}</Badge>
              ))}
            </div>
          </div>
        ) : viz?.type === "spark" ? (
          <div className="w-40"><Sparkline points={viz.points ?? [0]} /></div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100" />
        )
      }</div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
        <p className="text-sm text-gray-500 line-clamp-1">{oneLiner}</p>
      </div>
    </div>
  );
}

function GameTile({ name, oneLiner, progress, difficulty, durationMin, parentView, href }: { name: string; oneLiner: string; progress: number; difficulty?: "Easy"|"Medium"|"Hard"; durationMin?: number; parentView?: boolean; href?: string }) {
  const diff = difficulty || "Easy";
  const mins = durationMin || 5;
  
  const difficultyColors = {
    Easy: 'bg-[#b8f5d0] text-emerald-800 border-emerald-300',
    Medium: 'bg-[#ffa94d] text-orange-900 border-orange-300',
    Hard: 'bg-[#ffd7d7] text-rose-800 border-rose-300'
  };
  
  return (
    <div className="rounded-2xl bg-white shadow-xl ring-2 ring-orange-200 p-4 hover:shadow-2xl hover:ring-orange-400 transition-all duration-200 border-t-4 border-t-[#6ec1e4]" role="listitem" aria-label={name}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600 line-clamp-1">{oneLiner}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-bold border-2 ${difficultyColors[diff]}`}>{diff}</span>
            <span className="inline-flex items-center rounded-full bg-[#6ec1e4] text-white border-2 border-sky-300 px-2.5 py-1 font-bold">⏱ {mins} min</span>
            {parentView ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">Artefacts</span>
            ) : null}
          </div>
        </div>
        <ProgressRing size={52} stroke={7} value={progress} />
      </div>
      <div className="mt-3 h-3 w-full bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300" aria-label="progress bar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-gradient-to-r from-[#ffa94d] to-[#6ec1e4]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {parentView ? (
          <>
            <button className="text-xs underline text-orange-700 hover:text-orange-800 font-bold" aria-label="View artefacts">View artefacts</button>
            <button className="text-xs underline text-orange-700 hover:text-orange-800 font-bold" aria-label="Download evidence">Download</button>
          </>
        ) : (
          <a href={href || '#'} className="text-xs rounded-full bg-gradient-to-r from-[#ffa94d] to-[#6ec1e4] text-white font-bold px-4 py-2 hover:from-[#ff8833] hover:to-[#4a9fd8] shadow-lg hover:shadow-xl transition-all border-2 border-white" aria-label={`Play ${name}`}>▶ Play</a>
        )}
      </div>
    </div>
  );
}

// Phase section with collapsible content ---------------------------------------
function PhaseSection({ phase, parentView }: { phase: (typeof data.phases)[number]; parentView: boolean }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Color schemes using brand colors
  const phaseColors = [
    { gradient: 'from-[#ffa94d] to-[#ff8833]', bg: 'bg-orange-50', ring: 'ring-orange-300', button: 'bg-orange-100 text-orange-700 hover:bg-orange-200', text: 'text-orange-600' },
    { gradient: 'from-[#ff8833] to-[#ff6b6b]', bg: 'bg-orange-50', ring: 'ring-orange-300', button: 'bg-orange-100 text-orange-700 hover:bg-orange-200', text: 'text-orange-600' },
    { gradient: 'from-[#6ec1e4] to-[#4a9fd8]', bg: 'bg-sky-50', ring: 'ring-sky-300', button: 'bg-sky-100 text-sky-700 hover:bg-sky-200', text: 'text-sky-600' },
    { gradient: 'from-[#4a9fd8] to-[#3b7fc4]', bg: 'bg-blue-50', ring: 'ring-blue-300', button: 'bg-blue-100 text-blue-700 hover:bg-blue-200', text: 'text-blue-600' },
    { gradient: 'from-[#b8f5d0] to-[#7de3ad]', bg: 'bg-emerald-50', ring: 'ring-emerald-300', button: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', text: 'text-emerald-600' },
    { gradient: 'from-[#ffa94d] to-[#6ec1e4]', bg: 'bg-gradient-to-br from-orange-50 to-sky-50', ring: 'ring-orange-300', button: 'bg-orange-100 text-orange-700 hover:bg-orange-200', text: 'text-orange-600' },
    { gradient: 'from-[#ff6b6b] to-[#ffa94d]', bg: 'bg-rose-50', ring: 'ring-rose-300', button: 'bg-rose-100 text-rose-700 hover:bg-rose-200', text: 'text-rose-600' },
    { gradient: 'from-[#6ec1e4] to-[#b8f5d0]', bg: 'bg-cyan-50', ring: 'ring-cyan-300', button: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200', text: 'text-cyan-600' },
    { gradient: 'from-[#ffd7d7] to-[#ffa94d]', bg: 'bg-rose-50', ring: 'ring-rose-300', button: 'bg-rose-100 text-rose-700 hover:bg-rose-200', text: 'text-rose-600' },
    { gradient: 'from-[#b8f5d0] to-[#6ec1e4]', bg: 'bg-teal-50', ring: 'ring-teal-300', button: 'bg-teal-100 text-teal-700 hover:bg-teal-200', text: 'text-teal-600' },
  ];
  
  const phaseIndex = parseInt(phase.id.replace('p', '').replace('b', '')) % phaseColors.length;
  const colors = phaseColors[phaseIndex];
  
  // Calculate phase stats
  const totalGames = phase.games.length;
  const completedGames = phase.games.filter((g: any) => g.progress >= 100).length;
  const inProgressGames = phase.games.filter((g: any) => g.progress > 0 && g.progress < 100).length;
  const avgProgress = Math.round(phase.games.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / totalGames);

  return (
    <section className="space-y-4 transition-all duration-300">
      {/* Header with toggle */}
      <div 
        id={phase.id} 
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer group rounded-2xl ${colors.bg} p-4 border-2 ${colors.ring} hover:shadow-xl transition-all duration-200`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              className={`flex items-center justify-center w-12 h-12 rounded-full ${colors.button} transition-all duration-200 group-hover:scale-110 shadow-lg`}
              aria-label={isExpanded ? "Collapse phase" : "Expand phase"}
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{phase.title}</h2>
              <p className="text-sm text-gray-600 font-medium">{phase.ages} • {phase.tagline}</p>
            </div>
          </div>
        </div>
        <a 
          href="#top" 
          className={`text-sm font-bold ${colors.text} hover:underline`}
          onClick={(e) => e.stopPropagation()}
        >
          ↑ Back to top
        </a>
      </div>

      {/* Dashboard view - always visible */}
      <div className={`rounded-2xl bg-gradient-to-br from-white ${colors.bg} shadow-xl ring-2 ${colors.ring} p-6`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center bg-white rounded-xl p-3 shadow-md border-2 border-orange-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#ffa94d]">{totalGames}</div>
            <div className="text-xs text-gray-600 mt-1 font-bold">Total Games</div>
          </div>
          <div className="text-center bg-white rounded-xl p-3 shadow-md border-2 border-emerald-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#b8f5d0]" style={{ WebkitTextStroke: '1px #10b981' }}>{completedGames}</div>
            <div className="text-xs text-gray-600 mt-1 font-bold">Completed</div>
          </div>
          <div className="text-center bg-white rounded-xl p-3 shadow-md border-2 border-rose-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#ffd7d7]" style={{ WebkitTextStroke: '1px #f43f5e' }}>{inProgressGames}</div>
            <div className="text-xs text-gray-600 mt-1 font-bold">In Progress</div>
          </div>
          <div className="text-center bg-white rounded-xl p-3 shadow-md border-2 border-sky-200">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#6ec1e4]">{avgProgress}%</div>
            <div className="text-xs text-gray-600 mt-1 font-bold">Avg Progress</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-5">
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner border-2 border-gray-300">
            <div 
              className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 shadow-lg`}
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        {/* Key insights */}
        <div className="mt-4 flex flex-wrap gap-2">
          {phase.skills?.slice(0, 3).map((skill) => (
            <span 
              key={skill.name}
              className={`inline-flex items-center rounded-full bg-gradient-to-r ${colors.gradient} px-4 py-1.5 text-xs font-bold text-white shadow-lg border-2 border-white`}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Collapsible content */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-4 pt-2">
          {/* Skills snapshot */}
          {phase.skills?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list">
              {phase.skills.map((s) => (
                <SkillTile key={s.name} name={s.name} oneLiner={s.oneLiner} viz={(s as any).viz} />
              ))}
            </div>
          ) : null}

          {/* Games grid */}
          <div className="mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Games in this phase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" role="list">
              {phase.games.map((g) => (
                <GameTile
                  key={g.name}
                  name={g.name}
                  oneLiner={g.oneLiner}
                  progress={(g as any).progress ?? 0}
                  difficulty={(g as any).difficulty}
                  durationMin={(g as any).durationMin}
                  parentView={parentView}
                  href={(g as any).path || '#'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Top chips navigation with smooth scroll ---------------------------------------
function PhaseChips({ phases }: { phases: typeof data.phases }) {
  const colors = [
    'from-[#ffa94d] to-[#ff8833]',      // Sunset orange warm
    'from-[#ff8833] to-[#ff6b6b]',      // Orange to coral
    'from-[#6ec1e4] to-[#4a9fd8]',      // Sky blue cool
    'from-[#4a9fd8] to-[#3b7fc4]',      // Deep sky blue
    'from-[#b8f5d0] to-[#7de3ad]',      // Mint fresh
    'from-[#ffa94d] to-[#6ec1e4]',      // Brand gradient (orange to blue)
    'from-[#ff6b6b] to-[#ffa94d]',      // Coral to orange
    'from-[#6ec1e4] to-[#b8f5d0]',      // Blue to mint
    'from-[#ffd7d7] to-[#ffa94d]',      // Rose to orange
    'from-[#b8f5d0] to-[#6ec1e4]',      // Mint to blue
  ];

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, phaseId: string) => {
    e.preventDefault();
    const element = document.getElementById(phaseId);
    if (element) {
      const yOffset = -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-sky-100/95 via-orange-50/90 to-transparent backdrop-blur-sm py-3 -mx-4 px-4 shadow-sm">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="navigation" aria-label="Phase shortcuts">
        {phases.map((p, idx) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            onClick={(e) => handleClick(e, p.id)}
            className={`whitespace-nowrap rounded-full bg-gradient-to-r ${colors[idx % colors.length]} text-white font-bold hover:scale-105 shadow-lg hover:shadow-xl px-4 py-2 text-sm transition-all duration-200`}
          >
            {p.title.replace("PHASE ", "P").split(":")[0]}<span className="opacity-90 hidden sm:inline"> · {p.ages}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Smart Review (Spaced retrieval) -------------------------------------------
function SmartReviewToday() {
  // Placeholder: wire this to your spaced-review engine later
  const items = [
    { label: "Revise sounds", detail: "s, a, t", eta: "2–3 min" },
    { label: "Blend set", detail: "CVC: at, ap", eta: "2–3 min" },
    { label: "Tricky words", detail: "the, to", eta: "1–2 min" },
  ];
  return (
    <section aria-labelledby="smart-review-title" className="rounded-3xl bg-gradient-to-br from-[#6ec1e4] to-[#4a9fd8] shadow-xl ring-2 ring-sky-300 p-6">
      <div className="flex items-center justify-between">
        <h3 id="smart-review-title" className="text-lg font-bold text-white drop-shadow">⚡ Today's Smart Review</h3>
        <span className="text-xs text-white/90 font-semibold">Short, spaced, brain-friendly</span>
      </div>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <li key={it.label} className="rounded-2xl bg-white backdrop-blur px-4 py-3 shadow-lg hover:shadow-xl transition-shadow border-2 border-sky-200" aria-label={`${it.label}: ${it.detail}, ${it.eta}`}>
            <div className="text-sm font-bold text-gray-800">{it.label}</div>
            <div className="text-xs text-gray-600 mt-1">{it.detail} • {it.eta}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Parent toolbar + actions ---------------------------------------------------
function ParentToolbar({ studentId, parentDefault }: { studentId: string; parentDefault?: boolean }) {
  const [parentView, setParentView] = React.useState(!!parentDefault);
  React.useEffect(() => {
    const ev = new CustomEvent('parentview:change', { detail: { parentView } });
    window.dispatchEvent(ev);
  }, [parentView]);

  async function exportCertificate() {
    // TODO: Install jspdf package: npm install jspdf
    alert(`Certificate export coming soon for ${studentId}!`);
    console.log('TODO: Implement PDF export with jspdf package');
  }

  async function buildShowcaseReel() {
    const storyboard = {
      studentId,
      createdAt: new Date().toISOString(),
      scenes: [
        { type: 'title', text: 'My Tiny Steps Showcase', duration: 2.5 },
        { type: 'clip', label: 'Speech Spotlight', src: 'recordings/speech-latest.mp3', duration: 10 },
        { type: 'metric', text: 'Reading Fluency: 72 WCPM', duration: 2.5 },
        { type: 'badge', text: 'Noun Star • Verb Voyager', duration: 2.5 },
        { type: 'gallery', images: ['writing-1.png', 'writing-2.png'], duration: 4 },
        { type: 'outro', text: 'Proud of my progress!', duration: 2.5 },
      ],
    };
    const file = new Blob([JSON.stringify(storyboard, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `${studentId}-showcase-reel-storyboard.json`;
    a.click();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" checked={parentView} onChange={(e) => setParentView(e.target.checked)} />
        <span className="text-gray-700">Parent View</span>
      </label>
      <button onClick={exportCertificate} className="rounded-full bg-emerald-600 text-white text-sm px-3 py-1.5 hover:bg-emerald-700">Export Certificate (PDF)</button>
      <button onClick={buildShowcaseReel} className="rounded-full bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700">Build Showcase Reel</button>
    </div>
  );
}

// Personalized Grand Review --------------------------------------------------
function GrandReviewCard({ studentId }: { studentId: string }) {
  const recs = useWeakestKPIs(studentId);
  return (
    <section className="mt-4 rounded-3xl bg-gradient-to-br from-[#ffa94d] to-[#ff8833] shadow-xl ring-2 ring-orange-300 p-6" aria-labelledby="grand-review-title">
      <div className="flex items-center justify-between">
        <h3 id="grand-review-title" className="text-lg font-bold text-white drop-shadow">🎯 Personalized Grand Review</h3>
        <a href="#p9" className="text-xs text-white/90 font-semibold hover:underline">Go to Phase 9 →</a>
      </div>
      <p className="mt-1 text-sm text-white/90 font-medium">Auto-selects weak skills from Firestore to build today's review.</p>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recs.map((r) => (
          <li key={r.key} className="rounded-2xl bg-white backdrop-blur px-4 py-3 shadow-lg border-2 border-orange-200">
            <div className="text-sm font-bold text-gray-800">{r.title}</div>
            <div className="text-xs text-gray-600 mt-1">→ {r.suggestedGame} • {r.phase}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Firestore hooks (read-only demo) ------------------------------------------
function useWeakestKPIs(_studentId: string) {
  // TODO: replace with Firestore reads from /students/{id}/progress/*
  return [
    { key: 'phonics:digraphs', title: 'Digraphs (sh/ch/th)', suggestedGame: 'Digraph Dash', phase: 'P2' },
    { key: 'reading:inference', title: 'Reading — Inference', suggestedGame: 'Inference Detective', phase: 'P5' },
    { key: 'speaking:prosody', title: 'Speaking — Prosody', suggestedGame: 'Prosody Coach', phase: 'P6' },
  ];
}

// Page shell ----------------------------------------------------------------
export default function KidsGamesGallery({ studentId = 'demo-student', parentDefault = false }: { studentId?: string; parentDefault?: boolean }) {
  const [parentView, setParentView] = React.useState(!!parentDefault);
  
  React.useEffect(() => {
    function handler(e: any) { setParentView(!!e.detail?.parentView); }
    window.addEventListener('parentview:change', handler);
    return () => window.removeEventListener('parentview:change', handler);
  }, []);

  // Smooth scroll behavior
  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-gradient-to-br from-sky-100 via-orange-50 to-rose-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Hero */}
        <header className="mb-6 sm:mb-8 bg-gradient-to-r from-[#6ec1e4] to-[#ffa94d] rounded-3xl p-6 shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">🎮 Kids Zone · Games Gallery</h1>
          <p className="mt-2 text-base text-white/90">Designed with child‑development best practices: short rounds (3–7 min), gentle visuals, immediate feedback, and mastery‑based progression.</p>
          <ParentToolbar studentId={studentId} parentDefault={parentDefault} />
        </header>

        {/* Phase chips */}
        <PhaseChips phases={data.phases} />
        {/* Smart Review (spaced retrieval) */}
        <div className="mt-4">
          <SmartReviewToday />
          <GrandReviewCard studentId={studentId} />
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-6">
          {data.phases.map((ph) => (
            <PhaseSection key={ph.id} phase={ph} parentView={parentView} />
          ))}
        </div>
      </div>
    </div>
  );
}
