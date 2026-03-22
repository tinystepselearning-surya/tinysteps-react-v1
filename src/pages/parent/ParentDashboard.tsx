// src/pages/parent/ParentDashboard.tsx
import React, { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import { useAuthStore } from "../../store/useAuthStore";
import { db, auth } from "../../lib/firebaseConfig";

import { ParentGamesProgress } from "./components/progress/ParentGamesProgress";
import { ParentOverviewCards } from "./components/overview/ParentOverviewCards";
import ChildSkillRatingCard from "../../components/progress/ChildSkillRatingCard";
import {
  CheckCircle2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CircleUser,
  CreditCard,
  ExternalLink,
  Gamepad2,
  Home,
  LogOut,
  Menu,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TinyStepsBrand from "../../components/common/TinyStepsBrand";
import MobileTabBar, { type MobileTabBarItem } from "../../components/common/MobileTabBar";
import HolidayCalendar2026 from "../../components/common/HolidayCalendar2026";
 
import { masteryKeyFromValue, masteryLabel, masteryPctFromKey, type MasteryKey } from "../../lib/mastery";
import {
  SKILL_RATING_MAX,
  normalizeProgressRatings,
  normalizeProgressSkillsMeta,
  skillRatingLegendLabel,
  summarizeProgressRatings,
} from "../../lib/skillRatings";
import { getProgressSkillsForLesson } from "../../lib/progressSkills";

type TabKey =
  | "dashboard"
  | "insights"
  | "games-progress"
  | "skills"
  | "classes"
  | "holidays"
  | "profile"
  | "payments";

type ParentNavItem = {
  id: TabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const parentNavItems: ParentNavItem[] = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "games-progress", label: "Games Progress", icon: Gamepad2 },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "classes", label: "Classes", icon: CalendarDays },
  { id: "holidays", label: "Holiday Calendar", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const PARENT_MOBILE_TABS: MobileTabBarItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "classes", label: "Classes", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "games-progress", label: "Games", icon: Gamepad2 },
];

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = [
    "dashboard",
    "insights",
    "games-progress",
    "skills",
    "classes",
    "holidays",
    "profile",
    "payments",
  ];
  if (value === "weekly") return "insights";
  if (value === "reports") return "dashboard";
  return validTabs.includes(value as TabKey) ? (value as TabKey) : "dashboard";
}

type KidSession = {
  id: string;
  status?: string;
  date?: any; // string 'YYYY-MM-DD' or Timestamp
  startTime?: string; // 'HH:MM'
  endTime?: string; // 'HH:MM'
  startAt?: any; // Timestamp
  endAt?: any; // Timestamp
  courseName?: string;
  courseId?: string;
  teacherName?: string;
  teacherId?: string;
  joinUrl?: string;
  kidId?: string;
  kidIds?: string[];
  [key: string]: any;
};

type BillingCharge = {
  id: string;
  amount?: number;
  paidAmount?: number;
  status?: string;
  createdAt?: any;
  currency?: string;
  [key: string]: any;
};

type ParentPaymentRecord = {
  id: string;
  amount?: number;
  appliedAmount?: number;
  unappliedAmount?: number;
  method?: string;
  status?: string;
  paidAt?: any;
  createdAt?: any;
  kidId?: string;
  enrollmentId?: string;
  [key: string]: any;
};

type Enrollment = {
  id: string;
  parentId?: string;
  kidId?: string;
  kidIds?: string[];
  studentId?: string;
  teacherId?: string;
  teacherUid?: string;
  teacherUserId?: string;
  courseId?: string;
  courseName?: string;
  courseLabel?: string;
  course?: { area?: string };
  courseArea?: string;
  area?: string;
  status?: string;
  enrollmentDate?: any;
  startDate?: any;
  ratePerSession?: number;
  feePerClass?: number;
  feePerSession?: number;
  [key: string]: any;
};

type ParentClassRecording = {
  id: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  recordingUrl?: string;
  folderName?: string;
  folderUrl?: string;
  sourceType?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
};

const chunkIds = <T,>(items: T[], size = 10): T[][] => {
  if (!items.length) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const PHONICS_COURSE_IDS = [
  "phonics-foundations",
  "early-phonics",
  "advanced-phonics",
];

const CANONICAL_GAME_ID_ALIASES: Record<string, string> = {
  "letter-sound-match": "letter-sound-match",
  phonics_letter_sound: "letter-sound-match",
  phonics_letter_sound_match: "letter-sound-match",
  "balloon-pop": "balloon-pop",
  phonics_balloon_pop: "balloon-pop",
  "sound-detective": "sound-detective",
  phonics_sound_detective: "sound-detective",
  "letter-tracing": "letter-tracing",
  phonics_letter_tracing: "letter-tracing",
  "letter-tracing-sounds": "letter-tracing-sounds",
  phonics_letter_tracing_sounds: "letter-tracing-sounds",
  "my-first-words": "my-first-words",
  my_first_words_v1: "my-first-words",
  my_first_words: "my-first-words",
  phonics_my_first_words: "my-first-words",
  "cvc-word-builder": "cvc-word-builder",
  cvc_word_reader_v1: "cvc-word-builder",
  cvc_word_reader: "cvc-word-builder",
  "cvc-word-reader": "cvc-word-builder",
  "spelling-practice": "cvc-word-builder",
  "make-a-word-rime": "cvc-word-builder",
  phonics_cvc_word_reader: "cvc-word-builder",
  phonics_spelling_practice: "cvc-word-builder",
  phonics_cvc_word_builder: "cvc-word-builder",
};

const canonicalizeParentGameId = (value?: string | null): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return CANONICAL_GAME_ID_ALIASES[raw] || raw;
};

function millisFromUnknownTimestamp(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof (value as any)?.toDate === "function") {
    const dt = (value as any).toDate();
    return dt instanceof Date && !Number.isNaN(dt.getTime()) ? dt.getTime() : 0;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getTime();
  if (typeof value === "string") {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
  }
  return 0;
}

function latestTimestampFromMap(map: Record<string, any> | null | undefined): number {
  if (!map || typeof map !== "object") return 0;
  let latest = 0;
  Object.values(map).forEach((doc: any) => {
    if (!doc || typeof doc !== "object") return;
    latest = Math.max(
      latest,
      millisFromUnknownTimestamp(doc.updatedAt),
      millisFromUnknownTimestamp(doc.lastPlayedAt),
      millisFromUnknownTimestamp(doc.completedAt),
      millisFromUnknownTimestamp(doc.lastSeenAt),
    );
  });
  return latest;
}

function latestTimestampFromGameSummariesMap(
  map: Record<string, any> | null | undefined,
): number {
  if (!map || typeof map !== "object") return 0;
  let latest = 0;
  Object.entries(map).forEach(([docId, doc]) => {
    // Games refresh freshness must ignore __overview rollup updates.
    if (docId === "__overview") return;
    if (!doc || typeof doc !== "object") return;
    latest = Math.max(
      latest,
      millisFromUnknownTimestamp((doc as any).updatedAt),
      millisFromUnknownTimestamp((doc as any).lastPlayedAt),
      millisFromUnknownTimestamp((doc as any).completedAt),
      millisFromUnknownTimestamp((doc as any).lastSeenAt),
    );
  });
  return latest;
}

function latestTimestampFromKidSummary(kidSummary: any): number {
  if (!kidSummary || typeof kidSummary !== "object") return 0;
  const summary = kidSummary?.summary || {};
  const progress = kidSummary?.progress || {};
  const summaryGames = summary?.games || {};
  const byGame = progress?.byGame || {};
  return Math.max(
    millisFromUnknownTimestamp(summary?.lastUpdatedAt),
    millisFromUnknownTimestamp(summary?.updatedAt),
    millisFromUnknownTimestamp(summary?.lastPlayedAt),
    latestTimestampFromMap(summaryGames),
    latestTimestampFromMap(byGame),
  );
}

function latestTimestampFromActivityHead(activityHead: any): number {
  if (!activityHead || typeof activityHead !== "object") return 0;
  return Math.max(
    millisFromUnknownTimestamp(activityHead.lastGameUpdateAt),
    millisFromUnknownTimestamp(activityHead.lastPlayedAt),
    millisFromUnknownTimestamp(activityHead.updatedAt),
  );
}

function latestCanonicalGamesTimestamp(
  gameSummaries: Record<string, any> | null | undefined,
  gameProgress: Record<string, any> | null | undefined,
): number {
  // Shared canonical freshness for overview surfaces; __overview is intentionally included here.
  return Math.max(
    latestTimestampFromMap(gameSummaries),
    latestTimestampFromMap(gameProgress),
  );
}

function latestCanonicalGameDocsTimestamp(
  gameSummaries: Record<string, any> | null | undefined,
  gameProgress: Record<string, any> | null | undefined,
): number {
  return Math.max(
    latestTimestampFromGameSummariesMap(gameSummaries),
    latestTimestampFromMap(gameProgress),
  );
}

function latestGamesFreshnessSignal({
  gameSummaries,
  gameProgress,
  kidSummary,
}: {
  gameSummaries: Record<string, any> | null | undefined;
  gameProgress: Record<string, any> | null | undefined;
  kidSummary: any;
}): number {
  const canonicalTs = latestCanonicalGameDocsTimestamp(gameSummaries, gameProgress);
  if (canonicalTs > 0) return canonicalTs;
  return latestTimestampFromKidSummary(kidSummary);
}

function toCountMaybe(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return null;
}

function resolveLevelsCompleted(value: Record<string, any> | null | undefined): number | null {
  if (!value || typeof value !== "object") return null;
  const candidates = [
    toCountMaybe(value.levelsCompleted),
    toCountMaybe(value.completedLevelCount),
    toCountMaybe(value.completedLevels),
    toCountMaybe(value.completedItems),
    toCountMaybe(value.masteredCount),
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number") return candidate;
  }
  return null;
}

function resolveTimeSpentMs(value: Record<string, any> | null | undefined): number | null {
  if (!value || typeof value !== "object") return null;
  const msCandidates = [
    value.totalTimeSpentMs,
    value.timeSpentMs,
    value.totalTimeMs,
    value.durationMs,
  ];
  for (const candidate of msCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return Math.max(0, Math.floor(candidate));
    }
  }

  const secCandidates = [value.timeSpentSec, value.durationSec];
  for (const candidate of secCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return Math.max(0, Math.floor(candidate * 1000));
    }
  }
  return null;
}

function sumTimeSpentFromCanonical(
  gameSummaries: Record<string, any> | null | undefined,
  gameProgress: Record<string, any> | null | undefined,
): number | null {
  const summaryMap = gameSummaries || {};
  const progressMap = gameProgress || {};
  const summaryEntries = Object.entries(summaryMap).filter(([docId]) => docId !== "__overview");
  const hasCanonicalData =
    summaryEntries.length > 0 || Object.keys(progressMap).length > 0;
  if (!hasCanonicalData) return null;

  const perGameMax = new Map<string, number>();
  const ingest = (docId: string, row: any) => {
    if (!row || typeof row !== "object") return;
    const canonicalId = canonicalizeParentGameId(
      String(row.gameId || row.progressDocId || docId || ""),
    );
    if (!canonicalId) return;
    const timeSpentMs = resolveTimeSpentMs(row);
    if (typeof timeSpentMs !== "number" || timeSpentMs <= 0) return;
    perGameMax.set(canonicalId, Math.max(perGameMax.get(canonicalId) || 0, timeSpentMs));
  };

  summaryEntries.forEach(([docId, row]) => ingest(docId, row));
  Object.entries(progressMap).forEach(([docId, row]) => ingest(docId, row));

  const total = Array.from(perGameMax.values()).reduce((sum, value) => sum + value, 0);
  return total > 0 ? total : 0;
}

function countCompletedGamesFromCanonical(
  gameSummaries: Record<string, any> | null | undefined,
  gameProgress: Record<string, any> | null | undefined,
): number | null {
  const summaryMap = gameSummaries || {};
  const progressMap = gameProgress || {};
  // __overview is aggregate-only metadata and must not count as a completed game.
  const summaryEntries = Object.entries(summaryMap).filter(([docId]) => docId !== "__overview");
  const hasCanonicalData =
    summaryEntries.length > 0 || Object.keys(progressMap).length > 0;
  if (!hasCanonicalData) return null;

  const completedByGame = new Map<string, number>();
  const ingest = (docId: string, row: any) => {
    if (!row || typeof row !== "object") return;
    const canonicalId = canonicalizeParentGameId(
      String(row.gameId || row.progressDocId || docId || ""),
    );
    if (!canonicalId) return;
    const completed = resolveLevelsCompleted(row);
    if (typeof completed !== "number") return;
    completedByGame.set(canonicalId, Math.max(completedByGame.get(canonicalId) || 0, completed));
  };

  summaryEntries.forEach(([docId, row]) => ingest(docId, row));
  Object.entries(progressMap).forEach(([docId, row]) => ingest(docId, row));

  return Array.from(completedByGame.values()).filter((value) => value > 0).length;
}

function hasGamesSummaryCoverageGaps(
  summaryMap: Record<string, any> | null | undefined,
  catalogGames: any[] | null | undefined,
): boolean {
  const safeCatalog = Array.isArray(catalogGames) ? catalogGames : [];
  if (safeCatalog.length === 0) return false;

  const expectedGameIds = new Set(
    safeCatalog
      .map((game: any) => canonicalizeParentGameId(game?.id))
      .filter(Boolean),
  );
  if (expectedGameIds.size === 0) return false;

  const safeSummaryMap = summaryMap || {};
  const coveredGameIds = new Set<string>();
  Object.entries(safeSummaryMap).forEach(([docId, data]) => {
    // Coverage checks are game-doc-only; __overview should never satisfy catalog coverage.
    if (docId === "__overview") return;
    const row = (data || {}) as Record<string, any>;
    const candidates = [
      canonicalizeParentGameId(docId),
      canonicalizeParentGameId(String(row.gameId || "")),
      canonicalizeParentGameId(String(row.progressDocId || "")),
    ].filter(Boolean);
    candidates.forEach((id) => coveredGameIds.add(id));
  });

  for (const gameId of expectedGameIds) {
    if (!coveredGameIds.has(gameId)) return true;
  }
  return false;
}

function mapJourneyStageIdForDisplay(
  stageId: number | null | undefined,
  stageProgressPct: number | null | undefined,
): number | null {
  if (typeof stageId !== "number" || !Number.isFinite(stageId)) return null;
  const rounded = Math.round(stageId);
  if (rounded >= 1 && rounded <= 5) return rounded;
  // Temporary UI compatibility: legacy model tops out at stage 6.
  // Treat fully completed legacy stage 6 as display stage 7 (Review & Championship).
  if (rounded === 6) {
    const progress = typeof stageProgressPct === "number" && Number.isFinite(stageProgressPct)
      ? stageProgressPct
      : 0;
    return progress >= 100 ? 7 : 6;
  }
  if (rounded === 7) return 7;
  return null;
}

function journeyStageMessageForDisplay(stageId: number | null | undefined): string {
  switch (stageId) {
    case 1:
      return "Building strong letter-sound foundations";
    case 2:
      return "Blending sounds into early words";
    case 3:
      return "Growing word-building confidence";
    case 4:
      return "Strengthening reading fluency";
    case 5:
      return "Building grammar power";
    case 6:
      return "Practicing speaking with confidence";
    case 7:
      return "Reviewing skills for championship mastery";
    default:
      return "Keep practicing to unlock new challenges!";
  }
}

const PHONICS_COURSE_ID_ALIASES: Record<string, string> = {
  "phonics-foundation": "phonics-foundations",
  foundational: "phonics-foundations",
  "phonics-early": "early-phonics",
  early: "early-phonics",
  "phonics-advanced": "advanced-phonics",
  advanced: "advanced-phonics",
};

const normalizeCurriculumCourseId = (value?: string | null): string | null => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (PHONICS_COURSE_IDS.includes(raw)) return raw;
  if (PHONICS_COURSE_ID_ALIASES[raw]) return PHONICS_COURSE_ID_ALIASES[raw];

  if (raw === "basic-grammar" || raw === "grammar-essentials" || raw === "grammar essentials") {
    return "basic-grammar";
  }
  if (raw === "advanced-grammar" || raw === "grammar-mastery" || raw === "grammar mastery") {
    return "advanced-grammar";
  }
  if (raw.includes("grammar")) {
    if (raw.includes("intermediate")) return "basic-grammar";
    if (raw.includes("advanced") || raw.includes("mastery")) return "advanced-grammar";
    return "basic-grammar";
  }

  if (
    raw === "basic-public-speaking"
    || raw === "public-speaking-basic"
    || raw === "public-speaking-foundations"
  ) {
    return "basic-public-speaking";
  }
  if (
    raw === "advanced-public-speaking"
    || raw === "public-speaking-advanced"
    || raw === "public-speaking-excellence"
  ) {
    return "advanced-public-speaking";
  }
  if (raw.includes("speaking") || raw.includes("speech") || raw.includes("public")) {
    if (raw.includes("intermediate")) return "basic-public-speaking";
    if (raw.includes("advanced") || raw.includes("excellence")) return "advanced-public-speaking";
    return "basic-public-speaking";
  }

  return null;
};

const phonicsLabelsByCourseId: Record<string, string> = {
  "phonics-foundations": "Phonics Foundations",
  "early-phonics": "Early Phonics",
  "advanced-phonics": "Advanced Phonics",
};

const titleCaseFromId = (value: string): string =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const phonicsGradientsByCourseId: Record<string, string> = {
  "phonics-foundations": "from-indigo-50 to-purple-50",
  "early-phonics": "from-emerald-50 to-teal-50",
  "advanced-phonics": "from-amber-50 to-orange-50",
};

