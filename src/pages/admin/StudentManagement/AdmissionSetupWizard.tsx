import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

import { db } from '../../../lib/firebaseConfig';
import {
  createEnrollment,
  getCreateEnrollmentErrorMessage,
  type EnrollmentCreationIntent,
} from '../../../lib/createEnrollmentCallable';
import { useCourses } from '../../../hooks/useData';
import type { Student } from '../../../types/Student';

import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';

type WizardStep = 'course' | 'fees' | 'teacher' | 'schedule' | 'review';

type EnrollmentRecord = Record<string, any> & { id: string };

type Props = {
  student: Student;
  creationIntent: EnrollmentCreationIntent;
  enrollmentId?: string | null;
  excludedCourseIds?: string[];
  onClose: () => void;
  onCompleted?: (enrollmentId: string) => void;
};

type CourseRecord = {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  ratePerSession?: number;
  feePerClass?: number;
  sessionFrequency?: string;
};

type TeacherRecord = {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
};

type ScheduleSlot = {
  key: string;
  weekday: number;
  time: string;
  durationMinutes: number;
};

const STEP_ORDER: WizardStep[] = ['course', 'fees', 'teacher', 'schedule', 'review'];
const STEP_LABELS: Record<WizardStep, string> = {
  course: 'Course',
  fees: 'Fees',
  teacher: 'Teacher',
  schedule: 'Schedule',
  review: 'Review',
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const indiaTodayYmd = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const sessionsPerMonth = (frequency?: string): number => {
  switch (String(frequency || '').trim().toLowerCase()) {
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4;
  }
};

const courseLabel = (course?: CourseRecord | null): string =>
  course?.title || course?.name || course?.id || 'Course';

const teacherLabel = (teacher?: TeacherRecord | null): string =>
  teacher?.displayName || teacher?.name || teacher?.email || teacher?.id || 'Teacher';

const nextStep = (step: WizardStep): WizardStep => {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.min(STEP_ORDER.length - 1, index + 1)];
};

const previousStep = (step: WizardStep): WizardStep => {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.max(0, index - 1)];
};

const stepIndex = (step: WizardStep): number => STEP_ORDER.indexOf(step);

