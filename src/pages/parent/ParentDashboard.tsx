// src/pages/parent/ParentDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  doc,
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

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 
import { masteryKeyFromValue, masteryLabel, masteryPctFromKey, type MasteryKey } from "../../lib/mastery";

type TabKey =
  | "dashboard"
  | "insights"
  | "games-progress"
  | "skills"
  | "classes"
  | "profile"
  | "payments";

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = [
    "dashboard",
    "insights",
    "games-progress",
    "skills",
    "classes",
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
  courseId?: string;
  courseName?: string;
  courseLabel?: string;
  course?: { area?: string };
  courseArea?: string;
  area?: string;
  [key: string]: any;
};

const PHONICS_COURSE_IDS = [
  "phonics-foundations",
  "early-phonics",
  "advanced-phonics",
];

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
    const chips = Array.isArray(row.focusChips) && row.focusChips.length > 0
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

function normalizeStatus(raw?: string): string {
  const s = (raw || "").toLowerCase().trim();
  if (s === "scheduled" || s === "in_progress" || s === "completed" || s === "cancelled" || s === "canceled" || s === "no_show" || s === "noshow") {
    if (s === "canceled") return "cancelled";
    if (s === "noshow") return "no_show";
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
    default:
      return "Scheduled";
  }
}

export default function ParentDashboard() {
  const { user, isLoading, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [curriculumExpanded, setCurriculumExpanded] = useState(false);
  const [curriculumFilter, setCurriculumFilter] = useState<
    "all" | "in_progress" | "completed"
  >("all");
  const [insightsCourseId, setInsightsCourseId] = useState<string>("");

  useEffect(() => {
    if (!selectedKidId && kids.length > 0) setSelectedKidId(kids[0].id);
  }, [kids, selectedKidId]);

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
    enabled: activeTab === "dashboard",
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
      if (!byCourse[courseId]) byCourse[courseId] = [];
      byCourse[courseId].push({
        id,
        label,
        displayTitle: label,
        order,
        stageLabel: stageLabel || null,
        stageOrder,
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
    enabled: activeTab === "insights",
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


  /**
   * ✅ skillTagStats: used by ParentGamesProgress (letter-tracing: lower/upper)
   * Manual refresh model: fetch when entering Games Progress tab (no polling)
   */
  const skillTagStatsQuery = useQuery({
    queryKey: ["skillTagStats", selectedKidId],
    enabled: !!selectedKidId && activeTab === "games-progress",
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return null;
      const snap = await getDocs(
        collection(db, "kids", selectedKidId, "skillTagStats")
      );
      const map: Record<string, any> = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      return map;
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
      return Array.isArray(data?.games) ? data.games : [];
    },
  });

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

    const kidParam = `?kidId=${encodeURIComponent(selectedKidId)}`;
    const routeByGame: Record<string, string> = {
      "letter-tracing": "/kids/games/phonics/letter-tracing",
      "sound-detective": "/kids/games/phonics/sound-detective",
      // Add more mappings as you add routes:
      // "rhyme-time": "/kids/games/phonics/rhyme-time",
      // "letter-sound-match": "/kids/games/phonics/letter-sound-match",
    };

    const base =
      (gameId && routeByGame[gameId]) ? routeByGame[gameId] : "/kids/games";

    navigate(`${base}${kidParam}`);
  };

  // ---- Skills tab state ----
  const [selectedSkillStageId, setSelectedSkillStageId] = useState<string | null>(
    null
  );
  const skillsScrollContainerRef = useRef<HTMLDivElement>(null);
  const [skillsScrollAtEnd, setSkillsScrollAtEnd] = useState(false);
  const [skillsViewMode, setSkillsViewMode] = useState<"scroll" | "list">(
    "scroll"
  );

  useEffect(() => {
    const updateSkillsScrollPosition = () => {
      if (!skillsScrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } =
        skillsScrollContainerRef.current;
      setSkillsScrollAtEnd(scrollLeft + clientWidth >= scrollWidth - 2);
    };

    const container = skillsScrollContainerRef.current;
    if (!container) return;

    updateSkillsScrollPosition();
    container.addEventListener("scroll", updateSkillsScrollPosition);
    window.addEventListener("resize", updateSkillsScrollPosition);

    return () => {
      container.removeEventListener("scroll", updateSkillsScrollPosition);
      window.removeEventListener("resize", updateSkillsScrollPosition);
    };
  }, [activeTab]);

  // ---- Classes tab state (Calendar) ----
  const [classesMonth, setClassesMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [classesSelectedDayKey, setClassesSelectedDayKey] = useState<string | null>(null);
  const [classesDayModalOpen, setClassesDayModalOpen] = useState(false);

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

      console.log("🔍 [ParentDashboard] Fetching sessions for:", {
        selectedKidId,
        parentUid: user.uid,
        parentEmail: user.email,
      });

      const classSessionsCol = collection(db, "classSessions");

      try {
        // Primary: sessions.kidIds array contains kid AND parentId matches current user
        const qA = query(
          classSessionsCol,
          where("kidIds", "array-contains", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapA = await getDocs(qA);
        console.log("✅ [Query A] classSessions kidIds array-contains + parentId:", {
          count: snapA.size,
          docs: snapA.docs.map(d => ({ id: d.id, parentId: d.data().parentId, kidIds: d.data().kidIds }))
        });

        // Fallback: sessions.kidId == kid (older schema) AND parentId matches
        const qB = query(
          classSessionsCol,
          where("kidId", "==", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapB = await getDocs(qB);
        console.log("✅ [Query B] classSessions kidId equality + parentId:", {
          count: snapB.size,
          docs: snapB.docs.map(d => ({ id: d.id, parentId: d.data().parentId, kidId: d.data().kidId }))
        });

        const map = new Map<string, KidSession>();
        snapA.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));
        snapB.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));

        const all = Array.from(map.values());
        console.log("📊 [Final Result] Total unique sessions:", all.length);

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

  const classesMonthLabel = useMemo(() => {
    return classesMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [classesMonth]);

  const monthStart = useMemo(() => new Date(classesMonth.getFullYear(), classesMonth.getMonth(), 1), [classesMonth]);
  const monthEnd = useMemo(() => new Date(classesMonth.getFullYear(), classesMonth.getMonth() + 1, 0, 23, 59, 59, 999), [classesMonth]);

  const allKidSessions = useMemo(() => (kidSessionsQuery.data ?? []) as KidSession[], [kidSessionsQuery.data]);

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

      return {
        id: topic.id,
        label: topic.displayTitle ?? topic.label,
        stageLabel: topic.stageLabel ?? null,
        stageOrder: typeof topic.stageOrder === "number" ? topic.stageOrder : null,
        status,
        mastery: mastery ?? "",
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

      return {
        id: topic.id,
        stageLabel: topic.stageLabel ?? "Lessons",
        stageOrder: typeof topic.stageOrder === "number" ? topic.stageOrder : 999,
        mastery: matchedDoc?.mastery ?? "",
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
        const expectations =
          STAGE_EXPECTATIONS_BY_COURSE[normalizedInsightsCourseId]?.[group.order] ?? [];
        return {
          label: group.label,
          order: group.order,
          masteryKey,
          focusChips: pickStageFocus(group.rows),
          stageHint,
          progressPct,
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
    if (phonicsLoading) return;
    const progressDocs = (phonicsProgressQuery.data ?? []) as any[];
    const sample = progressDocs.slice(0, 3).map((doc) => ({
      identifier: doc?.id,
      courseIdentifier: doc?.courseId ?? null,
      topicName: doc?.topicName ?? doc?.label ?? null,
    }));
    const courseDebug = phonicsProgressByCourse[0];
    console.log("[Curriculum Debug]", {
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

  const billingLoading = billingChargesQuery.isLoading || kidSessionsQuery.isLoading;

  // Calendar grid helpers
  const calendarDays = useMemo(() => {
    const year = classesMonth.getFullYear();
    const month = classesMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0..6 (Sun..Sat)

    const cells: Array<{ key: string; date: Date | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ key: `blank-${i}`, date: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ key: toYMD(dt), date: dt });
    }

    // pad to full weeks (multiple of 7)
    while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, date: null });

    return cells;
  }, [classesMonth]);

  const openDay = (dayKey: string) => {
    setClassesSelectedDayKey(dayKey);
    setClassesDayModalOpen(true);
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

    const confidenceNow = summary?.confidenceNow ?? null;

    const byGame = progress?.byGame || {};
    const gamesCompleted = Object.values(byGame).filter(
      (g: any) => (g?.completedLevels ?? 0) > 0
    ).length;

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
      typeof summary?.avgAccuracy10 === "number"
        ? summary.avgAccuracy10
        : nums.length > 0
          ? nums.reduce((sum, a) => sum + a, 0) / nums.length
          : null;

    const totalPoints = summary?.totalPoints ?? null;

    const stageId = summary?.stage?.currentStageId;
    const stageProgressPct = summary?.stage?.stageProgressPct ?? null;

    let stageMessage = "Keep practicing to unlock new challenges!";
    if (stageId === 1) stageMessage = "Building foundation skills";
    else if (stageId === 2) stageMessage = "Growing stronger every day";
    else if (stageId === 3) stageMessage = "Making excellent progress";
    else if (stageId === 4) stageMessage = "Mastering advanced concepts";

    const lastUpdatedAt = summary?.lastUpdatedAt?.toMillis?.() ?? null;

    return {
      confidenceNow,
      gamesCompleted,
      avgScore,
      totalPoints,
      stageMessage,
      lastUpdatedAt,
      currentStageId: stageId ?? null,
      stageProgressPct,
    };
  }, [kidSummaryQuery.data]);

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
        {stageSummaries.map((stage) => {
          const colors = getStageColors(stage.order);
          const masteryText = formatMasteryLabel(stage.masteryKey) || "Getting started";
          const ringLabel =
            masteryText === "Getting started" || masteryText === "Not started"
              ? "Start"
              : masteryText === "In progress"
                ? "On it"
                : masteryText;
          const title = stripStagePrefix(stage.label, stage.order);
          const stageHint =
            stage.stageHint ||
            STAGE_HINTS_BY_COURSE[courseId || ""]?.[stage.order] ||
            "";
          const expectations =
            stage.expectations ||
            STAGE_EXPECTATIONS_BY_COURSE[courseId || ""]?.[stage.order] ||
            [];
          const progressPct = typeof stage.progressPct === "number" ? stage.progressPct : 0;

          return (
            <div
              key={`${stage.order}-${stage.label}`}
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
                    Stage {stage.order}
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
                    <span style={{ color: colors.accent }}>{ringLabel}</span>
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
                  <span className="font-semibold text-gray-700">{masteryText}</span>
                </div>
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
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header + child selector */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Hi, {user?.displayName || "Parent"} 👋
                </h1>
                {selectedKid && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Viewing: {selectedKid.fullName || "Child"}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="md:hidden"
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="w-full md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Select Child
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex text-xs"
              >
                Logout
              </Button>
            </div>

            {kidsQuery.isLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Loading kids…
              </div>
            ) : kids.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No kids linked yet.
              </div>
            ) : (
              <>
                <select
                  value={selectedKidId}
                  onChange={(e) => setSelectedKidId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-3"
                >
                  {kids.map((k: any) => (
                    <option key={k.id} value={k.id}>
                      {k.fullName || "Unnamed"}
                    </option>
                  ))}
                </select>

                {/* ✅ Change: Open Kids Portal (not Games portal) */}
                <Button
                  onClick={() =>
                    navigate(`/kids?kidId=${encodeURIComponent(selectedKidId)}`)
                  }
                  disabled={!selectedKidId}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                >
                  Open Kids Portal
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab("insights")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "insights"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Insights
          </button>
          <button
            type="button"
            onClick={() => setTab("games-progress")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "games-progress"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Games Progress
          </button>
          <button
            type="button"
            onClick={() => setTab("skills")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "skills"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Skills
          </button>
          <button
            type="button"
            onClick={() => setTab("classes")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "classes"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Classes
          </button>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "profile"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "payments"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Payments
          </button>
        </div>

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
                      selectedCourse.rows.forEach((row: any) => {
                        const order =
                          typeof row.stageOrder === "number" ? row.stageOrder : 999;
                        const label = row.stageLabel || "Lessons";
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
                          const expectations =
                            STAGE_EXPECTATIONS_BY_COURSE[selectedCourse.courseId]?.[group.order] ?? [];
                          return {
                            label: group.label,
                            order: group.order,
                            masteryKey,
                            focusChips: pickStageFocus(group.rows),
                            progressPct,
                            expectations,
                          };
                        });

                      const showLimit = 10;
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
                      const topicsToShow = curriculumExpanded
                        ? filteredRows
                        : filteredRows.slice(0, showLimit);
                      const showMore = filteredRows.length > showLimit;

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
                            {renderStageGrid(stageSummaries, selectedCourse.courseId)}
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

                            <div className="flex flex-wrap gap-2 text-xs">
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
                            </div>

                            {topicsToShow.length === 0 ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                No lessons match this filter yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {topicsToShow.map((row: any) => {
                                  const masteryText = formatMasteryLabel(row.mastery) || "Getting started";
                                  const masteryLower = String(row.mastery ?? "").toLowerCase().trim();
                                  const masteryStyles =
                                    masteryLower === "mastered"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : masteryLower && masteryLower !== "not_started"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-600";
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
                                      className="text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 hover:border-indigo-300 hover:shadow-sm transition space-y-2"
                                    >
                                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {row.label}
                                      </div>
                                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${masteryStyles}`}>
                                        {masteryText}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {showMore && (
                              <div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCurriculumExpanded((prev) => !prev)}
                                >
                                  {curriculumExpanded
                                    ? "Show less"
                                    : `Show all lessons (${selectedCourse.totalTopics})`}
                                </Button>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">Mastery</span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {formatMasteryLabel(selectedCurriculumTopic.mastery) || "Getting started"}
                      </span>
                    </div>
                    {selectedCurriculumTopic.focusChips?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Focus</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedCurriculumTopic.focusChips.map((chip: string) => (
                            <span
                              key={chip}
                              className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700"
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
                (Progress updates when you reopen this page — no auto-refresh.)
              </p>
            </div>

            {overviewMetrics ? (
              <ParentOverviewCards
                confidenceNow={overviewMetrics.confidenceNow}
                gamesCompleted={overviewMetrics.gamesCompleted}
                avgScore={overviewMetrics.avgScore}
                totalPoints={overviewMetrics.totalPoints}
                stageMessage={overviewMetrics.stageMessage}
                lastUpdatedAt={overviewMetrics.lastUpdatedAt}
                currentStageId={overviewMetrics.currentStageId}
                stageProgressPct={overviewMetrics.stageProgressPct}
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

            {kidSummaryQuery.data?.summary?.recommendedNext && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Today's Recommendation
                </h3>
                <div className="space-y-2">
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {kidSummaryQuery.data.summary.recommendedNext.gameId ||
                      "Practice time!"}
                  </div>
                  {kidSummaryQuery.data.summary.recommendedNext.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {kidSummaryQuery.data.summary.recommendedNext.reason}
                    </p>
                  )}
                  {kidSummaryQuery.data.summary.recommendedNext.estMinutes && (
                    <div className="text-xs text-gray-500">
                      Estimated:{" "}
                      {kidSummaryQuery.data.summary.recommendedNext.estMinutes}{" "}
                      minutes
                    </div>
                  )}
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
                onPracticeClick={(gameId) => handlePracticeClick(gameId)}
                skillTagStats={skillTagStatsQuery.data ?? null}
              />
            )}
          </div>
        )}

        {/* SKILLS TAB - unchanged */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            {(() => {
              const weakTop = kidSummaryQuery.data?.summary?.weakTop ?? [];
              const hasSkillData = weakTop.length > 0;

              const formatTag = (tag: string): string => {
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

              const tagToStage = (tag: string): string => {
                if (!tag) return "Sounds";
                const lower = tag.toLowerCase();

                if (
                  lower.startsWith("letter:") ||
                  lower.startsWith("sound:") ||
                  lower.includes("letter_sounds")
                ) {
                  return "Sounds";
                }
                if (lower.includes("blending") || lower.startsWith("blend:"))
                  return "Blending";
                if (
                  lower.startsWith("cvc:") ||
                  lower.startsWith("word:") ||
                  lower.includes("cvc")
                )
                  return "CVC Words";
                if (
                  lower.startsWith("rule:") ||
                  lower.startsWith("digraph:") ||
                  lower.startsWith("magic-e:") ||
                  lower.startsWith("floss:") ||
                  lower.startsWith("ck:")
                )
                  return "Rules";
                if (
                  lower.startsWith("fluency:") ||
                  lower.startsWith("read:") ||
                  lower.startsWith("speed:")
                )
                  return "Fluency";
                if (
                  lower.startsWith("story:") ||
                  lower.startsWith("sentence:") ||
                  lower.startsWith("comprehension:")
                )
                  return "Confident";
                return "Sounds";
              };

              if (!hasSkillData) {
                return (
                  <Card className="p-8 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                        <span className="text-3xl">📊</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Skills insights are getting ready
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Once your child plays a few levels, you'll see what
                          they're strong at and what needs practice.
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                        onClick={() => setTab("games-progress")}
                      >
                        Play a game
                      </Button>
                    </div>
                  </Card>
                );
              }

              const stageGroups: Record<
                string,
                Array<{ tag: string; wrong: number }>
              > = {};
              weakTop.forEach((skill: { tag?: string; wrong?: number }) => {
                const tag = skill.tag || "";
                const stage = tagToStage(tag);
                if (!stageGroups[stage]) stageGroups[stage] = [];
                stageGroups[stage].push({
                  tag,
                  wrong: typeof skill.wrong === "number" ? skill.wrong : 0,
                });
              });

              const stageInfo: Record<string, { emoji: string; helper: string }> =
                {
                  Sounds: {
                    emoji: "🎵",
                    helper: "Focus on letter sounds and phonemic awareness",
                  },
                  Blending: {
                    emoji: "🔗",
                    helper: "Work on combining sounds smoothly",
                  },
                  "CVC Words": {
                    emoji: "🧩",
                    helper: "Practice simple consonant-vowel-consonant words",
                  },
                  Fluency: {
                    emoji: "⚡",
                    helper: "Build reading speed and accuracy",
                  },
                  Rules: {
                    emoji: "📘",
                    helper: "Master phonics rules and patterns",
                  },
                  Confident: {
                    emoji: "🌟",
                    helper: "Strengthen reading comprehension",
                  },
                };

              const stageOrder = [
                "Sounds",
                "Blending",
                "CVC Words",
                "Fluency",
                "Rules",
                "Confident",
              ];

              return (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Skills
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {selectedKid?.fullName
                      ? `Viewing: ${selectedKid.fullName}`
                      : "Select a child"}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Skills by Stage
                        </h3>

                        <div className="flex items-center gap-3">
                          {skillsViewMode === "scroll" && !skillsScrollAtEnd && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Swipe to see more →
                            </div>
                          )}

                          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                            <button
                              onClick={() => setSkillsViewMode("scroll")}
                              className={`px-3 py-1 text-xs font-medium transition-colors ${
                                skillsViewMode === "scroll"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              Scroll
                            </button>
                            <button
                              onClick={() => setSkillsViewMode("list")}
                              className={`px-3 py-1 text-xs font-medium border-l border-gray-300 dark:border-gray-700 transition-colors ${
                                skillsViewMode === "list"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              List
                            </button>
                          </div>
                        </div>
                      </div>

                      {skillsViewMode === "scroll" ? (
                        <div className="relative">
                          <div
                            ref={skillsScrollContainerRef}
                            className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-2 scrollbar-hide"
                            style={{
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                            }}
                          >
                            {stageOrder.map((stage) => {
                              const skills = stageGroups[stage] || [];
                              const info = stageInfo[stage];
                              const hasSkills = skills.length > 0;
                              const isSelected = selectedSkillStageId === stage;

                              return (
                                <button
                                  key={stage}
                                  onClick={() =>
                                    setSelectedSkillStageId(
                                      isSelected ? null : stage
                                    )
                                  }
                                  className={`flex-shrink-0 min-w-[260px] md:min-w-[300px] p-4 rounded-xl snap-start transition-all ${
                                    isSelected
                                      ? "bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 shadow-lg"
                                      : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`text-3xl flex-shrink-0 ${
                                          !hasSkills ? "opacity-50" : ""
                                        }`}
                                      >
                                        {info?.emoji || "📌"}
                                      </span>
                                      <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                          {stage}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          Stage {stageOrder.indexOf(stage) + 1}{" "}
                                          of 6
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div
                                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                        hasSkills
                                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {hasSkills ? "Has insights" : "No data yet"}
                                    </div>

                                    {hasSkills ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {skills.slice(0, 2).map((skill, idx) => (
                                          <div
                                            key={idx}
                                            className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-200"
                                          >
                                            {formatTag(skill.tag)}
                                          </div>
                                        ))}
                                        {skills.length > 2 && (
                                          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                            +{skills.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Play a few games to unlock insights
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 text-right">
                                    {isSelected ? "▲ Close" : "View"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {!skillsScrollAtEnd && (
                            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {stageOrder.map((stage) => {
                            const skills = stageGroups[stage] || [];
                            const info = stageInfo[stage];
                            const hasSkills = skills.length > 0;
                            const isSelected = selectedSkillStageId === stage;

                            return (
                              <button
                                key={stage}
                                onClick={() =>
                                  setSelectedSkillStageId(
                                    isSelected ? null : stage
                                  )
                                }
                                className={`p-4 rounded-xl transition-all ${
                                  isSelected
                                    ? "bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 shadow-lg"
                                    : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`text-3xl flex-shrink-0 ${
                                        !hasSkills ? "opacity-50" : ""
                                      }`}
                                    >
                                      {info?.emoji || "📌"}
                                    </span>
                                    <div className="text-left">
                                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                        {stage}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Stage {stageOrder.indexOf(stage) + 1} of
                                        6
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                      hasSkills
                                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {hasSkills ? "Has insights" : "No data yet"}
                                  </div>

                                  {hasSkills ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {skills.slice(0, 2).map((skill, idx) => (
                                        <div
                                          key={idx}
                                          className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-200"
                                        >
                                          {formatTag(skill.tag)}
                                        </div>
                                      ))}
                                      {skills.length > 2 && (
                                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                          +{skills.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Play a few games to unlock insights
                                    </p>
                                  )}
                                </div>

                                <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 text-right">
                                  {isSelected ? "▲ Close" : "View"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedSkillStageId && (
                      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-md">
                        {(() => {
                          const skills = stageGroups[selectedSkillStageId] || [];
                          const info = stageInfo[selectedSkillStageId];
                          const hasSkills = skills.length > 0;

                          const formatTag = (tag: string): string => {
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

                          return (
                            <div className="space-y-5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-4xl">
                                    {info?.emoji || "📌"}
                                  </span>
                                  <div>
                                    <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                      {selectedSkillStageId}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {info?.helper || "Practice these skills"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedSkillStageId(null)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                  aria-label="Close"
                                >
                                  <svg
                                    className="w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {hasSkills ? (
                                <>
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                      Needs Practice
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {skills.map((skill, idx) => (
                                        <div
                                          key={`${skill.tag}-${idx}`}
                                          className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-800 dark:text-orange-200"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{formatTag(skill.tag)}</span>
                                            {skill.wrong > 0 && (
                                              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                                                {skill.wrong}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <Button
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                                      onClick={() => setTab("games-progress")}
                                    >
                                      Practice with games
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Play a few games in this stage to unlock
                                    insights.
                                  </p>
                                  <div>
                                    <Button
                                      variant="outline"
                                      className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                      onClick={() => setTab("games-progress")}
                                    >
                                      Practice games
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </Card>
                    )}
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {/* ✅ NEW: CLASSES TAB (Calendar) */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Classes Calendar
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedKid?.fullName
                      ? `Viewing: ${selectedKid.fullName}`
                      : "Select a child"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    (Loads when you open this tab — click Refresh if needed.)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setClassesMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                  >
                    ← Prev
                  </Button>
                  <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {classesMonthLabel}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setClassesMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                  >
                    Next →
                  </Button>

                  <Button
                    onClick={() => kidSessionsQuery.refetch()}
                    disabled={kidSessionsQuery.isFetching}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                  >
                    {kidSessionsQuery.isFetching ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5">
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{classesCounts.total}</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{classesCounts.completed}</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Upcoming</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{classesCounts.upcoming}</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">In progress</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{classesCounts.in_progress}</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Cancelled</div>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">{classesCounts.cancelled}</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">No-show</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{classesCounts.no_show}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((cell) => {
                  const dt = cell.date;
                  if (!dt) {
                    return (
                      <div key={cell.key} className="h-24 rounded-lg bg-transparent" />
                    );
                  }

                  const dayKey = toYMD(dt);
                  const list = sessionsByDay[dayKey] || [];
                  const isToday = dayKey === toYMD(new Date());

                  return (
                    <button
                      key={cell.key}
                      onClick={() => openDay(dayKey)}
                      className={`h-24 rounded-lg border text-left p-2 transition-all hover:shadow-md ${
                        isToday
                          ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {dt.getDate()}
                        </div>
                        {list.length > 0 && (
                          <div className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                            {list.length}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {list.slice(0, 2).map((s) => {
                          const start = sessionStartDate(s);
                          const time =
                            start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : (s.startTime || "—");
                          const st = normalizeStatus(s.status);
                          return (
                            <div key={s.id} className="flex items-center justify-between gap-2">
                              <div className="text-[11px] text-gray-700 dark:text-gray-300 truncate">
                                {time}
                              </div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadgeClass(st)}`}>
                                {statusLabel(st)}
                              </div>
                            </div>
                          );
                        })}

                        {list.length > 2 && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            +{list.length - 2} more
                          </div>
                        )}

                        {list.length === 0 && (
                          <div className="text-[11px] text-gray-400 dark:text-gray-500">
                            —
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Dialog open={classesDayModalOpen} onOpenChange={setClassesDayModalOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {classesSelectedDayKey
                        ? new Date(
                            Number(classesSelectedDayKey.slice(0, 4)),
                            Number(classesSelectedDayKey.slice(5, 7)) - 1,
                            Number(classesSelectedDayKey.slice(8, 10))
                          ).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
                        : "Day"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    {(() => {
                      const key = classesSelectedDayKey || "";
                      const list = (sessionsByDay[key] || []) as KidSession[];

                      if (kidSessionsQuery.isLoading) {
                        return <div className="text-sm text-gray-600 dark:text-gray-400">Loading sessions…</div>;
                      }

                      if (!key || list.length === 0) {
                        return (
                          <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                            No classes scheduled for this day.
                          </div>
                        );
                      }

                      return list.map((s) => {
                        const start = sessionStartDate(s);
                        const time =
                          start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : (s.startTime || "—");
                        const st = normalizeStatus(s.status);
                        const canJoin =
                          !!s.joinUrl &&
                          st !== "completed" &&
                          st !== "cancelled" &&
                          st !== "no_show" &&
                          key === toYMD(new Date());

                        return (
                          <div key={s.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {time}{" "}
                                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(st)}`}>
                                    {statusLabel(st)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {s.courseName ? `Course: ${s.courseName}` : "Course: —"}
                                  {s.teacherName ? ` • Teacher: ${s.teacherName}` : ""}
                                </div>
                                {s.notes && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Notes: {String(s.notes)}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                {canJoin ? (
                                  <Button
                                    onClick={() => window.open(String(s.joinUrl), "_blank")}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                                  >
                                    Join Zoom
                                  </Button>
                                ) : (
                                  <Button variant="outline" disabled className="opacity-70">
                                    {s.joinUrl ? "Join (today only)" : "No Join link"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <Button variant="outline" onClick={() => setClassesDayModalOpen(false)} className="w-full mt-2">
                    Close
                  </Button>
                </DialogContent>
              </Dialog>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Fees & Dues
                </div>
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
              </div>
            </Card>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Profile
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName
                  ? `Viewing: ${selectedKid.fullName}`
                  : "Select a child"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
          </div>
        )}

        {/* PAYMENTS TAB - unchanged */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {(() => {
              const membership = selectedKid?.membership;
              const startDate = membership?.startDate?.toDate?.() || null;
              const endDate = membership?.endDate?.toDate?.() || null;
              const today = new Date();
              const isActive = endDate && today <= endDate;

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
                    membershipStartDate: startDate,
                    membershipEndDate: endDate,
                    createdAt: serverTimestamp(),
                    status: "pending",
                  });
                } catch (error) {
                  console.error("Failed to create payment confirmation:", error);
                }

                const childName = selectedKid?.fullName || "my child";
                const startStr = startDate
                  ? startDate.toLocaleDateString("en-IN")
                  : "N/A";
                const endStr = endDate
                  ? endDate.toLocaleDateString("en-IN")
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
                              Start Date
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {startDate
                                ? startDate.toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              End Date
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {endDate
                                ? endDate.toLocaleDateString("en-IN")
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
    </div>
  );
}
