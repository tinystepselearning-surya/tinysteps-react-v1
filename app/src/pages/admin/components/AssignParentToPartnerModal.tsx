import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { useAdmin } from '../hooks/adminContext';
import type { User } from '../../../types/admin';
import { createAuditLog } from '../../../services/adminService';
import { useToast } from '../../../components/ToastContext';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function AssignParentToPartnerModal({ open, onClose, parentId }: { open: boolean; onClose: () => void; parentId: string | null }) {
  const { users, assignParentToPartner } = useAdmin();
  const [partners, setPartners] = useState<User[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const parent = users.find(u => u.uid === parentId);

  useEffect(() => {
    setPartners(users.filter(u => u.role === 'learning-partner'));
  }, [users]);

  const handleAssign = async () => {
    if (!parentId || !selectedPartner) return;
    setLoading(true);
    try {
      await assignParentToPartner(parentId, selectedPartner);
      await createAuditLog({ userId: selectedPartner, userName: '', userRole: 'learning-partner', action: 'assignment_created', entityType: 'user', entityId: parentId, details: `Assigned parent ${parentId} to learning partner ${selectedPartner}` });
      onClose();
      showToast({ type: 'success', message: `Assigned ${parent?.displayName || 'parent'} to selected Learning Partner` });
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err?.message || 'Failed to assign parent' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${parent?.displayName || 'Parent'} to Learning Partner`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Select Learning Partner</label>
          <select value={selectedPartner ?? ''} onChange={(e) => setSelectedPartner(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option value="">-- Select --</option>
            {partners.map(p => (
              <option key={p.uid} value={p.uid}>{p.displayName} ({p.email})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button disabled={!selectedPartner || loading} onClick={handleAssign} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg flex items-center gap-2">{loading ? 'Assigning...' : (<><UserGroupIcon className="h-4 w-4"/>Assign</>)}</button>
        </div>
      </div>
    </Modal>
  );
}
