// src/pages/parent/components/progress/ParentGamesProgress.tsx
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnyObj = Record<string, any>;

type GameCatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  area?: string;
  totalLevels?: number;
};

type ParentGamesProgressProps = {
  kidSummaryData: AnyObj | null;
  gamesCatalog: GameCatalogItem[];
  onPracticeClick: (gameId?: string) => void;
  skillTagStats?: Record<string, any> | null;
};

const TOTAL_LETTERS = 26;

/** Small helper */
function formatDateMaybe(value: any): string | null {
  try {
    if (!value) return null;
    // Firestore Timestamp
    if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
    // millis number
    if (typeof value === "number") return new Date(value).toLocaleString();
    // ISO string
    if (typeof value === "string") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    return null;
  } catch {
    return null;
  }
}

function clampPct(pct: number) {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

function ProgressBar({
  pct,
  from,
  to,
}: {
  pct: number;
  from: string;
  to: string;
}) {
  const safe = clampPct(pct);
  return (
    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${from} ${to}`}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

function getStatusBadge(completed: number, total: number) {
  if (total <= 0) {
    return { label: "—", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
  }
  if (completed <= 0) {
    return { label: "Not started", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" };
  }
  if (completed >= total) {
    return { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  }
  return { label: "In progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
}

function formatLettersInline(
  letters: string[],
  display: "lower" | "upper",
  max = 8
) {
  const clean = Array.from(
    new Set(
      (letters || [])
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .map((x) => x.toLowerCase())
        .filter((x) => /^[a-z]$/.test(x))
    )
  ).sort();

  const shown = clean.slice(0, max).map((x) => (display === "upper" ? x.toUpperCase() : x.toLowerCase()));
  if (shown.length === 0) return "";
  const more = clean.length - shown.length;
  return more > 0 ? `${shown.join(", ")} +${more}` : shown.join(", ");
}

function LetterChipsRow({
  label,
  letters,
  perfectLetters,
  display,
}: {
  label: string;
  letters: string[];
  perfectLetters: string[];
  display: "lower" | "upper";
}) {
  const perfect = new Set((perfectLetters || []).map((x) => String(x || "").toLowerCase()));
  const show = (l: string) => (display === "upper" ? l.toUpperCase() : l.toLowerCase());

  const cleanLetters = Array.from(
    new Set(
      (letters || [])
        .map((x) => String(x || "").trim().toLowerCase())
        .filter((x) => /^[a-z]$/.test(x))
    )
  ).sort();

  if (!cleanLetters || cleanLetters.length === 0) {
    return (
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span className="font-medium">{label}</span>
        <span className="italic">No letters yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">{cleanLetters.length}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {cleanLetters.map((l) => {
          const key = l.toLowerCase();
          const isPerfect = perfect.has(key);
          return (
            <span
              key={`${label}-${key}`}
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                isPerfect
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200"
                  : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              }`}
              title={isPerfect ? "Perfect" : "Practiced"}
            >
              {show(key)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Letter tracing breakdown model for UI.
 */
type LetterBreakdown = {
  overallDone: number;
  overallPerfect: number;
  lowerDone: number;
  lowerPerfect: number;
  upperDone: number;
  upperPerfect: number;

  overallLetters: string[];
  lowerLetters: string[];
  upperLetters: string[];
  overallPerfectLetters: string[];
  lowerPerfectLetters: string[];
  upperPerfectLetters: string[];

  source: "rollup" | "skillTagStats" | "rollup+skillTagStats" | "none";
};

/**
 * ✅ Fallback: compute from skillTagStats
 */
function computeFromSkillTagStats(skillTagStats?: Record<string, any> | null): LetterBreakdown {
  if (!skillTagStats) {
    return {
      overallDone: 0,
      overallPerfect: 0,
      lowerDone: 0,
      lowerPerfect: 0,
      upperDone: 0,
      upperPerfect: 0,
      overallLetters: [],
      lowerLetters: [],
      upperLetters: [],
      overallPerfectLetters: [],
      lowerPerfectLetters: [],
      upperPerfectLetters: [],
      source: "none",
    };
  }

  const lowerDoneSet = new Set<string>();
  const upperDoneSet = new Set<string>();
  const lowerPerfectSet = new Set<string>();
  const upperPerfectSet = new Set<string>();

  for (const [rawKey, val] of Object.entries(skillTagStats)) {
    const key = String(rawKey || "").toLowerCase();
    const data = (val || {}) as any;

    if (!key.includes("letter:")) continue;

    const mLetter = key.match(/letter[:=_-]([a-z])/);
    const fromVal =
      String(data?.letter || data?.ltr || data?.value || "")
        .toLowerCase()
        .match(/[a-z]/)?.[0] || "";
    const letter = (mLetter?.[1] || fromVal).toLowerCase();
    if (!letter || !/^[a-z]$/.test(letter)) continue;

    const mCase = key.match(/case[:=_-](lower|upper)/);
    const dataCaseRaw = String(data?.case || data?.caseId || data?.caseType || "").toLowerCase();
    const dataCase = dataCaseRaw === "lower" || dataCaseRaw === "upper" ? dataCaseRaw : null;

    const isLower =
      mCase?.[1] === "lower" ||
      key.includes("case:lower") ||
      key.includes("case_lower") ||
      key.includes("case=lower") ||
      dataCase === "lower";

    const isUpper =
      mCase?.[1] === "upper" ||
      key.includes("case:upper") ||
      key.includes("case_upper") ||
      key.includes("case=upper") ||
      dataCase === "upper";

    if (!isLower && !isUpper) continue;

    const attempts =
      typeof data?.attempts === "number"
        ? data.attempts
        : typeof data?.total === "number"
          ? data.total
          : typeof data?.count === "number"
            ? data.count
            : null;

    const correct = typeof data?.correct === "number" ? data.correct : typeof data?.right === "number" ? data.right : null;
    const wrong = typeof data?.wrong === "number" ? data.wrong : typeof data?.incorrect === "number" ? data.incorrect : null;

    const hasActivity =
      (typeof attempts === "number" && attempts > 0) ||
      (typeof correct === "number" && correct > 0) ||
      (typeof wrong === "number" && wrong > 0) ||
      typeof data?.lastSeenAt !== "undefined" ||
      typeof data?.lastWrongAt !== "undefined";

    if (!hasActivity) continue;

    const acc = typeof data?.accuracy === "number" ? data.accuracy : typeof data?.acc === "number" ? data.acc : null;
    const accuracyPct = typeof acc === "number" ? (acc <= 1 ? acc * 100 : acc) : null;

    const isPerfect =
      (typeof accuracyPct === "number" && accuracyPct >= 98) ||
      ((typeof wrong === "number" && wrong === 0) && (typeof correct === "number" && correct > 0));

    if (isLower) {
      lowerDoneSet.add(letter);
      if (isPerfect) lowerPerfectSet.add(letter);
    }
    if (isUpper) {
      upperDoneSet.add(letter);
      if (isPerfect) upperPerfectSet.add(letter);
    }
  }

  const lowerLetters = Array.from(lowerDoneSet).sort();
  const upperLetters = Array.from(upperDoneSet).sort();
  const lowerPerfectLetters = Array.from(lowerPerfectSet).sort();
  const upperPerfectLetters = Array.from(upperPerfectSet).sort();

  const overallLetters = Array.from(new Set([...lowerLetters, ...upperLetters])).sort();
  const overallPerfectLetters = Array.from(new Set([...lowerPerfectLetters, ...upperPerfectLetters])).sort();

  return {
    lowerDone: lowerLetters.length,
    upperDone: upperLetters.length,
    overallDone: overallLetters.length,
    lowerPerfect: lowerPerfectLetters.length,
    upperPerfect: upperPerfectLetters.length,
    overallPerfect: overallPerfectLetters.length,

    lowerLetters,
    upperLetters,
    overallLetters,
    lowerPerfectLetters,
    upperPerfectLetters,
    overallPerfectLetters,

    source: "skillTagStats",
  };
}

/**
 * ✅ Read scheduled rollup from kids/{kidId}.
 * Supports BOTH old and new rollup shapes:
 * - lowerDoneList / upperDoneList / lowerPerfectList / upperPerfectList
 * - letters.lower.done map / letters.upper.done map (keys)
 */
function readFromRollup(kidSummaryData: AnyObj | null): Omit<LetterBreakdown, "source"> | null {
  if (!kidSummaryData) return null;

  const summary = kidSummaryData?.summary || {};
  const progress = kidSummaryData?.progress || {};

  const pickNum = (...vals: any[]): number | null => {
    for (const v of vals) {
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  };

  const pickObj = (...vals: any[]): any | null => {
    for (const v of vals) {
      if (v && typeof v === "object" && !Array.isArray(v)) return v;
    }
    return null;
  };

  const pickArr = (...vals: any[]): string[] | null => {
    for (const v of vals) {
      if (!Array.isArray(v)) continue;
      const cleaned = v
        .map((x) => String(x || "").trim().toLowerCase())
        .filter((x) => /^[a-z]$/.test(x));
      if (cleaned.length > 0) return Array.from(new Set(cleaned)).sort();
    }
    return null;
  };

  const pickMapKeys = (...vals: any[]): string[] | null => {
    for (const v of vals) {
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      const keys = Object.keys(v)
        .map((k) => String(k || "").trim().toLowerCase())
        .filter((x) => /^[a-z]$/.test(x));
      if (keys.length > 0) return Array.from(new Set(keys)).sort();
    }
    return null;
  };

  const byGameS = pickObj(summary?.games, summary?.byGame, summary?.progressByGame);
  const byGameP = pickObj(progress?.byGame, progress?.games, progress?.progressByGame);

  const pLT = pickObj(byGameP?.["letter-tracing"], byGameP?.letterTracing, byGameP?.letter_tracing);
  const sLT = pickObj(byGameS?.["letter-tracing"], byGameS?.letterTracing, byGameS?.letter_tracing);

  if (!pLT && !sLT) return null;

  // counts (new rollup already has these)
  const lowerDone = pickNum(pLT?.lowerDone, sLT?.lowerDone);
  const upperDone = pickNum(pLT?.upperDone, sLT?.upperDone);
  const lowerPerfect = pickNum(pLT?.lowerPerfect, sLT?.lowerPerfect);
  const upperPerfect = pickNum(pLT?.upperPerfect, sLT?.upperPerfect);
  const overallDone = pickNum(pLT?.overallDone, sLT?.overallDone, pLT?.completedLevels, sLT?.completedLevels);
  const overallPerfect = pickNum(pLT?.overallPerfect, sLT?.overallPerfect);

  // ✅ NEW: lists OR maps
  const rollupLowerLetters =
    pickArr(
      pLT?.lowerDoneList,
      sLT?.lowerDoneList,
      pLT?.lowerLetters,
      sLT?.lowerLetters
    ) ??
    pickMapKeys(
      pLT?.letters?.lower?.done,
      sLT?.letters?.lower?.done
    ) ??
    [];

  const rollupUpperLetters =
    pickArr(
      pLT?.upperDoneList,
      sLT?.upperDoneList,
      pLT?.upperLetters,
      sLT?.upperLetters
    ) ??
    pickMapKeys(
      pLT?.letters?.upper?.done,
      sLT?.letters?.upper?.done
    ) ??
    [];

  const rollupLowerPerfectLetters =
    pickArr(
      pLT?.lowerPerfectList,
      sLT?.lowerPerfectList,
      pLT?.lowerPerfectLetters,
      sLT?.lowerPerfectLetters
    ) ??
    pickMapKeys(
      pLT?.letters?.lower?.perfect,
      sLT?.letters?.lower?.perfect
    ) ??
    [];

  const rollupUpperPerfectLetters =
    pickArr(
      pLT?.upperPerfectList,
      sLT?.upperPerfectList,
      pLT?.upperPerfectLetters,
      sLT?.upperPerfectLetters
    ) ??
    pickMapKeys(
      pLT?.letters?.upper?.perfect,
      sLT?.letters?.upper?.perfect
    ) ??
    [];

  const overallLetters = Array.from(new Set([...rollupLowerLetters, ...rollupUpperLetters])).sort();
  const overallPerfectLetters = Array.from(new Set([...rollupLowerPerfectLetters, ...rollupUpperPerfectLetters])).sort();

  const hasAny =
    lowerDone !== null ||
    upperDone !== null ||
    lowerPerfect !== null ||
    upperPerfect !== null ||
    overallDone !== null ||
    overallPerfect !== null ||
    overallLetters.length > 0 ||
    rollupLowerLetters.length > 0 ||
    rollupUpperLetters.length > 0 ||
    overallPerfectLetters.length > 0;

  if (!hasAny) return null;

  const ld = typeof lowerDone === "number" ? lowerDone : rollupLowerLetters.length;
  const ud = typeof upperDone === "number" ? upperDone : rollupUpperLetters.length;
  const lp = typeof lowerPerfect === "number" ? lowerPerfect : rollupLowerPerfectLetters.length;
  const up = typeof upperPerfect === "number" ? upperPerfect : rollupUpperPerfectLetters.length;

  const od = typeof overallDone === "number" ? overallDone : overallLetters.length;
  const op = typeof overallPerfect === "number" ? overallPerfect : overallPerfectLetters.length;

  return {
    overallDone: od,
    overallPerfect: op,
    lowerDone: ld,
    lowerPerfect: lp,
    upperDone: ud,
    upperPerfect: up,

    overallLetters,
    lowerLetters: rollupLowerLetters,
    upperLetters: rollupUpperLetters,
    overallPerfectLetters,
    lowerPerfectLetters: rollupLowerPerfectLetters,
    upperPerfectLetters: rollupUpperPerfectLetters,
  };
}

function getTheme(gameId: string) {
  switch (gameId) {
    case "letter-tracing":
      return {
        emoji: "✍️",
        glowFrom: "from-indigo-500/30",
        glowTo: "to-sky-500/20",
        pillFrom: "from-indigo-600",
        pillTo: "to-sky-600",
        border: "border-indigo-100 dark:border-indigo-900/30",
      };
    case "sound-detective":
      return {
        emoji: "🕵️‍♂️",
        glowFrom: "from-emerald-500/25",
        glowTo: "to-lime-400/20",
        pillFrom: "from-emerald-600",
        pillTo: "to-lime-600",
        border: "border-emerald-100 dark:border-emerald-900/30",
      };
    default:
      return {
        emoji: "🎮",
        glowFrom: "from-purple-500/25",
        glowTo: "to-pink-400/20",
        pillFrom: "from-purple-600",
        pillTo: "to-pink-600",
        border: "border-gray-200 dark:border-gray-800",
      };
  }
}

export function ParentGamesProgress({
  kidSummaryData,
  gamesCatalog,
  onPracticeClick,
  skillTagStats,
}: ParentGamesProgressProps) {
  const summary = kidSummaryData?.summary || {};
  const progress = kidSummaryData?.progress || {};
  const byGame = progress?.byGame || {};
  const summaryGames = summary?.games || {};

  const lastUpdated =
    formatDateMaybe(summary?.lastUpdatedAt) ||
    formatDateMaybe(summary?.updatedAt) ||
    null;

  const games: GameCatalogItem[] = useMemo(() => {
    const list = Array.isArray(gamesCatalog) ? [...gamesCatalog] : [];
    const ids = new Set(list.map((g) => g.id));

    if (!ids.has("letter-tracing")) {
      list.unshift({
        id: "letter-tracing",
        title: "Letter Tracing",
        subtitle: "Lowercase + Uppercase",
        area: "phonics",
        totalLevels: TOTAL_LETTERS,
      });
    }
    if (!ids.has("sound-detective")) {
      list.push({
        id: "sound-detective",
        title: "Sound Detective",
        subtitle: "Hear sounds in words",
        area: "phonics",
        totalLevels: 5,
      });
    }
    return list;
  }, [gamesCatalog]);

  const letterBreakdown: LetterBreakdown = useMemo(() => {
    const rollup = readFromRollup(kidSummaryData);
    const stats = computeFromSkillTagStats(skillTagStats);

    if (!rollup) return stats;

    const rollupHasLetters =
      rollup.lowerLetters.length > 0 ||
      rollup.upperLetters.length > 0 ||
      rollup.overallLetters.length > 0 ||
      rollup.lowerPerfectLetters.length > 0 ||
      rollup.upperPerfectLetters.length > 0 ||
      rollup.overallPerfectLetters.length > 0;

    const statsHasLetters =
      stats.lowerLetters.length > 0 ||
      stats.upperLetters.length > 0 ||
      stats.overallLetters.length > 0 ||
      stats.lowerPerfectLetters.length > 0 ||
      stats.upperPerfectLetters.length > 0 ||
      stats.overallPerfectLetters.length > 0;

    const useStatsLetters =
      !rollupHasLetters &&
      stats.source === "skillTagStats" &&
      statsHasLetters;

    return {
      ...rollup,
      overallLetters: useStatsLetters ? stats.overallLetters : rollup.overallLetters,
      lowerLetters: useStatsLetters ? stats.lowerLetters : rollup.lowerLetters,
      upperLetters: useStatsLetters ? stats.upperLetters : rollup.upperLetters,
      overallPerfectLetters: useStatsLetters ? stats.overallPerfectLetters : rollup.overallPerfectLetters,
      lowerPerfectLetters: useStatsLetters ? stats.lowerPerfectLetters : rollup.lowerPerfectLetters,
      upperPerfectLetters: useStatsLetters ? stats.upperPerfectLetters : rollup.upperPerfectLetters,
      source: useStatsLetters ? "rollup+skillTagStats" : "rollup",
    };
  }, [kidSummaryData, skillTagStats]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Progress updates <span className="font-semibold">3 times/day</span> (scheduled).
          {lastUpdated ? <span className="ml-2">• Last updated: {lastUpdated}</span> : null}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Tap <span className="font-semibold">Play</span> to open the kid-friendly games.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {games.map((game) => {
          const gameId = game.id || "unknown";
          const theme = getTheme(gameId);

          const prog = byGame?.[gameId] || {};
          const sumG = summaryGames?.[gameId] || {};

          const lastPlayed =
            formatDateMaybe(prog?.lastPlayedAt) || formatDateMaybe(sumG?.lastPlayedAt) || null;

          const isLetterTracing = gameId === "letter-tracing";

          let total = Number(prog?.totalLevels ?? game.totalLevels ?? sumG?.totalLevels ?? 0) || 0;
          let completed = Number(prog?.completedLevels ?? prog?.levelsCompleted ?? sumG?.completedLevels ?? 0) || 0;

          if (isLetterTracing) {
            total = TOTAL_LETTERS;
            completed = letterBreakdown.overallDone || 0;
          } else {
            if (!total) total = game.totalLevels || 5;
          }

          const pct = total > 0 ? (completed / total) * 100 : 0;
          const badge = getStatusBadge(completed, total);

          const lowerInline = formatLettersInline(letterBreakdown.lowerLetters, "lower");
          const upperInline = formatLettersInline(letterBreakdown.upperLetters, "upper");

          return (
            <Card
              key={gameId}
              className={`group relative overflow-hidden rounded-2xl border ${theme.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all`}
            >
              <div
                className={`pointer-events-none absolute -inset-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-gradient-to-br ${theme.glowFrom} ${theme.glowTo}`}
              />
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08] bg-[radial-gradient(circle_at_20%_10%,white_0%,transparent_55%)]" />

              <div className="relative p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.pillFrom} ${theme.pillTo} text-white shadow-sm`}
                    >
                      <span className="text-xl">{theme.emoji}</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                        {game.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {game.subtitle || "Practice"}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {isLetterTracing ? "Letters" : "Levels"}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {completed}/{total}
                    </div>
                  </div>

                  <ProgressBar pct={pct} from={theme.pillFrom} to={theme.pillTo} />

                  {isLetterTracing ? (
                    <div className="pt-2 space-y-2">
                      {/* Lowercase */}
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Lowercase</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">
                            {letterBreakdown.lowerDone}/{TOTAL_LETTERS}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200">
                            Perfect: {letterBreakdown.lowerPerfect}
                          </span>
                        </span>
                      </div>

                      {/* ✅ Inline completed letters (as you asked) */}
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Completed:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {lowerInline || (letterBreakdown.lowerDone > 0 ? "— (list after next update)" : "—")}
                        </span>
                      </div>

                      <ProgressBar
                        pct={(letterBreakdown.lowerDone / TOTAL_LETTERS) * 100}
                        from="from-indigo-500"
                        to="to-sky-500"
                      />

                      {/* Uppercase */}
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Uppercase</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">
                            {letterBreakdown.upperDone}/{TOTAL_LETTERS}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200">
                            Perfect: {letterBreakdown.upperPerfect}
                          </span>
                        </span>
                      </div>

                      {/* ✅ Inline completed letters (as you asked) */}
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Completed:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {upperInline || (letterBreakdown.upperDone > 0 ? "— (list after next update)" : "—")}
                        </span>
                      </div>

                      <ProgressBar
                        pct={(letterBreakdown.upperDone / TOTAL_LETTERS) * 100}
                        from="from-fuchsia-500"
                        to="to-rose-500"
                      />

                      <details className="pt-2 group">
                        <summary className="cursor-pointer select-none text-[11px] font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                          <span>Practiced letters</span>
                          <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                        </summary>
                        <div className="mt-2 space-y-2">
                          {letterBreakdown.lowerLetters.length > 0 || letterBreakdown.upperLetters.length > 0 ? (
                            <>
                              <LetterChipsRow
                                label="Lowercase letters"
                                letters={letterBreakdown.lowerLetters}
                                perfectLetters={letterBreakdown.lowerPerfectLetters}
                                display="lower"
                              />
                              <LetterChipsRow
                                label="Uppercase letters"
                                letters={letterBreakdown.upperLetters}
                                perfectLetters={letterBreakdown.upperPerfectLetters}
                                display="upper"
                              />
                            </>
                          ) : (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              Letter list will appear after the next scheduled update.
                            </div>
                          )}
                        </div>
                      </details>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                        <span>Overall Perfect</span>
                        <span className="font-semibold">
                          {letterBreakdown.overallPerfect}/{TOTAL_LETTERS}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Source:{" "}
                        <span className="font-semibold">
                          {letterBreakdown.source === "rollup"
                            ? "Scheduled rollup"
                            : letterBreakdown.source === "rollup+skillTagStats"
                              ? "Rollup + letters from skill stats"
                              : letterBreakdown.source === "skillTagStats"
                                ? "Skill stats (live)"
                                : "Not available yet"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Last:</span>
                    <span className="font-medium">{lastPlayed || "—"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isLetterTracing ? "Trace neatly ✨" : "Play & learn ✨"}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onPracticeClick(gameId)}
                    className="rounded-full bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-900 shadow-sm"
                  >
                    Play
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
