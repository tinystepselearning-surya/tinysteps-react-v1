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
  gameProgressDocs?: Record<string, any> | null;
  gameSummaries?: Record<string, any> | null;
  onPracticeClick: (gameId?: string) => void;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
  refreshMessage?: string | null;
  refreshTone?: "neutral" | "success" | "info" | "error";
};

type ParentGameMeta = {
  id: string;
  title: string;
  subtitle: string;
  areaPractised: string;
  totalLevels?: number;
  progressKeys: string[];
  summaryKeys: string[];
};

type GameSnapshot = {
  totalLevels: number;
  levelsCompleted: number;
  progressStatus: "not_started" | "getting_started" | "in_progress" | "progressing" | "completed";
  totalTimeSpentMs: number;
  lastPlayedAt: string | null;
  areaPractised: string;
};

const EMPTY_RECORD: Record<string, any> = {};

const STAGE1_GAME_META: Record<string, ParentGameMeta> = {
  "letter-tracing": {
    id: "letter-tracing",
    title: "Letter Tracing",
    subtitle: "Practices letter formation",
    areaPractised: "Letter formation",
    totalLevels: 59,
    progressKeys: ["letter-tracing", "phonics_letter_tracing", "letter_tracing"],
    summaryKeys: ["phonics_letter_tracing", "letter-tracing", "letter_tracing"],
  },
  "letter-tracing-sounds": {
    id: "letter-tracing-sounds",
    title: "Letter Tracing + Sounds",
    subtitle: "Tracing with sound support",
    areaPractised: "Letter formation with sound support",
    totalLevels: 59,
    progressKeys: ["letter-tracing-sounds", "phonics_letter_tracing_sounds", "letter_tracing_sounds"],
    summaryKeys: ["phonics_letter_tracing_sounds", "letter-tracing-sounds", "letter_tracing_sounds"],
  },
  "letter-sound-match": {
    id: "letter-sound-match",
    title: "Letter Sounds",
    subtitle: "Matches sounds to letters",
    areaPractised: "Letter-sound recognition",
    totalLevels: 7,
    progressKeys: ["letter-sound-match", "phonics_letter_sound", "phonics_letter_sound_match"],
    summaryKeys: ["phonics_letter_sound", "phonics_letter_sound_match", "letter-sound-match"],
  },
  "balloon-pop": {
    id: "balloon-pop",
    title: "Balloon Pop",
    subtitle: "Pops the matching sound balloon",
    areaPractised: "Sound matching",
    totalLevels: 7,
    progressKeys: ["balloon-pop", "phonics_balloon_pop"],
    summaryKeys: ["phonics_balloon_pop", "balloon-pop"],
  },
  "sound-detective": {
    id: "sound-detective",
    title: "Sound Listening",
    subtitle: "Listens and identifies sounds",
    areaPractised: "Listening and sound identification",
    totalLevels: 7,
    progressKeys: ["sound-detective", "phonics_sound_detective"],
    summaryKeys: ["phonics_sound_detective", "sound-detective"],
  },
};

const STAGE1_REQUIRED_GAME_IDS = [
  "letter-tracing",
  "letter-tracing-sounds",
  "letter-sound-match",
  "balloon-pop",
  "sound-detective",
] as const;

