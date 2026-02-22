import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type WeeklyReport = {
  studentId: string;
  courseId: string;
  weekKey: string;
  weekStartAt: number;
  weekEndAt: number;
  sessionsPlanned: number;
  sessionsAttended: number;
  scores: {
    overall: number;
    consistency: number;
    understanding: number;
    confidence: number;
  };
  covered: string[];
  wins: string[];
  focusAreas: string[];
  nextWeekPlan: string[];
  homePractice: {
    quickRevision: string;
    focusedSkill: string;
    confidenceBooster: string;
  };
  teacherNote?: string;
  status: "draft" | "published";
  updatedBy: string;
  updatedAt: number;
};

const IST_OFFSET_MINUTES = 330;

export function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function makeReportId(courseId: string, weekKey: string): string {
  return `${courseId}__${weekKey}`;
}

function getISOWeekFromIST(istDate: Date) {
  const d = new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { isoYear, isoWeek: weekNo };
}

export function buildWeekKeyForIST(date = new Date()) {
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const istMillis = date.getTime() + offsetMs;
  const istDate = new Date(istMillis);
  const day = (istDate.getUTCDay() + 6) % 7;
  const weekStartAt = Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate() - day,
  ) - offsetMs;
  const weekEndAt = weekStartAt + 7 * 24 * 60 * 60 * 1000 - 1;
  const { isoYear, isoWeek } = getISOWeekFromIST(istDate);
  const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
  return { weekKey, weekStartAt, weekEndAt };
}

export async function saveWeeklyReport(studentId: string, report: WeeklyReport): Promise<void> {
  const reportId = makeReportId(report.courseId, report.weekKey);
  const ref = doc(db, "students", studentId, "weeklyReports", reportId);
  await setDoc(ref, report, { merge: true });
}

export async function fetchPublishedWeeklyReports(
  studentId: string,
  courseId?: string,
): Promise<WeeklyReport[]> {
  const base = collection(db, "students", studentId, "weeklyReports");
  const q = courseId
    ? query(base, where("status", "==", "published"), where("courseId", "==", courseId), orderBy("weekStartAt", "desc"))
    : query(base, where("status", "==", "published"), orderBy("weekStartAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WeeklyReport);
}

export async function fetchTeacherWeeklyReport(
  studentId: string,
  courseId: string,
  weekKey: string,
): Promise<WeeklyReport | null> {
  const reportId = makeReportId(courseId, weekKey);
  const ref = doc(db, "students", studentId, "weeklyReports", reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WeeklyReport;
}
