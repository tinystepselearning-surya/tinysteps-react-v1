import React from "react";
import useParentChildren from "../../hooks/useParentChildren";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { User } from "../../types/models";

const ChildrenPage: React.FC = () => {
  const { children, loading } = useParentChildren();
  const [teachers, setTeachers] = useState<Record<string, User>>({});

  useEffect(() => {
    async function fetchTeachers() {
      const teacherIds = Array.from(new Set(children.map(c => c.assignedTeacherId)));
      const teacherMap: Record<string, User> = {};
      await Promise.all(teacherIds.map(async (tid) => {
        if (!tid) return;
        const docRef = doc(db, "users", tid);
        const snap = await getDoc(docRef);
        if (snap.exists()) teacherMap[tid] = { uid: tid, ...snap.data() } as User;
      }));
      setTeachers(teacherMap);
    }
    if (children.length) fetchTeachers();
  }, [children]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading children…</div>;

  if (!children.length) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">My Children</h1>
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <p className="text-lg text-gray-700 mb-2">No Children Enrolled</p>
          <p className="text-gray-500">You have not enrolled any children yet. Please contact support for help.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">My Children</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {children.map((child) => (
          <div key={child.sid} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-purple-700">{child.name}</span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Active</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Assigned Teacher:</span> {teachers[child.assignedTeacherId]?.displayName || "-"}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Enrolled Courses:</span> Phonics, Grammar, Speaking
            </div>
            <Link to={`/parent/child/${child.sid}/progress`} className="mt-2 inline-block bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-700 transition">View Progress</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildrenPage;