const STAGE1_ID_ALIASES: Record<string, string> = {
  "letter-tracing": "letter-tracing",
  phonics_letter_tracing: "letter-tracing",
  letter_tracing: "letter-tracing",
  "letter-tracing-sounds": "letter-tracing-sounds",
  phonics_letter_tracing_sounds: "letter-tracing-sounds",
  letter_tracing_sounds: "letter-tracing-sounds",
  "letter-sound-match": "letter-sound-match",
  phonics_letter_sound: "letter-sound-match",
  phonics_letter_sound_match: "letter-sound-match",
  "balloon-pop": "balloon-pop",
  phonics_balloon_pop: "balloon-pop",
  "sound-detective": "sound-detective",
  phonics_sound_detective: "sound-detective",
  "my-first-words": "my-first-words",
  my_first_words_v1: "my-first-words",
  my_first_words: "my-first-words",
  phonics_my_first_words: "my-first-words",
  "cvc-word-builder": "cvc-word-builder",
  cvc_word_reader_v1: "cvc-word-builder",
  cvc_word_reader: "cvc-word-builder",
  "cvc-word-reader": "cvc-word-builder",
  phonics_cvc_word_reader: "cvc-word-builder",
  phonics_cvc_word_builder: "cvc-word-builder",
  "spelling-practice": "cvc-word-builder",
  phonics_spelling_practice: "cvc-word-builder",
  "make-a-word-rime": "cvc-word-builder",
  "sentence-stepper": "sentence-stepper",
  sentence_stepper: "sentence-stepper",
  "story-reading": "story-reading",
  story_reading: "story-reading",
  "comprehension": "comprehension",
  comprehension_game: "comprehension",
  "new-words": "new-words",
  new_words: "new-words",
  "build-better-sentences": "build-better-sentences",
  build_better_sentences: "build-better-sentences",
  "grammar-fix": "grammar-fix",
  grammar_fix: "grammar-fix",
  "collocation-builder": "collocation-builder",
  collocation_builder: "collocation-builder",
  "idiom-in-a-sentence": "idiom-in-a-sentence",
  idiom_in_a_sentence: "idiom-in-a-sentence",
};

const CANONICAL_FALLBACK_META: Record<
  string,
  Pick<ParentGameMeta, "title" | "subtitle" | "areaPractised">
> = {
  "my-first-words": {
    title: "My First Words",
    subtitle: "Builds early blending confidence",
    areaPractised: "Word building",
  },
  "cvc-word-builder": {
    title: "CVC Word Builder",
    subtitle: "Builds and reads simple words",
    areaPractised: "Word building",
  },
  "sentence-stepper": {
    title: "Sentence Stepper",
    subtitle: "Builds sentence reading fluency",
    areaPractised: "Reading fluency",
  },
  "story-reading": {
    title: "Story Reading",
    subtitle: "Reads short stories for fluency",
    areaPractised: "Reading practice",
  },
  comprehension: {
    title: "Comprehension",
    subtitle: "Answers meaning-based questions",
    areaPractised: "Reading comprehension",
  },
  "new-words": {
    title: "New Words from Reading",
    subtitle: "Learns vocabulary from passages",
    areaPractised: "Vocabulary in context",
  },
  "build-better-sentences": {
    title: "Build Better Sentences",
    subtitle: "Improves sentence construction",
    areaPractised: "Grammar practice",
  },
  "grammar-fix": {
    title: "Grammar Fix",
    subtitle: "Finds and fixes grammar mistakes",
    areaPractised: "Grammar practice",
  },
  "collocation-builder": {
    title: "Collocation Builder",
    subtitle: "Chooses natural word combinations",
    areaPractised: "Grammar and usage",
  },
  "idiom-in-a-sentence": {
    title: "Idiom in a Sentence",
    subtitle: "Uses idioms in context",
    areaPractised: "Grammar and usage",
  },
};

function canonicalizeGameId(id: string): string {
  const key = String(id || "").trim();
  return STAGE1_ID_ALIASES[key] || key;
}

