// src/pages/parent/components/progress/ParentGamesProgress.tsx
import React, { useMemo, useState } from "react";
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

type LetterPractice = {
  lowerDone: number;
  upperDone: number;
  overallDone: number;
  lowerLetters: string[]; // a..z (lowercase)
  upperLetters: string[]; // A..Z
  sourceCounts: "rollup" | "skillTagStats" | "none";
  sourceLetters: "skillTagStats" | "none";
};

/**
 * Extract practiced letters from skillTagStats.
 * Practiced = attempts>0 OR correct>0 OR wrong>0.
 * Tag format expected somewhere in key: "letter:a" and "case:lower|upper".
 */
function lettersFromSkillTagStats(skillTagStats: Record<string, any> | null) {
  const lower = new Set<string>();
  const upper = new Set<string>();

  if (!skillTagStats) {
    return { lowerLetters: [] as string[], upperLetters: [] as string[], source: "none" as const };
  }

  for (const [rawId, data] of Object.entries(skillTagStats)) {
    const id = String(rawId || "");
    const key = id.toLowerCase();

    const mLetter = key.match(/letter:([a-z])/);
    if (!mLetter) continue;
    const letter = mLetter[1];

    const attempts = safeNum(data?.attempts ?? data?.tries ?? data?.count ?? data?.totalAttempts);
    const correct = safeNum(data?.correct ?? data?.right ?? data?.success ?? data?.correctCount);
    const wrong = safeNum(data?.wrong ?? data?.incorrect ?? data?.fail ?? data?.wrongCount);

    const practiced = attempts > 0 || correct > 0 || wrong > 0;
    if (!practiced) continue;

    const mCase = key.match(/case:(lower|upper)/);
    const dataCase = String(data?.case || data?.letterCase || "").toLowerCase();

    const isLower = mCase?.[1] === "lower" || dataCase === "lower" || key.includes("lowercase");
    const isUpper = mCase?.[1] === "upper" || dataCase === "upper" || key.includes("uppercase");

    // If case is missing, we still treat it as practiced in both? No — safer: count only overall via lower list.
    // But for tracing, case SHOULD exist. We'll default to lowercase if missing.
    if (isUpper) upper.add(letter.toUpperCase());
    else lower.add(letter);
  }

  const lowerLetters = Array.from(lower).sort();
  const upperLetters = Array.from(upper).sort();

  return { lowerLetters, upperLetters, source: "skillTagStats" as const };
}

function formatLetterPreview(list: string[], max = 10) {
  const arr = Array.isArray(list) ? list : [];
  const shown = arr.slice(0, max);
  const extra = Math.max(0, arr.length - shown.length);
  return { shown, extra };
}

/**
 * Primary: read counts from scheduled rollup (kids/{kidId} doc).
 * (We only read COUNTS from rollup; letter LIST comes from skillTagStats.)
 */
function readCountsFromRollup(kidSummaryData: any | null) {
  if (!kidSummaryData) return null;

  const summary = kidSummaryData?.summary || {};
  const progress = kidSummaryData?.progress || {};

  const summaryGames = summary?.games || {};
  const byGame = progress?.byGame || {};

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

  const overallDone = pickNum(
    pLT?.overallDone, pLT?.lettersDone, pLT?.completedLetters, pLT?.completedLevels,
    sLT?.overallDone, sLT?.lettersDone, sLT?.completedLetters, sLT?.completedLevels
  );

  const hasAny = lowerDone !== null || upperDone !== null || overallDone !== null;
  if (!hasAny) return null;

  const ld = lowerDone ?? 0;
  const ud = upperDone ?? 0;

  return {
    lowerDone: ld,
    upperDone: ud,
    overallDone: overallDone ?? (ld + ud ? Math.max(ld, ud) : 0),
  };
}

