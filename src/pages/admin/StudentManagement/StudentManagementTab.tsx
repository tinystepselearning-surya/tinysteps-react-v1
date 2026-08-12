import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Layers3, ShieldCheck } from 'lucide-react';
import { Button } from '@components/ui/button';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import EnrollmentsList from '../EnrollmentManagement/EnrollmentsList';
import type { Student } from '../../../types/Student';

type ManagementView = 'students' | 'enrollments';

const resolveManagementView = (search: string): ManagementView => {
  const params = new URLSearchParams(search);
  return params.get('view') === 'enrollments' ? 'enrollments' : 'students';
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

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Lifecycle-safe changes preserve history: teacher reassignment updates eligible future classes only, while a course change completes the current enrollment and creates a linked next enrollment instead of rewriting past attendance or finance records.
          </span>
        </div>
      </div>

      {activeView === 'students' ? (
        <>
          <div className="flex items-center justify-end">
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
