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
  query,
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

type TabKey =
  | "dashboard"
  | "games-progress"
  | "skills"
  | "weekly"
  | "classes"
  | "profile"
  | "payments";

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = [
    "dashboard",
    "games-progress",
    "skills",
    "weekly",
    "classes",
    "profile",
    "payments",
  ];
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
  status?: string;
  createdAt?: any;
  currency?: string;
  [key: string]: any;
};

type Enrollment = {
  id: string;
  courseId?: string;
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

const phonicsLabelsByCourseId: Record<string, string> = {
  "phonics-foundations": "Phonics Foundations",
  "early-phonics": "Early Phonics",
  "advanced-phonics": "Advanced Phonics",
};

const phonicsTotalsByCourseId: Record<string, number> = {
  "phonics-foundations": 30,
  "early-phonics": 41,
  "advanced-phonics": 20,
};

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

  useEffect(() => {
    if (!selectedKidId && kids.length > 0) setSelectedKidId(kids[0].id);
  }, [kids, selectedKidId]);

  const selectedKid = useMemo(
    () => kids.find((k: any) => k.id === selectedKidId),
    [kids, selectedKidId]
  );

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
    queryKey: ["kidEnrollments", selectedKidId],
    enabled: !!selectedKidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async (): Promise<Enrollment[]> => {
      if (!selectedKidId) return [];
      const enrollmentsCol = collection(db, "enrollments");
      const results = new Map<string, Enrollment>();

      const queries = [
        query(enrollmentsCol, where("studentId", "==", selectedKidId)),
        query(enrollmentsCol, where("kidId", "==", selectedKidId)),
        query(enrollmentsCol, where("kidIds", "array-contains", selectedKidId)),
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
    queryKey: ["phonicsProgress", selectedKidId],
    enabled: !!selectedKidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!selectedKidId) return [];
      try {
        const snap = await getDocs(
          collection(db, "students", selectedKidId, "progress")
        );
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } catch (err: any) {
        console.error("❌ [ParentDashboard] Progress query error:", err);
        throw err;
      }
    },
  });

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

  const phonicsProgressByCourse = useMemo(() => {
    const records = (phonicsProgressQuery.data ?? []) as any[];
    const courseIdsToShow = PHONICS_COURSE_IDS.filter((id) =>
      phonicsEnrollments.some((enr) => String(enr.courseId || "") === id)
    );

    if (courseIdsToShow.length === 0) return [];

    const getMastered = (doc: any): boolean => {
      const mastery = String(doc.mastery ?? "").toLowerCase();
      if (mastery === "proficient" || mastery === "mastered") return true;
      const scoreBand = Number(doc.scoreBand);
      if (Number.isFinite(scoreBand) && scoreBand >= 81) return true;
      return false;
    };

    return courseIdsToShow.map((courseId) => {
      const items = records.filter(
        (doc) => String(doc.courseId || "") === courseId
      );

      const sorted = items
        .slice()
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() ?? 0;
          const bTime = b.updatedAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

      const last = sorted[0];
      const mastered = items.filter(getMastered).length;

      return {
        courseId,
        courseLabel: phonicsLabelsByCourseId[courseId] || courseId,
        topicsUpdated: items.length,
        totalTopics: phonicsTotalsByCourseId[courseId],
        mastered,
        lastTopic: last?.topicName || "—",
        lastRemark: last?.teacherRemark || "—",
      };
    });
  }, [phonicsProgressQuery.data, phonicsEnrollments]);

  const phonicsLoading =
    phonicsProgressQuery.isLoading || enrollmentsQuery.isLoading;
  const phonicsError =
    phonicsProgressQuery.isError || enrollmentsQuery.isError;
  const phonicsErrorMessage = useMemo(() => {
    const err =
      (phonicsProgressQuery.error as any) ||
      (enrollmentsQuery.error as any);
    const msg = String(err?.message ?? '').toLowerCase();
    if (msg.includes('permission') || msg.includes('insufficient')) {
      return 'Access issue — please contact admin.';
    }
    return 'Unable to load progress right now.';
  }, [phonicsProgressQuery.error, enrollmentsQuery.error]);

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
    enabled: !!selectedKidId && (activeTab === "classes" || activeTab === "payments"),
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

      const sessionsCol = collection(db, "sessions");

      try {
        // Primary: sessions.kidIds array contains kid AND parentId matches current user
        const qA = query(
          sessionsCol,
          where("kidIds", "array-contains", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapA = await getDocs(qA);
        console.log("✅ [Query A] kidIds array-contains + parentId:", {
          count: snapA.size,
          docs: snapA.docs.map(d => ({ id: d.id, parentId: d.data().parentId, kidIds: d.data().kidIds }))
        });

        // Fallback: sessions.kidId == kid (older schema) AND parentId matches
        const qB = query(
          sessionsCol,
          where("kidId", "==", selectedKidId),
          where("parentId", "==", user.uid)
        );
        const snapB = await getDocs(qB);
        console.log("✅ [Query B] kidId equality + parentId:", {
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
      if (!isPaid) return sum;
      const rawAmount = Number(charge.amount ?? 0);
      const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
      return sum + amount;
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
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === "weekly"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            }`}
          >
            Weekly
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

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Phonics Progress
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Course-wise progress for {selectedKid?.fullName || "your child"}.
                </p>
              </div>

              {phonicsLoading && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading progress…
                </p>
              )}

              {phonicsError && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {phonicsErrorMessage}
                </p>
              )}

              {!phonicsLoading &&
                !phonicsError &&
                phonicsProgressByCourse.length === 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {phonicsEnrollments.length === 0
                      ? "No phonics enrollment yet."
                      : "No progress updates yet. Once the teacher marks topics as covered, you’ll see progress here."}
                  </p>
                )}

              {!phonicsLoading &&
                !phonicsError &&
                phonicsProgressByCourse.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {phonicsProgressByCourse.map((course) => (
                      <Card
                        key={course.courseId}
                        className="p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {course.courseLabel}
                        </h4>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Topics updated</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {course.topicsUpdated}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Mastered topics</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {course.mastered}
                            </div>
                          </div>
                        </div>
                        {Number.isFinite(course.totalTopics) && (
                          <div className="mt-3 text-xs text-gray-500">
                            Updated: {course.topicsUpdated} / Total: {course.totalTopics}
                          </div>
                        )}
                        <div className="mt-3 text-xs text-gray-500">Last updated topic</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                          {course.lastTopic || "—"}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Last remark</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                          {course.lastRemark || "—"}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
            </Card>
          </div>
        )}

        {activeTab === "games-progress" && (
          <div className="space-y-4">
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

        {/* WEEKLY TAB - unchanged */}
        {activeTab === "weekly" && (
          <div className="space-y-4">
            {/* (existing weekly content left as-is in your file) */}
            {/** Keeping your existing weekly implementation untouched */}
            {/** ... */}
            {/* NOTE: You already pasted full weekly earlier; keep it exactly same in your repo */}
            {/** If you want, I can re-paste your full weekly block too, but it’s unchanged */}
            {/** For safety, leave your existing Weekly block as you pasted earlier */}
            {/** */}
            {(() => {
              const summary = kidSummaryQuery.data?.summary;
              const weeklyData = summary?.weekly || null;
              const currentStage = summary?.stage?.currentStageId || 1;
              const weakTop = summary?.weakTop || [];

              const gamesPlayed =
                weeklyData?.gamesPlayed ?? summary?.gamesPlayed ?? null;
              const levelsCompleted = weeklyData?.levelsCompleted ?? null;
              const avgAccuracy =
                weeklyData?.avgAccuracy ?? summary?.avgAccuracy ?? null;
              const totalPoints =
                weeklyData?.totalPoints ?? summary?.totalPoints ?? null;

              const dailyActivity = weeklyData?.dailyActivity || [];
              const hasActivityData = dailyActivity.length > 0;

              const stageNames: Record<number, string> = {
                1: "Stage 1: Sounds",
                2: "Stage 2: Blending",
                3: "Stage 3: CVC Words",
                4: "Stage 4: Fluency",
                5: "Stage 5: Rules",
                6: "Stage 6: Confident Reader",
              };
              const stageName = stageNames[currentStage] || "Stage 1: Sounds";

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
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Weekly
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {selectedKid?.fullName
                        ? `Viewing: ${selectedKid.fullName}`
                        : "Select a child"}
                    </p>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Weekly Snapshot
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Games Played
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {gamesPlayed !== null ? gamesPlayed : "—"}
                          </div>
                          {gamesPlayed === null && (
                            <div className="text-xs text-gray-400 mt-1">
                              No data yet
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Levels Done
                          </div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {levelsCompleted !== null ? levelsCompleted : "—"}
                          </div>
                          {levelsCompleted === null && (
                            <div className="text-xs text-gray-400 mt-1">
                              No data yet
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Avg Accuracy
                          </div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {avgAccuracy !== null
                              ? `${Math.round(avgAccuracy)}%`
                              : "—"}
                          </div>
                          {avgAccuracy === null && (
                            <div className="text-xs text-gray-400 mt-1">
                              No data yet
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Total Points
                          </div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {totalPoints !== null ? totalPoints : "—"}
                          </div>
                          {totalPoints === null && (
                            <div className="text-xs text-gray-400 mt-1">
                              No data yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Weekly Activity
                      </h3>
                      {hasActivityData ? (
                        <div className="flex justify-between gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                            (day, idx) => {
                              const dayData = dailyActivity[idx] || {
                                levels: 0,
                              };
                              const levels = dayData.levels || 0;
                              const maxLevels = 10;
                              const heightPct = Math.min(
                                (levels / maxLevels) * 100,
                                100
                              );

                              return (
                                <div
                                  key={day}
                                  className="flex-1 flex flex-col items-center"
                                >
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {day}
                                  </div>
                                  <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-t relative">
                                    <div
                                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t transition-all"
                                      style={{ height: `${heightPct}%` }}
                                    />
                                  </div>
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                                    {levels}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Play a game to start your weekly report
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTab("games-progress")}
                          >
                            Browse Games
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      This Week&apos;s Focus
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Current Stage
                        </div>
                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                          {stageName}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Goal
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Play 3 short games (10 mins/day)
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                        onClick={() => setTab("games-progress")}
                      >
                        Start practice
                      </Button>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        🎉 Wins
                      </h3>
                      <ul className="space-y-2">
                        {gamesPlayed && gamesPlayed > 0 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                                ✓
                              </span>
                              <span>
                                Played {gamesPlayed} game
                                {gamesPlayed > 1 ? "s" : ""} this week
                              </span>
                            </li>
                            {levelsCompleted && levelsCompleted > 0 && (
                              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                                  ✓
                                </span>
                                <span>
                                  Completed {levelsCompleted} level
                                  {levelsCompleted > 1 ? "s" : ""}
                                </span>
                              </li>
                            )}
                            {avgAccuracy && avgAccuracy >= 70 && (
                              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                                  ✓
                                </span>
                                <span>
                                  Great accuracy at {Math.round(avgAccuracy)}%
                                </span>
                              </li>
                            )}
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                                ✓
                              </span>
                              <span>Ready to start the journey</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                                ✓
                              </span>
                              <span>All games unlocked and ready</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        📝 Needs Practice
                      </h3>
                      {weakTop.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {weakTop.slice(0, 3).map(
                            (
                              skill: { tag?: string; wrong?: number },
                              idx: number
                            ) => {
                              const tag = skill.tag || "—";
                              const wrong =
                                typeof skill.wrong === "number"
                                  ? skill.wrong
                                  : 0;
                              return (
                                <div
                                  key={`${tag}-${idx}`}
                                  className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-800 dark:text-orange-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{formatTag(tag)}</span>
                                    {wrong > 0 && (
                                      <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                                        {wrong}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Play more games to see areas for improvement
                        </p>
                      )}
                    </Card>
                  </div>
                </>
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