const phonicsIconsByCourseId: Record<string, string> = {
  "phonics-foundations": "🔤",
  "early-phonics": "📘",
  "advanced-phonics": "🧠",
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseScorePercent(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampPercent(value);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const nums = raw.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const isRangeLike = /-|–|\/| to /i.test(raw);
  const chosen = Number(isRangeLike ? nums[0] : nums[nums.length - 1]);
  if (!Number.isFinite(chosen)) return null;
  return clampPercent(chosen);
}

function masteryToPercent(value: unknown): number | null {
  const mastery = String(value ?? "").trim();
  if (!mastery) return null;
  return masteryPctFromKey(mastery);
}

function formatMasteryLabel(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return masteryLabel(raw);
}

const STAGE_MASTERY_ORDER: MasteryKey[] = [
  "not_started",
  "emerging",
  "developing",
  "proficient",
  "mastered",
];

const TEACHER_STAR_GUIDE = [
  { stars: "☆☆☆☆", label: "Not started" },
  { stars: "⭐☆☆☆", label: "Emerging" },
  { stars: "⭐⭐☆☆", label: "Developing" },
  { stars: "⭐⭐⭐☆", label: "Proficient" },
  { stars: "⭐⭐⭐⭐", label: "Mastered" },
] as const;

function starString(level: number): string {
  const safeLevel = Math.max(0, Math.min(SKILL_RATING_MAX, Math.round(level)));
  return `${"⭐".repeat(safeLevel)}${"☆".repeat(SKILL_RATING_MAX - safeLevel)}`;
}

function getLessonNeedsPracticeChips(row: any): string[] {
  if (Array.isArray(row?.practiceChips) && row.practiceChips.length > 0) {
    return row.practiceChips;
  }
  if (Array.isArray(row?.focusChips) && row.focusChips.length > 0) {
    return row.focusChips;
  }
  return [];
}

function aggregateStageMastery(values: Array<any>): MasteryKey {
  if (!values.length) return "not_started";
  const ranks = values.map((value) => STAGE_MASTERY_ORDER.indexOf(masteryKeyFromValue(value)));
  const total = ranks.reduce((sum, rank) => sum + (Number.isFinite(rank) ? rank : 0), 0);
  const avg = total / ranks.length;
  const idx = Math.max(0, Math.min(STAGE_MASTERY_ORDER.length - 1, Math.round(avg)));
  return STAGE_MASTERY_ORDER[idx];
}

function pickStageFocus(rows: Array<any>): string[] {
  if (!rows.length) return [];
  const sorted = rows
    .slice()
    .sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
  for (const row of sorted) {
    const chips =
      Array.isArray(row.practiceChips) && row.practiceChips.length > 0
        ? row.practiceChips
        : Array.isArray(row.strengthChips) && row.strengthChips.length > 0
          ? row.strengthChips
          : Array.isArray(row.focusChips) && row.focusChips.length > 0
            ? row.focusChips
            : Array.isArray(row.confusionChips) && row.confusionChips.length > 0
              ? row.confusionChips
              : [];
    if (chips.length > 0) return chips.slice(0, 2);
  }
  return [];
}

const STAGE_HINTS_BY_COURSE: Record<string, Record<number, string>> = {
  "phonics-foundations": {
    1: "Learn the first letter sounds and match them to pictures.",
    2: "Build quick recall of more letter sounds.",
    3: "Add new letter sounds and use them in simple words.",
    4: "Practice additional consonant sounds with picture-word matching.",
    5: "Complete the core set of letter sounds.",
    6: "Short vowels + review all sounds.",
  },
  "early-phonics": {
    1: "Blend sound sets 1–5 and read simple CVC words.",
    2: "Finish sound sets + short vowels for smoother blending.",
    3: "Learn digraphs and silent letters in words.",
    4: "Practice vowel teams and long vowel patterns.",
    5: "Master Magic E long vowels.",
    6: "Apply rules in longer words and review.",
  },
  "advanced-phonics": {
    1: "Diphthongs and gliding vowel sounds.",
    2: "Bossy R patterns for ar/or/er/ir/ur.",
    3: "Special sounds + silent letter patterns.",
    4: "Alternate vowel spellings in words.",
    5: "Endings and suffix sounds.",
    6: "Mixed revision + fluency practice.",
  },
  "basic-grammar": {
    1: "Build simple sentences with nouns and verbs.",
    2: "Add meaning using adjectives, articles, and pronouns.",
    3: "Use prepositions and adverbs to add detail.",
    4: "Join ideas and use plurals correctly.",
    5: "Ask questions and punctuate sentences.",
    6: "Use past, present, and future in simple sentences.",
  },
  "advanced-grammar": {
    1: "Control tense choices and keep them consistent.",
    2: "Use perfect tenses and modals accurately.",
    3: "Build complex sentences with clauses.",
    4: "Use voice and reported speech clearly.",
    5: "Write cohesive paragraphs with transitions.",
    6: "Write with tone, argument, and impact.",
  },
  "basic-public-speaking": {
    1: "Feel comfortable speaking in class routines.",
    2: "Speak clearly with pace, volume, and full words.",
    3: "Describe objects with details and expression.",
    4: "Give short talks and answer simple questions.",
    5: "Tell a short story in order.",
    6: "Practice presentations with confidence.",
  },
  "advanced-public-speaking": {
    1: "Engage the audience with confident presence.",
    2: "Structure talks with strong openings and details.",
    3: "Perform stories with voice and emotion.",
    4: "Handle impromptu questions calmly.",
    5: "Use persuasion and debate skills.",
    6: "Deliver polished presentations.",
  },
};

type StageDefinition = {
  stageOrder: number;
  label: string;
  start: number;
  end: number;
};

const STAGE_DEFINITIONS_BY_COURSE: Record<string, StageDefinition[]> = {
  "phonics-foundations": [
    { stageOrder: 1, label: "Stage 1 — First letter sounds", start: 1, end: 5 },
    { stageOrder: 2, label: "Stage 2 — Letter sounds set 2", start: 6, end: 10 },
    { stageOrder: 3, label: "Stage 3 — Letter sounds set 3", start: 11, end: 15 },
    { stageOrder: 4, label: "Stage 4 — Letter sounds set 4", start: 16, end: 20 },
    { stageOrder: 5, label: "Stage 5 — Letter sounds set 5", start: 21, end: 25 },
    { stageOrder: 6, label: "Stage 6 — Short vowels + review", start: 26, end: 30 },
  ],
  "early-phonics": [
    { stageOrder: 1, label: "Stage 1 — Sound sets 1–5", start: 1, end: 6 },
    { stageOrder: 2, label: "Stage 2 — Sound sets 6–7 + short vowels", start: 7, end: 10 },
    { stageOrder: 3, label: "Stage 3 — Digraphs + silent letters", start: 11, end: 20 },
    { stageOrder: 4, label: "Stage 4 — Vowel teams + long vowels", start: 21, end: 31 },
    { stageOrder: 5, label: "Stage 5 — Magic E", start: 32, end: 36 },
    { stageOrder: 6, label: "Stage 6 — Longer words + review", start: 37, end: 41 },
  ],
  "advanced-phonics": [
    { stageOrder: 1, label: "Stage 1 — Diphthongs", start: 1, end: 4 },
    { stageOrder: 2, label: "Stage 2 — Bossy R", start: 5, end: 7 },
    { stageOrder: 3, label: "Stage 3 — Special sounds + silent letters", start: 8, end: 10 },
    { stageOrder: 4, label: "Stage 4 — Alternate vowels", start: 11, end: 15 },
    { stageOrder: 5, label: "Stage 5 — Endings", start: 16, end: 16 },
    { stageOrder: 6, label: "Stage 6 — Revision", start: 17, end: 20 },
  ],
  "basic-grammar": [
    { stageOrder: 1, label: "Stage 1 — Sentence Foundations", start: 1, end: 6 },
    { stageOrder: 2, label: "Stage 2 — Meaning Builders", start: 7, end: 12 },
    { stageOrder: 3, label: "Stage 3 — Where/When/How", start: 13, end: 18 },
    { stageOrder: 4, label: "Stage 4 — Longer Sentences", start: 19, end: 24 },
    { stageOrder: 5, label: "Stage 5 — Asking + Punctuation", start: 25, end: 30 },
    { stageOrder: 6, label: "Stage 6 — Tenses Basics", start: 31, end: 36 },
  ],
  "advanced-grammar": [
    { stageOrder: 1, label: "Stage 1 — Tense Control", start: 1, end: 6 },
    { stageOrder: 2, label: "Stage 2 — Perfect Tenses + Modals", start: 7, end: 12 },
    { stageOrder: 3, label: "Stage 3 — Clauses + Complex Sentences", start: 13, end: 18 },
    { stageOrder: 4, label: "Stage 4 — Voice + Reported Speech", start: 19, end: 24 },
    { stageOrder: 5, label: "Stage 5 — Paragraph Cohesion", start: 25, end: 30 },
    { stageOrder: 6, label: "Stage 6 — Tone + Argument + Impact", start: 31, end: 36 },
  ],
  "basic-public-speaking": [
    { stageOrder: 1, label: "Stage 1 — Comfort + Routine", start: 1, end: 6 },
    { stageOrder: 2, label: "Stage 2 — Clear Speaking", start: 7, end: 12 },
    { stageOrder: 3, label: "Stage 3 — Describe + Show & Tell", start: 13, end: 18 },
    { stageOrder: 4, label: "Stage 4 — Mini Talks + Q&A", start: 19, end: 24 },
    { stageOrder: 5, label: "Stage 5 — Story Basics", start: 25, end: 30 },
    { stageOrder: 6, label: "Stage 6 — Presentation Readiness", start: 31, end: 36 },
  ],
  "advanced-public-speaking": [
    { stageOrder: 1, label: "Stage 1 — Presence + Engagement", start: 1, end: 6 },
    { stageOrder: 2, label: "Stage 2 — Structure + Supporting Details", start: 7, end: 12 },
    { stageOrder: 3, label: "Stage 3 — Story Performance", start: 13, end: 18 },
    { stageOrder: 4, label: "Stage 4 — Impromptu + Q&A", start: 19, end: 24 },
    { stageOrder: 5, label: "Stage 5 — Persuasion + Debate", start: 25, end: 30 },
    { stageOrder: 6, label: "Stage 6 — Presentation Mastery", start: 31, end: 36 },
  ],
};

const resolveStageByLessonNumber = (
  courseId: string,
  lessonNumber: number | null | undefined,
): StageDefinition | null => {
  if (!lessonNumber) return null;
  const stages = STAGE_DEFINITIONS_BY_COURSE[courseId];
  if (!stages) return null;
  return stages.find((stage) => lessonNumber >= stage.start && lessonNumber <= stage.end) ?? null;
};

const STAGE_EXPECTATIONS_BY_COURSE: Record<string, Record<number, string[]>> = {
  "phonics-foundations": {
    1: ["Recognize first letter sounds", "Match sounds to pictures"],
    2: ["Recall more letter sounds", "Spot sounds at word starts"],
    3: ["Practice new letter sounds", "Blend simple sounds"],
    4: ["Strengthen sound recall", "Identify sounds in words"],
    5: ["Complete the core sounds", "Build quick sound confidence"],
    6: ["Short vowel sounds", "Review all letter sounds"],
  },
  "early-phonics": {
    1: ["Blend CVC words", "Sound sets 1–5"],
    2: ["Short vowels in CVC", "Sound sets 6–7"],
    3: ["Digraphs and silent letters", "Read common patterns"],
    4: ["Vowel teams + long vowels", "Practice igh/ai/oa"],
    5: ["Magic E long vowels", "Spell with Magic E"],
    6: ["Longer words + review", "Apply patterns in reading"],
  },
  "advanced-phonics": {
    1: ["Diphthong sounds", "ai/ay, oi/oy, ou/ow"],
    2: ["Bossy R patterns", "ar/or/er/ir/ur"],
    3: ["Special sounds", "Silent letters in words"],
    4: ["Alternate vowel spellings", "Choose the right vowel"],
    5: ["Endings + suffix sounds", "c/ct and /shun/"],
    6: ["Revision + fluency", "Mixed reading practice"],
  },
  "basic-grammar": {
    1: ["Nouns + verbs in sentences", "Capitals + full stop"],
    2: ["Adjectives + articles", "Pronouns in sentences"],
    3: ["Prepositions + adverbs", "Add detail to meaning"],
    4: ["Join ideas with conjunctions", "Use plurals correctly"],
    5: ["Question forms", "Punctuation practice"],
    6: ["Past/present/future", "Fix tense mistakes"],
  },
  "advanced-grammar": {
    1: ["Control tense choices", "Edit tense shifts"],
    2: ["Perfect tenses", "Modal meaning/choice"],
    3: ["Clauses + complex sentences", "Fix fragments"],
    4: ["Active vs passive", "Reported speech edits"],
    5: ["Paragraph cohesion", "Transitions + punctuation"],
    6: ["Tone + argument", "Polished writing showcase"],
  },
  "basic-public-speaking": {
    1: ["Comfort + routine", "Eye contact + posture"],
    2: ["Clear speech", "Slow pace + full words"],
    3: ["Describe with 2–3 details", "Simple gestures"],
    4: ["Short talk 30–60 seconds", "Answer easy questions"],
    5: ["Tell a short story", "Beginning-middle-end"],
    6: ["Mini presentation", "Handle small mistakes calmly"],
  },
  "advanced-public-speaking": {
    1: ["Engaging openings", "Confident presence"],
    2: ["Structure talk", "Supporting details"],
    3: ["Story performance", "Voice + emotion"],
    4: ["Impromptu response", "Q&A strategies"],
    5: ["Persuasion + debate", "Rebuttal practice"],
    6: ["Polished presentation", "Use notes + visuals"],
  },
};

const STAGE_COLORS = [
  {
    accent: "#2563eb",
    soft: "#dbeafe",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    bar: "bg-blue-500",
  },
  {
    accent: "#0ea5e9",
    soft: "#cffafe",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
    bar: "bg-cyan-500",
  },
  {
    accent: "#8b5cf6",
    soft: "#ede9fe",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    bar: "bg-violet-500",
  },
  {
    accent: "#f59e0b",
    soft: "#fef3c7",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    bar: "bg-amber-500",
  },
  {
    accent: "#ec4899",
    soft: "#fce7f3",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    bar: "bg-pink-500",
  },
  {
    accent: "#10b981",
    soft: "#d1fae5",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    bar: "bg-emerald-500",
  },
];

const getStageColors = (order: number) => {
  if (!Number.isFinite(order) || order < 1) return STAGE_COLORS[0];
  return STAGE_COLORS[(order - 1) % STAGE_COLORS.length];
};

const stripStagePrefix = (label: string, order: number): string => {
  if (!label) return `Stage ${order}`;
  const cleaned = label.replace(/^Stage\\s*\\d+\\s*[—-]\\s*/i, "").trim();
  return cleaned || label;
};

const calcStageProgressPct = (rows: Array<any>): number => {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, row) => sum + masteryPctFromKey(row.mastery), 0);
  return clampPercent(Math.round(total / rows.length));
};

