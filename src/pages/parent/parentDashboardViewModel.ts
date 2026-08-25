export type DashboardRecommendedNext = {
  gameId: string;
  reason: string;
  estMinutes: number | null;
};

const gameIdAliases: Record<string, string> = {
  tracing: "letter-tracing",
  "letter-tracing-game": "letter-tracing",
  "letter-tracing-sound": "letter-tracing-sounds",
  "letter-sound": "letter-sound-match",
  "letter-match": "letter-sound-match",
  "sound-match": "letter-sound-match",
  "sound-detection": "sound-detective",
  "sound-detective-game": "sound-detective",
  "balloon-pop-game": "balloon-pop",
};

const gameLabelById: Record<string, string> = {
  "letter-tracing": "Letter Tracing",
  "letter-tracing-sounds": "Letter Tracing with Sounds",
  "sound-detective": "Sound Detective",
  "letter-sound-match": "Letter Sound Match",
  "balloon-pop": "Balloon Pop",
  "cvc-word-reader": "CVC Word Reader",
  "cvc-word-builder": "CVC Word Builder",
  comprehension: "Comprehension",
  "new-words": "New Words from Reading",
  "build-better-sentences": "Build Better Sentences",
  "grammar-fix": "Grammar Fix",
  "collocation-builder": "Collocation Builder",
  "idiom-in-a-sentence": "Idiom in a Sentence",
};

const titleCaseFromId = (value: string): string =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeGameId = (value: string): string => {
  const raw = String(value || "").trim().toLowerCase().replace(/_/g, "-");
  return gameIdAliases[raw] || raw;
};

export const labelFromGameId = (gameId?: string | null): string => {
  const raw = String(gameId || "").trim();
  if (!raw) return "Learning Game";
  const canonicalId = normalizeGameId(raw);
  if (canonicalId && gameLabelById[canonicalId]) return gameLabelById[canonicalId];
  const fallback = titleCaseFromId(canonicalId || raw);
  return fallback || "Learning Game";
};

export function formatCurrencyINR(value?: number | null): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${Math.max(0, amount).toLocaleString("en-IN")}`;
}

export function formatSkillChipLabel(tag: string): string {
  const raw = String(tag || "").trim();
  if (!raw) return "—";
  if (raw.startsWith("letter:")) {
    const letter = raw.split(":")[1]?.toUpperCase() || "";
    return `Letter ${letter}`;
  }
  if (raw.startsWith("sound:")) {
    return `Sound ${raw.substring(6)}`;
  }
  if (raw.startsWith("subtopic:")) {
    return raw
      .substring(9)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const buildDashboardRecommendedNext = (raw: unknown): DashboardRecommendedNext | null => {
  if (!raw || typeof raw !== "object") return null;
  const gameId = String((raw as any).gameId || "").trim();
  const reason = String((raw as any).reason || "").trim();
  const rawMinutes = Number((raw as any).estMinutes ?? NaN);
  const estMinutes =
    Number.isFinite(rawMinutes) && rawMinutes > 0 ? Math.max(1, Math.round(rawMinutes)) : null;
  return { gameId, reason, estMinutes };
};

export const pickDashboardStrengthChips = (params: {
  recentTeacherRatingsSummary: any;
  skillsInsightData: any;
}): string[] => {
  const { recentTeacherRatingsSummary, skillsInsightData } = params;
  if (recentTeacherRatingsSummary?.strongestSkills?.length) {
    return recentTeacherRatingsSummary.strongestSkills.slice(0, 3);
  }
  if (recentTeacherRatingsSummary?.latestLesson?.strengthChips?.length) {
    return recentTeacherRatingsSummary.latestLesson.strengthChips.slice(0, 3);
  }
  if (skillsInsightData?.strengths?.length) {
    return skillsInsightData.strengths.slice(0, 3).map((row: any) => formatSkillChipLabel(row.tag));
  }
  return [];
};

export const pickDashboardPracticeChips = (params: {
  recentTeacherRatingsSummary: any;
  skillsInsightData: any;
  getLessonNeedsPracticeChips: (row: any) => string[];
}): string[] => {
  const { recentTeacherRatingsSummary, skillsInsightData, getLessonNeedsPracticeChips } = params;
  if (recentTeacherRatingsSummary?.needsPracticeSkills?.length) {
    return recentTeacherRatingsSummary.needsPracticeSkills.slice(0, 3);
  }
  if (recentTeacherRatingsSummary?.latestLesson) {
    const chips = getLessonNeedsPracticeChips(recentTeacherRatingsSummary.latestLesson);
    if (chips.length > 0) return chips.slice(0, 3);
  }
  if (skillsInsightData?.needsPractice?.length) {
    return skillsInsightData.needsPractice
      .slice(0, 3)
      .map((row: any) => formatSkillChipLabel(row.tag));
  }
  return [];
};

export const buildDashboardHeroMessage = (params: {
  childName: string;
  phonicsLoading: boolean;
  completion: number | null;
  dueNow: number;
  rescheduled: number | null;
  upcoming: number | null;
}): string => {
  const { childName, phonicsLoading, completion, dueNow, rescheduled, upcoming } = params;
  if (phonicsLoading) {
    return `${childName}'s latest progress is loading. We will show the newest class and learning updates shortly.`;
  }
  if (typeof completion === "number" && completion >= 70 && dueNow <= 0) {
    return `${childName} is doing well. Progress is steady, and there are no pending payment alerts right now.`;
  }
  if (typeof completion === "number" && completion >= 40) {
    return `${childName} is moving forward. Focus on regular practice this week to keep momentum strong.`;
  }
  if (typeof rescheduled === "number" && rescheduled > 0) {
    return `${childName} has a class update that needs attention. Please check the class schedule for the latest status.`;
  }
  if (typeof upcoming === "number" && upcoming > 0) {
    return `${childName} is building consistency. Upcoming classes this week will help unlock the next progress milestone.`;
  }
  if (rescheduled === null || upcoming === null) {
    return `${childName}'s learning overview is ready. Class totals will appear once the selected-child monthly projection is available.`;
  }
  return `${childName}'s dashboard is ready with clear next steps for learning, class rhythm, and payment visibility.`;
};
