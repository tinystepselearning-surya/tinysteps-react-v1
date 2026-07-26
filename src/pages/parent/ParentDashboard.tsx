// src/pages/parent/ParentDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import { useAuthStore } from "../../store/useAuthStore";
import { db, logCustomEvent } from "../../lib/firebaseConfig";
import { performAppLogout } from "../../lib/auth";
import callFunction from "../../lib/callFunctions";

import { ParentGamesProgress } from "./components/progress/ParentGamesProgress";
import { ParentOverviewCards } from "./components/overview/ParentOverviewCards";
import ParentAttendanceSummary from "./components/ParentAttendanceSummary";
import ParentBillingSummary from "./components/ParentBillingSummary";
import ParentClassesView from "./components/classes/ParentClassesView";
import ParentDashboardHero from "./components/ParentDashboardHero";
import ParentDashboardKpis from "./components/ParentDashboardKpis";
import ParentInsightsView from "./components/insights/ParentInsightsView";
import ParentLearningInsights from "./components/ParentLearningInsights";
import ParentLessonTracker from "./components/ParentLessonTracker";
import ParentMobileHeader from "./components/ParentMobileHeader";
import ParentPaymentOptionsDialog from "./components/payments/ParentPaymentOptionsDialog";
import ParentPaymentsView from "./components/payments/ParentPaymentsView";
import ParentProfilePaymentsPanel from "./components/payments/ParentProfilePaymentsPanel";
import ParentSkillsView from "./components/skills/ParentSkillsView";
import {
  buildParentSkillRatingDisplay,
  dedupeParentSkillLabels,
  formatParentSkillTag,
  parentSkillUpdateId,
  type ParentSkillsLesson,
} from "./components/skills/parentSkillsPresentation";
import ParentProgressOverview from "./components/ParentProgressOverview";
import ParentRecommendations from "./components/ParentRecommendations";
import ParentShellLoading from "./components/ParentShellLoading";
import { stripParentStagePrefix } from "./parentVisualTokens";
import {
  ArrowRight,
  CalendarDays,
  CircleUser,
  CreditCard,
  ExternalLink,
  Gamepad2,
  Home,
  LogOut,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
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
import MobileTabBar from "../../components/common/MobileTabBar";
import HolidayCalendar2026 from "../../components/common/HolidayCalendar2026";
import MessagesPanel from "../messages/MessagesPanel";
import useMessageThreads from "../../hooks/useMessageThreads";
 
import { masteryKeyFromValue, masteryLabel, masteryPctFromKey, type MasteryKey } from "../../lib/mastery";
import {
  SKILL_RATING_MAX,
  hasExplicitProgressRatings,
  normalizeProgressRatings,
  normalizeProgressSkillsMeta,
  skillRatingLegendLabel,
  summarizeProgressRatings,
} from "../../lib/skillRatings";
import { getProgressSkillsForLesson } from "../../lib/progressSkills";
import {
  getSafeWorksheetUrl,
  toParentWorksheetItem,
  worksheetMatchesContext,
  type ParentWorksheetItem,
} from "../../lib/parentWorksheets";
import { hapticLight, hapticSelection } from "../../lib/nativeHaptics";
import {
  getTinyStepsNativePlatform,
  isEditableElement,
  NATIVE_ANDROID_BACK_EVENT,
} from "../../lib/nativePlatform";
import { openExternalHttpsUrl } from "../../lib/openExternalUrl";
import {
  formatIndiaTimeRange,
  formatSessionDate as formatSessionViewerDate,
  formatSessionTimeRange as formatViewerSessionTimeRange,
  getSessionStartDate,
  isSessionTimeFallback,
} from "../../lib/sessionTime";
import { getJoinLinkCandidate, resolveSessionJoinLink } from "../../lib/sessionJoinLink";
import { isSessionCanonicalForEnrollment } from "../../lib/sessionScheduleIntegrity";
import {
  buildDashboardHeroMessage,
  buildDashboardRecommendedNext,
  formatCurrencyINR,
  formatSkillChipLabel,
  labelFromGameId,
  pickDashboardPracticeChips,
  pickDashboardStrengthChips,
} from "./parentDashboardViewModel";
import {
  isNativeParentChatFocus,
  PARENT_MOBILE_TABS,
  shouldShowParentMessagesHeading,
  type ParentTabKey,
} from "./parentNavigation";
import {
  getParentClassStatusDotTone as statusDotClass,
  getParentClassStatusLabel as statusLabel,
  getParentClassStatusTone as statusBadgeClass,
  selectNextParentClass,
  shouldShowClassJoinAction,
  type ParentClassesFilterId,
  type ParentClassesResourceId,
  type ParentClassesViewId,
  type ParentClassSessionDisplay,
} from "./components/classes/parentClassPresentation";
import {
  getParentInsightStageKey,
  resolveParentInsightStageState,
  type ParentInsightStageDisplay,
  type ParentInsightTeacherDisplay,
} from "./components/insights/parentInsightsPresentation";
import {
  filterParentClassCharges,
  getParentWalletDisplayState,
  resolveVerifiedParentRate,
  type ParentClassChargeDisplay,
  type ParentClassChargeFilter,
  type ParentPaymentDisplay,
  type ParentPaymentPeriodSummary,
} from "./components/payments/parentPaymentsPresentation";

type TabKey = ParentTabKey;

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
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "holidays", label: "Holiday Calendar", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const shouldDebugParentDashboard = () =>
  typeof window !== "undefined"
  && window.localStorage?.getItem("tsDebugParentSessions") === "1";

const debugParentDashboard = (...args: unknown[]) => {
  if (shouldDebugParentDashboard()) {
    console.debug(...args);
  }
};

const parentLegacyFallbackTelemetrySeen = new Set<string>();

function emitParentLegacyFallbackTelemetry(
  fallbackType: string,
  context: { kidId?: string | null; count?: number; canonicalHit?: boolean }
) {
  if (typeof window === "undefined") return;
  const kidId = String(context.kidId || "").trim();
  const count = Number.isFinite(Number(context.count)) ? Number(context.count) : 0;
  const key = `${fallbackType}:${kidId || "unknown"}:${count}:${context.canonicalHit ? 1 : 0}`;
  if (parentLegacyFallbackTelemetrySeen.has(key)) return;
  parentLegacyFallbackTelemetrySeen.add(key);
  logCustomEvent("parent_legacy_fallback_used", {
    fallback_type: fallbackType,
    kid_id: kidId || "unknown",
    hit_count: count,
    canonical_hit: context.canonicalHit ? 1 : 0,
  });
  void callFunction(
    'recordLegacyFallbackUsage',
    {
      fallbackType,
      reader: 'parent_dashboard',
      kidId: kidId || null,
      hitCount: Math.max(1, count),
      inputCount: 1,
    },
  ).catch(() => undefined);
}

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = [
    "dashboard",
    "insights",
    "games-progress",
    "skills",
    "classes",
    "messages",
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

type JoinClassResolutionSource =
  | "enrollment"
  | "child_dashboard"
  | "upcoming_session"
  | "session_resolver"
  | "unavailable";

type JoinClassResolution = {
  url: string;
  source: JoinClassResolutionSource;
  reason?: string;
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
  reference?: string;
  note?: string;
  [key: string]: any;
};

type ParentWalletSummary = {
  currentBalance?: number;
  lastUpdatedAt?: any;
  [key: string]: any;
};

type ParentWalletTransaction = {
  id: string;
  type?: string;
  direction?: string;
  amount?: number;
  signedAmount?: number;
  balanceAfter?: number;
  note?: string;
  reason?: string;
  description?: string;
  method?: string;
  reference?: string;
  status?: string;
  createdAt?: any;
  paidAt?: any;
  [key: string]: any;
};

type ParentMonthlyBillingReadModel = {
  parentId?: string;
  monthKey?: string;
  schemaVersion?: number;
  modelType?: string;
  refreshedAt?: any;
  updatedAt?: any;
  generatedAtMs?: number;
  billedAmount?: number;
  billedClassCount?: number;
  settledAmount?: number;
  appliedAmount?: number;
  outstandingAmount?: number;
  dueAmount?: number;
  status?: string;
  lastSettlementAtMs?: number | null;
  lastPaymentAtMs?: number | null;
  lastPaymentId?: string | null;
  allocationRefs?: string[];
  chargeIds?: string[];
  totals?: {
    chargesCount?: number;
    billedAmount?: number;
    billedClassCount?: number;
    settledAmount?: number;
    appliedAmount?: number;
    paidAmountFromCharges?: number;
    outstandingAmount?: number;
    dueAmount?: number;
    paymentsCount?: number;
    paymentsTotal?: number;
    paymentsApplied?: number;
    paymentsUnapplied?: number;
    status?: string;
    lastSettlementAtMs?: number | null;
    lastPaymentAtMs?: number | null;
    lastPaymentId?: string | null;
  };
  byKid?: Record<
    string,
    {
      kidId?: string;
      chargesCount?: number;
      billedAmount?: number;
      billedClassCount?: number;
      settledAmount?: number;
      appliedAmount?: number;
      paidAmountFromCharges?: number;
      outstandingAmount?: number;
      dueAmount?: number;
      paymentsCount?: number;
      paymentsTotal?: number;
      paymentsApplied?: number;
      paymentsUnapplied?: number;
      status?: string;
      lastSettlementAtMs?: number | null;
      lastPaymentAtMs?: number | null;
    }
  >;
  attendance?: {
    schemaVersion?: number;
    modelType?: string;
    refreshedAt?: any;
    totals?: Record<string, number | undefined>;
    byKid?: Record<string, Record<string, number | string | undefined>>;
  };
  progress?: {
    schemaVersion?: number;
    modelType?: string;
    refreshedAt?: any;
    generatedAtMs?: number;
    byKid?: Record<
      string,
      {
        kidId?: string;
        totals?: {
          totalTopics?: number;
          completedTopics?: number;
          inProgressTopics?: number;
          overallPct?: number;
        };
        byCourse?: Record<
          string,
          {
            courseId?: string;
            totalTopics?: number;
            completedTopics?: number;
            inProgressTopics?: number;
            overallPct?: number;
            lastUpdatedAtMs?: number | null;
          }
        >;
        lastUpdatedAtMs?: number | null;
      }
    >;
  };
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

type ParentWorksheetGroup = {
  key: string;
  label: string;
  items: ParentWorksheetItem[];
};

const HERO_JOIN_DISABLED_REASON = "Class link will appear once assigned.";

const resolveSessionJoinClassUrl = (
  session: KidSession,
  enrollmentsById: Map<string, Record<string, unknown>>,
): string => resolveSessionJoinLink(session, enrollmentsById);

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

const stripStagePrefix = stripParentStagePrefix;

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

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
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

function formatCurrencySignedINR(value?: number | null): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "₹0";
  const abs = `₹${Math.abs(amount).toLocaleString("en-IN")}`;
  if (amount < 0) return `-${abs}`;
  if (amount > 0) return `+${abs}`;
  return abs;
}

function sessionStartDate(s: KidSession): Date | null {
  return getSessionStartDate(s);
}

function formatSessionTimeRange(s: KidSession): string {
  return formatViewerSessionTimeRange(s);
}

function formatSessionDateLabel(s: KidSession): string {
  return formatSessionViewerDate(s);
}

function formatSessionIndiaLabel(s: KidSession): string {
  const label = formatIndiaTimeRange(s);
  if (!label) return "";
  return `India time: ${label}${isSessionTimeFallback(s) ? " · based on legacy schedule fields" : ""}`;
}

function normalizeStatus(raw?: string): string {
  const s = (raw || "").toLowerCase().trim();
  if (s === "scheduled" || s === "in_progress" || s === "completed" || s === "cancelled" || s === "canceled" || s === "no_show" || s === "noshow" || s === "reschedule_requested" || s === "rescheduled" || s === "paused") {
    if (s === "canceled") return "cancelled";
    if (s === "noshow") return "no_show";
    if (s === "rescheduled") return "reschedule_requested";
    return s;
  }
  return s ? s : "scheduled";
}

const IOS_BILLING_ASSISTANCE_TEXT =
  "Billing information is managed by Tiny Steps Learning. Please contact Tiny Steps support for billing assistance.";

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedKidId = searchParams.get("kidId")?.trim() || "";
  const nativePlatform = useMemo(() => getTinyStepsNativePlatform(), []);
  const isNativeParentApp = nativePlatform !== null;
  const isNativeIOSApp = nativePlatform === "ios";
  const isNativeAndroidApp = nativePlatform === "android";

  const activeTab = safeTab(searchParams.get("tab"));
  const shouldLoadCurriculumData =
    activeTab === "dashboard" || activeTab === "insights" || activeTab === "skills";
  const shouldLoadEnrollmentData =
    activeTab === "dashboard" ||
    activeTab === "insights" ||
    activeTab === "skills" ||
    activeTab === "classes" ||
    activeTab === "payments" ||
    activeTab === "profile";
  const shouldLoadGamesData = activeTab === "games-progress" || activeTab === "dashboard";
  const shouldLoadBillingData =
    activeTab === "dashboard" || activeTab === "payments" || activeTab === "profile";
  const shouldLoadPaymentHistory = activeTab === "payments" || activeTab === "profile";
  const shouldLoadClassSessions =
    activeTab === "classes" || activeTab === "payments" || activeTab === "dashboard";
  const shouldLoadFullClassHistory = activeTab === "classes";
  const { threads: messageThreads } = useMessageThreads({
    userId: user?.uid,
    isAdmin: false,
  });
  const messageUnreadCount = useMemo(() => {
    if (!user?.uid) return 0;
    return messageThreads.reduce((sum, thread) => {
      const next = Number(thread.unreadCounts?.[user.uid] || 0);
      return sum + (Number.isFinite(next) && next > 0 ? next : 0);
    }, 0);
  }, [messageThreads, user?.uid]);
  const parentMobileTabs = useMemo(
    () =>
      PARENT_MOBILE_TABS.map((item) =>
        item.id === "messages" ? { ...item, badgeCount: messageUnreadCount } : item
      ),
    [messageUnreadCount]
  );

  const setTab = useCallback((tab: TabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  }, [setSearchParams]);

  const openMobileMenu = () => {
    hapticLight();
    setMobileMenuOpen(true);
  };

  const handleMobileMenuOpenChange = (open: boolean) => {
    if (!open) hapticLight();
    setMobileMenuOpen(open);
  };

  const handleLogout = async () => {
    hapticLight();
    try {
      await performAppLogout('user-clicked-logout');
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
  const [skillsCourseId, setSkillsCourseId] = useState<string>("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messagesActiveThreadId, setMessagesActiveThreadId] = useState<string | null>(null);
  const [gamesRefreshStatus, setGamesRefreshStatus] = useState<{
    tone: "neutral" | "success" | "info" | "error";
    message: string | null;
  }>({ tone: "neutral", message: null });
  const [isRefreshingGames, setIsRefreshingGames] = useState(false);
  const [lastGamesSeenSignalMs, setLastGamesSeenSignalMs] = useState(0);
  const [lastGamesHeadSeenMs, setLastGamesHeadSeenMs] = useState(0);

  useEffect(() => {
    if (activeTab !== "messages") {
      setMessagesActiveThreadId(null);
    }
  }, [activeTab]);

  const isNativeMessagesThreadFocus = isNativeParentChatFocus(
    isNativeParentApp,
    activeTab,
    messagesActiveThreadId,
  );

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

  const legacyStudentIdCandidates = useMemo(() => {
    const set = new Set<string>();
    const add = (value: unknown) => {
      const normalized = String(value || "").trim();
      if (normalized) set.add(normalized);
    };
    add(selectedKidId);
    const kid = selectedKid as any;
    add(kid?.studentId);
    add(kid?.studentUid);
    add(kid?.linkedStudentId);
    add(kid?.studentRefId);
    return Array.from(set);
  }, [selectedKid, selectedKidId]);

  // ---- Kid summary doc (kids/{kidId}) ----
  const kidSummaryQuery = useQuery({
    queryKey: ["kidSummary", selectedKidId],
    enabled: !!selectedKidId && shouldLoadGamesData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    queryKey: [
      "kidEnrollments",
      user?.uid,
      selectedKidId,
      legacyStudentIdCandidates.join("|"),
    ],
    enabled: !!user?.uid && !!selectedKidId && shouldLoadEnrollmentData,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<Enrollment[]> => {
      if (!user?.uid || !selectedKidId) return [];
      const enrollmentsCol = collection(db, "enrollments");
      const results = new Map<string, Enrollment>();
      let canonicalHitCount = 0;

      const [kidIdSnap, kidIdsSnap] = await Promise.all([
        getDocs(
          query(
            enrollmentsCol,
            where("parentId", "==", user.uid),
            where("kidId", "==", selectedKidId)
          )
        ),
        getDocs(
          query(
            enrollmentsCol,
            where("parentId", "==", user.uid),
            where("kidIds", "array-contains", selectedKidId)
          )
        ),
      ]);

      [kidIdSnap, kidIdsSnap].forEach((snap) => {
        canonicalHitCount += snap.size;
        snap.docs.forEach((d) => {
          results.set(d.id, { id: d.id, ...(d.data() as any) });
        });
      });

      // Legacy fallback (studentId) is only used when canonical kidId/kidIds lookups return no rows.
      if (results.size === 0 && legacyStudentIdCandidates.length > 0) {
        let fallbackHitCount = 0;
        const studentIdChunks = chunkIds(legacyStudentIdCandidates, 10);
        for (const chunk of studentIdChunks) {
          if (!chunk.length) continue;
          const legacySnap = await getDocs(
            query(
              enrollmentsCol,
              where("parentId", "==", user.uid),
              where("studentId", "in", chunk)
            )
          );
          fallbackHitCount += legacySnap.size;
          legacySnap.docs.forEach((d) => {
            results.set(d.id, { id: d.id, ...(d.data() as any) });
          });
        }
        if (fallbackHitCount > 0) {
          emitParentLegacyFallbackTelemetry("enrollments_studentId", {
            kidId: selectedKidId,
            count: fallbackHitCount,
            canonicalHit: canonicalHitCount > 0,
          });
        }
      }

      return Array.from(results.values());
    },
  });

  // ---- Phonics progress (per-course) ----
  const phonicsProgressQuery = useQuery({
    queryKey: ["phonicsProgress", studentIdForProgress],
    enabled: !!studentIdForProgress && shouldLoadCurriculumData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    enabled: shouldLoadCurriculumData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  const formatCourseLabel = useCallback((courseId: string, fallback?: string) => {
    const trimmed = String(fallback || "").trim();
    if (trimmed && trimmed !== courseId) return trimmed;
    const fromLookup = coursesLookupQuery.data?.[courseId];
    if (fromLookup) return fromLookup;
    return titleCaseFromId(courseId);
  }, [coursesLookupQuery.data]);

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
  }, [enrollmentsQuery.data, formatCourseLabel]);

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
    enabled: !!selectedKidId && shouldLoadGamesData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    enabled: !!selectedKidId && shouldLoadGamesData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDoc(doc(db, "kids", selectedKidId, "activity", "head"));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  // ---- Games catalog ----
  const gamesCatalogQuery = useQuery({
    queryKey: ["gamesCatalog"],
    enabled: shouldLoadGamesData,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  // ---- Billing charges (Fees & Dues) ----
  const billingChargesQuery = useQuery({
    queryKey: ["billingCharges", user?.uid, "currentMonth"],
    enabled: !!user?.uid && shouldLoadBillingData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<BillingCharge[]> => {
      if (!user?.uid) return [];
      const monthKey = toMonthKey(new Date());
      const billingChargesCol = collection(db, "billingCharges");
      const canonicalSnap = await getDocs(
        query(
          billingChargesCol,
          where("parentId", "==", user.uid),
          where("monthKey", "==", monthKey),
        ),
      );
      if (canonicalSnap.size > 0) {
        return canonicalSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((row) => (row as any)?.archived !== true);
      }

      const legacySnap = await getDocs(
        query(
          billingChargesCol,
          where("parentId", "==", user.uid),
        ),
      );
      return legacySnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((row) => {
          if ((row as any)?.archived === true) return false;
          const date = toDateOrNull((row as any)?.createdAt);
          if (!date) return false;
          return toMonthKey(date) === monthKey;
        });
    },
  });

  // ---- Parent payments (recorded by admin) ----
  const parentPaymentsQuery = useQuery({
    queryKey: ["parentPayments", user?.uid],
    enabled: !!user?.uid && shouldLoadPaymentHistory,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<ParentPaymentRecord[]> => {
      if (!user?.uid) return [];
      const q = query(collection(db, "payments"), where("parentId", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((row) => (row as any)?.archived !== true);
    },
  });

  const parentWalletSummaryQuery = useQuery({
    queryKey: ["parentWalletSummary", user?.uid],
    enabled: !!user?.uid && shouldLoadBillingData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<ParentWalletSummary | null> => {
      if (!user?.uid) return null;
      const snap = await getDoc(doc(db, "parentWallets", user.uid));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as ParentWalletSummary) : null;
    },
  });

  const parentWalletTransactionsQuery = useQuery({
    queryKey: ["parentWalletTransactions", user?.uid],
    enabled: !!user?.uid && shouldLoadPaymentHistory,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<ParentWalletTransaction[]> => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, "parentWallets", user.uid, "transactions"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
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
  const [classesView, setClassesView] = useState<ParentClassesViewId>("today");
  const selectClassesView = (view: ParentClassesViewId) => {
    hapticSelection();
    setClassesView(view);
  };
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [classesCalendarMonth, setClassesCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [classesCalendarSelectedDayKey, setClassesCalendarSelectedDayKey] = useState<string | null>(null);

  // Fetch sessions for this kid (manual refresh model: loads when tab opens)
  const kidSessionsQuery = useQuery({
    queryKey: ["kidSessions", selectedKidId, shouldLoadFullClassHistory ? "full" : "recent"],
    enabled: !!selectedKidId && shouldLoadClassSessions,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<KidSession[]> => {
      if (!selectedKidId || !user?.uid) return [];
      debugParentDashboard("🔍 [ParentDashboard] Fetching sessions for:", {
        selectedKidId,
        parentUid: user.uid,
        parentEmail: user.email,
      });

      const classSessionsCol = collection(db, "classSessions");
      const recentRangeStart = new Date();
      recentRangeStart.setMonth(recentRangeStart.getMonth() - 6);
      const recentRangeEnd = new Date();
      recentRangeEnd.setMonth(recentRangeEnd.getMonth() + 3);
      const recentStartKey = toYMD(recentRangeStart);
      const recentEndKey = toYMD(recentRangeEnd);

      const logQueryError = (queryName: string, error: any) => {
        console.warn(`⚠️ [ParentDashboard] ${queryName} query failed`, {
          code: error?.code,
          message: error?.message,
        });
        debugParentDashboard(`❌ [${queryName}] query failed`, {
          code: error?.code,
          message: error?.message,
          details: error,
        });
      };

      const readQueryDocs = async (
        queryName: string,
        buildQuery: () => ReturnType<typeof query>,
      ) => {
        try {
          return await getDocs(buildQuery());
        } catch (error: any) {
          logQueryError(queryName, error);
          return null;
        }
      };

      const qA = shouldLoadFullClassHistory
        ? query(
            classSessionsCol,
            where("kidIds", "array-contains", selectedKidId),
            where("parentId", "==", user.uid),
          )
        : query(
            classSessionsCol,
            where("kidIds", "array-contains", selectedKidId),
            where("parentId", "==", user.uid),
            where("date", ">=", recentStartKey),
            where("date", "<=", recentEndKey),
          );
      const snapA = await readQueryDocs(
        "Query A",
        () => qA,
      );

      debugParentDashboard("✅ [Query A] classSessions kidIds array-contains + parentId:", {
        count: snapA?.size ?? 0,
        docs: (snapA?.docs ?? []).map((d) => {
          const data = d.data() as any;
          return { id: d.id, parentId: data?.parentId, kidIds: data?.kidIds };
        })
      });

      const qB = shouldLoadFullClassHistory
        ? query(
            classSessionsCol,
            where("kidId", "==", selectedKidId),
            where("parentId", "==", user.uid),
          )
        : query(
            classSessionsCol,
            where("kidId", "==", selectedKidId),
            where("parentId", "==", user.uid),
            where("date", ">=", recentStartKey),
            where("date", "<=", recentEndKey),
          );
      const snapB = await readQueryDocs(
        "Query B",
        () => qB,
      );
      debugParentDashboard("✅ [Query B] classSessions kidId equality + parentId:", {
        count: snapB?.size ?? 0,
        docs: (snapB?.docs ?? []).map((d) => {
          const data = d.data() as any;
          return { id: d.id, parentId: data?.parentId, kidId: data?.kidId };
        })
      });
      if ((snapB?.size ?? 0) > 0) {
        emitParentLegacyFallbackTelemetry("classSessions_kidId", {
          kidId: selectedKidId,
          count: snapB?.size ?? 0,
          canonicalHit: (snapA?.size ?? 0) > 0,
        });
      }

      const map = new Map<string, KidSession>();
      (snapA?.docs ?? []).forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));
      (snapB?.docs ?? []).forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));

      const all = Array.from(map.values());
      debugParentDashboard("📊 [Final Result] Total unique sessions:", all.length);

      // Sort by start date (best effort)
      all.sort((a, b) => {
        const da = sessionStartDate(a)?.getTime() ?? 0;
        const db = sessionStartDate(b)?.getTime() ?? 0;
        return da - db;
      });

      return all;
    },
  });

  const classRecordingsQuery = useQuery({
    queryKey: ["parentClassRecordings", user?.uid],
    enabled: !!user?.uid && activeTab === "classes",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  const worksheetEnrollmentContext = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const activeEnrollmentIds: string[] = [];
    const activeCourseIds = new Set<string>();

    enrollments.forEach((enrollment) => {
      const status = String((enrollment as any)?.status || "active").trim().toLowerCase();
      const isInactive =
        status === "inactive"
        || status === "cancelled"
        || status === "canceled"
        || status === "withdrawn"
        || status === "closed"
        || status === "completed"
        || status === "archived";
      if (isInactive) return;

      const enrollmentId = String((enrollment as any)?.id || "").trim();
      if (enrollmentId) activeEnrollmentIds.push(enrollmentId);

      const courseId = String((enrollment as any)?.courseId || "").trim();
      if (courseId) activeCourseIds.add(courseId);
    });

    return {
      activeEnrollmentIds: Array.from(new Set(activeEnrollmentIds)).sort(),
      activeCourseIds: Array.from(activeCourseIds).sort(),
    };
  }, [enrollmentsQuery.data]);

  const parentWorksheetsQuery = useQuery({
    queryKey: ["parentWorksheets", user?.uid, worksheetEnrollmentContext.activeCourseIds.join("|")],
    enabled: !!user?.uid && activeTab === "classes",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<ParentWorksheetItem[]> => {
      if (!user?.uid) return [];
      const worksheetCollection = collection(db, "parentWorksheetLibrary");
      const worksheetMap = new Map<string, ParentWorksheetItem>();

      const courseIdChunks = chunkIds(worksheetEnrollmentContext.activeCourseIds, 10);
      for (const chunk of courseIdChunks) {
        if (!chunk.length) continue;
        const byCourseSnap = await getDocs(
          query(
            worksheetCollection,
            where("targetCourseIds", "array-contains-any", chunk),
            limit(200),
          ),
        );
        byCourseSnap.docs.forEach((entry) => {
          worksheetMap.set(entry.id, toParentWorksheetItem(entry.id, entry.data()));
        });
      }

      const legacySnap = await getDocs(
        query(
          worksheetCollection,
          where("targetParentIds", "array-contains-any", [user.uid, "all_parents"]),
          limit(200),
        ),
      );
      legacySnap.docs.forEach((entry) => {
        worksheetMap.set(entry.id, toParentWorksheetItem(entry.id, entry.data()));
      });

      return Array.from(worksheetMap.values());
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
  const classesMonthKey = useMemo(() => toMonthKey(classesMonth), [classesMonth]);

  const parentMonthlyBillingReadModelQuery = useQuery({
    queryKey: ["parentMonthlyBillingReadModel", user?.uid, classesMonthKey],
    enabled: !!user?.uid && shouldLoadBillingData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<ParentMonthlyBillingReadModel | null> => {
      if (!user?.uid) return null;
      const snap = await getDoc(
        doc(db, "parentMonthlyReadModels", user.uid, "months", classesMonthKey)
      );
      return snap.exists() ? (snap.data() as ParentMonthlyBillingReadModel) : null;
    },
  });

  const activeEnrollmentById = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    ((enrollmentsQuery.data ?? []) as Enrollment[]).forEach((enrollment) => {
      const enrollmentId = String((enrollment as any)?.id || "").trim();
      if (!enrollmentId) return;
      map.set(enrollmentId, enrollment as Record<string, unknown>);
    });
    return map;
  }, [enrollmentsQuery.data]);

  const allKidSessions = useMemo(() => {
    const sessions = (kidSessionsQuery.data ?? []) as KidSession[];
    return sessions.filter((session) => {
      if (normalizeStatus(session.status) === 'paused') return false;
      const sessionLike = session as unknown as Record<string, unknown>;
      const enrollmentIdFromDoc = String((session as any)?.enrollmentId || "").trim();
      const enrollmentIdFromSessionId =
        typeof session.id === "string" && session.id.includes("_")
          ? session.id.split("_")[0].trim()
          : "";
      const enrollmentId = enrollmentIdFromDoc || enrollmentIdFromSessionId;
      if (!enrollmentId) return false;
      const enrollment = activeEnrollmentById.get(enrollmentId);
      return isSessionCanonicalForEnrollment(sessionLike, enrollment);
    });
  }, [kidSessionsQuery.data, activeEnrollmentById]);
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

  const pastPendingClassSessions = useMemo(() => {
    return [...sortedClassSessions]
      .filter((row) => {
        if (toYMD(row.start) >= todayDayKey) return false;
        return row.status === "scheduled" || row.status === "in_progress";
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [sortedClassSessions, todayDayKey]);

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

  const resolveSessionChildName = useCallback((session: KidSession) => {
    const directName = String((session as any).kidName || (session as any).childName || "").trim();
    if (directName) return directName;

    const namesMap = (session as any).kidNames;
    if (namesMap && selectedKidId && typeof namesMap === "object") {
      const mapped = String((namesMap as Record<string, string>)[selectedKidId] || "").trim();
      if (mapped) return mapped;
    }

    return String(selectedKid?.fullName || selectedKid?.name || "Child");
  }, [selectedKid, selectedKidId]);

  const openMeetingLink = (url: string) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) return;
    void openExternalHttpsUrl(trimmed);
  };

  const openWorksheetLink = (url?: string | null) => {
    const safeUrl = getSafeWorksheetUrl(url);
    if (!safeUrl) return;
    void openExternalHttpsUrl(safeUrl);
  };

  const openJoinClass = async (session: KidSession) => {
    if (joiningSessionId === session.id) return;
    hapticLight();
    setJoiningSessionId(session.id);
    try {
      const resolvedJoinUrl = resolveSessionJoinClassUrl(session, activeEnrollmentById);
      if (!resolvedJoinUrl) return;
      openMeetingLink(resolvedJoinUrl);
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
    const curriculumEnrollmentCourseIds = insightsCourseOptions
      .map((option) => normalizeCurriculumCourseId(option.courseId))
      .filter((courseId): courseId is string => Boolean(courseId));
    const primaryCourseId = displayCourseId ?? curriculumEnrollmentCourseIds[0] ?? null;
    if (!primaryCourseId) return [];

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

    const courseIds = Array.from(
      new Set([
        primaryCourseId,
        ...enrolledCourseIds,
        ...curriculumEnrollmentCourseIds,
        ...progressDocs
          .map((progressDoc) => resolveDocCourseId(progressDoc))
          .filter((courseId): courseId is string => Boolean(courseId)),
      ]),
    ).filter((courseId) => (curriculumTopicsByCourseId[courseId] ?? []).length > 0);

    return courseIds.map((courseId) => {
      const topics = curriculumTopicsByCourseId[courseId] ?? [];
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
      if (docCourseId && docCourseId !== courseId) return;
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
        if (!docCourseId || docCourseId === courseId) {
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
        courseId,
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
        courseContextVerified:
          matchedBy === "id" || resolveDocCourseId(matchedDoc) === courseId,
        ratingSource: hasExplicitProgressRatings(matchedDoc?.progressRatings)
          ? "explicit"
          : hasExplicitProgressRatings(matchedDoc?.skillRatings) ||
              Boolean(matchedDoc?.mastery) ||
              Boolean(matchedDoc?.checks)
            ? "legacy"
            : "none",
        explicitProgressRatings:
          matchedDoc?.progressRatings && typeof matchedDoc.progressRatings === "object"
            ? matchedDoc.progressRatings
            : null,
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

      return {
        courseId,
        courseLabel: phonicsLabelsByCourseId[courseId] || titleCaseFromId(courseId),
        rows,
        totalTopics,
        topicsUpdated,
        completedCount,
        overallPct,
        lastUpdatedAtMs,
        idMatchCount,
        labelMatchCount,
      };
    });
  }, [
    displayCourseId,
    enrolledCourseIds,
    insightsCourseOptions,
    curriculumTopicsByCourseId,
    phonicsProgressQuery.data,
    progressByTopicId,
    topicCourseById,
  ]);

  useEffect(() => {
    setSkillsCourseId("");
  }, [selectedKidId]);

  useEffect(() => {
    const availableIds = phonicsProgressByCourse.map((course) => course.courseId);
    if (availableIds.length === 0) {
      if (skillsCourseId) setSkillsCourseId("");
      return;
    }
    if (!skillsCourseId || !availableIds.includes(skillsCourseId)) {
      setSkillsCourseId(availableIds[0]);
    }
  }, [phonicsProgressByCourse, selectedKidId, skillsCourseId]);

  const selectedSkillsCourse = useMemo(
    () =>
      phonicsProgressByCourse.find((course) => course.courseId === skillsCourseId) ??
      phonicsProgressByCourse[0] ??
      null,
    [phonicsProgressByCourse, skillsCourseId],
  );

  const skillsInsightData = useMemo(() => {
    const selectedCourse = selectedSkillsCourse;
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
  }, [selectedSkillsCourse]);

  const recentTeacherRatings = useMemo(() => {
    const selectedCourse = selectedSkillsCourse;
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
          row.ratingSource !== "none" ||
          Boolean(String(row.remark ?? "").trim());
        return {
          ...row,
          courseLabel: row.courseContextVerified ? selectedCourse.courseLabel : null,
          progressSkills,
          progressRatings,
          ...summary,
          ratingSource: row.ratingSource,
          explicitProgressRatings: row.explicitProgressRatings,
          hasMeaningfulData,
        };
      })
      .filter((row: any) => row.hasMeaningfulData && row.progressSkills.length > 0)
      .sort((a: any, b: any) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0))
      .slice(0, 6);
  }, [selectedSkillsCourse]);

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
      ratedLessonCount: averageCount,
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

  const parentSkillsLessons = useMemo<ParentSkillsLesson[]>(
    () =>
      recentTeacherRatings.map((lesson: any) => {
        const ratingDisplay = buildParentSkillRatingDisplay({
          skills: lesson.progressSkills,
          normalizedRatings: lesson.progressRatings,
          explicitRatings: lesson.explicitProgressRatings,
          origin:
            lesson.ratingSource === "explicit" || lesson.ratingSource === "legacy"
              ? lesson.ratingSource
              : "none",
        });
        return {
          id: String(lesson.id),
          label: String(lesson.label || "Lesson"),
          courseId: lesson.courseContextVerified ? selectedSkillsCourse?.courseId ?? null : null,
          courseLabel: String(lesson.courseLabel || "").trim() || null,
          stageLabel: String(lesson.stageLabel || "").trim() || null,
          updatedAtMs:
            typeof lesson.updatedAtMs === "number" && Number.isFinite(lesson.updatedAtMs)
              ? lesson.updatedAtMs
              : null,
          ratedSkillCount: lesson.ratedSkillCount,
          totalSkillCount: lesson.totalSkillCount,
          averageRating: lesson.averageRating,
          roundedAverageRating: lesson.roundedAverageRating,
          ratingState: ratingDisplay.state,
          ratingStateLabel: ratingDisplay.stateLabel,
          ratingEntries: ratingDisplay.entries,
          strengthChips: dedupeParentSkillLabels(
            Array.isArray(lesson.strengthChips) ? lesson.strengthChips : [],
          ),
          practiceChips: dedupeParentSkillLabels(getLessonNeedsPracticeChips(lesson)),
          remark: String(lesson.remark || ""),
          source: lesson,
        };
      }),
    [recentTeacherRatings, selectedSkillsCourse?.courseId],
  );

  const parentSkillsHighlights = useMemo(() => {
    const strengths =
      recentTeacherRatingsSummary?.strongestSkills?.length
        ? recentTeacherRatingsSummary.strongestSkills
        : skillsInsightData?.strengths?.map((skill: any) => formatSkillChipLabel(skill.tag)) ?? [];
    const practiceAreas =
      recentTeacherRatingsSummary?.needsPracticeSkills?.length
        ? recentTeacherRatingsSummary.needsPracticeSkills
        : skillsInsightData?.needsPractice?.map((skill: any) => formatSkillChipLabel(skill.tag)) ?? [];
    return {
      strengths: dedupeParentSkillLabels(strengths),
      practiceAreas: dedupeParentSkillLabels(practiceAreas),
    };
  }, [recentTeacherRatingsSummary, skillsInsightData]);

  const parentSkillsStages = useMemo(
    () =>
      (skillsInsightData?.stageGroups ?? []).map((stage: any) => {
        const order =
          stage.order > 0 ? stage.order : parseStageOrderFromLabel(stage.label) ?? 0;
        return {
          id: `${order}__${stage.label}`,
          label: stage.label,
          order,
          displayLabel: stripStagePrefix(stage.label, order),
          skills: stage.topSkills.map((skill: any) => ({
            tag: skill.tag,
            label: formatParentSkillTag(skill.tag),
            count: skill.count,
          })),
        };
      }),
    [skillsInsightData],
  );

  const parentSkillUpdates = useMemo(
    () =>
      (skillsInsightData?.recentUpdates ?? []).map((update: any) => {
        const order =
          update.stageOrder > 0
            ? update.stageOrder
            : parseStageOrderFromLabel(update.stageLabel) ?? 0;
        return {
          id: parentSkillUpdateId({
            tag: update.tag,
            stageLabel: update.stageLabel,
            stageOrder: order,
            updatedAtMs: update.updatedAtMs ?? null,
          }),
          label: formatParentSkillTag(update.tag),
          stageLabel: stripStagePrefix(update.stageLabel, order),
          updatedAtMs: update.updatedAtMs ?? null,
        };
      }),
    [skillsInsightData],
  );

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
        label: topic.displayTitle ?? topic.label,
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
        remark: String(matchedDoc?.teacherRemark ?? matchedDoc?.remark ?? "").trim(),
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
          hasMasteryData: group.rows.some((row: any) => String(row.mastery || "").trim().length > 0),
          focusChips: pickStageFocus(group.rows),
          stageHint,
          progressPct,
          completedCount,
          totalCount,
          expectations,
        };
      });

    const completedCount = rows.filter(
      (row) => masteryKeyFromValue(row.mastery) === "mastered",
    ).length;
    const totalCount = rows.length;
    const overallPct = totalCount > 0
      ? clampPercent(Math.round((completedCount / totalCount) * 100))
      : null;
    const lastUpdatedAtMs = rows.reduce<number | null>((latest, row) => {
      if (!row.updatedAtMs) return latest;
      return latest === null ? row.updatedAtMs : Math.max(latest, row.updatedAtMs);
    }, null);
    const completedStages = stageSummaries.filter((stage) => stage.progressPct >= 100).length;
    const stagesWithProgress = stageSummaries.filter((stage) => stage.progressPct > 0);
    const activeStage =
      stagesWithProgress.length > 0
        ? stagesWithProgress[stagesWithProgress.length - 1]
        : stageSummaries.find((stage) => stage.progressPct === 0) ?? null;
    const nextStage = activeStage
      ? stageSummaries.find((stage) => stage.order > activeStage.order) ?? null
      : null;

    return {
      courseId: normalizedInsightsCourseId,
      rows,
      stageSummaries,
      completedCount,
      totalCount,
      overallPct,
      lastUpdatedAtMs,
      completedStages,
      activeStage,
      nextStage,
    };
  }, [
    normalizedInsightsCourseId,
    curriculumTopicsByCourseId,
    phonicsProgressQuery.data,
    progressByTopicId,
    topicCourseById,
  ]);

  const selectedInsightsCourseOption = useMemo(
    () => insightsCourseOptions.find((option) => option.courseId === insightsCourseId) ?? null,
    [insightsCourseId, insightsCourseOptions],
  );

  const insightsActiveStageKey = insightsStageData?.activeStage
    ? getParentInsightStageKey(
        insightsStageData.activeStage.order,
        insightsStageData.activeStage.label,
      )
    : null;
  const insightsActiveStageOrder = insightsStageData?.activeStage?.order ?? null;

  const insightStageRows = useMemo<ParentInsightStageDisplay[]>(() => {
    return (insightsStageData?.stageSummaries ?? []).map((stage) => {
      const key = getParentInsightStageKey(stage.order, stage.label);
      return {
        key,
        order: stage.order,
        label: stripStagePrefix(stage.label, stage.order),
        state: resolveParentInsightStageState({
          key,
          order: stage.order,
          progressPct: stage.progressPct,
          activeStageKey: insightsActiveStageKey,
          activeStageOrder: insightsActiveStageOrder,
        }),
        progressPct: stage.progressPct,
        completedCount: stage.completedCount,
        totalCount: stage.totalCount,
        masteryLabel: stage.hasMasteryData ? formatMasteryLabel(stage.masteryKey) : "",
        hint: stage.stageHint,
        focusItems: stage.focusChips,
        expectations: stage.expectations,
      };
    });
  }, [insightsActiveStageKey, insightsActiveStageOrder, insightsStageData?.stageSummaries]);

  const activeInsightStage = useMemo(
    () => insightStageRows.find((stage) => stage.key === insightsActiveStageKey) ?? null,
    [insightStageRows, insightsActiveStageKey],
  );
  const nextInsightStage = useMemo(() => {
    const next = insightsStageData?.nextStage;
    if (!next) return null;
    const key = getParentInsightStageKey(next.order, next.label);
    return insightStageRows.find((stage) => stage.key === key) ?? null;
  }, [insightStageRows, insightsStageData?.nextStage]);

  const insightsTeacherDisplay = useMemo<ParentInsightTeacherDisplay | null>(() => {
    const selectedCourse = normalizeCurriculumCourseId(insightsCourseId);
    const teacherSummaryCourse = normalizeCurriculumCourseId(displayCourseId);
    if (!recentTeacherRatingsSummary?.latestLesson || selectedCourse !== teacherSummaryCourse) {
      return null;
    }
    const latest = recentTeacherRatingsSummary.latestLesson;
    return {
      lessonLabel: String(latest.label || "Rated lesson"),
      contextLabel: String(
        latest.stageLabel
        || latest.courseLabel
        || selectedInsightsCourseOption?.label
        || "Current course",
      ),
      updatedLabel: latest.updatedAtMs ? formatTimestamp(latest.updatedAtMs) : "",
      note: String(latest.remark || "").trim(),
      ratingValue: recentTeacherRatingsSummary.ratedLessonCount > 0
        ? recentTeacherRatingsSummary.averageRecentRating
        : null,
      ratingLabel: recentTeacherRatingsSummary.ratedLessonCount > 0
        ? recentTeacherRatingsSummary.averageRecentLabel
        : "",
    };
  }, [
    displayCourseId,
    insightsCourseId,
    recentTeacherRatingsSummary,
    selectedInsightsCourseOption?.label,
  ]);

  const changeInsightsCourse = useCallback((courseId: string) => {
    hapticSelection();
    setInsightsCourseId(courseId);
  }, []);

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
    debugParentDashboard("[Curriculum Debug]", {
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
    const attendanceProjection = parentMonthlyBillingReadModelQuery.data?.attendance;
    const projectionTotals = attendanceProjection?.totals;
    const projectionKidRow =
      selectedKidId && attendanceProjection?.byKid
        ? attendanceProjection.byKid[selectedKidId]
        : null;

    const projectionSource = projectionKidRow || projectionTotals || null;
    if (projectionSource) {
      const readNumber = (field: string) => {
        const raw = Number((projectionSource as any)?.[field] ?? 0);
        return Number.isFinite(raw) ? raw : 0;
      };
      return {
        total: readNumber("total"),
        completed: readNumber("completed"),
        in_progress: readNumber("in_progress"),
        scheduled: readNumber("scheduled"),
        cancelled: readNumber("cancelled"),
        no_show: readNumber("no_show"),
        reschedule_requested: readNumber("reschedule_requested"),
        other: readNumber("other"),
        upcoming: readNumber("upcoming"),
      };
    }

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
  }, [monthSessions, parentMonthlyBillingReadModelQuery.data, selectedKidId]);

  const billingSummary = useMemo(() => {
    const kidId = selectedKidId ? String(selectedKidId) : null;
    const billingProjection = parentMonthlyBillingReadModelQuery.data;
    const projectionByKid = billingProjection?.byKid || {};
    const projectionTotals = billingProjection?.totals || {};
    const projectionRow = kidId ? projectionByKid[kidId] : null;

    if (billingProjection && (projectionRow || (!kidId && projectionTotals))) {
      const chargesCountRaw = Number(
        projectionRow?.chargesCount ?? projectionTotals?.chargesCount ?? 0
      );
      const billedAmountRaw = Number(
        projectionRow?.billedAmount ?? projectionTotals?.billedAmount ?? 0
      );
      const paidAmountRaw = Number(
        projectionRow?.paidAmountFromCharges ?? projectionTotals?.paidAmountFromCharges ?? 0
      );
      const dueAmountRaw = Number(
        projectionRow?.dueAmount ?? projectionTotals?.dueAmount ?? 0
      );

      const chargesCount = Number.isFinite(chargesCountRaw) ? chargesCountRaw : 0;
      const billedAmount = Number.isFinite(billedAmountRaw) ? billedAmountRaw : 0;
      const paidAmount = Number.isFinite(paidAmountRaw) ? paidAmountRaw : 0;
      const dueAmount = Number.isFinite(dueAmountRaw) ? dueAmountRaw : Math.max(billedAmount - paidAmount, 0);

      return {
        dueNow: Math.max(dueAmount, 0),
        billedThisMonth: Math.max(billedAmount, 0),
        chargesThisMonth: Math.max(chargesCount, 0),
        totalCharges: Math.max(chargesCount, 0),
        avgRate: chargesCount > 0 ? Math.round(billedAmount / chargesCount) : 0,
        paidThisMonth: Math.max(paidAmount, 0),
        source: "read_model" as const,
        refreshedAt: billingProjection.refreshedAt || null,
      };
    }

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
      source: "fallback_client" as const,
      refreshedAt: null,
    };
  }, [billingChargesQuery.data, monthSessions, parentMonthlyBillingReadModelQuery.data, selectedKidId]);

  const walletBalance = useMemo(() => {
    const raw = Number(parentWalletSummaryQuery.data?.currentBalance);
    return Number.isFinite(raw) ? raw : null;
  }, [parentWalletSummaryQuery.data]);

  const walletAmountToPay = walletBalance !== null && walletBalance < 0 ? Math.abs(walletBalance) : 0;
  const walletAdvanceBalance = walletBalance !== null && walletBalance > 0 ? walletBalance : 0;
  const walletStatusLabel =
    walletBalance === null
      ? "Wallet unavailable"
      : walletBalance < 0
        ? `Amount due: ₹${Math.abs(walletBalance).toLocaleString("en-IN")}`
        : walletBalance > 0
          ? `Advance balance: ₹${walletBalance.toLocaleString("en-IN")}`
          : "No amount due";
  const walletLastUpdatedText = toDateOrNull(parentWalletSummaryQuery.data?.lastUpdatedAt)
    ? toDateOrNull(parentWalletSummaryQuery.data?.lastUpdatedAt)!.toLocaleString("en-IN")
    : "—";

  const profilePaymentsSummary = useMemo(() => {
    const kidId = selectedKidId ? String(selectedKidId) : null;
    const billingProjection = parentMonthlyBillingReadModelQuery.data;
    const projectionByKid = billingProjection?.byKid || {};
    const projectionTotals = billingProjection?.totals || {};
    const projectionRow = kidId ? projectionByKid[kidId] : null;

    if (billingProjection && (projectionRow || (!kidId && projectionTotals))) {
      const count = Number(
        projectionRow?.paymentsCount ?? projectionTotals?.paymentsCount ?? 0
      );
      const total = Number(
        projectionRow?.paymentsTotal ?? projectionTotals?.paymentsTotal ?? 0
      );
      return {
        total: Number.isFinite(total) ? total : 0,
        count: Number.isFinite(count) ? count : 0,
        available: true,
        source: "read_model" as const,
      };
    }

    const rows = (parentPaymentsQuery.data ?? []) as ParentPaymentRecord[];
    const filtered = kidId
      ? rows.filter((p) => String(p.kidId || "") === kidId)
      : rows;
    const summary = filtered.reduce(
      (acc, payment) => {
        const rawAmount = Number(payment?.amount ?? 0);
        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
        acc.total += amount;
        acc.count += 1;
        return acc;
      },
      { total: 0, count: 0 }
    );
    return {
      ...summary,
      available: parentPaymentsQuery.isFetched,
      source: "payment_records" as const,
    };
  }, [
    parentMonthlyBillingReadModelQuery.data,
    parentPaymentsQuery.data,
    parentPaymentsQuery.isFetched,
    selectedKidId,
  ]);

  const curriculumCompletionSummary = useMemo(() => {
    const kidId = selectedKidId ? String(selectedKidId) : '';
    const courseId = String(displayCourseId || '').trim();
    if (!kidId || !courseId) {
      return null;
    }

    const progressProjection = parentMonthlyBillingReadModelQuery.data?.progress;
    const projectionKid = progressProjection?.byKid?.[kidId];
    const projectionCourse = projectionKid?.byCourse?.[courseId];
    if (progressProjection && projectionKid && projectionCourse) {
      const totalTopics = Number(projectionCourse.totalTopics ?? 0);
      const completedTopics = Number(projectionCourse.completedTopics ?? 0);
      const inProgressTopics = Number(projectionCourse.inProgressTopics ?? 0);
      const overallPct = Number(
        projectionCourse.overallPct ??
          (totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0),
      );
      return {
        source: 'read_model' as const,
        totalTopics: Number.isFinite(totalTopics) ? totalTopics : 0,
        completedTopics: Number.isFinite(completedTopics) ? completedTopics : 0,
        inProgressTopics: Number.isFinite(inProgressTopics) ? inProgressTopics : 0,
        overallPct: Number.isFinite(overallPct) ? overallPct : 0,
        refreshedAt: progressProjection.refreshedAt || null,
        lastUpdatedAtMs:
          Number(projectionCourse.lastUpdatedAtMs ?? projectionKid.lastUpdatedAtMs ?? 0) || null,
      };
    }

    const fallbackCourse = phonicsProgressByCourse[0];
    if (!fallbackCourse || String(fallbackCourse.courseId || '').trim() !== courseId) {
      return null;
    }
    const inProgressTopics = fallbackCourse.rows.filter((row: any) => row.status === 'in_progress').length;
    return {
      source: 'fallback_client' as const,
      totalTopics: Number(fallbackCourse.totalTopics ?? 0) || 0,
      completedTopics: Number(fallbackCourse.completedCount ?? 0) || 0,
      inProgressTopics,
      overallPct: Number(fallbackCourse.overallPct ?? 0) || 0,
      refreshedAt: null,
      lastUpdatedAtMs: Number(fallbackCourse.lastUpdatedAtMs ?? 0) || null,
    };
  }, [displayCourseId, parentMonthlyBillingReadModelQuery.data, phonicsProgressByCourse, selectedKidId]);

  const profileEnrollments = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const kidId = selectedKidId ? String(selectedKidId) : "";
    const filtered = enrollments.filter((enr) => {
      if (!kidId) return true;
      if (String(enr.kidId || "") === kidId) return true;
      if (Array.isArray(enr.kidIds) && enr.kidIds.some((id) => String(id) === kidId)) return true;
      if (String(enr.studentId || "") === kidId) return true;
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
      const parentRate = resolveVerifiedParentRate(enr as Record<string, unknown>);
      return {
        id: enr.id,
        courseId,
        courseLabel: label,
        status: String(enr.status || "active"),
        parentRate,
        teacherId,
        teacherName,
      };
    });
  }, [enrollmentsQuery.data, selectedKidId, teacherLookupQuery.data, formatCourseLabel]);

  const selectedKidEnrollmentDocs = useMemo(() => {
    const enrollments = (enrollmentsQuery.data ?? []) as Enrollment[];
    const kidId = selectedKidId ? String(selectedKidId) : "";
    if (!kidId) return [] as Enrollment[];
    return enrollments.filter((enr) => {
      if (String(enr.kidId || "") === kidId) return true;
      if (Array.isArray(enr.kidIds) && enr.kidIds.some((id) => String(id) === kidId)) return true;
      if (String(enr.studentId || "") === kidId) return true;
      return false;
    });
  }, [enrollmentsQuery.data, selectedKidId]);

  const visibleParentWorksheets = useMemo(() => {
    const worksheets = parentWorksheetsQuery.data ?? [];
    return worksheets
      .filter((worksheet) => worksheet.isActive && !worksheet.isArchived)
      .filter((worksheet) =>
        worksheetMatchesContext(worksheet, {
          parentUid: user?.uid || null,
          kidId: selectedKidId || null,
          courseIds: worksheetEnrollmentContext.activeCourseIds,
          enrollmentIds: worksheetEnrollmentContext.activeEnrollmentIds,
        }),
      )
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        const aUpdated = toDateOrNull(a.updatedAt)?.getTime() ?? 0;
        const bUpdated = toDateOrNull(b.updatedAt)?.getTime() ?? 0;
        return bUpdated - aUpdated;
      });
  }, [parentWorksheetsQuery.data, selectedKidId, user?.uid, worksheetEnrollmentContext]);

  const groupedParentWorksheets = useMemo(() => {
    const groups = new Map<string, ParentWorksheetGroup>();
    visibleParentWorksheets.forEach((worksheet) => {
      const category = String(worksheet.category || "").trim() || "Worksheets";
      const key = category.toLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(worksheet);
      } else {
        groups.set(key, { key, label: category, items: [worksheet] });
      }
    });
    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleParentWorksheets]);

  const renderProfileContent = () => {
    const kidName = selectedKid?.fullName || "Child";
    const hasKids = kids.length > 0;
    const hasEnrollments = profileEnrollments.length > 0;

    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800" data-testid="parent-profile-sections">
        <div className="grid gap-5 pb-5 sm:grid-cols-2">
          <section aria-labelledby="profile-parent-title">
            <h2 id="profile-parent-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent</h2>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {user?.displayName || "Parent"}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {user?.email || "Email not available"}
            </div>
          </section>
          <section aria-labelledby="profile-children-title">
            <h2 id="profile-children-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Children</h2>
            {hasKids ? (
              <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                {kids.map((kid: any) => (
                  <div
                    key={kid.id}
                    className={`flex min-h-11 items-center justify-between gap-3 py-2 text-sm ${
                      String(kid.id) === String(selectedKidId)
                        ? "font-semibold text-indigo-700 dark:text-indigo-300"
                        : "text-slate-700 dark:text-slate-200"
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
          </section>
        </div>

        <section className="py-5" aria-labelledby="profile-enrollments-title">
          <h2 id="profile-enrollments-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolments</h2>
          {hasEnrollments ? (
            <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
              {profileEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="flex min-h-14 flex-col justify-center gap-1 py-3 text-sm text-slate-700 dark:text-slate-200"
                >
                  <div>
                    <div className="font-semibold">{enr.courseLabel}</div>
                    <div className="text-xs text-slate-500">Status: {enr.status}</div>
                    <div className="text-xs text-slate-500">
                      Teacher: {enr.teacherName || "Assigned soon"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">
              No enrollments found for {kidName}.
            </div>
          )}
        </section>

        <div className="py-5">
          <ParentProfilePaymentsPanel
            walletState={walletDisplayState}
            paymentsTotal={profilePaymentsSummary.available ? profilePaymentsSummary.total : null}
            paymentsScopeLabel={
              profilePaymentsSummary.source === "read_model"
                ? "Payments recorded this month"
                : "All recorded payments"
            }
            loading={
              parentWalletSummaryQuery.isLoading ||
              (!profilePaymentsSummary.available && parentPaymentsQuery.isLoading)
            }
            lastUpdatedLabel={walletLastUpdatedLabel}
            verifiedParentRates={profileEnrollments
              .filter((enr) => enr.parentRate !== null)
              .map((enr) => ({
                enrollmentId: enr.id,
                courseLabel: enr.courseLabel,
                amount: enr.parentRate as number,
                verified: true as const,
              }))}
            onOpenPayments={() => {
              setProfileOpen(false);
              setTab("payments");
            }}
          />
        </div>

        <section className="pt-5" aria-labelledby="profile-class-insights-title">
          <h2 id="profile-class-insights-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class insights</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            <div className="text-sm text-slate-700 dark:text-slate-200">
              <div className="text-xs text-slate-500">Completed classes this month</div>
              <div className="text-lg font-semibold">{billingSummary.chargesThisMonth}</div>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200">
              <div className="text-xs text-slate-500">Upcoming</div>
              <div className="text-lg font-semibold">{classesCounts.upcoming}</div>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200">
              <div className="text-xs text-slate-500">Rescheduled</div>
              <div className="text-lg font-semibold">{classesCounts.reschedule_requested}</div>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200">
              <div className="text-xs text-slate-500">Class deductions this month</div>
              <div className="text-lg font-semibold">
                ₹{billingSummary.billedThisMonth.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const billingLoading =
    parentMonthlyBillingReadModelQuery.isLoading &&
    !parentMonthlyBillingReadModelQuery.data &&
    (billingChargesQuery.isLoading || kidSessionsQuery.isLoading);

  const walletDisplayState = useMemo(
    () =>
      getParentWalletDisplayState({
        balance: walletBalance,
        loading: parentWalletSummaryQuery.isLoading,
        error: parentWalletSummaryQuery.isError,
      }),
    [
      parentWalletSummaryQuery.isError,
      parentWalletSummaryQuery.isLoading,
      walletBalance,
    ],
  );
  const walletLastUpdatedLabel =
    walletLastUpdatedText === "—" ? null : walletLastUpdatedText;

  const canJoinSession = useCallback((session: KidSession, status: string) => {
    return (
      status !== "completed" &&
      status !== "cancelled" &&
      status !== "no_show" &&
      status !== "reschedule_requested" &&
      resolveSessionJoinClassUrl(session, activeEnrollmentById).length > 0
    );
  }, [activeEnrollmentById]);

  const classSessionDisplayRows = useMemo<ParentClassSessionDisplay[]>(() => {
    const nowMs = Date.now();
    return sortedClassSessions.map(({ session, start, status }) => {
      const enrollmentId = String((session as any).enrollmentId || "").trim()
        || (session.id.includes("_") ? session.id.split("_")[0].trim() : "");
      const enrollment = enrollmentId ? activeEnrollmentById.get(enrollmentId) : undefined;
      const teacherName = String(
        session.teacherName
        || (session as any).teacherDisplayName
        || (session as any).assignedTeacherName
        || enrollment?.teacherName
        || enrollment?.teacherDisplayName
        || "",
      ).trim();
      const courseName = String(
        session.courseName
        || (session as any).courseLabel
        || enrollment?.courseName
        || enrollment?.courseLabel
        || "Tiny Steps class",
      ).trim();
      const hasJoinLink = resolveSessionJoinClassUrl(session, activeEnrollmentById).length > 0;
      const joinableStatus = shouldShowClassJoinAction(status);
      const joinDisabledReason = !joinableStatus
        ? `${statusLabel(status)} classes cannot be joined.`
        : hasJoinLink
          ? ""
          : "The class link will appear once assigned.";

      return {
        id: session.id,
        source: session,
        dateLabel: formatSessionDateLabel(session),
        dateTime: start.toISOString(),
        timeLabel: formatSessionTimeRange(session),
        indiaTimeLabel: formatSessionIndiaLabel(session),
        legacyTimeWarning: isSessionTimeFallback(session),
        courseName,
        teacherName,
        childName: kids.length > 1 ? resolveSessionChildName(session) : "",
        status,
        startMs: start.getTime(),
        isToday: toYMD(start) === todayDayKey,
        isFuture: start.getTime() > nowMs,
        canJoin: canJoinSession(session, status),
        joinDisabledReason,
      };
    });
  }, [
    activeEnrollmentById,
    canJoinSession,
    kids.length,
    resolveSessionChildName,
    sortedClassSessions,
    todayDayKey,
  ]);

  const classRowsByFilter = useMemo<Record<ParentClassesFilterId, ParentClassSessionDisplay[]>>(() => {
    const byId = new Map(classSessionDisplayRows.map((row) => [row.id, row]));
    const mapRows = (rows: Array<{ session: KidSession }>) =>
      rows.map((row) => byId.get(row.session.id)).filter((row): row is ParentClassSessionDisplay => Boolean(row));
    return {
      today: mapRows(todayClassSessions),
      upcoming: mapRows(upcomingClassSessions),
      completed: mapRows(completedClassSessions),
      past_pending: mapRows(pastPendingClassSessions),
      rescheduled: mapRows(rescheduledClassSessions),
    };
  }, [
    classSessionDisplayRows,
    completedClassSessions,
    pastPendingClassSessions,
    rescheduledClassSessions,
    todayClassSessions,
    upcomingClassSessions,
  ]);

  const classesFilters = useMemo(() => {
    return [
      {
        id: "today" as const,
        label: "Today",
        count: kidSessionsQuery.isLoading ? null : todayClassSessions.length,
        scopeText: "Classes scheduled for today.",
        emptyText: "No classes are scheduled for today.",
      },
      {
        id: "upcoming" as const,
        label: "Upcoming",
        count: kidSessionsQuery.isLoading ? null : upcomingClassSessions.length,
        scopeText: "All future scheduled classes.",
        emptyText: "No upcoming classes are scheduled.",
      },
      {
        id: "completed" as const,
        label: "Completed",
        count: kidSessionsQuery.isLoading ? null : completedClassSessions.length,
        scopeText: "All completed classes in the available history.",
        emptyText: "No completed classes are available yet.",
      },
      {
        id: "past_pending" as const,
        label: "Review",
        count: kidSessionsQuery.isLoading ? null : pastPendingClassSessions.length,
        scopeText: "Past scheduled classes awaiting a status update. No parent action is required here.",
        emptyText: "No past classes need review.",
      },
      {
        id: "rescheduled" as const,
        label: "Rescheduled",
        count: kidSessionsQuery.isLoading ? null : rescheduledClassSessions.length,
        scopeText: "All classes marked as rescheduled in the available history.",
        emptyText: "No rescheduled classes are available.",
      },
    ];
  }, [
    completedClassSessions.length,
    kidSessionsQuery.isLoading,
    pastPendingClassSessions.length,
    rescheduledClassSessions.length,
    todayClassSessions.length,
    upcomingClassSessions.length,
  ]);

  const nextParentClass = useMemo(
    () => selectNextParentClass(classSessionDisplayRows),
    [classSessionDisplayRows],
  );

  const activeClassRows =
    classesView === "calendar" || classesView === "worksheets"
      ? []
      : classRowsByFilter[classesView];

  const parentRecordingDescription = useMemo(() => {
    if (!parentRecordingFolder) return "Open your recording folder.";
    const updatedAtMs = toDateOrNull(
      parentRecordingFolder.updatedAt || parentRecordingFolder.createdAt,
    )?.getTime();
    return [
      String(parentRecordingFolder.folderName || "").trim(),
      updatedAtMs ? `Updated ${formatTimestamp(updatedAtMs)}` : "",
    ].filter(Boolean).join(" · ") || "Open your recording folder.";
  }, [parentRecordingFolder]);

  const classResources = useMemo(() => [
    {
      id: "calendar" as const,
      label: "Class calendar",
      description: "Browse classes by day.",
    },
    {
      id: "worksheets" as const,
      label: "Worksheets",
      description: "Practice resources shared by Tiny Steps.",
      count: parentWorksheetsQuery.isLoading ? null : visibleParentWorksheets.length,
    },
    {
      id: "recordings" as const,
      label: "Class recordings",
      description: parentRecordingDescription,
      disabled: classRecordingsQuery.isLoading || !parentRecordingFolderUrl,
      disabledReason: classRecordingsQuery.isLoading
        ? "Loading recordings…"
        : parentRecordingFolderUrl
          ? undefined
          : "No recording folder is available yet.",
    },
  ], [
    classRecordingsQuery.isLoading,
    parentRecordingDescription,
    parentRecordingFolderUrl,
    parentWorksheetsQuery.isLoading,
    visibleParentWorksheets.length,
  ]);

  const selectClassResource = (resource: ParentClassesResourceId) => {
    hapticSelection();
    if (resource === "recordings") {
      if (parentRecordingFolderUrl) {
        void openExternalHttpsUrl(parentRecordingFolderUrl);
      }
      return;
    }
    if (resource === "calendar") {
      const now = new Date();
      setClassesCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setClassesCalendarSelectedDayKey(toYMD(now));
    }
    setClassesView(resource);
  };

  // ---- Payments tab state ----
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!isNativeAndroidApp) return;
    let mounted = true;
    let backHandle: { remove: () => Promise<void> } | null = null;

    void CapacitorApp.addListener("backButton", () => {
      const activeElement =
        typeof document !== "undefined" ? document.activeElement : null;
      if (isEditableElement(activeElement)) {
        (activeElement as HTMLElement).blur();
        return;
      }
      if (showQrModal) {
        setShowQrModal(false);
        return;
      }
      if (curriculumTopicModalOpen) {
        setCurriculumTopicModalOpen(false);
        setSelectedCurriculumTopic(null);
        return;
      }
      if (profileOpen) {
        setProfileOpen(false);
        return;
      }
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }
      if (isNativeMessagesThreadFocus) {
        window.dispatchEvent(new Event(NATIVE_ANDROID_BACK_EVENT));
        return;
      }
      if (activeTab !== "dashboard") {
        setTab("dashboard");
        return;
      }
      void CapacitorApp.minimizeApp();
    }).then((handle) => {
      if (!mounted) {
        void handle.remove();
        return;
      }
      backHandle = handle;
    }).catch(() => {
      // Browser tests and unsupported bridges retain normal web history behavior.
    });

    return () => {
      mounted = false;
      if (backHandle) void backHandle.remove();
    };
  }, [
    activeTab,
    curriculumTopicModalOpen,
    isNativeAndroidApp,
    isNativeMessagesThreadFocus,
    mobileMenuOpen,
    profileOpen,
    setTab,
    showQrModal,
  ]);
  const [upiPaymentMethod, setUpiPaymentMethod] = useState<"UPI" | "Bank Transfer">("UPI");
  const [upiAmountInput, setUpiAmountInput] = useState("");
  const [upiQrImageLoadFailed, setUpiQrImageLoadFailed] = useState(false);
  const [classPaymentMonth, setClassPaymentMonth] = useState<string>(() => toMonthKey(new Date()));
  const [classPaymentStatusTab, setClassPaymentStatusTab] = useState<
    "all_classes" | "pending_payment" | "paid_classes" | "payments_received"
  >("all_classes");
  const TINYSTEPS_WHATSAPP_NUMBER = "919618398383";
  const TINYSTEPS_UPI_QR_PATH = "/payments/tinysteps-upi-qr.webp";

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

  const dashboardCurriculumData = useMemo(() => {
    const selectedCourse = phonicsProgressByCourse[0];
    if (!selectedCourse || selectedCourse.totalTopics === 0) return null;

    const stageGroups = new Map<string, { label: string; order: number; rows: any[] }>();
    const stageOrderMap = buildStageOrderMap(
      selectedCourse.rows.map((row: any) => ({
        stageLabel: row.stageLabel,
        stageOrder: row.stageOrder,
        order: null,
      })),
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
        const masteryKey = aggregateStageMastery(group.rows.map((row) => row.mastery));
        const progressPct = calcStageProgressPct(group.rows);
        const completedCount = group.rows.filter(
          (row: any) => row.status === "completed" || masteryKeyFromValue(row.mastery) === "mastered",
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

    const completedStages = stageSummaries.filter((stage) => (stage.progressPct ?? 0) >= 100).length;
    const stagesWithProgress = stageSummaries.filter((stage) => (stage.progressPct ?? 0) > 0);
    const activeStage =
      stagesWithProgress.length > 0
        ? stagesWithProgress[stagesWithProgress.length - 1]
        : stageSummaries.find((stage) => (stage.progressPct ?? 0) === 0) ?? null;
    const nextStage = activeStage
      ? stageSummaries.find((stage) => stage.order > (activeStage.order ?? 0)) ?? null
      : null;

    const inProgressCount = selectedCourse.rows.filter((row: any) => row.status === "in_progress").length;
    const summaryTotalTopics = curriculumCompletionSummary?.totalTopics ?? selectedCourse.totalTopics;
    const summaryCompletedCount = curriculumCompletionSummary?.completedTopics ?? selectedCourse.completedCount;
    const summaryInProgressCount = curriculumCompletionSummary?.inProgressTopics ?? inProgressCount;
    const summaryOverallPct = curriculumCompletionSummary?.overallPct ?? selectedCourse.overallPct;
    const summaryLastUpdatedAtMs =
      curriculumCompletionSummary?.lastUpdatedAtMs ?? selectedCourse.lastUpdatedAtMs;

    const filteredRows =
      curriculumFilter === "completed"
        ? selectedCourse.rows.filter((row: any) => row.status === "completed")
        : curriculumFilter === "in_progress"
          ? selectedCourse.rows.filter((row: any) => row.status === "in_progress")
          : selectedCourse.rows;

    const lessonStageGroups = new Map<string, { key: string; label: string; order: number; rows: any[] }>();
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
        lessonStageGroups.set(key, { key, label, order, rows: [row] });
      }
    });

    const stageSummaryByKey = new Map(
      stageSummaries.map((stage) => [`${stage.order ?? 0}__${stage.label}`, stage]),
    );

    const groupedLessons = Array.from(lessonStageGroups.values())
      .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.label.localeCompare(b.label)))
      .map((group) => ({
        ...group,
        summary: stageSummaryByKey.get(group.key) ?? null,
      }));

    return {
      selectedCourse,
      stageSummaries,
      completedStages,
      activeStage,
      nextStage,
      summaryTotalTopics,
      summaryCompletedCount,
      summaryInProgressCount,
      summaryOverallPct,
      summaryLastUpdatedAtMs,
      filteredRows,
      groupedLessons,
    };
  }, [phonicsProgressByCourse, curriculumCompletionSummary, curriculumFilter]);

  const dashboardRecommendedNext = useMemo(() => {
    return buildDashboardRecommendedNext(
      canonicalRecommendedNext || kidSummaryQuery.data?.summary?.recommendedNext,
    );
  }, [canonicalRecommendedNext, kidSummaryQuery.data]);

  const dashboardStrengthChips = useMemo(() => {
    return pickDashboardStrengthChips({
      recentTeacherRatingsSummary,
      skillsInsightData,
    });
  }, [recentTeacherRatingsSummary, skillsInsightData]);

  const dashboardPracticeChips = useMemo(() => {
    return pickDashboardPracticeChips({
      recentTeacherRatingsSummary,
      skillsInsightData,
      getLessonNeedsPracticeChips,
    });
  }, [recentTeacherRatingsSummary, skillsInsightData]);

  const dashboardHeroMessage = useMemo(() => {
    return buildDashboardHeroMessage({
      childName: String(selectedKid?.fullName || selectedKid?.name || "Your child"),
      phonicsLoading,
      completion: dashboardCurriculumData?.summaryOverallPct ?? null,
      dueNow: billingSummary.dueNow,
      rescheduled: classesCounts.reschedule_requested,
      upcoming: classesCounts.upcoming,
    });
  }, [
    billingSummary.dueNow,
    classesCounts.reschedule_requested,
    classesCounts.upcoming,
    dashboardCurriculumData,
    phonicsLoading,
    selectedKid,
  ]);

  const heroJoinClass = useMemo<JoinClassResolution>(() => {
    const preferredStatuses = new Set(["active", "scheduled", "confirmed", "trial", "ongoing"]);
    const nowMs = Date.now();
    const orderedEnrollments = [...selectedKidEnrollmentDocs].sort((a, b) => {
      const aStatus = String(a.status || "").trim().toLowerCase();
      const bStatus = String(b.status || "").trim().toLowerCase();
      const aRank = preferredStatuses.has(aStatus) ? 0 : 1;
      const bRank = preferredStatuses.has(bStatus) ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    for (const enrollment of orderedEnrollments) {
      const enrollmentJoinUrl = getJoinLinkCandidate(enrollment);
      if (enrollmentJoinUrl) {
        return { url: enrollmentJoinUrl, source: "enrollment" };
      }
    }

    const childDashboardJoinUrl = getJoinLinkCandidate(selectedKid);
    if (childDashboardJoinUrl) {
      return { url: childDashboardJoinUrl, source: "child_dashboard" };
    }

    const candidateRows = sortedClassSessions.filter((row) => {
      if (row.status === "completed" || row.status === "cancelled" || row.status === "no_show") {
        return false;
      }
      return row.start.getTime() >= nowMs - 2 * 60 * 60 * 1000;
    });

    for (const row of candidateRows) {
      const resolvedSessionJoinUrl = resolveSessionJoinClassUrl(row.session, activeEnrollmentById);
      if (resolvedSessionJoinUrl) {
        return { url: resolvedSessionJoinUrl, source: "upcoming_session" };
      }
    }

    return {
      url: "",
      source: "unavailable",
      reason: HERO_JOIN_DISABLED_REASON,
    };
  }, [activeEnrollmentById, selectedKid, selectedKidEnrollmentDocs, sortedClassSessions]);

  const renderDashboardHome = () => {
    const childName = selectedKid?.fullName || selectedKid?.name || "your child";
    const curriculumData = dashboardCurriculumData;
    const selectedCourse = curriculumData?.selectedCourse ?? null;
    const programLabel = selectedCourse?.courseLabel
      || profileEnrollments[0]?.courseLabel
      || (displayCourseId ? formatCourseLabel(displayCourseId) : "Program assignment in progress");
    const hasCurriculumCompletionScope =
      Number(curriculumData?.summaryTotalTopics ?? curriculumCompletionSummary?.totalTopics ?? 0) > 0;
    const completionValue =
      hasCurriculumCompletionScope && typeof curriculumData?.summaryOverallPct === "number"
        ? curriculumData.summaryOverallPct
        : hasCurriculumCompletionScope && typeof curriculumCompletionSummary?.overallPct === "number"
          ? curriculumCompletionSummary.overallPct
          : undefined;
    const progressState =
      phonicsLoading
        ? "loading" as const
        : typeof completionValue === "number"
          ? "available" as const
          : "unavailable" as const;
    const activeStageLabel = curriculumData?.activeStage
      ? stripStagePrefix(curriculumData.activeStage.label, curriculumData.activeStage.order ?? 0)
      : overviewMetrics?.stageMessage || "Getting started";
    const latestTeacherLesson = recentTeacherRatingsSummary?.latestLesson ?? null;
    const previewRows = [...todayClassSessions, ...upcomingClassSessions]
      .filter((row) => {
        const status = normalizeStatus(row.status);
        return status !== "paused" && status !== "cancelled" && status !== "canceled";
      })
      .slice(0, 2);
    const dashboardAlerts: string[] = [];
    if (walletBalance !== null && walletBalance < 0) {
      dashboardAlerts.push(`${formatCurrencyINR(Math.abs(walletBalance))} amount to pay`);
    }
    if (classesCounts.reschedule_requested > 0) {
      dashboardAlerts.push(`${classesCounts.reschedule_requested} class update needs attention`);
    }

    const canJoinFromOverview = (row: { session: KidSession; status: string }) => {
      const { session, status } = row;
      if (
        status === "completed" ||
        status === "cancelled" ||
        status === "no_show" ||
        status === "reschedule_requested"
      ) {
        return false;
      }
      return resolveSessionJoinClassUrl(session, activeEnrollmentById).length > 0;
    };

    const selectedCourseLabel = selectedCourse?.courseLabel || "";
    const lessonsSummaryText = curriculumData
      ? `${curriculumData.summaryCompletedCount}/${curriculumData.summaryTotalTopics} lessons`
      : phonicsLoading
        ? "Loading lesson totals"
        : "Curriculum data unavailable";
    const confidenceLabel =
      overviewMetrics?.confidenceNow !== null && overviewMetrics?.confidenceNow !== undefined
        ? masteryLabel(overviewMetrics.confidenceNow)
        : "Not available";
    const confidenceMetaText =
      overviewMetrics?.lastUpdatedAt
        ? `Updated ${formatTimestamp(overviewMetrics.lastUpdatedAt)}`
        : kidSummaryQuery.isLoading
          ? "Loading latest snapshot"
          : "No confidence snapshot yet";
    const attendanceLabel = `${classesCounts.completed}/${classesCounts.total}`;
    const attendanceMetaText = `${classesMonthLabel} · ${classesCounts.reschedule_requested} rescheduled`;
    const billingLabel =
      walletBalance === null
        ? "Wallet unavailable"
        : walletBalance < 0
          ? `${formatCurrencyINR(Math.abs(walletBalance))} to pay`
          : walletBalance > 0
            ? `${formatCurrencyINR(walletBalance)} advance`
            : "No pending amount";
    const billingMetaText = `Deductions · ${classesMonthLabel}`;
    const billingDetailText =
      `Your wallet is updated automatically after each completed class. Payments add balance to your wallet. Class fees reduce the wallet balance.`;

    return (
      <div className="space-y-4 sm:space-y-6" data-layout="parent-home" data-horizontal-scroll="false">
        <ParentDashboardHero
          childName={childName}
          heroMessage={dashboardHeroMessage}
          programLabel={programLabel}
          activeStageLabel={activeStageLabel}
          classesCompleted={classesCounts.completed}
          classesUpcoming={classesCounts.upcoming}
          classesScopeLabel={classesMonthLabel}
          alertText={dashboardAlerts.length > 0 ? dashboardAlerts[0] : "No urgent alerts right now"}
          hasAlert={dashboardAlerts.length > 0}
          onViewInsights={() => setTab("insights")}
          onViewClasses={() => setTab("classes")}
          joinClassUrl={heroJoinClass.url || undefined}
          joinClassDisabledReason={heroJoinClass.reason || HERO_JOIN_DISABLED_REASON}
        />

        <ParentDashboardKpis
          progressState={progressState}
          completionPct={completionValue}
          lessonsSummaryText={lessonsSummaryText}
          confidenceLabel={confidenceLabel}
          confidenceMetaText={confidenceMetaText}
          confidenceLoading={kidSummaryQuery.isLoading}
          attendanceLabel={attendanceLabel}
          attendanceMetaText={attendanceMetaText}
          attendanceLoading={kidSessionsQuery.isLoading && parentMonthlyBillingReadModelQuery.isLoading}
          billingLabel={billingLabel}
          billingMetaText={billingMetaText}
          billingLoading={billingLoading}
        />

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          <ParentAttendanceSummary
            classesCounts={classesCounts}
            scopeLabel={`Class activity · ${classesMonthLabel}`}
            upcomingPreviewRows={previewRows}
            joiningSessionId={joiningSessionId}
            onOpenClasses={() => setTab("classes")}
            onJoinSession={(session) => openJoinClass(session)}
            canJoinFromOverview={canJoinFromOverview}
          />

          <ParentProgressOverview
            childName={childName}
            isRefetching={phonicsProgressQuery.isRefetching}
            onRefresh={() => phonicsProgressQuery.refetch()}
            showsFallbackBanner={curriculumCompletionSummary?.source === "fallback_client"}
            phonicsLoading={phonicsLoading}
            phonicsError={phonicsError}
            phonicsErrorMessage={phonicsErrorMessage}
            curriculumData={curriculumData}
            completionPct={completionValue}
            stripStagePrefix={stripStagePrefix}
          />
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          <ParentLearningInsights
            isLoading={phonicsLoading}
            latestTeacherLesson={latestTeacherLesson}
            selectedCourseLabel={selectedCourseLabel}
            formatTimestamp={formatTimestamp}
            dashboardStrengthChips={dashboardStrengthChips}
            dashboardPracticeChips={dashboardPracticeChips}
            onOpenAllRatings={() => setTab("skills")}
          />

          <ParentRecommendations
            dashboardRecommendedNext={dashboardRecommendedNext}
            labelFromGameId={labelFromGameId}
            onStartPractice={handlePracticeClick}
            onOpenGamesProgress={() => setTab("games-progress")}
          />
        </div>

        <ParentBillingSummary
          billingLoading={billingLoading}
          dueNowText={walletStatusLabel}
          billedText={formatCurrencyINR(billingSummary.billedThisMonth)}
          paidText={
            profilePaymentsSummary.available
              ? formatCurrencyINR(profilePaymentsSummary.total)
              : "Not available"
          }
          deductionsLabel={`Class deductions · ${classesMonthLabel}`}
          paymentsLabel={
            profilePaymentsSummary.source === "read_model"
              ? `Payments received · ${classesMonthLabel}`
              : "Payments recorded"
          }
          billingDetailText={billingDetailText}
          onOpenPayments={() => setTab("payments")}
        />

        <ParentLessonTracker
          phonicsLoading={phonicsLoading}
          phonicsError={phonicsError}
          phonicsErrorMessage={phonicsErrorMessage}
          displayCourseId={displayCourseId}
          curriculumData={curriculumData}
          curriculumFilter={curriculumFilter}
          setCurriculumFilter={setCurriculumFilter}
          collapsedStages={collapsedStages}
          setCollapsedStages={setCollapsedStages}
          onRefresh={() => phonicsProgressQuery.refetch()}
          isRefetching={phonicsProgressQuery.isRefetching}
          formatTimestamp={formatTimestamp}
          stripStagePrefix={stripStagePrefix}
          teacherStarGuide={TEACHER_STAR_GUIDE}
          starString={starString}
          selectedCourseLabel={selectedCourseLabel}
          onSelectTopic={(topic) => {
            setSelectedCurriculumTopic(topic);
            setCurriculumTopicModalOpen(true);
          }}
          curriculumTopicModalOpen={curriculumTopicModalOpen}
          selectedCurriculumTopic={selectedCurriculumTopic}
          onModalOpenChange={(open) => {
            setCurriculumTopicModalOpen(open);
            if (!open) setSelectedCurriculumTopic(null);
          }}
          getLessonNeedsPracticeChips={getLessonNeedsPracticeChips}
        />
      </div>
    );
  };

  if (isLoading) {
    return <ParentShellLoading showNativeTabBar={isNativeParentApp} />;
  }
  if (!user) return null;

  return (
    <div className={`mobile-app-scroll ts-parent-page ts-native-no-x-scroll w-full min-w-0 max-w-full lg:h-screen lg:overflow-hidden ${
      isNativeParentApp
        ? "ts-native-app-shell ts-native-no-x-scroll overflow-hidden"
        : "min-h-[100dvh] overflow-x-hidden [overscroll-behavior-x:none]"
    }`}>
      <div className={`mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-3 sm:px-6 lg:h-full lg:min-h-0 lg:px-8 lg:py-6 ${
        isNativeParentApp
          ? "flex min-h-0 flex-1 flex-col pt-0"
          : "min-h-[100dvh] pt-4 sm:pt-6"
      }`}>
        <Dialog open={mobileMenuOpen} onOpenChange={handleMobileMenuOpenChange}>
          <DialogContent className="ts-native-no-x left-0 top-0 h-[100dvh] max-h-[100dvh] w-[min(88vw,360px)] min-w-0 max-w-[calc(100vw-1rem)] translate-x-0 translate-y-0 overflow-hidden rounded-r-3xl rounded-l-none border-r border-slate-200 bg-white p-0 shadow-2xl [overscroll-behavior:none] data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full dark:border-slate-700 dark:bg-slate-950 sm:rounded-l-none sm:rounded-r-3xl [&>button]:right-3 [&>button]:top-[calc(var(--ts-safe-top)+0.75rem)]">
            <div className="ts-native-scroll ts-native-no-x h-full w-full px-4 pb-[calc(var(--ts-safe-bottom)+1rem)] pt-[calc(var(--ts-safe-top)+1rem)]">
              <DialogHeader className="pl-1 pr-14 text-left">
                <DialogTitle>Parent Menu</DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-3">
              <div className="min-h-[82px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <TinyStepsBrand
                    subtitle={null}
                    className="min-w-0 flex-1 rounded-lg px-0 py-0 hover:bg-transparent"
                    logoClassName="h-8 w-8"
                    titleClassName="max-w-[130px] truncate whitespace-nowrap text-base"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setProfileOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      title="View profile"
                      aria-label="View profile"
                      className="h-11 w-11 rounded-full bg-slate-100/80 text-slate-900 ring-1 ring-slate-200 transition active:scale-95 hover:bg-slate-200"
                    >
                      <CircleUser className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      title="Logout"
                      aria-label="Logout"
                      className="h-11 w-11 rounded-full text-slate-600 transition active:scale-95 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  Hi, {user?.displayName || "Parent"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
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
                      aria-label="Active Child"
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
                      className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                      className="mt-2 min-h-11 w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                    >
                      Open Games Portal
                    </Button>
                  </>
                )}
              </div>

              <nav aria-label="Parent Menu destinations" className="space-y-1.5">
                {parentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        hapticSelection();
                        setTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-sm font-medium transition active:scale-[0.99] ${
                        isActive
                          ? "bg-indigo-50 text-indigo-950 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-100 dark:ring-indigo-800"
                          : "text-slate-600 active:bg-slate-100 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.id === "messages" && messageUnreadCount > 0 && (
                        <span
                          className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                          aria-label={`${messageUnreadCount > 99 ? "99+" : messageUnreadCount} unread messages`}
                        >
                          {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className={`flex min-h-0 w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden lg:h-full lg:flex-row lg:pb-0 ${
          isNativeParentApp ? "h-full flex-1 overflow-hidden pb-0" : "pb-[var(--ts-mobile-tabbar-reserve)]"
        }`}>
          <aside className="hidden w-full shrink-0 lg:sticky lg:top-6 lg:block lg:w-72 lg:self-start">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-4 pb-4 pt-3 space-y-4">
                <div className="min-h-[92px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <TinyStepsBrand
                      subtitle={null}
                      className="min-w-0 flex-1 rounded-lg px-0 py-0 hover:bg-transparent"
                      logoClassName="h-8 w-8"
                      titleClassName="max-w-[130px] truncate whitespace-nowrap text-base"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProfileOpen(true)}
                        title="View profile"
                        aria-label="View profile"
                        className="h-8 w-8 rounded-full bg-slate-100/80 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
                      >
                        <CircleUser className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                        className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1 truncate bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-base font-semibold text-transparent">
                    Hi, {user?.displayName || "Parent"}
                  </div>
                </div>

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
                        {item.id === "messages" && messageUnreadCount > 0 && (
                          <span
                            className={`ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                              isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                            }`}
                          >
                            {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          <main className={`flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden ${
            isNativeParentApp ? "h-full w-full overflow-hidden" : ""
          }`}>
            {!isNativeMessagesThreadFocus && (
              <ParentMobileHeader
                activeTab={activeTab}
                childName={selectedKid?.fullName || selectedKid?.name}
                onMenu={openMobileMenu}
                onProfile={() => {
                  hapticLight();
                  setProfileOpen(true);
                }}
              />
            )}

            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogContent className="max-h-[calc(100dvh-var(--ts-safe-top)-var(--ts-safe-bottom)-1rem)] max-w-3xl overflow-y-auto rounded-[22px] border-slate-200 bg-white px-5 pb-[calc(var(--ts-safe-bottom)+1rem)] pt-5 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Profile & Payments</DialogTitle>
                </DialogHeader>
                {renderProfileContent()}
              </DialogContent>
            </Dialog>

            <div className={`${
              isNativeMessagesThreadFocus
                ? "mt-0 flex min-h-0 flex-1 flex-col space-y-0"
                : activeTab === "dashboard"
                  ? "mt-3 space-y-4 sm:mt-4 sm:space-y-6"
                  : "mt-4 space-y-6"
            } min-h-0 w-full max-w-full overflow-x-hidden [scrollbar-gutter:stable] ${
              isNativeMessagesThreadFocus ? "pr-0" : "pr-1"
            } ${
              isNativeParentApp
                ? isNativeMessagesThreadFocus
                  ? "ts-native-no-x-scroll flex-1 overflow-hidden pb-0"
                  : "ts-native-scroll ts-native-no-x-scroll ts-native-tabbar-reserve flex-1"
                : "pb-6 lg:overflow-y-auto"
            }`}>
              {/* Content */}
              {activeTab === "dashboard" && renderDashboardHome()}

        {activeTab === "messages" && (
          <div className={isNativeMessagesThreadFocus ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "space-y-4"}>
            {shouldShowParentMessagesHeading(isNativeParentApp, isNativeMessagesThreadFocus) && (
              <Card className="p-4">
                <h3 className="text-base font-semibold text-slate-900">Messages</h3>
                <p className="text-xs text-slate-500">
                  Student-wise Tiny Steps conversations
                </p>
              </Card>
            )}
            <MessagesPanel
              embedded
              nativeChatFocus={isNativeMessagesThreadFocus}
              autoSelectFirstThread={false}
              onThreadChange={setMessagesActiveThreadId}
            />
          </div>
        )}

        {activeTab === "insights" && (
          <ParentInsightsView
            isNativeIOSApp={isNativeParentApp}
            childSelected={Boolean(selectedKidId)}
            courseOptions={insightsCourseOptions}
            selectedCourseId={selectedInsightsCourseOption?.courseId || insightsCourseOptions[0]?.courseId || ""}
            selectedCourseLabel={selectedInsightsCourseOption?.label || insightsCourseOptions[0]?.label || "Current course"}
            progressState={
              kidsQuery.isLoading || phonicsLoading || coursesLookupQuery.isLoading
                ? "loading"
                : insightsStageData && (insightsStageData.totalCount ?? 0) > 0
                  ? "available"
                  : "unavailable"
            }
            completedLessons={insightsStageData?.completedCount ?? null}
            totalLessons={insightsStageData?.totalCount ?? null}
            completionPct={insightsStageData?.overallPct ?? null}
            completedStages={insightsStageData?.completedStages ?? null}
            lastUpdatedLabel={
              insightsStageData?.lastUpdatedAtMs
                ? formatTimestamp(insightsStageData.lastUpdatedAtMs)
                : ""
            }
            usesLatestLessonFallback={
              normalizeCurriculumCourseId(insightsCourseId) === normalizeCurriculumCourseId(displayCourseId)
              && curriculumCompletionSummary?.source === "fallback_client"
            }
            stages={insightStageRows}
            activeStage={activeInsightStage}
            nextStage={nextInsightStage}
            teacherInsight={insightsTeacherDisplay}
            teacherInsightLoading={phonicsProgressQuery.isLoading}
            errorMessage={
              kidsQuery.isError
                ? "Unable to load the selected child right now."
                : phonicsError
                  ? phonicsErrorMessage
                  : null
            }
            contextKey={`${selectedKidId}::${insightsCourseId}`}
            onCourseChange={changeInsightsCourse}
            onViewTeacherRatings={() => {
              hapticSelection();
              setTab("skills");
            }}
            onSelectionFeedback={hapticSelection}
          />
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
            <ParentSkillsView
              isNativeIOSApp={isNativeParentApp}
              childName={selectedKid?.fullName || null}
              loading={phonicsLoading}
              error={phonicsError ? phonicsErrorMessage : null}
              courses={phonicsProgressByCourse.map((course) => ({
                id: course.courseId,
                label: course.courseLabel,
              }))}
              selectedCourseId={selectedSkillsCourse?.courseId || ""}
              lessons={parentSkillsLessons}
              recentAverage={
                recentTeacherRatingsSummary && recentTeacherRatingsSummary.ratedLessonCount > 0
                  ? recentTeacherRatingsSummary.averageRecentRating
                  : null
              }
              recentAverageLabel={
                recentTeacherRatingsSummary && recentTeacherRatingsSummary.ratedLessonCount > 0
                  ? recentTeacherRatingsSummary.averageRecentLabel
                  : null
              }
              ratedLessonCount={recentTeacherRatingsSummary?.ratedLessonCount ?? 0}
              strengths={parentSkillsHighlights.strengths}
              practiceAreas={parentSkillsHighlights.practiceAreas}
              stages={parentSkillsStages}
              recentUpdates={parentSkillUpdates}
              onCourseChange={setSkillsCourseId}
              onOpenLesson={(lesson) => {
                setSelectedCurriculumTopic(lesson.source);
                setCurriculumTopicModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Classes tab: canonical sessions bucketed for parent review */}
        {activeTab === "classes" && (
          <div className="space-y-3 sm:space-y-4">
            <ParentClassesView
              activeView={classesView}
              filters={classesFilters}
              activeRows={activeClassRows}
              nextClass={nextParentClass}
              resources={classResources}
              joiningSessionId={joiningSessionId}
              isSessionsLoading={kidSessionsQuery.isLoading}
              sessionsError={kidSessionsQuery.isError ? "We couldn’t load classes. Please try again." : null}
              onSelectFilter={selectClassesView}
              onSelectResource={selectClassResource}
              onJoinSession={(row) => openJoinClass(row.source as KidSession)}
              resourceContent={classesView === "worksheets" ? (
              <Card className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Worksheet Library
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Practice resources shared by Tiny Steps.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => parentWorksheetsQuery.refetch()}
                    disabled={parentWorksheetsQuery.isFetching}
                  >
                    {parentWorksheetsQuery.isFetching ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                {parentWorksheetsQuery.isLoading ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    Loading worksheets...
                  </div>
                ) : groupedParentWorksheets.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    No worksheets have been shared yet.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groupedParentWorksheets.map((group) => (
                      <div key={group.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                            {group.label}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {group.items.length} worksheet{group.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.items.map((worksheet) => {
                            const safeUrl = getSafeWorksheetUrl(worksheet.url);
                            return (
                              <div
                                key={worksheet.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {worksheet.title || "Worksheet"}
                                    </p>
                                    {worksheet.description ? (
                                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        {worksheet.description}
                                      </p>
                                    ) : null}
                                  </div>
                                  {worksheet.category ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {worksheet.category}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="text-[11px] text-slate-500">
                                    {worksheet.targetStageTags[0] || "Worksheet resource"}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openWorksheetLink(worksheet.url)}
                                    disabled={!safeUrl}
                                  >
                                    Open Worksheet
                                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : classesView === "calendar" ? (
              <Card className="p-3 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
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
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClassesCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                        }
                        className="flex-1 sm:flex-none"
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClassesCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                        }
                        className="flex-1 sm:flex-none"
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:gap-2 sm:text-xs">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {classesCalendarDays.map((cell) => {
                      if (!cell.date) {
                        return <div key={cell.key} className="h-12 rounded-lg bg-transparent sm:h-16" />;
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
                          className={`h-12 rounded-lg border px-1.5 py-1 text-left transition sm:h-16 sm:px-2 ${
                            isSelected
                              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30"
                              : "border-slate-200 bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
                              {cell.date.getDate()}
                            </span>
                            {list.length > 0 ? (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                {list.length}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 min-h-3">
                            {dominantStatus ? (
                              <>
                                <span className={`inline-block h-2 w-2 rounded-full sm:hidden ${statusDotClass(dominantStatus)}`} />
                                <span className={`hidden rounded-full border px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex ${statusBadgeClass(dominantStatus)}`}>
                                  {statusLabel(dominantStatus)}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] leading-none text-slate-400">—</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {classesCalendarSelectedRows.length > 0 ? (
                    <div className="space-y-2">
                      {classesCalendarSelectedRows.map(({ session, status }) => (
                        <div
                          key={`calendar-selected-${session.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {formatSessionTimeRange(session)}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {formatSessionIndiaLabel(session)}
                              </div>
                              <div className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
                                {resolveSessionChildName(session)} · {session.courseName || "—"}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(status)}`}>
                              {statusLabel(status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            ) : null}
            />
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

        {/* PAYMENTS TAB */}
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

              const walletTransactions = (parentWalletTransactionsQuery.data ?? []) as ParentWalletTransaction[];
              const sortedWalletTransactions = [...walletTransactions].sort((a, b) => {
                const aTime = toDateOrNull(a.createdAt || a.paidAt)?.getTime() || 0;
                const bTime = toDateOrNull(b.createdAt || b.paidAt)?.getTime() || 0;
                return bTime - aTime;
              });
              const cutoverStartMs = new Date("2026-05-01T00:00:00").getTime();

              const normalizedWalletRows = sortedWalletTransactions
                .map((tx) => {
                  const txDate = toDateOrNull(tx.createdAt || tx.paidAt);
                  if (!txDate) return null;
                  const txMs = txDate.getTime();
                  if (!Number.isFinite(txMs) || txMs < cutoverStartMs) return null;

                  const rawSigned = Number(tx.signedAmount);
                  const rawAmount = Number(tx.amount);
                  const direction = String(tx.direction || "").trim().toLowerCase();
                  const type = String(tx.type || "").trim().toLowerCase();
                  const note = String(tx.note || tx.reason || tx.description || "").trim();
                  const isReversal = type.includes("reversal") || type === "refund";
                  const amountValue = Number.isFinite(rawSigned)
                    ? rawSigned
                    : Number.isFinite(rawAmount)
                      ? direction === "debit"
                        ? -Math.abs(rawAmount)
                        : direction === "credit"
                          ? Math.abs(rawAmount)
                          : rawAmount
                      : 0;
                  const amountAbs = Math.abs(amountValue);
                  const monthKey = toMonthKey(txDate);
                  const studentName = String(
                    (tx as any).studentName ||
                    (tx as any).childName ||
                    (tx as any).kidName ||
                    (tx as any).kidLabel ||
                    ""
                  ).trim() || "—";
                  const courseName = String(
                    (tx as any).courseName ||
                    (tx as any).courseLabel ||
                    (tx as any).className ||
                    ""
                  ).trim();

                  const classDebitByType = type.includes("class_deduction") || type.includes("class deduction");
                  const paymentCreditByType =
                    type.includes("payment") ||
                    type.includes("topup") ||
                    type.includes("top-up") ||
                    type.includes("recharge") ||
                    type.includes("credit");

                  const isClassDebit =
                    !isReversal &&
                    amountAbs > 0 &&
                    (amountValue < 0 || direction === "debit" || classDebitByType);
                  const isPaymentCredit =
                    !isReversal &&
                    amountAbs > 0 &&
                    (amountValue > 0 || direction === "credit" || paymentCreditByType);

                  return {
                    id: tx.id,
                    txDate,
                    txMs,
                    monthKey,
                    type,
                    direction,
                    isReversal,
                    amountValue,
                    amountAbs,
                    studentName,
                    courseName,
                    note,
                    method: String(tx.method || "").trim(),
                    reference: String(tx.reference || "").trim(),
                    paymentStatus: String(tx.status || "").trim(),
                    balanceAfter: Number.isFinite(Number(tx.balanceAfter))
                      ? Number(tx.balanceAfter)
                      : null,
                    isClassDebit,
                    isPaymentCredit,
                  };
                })
                .filter((row): row is NonNullable<typeof row> => Boolean(row));

              const classDebitRowsForAllocation = normalizedWalletRows
                .filter((row) => row.isClassDebit)
                .sort((a, b) => a.txMs - b.txMs);
              const paymentCreditRowsForAllocation = normalizedWalletRows
                .filter((row) => row.isPaymentCredit)
                .sort((a, b) => a.txMs - b.txMs)
                .map((row) => ({ ...row, remainingAmount: row.amountAbs }));

              const classRowsWithPaymentStatus = classDebitRowsForAllocation.map((row) => {
                let remainingClassAmount = row.amountAbs;
                let paidAmount = 0;
                for (const credit of paymentCreditRowsForAllocation) {
                  if (remainingClassAmount <= 0) break;
                  if (credit.remainingAmount <= 0) continue;
                  const applied = Math.min(remainingClassAmount, credit.remainingAmount);
                  remainingClassAmount -= applied;
                  credit.remainingAmount -= applied;
                  paidAmount += applied;
                }
                const pendingAmount = Math.max(row.amountAbs - paidAmount, 0);
                const status =
                  pendingAmount <= 0
                    ? "Paid"
                    : paidAmount <= 0
                      ? "Pending"
                      : "Partially Paid";
                return {
                  ...row,
                  classFee: row.amountAbs,
                  paidAmount,
                  pendingAmount,
                  status,
                };
              });

              const classRowsForSelectedMonth = classRowsWithPaymentStatus.filter(
                (row) => row.monthKey === classPaymentMonth
              );
              const pendingClassRows = classRowsForSelectedMonth.filter(
                (row) => row.status === "Pending" || row.status === "Partially Paid"
              );
              const paidClassRows = classRowsForSelectedMonth.filter(
                (row) => row.status === "Paid"
              );
              const paymentsReceivedRowsForSelectedMonth = normalizedWalletRows.filter(
                (row) => row.isPaymentCredit && row.monthKey === classPaymentMonth
              );

              const classChargeRows: ParentClassChargeDisplay[] = [
                ...classRowsForSelectedMonth.map((row) => ({
                  id: row.id,
                  date: row.txDate,
                  childName: row.studentName,
                  courseName: row.courseName || undefined,
                  amount: row.classFee,
                  paidAmount: row.paidAmount,
                  unsettledAmount: row.pendingAmount,
                  status: row.status === "Paid" ? "settled" as const : "unsettled" as const,
                  note: row.note || undefined,
                })),
                ...normalizedWalletRows
                  .filter((row) => row.isReversal && row.monthKey === classPaymentMonth)
                  .map((row) => ({
                    id: row.id,
                    date: row.txDate,
                    childName: row.studentName,
                    courseName: row.courseName || undefined,
                    amount: row.amountAbs,
                    paidAmount: 0,
                    unsettledAmount: 0,
                    status: "reversed" as const,
                    note: row.note || undefined,
                  })),
              ].sort((a, b) => a.date.getTime() - b.date.getTime());
              const chargeFilter: ParentClassChargeFilter =
                classPaymentStatusTab === "pending_payment" ||
                classPaymentStatusTab === "paid_classes"
                  ? classPaymentStatusTab
                  : "all_classes";
              const visibleClassChargeRows = filterParentClassCharges(
                classChargeRows,
                chargeFilter,
              );
              const paymentDisplayRows: ParentPaymentDisplay[] =
                paymentsReceivedRowsForSelectedMonth.map((row) => ({
                  id: row.id,
                  date: row.txDate,
                  amount: row.amountAbs,
                  method: row.method || undefined,
                  status: row.paymentStatus || undefined,
                  reference: row.reference || undefined,
                  note: row.note || undefined,
                }));
              const paymentPeriodSummary: ParentPaymentPeriodSummary =
                parentWalletTransactionsQuery.isLoading ||
                parentWalletTransactionsQuery.isError
                  ? {
                      classDeductions: null,
                      paymentsRecorded: null,
                      billedClassCount: null,
                      settledClassCount: null,
                      unsettledClassCount: null,
                    }
                  : {
                      classDeductions: classRowsForSelectedMonth.reduce(
                        (sum, row) => sum + row.classFee,
                        0,
                      ),
                      paymentsRecorded: paymentsReceivedRowsForSelectedMonth.reduce(
                        (sum, row) => sum + row.amountAbs,
                        0,
                      ),
                      billedClassCount: null,
                      settledClassCount: null,
                      unsettledClassCount: null,
                    };

              const handleOpenPaymentVerificationWhatsApp = () => {
                const parentName =
                  String(user?.displayName || "").trim() ||
                  String(user?.email || "").trim() ||
                  "Parent not provided";
                const childName =
                  String(selectedKid?.fullName || selectedKid?.name || "").trim() ||
                  "Child not selected";
                const amountPaidText =
                  upiAmountInput.trim().length > 0
                    ? `₹${upiAmountInput.trim()}`
                    : "[Please enter amount]";
                const paymentDate = new Date().toLocaleDateString("en-IN");

                const message = `Hello Tiny Steps Team,\n\nI would like to submit payment details for verification.\n\nParent name: ${parentName}\nChild name: ${childName}\nAmount paid: ${amountPaidText}\nPayment method: ${upiPaymentMethod}\nPayment date: ${paymentDate}\n\nI will attach the payment screenshot for verification. Please update the wallet balance after the payment is verified.\n\nThank you.`;
                const whatsappUrl = `https://wa.me/${TINYSTEPS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  message
                )}`;
                void openExternalHttpsUrl(whatsappUrl);
                hapticLight();
              };

              return (
                <>
                  <ParentPaymentsView
                    isNativeIOSApp={isNativeParentApp}
                    childName={selectedKid?.fullName || selectedKid?.name || "the selected child"}
                    walletState={walletDisplayState}
                    walletLastUpdatedLabel={walletLastUpdatedLabel}
                    paymentOptionsAvailable={!isNativeIOSApp}
                    paymentAssistanceText={IOS_BILLING_ASSISTANCE_TEXT}
                    selectedMonth={classPaymentMonth}
                    summary={paymentPeriodSummary}
                    summaryLoading={parentWalletTransactionsQuery.isLoading}
                    activityLoading={parentWalletTransactionsQuery.isLoading}
                    activityError={parentWalletTransactionsQuery.isError}
                    activityMode={
                      classPaymentStatusTab === "payments_received" ? "payments" : "charges"
                    }
                    chargeFilter={chargeFilter}
                    chargeRows={visibleClassChargeRows}
                    chargeCounts={null}
                    paymentRows={paymentDisplayRows}
                    membership={{
                      active: isActive,
                      enrollmentDateLabel: enrollmentDate
                        ? enrollmentDate.toLocaleDateString("en-IN")
                        : null,
                      startDateLabel: displayStartDate
                        ? displayStartDate.toLocaleDateString("en-IN")
                        : null,
                      endDateLabel: membershipEndDate
                        ? membershipEndDate.toLocaleDateString("en-IN")
                        : null,
                    }}
                    onOpenPaymentOptions={() => {
                      hapticLight();
                      setUpiQrImageLoadFailed(false);
                      setUpiPaymentMethod("UPI");
                      setUpiAmountInput("");
                      setShowQrModal(true);
                    }}
                    onViewClasses={() => setTab("classes")}
                    onMonthChange={setClassPaymentMonth}
                    onActivityModeChange={(mode) =>
                      setClassPaymentStatusTab(
                        mode === "payments" ? "payments_received" : "all_classes",
                      )
                    }
                    onChargeFilterChange={setClassPaymentStatusTab}
                  />

                  <ParentPaymentOptionsDialog
                    open={showQrModal}
                    walletState={walletDisplayState}
                    method={upiPaymentMethod}
                    amountInput={upiAmountInput}
                    qrImagePath={TINYSTEPS_UPI_QR_PATH}
                    qrImageLoadFailed={upiQrImageLoadFailed}
                    onOpenChange={setShowQrModal}
                    onMethodChange={setUpiPaymentMethod}
                    onAmountInputChange={setUpiAmountInput}
                    onQrImageError={() => setUpiQrImageLoadFailed(true)}
                    onOpenWhatsAppVerification={handleOpenPaymentVerificationWhatsApp}
                  />

                </>
              );
            })()}
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
      {!isNativeMessagesThreadFocus && (
        <MobileTabBar
          items={parentMobileTabs}
          activeId={activeTab}
          onSelect={(nextTab) => setTab(nextTab as TabKey)}
        />
      )}
    </div>
  );
}
