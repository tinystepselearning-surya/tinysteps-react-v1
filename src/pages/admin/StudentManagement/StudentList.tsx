import React, { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  collection,
  collectionGroup,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import AssignCourseModal from './AssignCourseModal';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
import { Student } from '../../../types/Student';
import { useEnrollmentsForStudents } from '../../../hooks/useData';
import { User } from '../../../types/User';
import { useAuthStore } from '../../../store/useAuthStore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';

const PAGE_SIZE = 25;

const getClassSessionsCollection = () => collection(db, 'classSessions');

const COURSE_CATALOG_SYNC = [
  { id: 'phonics-foundations', title: 'Phonics Foundations', area: 'phonics', level: 'foundations' },
  { id: 'early-phonics', title: 'Early Phonics', area: 'phonics', level: 'early' },
  { id: 'advanced-phonics', title: 'Advanced Phonics', area: 'phonics', level: 'advanced' },
  { id: 'basic-grammar', title: 'Basic Grammar', area: 'grammar', level: 'basic' },
  { id: 'intermediate-grammar', title: 'Intermediate Grammar', area: 'grammar', level: 'intermediate' },
  { id: 'advanced-grammar', title: 'Advanced Grammar', area: 'grammar', level: 'advanced' },
  { id: 'basic-public-speaking', title: 'Public Speaking (Basic)', area: 'speaking', level: 'basic' },
  { id: 'intermediate-public-speaking', title: 'Public Speaking (Intermediate)', area: 'speaking', level: 'intermediate' },
  { id: 'advanced-public-speaking', title: 'Public Speaking (Advanced)', area: 'speaking', level: 'advanced' },
];

const buildDisplayTitleMap = (courseId: string, titles: string[]) =>
  titles.reduce<Record<string, string>>((acc, title, idx) => {
    const key = `${courseId}__lesson-${String(idx + 1).padStart(2, '0')}`;
    acc[key] = title;
    return acc;
  }, {});

const PHONICS_FOUNDATIONS_TITLES = [
  'Lesson 1 — Letter sound: /s/',
  'Lesson 2 — Letter sound: /a/',
  'Lesson 3 — Letter sound: /t/',
  'Lesson 4 — Letter sound: /i/',
  'Lesson 5 — Letter sound: /p/',
  'Lesson 6 — Letter sound: /n/',
  'Lesson 7 — Letter sound: /c/',
  'Lesson 8 — Letter sound: /k/',
  'Lesson 9 — Letter sound: /e/',
  'Lesson 10 — Letter sound: /h/',
  'Lesson 11 — Letter sound: /r/',
  'Lesson 12 — Letter sound: /m/',
  'Lesson 13 — Letter sound: /d/',
  'Lesson 14 — Letter sound: /g/',
  'Lesson 15 — Letter sound: /o/',
  'Lesson 16 — Letter sound: /u/',
  'Lesson 17 — Letter sound: /l/',
  'Lesson 18 — Letter sound: /f/',
  'Lesson 19 — Letter sound: /b/',
  'Lesson 20 — Letter sound: /j/',
  'Lesson 21 — Letter sound: /z/',
  'Lesson 22 — Letter sound: /w/',
  'Lesson 23 — Letter sound: /v/',
  'Lesson 24 — Letter sound: /y/',
  'Lesson 25 — Letter sound: /x/',
  'Lesson 26 — Letter sound: /qu/',
  'Lesson 27 — Short vowels: a e i o u',
  'Lesson 28 — Review: all letter sounds',
  'Lesson 29 — Revision',
  'Lesson 30 — Revision',
];

const EARLY_PHONICS_TITLES = [
  'Lesson 1 — Sound Set 1: /s/ /a/ /t/',
  'Lesson 2 — Sound Set 2: /i/ /p/ /n/',
  'Lesson 3 — Hard /k/ sound: c & k',
  'Lesson 4 — Sound Set 3: /e/ /h/ /r/',
  'Lesson 5 — Sound Set 4: /m/ /d/ /g/',
  'Lesson 6 — Sound Set 5: /o/ /u/ /l/',
  'Lesson 7 — Sound Set 6: /f/ /b/ /j/',
  'Lesson 8 — Sound Set 7: /z/ /w/ /v/',
  'Lesson 9 — Special letters: y, x, qu',
  'Lesson 10 — Short vowels: a, e, i, o, u',
  'Lesson 11 — Digraph: sh (/sh/)',
  'Lesson 12 — Digraph: ch + spelling: tch',
  'Lesson 13 — Digraph: th (voiced & unvoiced)',
  'Lesson 14 — Ending Rule: ck says /k/',
  'Lesson 15 — End patterns: ng + silent b (mb)',
  'Lesson 16 — Silent letters: kn = /n/',
  'Lesson 17 — Silent letters: wr = /r/',
  'Lesson 18 — Digraph: wh (/w/)',
  'Lesson 19 — Tricky patterns: ph=/f/, gh (silent or /f/)',
  'Lesson 20 — Revision: digraphs + tricky patterns',
  'Lesson 21 — Floss Rule: double f/l/s after short vowel',
  'Lesson 22 — Long A: ai (/ā/)',
  'Lesson 23 — Long E: ee (/ē/)',
  'Lesson 24 — Vowel team: ea (/ē/)',
  'Lesson 25 — Vowel team: ie (/ī/)',
  'Lesson 26 — Long O: oa (/ō/)',
  'Lesson 27 — OO sounds: /oo/ vs /ʊ/',
  'Lesson 28 — Long O: oe (/ō/)',
  'Lesson 29 — Long U spelling: ui (fruit sound)',
  'Lesson 30 — Long U spelling: ue (blue sound)',
  'Lesson 31 — Long I: igh (/ī/)',
  'Lesson 32 — Magic E: a_e (/ā/)',
  'Lesson 33 — Magic E: e_e (/ē/)',
  'Lesson 34 — Magic E: i_e (/ī/)',
  'Lesson 35 — Magic E: o_e (/ō/)',
  'Lesson 36 — Magic E: u_e (/yoo/ or /oo/)',
  'Lesson 37 — Rabbit Rule: double consonant in 2-syllable words',
  'Lesson 38 — Monster-le: consonant + le ending',
  'Lesson 39 — Soft C: c says /s/ (before e/i/y)',
  'Lesson 40 — Hard G: g says /g/',
  'Lesson 41 — Final revision + reading check',
];

const ADVANCED_PHONICS_TITLES = [
  'Lesson 1 — Diphthongs: ai / ay',
  'Lesson 2 — Diphthongs: oi / oy',
  'Lesson 3 — Diphthongs: ou / ow',
  'Lesson 4 — Diphthongs: au / aw',
  'Lesson 5 — Bossy R: ar',
  'Lesson 6 — Bossy R: or',
  'Lesson 7 — Bossy R: ir / ur / er',
  'Lesson 8 — Three J sounds',
  'Lesson 9 — /shun/ endings',
  'Lesson 10 — Silent letters',
  'Lesson 11 — Alternate A',
  'Lesson 12 — Alternate E',
  'Lesson 13 — Alternate I',
  'Lesson 14 — Alternate O',
  'Lesson 15 — Alternate U',
  'Lesson 16 — Ending rule: c / ct sound',
  'Lesson 17 — Revision',
  'Lesson 18 — Revision',
  'Lesson 19 — Revision',
  'Lesson 20 — Revision',
];

const PHONICS_DISPLAY_TITLES = {
  ...buildDisplayTitleMap('phonics-foundations', PHONICS_FOUNDATIONS_TITLES),
  ...buildDisplayTitleMap('early-phonics', EARLY_PHONICS_TITLES),
  ...buildDisplayTitleMap('advanced-phonics', ADVANCED_PHONICS_TITLES),
};

const PHONICS_CURRICULUM_TOPICS = [
  { id: 'phonics-foundations__lesson-01', courseId: 'phonics-foundations', lesson: 'Lesson-1', label: 's' },
  { id: 'phonics-foundations__lesson-02', courseId: 'phonics-foundations', lesson: 'Lesson-2', label: 'a' },
  { id: 'phonics-foundations__lesson-03', courseId: 'phonics-foundations', lesson: 'Lesson-3', label: 't' },
  { id: 'phonics-foundations__lesson-04', courseId: 'phonics-foundations', lesson: 'Lesson-4', label: 'i' },
  { id: 'phonics-foundations__lesson-05', courseId: 'phonics-foundations', lesson: 'Lesson-5', label: 'p' },
  { id: 'phonics-foundations__lesson-06', courseId: 'phonics-foundations', lesson: 'Lesson-6', label: 'n' },
  { id: 'phonics-foundations__lesson-07', courseId: 'phonics-foundations', lesson: 'Lesson-7', label: 'c' },
  { id: 'phonics-foundations__lesson-08', courseId: 'phonics-foundations', lesson: 'Lesson-8', label: 'k' },
  { id: 'phonics-foundations__lesson-09', courseId: 'phonics-foundations', lesson: 'Lesson-9', label: 'e' },
  { id: 'phonics-foundations__lesson-10', courseId: 'phonics-foundations', lesson: 'Lesson-10', label: 'h' },
  { id: 'phonics-foundations__lesson-11', courseId: 'phonics-foundations', lesson: 'Lesson-11', label: 'r' },
  { id: 'phonics-foundations__lesson-12', courseId: 'phonics-foundations', lesson: 'Lesson-12', label: 'm' },
  { id: 'phonics-foundations__lesson-13', courseId: 'phonics-foundations', lesson: 'Lesson-13', label: 'd' },
  { id: 'phonics-foundations__lesson-14', courseId: 'phonics-foundations', lesson: 'Lesson-14', label: 'g' },
  { id: 'phonics-foundations__lesson-15', courseId: 'phonics-foundations', lesson: 'Lesson-15', label: 'o' },
  { id: 'phonics-foundations__lesson-16', courseId: 'phonics-foundations', lesson: 'Lesson-16', label: 'u' },
  { id: 'phonics-foundations__lesson-17', courseId: 'phonics-foundations', lesson: 'Lesson-17', label: 'l' },
  { id: 'phonics-foundations__lesson-18', courseId: 'phonics-foundations', lesson: 'Lesson-18', label: 'f' },
  { id: 'phonics-foundations__lesson-19', courseId: 'phonics-foundations', lesson: 'Lesson-19', label: 'b' },
  { id: 'phonics-foundations__lesson-20', courseId: 'phonics-foundations', lesson: 'Lesson-20', label: 'j' },
  { id: 'phonics-foundations__lesson-21', courseId: 'phonics-foundations', lesson: 'Lesson-21', label: 'z' },
  { id: 'phonics-foundations__lesson-22', courseId: 'phonics-foundations', lesson: 'Lesson-22', label: 'w' },
  { id: 'phonics-foundations__lesson-23', courseId: 'phonics-foundations', lesson: 'Lesson-23', label: 'v' },
  { id: 'phonics-foundations__lesson-24', courseId: 'phonics-foundations', lesson: 'Lesson-24', label: 'y' },
  { id: 'phonics-foundations__lesson-25', courseId: 'phonics-foundations', lesson: 'Lesson-25', label: 'x' },
  { id: 'phonics-foundations__lesson-26', courseId: 'phonics-foundations', lesson: 'Lesson-26', label: 'q' },
  { id: 'phonics-foundations__lesson-27', courseId: 'phonics-foundations', lesson: 'Lesson-27', label: 'a e i o u' },
  { id: 'phonics-foundations__lesson-28', courseId: 'phonics-foundations', lesson: 'Lesson-28', label: 'all letter sounds' },
  { id: 'phonics-foundations__lesson-29', courseId: 'phonics-foundations', lesson: 'Lesson-29', label: 'revision' },
  { id: 'phonics-foundations__lesson-30', courseId: 'phonics-foundations', lesson: 'Lesson-30', label: 'revision' },
  { id: 'early-phonics__lesson-01', courseId: 'early-phonics', lesson: 'Lesson-1', label: 's a t' },
  { id: 'early-phonics__lesson-02', courseId: 'early-phonics', lesson: 'Lesson-2', label: 'i p n' },
  { id: 'early-phonics__lesson-03', courseId: 'early-phonics', lesson: 'Lesson-3', label: 'c and k' },
  { id: 'early-phonics__lesson-04', courseId: 'early-phonics', lesson: 'Lesson-4', label: 'e  h  r' },
  { id: 'early-phonics__lesson-05', courseId: 'early-phonics', lesson: 'Lesson-5', label: 'm d g' },
  { id: 'early-phonics__lesson-06', courseId: 'early-phonics', lesson: 'Lesson-6', label: 'o u l' },
  { id: 'early-phonics__lesson-07', courseId: 'early-phonics', lesson: 'Lesson-7', label: 'f b j' },
  { id: 'early-phonics__lesson-08', courseId: 'early-phonics', lesson: 'Lesson-8', label: 'z w v' },
  { id: 'early-phonics__lesson-09', courseId: 'early-phonics', lesson: 'Lesson-9', label: 'y x q' },
  { id: 'early-phonics__lesson-10', courseId: 'early-phonics', lesson: 'Lesson-10', label: 'short vowels' },
  { id: 'early-phonics__lesson-11', courseId: 'early-phonics', lesson: 'Lesson-11', label: 'sh' },
  { id: 'early-phonics__lesson-12', courseId: 'early-phonics', lesson: 'Lesson-12', label: 'ch, tch' },
  { id: 'early-phonics__lesson-13', courseId: 'early-phonics', lesson: 'Lesson-13', label: 'th, TH' },
  { id: 'early-phonics__lesson-14', courseId: 'early-phonics', lesson: 'Lesson-14', label: 'ck' },
  { id: 'early-phonics__lesson-15', courseId: 'early-phonics', lesson: 'Lesson-15', label: 'ng, mb' },
  { id: 'early-phonics__lesson-16', courseId: 'early-phonics', lesson: 'Lesson-16', label: 'kn' },
  { id: 'early-phonics__lesson-17', courseId: 'early-phonics', lesson: 'Lesson-17', label: 'wr' },
  { id: 'early-phonics__lesson-18', courseId: 'early-phonics', lesson: 'Lesson-18', label: 'wh' },
  { id: 'early-phonics__lesson-19', courseId: 'early-phonics', lesson: 'Lesson-19', label: 'ph, gh' },
  { id: 'early-phonics__lesson-20', courseId: 'early-phonics', lesson: 'Lesson-20', label: 'revision of digraphs' },
  { id: 'early-phonics__lesson-21', courseId: 'early-phonics', lesson: 'Lesson-21', label: 'Floss rule' },
  { id: 'early-phonics__lesson-22', courseId: 'early-phonics', lesson: 'Lesson-22', label: 'ai' },
  { id: 'early-phonics__lesson-23', courseId: 'early-phonics', lesson: 'Lesson-23', label: 'ee' },
  { id: 'early-phonics__lesson-24', courseId: 'early-phonics', lesson: 'Lesson-24', label: 'ea' },
  { id: 'early-phonics__lesson-25', courseId: 'early-phonics', lesson: 'Lesson-25', label: 'ie' },
  { id: 'early-phonics__lesson-26', courseId: 'early-phonics', lesson: 'Lesson-26', label: 'oa' },
  { id: 'early-phonics__lesson-27', courseId: 'early-phonics', lesson: 'Lesson-27', label: 'oo' },
  { id: 'early-phonics__lesson-28', courseId: 'early-phonics', lesson: 'Lesson-28', label: 'oe' },
  { id: 'early-phonics__lesson-29', courseId: 'early-phonics', lesson: 'Lesson-29', label: 'oo-ui' },
  { id: 'early-phonics__lesson-30', courseId: 'early-phonics', lesson: 'Lesson-30', label: 'oo-ue' },
  { id: 'early-phonics__lesson-31', courseId: 'early-phonics', lesson: 'Lesson-31', label: 'igh' },
  { id: 'early-phonics__lesson-32', courseId: 'early-phonics', lesson: 'Lesson-32', label: 'a_e' },
  { id: 'early-phonics__lesson-33', courseId: 'early-phonics', lesson: 'Lesson-33', label: 'e_e' },
  { id: 'early-phonics__lesson-34', courseId: 'early-phonics', lesson: 'Lesson-34', label: 'i_e' },
  { id: 'early-phonics__lesson-35', courseId: 'early-phonics', lesson: 'Lesson-35', label: 'o_e' },
  { id: 'early-phonics__lesson-36', courseId: 'early-phonics', lesson: 'Lesson-36', label: 'u_e' },
  { id: 'early-phonics__lesson-37', courseId: 'early-phonics', lesson: 'Lesson-37', label: 'Rabbit rule' },
  { id: 'early-phonics__lesson-38', courseId: 'early-phonics', lesson: 'Lesson-38', label: 'monster le' },
  { id: 'early-phonics__lesson-39', courseId: 'early-phonics', lesson: 'Lesson-39', label: 'soft c' },
  { id: 'early-phonics__lesson-40', courseId: 'early-phonics', lesson: 'Lesson-40', label: 'hard g' },
  { id: 'early-phonics__lesson-41', courseId: 'early-phonics', lesson: 'Lesson-41', label: 'Revision' },
  { id: 'advanced-phonics__lesson-01', courseId: 'advanced-phonics', lesson: 'Lesson-1', label: 'ai, ay' },
  { id: 'advanced-phonics__lesson-02', courseId: 'advanced-phonics', lesson: 'Lesson-2', label: 'oi, oy' },
  { id: 'advanced-phonics__lesson-03', courseId: 'advanced-phonics', lesson: 'Lesson-3', label: 'ou, ow' },
  { id: 'advanced-phonics__lesson-04', courseId: 'advanced-phonics', lesson: 'Lesson-4', label: 'au, aw' },
  { id: 'advanced-phonics__lesson-05', courseId: 'advanced-phonics', lesson: 'Lesson-5', label: 'bossy ar' },
  { id: 'advanced-phonics__lesson-06', courseId: 'advanced-phonics', lesson: 'Lesson-6', label: 'bossy or' },
  { id: 'advanced-phonics__lesson-07', courseId: 'advanced-phonics', lesson: 'Lesson-7', label: 'ir, ur, er' },
  { id: 'advanced-phonics__lesson-08', courseId: 'advanced-phonics', lesson: 'Lesson-8', label: '3  j sounds' },
  { id: 'advanced-phonics__lesson-09', courseId: 'advanced-phonics', lesson: 'Lesson-9', label: 'shun sounds' },
  { id: 'advanced-phonics__lesson-10', courseId: 'advanced-phonics', lesson: 'Lesson-10', label: 'silent letters' },
  { id: 'advanced-phonics__lesson-11', courseId: 'advanced-phonics', lesson: 'Lesson-11', label: 'alternate a' },
  { id: 'advanced-phonics__lesson-12', courseId: 'advanced-phonics', lesson: 'Lesson-12', label: 'alternate e' },
  { id: 'advanced-phonics__lesson-13', courseId: 'advanced-phonics', lesson: 'Lesson-13', label: 'alternate i' },
  { id: 'advanced-phonics__lesson-14', courseId: 'advanced-phonics', lesson: 'Lesson-14', label: 'alternate o' },
  { id: 'advanced-phonics__lesson-15', courseId: 'advanced-phonics', lesson: 'Lesson-15', label: 'alternate u' },
  { id: 'advanced-phonics__lesson-16', courseId: 'advanced-phonics', lesson: 'Lesson-16', label: 'c at the end, ct sound' },
  { id: 'advanced-phonics__lesson-17', courseId: 'advanced-phonics', lesson: 'Lesson-17', label: 'revision' },
  { id: 'advanced-phonics__lesson-18', courseId: 'advanced-phonics', lesson: 'Lesson-18', label: 'revision' },
  { id: 'advanced-phonics__lesson-19', courseId: 'advanced-phonics', lesson: 'Lesson-19', label: 'revision' },
  { id: 'advanced-phonics__lesson-20', courseId: 'advanced-phonics', lesson: 'Lesson-20', label: 'revision' },
].map((topic) => ({
  ...topic,
  displayTitle: PHONICS_DISPLAY_TITLES[topic.id] ?? `${topic.lesson} — ${topic.label}`,
}));

interface StudentListProps {
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onAssignCourse: (student: Student) => void;
}

type EnrollmentLite = {
  id: string;
  status?: string;
  courseId?: string;
  course?: { title?: string };
  teacherId?: string;
  teacher?: { name?: string; email?: string; uid?: string; id?: string };
  parentId?: string;
  parentIds?: string[];
  feePerClass?: number;
  currency?: string;
  joinUrl?: string;
  schedule?: {
    timezone?: string;
    weekdays?: number[];
    timeHHmm?: string;
    durationMins?: number;
  };
  startDate?: any; // Timestamp
};

type SessionRequestRow = {
  id: string;
  path: string;
  teacherId: string;
  kidId: string;
  startAt: Date;
  endAt: Date;
  durationMins: number;
  note?: string;
  status?: string;
};

function computeAgeYearsFromDob(dob?: string): number | null {
  try {
    if (!dob) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 && age <= 30 ? age : null;
  } catch {
    return null;
  }
}

function displayAgeYears(s: any): string {
  const direct = s?.ageYears ?? s?.age;
  if (typeof direct === 'number' && Number.isFinite(direct)) return String(direct);

  const legacyDob = s?.dob ?? s?.birthdate;
  const fromDob = computeAgeYearsFromDob(legacyDob);
  return fromDob != null ? String(fromDob) : '—';
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODateOnly(iso: string): Date | null {
  // iso: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatYMDCompact(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}


function formatTimeHHmm(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safeNumber(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function enrollmentLabel(e: EnrollmentLite): string {
  const courseTitle = e.course?.title || e.courseId || 'Course';
  const teacher = e.teacher?.name || e.teacher?.email || e.teacherId || '';
  const fee = safeNumber(e.feePerClass, 0);
  const feeText = fee > 0 ? ` — ₹${fee}/class` : '';
  return `${courseTitle}${teacher ? ` — ${teacher}` : ''}${feeText}`;
}

export default function StudentList({ onEdit, onDelete, onAssignCourse }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const [assignCourseFor, setAssignCourseFor] = useState<Student | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<Student | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<Student | null>(null);

  // ✅ NEW: schedule modal state
  const [scheduleFor, setScheduleFor] = useState<Student | null>(null);
  const [scheduleEnrollmentId, setScheduleEnrollmentId] = useState<string>('');
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<string>(toISODate(new Date()));
  const [classesStartDate, setClassesStartDate] = useState<string>(toISODate(new Date()));
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri default
  const [timeHHmm, setTimeHHmm] = useState<string>('18:00');
  const [durationMins, setDurationMins] = useState<number>(35);
  const [feePerClass, setFeePerClass] = useState<number>(0);
  const [generateWeeks, setGenerateWeeks] = useState<number>(8);
  const [endDate, setEndDate] = useState<string>(''); // optional
  const [meetingLink, setMeetingLink] = useState<string>(''); // optional (Zoom/Meet)
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  const [sessionRequests, setSessionRequests] = useState<SessionRequestRow[]>([]);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    running: false,
  });
  const [syncCurriculumStatus, setSyncCurriculumStatus] = useState({
    running: false,
  });

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Delete this enrollment?')) return;
    try {
      await import('firebase/firestore').then(({ deleteDoc, doc }) =>
        deleteDoc(doc(db, 'enrollments', enrollmentId))
      );
      toast({ title: 'Enrollment removed' });
      enrollmentsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete enrollment', variant: 'destructive' });
    }
  };

  useEffect(() => {
    // load parents list for filters
    const loadParents = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const allUsers = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
        setParents(allUsers.filter(u => u.role === 'parent'));
      } catch (err) {
        console.error('parents load error', err);
      }
    };
    loadParents();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'kids'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Student[];
        setStudents(list);
      },
      err => console.error(err)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setSessionRequests([]);
      return;
    }

    const q = query(
      collectionGroup(db, 'sessionRequests'),
      orderBy('startAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((d) => {
            const raw = d.data() as any;
            const startAt = raw?.startAt?.toDate ? raw.startAt.toDate() : raw?.startAt ? new Date(raw.startAt) : null;
            const endAt = raw?.endAt?.toDate ? raw.endAt.toDate() : raw?.endAt ? new Date(raw.endAt) : null;
            if (!startAt) return null;
            const durationMins = safeNumber(raw?.durationMins, endAt ? Math.round((endAt.getTime() - startAt.getTime()) / 60000) : 35);
            const finalEndAt = endAt || new Date(startAt.getTime() + durationMins * 60 * 1000);

            return {
              id: d.id,
              path: d.ref.path,
              teacherId: raw?.teacherId || '',
              kidId: raw?.kidId || '',
              startAt,
              endAt: finalEndAt,
              durationMins,
              note: raw?.note || '',
              status: raw?.status || 'requested',
            } as SessionRequestRow;
          })
          .filter(Boolean) as SessionRequestRow[];

        setSessionRequests(rows);
      },
      (err) => console.error('sessionRequests onSnapshot error', err),
    );

    return () => unsub();
  }, [user?.role]);

  const filtered = useMemo(() => {
    let list = students.slice();

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(st =>
        (st.fullName || '').toLowerCase().includes(s) ||
        (st.parentIds || []).some(pid => {
          const p = parents.find(x => (x as any).uid === pid || x.id === pid);
          return (p?.email || '').toLowerCase().includes(s);
        })
      );
    }

    if (gradeFilter !== 'all') list = list.filter(s => s.grade === gradeFilter);
    if (statusFilter !== 'all') list = list.filter(s => (s as any).status === statusFilter);
    if (parentFilter !== 'all') list = list.filter(s => (s.parentIds || []).includes(parentFilter));

    return list;
  }, [students, search, gradeFilter, statusFilter, parentFilter, parents]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pagedStudentIds = paged.map(s => s.id);

  const enrollmentsQuery = useEnrollmentsForStudents(pagedStudentIds);

  const enrollmentsByStudent = useMemo(() => {
    const map: Record<string, EnrollmentLite[]> = {};
    if (!enrollmentsQuery.data) return map;
    (enrollmentsQuery.data as any[]).forEach((e: any) => {
      const sid = e.studentId || e.kidId || (e.kidIds && e.kidIds[0]);
      if (!sid) return;
      if (!map[sid]) map[sid] = [];
      map[sid].push(e as EnrollmentLite);
    });
    return map;
  }, [enrollmentsQuery.data]);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  async function findEnrollmentForRequest(kidId: string, teacherId?: string): Promise<EnrollmentLite | null> {
    const enrollments: EnrollmentLite[] = [];
    const base = collection(db, 'enrollments');

    const q1 = query(base, where('kidId', '==', kidId));
    const q2 = query(base, where('kidIds', 'array-contains', kidId));

    for (const q of [q1, q2]) {
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        enrollments.push({ id: d.id, ...(d.data() as any) } as EnrollmentLite);
      });
    }

    if (enrollments.length === 0) return null;

    const byTeacher = teacherId
      ? enrollments.find((e) => e.teacherId === teacherId)
      : null;

    return byTeacher || enrollments[0];
  }

  function openScheduleModal(student: Student) {
    const enrolls = enrollmentsByStudent[student.id] || [];
    if (enrolls.length === 0) {
      toast({
        title: 'No enrollment found',
        description: 'Assign a course first, then schedule recurring classes.',
        variant: 'destructive',
      });
      return;
    }

    const first = enrolls[0];

    setScheduleFor(student);
    setScheduleEnrollmentId(first.id);

    const today = new Date();
    const todayISO = toISODate(today);

    // default dates
    setEnrollmentStartDate(todayISO);
    setClassesStartDate(todayISO);

    // defaults from enrollment if already set
    setWeekdays(first.schedule?.weekdays?.length ? first.schedule.weekdays : [1, 3, 5]);
    setTimeHHmm(first.schedule?.timeHHmm || '18:00');
    setDurationMins(safeNumber(first.schedule?.durationMins, 35));
    setFeePerClass(safeNumber(first.feePerClass, 0));
    setGenerateWeeks(8);
    setEndDate('');
    setMeetingLink(first.joinUrl || '');
  }

  async function handleSaveSchedule() {
    if (!scheduleFor) return;

    const enrolls = enrollmentsByStudent[scheduleFor.id] || [];
    const selectedEnrollment = enrolls.find(e => e.id === scheduleEnrollmentId);

    if (!scheduleEnrollmentId || !selectedEnrollment) {
      toast({ title: 'Select an enrollment', variant: 'destructive' });
      return;
    }

    const enrollStart = parseISODateOnly(enrollmentStartDate);
    const classStart = parseISODateOnly(classesStartDate);
    if (!enrollStart || !classStart) {
      toast({ title: 'Invalid start date', variant: 'destructive' });
      return;
    }

    if (!timeHHmm || !/^\d{2}:\d{2}$/.test(timeHHmm)) {
      toast({ title: 'Invalid time', description: 'Use HH:MM format.', variant: 'destructive' });
      return;
    }

    if (!Array.isArray(weekdays) || weekdays.length === 0) {
      toast({ title: 'Pick at least one weekday', variant: 'destructive' });
      return;
    }

    const fee = safeNumber(feePerClass, 0);
    if (fee <= 0) {
      toast({ title: 'Fee per class required', description: 'Enter a fee > 0.', variant: 'destructive' });
      return;
    }

    const dur = Math.max(10, Math.min(180, safeNumber(durationMins, 35)));
    const weeks = Math.max(1, Math.min(52, safeNumber(generateWeeks, 8)));

    setSavingSchedule(true);
    try {
      // 1) Update enrollment with start date + fee + schedule
      const enrollmentRef = doc(db, 'enrollments', scheduleEnrollmentId);
      await updateDoc(enrollmentRef, {
        startDate: Timestamp.fromDate(enrollStart),
        feePerClass: fee,
        currency: 'INR',
        joinUrl: meetingLink ? meetingLink : null,
        schedule: {
          timezone: 'Asia/Kolkata',
          weekdays,
          timeHHmm,
          durationMins: dur,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      });

      // 2) Call Cloud Function to generate sessions
      const functions = getFunctions(undefined, 'asia-south1');
      const createSessionsFromSchedule = httpsCallable<
        { enrollmentId: string; weeksAhead?: number },
        { created: number; skipped: number; rangeStart: string; rangeEnd: string }
      >(functions, 'createSessionsFromSchedule');

      const result = await createSessionsFromSchedule({
        enrollmentId: scheduleEnrollmentId,
        weeksAhead: weeks,
      });

      const { created, skipped } = result.data;

      toast({
        title: 'Schedule saved',
        description: `✅ Created ${created} sessions (${skipped} already existed)`,
      });

      setScheduleFor(null);
      enrollmentsQuery.refetch();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save schedule / create sessions.',
        variant: 'destructive',
      });
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleApproveRequest(req: SessionRequestRow) {
    if (user?.role !== 'admin') return;
    if (!req.kidId || !req.teacherId) {
      toast({ title: 'Missing data', description: 'Request is missing kid or teacher.', variant: 'destructive' });
      return;
    }

    setRequestActionId(req.id);
    try {
      const enrollment = await findEnrollmentForRequest(req.kidId, req.teacherId);
      const student = studentById.get(req.kidId);

      const parentIds = (student?.parentIds || enrollment?.parentIds || []).filter(Boolean);
      const parentId = student?.primaryParentId || enrollment?.parentId || parentIds[0] || null;

      const feeAmount = safeNumber(enrollment?.feePerClass, 0);
      const currency = enrollment?.currency || 'INR';
      const courseId = enrollment?.courseId || null;
      const joinUrl = enrollment?.joinUrl || null;
      const enrollmentId = enrollment?.id || null;

      const startAt = req.startAt;
      const endAt = req.endAt;
      const dateStr = toISODate(startAt);
      const startTime = formatTimeHHmm(startAt);
      const endTime = formatTimeHHmm(endAt);
      const hhmmCompact = startTime.replace(":", "");
      if (!enrollmentId) {
        throw new Error('No active enrollment found for this request.');
      }
      const sessionId = `${enrollmentId}_${dateStr.replace(/-/g, "")}_${hhmmCompact}`;

      const payload = {
        enrollmentId,
        kidId: req.kidId,
        kidIds: [req.kidId],
        parentId,
        parentIds,
        teacherId: req.teacherId,
        courseId,
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        date: dateStr,
        startTime,
        endTime,
        status: 'scheduled',
        attendance: null,
        feeAmount,
        currency,
        joinUrl,
        notes: req.note || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || 'admin',
        updatedBy: user?.uid || 'admin',
        source: 'admin_approved_request',
      };

      const classSessionRef = doc(getClassSessionsCollection(), sessionId);
      await setDoc(classSessionRef, payload, { merge: true });

      await deleteDoc(doc(db, req.path));
      toast({ title: 'Session approved', description: 'Session created and request removed.' });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Approve failed',
        description: err?.message || 'Unable to approve request.',
        variant: 'destructive',
      });
    } finally {
      setRequestActionId(null);
    }
  }

  const handleSyncCourseCatalog = async () => {
    if (!isAdmin || syncStatus.running) return;

    const confirmed = window.confirm('Sync the course catalog with the standard 9 courses?');
    if (!confirmed) return;

    setSyncStatus({ running: true });
    try {
      for (const course of COURSE_CATALOG_SYNC) {
        const ref = doc(db, 'courses', course.id);
        const snap = await getDoc(ref);
        const existing = snap.exists() ? (snap.data() as any) : {};

        const payload: Record<string, unknown> = {
          title: course.title,
          name: course.title,
          area: course.area,
          level: course.level,
          status: 'active',
          active: true,
          durationMinutes: typeof existing?.durationMinutes === 'number'
            ? existing.durationMinutes
            : 35,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        };

        if (!snap.exists() || !existing?.createdAt) {
          payload.createdAt = serverTimestamp();
        }
        if (!snap.exists() || !existing?.createdBy) {
          payload.createdBy = user?.uid ?? null;
        }

        await setDoc(ref, payload, { merge: true });
      }

      toast({
        title: 'Course catalog synced',
        description: 'Standard courses are now active in /courses.',
      });
    } catch (err: any) {
      console.error('Sync course catalog failed', err);
      toast({
        title: 'Sync failed',
        description: err?.message || 'Unable to sync courses.',
        variant: 'destructive',
      });
    } finally {
      setSyncStatus({ running: false });
    }
  };

  const handleSyncCurriculum = async () => {
    if (!isAdmin || syncCurriculumStatus.running) return;

    const confirmed = window.confirm('Sync phonics curriculum topics to Firestore?');
    if (!confirmed) return;

    setSyncCurriculumStatus({ running: true });
    try {
      const curriculumRef = doc(db, 'config', 'curriculumTopics');
      const snap = await getDoc(curriculumRef);
      const existing = snap.exists() ? (snap.data() as any) : {};
      const existingTopics = Array.isArray(existing?.topics) ? existing.topics : [];

      const hadExisting = existingTopics.length > 0;

      const payload: Record<string, unknown> = {
        topics: PHONICS_CURRICULUM_TOPICS,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      };

      if (!snap.exists() || !existing?.createdAt) {
        payload.createdAt = serverTimestamp();
      }
      if (!snap.exists() || !existing?.createdBy) {
        payload.createdBy = user?.uid ?? null;
      }

      await setDoc(curriculumRef, payload, { merge: true });

      toast({
        title: hadExisting ? 'Curriculum updated' : 'Curriculum synced',
        description: hadExisting
          ? `Curriculum updated (${PHONICS_CURRICULUM_TOPICS.length} topics).`
          : 'Phonics curriculum topics are now available.',
      });
    } catch (err: any) {
      console.error('Sync curriculum failed', err);
      toast({
        title: 'Sync failed',
        description: err?.message || 'Unable to sync curriculum.',
        variant: 'destructive',
      });
    } finally {
      setSyncCurriculumStatus({ running: false });
    }
  };

  async function handleRejectRequest(req: SessionRequestRow) {
    if (user?.role !== 'admin') return;
    const confirmed = window.confirm('Reject this session request?');
    if (!confirmed) return;

    setRequestActionId(req.id);
    try {
      await deleteDoc(doc(db, req.path));
      toast({ title: 'Request rejected', description: 'Request removed.' });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Reject failed',
        description: err?.message || 'Unable to reject request.',
        variant: 'destructive',
      });
    } finally {
      setRequestActionId(null);
    }
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev => (prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students</h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCourseCatalog}
              disabled={syncStatus.running}
            >
              {syncStatus.running ? 'Syncing Courses...' : 'Sync Course Catalog'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCurriculum}
              disabled={syncCurriculumStatus.running}
            >
              {syncCurriculumStatus.running ? 'Syncing Curriculum...' : 'Sync Curriculum (Phonics)'}
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search name or parent email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Grade"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Pre-K">Pre-K</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={parentFilter} onValueChange={setParentFilter}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by parent"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {parents.map(p => (
                <SelectItem key={(p as any).uid || p.id} value={(p as any).uid || p.id}>
                  {p.email} — {p.name || p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {user?.role === 'admin' && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Session Requests</h3>
              <p className="text-xs text-gray-500">
                Teacher ad-hoc sessions awaiting approval.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {sessionRequests.length} pending
            </div>
          </div>

          {sessionRequests.length === 0 ? (
            <div className="text-sm text-gray-500 mt-3">No pending requests.</div>
          ) : (
            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionRequests.map((req) => {
                    const student = studentById.get(req.kidId);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="text-xs">
                          {req.teacherId || '—'}
                        </TableCell>
                        <TableCell>
                          {student?.fullName || req.kidId || '—'}
                        </TableCell>
                        <TableCell>{formatDateTime(req.startAt)}</TableCell>
                        <TableCell>{req.durationMins} min</TableCell>
                        <TableCell className="text-xs">
                          {req.note || '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.status || 'requested'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(req)}
                              disabled={requestActionId === req.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRequest(req)}
                              disabled={requestActionId === req.id}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Parents</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.map(s => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.fullName}</div>
                </TableCell>

                <TableCell>
                  {(s.parentIds || []).map(pid => {
                    const p = parents.find(x => (x as any).uid === pid || x.id === pid);
                    return <div key={pid}>{p?.email || pid}</div>;
                  })}
                </TableCell>

                {/* ✅ Age instead of DOB */}
                <TableCell>{displayAgeYears(s)}</TableCell>

                <TableCell>{s.grade}</TableCell>
                <TableCell>{(s as any).status}</TableCell>

                {/* ✅ Enrollments in its own column */}
                <TableCell>
                  {enrollmentsByStudent[s.id] && enrollmentsByStudent[s.id].length > 0 ? (
                    <div className="space-y-1">
                      {enrollmentsByStudent[s.id].map((e: any) => (
                        <div key={e.id} className="text-sm flex items-center justify-between">
                          <div>
                            <strong>{e.course?.title || e.courseId}</strong>
                            {e.teacher && ` — ${e.teacher.name || e.teacher.email}`}
                            {` — ${e.status}`}
                            {safeNumber(e.feePerClass, 0) > 0 ? ` — ₹${e.feePerClass}/class` : ''}
                          </div>
                          <div className="ml-4">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEnrollment(e.id)}
                              disabled={
                                !(
                                  user?.role === 'admin' ||
                                  (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No enrollments</div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => onAssignCourse(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Assign Course
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAssignTeacherFor(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Assign Teacher
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAssignLPFor(s)}
                      disabled={!(user?.role === 'admin')}
                    >
                      {user?.role === 'admin' ? 'Assign LP' : 'Not Authorized'}
                    </Button>

                    {/* ✅ NEW: Schedule Classes */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openScheduleModal(s)}
                      disabled={
                        !(
                          user?.role === 'admin' ||
                          (user?.role === 'learningPartner' && ((s as any).lpId === user.uid))
                        )
                      }
                    >
                      Schedule Classes
                    </Button>

                    <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>
                      Delete
                    </Button>

                    <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <div>Showing {filtered.length} students</div>
          <div className="space-x-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Prev
            </Button>
            <span>Page {page + 1} / {pageCount}</span>
            <Button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {assignCourseFor && (
        <AssignCourseModal
          student={assignCourseFor}
          onClose={() => setAssignCourseFor(null)}
          onAssigned={() => {
            setAssignCourseFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignTeacherFor && (
        <AssignTeacherModal
          student={assignTeacherFor}
          onClose={() => setAssignTeacherFor(null)}
          onAssigned={() => {
            setAssignTeacherFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignLPFor && (
        <AssignLPModal
          student={assignLPFor}
          onClose={() => setAssignLPFor(null)}
          onAssigned={() => {
            setAssignLPFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {/* ✅ NEW: Schedule Classes Modal */}
      <Dialog open={!!scheduleFor} onOpenChange={(open) => !open && setScheduleFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule Classes {scheduleFor?.fullName ? `— ${scheduleFor.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {scheduleFor ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Enrollment (Course)</div>
                  <Select value={scheduleEnrollmentId} onValueChange={setScheduleEnrollmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment" />
                    </SelectTrigger>
                    <SelectContent>
                      {(enrollmentsByStudent[scheduleFor.id] || []).map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {enrollmentLabel(e)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: Assign course + teacher first if needed.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Fee per class (₹)</div>
                  <Input
                    type="number"
                    min={0}
                    value={feePerClass}
                    onChange={(e) => setFeePerClass(safeNumber(e.target.value, 0))}
                    placeholder="e.g., 599"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Enrollment start date</div>
                  <Input
                    type="date"
                    value={enrollmentStartDate}
                    onChange={(e) => setEnrollmentStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Classes start date</div>
                  <Input
                    type="date"
                    value={classesStartDate}
                    onChange={(e) => setClassesStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Time (HH:MM)</div>
                  <Input
                    type="time"
                    value={timeHHmm}
                    onChange={(e) => setTimeHHmm(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Duration (minutes)</div>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(safeNumber(e.target.value, 35))}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Generate for (weeks)</div>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={generateWeeks}
                    onChange={(e) => setGenerateWeeks(safeNumber(e.target.value, 8))}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    We will create future sessions in Firestore → sessions.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">End date (optional)</div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    If set, it overrides “weeks”.
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Weekdays</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { d: 0, label: 'Sun' },
                      { d: 1, label: 'Mon' },
                      { d: 2, label: 'Tue' },
                      { d: 3, label: 'Wed' },
                      { d: 4, label: 'Thu' },
                      { d: 5, label: 'Fri' },
                      { d: 6, label: 'Sat' },
                    ].map(w => (
                      <Button
                        key={w.d}
                        type="button"
                        size="sm"
                        variant={weekdays.includes(w.d) ? 'default' : 'outline'}
                        onClick={() => toggleWeekday(w.d)}
                      >
                        {w.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Zoom / Meet link (optional)</div>
                  <Input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Note: Sessions are created with deterministic IDs so re-saving won’t duplicate. Existing sessions are skipped.
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setScheduleFor(null)} disabled={savingSchedule}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
