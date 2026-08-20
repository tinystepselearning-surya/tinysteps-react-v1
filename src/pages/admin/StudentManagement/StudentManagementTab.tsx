import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Layers3, ShieldCheck } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { db } from '../../../lib/firebaseConfig';
import { normalizeEnrollmentStatus } from '../../../lib/statuses';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import EnrollmentsList from '../EnrollmentManagement/EnrollmentsList';
import EnrollmentDetailView from '../EnrollmentManagement/EnrollmentDetailView';
import type { Student } from '../../../types/Student';

type ManagementView = 'students' | 'enrollments';
type SummaryFocus =
  | 'total-students'
  | 'active-students'
  | 'enrolled-students'
  | 'active-enrollments'
  | 'without-enrollment'
  | 'inactive-students';

type StudentRecord = Record<string, unknown> & { id: string };
type EnrollmentRecord = Record<string, unknown> & { id: string };

type ReconciliationSummary = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  activeEnrollments: number;
  activeEnrolledStudents: number;
  activeStudentsWithoutEnrollment: number;
};

const EMPTY_SUMMARY: ReconciliationSummary = {
  totalStudents: 0,
  activeStudents: 0,
  inactiveStudents: 0,
  activeEnrollments: 0,
  activeEnrolledStudents: 0,
  activeStudentsWithoutEnrollment: 0,
};

const PAST_ENROLLMENT_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'ended',
  'past',
]);

const SUMMARY_FOCUSES = new Set<SummaryFocus>([
  'total-students',
  'active-students',
  'enrolled-students',
  'active-enrollments',
  'without-enrollment',
  'inactive-students',
]);

const resolveManagementView = (search: string): ManagementView => {
  const params = new URLSearchParams(search);
  return params.get('view') === 'enrollments' ? 'enrollments' : 'students';
};

const resolveSummaryFocus = (search: string): SummaryFocus | null => {
  const params = new URLSearchParams(search);
  const raw = params.get('focus') as SummaryFocus | null;
  return raw && SUMMARY_FOCUSES.has(raw) ? raw : null;
};

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
};

const collectEnrollmentStudentIds = (enrollment: Record<string, unknown>): string[] => {
  const arrays = [
    enrollment.kidIds,
    enrollment.studentIds,
    enrollment.childIds,
    enrollment.childrenIds,
  ].filter(Array.isArray).flat() as unknown[];
  const singles = [enrollment.kidId, enrollment.studentId, enrollment.childId];
  return Array.from(
    new Set(
      [...arrays, ...singles]
        .map((value) => normalizeLookupId(value))
        .filter(Boolean),
    ),
  );
};

const isActiveCanonicalStudent = (student: Record<string, unknown>): boolean => {
  const status = String(student.status || '').trim().toLowerCase();
  return status === '' || status === 'active';
};

const isActiveLikeEnrollment = (enrollment: Record<string, unknown>): boolean => {
  const status = normalizeEnrollmentStatus(enrollment.status);
  if (
    enrollment.archived === true ||
    Boolean(enrollment.archivedAt) ||
    status === 'archived'
  ) {
    return false;
  }
  return !PAST_ENROLLMENT_STATUSES.has(status);
};

const getStudentDisplayName = (student: StudentRecord): string => {
  const value =
    student.fullName ||
    student.name ||
    student.displayName ||
    student.studentName ||
    student.id;
  return String(value || student.id).trim() || student.id;
};

const getStudentGrade = (student: StudentRecord): string =>
  String(student.grade || student.className || student.class || '').trim();

const getEnrollmentCourseLabel = (enrollment: EnrollmentRecord): string =>
  String(
    enrollment.courseName ||
    enrollment.courseTitle ||
    enrollment.courseId ||
    'Course details',
  ).trim();

const getEnrollmentTeacherLabel = (enrollment: EnrollmentRecord): string =>
  String(
    enrollment.teacherName ||
    enrollment.teacherDisplayName ||
    enrollment.teacherId ||
    'Not assigned',
  ).trim();

