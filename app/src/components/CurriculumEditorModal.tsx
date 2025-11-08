import { useState } from "react";

interface Props {
  topic: {
    id: string;
    title: string;
    status: string;
    teacherNote?: string;
    completedDate?: string;
  };
  open: boolean;
  onClose: () => void;
  onSave: (payload: { status?: string; teacherNote?: string; completedDate?: string }) => Promise<void>;
}

export default function CurriculumEditorModal({ topic, open, onClose, onSave }: Props) {
  const [status, setStatus] = useState(topic.status || "not_started");
  const [note, setNote] = useState(topic.teacherNote || "");
  const [completedDate, setCompletedDate] = useState(topic.completedDate ? topic.completedDate.split("T")[0] : "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Edit Topic: {topic.title}</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border px-3 py-2 rounded">
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Teacher note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border px-3 py-2 rounded" rows={4} />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Completed date</label>
            <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={async () => {
            setSaving(true);
            try {
              await onSave({ status, teacherNote: note, completedDate: completedDate || undefined });
              onClose();
            } catch (err) {
              console.error(err);
            } finally {
              setSaving(false);
            }
          }} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
