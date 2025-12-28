// src/pages/parent/components/progress/ParentGamesProgress.tsx
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  kidSummaryData: any | null;
  gamesCatalog: any[];
  onPracticeClick: (gameId?: string) => void;
  skillTagStats: Record<string, any> | null;
};

const TOTAL_LETTERS = 26;

type Theme = {
  emoji: string;
  pillFrom: string;
  pillTo: string;
  glowFrom: string;
  glowTo: string;
  border: string;
};

const THEMES: Record<string, Theme> = {
  "letter-tracing": {
    emoji: "✍️",
    pillFrom: "from-orange-500",
    pillTo: "to-rose-500",
    glowFrom: "from-orange-200/30",
    glowTo: "to-rose-200/30",
    border: "border-orange-200/70 dark:border-orange-900/40",
  },
  "sound-detective": {
    emoji: "🕵️‍♂️",
    pillFrom: "from-sky-500",
    pillTo: "to-indigo-500",
    glowFrom: "from-sky-200/30",
    glowTo: "to-indigo-200/30",
    border: "border-sky-200/70 dark:border-sky-900/40",
  },
  "rhyme-time": {
    emoji: "🎵",
    pillFrom: "from-emerald-500",
    pillTo: "to-teal-500",
    glowFrom: "from-emerald-200/30",
    glowTo: "to-teal-200/30",
    border: "border-emerald-200/70 dark:border-emerald-900/40",
  },
};

function getTheme(gameId: string): Theme {
  return (
    THEMES[gameId] || {
      emoji: "🎮",
      pillFrom: "from-violet-500",
      pillTo: "to-fuchsia-500",
      glowFrom: "from-violet-200/30",
      glowTo: "to-fuchsia-200/30",
      border: "border-violet-200/70 dark:border-violet-900/40",
    }
  );
}

function safeNum(v: any): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function pickNum(...vals: any[]): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function formatDateMaybe(ts: any): string | null {
  try {
    if (!ts) return null;
    if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString("en-IN");
    if (typeof ts?.toMillis === "function") return new Date(ts.toMillis()).toLocaleString("en-IN");
    if (typeof ts === "number") return new Date(ts).toLocaleString("en-IN");
    if (ts instanceof Date) return ts.toLocaleString("en-IN");
    return null;
  } catch {
    return null;
  }
}