function parseStageOrderFromLabel(label?: string | null): number | null {
  const raw = String(label ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/stage\s*(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildStageOrderMap(
  topics: Array<{ stageLabel?: string | null; stageOrder?: number | null; order: number | null }>,
) {
  const labelKey = (label?: string | null) => (label && String(label).trim()) || "Lessons";
  const orderMap = new Map<string, number>();
  const usedOrders = new Set<number>();

  topics.forEach((topic) => {
    const label = labelKey(topic.stageLabel);
    const explicit =
      typeof topic.stageOrder === "number" && Number.isFinite(topic.stageOrder) && topic.stageOrder > 0
        ? topic.stageOrder
        : null;
    const parsed = parseStageOrderFromLabel(label);
    const resolved = explicit ?? parsed;
    if (resolved) {
      const existing = orderMap.get(label);
      if (!existing || resolved < existing) {
        orderMap.set(label, resolved);
      }
      usedOrders.add(resolved);
    }
  });

  let nextOrder = 1;
  const allocate = () => {
    while (usedOrders.has(nextOrder)) nextOrder += 1;
    const value = nextOrder;
    usedOrders.add(value);
    nextOrder += 1;
    return value;
  };

  topics.forEach((topic) => {
    const label = labelKey(topic.stageLabel);
    if (!orderMap.has(label)) {
      orderMap.set(label, allocate());
    }
  });

  return orderMap;
}

function resolveTopicOrder(topic: any): number | null {
  if (typeof topic?.order === "number") return topic.order;
  if (typeof topic?.index === "number") return topic.index;
  if (typeof topic?.lesson === "number") return topic.lesson;
  if (typeof topic?.lesson === "string") {
    const m = topic.lesson.match(/(\d+)/);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function formatTimestamp(ms?: number | null): string {
  if (!ms) return "—";
  const dt = new Date(ms);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function normalizeTopicText(value?: string | null): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePhonicsCourseId(value?: string | null): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (PHONICS_COURSE_IDS.includes(raw)) return raw;
  return PHONICS_COURSE_ID_ALIASES[raw] || null;
}

function normalizeSessionCourseId(session?: any): string | null {
  const direct = normalizePhonicsCourseId(
    session?.courseId ?? session?.course?.id ?? session?.course
  );
  if (direct) return direct;
  const name = String(session?.courseName ?? session?.courseLabel ?? "")
    .toLowerCase()
    .trim();
  if (!name) return null;
  if (name.includes("early")) return "early-phonics";
  if (name.includes("foundation")) return "phonics-foundations";
  if (name.includes("advanced")) return "advanced-phonics";
  return null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function parseHHMM(hhmm?: string): { hh: number; mm: number } | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return { hh: Number(m[1]), mm: Number(m[2]) };
}

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function sessionStartDate(s: KidSession): Date | null {
  // Preferred: startAt Timestamp
  if (s?.startAt?.toDate) return s.startAt.toDate();

  // Next: date string + startTime
  const dateStr = typeof s.date === "string" ? s.date : null;
  if (dateStr) {
    const ymd = parseYMD(dateStr);
    if (!ymd) return null;
    const t = parseHHMM(s.startTime) ?? { hh: 0, mm: 0 };
    return new Date(ymd.y, ymd.m - 1, ymd.d, t.hh, t.mm, 0, 0);
  }

  // Next: date Timestamp
  if (s?.date?.toDate) {
    const base = s.date.toDate();
    const t = parseHHMM(s.startTime);
    if (t) return new Date(base.getFullYear(), base.getMonth(), base.getDate(), t.hh, t.mm, 0, 0);
    return base;
  }

  return null;
}

function sessionEndDate(s: KidSession, start: Date | null): Date | null {
  if (s?.endAt?.toDate) return s.endAt.toDate();
  if (start && typeof s.endTime === "string") {
    const t = parseHHMM(s.endTime);
    if (t) return new Date(start.getFullYear(), start.getMonth(), start.getDate(), t.hh, t.mm, 0, 0);
  }
  return null;
}

function formatSessionTimeRange(s: KidSession): string {
  const start = sessionStartDate(s);
  if (!start) return s.startTime || "Time TBD";
  const startLabel = typeof s.startTime === "string" && s.startTime.trim()
    ? s.startTime.trim()
    : `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  const end = sessionEndDate(s, start);
  const endLabel = typeof s.endTime === "string" && s.endTime.trim()
    ? s.endTime.trim()
    : end
      ? `${pad2(end.getHours())}:${pad2(end.getMinutes())}`
      : "";
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function normalizeStatus(raw?: string): string {
  const s = (raw || "").toLowerCase().trim();
  if (s === "scheduled" || s === "in_progress" || s === "completed" || s === "cancelled" || s === "canceled" || s === "no_show" || s === "noshow" || s === "reschedule_requested" || s === "rescheduled") {
    if (s === "canceled") return "cancelled";
    if (s === "noshow") return "no_show";
    if (s === "rescheduled") return "reschedule_requested";
    return s;
  }
  return s ? s : "scheduled";
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    case "in_progress":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    case "cancelled":
      return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200";
    case "no_show":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    case "reschedule_requested":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    default:
      return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No-show";
    case "reschedule_requested":
      return "Rescheduled";
    default:
      return "Scheduled";
  }
}

export default function ParentDashboard() {
  const { user, isLoading, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedKidId = searchParams.get("kidId")?.trim() || "";

  const activeTab = safeTab(searchParams.get("tab"));

  const setTab = (tab: TabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  // ---- Kids linked to this parent ----
  const kidsQuery = useQuery({
    queryKey: ["parentKids", user?.uid],
    enabled: !!user?.uid,
    // Manual refresh model: no polling; fetch when page mounts
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!user?.uid) return [];
      const q1 = query(
        collection(db, "kids"),
        where("parentIds", "array-contains", user.uid)
      );
      const snap = await getDocs(q1);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    },
  });

  const kids = useMemo(() => kidsQuery.data ?? [], [kidsQuery.data]);
  const [selectedKidId, setSelectedKidId] = useState<string>("");
  const [curriculumTopicModalOpen, setCurriculumTopicModalOpen] =
    useState(false);
  const [selectedCurriculumTopic, setSelectedCurriculumTopic] =
    useState<any>(null);
  const [curriculumFilter, setCurriculumFilter] = useState<
    "all" | "in_progress" | "completed"
  >("all");
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [insightsCourseId, setInsightsCourseId] = useState<string>("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gamesRefreshStatus, setGamesRefreshStatus] = useState<{
    tone: "neutral" | "success" | "info" | "error";
    message: string | null;
  }>({ tone: "neutral", message: null });
  const [isRefreshingGames, setIsRefreshingGames] = useState(false);
  const [lastGamesSeenSignalMs, setLastGamesSeenSignalMs] = useState(0);
  const [lastGamesHeadSeenMs, setLastGamesHeadSeenMs] = useState(0);

  useEffect(() => {
    if (kids.length === 0) return;
    if (
      requestedKidId &&
      kids.some((kid: any) => kid.id === requestedKidId) &&
      selectedKidId !== requestedKidId
    ) {
      setSelectedKidId(requestedKidId);
      return;
    }
    if (!selectedKidId) setSelectedKidId(kids[0].id);
  }, [kids, requestedKidId, selectedKidId]);

  const selectedKid = useMemo(
    () => kids.find((k: any) => k.id === selectedKidId),
    [kids, selectedKidId]
  );

  const studentIdForProgress = useMemo(() => {
    const kid = selectedKid as any;
    const candidate =
      kid?.studentId ??
      kid?.studentUid ??
      kid?.linkedStudentId ??
      kid?.studentRefId ??
      null;
    return String(candidate || selectedKidId || "");
  }, [selectedKid, selectedKidId]);

  // ---- Kid summary doc (kids/{kidId}) ----
  const kidSummaryQuery = useQuery({
    queryKey: ["kidSummary", selectedKidId],
    enabled: !!selectedKidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDoc(doc(db, "kids", selectedKidId));
      return snap.exists()
        ? ({ id: snap.id, ...(snap.data() as any) } as any)
        : null;
    },
  });

  // ---- Enrollments for selected kid (used for phonics progress) ----
  const enrollmentsQuery = useQuery({
    queryKey: ["kidEnrollments", user?.uid, selectedKidId],
    enabled: !!user?.uid && !!selectedKidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<Enrollment[]> => {
      if (!user?.uid || !selectedKidId) return [];
      const enrollmentsCol = collection(db, "enrollments");
      const results = new Map<string, Enrollment>();

      const queries = [
        query(
          enrollmentsCol,
          where("parentId", "==", user.uid),
          where("studentId", "==", selectedKidId)
        ),
        query(
          enrollmentsCol,
          where("parentId", "==", user.uid),
          where("kidId", "==", selectedKidId)
        ),
        query(
          enrollmentsCol,
          where("parentId", "==", user.uid),
          where("kidIds", "array-contains", selectedKidId)
        ),
      ];

      for (const q of queries) {
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          results.set(d.id, { id: d.id, ...(d.data() as any) });
        });
      }

      return Array.from(results.values());
    },
  });

  // ---- Phonics progress (per-course) ----
  const phonicsProgressQuery = useQuery({
    queryKey: ["phonicsProgress", studentIdForProgress],
    enabled: !!studentIdForProgress,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!studentIdForProgress) return [];
      try {
        const snap = await getDocs(
          collection(db, "students", studentIdForProgress, "progress")
        );
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } catch (err: any) {
        console.error("❌ [ParentDashboard] Progress query error:", err);
        throw err;
      }
    },
  });

  const curriculumTopicsQuery = useQuery({
    queryKey: ["curriculumTopics"],
    enabled: activeTab === "dashboard" || activeTab === "insights" || activeTab === "skills",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      const snap = await getDoc(doc(db, "config", "curriculumTopics"));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  const curriculumTopicsByCourseId = useMemo<
    Record<
      string,
      {
        id: string;
        label: string;
        displayTitle: string;
        order: number | null;
        stageLabel?: string | null;
        stageOrder?: number | null;
      }[]
    >
  >(() => {
    const data = curriculumTopicsQuery.data;
    const rawTopics = Array.isArray(data?.topics) ? data.topics : [];
    const byCourse: Record<
      string,
      Array<{
        id: string;
        label: string;
        displayTitle: string;
        order: number | null;
        stageLabel?: string | null;
        stageOrder?: number | null;
      }>
    > = {};

    rawTopics.forEach((topic: any) => {
      const id = String(topic?.id ?? "");
      if (!id) return;
      const courseId = normalizeCurriculumCourseId(topic?.courseId ?? topic?.course);
      if (!courseId) return;
      const baseLabel = String(
        topic?.label ?? topic?.topicName ?? topic?.name ?? id
      ).trim();
      const displayTitle = String(topic?.displayTitle ?? '').trim();
      const lesson = topic?.lesson ? String(topic.lesson).trim() : "";
      const stageLabel = typeof topic?.stageLabel === "string" ? topic.stageLabel.trim() : "";
      const stageOrder = typeof topic?.stageOrder === "number" ? topic.stageOrder : null;
      const label = displayTitle
        ? displayTitle
        : lesson
          ? `${lesson} — ${baseLabel || id}`
          : baseLabel || id;
      const order = resolveTopicOrder(topic);
      const stageFromLesson = resolveStageByLessonNumber(courseId, order);
      const resolvedStageLabel = stageLabel || stageFromLesson?.label || null;
      const resolvedStageOrder = stageOrder ?? stageFromLesson?.stageOrder ?? null;
      if (!byCourse[courseId]) byCourse[courseId] = [];
      byCourse[courseId].push({
        id,
        label,
        displayTitle: label,
        order,
        stageLabel: resolvedStageLabel,
        stageOrder: resolvedStageOrder,
      });
    });

    Object.keys(byCourse).forEach((courseId) => {
      byCourse[courseId] = byCourse[courseId].sort((a, b) => {
        const aOrder = a.order;
        const bOrder = b.order;
        if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        if (aOrder !== null && bOrder === null) return -1;
        if (aOrder === null && bOrder !== null) return 1;
        return a.label.localeCompare(b.label);
      });

      const stageOrderMap = buildStageOrderMap(byCourse[courseId]);
      byCourse[courseId] = byCourse[courseId].map((topic) => {
        const key = (topic.stageLabel && topic.stageLabel.trim()) || "Lessons";
        const resolvedStageOrder =
          typeof topic.stageOrder === "number" && Number.isFinite(topic.stageOrder) && topic.stageOrder > 0
            ? topic.stageOrder
            : parseStageOrderFromLabel(key) ?? stageOrderMap.get(key) ?? null;
        return {
          ...topic,
          stageLabel: key,
          stageOrder: resolvedStageOrder,
        };
      });
    });

    return byCourse;
  }, [curriculumTopicsQuery.data]);

  const topicCourseById = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(curriculumTopicsByCourseId).forEach(([courseId, topics]) => {
      topics.forEach((topic) => {
        map[topic.id] = courseId;
      });
    });
    return map;
  }, [curriculumTopicsByCourseId]);

  const progressByTopicId = useMemo(() => {
    const records = (phonicsProgressQuery.data ?? []) as any[];
    const map: Record<string, any> = {};
    records.forEach((doc) => {
      const id = String(doc?.topicId ?? doc?.id ?? "");
      if (!id) return;
      map[id] = doc;
    });
    return map;
  }, [phonicsProgressQuery.data]);

  const phonicsEnrollments = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const isPhonicsEnrollment = (enrollment: Enrollment): boolean => {
      const courseId = String(enrollment.courseId || "");
      if (PHONICS_COURSE_IDS.includes(courseId)) return true;
      const area = String(
        enrollment.course?.area ?? enrollment.courseArea ?? enrollment.area ?? ""
      )
        .toLowerCase()
        .trim();
      return area === "phonics";
    };
    return enrollments.filter(isPhonicsEnrollment);
  }, [enrollmentsQuery.data]);

  const phonicsCourseIdsFromEnrollments = useMemo(() => {
    return phonicsEnrollments
      .map((enr) => normalizePhonicsCourseId(enr.courseId))
      .filter((id): id is string => Boolean(id));
  }, [phonicsEnrollments]);

  const enrolledCourseIds = useMemo(() => {
    return Array.from(new Set(phonicsCourseIdsFromEnrollments));
  }, [phonicsCourseIdsFromEnrollments]);

  const coursesLookupQuery = useQuery({
    queryKey: ["coursesLookup"],
    enabled: activeTab === "insights" || profileOpen,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      const snap = await getDocs(collection(db, "courses"));
      const map: Record<string, string> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const label = String(
          data?.label || data?.name || data?.title || data?.courseLabel || docSnap.id
        ).trim();
        if (label) {
          map[docSnap.id] = label;
          if (data?.courseId && !map[data.courseId]) {
            map[data.courseId] = label;
          }
        }
      });
      return map;
    },
  });

  const teacherIdsForProfile = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const ids = new Set<string>();
    enrollments.forEach((enr) => {
      const candidate = String(
        enr.teacherId ||
          enr.teacherUid ||
          enr.teacherUserId ||
          (enr as any).teacher ||
          ""
      ).trim();
      if (candidate) ids.add(candidate);
    });
    return Array.from(ids);
  }, [enrollmentsQuery.data]);

  const teacherLookupQuery = useQuery({
    queryKey: ["teacherLookup", teacherIdsForProfile],
    enabled: profileOpen && teacherIdsForProfile.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      const map: Record<string, { name: string; email?: string }> = {};
      if (!teacherIdsForProfile.length) return map;
      const usersCol = collection(db, "users");
      const chunks = chunkIds(teacherIdsForProfile, 10);
      for (const chunk of chunks) {
        const snap = await getDocs(
          query(usersCol, where(documentId(), "in", chunk))
        );
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const name = String(
            data?.displayName ||
              data?.name ||
              data?.fullName ||
              data?.email ||
              docSnap.id
          ).trim();
          map[docSnap.id] = {
            name: name || "Teacher",
            email: data?.email ? String(data.email).trim() : undefined,
          };
        });
      }
      return map;
    },
  });

  const formatCourseLabel = (courseId: string, fallback?: string) => {
    const trimmed = String(fallback || "").trim();
    if (trimmed && trimmed !== courseId) return trimmed;
    const fromLookup = coursesLookupQuery.data?.[courseId];
    if (fromLookup) return fromLookup;
    return titleCaseFromId(courseId);
  };

  const insightsCourseOptions = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const map = new Map<string, string>();
    enrollments.forEach((enr) => {
      const courseId = String(enr.courseId || "").trim();
      if (!courseId) return;
      const label = formatCourseLabel(courseId, String(enr.courseLabel || enr.courseName || "").trim());
      if (!map.has(courseId)) map.set(courseId, label || courseId);
    });
    if (map.size > 0) {
      return Array.from(map.entries()).map(([courseId, label]) => ({
        courseId,
        label,
      }));
    }
    return Array.from(map.entries()).map(([courseId, label]) => ({
      courseId,
      label,
    }));
  }, [enrollmentsQuery.data, coursesLookupQuery.data]);

  useEffect(() => {
    if (!insightsCourseOptions.length) {
      if (insightsCourseId) setInsightsCourseId("");
      return;
    }
    if (!insightsCourseId) {
      setInsightsCourseId(insightsCourseOptions[0].courseId);
      return;
    }
    if (!insightsCourseOptions.find((opt) => opt.courseId === insightsCourseId)) {
      setInsightsCourseId(insightsCourseOptions[0].courseId);
    }
  }, [insightsCourseId, insightsCourseOptions, selectedKidId]);


  // ---- Per-game summaries (kids/{kidId}/gameSummaries/*) ----
  // Used to render reliable per-game progress (e.g. Letter Sounds completion/stars)
  const gameSummariesQuery = useQuery({
    queryKey: ["gameSummaries", selectedKidId],
    enabled: !!selectedKidId && (activeTab === "games-progress" || activeTab === "dashboard"),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDocs(collection(db, "kids", selectedKidId, "gameSummaries"));
      const map: Record<string, any> = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      return map;
    },
  });

  // ---- Lightweight game activity freshness head (kids/{kidId}/activity/head) ----
  const gameActivityHeadQuery = useQuery({
    queryKey: ["gameActivityHead", selectedKidId],
    enabled: !!selectedKidId && (activeTab === "games-progress" || activeTab === "dashboard"),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDoc(doc(db, "kids", selectedKidId, "activity", "head"));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  // ---- Games catalog ----
  const gamesCatalogQuery = useQuery({
    queryKey: ["gamesCatalog"],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      const snap = await getDoc(doc(db, "config", "gamesCatalog"));
      const data = snap.exists() ? (snap.data() as any) : null;
      const games = data?.games;
      if (Array.isArray(games)) return games;
      if (!games || typeof games !== "object") return [];

      return Object.entries(games)
        .map(([id, game]: [string, any]) => {
          const canonicalId = canonicalizeParentGameId(id);
          return {
            id: canonicalId,
            title: game?.title || id,
            subtitle: game?.subtitle || game?.description || "",
            area: game?.category || "",
            totalLevels: typeof game?.totalLevels === "number" ? game.totalLevels : undefined,
            order: typeof game?.order === "number" ? game.order : Number.MAX_SAFE_INTEGER,
            active: game?.active !== false,
          };
        })
        .filter((game: any) => game.active !== false)
        .sort((a: any, b: any) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        .map(({ order, active, ...rest }: any) => rest);
    },
  });

  const hasAnyGameSummaries =
    !!gameSummariesQuery.data && Object.keys(gameSummariesQuery.data).length > 0;

  const hasSummaryCoverageGaps = useMemo(() => {
    if (!selectedKidId || activeTab !== "games-progress") return false;
    return hasGamesSummaryCoverageGaps(gameSummariesQuery.data ?? null, gamesCatalogQuery.data ?? null);
  }, [activeTab, gameSummariesQuery.data, gamesCatalogQuery.data, selectedKidId]);

  const shouldFetchLiveGameProgress =
    !!selectedKidId &&
    activeTab === "games-progress" &&
    (
      gameSummariesQuery.isError ||
      (gameSummariesQuery.isFetched && (!hasAnyGameSummaries || hasSummaryCoverageGaps))
    );

  // ---- Canonical live game progress (kids/{kidId}/gameProgress/*) ----
  // Intentional temporary fallback for sparse/legacy kids when canonical summaries are missing.
  const gameProgressQuery = useQuery({
    queryKey: ["gameProgress", selectedKidId],
    enabled: shouldFetchLiveGameProgress,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDocs(collection(db, "kids", selectedKidId, "gameProgress"));
      const map: Record<string, any> = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      return map;
    },
  });

  const currentGamesFreshnessMs = useMemo(() => {
    const headTs = latestTimestampFromActivityHead(gameActivityHeadQuery.data ?? null);
    if (headTs > 0) return headTs;
    return latestGamesFreshnessSignal({
      gameSummaries: gameSummariesQuery.data ?? null,
      gameProgress: gameProgressQuery.data ?? null,
      kidSummary: kidSummaryQuery.data ?? null,
    });
  }, [gameActivityHeadQuery.data, gameSummariesQuery.data, gameProgressQuery.data, kidSummaryQuery.data]);

  const overviewCanonicalFreshnessMs = useMemo(() => {
    const headTs = latestTimestampFromActivityHead(gameActivityHeadQuery.data ?? null);
    if (headTs > 0) return headTs;
    // Overview freshness intentionally uses shared canonical freshness (including __overview rollup writes).
    return latestCanonicalGamesTimestamp(
      gameSummariesQuery.data ?? null,
      gameProgressQuery.data ?? null,
    );
  }, [gameActivityHeadQuery.data, gameSummariesQuery.data, gameProgressQuery.data]);

  const canonicalGamesCompleted = useMemo(
    () =>
      countCompletedGamesFromCanonical(
        gameSummariesQuery.data ?? null,
        gameProgressQuery.data ?? null,
      ),
    [gameSummariesQuery.data, gameProgressQuery.data],
  );

  const canonicalTimePractisedMs = useMemo(
    () =>
      sumTimeSpentFromCanonical(
        gameSummariesQuery.data ?? null,
        gameProgressQuery.data ?? null,
      ),
    [gameSummariesQuery.data, gameProgressQuery.data],
  );

  // Canonical-first Parent Overview intelligence reads from gameSummaries/__overview.
  const canonicalLearningLevelAccuracy10 = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const rawValue = overviewDoc?.learningLevelAccuracy10;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return null;
    return Math.max(0, Math.min(100, rawValue));
  }, [gameSummariesQuery.data]);

  const canonicalTotalPointsLifetime = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const rawValue = overviewDoc?.totalPointsLifetime;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return null;
    return Math.max(0, Math.round(rawValue));
  }, [gameSummariesQuery.data]);

  const canonicalConfidenceNow = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const rawValue = overviewDoc?.confidenceNow;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return null;
    return Math.max(0, Math.min(100, rawValue));
  }, [gameSummariesQuery.data]);

  const canonicalRecommendedNext = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const value = overviewDoc?.recommendedNext;
    if (!value || typeof value !== "object") return null;
    return value as Record<string, any>;
  }, [gameSummariesQuery.data]);

  const canonicalJourneyCurrentStageId = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const rawValue = overviewDoc?.journeyCurrentStageId;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return null;
    const clamped = Math.max(1, Math.min(7, Math.round(rawValue)));
    return clamped;
  }, [gameSummariesQuery.data]);

  const canonicalJourneyStageProgressPct = useMemo(() => {
    const overviewDoc = (gameSummariesQuery.data as Record<string, any> | null | undefined)?.__overview;
    const rawValue = overviewDoc?.journeyStageProgressPct;
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return null;
    return Math.max(0, Math.min(100, rawValue));
  }, [gameSummariesQuery.data]);

  useEffect(() => {
    setGamesRefreshStatus({ tone: "neutral", message: null });
    setLastGamesSeenSignalMs(0);
    setLastGamesHeadSeenMs(0);
  }, [selectedKidId]);

  useEffect(() => {
    if (activeTab !== "games-progress") return;
    if (currentGamesFreshnessMs <= 0) return;
    if (lastGamesSeenSignalMs === 0) {
      setLastGamesSeenSignalMs(currentGamesFreshnessMs);
    }
  }, [activeTab, currentGamesFreshnessMs, lastGamesSeenSignalMs]);

  useEffect(() => {
    if (activeTab !== "games-progress") return;
    const currentHeadMs = latestTimestampFromActivityHead(gameActivityHeadQuery.data ?? null);
    if (currentHeadMs <= 0) return;
    if (lastGamesHeadSeenMs === 0) {
      setLastGamesHeadSeenMs(currentHeadMs);
    }
  }, [activeTab, gameActivityHeadQuery.data, lastGamesHeadSeenMs]);

  const handleGamesRefresh = async () => {
    if (!selectedKidId || isRefreshingGames) return;

    setIsRefreshingGames(true);
    setGamesRefreshStatus({
      tone: "info",
      message: "Checking for new game activity...",
    });

    const beforeMs = Math.max(lastGamesSeenSignalMs, currentGamesFreshnessMs);
    const beforeHeadMs = Math.max(
      lastGamesHeadSeenMs,
      latestTimestampFromActivityHead(gameActivityHeadQuery.data ?? null),
    );
    try {
      const activityHeadRes = await gameActivityHeadQuery.refetch();
      const headAfterMs = latestTimestampFromActivityHead((activityHeadRes as any)?.data ?? null);
      if (headAfterMs > 0) {
        setLastGamesHeadSeenMs(Math.max(beforeHeadMs, headAfterMs));
        if (headAfterMs <= beforeHeadMs) {
          setGamesRefreshStatus({
            tone: "info",
            message: "No new game activity since your last refresh.",
          });
          setLastGamesSeenSignalMs(Math.max(beforeMs, headAfterMs));
          return;
        }
      }

      const [summariesRes, progressRes] = await Promise.all([
        gameSummariesQuery.refetch(),
        shouldFetchLiveGameProgress
          ? gameProgressQuery.refetch()
          : Promise.resolve({ data: gameProgressQuery.data }),
      ]);
      const refreshedSummaryMap = ((summariesRes as any)?.data ?? null) as Record<string, any> | null;
      const refreshedProgressMap = ((progressRes as any)?.data ?? null) as Record<string, any> | null;
      const canonicalAfterMs = latestCanonicalGameDocsTimestamp(
        refreshedSummaryMap,
        refreshedProgressMap,
      );
      const refreshedHasSummaries = !!refreshedSummaryMap && Object.keys(refreshedSummaryMap).length > 0;
      const refreshedSummaryCoverageGaps = hasGamesSummaryCoverageGaps(
        refreshedSummaryMap,
        gamesCatalogQuery.data ?? null,
      );
      const refreshedHasProgressFallback =
        !!refreshedProgressMap && Object.keys(refreshedProgressMap).length > 0;
      const canonicalCoverageReady =
        (refreshedHasSummaries && !refreshedSummaryCoverageGaps) || refreshedHasProgressFallback;
      const kidSummaryRes =
        canonicalCoverageReady
          ? null
          : await kidSummaryQuery.refetch();

      const afterMs = Math.max(
        beforeMs,
        headAfterMs,
        canonicalAfterMs,
        kidSummaryRes ? latestTimestampFromKidSummary((kidSummaryRes as any)?.data ?? null) : 0,
      );

      if (afterMs > beforeMs) {
        setGamesRefreshStatus({
          tone: "success",
          message: "Updated with the latest game progress.",
        });
      } else {
        setGamesRefreshStatus({
          tone: "info",
          message: "No new game activity since your last refresh.",
        });
      }

      setLastGamesSeenSignalMs(afterMs);
    } catch (error) {
      console.error("Games refresh failed:", error);
      setGamesRefreshStatus({
        tone: "error",
        message: "Refresh failed. Please try again.",
      });
    } finally {
      setIsRefreshingGames(false);
    }
  };

  // ---- Payments config ----
  const paymentsConfigQuery = useQuery({
    queryKey: ["paymentsConfig"],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      const snap = await getDoc(doc(db, "config", "payments"));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  // ---- Billing charges (Fees & Dues) ----
  const billingChargesQuery = useQuery({
    queryKey: ["billingCharges", user?.uid],
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<BillingCharge[]> => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, "billingCharges"),
        where("parentId", "==", user.uid)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    },
  });

  // ---- Parent payments (recorded by admin) ----
  const parentPaymentsQuery = useQuery({
    queryKey: ["parentPayments", user?.uid],
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<ParentPaymentRecord[]> => {
      if (!user?.uid) return [];
      const q = query(collection(db, "payments"), where("parentId", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    },
  });

  // ---- Practice routing (Play button) -> Kids routes ----
  const handlePracticeClick = (gameId?: string) => {
    if (!selectedKidId) return;

    const canonicalGameId = canonicalizeParentGameId(gameId);

    const kidParam = `?kidId=${encodeURIComponent(selectedKidId)}`;
    const routeByGame: Record<string, string> = {
      "letter-tracing": "/kids/games/phonics/letter-tracing",
      "letter-tracing-sounds": "/kids/games/phonics/letter-tracing-sounds",
      "sound-detective": "/kids/games/phonics/sound-detective",
      "letter-sound-match": "/kids/games/phonics/letter-sound",
      "balloon-pop": "/kids/games/phonics/balloon-pop",
      // Add more mappings as you add routes:
      // "rhyme-time": "/kids/games/phonics/rhyme-time",
    };

    const base =
      (canonicalGameId && routeByGame[canonicalGameId]) ? routeByGame[canonicalGameId] : "/kids/games/english-excellence";

    navigate(`${base}${kidParam}`);
  };

  // ---- Classes tab state ----
  const [classesMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [classesView, setClassesView] = useState<"today" | "upcoming" | "completed" | "rescheduled" | "calendar">("today");
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [classesCalendarMonth, setClassesCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [classesCalendarSelectedDayKey, setClassesCalendarSelectedDayKey] = useState<string | null>(null);

  // Fetch sessions for this kid (manual refresh model: loads when tab opens)
  const kidSessionsQuery = useQuery({
    queryKey: ["kidSessions", selectedKidId],
    enabled:
      !!selectedKidId &&
      (activeTab === "classes" ||
        activeTab === "payments" ||
        activeTab === "dashboard"),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<KidSession[]> => {
      if (!selectedKidId || !user?.uid) return [];
      const shouldDebugParentDashboard =
        import.meta.env.DEV &&
        typeof window !== "undefined" &&
        (window as any).__TS_DEBUG_PARENT_DASHBOARD__ === true;

      if (shouldDebugParentDashboard) {
        console.debug("🔍 [ParentDashboard] Fetching sessions for:", {
          selectedKidId,
          parentUid: user.uid,
          parentEmail: user.email,
        });
      }

      const classSessionsCol = collection(db, "classSessions");

      try {
        // Primary: sessions.kidIds array contains kid AND parentId matches current user
        const qA = query(
          classSessionsCol,
          where("kidIds", "array-contains", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapA = await getDocs(qA);
        if (shouldDebugParentDashboard) {
          console.debug("✅ [Query A] classSessions kidIds array-contains + parentId:", {
            count: snapA.size,
            docs: snapA.docs.map(d => ({ id: d.id, parentId: d.data().parentId, kidIds: d.data().kidIds }))
          });
        }

        // Fallback: sessions.kidId == kid (older schema) AND parentId matches
        const qB = query(
          classSessionsCol,
          where("kidId", "==", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapB = await getDocs(qB);
        if (shouldDebugParentDashboard) {
          console.debug("✅ [Query B] classSessions kidId equality + parentId:", {
            count: snapB.size,
            docs: snapB.docs.map(d => ({ id: d.id, parentId: d.data().parentId, kidId: d.data().kidId }))
          });
        }

        const map = new Map<string, KidSession>();
        snapA.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));
        snapB.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));

        const all = Array.from(map.values());
        if (shouldDebugParentDashboard) {
          console.debug("📊 [Final Result] Total unique sessions:", all.length);
        }

        // Sort by start date (best effort)
        all.sort((a, b) => {
          const da = sessionStartDate(a)?.getTime() ?? 0;
          const db = sessionStartDate(b)?.getTime() ?? 0;
          return da - db;
        });

        return all;
      } catch (error: any) {
        console.error("❌ [ParentDashboard] Firestore query error:", {
          code: error?.code,
          message: error?.message,
          details: error,
        });
        throw error;
      }
    },
  });

  const classRecordingsQuery = useQuery({
    queryKey: ["parentClassRecordings", user?.uid],
    enabled: !!user?.uid && activeTab === "classes",
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<ParentClassRecording[]> => {
      if (!user?.uid) return [];
      const recordingsRef = query(
        collection(db, "parentClassRecordings"),
        where("parentId", "==", user.uid)
      );
      const snap = await getDocs(recordingsRef);
      return snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
        .sort((a, b) => {
          const aTime = toDateOrNull((a as any).updatedAt || (a as any).createdAt)?.getTime() ?? 0;
          const bTime = toDateOrNull((b as any).updatedAt || (b as any).createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        });
    },
  });

  const classesMonthLabel = useMemo(() => {
    return classesMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [classesMonth]);
  const parentRecordingFolder = useMemo(() => {
    const folders = classRecordingsQuery.data ?? [];
    if (!folders.length) return null;
    return folders[0] ?? null;
  }, [classRecordingsQuery.data]);
  const parentRecordingFolderUrl = String(
    parentRecordingFolder?.folderUrl || parentRecordingFolder?.recordingUrl || ""
  ).trim();

  const monthStart = useMemo(() => new Date(classesMonth.getFullYear(), classesMonth.getMonth(), 1), [classesMonth]);
  const monthEnd = useMemo(() => new Date(classesMonth.getFullYear(), classesMonth.getMonth() + 1, 0, 23, 59, 59, 999), [classesMonth]);

  const allKidSessions = useMemo(() => (kidSessionsQuery.data ?? []) as KidSession[], [kidSessionsQuery.data]);
  const sortedClassSessions = useMemo(() => {
    return allKidSessions
      .map((session) => ({
        session,
        start: sessionStartDate(session),
        status: normalizeStatus(session.status),
      }))
      .filter((row): row is { session: KidSession; start: Date; status: string } => Boolean(row.start))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [allKidSessions]);

  const todayDayKey = toYMD(new Date());

  const todayClassSessions = useMemo(() => {
    return sortedClassSessions.filter((row) => toYMD(row.start) === todayDayKey);
  }, [sortedClassSessions, todayDayKey]);

  const upcomingClassSessions = useMemo(() => {
    return sortedClassSessions.filter((row) => {
      if (toYMD(row.start) <= todayDayKey) return false;
      return row.status === "scheduled" || row.status === "in_progress";
    });
  }, [sortedClassSessions, todayDayKey]);

  const completedClassSessions = useMemo(() => {
    return [...sortedClassSessions]
      .filter((row) => row.status === "completed")
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [sortedClassSessions]);

  const rescheduledClassSessions = useMemo(() => {
    return [...sortedClassSessions]
      .filter((row) => row.status === "reschedule_requested")
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [sortedClassSessions]);

  const groupedUpcomingSessions = useMemo(() => {
    const grouped: Record<string, { date: Date; rows: Array<{ session: KidSession; start: Date; status: string }> }> = {};
    upcomingClassSessions.forEach((row) => {
      const key = toYMD(row.start);
      if (!grouped[key]) grouped[key] = { date: row.start, rows: [] };
      grouped[key].rows.push(row);
    });
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
  }, [upcomingClassSessions]);

  const groupedCompletedSessions = useMemo(() => {
    const grouped: Record<string, { date: Date; rows: Array<{ session: KidSession; start: Date; status: string }> }> = {};
    completedClassSessions.forEach((row) => {
      const key = toYMD(row.start);
      if (!grouped[key]) grouped[key] = { date: row.start, rows: [] };
      grouped[key].rows.push(row);
    });
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, value]) => value);
  }, [completedClassSessions]);

  const groupedRescheduledSessions = useMemo(() => {
    const grouped: Record<string, { date: Date; rows: Array<{ session: KidSession; start: Date; status: string }> }> = {};
    rescheduledClassSessions.forEach((row) => {
      const key = toYMD(row.start);
      if (!grouped[key]) grouped[key] = { date: row.start, rows: [] };
      grouped[key].rows.push(row);
    });
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, value]) => value);
  }, [rescheduledClassSessions]);

  const classesCalendarMonthLabel = useMemo(() => {
    return classesCalendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [classesCalendarMonth]);

  const classesCalendarStart = useMemo(
    () => new Date(classesCalendarMonth.getFullYear(), classesCalendarMonth.getMonth(), 1),
    [classesCalendarMonth]
  );
  const classesCalendarEnd = useMemo(
    () => new Date(classesCalendarMonth.getFullYear(), classesCalendarMonth.getMonth() + 1, 0, 23, 59, 59, 999),
    [classesCalendarMonth]
  );

  const classesCalendarSessions = useMemo(() => {
    const startMs = classesCalendarStart.getTime();
    const endMs = classesCalendarEnd.getTime();
    return sortedClassSessions.filter((row) => {
      const ts = row.start.getTime();
      return ts >= startMs && ts <= endMs;
    });
  }, [sortedClassSessions, classesCalendarStart, classesCalendarEnd]);

  const classesCalendarSessionsByDay = useMemo(() => {
    const map: Record<string, Array<{ session: KidSession; start: Date; status: string }>> = {};
    classesCalendarSessions.forEach((row) => {
      const key = toYMD(row.start);
      if (!map[key]) map[key] = [];
      map[key].push(row);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    });
    return map;
  }, [classesCalendarSessions]);

  const classesCalendarDays = useMemo(() => {
    const year = classesCalendarMonth.getFullYear();
    const month = classesCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const cells: Array<{ key: string; date: Date | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ key: `blank-${i}`, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ key: toYMD(dt), date: dt });
    }
    while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, date: null });
    return cells;
  }, [classesCalendarMonth]);

  const classesCalendarSelectedRows = useMemo(() => {
    if (!classesCalendarSelectedDayKey) return [];
    return classesCalendarSessionsByDay[classesCalendarSelectedDayKey] || [];
  }, [classesCalendarSelectedDayKey, classesCalendarSessionsByDay]);

  const resolveSessionChildName = (session: KidSession) => {
    const directName = String((session as any).kidName || (session as any).childName || "").trim();
    if (directName) return directName;

    const namesMap = (session as any).kidNames;
    if (namesMap && selectedKidId && typeof namesMap === "object") {
      const mapped = String((namesMap as Record<string, string>)[selectedKidId] || "").trim();
      if (mapped) return mapped;
    }

    return String(selectedKid?.fullName || selectedKid?.name || "Child");
  };

  const openMeetingLink = (url: string) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) return;
    const isTeamsUrl = /^https?:\/\/([a-z0-9-]+\.)?teams\.microsoft\.com/i.test(trimmed);
    if (isTeamsUrl) {
      const teamsDeepLink = `msteams:${trimmed.replace(/^https?:/, "")}`;
      window.location.assign(teamsDeepLink);
      window.setTimeout(() => {
        window.open(trimmed, "_blank", "noopener,noreferrer");
      }, 900);
      return;
    }
    window.open(trimmed, "_blank", "noopener,noreferrer");
  };

  const openJoinClass = async (session: KidSession) => {
    if (joiningSessionId === session.id) return;
    setJoiningSessionId(session.id);
    try {
      const directJoinUrl =
        (typeof session.joinUrl === "string" && session.joinUrl.trim()) ||
        (typeof (session as any).meetingLink === "string" && String((session as any).meetingLink).trim()) ||
        "";
      if (directJoinUrl) {
        openMeetingLink(directJoinUrl);
        return;
      }

      const enrollmentIdFromSession =
        (typeof (session as any).enrollmentId === "string" && String((session as any).enrollmentId).trim()) ||
        "";
      const enrollmentIdFromSessionId =
        typeof session.id === "string" && session.id.includes("_")
          ? session.id.split("_")[0].trim()
          : "";
      const enrollmentId = enrollmentIdFromSession || enrollmentIdFromSessionId;
      if (!enrollmentId) return;

      const enrollmentSnap = await getDoc(doc(db, "enrollments", enrollmentId));
      const data = enrollmentSnap.data() as any;
      const fallbackJoinUrl =
        (typeof data?.joinUrl === "string" && data.joinUrl.trim()) ||
        (typeof data?.meetingLink === "string" && data.meetingLink.trim()) ||
        "";
      if (!fallbackJoinUrl) return;
      openMeetingLink(fallbackJoinUrl);
    } catch (error) {
      console.error("[ParentDashboard] Failed to open join class link", error);
    } finally {
      setJoiningSessionId((current) => (current === session.id ? null : current));
    }
  };

  const sessionsPhonicsCourseIds = useMemo(() => {
    return allKidSessions
      .map((session) => normalizeSessionCourseId(session))
      .filter((id): id is string => Boolean(id));
  }, [allKidSessions]);

  const mostRecentSessionCourseId = useMemo(() => {
    let latestTime = 0;
    let latestCourseId: string | null = null;
    allKidSessions.forEach((session) => {
      const courseId = normalizeSessionCourseId(session);
      if (!courseId) return;
      const time = sessionStartDate(session)?.getTime() ?? 0;
      if (time >= latestTime) {
        latestTime = time;
        latestCourseId = courseId;
      }
    });
    return latestCourseId;
  }, [allKidSessions]);

  const displayCourseId = useMemo(() => {
    if (enrolledCourseIds.length === 1) {
      const enrolledCourseId = enrolledCourseIds[0];
      if (
        mostRecentSessionCourseId &&
        mostRecentSessionCourseId !== enrolledCourseId
      ) {
        return mostRecentSessionCourseId;
      }
      return enrolledCourseId;
    }
    if (mostRecentSessionCourseId) return mostRecentSessionCourseId;
    return null;
  }, [enrolledCourseIds, mostRecentSessionCourseId]);

  const phonicsProgressByCourse = useMemo(() => {
    if (!displayCourseId) return [];

    const topics = curriculumTopicsByCourseId[displayCourseId] ?? [];
    const progressDocs = (phonicsProgressQuery.data ?? []) as any[];

    const resolveDocCourseId = (doc: any): string | null => {
      if (!doc) return null;
      const direct = normalizePhonicsCourseId(
        doc?.courseId ?? doc?.course?.id ?? doc?.course
      );
      if (direct) return direct;
      const key = String(doc?.topicId ?? doc?.id ?? "").trim();
      return key ? topicCourseById[key] ?? null : null;
    };

    const labelMap = new Map<string, any>();
    const labelUpdatedAt = new Map<string, number>();
    const addLabelEntry = (rawLabel: string | undefined | null, doc: any) => {
      const key = normalizeTopicText(rawLabel || "");
      if (!key) return;
      const nextTime = doc?.updatedAt?.toMillis?.() ?? 0;
      const prevTime = labelUpdatedAt.get(key) ?? -1;
      if (nextTime >= prevTime) {
        labelMap.set(key, doc);
        labelUpdatedAt.set(key, nextTime);
      }
    };

    progressDocs.forEach((doc) => {
      const docCourseId = resolveDocCourseId(doc);
      if (docCourseId && docCourseId !== displayCourseId) return;
      addLabelEntry(doc?.topicName, doc);
    });

    let completedCount = 0;
    let topicsUpdated = 0;
    let idMatchCount = 0;
    let labelMatchCount = 0;
    let lastUpdatedAtMs: number | null = null;

    const rows = topics.map((topic) => {
      let matchedDoc: any = null;
      let matchedBy: "id" | "label" | "none" = "none";

      const docById = progressByTopicId[topic.id];
      if (docById) {
        const docCourseId = resolveDocCourseId(docById);
        if (!docCourseId || docCourseId === displayCourseId) {
          matchedDoc = docById;
          matchedBy = "id";
        }
      }

      if (!matchedDoc) {
        const labelKeys = [normalizeTopicText(topic.displayTitle ?? topic.label)].filter(Boolean);
        for (const key of Array.from(new Set(labelKeys))) {
          const candidate = labelMap.get(key);
          if (candidate) {
            matchedDoc = candidate;
            matchedBy = "label";
            break;
          }
        }
      }

      const mastery = matchedDoc?.mastery;
      const masteryLower = String(mastery ?? "").toLowerCase().trim();
      const isMastered = masteryLower === "mastered";

      let status: "not_started" | "in_progress" | "completed" = "not_started";
      if (matchedDoc) {
        if (isMastered) status = "completed";
        else if (masteryLower && masteryLower !== "not_started") {
          status = "in_progress";
        }
      }

      if (matchedDoc) topicsUpdated += 1;
      if (status === "completed") completedCount += 1;
      if (matchedBy === "id") idMatchCount += 1;
      if (matchedBy === "label") labelMatchCount += 1;

      const updatedAtMs =
        matchedDoc?.updatedAt?.toMillis?.() ??
        (typeof matchedDoc?.updatedAt === "number" ? matchedDoc.updatedAt : null);
      if (updatedAtMs && (!lastUpdatedAtMs || updatedAtMs > lastUpdatedAtMs)) {
        lastUpdatedAtMs = updatedAtMs;
      }
      const topicMeta = topic as any;
      const progressSkills = getProgressSkillsForLesson({
        courseId: displayCourseId,
        topicId: topic.id,
        lessonId: topicMeta.lesson ?? topic.id,
        rubricType: topicMeta.rubricType ?? null,
        stageLabel: topic.stageLabel ?? null,
        lessonTitle: topic.displayTitle ?? topic.label,
        topicLabel: topic.label,
        area: topicMeta.area ?? "phonics",
        subskillChips: topicMeta.subskillChips ?? [],
        progressSkillsMeta: matchedDoc?.progressRatingsMeta,
      });

      return {
        id: topic.id,
        label: topic.displayTitle ?? topic.label,
        stageLabel: topic.stageLabel ?? null,
        stageOrder: typeof topic.stageOrder === "number" ? topic.stageOrder : null,
        status,
        mastery: mastery ?? "",
        progressSkills,
        progressRatings: normalizeProgressRatings(
          matchedDoc?.progressRatings,
          progressSkills,
          {
            legacyRatings: matchedDoc?.skillRatings,
            mastery: matchedDoc?.mastery,
            checks: matchedDoc?.checks,
          },
        ),
        strengthChips: Array.isArray(matchedDoc?.strengthSubskills)
          ? matchedDoc.strengthSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        practiceChips: Array.isArray(matchedDoc?.needsPracticeSubskills)
          ? matchedDoc.needsPracticeSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : Array.isArray(matchedDoc?.practiceSubskills)
            ? matchedDoc.practiceSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
            : [],
        focusChips: Array.isArray(matchedDoc?.selectedSubskills)
          ? matchedDoc.selectedSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        confusionChips: Array.isArray(matchedDoc?.confusions)
          ? matchedDoc.confusions.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        remark: matchedDoc?.teacherRemark ?? matchedDoc?.remark ?? "",
        updatedAtMs,
      };
    });

    const totalTopics = topics.length;
    const overallPctRaw =
      totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
    const overallPct = clampPercent(overallPctRaw);

    return [
      {
        courseId: displayCourseId,
        courseLabel: phonicsLabelsByCourseId[displayCourseId] || displayCourseId,
        rows,
        totalTopics,
        topicsUpdated,
        completedCount,
        overallPct,
        lastUpdatedAtMs,
        idMatchCount,
        labelMatchCount,
      },
    ];
  }, [
    displayCourseId,
    curriculumTopicsByCourseId,
    phonicsProgressQuery.data,
    progressByTopicId,
    topicCourseById,
  ]);

  const skillsInsightData = useMemo(() => {
    const selectedCourse = phonicsProgressByCourse[0];
    if (!selectedCourse) return null;
    const rows = selectedCourse.rows ?? [];

    const inferredSkillMap = new Map<
      string,
      { count: number; scoreTotal: number; lastUpdatedAtMs: number }
    >();
    const strengthSkillMap = new Map<string, { count: number; lastUpdatedAtMs: number }>();
    const practiceSkillMap = new Map<string, { count: number; lastUpdatedAtMs: number }>();
    const stageMap = new Map<string, { label: string; order: number; skills: Map<string, number> }>();
    const recentUpdates: Array<{ tag: string; stageLabel: string; stageOrder: number; updatedAtMs: number }> = [];

    rows.forEach((row: any) => {
      const masteryKey = masteryKeyFromValue(row.mastery);
      const masteryRank = Math.max(0, STAGE_MASTERY_ORDER.indexOf(masteryKey));
      const stageLabel = row.stageLabel || "Stage";
      const stageOrder =
        typeof row.stageOrder === "number" && row.stageOrder > 0
          ? row.stageOrder
          : parseStageOrderFromLabel(stageLabel) ?? 0;
      const strengthTags = Array.isArray(row.strengthChips) ? row.strengthChips : [];
      const practiceTags = Array.isArray(row.practiceChips) ? row.practiceChips : [];
      const fallbackTags = Array.isArray(row.focusChips) ? row.focusChips : [];
      const combinedTags =
        strengthTags.length > 0 || practiceTags.length > 0
          ? Array.from(new Set([...strengthTags, ...practiceTags]))
          : fallbackTags;
      if (!combinedTags.length) return;

      let stageEntry = stageMap.get(stageLabel);
      if (!stageEntry) {
        stageEntry = { label: stageLabel, order: stageOrder, skills: new Map() };
      }

      combinedTags.forEach((rawTag: string) => {
        const tag = String(rawTag || "").trim();
        if (!tag) return;

        stageEntry?.skills.set(tag, (stageEntry?.skills.get(tag) ?? 0) + 1);

        if (row.updatedAtMs) {
          recentUpdates.push({
            tag,
            stageLabel,
            stageOrder,
            updatedAtMs: row.updatedAtMs,
          });
        }
      });

      if (strengthTags.length > 0 || practiceTags.length > 0) {
        strengthTags.forEach((rawTag: string) => {
          const tag = String(rawTag || "").trim();
          if (!tag) return;
          const existing = strengthSkillMap.get(tag) ?? { count: 0, lastUpdatedAtMs: 0 };
          existing.count += 1;
          existing.lastUpdatedAtMs = Math.max(existing.lastUpdatedAtMs, row.updatedAtMs ?? 0);
          strengthSkillMap.set(tag, existing);
        });
        practiceTags.forEach((rawTag: string) => {
          const tag = String(rawTag || "").trim();
          if (!tag) return;
          const existing = practiceSkillMap.get(tag) ?? { count: 0, lastUpdatedAtMs: 0 };
          existing.count += 1;
          existing.lastUpdatedAtMs = Math.max(existing.lastUpdatedAtMs, row.updatedAtMs ?? 0);
          practiceSkillMap.set(tag, existing);
        });
      } else {
        fallbackTags.forEach((rawTag: string) => {
          const tag = String(rawTag || "").trim();
          if (!tag) return;
          const existing = inferredSkillMap.get(tag) ?? {
            count: 0,
            scoreTotal: 0,
            lastUpdatedAtMs: 0,
          };
          existing.count += 1;
          existing.scoreTotal += masteryRank;
          existing.lastUpdatedAtMs = Math.max(
            existing.lastUpdatedAtMs,
            row.updatedAtMs ?? 0
          );
          inferredSkillMap.set(tag, existing);
        });
      }

      stageMap.set(stageLabel, stageEntry);
    });

    const hasExplicitSkills = strengthSkillMap.size > 0 || practiceSkillMap.size > 0;
    const inferredSkills = Array.from(inferredSkillMap.entries()).map(([tag, data]) => ({
      tag,
      count: data.count,
      avgScore: data.scoreTotal / data.count,
      lastUpdatedAtMs: data.lastUpdatedAtMs,
    }));
    const strengths = hasExplicitSkills
      ? Array.from(strengthSkillMap.entries())
          .map(([tag, data]) => ({ tag, count: data.count, lastUpdatedAtMs: data.lastUpdatedAtMs }))
          .sort((a, b) => b.count - a.count || b.lastUpdatedAtMs - a.lastUpdatedAtMs)
          .slice(0, 6)
      : [...inferredSkills]
          .sort((a, b) => b.avgScore - a.avgScore || b.count - a.count)
          .slice(0, 6);
    const needsPractice = hasExplicitSkills
      ? Array.from(practiceSkillMap.entries())
          .map(([tag, data]) => ({ tag, count: data.count, lastUpdatedAtMs: data.lastUpdatedAtMs }))
          .sort((a, b) => b.count - a.count || b.lastUpdatedAtMs - a.lastUpdatedAtMs)
          .slice(0, 6)
      : [...inferredSkills]
          .sort((a, b) => a.avgScore - b.avgScore || b.count - a.count)
          .slice(0, 6);

    const stageGroups = Array.from(stageMap.values())
      .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label)))
      .map((stage) => ({
        label: stage.label,
        order: stage.order,
        topSkills: Array.from(stage.skills.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag, count]) => ({ tag, count })),
      }));

    const recent = recentUpdates
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
      .slice(0, 6);

    return {
      courseLabel: selectedCourse.courseLabel,
      strengths,
      needsPractice,
      stageGroups,
      recentUpdates: recent,
      totalSkills: hasExplicitSkills ? strengthSkillMap.size + practiceSkillMap.size : inferredSkills.length,
    };
  }, [phonicsProgressByCourse]);

  const recentTeacherRatings = useMemo(() => {
    const selectedCourse = phonicsProgressByCourse[0];
    if (!selectedCourse) return [] as any[];

    return (selectedCourse.rows ?? [])
      .map((row: any) => {
        const progressSkills = Array.isArray(row.progressSkills)
          ? row.progressSkills
          : normalizeProgressSkillsMeta(row.progressRatingsMeta);
        const progressRatings = normalizeProgressRatings(
          row.progressRatings,
          progressSkills,
          {
            legacyRatings: row.skillRatings,
            mastery: row.mastery,
            checks: row.checks,
          },
        );
        const summary = summarizeProgressRatings(progressRatings, progressSkills);
        const hasMeaningfulData =
          summary.ratedSkillCount > 0 ||
          Boolean(String(row.remark ?? "").trim()) ||
          row.updatedAtMs;
        return {
          ...row,
          courseLabel: selectedCourse.courseLabel,
          progressSkills,
          progressRatings,
          ...summary,
          hasMeaningfulData,
        };
      })
      .filter((row: any) => row.hasMeaningfulData && row.progressSkills.length > 0)
      .sort((a: any, b: any) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0))
      .slice(0, 6);
  }, [phonicsProgressByCourse]);

  const recentTeacherRatingsSummary = useMemo(() => {
    if (recentTeacherRatings.length === 0) return null;

    const strongestMap = new Map<string, number>();
    const practiceMap = new Map<string, number>();
    let averageTotal = 0;
    let averageCount = 0;

    recentTeacherRatings.forEach((lesson: any) => {
      if (lesson.ratedSkillCount > 0) {
        averageTotal += lesson.averageRating;
        averageCount += 1;
      }
      const exactStrengths =
        Array.isArray(lesson.strengthChips) && lesson.strengthChips.length > 0
          ? lesson.strengthChips
          : (lesson.strongestSkills ?? []).map((skill: any) => skill.label);
      const exactPractice =
        Array.isArray(lesson.practiceChips) && lesson.practiceChips.length > 0
          ? lesson.practiceChips
          : Array.isArray(lesson.focusChips) && lesson.focusChips.length > 0
            ? lesson.focusChips
            : (lesson.needsPracticeSkills ?? []).map((skill: any) => skill.label);

      exactStrengths.forEach((skill: string) => {
        strongestMap.set(skill, (strongestMap.get(skill) ?? 0) + 1);
      });
      exactPractice.forEach((skill: string) => {
        practiceMap.set(skill, (practiceMap.get(skill) ?? 0) + 1);
      });
    });

    const averageRecentRating = averageCount > 0 ? averageTotal / averageCount : 0;

    return {
      latestLesson: recentTeacherRatings[0],
      averageRecentRating,
      averageRecentLabel: skillRatingLegendLabel(Math.round(averageRecentRating)),
      strongestSkills: Array.from(strongestMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 4)
        .map(([label]) => label),
      needsPracticeSkills: Array.from(practiceMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 4)
        .map(([label]) => label),
    };
  }, [recentTeacherRatings]);

  const normalizedInsightsCourseId = useMemo(() => {
    return normalizeCurriculumCourseId(insightsCourseId) || null;
  }, [insightsCourseId]);

  const insightsStageData = useMemo(() => {
    if (!normalizedInsightsCourseId) return null;
    const topics = curriculumTopicsByCourseId[normalizedInsightsCourseId] ?? [];
    if (topics.length === 0) {
      return { courseId: normalizedInsightsCourseId, stageSummaries: [] as any[] };
    }

    const progressDocs = (phonicsProgressQuery.data ?? []) as any[];
    const resolveDocCourseId = (doc: any): string | null => {
      if (!doc) return null;
      const direct = normalizeCurriculumCourseId(
        doc?.courseId ?? doc?.course?.id ?? doc?.course
      );
      if (direct) return direct;
      const key = String(doc?.topicId ?? doc?.id ?? "").trim();
      return key ? topicCourseById[key] ?? null : null;
    };

    const labelMap = new Map<string, any>();
    const labelUpdatedAt = new Map<string, number>();
    const addLabelEntry = (rawLabel: string | undefined | null, doc: any) => {
      const key = normalizeTopicText(rawLabel || "");
      if (!key) return;
      const nextTime = doc?.updatedAt?.toMillis?.() ?? 0;
      const prevTime = labelUpdatedAt.get(key) ?? -1;
      if (nextTime >= prevTime) {
        labelMap.set(key, doc);
        labelUpdatedAt.set(key, nextTime);
      }
    };

    progressDocs.forEach((doc) => {
      const docCourseId = resolveDocCourseId(doc);
      if (docCourseId && docCourseId !== normalizedInsightsCourseId) return;
      addLabelEntry(doc?.topicName, doc);
    });

    const stageOrderMap = buildStageOrderMap(topics);

    const rows = topics.map((topic) => {
      let matchedDoc: any = null;
      const docById = progressByTopicId[topic.id];
      if (docById) {
        const docCourseId = resolveDocCourseId(docById);
        if (!docCourseId || docCourseId === normalizedInsightsCourseId) {
          matchedDoc = docById;
        }
      }
      if (!matchedDoc) {
        const labelKeys = [normalizeTopicText(topic.displayTitle ?? topic.label)].filter(Boolean);
        for (const key of Array.from(new Set(labelKeys))) {
          const candidate = labelMap.get(key);
          if (candidate) {
            matchedDoc = candidate;
            break;
          }
        }
      }

      const updatedAtMs =
        matchedDoc?.updatedAt?.toMillis?.() ??
        (typeof matchedDoc?.updatedAt === "number" ? matchedDoc.updatedAt : null);

      const label = topic.stageLabel ?? "Lessons";
      const order =
        typeof topic.stageOrder === "number" && topic.stageOrder > 0
          ? topic.stageOrder
          : parseStageOrderFromLabel(label) ?? stageOrderMap.get(label) ?? 0;
      const topicMeta = topic as any;
      const progressSkills = getProgressSkillsForLesson({
        courseId: normalizedInsightsCourseId,
        topicId: topic.id,
        lessonId: topicMeta.lesson ?? topic.id,
        rubricType: topicMeta.rubricType ?? null,
        stageLabel: topic.stageLabel ?? null,
        lessonTitle: topic.displayTitle ?? topic.label,
        topicLabel: topic.label,
        area: topicMeta.area ?? "phonics",
        subskillChips: topicMeta.subskillChips ?? [],
        progressSkillsMeta: matchedDoc?.progressRatingsMeta,
      });

      return {
        id: topic.id,
        stageLabel: label,
        stageOrder: order,
        mastery: matchedDoc?.mastery ?? "",
        progressSkills,
        progressRatings: normalizeProgressRatings(
          matchedDoc?.progressRatings,
          progressSkills,
          {
            legacyRatings: matchedDoc?.skillRatings,
            mastery: matchedDoc?.mastery,
            checks: matchedDoc?.checks,
          },
        ),
        strengthChips: Array.isArray(matchedDoc?.strengthSubskills)
          ? matchedDoc.strengthSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        practiceChips: Array.isArray(matchedDoc?.needsPracticeSubskills)
          ? matchedDoc.needsPracticeSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : Array.isArray(matchedDoc?.practiceSubskills)
            ? matchedDoc.practiceSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
            : [],
        focusChips: Array.isArray(matchedDoc?.selectedSubskills)
          ? matchedDoc.selectedSubskills.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        confusionChips: Array.isArray(matchedDoc?.confusions)
          ? matchedDoc.confusions.filter((item: unknown) => typeof item === "string").slice(0, 3)
          : [],
        updatedAtMs,
      };
    });

    const stageGroups = new Map<string, { label: string; order: number; rows: any[] }>();
    rows.forEach((row) => {
      const key = `${row.stageOrder}__${row.stageLabel}`;
      const existing = stageGroups.get(key);
      if (existing) existing.rows.push(row);
      else stageGroups.set(key, { label: row.stageLabel, order: row.stageOrder, rows: [row] });
    });

    const stageSummaries = Array.from(stageGroups.values())
      .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label)))
      .map((group) => {
        const masteryKey = aggregateStageMastery(group.rows.map((r) => r.mastery));
        const stageHint = STAGE_HINTS_BY_COURSE[normalizedInsightsCourseId]?.[group.order] ?? "";
        const progressPct = calcStageProgressPct(group.rows);
        const completedCount = group.rows.filter((row: any) => masteryKeyFromValue(row.mastery) === "mastered").length;
        const totalCount = group.rows.length;
        const expectations =
          STAGE_EXPECTATIONS_BY_COURSE[normalizedInsightsCourseId]?.[group.order] ?? [];
        return {
          label: group.label,
          order: group.order,
          masteryKey,
          focusChips: pickStageFocus(group.rows),
          stageHint,
          progressPct,
          completedCount,
          totalCount,
          expectations,
        };
      });

    return { courseId: normalizedInsightsCourseId, stageSummaries };
  }, [
    normalizedInsightsCourseId,
    curriculumTopicsByCourseId,
    phonicsProgressQuery.data,
    progressByTopicId,
    topicCourseById,
  ]);

  const phonicsLoading =
    enrollmentsQuery.isLoading ||
    phonicsProgressQuery.isLoading ||
    curriculumTopicsQuery.isLoading ||
    kidSessionsQuery.isLoading;

  const phonicsError = Boolean(
    phonicsProgressQuery.error ||
      enrollmentsQuery.error ||
      curriculumTopicsQuery.error
  );

  const phonicsErrorMessage = useMemo(() => {
    const err =
      (phonicsProgressQuery.error as any) ||
      (enrollmentsQuery.error as any) ||
      (curriculumTopicsQuery.error as any);
    const code = String(err?.code ?? "").toLowerCase();
    if (code === "permission-denied") return "Access issue — please contact admin.";
    if (code === "failed-precondition")
      return "Setup issue (index missing). Please contact admin.";
    return "Unable to load progress right now.";
  }, [
    phonicsProgressQuery.error,
    enrollmentsQuery.error,
    curriculumTopicsQuery.error,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (typeof window === "undefined" || (window as any).__TS_DEBUG_PARENT_DASHBOARD__ !== true) return;
    if (phonicsLoading) return;
    const progressDocs = (phonicsProgressQuery.data ?? []) as any[];
    const sample = progressDocs.slice(0, 3).map((doc) => ({
      identifier: doc?.id,
      courseIdentifier: doc?.courseId ?? null,
      topicName: doc?.topicName ?? doc?.label ?? null,
    }));
    const courseDebug = phonicsProgressByCourse[0];
    console.debug("[Curriculum Debug]", {
      displayCourseIdentifier: displayCourseId,
      enrolledCourseIdentifiers: enrolledCourseIds,
      sessionCourseIdentifiers: sessionsPhonicsCourseIds,
      progressDocumentsCount: progressDocs.length,
      identifierMatches: courseDebug?.idMatchCount ?? 0,
      labelMatches: courseDebug?.labelMatchCount ?? 0,
      progressSample: sample,
    });
  }, [
    displayCourseId,
    enrolledCourseIds,
    sessionsPhonicsCourseIds,
    phonicsLoading,
    phonicsProgressQuery.data,
    phonicsProgressByCourse,
  ]);

  const monthSessions = useMemo(() => {
    const startMs = monthStart.getTime();
    const endMs = monthEnd.getTime();
    return allKidSessions
      .map((s) => {
        const start = sessionStartDate(s);
        return { s, start };
      })
      .filter(({ start }) => !!start && start!.getTime() >= startMs && start!.getTime() <= endMs)
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()))
      .map(({ s }) => s);
  }, [allKidSessions, monthStart, monthEnd]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, KidSession[]> = {};
    monthSessions.forEach((s) => {
      const dt = sessionStartDate(s);
      if (!dt) return;
      const key = toYMD(dt);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });

    // sort sessions within day by time
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const da = sessionStartDate(a)?.getTime() ?? 0;
        const db = sessionStartDate(b)?.getTime() ?? 0;
        return da - db;
      });
    });

    return map;
  }, [monthSessions]);

  const classesCounts = useMemo(() => {
    const totals = {
      total: monthSessions.length,
      completed: 0,
      in_progress: 0,
      scheduled: 0,
      cancelled: 0,
      no_show: 0,
      reschedule_requested: 0,
      other: 0,
      upcoming: 0,
    };

    const now = new Date().getTime();

    monthSessions.forEach((s) => {
      const st = normalizeStatus(s.status);
      if (st in totals) (totals as any)[st] += 1;
      else totals.other += 1;

      const start = sessionStartDate(s)?.getTime() ?? null;
      if ((st === "scheduled" || st === "in_progress") && start !== null && start >= now) {
        totals.upcoming += 1;
      }
    });

    return totals;
  }, [monthSessions]);

  const billingSummary = useMemo(() => {
    const kidId = selectedKidId ? String(selectedKidId) : null;
    const completedSessions = monthSessions.filter((s) => {
      if (!kidId) return false;
      if (normalizeStatus(s.status) !== "completed") return false;
      const attendance = (s as any).attendance || {};
      const entry = attendance?.[kidId];
      const status = entry?.status ?? entry;
      return status === "present" || status === "late";
    });

    const totalBilled = completedSessions.reduce((sum, s) => {
      const raw =
        (s as any).feeAmount ??
        (s as any).feePerClass ??
        (s as any).amount ??
        0;
      const amount = Number(raw);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const avgRate =
      completedSessions.length > 0
        ? Math.round(totalBilled / completedSessions.length)
        : 0;

    const charges = (billingChargesQuery.data ?? []) as BillingCharge[];
    const paidThisMonth = charges.reduce((sum, charge) => {
      if (!kidId) return sum;
      const chargeKidId = String((charge as any).kidId || '');
      if (!chargeKidId || chargeKidId !== kidId) return sum;
      const source = String((charge as any).source ?? '').toLowerCase().trim();
      if (source && source !== 'session_present_completed') return sum;
      const status = String(charge.status ?? "").toLowerCase().trim();
      const isPaid = status === "paid" || status === "settled";
      const rawAmount = Number(charge.amount ?? 0);
      const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
      const rawPaid = Number((charge as any).paidAmount ?? 0);
      const paidAmount = Number.isFinite(rawPaid) ? rawPaid : 0;
      if (isPaid) {
        return sum + (paidAmount > 0 ? Math.min(paidAmount, amount) : amount);
      }
      if (paidAmount > 0) {
        return sum + Math.min(paidAmount, amount);
      }
      return sum;
    }, 0);

    const dueNow = Math.max(totalBilled - paidThisMonth, 0);

    return {
      dueNow,
      billedThisMonth: totalBilled,
      chargesThisMonth: completedSessions.length,
      totalCharges: completedSessions.length,
      avgRate,
      paidThisMonth,
    };
  }, [billingChargesQuery.data, monthSessions, selectedKidId]);

  const profilePaymentsSummary = useMemo(() => {
    const rows = (parentPaymentsQuery.data ?? []) as ParentPaymentRecord[];
    const kidId = selectedKidId ? String(selectedKidId) : null;
    const filtered = kidId
      ? rows.filter((p) => String(p.kidId || "") === kidId)
      : rows;
    return filtered.reduce(
      (acc, payment) => {
        const rawAmount = Number(payment?.amount ?? 0);
        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
        const rawApplied = Number(payment?.appliedAmount ?? NaN);
        const applied = Number.isFinite(rawApplied)
          ? rawApplied
          : (() => {
              const rawUnapplied = Number(payment?.unappliedAmount ?? 0);
              const unapplied = Number.isFinite(rawUnapplied) ? rawUnapplied : 0;
              return amount - unapplied;
            })();
        const rawUnapplied = Number(payment?.unappliedAmount ?? NaN);
        const unapplied = Number.isFinite(rawUnapplied)
          ? rawUnapplied
          : amount - applied;
        acc.total += amount;
        acc.applied += applied;
        acc.unapplied += unapplied;
        acc.count += 1;
        return acc;
      },
      { total: 0, applied: 0, unapplied: 0, count: 0 }
    );
  }, [parentPaymentsQuery.data, selectedKidId]);

  const profileEnrollments = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const kidId = selectedKidId ? String(selectedKidId) : "";
    const filtered = enrollments.filter((enr) => {
      if (!kidId) return true;
      if (String(enr.kidId || "") === kidId) return true;
      if (String(enr.studentId || "") === kidId) return true;
      if (Array.isArray(enr.kidIds) && enr.kidIds.some((id) => String(id) === kidId)) return true;
      return false;
    });
    return filtered.map((enr) => {
      const courseId = String(enr.courseId || "").trim();
      const fallbackLabel = String(enr.courseLabel || enr.courseName || "").trim();
      const label = courseId ? formatCourseLabel(courseId, fallbackLabel) : fallbackLabel || "Course";
      const teacherId = String(
        enr.teacherId ||
          enr.teacherUid ||
          enr.teacherUserId ||
          (enr as any).teacher ||
          ""
      ).trim();
      const teacherProfile = teacherId ? teacherLookupQuery.data?.[teacherId] : undefined;
      const teacherName = teacherProfile?.name || "";
      const rawFee =
        enr.feePerClass ??
        enr.feePerSession ??
        enr.ratePerSession ??
        (enr as any).rate ??
        null;
      const fee = rawFee !== null && Number.isFinite(Number(rawFee)) ? Number(rawFee) : null;
      return {
        id: enr.id,
        courseId,
        courseLabel: label,
        status: String(enr.status || "active"),
        fee,
        teacherId,
        teacherName,
      };
    });
  }, [enrollmentsQuery.data, selectedKidId, coursesLookupQuery.data, teacherLookupQuery.data]);

  const renderProfileContent = () => {
    const kidName = selectedKid?.fullName || "Child";
    const hasKids = kids.length > 0;
    const hasEnrollments = profileEnrollments.length > 0;

    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Parent</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {user?.displayName || "Parent"}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {user?.email || "Email not available"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Children</div>
            {hasKids ? (
              <div className="mt-2 space-y-2">
                {kids.map((kid: any) => (
                  <div
                    key={kid.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      String(kid.id) === String(selectedKidId)
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <span>{kid.fullName || kid.name || "Unnamed"}</span>
                    {String(kid.id) === String(selectedKidId) && (
                      <span className="text-xs font-semibold">Viewing</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">No children linked yet.</div>
            )}
          </Card>
        </div>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Enrollments</div>
          {hasEnrollments ? (
            <div className="mt-3 space-y-3">
              {profileEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold">{enr.courseLabel}</div>
                    <div className="text-xs text-slate-500">Status: {enr.status}</div>
                    <div className="text-xs text-slate-500">
                      Teacher: {enr.teacherName || "Assigned soon"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Fee per class: {enr.fee !== null ? `₹${enr.fee.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">
              No enrollments found for {kidName}.
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Payments</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <div className="text-xs text-slate-500">Due now</div>
              <div className="text-lg font-semibold">
                ₹{billingSummary.dueNow.toLocaleString("en-IN")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Billed this month: ₹{billingSummary.billedThisMonth.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <div className="text-xs text-slate-500">Paid so far</div>
              <div className="text-lg font-semibold">
                ₹{profilePaymentsSummary.total.toLocaleString("en-IN")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Payments recorded: {profilePaymentsSummary.count}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Class Insights</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
              <div className="text-xs text-slate-500">Completed (this month)</div>
              <div className="text-lg font-semibold">{billingSummary.chargesThisMonth}</div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
              <div className="text-xs text-slate-500">Upcoming</div>
              <div className="text-lg font-semibold">{classesCounts.upcoming}</div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
              <div className="text-xs text-slate-500">Rescheduled</div>
              <div className="text-lg font-semibold">{classesCounts.reschedule_requested}</div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
              <div className="text-xs text-slate-500">Total this month</div>
              <div className="text-lg font-semibold">{classesCounts.total}</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const billingLoading = billingChargesQuery.isLoading || kidSessionsQuery.isLoading;

  const renderParentSessionCard = (
    row: { session: KidSession; start: Date; status: string },
    includeDateLabel = false
  ) => {
    const { session, start, status } = row;
    const canJoin =
      status !== "completed" &&
      status !== "cancelled" &&
      status !== "no_show" &&
      status !== "reschedule_requested" &&
      ((typeof session.joinUrl === "string" && session.joinUrl.trim().length > 0) ||
        (typeof (session as any).meetingLink === "string" && String((session as any).meetingLink).trim().length > 0) ||
        (typeof (session as any).enrollmentId === "string" && String((session as any).enrollmentId).trim().length > 0) ||
        (typeof session.id === "string" && session.id.includes("_")));

    const dateLabel = start.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <Card key={session.id} className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatSessionTimeRange(session)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(status)}`}>
                {statusLabel(status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {resolveSessionChildName(session)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {includeDateLabel ? `${dateLabel} · ` : ""}
              {session.courseName ? `Course: ${session.courseName}` : "Course: —"}
              {session.teacherName ? ` • Teacher: ${session.teacherName}` : ""}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => openJoinClass(session)}
            disabled={!canJoin || joiningSessionId === session.id}
            className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {joiningSessionId === session.id ? "Opening…" : "Join Class"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  // ---- Payments tab state ----
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // ---- Overview metrics ----
  const overviewMetrics = useMemo(() => {
    const data = kidSummaryQuery.data;
    if (!data) return null;

    const summary = data.summary;
    const progress = data.progress;

    const confidenceNow =
      typeof canonicalConfidenceNow === "number"
        ? canonicalConfidenceNow
        : summary?.confidenceNow ?? null;

    const byGame = progress?.byGame || {};
    const rootGamesCompleted = Object.values(byGame).filter(
      (g: any) => (g?.completedLevels ?? 0) > 0
    ).length;
    const gamesCompleted = canonicalGamesCompleted ?? rootGamesCompleted;
    const rootTimePractisedMs =
      typeof summary?.timeSpentWeekSec === "number" && Number.isFinite(summary.timeSpentWeekSec)
        ? Math.max(0, Math.floor(summary.timeSpentWeekSec * 1000))
        : null;
    const totalTimePractisedMs =
      typeof canonicalTimePractisedMs === "number" ? canonicalTimePractisedMs : rootTimePractisedMs;

    const gamesStats = summary?.games || {};
    const nums = Object.values(gamesStats)
      .map((g: any) =>
        typeof g?.avgAccuracy === "number"
          ? g.avgAccuracy
          : typeof g?.bestAccuracy === "number"
            ? g.bestAccuracy
            : null
      )
      .filter((n): n is number => typeof n === "number");

    const avgScore =
      typeof canonicalLearningLevelAccuracy10 === "number"
        ? canonicalLearningLevelAccuracy10
        : typeof summary?.avgAccuracy10 === "number"
        ? summary.avgAccuracy10
        : nums.length > 0
          ? nums.reduce((sum, a) => sum + a, 0) / nums.length
          : null;

    const totalPoints =
      typeof canonicalTotalPointsLifetime === "number"
        ? canonicalTotalPointsLifetime
        : summary?.totalPoints ?? null;

    const rawJourneyStageId =
      typeof canonicalJourneyCurrentStageId === "number"
        ? canonicalJourneyCurrentStageId
        : summary?.stage?.currentStageId ?? null;
    const stageProgressPct =
      typeof canonicalJourneyStageProgressPct === "number"
        ? canonicalJourneyStageProgressPct
        : summary?.stage?.stageProgressPct ?? null;
    const stageId = mapJourneyStageIdForDisplay(rawJourneyStageId, stageProgressPct);
    const stageMessage = journeyStageMessageForDisplay(stageId);

    const rootLastUpdatedAt = latestTimestampFromKidSummary(data);
    const lastUpdatedAt =
      overviewCanonicalFreshnessMs > 0
        ? overviewCanonicalFreshnessMs
        : rootLastUpdatedAt > 0
          ? rootLastUpdatedAt
          : null;

    return {
      confidenceNow,
      gamesCompleted,
      avgScore,
      totalPoints,
      totalTimePractisedMs,
      stageMessage,
      lastUpdatedAt,
      currentStageId: stageId,
      stageProgressPct,
    };
  }, [
    kidSummaryQuery.data,
    canonicalGamesCompleted,
    canonicalTimePractisedMs,
    overviewCanonicalFreshnessMs,
    canonicalLearningLevelAccuracy10,
    canonicalTotalPointsLifetime,
    canonicalConfidenceNow,
    canonicalJourneyCurrentStageId,
    canonicalJourneyStageProgressPct,
  ]);

  const renderStageGrid = (
    stageSummaries: Array<any>,
    courseId: string | null,
    emptyLabel?: string,
  ) => {
    if (!stageSummaries || stageSummaries.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {emptyLabel || "Stage breakdown isn’t available yet."}
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stageSummaries.map((stage, index) => {
          const displayOrder =
            typeof stage.order === "number" && stage.order > 0 ? stage.order : index + 1;
          const colors = getStageColors(displayOrder);
          const masteryText = formatMasteryLabel(stage.masteryKey) || "Getting started";
          const statusText =
            masteryText.toLowerCase() === "getting started" ? "Not started" : masteryText;
          const title = stripStagePrefix(stage.label, displayOrder);
          const stageHint =
            stage.stageHint ||
            STAGE_HINTS_BY_COURSE[courseId || ""]?.[displayOrder] ||
            "";
          const expectations =
            stage.expectations ||
            STAGE_EXPECTATIONS_BY_COURSE[courseId || ""]?.[displayOrder] ||
            [];
          const progressPct = typeof stage.progressPct === "number" ? stage.progressPct : 0;
          const completedCount =
            typeof stage.completedCount === "number" ? stage.completedCount : null;
          const totalCount = typeof stage.totalCount === "number" ? stage.totalCount : null;

          return (
            <div
              key={`${displayOrder}-${stage.label}`}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${colors.soft} 0%, #ffffff 60%)`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.badgeBg} ${colors.badgeText}`}
                  >
                    Stage {displayOrder}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </div>
                  {stageHint && (
                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                      {stageHint}
                    </div>
                  )}
                </div>
                <div
                  className="h-12 w-12 rounded-full p-[3px] flex-shrink-0"
                  style={{
                    background: `conic-gradient(${colors.accent} ${progressPct}%, ${colors.soft} ${progressPct}% 100%)`,
                  }}
                >
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[10px] font-semibold">
                    <span style={{ color: colors.accent }}>{progressPct}%</span>
                  </div>
                </div>
              </div>

              {expectations.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">
                    What to expect
                  </div>
                  <ul className="mt-1 space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    {expectations.map((item: string) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {stage.focusChips?.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">
                    Next focus
                  </div>
                  <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                    {stage.focusChips.join(", ")}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Progress</span>
                  <span className="font-semibold text-gray-700">{statusText}</span>
                </div>
                {completedCount !== null && totalCount !== null && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {completedCount}/{totalCount} lessons
                    </span>
                  </div>
                )}
                <div className="mt-2 h-2 rounded-full bg-white/70 border border-white">
                  <div
                    className={`h-2 rounded-full ${colors.bar}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mobile-app-scroll h-screen overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50 dark:bg-slate-950 lg:bg-slate-50">
      <div className="mx-auto h-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent className="left-0 top-0 h-screen w-[85vw] max-w-[340px] translate-x-0 translate-y-0 rounded-none border-r border-slate-200 p-4 sm:rounded-none">
            <DialogHeader>
              <DialogTitle>Parent Menu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active Child
                </label>
                {kidsQuery.isLoading ? (
                  <div className="mt-2 text-sm text-slate-600">Loading kids...</div>
                ) : kids.length === 0 ? (
                  <div className="mt-2 text-sm text-slate-600">No kids linked yet.</div>
                ) : (
                  <>
                    <select
                      value={selectedKidId}
                      onChange={(e) => {
                        const nextKidId = e.target.value;
                        setSelectedKidId(nextKidId);
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          if (nextKidId) next.set("kidId", nextKidId);
                          else next.delete("kidId");
                          return next;
                        });
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    >
                      {kids.map((k: any) => (
                        <option key={k.id} value={k.id}>
                          {k.fullName || "Unnamed"}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => {
                        navigate(`/kids/games/english-excellence?kidId=${encodeURIComponent(selectedKidId)}`);
                        setMobileMenuOpen(false);
                      }}
                      disabled={!selectedKidId}
                      className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                    >
                      Open Games Portal
                    </Button>
                  </>
                )}
              </div>

              <nav className="space-y-2">
                {parentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex h-full min-h-0 flex-col gap-6 pb-24 lg:flex-row lg:pb-0">
          <aside className="hidden w-full lg:block lg:w-72 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-4 pb-4 pt-3 space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Active Child
                    </label>
                  </div>

                  {kidsQuery.isLoading ? (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Loading kids...
                    </div>
                  ) : kids.length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      No kids linked yet.
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedKidId}
                        onChange={(e) => {
                          const nextKidId = e.target.value;
                          setSelectedKidId(nextKidId);
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            if (nextKidId) next.set("kidId", nextKidId);
                            else next.delete("kidId");
                            return next;
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-3"
                      >
                        {kids.map((k: any) => (
                          <option key={k.id} value={k.id}>
                            {k.fullName || "Unnamed"}
                          </option>
                        ))}
                      </select>

                      <Button
                        onClick={() =>
                          navigate(`/kids/games/english-excellence?kidId=${encodeURIComponent(selectedKidId)}`)
                        }
                        disabled={!selectedKidId}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                      >
                        Open Games Portal
                      </Button>
                    </>
                  )}
                </div>

                <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 lg:mx-0 lg:px-0 lg:pb-0 lg:block lg:space-y-1 lg:overflow-visible">
                  {parentNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition flex-shrink-0 min-w-[150px] lg:min-w-0 lg:w-full ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                            isActive
                              ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900"
                              : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Confidence at a glance
                  </div>
                  Clear milestones, upcoming classes, and payments together.
                </div>
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur dark:bg-slate-950/80">
              <header className="rounded-[24px] border border-slate-200 bg-white/92 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <TinyStepsBrand subtitle="Parent Workspace" />
                    <h1 className="truncate bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
                      Hi, {user?.displayName || "Parent"}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMobileMenuOpen(true)}
                      className="lg:hidden"
                      aria-label="Open menu"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProfileOpen(true)}
                      title="View profile"
                      aria-label="View profile"
                      className="h-10 w-10 rounded-full bg-slate-100/80 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
                    >
                      <CircleUser className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      title="Logout"
                      aria-label="Logout"
                      className="h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </header>
            </div>

            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Profile & Payments</DialogTitle>
                </DialogHeader>
                {renderProfileContent()}
              </DialogContent>
            </Dialog>

            <div className="mt-4 min-h-0 space-y-6 overflow-y-auto pb-6 pr-1">
              {/* Content */}
              {activeTab === "dashboard" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Curriculum Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Course-wise curriculum progress for {selectedKid?.fullName || "your child"}.
                  </p>
                </div>
                <div className="text-2xl">📚</div>
              </div>

              {phonicsLoading && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading curriculum…
                </p>
              )}

              {phonicsError && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {phonicsErrorMessage}
                </p>
              )}

              {!phonicsLoading &&
                !phonicsError &&
                !displayCourseId && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No enrolled curriculum found. Please contact admin.
                  </p>
                )}

              {!phonicsLoading &&
                !phonicsError &&
                phonicsProgressByCourse.length > 0 && (
                  <div className="space-y-5">
                    {(() => {
                      const selectedCourse = phonicsProgressByCourse[0];

                      if (!selectedCourse) {
                        return (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Curriculum lessons are not available yet.
                          </div>
                        );
                      }

                      if (selectedCourse.totalTopics === 0) {
                        return (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Curriculum lessons are not available yet.
                          </div>
                        );
                      }

                      const stageGroups = new Map<
                        string,
                        { label: string; order: number; rows: any[] }
                      >();
                      const stageOrderMap = buildStageOrderMap(
                        selectedCourse.rows.map((row: any) => ({
                          stageLabel: row.stageLabel,
                          stageOrder: row.stageOrder,
                          order: null,
                        }))
                      );
                      selectedCourse.rows.forEach((row: any) => {
                        const label = row.stageLabel || "Lessons";
                        const order =
                          typeof row.stageOrder === "number" && row.stageOrder > 0
                            ? row.stageOrder
                            : parseStageOrderFromLabel(label) ?? stageOrderMap.get(label) ?? 0;
                        const key = `${order}__${label}`;
                        const existing = stageGroups.get(key);
                        if (existing) {
                          existing.rows.push(row);
                        } else {
                          stageGroups.set(key, { label, order, rows: [row] });
                        }
                      });
                      const stageSummaries = Array.from(stageGroups.values())
                        .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label)))
                        .map((group) => {
                          const masteryKey = aggregateStageMastery(group.rows.map((r) => r.mastery));
                          const progressPct = calcStageProgressPct(group.rows);
                          const completedCount = group.rows.filter(
                            (row: any) =>
                              row.status === "completed" || masteryKeyFromValue(row.mastery) === "mastered"
                          ).length;
                          const totalCount = group.rows.length;
                          const expectations =
                            STAGE_EXPECTATIONS_BY_COURSE[selectedCourse.courseId]?.[group.order] ?? [];
                          return {
                            label: group.label,
                            order: group.order,
                            masteryKey,
                            focusChips: pickStageFocus(group.rows),
                            progressPct,
                            completedCount,
                            totalCount,
                            expectations,
                          };
                        });
                      const completedStages = stageSummaries.filter(
                        (stage) => (stage.progressPct ?? 0) >= 100
                      ).length;
                      const stagesWithProgress = stageSummaries.filter(
                        (stage) => (stage.progressPct ?? 0) > 0
                      );
                      const activeStage =
                        stagesWithProgress.length > 0
                          ? stagesWithProgress[stagesWithProgress.length - 1]
                          : stageSummaries.find((stage) => (stage.progressPct ?? 0) === 0) ?? null;
                      const nextStage = activeStage
                        ? stageSummaries.find((stage) => stage.order > (activeStage.order ?? 0)) ?? null
                        : null;

                      const inProgressCount = selectedCourse.rows.filter(
                        (row: any) => row.status === "in_progress"
                      ).length;
                      const filteredRows =
                        curriculumFilter === "completed"
                          ? selectedCourse.rows.filter(
                              (row: any) => row.status === "completed"
                            )
                          : curriculumFilter === "in_progress"
                            ? selectedCourse.rows.filter(
                                (row: any) => row.status === "in_progress"
                              )
                            : selectedCourse.rows;
                      const lessonStageGroups = new Map<
                        string,
                        { label: string; order: number; rows: any[] }
                      >();
                      filteredRows.forEach((row: any) => {
                        const label = row.stageLabel || "Lessons";
                        const order =
                          typeof row.stageOrder === "number" && row.stageOrder > 0
                            ? row.stageOrder
                            : parseStageOrderFromLabel(label) ?? stageOrderMap.get(label) ?? 0;
                        const key = `${order}__${label}`;
                        const existing = lessonStageGroups.get(key);
                        if (existing) {
                          existing.rows.push(row);
                        } else {
                          lessonStageGroups.set(key, { label, order, rows: [row] });
                        }
                      });
                      const stageSummaryByKey = new Map(
                        stageSummaries.map((stage) => [
                          `${stage.order ?? 0}__${stage.label}`,
                          stage,
                        ])
                      );
                      const lessonStageKeys = Array.from(lessonStageGroups.keys());
                      const collapseAllStages = () => {
                        const next: Record<string, boolean> = {};
                        lessonStageKeys.forEach((key) => {
                          next[key] = true;
                        });
                        setCollapsedStages(next);
                      };
                      const expandAllStages = () => {
                        const next: Record<string, boolean> = {};
                        lessonStageKeys.forEach((key) => {
                          next[key] = false;
                        });
                        setCollapsedStages(next);
                      };

                      return (
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <div
                            className={`px-4 py-3 bg-gradient-to-r ${
                              phonicsGradientsByCourseId[selectedCourse.courseId] ||
                              "from-slate-50 to-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {phonicsIconsByCourseId[selectedCourse.courseId] || "📘"}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {selectedCourse.courseLabel}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 text-right">
                                <div className="font-semibold text-gray-700">
                                  Completed {selectedCourse.completedCount}/{selectedCourse.totalTopics}
                                </div>
                                <div>
                                  Last updated{" "}
                                  {selectedCourse.lastUpdatedAtMs
                                    ? formatTimestamp(selectedCourse.lastUpdatedAtMs)
                                    : "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-slate-500">
                                    Stage Snapshot
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    Quick overview before you dive into details.
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTab("insights")}
                                  className="text-xs"
                                >
                                  View Stage Insights
                                </Button>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 px-3 py-3 text-xs text-slate-700 shadow-sm">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                    Highest Stage Reached
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {activeStage
                                      ? stripStagePrefix(activeStage.label, activeStage.order ?? 0)
                                      : "—"}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-3 py-3 text-xs text-slate-700 shadow-sm">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                    Stages Completed
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {completedStages}/{stageSummaries.length}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 px-3 py-3 text-xs text-slate-700 shadow-sm">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                    Next Stage
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {nextStage
                                      ? stripStagePrefix(nextStage.label, nextStage.order ?? 0)
                                      : completedStages === stageSummaries.length && stageSummaries.length > 0
                                        ? "All stages completed"
                                        : "—"}
                                  </div>
                                </div>
                            </div>
                          </div>
                          {recentTeacherRatingsSummary?.latestLesson && (
                            <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-4 py-3 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                    Latest Teacher-Rated Progress
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {recentTeacherRatingsSummary.latestLesson.label}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {recentTeacherRatingsSummary.latestLesson.stageLabel || selectedCourse.courseLabel}
                                    {recentTeacherRatingsSummary.latestLesson.updatedAtMs
                                      ? ` · ${formatTimestamp(recentTeacherRatingsSummary.latestLesson.updatedAtMs)}`
                                      : ""}
                                  </div>
                                  {recentTeacherRatingsSummary.latestLesson.remark ? (
                                    <div className="max-w-2xl text-xs text-slate-600">
                                      {recentTeacherRatingsSummary.latestLesson.remark}
                                    </div>
                                  ) : null}
                                  {((Array.isArray(recentTeacherRatingsSummary.latestLesson.strengthChips) &&
                                    recentTeacherRatingsSummary.latestLesson.strengthChips.length > 0) ||
                                    getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).length > 0) && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {Array.isArray(recentTeacherRatingsSummary.latestLesson.strengthChips) &&
                                      recentTeacherRatingsSummary.latestLesson.strengthChips.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {recentTeacherRatingsSummary.latestLesson.strengthChips.map((chip: string) => (
                                            <span
                                              key={`dashboard-strength-${chip}`}
                                              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                                            >
                                              {chip}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                      {getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).map((chip: string) => (
                                            <span
                                              key={`dashboard-practice-${chip}`}
                                              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                                            >
                                              {chip}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                                    {recentTeacherRatingsSummary.latestLesson.ratedSkillCount}/
                                    {recentTeacherRatingsSummary.latestLesson.totalSkillCount} skills rated
                                  </span>
                                  <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                                    {recentTeacherRatingsSummary.latestLesson.roundedAverageRating}/4 ·{" "}
                                    {skillRatingLegendLabel(
                                      recentTeacherRatingsSummary.latestLesson.roundedAverageRating,
                                    )}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCurriculumTopic({
                                        ...recentTeacherRatingsSummary.latestLesson,
                                        courseLabel: selectedCourse.courseLabel,
                                      });
                                      setCurriculumTopicModalOpen(true);
                                    }}
                                    className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                                  >
                                    View lesson
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Lessons completed</span>
                                <span>
                                  {selectedCourse.completedCount} of {selectedCourse.totalTopics} lessons completed
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-indigo-500"
                                  style={{ width: `${selectedCourse.overallPct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {[
                                { key: "all", label: `All (${selectedCourse.totalTopics})` },
                                { key: "in_progress", label: `In progress (${inProgressCount})` },
                                { key: "completed", label: `Completed (${selectedCourse.completedCount})` },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => setCurriculumFilter(opt.key as any)}
                                  className={`px-2 py-1 rounded-full border text-xs font-semibold ${
                                    curriculumFilter === opt.key
                                      ? "border-indigo-600 bg-indigo-600 text-white"
                                      : "border-gray-200 bg-white text-gray-700"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={expandAllStages}
                                className="px-2 py-1 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                              >
                                Expand all
                              </button>
                              <button
                                type="button"
                                onClick={collapseAllStages}
                                className="px-2 py-1 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                              >
                                Collapse all
                              </button>
                            </div>

                            {filteredRows.length === 0 ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                No lessons match this filter yet.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {Array.from(lessonStageGroups.values())
                                  .sort((a, b) =>
                                    a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label)
                                  )
                                  .map((group) => {
                                    const key = `${group.order}__${group.label}`;
                                    const summary = stageSummaryByKey.get(key);
                                    const isCollapsed = collapsedStages[key] ?? true;
                                    return (
                                      <div key={key} className="space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                          <div className="text-sm font-semibold text-slate-800">
                                            {stripStagePrefix(group.label, group.order)}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            {summary ? (
                                              <>
                                                <span>
                                                  {summary.completedCount}/{summary.totalCount} lessons
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                  {Math.round(summary.progressPct ?? 0)}%
                                                </span>
                                              </>
                                            ) : (
                                              <span>{group.rows.length} lessons</span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setCollapsedStages((prev) => {
                                                  const current = prev[key] ?? true;
                                                  return {
                                                    ...prev,
                                                    [key]: !current,
                                                  };
                                                })
                                              }
                                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                                            >
                                              {isCollapsed ? "Expand" : "Collapse"}
                                            </button>
                                          </div>
                                        </div>
                                        {!isCollapsed && (
                                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            <div className="col-span-full rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-[11px] text-slate-600">
                                              <div className="font-semibold text-slate-700">How to read this</div>
                                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                {TEACHER_STAR_GUIDE.map((item) => (
                                                  <span key={item.stars}>
                                                    {item.stars} = {item.label}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                            {group.rows.map((row: any) => {
                                            const ratingSummary = summarizeProgressRatings(
                                              row.progressRatings ?? {},
                                              Array.isArray(row.progressSkills) ? row.progressSkills : [],
                                            );
                                            const starLevel = ratingSummary.roundedAverageRating;
                                            const starRating = starString(starLevel);
                                            const ratingLabel = skillRatingLegendLabel(starLevel);
                                            const masteryLower = String(row.mastery ?? "").toLowerCase().trim();
                                            const accentDot =
                                              masteryLower === "mastered"
                                                ? "bg-emerald-500"
                                                : masteryLower && masteryLower !== "not_started"
                                                  ? "bg-blue-500"
                                                  : "bg-slate-300";
                                            return (
                                              <button
                                                key={row.id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedCurriculumTopic({
                                                    ...row,
                                                    courseLabel: selectedCourse.courseLabel,
                                                  });
                                                  setCurriculumTopicModalOpen(true);
                                                }}
                                                className="group relative text-left rounded-xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex min-w-0 flex-1 items-start gap-2">
                                                    <span className={`mt-1 h-2 w-2 rounded-full ${accentDot}`} />
                                                    <div className="text-xs font-semibold leading-5 text-slate-900 whitespace-normal break-words">
                                                      {row.label}
                                                    </div>
                                                  </div>
                                                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">
                                                    View
                                                  </span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                  <div
                                                    className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold tracking-[0.08em] text-amber-700"
                                                    aria-label={`Lesson progress ${starRating}`}
                                                  >
                                                    {starRating}
                                                  </div>
                                                  <span className="text-[10px] font-semibold text-slate-500">
                                                    {ratingLabel}
                                                  </span>
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
            </Card>

            <Dialog
              open={curriculumTopicModalOpen}
              onOpenChange={(open) => {
                setCurriculumTopicModalOpen(open);
                if (!open) setSelectedCurriculumTopic(null);
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Lesson details</DialogTitle>
                </DialogHeader>
                {selectedCurriculumTopic ? (
                  <div className="space-y-3 text-sm">
                    {(() => {
                      const lessonStrengths =
                        Array.isArray(selectedCurriculumTopic.strengthChips)
                          ? selectedCurriculumTopic.strengthChips
                          : [];
                      const lessonNeedsPractice = getLessonNeedsPracticeChips(selectedCurriculumTopic);
                      return (
                        <>
                    <div className="font-semibold text-gray-900">
                      {selectedCurriculumTopic.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedCurriculumTopic.courseLabel}
                    </div>
                    {selectedCurriculumTopic.stageLabel && (
                      <div className="text-xs text-gray-500">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                          {selectedCurriculumTopic.stageLabel}
                        </span>
                      </div>
                    )}
                    <ChildSkillRatingCard
                      title="Child Progress"
                      subtitle="Teacher ratings for this lesson."
                      skills={
                        Array.isArray(selectedCurriculumTopic.progressSkills)
                          ? selectedCurriculumTopic.progressSkills
                          : normalizeProgressSkillsMeta(selectedCurriculumTopic.progressRatingsMeta)
                      }
                      values={selectedCurriculumTopic.progressRatings ?? {}}
                      readOnly
                      className="p-3"
                    />
                    {lessonStrengths.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Strengths</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lessonStrengths.map((chip: string) => (
                            <span
                              key={chip}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {lessonNeedsPractice.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Needs practice</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lessonNeedsPractice.map((chip: string) => (
                            <span
                              key={chip}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500">Teacher note</div>
                      <div className="text-sm text-gray-800">
                        {selectedCurriculumTopic.remark || "—"}
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No lesson selected.</div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Insights
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stage-based learning progress with clear next steps.
                  </p>
                </div>
                <div className="text-2xl">📈</div>
              </div>

              {insightsCourseOptions.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stage insights will appear once a course is assigned.
                </p>
              )}

              {insightsCourseOptions.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Course
                    </label>
                    {insightsCourseOptions.length > 1 ? (
                      <select
                        value={insightsCourseId}
                        onChange={(e) => setInsightsCourseId(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {insightsCourseOptions.map((opt) => (
                          <option key={opt.courseId} value={opt.courseId}>
                            {opt.label || opt.courseId}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {insightsCourseOptions[0]?.label || insightsCourseOptions[0]?.courseId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {insightsCourseOptions.length > 0 && (
                <>
                  {recentTeacherRatingsSummary?.latestLesson && (
                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            Teacher ratings
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {recentTeacherRatingsSummary.latestLesson.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {recentTeacherRatingsSummary.latestLesson.stageLabel || recentTeacherRatingsSummary.latestLesson.courseLabel}
                            {recentTeacherRatingsSummary.latestLesson.updatedAtMs
                              ? ` · ${formatTimestamp(recentTeacherRatingsSummary.latestLesson.updatedAtMs)}`
                              : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
                            Recent average {recentTeacherRatingsSummary.averageRecentRating.toFixed(1)}/4
                          </span>
                          <span className="rounded-full bg-indigo-600 px-2.5 py-1 font-semibold text-white">
                            {recentTeacherRatingsSummary.averageRecentLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {renderStageGrid(
                    insightsStageData?.stageSummaries ?? [],
                    insightsStageData?.courseId ?? null,
                  )}
                </>
              )}
            </Card>
          </div>
        )}

        {activeTab === "games-progress" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Games Progress
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedKid?.fullName
                  ? `Viewing: ${selectedKid.fullName}`
                  : "Select a child"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                (Progress updates in scheduled refresh windows — recent play may take a little time to appear.)
              </p>
            </div>

            {overviewMetrics ? (
              <ParentOverviewCards
                confidenceNow={overviewMetrics.confidenceNow}
                gamesCompleted={overviewMetrics.gamesCompleted}
                avgScore={overviewMetrics.avgScore}
                totalPoints={overviewMetrics.totalPoints}
                totalTimePractisedMs={overviewMetrics.totalTimePractisedMs}
                stageMessage={overviewMetrics.stageMessage}
                lastUpdatedAt={overviewMetrics.lastUpdatedAt}
                currentStageId={overviewMetrics.currentStageId}
                stageProgressPct={overviewMetrics.stageProgressPct}
                variant="compact"
              />
            ) : (
              <Card className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kidSummaryQuery.isLoading
                    ? "Loading overview..."
                    : "No data available yet."}
                </p>
              </Card>
            )}

            {(canonicalRecommendedNext || kidSummaryQuery.data?.summary?.recommendedNext) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Today's Recommendation
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const recommendedNext = canonicalRecommendedNext || kidSummaryQuery.data?.summary?.recommendedNext;
                    return (
                      <>
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {recommendedNext?.gameId ||
                      "Practice time!"}
                  </div>
                  {recommendedNext?.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {recommendedNext.reason}
                    </p>
                  )}
                  {recommendedNext?.estMinutes && (
                    <div className="text-xs text-gray-500">
                      Estimated:{" "}
                      {recommendedNext.estMinutes}{" "}
                      minutes
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
              </Card>
            )}

            {kidSummaryQuery.isLoading ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                Loading progress…
              </div>
            ) : (
              <ParentGamesProgress
                kidSummaryData={kidSummaryQuery.data ?? null}
                gamesCatalog={gamesCatalogQuery.data ?? []}
                gameProgressDocs={shouldFetchLiveGameProgress ? gameProgressQuery.data ?? null : null}
                gameSummaries={gameSummariesQuery.data ?? null}
                onPracticeClick={(gameId) => handlePracticeClick(gameId)}
                onRefreshClick={handleGamesRefresh}
                isRefreshing={isRefreshingGames}
                refreshMessage={gamesRefreshStatus.message}
                refreshTone={gamesRefreshStatus.tone}
              />
            )}
          </div>
        )}

        {/* SKILLS TAB - teacher tagged skills */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            {(() => {
              const formatSkillTag = (tag: string): string => {
                if (!tag) return "—";
                if (tag.startsWith("letter:")) {
                  const letter = tag.split(":")[1]?.toUpperCase() || "";
                  return `Letter ${letter}`;
                }
                if (tag.startsWith("sound:")) {
                  const sound = tag.substring(6);
                  return `Sound ${sound}`;
                }
                if (tag.startsWith("subtopic:")) {
                  const sub = tag.substring(9).replace(/_/g, " ");
                  return sub
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
                }
                return tag.charAt(0).toUpperCase() + tag.slice(1);
              };

              const skillsData = skillsInsightData;
              const hasSkillData = Boolean(
                (skillsData && skillsData.totalSkills > 0) || recentTeacherRatings.length > 0
              );

              if (!hasSkillData) {
                return (
                  <Card className="p-8 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                        <span className="text-3xl">🎯</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Teacher ratings are getting ready
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Once teachers rate a few lessons, this page will show
                          lesson-based stars, teacher notes, and practice signals.
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              }

	              return (
	                <div className="space-y-6">
	                  <Card className="p-6 space-y-5">
	                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
	                      <div>
	                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
	                          Teacher Progress Snapshot
	                        </h2>
	                        <p className="text-sm text-gray-600 dark:text-gray-400">
	                          {selectedKid?.fullName
	                            ? `Viewing: ${selectedKid.fullName}`
	                            : "Select a child"}{" "}
	                          {skillsData?.courseLabel ? `· ${skillsData.courseLabel}` : ""}
	                        </p>
	                      </div>
	                      <div className="text-xs uppercase tracking-wide text-gray-500">
	                        Lesson-based ratings
	                      </div>
	                    </div>

	                    {recentTeacherRatingsSummary?.latestLesson ? (
	                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
	                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
	                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                            <div>
	                              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
	                                Latest rated lesson
	                              </div>
	                              <div className="mt-1 text-lg font-semibold text-slate-900">
	                                {recentTeacherRatingsSummary.latestLesson.label}
	                              </div>
	                              <div className="mt-1 text-xs text-slate-500">
	                                {recentTeacherRatingsSummary.latestLesson.stageLabel || recentTeacherRatingsSummary.latestLesson.courseLabel}
	                                {recentTeacherRatingsSummary.latestLesson.updatedAtMs
	                                  ? ` · ${formatTimestamp(recentTeacherRatingsSummary.latestLesson.updatedAtMs)}`
	                                  : ""}
	                              </div>
	                            </div>
	                            <div className="flex flex-wrap items-center gap-2">
	                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
	                                {recentTeacherRatingsSummary.latestLesson.ratedSkillCount}/
	                                {recentTeacherRatingsSummary.latestLesson.totalSkillCount} skills rated
	                              </span>
	                              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
	                                {recentTeacherRatingsSummary.latestLesson.roundedAverageRating}/4 ·{" "}
	                                {skillRatingLegendLabel(
	                                  recentTeacherRatingsSummary.latestLesson.roundedAverageRating,
	                                )}
	                              </span>
	                            </div>
	                          </div>

	                          <div className="mt-4">
	                            <ChildSkillRatingCard
	                              title={null}
	                              skills={recentTeacherRatingsSummary.latestLesson.progressSkills}
	                              values={recentTeacherRatingsSummary.latestLesson.progressRatings}
	                              readOnly
	                              compact
	                              showLegend={false}
	                              className="border-slate-200 bg-white/90"
	                            />
	                          </div>

                            {((Array.isArray(recentTeacherRatingsSummary.latestLesson.strengthChips) &&
                              recentTeacherRatingsSummary.latestLesson.strengthChips.length > 0) ||
                              getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).length > 0) && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {Array.isArray(recentTeacherRatingsSummary.latestLesson.strengthChips) &&
                                recentTeacherRatingsSummary.latestLesson.strengthChips.length > 0 ? (
                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                      Strengths
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {recentTeacherRatingsSummary.latestLesson.strengthChips.map((chip: string) => (
                                        <span
                                          key={`latest-strength-${chip}`}
                                          className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800"
                                        >
                                          {chip}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).length > 0 ? (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                      Needs practice
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson).map((chip: string) => (
                                        <span
                                          key={`latest-practice-${chip}`}
                                          className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs font-semibold text-amber-800"
                                        >
                                          {chip}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}

	                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
	                            <div className="space-y-1">
	                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
	                                Teacher note
	                              </div>
	                              <div className="text-sm text-slate-700">
	                                {recentTeacherRatingsSummary.latestLesson.remark || "No note added for this lesson yet."}
	                              </div>
	                            </div>
	                            <Button
	                              variant="outline"
	                              size="sm"
	                              onClick={() => {
	                                setSelectedCurriculumTopic(recentTeacherRatingsSummary.latestLesson);
	                                setCurriculumTopicModalOpen(true);
	                              }}
	                              className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
	                            >
	                              Open lesson details
	                            </Button>
	                          </div>
	                        </div>

	                        <div className="space-y-4">
	                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
	                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
	                              Recent lesson performance
	                            </div>
	                            <div className="mt-2 text-2xl font-semibold text-slate-900">
	                              {recentTeacherRatingsSummary.averageRecentRating.toFixed(1)}/4
	                            </div>
	                            <div className="mt-1 text-sm text-slate-600">
	                              {recentTeacherRatingsSummary.averageRecentLabel} across recent teacher-rated lessons
	                            </div>
	                          </div>

	                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
	                            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 font-semibold">
	                              Strongest skills
	                            </div>
	                            <div className="mt-3 flex flex-wrap gap-2">
	                              {recentTeacherRatingsSummary.strongestSkills.map((skill) => (
	                                <span
	                                  key={`strength-${skill}`}
	                                  className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800"
	                                >
	                                  {skill}
	                                </span>
	                              ))}
	                              {recentTeacherRatingsSummary.strongestSkills.length === 0 && (
	                                <span className="text-xs text-emerald-700">
	                                  Stronger areas will appear as more lessons are rated.
	                                </span>
	                              )}
	                            </div>
	                          </div>

	                          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
	                            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-semibold">
	                              Needs practice
	                            </div>
	                            <div className="mt-3 flex flex-wrap gap-2">
	                              {recentTeacherRatingsSummary.needsPracticeSkills.map((skill) => (
	                                <span
	                                  key={`practice-${skill}`}
	                                  className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800"
	                                >
	                                  {skill}
	                                </span>
	                              ))}
	                              {recentTeacherRatingsSummary.needsPracticeSkills.length === 0 && (
	                                <span className="text-xs text-amber-700">
	                                  Practice areas will show once teachers rate more lessons.
	                                </span>
	                              )}
	                            </div>
	                          </div>
	                        </div>
	                        </div>
	                    ) : (
	                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
	                        Teacher lesson ratings will appear here once a lesson is reviewed with stars.
	                      </div>
	                    )}
	                  </Card>

	                  <Card className="p-6">
	                    <div className="flex items-center justify-between mb-4">
	                      <div>
	                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
	                          Recent Teacher Ratings
	                        </h3>
	                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
	                          Lesson-by-lesson star ratings shared by your child&apos;s teacher.
	                        </p>
	                      </div>
	                      <span className="text-xs text-gray-500">
	                        {recentTeacherRatings.length} recent lessons
	                      </span>
	                    </div>
	                    <div className="space-y-4">
	                      {recentTeacherRatings.length > 0 ? (
	                        recentTeacherRatings.map((lesson: any) => (
	                          <div
	                            key={`lesson-rating-${lesson.id}`}
	                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
	                          >
	                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                              <div>
	                                <div className="text-sm font-semibold text-slate-900">{lesson.label}</div>
	                                <div className="mt-1 text-xs text-slate-500">
	                                  {lesson.stageLabel || lesson.courseLabel}
	                                  {lesson.updatedAtMs ? ` · ${formatTimestamp(lesson.updatedAtMs)}` : ""}
	                                </div>
	                              </div>
	                              <div className="flex flex-wrap items-center gap-2 text-xs">
	                                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
	                                  {lesson.ratedSkillCount}/{lesson.totalSkillCount} skills
	                                </span>
	                                <span className="rounded-full bg-indigo-600 px-2.5 py-1 font-semibold text-white">
	                                  {lesson.roundedAverageRating}/4 · {skillRatingLegendLabel(lesson.roundedAverageRating)}
	                                </span>
	                              </div>
	                            </div>
	                            <div className="mt-3">
	                              <ChildSkillRatingCard
	                                title={null}
	                                skills={lesson.progressSkills}
	                                values={lesson.progressRatings}
	                                readOnly
	                                compact
	                                showLegend={false}
	                                className="border-slate-200 bg-slate-50/70"
	                              />
	                            </div>
                              {((Array.isArray(lesson.strengthChips) && lesson.strengthChips.length > 0) ||
                                getLessonNeedsPracticeChips(lesson).length > 0) && (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  {Array.isArray(lesson.strengthChips) && lesson.strengthChips.length > 0 ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                        Strengths
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {lesson.strengthChips.map((chip: string) => (
                                          <span
                                            key={`${lesson.id}-strength-${chip}`}
                                            className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800"
                                          >
                                            {chip}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {getLessonNeedsPracticeChips(lesson).length > 0 ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
                                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        Needs practice
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {getLessonNeedsPracticeChips(lesson).map((chip: string) => (
                                          <span
                                            key={`${lesson.id}-practice-${chip}`}
                                            className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs font-semibold text-amber-800"
                                          >
                                            {chip}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
	                            {lesson.remark ? (
	                              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
	                                <span className="font-semibold text-slate-800">Teacher note:</span> {lesson.remark}
	                              </div>
	                            ) : null}
	                          </div>
	                        ))
	                      ) : (
	                        <div className="text-sm text-gray-500">
	                          Recent lesson ratings will appear here once teachers rate lessons.
	                        </div>
	                      )}
	                    </div>
	                  </Card>

	                  <Card className="p-6">
	                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Skills by Stage
                      </h3>
                      <span className="text-xs text-gray-500">
                        {skillsData?.stageGroups.length || 0} stages
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {skillsData?.stageGroups.map((stage, idx) => {
                        const displayOrder = stage.order > 0 ? stage.order : idx + 1;
                        return (
                          <div
                            key={stage.label}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              Stage {displayOrder}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">
                              {stripStagePrefix(stage.label, displayOrder)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {stage.topSkills.map((skill) => (
                                <span
                                  key={`${stage.label}-${skill.tag}`}
                                  className="px-2 py-1 rounded-full bg-slate-50 text-xs text-slate-700 border border-slate-200"
                                >
                                  {formatSkillTag(skill.tag)}
                                </span>
                              ))}
                              {stage.topSkills.length === 0 && (
                                <span className="text-xs text-gray-500">
                                  No skills tagged yet.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Recent Skill Updates
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {skillsData?.recentUpdates.length ? (
                        skillsData.recentUpdates.map((update, idx) => {
                          const displayOrder =
                            update.stageOrder > 0
                              ? update.stageOrder
                              : parseStageOrderFromLabel(update.stageLabel) ?? 0;
                          return (
                          <div
                            key={`${update.tag}-${idx}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                          >
                            <span>
                              {formatSkillTag(update.tag)} ·{" "}
                              {stripStagePrefix(update.stageLabel, displayOrder)}
                            </span>
                            <span className="text-gray-500">
                              {update.updatedAtMs ? formatTimestamp(update.updatedAtMs) : "—"}
                            </span>
                          </div>
                        );
                        })
                      ) : (
                        <div className="text-xs text-gray-500">
                          Recent updates will appear here once teachers tag skills.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* Classes tab: Today's + Upcoming sessions */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <Card className="sticky top-0 z-20 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    My Classes
                  </h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setClassesView("today")}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        classesView === "today"
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      <CalendarCheck className="h-4 w-4" />
                      Today ({todayClassSessions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassesView("upcoming")}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        classesView === "upcoming"
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      <CalendarClock className="h-4 w-4" />
                      Upcoming ({upcomingClassSessions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassesView("completed")}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        classesView === "completed"
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Completed ({completedClassSessions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassesView("rescheduled")}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        classesView === "rescheduled"
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      <CalendarClock className="h-4 w-4" />
                      Rescheduled ({rescheduledClassSessions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setClassesCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        setClassesCalendarSelectedDayKey(toYMD(now));
                        setClassesView("calendar");
                      }}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        classesView === "calendar"
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                      Calendar
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!parentRecordingFolderUrl) return;
                      window.open(parentRecordingFolderUrl, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!parentRecordingFolderUrl}
                  >
                    Class Recordings
                  </Button>
                </div>
              </div>
            </Card>

            {kidSessionsQuery.isLoading ? (
              <Card className="p-6 text-sm text-slate-600 dark:text-slate-300">
                Loading sessions…
              </Card>
            ) : classesView === "today" ? (
              <Card className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Today&apos;s Sessions
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {todayClassSessions.length} session{todayClassSessions.length === 1 ? "" : "s"}
                  </span>
                </div>
                {todayClassSessions.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    No sessions scheduled for today.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayClassSessions.map((row) => renderParentSessionCard(row, true))}
                  </div>
                )}
              </Card>
            ) : classesView === "upcoming" ? (
              <div className="space-y-4">
                {groupedUpcomingSessions.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No upcoming sessions scheduled.
                  </Card>
                ) : (
                  groupedUpcomingSessions.map((group) => (
                    <Card key={toYMD(group.date)} className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {group.date.toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {group.rows.length} session{group.rows.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.rows.map((row) => renderParentSessionCard(row, true))}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ) : classesView === "completed" ? (
              <div className="space-y-4">
                {groupedCompletedSessions.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No completed sessions yet.
                  </Card>
                ) : (
                  groupedCompletedSessions.map((group) => (
                    <Card key={toYMD(group.date)} className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {group.date.toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {group.rows.length} session{group.rows.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.rows.map((row) => renderParentSessionCard(row, true))}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ) : classesView === "rescheduled" ? (
              <div className="space-y-4">
                {groupedRescheduledSessions.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No rescheduled sessions.
                  </Card>
                ) : (
                  groupedRescheduledSessions.map((group) => (
                    <Card key={toYMD(group.date)} className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {group.date.toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {group.rows.length} session{group.rows.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.rows.map((row) => renderParentSessionCard(row, true))}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {classesCalendarMonthLabel}
                      </div>
                      {classesCalendarSelectedDayKey ? (
                        <div className="truncate text-sm text-slate-600 dark:text-slate-300">
                          {(() => {
                            const parsed = parseYMD(classesCalendarSelectedDayKey);
                            if (!parsed) return null;
                            const dayLabel = new Date(parsed.y, parsed.m - 1, parsed.d).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            );
                            const count = classesCalendarSelectedRows.length;
                            const statusLabelText =
                              count === 0
                                ? "No classes on this day."
                                : `${count} class${count === 1 ? "" : "es"} on this day.`;
                            return (
                              <span>
                                {dayLabel} · {statusLabelText}
                              </span>
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClassesCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                        }
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClassesCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {classesCalendarDays.map((cell) => {
                      if (!cell.date) {
                        return <div key={cell.key} className="h-16 rounded-lg bg-transparent" />;
                      }

                      const dayKey = toYMD(cell.date);
                      const list = classesCalendarSessionsByDay[dayKey] || [];
                      const dominantStatus = (() => {
                        if (list.length === 0) return null;
                        const counts = list.reduce<Record<string, number>>((acc, row) => {
                          acc[row.status] = (acc[row.status] || 0) + 1;
                          return acc;
                        }, {});
                        const priority = ["in_progress", "scheduled", "completed", "no_show", "cancelled"];
                        return priority.find((status) => counts[status]) || Object.keys(counts)[0] || null;
                      })();
                      const isSelected = classesCalendarSelectedDayKey === dayKey;

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setClassesCalendarSelectedDayKey(dayKey)}
                          className={`h-16 rounded-lg border px-2 py-1 text-left transition ${
                            isSelected
                              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30"
                              : "border-slate-200 bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {cell.date.getDate()}
                            </span>
                            {list.length > 0 ? (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                {list.length}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1">
                            {dominantStatus ? (
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(dominantStatus)}`}>
                                {statusLabel(dominantStatus)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "holidays" && (
          <div className="space-y-4">
            <HolidayCalendar2026 />
          </div>
        )}

        {activeTab === "profile" && (
          renderProfileContent()
        )}

        {/* PAYMENTS TAB - unchanged */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {(() => {
              const membership = selectedKid?.membership;
              const membershipStartDate = toDateOrNull(membership?.startDate);
              const membershipEndDate = toDateOrNull(membership?.endDate);
              const enrollmentsForKid = (enrollmentsQuery.data ?? []) as Enrollment[];
              const enrollmentDates = enrollmentsForKid
                .map((enr) => toDateOrNull(enr.enrollmentDate ?? enr.createdAt))
                .filter((d): d is Date => Boolean(d));
              const enrollmentStartDates = enrollmentsForKid
                .map((enr) => toDateOrNull(enr.startDate))
                .filter((d): d is Date => Boolean(d));

              const enrollmentDate =
                enrollmentDates.length > 0
                  ? enrollmentDates.reduce((a, b) =>
                      a.getTime() <= b.getTime() ? a : b
                    )
                  : null;
              const enrollmentStartDate =
                enrollmentStartDates.length > 0
                  ? enrollmentStartDates.reduce((a, b) =>
                      a.getTime() <= b.getTime() ? a : b
                    )
                  : null;

              const displayStartDate = enrollmentStartDate || membershipStartDate;

              const today = new Date();
              const hasActiveEnrollment = enrollmentsForKid.some((enr) => {
                const st = String(enr.status || "").toLowerCase().trim();
                return (
                  st === "active" ||
                  st === "trial" ||
                  st === "enrolled" ||
                  st === "current" ||
                  st === "in_progress"
                );
              });
              const nowMs = Date.now();
              const hasActiveClasses = allKidSessions.some((s) => {
                const st = normalizeStatus(s.status);
                if (st === "completed" || st === "cancelled" || st === "no_show") return false;
                const start = sessionStartDate(s);
                if (!start) return st === "scheduled" || st === "in_progress";
                return st === "in_progress" || start.getTime() >= nowMs;
              });
              const isActive =
                (!!membershipEndDate && today <= membershipEndDate) ||
                hasActiveClasses ||
                hasActiveEnrollment;

              const paymentsConfig = paymentsConfigQuery.data;
              const qrUrl = paymentsConfig?.upiQrUrl || null;
              const adminWhatsApp = paymentsConfig?.adminWhatsApp || "919876543210";
              const paymentRows = (parentPaymentsQuery.data ?? []) as ParentPaymentRecord[];
              const kidPayments = selectedKid?.id
                ? paymentRows.filter(
                    (p) => String(p.kidId || "") === String(selectedKid.id)
                  )
                : paymentRows;
              const sortedPayments = [...kidPayments].sort((a, b) => {
                const aTime =
                  toDateOrNull(a.paidAt || a.createdAt)?.getTime() || 0;
                const bTime =
                  toDateOrNull(b.paidAt || b.createdAt)?.getTime() || 0;
                return bTime - aTime;
              });
              const paymentTotals = sortedPayments.reduce(
                (acc, payment) => {
                  const rawAmount = Number(payment?.amount ?? 0);
                  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
                  const rawApplied = Number(payment?.appliedAmount ?? NaN);
                  const applied = Number.isFinite(rawApplied)
                    ? rawApplied
                    : (() => {
                        const rawUnapplied = Number(
                          payment?.unappliedAmount ?? 0
                        );
                        const unapplied = Number.isFinite(rawUnapplied)
                          ? rawUnapplied
                          : 0;
                        return amount - unapplied;
                      })();
                  const rawUnapplied = Number(payment?.unappliedAmount ?? NaN);
                  const unapplied = Number.isFinite(rawUnapplied)
                    ? rawUnapplied
                    : amount - applied;
                  acc.total += amount;
                  acc.applied += applied;
                  acc.unapplied += unapplied;
                  return acc;
                },
                { total: 0, applied: 0, unapplied: 0 }
              );

              const handleConfirmPayment = async () => {
                setConfirmingPayment(true);

                try {
                  await addDoc(collection(db, "paymentConfirmations"), {
                    parentUid: user?.uid || null,
                    parentName: user?.displayName || user?.email || "Unknown",
                    childId: selectedKid?.id || null,
                    childName: selectedKid?.fullName || "Unknown",
                    membershipStartDate: membershipStartDate || enrollmentStartDate,
                    membershipEndDate: membershipEndDate,
                    createdAt: serverTimestamp(),
                    status: "pending",
                  });
                } catch (error) {
                  console.error("Failed to create payment confirmation:", error);
                }

                const childName = selectedKid?.fullName || "my child";
                const startStr = (membershipStartDate || enrollmentStartDate)
                  ? (membershipStartDate || enrollmentStartDate)!.toLocaleDateString("en-IN")
                  : "N/A";
                const endStr = membershipEndDate
                  ? membershipEndDate.toLocaleDateString("en-IN")
                  : "N/A";
                const message = `Hi, I paid Tiny Steps membership for ${childName}. Membership: ${startStr} to ${endStr}. I am attaching the payment screenshot.`;
                const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
                  message
                )}`;
                window.open(whatsappUrl, "_blank");

                setConfirmingPayment(false);
              };

              return (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Payments
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {selectedKid?.fullName
                        ? `Viewing: ${selectedKid.fullName}`
                        : "Select a child"}
                    </p>

                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Membership
                      </h3>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Status
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isActive
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {isActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Enrollment Date
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {enrollmentDate
                                ? enrollmentDate.toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Start Date
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {displayStartDate
                                ? displayStartDate.toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              End Date
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {membershipEndDate
                                ? membershipEndDate.toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Class Fees & Dues
                      </h3>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                        {billingLoading ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Loading fees…
                          </div>
                        ) : billingSummary.totalCharges === 0 ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Due now: ₹0
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              No charges yet this month.
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <div>
                              Completed this month: {billingSummary.chargesThisMonth}
                            </div>
                            {billingSummary.avgRate > 0 && (
                              <div>
                                Rate per class: ₹{billingSummary.avgRate.toLocaleString("en-IN")}
                              </div>
                            )}
                            <div>
                              Due now: ₹{billingSummary.dueNow.toLocaleString("en-IN")}
                            </div>
                            {billingSummary.chargesThisMonth > 0 && (
                              <div>
                                Billed this month: ₹{billingSummary.billedThisMonth.toLocaleString("en-IN")}
                              </div>
                            )}
                            {billingSummary.paidThisMonth > 0 && (
                              <div>
                                Paid this month: ₹{billingSummary.paidThisMonth.toLocaleString("en-IN")}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Charges: {billingSummary.totalCharges}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Calculated from {billingSummary.chargesThisMonth} completed classes (Present/Late) in {classesMonthLabel}.
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTab("classes")}
                          >
                            View classes
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Payment History
                      </h3>
                      <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700">
                        {parentPaymentsQuery.isLoading ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Loading payments…
                          </div>
                        ) : sortedPayments.length === 0 ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            No payments recorded yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                  Total paid
                                </div>
                                <div className="text-lg font-semibold">
                                  ₹{paymentTotals.total.toLocaleString("en-IN")}
                                </div>
                              </div>
                              <div className="rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                  Applied to dues
                                </div>
                                <div className="text-lg font-semibold">
                                  ₹{paymentTotals.applied.toLocaleString("en-IN")}
                                </div>
                              </div>
                              <div className="rounded border p-3">
                                <div className="text-xs text-muted-foreground">
                                  Unapplied
                                </div>
                                <div className="text-lg font-semibold">
                                  ₹{paymentTotals.unapplied.toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>

                            <div className="border rounded">
                              <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs uppercase text-muted-foreground border-b">
                                <div>Date</div>
                                <div>Amount</div>
                                <div>Applied</div>
                                <div>Unapplied</div>
                                <div>Method</div>
                              </div>
                              {sortedPayments.map((payment) => {
                                const rawAmount = Number(payment?.amount ?? 0);
                                const amount = Number.isFinite(rawAmount)
                                  ? rawAmount
                                  : 0;
                                const rawApplied = Number(
                                  payment?.appliedAmount ?? NaN
                                );
                                const applied = Number.isFinite(rawApplied)
                                  ? rawApplied
                                  : (() => {
                                      const rawUnapplied = Number(
                                        payment?.unappliedAmount ?? 0
                                      );
                                      const unapplied = Number.isFinite(rawUnapplied)
                                        ? rawUnapplied
                                        : 0;
                                      return amount - unapplied;
                                    })();
                                const rawUnapplied = Number(
                                  payment?.unappliedAmount ?? NaN
                                );
                                const unapplied = Number.isFinite(rawUnapplied)
                                  ? rawUnapplied
                                  : amount - applied;
                                const paidAt = toDateOrNull(
                                  payment.paidAt || payment.createdAt
                                );
                                return (
                                  <div
                                    key={payment.id}
                                    className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-b-0"
                                  >
                                    <div>
                                      {paidAt
                                        ? paidAt.toLocaleDateString("en-IN")
                                        : "—"}
                                    </div>
                                    <div>
                                      ₹{amount.toLocaleString("en-IN")}
                                    </div>
                                    <div>
                                      ₹{applied.toLocaleString("en-IN")}
                                    </div>
                                    <div>
                                      ₹{unapplied.toLocaleString("en-IN")}
                                    </div>
                                    <div className="capitalize">
                                      {String(payment.method || "—")}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => setShowQrModal(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                      >
                        Pay Now
                      </Button>

                      <div className="space-y-2">
                        <Button
                          onClick={handleConfirmPayment}
                          disabled={confirmingPayment}
                          variant="outline"
                          className="w-full border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                        >
                          {confirmingPayment
                            ? "Opening WhatsApp..."
                            : "Confirm Payment"}
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          After clicking, attach payment screenshot in WhatsApp
                          and send to admin
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pay via UPI</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {qrUrl ? (
                          <div className="flex flex-col items-center space-y-3">
                            <img
                              src={qrUrl}
                              alt="UPI QR Code"
                              className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              Scan using any UPI app
                            </p>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <p className="mb-2">QR code not available</p>
                            <p className="text-xs">
                              Please contact admin for payment details
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={() => setShowQrModal(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              );
            })()}
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
      <MobileTabBar
        items={PARENT_MOBILE_TABS}
        activeId={activeTab}
        onSelect={(nextTab) => setTab(nextTab as TabKey)}
      />
    </div>
  );
}
