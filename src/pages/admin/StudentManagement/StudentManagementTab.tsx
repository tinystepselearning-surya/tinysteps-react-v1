import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import { deleteKid } from '../../../services/kidsService';
import type { Student } from '../../../types/Student';

export default function StudentManagementTab() {
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
        // Do not block Student Management if the sync endpoint is temporarily unavailable.
        // The server Firestore guard still canonicalizes future curriculum writes.
        if (import.meta.env.DEV) {
          console.warn('[StudentManagement] canonical phonics sync failed', err);
        }
      }
    };
    void syncCanonicalPhonics();
  }, []);

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

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await deleteKid(studentId);
      setRefreshKey(k => k + 1);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Delete failed');
      } else {
        setError('Delete failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <CreateStudentForm onStudentCreated={handleStudentCreated} />
      </div>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <StudentList
        key={refreshKey}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
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
    </div>
  );
}
