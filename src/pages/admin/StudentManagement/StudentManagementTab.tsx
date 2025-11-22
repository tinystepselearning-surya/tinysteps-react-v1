import React, { useState } from 'react';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import { db } from '../../../lib/firebaseConfig';
import { deleteKid } from '../../../services/kidsService';
import type { Student } from '../../../types/Student';

export default function StudentManagementTab() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
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
