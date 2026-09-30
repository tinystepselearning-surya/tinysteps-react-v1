import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Input } from '@components/ui/input';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../lib/firebaseConfig';
import {
  createEnrollment,
  getCreateEnrollmentErrorMessage,
} from '../../../lib/createEnrollmentCallable';
import { useCourses } from '../../../hooks/useData';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { normalizeEnrollmentScheduleSlots } from '../../../lib/sessionScheduleIntegrity';
import { useAuthStore } from '../../../store/useAuthStore';

type EnrollmentCreationIntent = 'initial_course' | 'additional_course';

type ResumeEnrollment = {
  id: string;
  courseId?: string;
  courseName?: string;
  ratePerSession?: number;
  feePerClass?: number;
  teacherPayPerSession?: number;
  teacherId?: string;
  joinUrl?: string;
  classesStartDateYmd?: string;
  schedule?: Record<string, unknown>;
};

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: (enrollmentId?: string) => void;
  creationIntent?: EnrollmentCreationIntent;
  existingCourseIds?: string[];
  resumeEnrollment?: ResumeEnrollment | null;
}

type Course = {
  id: string;
  name?: string;
  title?: string;
  level?: string;
  area?: string;
  levelName?: string;
  status?: string;
  feePerClass?: number;
  ratePerSession?: number;
  sessionFrequency?: string;
};

