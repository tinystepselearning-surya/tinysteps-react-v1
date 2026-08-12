import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Layers3, ShieldCheck } from 'lucide-react';
import { Button } from '@components/ui/button';
import { db } from '../../../lib/firebaseConfig';
import { normalizeEnrollmentStatus } from '../../../lib/statuses';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import EnrollmentsList from '../EnrollmentManagement/EnrollmentsList';
import type { Student } from '../../../types/Student';

type ManagementView = 'students' | 'enrollments';

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

const resolveManagementView = (search: string): ManagementView => {
  const params = new URLSearchParams(search);
  return params.get('view') === 'enrollments' ? 'enrollments' : 'students';
};

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
};

const collectEnrollmentStudentIds = (enrollment: Record<string, unknown>): string[] => {
  const list = Array.isArray(enrollment.kidIds) ? enrollment.kidIds : [];
  const singles = [enrollment.kidId, enrollment.studentId, enrollment.childId];
  return Array.from(
    new Set(
      [...list, ...singles]
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

export default function StudentManagementTab() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = resolveManagementView(location.search);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<ReconciliationSummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

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
    let latestStudents: Array<Record<string, unknown>> | null = null;
    let latestEnrollments: Array<Record<string, unknown>> | null = null;

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
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        }));
        recompute();
      },
      (err) => handleSummaryError('students', err),
    );

    const unsubscribeEnrollments = onSnapshot(
      collection(db, 'enrollments'),
      (snapshot) => {
        latestEnrollments = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        }));
        recompute();
      },
      (err) => handleSummaryError('enrollments', err),
    );

    return () => {
      unsubscribeStudents();
      unsubscribeEnrollments();
    };
  }, []);

  const switchView = (nextView: ManagementView) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'students');
    if (nextView === 'enrollments') params.set('view', 'enrollments');
    else params.delete('view');
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

  const summaryCards = [
    { label: 'Total Students', value: summary.totalStudents },
    { label: 'Active Students', value: summary.activeStudents },
    { label: 'Active Enrolled', value: summary.activeEnrolledStudents },
    { label: 'Active Enrollments', value: summary.activeEnrollments },
    { label: 'Without Enrollment', value: summary.activeStudentsWithoutEnrollment },
    { label: 'Inactive / Archived', value: summary.inactiveStudents },
  ];

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

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {card.label}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {summaryLoading ? '…' : summaryError ? '—' : card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Lifecycle-safe changes preserve history: teacher reassignment updates eligible future classes only, while a course change completes the current enrollment and creates a linked next enrollment instead of rewriting past attendance or finance records.
          </span>
        </div>
      </div>

      {activeView === 'students' ? (
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

          {/* Edit Student Modal */}
          {selectedStudent && showEditForm && (
            <EditStudentForm
              student={selectedStudent}
              open={showEditForm}
              onClose={() => { setShowEditForm(false); setSelectedStudent(null); }}
              onUpdated={() => { setShowEditForm(false); setSelectedStudent(null); setRefreshKey(k => k + 1); }}
            />
          )}

          {/* Assign Course Modal */}
          {selectedStudent && showAssignCourseModal && (
            <AssignCourseModal
              student={selectedStudent}
              onClose={() => { setShowAssignCourseModal(false); setSelectedStudent(null); }}
              onAssigned={() => { setShowAssignCourseModal(false); setSelectedStudent(null); setRefreshKey(k => k + 1); }}
            />
          )}
          {loading && <div className="text-gray-500">Processing...</div>}
        </>
      ) : (
        <EnrollmentsList reloadKey={refreshKey} />
      )}
    </div>
  );
}