function ProgressBar({ pct, from, to }: { pct: number; from: string; to: string }) {
  const w = `${clampPct(pct)}%`;
  return (
    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${from} ${to} transition-[width] duration-500`}
        style={{ width: w }}
      />
    </div>
  );
}

function getStatusBadge(completed: number, total: number) {
  if (!total || total <= 0)
    return { label: "Not started", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" };
  if (!completed || completed <= 0)
    return { label: "Not started", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" };
  if (completed >= total)
    return { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200" };
  return { label: "In progress", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-200" };
}

type LetterBreakdown = {
  overallDone: number;
  overallPerfect: number;
  lowerDone: number;
  lowerPerfect: number;
  upperDone: number;
  upperPerfect: number;
  source: "rollup" | "skillTagStats" | "none";
};

/**
 * Fallback compute from skillTagStats if rollup fields are not present.
 * Perfect = wrong==0 and (attempts>0 OR correct>0)
 * Case detection: doc id contains case:lower / case:upper OR data.case
 */
function computeFromSkillTagStats(skillTagStats: Record<string, any> | null): LetterBreakdown {
  const lowerDone = new Set<string>();
  const upperDone = new Set<string>();
  const overallDone = new Set<string>();

  const lowerPerfect = new Set<string>();
  const upperPerfect = new Set<string>();
  const overallPerfect = new Set<string>();

  if (!skillTagStats) {
    return {
      overallDone: 0,
      overallPerfect: 0,
      lowerDone: 0,
      lowerPerfect: 0,
      upperDone: 0,
      upperPerfect: 0,
      source: "none",
    };
  }

  for (const [rawId, data] of Object.entries(skillTagStats)) {
    const id = String(rawId || "");
    const key = id.toLowerCase();

    const mLetter = key.match(/letter:([a-z])/);
    if (!mLetter) continue;
    const letter = mLetter[1];

    const mCase = key.match(/case:(lower|upper)/);
    const dataCase = String(data?.case || data?.letterCase || "").toLowerCase();
    const isLower = mCase?.[1] === "lower" || dataCase === "lower" || key.includes("lowercase");
    const isUpper = mCase?.[1] === "upper" || dataCase === "upper" || key.includes("uppercase");

    const attempts = safeNum(data?.attempts ?? data?.tries ?? data?.count ?? data?.totalAttempts);
    const correct = safeNum(data?.correct ?? data?.right ?? data?.success ?? data?.correctCount);
    const wrong = safeNum(data?.wrong ?? data?.incorrect ?? data?.fail ?? data?.wrongCount);

    overallDone.add(letter);
    if (isLower) lowerDone.add(letter);
    if (isUpper) upperDone.add(letter);

    const isPerfect = wrong === 0 && (attempts > 0 || correct > 0);
    if (isPerfect) {
      overallPerfect.add(letter);
      if (isLower) lowerPerfect.add(letter);
      if (isUpper) upperPerfect.add(letter);
    }
  }

  return {
    overallDone: overallDone.size,
    overallPerfect: overallPerfect.size,
    lowerDone: lowerDone.size,
    lowerPerfect: lowerPerfect.size,
    upperDone: upperDone.size,
    upperPerfect: upperPerfect.size,
    source: "skillTagStats",
  };
}

/**
 * Primary: read from your scheduled rollup output (kids/{kidId} doc).
 * Supports multiple possible field names so it works with your existing structure.
 */
function readFromRollup(kidSummaryData: any | null): Omit<LetterBreakdown, "source"> | null {
  if (!kidSummaryData) return null;

  const summary = kidSummaryData?.summary || {};
  const progress = kidSummaryData?.progress || {};

  const summaryGames = summary?.games || {};
  const byGame = progress?.byGame || {};

  // Possible locations
  const sLT =
    summaryGames?.["letter-tracing"] ||
    summaryGames?.letterTracing ||
    summaryGames?.letter_tracing ||
    null;

  const pLT =
    byGame?.["letter-tracing"] ||
    byGame?.letterTracing ||
    byGame?.letter_tracing ||
    null;

  // Try to extract with many likely names
  const lowerDone = pickNum(
    pLT?.lowerDone, pLT?.lowercaseDone, pLT?.lcDone,
    pLT?.case?.lower?.done, pLT?.cases?.lower?.done,
    sLT?.lowerDone, sLT?.lowercaseDone, sLT?.lcDone,
    sLT?.case?.lower?.done, sLT?.cases?.lower?.done
  );

  const upperDone = pickNum(
    pLT?.upperDone, pLT?.uppercaseDone, pLT?.ucDone,
    pLT?.case?.upper?.done, pLT?.cases?.upper?.done,
    sLT?.upperDone, sLT?.uppercaseDone, sLT?.ucDone,
    sLT?.case?.upper?.done, sLT?.cases?.upper?.done
  );

  const lowerPerfect = pickNum(
    pLT?.lowerPerfect, pLT?.lowercasePerfect, pLT?.lcPerfect,
    pLT?.case?.lower?.perfect, pLT?.cases?.lower?.perfect,
    sLT?.lowerPerfect, sLT?.lowercasePerfect, sLT?.lcPerfect,
    sLT?.case?.lower?.perfect, sLT?.cases?.lower?.perfect
  );

  const upperPerfect = pickNum(
    pLT?.upperPerfect, pLT?.uppercasePerfect, pLT?.ucPerfect,
    pLT?.case?.upper?.perfect, pLT?.cases?.upper?.perfect,
    sLT?.upperPerfect, sLT?.uppercasePerfect, sLT?.ucPerfect,
    sLT?.case?.upper?.perfect, sLT?.cases?.upper?.perfect
  );

  const overallDone = pickNum(
    pLT?.overallDone, pLT?.lettersDone, pLT?.completedLetters, pLT?.completedLevels,
    sLT?.overallDone, sLT?.lettersDone, sLT?.completedLetters, sLT?.completedLevels
  );

  const overallPerfect = pickNum(
    pLT?.overallPerfect, pLT?.perfectLetters,
    sLT?.overallPerfect, sLT?.perfectLetters
  );

  // If rollup has NOTHING, return null
  const hasAny =
    lowerDone !== null ||
    upperDone !== null ||
    lowerPerfect !== null ||
    upperPerfect !== null ||
    overallDone !== null ||
    overallPerfect !== null;

  if (!hasAny) return null;

  // If overall not provided, be conservative: at least max(lower,upper)
  const ld = lowerDone ?? 0;
  const ud = upperDone ?? 0;
  const lp = lowerPerfect ?? 0;
  const up = upperPerfect ?? 0;

  return {
    lowerDone: ld,
    upperDone: ud,
    lowerPerfect: lp,
    upperPerfect: up,
    overallDone: overallDone ?? Math.max(ld, ud),
    overallPerfect: overallPerfect ?? Math.max(lp, up),
  };
}

export function ParentGamesProgress({ kidSummaryData, gamesCatalog, onPracticeClick, skillTagStats }: Props) {
  const summary = kidSummaryData?.summary || null;
  const progress = kidSummaryData?.progress || null;

  const lastUpdated = formatDateMaybe(summary?.lastUpdatedAt);

  const letterBreakdown: LetterBreakdown = useMemo(() => {
    const rollup = readFromRollup(kidSummaryData);
    if (rollup) {
      return { ...rollup, source: "rollup" };
    }
    return computeFromSkillTagStats(skillTagStats);
  }, [kidSummaryData, skillTagStats]);

  const games = useMemo(() => {
    const catalog = Array.isArray(gamesCatalog) ? gamesCatalog : [];

    if (catalog.length > 0) {
      return catalog.map((g: any) => ({
        id: String(g.id || g.gameId || ""),
        title: String(g.title || g.name || "Game"),
        subtitle: String(g.subtitle || g.category || ""),
        totalLevels:
          Number(g.totalLevels ?? g.levels ?? g.maxLevels) ||
          (String(g.id || g.gameId || "") === "letter-tracing" ? TOTAL_LETTERS : 5),
      }));
    }

    return [
      { id: "letter-tracing", title: "Letter Tracing", subtitle: "Writing", totalLevels: TOTAL_LETTERS },
      { id: "sound-detective", title: "Sound Detective", subtitle: "Sounds", totalLevels: 5 },
      { id: "rhyme-time", title: "Rhyme Time", subtitle: "Sounds", totalLevels: 5 },
    ];
  }, [gamesCatalog]);

  const byGame = progress?.byGame || {};
  const summaryGames = summary?.games || {};

  return (
    <div className="space-y-4">
      {/* NO auto-refresh: just explaining the scheduled rollup */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Progress updates <span className="font-semibold">3 times/day</span> (scheduled).
          {lastUpdated ? <span className="ml-2">• Last updated: {lastUpdated}</span> : null}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Tap <span className="font-semibold">Play</span> to open the kid-friendly games.
        </div>
      </div>

      {/* Game Tiles */}
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

            // For letter tracing, prefer scheduled rollup values (or fallback skillTagStats)
            completed = letterBreakdown.overallDone || 0;
          } else {
            if (!total) total = game.totalLevels || 5;
          }

          const pct = total > 0 ? (completed / total) * 100 : 0;
          const badge = getStatusBadge(completed, total);

          return (
            <Card
              key={gameId}
              className={`group relative overflow-hidden rounded-2xl border ${theme.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all`}
            >
              {/* Glow */}
              <div
                className={`pointer-events-none absolute -inset-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-gradient-to-br ${theme.glowFrom} ${theme.glowTo}`}
              />
              {/* Shine */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08] bg-[radial-gradient(circle_at_20%_10%,white_0%,transparent_55%)]" />

              <div className="relative p-5 space-y-4">
                {/* Header */}
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

                {/* Main progress */}
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

                  {/* Letter tracing: lower/upper + perfect */}
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
                      <ProgressBar
                        pct={(letterBreakdown.upperDone / TOTAL_LETTERS) * 100}
                        from="from-fuchsia-500"
                        to="to-rose-500"
                      />

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                        <span>Overall Perfect</span>
                        <span className="font-semibold">
                          {letterBreakdown.overallPerfect}/{TOTAL_LETTERS}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Source:{" "}
                        <span className="font-semibold">
                          {letterBreakdown.source === "rollup" ? "Scheduled rollup" : "SkillTagStats fallback"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Last */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Last:</span>
                    <span className="font-medium">{lastPlayed || "—"}</span>
                  </div>
                </div>

                {/* Actions */}
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
