import { useState } from "react";
import CurriculumEditorModal from "./CurriculumEditorModal";
import { useToast } from "../ui/ToastProvider";

export type Topic = {
  id: string;
  course?: string;
  phase?: string;
  title: string;
  status: string;
  completedDate?: string;
  teacherNote?: string;
};

export default function CurriculumList({ initial, onUpdateTopic }: { initial: Topic[]; onUpdateTopic: (topicId: string, payload: any) => Promise<void> }) {
  const [curriculum, setCurriculum] = useState<Topic[]>(initial);
  const [editing, setEditing] = useState<Topic | null>(null);
  const { showToast } = useToast();

  const handleSave = async (payload: any) => {
    if (!editing) return;
    const prev = curriculum.slice();
    // optimistic update
    setCurriculum((c) => c.map((t) => (t.id === editing.id ? { ...t, ...payload } : t)));

    try {
      await onUpdateTopic(editing.id, payload);
      showToast({ message: "Topic updated", type: "success" });
    } catch (err) {
      console.error(err);
      setCurriculum(prev); // rollback
      showToast({ message: "Failed to update topic", type: "error" });
    } finally {
      setEditing(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phase</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Completed</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {curriculum.map((topic) => (
              <tr key={topic.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{topic.course || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{topic.phase || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{topic.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${topic.status === 'completed' ? 'bg-green-100 text-green-800' : topic.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {topic.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{topic.completedDate ? new Date(topic.completedDate).toLocaleDateString() : "-"}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-blue-600 underline" onClick={() => setEditing(topic)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <CurriculumEditorModal open={!!editing} topic={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}