export default function AdmissionSetupWizard({
  student,
  creationIntent,
  enrollmentId: initialEnrollmentId,
  excludedCourseIds = [],
  onClose,
  onCompleted,
}: Props) {
  const regionalFunctions = useMemo(() => getFunctions(undefined, 'asia-south1'), []);
  const { data: courseData = [], isLoading: coursesLoading } = useCourses({ status: 'active' });
  const courses = courseData as CourseRecord[];

  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId || '');
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [step, setStep] = useState<WizardStep>(initialEnrollmentId ? 'fees' : 'course');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [parentRate, setParentRate] = useState('');
  const [teacherRate, setTeacherRate] = useState('');
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [enrollmentStartDate, setEnrollmentStartDate] = useState(indiaTodayYmd());
  const [classesStartDate, setClassesStartDate] = useState(indiaTodayYmd());
  const [joinUrl, setJoinUrl] = useState('');
  const [slots, setSlots] = useState<ScheduleSlot[]>([
    { key: crypto.randomUUID(), weekday: 1, time: '18:00', durationMinutes: 35 },
  ]);
  const [saving, setSaving] = useState(false);
  const [loadingEnrollment, setLoadingEnrollment] = useState(Boolean(initialEnrollmentId));

  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === (selectedCourseId || enrollment?.courseId)) || null,
    [courses, selectedCourseId, enrollment?.courseId],
  );

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === (teacherId || enrollment?.teacherId)) || null,
    [teachers, teacherId, enrollment?.teacherId],
  );

  const availableCourses = useMemo(() => {
    const excluded = new Set(excludedCourseIds.filter(Boolean));
    if (enrollment?.courseId) excluded.delete(String(enrollment.courseId));
    return courses.filter((course) => !excluded.has(course.id));
  }, [courses, excludedCourseIds, enrollment?.courseId]);

  const loadEnrollment = async (id: string) => {
    if (!id) return null;
    const snap = await getDoc(doc(db, 'enrollments', id));
    if (!snap.exists()) throw new Error('Enrollment was not found');
    const record = { id: snap.id, ...(snap.data() as Record<string, any>) } as EnrollmentRecord;
    setEnrollment(record);
    setSelectedCourseId(String(record.courseId || ''));

    const storedRate = Number(record.ratePerSession ?? record.feePerClass ?? 0);
    if (storedRate > 0) setParentRate(String(storedRate));
    const storedTeacherRate = Number(record.teacherPayPerSession ?? 0);
    if (storedTeacherRate >= 0 && (storedTeacherRate > 0 || record.setup?.financialTermsComplete)) {
      setTeacherRate(String(storedTeacherRate));
    }
    if (record.teacherId) setTeacherId(String(record.teacherId));

    const draft = record.setupDraft?.scheduleDraft || {};
    if (draft.enrollmentStartDate) setEnrollmentStartDate(String(draft.enrollmentStartDate));
    if (draft.classesStartDate) setClassesStartDate(String(draft.classesStartDate));
    if (draft.joinUrl) setJoinUrl(String(draft.joinUrl));
    if (Array.isArray(draft.weeklySlots) && draft.weeklySlots.length > 0) {
      setSlots(draft.weeklySlots.map((slot: Record<string, unknown>) => ({
        key: crypto.randomUUID(),
        weekday: Number(slot.weekday),
        time: String(slot.time || '18:00'),
        durationMinutes: Number(slot.durationMinutes || 35),
      })));
    }

    const resumeStep = String(record.setupDraft?.resumeStep || '');
    if (STEP_ORDER.includes(resumeStep as WizardStep)) {
      setStep(resumeStep as WizardStep);
    } else if (!(storedRate > 0)) {
      setStep('fees');
    } else if (!record.teacherId) {
      setStep('teacher');
    } else {
      setStep('schedule');
    }
    return record;
  };

  useEffect(() => {
    if (!initialEnrollmentId) return;
    setLoadingEnrollment(true);
    void loadEnrollment(initialEnrollmentId)
      .catch((error) => {
        toast({
          title: 'Unable to resume setup',
          description: error instanceof Error ? error.message : 'Enrollment could not be loaded.',
          variant: 'destructive',
        });
        onClose();
      })
      .finally(() => setLoadingEnrollment(false));
  }, [initialEnrollmentId]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        setTeachers(snap.docs.map((row) => ({
          id: row.id,
          ...(row.data() as Record<string, unknown>),
        })) as TeacherRecord[]);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Teachers could not be loaded',
          description: 'Refresh and try again before the Teacher step.',
          variant: 'destructive',
        });
      }
    };
    void loadTeachers();
  }, []);

  useEffect(() => {
    if (enrollmentId || !selectedCourse) return;
    const defaultRate = Number(selectedCourse.ratePerSession ?? selectedCourse.feePerClass ?? 0);
    if (defaultRate > 0 && !parentRate) setParentRate(String(defaultRate));
  }, [selectedCourse, enrollmentId, parentRate]);

  const saveDraft = async (resumeStep: WizardStep, includeSchedule: boolean) => {
    if (!enrollmentId) return;
    const save = httpsCallable(regionalFunctions, 'saveEnrollmentSetupDraft');
    await save({
      enrollmentId,
      resumeStep,
      ...(includeSchedule
        ? {
            scheduleDraft: {
              enrollmentStartDate,
              classesStartDate,
              joinUrl: joinUrl.trim() || null,
              weeklySlots: slots.map(({ weekday, time, durationMinutes }) => ({
                weekday,
                time,
                durationMinutes,
              })),
            },
          }
        : {}),
    });
  };

  const ensureCourseEnrollment = async (): Promise<string> => {
    if (enrollmentId) return enrollmentId;
    if (!selectedCourseId) throw new Error('Select a course before continuing.');

    const course = courses.find((row) => row.id === selectedCourseId);
    const created = await createEnrollment({
      operationId: `admission-setup-${crypto.randomUUID()}`,
      creationIntent,
      setupPending: true,
      kidId: String(student.id || '').trim(),
      courseId: selectedCourseId,
      ratePerSession: 0,
      feePerClass: 0,
      teacherPayPerSession: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      creditsTotal: sessionsPerMonth(course?.sessionFrequency),
    });
    setEnrollmentId(created.enrollmentId);
    await loadEnrollment(created.enrollmentId);
    return created.enrollmentId;
  };

  const saveCourse = async (exitAfter = false) => {
    if (!selectedCourseId && !enrollmentId) {
      toast({ title: 'Select a course', description: 'Choose the course to reserve for this admission.' });
      return;
    }
    try {
      setSaving(true);
      const id = await ensureCourseEnrollment();
      await saveDraft('fees', false);
      if (exitAfter) {
        toast({ title: 'Setup saved', description: 'Continue from Fees when you reopen this admission.' });
        onClose();
      } else {
        setEnrollmentId(id);
        setStep('fees');
      }
    } catch (error) {
      toast({
        title: 'Course was not saved',
        description: getCreateEnrollmentErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveFees = async (exitAfter = false) => {
    const rate = Number(parentRate);
    const teacherPay = teacherRate.trim() === '' ? 0 : Number(teacherRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast({ title: 'Parent fee required', description: 'Enter a positive fee per class.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(teacherPay) || teacherPay < 0) {
      toast({ title: 'Invalid teacher pay', description: 'Teacher pay cannot be negative.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const updateFinancialTerms = httpsCallable(regionalFunctions, 'updateEnrollmentFinancialTerms');
      await updateFinancialTerms({
        enrollmentId,
        ratePerSession: rate,
        teacherPayPerSession: teacherPay,
        currency: 'INR',
        billingCycle: 'monthly',
      });
      await saveDraft('teacher', false);
      await loadEnrollment(enrollmentId);
      if (exitAfter) {
        toast({ title: 'Setup saved', description: 'Continue from Teacher when you reopen this admission.' });
        onClose();
      } else {
        setStep('teacher');
      }
    } catch (error) {
      toast({
        title: 'Fees were not saved',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTeacher = async (exitAfter = false) => {
    if (!teacherId) {
      toast({ title: 'Select a teacher', description: 'Choose a teacher before continuing.' });
      return;
    }
    try {
      setSaving(true);
      if (teacherId !== String(enrollment?.teacherId || '')) {
        const assignTeacher = httpsCallable(regionalFunctions, 'reassignEnrollmentTeacher');
        await assignTeacher({
          enrollmentId,
          newTeacherId: teacherId,
          reassignmentReason: 'Admission setup',
        });
      }
      await saveDraft('schedule', false);
      await loadEnrollment(enrollmentId);
      if (exitAfter) {
        toast({ title: 'Setup saved', description: 'Continue from Schedule when you reopen this admission.' });
        onClose();
      } else {
        setStep('schedule');
      }
    } catch (error) {
      toast({
        title: 'Teacher was not saved',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const validateSchedule = (): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(enrollmentStartDate) || !/^\d{4}-\d{2}-\d{2}$/.test(classesStartDate)) {
      toast({ title: 'Valid dates required', variant: 'destructive' });
      return false;
    }
    if (slots.length === 0) {
      toast({ title: 'Add at least one weekly class slot', variant: 'destructive' });
      return false;
    }
    const keys = new Set<string>();
    for (const slot of slots) {
      if (
        !Number.isInteger(slot.weekday) ||
        slot.weekday < 0 ||
        slot.weekday > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time) ||
        !Number.isFinite(slot.durationMinutes) ||
        slot.durationMinutes < 10 ||
        slot.durationMinutes > 180
      ) {
        toast({ title: 'Invalid class slot', description: 'Review weekday, time, and duration.', variant: 'destructive' });
        return false;
      }
      const key = `${slot.weekday}-${slot.time}-${slot.durationMinutes}`;
      if (keys.has(key)) {
        toast({ title: 'Duplicate class slot', description: 'Each weekday/time/duration combination must be unique.', variant: 'destructive' });
        return false;
      }
      keys.add(key);
    }
    return true;
  };

  const saveScheduleDraft = async (exitAfter = false) => {
    if (!validateSchedule()) return;
    try {
      setSaving(true);
      await saveDraft(exitAfter ? 'schedule' : 'review', true);
      if (exitAfter) {
        toast({ title: 'Setup saved', description: 'The timetable is saved as a draft. No classes were activated.' });
        onClose();
      } else {
        setStep('review');
      }
    } catch (error) {
      toast({
        title: 'Schedule draft was not saved',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const completeSetup = async () => {
    if (!validateSchedule()) return;
    const fee = Number(parentRate || enrollment?.ratePerSession || enrollment?.feePerClass || 0);
    if (!(fee > 0) || !teacherId) {
      toast({
        title: 'Setup is incomplete',
        description: 'A valid fee and teacher are required before activation.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const activate = httpsCallable(regionalFunctions, 'saveRollingEnrollmentSchedule');
      await activate({
        enrollmentId,
        enrollmentStartDate,
        classesStartDate,
        feePerClass: fee,
        currency: 'INR',
        joinUrl: joinUrl.trim() || null,
        weeklySlots: slots.map(({ weekday, time, durationMinutes }) => ({
          weekday,
          time,
          durationMinutes,
        })),
        idempotencyKey: `admission-setup-activate-${enrollmentId}`,
      });
      toast({
        title: 'Admission setup complete',
        description: `${studentName} is now active for ${courseLabel(selectedCourse)}.`,
      });
      onCompleted?.(enrollmentId);
      onClose();
    } catch (error) {
      toast({
        title: 'Admission was not activated',
        description: error instanceof Error ? error.message : 'No completion was recorded. Review the setup and retry.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAndExit = async () => {
    if (step === 'course') return saveCourse(true);
    if (step === 'fees') return saveFees(true);
    if (step === 'teacher') return saveTeacher(true);
    if (step === 'schedule' || step === 'review') return saveScheduleDraft(true);
  };

  const goBack = () => {
    if (step === 'course') return;
    setStep(previousStep(step));
  };

  const addSlot = () => {
    setSlots((current) => [
      ...current,
      { key: crypto.randomUUID(), weekday: 2, time: '18:00', durationMinutes: 35 },
    ]);
  };

  const updateSlot = (key: string, patch: Partial<ScheduleSlot>) => {
    setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));
  };

  const removeSlot = (key: string) => {
    setSlots((current) => current.filter((slot) => slot.key !== key));
  };

  const currentIndex = stepIndex(step);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admission Setup — {studentName}</DialogTitle>
          <DialogDescription>
            Complete the admission in order, or save and exit at any stage. The enrollment stays non-operational until final activation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2">
          {STEP_ORDER.map((item, index) => (
            <div key={item} className="min-w-0">
              <div className={`flex h-8 items-center justify-center rounded-md border text-xs font-medium ${
                item === step
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : index < currentIndex
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}>
                {index < currentIndex ? <Check className="mr-1 h-3.5 w-3.5" /> : null}
                {STEP_LABELS[item]}
              </div>
            </div>
          ))}
        </div>

        {loadingEnrollment ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading saved setup…</div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <div className="font-medium">{studentName}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {enrollmentId ? `Enrollment: ${enrollmentId}` : creationIntent === 'initial_course' ? 'First course admission' : 'Additional course admission'}
                {enrollment?.status ? ` · ${String(enrollment.status).replace(/_/g, ' ')}` : ''}
              </div>
            </div>

            {step === 'course' ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">1. Select course</h3>
                  <p className="text-sm text-muted-foreground">
                    This reserves the selected course. It does not create classes or expose the admission to teachers.
                  </p>
                </div>
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={Boolean(enrollmentId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={coursesLoading ? 'Loading courses…' : 'Select course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {courseLabel(course)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {enrollmentId ? (
                  <Badge variant="outline">Course reservation already saved</Badge>
                ) : null}
              </div>
            ) : null}

            {step === 'fees' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">2. Financial terms</h3>
                  <p className="text-sm text-muted-foreground">
                    These rates apply to future classes only. Historical session financial snapshots are not changed.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Parent fee per class (₹)</label>
                    <Input type="number" min={1} step={1} value={parentRate} onChange={(e) => setParentRate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Teacher pay per class (₹)</label>
                    <Input type="number" min={0} step={1} value={teacherRate} onChange={(e) => setTeacherRate(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 'teacher' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">3. Assign teacher</h3>
                  <p className="text-sm text-muted-foreground">
                    Teacher assignment is saved now, but the enrollment remains non-operational until setup is completed.
                  </p>
                </div>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .slice()
                      .sort((a, b) => teacherLabel(a).localeCompare(teacherLabel(b)))
                      .map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacherLabel(teacher)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {step === 'schedule' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">4. Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Saving this step stores a draft only. Classes are generated only after the final Review.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Enrollment start date</label>
                    <Input type="date" value={enrollmentStartDate} onChange={(e) => setEnrollmentStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Classes start date</label>
                    <Input type="date" value={classesStartDate} onChange={(e) => setClassesStartDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Microsoft Teams class link (optional)</label>
                  <Input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://teams.microsoft.com/..." />
                </div>
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div key={slot.key} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Select
                        value={String(slot.weekday)}
                        onValueChange={(value) => updateSlot(slot.key, { weekday: Number(value) })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {weekdayLabels.map((label, weekday) => (
                            <SelectItem key={label} value={String(weekday)}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="time" value={slot.time} onChange={(e) => updateSlot(slot.key, { time: e.target.value })} />
                      <Input
                        type="number"
                        min={10}
                        max={180}
                        value={slot.durationMinutes}
                        onChange={(e) => updateSlot(slot.key, { durationMinutes: Number(e.target.value) })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(slot.key)}
                        disabled={slots.length === 1}
                        aria-label="Remove slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={addSlot}>
                    <Plus className="mr-1 h-4 w-4" /> Add weekly slot
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 'review' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">5. Review and activate</h3>
                  <p className="text-sm text-muted-foreground">
                    Nothing becomes operational until you click Complete Setup.
                  </p>
                </div>
                <div className="divide-y rounded-lg border text-sm">
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Course</span><strong>{courseLabel(selectedCourse)}</strong></div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Parent fee</span><strong>₹{Number(parentRate || enrollment?.ratePerSession || 0)}/class</strong></div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Teacher pay</span><strong>₹{Number(teacherRate || enrollment?.teacherPayPerSession || 0)}/class</strong></div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Teacher</span><strong>{teacherLabel(selectedTeacher)}</strong></div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3">
                    <span className="text-muted-foreground">Schedule</span>
                    <div className="space-y-1">
                      {slots.map((slot) => (
                        <div key={slot.key}>{weekdayLabels[slot.weekday]} · {slot.time} · {slot.durationMinutes} min</div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Starts</span><strong>{classesStartDate}</strong></div>
                  <div className="grid grid-cols-[140px_1fr] gap-3 p-3"><span className="text-muted-foreground">Teams link</span><span className="break-all">{joinUrl || 'Not set'}</span></div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={goBack} disabled={saving || step === 'course'}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="button" variant="ghost" onClick={() => void saveAndExit()} disabled={saving || loadingEnrollment}>
              Save & Exit
            </Button>
          </div>
          <div>
            {step === 'course' ? (
              <Button onClick={() => void saveCourse(false)} disabled={saving || coursesLoading}>
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : step === 'fees' ? (
              <Button onClick={() => void saveFees(false)} disabled={saving}>
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : step === 'teacher' ? (
              <Button onClick={() => void saveTeacher(false)} disabled={saving}>
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : step === 'schedule' ? (
              <Button onClick={() => void saveScheduleDraft(false)} disabled={saving}>
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => void completeSetup()} disabled={saving}>
                {saving ? 'Activating…' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
