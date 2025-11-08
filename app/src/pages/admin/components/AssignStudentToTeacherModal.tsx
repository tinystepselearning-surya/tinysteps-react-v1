import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { useAdmin } from '../hooks/adminContext';
import type { User } from '../../../types/admin';
// No direct Firestore reads here; users are provided by AdminProvider
import { createAuditLog } from '../../../services/adminService';
import { useToast } from '../../../components/ToastContext';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function AssignStudentToTeacherModal({ open, onClose, studentId }: { open: boolean; onClose: () => void; studentId: string | null }) {
  const { users, assignStudentToTeacher } = useAdmin();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const student = users.find(u => u.uid === studentId);

  useEffect(() => {
    setTeachers(users.filter(u => u.role === 'teacher'));
  }, [users]);

  const handleAssign = async () => {
    if (!studentId || !selectedTeacher) return;
    setLoading(true);
    try {
      await assignStudentToTeacher(studentId, selectedTeacher);
      // Audit log
      await createAuditLog({ userId: selectedTeacher, userName: '', userRole: 'teacher', action: 'assignment_created', entityType: 'user', entityId: studentId, details: `Assigned student ${studentId} to teacher ${selectedTeacher}` });
      onClose();
      showToast({ type: 'success', message: `Assigned ${student?.displayName || 'student'} to selected teacher` });
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err?.message || 'Failed to assign student' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${student?.displayName || 'Student'} to Teacher`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Select Teacher</label>
          <select value={selectedTeacher ?? ''} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option value="">-- Select --</option>
            {teachers.map(t => (
              <option key={t.uid} value={t.uid}>{t.displayName} ({t.email})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button disabled={!selectedTeacher || loading} onClick={handleAssign} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg flex items-center gap-2">{loading ? 'Assigning...' : (<><UserPlusIcon className="h-4 w-4"/>Assign</>)}</button>
        </div>
      </div>
    </Modal>
  );
}