export function ParentGamesProgress({ kidSummaryData, gamesCatalog, onPracticeClick, skillTagStats }: Props) {
  const summary = kidSummaryData?.summary || null;
  const progress = kidSummaryData?.progress || null;

  const lastUpdated = formatDateMaybe(summary?.lastUpdatedAt);

  const letterPractice: LetterPractice = useMemo(() => {
    const rollupCounts = readCountsFromRollup(kidSummaryData);
    const fromStats = lettersFromSkillTagStats(skillTagStats);

    const countsSource = rollupCounts ? "rollup" : (fromStats.source === "skillTagStats" ? "skillTagStats" : "none");

    const lowerDone = rollupCounts ? rollupCounts.lowerDone : fromStats.lowerLetters.length;
    const upperDone = rollupCounts ? rollupCounts.upperDone : fromStats.upperLetters.length;
    const overallDone = rollupCounts ? rollupCounts.overallDone : Math.max(lowerDone, upperDone);

    return {
      lowerDone,
      upperDone,
      overallDone,
      lowerLetters: fromStats.lowerLetters,
      upperLetters: fromStats.upperLetters,
      sourceCounts: countsSource,
      sourceLetters: fromStats.source === "skillTagStats" ? "skillTagStats" : "none",
    };
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

  // tiny “expand” UI only for tracing tile
  const [showAllLower, setShowAllLower] = useState(false);
  const [showAllUpper, setShowAllUpper] = useState(false);

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
            completed = letterPractice.overallDone || 0;
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

                  {/* Letter tracing: lower/upper + letters practiced */}
                  {isLetterTracing ? (
                    <div className="pt-2 space-y-3">
                      {/* Lowercase */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Lowercase practiced</span>
                          <span className="font-semibold">
                            {letterPractice.lowerDone}/{TOTAL_LETTERS}
                          </span>
                        </div>
                        <ProgressBar
                          pct={(letterPractice.lowerDone / TOTAL_LETTERS) * 100}
                          from="from-indigo-500"
                          to="to-sky-500"
                        />

                        {letterPractice.sourceLetters === "skillTagStats" && letterPractice.lowerLetters.length > 0 ? (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {(() => {
                              const list = showAllLower
                                ? { shown: letterPractice.lowerLetters, extra: 0 }
                                : formatLetterPreview(letterPractice.lowerLetters, 10);
                              const txt = list.shown.join(", ");
                              return (
                                <>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">Letters:</span>{" "}
                                  <span>{txt}</span>
                                  {list.extra > 0 ? (
                                    <>
                                      {" "}
                                      <button
                                        type="button"
                                        className="underline underline-offset-2 ml-1"
                                        onClick={() => setShowAllLower(true)}
                                      >
                                        +{list.extra} more
                                      </button>
                                    </>
                                  ) : null}
                                  {showAllLower ? (
                                    <button
                                      type="button"
                                      className="underline underline-offset-2 ml-2"
                                      onClick={() => setShowAllLower(false)}
                                    >
                                      show less
                                    </button>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Letters list will appear after the next stats update.
                          </div>
                        )}
                      </div>

                      {/* Uppercase */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Uppercase practiced</span>
                          <span className="font-semibold">
                            {letterPractice.upperDone}/{TOTAL_LETTERS}
                          </span>
                        </div>
                        <ProgressBar
                          pct={(letterPractice.upperDone / TOTAL_LETTERS) * 100}
                          from="from-fuchsia-500"
                          to="to-rose-500"
                        />

                        {letterPractice.sourceLetters === "skillTagStats" && letterPractice.upperLetters.length > 0 ? (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {(() => {
                              const list = showAllUpper
                                ? { shown: letterPractice.upperLetters, extra: 0 }
                                : formatLetterPreview(letterPractice.upperLetters, 10);
                              const txt = list.shown.join(", ");
                              return (
                                <>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">Letters:</span>{" "}
                                  <span>{txt}</span>
                                  {list.extra > 0 ? (
                                    <>
                                      {" "}
                                      <button
                                        type="button"
                                        className="underline underline-offset-2 ml-1"
                                        onClick={() => setShowAllUpper(true)}
                                      >
                                        +{list.extra} more
                                      </button>
                                    </>
                                  ) : null}
                                  {showAllUpper ? (
                                    <button
                                      type="button"
                                      className="underline underline-offset-2 ml-2"
                                      onClick={() => setShowAllUpper(false)}
                                    >
                                      show less
                                    </button>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Letters list will appear after the next stats update.
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Counts source:{" "}
                        <span className="font-semibold">
                          {letterPractice.sourceCounts === "rollup" ? "Scheduled rollup" : "SkillTagStats fallback"}
                        </span>
                        {" · "}
                        Letters source:{" "}
                        <span className="font-semibold">
                          {letterPractice.sourceLetters === "skillTagStats" ? "SkillTagStats" : "—"}
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
