import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { useAdmin } from '../hooks/adminContext';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { createAuditLog } from '../../../services/adminService';
import { useToast } from '../../../components/ToastContext';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function AssignCourseToStudentModal({ open, onClose, studentId }: { open: boolean; onClose: () => void; studentId: string | null }) {
  const { assignCourseToStudent } = useAdmin();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { users } = useAdmin();
  const student = users.find(u => u.uid === studentId);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Load only active courses sorted by sortOrder, falling back to title
        const q = query(
          collection(db, 'courses'),
          where('active', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => {
          const data = d.data() as any;
          return { id: d.id, name: data.title || data.name || d.id };
        });
        setCourses(list);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, []);

  const handleAssign = async () => {
    if (!studentId || !selectedCourse) return;
    setLoading(true);
    try {
      await assignCourseToStudent(studentId, selectedCourse);
      // Audit: map to audit log schema (actor = current user)
      try {
        await createAuditLog({
          userId: user?.uid || '',
          userName: user?.displayName || '',
          userRole: (user?.uid ? 'admin' : 'admin') as any,
          action: ('assign_course_student' as any),
          entityType: 'student',
          entityId: studentId || '',
          details: JSON.stringify({ courseId: selectedCourse })
        });
      } catch (e) {
        console.warn('Failed to write audit log for assign course', e);
      }
      onClose();
      showToast({ type: 'success', message: `Assigned course to ${student?.displayName || 'student'}` });
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err?.message || 'Failed to assign course' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Course to ${student?.displayName || 'Student'}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Select Course</label>
          <select value={selectedCourse ?? ''} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option value="">-- Select --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button disabled={!selectedCourse || loading} onClick={handleAssign} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg flex items-center gap-2">{loading ? 'Assigning...' : (<><ClipboardDocumentListIcon className="h-4 w-4"/>Assign</>)}</button>
        </div>
      </div>
    </Modal>
  );
}
