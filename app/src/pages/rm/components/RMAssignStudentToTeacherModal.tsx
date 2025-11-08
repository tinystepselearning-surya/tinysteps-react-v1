import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { useAuth } from '../../../contexts/AuthContext';
import { useRM } from '../../../hooks/useRM';
import { assignStudentToTeacher } from '../../../services/firestoreAdmin';
import { createAuditLog } from '../../../services/adminService';
import { getRMTeachers } from '../../../services/rmService';
import { useToast } from '../../../components/ToastContext';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import type { Teacher } from '../../../types/admin';

interface RMAssignStudentToTeacherModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName?: string;
}

export default function RMAssignStudentToTeacherModal({
  open,
  onClose,
  studentId,
  studentName
}: RMAssignStudentToTeacherModalProps) {
  const { user } = useAuth();
  const { rm } = useRM(user?.uid || null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Get teachers assigned to this RM
  useEffect(() => {
    const fetchTeachers = async () => {
      if (open && rm?.id) {
        try {
          const rmTeachers = await getRMTeachers(rm.id);
          // Convert to the format expected by the component
          const formattedTeachers: Teacher[] = rmTeachers.map(t => ({
            uid: t.id,
            email: t.email,
            username: t.email.split('@')[0], // Generate username from email
            usernameLower: t.email.split('@')[0].toLowerCase(),
            displayName: t.displayName,
            role: 'teacher',
            status: t.status === 'active' ? 'active' : 'suspended',
            createdAt: t.createdAt.toDate().toISOString(),
            students: [], // Will be populated from assignments
            subjects: t.specialization || []
          }));
          setTeachers(formattedTeachers);
        } catch (error) {
          console.error('Error fetching RM teachers:', error);
          showToast({ type: 'error', message: 'Failed to load teachers' });
        }
      }
    };

    fetchTeachers();
  }, [open, rm?.id, showToast]);

  const handleAssign = async () => {
    if (!studentId || !selectedTeacher || !user || !rm) return;

    setLoading(true);
    try {
      await assignStudentToTeacher(studentId, selectedTeacher);

      // Audit log
      const selectedTeacherData = teachers.find(t => t.uid === selectedTeacher);
      await createAuditLog({
        userId: user.uid,
        userName: rm.displayName,
        userRole: 'learning-partner',
        action: 'assignment_created',
        entityType: 'user',
        entityId: studentId,
        details: `RM assigned student ${studentId} (${studentName || 'Unknown'}) to teacher ${selectedTeacher} (${selectedTeacherData?.displayName || 'Unknown'})`
      });

      onClose();
      showToast({ type: 'success', message: 'Student assigned to teacher successfully' });
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err?.message || 'Failed to assign student to teacher' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${studentName || 'Student'} to Teacher`}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> As a Learning Partner, you can only assign students to teachers within your assigned cohort.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
          <select
            value={selectedTeacher ?? ''}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={teachers.length === 0}
          >
            <option value="">
              {teachers.length === 0 ? 'Loading teachers...' : '-- Select Teacher --'}
            </option>
            {teachers.map(t => (
              <option key={t.uid} value={t.uid}>
                {t.displayName} ({t.email})
              </option>
            ))}
          </select>
          {teachers.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              No teachers assigned to your cohort yet.
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!selectedTeacher || loading || teachers.length === 0}
            onClick={handleAssign}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Assigning...' : (
              <>
                <UserPlusIcon className="h-4 w-4" />
                Assign Student
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}