function labelFromGameId(id: string): string {
  return String(id || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fallbackMetaForGameId(id: string): Pick<ParentGameMeta, "title" | "subtitle" | "areaPractised"> {
  const canonicalId = canonicalizeGameId(id);
  const stage1Meta = STAGE1_GAME_META[canonicalId];
  if (stage1Meta) {
    return {
      title: stage1Meta.title,
      subtitle: stage1Meta.subtitle,
      areaPractised: stage1Meta.areaPractised,
    };
  }
  const known = CANONICAL_FALLBACK_META[canonicalId];
  if (known) return known;
  const title = labelFromGameId(canonicalId) || canonicalId;
  if (canonicalId.includes("reading") || canonicalId.includes("comprehension")) {
    return { title, subtitle: "Builds reading confidence", areaPractised: "Reading practice" };
  }
  if (canonicalId.includes("grammar") || canonicalId.includes("sentence") || canonicalId.includes("collocation")) {
    return { title, subtitle: "Strengthens sentence and grammar skills", areaPractised: "Grammar practice" };
  }
  if (canonicalId.includes("sound") || canonicalId.includes("letter")) {
    return { title, subtitle: "Builds core phonics skills", areaPractised: "Listening and sound identification" };
  }
  if (canonicalId.includes("word")) {
    return { title, subtitle: "Strengthens word recognition and building", areaPractised: "Word building" };
  }
  return { title, subtitle: "Practice game", areaPractised: "Practice" };
}

function collectCanonicalGameIdsFromMap(source: Record<string, any> | null | undefined): string[] {
  if (!source || typeof source !== "object") return [];
  const ids = new Set<string>();
  Object.entries(source).forEach(([docId, data]) => {
    if (docId === "__overview") return;
    const row = (data && typeof data === "object") ? (data as AnyObj) : {};
    const candidates = [docId, row.gameId, row.progressDocId];
    for (const raw of candidates) {
      const canonical = canonicalizeGameId(String(raw || "").trim());
      if (!canonical || canonical === "__overview") continue;
      ids.add(canonical);
    }
  });
  return Array.from(ids);
}

function formatDateMaybe(value: any): string | null {
  try {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
    if (typeof value === "number") return new Date(value).toLocaleString();
    if (typeof value === "string") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    return null;
  } catch {
    return null;
  }
}

function toCountMaybe(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return null;
}

function toMsMaybe(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  return null;
}

function pickFirstNumber(...values: any[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function pickFirstString(...values: any[]): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const clean = value.trim();
    if (clean) return clean;
  }
  return null;
}

function pickFirstObjectByKeys(source: Record<string, any>, keys: string[]): Record<string, any> | null {
  for (const key of keys) {
    const value = source?.[key];
    if (value && typeof value === "object") return value;
  }
  return null;
}

function hasOwnData(value: Record<string, any> | null | undefined): boolean {
  return Boolean(value && typeof value === "object" && Object.keys(value).length > 0);
}

function dedupeKeys(keys: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of keys) {
    const key = String(raw || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function withCompatibleKeys(baseKeys: string[], canonicalId: string): string[] {
  const id = String(canonicalId || "").trim();
  if (!id) return dedupeKeys(baseKeys);
  const snake = id.replace(/-/g, "_");
  const unsnaked = id.replace(/_/g, "-");
  const phonicsSnake = snake.startsWith("phonics_") ? snake : `phonics_${snake}`;
  const fromPhonics = id.startsWith("phonics_") ? id.replace(/^phonics_/, "").replace(/_/g, "-") : "";
  return dedupeKeys([...baseKeys, id, snake, unsnaked, phonicsSnake, fromPhonics]);
}

function resolveDocLevelsCompleted(doc: AnyObj): number | null {
  if (!doc || typeof doc !== "object") return null;
  return pickFirstNumber(
    toCountMaybe(doc.levelsCompleted),
    toCountMaybe(doc.completedLevelCount),
    toCountMaybe(doc.completedLevels),
    toCountMaybe(doc.completedItems),
    toCountMaybe(doc.masteredCount)
  );
}

function resolveDocTotalLevels(doc: AnyObj): number | null {
  if (!doc || typeof doc !== "object") return null;
  return pickFirstNumber(
    toCountMaybe(doc.totalLevels),
    toCountMaybe(doc.levelCount),
    toCountMaybe(doc.totalItems),
    toCountMaybe(doc.totalCount)
  );
}

function resolveDocTimeSpentMs(doc: AnyObj): number | null {
  if (!doc || typeof doc !== "object") return null;
  const ms =
    pickFirstNumber(
      toMsMaybe(doc.totalTimeSpentMs),
      toMsMaybe(doc.timeSpentMs),
      toMsMaybe(doc.totalTimeMs),
      toMsMaybe(doc.durationMs)
    ) ??
    null;
  if (ms !== null) return ms;
  const seconds = pickFirstNumber(toMsMaybe(doc.timeSpentSec), toMsMaybe(doc.durationSec));
  return seconds !== null ? seconds * 1000 : null;
}

function normalizeProgressStatus(value: any): GameSnapshot["progressStatus"] | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "not_started") return "not_started";
  if (v === "getting_started") return "getting_started";
  if (v === "in_progress") return "in_progress";
  if (v === "progressing") return "progressing";
  if (v === "completed") return "completed";
  return null;
}

function deriveProgressStatus(started: boolean, levelsCompleted: number, totalLevels: number): GameSnapshot["progressStatus"] {
  if (!started && levelsCompleted <= 0) return "not_started";
  if (totalLevels > 0 && levelsCompleted >= totalLevels) return "completed";
  if (levelsCompleted <= 0) return "getting_started";
  if (totalLevels > 0 && levelsCompleted / totalLevels >= 0.5) return "progressing";
  return "in_progress";
}

function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

function formatDuration(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60000);
  if (totalMin <= 0) return "0m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getStatusBadge(status: GameSnapshot["progressStatus"]) {
  switch (status) {
    case "completed":
      return { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
    case "progressing":
      return { label: "Progressing", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" };
    case "in_progress":
      return { label: "In progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
    case "getting_started":
      return { label: "Getting started", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
    default:
      return { label: "Not started", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" };
  }
}

function resolveGameSnapshot({
  summaryDoc,
  rootSummaryDoc,
  rootProgressDoc,
  liveProgressDoc,
  fallbackTotalLevels,
  fallbackArea,
}: {
  summaryDoc: AnyObj;
  rootSummaryDoc: AnyObj;
  rootProgressDoc: AnyObj;
  liveProgressDoc: AnyObj;
  fallbackTotalLevels: number;
  fallbackArea: string;
}): GameSnapshot {
  const totalLevels =
    resolveDocTotalLevels(summaryDoc) ??
    resolveDocTotalLevels(rootSummaryDoc) ??
    resolveDocTotalLevels(rootProgressDoc) ??
    resolveDocTotalLevels(liveProgressDoc) ??
    fallbackTotalLevels;

  const levelsCompleted =
    resolveDocLevelsCompleted(summaryDoc) ??
    resolveDocLevelsCompleted(rootSummaryDoc) ??
    resolveDocLevelsCompleted(rootProgressDoc) ??
    resolveDocLevelsCompleted(liveProgressDoc) ??
    0;

  const status =
    normalizeProgressStatus(summaryDoc?.progressStatus) ??
    normalizeProgressStatus(rootSummaryDoc?.progressStatus) ??
    normalizeProgressStatus(rootProgressDoc?.progressStatus) ??
    normalizeProgressStatus(liveProgressDoc?.progressStatus) ??
    null;

  const lastPlayedAt =
    formatDateMaybe(summaryDoc?.lastPlayedAt) ||
    formatDateMaybe(rootSummaryDoc?.lastPlayedAt) ||
    formatDateMaybe(rootProgressDoc?.lastPlayedAt) ||
    formatDateMaybe(liveProgressDoc?.lastPlayedAt) ||
    null;

  const totalTimeSpentMs =
    resolveDocTimeSpentMs(summaryDoc) ??
    resolveDocTimeSpentMs(rootSummaryDoc) ??
    resolveDocTimeSpentMs(rootProgressDoc) ??
    resolveDocTimeSpentMs(liveProgressDoc) ??
    0;

  const areaPractised =
    pickFirstString(
      summaryDoc?.areaPractised,
      summaryDoc?.expertiseArea,
      rootSummaryDoc?.areaPractised,
      rootSummaryDoc?.expertiseArea,
      rootProgressDoc?.areaPractised,
      rootProgressDoc?.expertiseArea,
      liveProgressDoc?.areaPractised,
      liveProgressDoc?.expertiseArea
    ) || fallbackArea;

  const started =
    Boolean(summaryDoc?.started) ||
    Boolean(rootSummaryDoc?.started) ||
    Boolean(rootProgressDoc?.started) ||
    Boolean(liveProgressDoc?.started) ||
    levelsCompleted > 0 ||
    !!lastPlayedAt;

  const progressStatus = status || deriveProgressStatus(started, levelsCompleted, totalLevels);

  return {
    totalLevels: Math.max(0, Math.floor(totalLevels)),
    levelsCompleted: Math.max(0, Math.floor(levelsCompleted)),
    progressStatus,
    totalTimeSpentMs: Math.max(0, Math.floor(totalTimeSpentMs)),
    lastPlayedAt,
    areaPractised,
  };
}

function themeForGame(gameId: string) {
  switch (gameId) {
    case "letter-tracing":
    case "letter-tracing-sounds":
      return { emoji: "✍️", from: "from-indigo-600", to: "to-sky-600", border: "border-indigo-100 dark:border-indigo-900/30" };
    case "letter-sound-match":
      return { emoji: "🔊", from: "from-pink-600", to: "to-orange-500", border: "border-pink-100 dark:border-pink-900/30" };
    case "balloon-pop":
      return { emoji: "🎈", from: "from-orange-600", to: "to-amber-500", border: "border-orange-100 dark:border-orange-900/30" };
    case "sound-detective":
      return { emoji: "🎧", from: "from-emerald-600", to: "to-lime-600", border: "border-emerald-100 dark:border-emerald-900/30" };
    default:
      return { emoji: "🎮", from: "from-purple-600", to: "to-pink-600", border: "border-gray-200 dark:border-gray-800" };
  }
}

export function ParentGamesProgress({
  kidSummaryData,
  gamesCatalog,
  gameProgressDocs,
  gameSummaries,
  onPracticeClick,
  onRefreshClick,
  isRefreshing = false,
  refreshMessage = null,
  refreshTone = "neutral",
}: ParentGamesProgressProps) {
  const summary = kidSummaryData?.summary ?? EMPTY_RECORD;
  const progress = kidSummaryData?.progress ?? EMPTY_RECORD;
  const byGame = progress?.byGame ?? EMPTY_RECORD;
  const summaryGames = summary?.games ?? EMPTY_RECORD;
  const summaries = gameSummaries ?? EMPTY_RECORD;
  const liveProgressByGame = gameProgressDocs ?? EMPTY_RECORD;

  const lastUpdated = formatDateMaybe(summary?.lastUpdatedAt) || formatDateMaybe(summary?.updatedAt) || null;
  const refreshMessageClass =
    refreshTone === "success"
      ? "text-green-600 dark:text-green-300"
      : refreshTone === "error"
        ? "text-rose-600 dark:text-rose-300"
        : refreshTone === "info"
          ? "text-indigo-600 dark:text-indigo-300"
          : "text-gray-500 dark:text-gray-400";

  const games = useMemo(() => {
    const input = Array.isArray(gamesCatalog) ? [...gamesCatalog] : [];
    const deduped = new Map<string, GameCatalogItem>();

    for (const game of input) {
      if (!game?.id) continue;
      const canonicalId = canonicalizeGameId(game.id);
      const meta = STAGE1_GAME_META[canonicalId];
      const knownFallbackMeta = CANONICAL_FALLBACK_META[canonicalId];
      if (deduped.has(canonicalId)) continue;
      deduped.set(canonicalId, {
        ...game,
        id: canonicalId,
        title: meta?.title || knownFallbackMeta?.title || game.title,
        subtitle: meta?.subtitle || knownFallbackMeta?.subtitle || game.subtitle,
        area: game.area || knownFallbackMeta?.areaPractised,
        totalLevels: typeof meta?.totalLevels === "number" ? meta.totalLevels : game.totalLevels,
      });
    }

    const list = Array.from(deduped.values());
    const existing = new Set(list.map((g) => g.id));
    for (const gameId of STAGE1_REQUIRED_GAME_IDS) {
      if (existing.has(gameId)) continue;
      const meta = STAGE1_GAME_META[gameId];
      if (!meta) continue;
      list.push({
        id: meta.id,
        title: meta.title,
        subtitle: meta.subtitle,
        area: "phonics",
        totalLevels: meta.totalLevels,
      });
      existing.add(meta.id);
    }

    const canonicalActivityIds = new Set<string>([
      ...collectCanonicalGameIdsFromMap(summaries),
      ...collectCanonicalGameIdsFromMap(liveProgressByGame),
      ...collectCanonicalGameIdsFromMap(summaryGames),
      ...collectCanonicalGameIdsFromMap(byGame),
    ]);
    const extras: GameCatalogItem[] = [];
    canonicalActivityIds.forEach((gameId) => {
      if (existing.has(gameId)) return;
      const meta = fallbackMetaForGameId(gameId);
      extras.push({
        id: gameId,
        title: meta.title,
        subtitle: meta.subtitle,
        area: meta.areaPractised,
      });
    });
    extras.sort((a, b) => a.title.localeCompare(b.title));

    return [...list, ...extras];
  }, [gamesCatalog, summaries, liveProgressByGame, summaryGames, byGame]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Progress updates <span className="font-semibold">3 times/day</span> (scheduled).
          <span className="ml-2">• Recent play can take a little time to appear.</span>
          {lastUpdated ? <span className="ml-2">• Last updated: {lastUpdated}</span> : null}
          {refreshMessage ? <span className={`ml-2 ${refreshMessageClass}`}>• {refreshMessage}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Tap <span className="font-semibold">Play</span> to open the kid-friendly games.
          </div>
          {onRefreshClick ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshClick}
              disabled={isRefreshing}
              className="rounded-full h-8 px-3"
            >
              {isRefreshing ? "Checking..." : "Refresh"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {games.map((game) => {
          const gameId = canonicalizeGameId(game.id || "unknown");
          const stage1Meta = STAGE1_GAME_META[gameId];
          const knownFallbackMeta = CANONICAL_FALLBACK_META[gameId];
          const friendlyMeta = fallbackMetaForGameId(gameId);
          const theme = themeForGame(gameId);
          const progressKeys = withCompatibleKeys(stage1Meta?.progressKeys || [gameId], gameId);
          const summaryKeys = withCompatibleKeys(stage1Meta?.summaryKeys || progressKeys, gameId);

          const summaryDoc = pickFirstObjectByKeys(summaries, summaryKeys) || {};
          const liveProgressDoc = pickFirstObjectByKeys(liveProgressByGame, progressKeys) || {};
          const rootSummaryDoc = pickFirstObjectByKeys(summaryGames, progressKeys) || {};
          const rootProgressDoc = pickFirstObjectByKeys(byGame, progressKeys) || {};
          const useLegacyRootFallback = !hasOwnData(summaryDoc) && !hasOwnData(liveProgressDoc);

          const snapshot = resolveGameSnapshot({
            summaryDoc,
            rootSummaryDoc: useLegacyRootFallback ? rootSummaryDoc : {},
            rootProgressDoc: useLegacyRootFallback ? rootProgressDoc : {},
            liveProgressDoc,
            fallbackTotalLevels: Number(stage1Meta?.totalLevels ?? game.totalLevels ?? 0),
            fallbackArea:
              game.area ||
              stage1Meta?.areaPractised ||
              knownFallbackMeta?.areaPractised ||
              friendlyMeta.areaPractised ||
              "Practice",
          });

          const total = Math.max(snapshot.totalLevels, 0);
          const completed = Math.min(snapshot.levelsCompleted, total > 0 ? total : snapshot.levelsCompleted);
          const pct = total > 0 ? (completed / total) * 100 : 0;
          const badge = getStatusBadge(snapshot.progressStatus);

          return (
            <Card
              key={gameId}
              className={`rounded-2xl border ${theme.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-sm`}>
                      <span className="text-xl">{theme.emoji}</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                        {stage1Meta?.title || knownFallbackMeta?.title || game.title || friendlyMeta.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {stage1Meta?.subtitle || knownFallbackMeta?.subtitle || game.subtitle || friendlyMeta.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Levels completed</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {total > 0 ? `${completed}/${total}` : completed}
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${theme.from} ${theme.to}`}
                      style={{ width: `${clampPct(pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                    <span>Area practised</span>
                    <span className="font-semibold">{snapshot.areaPractised}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                    <span>Total time spent</span>
                    <span className="font-semibold">{formatDuration(snapshot.totalTimeSpentMs)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Last played</span>
                    <span className="font-medium">{snapshot.lastPlayedAt || "—"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
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