type TeacherUser = {
  id: string;
  uid?: string;
  name?: string;
  displayName?: string;
  email?: string;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

type WeeklySlot = {
  id: string;
  weekday: number;
  time: string;
  durationMinutes: number;
};

const defaultCourses = [
  'Phonics Foundations',
  'Early Phonics',
  'Advanced Phonics',
  'Basic Grammar',
  'Advanced Grammar',
  'Public Speaking (Basic)',
  'Public Speaking (Advanced)',
];

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const sessionsPerMonthForFrequency = (freq?: string) => {
  switch (freq) {
    case 'weekly':
      return 4;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4;
  }
};

const todayYmd = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const newSlot = (): WeeklySlot => ({
  id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `slot-${Date.now()}-${Math.random()}`,
  weekday: 1,
  time: '18:00',
  durationMinutes: 35,
});

export default function AssignCourseModal({
  student,
  onClose,
  onAssigned,
  creationIntent = 'initial_course',
  existingCourseIds = [],
  resumeEnrollment = null,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [step, setStep] = useState<WizardStep>(1);
  const [selected, setSelected] = useState<string>(resumeEnrollment?.courseId || '');
  const [lpCanAssign, setLpCanAssign] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdEnrollmentId, setCreatedEnrollmentId] = useState<string>(resumeEnrollment?.id || '');
  const [feePerClassInput, setFeePerClassInput] = useState<string>(
    String(resumeEnrollment?.ratePerSession ?? resumeEnrollment?.feePerClass ?? ''),
  );
  const [teacherPayPerSessionInput, setTeacherPayPerSessionInput] = useState<string>(
    String(resumeEnrollment?.teacherPayPerSession ?? ''),
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(resumeEnrollment?.teacherId || '');
  const [teacherSaved, setTeacherSaved] = useState(Boolean(resumeEnrollment?.teacherId));
  const [classesStartDate, setClassesStartDate] = useState<string>(
    resumeEnrollment?.classesStartDateYmd || todayYmd(),
  );
  const [meetingLink, setMeetingLink] = useState<string>(resumeEnrollment?.joinUrl || '');
  const normalizedResumeSlots = useMemo(
    () => normalizeEnrollmentScheduleSlots(resumeEnrollment?.schedule),
    [resumeEnrollment?.schedule],
  );
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>(() => {
    const normalized = normalizeEnrollmentScheduleSlots(resumeEnrollment?.schedule)
      .map((slot) => ({
        id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `slot-${Math.random()}`,
        weekday: slot.weekday,
        time: slot.time,
        durationMinutes: slot.durationMinutes,
      }));
    return normalized.length ? normalized : [newSlot()];
  });
  const [scheduleSaved, setScheduleSaved] = useState(
    normalizeEnrollmentScheduleSlots(resumeEnrollment?.schedule).length > 0,
  );

  const { user } = useAuthStore();
  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  const isAdmin = user?.role === 'admin';
  const canAssign = isAdmin || lpCanAssign === true;
  const { data: fetchedCourses = [], isLoading: coursesLoading } = useCourses({ status: 'active' });

  useEffect(() => {
    if (resumeEnrollment) {
      if (!resumeEnrollment.teacherId) setStep(3);
      else if (normalizedResumeSlots.length === 0) setStep(4);
      else setStep(5);
    }
  }, [resumeEnrollment, normalizedResumeSlots.length]);

  useEffect(() => {
    if (Array.isArray(fetchedCourses) && fetchedCourses.length > 0) {
      setCourses(fetchedCourses as any);
      return;
    }
    if (import.meta.env?.DEV) {
      setCourses(defaultCourses.map((title) => ({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title,
        status: 'active',
      })));
      return;
    }
    setCourses([]);
  }, [fetchedCourses]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        setTeachers(snap.docs.map((row) => ({ id: row.id, ...(row.data() as any) })));
      } catch (error) {
        console.error(error);
      }
    };
    void loadTeachers();
  }, []);

  useEffect(() => {
    if (!user || !student || user.role !== 'learningPartner') return;
    const check = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'kids', student.id));
        const data = studentDoc.exists() ? (studentDoc.data() as any) : (student as any);
        const lpId = data.lpId || data.primaryLpId || (student as any).lpId;
        setLpCanAssign(lpId === user.uid);
      } catch (error) {
        console.error(error);
        setLpCanAssign(false);
      }
    };
    void check();
  }, [user, student]);

  const normalizeArea = (value?: string) => {
    const v = String(value || '').toLowerCase().trim();
    if (v.includes('phonics')) return 'phonics';
    if (v.includes('grammar')) return 'grammar';
    if (v.includes('speaking') || v.includes('speech') || v.includes('public')) return 'speaking';
    return v;
  };

  const normalizeLevel = (value?: string) => {
    const v = String(value || '').toLowerCase().trim();
    if (v.includes('foundation')) return 'foundations';
    if (v.includes('early')) return 'early';
    if (v.includes('basic')) return 'basic';
    if (v.includes('intermediate')) return 'intermediate';
    if (v.includes('advanced')) return 'advanced';
    return v;
  };

  const sortedCourses = useMemo(() => {
    const areaOrder = ['phonics', 'grammar', 'speaking'];
    const levelOrderByArea: Record<string, string[]> = {
      phonics: ['foundations', 'early', 'advanced'],
      grammar: ['basic', 'advanced'],
      speaking: ['basic', 'advanced'],
    };
    const existingCourseIdSet = new Set(existingCourseIds.map((id) => String(id || '').trim()).filter(Boolean));
    const filteredCourses = courses.filter((course) => {
      if (!resumeEnrollment && existingCourseIdSet.has(course.id)) return false;
      const id = String(course.id || '').toLowerCase();
      if (id.includes('intermediate-grammar') || id.includes('intermediate-public-speaking')) return false;
      const level = normalizeLevel(course.level || course.levelName);
      const area = normalizeArea(course.area);
      if ((area === 'grammar' || area === 'speaking') && level === 'intermediate') return false;
      return true;
    });
    return [...filteredCourses].sort((a, b) => {
      const areaA = normalizeArea(a.area);
      const areaB = normalizeArea(b.area);
      const areaIdxA = areaOrder.indexOf(areaA);
      const areaIdxB = areaOrder.indexOf(areaB);
      if (areaIdxA !== areaIdxB) {
        return (areaIdxA === -1 ? 999 : areaIdxA) - (areaIdxB === -1 ? 999 : areaIdxB);
      }
      const levelA = normalizeLevel(a.level || a.levelName);
      const levelB = normalizeLevel(b.level || b.levelName);
      const levelOrder = levelOrderByArea[areaA] || [];
      const levelIdxA = levelOrder.indexOf(levelA);
      const levelIdxB = levelOrder.indexOf(levelB);
      if (levelIdxA !== levelIdxB) {
        return (levelIdxA === -1 ? 999 : levelIdxA) - (levelIdxB === -1 ? 999 : levelIdxB);
      }
      return String(a.name || a.title || a.id).localeCompare(String(b.name || b.title || b.id));
    });
  }, [courses, existingCourseIds, resumeEnrollment]);

  useEffect(() => {
    if (!selected || resumeEnrollment) return;
    const selectedCourse = courses.find((course) => course.id === selected);
    const defaultFee = Number(selectedCourse?.feePerClass ?? selectedCourse?.ratePerSession ?? 0);
    setFeePerClassInput(Number.isFinite(defaultFee) && defaultFee > 0 ? String(defaultFee) : '');
  }, [selected, courses, resumeEnrollment]);

  const selectedCourse = courses.find((course) => course.id === selected) || null;
  const selectedTeacher = teachers.find((teacher) => (teacher.uid || teacher.id) === selectedTeacherId) || null;
  const courseLabel = selectedCourse?.name || selectedCourse?.title || resumeEnrollment?.courseName || selected || 'Course';
  const teacherLabel =
    selectedTeacher?.displayName ||
    selectedTeacher?.name ||
    selectedTeacher?.email ||
    selectedTeacherId ||
    'Not assigned';

  const progress = [
    { number: 1, label: 'Course' },
    { number: 2, label: 'Fees' },
    { number: 3, label: 'Teacher' },
    { number: 4, label: 'Schedule' },
    { number: 5, label: 'Review' },
  ];

  const handleCreateEnrollment = async (): Promise<string | null> => {
    if (createdEnrollmentId) return createdEnrollmentId;
    if (!selected) {
      toast({ title: 'Select a course', variant: 'destructive' });
      return null;
    }
    const feePerClass = Number(feePerClassInput);
    const teacherPayPerSession = teacherPayPerSessionInput.trim() === ''
      ? 0
      : Number(teacherPayPerSessionInput);
    if (!Number.isFinite(feePerClass) || feePerClass <= 0) {
      toast({ title: 'Fee per class required', description: 'Enter a positive parent fee.', variant: 'destructive' });
      return null;
    }
    if (!Number.isFinite(teacherPayPerSession) || teacherPayPerSession < 0) {
      toast({ title: 'Invalid teacher pay', variant: 'destructive' });
      return null;
    }
    if (!canAssign) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return null;
    }

    const kidSnap = await getDoc(doc(db, 'kids', student.id));
    if (!kidSnap.exists()) {
      toast({ title: 'Invalid student link', variant: 'destructive' });
      return null;
    }

    const creditsTotal = sessionsPerMonthForFrequency(selectedCourse?.sessionFrequency || 'weekly');
    const created = await createEnrollment({
      operationId: `assign-course-${crypto.randomUUID()}`,
      creationIntent,
      kidId: student.id,
      courseId: selected,
      feePerClass,
      ratePerSession: feePerClass,
      teacherPayPerSession,
      currency: 'INR',
      billingCycle: 'monthly',
      creditsTotal,
    });
    setCreatedEnrollmentId(created.enrollmentId);
    onAssigned?.(created.enrollmentId);
    return created.enrollmentId;
  };

  const saveFeesAndContinue = async (exitAfterSave: boolean) => {
    try {
      setSaving(true);
      const enrollmentId = await handleCreateEnrollment();
      if (!enrollmentId) return;
      toast({
        title: 'Enrollment created',
        description: exitAfterSave
          ? 'Course and fees are saved. Teacher and schedule can be completed later.'
          : 'Course and fees saved. Continue with teacher assignment.',
      });
      if (exitAfterSave) onClose();
      else setStep(3);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Enrollment not created',
        description: getCreateEnrollmentErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTeacherAndContinue = async (exitAfterSave: boolean) => {
    if (!createdEnrollmentId) return;
    if (!selectedTeacherId) {
      toast({ title: 'Select a teacher', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const regionalFunctions = getFunctions(undefined, 'asia-south1');
      const reassignEnrollmentTeacher = httpsCallable(regionalFunctions, 'reassignEnrollmentTeacher');
      await reassignEnrollmentTeacher({
        enrollmentId: createdEnrollmentId,
        newTeacherId: selectedTeacherId,
      });
      setTeacherSaved(true);
      toast({ title: 'Teacher assigned' });
      if (exitAfterSave) onClose();
      else setStep(4);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Teacher not assigned',
        description: error?.message || 'Failed to assign teacher.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveScheduleAndContinue = async (exitAfterSave: boolean) => {
    if (!createdEnrollmentId || !teacherSaved) {
      toast({
        title: 'Teacher required',
        description: 'Assign a teacher before activating a recurring schedule.',
        variant: 'destructive',
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classesStartDate)) {
      toast({ title: 'Valid start date required', variant: 'destructive' });
      return;
    }
    const cleanSlots = weeklySlots.map((slot) => ({
      weekday: Number(slot.weekday),
      time: String(slot.time || '').trim(),
      durationMinutes: Number(slot.durationMinutes),
    }));
    const invalidSlot = cleanSlots.some((slot) =>
      !Number.isInteger(slot.weekday)
      || slot.weekday < 0
      || slot.weekday > 6
      || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(slot.time)
      || !Number.isFinite(slot.durationMinutes)
      || slot.durationMinutes < 10
      || slot.durationMinutes > 180,
    );
    if (!cleanSlots.length || invalidSlot) {
      toast({ title: 'Complete every schedule slot', variant: 'destructive' });
      return;
    }
    if (meetingLink && !/^https?:\/\//i.test(meetingLink.trim())) {
      toast({ title: 'Enter a complete class link', description: 'Use http:// or https://', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const regionalFunctions = getFunctions(undefined, 'asia-south1');
      const saveRollingEnrollmentSchedule = httpsCallable(regionalFunctions, 'saveRollingEnrollmentSchedule');
      await saveRollingEnrollmentSchedule({
        enrollmentId: createdEnrollmentId,
        enrollmentStartDate: classesStartDate,
        classesStartDate,
        feePerClass: Number(feePerClassInput),
        joinUrl: meetingLink.trim() || null,
        currency: 'INR',
        weeklySlots: cleanSlots,
        idempotencyKey:
          typeof crypto?.randomUUID === 'function'
            ? crypto.randomUUID()
            : `admission-schedule-${createdEnrollmentId}-${Date.now()}`,
      });
      setScheduleSaved(true);
      toast({ title: 'Schedule activated', description: 'Continuous recurring schedule saved safely.' });
      if (exitAfterSave) onClose();
      else setStep(5);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Schedule not saved',
        description: error?.message || 'Failed to activate recurring schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (id: string, patch: Partial<WeeklySlot>) => {
    setWeeklySlots((current) => current.map((slot) => slot.id === id ? { ...slot, ...patch } : slot));
  };

  const closeFinished = () => {
    onAssigned?.(createdEnrollmentId || undefined);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resumeEnrollment ? `Continue Admission Setup — ${studentName}` : `Admission Setup — ${studentName}`}
          </DialogTitle>
          <DialogDescription>
            Complete the admission in sequence. After the enrollment is created, you can save and exit at any later step and continue later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2">
          {progress.map((item) => (
            <div
              key={item.number}
              className={[
                'rounded-md border px-2 py-2 text-center text-xs',
                step === item.number
                  ? 'border-blue-500 bg-blue-50 font-semibold text-blue-900'
                  : item.number < step
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-500',
              ].join(' ')}
            >
              <div>{item.number}</div>
              <div>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="min-h-[300px] py-3">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">1. Select course</h4>
                <p className="text-sm text-muted-foreground">
                  {creationIntent === 'additional_course'
                    ? 'Choose an additional independent course. Existing active courses stay unchanged.'
                    : 'Choose the child\'s first course.'}
                </p>
              </div>
              <Select value={selected} onValueChange={setSelected} disabled={Boolean(resumeEnrollment)}>
                <SelectTrigger>
                  <SelectValue placeholder={coursesLoading ? 'Loading courses…' : 'Select course'} />
                </SelectTrigger>
                <SelectContent>
                  {sortedCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name || course.title || course.id}
                      {(course.area || course.level) ? ` — ${course.area || ''}${course.area && course.level ? ' / ' : ''}${course.level || ''}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!coursesLoading && sortedCourses.length === 0 && (
                <p className="text-sm text-amber-700">No eligible active courses are available.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">2. Assign fees</h4>
                <p className="text-sm text-muted-foreground">Course: {courseLabel}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Parent fee per class (₹) *</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={feePerClassInput}
                    onChange={(event) => setFeePerClassInput(event.target.value)}
                    disabled={Boolean(createdEnrollmentId)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Teacher pay per class (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={teacherPayPerSessionInput}
                    onChange={(event) => setTeacherPayPerSessionInput(event.target.value)}
                    disabled={Boolean(createdEnrollmentId)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                The enrollment is created only after these financial terms are validated, preventing a course-only partial record.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">3. Assign teacher</h4>
                <p className="text-sm text-muted-foreground">Enrollment: {courseLabel}</p>
              </div>
              <Select value={selectedTeacherId} onValueChange={(value) => {
                setSelectedTeacherId(value);
                setTeacherSaved(value === resumeEnrollment?.teacherId && Boolean(value));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.uid || teacher.id} value={teacher.uid || teacher.id}>
                      {teacher.displayName || teacher.name || teacher.email || teacher.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teacherSaved && <p className="text-sm text-emerald-700">Teacher assignment saved.</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">4. Schedule classes</h4>
                <p className="text-sm text-muted-foreground">
                  Teacher: {teacherLabel}. Configure the continuous weekly recurrence.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Classes start date</label>
                  <Input type="date" value={classesStartDate} onChange={(event) => setClassesStartDate(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Microsoft Teams / class link</label>
                  <Input
                    type="url"
                    placeholder="https://teams.microsoft.com/..."
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Weekly class slots</label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setWeeklySlots((current) => [...current, newSlot()])}>
                    Add slot
                  </Button>
                </div>
                {weeklySlots.map((slot, index) => (
                  <div key={slot.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                    <Select value={String(slot.weekday)} onValueChange={(value) => updateSlot(slot.id, { weekday: Number(value) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="time" value={slot.time} onChange={(event) => updateSlot(slot.id, { time: event.target.value })} />
                    <Input
                      type="number"
                      min={10}
                      max={180}
                      step={5}
                      value={slot.durationMinutes}
                      onChange={(event) => updateSlot(slot.id, { durationMinutes: Number(event.target.value) })}
                      aria-label={`Duration for slot ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWeeklySlots((current) => current.filter((row) => row.id !== slot.id))}
                      disabled={weeklySlots.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              {scheduleSaved && <p className="text-sm text-emerald-700">Recurring schedule saved and activated.</p>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">5. Review admission</h4>
                <p className="text-sm text-muted-foreground">The setup is ready for operational use.</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4 text-sm space-y-2">
                <div><strong>Student:</strong> {studentName}</div>
                <div><strong>Course:</strong> {courseLabel}</div>
                <div><strong>Parent fee:</strong> ₹{feePerClassInput || '—'} / class</div>
                <div><strong>Teacher pay:</strong> ₹{teacherPayPerSessionInput || '0'} / class</div>
                <div><strong>Teacher:</strong> {teacherLabel}</div>
                <div><strong>Schedule:</strong> {scheduleSaved ? `${weeklySlots.length} weekly slot${weeklySlots.length === 1 ? '' : 's'} from ${classesStartDate}` : 'Not yet configured'}</div>
                <div><strong>Class link:</strong> {meetingLink || 'Not set'}</div>
                <div><strong>Enrollment ID:</strong> {createdEnrollmentId || '—'}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((current) => Math.max(1, current - 1) as WizardStep)}
              disabled={saving || step === 1 || Boolean(createdEnrollmentId && step <= 2)}
            >
              Back
            </Button>

          </div>

          <div className="flex gap-2">
            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={!selected || coursesLoading || !canAssign}>
                Continue to Fees
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => void saveFeesAndContinue(true)} disabled={saving || Boolean(createdEnrollmentId)}>
                  {saving ? 'Saving…' : 'Save & Exit'}
                </Button>
                <Button onClick={() => void saveFeesAndContinue(false)} disabled={saving}>
                  {saving ? 'Saving…' : createdEnrollmentId ? 'Continue to Teacher' : 'Save & Continue'}
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => void saveTeacherAndContinue(true)}
                  disabled={saving || !selectedTeacherId}
                >
                  {saving ? 'Saving…' : 'Save Teacher & Exit'}
                </Button>
                <Button onClick={() => void saveTeacherAndContinue(false)} disabled={saving || !selectedTeacherId}>
                  {saving ? 'Saving…' : teacherSaved ? 'Continue to Schedule' : 'Save Teacher & Continue'}
                </Button>
              </>
            )}
            {step === 4 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => void saveScheduleAndContinue(true)}
                  disabled={saving || !teacherSaved}
                >
                  {saving ? 'Saving…' : 'Save Schedule & Exit'}
                </Button>
                <Button onClick={() => void saveScheduleAndContinue(false)} disabled={saving || !teacherSaved}>
                  {saving ? 'Saving…' : scheduleSaved ? 'Continue to Review' : 'Save Schedule & Continue'}
                </Button>
              </>
            )}
            {step === 5 && (
              <Button onClick={closeFinished}>Complete Setup</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