export default function StudentManagementTab() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = resolveManagementView(location.search);
  const activeSummaryFocus = resolveSummaryFocus(location.search);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<ReconciliationSummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [enrollmentRecords, setEnrollmentRecords] = useState<EnrollmentRecord[]>([]);
  const [focusSearch, setFocusSearch] = useState('');

  useEffect(() => {
    // One admin-authenticated read/write check on entry repairs any pre-existing
    // stale phonics config. Subsequent stale config writes are guarded server-side
    // by onCurriculumTopicsCanonicalize.
    const syncCanonicalPhonics = async () => {
      try {
        const functions = getFunctions(undefined, 'asia-south1');
        const sync = httpsCallable(functions, 'adminSyncCanonicalPhonicsCurriculum');
        await sync({});
      } catch (err) {
        // Do not block the management workspace if the sync endpoint is temporarily unavailable.
        // The server Firestore guard still canonicalizes future curriculum writes.
        if (import.meta.env.DEV) {
          console.warn('[StudentManagement] canonical phonics sync failed', err);
        }
      }
    };
    void syncCanonicalPhonics();
  }, []);

  useEffect(() => {
    setFocusSearch('');
  }, [activeSummaryFocus]);

  useEffect(() => {
    let latestStudents: StudentRecord[] | null = null;
    let latestEnrollments: EnrollmentRecord[] | null = null;

    const recompute = () => {
      if (!latestStudents || !latestEnrollments) return;

      const activeStudentIds = new Set(
        latestStudents
          .filter((student) => isActiveCanonicalStudent(student))
          .map((student) => String(student.id || '').trim())
          .filter(Boolean),
      );
      const activeEnrollments = latestEnrollments.filter((enrollment) => isActiveLikeEnrollment(enrollment));
      const activeEnrolledStudentIds = new Set<string>();

      activeEnrollments.forEach((enrollment) => {
        collectEnrollmentStudentIds(enrollment).forEach((studentId) => {
          if (activeStudentIds.has(studentId)) activeEnrolledStudentIds.add(studentId);
        });
      });

      setSummary({
        totalStudents: latestStudents.length,
        activeStudents: activeStudentIds.size,
        inactiveStudents: Math.max(0, latestStudents.length - activeStudentIds.size),
        activeEnrollments: activeEnrollments.length,
        activeEnrolledStudents: activeEnrolledStudentIds.size,
        activeStudentsWithoutEnrollment: Math.max(
          0,
          activeStudentIds.size - activeEnrolledStudentIds.size,
        ),
      });
      setSummaryLoading(false);
      setSummaryError(false);
    };

    const handleSummaryError = (source: 'students' | 'enrollments', err: unknown) => {
      console.error(`[StudentEnrollmentManagement] ${source} reconciliation stream failed`, err);
      setSummaryLoading(false);
      setSummaryError(true);
    };

    const unsubscribeStudents = onSnapshot(
      collection(db, 'kids'),
      (snapshot) => {
        latestStudents = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Record<string, unknown>),
          id: docSnap.id,
        }));
        setStudentRecords(latestStudents);
        recompute();
      },
      (err) => handleSummaryError('students', err),
    );

    const unsubscribeEnrollments = onSnapshot(
      collection(db, 'enrollments'),
      (snapshot) => {
        latestEnrollments = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Record<string, unknown>),
          id: docSnap.id,
        }));
        setEnrollmentRecords(latestEnrollments);
        recompute();
      },
      (err) => handleSummaryError('enrollments', err),
    );

    return () => {
      unsubscribeStudents();
      unsubscribeEnrollments();
    };
  }, []);

  const activeEnrollments = useMemo(
    () => enrollmentRecords.filter((enrollment) => isActiveLikeEnrollment(enrollment)),
    [enrollmentRecords],
  );

  const studentById = useMemo(() => {
    const map = new Map<string, StudentRecord>();
    studentRecords.forEach((student) => map.set(student.id, student));
    return map;
  }, [studentRecords]);

  const activeEnrollmentsByStudentId = useMemo(() => {
    const map = new Map<string, EnrollmentRecord[]>();
    activeEnrollments.forEach((enrollment) => {
      collectEnrollmentStudentIds(enrollment).forEach((studentId) => {
        const current = map.get(studentId) || [];
        current.push(enrollment);
        map.set(studentId, current);
      });
    });
    return map;
  }, [activeEnrollments]);

  const switchView = (nextView: ManagementView) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'students');
    params.delete('focus');
    if (nextView === 'enrollments') params.set('view', 'enrollments');
    else params.delete('view');
    navigate(`/surya?${params.toString()}`, { replace: true });
  };

  const focusSummary = (focus: SummaryFocus) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'students');
    params.set('focus', focus);
    if (focus === 'active-enrollments') params.set('view', 'enrollments');
    else params.delete('view');
    navigate(`/surya?${params.toString()}`, { replace: true });
  };

  const clearSummaryFocus = () => {
    const params = new URLSearchParams(location.search);
    params.delete('focus');
    navigate(`/surya?${params.toString()}`, { replace: true });
  };

  const handleStudentCreated = () => {
    setRefreshKey(k => k + 1);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditForm(true);
  };

  const handleAssignCourse = (student: Student) => {
    setSelectedStudent(student);
    setShowAssignCourseModal(true);
  };

  const handleArchiveStudent = async (studentId: string) => {
    if (!window.confirm(
      'Archive this student? Historical enrollments, schedules, attendance, payments, earnings and audit history will be preserved.'
    )) return;
    setLoading(true);
    setError('');
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const archiveKid = httpsCallable(functions, 'archiveKid');
      await archiveKid({
        kidId: studentId,
        reason: 'Archived from unified Students & Enrollments management',
      });
      setRefreshKey(k => k + 1);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Archive failed');
      } else {
        setError('Archive failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEnrollmentDetails = (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setDetailOpen(true);
  };

  const summaryCards: Array<{
    focus: SummaryFocus;
    label: string;
    value: number;
    description: string;
  }> = [
    {
      focus: 'total-students',
      label: 'Total Students',
      value: summary.totalStudents,
      description: 'All student profiles, including active and archived.',
    },
    {
      focus: 'active-students',
      label: 'Active Students',
      value: summary.activeStudents,
      description: 'Unique student profiles currently marked active.',
    },
    {
      focus: 'enrolled-students',
      label: 'Enrolled Students',
      value: summary.activeEnrolledStudents,
      description: 'Unique active students with at least one active enrollment.',
    },
    {
      focus: 'active-enrollments',
      label: 'Active Enrollments',
      value: summary.activeEnrollments,
      description: 'Active course registrations; one student can have more than one.',
    },
    {
      focus: 'without-enrollment',
      label: 'Without Enrollment',
      value: summary.activeStudentsWithoutEnrollment,
      description: 'Active students with no active enrollment; review and act.',
    },
    {
      focus: 'inactive-students',
      label: 'Inactive / Archived',
      value: summary.inactiveStudents,
      description: 'Profiles kept for history but not currently active.',
    },
  ];

  const focusedStudents = useMemo(() => {
    if (!activeSummaryFocus || activeSummaryFocus === 'active-enrollments') return [];

    return studentRecords
      .filter((student) => {
        const active = isActiveCanonicalStudent(student);
        const enrollmentCount = activeEnrollmentsByStudentId.get(student.id)?.length || 0;

        switch (activeSummaryFocus) {
          case 'total-students':
            return true;
          case 'active-students':
            return active;
          case 'enrolled-students':
            return active && enrollmentCount > 0;
          case 'without-enrollment':
            return active && enrollmentCount === 0;
          case 'inactive-students':
            return !active;
          default:
            return false;
        }
      })
      .sort((a, b) => getStudentDisplayName(a).localeCompare(getStudentDisplayName(b)));
  }, [activeSummaryFocus, studentRecords, activeEnrollmentsByStudentId]);

  const normalizedFocusSearch = focusSearch.trim().toLowerCase();

  const visibleFocusedStudents = useMemo(() => {
    if (!normalizedFocusSearch) return focusedStudents;
    return focusedStudents.filter((student) => {
      const linkedEnrollmentText = (activeEnrollmentsByStudentId.get(student.id) || [])
        .map((enrollment) => `${enrollment.id} ${getEnrollmentCourseLabel(enrollment)}`)
        .join(' ');
      const haystack = [
        getStudentDisplayName(student),
        student.id,
        getStudentGrade(student),
        linkedEnrollmentText,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedFocusSearch);
    });
  }, [focusedStudents, normalizedFocusSearch, activeEnrollmentsByStudentId]);

  const visibleActiveEnrollments = useMemo(() => {
    if (activeSummaryFocus !== 'active-enrollments') return [];
    const rows = [...activeEnrollments].sort((a, b) => a.id.localeCompare(b.id));
    if (!normalizedFocusSearch) return rows;

    return rows.filter((enrollment) => {
      const linkedStudents = collectEnrollmentStudentIds(enrollment)
        .map((studentId) => getStudentDisplayName(studentById.get(studentId) || ({ id: studentId } as StudentRecord)))
        .join(' ');
      const haystack = [
        enrollment.id,
        getEnrollmentCourseLabel(enrollment),
        getEnrollmentTeacherLabel(enrollment),
        linkedStudents,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedFocusSearch);
    });
  }, [activeSummaryFocus, activeEnrollments, normalizedFocusSearch, studentById]);

  const focusCopy: Record<Exclude<SummaryFocus, 'active-enrollments'>, { title: string; description: string }> = {
    'total-students': {
      title: 'All Student Profiles',
      description: 'Every student profile in the system. Use the actions to edit, enroll, review enrollments, or safely archive an active student.',
    },
    'active-students': {
      title: 'Active Students',
      description: 'Students currently marked active. Enrollment status is shown beside each student so gaps are immediately visible.',
    },
    'enrolled-students': {
      title: 'Enrolled Students',
      description: 'Unique active students who have at least one active enrollment. A student with multiple courses appears only once here.',
    },
    'without-enrollment': {
      title: 'Students Needing Enrollment Review',
      description: 'These active students have no active enrollment. Create an enrollment if classes should continue, or archive the student if they are no longer active. Historical records are preserved.',
    },
    'inactive-students': {
      title: 'Inactive / Archived Students',
      description: 'These profiles are not active for scheduling. They remain available for historical attendance, payment and audit records.',
    },
  };

  const renderFocusedStudentTable = () => {
    if (!activeSummaryFocus || activeSummaryFocus === 'active-enrollments') return null;
    const copy = focusCopy[activeSummaryFocus];

    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">{copy.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={focusSearch}
              onChange={(event) => setFocusSearch(event.target.value)}
              placeholder="Search student, grade, course..."
              className="h-9 w-64 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={clearSummaryFocus}>
              Back to full list
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
          Showing {visibleFocusedStudents.length} of {focusedStudents.length} matching student profiles.
        </div>

        <div className="max-h-[620px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active enrollments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleFocusedStudents.map((studentRecord) => {
                const student = studentRecord as unknown as Student;
                const active = isActiveCanonicalStudent(studentRecord);
                const linkedEnrollments = activeEnrollmentsByStudentId.get(studentRecord.id) || [];
                const grade = getStudentGrade(studentRecord);

                return (
                  <TableRow key={studentRecord.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{getStudentDisplayName(studentRecord)}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {grade ? `Grade ${grade}` : 'Grade not set'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? 'default' : 'secondary'}>
                        {active ? 'Active' : String(studentRecord.status || 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {linkedEnrollments.length === 0 ? (
                        <span className="font-medium text-amber-700">No active enrollment</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {linkedEnrollments.length} active
                          </Badge>
                          {linkedEnrollments.slice(0, 3).map((enrollment, index) => (
                            <Button
                              key={enrollment.id}
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => openEnrollmentDetails(enrollment.id)}
                            >
                              Manage {linkedEnrollments.length > 1 ? index + 1 : ''}
                            </Button>
                          ))}
                          {linkedEnrollments.length > 3 && (
                            <span className="text-xs text-slate-500">+{linkedEnrollments.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {active && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAssignCourse(student)}
                          >
                            {linkedEnrollments.length === 0 ? 'Create enrollment' : 'Add enrollment'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStudent(student)}
                        >
                          Edit profile
                        </Button>
                        {active && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={loading}
                            onClick={() => void handleArchiveStudent(studentRecord.id)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {visibleFocusedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    No matching students in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderFocusedEnrollmentTable = () => {
    if (activeSummaryFocus !== 'active-enrollments') return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Active Enrollment Records</div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Each row is one active course registration. The same student can appear more than once when they are legitimately enrolled in multiple courses.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={focusSearch}
              onChange={(event) => setFocusSearch(event.target.value)}
              placeholder="Search student, course, teacher..."
              className="h-9 w-64 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={clearSummaryFocus}>
              Back to enrollments
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
          Showing {visibleActiveEnrollments.length} of {activeEnrollments.length} active enrollment records.
        </div>

        <div className="max-h-[620px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleActiveEnrollments.map((enrollment) => {
                const linkedStudentIds = collectEnrollmentStudentIds(enrollment);
                const linkedStudentNames = linkedStudentIds.map((studentId) =>
                  getStudentDisplayName(studentById.get(studentId) || ({ id: studentId } as StudentRecord)),
                );

                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {linkedStudentNames.length ? linkedStudentNames.join(', ') : 'Student link needs review'}
                      </div>
                    </TableCell>
                    <TableCell>{getEnrollmentCourseLabel(enrollment)}</TableCell>
                    <TableCell>{getEnrollmentTeacherLabel(enrollment)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-500">{enrollment.id}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openEnrollmentDetails(enrollment.id)}
                      >
                        Manage enrollment
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {visibleActiveEnrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No matching active enrollments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Students & Enrollments</div>
            <div className="mt-0.5 text-xs text-slate-500">
              One workspace for student profiles, course enrollments, teacher assignment and scheduling.
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <Button
              type="button"
              size="sm"
              variant={activeView === 'students' ? 'default' : 'ghost'}
              className="h-8 gap-2 px-3 text-xs"
              onClick={() => switchView('students')}
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Students
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeView === 'enrollments' ? 'default' : 'ghost'}
              className="h-8 gap-2 px-3 text-xs"
              onClick={() => switchView('enrollments')}
            >
              <Layers3 className="h-4 w-4" aria-hidden="true" />
              Enrollments
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
          <span className="font-semibold">How to read these numbers:</span>{' '}
          student counts are unique profiles; enrollment counts are course-registration records. One student can have more than one active enrollment.
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => {
            const selected = activeSummaryFocus === card.focus;
            return (
              <button
                key={card.label}
                type="button"
                aria-pressed={selected}
                onClick={() => focusSummary(card.focus)}
                className={[
                  'min-h-[108px] rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  selected
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-sm',
                ].join(' ')}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                  {summaryLoading ? '…' : summaryError ? '—' : card.value}
                </div>
                <div className="mt-1 text-[11px] leading-4 text-slate-500">
                  {card.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Lifecycle-safe changes preserve history: teacher reassignment updates eligible future classes only, while a course change completes the current enrollment and creates a linked next enrollment instead of rewriting past attendance or finance records.
          </span>
        </div>
      </div>

      {activeSummaryFocus ? (
        activeSummaryFocus === 'active-enrollments'
          ? renderFocusedEnrollmentTable()
          : renderFocusedStudentTable()
      ) : activeView === 'students' ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Directory counters below are filter-scoped; the reconciliation totals above are canonical and remain live across lifecycle changes.
            </p>
            <CreateStudentForm onStudentCreated={handleStudentCreated} />
          </div>

          {error && <div className="mb-2 text-red-500">{error}</div>}

          <StudentList
            key={refreshKey}
            onEdit={handleEditStudent}
            onDelete={handleArchiveStudent}
            onAssignCourse={handleAssignCourse}
          />

          {loading && <div className="text-gray-500">Processing...</div>}
        </>
      ) : (
        <EnrollmentsList reloadKey={refreshKey} />
      )}

      {error && activeSummaryFocus && <div className="text-sm text-red-500">{error}</div>}
      {loading && activeSummaryFocus && <div className="text-sm text-slate-500">Processing...</div>}

      {selectedStudent && showEditForm && (
        <EditStudentForm
          student={selectedStudent}
          open={showEditForm}
          onClose={() => { setShowEditForm(false); setSelectedStudent(null); }}
          onUpdated={() => { setShowEditForm(false); setSelectedStudent(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {selectedStudent && showAssignCourseModal && (
        <AssignCourseModal
          student={selectedStudent}
          onClose={() => { setShowAssignCourseModal(false); setSelectedStudent(null); }}
          onAssigned={() => { setShowAssignCourseModal(false); setSelectedStudent(null); setRefreshKey(k => k + 1); }}
        />
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedEnrollmentId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Enrollment Details & Management</DialogTitle>
          </DialogHeader>
          {selectedEnrollmentId && (
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <EnrollmentDetailView
                enrollmentId={selectedEnrollmentId}
                onClose={() => {
                  setDetailOpen(false);
                  setSelectedEnrollmentId(null);
                  setRefreshKey(k => k + 1);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
